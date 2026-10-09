import { describe, expect, it } from "vitest";

import { CARD_DATA, CARD_SHAPES } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { generateCoupleAnalysis, generatePersonAnalysis, getRelationArchetype, type PersonSession } from "../constants/coupleData";
import { buildRomanticCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { buildRomanticCardFlowContrast, buildRomanticCardRecoveryRoutine, buildRomanticRelationTraits } from "../lib/couple-romantic-relation-traits";
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

function hasFinalConsonant(value: string) {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
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

  it("1단계: 보완 컬러명 뒤의 은·는 조사를 실제 컬러명에 맞춰 연결한다", () => {
    COLOR_DATA.forEach((_, index) => {
      const analysis = generatePersonAnalysis(sessionFor(cycle(COLOR_DATA, index)), "A");
      const name = analysis.complementColor.korName;
      const expectedParticle = hasFinalConsonant(name) ? "은" : "는";
      const wrongParticle = expectedParticle === "은" ? "는" : "은";

      expect(analysis.complementColor.meaning, `${name} topic particle`)
        .toContain(`${name}${expectedParticle}`);
      expect(analysis.complementColor.meaning, `${name} avoids wrong topic particle`)
        .not.toContain(`${name}${wrongParticle}`);
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
      cards.forEach((card) => {
        expect(result).toContain(`${card.colorKor} ${card.shapeKor}의 ${card.energyTitle}`);
      });
    });
  });

  it("3단계: 63장 카드의 무의식·현재·회복 위치와 제목이 컬러 흐름에 연결된다", () => {
    const colors = cycle(COLOR_DATA, 0);
    CARD_DATA.forEach((card) => {
      const result = buildRomanticCoupleColorCardIntegratedAnalysis(colors, [card, card, card]);
      expect(result).toContain(`${card.colorKor} ${card.shapeKor}의 ${card.energyTitle}`);
      expect(result).toContain("무의식 카드인");
      expect(result).toContain("현재 흐름 카드인");
      expect(result).toContain("회복 방향 카드인");
      expect(result).not.toContain(`${card.energyTitle}은`);
      expect(result).not.toContain(`${card.energyTitle}는`);
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
      const roleText = `${roles.personA.description} ${roles.personB.description} ${roles.together}`;
      expect(roleText).not.toContain("이 역할에 더해집니다");
      expect(roleText).not.toContain("역할을 맡기 쉽습니다");
      expect(roleText).not.toContain("맡기 쉽습니다");

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

  it("4단계: 25컬러 fallback 관계 특성은 컬러명과 관계 강점의 조사를 자연스럽게 연결한다", () => {
    COLOR_DATA.forEach((_, index) => {
      const colorsA = cycle(COLOR_DATA, index);
      const colorsB = cycle(COLOR_DATA, index + 7);
      const traits = buildRomanticRelationTraits({
        personA: { relationshipStyle: "", emotionExpression: "" },
        personB: { relationshipStyle: "", emotionExpression: "" },
        colorsA,
        colorsB,
        cardsA: [],
        cardsB: [],
        expressionDescription: "",
        recoveryDescription: "",
        relationType: "연인",
      });
      const text = traits.map((trait) => trait.description).join(" ");
      [...colorsA, ...colorsB].forEach((color) => {
        const wrongParticle = hasFinalConsonant(color.korName) ? "는" : "은";
        expect(text, `${color.korName} particle`).not.toContain(`${color.korName}${wrongParticle}`);
      });
      expect(text).not.toContain("에너지이");
      expect(text).not.toContain("집안일");
      expect(text).toContain("연락과 만남");
      expect(text).toContain("무의식 카드에서");
      expect(text).toContain("현재 흐름 카드에서");
      expect(text).toContain("회복 방향 카드에서");
      expect(text).not.toContain("카드는 \"");
    });
  });

  it("4단계: 두 사람이 같은 컬러 흐름을 가질 때는 역할을 강제 분리하거나 같은 문장을 반복하지 않는다", () => {
    COLOR_DATA.forEach((_, index) => {
      const colors = cycle(COLOR_DATA, index);
      const traits = buildRomanticRelationTraits({
        personA: { relationshipStyle: "", emotionExpression: "" },
        personB: { relationshipStyle: "", emotionExpression: "" },
        colorsA: colors,
        colorsB: colors,
        cardsA: [],
        cardsB: [],
        expressionDescription: "",
        recoveryDescription: "",
        relationType: "연인",
      });
      expect(traits[0]?.description).toContain(`두 사람 모두 ${colors[0]?.korName}의`);
      expect(traits[1]?.description).toContain(`두 사람 모두 ${colors[1]?.korName}의`);
      expect(traits[2]?.description).toContain(`두 사람 모두 ${colors[2]?.korName}의`);
      expect(traits[0]?.description).not.toContain("마음을 드러내고, ");
      expect(traits[1]?.description).not.toContain("방식으로, ");
    });
  });

  it("4단계: 관계 통합 설명은 결제·제출 순서 대신 입력한 실제 역할을 사용한다", () => {
    const personA: PersonSession = {
      info: { gender: "여성", faith: "무교", relationshipRole: "아내" },
      colors: ["red", "blue", "green"],
      cards: ["red_circle", "red_triangle", "red_inverted_triangle"],
    };
    const personB: PersonSession = {
      info: { gender: "남성", faith: "무교", relationshipRole: "남편" },
      colors: ["pink", "indigo", "yellow"],
      cards: ["orange_square", "orange_diamond", "orange_pentagon"],
    };
    const analysis = generateCoupleAnalysis(
      { relationType: "부부", personA, personB },
      generatePersonAnalysis(personA, "A"),
      generatePersonAnalysis(personB, "B"),
    );

    expect(analysis.profileContrast).toContain("아내는");
    expect(analysis.profileContrast).toContain("남편은");
    expect(analysis.profileContrast).not.toContain("첫 번째 사람");
    expect(analysis.profileContrast).not.toContain("두 번째 사람");
  });

  it("실제 부부 조합은 현재 카드와 회복 카드를 구분하고 생활 문장을 짧게 유지한다", () => {
    const colorsA = ["magenta", "lavender", "teal"].map((id) => COLOR_DATA.find((color) => color.id === id)!);
    const colorsB = ["green", "blue", "orange"].map((id) => COLOR_DATA.find((color) => color.id === id)!);
    const cardsA = ["white_pentagon", "yellow_circle", "purple_triangle"].map((id) => CARD_DATA.find((card) => card.id === id)!);
    const cardsB = ["purple_circle", "red_inverted_triangle", "white_hexagon"].map((id) => CARD_DATA.find((card) => card.id === id)!);

    const personA = generatePersonAnalysis({ info: { gender: "남성", faith: "무교", relationshipRole: "남편" }, colors: colorsA.map((color) => color.id), cards: cardsA.map((card) => card.id) }, "A");
    const personB = generatePersonAnalysis({ info: { gender: "여성", faith: "무교", relationshipRole: "아내" }, colors: colorsB.map((color) => color.id), cards: cardsB.map((card) => card.id) }, "B");
    const integrated = buildRomanticCoupleColorCardIntegratedAnalysis(colorsA, cardsA);
    const traits = buildRomanticRelationTraits({
      personA,
      personB,
      colorsA,
      colorsB,
      cardsA,
      cardsB,
      expressionDescription: "",
      recoveryDescription: "",
      relationType: "부부",
      personLabels: { personA: "남편", personB: "아내" },
    });
    const contrast = buildRomanticCardFlowContrast({ cardsA, cardsB, personLabels: { personA: "남편", personB: "아내" } });
    const recoveryRoutine = buildRomanticCardRecoveryRoutine(cardsA, cardsB);
    const relation = getRelationArchetype(
      ["warm_active", "nature", "cool_clear"] as any[],
      ["nature", "cool_clear", "warm_active"] as any[],
      cardsA[2]?.shape,
      cardsB[2]?.shape,
      colorsA.map((color) => color.id),
      colorsB.map((color) => color.id),
      cardsA.map((card) => card.id),
      cardsB.map((card) => card.id),
      "부부",
    );
    const lifeText = JSON.stringify(relation.unifiedSections?.lifePattern);
    const traitText = traits.map((trait) => trait.description).join(" ");

    expect(integrated).toContain("상황을 정리해 균형 잡힌 판단을 하려는 흐름");
    expect(integrated).toContain("짧은 성찰과 실천으로 삶의 의미를 일상과 잇는 일");
    expect(personA.relationshipStyle).toContain("진심과 활기를 나누고 싶어 하는 성향");
    expect(personA.relationshipStyle).toContain("감정을 바로 앞세우기보다 상황을 정리하고 균형을 살핀 뒤");
    expect(personA.relationshipStyle).toContain("중요했던 마음을 성찰해 작은 대화나 실천으로 이어갈 때");
    expect(personA.relationshipStyle).not.toContain("감정을 직접 표현하며 관계를 이끌어가는 성향");
    expect(personA.emotionExpression).toContain("반응을 서두르기보다 상황을 정리해 균형 잡힌 판단");
    expect(traitText).toContain("남편은 상황을 정리해 균형을 찾으려는 흐름");
    expect(traitText).toContain("아내는 쌓인 감정을 안전하게 꺼내며 내면을 정리하려는 흐름");
    expect(traitText).toContain("아내는 불필요한 긴장을 덜고 진실한 연결의 기준을 가볍게 정돈하려는 흐름");
    expect(contrast).toContain("무의식의 바탕에서 남편은 여러 새 시작을 하나의 방향으로 묶고 싶은 마음");
    expect(contrast).toContain("현재 대화에서는 남편은 상황을 정리해 균형을 찾으려는 편이고");
    expect(contrast).toContain("갈등이나 피로 뒤에는 남편은 삶의 의미를 작은 성찰과 실천에 연결하려는 쪽으로");
    expect(recoveryRoutine?.routines).toEqual([
      "그날 중요했던 한 가지를 각자 한 문장으로 적거나 말하기",
      "이번 주에 덜어낼 기대 하나와 지킬 약속 하나 정하기",
      "서로 마음이 편안할 때 10분만 다시 이야기하기",
    ]);
    expect(lifeText).toContain("필요와 예산을 비교해 균형 있게 판단하려는 편입니다.");
    expect(lifeText).toContain("덜어낼 한 가지와 지킬 한 가지");
    expect(lifeText).not.toContain("나가서 뭔가 하면");
    expect(lifeText).not.toContain("자연 속에서 천천히 회복해");
    expect(JSON.stringify(relation.unifiedSections)).not.toContain("싸워도 결국");
    expect(JSON.stringify(relation.unifiedSections)).toContain("서로 원하고 편안할 때 선택할 수 있는 연결 방식");
  });
});
