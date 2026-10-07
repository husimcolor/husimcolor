import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { getRelationArchetype } from "../constants/coupleData";

function buildRelationshipResult(relationType: "부부" | "연인") {
  const cardsA = CARD_DATA.slice(0, 3);
  const cardsB = CARD_DATA.slice(10, 13);

  return getRelationArchetype(
    ["warm_active", "cool_clear", "nature"],
    ["warm_soft", "cool_deep", "neutral"],
    cardsA[2]?.shape,
    cardsB[2]?.shape,
    ["red", "blue", "green"],
    ["pink", "indigo", "yellow"],
    cardsA.map((card) => card.id),
    cardsB.map((card) => card.id),
    relationType,
  );
}

describe("부부·연인 생활 장면 문맥", () => {
  it("같은 컬러·도형 신호를 유지하면서 부부는 공동생활 장면으로 읽는다", () => {
    const result = buildRelationshipResult("부부");
    const lifePattern = result.unifiedSections?.lifePattern;

    expect(lifePattern?.headline).toBe("공동생활에서 이런 리듬이 반복될 수 있습니다");
    expect(lifePattern?.items.map((item) => item.label)).toEqual([
      "생활비·공동 지출",
      "집안일·공동 공간",
      "퇴근 후·주말 회복 리듬",
      "퇴근 후 대화·애정 표현",
    ]);
    expect(lifePattern?.items[0]?.personA).toContain("레드 카드 영향");
    expect(lifePattern?.items[1]?.tension).toContain("청소");
    expect(result.togetherRoutine?.energyNote).toContain("함께 머무는 동안에도 서로의 마음을 확인하는 시간");
    expect(result.togetherRoutine?.energyNote).not.toContain("함께 없어도 연결되는");
  });

  it("연인은 비동거를 전제로 데이트·연락·각자의 공간 장면으로 읽는다", () => {
    const result = buildRelationshipResult("연인");
    const lifePattern = result.unifiedSections?.lifePattern;
    const resultText = JSON.stringify({
      lifePattern,
      profile: result.profileContrastOverride,
      core: result.unifiedSections?.coreEnergy,
      conflict: result.unifiedSections?.conflictFlow,
      connection: result.unifiedSections?.connectionFlow,
      growth: result.unifiedSections?.growthPoint,
      routine: result.togetherRoutine,
    });

    expect(lifePattern?.headline).toBe("만남과 연락 속에서 이런 리듬이 반복될 수 있습니다");
    expect(lifePattern?.items.map((item) => item.label)).toEqual([
      "데이트 비용·함께 쓰는 비용",
      "만남 준비·각자의 공간",
      "연락 빈도·각자의 시간",
      "답장 기대·만남 약속",
    ]);
    expect(lifePattern?.items[0]?.personA).toContain("레드 카드 영향");
    expect(lifePattern?.items[1]?.personA).toContain("약속과 준비");
    expect(lifePattern?.items[1]?.tension).toContain("만남 준비 부담");
    expect(resultText).not.toContain("같이 살면");
    expect(resultText).not.toContain("집안일");
    expect(resultText).not.toContain("청소");
    expect(resultText).not.toContain("잠자기 전");
    expect(resultText).not.toContain("함께 식사할 곳을 정하기처럼");
    expect(resultText).toContain("데이트 비용");
    expect(resultText).toContain("연락");
    expect(resultText).toContain("각자의 공간");
    expect(result.togetherRoutine?.energyNote).toContain("떨어져 있어도 연결되는");
  });

  it("여러 컬러 조합에서도 연인의 본문·루틴·생활 데이터에 공동생활 전제가 남지 않는다", () => {
    const cardsA = CARD_DATA.slice(0, 3);
    const cardsB = CARD_DATA.slice(10, 13);
    const samples = [
      { colorsA: ["red", "orange", "coral"], familiesA: ["warm_active", "warm_active", "warm_active"], colorsB: ["pink", "peach", "beige"], familiesB: ["warm_soft", "warm_soft", "warm_soft"] },
      { colorsA: ["white", "blue", "black"], familiesA: ["neutral", "cool_clear", "cool_deep"], colorsB: ["red", "yellow", "violet"], familiesB: ["warm_active", "neutral", "cool_deep"] },
      { colorsA: ["red", "blue", "black"], familiesA: ["warm_active", "cool_clear", "cool_deep"], colorsB: ["pink", "indigo", "yellow"], familiesB: ["warm_soft", "cool_deep", "neutral"] },
      { colorsA: ["gold", "brown", "terracotta"], familiesA: ["warm_grounded", "warm_grounded", "warm_grounded"], colorsB: ["blue", "skyblue", "mint"], familiesB: ["cool_clear", "cool_clear", "cool_clear"] },
    ] as const;
    const forbidden = ["같이 살면", "집안일", "청소", "가사", "생활비", "잠자기 전", "우리 집", "공동생활"];

    const archetypes = samples.map((sample) => {
      const result = getRelationArchetype(
        [...sample.familiesA],
        [...sample.familiesB],
        cardsA[2]?.shape,
        cardsB[2]?.shape,
        [...sample.colorsA],
        [...sample.colorsB],
        cardsA.map((card) => card.id),
        cardsB.map((card) => card.id),
        "연인",
      );
      const resultText = JSON.stringify(result);
      forbidden.forEach((word) => expect(resultText).not.toContain(word));
      return result.archetype;
    });

    expect(new Set(archetypes)).toEqual(new Set(["감정순환형", "거리조절형", "성장자극형", "현실균형형"]));
  });

  it("수정한 필수 오탈자는 관계 분석 원문에 남아 있지 않다", () => {
    const source = readFileSync(resolve(process.cwd(), "constants/coupleData.ts"), "utf8");

    ["한단계", "오늘 뒤", "쉽은", "따뜻게", "붙어있는", "뮨가", "엘기", "잠긄", "쉼자", "샰어", "더 싶어"].forEach((typo) => {
      expect(source).not.toContain(typo);
    });
  });
});
