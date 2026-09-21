import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");
const read = (relativePath: string) => readFileSync(join(projectRoot, relativePath), "utf8");

describe("유료 분석 정식 오픈 준비중 UI", () => {
  it("홈은 유료 개인 심화분석의 가격과 준비중 문구를 함께 표시한다", () => {
    const source = read("app/(tabs)/index.tsx");
    expect(source).toContain("29,000원");
    expect(source).toContain("정식 오픈 준비중");
    expect(source).toContain("disabled={!paidAnalysisPublicEnabled && !tossCardReviewEnabled}");
    expect(source).toContain("if (tossCardReviewEnabled) {");
    expect(source).toContain("product=personal_deep&review=toss-card-review");
  });

  it("관계 화면은 친구 무료 경로를 보존하면서 유료 관계 시작을 준비중으로 막는다", () => {
    const source = read("app/(tabs)/couple-start.tsx");
    expect(source).toContain("product.id !== 'friend' && !paidAnalysisPublicEnabled");
    expect(source).toContain("paidProductPreparing ? '정식 오픈 준비중'");
    expect(source).toContain("setRelationType('친구')");
    expect(source).toContain("if (paidProductCode && tossCardReviewEnabled) {");
    expect(source).toContain("review=toss-card-review");
  });

  it("직접 정보 입력 URL도 준비중 유료 검사 시작을 차단한다", () => {
    const premiumInfo = read("app/(tabs)/premium-info.tsx");
    const coupleInfo = read("app/(tabs)/couple-info.tsx");
    expect(premiumInfo).toContain("개인 심화분석은 정식 오픈 준비중입니다.");
    expect(coupleInfo).toContain("이 관계 심화분석은 정식 오픈 준비중입니다.");
    expect(coupleInfo).toContain("paidProductCodeForRelation");
  });
});
