import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MySqlDialect } from "drizzle-orm/mysql-core";
import { coupons, decemberReportCouponGrants, orders, paymentTransactions, couponRedemptions } from "../drizzle/schema";
const mocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("../server/db", () => ({ getDb: mocks.getDb }));
import { claimDecemberReportCoupons, prepareDecemberTossApproval, assertDecemberGrant } from "../server/commerce/december-report-event-service";
import { DECEMBER_REPORT_STARTS_AT, DECEMBER_REPORT_ENDS_AT, DECEMBER_REPORT_OFFERS } from "../shared/december-report-event";

let record: any;
let changes: any[];
let committed: boolean;
function dbForApproval() {
  const tx = {
    execute: vi.fn(async (query: any) => {
      const text = new MySqlDialect().sqlToQuery(query).sql;
      if (text.startsWith("SELECT c.id")) return [[{ id: 1, code: record.event ? "DEC2026-PERSONAL" : "OTHER" }], []];
      if (text.startsWith("SELECT id FROM coupons")) return [[{ id: 1 }], []];
      if (text.startsWith("SELECT p.id")) return [[record], []];
      throw new Error(`unexpected SQL ${text}`);
    }),
    update: (table: any) => ({ set: (values: any) => ({ where: async () => { changes.push({ table, values }); } }) }),
  };
  return { transaction: async (fn: any) => { const result = await fn(tx); committed = true; return result; } };
}
const input = { orderNumber: "HC-MOCK-ORDER", paymentKey: "pay-mock", amountKrw: 9900 };
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-12-05T10:00:00+09:00"));
  changes = []; committed = false;
  record = { id: 2, orderId: 3, event: true, status: "ready", orderStatus: "pending", providerPaymentId: null, state: "reserved", finalAmountKrw: 9900, expiresAt: new Date("2026-12-05T10:30:00+09:00") };
  mocks.getDb.mockResolvedValue(dbForApproval());
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("December payment preparation with mocked DB (no provider calls)", () => {
  it("commits processing and exact payment key before allowing external confirm", async () => {
    expect(await prepareDecemberTossApproval("toss_live", input)).toBe("confirm");
    expect(committed).toBe(true);
    expect(changes).toEqual([{ table: paymentTransactions, values: { status: "processing", providerPaymentId: input.paymentKey } }]);
  });
  it("expires abandoned order and commits release before throwing; Toss cannot be called", async () => {
    record.expiresAt = new Date("2026-12-05T10:00:00+09:00");
    await expect(prepareDecemberTossApproval("toss_live", input)).rejects.toThrow("TOSS_ORDER_EXPIRED");
    expect(committed).toBe(true);
    expect(changes).toEqual([{ table: orders, values: { status: "expired" } }, { table: couponRedemptions, values: { state: "released", releasedAt: new Date() } }]);
  });
  it("blocks fresh approval after campaign end even with a corrupt late expiry", async () => {
    vi.setSystemTime(DECEMBER_REPORT_ENDS_AT); record.expiresAt = new Date("2027-01-03T00:00:00+09:00");
    await expect(prepareDecemberTossApproval("toss_live", input)).rejects.toThrow("TOSS_ORDER_EXPIRED");
    expect(committed).toBe(true);
  });
  it("already-processing past-expiry payment only permits server readback recovery", async () => {
    record.status = "processing"; record.providerPaymentId = input.paymentKey;
    vi.setSystemTime(DECEMBER_REPORT_ENDS_AT);
    expect(await prepareDecemberTossApproval("toss_live", input)).toBe("recover");
    expect(changes).toHaveLength(0);
  });
  it("does not allow a different payment key to recover the hold", async () => {
    record.status = "processing"; record.providerPaymentId = "another-key";
    await expect(prepareDecemberTossApproval("toss_live", input)).rejects.toThrow("TOSS_PAYMENT_ID_CONFLICT");
    expect(changes).toHaveLength(0);
  });
  it("rejects terminal order without reviving its coupon", async () => {
    record.status = "cancelled"; record.state = "released";
    await expect(prepareDecemberTossApproval("toss_live", input)).rejects.toThrow("TOSS_ORDER_ALREADY_TERMINAL");
  });
  it("validates DB amount before setting processing", async () => {
    await expect(prepareDecemberTossApproval("toss_live", { ...input, amountKrw: 1 })).rejects.toThrow("ORDER_AMOUNT_MISMATCH");
    expect(changes).toHaveLength(0);
  });
  it("preserves unrelated checkout behavior", async () => {
    record.event = false;
    expect(await prepareDecemberTossApproval("toss_live", input)).toBe(false);
    expect(changes).toHaveLength(0);
  });
  it("requires a grant matching both canonical user and product, not another owner's grant", async () => {
    const execute = vi.fn().mockResolvedValue([[], []]);
    await expect(assertDecemberGrant({ execute }, { couponId: 1, couponCode: "DEC2026-PERSONAL", productCode: "personal_deep", userId: 8, now: new Date(), lock: true })).rejects.toThrow("COUPON_DECEMBER_NOT_ISSUED");
    const query = new MySqlDialect().sqlToQuery(execute.mock.calls[0][0]);
    expect(query.params).toEqual(["december-report-2026", 8, "personal_deep", 1]); expect(query.sql).toContain("FOR UPDATE");
  });
  it("issues exactly three grants idempotently without customer mutations", async () => {
    const grants = new Map<string, any>();
    let insertCalls = 0;
    const tx = {
      execute: async (query: any) => {
        const code = new MySqlDialect().sqlToQuery(query).params[0];
        const offer = DECEMBER_REPORT_OFFERS.find(x => x.couponCode === code)!;
        return [[{ id: DECEMBER_REPORT_OFFERS.indexOf(offer) + 1, status: "active", assignedCustomerId: null, discountType: offer.discountType, discountValue: offer.discountValue, maxPerCustomer: 1, startsAt: DECEMBER_REPORT_STARTS_AT, endsAt: DECEMBER_REPORT_ENDS_AT }], []];
      },
      insert: (table: any) => { expect(table).toBe(decemberReportCouponGrants); return { values: (grant: any) => ({ onDuplicateKeyUpdate: async () => { insertCalls++; grants.set(`${grant.userId}:${grant.productCode}`, grant); } }) }; },
    };
    const db = {
      transaction: (fn: any) => fn(tx),
      select: () => { let table: any; const q: any = { from: (t: any) => { table = t; return q; }, innerJoin: () => q, where: async () => table === decemberReportCouponGrants ? [...grants.values()] : [] }; return q; },
    };
    mocks.getDb.mockResolvedValue(db);
    const first = await claimDecemberReportCoupons(8);
    const second = await claimDecemberReportCoupons(8);
    expect(first.offers.map(x => x.state)).toEqual(["issued", "issued", "issued"]);
    expect(second.offers.map(x => x.state)).toEqual(["issued", "issued", "issued"]);
    expect(grants.size).toBe(3); expect(insertCalls).toBe(6);
  });
});
