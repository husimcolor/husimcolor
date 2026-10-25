import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { getCommerceProduct } from "../shared/commerce";
import {
  DEFAULT_TELEPHONE_COACHING_SLOT_TIMES,
  TELEPHONE_COACHING_DURATION_MINUTES,
  TELEPHONE_COACHING_SLOT_MINUTES,
  isTelephoneCoachingPreviewPreparationEnabled,
  normalizeTelephoneCoachingBookingRequest,
} from "../server/commerce/telephone-coaching-service";

const now = new Date("2026-10-25T00:00:00.000Z");
const futureStart = "2026-11-02T10:00:00+09:00";
const futureEnd = "2026-11-02T11:00:00+09:00";

function request(overrides: Record<string, unknown> = {}) {
  return {
    contactName: "테스트 신청자",
    contactPhone: "010-0000-0000",
    requestedWindowStart: futureStart,
    requestedWindowEnd: futureEnd,
    sessionMode: "telephone" as const,
    adultConfirmed: true,
    ...overrides,
  };
}

describe("telephone coaching", () => {
  it("is an active 50-minute, 50,000-won product excluded from coupons", () => {
    const product = getCommerceProduct("telephone_coaching");
    expect(product).toMatchObject({
      code: "telephone_coaching",
      name: "비대면 전화 코칭",
      amountKrw: 50_000,
      active: false,
      couponEligible: false,
    });
    expect(TELEPHONE_COACHING_DURATION_MINUTES).toBe(50);
    expect(TELEPHONE_COACHING_SLOT_MINUTES).toBe(60);
    expect(DEFAULT_TELEPHONE_COACHING_SLOT_TIMES).toEqual(["10:00", "11:30", "14:00", "16:00", "19:00", "20:00"]);
  });

  it("only accepts an adult-confirmed, future 60-minute telephone slot", () => {
    const normalized = normalizeTelephoneCoachingBookingRequest(request(), now);
    expect(normalized.sessionMode).toBe("telephone");
    expect(normalized.requestedWindowEnd.getTime() - normalized.requestedWindowStart.getTime()).toBe(60 * 60 * 1000);
    const lastSlot = normalizeTelephoneCoachingBookingRequest(request({
      requestedWindowStart: "2026-11-02T20:00:00+09:00",
      requestedWindowEnd: "2026-11-02T21:00:00+09:00",
    }), now);
    expect(lastSlot.requestedWindowEnd.toISOString()).toBe("2026-11-02T12:00:00.000Z");
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ adultConfirmed: false }), now)).toThrow("TELEPHONE_COACHING_ADULT_CONFIRMATION_REQUIRED");
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ requestedWindowEnd: "2026-11-02T10:50:00+09:00" }), now)).toThrow("TELEPHONE_COACHING_REQUIRES_60_MINUTE_SLOT");
  });

  it("allows five-elements opt-in without a birth date and stores verified calendar details only when provided", () => {
    const withoutOptIn = normalizeTelephoneCoachingBookingRequest(request({ topic: "관계 대화" }), now);
    expect(withoutOptIn).toMatchObject({ topic: "관계 대화", fiveElementsOptIn: false, birthDate: null, birthCalendarType: null, isLeapMonth: false });
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ birthDate: "1990-01-01" }), now)).toThrow("TELEPHONE_COACHING_BIRTH_DATE_REQUIRES_OPT_IN");
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true, birthDate: "2014-01-01" }), now)).toThrow("INVALID_TELEPHONE_COACHING_BIRTH_DATE");
    expect(normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true }), now)).toMatchObject({ fiveElementsOptIn: true, birthDate: null, birthCalendarType: null, isLeapMonth: false });
    expect(normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true, birthDate: "1990-01-01" }), now)).toMatchObject({ fiveElementsOptIn: true, birthDate: "1990-01-01", birthCalendarType: "solar", isLeapMonth: false });
    expect(normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true, birthDate: "1982-04-01", birthCalendarType: "lunar", isLeapMonth: true }), now)).toMatchObject({ fiveElementsOptIn: true, birthCalendarType: "lunar", isLeapMonth: true });
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true, birthDate: "2023-02-29" }), now)).toThrow("INVALID_TELEPHONE_COACHING_BIRTH_DATE");
    expect(() => normalizeTelephoneCoachingBookingRequest(request({ fiveElementsOptIn: true, birthDate: "1990-01-01", birthCalendarType: "solar", isLeapMonth: true }), now)).toThrow("TELEPHONE_COACHING_LEAP_MONTH_REQUIRES_LUNAR_DATE");
  });

  it("only prepares the product and schema in an explicit Preview test runtime", () => {
    expect(isTelephoneCoachingPreviewPreparationEnabled({
      VERCEL_ENV: "preview",
      COMMERCE_TEST_MODE: "true",
      COMMERCE_PREVIEW_TELEPHONE_COACHING_TEST_ENABLED: "true",
    })).toBe(true);
    expect(isTelephoneCoachingPreviewPreparationEnabled({
      VERCEL_ENV: "production",
      COMMERCE_TEST_MODE: "true",
      COMMERCE_PREVIEW_TELEPHONE_COACHING_TEST_ENABLED: "true",
    })).toBe(false);
    expect(isTelephoneCoachingPreviewPreparationEnabled({
      VERCEL_ENV: "preview",
      COMMERCE_TEST_MODE: "true",
    })).toBe(false);
  });

  it("accepts the same telephone booking shape for explicit live checkout without enabling the product by default", () => {
    const router = readFileSync(resolve(__dirname, "../server/routers.ts"), "utf8");
    const liveCheckout = router.slice(router.indexOf("createTossLive:"), router.indexOf("completeTest:"));
    expect(liveCheckout).toContain('"telephone_coaching"');
    expect(liveCheckout).toContain('sessionMode: z.enum(["online", "in_person", "telephone"])');
    expect(liveCheckout).toContain("birthCalendarType");
    expect(liveCheckout).toContain("adultConfirmed");
    expect(getCommerceProduct("telephone_coaching")?.active).toBe(false);
  });

  it("keeps the production activation as a separate explicit release step", () => {
    const releaseScript = readFileSync(resolve(__dirname, "../scripts/release-telephone-coaching-live.mjs"), "utf8");
    expect(releaseScript).toContain("COMMERCE_TELEPHONE_COACHING_RELEASE");
    expect(releaseScript).toContain("VERCEL_ENV !== \"production\"");
    expect(releaseScript).toContain("COMMERCE_LIVE_PAYMENT_ENABLED");
    expect(releaseScript).toContain("amountKrw` = 50000");
    expect(releaseScript).toContain("UPDATE `products` SET `active` = true");
  });
});
