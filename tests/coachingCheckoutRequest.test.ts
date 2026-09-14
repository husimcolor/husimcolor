import { describe, expect, it } from "vitest";

import { normalizeCoachingBookingRequest } from "../server/commerce/order-service";

describe("coaching checkout booking request", () => {
  const validRequest = {
    contactName: "홍길동",
    contactPhone: "010-1234-5678",
    requestedWindowStart: "2026-09-18T05:00:00.000Z",
    requestedWindowEnd: "2026-09-18T06:30:00.000Z",
    sessionMode: "online" as const,
    notes: "조용한 시간대로 요청합니다.",
  };

  it("accepts a valid coaching booking request without using the browser amount", () => {
    expect(normalizeCoachingBookingRequest(validRequest)).toMatchObject({
      contactName: "홍길동",
      contactPhone: "010-1234-5678",
      sessionMode: "online",
      notes: "조용한 시간대로 요청합니다.",
    });
  });

  it("rejects an invalid or reversed requested time window", () => {
    expect(() => normalizeCoachingBookingRequest({
      ...validRequest,
      requestedWindowEnd: validRequest.requestedWindowStart,
    })).toThrow("COACHING_REQUESTED_TIME_RANGE_INVALID");
    expect(() => normalizeCoachingBookingRequest({
      ...validRequest,
      contactPhone: "abc",
    })).toThrow("COACHING_CONTACT_PHONE_INVALID");
  });
});
