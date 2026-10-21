import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("결제 후 관계·역할 설정 계약", () => {
  it("두 유료 관계 상품은 entitlement별 서버 설정으로 한 번만 확정하고 소비 전에 재검증한다", () => {
    const schema = read("drizzle/schema.ts");
    const service = read("server/commerce/entitlement-service.ts");
    expect(schema).toContain('"relationship_setups"');
    expect(schema).toContain(
      'uniqueIndex("relationship_setups_entitlement_unique")',
    );
    expect(service).toContain('"couple_love_deep" | "parent_child_deep"');
    expect(service).toContain('relationType === "부모-자녀"');
    expect(service).toContain("RELATIONSHIP_SETUP_ALREADY_CONFIRMED");
    expect(service).toContain("await assertRelationshipSetup(tx");
    expect(service.indexOf("await assertRelationshipSetup(tx")).toBeLessThan(
      service.indexOf("const claimed = await tx"),
    );
    expect(service).toContain(
      "gt(entitlements.usageLimit, entitlements.usedCount)",
    );
  });

  it("상품 선택 화면은 부부·연인과 부모·자녀 모두 상품만 선택해 결제 정보로 이동한다", () => {
    const start = read("app/(tabs)/couple-start.tsx");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(start).toContain("const getPaidProductCode =");
    expect(start).toContain("const handleProductPress =");
    expect(start).toContain("openPaidCheckout(paidProductCode)");
    expect(start).toContain("product=${paidProductCode}");
    expect(start).toContain('selectedProductId === "friend"');
    expect(start).toContain('if (restoreProductId === "friend")');
    expect(start).toContain('restoreProduct: selectedProductId === "friend" ? "friend" : ""');
    expect(start).not.toContain("setSelectedProductId(product.id)");
    expect(start).not.toContain("다음 · 결제 정보 입력하기");
    expect(start).not.toContain("requestPayment");
    expect(start).toContain('"parent_child_deep"');
    expect(start).not.toContain("PARENT_CHILD_COMBOS");
    expect(start).not.toContain("아빠 ↔ 아들");
    expect(checkout).toContain('productCode === "couple_love_deep"');
    expect(checkout).toContain('productCode === "parent_child_deep"');
    expect(checkout).toContain('pathname: "/(tabs)/relationship-setup"');
    expect(checkout).toContain("주문 확인과 완성된 PDF 리포트를 받을 이메일입니다.");
  });

  it("post-payment setup은 부모·자녀의 두 역할과 첫 참여자를 명시적으로 요구하고 임의 기본값을 두지 않는다", () => {
    const setup = read("app/(tabs)/relationship-setup.tsx");
    const mode = read("app/(tabs)/relationship-mode.tsx");
    expect(setup).toContain(
      'const PARENT_ROLES: readonly ParentRole[] = ["아빠", "엄마"]',
    );
    expect(setup).toContain(
      'const CHILD_ROLES: readonly ChildRole[] = ["아들", "딸"]',
    );
    expect(setup).toContain("먼저 컬러를 선택할 사람");
    expect(setup).toContain(
      "isRelationshipRolePairValid(relationType, roleA, roleB)",
    );
    expect(setup).toContain("relationshipSetup.useQuery");
    expect(mode).toContain("validProduct && Boolean(accessToken)");
    expect(mode).toContain("server setup만 역할의 원천");
  });

  it("초대 세션은 두 유료 관계 상품의 A/B 역할을 암호화해 고정하고 제출 때 역할·성별을 다시 검사한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const invite = read("app/(tabs)/relationship-invite.tsx");
    expect(service).toContain("paidRelationshipNeedsRolePair");
    expect(service).toContain(
      "assignedRoleEncrypted: encryptCommerceValue(input.roleA)",
    );
    expect(service).toContain("assertAssignedRoleMatches");
    expect(invite).toContain("확정된 관계 역할");
    expect(invite).toContain("getRelationshipRoleGender(assignedRole)");
  });

  it("한 휴대폰 부모·자녀 결과와 PDF는 검사 A/B 순서가 아니라 확정 역할을 사용한다", () => {
    const info = read("app/(tabs)/couple-info.tsx");
    const result = read("app/(tabs)/couple-result.tsx");
    expect(info).toContain("resolveRoleBasedRelationType");
    expect(info).toContain("const sessionRelationType");
    expect(result).toContain(
      "const parentCards = isPersonAParent ? cardsA : cardsB",
    );
    expect(result).toContain(
      "const childCards = isPersonAParent ? cardsB : cardsA",
    );
    expect(result).toContain("${parentCards[1]?.energyTitle");
    expect(result).toContain("${childCards[1]?.energyTitle");
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
