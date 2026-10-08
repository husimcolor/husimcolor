import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Production live payment provider migration", () => {
  it("uses an admin-gated additive enum migration and rejects Preview schemas", () => {
    const service = read("server/commerce/production-live-payment-migration-service.ts");
    const router = read("server/routers.ts");

    expect(service).toContain("PRODUCTION_SCHEMA_IDENTITY_REJECTED");
    expect(service).toContain("payment_transactions");
    expect(service).toContain("'toss_live'");
    expect(service).toContain("MODIFY COLUMN `provider` enum('test','toss_pg','toss_live','google_play','coupon') NOT NULL");
    expect(service).toContain("production_live_payment_provider_migrated");
    expect(router).toContain("applyProductionLivePaymentProvider: adminProcedure");
  });
});
