import { describe, expect, it } from "vitest";

const TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

describe("Toss test credential integration", () => {
  it("authenticates the configured test secret without creating or approving a payment", async () => {
    const secretKey = process.env.TOSS_TEST_SECRET_KEY?.trim();
    expect(secretKey).toMatch(/^test_sk_/);

    const authorization = Buffer.from(`${secretKey}:`, "utf8").toString("base64");
    const response = await fetch(TOSS_CONFIRM_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // 존재하지 않는 테스트 결제키로 인증만 확인한다. 주문·결제·DB 데이터를 생성하지 않는다.
        paymentKey: "payment-key-for-credential-validation-only",
        orderId: "HC-CREDENTIAL-VALIDATION-ONLY",
        amount: 1000,
      }),
    });

    expect(response.status).not.toBe(401);
    expect(response.status).not.toBe(403);
    expect([400, 404]).toContain(response.status);
  }, 15_000);
});
