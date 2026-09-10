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

/**
 * 커플 세션 개인 결과용 통합 분석.
 * 기존 1단계 컬러 원본과 2단계 카드의 최종 선택값만 요약해 연결하며,
 * 카드별 상세 해석·코칭 메시지·회복 루틴은 이 함수에서 변경하지 않는다.
 */
export function buildCoupleColorCardIntegratedAnalysis(
  inputColors: readonly ColorInput[],
  inputCards: readonly CardInput[],
): string {
  const [primary = FALLBACK_COLOR, secondary = FALLBACK_COLOR, recovery = FALLBACK_COLOR] = inputColors;
  const [unconscious = FALLBACK_CARD, current = FALLBACK_CARD, future = FALLBACK_CARD] = inputCards;

  const colorNames = [primary.korName, secondary.korName, recovery.korName].join(" · ");
  const coreKeywords = [
    primary.keywords[0] ?? "자기 이해",
    secondary.keywords[0] ?? "관계의 균형",
    recovery.keywords[0] ?? "회복의 방향",
  ].join(" · ");
  const relationshipNeed = primary.relStyle?.[0] ?? "진심을 편안하게 나누는 관계";
  const expressionNeed = secondary.relStyle?.[1] ?? "서로의 마음을 확인하는 대화";

  const colorParagraph = `${colorNames}의 흐름에는 ${coreKeywords}을 중요하게 여기는 마음이 함께 나타납니다. 관계에서는 ${relationshipNeed}을 바라고, ${expressionNeed}이 있을 때 자신의 감정도 더 편안하게 드러날 수 있습니다.`;

  const cardParagraph = `무의식의 ${cardName(unconscious)}는 내면에서 「${unconscious.energyTitle}」을 바라는 흐름을, 현재의 ${cardName(current)}는 그 마음이 지금 「${current.energyTitle}」 방식으로 드러나는 모습을 비춥니다. 다음 방향의 ${cardName(future)}는 앞으로 「${future.energyTitle}」 쪽으로 마음이 움직이고 있음을 보여 줍니다.`;

  const needParagraph = `컬러와 카드 여섯 결과에 함께 나타나는 핵심 욕구는, ${recovery.recovery}의 감각을 되찾으며 이해받고 신뢰할 수 있는 방식으로 연결되고 싶은 마음입니다. 겉으로 보이는 반응보다 그 안에 있는 바람을 먼저 알아차릴 때 관계에서도 선택의 여지가 넓어질 수 있습니다.`;

  const directionParagraph = `속으로는 ${unconscious.energyTitle}을 오래 살피는 편인데, 현실에서는 ${current.energyTitle} 방식으로 표현되어 마음의 속도와 겉모습이 다르게 보일 수 있습니다. 지금은 ${future.energyTitle}을 서두르지 않고 관계 안에서 작은 말과 행동으로 확인해 보는 방향이 이 사람에게 가장 도움이 됩니다.`;

  return [colorParagraph, cardParagraph, needParagraph, directionParagraph].join("\n\n");
}
