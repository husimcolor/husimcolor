import { afterEach, describe, expect, it, vi } from "vitest";
import { DECEMBER_REPORT_OFFERS, assertDecemberReportPrice, getDecemberReportOfferByCoupon, isDecemberReportEventActive } from "../shared/december-report-event";
import { assertDecemberAccount, assertDecemberCouponContext, decemberOfferState, releaseAbandonedDecemberReservations, assertDecemberUserLimit, resolveDecemberCheckoutCoupon } from "../server/commerce/december-report-event-service";
import { previewCoupon } from "../server/commerce/coupon-service";
import { calculateDiscountedAmount } from "../shared/commerce";
import { MySqlDialect } from "drizzle-orm/mysql-core";

const now = new Date("2026-12-05T00:00:00+09:00");
afterEach(() => vi.restoreAllMocks());
describe("December report event policy (offline only)", () => {
  it.each([
    ["2026-11-30T23:59:59.999+09:00", false], ["2026-12-01T00:00:00+09:00", true],
    ["2026-12-31T23:59:59.999+09:00", true], ["2027-01-01T00:00:00+09:00", false],
  ])("enforces inclusive start and exclusive end: %s", (time, active) => expect(isDecemberReportEventActive(new Date(time))).toBe(active));
  it.each(DECEMBER_REPORT_OFFERS)("computes exact server discount for $productCode", offer => {
    expect(calculateDiscountedAmount(offer)).toMatchObject({ finalAmountKrw: offer.finalAmountKrw });
    expect(() => assertDecemberReportPrice(offer.productCode, offer.listAmountKrw)).not.toThrow();
    expect(() => assertDecemberReportPrice(offer.productCode, offer.listAmountKrw + 1)).toThrow("COUPON_DECEMBER_PRICE_CHANGED");
  });
  it("maps normalized codes and rejects unknown code aliases", () => {
    expect(getDecemberReportOfferByCoupon(" dec2026-personal ")?.productCode).toBe("personal_deep");
    expect(getDecemberReportOfferByCoupon("DEC2026-UNKNOWN")).toBeUndefined();
  });
  it("requires the canonical account; email cannot authorize known-code preview", async () => {
    expect(() => assertDecemberAccount(null)).toThrow("COUPON_USER_REQUIRED");
    expect(() => assertDecemberAccount(-1)).toThrow("COUPON_USER_REQUIRED");
    await expect(previewCoupon({ couponCode: "DEC2026-PERSONAL", productCode: "personal_deep", listAmountKrw: 1, email: "owner@example.test" })).rejects.toThrow("COUPON_USER_REQUIRED");
  });
  it("blocks wrong product and out-of-window explicit coupon", () => {
    expect(() => assertDecemberCouponContext({ couponCode: "DEC2026-PERSONAL", productCode: "couple_love_deep", userId: 4, now })).toThrow("COUPON_PRODUCT_NOT_ELIGIBLE");
    expect(() => assertDecemberCouponContext({ couponCode: "DEC2026-PERSONAL", productCode: "personal_deep", userId: 4, now: new Date("2027-01-01T00:00:00+09:00") })).toThrow("COUPON_NOT_IN_VALID_PERIOD");
  });
  it("does not touch grants or prices for full-price guests and unrelated products", async () => {
    const tx = { select: vi.fn(() => { throw new Error("must not query"); }) };
    expect(await resolveDecemberCheckoutCoupon(tx, { productCode: "personal_deep", email: "guest@example.test", now })).toBeUndefined();
    expect(await resolveDecemberCheckoutCoupon(tx, { productCode: "telephone_coaching", email: "guest@example.test", now, couponCode: "OTHER" })).toBe("OTHER");
    expect(tx.select).not.toHaveBeenCalled();
  });
  it("auto applies a grant, forbids stacking, and requires authenticated checkout email", async () => {
    const tx = { select: () => { let count = 0; const q: any = { from: () => q, innerJoin: () => { count++; return q; }, where: () => q, limit: async () => count ? [] : [{ id: 1 }] }; return q; } };
    const input = { productCode: "personal_deep", userId: 8, email: "owner@example.test", authenticatedEmail: "OWNER@example.test", now };
    expect(await resolveDecemberCheckoutCoupon(tx, input)).toBe("DEC2026-PERSONAL");
    await expect(resolveDecemberCheckoutCoupon(tx, { ...input, couponCode: "OTHER" })).rejects.toThrow("COUPON_STACKING_NOT_ALLOWED");
    await expect(resolveDecemberCheckoutCoupon(tx, { ...input, email: "alternate@example.test" })).rejects.toThrow("COUPON_AUTH_EMAIL_REQUIRED");
  });
  it.each([
    [false, [], "available"], [true, [], "issued"],
    [true, [{ state: "reserved", transactionStatus: "ready", orderStatus: "pending", expiresAt: new Date(now.getTime() + 1) }], "reserved"],
    [true, [{ state: "reserved", transactionStatus: "ready", orderStatus: "pending", expiresAt: new Date(now.getTime() - 1) }], "issued"],
    [true, [{ state: "reserved", transactionStatus: "processing", orderStatus: "pending", expiresAt: new Date(now.getTime() - 1) }], "reserved"],
    [true, [{ state: "released", transactionStatus: "failed", orderStatus: "failed", expiresAt: now }], "issued"],
    [true, [{ state: "consumed", transactionStatus: "approved", orderStatus: "paid", expiresAt: now }], "used"],
  ] as const)("reports safe grant state %s -> %s", (issued, redemptions, expected) => expect(decemberOfferState({ issued, now, redemptions: [...redemptions] })).toBe(expected));
  it("expires unused grants at end but preserves consumed audit state", () => {
    const end = new Date("2027-01-01T00:00:00+09:00");
    expect(decemberOfferState({ issued: true, now: end, redemptions: [] })).toBe("expired");
    expect(decemberOfferState({ issued: true, now: end, redemptions: [{ state: "consumed", transactionStatus: "approved", orderStatus: "paid", expiresAt: now }] })).toBe("used");
  });
  it("abandoned release SQL cannot release processing/approved payments", async () => {
    const execute = vi.fn().mockResolvedValue([[], []]);
    await releaseAbandonedDecemberReservations({ execute }, 1, 8, now);
    const query = new MySqlDialect().sqlToQuery(execute.mock.calls[0][0]);
    expect(query.sql).toContain("p.status IN ('ready','failed','cancelled')");
    expect(query.sql).toContain("o.expiresAt <=");
    expect(query.params).toContain(8);
  });
  it("user limits use locking current reads for concurrent reservation", async () => {
    const execute = vi.fn().mockResolvedValue([[{ id: 3 }], []]);
    await expect(assertDecemberUserLimit({ execute }, 1, 8, now, true)).rejects.toThrow("COUPON_CUSTOMER_LIMIT_REACHED");
    const query = new MySqlDialect().sqlToQuery(execute.mock.calls[0][0]);
    expect(query.sql).toContain("FOR UPDATE"); expect(query.sql).toContain("p.status IN ('processing','approved','refunded')");
  });
});
