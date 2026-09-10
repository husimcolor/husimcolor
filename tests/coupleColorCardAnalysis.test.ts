import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { buildCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";

describe("커플 개인 컬러 × 심리카드 통합 분석", () => {
  it("선택한 컬러 3개와 심리카드 3장의 흐름을 네 개의 짧은 문단으로 함께 연결한다", () => {
    const colors = ["pink", "lavender", "green"]
      .map((id) => COLOR_DATA.find((color) => color.id === id))
      .filter(Boolean) as (typeof COLOR_DATA)[number][];
    const cards = CARD_DATA.slice(0, 3);

    const analysis = buildCoupleColorCardIntegratedAnalysis(colors, cards);
    const paragraphs = analysis.split("\n\n");

    expect(paragraphs).toHaveLength(4);
    expect(analysis).toContain("핑크 · 라벤더 · 그린");
    expect(analysis).toContain(`${cards[0].colorKor} ${cards[0].shapeKor}`);
    expect(analysis).toContain(`${cards[1].colorKor} ${cards[1].shapeKor}`);
    expect(analysis).toContain(`${cards[2].colorKor} ${cards[2].shapeKor}`);
    expect(analysis).toContain("핵심 욕구");
    expect(analysis).toContain("속으로는");
    expect(analysis).toContain("관계 안에서");
  });

  it("선택 조합이 달라지면 컬러와 카드 근거도 함께 달라진다", () => {
    const first = buildCoupleColorCardIntegratedAnalysis(COLOR_DATA.slice(0, 3), CARD_DATA.slice(0, 3));
    const second = buildCoupleColorCardIntegratedAnalysis(COLOR_DATA.slice(12, 15), CARD_DATA.slice(12, 15));

    expect(second).not.toBe(first);
    expect(second).toContain(COLOR_DATA[12].korName);
    expect(second).toContain(CARD_DATA[12].energyTitle);
  });

  it("기존 카드별 해석 아래에 새 통합 분석을 표시하고 A/B 다음 단계 흐름을 유지한다", () => {
    const screenSource = readFileSync(
      resolve(process.cwd(), "app/(tabs)/couple-card-result.tsx"),
      "utf8",
    );

    expect(screenSource).toContain("🌿 컬러 × 심리카드 통합 분석");
    expect(screenSource).toContain("buildCoupleColorCardIntegratedAnalysis(colors, cards)");
    expect(screenSource).toContain("pathname: '/(tabs)/couple-select'");
    expect(screenSource).toContain("router.push('/(tabs)/couple-result'");
  });

  it("개인 1단계에서는 보완 컬러를 회복 방향과 관계 성향 사이에 두고, 종합 결과에서는 개인 반복 영역을 제외한다", () => {
    const colorResultSource = readFileSync(
      resolve(process.cwd(), "app/(tabs)/couple-color-result.tsx"),
      "utf8",
    );
    const coupleResultSource = readFileSync(
      resolve(process.cwd(), "app/(tabs)/couple-result.tsx"),
      "utf8",
    );

    const recoveryIndex = colorResultSource.indexOf("🌱 회복 방향");
    const complementIndex = colorResultSource.indexOf("🎨 보완 컬러");
    const relationshipIndex = colorResultSource.indexOf("💚 관계 성향");

    expect(recoveryIndex).toBeGreaterThan(-1);
    expect(complementIndex).toBeGreaterThan(recoveryIndex);
    expect(relationshipIndex).toBeGreaterThan(complementIndex);
    expect(colorResultSource).toContain("analysis.complementColor.meaning");
    expect(colorResultSource).toContain("analysis.coachingMessage");
    expect(coupleResultSource).not.toContain("개인 마음 흐름");
    expect(coupleResultSource).not.toContain('title="현재 마음 흐름"');
    expect(coupleResultSource).not.toContain('title="보완 컬러"');
  });
});
