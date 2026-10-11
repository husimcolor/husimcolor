import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

const freeResult = read("app/(tabs)/result.tsx");
const personalResult = read("app/(tabs)/premium-result.tsx");
const premiumSelect = read("app/(tabs)/premium-select.tsx");
const premiumColorSelect = read("app/(tabs)/premium-color-select.tsx");
const checkout = read("app/(tabs)/commerce-checkout.tsx");

describe("현재 개인 심화분석 경로 정리", () => {
  it("무료 컬러 결과는 옛 결제 화면이 아니라 현재 개인 심화 상품 안내로 이동한다", () => {
    expect(freeResult).toContain("개인 심화분석 알아보기 →");
    expect(freeResult).toContain("/(tabs)/commerce-checkout?product=personal_deep");
    expect(freeResult).not.toContain("router.push('/payment' as any)");
    expect(freeResult).not.toContain("심화 코칭 전체 보기 (30,000원)");
  });

  it("유료 개인 결과에는 재결제·초기 오픈 체험 안내가 남지 않는다", () => {
    expect(personalResult).not.toContain("현재 초기 오픈 체험중입니다");
    expect(personalResult).not.toContain("공유와 후기를 남겨주시면 큰 도움이 됩니다");
    expect(personalResult).not.toContain("컬러+도형 심층 해석 (유료)");
    expect(personalResult).not.toContain('router.push("/payment" as any)');
  });

  it("중간 심화 선택 화면도 현재 상품 안내로만 되돌린다", () => {
    expect(premiumSelect).not.toContain('router.replace("/payment" as any)');
    expect(premiumColorSelect).not.toContain('router.replace("/payment" as any)');
    expect(premiumSelect).toContain('commerce-checkout?product=personal_deep');
    expect(premiumColorSelect).toContain('commerce-checkout?product=personal_deep');
  });

  it("현재 개인 심화 상품 안내는 구성과 오픈 기념 정가·할인가를 함께 보여 준다", () => {
    expect(checkout).toContain("컬러 3개와 심리카드 3장의 순서별 해석");
    expect(checkout).toContain("컬러별 상세 해석 · 세 컬러 통합 · 심리·성격·관계 성향");
    expect(checkout).toContain("OPENING_CAMPAIGN_COUPON_CODE");
    expect(checkout).toContain("쿠폰이 적용되었습니다");
    expect(checkout).toContain("결제 예정");
  });
});
