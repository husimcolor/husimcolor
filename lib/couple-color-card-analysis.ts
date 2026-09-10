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

function objectParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  const hasFinalConsonant = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasFinalConsonant ? "을" : "를";
}

function displayKeyword(keyword: string) {
  return keyword.replaceAll("·", "과 ");
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

  const primaryKeyword = displayKeyword(primary.keywords[0] ?? "자기 이해");
  const secondaryKeyword = displayKeyword(secondary.keywords[0] ?? "관계의 균형");
  const recoveryKeyword = displayKeyword(recovery.keywords[0] ?? "회복의 방향");
  const relationshipNeed = primary.relStyle?.[0] ?? "진심을 편안하게 나누는 관계";
  const expressionNeed = secondary.relStyle?.[1] ?? "서로의 마음을 확인하는 대화";

  const coreNeedParagraph = `당신은 ${primaryKeyword}${objectParticle(primaryKeyword)} 소중히 여기고, ${secondaryKeyword}${objectParticle(secondaryKeyword)} 쉽게 놓치지 않는 편입니다. 마음 깊은 곳에서는 ${unconscious.energyTitle}에 가까운 바람이 살아 있어, 이해받고 신뢰할 수 있는 연결을 바라며 ${relationshipNeed} 관계 방식을 중요하게 여길 수 있습니다.`;

  const innerOuterParagraph = `겉으로는 ${current.energyTitle} 쪽으로 상황을 풀어가려는 모습이 먼저 보일 수 있습니다. ${expressionNeed} 방식에 익숙한 편이라, 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.`;

  const directionParagraph = `지금은 ${future.energyTitle}에 가까운 회복의 방향을 따라 ${recovery.recovery} 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. ${recoveryKeyword}${objectParticle(recoveryKeyword)} 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.`;

  return [coreNeedParagraph, innerOuterParagraph, directionParagraph].join("\n\n");
}
