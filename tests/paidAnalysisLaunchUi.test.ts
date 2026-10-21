import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");
const read = (relativePath: string) =>
  readFileSync(join(projectRoot, relativePath), "utf8");

describe("유료 분석 공개 결제 진입 UI", () => {
  it("홈은 유료 개인 심화분석의 가격과 결제·샘플 경로를 표시한다", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("29,000원");
    expect(source).toContain("product=personal_deep");
    expect(source).toContain("컬러 3개 + 심리카드 3장");
    expect(source).toContain("PDF 리포트");
  });

  it("관계 화면은 친구 무료 경로를 보존하면서 부부·연인 상품을 결제 후 설정으로 연결한다", () => {
    const source = read("app/(tabs)/couple-start.tsx");
    const setup = read("app/(tabs)/relationship-setup.tsx");
    expect(source).toContain('relationType: "친구"');
    expect(source).toContain('productId === "romantic"');
    expect(source).toContain("product=${paidProductCode}");
    expect(setup).toContain("컬러 선택 전에는 반드시 완료해야 합니다.");
    expect(source).toContain("const openPaidCheckout =");
    expect(source).toContain("openPaidCheckout(paidProductCode)");
    expect(source).not.toContain("다음 · 결제 정보 입력하기");
  });

  it("한 휴대폰 흐름은 결제 grant와 확정 역할을 보존해 시작한다", () => {
    const coupleInfo = read("app/(tabs)/couple-info.tsx");
    expect(coupleInfo).toContain("getCommerceStartGrant");
    expect(coupleInfo).toContain("relationshipRole: configuredRoleA");
    expect(coupleInfo).toContain("relationshipRole: configuredRoleB");
  });

  it("공개 테스트 운영에서는 홈·관계 상품·checkout에 실제 청구 없음 안내를 표시한다", () => {
    const home = read("app/(tabs)/index.tsx");
    const relationship = read("app/(tabs)/couple-start.tsx");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(home).toContain(
      "현재 테스트 운영 중 · Toss 테스트키 사용 · 실제 청구 없음",
    );
    expect(relationship).toContain(
      "현재 테스트 운영 중 · Toss 테스트키 사용 · 실제 청구 없음",
    );
    expect(checkout).toContain(
      "현재 테스트 운영 중입니다. Toss 테스트키로만 동작하며 실제 청구는 발생하지 않습니다.",
    );
  });
});
