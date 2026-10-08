import { afterEach, describe, expect, it, vi } from "vitest";

import {
  confirmTossLivePayment,
  getTossLiveClientConfig,
  isTossLivePaymentEnabled,
} from "../server/commerce/toss-live-provider";

function mockResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("Toss live payment adapter", () => {
  afterEach(() => vi.unstubAllEnvs());

  function enableLiveRuntime() {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED", "true");
    vi.stubEnv("COMMERCE_LIVE_PAYMENT_ENABLED", "true");
    vi.stubEnv("TOSS_LIVE_CLIENT_KEY", "live_ck_sample");
    vi.stubEnv("TOSS_LIVE_SECRET_KEY", "live_sk_sample");
  }

  it("exposes only the public live client key after both live gates are enabled", () => {
    enableLiveRuntime();
    expect(isTossLivePaymentEnabled()).toBe(true);
    expect(getTossLiveClientConfig()).toEqual({ clientKey: "live_ck_sample" });

    vi.stubEnv("COMMERCE_LIVE_PAYMENT_ENABLED", "false");
    expect(isTossLivePaymentEnabled()).toBe(false);
    expect(() => getTossLiveClientConfig()).toThrow("TOSS_LIVE_PAYMENT_DISABLED");

    vi.stubEnv("COMMERCE_LIVE_PAYMENT_ENABLED", "true");
    vi.stubEnv("TOSS_LIVE_SECRET_KEY", "test_sk_wrong_environment");
    expect(isTossLivePaymentEnabled()).toBe(false);
  });

  it("confirms only a matching DONE live payment with a server idempotency key", async () => {
    enableLiveRuntime();
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({
        "Content-Type": "application/json",
        "Idempotency-Key": "husim-HC-LIVE-ORDER-001",
      });
      expect(init.body).toBe(JSON.stringify({ paymentKey: "pay_live_123", orderId: "HC-LIVE-ORDER-001", amount: 23_200 }));
      return mockResponse({
        paymentKey: "pay_live_123",
        orderId: "HC-LIVE-ORDER-001",
        totalAmount: 23_200,
        status: "DONE",
        method: "카드",
      });
    });

    await expect(confirmTossLivePayment({
      paymentKey: "pay_live_123",
      orderNumber: "HC-LIVE-ORDER-001",
      amountKrw: 23_200,
    }, fetcher)).resolves.toMatchObject({
      paymentKey: "pay_live_123",
      orderNumber: "HC-LIVE-ORDER-001",
      amountKrw: 23_200,
    });
  });

  it("rejects a live provider response whose order snapshot differs", async () => {
    enableLiveRuntime();
    await expect(confirmTossLivePayment(
      { paymentKey: "pay_live_123", orderNumber: "HC-LIVE-ORDER-001", amountKrw: 23_200 },
      async () => mockResponse({
        paymentKey: "pay_live_123",
        orderId: "HC-OTHER",
        totalAmount: 23_200,
        status: "DONE",
      }),
    )).rejects.toThrow("TOSS_LIVE_CONFIRM_RESPONSE_MISMATCH");
  });
});
