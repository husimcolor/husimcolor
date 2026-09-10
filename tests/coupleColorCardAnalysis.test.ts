import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { getLightArchetype } from "../constants/coupleData";
import { buildCoupleColorCardIntegratedAnalysis } from "../lib/couple-color-card-analysis";
import { splitCoupleReadableParagraphs } from "../lib/couple-readable-text";
import { buildRomanticRelationTraits } from "../lib/couple-romantic-relation-traits";
import { buildRomanticRelationshipRoles } from "../lib/couple-romantic-relationship-roles";

describe("커플 개인 컬러 × 심리카드 통합 분석", () => {
  it("선택한 컬러 3개와 심리카드 3장의 흐름을 세 개의 새로운 의미 단위로 함께 연결한다", () => {
    const colors = ["pink", "lavender", "green"]
      .map((id) => COLOR_DATA.find((color) => color.id === id))
      .filter(Boolean) as (typeof COLOR_DATA)[number][];
    const cards = CARD_DATA.slice(0, 3);

    const analysis = buildCoupleColorCardIntegratedAnalysis(colors, cards);
    const paragraphs = analysis.split("\n\n");

    expect(paragraphs).toHaveLength(3);
    expect(analysis).toContain(cards[0].energyTitle);
    expect(analysis).toContain(cards[1].energyTitle);
    expect(analysis).toContain(cards[2].energyTitle);
    expect(analysis).not.toContain("핑크 · 라벤더 · 그린");
    expect(analysis).not.toContain("「");
    expect(analysis).not.toContain("」");
    expect(paragraphs.every((paragraph) => paragraph.split(/(?<=[.!?])\s+/).length >= 2)).toBe(true);
  });

  it("선택 조합이 달라지면 컬러와 카드 근거도 함께 달라진다", () => {
    const first = buildCoupleColorCardIntegratedAnalysis(COLOR_DATA.slice(0, 3), CARD_DATA.slice(0, 3));
    const second = buildCoupleColorCardIntegratedAnalysis(COLOR_DATA.slice(12, 15), CARD_DATA.slice(12, 15));

    expect(second).not.toBe(first);
    expect(second).toContain(CARD_DATA[12].energyTitle);
  });

  it("심리카드 실행 문장의 기존 가운데점 불릿을 안정적인 불릿으로 통일하고 문장 덩어리를 나눈다", () => {
    const cardWithActions = CARD_DATA.find((card) => card.id === "red_triangle");
    const paragraphs = splitCoupleReadableParagraphs(cardWithActions?.recoveryDirection);

    expect(paragraphs).toHaveLength(4);
    expect(paragraphs[0]).toContain("멈추는 용기도 필요합니다.");
    expect(paragraphs.slice(1).every((paragraph) => paragraph.startsWith("• "))).toBe(true);
    expect(paragraphs.join("\n")).not.toContain("\n· ");
  });

  it("기존 카드별 해석 아래에 새 통합 분석을 표시하고 A/B 다음 단계 흐름을 유지한다", () => {
    const screenSource = readFileSync(
      resolve(process.cwd(), "app/(tabs)/couple-card-result.tsx"),
      "utf8",
    );

    expect(screenSource).toContain("🌿 컬러 × 심리카드 통합 분석");
    expect(screenSource).toContain("buildCoupleColorCardIntegratedAnalysis(colors, cards)");
    expect(screenSource).toContain("핵심 심리와 욕구");
    expect(screenSource).toContain("겉모습과 내면의 흐름");
    expect(screenSource).toContain("관계·회복·성장 방향");
    expect(screenSource).toContain("integratedSectionText");
    expect(screenSource).toContain("function ReadableParagraphs");
    expect(screenSource).toContain("splitCoupleReadableParagraphs");
    expect(screenSource).toContain("<ReadableParagraphs text={section.text}");
    expect(screenSource).toContain("<ReadableParagraphs text={cardFlow.coaching}");
    expect(screenSource).toContain("<ReadableParagraphs text={cardFlow.routine}");
    expect(screenSource).toContain("readingText: { fontSize: 18");
    expect(screenSource).toContain("integratedSectionText: { fontSize: 18");
    expect(screenSource).toContain("lineHeight: 32");
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
    expect(colorResultSource).toContain("function ReadableParagraphs");
    expect(colorResultSource).toContain("text={analysis.complementColor.meaning}");
    expect(colorResultSource).toContain("text={analysis.coachingMessage}");
    expect(colorResultSource).toContain("cardContent: { fontSize: 18");
    expect(colorResultSource).toContain("complementMeaning: { fontSize: 18");
    expect(coupleResultSource).not.toContain("개인 마음 흐름");
    expect(coupleResultSource).not.toContain('title="현재 마음 흐름"');
    expect(coupleResultSource).not.toContain('title="보완 컬러"');
  });

  it("부부·연인 관계 온도 숫자와 점수 바 대신 A/B 실제 카드 흐름을 읽은 상호작용 중심 관계 특성을 표시한다", () => {
    const traits = buildRomanticRelationTraits({
      personA: { relationshipStyle: "따뜻한 말로 관계를 이어갑니다.", emotionExpression: "감정을 비교적 빠르게 표현합니다." },
      personB: { relationshipStyle: "신뢰가 쌓인 뒤 마음을 나눕니다.", emotionExpression: "생각을 정리한 뒤 표현합니다." },
      cardsA: CARD_DATA.slice(0, 3),
      cardsB: CARD_DATA.slice(10, 13),
      expressionDescription: "두 사람의 표현 속도에는 차이가 있습니다.",
      recoveryDescription: "각자의 회복 시간을 인정하는 것이 도움이 됩니다.",
    });
    const contrastingTraits = buildRomanticRelationTraits({
      personA: { relationshipStyle: "관계 안에서도 각자의 공간과 리듬을 존중합니다.", emotionExpression: "생각을 정리한 뒤 여유가 생기면 표현합니다." },
      personB: { relationshipStyle: "새로운 시도와 대화를 통해 관계를 움직이고 싶어 합니다.", emotionExpression: "감정을 비교적 빠르게 직접 표현합니다." },
      cardsA: CARD_DATA.slice(13, 16),
      cardsB: CARD_DATA.slice(3, 6),
      expressionDescription: "두 사람의 표현 속도에는 차이가 있습니다.",
      recoveryDescription: "각자의 회복 시간을 인정하는 것이 도움이 됩니다.",
    });
    const coupleResultSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(traits.map((trait) => trait.title)).toEqual(["감정 교류", "표현 리듬", "갈등 회복"]);
    const traitDescriptions = traits.map((trait) => trait.description).join(" ");
    expect(traitDescriptions).toContain("서로");
    expect(traitDescriptions).toContain("관계");
    expect(traitDescriptions).not.toContain(CARD_DATA[0].psychologyFlow.split(".")[0]);
    expect(traitDescriptions).not.toContain(CARD_DATA[12].recoveryDirection.split(".")[0]);
    expect(traitDescriptions).not.toContain("첫 번째 사람은");
    expect(traitDescriptions).not.toContain("두 번째 사람은");
    expect(traitDescriptions).not.toContain("따뜻한 말로 관계를 이어갑니다.");
    expect(traitDescriptions).not.toContain("신뢰가 쌓인 뒤 마음을 나눕니다.");
    expect(contrastingTraits.map((trait) => trait.description).join(" ")).not.toBe(traitDescriptions);
    expect(coupleResultSource).toContain("isRomanticRel &&");
    expect(coupleResultSource).toContain("buildRomanticRelationTraits");
    expect(coupleResultSource).not.toContain("관계 온도 지표");
    expect(coupleResultSource).not.toContain("temperatureGraph.emotionGap");
  });

  it("부부·연인 전용 역할 분석은 실제 A/B 컬러·카드 신호로 역할과 두 역할의 균형을 생성한다", () => {
    const roles = buildRomanticRelationshipRoles({
      personA: { relationshipStyle: "안정적이고 꾸준하게 관계를 이어갑니다.", emotionExpression: "감정을 정리한 뒤 표현합니다." },
      personB: { relationshipStyle: "따뜻하게 배려하며 관계를 이어갑니다.", emotionExpression: "감정을 직접 표현합니다." },
      cardsA: CARD_DATA.slice(0, 3),
      cardsB: CARD_DATA.slice(10, 13),
    });
    const coupleResultSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(roles.personA.title).not.toBe(roles.personB.title);
    expect(roles.together).toContain("역할");
    expect(coupleResultSource).toContain("두 사람의 관계 속 역할 분석");
    expect(coupleResultSource).toContain("두 역할이 만났을 때");
    expect(coupleResultSource).toContain("!archetypeResult.unifiedSections");
    expect(coupleResultSource).toContain("둘이 만났을 때 · 조율 포인트");
  });

  it("부부·연인만 심화 결과 경로를 사용하고 부모·자녀·친구·동료·형제자매는 기존 경량 결과를 유지한다", () => {
    const familiesA: Array<"warm_active"> = ["warm_active"];
    const familiesB: Array<"cool_deep"> = ["cool_deep"];
    const coupleResultSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(getLightArchetype("연인", familiesA, familiesB)).toBeNull();
    expect(getLightArchetype("부부", familiesA, familiesB)).toBeNull();
    expect(getLightArchetype("부모-자녀", familiesA, familiesB)).not.toBeNull();
    expect(getLightArchetype("친구", familiesA, familiesB)).not.toBeNull();
    expect(getLightArchetype("동료", familiesA, familiesB)).not.toBeNull();
    expect(getLightArchetype("형제자매", familiesA, familiesB)).not.toBeNull();
    expect(coupleResultSource).toContain("{lightArchetypeResult && (");
    expect(coupleResultSource).toContain("{!lightArchetypeResult && (");
    expect(coupleResultSource).toContain("const isRomanticRel = relationType === '연인' || relationType === '부부';");
  });

  it("부부·연인 웹 안내는 일반 스킨십 설명 없이 한 줄로 축소하고 섹션 구분 제목만 강화한다", () => {
    const coupleResultSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(coupleResultSource).toContain("신뢰와 존중을 확인하는 작은 말에서 관계가 더 편안해질 수 있습니다.");
    expect(coupleResultSource).toContain("styles.romanticPrincipleLine");
    expect(coupleResultSource).toContain("connectionFlow.skinshipNote");
    expect(coupleResultSource).toContain("styles.sectionGroupTitleRomantic");
    expect(coupleResultSource).toContain("isRomanticRel ? styles.sectionGroupTitleRomantic : styles.sectionGroupTitle");
    expect(coupleResultSource).not.toContain("부부관계에서 스킨십은");
    expect(coupleResultSource).not.toContain("자연스러운 애정표현과 스킨십은");
  });
});
