import { beforeEach, describe, expect, it, vi } from "vitest";

import { isAuthorizedOutboxCronRequest } from "../server/commerce/outbox-cron-auth";

const processDuePrivatePdfOutbox = vi.fn();

vi.mock("../server/commerce/email-outbox-service", () => ({
  processDuePrivatePdfOutbox,
}));

describe("outbox cron authorization", () => {
  beforeEach(() => {
    processDuePrivatePdfOutbox.mockReset();
    processDuePrivatePdfOutbox.mockResolvedValue({ sent: 0, retryScheduled: 0, skipped: 0 });
  });

  it("accepts only the configured bearer secret", () => {
    const secret = "a".repeat(48);
    expect(isAuthorizedOutboxCronRequest(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedOutboxCronRequest("Bearer wrong", secret)).toBe(false);
    expect(isAuthorizedOutboxCronRequest(undefined, secret)).toBe(false);
    expect(isAuthorizedOutboxCronRequest(`Bearer ${secret}`, "short")).toBe(false);
  });

  it("accepts the configured CRON_SECRET at the lightweight cron API endpoint", async () => {
    const configuredSecret = process.env.CRON_SECRET;
    expect(configuredSecret).toBeTruthy();
    const { default: handler } = await import("../api/cron-email-outbox");
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    await handler(
      { method: "GET", headers: { authorization: `Bearer ${configuredSecret}` } } as any,
      { status } as any,
    );
    expect(processDuePrivatePdfOutbox).toHaveBeenCalledWith(10);
    expect(status).toHaveBeenCalledWith(200);
  });
});
