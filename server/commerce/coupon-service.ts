import { and, eq, or, sql } from "drizzle-orm";
import { couponProductRules, couponRedemptions, coupons, customers, products } from "../../drizzle/schema";
import { calculateDiscountedAmount, getCommerceProduct } from "../../shared/commerce";
import { DECEMBER_REPORT_ENDS_AT, DECEMBER_REPORT_STARTS_AT, getDecemberReportOfferByCoupon } from "../../shared/december-report-event";
import { getDb } from "../db";
import { hashCommerceEmail, normalizeCommerceEmail } from "./crypto";
import { assertDecemberGrant, assertDecemberUserLimit, loadDecemberServerPrice, releaseAbandonedDecemberReservations, rowsFromDecemberExecute } from "./december-report-event-service";

type CouponTransaction = any;
export type CouponQuote = { couponId: number; code: string; discountType: "fixed" | "percent"; discountValue: number; discountAmountKrw: number; finalAmountKrw: number };
export function normalizeCouponCode(value: string): string { return value.trim().toUpperCase(); }
function asCount(value: unknown): number { return Number(value ?? 0); }
export function assertCouponCustomerEligibility(input: { assignedCustomerId: number | null; customerId?: number }): void {
  if (input.assignedCustomerId === null) return;
  if (!input.customerId || input.customerId <= 0) throw new Error("COUPON_CUSTOMER_CONTEXT_REQUIRED");
  if (input.assignedCustomerId !== input.customerId) throw new Error("COUPON_ASSIGNED_TO_ANOTHER_CUSTOMER");
}

async function loadCouponQuote(tx: CouponTransaction, input: { couponCode: string; productId: number; customerId?: number; userId?: number | null; listAmountKrw: number; now?: Date; lock?: boolean }): Promise<CouponQuote> {
  const code = normalizeCouponCode(input.couponCode);
  if (!code) throw new Error("COUPON_CODE_REQUIRED");
  const eventOffer = getDecemberReportOfferByCoupon(code);
  if (code.startsWith("DEC2026-") && !eventOffer) throw new Error("COUPON_DECEMBER_NOT_FOUND");
  const productRows = await tx.select({ code: products.code }).from(products).where(eq(products.id, input.productId)).limit(1);
  const productCode = productRows[0]?.code ?? "";
  const product = getCommerceProduct(productCode);
  if (product && "couponEligible" in product && product.couponEligible === false) throw new Error("COUPON_PRODUCT_NOT_ELIGIBLE");
  let rows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  let coupon = rows[0];
  if (input.lock && coupon) {
    // Locking read, not a consistent snapshot: concurrent reservations see the latest limits.
    rows = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT * FROM coupons WHERE id = ${coupon.id} FOR UPDATE`));
    coupon = rows[0];
  }
  const now = input.now ?? new Date();
  if (!coupon || coupon.status !== "active") throw new Error("COUPON_NOT_ACTIVE");
  const startsAt = new Date(coupon.startsAt), endsAt = coupon.endsAt ? new Date(coupon.endsAt) : null;
  if (startsAt.getTime() > now.getTime() || (endsAt && endsAt.getTime() <= now.getTime())) throw new Error("COUPON_NOT_IN_VALID_PERIOD");
  assertCouponCustomerEligibility({ assignedCustomerId: coupon.assignedCustomerId, customerId: input.customerId });
  let listAmountKrw = input.listAmountKrw;
  if (eventOffer) {
    if (coupon.assignedCustomerId != null || coupon.discountType !== eventOffer.discountType || Number(coupon.discountValue) !== eventOffer.discountValue || Number(coupon.maxPerCustomer) !== 1 || startsAt.getTime() !== DECEMBER_REPORT_STARTS_AT.getTime() || endsAt?.getTime() !== DECEMBER_REPORT_ENDS_AT.getTime()) throw new Error("COUPON_DECEMBER_CONFIGURATION_INVALID");
    await assertDecemberGrant(tx, { couponId: coupon.id, couponCode: code, productCode, userId: input.userId, now, lock: input.lock });
    listAmountKrw = await loadDecemberServerPrice(tx, input.productId, productCode, now);
    if (input.lock) await releaseAbandonedDecemberReservations(tx, coupon.id, input.userId!, now);
    await assertDecemberUserLimit(tx, coupon.id, input.userId!, now, Boolean(input.lock));
  }
  if (listAmountKrw < coupon.minOrderAmountKrw) throw new Error("COUPON_MINIMUM_ORDER_NOT_MET");
  const rules = await tx.select({ productId: couponProductRules.productId }).from(couponProductRules).where(eq(couponProductRules.couponId, coupon.id));
  if (eventOffer && (rules.length !== 1 || rules[0].productId !== input.productId)) throw new Error("COUPON_DECEMBER_CONFIGURATION_INVALID");
  if (rules.length > 0 && !rules.some((rule: { productId: number }) => rule.productId === input.productId)) throw new Error("COUPON_PRODUCT_NOT_ELIGIBLE");
  const activeState = or(eq(couponRedemptions.state, "reserved"), eq(couponRedemptions.state, "consumed"));
  if (coupon.maxRedemptions !== null) {
    const total = input.lock
      ? rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT id FROM coupon_redemptions WHERE couponId = ${coupon.id} AND state IN ('reserved','consumed') FOR UPDATE`)).length
      : asCount((await tx.select({ count: sql<number>`count(*)` }).from(couponRedemptions).where(and(eq(couponRedemptions.couponId, coupon.id), activeState)))[0]?.count);
    if (total >= coupon.maxRedemptions) throw new Error("COUPON_REDEMPTION_LIMIT_REACHED");
  }
  if ((!eventOffer || input.lock) && coupon.maxPerCustomer !== null && input.customerId) {
    const total = input.lock
      ? rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT id FROM coupon_redemptions WHERE couponId = ${coupon.id} AND customerId = ${input.customerId} AND state IN ('reserved','consumed') FOR UPDATE`)).length
      : asCount((await tx.select({ count: sql<number>`count(*)` }).from(couponRedemptions).where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.customerId, input.customerId), activeState)))[0]?.count);
    if (total >= coupon.maxPerCustomer) throw new Error("COUPON_CUSTOMER_LIMIT_REACHED");
  }
  const totals = calculateDiscountedAmount({ listAmountKrw, discountType: coupon.discountType, discountValue: coupon.discountValue });
  return { couponId: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, ...totals };
}

export async function previewCoupon(input: { couponCode: string; productCode: string; listAmountKrw: number; customerId?: number; email?: string; userId?: number | null }): Promise<CouponQuote> {
  // Known event codes are never authorized by a caller-supplied email.
  const offer = getDecemberReportOfferByCoupon(input.couponCode);
  if (offer && !input.userId) throw new Error("COUPON_USER_REQUIRED");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const productRows = await db.select({ id: products.id }).from(products).where(and(eq(products.code, input.productCode), eq(products.active, true))).limit(1);
  if (!productRows[0]) throw new Error("COUPON_PRODUCT_NOT_FOUND");
  let customerId = input.customerId;
  if (!offer && !customerId && input.email?.trim()) {
    const existingCustomer = await db.select({ id: customers.id }).from(customers).where(eq(customers.emailHash, hashCommerceEmail(normalizeCommerceEmail(input.email)))).limit(1);
    customerId = existingCustomer[0]?.id;
  }
  return loadCouponQuote(db as any, { couponCode: input.couponCode, productId: productRows[0].id, customerId, userId: input.userId, listAmountKrw: input.listAmountKrw });
}

export async function reserveCouponForOrder(tx: CouponTransaction, input: { couponCode: string; productId: number; customerId: number; userId?: number | null; orderId: number; listAmountKrw: number }): Promise<CouponQuote> {
  const quote = await loadCouponQuote(tx, { ...input, lock: true });
  await tx.insert(couponRedemptions).values({ couponId: quote.couponId, orderId: input.orderId, customerId: input.customerId, userId: input.userId ?? null, state: "reserved" });
  return quote;
}
export async function consumeCouponReservation(tx: CouponTransaction, orderId: number): Promise<void> {
  await tx.update(couponRedemptions).set({ state: "consumed", consumedAt: new Date() }).where(and(eq(couponRedemptions.orderId, orderId), eq(couponRedemptions.state, "reserved")));
}
export async function releaseCouponReservation(tx: CouponTransaction, orderId: number): Promise<void> {
  await tx.update(couponRedemptions).set({ state: "released", releasedAt: new Date() }).where(and(eq(couponRedemptions.orderId, orderId), eq(couponRedemptions.state, "reserved")));
}
