import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import {
  buildParentChildRelationshipAnalysis,
  PARENT_CHILD_RELATIONSHIP_TYPE_IDS,
  type ParentChildRelationshipTypeId,
} from "../lib/parent-child-relationship-analysis";

const cards = ["red_circle", "white_square", "blue_diamond"]
  .map((id) => CARD_DATA.find((card) => card.id === id)!)
  .filter(Boolean);

function analyze(parentColors: string[], childColors: string[]) {
  return buildParentChildRelationshipAnalysis({
    relationType: "엄마-딸",
    parentGender: "여성",
    childGender: "여성",
    parent: { colors: parentColors, cards },
    child: { colors: childColors, cards },
  });
}

function cardsFor(ids: [string, string, string]) {
  return ids.map((id) => CARD_DATA.find((card) => card.id === id)!) as [typeof CARD_DATA[number], typeof CARD_DATA[number], typeof CARD_DATA[number]];
}

function analyzeRelationship(input: {
  relationType: "아빠-아들" | "아빠-딸" | "엄마-아들" | "엄마-딸";
  parentGender: "남성" | "여성";
  childGender: "남성" | "여성";
  parentColors: string[];
  childColors: string[];
  parentCards?: [string, string, string];
  childCards?: [string, string, string];
}) {
  return buildParentChildRelationshipAnalysis({
    relationType: input.relationType,
    parentGender: input.parentGender,
    childGender: input.childGender,
    parent: { colors: input.parentColors, cards: input.parentCards ? cardsFor(input.parentCards) : cards },
    child: { colors: input.childColors, cards: input.childCards ? cardsFor(input.childCards) : cards },
  });
}

describe("부모·자녀 1·2순위 컬러 관계 분석", () => {
  it("7개 관계 유형이 서로 다른 1·2순위 대표 조합에서 모두 도달 가능하다", () => {
    const representativeCases: Array<{ expected: ParentChildRelationshipTypeId; parent: string[]; child: string[] }> = [
      { expected: "steady_recovery", parent: ["green", "sage", "lavender"], child: ["olive", "beige", "coral"] },
      { expected: "emotional_connection", parent: ["pink", "peach", "blue"], child: ["orange", "pink", "green"] },
      { expected: "clarity_balance", parent: ["yellow", "teal", "lavender"], child: ["white", "silver", "peach"] },
      { expected: "vital_expansion", parent: ["red", "orange", "blue"], child: ["red", "magenta", "green"] },
      { expected: "space_respect", parent: ["indigo", "black", "green"], child: ["black", "silver", "pink"] },
      { expected: "trust_exploration", parent: ["green", "sage", "lavender"], child: ["yellow", "pink", "coral"] },
      { expected: "pace_adjustment", parent: ["red", "gold", "green"], child: ["green", "blue", "lavender"] },
    ];

    expect(representativeCases.map((item) => item.expected)).toEqual(PARENT_CHILD_RELATIONSHIP_TYPE_IDS);
    for (const item of representativeCases) {
      expect(analyze(item.parent, item.child).relationshipSummary.id).toBe(item.expected);
    }
  });

  it("3순위 회복 컬러와 심리카드 변화가 관계 유형·생활 장면의 주근거를 바꾸지 않는다", () => {
    const base = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const recoveryChanged = analyze(["green", "sage", "red"], ["yellow", "pink", "black"]);
    const currentCardsChanged = buildParentChildRelationshipAnalysis({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parent: { colors: ["green", "sage", "lavender"], cards: [CARD_DATA.find((card) => card.id === "orange_triangle")!, CARD_DATA.find((card) => card.id === "black_hexagon")!, CARD_DATA.find((card) => card.id === "purple_diamond")!] },
      child: { colors: ["yellow", "pink", "coral"], cards: [CARD_DATA.find((card) => card.id === "navy_square")!, CARD_DATA.find((card) => card.id === "red_circle")!, CARD_DATA.find((card) => card.id === "green_hexagon")!] },
    });

    expect(base.relationshipSummary.id).toBe("trust_exploration");
    expect(recoveryChanged.relationshipSummary.id).toBe(base.relationshipSummary.id);
    expect(currentCardsChanged.relationshipSummary.id).toBe(base.relationshipSummary.id);
    expect(recoveryChanged.lifeScenes.tensions[0].title).toBe(base.lifeScenes.tensions[0].title);
    expect(currentCardsChanged.lifeScenes.strengths[0].title).toBe(base.lifeScenes.strengths[0].title);
    expect(base.lifeScenes.strengths).toHaveLength(1);
    expect(base.lifeScenes.tensions).toHaveLength(1);

    const noSharedScene = analyze(["blue", "indigo", "lavender"], ["orange", "pink", "coral"]);
    expect(noSharedScene.lifeScenes.strengths).toHaveLength(0);
    expect(noSharedScene.lifeScenes.tensions).toHaveLength(1);
  });

  it("상단 요약·생활 장면·DO & DON'T·회복·실천을 같은 문장 묶음으로 반복하지 않는다", () => {
    const result = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const texts = [
      result.relationshipSummary.description,
      result.lifeScenes.strengths[0].description,
      result.lifeScenes.tensions[0].description,
      ...result.coaching.dialogue.doMessages,
      ...result.coaching.dialogue.dontMessages,
      result.coaching.conflictRecovery.recoveryOrder,
      ...result.coaching.practices,
    ];

    expect(new Set(texts).size).toBe(texts.length);
    expect(result.coaching.practices).toHaveLength(3);
    expect(result.coaching.dialogue.doMessages.join(" ")).not.toContain("기다려주기");
  });

  it("실제 관계 호칭과 핵심 기질의 조사를 자연스럽게 출력한다", () => {
    const result = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const output = [
      result.coaching.socialRoles.parent.description,
      result.coaching.socialRoles.child.description,
      result.coaching.relationshipRoles.parent.title,
      result.coaching.relationshipRoles.child.title,
      result.coaching.relationshipRoles.together,
      result.coaching.childCommunication.closesWhen,
      result.coaching.childCommunication.gainsConfidenceWhen,
      result.coaching.conflictRecovery.mismatch,
      result.coaching.conflictRecovery.conflictStart,
      ...result.coaching.dialogue.dontMessages,
      ...result.coaching.practices,
    ].join(" ");

    expect(output).toContain("엄마는");
    expect(output).toContain("딸이");
    expect(output).not.toContain("엄마은");
    expect(output).not.toContain("딸는");
    expect(output).not.toContain("엄마이");
    expect(output).not.toContain("지속성를");
  });

  it("DON'T·갈등 시작·세 가지 실천은 관계 유형과 1·2순위 교차에 따라 달라지며 같은 입력에는 재현된다", () => {
    const trustExploration = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const spaceRespect = analyze(["indigo", "black", "green"], ["black", "silver", "pink"]);
    const vitalExpansion = analyze(["red", "orange", "blue"], ["red", "magenta", "green"]);
    const repeatedTrustExploration = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);

    const donts = [
      trustExploration.coaching.dialogue.dontMessages.join(" "),
      spaceRespect.coaching.dialogue.dontMessages.join(" "),
      vitalExpansion.coaching.dialogue.dontMessages.join(" "),
    ];
    const starts = [
      trustExploration.coaching.conflictRecovery.conflictStart,
      spaceRespect.coaching.conflictRecovery.conflictStart,
      vitalExpansion.coaching.conflictRecovery.conflictStart,
    ];
    const practices = [
      trustExploration.coaching.practices.join(" "),
      spaceRespect.coaching.practices.join(" "),
      vitalExpansion.coaching.practices.join(" "),
    ];

    expect(new Set(donts).size).toBe(3);
    expect(new Set(starts).size).toBe(3);
    expect(new Set(practices).size).toBe(3);
    expect(trustExploration.coaching.dialogue.dontMessages.join(" ")).toContain("질문은 나중에 해");
    expect(spaceRespect.coaching.dialogue.dontMessages.join(" ")).toContain("혼자 정리할 시간");
    expect(vitalExpansion.coaching.conflictRecovery.conflictStart).toContain("새 시도와 표현");
    expect(trustExploration.coaching.practices).toEqual(repeatedTrustExploration.coaching.practices);
  });

  it("심리카드는 관계 유형을 바꾸지 않고 DON'T·갈등 시작·두 번째 실천의 현재 반응을 보완한다", () => {
    const base = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const cardShifted = buildParentChildRelationshipAnalysis({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parent: {
        colors: ["green", "sage", "lavender"],
        cards: [CARD_DATA.find((card) => card.id === "red_circle")!, CARD_DATA.find((card) => card.id === "orange_triangle")!, CARD_DATA.find((card) => card.id === "blue_diamond")!],
      },
      child: {
        colors: ["yellow", "pink", "coral"],
        cards: [CARD_DATA.find((card) => card.id === "yellow_circle")!, CARD_DATA.find((card) => card.id === "black_hexagon")!, CARD_DATA.find((card) => card.id === "green_hexagon")!],
      },
    });

    expect(cardShifted.relationshipSummary.id).toBe(base.relationshipSummary.id);
    expect(cardShifted.lifeScenes.tensions[0].title).toBe(base.lifeScenes.tensions[0].title);
    expect(cardShifted.coaching.dialogue.doMessages.join(" ")).not.toBe(base.coaching.dialogue.doMessages.join(" "));
    expect(cardShifted.coaching.dialogue.dontMessages.join(" ")).not.toBe(base.coaching.dialogue.dontMessages.join(" "));
    expect(cardShifted.coaching.conflictRecovery.conflictStart).not.toBe(base.coaching.conflictRecovery.conflictStart);
    expect(cardShifted.coaching.practices[1]).not.toBe(base.coaching.practices[1]);
  });

  it("네 부모·자녀 관계와 유사·상이 컬러·심리카드 흐름에서 트리거·강점 조건·교차 오해를 분리한다", () => {
    const similarColors = analyzeRelationship({
      relationType: "아빠-아들",
      parentGender: "남성",
      childGender: "남성",
      parentColors: ["green", "sage", "lavender"],
      childColors: ["olive", "beige", "coral"],
      parentCards: ["green_circle", "navy_square", "blue_diamond"],
      childCards: ["green_hexagon", "orange_circle", "blue_diamond"],
    });
    const differentColors = analyzeRelationship({
      relationType: "아빠-딸",
      parentGender: "남성",
      childGender: "여성",
      parentColors: ["red", "gold", "green"],
      childColors: ["green", "blue", "lavender"],
      parentCards: ["red_triangle", "red_circle", "green_hexagon"],
      childCards: ["blue_diamond", "white_square", "purple_diamond"],
    });
    const similarColorsDifferentCards = analyzeRelationship({
      relationType: "엄마-아들",
      parentGender: "여성",
      childGender: "남성",
      parentColors: ["pink", "peach", "blue"],
      childColors: ["orange", "pink", "green"],
      parentCards: ["purple_diamond", "black_hexagon", "blue_diamond"],
      childCards: ["yellow_circle", "red_triangle", "green_hexagon"],
    });
    const differentColorsSimilarCards = analyzeRelationship({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parentColors: ["green", "sage", "lavender"],
      childColors: ["yellow", "pink", "coral"],
      parentCards: ["red_circle", "white_square", "blue_diamond"],
      childCards: ["yellow_circle", "white_square", "blue_diamond"],
    });

    const results = [similarColors, differentColors, similarColorsDifferentCards, differentColorsSimilarCards];
    const closes = results.map((item) => item.coaching.childCommunication.closesWhen);
    const confidence = results.map((item) => item.coaching.childCommunication.gainsConfidenceWhen);
    const mismatches = results.map((item) => item.coaching.conflictRecovery.mismatch);

    expect(new Set(closes).size).toBe(4);
    expect(new Set(confidence).size).toBe(4);
    expect(new Set(mismatches).size).toBe(4);
    for (const result of results) {
      expect(result.coaching.childCommunication.closesWhen).not.toBe(result.coaching.childCommunication.gainsConfidenceWhen);
      expect(result.coaching.childCommunication.closesWhen).not.toBe(result.coaching.conflictRecovery.mismatch);
    }
    expect(similarColors.coaching.labels).toEqual({ parent: "아빠", child: "아들" });
    expect(differentColors.coaching.labels).toEqual({ parent: "아빠", child: "딸" });
    expect(similarColorsDifferentCards.coaching.labels).toEqual({ parent: "엄마", child: "아들" });
    expect(differentColorsSimilarCards.coaching.labels).toEqual({ parent: "엄마", child: "딸" });
  });

  it("컬러가 같은 조합에서 심리카드 흐름을 바꾸면 관계 유형은 유지하고 트리거·강점 조건의 보조 맥락만 달라진다", () => {
    const base = analyzeRelationship({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parentColors: ["green", "sage", "lavender"],
      childColors: ["yellow", "pink", "coral"],
      parentCards: ["red_circle", "white_square", "blue_diamond"],
      childCards: ["yellow_circle", "white_square", "blue_diamond"],
    });
    const cardChanged = analyzeRelationship({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parentColors: ["green", "sage", "lavender"],
      childColors: ["yellow", "pink", "coral"],
      parentCards: ["red_circle", "orange_triangle", "blue_diamond"],
      childCards: ["purple_diamond", "black_hexagon", "green_hexagon"],
    });

    expect(cardChanged.relationshipSummary.id).toBe(base.relationshipSummary.id);
    expect(cardChanged.coaching.childCommunication.closesWhen).not.toBe(base.coaching.childCommunication.closesWhen);
    expect(cardChanged.coaching.childCommunication.gainsConfidenceWhen).not.toBe(base.coaching.childCommunication.gainsConfidenceWhen);
    expect(cardChanged.coaching.conflictRecovery.mismatch).toBe(base.coaching.conflictRecovery.mismatch);
  });

  it("대화 DO & DON'T와 세 가지 실천은 카드명·분석 용어 없이 실제 생활 언어로 표시한다", () => {
    const result = analyzeRelationship({
      relationType: "엄마-딸",
      parentGender: "여성",
      childGender: "여성",
      parentColors: ["green", "sage", "lavender"],
      childColors: ["yellow", "pink", "coral"],
      parentCards: ["red_circle", "white_square", "blue_diamond"],
      childCards: ["yellow_circle", "purple_diamond", "green_hexagon"],
    });
    const dialogueAndPractices = [
      ...result.coaching.dialogue.doMessages,
      ...result.coaching.dialogue.dontMessages,
      ...result.coaching.practices,
    ].join(" ");

    expect(dialogueAndPractices).not.toMatch(/카드|컬러|무의식|현재 흐름|미래 카드|회복 방향/);
    expect(result.coaching.dialogue.dontMessages.every((message) => message.startsWith("“") && message.endsWith("”"))).toBe(true);
    expect(result.coaching.practices).toHaveLength(3);
  });

  it("관계가 어긋나는 지점은 핵심 오해만 설명하고 회복 방법은 회복 순서에 남긴다", () => {
    const result = analyze(["green", "sage", "lavender"], ["yellow", "pink", "coral"]);
    const mismatch = result.coaching.conflictRecovery.mismatch;
    const recoveryOrder = result.coaching.conflictRecovery.recoveryOrder;

    expect(mismatch.length).toBeLessThan(520);
    expect(mismatch).not.toMatch(/회복|미래 카드|3순위 컬러|심리카드/);
    expect(recoveryOrder).toContain("먼저");
    expect(recoveryOrder).toContain("다음으로");
  });
});
