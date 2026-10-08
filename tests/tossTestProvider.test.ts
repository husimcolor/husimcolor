import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmTossTestPayment,
  getTossTestClientConfig,
  isTossTestPaymentEnabled,
} from "../server/commerce/toss-test-provider";

function mockResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

describe("Toss test payment adapter", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("only exposes the public test client key outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_sample");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_sample");

    expect(isTossTestPaymentEnabled()).toBe(true);
    expect(getTossTestClientConfig()).toEqual({ clientKey: "test_ck_sample" });

    vi.stubEnv("NODE_ENV", "production");
    expect(isTossTestPaymentEnabled()).toBe(false);
    expect(() => getTossTestClientConfig()).toThrow("TOSS_TEST_PAYMENT_DISABLED");
  });

  it("명시적 테스트 모드의 Vercel Preview와 이중 gate Production에서만 Toss 테스트 키를 허용한다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_sample");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_sample");

    expect(isTossTestPaymentEnabled()).toBe(true);

    vi.stubEnv("VERCEL_ENV", "production");
    expect(isTossTestPaymentEnabled()).toBe(false);

    vi.stubEnv("COMMERCE_PRODUCTION_TEST_MODE", "true");
    vi.stubEnv("COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED", "true");
    expect(isTossTestPaymentEnabled()).toBe(true);

    // 라이브 gate가 열린 Production에서는 공개 test-key 주문을 새로 만들 수 없다.
    vi.stubEnv("COMMERCE_LIVE_PAYMENT_ENABLED", "true");
    expect(isTossTestPaymentEnabled()).toBe(false);
    vi.stubEnv("COMMERCE_LIVE_PAYMENT_ENABLED", "false");

    vi.stubEnv("COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED", "false");
    expect(isTossTestPaymentEnabled()).toBe(false);
  });

  it("confirms only a DONE payment with matching order and server amount", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_sample");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_sample");
    const fetcher = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.method).toBe("POST");
      expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
      expect(init.body).toBe(JSON.stringify({ paymentKey: "pay_test_123", orderId: "HC-ORDER-001", amount: 29_000 }));
      return mockResponse({
        paymentKey: "pay_test_123",
        orderId: "HC-ORDER-001",
        totalAmount: 29_000,
        status: "DONE",
        method: "카드",
      });
    });

    await expect(confirmTossTestPayment({ paymentKey: "pay_test_123", orderNumber: "HC-ORDER-001", amountKrw: 29_000 }, fetcher))
      .resolves.toMatchObject({ paymentKey: "pay_test_123", orderNumber: "HC-ORDER-001", amountKrw: 29_000 });
  });

  it("rejects failed or mismatched provider responses before entitlement processing", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_sample");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_sample");

    await expect(confirmTossTestPayment(
      { paymentKey: "pay_test_123", orderNumber: "HC-ORDER-001", amountKrw: 29_000 },
      async () => mockResponse({ code: "PAYMENT_NOT_FOUND" }, 404),
    )).rejects.toThrow("TOSS_TEST_CONFIRM_FAILED_404");

    await expect(confirmTossTestPayment(
      { paymentKey: "pay_test_123", orderNumber: "HC-ORDER-001", amountKrw: 29_000 },
      async () => mockResponse({
        paymentKey: "pay_test_123",
        orderId: "HC-OTHER",
        totalAmount: 29_000,
        status: "DONE",
      }),
    )).rejects.toThrow("TOSS_TEST_CONFIRM_RESPONSE_MISMATCH");
  });
});
