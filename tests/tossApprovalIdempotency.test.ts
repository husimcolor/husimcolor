import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock("../server/db", () => ({ getDb: mocks.getDb }));
vi.mock("../server/commerce/toss-test-provider", () => ({
  confirmTossTestPayment: mocks.confirm,
  getTossTestClientConfig: vi.fn(),
  isTossTestPaymentEnabled: vi.fn(() => true),
}));

import { completeTossTestPayment } from "../server/commerce/order-service";

describe("Toss approval idempotency", () => {
  it("returns the existing paid entitlement before re-confirming the same paymentKey", async () => {
    const paidRecord = {
      transactionStatus: "approved",
      savedPaymentId: "pay_test_completed_123",
      orderId: 101,
      orderNumber: "HC-DUPLICATE-001",
      finalAmountKrw: 47_200,
      orderItemId: 202,
    };
    const db = {
      select: vi.fn((fields: Record<string, unknown>) => {
        if ("transactionStatus" in fields) {
          return {
            from: () => ({
              innerJoin: () => ({
                innerJoin: () => ({
                  where: () => ({ limit: async () => [paidRecord] }),
                }),
              }),
            }),
          };
        }
        return { from: () => ({ where: () => ({ limit: async () => [{ id: 303 }] }) }) };
      }),
    };
    mocks.getDb.mockResolvedValue(db);
    mocks.confirm.mockRejectedValue(new Error("must not re-confirm"));

    await expect(completeTossTestPayment({
      orderNumber: "HC-DUPLICATE-001",
      paymentKey: "pay_test_completed_123",
      amountKrw: 47_200,
    })).resolves.toMatchObject({
      status: "paid",
      entitlementId: 303,
      alreadyProcessed: true,
    });
    expect(mocks.confirm).not.toHaveBeenCalled();
  });
});
