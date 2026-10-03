import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";

import { couponProductRules, couponRedemptions, coupons, customers, products } from "../../drizzle/schema";
import { calculateDiscountedAmount } from "../../shared/commerce";
import { getDb } from "../db";
import { hashCommerceEmail, normalizeCommerceEmail } from "./crypto";

type CouponTransaction = any;

export type CouponQuote = {
  couponId: number;
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  discountAmountKrw: number;
  finalAmountKrw: number;
};

export function normalizeCouponCode(value: string): string {
  return value.trim().toUpperCase();
}

function asCount(value: unknown): number {
  return Number(value ?? 0);
}

/** Public campaign coupons have no owner. A customer-bound coupon is never valid
 * in a guest preflight without its resolved common-customer ID. */
export function assertCouponCustomerEligibility(input: {
  assignedCustomerId: number | null;
  customerId?: number;
}): void {
  if (input.assignedCustomerId === null) return;
  if (!input.customerId || input.customerId <= 0) {
    throw new Error("COUPON_CUSTOMER_CONTEXT_REQUIRED");
  }
  if (input.assignedCustomerId !== input.customerId) {
    throw new Error("COUPON_ASSIGNED_TO_ANOTHER_CUSTOMER");
  }
}

async function loadCouponQuote(
  tx: CouponTransaction,
  input: { couponCode: string; productId: number; customerId?: number; listAmountKrw: number; now?: Date; lock?: boolean },
): Promise<CouponQuote> {
  const now = input.now ?? new Date();
  const code = normalizeCouponCode(input.couponCode);
  if (!code) throw new Error("COUPON_CODE_REQUIRED");

  const rows = await tx.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const coupon = rows[0];
  if (!coupon || coupon.status !== "active") throw new Error("COUPON_NOT_ACTIVE");
  if (coupon.startsAt.getTime() > now.getTime() || (coupon.endsAt && coupon.endsAt.getTime() <= now.getTime())) {
    throw new Error("COUPON_NOT_IN_VALID_PERIOD");
  }
  assertCouponCustomerEligibility({ assignedCustomerId: coupon.assignedCustomerId, customerId: input.customerId });
  if (input.listAmountKrw < coupon.minOrderAmountKrw) throw new Error("COUPON_MINIMUM_ORDER_NOT_MET");

  if (input.lock) {
    // 같은 쿠폰의 동시 예약은 쿠폰 행 잠금 안에서 횟수를 다시 검사한다.
    await tx.execute(sql`SELECT id FROM coupons WHERE id = ${coupon.id} FOR UPDATE`);
  }

  const rules = await tx
    .select({ productId: couponProductRules.productId })
    .from(couponProductRules)
    .where(eq(couponProductRules.couponId, coupon.id));
  if (rules.length > 0 && !rules.some((rule: { productId: number }) => rule.productId === input.productId)) {
    throw new Error("COUPON_PRODUCT_NOT_ELIGIBLE");
  }

  const activeState = or(eq(couponRedemptions.state, "reserved"), eq(couponRedemptions.state, "consumed"));
  if (coupon.maxRedemptions !== null) {
    const total = await tx
      .select({ count: sql<number>`count(*)` })
      .from(couponRedemptions)
      .where(and(eq(couponRedemptions.couponId, coupon.id), activeState));
    if (asCount(total[0]?.count) >= coupon.maxRedemptions) throw new Error("COUPON_REDEMPTION_LIMIT_REACHED");
  }
  if (coupon.maxPerCustomer !== null && input.customerId) {
    const customer = await tx
      .select({ count: sql<number>`count(*)` })
      .from(couponRedemptions)
      .where(and(
        eq(couponRedemptions.couponId, coupon.id),
        eq(couponRedemptions.customerId, input.customerId),
        activeState,
      ));
    if (asCount(customer[0]?.count) >= coupon.maxPerCustomer) {
      throw new Error("COUPON_CUSTOMER_LIMIT_REACHED");
    }
  }

  const totals = calculateDiscountedAmount({
    listAmountKrw: input.listAmountKrw,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  });
  return {
    couponId: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    ...totals,
  };
}

export async function previewCoupon(input: {
  couponCode: string;
  productCode: string;
  listAmountKrw: number;
  customerId?: number;
  email?: string;
}): Promise<CouponQuote> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const productRows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.code, input.productCode), eq(products.active, true)))
    .limit(1);
  if (!productRows[0]) throw new Error("COUPON_PRODUCT_NOT_FOUND");

  // Email preflight is lookup-only: it never creates a customer and it cannot
  // reserve a redemption. It simply lets the designated recipient see the
  // same quote that checkout will later re-validate inside its transaction.
  let customerId = input.customerId;
  if (!customerId && input.email?.trim()) {
    const existingCustomer = await db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.emailHash, hashCommerceEmail(normalizeCommerceEmail(input.email))))
      .limit(1);
    customerId = existingCustomer[0]?.id;
  }
  // 공개 쿠폰의 비회원 사전 확인은 고객별 제한을 소진하지 않는다.
  // 지정 고객 쿠폰은 입력 이메일과 기존 common-customer 원장이 맞을 때만
  // 견적을 보여 주며, 실제 주문 생성 시 고객 ID로 다시 검증한다.
  return loadCouponQuote(db as any, {
    couponCode: input.couponCode,
    productId: productRows[0].id,
    customerId,
    listAmountKrw: input.listAmountKrw,
  });
}

export async function reserveCouponForOrder(
  tx: CouponTransaction,
  input: {
    couponCode: string;
    productId: number;
    customerId: number;
    userId?: number | null;
    orderId: number;
    listAmountKrw: number;
  },
): Promise<CouponQuote> {
  const quote = await loadCouponQuote(tx, { ...input, lock: true });
  await tx.insert(couponRedemptions).values({
    couponId: quote.couponId,
    orderId: input.orderId,
    customerId: input.customerId,
    userId: input.userId ?? null,
    state: "reserved",
  });
  return quote;
}

export async function consumeCouponReservation(tx: CouponTransaction, orderId: number): Promise<void> {
  await tx
    .update(couponRedemptions)
    .set({ state: "consumed", consumedAt: new Date() })
    .where(and(eq(couponRedemptions.orderId, orderId), eq(couponRedemptions.state, "reserved")));
}

export async function releaseCouponReservation(tx: CouponTransaction, orderId: number): Promise<void> {
  await tx
    .update(couponRedemptions)
    .set({ state: "released", releasedAt: new Date() })
    .where(and(eq(couponRedemptions.orderId, orderId), eq(couponRedemptions.state, "reserved")));
}
