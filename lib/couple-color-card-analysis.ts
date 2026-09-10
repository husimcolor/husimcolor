import type { CardData } from "../constants/cardData";
import type { ColorData } from "../constants/colorData";

type ColorInput = Pick<ColorData, "id" | "korName" | "keywords" | "recovery" | "relStyle">;
type CardInput = Pick<CardData, "colorKor" | "shapeKor" | "energyTitle">;

const FALLBACK_COLOR: ColorInput = {
  id: "unknown",
  korName: "선택한 컬러",
  keywords: ["자기 이해", "관계의 균형"],
  recovery: "편안한 회복",
};

const FALLBACK_CARD: CardInput = {
  colorKor: "선택한 카드",
  shapeKor: "도형",
  energyTitle: "마음의 방향",
};

function cardName(card: CardInput) {
  return `${card.colorKor} ${card.shapeKor}`;
}

function objectParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  const hasFinalConsonant = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasFinalConsonant ? "을" : "를";
}

/**
 * 커플 세션 개인 결과용 통합 분석.
 * 기존 1단계 컬러 원본과 2단계 카드의 최종 선택값을 함께 살펴,
 * 개별 해석에 반복되지 않는 세 가지 통찰로 연결한다.
 * 카드별 상세 해석·코칭 메시지·회복 루틴은 이 함수에서 변경하지 않는다.
 */
export function buildCoupleColorCardIntegratedAnalysis(
  inputColors: readonly ColorInput[],
  inputCards: readonly CardInput[],
): string {
  const [primary = FALLBACK_COLOR, secondary = FALLBACK_COLOR, recovery = FALLBACK_COLOR] = inputColors;
  const [unconscious = FALLBACK_CARD, current = FALLBACK_CARD, future = FALLBACK_CARD] = inputCards;

  const colorNames = [primary.korName, secondary.korName, recovery.korName].join(" · ");
  const primaryKeyword = primary.keywords[0] ?? "자기 이해";
  const secondaryKeyword = secondary.keywords[0] ?? "관계의 균형";
  const recoveryKeyword = recovery.keywords[0] ?? "회복의 방향";
  const relationshipNeed = primary.relStyle?.[0] ?? "진심을 편안하게 나누는 관계";
  const expressionNeed = secondary.relStyle?.[1] ?? "서로의 마음을 확인하는 대화";

  const coreNeedParagraph = `${colorNames}의 흐름과 무의식 「${unconscious.energyTitle}」·현재 「${current.energyTitle}」가 함께 보여주는 핵심은 ${primaryKeyword}·${secondaryKeyword}·${recoveryKeyword}${objectParticle(recoveryKeyword)} 함께 중요하게 여기는 마음입니다. ${relationshipNeed} 태도와 ${expressionNeed} 기질도 함께 나타나, 이해받고 신뢰할 수 있는 연결을 바라는 욕구가 드러납니다.`;

  const innerOuterParagraph = `내면에서는 「${unconscious.energyTitle}」에 대한 바람이 크지만, 일상에서는 「${current.energyTitle}」 방식이 먼저 드러날 수 있습니다. 이 차이 때문에 실제보다 단단하거나 차분한 사람으로 보일 수 있으며, 그 안의 마음까지 알아차려질 때 더 깊은 연결을 느낄 수 있습니다.`;

  const directionParagraph = `다음 방향의 메시지는 「${future.energyTitle}」입니다. ${recovery.recovery}의 감각을 되찾으며 마음을 작은 말과 행동으로 확인해 가는 과정이, 지금 관계에서 서로를 이해하고 성장하는 데 편안한 방향이 될 수 있습니다.`;

  return [coreNeedParagraph, innerOuterParagraph, directionParagraph].join("\n\n");
}
