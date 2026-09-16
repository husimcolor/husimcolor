import { describe, expect, it } from "vitest";

import { isRestorableGuestClaim } from "../server/commerce/guest-claim-state";

describe("guest commerce claim restoration", () => {
  const now = new Date("2026-09-15T00:00:00.000Z");

  it("restores only a pending and unexpired challenge", () => {
    expect(isRestorableGuestClaim({ status: "pending", expiresAt: new Date("2026-09-15T00:10:00.000Z"), now })).toBe(true);
  });

  it("does not restore expired, verified, or cancelled challenges", () => {
    expect(isRestorableGuestClaim({ status: "pending", expiresAt: now, now })).toBe(false);
    expect(isRestorableGuestClaim({ status: "verified", expiresAt: new Date("2026-09-15T00:10:00.000Z"), now })).toBe(false);
    expect(isRestorableGuestClaim({ status: "cancelled", expiresAt: new Date("2026-09-15T00:10:00.000Z"), now })).toBe(false);
  });
});
