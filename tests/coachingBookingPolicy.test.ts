import { describe, expect, it } from "vitest";

import { assertCoachingBookingTransition } from "../server/commerce/coaching-booking-service";
import { getCommerceProduct } from "../shared/commerce";

describe("coaching booking policy", () => {
  it("requires a confirmed time before a booking becomes scheduled", () => {
    expect(() => assertCoachingBookingTransition({ from: "pending_schedule", to: "scheduled" }))
      .toThrow("COACHING_BOOKING_SCHEDULED_AT_REQUIRED");
  });

  it("allows the intended operating transitions and blocks terminal-state rewrites", () => {
    expect(() => assertCoachingBookingTransition({
      from: "pending_schedule",
      to: "scheduled",
      scheduledAt: new Date("2026-10-01T14:00:00+09:00"),
    })).not.toThrow();
    expect(() => assertCoachingBookingTransition({ from: "completed", to: "scheduled" }))
      .toThrow("COACHING_BOOKING_INVALID_STATUS_TRANSITION");
  });

  it("keeps other relationship coaching in the shared catalog but unavailable for public sale", () => {
    expect(getCommerceProduct("relationship_coaching")).toMatchObject({
      fulfillmentType: "coaching",
      requiresPayment: true,
      active: false,
      amountKrw: 0,
    });
  });
});
