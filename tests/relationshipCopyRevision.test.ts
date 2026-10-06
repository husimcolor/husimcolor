import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { getRelationArchetype } from "../constants/coupleData";
import {
  buildRelationshipCardNarrative,
  buildRelationshipPersonCopy,
  reviseRomanticArchetype,
} from "../lib/relationship-copy-revision";

const colorsA = ["red", "blue", "green"].map((id) => COLOR_DATA.find((color) => color.id === id)!);
const colorsB = ["pink", "yellow", "mint"].map((id) => COLOR_DATA.find((color) => color.id === id)!);
const cardsA = CARD_DATA.slice(0, 3);
const cardsB = CARD_DATA.slice(10, 13);

function baseArchetype() {
  return getRelationArchetype(
    ["warm_active", "cool_clear", "nature"] as any,
    ["warm_soft", "neutral", "cool_clear"] as any,
    cardsA[2]?.shape,
    cardsB[2]?.shape,
    colorsA.map((color) => color.id),
    colorsB.map((color) => color.id),
    cardsA.map((card) => card.id),
    cardsB.map((card) => card.id),
  );
}

describe("부부·연인 관계분석 문구 개정", () => {
  it("개인 컬러 문구는 선택 컬러와 작은 실천을 연결하고 성격을 단정하지 않는다", () => {
    const copy = buildRelationshipPersonCopy(colorsA, "기독교");

    expect(copy.psychologyFlow).toContain("레드");
    expect(copy.currentFlow).toContain("블루");
    expect(copy.recoveryDirection).toContain("그린");
    expect(copy.relationshipStyle).toContain("성격의 확정이 아니라");
    expect(copy.coachingMessage).toContain("기도");
    expect(copy.psychologyFlow).not.toContain("당신은");
  });

  it("카드 위치별 문구는 같은 결론을 반복하지 않고 위치에 맞는 질문을 남긴다", () => {
    const inner = buildRelationshipCardNarrative(cardsA[0]!, "inner");
    const current = buildRelationshipCardNarrative(cardsA[1]!, "current");
    const recovery = buildRelationshipCardNarrative(cardsA[2]!, "recovery");

    expect(inner).toContain("카드는");
    expect(current).toContain("한 문장");
    expect(recovery).toContain("한 걸음");
    expect(new Set([inner, current, recovery]).size).toBe(3);
  });

  it("부부와 연인은 서로 다른 생활 장면과 실천을 제안한다", () => {
    const married = reviseRomanticArchetype(baseArchetype(), {
      relationType: "부부",
      colorsA,
      colorsB,
      cardsA,
      cardsB,
    });
    const dating = reviseRomanticArchetype(baseArchetype(), {
      relationType: "연인",
      colorsA,
      colorsB,
      cardsA,
      cardsB,
    });

    expect(married.unifiedSections?.lifePattern.headline).toContain("일상과 역할");
    expect(married.unifiedSections?.connectionFlow.actions.join(" ")).toContain("생활");
    expect(dating.unifiedSections?.lifePattern.headline).toContain("연락과 각자의 시간");
    expect(dating.unifiedSections?.connectionFlow.actions.join(" ")).toContain("연락");
    expect(married.unifiedSections?.coreEnergy.headline).toContain("레드");
    expect(dating.unifiedSections?.conflictFlow.danger).not.toContain("균형·안정·회복");
  });

  it("최종 통합 해석은 개인 문구를 단순 반복하지 않고 갈등 후 순서를 제시한다", () => {
    const result = reviseRomanticArchetype(baseArchetype(), {
      relationType: "부부",
      colorsA,
      colorsB,
      cardsA,
      cardsB,
    });
    const sections = result.unifiedSections!;

    expect(sections.conflictFlow.reaction).toContain("A는");
    expect(sections.connectionFlow.actions).toHaveLength(3);
    expect(sections.growthPoint.tip).toContain("오늘");
    expect(result.profileContrastOverride?.attractionContrast).toContain("레드");
    expect(result.profileContrastOverride?.attractionContrast).toContain("핑크");
  });

  it("새로운 결과 화면과 서버 PDF 생성 경로가 같은 개정 모듈을 사용한다", () => {
    const resultScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");
    const cardScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-card-result.tsx"), "utf8");
    const service = readFileSync(resolve(process.cwd(), "server/commerce/relationship-invite-service.ts"), "utf8");

    expect(resultScreen).toContain("reviseRomanticArchetype");
    expect(resultScreen).toContain("buildRelationshipCardNarrative");
    expect(cardScreen).toContain("buildRelationshipCardFlow");
    expect(service).toContain("reviseRomanticArchetype");
    expect(service).toContain("buildRelationshipCardNarrative");
    expect(service).toContain("buildRelationshipPersonCopy");
  });
});
