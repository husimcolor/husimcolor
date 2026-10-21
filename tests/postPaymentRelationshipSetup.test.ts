import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("결제 후 부부·연인 관계 설정 계약", () => {
  it("관계·역할은 entitlement별 서버 설정으로 한 번만 확정하고 소비 전에 재검증한다", () => {
    const schema = read("drizzle/schema.ts");
    const service = read("server/commerce/entitlement-service.ts");
    expect(schema).toContain('"relationship_setups"');
    expect(schema).toContain('uniqueIndex("relationship_setups_entitlement_unique")');
    expect(service).toContain("RELATIONSHIP_SETUP_ALREADY_CONFIRMED");
    expect(service).toContain("await assertRelationshipSetup(tx");
    expect(service.indexOf("await assertRelationshipSetup(tx")).toBeLessThan(service.indexOf("const claimed = await tx"));
  });

  it("초대 세션은 A/B 역할을 암호화해 고정하고 제출 때도 역할·성별을 다시 검사한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const invite = read("app/(tabs)/relationship-invite.tsx");
    expect(service).toContain("assignedRoleEncrypted: encryptCommerceValue(input.roleA)");
    expect(service).toContain("assertAssignedRoleMatches");
    expect(invite).toContain("확정된 관계 역할");
    expect(invite).toContain("getRelationshipRoleGender(assignedRole)");
  });

  it("결제 전 부부·연인 선택에는 세부 관계·역할을 요구하지 않고 checkout 뒤 setup으로 이동한다", () => {
    const start = read("app/(tabs)/couple-start.tsx");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(start).toContain("const canProceed = selectedProductId === 'romantic' ? true");
    expect(start).toContain("다음 · 결제 정보 입력");
    expect(checkout).toContain('pathname: "/(tabs)/relationship-setup"');
    expect(checkout).toContain('productCode === \"couple_love_deep\"');
  });

  it("전환 이벤트는 민감 선택값 없이 strict allow-list·unique event key로 기록한다", () => {
    const router = read("server/routers.ts");
    const schema = read("drizzle/schema.ts");
    const freeResult = read("app/(tabs)/result.tsx");
    const premiumResult = read("app/(tabs)/premium-result.tsx");
    expect(router).toContain("conversionFunnel: router");
    expect(router).toContain(".strict()");
    expect(router).not.toContain("selectedColors: z.string");
    expect(router).not.toContain("selectedCards: z.string");
    expect(schema).toContain("commerce_funnel_events_event_key_unique");
    expect(freeResult).not.toContain("selectedColors: colorIds");
    expect(premiumResult).not.toContain("selectedCards: cardIds");
  });
});
