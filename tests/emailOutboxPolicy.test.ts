import { describe, expect, it } from "vitest";

import { getAccountLinkEmailIdempotencyKey, getOutboxEmailIdempotencyKey, getOutboxRetryAt, getSupportNotificationIdempotencyKey, MAX_AUTOMATIC_ATTEMPTS } from "../server/commerce/email-outbox-service";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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

  it("uses a separate deterministic key for account-link verification messages", () => {
    expect(getAccountLinkEmailIdempotencyKey(18)).toBe("husim-account-link-outbox-18");
    expect(() => getAccountLinkEmailIdempotencyKey(-1)).toThrow("INVALID_OUTBOX_ID");
  });

  it("uses a separate deterministic key for support notifications", () => {
    expect(getSupportNotificationIdempotencyKey(19)).toBe("husim-support-outbox-19");
  });

  it("keeps telephone coaching confirmations in the durable delivery and administrator retry paths", () => {
    const service = readFileSync(resolve(__dirname, "../server/commerce/email-outbox-service.ts"), "utf8");
    const router = readFileSync(resolve(__dirname, "../server/routers.ts"), "utf8");
    const config = JSON.parse(readFileSync(resolve(__dirname, "../vercel.json"), "utf8"));
    expect(service).toContain('"coaching_booking_confirmation"');
    expect(service).toContain("retryAdminDeliveryOutboxItem");
    expect(router).toContain("retryAdminDeliveryOutboxItem(input.outboxId)");
    expect(config.crons).toContainEqual({ path: "/api/cron-email-outbox", schedule: "0 0 * * *" });
  });
});
