import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import {
  getTelephoneCoachingDetails,
  normalizeTelephoneCoachingBookingRequest,
  resolveTelephoneCoachingCheckoutOffer,
  TELEPHONE_COACHING_DURATION_MINUTES,
  TELEPHONE_COACHING_SLOT_MINUTES,
} from "../server/commerce/telephone-coaching-service";
import { encryptPendingCoachingBookingRequest, decryptPendingCoachingBookingRequest, getCoachingBookingPersistence } from "../server/commerce/order-service";
import { telephoneCoachingConfirmationHtml } from "../server/commerce/email-outbox-service";
import { decryptCommerceValue } from "../server/commerce/crypto";
import {
  TELEPHONE_EVENT_OFFER_CODE,
  TELEPHONE_EVENT_NAME,
  TELEPHONE_CONNECTION_NOTICE,
  TELEPHONE_CONDUCT_NOTICE,
  TELEPHONE_CONDUCT_REFUND_NOTICE,
} from "../shared/telephoneCoachingEvent";

const during = new Date("2026-12-01T00:00:00+09:00");
const start = new Date("2026-12-02T20:00:00+09:00");
const offer = (overrides: Record<string, unknown> = {}) => ({
  productCode: "telephone_coaching", offerCode: TELEPHONE_EVENT_OFFER_CODE,
  requestedWindowStart: start, now: during, ...overrides,
});
const booking = (overrides: Record<string, unknown> = {}) => ({
  contactName: "모킹 검증", contactPhone: "010-0000-0000", sessionMode: "telephone" as const,
  requestedWindowStart: start.toISOString(), requestedWindowEnd: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
  adultConfirmed: true, ...overrides,
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("December telephone event: no live writes or payments", () => {
  it("leaves every non-event request and permanent product unchanged", () => {
    expect(resolveTelephoneCoachingCheckoutOffer({ productCode: "telephone_coaching", now: during })).toBeNull();
    expect(resolveTelephoneCoachingCheckoutOffer({ productCode: "personal_coaching", now: during })).toBeNull();
    expect(TELEPHONE_COACHING_DURATION_MINUTES).toBe(50);
    expect(TELEPHONE_COACHING_SLOT_MINUTES).toBe(60);
    const regular = normalizeTelephoneCoachingBookingRequest(booking(), during);
    expect(regular).not.toHaveProperty("offerCode");
    expect(getTelephoneCoachingDetails(regular)).not.toHaveProperty("durationMinutes");
  });
  it("returns the explicit 35,000 won/40-minute offer with a 15,000 won discount", () => {
    expect(resolveTelephoneCoachingCheckoutOffer(offer())).toEqual({
      offerCode: TELEPHONE_EVENT_OFFER_CODE, name: TELEPHONE_EVENT_NAME,
      regularAmountKrw: 50_000, finalAmountKrw: 35_000, discountAmountKrw: 15_000, durationMinutes: 40,
    });
  });
  it("allows November 23 advance payment for a December 5 consultation", () => {
    expect(resolveTelephoneCoachingCheckoutOffer(offer({ now: new Date("2026-11-23T10:00:00+09:00"), requestedWindowStart: new Date("2026-12-05T14:00:00+09:00") }))?.finalAmountKrw).toBe(35_000);
  });
  it.each(["2026-12-31T00:00:00+09:00"])("rejects checkout after the KST event at %s", now => {
    expect(() => resolveTelephoneCoachingCheckoutOffer(offer({ now: new Date(now) }))).toThrow("TELEPHONE_EVENT_NOT_ACTIVE");
  });
  it.each(["2026-12-01T00:00:00+09:00", "2026-12-30T23:59:59.999+09:00"])("accepts the KST period boundary %s", now => {
    expect(resolveTelephoneCoachingCheckoutOffer(offer({ now: new Date(now) }))?.finalAmountKrw).toBe(35_000);
  });
  it.each(["2026-11-30T20:00:00+09:00", "2026-12-31T10:00:00+09:00"])("rejects an out-of-period consultation %s", date => {
    expect(() => resolveTelephoneCoachingCheckoutOffer(offer({ requestedWindowStart: new Date(date) }))).toThrow("TELEPHONE_EVENT_DATE_OUT_OF_RANGE");
  });
  it("rejects wrong products, forged offer identifiers and stacked coupons", () => {
    expect(() => resolveTelephoneCoachingCheckoutOffer(offer({ productCode: "personal_coaching" }))).toThrow("TELEPHONE_EVENT_INVALID_OFFER");
    expect(() => resolveTelephoneCoachingCheckoutOffer(offer({ offerCode: "forged_offer" }))).toThrow("TELEPHONE_EVENT_INVALID_OFFER");
    expect(() => resolveTelephoneCoachingCheckoutOffer(offer({ couponCode: "another-discount" }))).toThrow("TELEPHONE_EVENT_COUPON_NOT_ALLOWED");
  });
  it("keeps the 60-minute schedule hold and optional birth fields for the 40-minute event", () => {
    const normalized = normalizeTelephoneCoachingBookingRequest(booking({ offerCode: TELEPHONE_EVENT_OFFER_CODE, fiveElementsOptIn: true }), during);
    expect(normalized.requestedWindowEnd.getTime() - normalized.requestedWindowStart.getTime()).toBe(60 * 60 * 1000);
    expect(getTelephoneCoachingDetails(normalized)).toMatchObject({ offerCode: TELEPHONE_EVENT_OFFER_CODE, durationMinutes: 40, birthDate: null });
    expect(() => normalizeTelephoneCoachingBookingRequest(booking({ offerCode: TELEPHONE_EVENT_OFFER_CODE, requestedWindowEnd: "2026-12-02T20:40:00+09:00" }), during)).toThrow("TELEPHONE_COACHING_REQUIRES_60_MINUTE_SLOT");
  });
  it("preserves the offer through encrypted pending data without rewriting legacy records", () => {
    vi.useFakeTimers(); vi.setSystemTime(during);
    vi.stubEnv("COMMERCE_EMAIL_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
    const normalized = normalizeTelephoneCoachingBookingRequest(booking({ offerCode: TELEPHONE_EVENT_OFFER_CODE }), during);
    const encrypted = encryptPendingCoachingBookingRequest(normalized);
    const recovered = decryptPendingCoachingBookingRequest(encrypted);
    expect(recovered).toMatchObject({ offerCode: TELEPHONE_EVENT_OFFER_CODE, sessionMode: "telephone" });
    expect(JSON.parse(decryptCommerceValue(getCoachingBookingPersistence(recovered).detailsEncrypted!))).toMatchObject({ offerCode: TELEPHONE_EVENT_OFFER_CODE, durationMinutes: 40 });
    const regular = normalizeTelephoneCoachingBookingRequest(booking(), during);
    expect(decryptPendingCoachingBookingRequest(encryptPendingCoachingBookingRequest(regular))).not.toHaveProperty("offerCode");
  });
  it("uses approved order snapshot details in the confirmation email", () => {
    const html = telephoneCoachingConfirmationHtml({ scheduledAt: start, scheduledEndAt: null, productName: TELEPHONE_EVENT_NAME, finalAmountKrw: 35_000 });
    expect(html).toContain(TELEPHONE_EVENT_NAME); expect(html).toContain("40분"); expect(html).toContain("35,000원");
    expect(html).toContain(TELEPHONE_CONNECTION_NOTICE); expect(html).toContain(TELEPHONE_CONDUCT_NOTICE); expect(html).toContain(TELEPHONE_CONDUCT_REFUND_NOTICE);
    expect(html).not.toContain("전화드립니다");
    const regular = telephoneCoachingConfirmationHtml({ scheduledAt: start, scheduledEndAt: null, productName: "비대면 전화 코칭", finalAmountKrw: 50_000 });
    expect(regular).toContain("50분"); expect(regular).toContain("50,000원");
  });
  it("sets the offer price only at creation and preserves approval amount checks", () => {
    const source = readFileSync(new URL("../server/commerce/order-service.ts", import.meta.url).pathname, "utf8");
    expect(source.indexOf("const telephoneOffer = resolveTelephoneCoachingCheckoutOffer")).toBeLessThan(source.indexOf("const db = await getDb();", source.indexOf("async function createCheckoutForProvider")));
    expect(source).toContain("productNameSnapshot: telephoneOffer?.name ?? product.name");
    expect(source).toContain("discountAmountKrw: telephoneOffer?.discountAmountKrw ?? 0");
    expect(source).toContain("record.finalAmountKrw !== input.amountKrw");
    expect(source).toContain("if (existing[0]) {");
    expect(source).toContain("return asCheckoutResponse(existing[0]);");
    expect(source).toContain("CHECKOUT_IDEMPOTENCY_CONFLICT");
    expect(source.indexOf("return asCheckoutResponse(existing[0]);")).toBeLessThan(source.indexOf("const resolvedCouponCode"));
  });
});
