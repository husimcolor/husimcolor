import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("commerce secret configuration", () => {
  it("uses the server-only email protection secrets through the commerce health API", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const health = await caller.commerce.health();

    expect(health).toEqual({
      hashSecretConfigured: true,
      encryptionKeyConfigured: true,
      roundTripVerified: true,
    });
  });
});
