import { describe, expect, it } from "vitest";

import { CARD_DATA, CARD_SHAPES } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { generatePersonAnalysis, getRelationArchetype, type PersonSession } from "../constants/coupleData";
import { buildRomanticCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { buildRomanticRelationshipRoles } from "../lib/couple-romantic-relationship-roles";

const FAMILY_BY_COLOR: Record<string, string> = {
  red: "warm_active", orange: "warm_active", coral: "warm_active", magenta: "warm_active",
  pink: "warm_soft", peach: "warm_soft", beige: "warm_soft", cream: "warm_soft",
  gold: "warm_grounded", brown: "warm_grounded", terracotta: "warm_grounded",
  blue: "cool_clear", skyblue: "cool_clear", teal: "cool_clear", mint: "cool_clear",
  indigo: "cool_deep", violet: "cool_deep", black: "cool_deep", silver: "cool_deep", navy: "cool_deep",
  green: "nature", olive: "nature", sage: "nature", lavender: "nature",
  white: "neutral", yellow: "neutral",
};

function cycle<T>(items: readonly T[], start: number, count = 3): T[] {
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]!);
}

function sessionFor(colors: readonly (typeof COLOR_DATA)[number][]): PersonSession {
  return {
    info: { gender: "여성", faith: "무교" },
    colors: colors.map((color) => color.id),
    cards: [],
  };
}

describe("부부·연인 결과 4단계 문구 검수", () => {
  it("1단계: 25개 컬러의 세 컬러 개인 해석이 모두 생성되고 요청 문구를 사용한다", () => {
    COLOR_DATA.forEach((_, index) => {
      const analysis = generatePersonAnalysis(sessionFor(cycle(COLOR_DATA, index)), "A");
      expect(analysis.psychologyFlow.trim()).not.toBe("");
      expect(analysis.currentFlow.trim()).not.toBe("");
      expect(analysis.recoveryDirection.trim()).not.toBe("");
      expect(analysis.relationshipStyle.trim()).not.toBe("");
      expect(analysis.coachingMessage.trim()).not.toBe("");
    });
  });

  it("2단계: 심리카드 63장의 무의식·현재·회복·코칭·루틴 필드를 모두 확인한다", () => {
    expect(CARD_DATA).toHaveLength(63);
    expect(new Set(CARD_DATA.map((card) => card.id)).size).toBe(63);
    expect(new Set(CARD_DATA.map((card) => card.shape)).size).toBe(Object.keys(CARD_SHAPES).length);

    CARD_DATA.forEach((card) => {
      expect(card.psychologyFlow.trim(), `${card.id} unconscious reading`).not.toBe("");
      expect(card.personalityFlow.trim(), `${card.id} current reading`).not.toBe("");
      expect(card.recoveryDirection.trim(), `${card.id} recovery reading`).not.toBe("");
      expect(card.coachingMessage.trim(), `${card.id} coaching message`).not.toBe("");
      expect(card.closingLine.trim(), `${card.id} closing line`).not.toBe("");
      expect(card.wellness.tea.trim(), `${card.id} tea routine`).not.toBe("");
      expect(card.wellness.breath.trim(), `${card.id} breath routine`).not.toBe("");
      expect(card.wellness.routine.length, `${card.id} daily routines`).toBeGreaterThanOrEqual(2);
      const source = [
        card.psychologyFlow,
        card.personalityFlow,
        card.recoveryDirection,
        card.coachingMessage,
        card.closingLine,
        card.wellness.tea,
        card.wellness.breath,
        ...card.wellness.routine,
      ].join(" ");
      expect(source, `${card.id} keeps card-specific text`).not.toContain("격렬한 운동");
    });

    expect(CARD_DATA.find((card) => card.id === "red_inverted_triangle")?.recoveryDirection)
      .toContain("몸 상태에 맞는 운동이나 춤");
  });

  it("3단계: 25컬러와 63장 카드가 개인 통합 해석에서 세 문단으로 연결된다", () => {
    CARD_DATA.forEach((_, index) => {
      const colors = cycle(COLOR_DATA, index);
      const cards = cycle(CARD_DATA, index);
      const result = buildRomanticCoupleColorCardIntegratedAnalysis(colors, cards);
      expect(result.split("\n\n")).toHaveLength(3);
      expect(result).not.toContain("이해받고 신뢰할 수 있는 연결을 바라며");
      expect(result).not.toContain("선택한 카드");
    });
  });

  it("4단계: 역할·관계 통합·연인 회복 루틴에서 기계적 표현과 이전 식사 문구를 사용하지 않는다", () => {
    COLOR_DATA.forEach((_, index) => {
      const colorsA = cycle(COLOR_DATA, index);
      const colorsB = cycle(COLOR_DATA, index + 7);
      const cardsA = cycle(CARD_DATA, index);
      const cardsB = cycle(CARD_DATA, index + 13);
      const roles = buildRomanticRelationshipRoles({
        personA: { relationshipStyle: "", emotionExpression: "" },
        personB: { relationshipStyle: "", emotionExpression: "" },
        colorsA,
        colorsB,
        cardsA,
        cardsB,
      });
      const roleText = `${roles.personA.description} ${roles.personB.description}`;
      expect(roleText).not.toContain("이 역할에 더해집니다");
      expect(roleText).not.toContain("역할을 맡기 쉽습니다");

      const relation = getRelationArchetype(
        colorsA.map((color) => FAMILY_BY_COLOR[color.id]!) as any[],
        colorsB.map((color) => FAMILY_BY_COLOR[color.id]!) as any[],
        cardsA[2]?.shape,
        cardsB[2]?.shape,
        colorsA.map((color) => color.id),
        colorsB.map((color) => color.id),
        cardsA.map((card) => card.id),
        cardsB.map((card) => card.id),
        "연인",
      );
      const relationText = JSON.stringify(relation);
      expect(relationText).not.toContain("파도가 지나간 후 브런치");
    });

    const waveRelation = getRelationArchetype(
      ["warm_active", "warm_soft", "nature"] as any[],
      ["warm_soft", "cool_deep", "neutral"] as any[],
      "circle",
      "diamond",
      ["red", "pink", "green"],
      ["pink", "indigo", "yellow"],
      ["red_circle", "red_triangle", "red_inverted_triangle"],
      ["orange_square", "orange_diamond", "orange_pentagon"],
      "연인",
    );
    expect(JSON.stringify(waveRelation)).toContain("마음이 가라앉은 뒤 함께 식사하기");
  });
});
