import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("administrator test entitlements", () => {
  it("uses the existing customer and entitlement ledger without creating a payment order or coupon", () => {
    const service = read("server/commerce/admin-test-entitlement-service.ts");
    expect(service).toContain("customers, entitlements, products");
    expect(service).toContain('usageLimit: 1');
    expect(service).toContain('ADMIN_TEST_ENTITLEMENT_RECIPIENT_LIMIT');
    expect(service).toContain('ADMIN_TEST_ENTITLEMENT_VALIDITY_MS');
    expect(service).toContain('source: "admin"');
    expect(service).toContain('action: "admin_test_entitlement_issued"');
    expect(service).toContain('action: "admin_test_entitlement_revoked"');
    expect(service).not.toContain("paymentTransactions");
    expect(service).not.toContain("couponRedemptions");
    expect(service).not.toContain("orders,");
  });

  it("requires the existing password-admin procedure and keeps the link outside public product routes", () => {
    const router = read("server/routers.ts");
    const adminScreen = read("app/(tabs)/admin.tsx");
    const accessScreen = read("app/(tabs)/admin-test-access.tsx");
    expect(router).toContain("issueTestEntitlement: adminProcedure");
    expect(router).toContain("revokeTestEntitlement: adminProcedure");
    expect(adminScreen).toContain("테스트 이용권 발급");
    expect(adminScreen).toContain("최대 2명 · 7일 · 상품당 1회");
    expect(accessScreen).toContain("체험 이용권을 확인하고 있습니다.");
    expect(accessScreen).toContain("saveCommerceStartGrant");
    expect(adminScreen).toContain("관계 유형");
  });

  it("lets a valid entitlement grant pass the released UI gate while preserving the normal public closed gate", () => {
    const personal = read("app/(tabs)/premium-info.tsx");
    const relationship = read("app/(tabs)/couple-info.tsx");
    expect(personal).toContain("paidAnalysisPreparing && !hasStartGrant");
    expect(personal).toContain("getCommerceStartGrant('personal_deep')");
    expect(relationship).toContain("paidRelationPreparing && !hasStartGrant");
    expect(relationship).toContain("getCommerceStartGrant(paidProductCodeForRelation)");
    expect(relationship).toContain("removeCommerceStartGrant(paidProductCode)");
  });
});
