import { afterEach, describe, expect, it, vi } from "vitest";
import { decryptPendingCoachingBookingRequest, encryptPendingCoachingBookingRequest, getCoachingBookingPersistence, normalizeCoachingBookingRequest } from "../server/commerce/order-service";
import { decryptCommerceValue } from "../server/commerce/crypto";

const encryptionKey = Buffer.alloc(32, 7).toString("base64");

describe("website coaching booking persistence", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps booking details encrypted until payment approval", () => {
    vi.stubEnv("COMMERCE_EMAIL_ENCRYPTION_KEY", encryptionKey);
    const request = normalizeCoachingBookingRequest({ contactName: "Preview Customer", contactPhone: "010-0000-0000", requestedWindowStart: "2026-10-02T14:00:00+09:00", requestedWindowEnd: "2026-10-02T15:30:00+09:00", sessionMode: "online", notes: "테스트 메모" });
    const encrypted = encryptPendingCoachingBookingRequest(request!);
    expect(encrypted).not.toContain("010-0000-0000");
    expect(decryptPendingCoachingBookingRequest(encrypted)).toMatchObject({ contactName: "Preview Customer", sessionMode: "online" });
  });

  it("moves requested schedule and encrypted contact details to the existing coaching booking row", () => {
    vi.stubEnv("COMMERCE_EMAIL_ENCRYPTION_KEY", encryptionKey);
    const request = normalizeCoachingBookingRequest({ contactName: "Preview Customer", contactPhone: "010-0000-0000", requestedWindowStart: "2026-10-02T14:00:00+09:00", requestedWindowEnd: "2026-10-02T15:30:00+09:00", sessionMode: "in_person", notes: "테스트 메모" });
    const persisted = getCoachingBookingPersistence(request);
    expect(persisted).toMatchObject({ sessionMode: "in_person" });
    expect(persisted.detailsEncrypted).not.toContain("010-0000-0000");
    expect(JSON.parse(decryptCommerceValue(persisted.detailsEncrypted!))).toEqual({ contactName: "Preview Customer", contactPhone: "010-0000-0000", notes: "테스트 메모" });
  });

  it("rejects an invalid booking time window before an order is written", () => {
    expect(() => normalizeCoachingBookingRequest({ contactName: "Preview Customer", contactPhone: "010-0000-0000", requestedWindowStart: "2026-10-02T15:30:00+09:00", requestedWindowEnd: "2026-10-02T14:00:00+09:00", sessionMode: "online" })).toThrow("INVALID_COACHING_REQUESTED_WINDOW");
  });
});
