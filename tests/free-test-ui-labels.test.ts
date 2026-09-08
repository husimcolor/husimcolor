import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const selectScreen = readFileSync(`${root}/app/(tabs)/select.tsx`, "utf8");
const resultScreen = readFileSync(`${root}/app/(tabs)/result.tsx`, "utf8");
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, "utf8");

describe("무료 3컬러 테스트 역할 표기", () => {
  it("선택·홈·결과 화면에서 주기질, 보조기질, 회복방향을 사용한다", () => {
    for (const source of [selectScreen, resultScreen, homeScreen]) {
      expect(source).toContain("주기질");
      expect(source).toContain("보조기질");
      expect(source).toContain("회복방향");
    }
  });

  it("결과 해석 카드가 실제 선택 컬러의 역할과 설명을 함께 표시한다", () => {
    expect(resultScreen).toContain("function ColorContextBadge");
    expect(resultScreen).toContain("card: card1");
    expect(resultScreen).toContain("card: card2");
    expect(resultScreen).toContain("card={card3}");
    expect(resultScreen).toContain("나의 기본 성향");
    expect(resultScreen).toContain("나를 보완하는 성향");
    expect(resultScreen).toContain("지금 필요한 회복");
  });

  it("이전 무료 테스트 역할 명칭을 화면 코드에서 사용하지 않는다", () => {
    for (const source of [selectScreen, resultScreen, homeScreen]) {
      expect(source).not.toContain("무의식 / 내면 흐름");
      expect(source).not.toContain("무의식 / 내면 성향");
      expect(source).not.toContain("현재 상태 / 심리 흐름");
      expect(source).not.toContain("회복 방향 / 필요한 에너지");
    }
  });
});
