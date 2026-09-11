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
      result.coaching.conflictRecovery.mismatch,
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
    expect(trustExploration.coaching.dialogue.dontMessages.join(" ")).toContain("더 살펴보고 싶은 마음");
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
    expect(cardShifted.coaching.dialogue.dontMessages.join(" ")).not.toBe(base.coaching.dialogue.dontMessages.join(" "));
    expect(cardShifted.coaching.conflictRecovery.conflictStart).not.toBe(base.coaching.conflictRecovery.conflictStart);
    expect(cardShifted.coaching.practices[1]).not.toBe(base.coaching.practices[1]);
  });
});
