import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Production 공개 테스트 운영 설정", () => {
  it("명시적 workflow_dispatch 확인 없이는 Production migration을 실행하지 않는다", () => {
    const workflow = read(".github/workflows/production-commerce-config.yml");
    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("APPLY_PRODUCTION_TEST_CAMPAIGN");
    expect(workflow).toContain("if: github.event.inputs.confirmation == 'APPLY_PRODUCTION_TEST_CAMPAIGN'");
  });

  it("migration은 additive targeted-coupon column과 공개 20% 행사만 구성한다", () => {
    const script = read("scripts/apply-production-opening-campaign.mjs");
    const service = read("server/commerce/production-opening-campaign-config-service.ts");
    expect(script).toContain("ADD COLUMN `assignedCustomerId` int NULL");
    expect(script).toContain("CREATE INDEX `coupons_assigned_customer_idx`");
    expect(script).toContain("discountValue = 20");
    expect(script).toContain("maxRedemptions = NULL");
    expect(script).toContain("maxPerCustomer = NULL");
    expect(script).toContain('"personal_deep", "couple_love_deep", "parent_child_deep"');
    expect(script).not.toContain("DROP TABLE");
    expect(script).not.toContain("DELETE FROM");
    expect(service).toContain("PRODUCTION_SCHEMA_IDENTITY_REJECTED");
    expect(service).toContain("ALTER TABLE `coupons` ADD COLUMN `assignedCustomerId` int NULL");
    expect(service).toContain("CREATE INDEX `coupons_assigned_customer_idx`");
    expect(service).toContain('action: "production_opening_campaign_configured"');
  });
});
