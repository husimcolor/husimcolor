import type { CardData } from "../constants/cardData";
import type { ColorData } from "../constants/colorData";

type ColorInput = Pick<ColorData, "id" | "korName" | "keywords" | "recovery" | "relStyle">;
type CardInput = Pick<
  CardData,
  "colorKor" | "shapeKor" | "shape" | "energyTitle" | "psychologyFlow" | "personalityFlow" | "recoveryDirection"
>;

const FALLBACK_COLOR: ColorInput = {
  id: "unknown",
  korName: "선택한 컬러",
  keywords: ["자기 이해", "관계의 균형"],
  recovery: "편안한 회복",
};

const FALLBACK_CARD: CardInput = {
  colorKor: "선택한 카드",
  shapeKor: "도형",
  shape: "circle",
  energyTitle: "마음의 방향",
  psychologyFlow: "마음속 흐름을 차분히 살피고 싶은 마음이 있습니다.",
  personalityFlow: "현재의 마음을 자신에게 맞는 속도로 정리하고 있습니다.",
  recoveryDirection: "지금의 마음을 편안히 돌보는 것이 회복에 도움이 됩니다.",
};

function objectParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  const hasFinalConsonant = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasFinalConsonant ? "을" : "를";
}

function displayKeyword(keyword: string) {
  return keyword.replaceAll("·", "과 ");
}

const COLOR_LANGUAGE: Record<string, { core: string; recovery: string }> = {
  red: { core: "분명한 마음을 행동으로 옮기는 일", recovery: "속도를 조금 낮추고 자신에게도 쉴 자리를 내어주어 보세요" },
  orange: { core: "사람들과 어울리며 활기를 나누는 일", recovery: "가벼운 안부와 즐거운 대화로 마음에 생기를 더해보세요" },
  yellow: { core: "궁금한 것을 이해하며 생각을 넓혀가는 일", recovery: "복잡한 생각을 한 가지씩 정리하며 여유를 되찾아보세요" },
  green: { core: "관계의 평온함과 안정감을 지키는 일", recovery: "작은 약속과 꾸준한 돌봄으로 편안함을 다시 쌓아보세요" },
  blue: { core: "약속과 신뢰를 차분히 쌓아가는 일", recovery: "마음속 말을 믿을 사람에게 한마디씩 꺼내 보세요" },
  indigo: { core: "혼자 깊이 생각하며 일의 의미를 살피는 일", recovery: "혼자 찾던 생각을 글이나 대화로 천천히 나눠보세요" },
  violet: { core: "내면의 감정과 소중한 가치를 조용히 들여다보는 일", recovery: "현재의 마음을 다독이며 자신에게 편안한 시간을 만들어보세요" },
  pink: { core: "따뜻한 마음을 주고받는 일", recovery: "받고 싶은 다정함을 말이나 작은 행동으로 표현해보세요" },
  magenta: { core: "진심이 통하는 깊은 관계를 소중히 여기는 일", recovery: "안전한 관계 안에서 진심을 조금씩 나눠보세요" },
  coral: { core: "밝은 반응과 함께하는 즐거움을 나누는 일", recovery: "주변을 챙기던 마음을 자신에게도 돌려보세요" },
  gold: { core: "자신의 기준을 지키며 성장해가는 일", recovery: "잘해낸 일을 떠올리며 자신의 가치를 다시 인정해보세요" },
  brown: { core: "현실의 안정과 일상을 단단히 지키는 일", recovery: "익숙한 일상 안에서 부담 없는 변화 하나를 시도해보세요" },
  beige: { core: "주변과 부드럽게 어울리는 일", recovery: "온화함을 지키면서도 마음속 말을 한 문장으로 표현해보세요" },
  white: { core: "복잡한 것을 정돈하고 분명한 기준을 세우는 일", recovery: "정리한 마음에 부담 없는 안부와 따뜻한 연결을 더해보세요" },
  black: { core: "자신의 경계를 지키고 신뢰할 사람과 깊게 연결되는 일", recovery: "혼자 감당하던 일을 믿을 사람과 조금 나눠보세요" },
  silver: { core: "상황을 차분히 살피고 합리적으로 판단하는 일", recovery: "분석하기 전에 지금의 기분을 먼저 알아차려보세요" },
  olive: { core: "서로의 입장을 넓게 살피며 균형을 맞추는 일", recovery: "모두의 마음만큼 자신의 의견도 한 번 꺼내보세요" },
  mint: { core: "새로운 흐름에 유연하게 적응하는 일", recovery: "해야 할 일에서 잠시 떨어져 마음을 가볍게 쉬게 해보세요" },
  skyblue: { core: "가능성을 열어두고 가볍게 시작하는 일", recovery: "떠오른 생각을 작은 행동 하나로 옮겨보세요" },
  lavender: { core: "섬세한 감정을 살피며 진심 어린 관계를 바라는 일", recovery: "따뜻한 차나 좋아하는 음악으로 마음을 다독여보세요" },
  peach: { core: "상대의 마음에 따뜻하게 반응하는 일", recovery: "다른 사람에게 건넨 따뜻함을 자신에게도 돌려보세요" },
  terracotta: { core: "현실적인 온기와 꾸준한 애정을 나누는 일", recovery: "바쁘게 움직이던 마음을 잠시 멈추고 편안한 일상으로 돌아가보세요" },
  sage: { core: "주변 분위기를 살피며 조용히 조율하는 일", recovery: "남을 편안하게 하려는 마음을 자신에게도 돌려보세요" },
  teal: { core: "생각과 감정 사이에서 중심을 잡는 일", recovery: "생각으로 정리하기 어려운 감정을 말이나 글로 가볍게 꺼내보세요" },
  cream: { core: "자신에게 편안한 리듬을 지키는 일", recovery: "복잡한 것을 내려놓고 자신만의 고요한 리듬으로 돌아가보세요" },
};

function colorLanguage(color: ColorInput) {
  return COLOR_LANGUAGE[color.id] ?? {
    core: `${color.korName}이 보여주는 마음의 방향을 살피는 일`,
    recovery: `${color.korName}이 보여주는 편안한 흐름을 일상에 더해보세요`,
  };
}

function completeSentence(value: string) {
  const sentence = value.trim().replace(/[.!?]+$/, "");
  return sentence ? `${sentence}.` : "";
}

function cardFlowSummary(value: string) {
  return value
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.replace(/^현재 당신은\s*/, "")
    .replace(/^지금 당신은\s*/, "")
    .replace(/^당신은\s*/, "")
    .replace(/[.!?]+$/, "") ?? "";
}

function expressionHabit(value: string) {
  const expression = value.trim();
  if (!expression) return "서로의 마음을 확인하는 대화에";
  if (expression.endsWith("한")) return `${expression.slice(0, -1)}하게 관계를 대하는 방식에`;
  if (expression.endsWith("는")) return `${expression} 태도로 관계를 대하는 방식에`;
  return `${expression} 방식에`;
}

function relationshipHabit(value: string) {
  const relationship = value.trim();
  if (relationship.includes("관계")) return `${relationship} 방식을`;
  return `${relationship} 관계 방식을`;
}

function cardLabel(card: CardInput) {
  return `${card.colorKor} ${card.shapeKor}의 ${card.energyTitle}`;
}

/**
 * 커플 세션 개인 결과용 통합 분석.
 * 기존 1·2·3순위 컬러와 카드 1·2·3의 원문 흐름을 함께 읽되,
 * 카드 상세 해석을 그대로 반복하지 않고, 카드 제목이 가리키는 내면·현재·회복의 위치를 컬러 흐름과 연결한다.
 */
export function buildRomanticCoupleColorCardIntegratedAnalysis(
  inputColors: readonly ColorInput[],
  inputCards: readonly CardInput[],
): string {
  const [primary = FALLBACK_COLOR, secondary = FALLBACK_COLOR, recovery = FALLBACK_COLOR] = inputColors;
  const [unconscious = FALLBACK_CARD, current = FALLBACK_CARD, future = FALLBACK_CARD] = inputCards;

  const relationshipNeed = primary.relStyle?.[0] ?? "진심을 편안하게 나누는 관계";
  const expressionNeed = secondary.relStyle?.[1] ?? "서로의 마음을 확인하는 대화";
  const primaryLanguage = colorLanguage(primary);
  const secondaryLanguage = colorLanguage(secondary);
  const recoveryLanguage = colorLanguage(recovery);

  const coreNeedParagraph = `당신은 ${primaryLanguage.core}과 ${secondaryLanguage.core}을 함께 소중히 여기는 편입니다. 무의식 카드인 ${cardLabel(unconscious)}에는 "${cardFlowSummary(unconscious.psychologyFlow)}"라는 마음의 바탕이 담겨 있습니다. 그래서 관계에서는 ${relationshipHabit(relationshipNeed)} 중요하게 여길 수 있습니다.`;

  const innerOuterParagraph = `현재 흐름 카드인 ${cardLabel(current)}에는 "${cardFlowSummary(current.personalityFlow)}"라는 상태가 담겨 있습니다. 이 흐름이 ${secondaryLanguage.core}과 만날 때, ${expressionHabit(expressionNeed)} 익숙해져 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.`;

  const directionParagraph = `회복 방향 카드인 ${cardLabel(future)}에는 "${cardFlowSummary(future.recoveryDirection)}"라는 회복의 실마리가 담겨 있습니다. ${completeSentence(recoveryLanguage.recovery)} ${recoveryLanguage.core}을 일상에서 다시 살피는 일이 자기 마음을 편안히 돌보는 데 도움이 될 수 있습니다.`;

  return [coreNeedParagraph, innerOuterParagraph, directionParagraph].join("\n\n");
}

/** 부모·자녀·친구·동료·형제자매용 기존 통합 분석 문구를 보존한다. */
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

  const coreNeedParagraph = `당신은 ${primaryKeyword}${objectParticle(primaryKeyword)} 소중히 여기고, ${secondaryKeyword}${objectParticle(secondaryKeyword)} 쉽게 놓치지 않는 편입니다. 마음 깊은 곳에는 ${unconscious.energyTitle}에 가까운 바람이 있습니다. 그래서 관계에서는 ${relationshipNeed} 관계 방식을 중요하게 여길 수 있습니다.`;
  const innerOuterParagraph = `겉으로는 ${current.energyTitle} 쪽으로 상황을 풀어가려는 모습이 먼저 보일 수 있습니다. ${expressionNeed} 방식에 익숙한 편이라, 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.`;
  const directionParagraph = `지금은 ${future.energyTitle}에 가까운 회복의 방향을 따라 ${recovery.recovery} 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. ${recoveryKeyword}${objectParticle(recoveryKeyword)} 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.`;

  return [coreNeedParagraph, innerOuterParagraph, directionParagraph].join("\n\n");
}
