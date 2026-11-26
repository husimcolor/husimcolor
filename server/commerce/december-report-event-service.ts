import { and, eq, inArray, sql } from "drizzle-orm";
import { couponRedemptions, coupons, decemberReportCouponGrants, orders, paymentTransactions } from "../../drizzle/schema";
import { getDb } from "../db";
import { normalizeCommerceEmail } from "./crypto";
import {
  DECEMBER_REPORT_EVENT_KEY, DECEMBER_REPORT_OFFERS, DECEMBER_REPORT_STARTS_AT, DECEMBER_REPORT_ENDS_AT,
  getDecemberReportOffer, getDecemberReportOfferByCoupon, isDecemberReportEventActive, assertDecemberReportPrice,
  type DecemberReportStatus, type DecemberReportOfferState,
} from "../../shared/december-report-event";

export function rowsFromDecemberExecute<T>(result: unknown): T[] {
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] as T[] : result as T[];
}

export function assertDecemberAccount(userId?: number | null): asserts userId is number {
  if (!userId || !Number.isSafeInteger(userId) || userId <= 0) throw new Error("COUPON_USER_REQUIRED");
}

export function assertDecemberCouponContext(input: { couponCode: string; productCode: string; userId?: number | null; now: Date }): void {
  const offer = getDecemberReportOfferByCoupon(input.couponCode);
  if (!offer) throw new Error("COUPON_DECEMBER_NOT_FOUND");
  assertDecemberAccount(input.userId);
  if (offer.productCode !== input.productCode) throw new Error("COUPON_PRODUCT_NOT_ELIGIBLE");
  if (!isDecemberReportEventActive(input.now)) throw new Error("COUPON_NOT_IN_VALID_PERIOD");
}

export function decemberOfferState(input: { issued: boolean; now: Date; redemptions: Array<{ state: string; expiresAt: Date; orderStatus: string; transactionStatus: string }> }): DecemberReportOfferState {
  if (input.redemptions.some((row) => row.state === "consumed" || row.transactionStatus === "approved" || row.orderStatus === "paid" || row.orderStatus === "refunded")) return "used";
  if (input.now.getTime() >= DECEMBER_REPORT_ENDS_AT.getTime()) return "expired";
  if (input.redemptions.some((row) => row.state === "reserved" && (row.transactionStatus === "processing" || (row.transactionStatus === "ready" && row.expiresAt.getTime() > input.now.getTime())))) return "reserved";
  return input.issued ? "issued" : "available";
}

export async function getDecemberReportStatus(userId?: number | null): Promise<DecemberReportStatus> {
  const now = new Date();
  const states = new Map<string, DecemberReportOfferState>();
  if (userId) {
    const db = await getDb();
    if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
    const grants = await db.select().from(decemberReportCouponGrants).where(and(eq(decemberReportCouponGrants.eventKey, DECEMBER_REPORT_EVENT_KEY), eq(decemberReportCouponGrants.userId, userId)));
    const redemptions = await db.select({ code: coupons.code, state: couponRedemptions.state, expiresAt: orders.expiresAt, orderStatus: orders.status, transactionStatus: paymentTransactions.status })
      .from(couponRedemptions).innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId)).innerJoin(orders, eq(orders.id, couponRedemptions.orderId))
      .innerJoin(paymentTransactions, eq(paymentTransactions.orderId, orders.id)).where(and(eq(couponRedemptions.userId, userId), inArray(coupons.code, DECEMBER_REPORT_OFFERS.map((offer) => offer.couponCode))));
    for (const offer of DECEMBER_REPORT_OFFERS) states.set(offer.productCode, decemberOfferState({ issued: grants.some((grant) => grant.productCode === offer.productCode), now, redemptions: redemptions.filter((row) => row.code === offer.couponCode) }));
  }
  return {
    active: isDecemberReportEventActive(now), serverNow: now, startsAt: new Date(DECEMBER_REPORT_STARTS_AT), endsAt: new Date(DECEMBER_REPORT_ENDS_AT),
    offers: DECEMBER_REPORT_OFFERS.map((offer) => ({ ...offer, state: states.get(offer.productCode) ?? (now.getTime() >= DECEMBER_REPORT_ENDS_AT.getTime() ? "expired" : "available") })),
  };
}

/** No customer lookup, account linking, emails, or payment calls. */
export async function claimDecemberReportCoupons(userId: number): Promise<DecemberReportStatus> {
  assertDecemberAccount(userId);
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await (db as any).transaction(async (tx: any) => {
    for (const offer of DECEMBER_REPORT_OFFERS) {
      const now = new Date();
      assertDecemberCouponContext({ couponCode: offer.couponCode, productCode: offer.productCode, userId, now });
      // Locking read also prevents stale repeatable-read snapshots after a concurrent claim.
      const rows = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT * FROM coupons WHERE code = ${offer.couponCode} FOR UPDATE`));
      const coupon = rows[0];
      if (!coupon || coupon.status !== "active" || coupon.assignedCustomerId != null || coupon.discountType !== offer.discountType || Number(coupon.discountValue) !== offer.discountValue || Number(coupon.maxPerCustomer) !== 1 || new Date(coupon.startsAt).getTime() !== DECEMBER_REPORT_STARTS_AT.getTime() || new Date(coupon.endsAt).getTime() !== DECEMBER_REPORT_ENDS_AT.getTime()) throw new Error("COUPON_DECEMBER_CONFIGURATION_INVALID");
      await tx.insert(decemberReportCouponGrants).values({ eventKey: DECEMBER_REPORT_EVENT_KEY, userId, productCode: offer.productCode, couponId: coupon.id }).onDuplicateKeyUpdate({ set: { eventKey: DECEMBER_REPORT_EVENT_KEY } });
    }
  });
  return getDecemberReportStatus(userId);
}

export async function assertDecemberGrant(tx: any, input: { couponId: number; couponCode: string; productCode: string; userId?: number | null; now: Date; lock?: boolean }): Promise<void> {
  assertDecemberCouponContext(input);
  const grants = input.lock
    ? rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT id FROM december_report_coupon_grants WHERE eventKey = ${DECEMBER_REPORT_EVENT_KEY} AND userId = ${input.userId!} AND productCode = ${input.productCode} AND couponId = ${input.couponId} FOR UPDATE`))
    : await tx.select({ id: decemberReportCouponGrants.id }).from(decemberReportCouponGrants).where(and(eq(decemberReportCouponGrants.eventKey, DECEMBER_REPORT_EVENT_KEY), eq(decemberReportCouponGrants.userId, input.userId!), eq(decemberReportCouponGrants.productCode, input.productCode), eq(decemberReportCouponGrants.couponId, input.couponId))).limit(1);
  if (!grants[0]) throw new Error("COUPON_DECEMBER_NOT_ISSUED");
}

/** Caller holds coupon row lock. A committed processing flag precedes every external event confirmation. */
export async function releaseAbandonedDecemberReservations(tx: any, couponId: number, userId: number, now: Date): Promise<void> {
  await tx.execute(sql`UPDATE coupon_redemptions r INNER JOIN orders o ON o.id = r.orderId INNER JOIN payment_transactions p ON p.orderId = o.id SET r.state = 'released', r.releasedAt = ${now} WHERE r.couponId = ${couponId} AND r.userId = ${userId} AND r.state = 'reserved' AND o.status IN ('pending','expired','failed','cancelled') AND p.status IN ('ready','failed','cancelled') AND o.expiresAt <= ${now}`);
}

export async function assertDecemberUserLimit(tx: any, couponId: number, userId: number, now: Date = new Date(), lock = false): Promise<void> {
  const query = sql`SELECT r.id FROM coupon_redemptions r INNER JOIN orders o ON o.id = r.orderId INNER JOIN payment_transactions p ON p.orderId = o.id WHERE r.couponId = ${couponId} AND r.userId = ${userId} AND (r.state = 'consumed' OR (r.state = 'reserved' AND (o.status IN ('paid','refunded','processing') OR p.status IN ('processing','approved','refunded') OR o.expiresAt > ${now})))`;
  const rows = rowsFromDecemberExecute<any>(await tx.execute(lock ? sql`${query} FOR UPDATE` : query));
  if (rows.length) throw new Error("COUPON_CUSTOMER_LIMIT_REACHED");
}

export async function resolveDecemberCheckoutCoupon(tx: any, input: { productCode: string; couponCode?: string; userId?: number; authenticatedEmail?: string | null; email: string; now: Date }): Promise<string | undefined> {
  const requested = input.couponCode?.trim().toUpperCase();
  const explicit = requested && getDecemberReportOfferByCoupon(requested);
  if (requested?.startsWith("DEC2026-") && !explicit) throw new Error("COUPON_DECEMBER_NOT_FOUND");
  if (explicit) assertDecemberCouponContext({ ...input, couponCode: requested! });
  const offer = getDecemberReportOffer(input.productCode);
  let issued = false;
  if (offer && input.userId && isDecemberReportEventActive(input.now)) {
    const grants = await tx.select({ id: decemberReportCouponGrants.id }).from(decemberReportCouponGrants).where(and(eq(decemberReportCouponGrants.eventKey, DECEMBER_REPORT_EVENT_KEY), eq(decemberReportCouponGrants.userId, input.userId), eq(decemberReportCouponGrants.productCode, input.productCode))).limit(1);
    issued = Boolean(grants[0]);
    // Used coupons must not prevent a regular-price repeat purchase or another valid manual coupon.
    if (issued && !explicit) {
      const used = await tx.select({ id: couponRedemptions.id }).from(couponRedemptions).innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId)).where(and(eq(coupons.code, offer.couponCode), eq(couponRedemptions.userId, input.userId), eq(couponRedemptions.state, "consumed"))).limit(1);
      if (used[0]) issued = false;
    }
  }
  if (!explicit && !issued) return requested;
  if (requested && requested !== offer?.couponCode) throw new Error("COUPON_STACKING_NOT_ALLOWED");
  if (!input.authenticatedEmail || normalizeCommerceEmail(input.authenticatedEmail) !== normalizeCommerceEmail(input.email)) throw new Error("COUPON_AUTH_EMAIL_REQUIRED");
  return offer!.couponCode;
}

/** Validate price from an active server DB row, never from preview input. */
export async function loadDecemberServerPrice(tx: any, productId: number, productCode: string, now: Date): Promise<number> {
  const rows = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT amountKrw, regularAmountKrw FROM product_prices WHERE productId = ${productId} AND active = 1 AND validFrom <= ${now} AND (validTo IS NULL OR validTo > ${now})`));
  if (rows.length !== 1) throw new Error("COUPON_DECEMBER_PRICE_CHANGED");
  assertDecemberReportPrice(productCode, Number(rows[0].amountKrw));
  assertDecemberReportPrice(productCode, Number(rows[0].regularAmountKrw || rows[0].amountKrw));
  return Number(rows[0].amountKrw);
}

/** Commit processing BEFORE contacting Toss; expiry/error is thrown only AFTER transaction commits. */
export async function prepareDecemberTossApproval(provider: "toss_pg" | "toss_live", input: { orderNumber: string; paymentKey: string; amountKrw: number }): Promise<false | "confirm" | "recover"> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const outcome = await (db as any).transaction(async (tx: any) => {
    const refs = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT c.id, c.code FROM payment_transactions p INNER JOIN orders o ON o.id = p.orderId LEFT JOIN coupon_redemptions r ON r.orderId = o.id LEFT JOIN coupons c ON c.id = r.couponId WHERE p.provider = ${provider} AND o.orderNumber = ${input.orderNumber}`));
    if (!refs[0]) throw new Error("TOSS_ORDER_NOT_FOUND");
    if (!getDecemberReportOfferByCoupon(refs[0].code ?? "")) return { event: false };
    await tx.execute(sql`SELECT id FROM coupons WHERE id = ${refs[0].id} FOR UPDATE`);
    const rows = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT p.id, p.status, p.providerPaymentId, o.id AS orderId, o.status AS orderStatus, o.expiresAt, o.finalAmountKrw, r.state FROM payment_transactions p INNER JOIN orders o ON o.id = p.orderId INNER JOIN coupon_redemptions r ON r.orderId = o.id WHERE p.provider = ${provider} AND o.orderNumber = ${input.orderNumber} FOR UPDATE`));
    const row = rows[0];
    if (Number(row.finalAmountKrw) !== input.amountKrw) throw new Error("ORDER_AMOUNT_MISMATCH");
    if (row.status === "approved") {
      if (row.providerPaymentId !== input.paymentKey) throw new Error("TOSS_PAYMENT_ID_CONFLICT");
      return { event: true, recover: true };
    }
    if (row.status === "processing") {
      if (row.providerPaymentId !== input.paymentKey) throw new Error("TOSS_PAYMENT_ID_CONFLICT");
      return { event: true, recover: true }; // Only provider readback; never re-confirm after expiry.
    }
    if (row.status !== "ready" || row.state !== "reserved" || row.orderStatus !== "pending") throw new Error("TOSS_ORDER_ALREADY_TERMINAL");
    const now = new Date();
    if (new Date(row.expiresAt).getTime() <= now.getTime() || !isDecemberReportEventActive(now)) {
      await tx.update(orders).set({ status: "expired" }).where(eq(orders.id, row.orderId));
      await tx.update(couponRedemptions).set({ state: "released", releasedAt: now }).where(and(eq(couponRedemptions.orderId, row.orderId), eq(couponRedemptions.state, "reserved")));
      return { event: true, expired: true };
    }
    await tx.update(paymentTransactions).set({ status: "processing", providerPaymentId: input.paymentKey }).where(and(eq(paymentTransactions.id, row.id), eq(paymentTransactions.status, "ready")));
    return { event: true };
  });
  if (outcome.expired) throw new Error("TOSS_ORDER_EXPIRED");
  return outcome.event ? (outcome.recover ? "recover" : "confirm") : false;
}

/** Readback after a failed live re-confirm; unresolved payment never releases its hold. */
export async function reconcileDecemberTerminalFailure(provider: "toss_pg" | "toss_live", orderNumber: string, outcome: "failed" | "cancelled"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const refs = rowsFromDecemberExecute<any>(await (db as any).execute(sql`SELECT c.id AS couponId, c.code, p.id, p.status, p.providerPaymentId, o.id AS orderId, o.finalAmountKrw FROM payment_transactions p INNER JOIN orders o ON o.id = p.orderId INNER JOIN coupon_redemptions r ON r.orderId = o.id INNER JOIN coupons c ON c.id = r.couponId WHERE p.provider = ${provider} AND o.orderNumber = ${orderNumber}`));
  const ref = refs[0];
  if (!ref || !getDecemberReportOfferByCoupon(ref.code) || ref.status !== "processing") return;
  const secret = process.env[provider === "toss_live" ? "TOSS_LIVE_SECRET_KEY" : "TOSS_TEST_SECRET_KEY"]?.trim();
  if (!secret?.startsWith(provider === "toss_live" ? "live_sk_" : "test_sk_")) throw new Error("TOSS_PAYMENT_PROCESSING");
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(ref.providerPaymentId)}`, { headers: { Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}` } });
  const payload = await response.json().catch(() => null);
  // Unknown/not-yet-approved states remain held. Browser failure input is never payment proof.
  if (!response.ok || payload?.paymentKey !== ref.providerPaymentId || payload.orderId !== orderNumber || payload.totalAmount !== Number(ref.finalAmountKrw) || !["CANCELED", "ABORTED", "EXPIRED"].includes(payload.status)) throw new Error("TOSS_PAYMENT_PROCESSING");
  await (db as any).transaction(async (tx: any) => {
    await tx.execute(sql`SELECT id FROM coupons WHERE id = ${ref.couponId} FOR UPDATE`);
    const latest = rowsFromDecemberExecute<any>(await tx.execute(sql`SELECT status, providerPaymentId FROM payment_transactions WHERE id = ${ref.id} FOR UPDATE`))[0];
    if (latest?.status !== "processing" || latest.providerPaymentId !== ref.providerPaymentId) return;
    const now = new Date();
    await tx.update(paymentTransactions).set({ status: outcome, providerPaymentId: `toss-${provider === "toss_live" ? "live" : "test"}-${outcome}-${orderNumber}`.slice(0, 160), cancelledAt: now }).where(eq(paymentTransactions.id, ref.id));
    await tx.update(orders).set({ status: outcome, cancelledAt: now }).where(eq(orders.id, ref.orderId));
    await tx.update(couponRedemptions).set({ state: "released", releasedAt: now }).where(and(eq(couponRedemptions.orderId, ref.orderId), eq(couponRedemptions.state, "reserved")));
  });
}

export async function recoverDecemberLiveApproval(input: { orderNumber: string; paymentKey: string; amountKrw: number }) {
  const key = process.env.TOSS_LIVE_SECRET_KEY?.trim();
  if (!key?.startsWith("live_sk_")) throw new Error("TOSS_LIVE_SECRET_KEY_NOT_CONFIGURED");
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(input.paymentKey)}`, { headers: { Authorization: `Basic ${Buffer.from(`${key}:`).toString("base64")}` } });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.status !== "DONE" || payload.orderId !== input.orderNumber || payload.paymentKey !== input.paymentKey || payload.totalAmount !== input.amountKrw) throw new Error("TOSS_LIVE_RECOVERY_NOT_APPROVED");
  return { paymentKey: payload.paymentKey as string, orderNumber: payload.orderId as string, amountKrw: payload.totalAmount as number, method: (payload.method ?? null) as string | null, rawPayload: JSON.stringify(payload) };
}
