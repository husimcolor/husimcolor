import { describe, expect, it } from "vitest";

import {
  isPreviewReadOnlyVerificationEnabled,
  previewVerificationUnavailableResult,
} from "../server/commerce/preview-admin-verification";
import { appRouter } from "../server/routers";

function contextWithRole(role: "user" | "admin" | null) {
  return {
    user: role
      ? { id: 72, openId: "preview-admin-test", name: "Preview Admin", email: "admin@example.com", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }
      : null,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as any;
}

describe("preview read-only admin verification", () => {
  it("requires both Preview runtime and explicit commerce test mode", () => {
    expect(isPreviewReadOnlyVerificationEnabled({ VERCEL_ENV: "preview", COMMERCE_TEST_MODE: "true" })).toBe(true);
    expect(isPreviewReadOnlyVerificationEnabled({ VERCEL_ENV: "production", COMMERCE_TEST_MODE: "true" })).toBe(false);
    expect(isPreviewReadOnlyVerificationEnabled({ VERCEL_ENV: "preview", COMMERCE_TEST_MODE: "false" })).toBe(false);
  });

  it("returns no data outside the Preview verification runtime", () => {
    expect(previewVerificationUnavailableResult()).toEqual({ available: false, reason: "preview_only", testOrders: [], outbox: [] });
  });

  it("rejects ordinary members before the Preview verification query runs", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.admin.previewVerification()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
