import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { getRelationArchetype } from "../constants/coupleData";
import { buildRomanticCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { ROMANTIC_COLOR_PROFILES } from "../lib/romantic-color-profile";
import { buildRomanticRelationTraits } from "../lib/couple-romantic-relation-traits";
import { buildRomanticRelationshipRoles } from "../lib/couple-romantic-relationship-roles";

const FAMILY_BY_COLOR: Record<string, string> = {
  red: "warm_active", orange: "warm_active", coral: "warm_active", magenta: "warm_active",
  pink: "warm_soft", peach: "warm_soft", beige: "warm_soft", cream: "warm_soft",
  gold: "warm_grounded", brown: "warm_grounded", terracotta: "warm_grounded",
  blue: "cool_clear", skyblue: "cool_clear", teal: "cool_clear", mint: "cool_clear",
  indigo: "cool_deep", violet: "cool_deep", black: "cool_deep", silver: "cool_deep",
  green: "nature", olive: "nature", sage: "nature", lavender: "nature",
  white: "neutral", yellow: "neutral",
};

const emptySignals = { relationshipStyle: "", emotionExpression: "" };
const forbiddenLoverHouseholdPhrases = ["같이 살면", "집안일", "청소", "가사", "생활비", "잠자기 전", "우리 집", "공동생활", "말 없이 옆에 있어주는", "조용히 옆에 있기"];

function threeColors(start: number) {
  return [COLOR_DATA[start], COLOR_DATA[(start + 1) % COLOR_DATA.length], COLOR_DATA[(start + 2) % COLOR_DATA.length]];
}

function threeCards(start: number) {
  return [CARD_DATA[start % CARD_DATA.length], CARD_DATA[(start + 7) % CARD_DATA.length], CARD_DATA[(start + 19) % CARD_DATA.length]];
}

describe("25컬러·심리카드·연인 문맥 전체 검수", () => {
  it("25개 컬러가 관계용 고유 근거를 모두 가지며, 원본 컬러 목록과 일치한다", () => {
    expect(Object.keys(ROMANTIC_COLOR_PROFILES).sort()).toEqual(COLOR_DATA.map((color) => color.id).sort());
    expect(new Set(Object.values(ROMANTIC_COLOR_PROFILES).map((profile) => profile.relationshipStrength)).size).toBe(COLOR_DATA.length);
  });

  it("각 컬러가 1·2·3순위 컬러와 카드 흐름을 보존한 개인 통합해석에 반영된다", () => {
    const outputs = COLOR_DATA.map((_, index) => {
      const output = buildRomanticCoupleColorCardIntegratedAnalysis(threeColors(index), threeCards(index));
      expect(output).not.toContain("선택한 컬러");
      expect(output).not.toContain("선택한 카드");
      expect(output.split("\n\n")).toHaveLength(3);
      return output;
    });

    expect(new Set(outputs).size).toBe(COLOR_DATA.length);
  });

  it("같은 컬러라도 카드 도형이 달라지면 무의식·현재·회복 해석의 구조가 달라진다", () => {
    const cardsByShape = ["circle", "triangle", "inverted_triangle", "square", "diamond", "pentagon", "hexagon"].map((shape) => {
      const card = CARD_DATA.find((item) => item.shape === shape);
      expect(card, `${shape} 카드 fixture`).toBeDefined();
      return card!;
    });
    const colors = [COLOR_DATA[0]!, COLOR_DATA[4]!, COLOR_DATA[10]!];
    const outputs = cardsByShape.map((card) => buildRomanticCoupleColorCardIntegratedAnalysis(colors, [card, card, card]));

    expect(new Set(outputs).size).toBe(cardsByShape.length);
    expect(outputs[0]).toContain("감정을 부드럽게 순환");
    expect(outputs[1]).toContain("필요한 방향을 세우");
    expect(outputs[2]).toContain("쌓인 감정을 안으로 가라앉");
    expect(outputs[3]).toContain("안정된 틀");
    expect(outputs[4]).toContain("균형을 섬세하게");
    expect(outputs[5]).toContain("성장");
    expect(outputs[6]).toContain("연결된 자리");
  });

  it("관계 역할과 특성은 컬러·카드·개인 신호를 함께 읽고, 내면 키워드 하나로 고정되지 않는다", () => {
    const cards = threeCards(0);
    const redRole = buildRomanticRelationshipRoles({
      personA: emptySignals,
      personB: emptySignals,
      colorsA: [COLOR_DATA.find((color) => color.id === "red")!],
      colorsB: [COLOR_DATA.find((color) => color.id === "blue")!],
      cardsA: cards,
      cardsB: cards,
    });
    const indigoRole = buildRomanticRelationshipRoles({
      personA: emptySignals,
      personB: emptySignals,
      colorsA: [COLOR_DATA.find((color) => color.id === "indigo")!],
      colorsB: [COLOR_DATA.find((color) => color.id === "blue")!],
      cardsA: cards,
      cardsB: cards,
    });

    expect(redRole.personA.title).toBe("관계를 움직이게 하는 역할");
    expect(indigoRole.personA.title).toBe("마음을 깊게 읽는 역할");
    expect(redRole.personA.description).toContain("레드");
    expect(redRole.personA.description).toContain("관계를 앞으로 나아가게 합니다.");
    expect(redRole.personA.description).not.toContain("이끕니다");
    expect(indigoRole.personA.description).toContain("인디고");
    expect(redRole.personA.description).toContain("속도를 먼저 확인");
    expect(indigoRole.personA.description).toContain("한 문장으로 꺼내");
  });

  it("25개 컬러 조합의 연인 결과는 관계 특성·생활 장면·루틴·마무리까지 비동거 문맥을 유지한다", () => {
    COLOR_DATA.forEach((color, index) => {
      const colorsA = threeColors(index);
      const colorsB = threeColors((index + 9) % COLOR_DATA.length);
      const cardsA = threeCards(index);
      const cardsB = threeCards(index + 11);
      const result = getRelationArchetype(
        colorsA.map((item) => FAMILY_BY_COLOR[item.id]!) as any[],
        colorsB.map((item) => FAMILY_BY_COLOR[item.id]!) as any[],
        cardsA[2]?.shape,
        cardsB[2]?.shape,
        colorsA.map((item) => item.id),
        colorsB.map((item) => item.id),
        cardsA.map((item) => item.id),
        cardsB.map((item) => item.id),
        "연인",
      );
      const resultText = JSON.stringify(result);
      forbiddenLoverHouseholdPhrases.forEach((phrase) => {
        expect(resultText, `${color.korName} 연인 결과에 ${phrase}가 남지 않아야 합니다`).not.toContain(phrase);
      });
      expect(resultText).toMatch(/데이트|연락|만남|각자의 공간/);
    });
  });

  it("관계 특성에는 두 사람의 주기질 컬러 근거가 함께 표시된다", () => {
    const colorsA = [
      COLOR_DATA.find((color) => color.id === "red")!,
      COLOR_DATA.find((color) => color.id === "pink")!,
      COLOR_DATA.find((color) => color.id === "yellow")!,
    ];
    const colorsB = [
      COLOR_DATA.find((color) => color.id === "blue")!,
      COLOR_DATA.find((color) => color.id === "peach")!,
      COLOR_DATA.find((color) => color.id === "green")!,
    ];
    const traits = buildRomanticRelationTraits({
      personA: emptySignals,
      personB: emptySignals,
      colorsA,
      colorsB,
      cardsA: threeCards(0),
      cardsB: threeCards(10),
      expressionDescription: "서로 다른 표현 리듬",
      recoveryDescription: "서로 다른 회복 리듬",
    });

    expect(traits[0]?.description).toContain("레드");
    expect(traits[0]?.description).toContain("블루");
    expect(traits[1]?.description).not.toContain("태도과");
    expect(traits[1]?.description).toContain("핑크");
    expect(traits[1]?.description).toContain("피치");
    expect(traits[2]?.description).toContain("옐로우");
    expect(traits[2]?.description).toContain("그린");
  });
});
