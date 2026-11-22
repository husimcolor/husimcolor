import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { products, productPrices, customers, orders, orderItems, paymentTransactions } from "../drizzle/schema";
import { TELEPHONE_EVENT_NAME, TELEPHONE_EVENT_OFFER_CODE } from "../shared/telephoneCoachingEvent";

const mocks = vi.hoisted(() => ({ getDb: vi.fn(), reserveSlot: vi.fn() }));
vi.mock("../server/db", () => ({ getDb: mocks.getDb }));
vi.mock("../server/commerce/account-service", () => ({ linkCheckoutCustomerToAuthenticatedUser: vi.fn().mockResolvedValue(null) }));
vi.mock("../server/commerce/release-policy", () => ({ assertPublicPaidAnalysisCheckout: vi.fn() }));
vi.mock("../server/commerce/toss-live-provider", () => ({
  isTossLivePaymentEnabled: () => true,
  getTossLiveClientConfig: () => ({ clientKey: "live_ck_mock_only_not_real" }),
  confirmTossLivePayment: vi.fn(),
}));
vi.mock("../server/commerce/telephone-coaching-service", async () => {
  const actual = await vi.importActual<typeof import("../server/commerce/telephone-coaching-service")>("../server/commerce/telephone-coaching-service");
  return { ...actual, ensureTelephoneCoachingPreviewSchema: vi.fn(), reserveTelephoneCoachingSlot: mocks.reserveSlot };
});
import { createTossLiveCheckout } from "../server/commerce/order-service";

let inserted: Array<{ table: unknown; value: any }>;
let amount = 50_000;
function fakeTransaction() {
  return {
    select: () => {
      let table: unknown;
      const query: any = {
        from: (value: unknown) => { table = value; return query; },
        innerJoin: () => query, where: () => query,
        limit: async () => {
          if (table === paymentTransactions) return [];
          if (table === products) return [{ id: 3, code: "telephone_coaching", name: "비대면 전화 코칭", active: true, requiresPayment: true, fulfillmentType: "coaching" }];
          if (table === productPrices) return [{ version: 1, regularAmountKrw: 50_000, amountKrw: amount }];
          if (table === customers) return [{ id: 7 }];
          if (table === orders) return [{ id: 11, orderNumber: "HC-MOCK-ONLY" }];
          if (table === orderItems) return [{ id: 13 }];
          throw new Error("Unexpected mock table");
        },
      };
      return query;
    },
    insert: (table: unknown) => ({ values: async (value: any) => { inserted.push({ table, value }); return [{ insertId: table === orders ? 11 : 13 }]; } }),
  };
}
const input = (event = false) => ({
  productCode: "telephone_coaching" as const, email: "mock@example.test", idempotencyKey: "mock-unit-test-idempotency-only", channel: "web" as const,
  bookingRequest: { contactName: "Mock Customer", contactPhone: "010-0000-0000", sessionMode: "telephone" as const, adultConfirmed: true,
    requestedWindowStart: "2026-12-02T14:00:00+09:00", requestedWindowEnd: "2026-12-02T15:00:00+09:00",
    ...(event ? { offerCode: TELEPHONE_EVENT_OFFER_CODE } : {}),
  },
});
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-12-01T10:00:00+09:00"));
  vi.stubEnv("COMMERCE_EMAIL_ENCRYPTION_KEY", Buffer.alloc(32, 7).toString("base64"));
  vi.stubEnv("COMMERCE_EMAIL_HASH_SECRET", "mock-unit-test-hash-secret-at-least-32-bytes");
  inserted = []; amount = 50_000; vi.clearAllMocks();
  mocks.getDb.mockResolvedValue({ transaction: (fn: any) => fn(fakeTransaction()) });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("telephone order creation using in-memory fake transaction only", () => {
  it.each([false, true])("snapshots the explicit event=%s price without changing product rows", async event => {
    const response = await createTossLiveCheckout(input(event));
    const expectedAmount = event ? 35_000 : 50_000;
    expect(response.finalAmountKrw).toBe(expectedAmount);
    expect(response.productName).toBe(event ? TELEPHONE_EVENT_NAME : "비대면 전화 코칭");
    const order = inserted.find(row => row.table === orders)!.value;
    const item = inserted.find(row => row.table === orderItems)!.value;
    expect(order).toMatchObject({ regularAmountKrw: 50_000, listAmountKrw: 50_000, discountAmountKrw: event ? 15_000 : 0, finalAmountKrw: expectedAmount, isTest: false });
    expect(item).toMatchObject({ productNameSnapshot: response.productName, finalAmountKrw: expectedAmount });
    expect(inserted.some(row => row.table === products || row.table === productPrices)).toBe(false);
    expect(mocks.reserveSlot).toHaveBeenCalledOnce();
  });
  it("allows November 23 advance payment for December 5 with the 35,000 won snapshot", async () => {
    vi.setSystemTime(new Date("2026-11-23T10:00:00+09:00"));
    const advance = input(true);
    advance.bookingRequest.requestedWindowStart = "2026-12-05T14:00:00+09:00";
    advance.bookingRequest.requestedWindowEnd = "2026-12-05T15:00:00+09:00";
    expect((await createTossLiveCheckout(advance)).finalAmountKrw).toBe(35_000);
    expect(inserted.find(row => row.table === orders)!.value.finalAmountKrw).toBe(35_000);
  });
  it("rejects a November consultation before any database connection", async () => {
    vi.setSystemTime(new Date("2026-11-22T20:00:00+09:00"));
    const invalid = input(true);
    invalid.bookingRequest.requestedWindowStart = "2026-11-30T14:00:00+09:00";
    invalid.bookingRequest.requestedWindowEnd = "2026-11-30T15:00:00+09:00";
    await expect(createTossLiveCheckout(invalid)).rejects.toThrow("TELEPHONE_EVENT_DATE_OUT_OF_RANGE");
    expect(mocks.getDb).not.toHaveBeenCalled(); expect(inserted).toHaveLength(0);
  });
  it("fails closed if the regular database price has changed", async () => {
    amount = 60_000;
    await expect(createTossLiveCheckout(input(true))).rejects.toThrow("TELEPHONE_EVENT_REGULAR_PRICE_CHANGED");
    expect(inserted).toHaveLength(0);
  });
});
