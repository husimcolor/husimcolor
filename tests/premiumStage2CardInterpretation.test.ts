import { describe, expect, it } from "vitest";

import { CARD_DATA, type CardData } from "../constants/cardData";
import {
  buildStage2CardInterpretations,
  buildStage2ColorBridge,
  getStage2CardInterpretation,
  STAGE2_CARD_KEYWORD_SOURCES,
} from "../constants/premiumStage2CardInterpretation";
import { COLOR_DATA } from "../constants/colorData";

const card = (id: string): CardData => {
  const found = CARD_DATA.find((item) => item.id === id);
  if (!found) throw new Error(`Missing fixture card: ${id}`);
  return found;
};

describe("premium stage 2 card interpretation engine", () => {
  it("keeps 63 cards within the existing color × shape data model and exposes three keyword grounds", () => {
    expect(CARD_DATA).toHaveLength(63);

    for (const item of CARD_DATA) {
      const colorKeywords = STAGE2_CARD_KEYWORD_SOURCES.COLOR_LENSES[item.color].keywords;
      const shapeKeywords = STAGE2_CARD_KEYWORD_SOURCES.SHAPE_LENSES[item.shape].keywords;
      expect(colorKeywords).toHaveLength(3);
      expect(shapeKeywords).toHaveLength(3);
    }
  });

  it("gives the three positions different questions, labels, and integrated narratives", () => {
    const interpretations = buildStage2CardInterpretations([
      card("navy_diamond"),
      card("orange_square"),
      card("green_hexagon"),
    ]);

    expect(interpretations.map((item) => item.role)).toEqual(["unconscious", "current", "recovery"]);
    expect(interpretations.map((item) => item.roleTitle)).toEqual([
      "마음 깊은 곳의 욕구",
      "지금의 마음과 삶의 흐름",
      "마음이 향하는 다음 방향",
    ]);
    expect(new Set(interpretations.map((item) => item.narrative)).size).toBe(3);
    expect(interpretations[0].cardLabel).toBe("네이비 × 마름모");
    expect(interpretations[2].cardLabel).toBe("그린 × 육각형");
  });

  it("uses short 생활언어 without the former abstract or directive patterns", () => {
    const forbidden = /마음 한편|힘을 이어주|흐름이 함께 보이|~해야|연습이 필요|결단이 필요/;

    for (const item of CARD_DATA) {
      for (const role of ["unconscious", "current", "recovery"] as const) {
        const interpretation = getStage2CardInterpretation(item, role);
        expect(interpretation.narrative).not.toMatch(forbidden);
        expect(interpretation.narrative.split(/[.!?]/).filter(Boolean).length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("uses the shape as the concrete condition or method of the color tendency instead of listing two card meanings", () => {
    const cases = [
      getStage2CardInterpretation(card("navy_diamond"), "unconscious"),
      getStage2CardInterpretation(card("red_triangle"), "current"),
      getStage2CardInterpretation(card("blue_inverted_triangle"), "recovery"),
    ];

    expect(cases[0].narrative).toContain("익숙한 답 하나로 서두르지 않을 때");
    expect(cases[1].narrative).toContain("그중에서도 우선순위를 정해");
    expect(cases[2].narrative).toContain("말 한마디로 속을 털어놓을 틈");
    expect(cases[0].narrative).toContain("그래서");
    expect(cases[1].narrative).toContain("그 과정에서");
    expect(cases[2].narrative).toContain("그러면서");
    expect(cases.every((item) => !/\.\s*(마음 한편|속으로는)/.test(item.narrative))).toBe(true);
  });

  it("does not leave a repeated closing verb when the color and shape are fused", () => {
    const interpretation = getStage2CardInterpretation(card("green_hexagon"), "recovery");
    expect(interpretation.narrative).toContain("방식을 고르려 합니다. 그러면서 믿을 사람과 부담을 나누며 함께 해나갈 길을 찾습니다.");
    expect((interpretation.narrative.match(/고르려 합니다/g) ?? [])).toHaveLength(1);
    expect((interpretation.narrative.match(/오래/g) ?? [])).toHaveLength(1);
  });

  it("does not duplicate a role transition already carried by the shape sentence", () => {
    const interpretation = getStage2CardInterpretation(card("white_circle"), "current");
    expect((interpretation.narrative.match(/그 과정에서/g) ?? [])).toHaveLength(1);
  });

  it("keeps recovery as a descriptive direction, not an instruction", () => {
    for (const item of CARD_DATA) {
      const recovery = getStage2CardInterpretation(item, "recovery").narrative;
      expect(recovery).not.toMatch(/해보세요|하세요|해야 합니다|연습|결단이 필요/);
    }
  });

  it("preserves the third card's distinct color and shape influence in the next-direction narrative", () => {
    const recoveries = CARD_DATA
      .filter((item) => item.shape === "square")
      .map((item) => getStage2CardInterpretation(item, "recovery").narrative);
    expect(new Set(recoveries).size).toBe(recoveries.length);

    const colors = ["red", "lavender", "cream"]
      .map((id) => COLOR_DATA.find((item) => item.id === id))
      .filter(Boolean) as typeof COLOR_DATA;
    expect(buildStage2ColorBridge(colors)).toContain("레드 · 라벤더 · 크림");
  });

  it("keeps all 238,266 ordered selections in the unconscious → current → next-direction sequence", () => {
    let checked = 0;

    for (const first of CARD_DATA) {
      for (const second of CARD_DATA) {
        if (second.id === first.id) continue;
        for (const third of CARD_DATA) {
          if (third.id === first.id || third.id === second.id) continue;
          const interpretations = buildStage2CardInterpretations([first, second, third]);

          expect(interpretations.map((item) => item.role)).toEqual(["unconscious", "current", "recovery"]);
          expect(interpretations[0].cardLabel).toBe(`${first.colorKor} × ${first.shapeKor}`);
          expect(interpretations[1].cardLabel).toBe(`${second.colorKor} × ${second.shapeKor}`);
          expect(interpretations[2].cardLabel).toBe(`${third.colorKor} × ${third.shapeKor}`);
          expect(new Set(interpretations.map((item) => item.narrative)).size).toBe(3);
          checked += 1;
        }
      }
    }

    expect(checked).toBe(63 * 62 * 61);
  });
});
