import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";

function contextWithRole(role: "user" | "admin" | null) {
  return {
    user: role
      ? {
          id: 71,
          openId: "admin-boundary-test",
          name: "Test User",
          email: "test@example.com",
          loginMethod: "manus",
          role,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        }
      : null,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as any;
}

describe("admin role boundary", () => {
  it("rejects unauthenticated callers before any operational data query", async () => {
    const caller = appRouter.createCaller(contextWithRole(null));
    await expect(caller.admin.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects ordinary members from order and customer operations", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.admin.orders({ limit: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.customers({ limit: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an administrator to read the consolidated operating dashboard", async () => {
    const caller = appRouter.createCaller(contextWithRole("admin"));
    const dashboard = await caller.admin.dashboard();
    expect(dashboard).toEqual(expect.objectContaining({
      paidOrders: expect.any(Number),
      failedEmails: expect.any(Number),
      pendingBookings: expect.any(Number),
    }));
  });
});
