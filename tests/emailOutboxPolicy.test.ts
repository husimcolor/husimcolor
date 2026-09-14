import { describe, expect, it } from "vitest";

import { getOutboxEmailIdempotencyKey, getOutboxRetryAt, MAX_AUTOMATIC_ATTEMPTS } from "../server/commerce/email-outbox-service";

describe("email outbox retry policy", () => {
  it("uses bounded exponential-like retry intervals without sending an email", () => {
    const now = new Date("2026-09-12T00:00:00.000Z");
    expect(getOutboxRetryAt(1, now).toISOString()).toBe("2026-09-12T00:05:00.000Z");
    expect(getOutboxRetryAt(3, now).toISOString()).toBe("2026-09-12T01:00:00.000Z");
    expect(getOutboxRetryAt(99, now).toISOString()).toBe("2026-09-13T00:00:00.000Z");
    expect(MAX_AUTOMATIC_ATTEMPTS).toBe(5);
  });

  it("uses one deterministic idempotency key for each outbox item", () => {
    expect(getOutboxEmailIdempotencyKey(17)).toBe("husim-pdf-outbox-17");
    expect(() => getOutboxEmailIdempotencyKey(0)).toThrow("INVALID_OUTBOX_ID");
  });
});
