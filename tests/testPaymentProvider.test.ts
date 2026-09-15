import { describe, expect, it, vi } from "vitest";
import { TestPaymentService } from "../server/commerce/test-payment";
import { decryptCommerceEmail } from "../server/commerce/crypto";
import { isTestPaymentEnabled } from "../server/commerce/order-service";

function testKey(label: string) {
  return `${label}-000000000000000000000000`;
}

describe("TestPaymentService", () => {
  it("cannot expose the database-backed test payment endpoint in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");

    expect(isTestPaymentEnabled()).toBe(false);

    vi.unstubAllEnvs();
  });

  it("명시적 테스트 모드의 Vercel Preview에서만 테스트 결제를 허용한다", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");

    expect(isTestPaymentEnabled()).toBe(true);

    vi.stubEnv("VERCEL_ENV", "production");
    expect(isTestPaymentEnabled()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("creates a server-priced personal analysis order and protects guest email", () => {
    const service = new TestPaymentService();
    const checkout = service.createCheckout({
      productCode: "personal_deep",
      email: "Guest@Example.com ",
      idempotencyKey: testKey("personal-checkout"),
    });

    expect(checkout.listAmountKrw).toBe(29_000);
    expect(checkout.discountAmountKrw).toBe(0);
    expect(checkout.finalAmountKrw).toBe(29_000);
    expect(checkout.status).toBe("pending");
    expect(checkout.customerEmailHash).toHaveLength(64);
    expect(checkout.customerEmailEncrypted).not.toContain("guest@example.com");
    expect(decryptCommerceEmail(checkout.customerEmailEncrypted)).toBe("guest@example.com");
  });

  it("uses price snapshots and returns the original checkout for duplicate checkout taps", () => {
    const service = new TestPaymentService();
    const input = {
      productCode: "parent_child_deep" as const,
      email: "parent@example.com",
      idempotencyKey: testKey("duplicate-checkout"),
      discountType: "percent" as const,
      discountValue: 10,
    };
    const first = service.createCheckout(input);
    const second = service.createCheckout(input);

    expect(first).toEqual(second);
    expect(first.listAmountKrw).toBe(39_000);
    expect(first.discountAmountKrw).toBe(3_900);
    expect(first.finalAmountKrw).toBe(35_100);
  });

  it("rejects a client-supplied amount that differs from the server order snapshot", () => {
    const service = new TestPaymentService();
    const checkoutKey = testKey("tampered-checkout");
    service.createCheckout({
      productCode: "couple_love_deep",
      email: "couple@example.com",
      idempotencyKey: checkoutKey,
    });

    expect(() =>
      service.completePayment({
        checkoutIdempotencyKey: checkoutKey,
        paymentIdempotencyKey: testKey("tampered-payment"),
        outcome: "success",
        amountKrw: 1,
      }),
    ).toThrow("ORDER_AMOUNT_MISMATCH");
  });

  it("issues exactly one entitlement when a success callback is repeated", () => {
    const service = new TestPaymentService();
    const checkoutKey = testKey("success-checkout");
    const paymentKey = testKey("success-payment");
    service.createCheckout({
      productCode: "couple_love_deep",
      email: "couple@example.com",
      idempotencyKey: checkoutKey,
    });

    const first = service.completePayment({
      checkoutIdempotencyKey: checkoutKey,
      paymentIdempotencyKey: paymentKey,
      outcome: "success",
      amountKrw: 59_000,
    });
    const retried = service.completePayment({
      checkoutIdempotencyKey: checkoutKey,
      paymentIdempotencyKey: paymentKey,
      outcome: "success",
      amountKrw: 59_000,
    });

    expect(first.status).toBe("paid");
    expect(first.entitlementId).toBeDefined();
    expect(retried).toMatchObject({
      status: "paid",
      entitlementId: first.entitlementId,
      alreadyProcessed: true,
    });
  });

  it("records failure and cancellation without granting an entitlement", () => {
    const service = new TestPaymentService();
    const failedKey = testKey("failed-checkout");
    service.createCheckout({
      productCode: "personal_deep",
      email: "failed@example.com",
      idempotencyKey: failedKey,
    });
    const failed = service.completePayment({
      checkoutIdempotencyKey: failedKey,
      paymentIdempotencyKey: testKey("failed-payment"),
      outcome: "failed",
      amountKrw: 29_000,
    });

    const cancelledKey = testKey("cancelled-checkout");
    service.createCheckout({
      productCode: "parent_child_deep",
      email: "cancelled@example.com",
      idempotencyKey: cancelledKey,
    });
    const cancelled = service.completePayment({
      checkoutIdempotencyKey: cancelledKey,
      paymentIdempotencyKey: testKey("cancelled-payment"),
      outcome: "cancelled",
      amountKrw: 39_000,
    });

    expect(failed).toEqual(expect.objectContaining({ status: "failed", entitlementId: undefined }));
    expect(cancelled).toEqual(expect.objectContaining({ status: "cancelled", entitlementId: undefined }));
  });

  it("grants free products without creating a payment or order", () => {
    const service = new TestPaymentService();
    const grant = service.issueFreeGrant("friend_relationship");

    expect(grant).toMatchObject({
      productCode: "friend_relationship",
      source: "free",
      orderCreated: false,
      paymentCreated: false,
    });
  });
});
