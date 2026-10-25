import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  confirm: vi.fn(),
  lookupByOrderNumber: vi.fn(),
}));

vi.mock("../server/db", () => ({ getDb: mocks.getDb }));
vi.mock("../server/commerce/toss-test-provider", () => ({
  confirmTossTestPayment: mocks.confirm,
  getTossTestPayment: vi.fn(),
  getTossTestPaymentByOrderNumber: mocks.lookupByOrderNumber,
  getTossTestClientConfig: vi.fn(),
  isTossTestPaymentEnabled: vi.fn(() => true),
}));

import {
  completeTossTestPayment,
  decryptPendingCoachingBookingRequest,
  encryptPendingCoachingBookingRequest,
  normalizeCoachingBookingRequest,
  recoverApprovedPreviewTelephoneCoachingTossTestPayment,
} from "../server/commerce/order-service";
import { decryptCommerceValue } from "../server/commerce/crypto";

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

  it("selects the stored telephone booking ciphertext before Preview approved-payment recovery", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");
    vi.stubEnv("COMMERCE_EMAIL_ENCRYPTION_KEY", Buffer.alloc(32, 8).toString("base64"));
    vi.stubEnv("COMMERCE_EMAIL_HASH_SECRET", "x".repeat(32));
    const pendingBooking = encryptPendingCoachingBookingRequest(normalizeCoachingBookingRequest({
      contactName: "Preview Customer",
      contactPhone: "010-0000-0000",
      requestedWindowStart: "2030-01-02T20:00:00+09:00",
      requestedWindowEnd: "2030-01-02T21:00:00+09:00",
      sessionMode: "telephone",
      adultConfirmed: true,
    })!);
    const decryptedPendingPayload = JSON.parse(decryptCommerceValue(pendingBooking));
    expect(normalizeCoachingBookingRequest(decryptedPendingPayload.request)).toMatchObject({
      sessionMode: "telephone",
      requestedWindowStart: new Date("2030-01-02T11:00:00.000Z"),
    });
    expect(decryptPendingCoachingBookingRequest(pendingBooking)).toMatchObject({
      sessionMode: "telephone",
      requestedWindowStart: new Date("2030-01-02T11:00:00.000Z"),
    });
    const db = {
      select: vi.fn((fields: Record<string, unknown>) => ({
        from: () => ({
          innerJoin: () => ({
            innerJoin: () => ({
              where: () => ({
                limit: async () => [{
                  transactionStatus: "ready",
                  savedPaymentId: null,
                  finalAmountKrw: 50_000,
                  isTest: true,
                  productCode: "telephone_coaching",
                  ...("pendingBookingRequestEncrypted" in fields
                    ? { pendingBookingRequestEncrypted: pendingBooking }
                    : {}),
                }],
              }),
            }),
          }),
        }),
      })),
      transaction: async () => { throw new Error("RECOVERY_TRANSACTION_REACHED"); },
    };
    mocks.getDb.mockResolvedValue(db);
    mocks.lookupByOrderNumber.mockResolvedValue({
      paymentKey: "pay_test_done",
      orderNumber: "HC-RECOVERY-001",
      amountKrw: 50_000,
      status: "DONE",
      method: "카드",
      rawPayload: "{}",
    });

    await expect(recoverApprovedPreviewTelephoneCoachingTossTestPayment({ orderNumber: "HC-RECOVERY-001" }))
      .rejects.toThrow("RECOVERY_TRANSACTION_REACHED");
    expect(mocks.lookupByOrderNumber).toHaveBeenCalledWith("HC-RECOVERY-001");
  });
});
