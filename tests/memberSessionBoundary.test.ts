import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";

function createContext(input: { authenticated: boolean; legacyAdmin?: boolean }) {
  return {
    user: input.authenticated ? {
      id: 99,
      openId: "member-session-boundary-test",
      name: "Member",
      email: "member@example.test",
      loginMethod: "kakao",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    legacyAdmin: input.legacyAdmin === true,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as any;
}

describe("member session boundary", () => {
  it("does not allow an unauthenticated caller to read a member dashboard or private PDF", async () => {
    const caller = appRouter.createCaller(createContext({ authenticated: false }));
    await expect(caller.commerce.account.memberDashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.commerce.account.downloadPrivateDocument({ documentId: 1 })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("does not convert a legacy password-admin session into a member session", async () => {
    const caller = appRouter.createCaller(createContext({ authenticated: false, legacyAdmin: true }));
    await expect(caller.commerce.account.memberDashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
