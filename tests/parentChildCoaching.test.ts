import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { generatePersonAnalysis, getLightArchetype } from "../constants/coupleData";
import { buildParentChildCoaching, getParentChildLabels } from "../lib/parent-child-coaching";

const familyA: Array<"warm_active"> = ["warm_active"];
const familyB: Array<"cool_deep"> = ["cool_deep"];

function buildCoaching(relationType: "아빠-아들" | "엄마-딸", parentColors: string[], childColors: string[]) {
  const parent = {
    info: { gender: relationType.startsWith("아빠") ? "남성" as const : "여성" as const, faith: "무교" as const },
    colors: parentColors,
    cards: ["red_circle", "white_square", "blue_diamond"],
  };
  const child = {
    info: { gender: relationType.endsWith("아들") ? "남성" as const : "여성" as const, faith: "무교" as const },
    colors: childColors,
    cards: ["yellow_circle", "purple_diamond", "green_hexagon"],
  };
  const light = getLightArchetype(relationType, familyA, familyB);
  if (!light) throw new Error("부모·자녀 경량 결과가 필요합니다.");

  return buildParentChildCoaching({
    relationType,
    parentGender: parent.info.gender,
    childGender: child.info.gender,
    parent: {
      colors: parent.colors,
      cards: parent.cards.map((id) => CARD_DATA.find((card) => card.id === id)!).filter(Boolean),
      analysis: generatePersonAnalysis(parent, "A"),
    },
    child: {
      colors: child.colors,
      cards: child.cards.map((id) => CARD_DATA.find((card) => card.id === id)!).filter(Boolean),
      analysis: generatePersonAnalysis(child, "B"),
    },
    lightArchetype: light,
  });
}

describe("부모·자녀 전용 종합 관계 코칭", () => {
  it("선택한 관계에 따라 실제 아빠·엄마와 아들·딸 호칭을 만든다", () => {
    expect(getParentChildLabels("아빠-아들")).toEqual({ parent: "아빠", child: "아들" });
    expect(getParentChildLabels("아빠-딸")).toEqual({ parent: "아빠", child: "딸" });
    expect(getParentChildLabels("엄마-아들")).toEqual({ parent: "엄마", child: "아들" });
    expect(getParentChildLabels("엄마-딸")).toEqual({ parent: "엄마", child: "딸" });
    expect(getParentChildLabels("부모-자녀", "여성", "남성")).toEqual({ parent: "엄마", child: "아들" });
  });

  it("기존 3컬러·3심리카드 신호로 각자 사회적 역할, 관계 역할, 자녀 소통과 대화 예문을 생성한다", () => {
    const coaching = buildCoaching("아빠-아들", ["red", "orange", "gold"], ["blue", "navy", "white"]);

    expect(coaching.labels).toEqual({ parent: "아빠", child: "아들" });
    expect(coaching.socialRoles.parent.title).toMatch(/형$/);
    expect(coaching.socialRoles.child.title).toMatch(/형$/);
    expect(coaching.relationshipRoles.together).toContain("아빠");
    expect(coaching.relationshipRoles.together).toContain("아들");
    expect(coaching.childCommunication.closesWhen.length).toBeGreaterThan(50);
    expect(coaching.childCommunication.gainsConfidenceWhen.length).toBeGreaterThan(50);
    expect(coaching.dialogue.doMessages).toHaveLength(4);
    expect(coaching.dialogue.dontMessages).toHaveLength(4);
  });

  it("조합이 달라지면 역할·소통 근거도 함께 달라지며, 부모·자녀 화면만 전용 구조를 사용한다", () => {
    const first = buildCoaching("아빠-아들", ["red", "orange", "gold"], ["blue", "navy", "white"]);
    const second = buildCoaching("엄마-딸", ["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(second.socialRoles.parent.title).not.toBe(first.socialRoles.parent.title);
    expect(second.childCommunication.closesWhen).not.toBe(first.childCommunication.closesWhen);
    expect(second.dialogue.doMessages).not.toEqual(first.dialogue.doMessages);
    expect(second.dialogue.dontMessages).not.toEqual(first.dialogue.dontMessages);
    expect(screenSource).toContain("isParentChildRel && parentChildCoaching");
    expect(screenSource).toContain("각자의 사회적 역할");
    expect(screenSource).toContain("우리 관계의 역할 에너지");
    expect(screenSource).toContain("자녀 기질 맞춤 소통");
    expect(screenSource).toContain("부모의 대화 DO & DON'T");
    expect(screenSource).toContain("!isParentChildRel &&");
    expect(screenSource).toContain("기존 경량 관계 분석 (친구·동료·형제자매)");
    expect(screenSource).not.toContain("title={isParentChildRel ? '이 관계가 오래 이어지는 이유'");
  });

  it("부모·자녀 전용 카드에만 명확한 텍스트 대비와 여유 있는 모바일 읽기 스타일을 적용한다", () => {
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(screenSource).toContain("variant=\"parentChild\"");
    expect(screenSource).toContain("parentChildRoleTitleOnLight: { color: '#342820' }");
    expect(screenSource).toContain("parentChildTogetherText: { color: '#3B2B50'");
    expect(screenSource).toContain("parentChildBodyText: { fontSize: 16, lineHeight: 29");
    expect(screenSource).toContain("isParentChildRel && styles.togetherRoutineTitleParentChild");
    expect(screenSource).toContain("isParentChildRel && styles.closingMessageParentChild");
    expect(screenSource).toContain("sectionGroupTitleRomantic");
  });
});
