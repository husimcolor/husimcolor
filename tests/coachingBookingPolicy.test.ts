import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertCoachingBookingTransition } from "../server/commerce/coaching-booking-service";
import { getCoachingScheduledEnd } from "../shared/coachingSchedule";
import { getCommerceProduct } from "../shared/commerce";

describe("coaching booking policy", () => {
  it("requires a confirmed time before a booking becomes scheduled", () => {
    expect(() => assertCoachingBookingTransition({ from: "pending_schedule", to: "scheduled" }))
      .toThrow("COACHING_BOOKING_SCHEDULED_AT_REQUIRED");
    expect(() => assertCoachingBookingTransition({
      from: "pending_schedule",
      to: "scheduled",
      scheduledAt: new Date("2026-10-01T14:00:00+09:00"),
    })).toThrow("COACHING_BOOKING_SCHEDULED_END_AT_REQUIRED");
  });

  it("allows the intended operating transitions and blocks terminal-state rewrites", () => {
    expect(() => assertCoachingBookingTransition({
      from: "pending_schedule",
      to: "scheduled",
      scheduledAt: new Date("2026-10-01T14:00:00+09:00"),
      scheduledEndAt: new Date("2026-10-01T16:00:00+09:00"),
    })).not.toThrow();
    expect(() => assertCoachingBookingTransition({ from: "completed", to: "scheduled" }))
      .toThrow("COACHING_BOOKING_INVALID_STATUS_TRANSITION");
  });

  it("uses an exact 60-minute block for telephone coaching and a conservative 120-minute block for manual coaching", () => {
    const start = new Date("2026-11-02T20:00:00+09:00");
    expect(getCoachingScheduledEnd(start, "telephone_coaching").toISOString()).toBe("2026-11-02T12:00:00.000Z");
    expect(getCoachingScheduledEnd(start, "personal_coaching").toISOString()).toBe("2026-11-02T13:00:00.000Z");
  });

  it("keeps other relationship coaching in the shared catalog but unavailable for public sale", () => {
    expect(getCommerceProduct("relationship_coaching")).toMatchObject({
      fulfillmentType: "coaching",
      requiresPayment: true,
      active: false,
      amountKrw: 0,
    });
  });

  it("uses a web-compatible confirmation modal and visible error handling for admin booking actions", () => {
    const admin = readFileSync(resolve(__dirname, "../app/(tabs)/admin.tsx"), "utf8");
    expect(admin).toContain("pendingBookingStatusAction");
    expect(admin).toContain("confirmBookingStatusChange");
    expect(admin).toContain("코칭 예약 상태 변경 확인");
    expect(admin).toContain("Toss 결제를 취소하거나 환불하지 않습니다.");
    expect(admin).toContain("bookingActionError");
    expect(admin).not.toContain('Alert.alert("예약 상태 변경"');
  });
});
