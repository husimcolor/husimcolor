import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("라이브 Toss 결제 분리", () => {
  it("creates and completes live payments through a dedicated provider and routes", () => {
    const orderService = read("server/commerce/order-service.ts");
    const router = read("server/routers.ts");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");

    expect(orderService).toContain('provider: "toss_live"');
    expect(orderService).toContain('const isTestOrder = provider === "test" || provider === "toss_pg"');
    expect(orderService).toContain('getKnownTossSuccess("toss_live", input)');
    expect(router).toContain("createTossLive: publicProcedure");
    expect(router).toContain("completeTossLive: publicProcedure");
    expect(router).toContain("completeTossLiveFailure: publicProcedure");
    expect(checkout).toContain("const tossPaymentEnabled = tossLiveEnabled || tossTestEnabled");
    expect(checkout).toContain('const paymentMode = tossLiveEnabled ? "live" : "test"');
    expect(checkout).toContain('callbackPaymentMode === "live" ? completeTossLiveCheckout : completeTossTestCheckout');
  });

  it("requires an independent Production live gate", () => {
    const runtime = read("server/commerce/live-runtime.ts");
    const provider = read("server/commerce/toss-live-provider.ts");

    expect(runtime).toContain('environment.COMMERCE_LIVE_PAYMENT_ENABLED === "true"');
    expect(runtime).toContain('environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true"');
    expect(provider).toContain('TOSS_LIVE_CLIENT_KEY');
    expect(provider).toContain('TOSS_LIVE_SECRET_KEY');
    expect(provider).toContain('TOSS_LIVE_PAYMENT_DISABLED');
  });
});
