import type { CardColorType, CardData, ShapeType } from "@/constants/cardData";

const COLOR_FLOW_SUMMARY: Record<CardColorType, {
  unconscious: string;
  current: string;
  recovery: string;
}> = {
  red: {
    unconscious: "스스로 정한 목표를 향해 직접 움직이고 싶은",
    current: "눈에 보이는 진척을 만들며",
    recovery: "한 가지 실행에 힘을 모으는",
  },
  orange: {
    unconscious: "따뜻한 반응을 주고받으며 환영받고 싶은",
    current: "즐거운 연결에서 기운을 찾으며",
    recovery: "고마움과 호감을 부담 없이 표현하는",
  },
  yellow: {
    unconscious: "궁금한 것을 충분히 이해하고 싶은",
    current: "현실 조건을 비교해 납득할 답을 고르며",
    recovery: "알아본 내용을 작은 선택으로 확인하는",
  },
  green: {
    unconscious: "일상의 리듬이 무리 없이 이어지기를 바라는",
    current: "일정과 컨디션을 함께 살피며",
    recovery: "나에게 맞는 속도를 되찾는",
  },
  blue: {
    unconscious: "차분히 몰입하고 믿을 수 있는 방식으로 해내고 싶은",
    current: "할 일을 순서대로 풀어 가며",
    recovery: "불필요한 자극을 줄이고 집중을 되찾는",
  },
  navy: {
    unconscious: "이유와 맥락까지 이해하고 싶은",
    current: "자료를 충분히 확인한 뒤 판단하며",
    recovery: "복잡한 생각에서 핵심을 가려내는",
  },
  purple: {
    unconscious: "말로 다 설명되지 않는 느낌에서도 의미를 찾고 싶은",
    current: "떠오른 생각을 자기 방식으로 풀어 보며",
    recovery: "속에 있던 생각을 글이나 말로 꺼내 보는",
  },
  white: {
    unconscious: "무엇이 중요한지 분명히 알고 싶은",
    current: "여러 일을 단순하게 나누고 기준에 맞춰 정리하며",
    recovery: "불필요한 부담을 덜고 하루의 틀을 정돈하는",
  },
  black: {
    unconscious: "내 영역을 지키며 쉽게 흔들리지 않을 자리를 바라는",
    current: "충분히 확인한 뒤 필요한 일에 집중하며",
    recovery: "감당할 범위를 분명히 하고 힘을 아껴 쓰는",
  },
};

const SHAPE_FLOW_SUMMARY: Record<ShapeType, {
  unconscious: string;
  current: string;
  recovery: string;
}> = {
  circle: {
    unconscious: "있는 그대로 받아들여지는 자리에서",
    current: "주변과 나 모두에게 무리가 덜한 쪽을 함께 고려하는",
    recovery: "나와 주변이 모두 버겁지 않은 속도로 이어 가는",
  },
  triangle: {
    unconscious: "스스로 정한 목표가 보일 때",
    current: "우선순위를 정해 한 가지에 힘을 싣는",
    recovery: "미뤄 둔 계획도 작게 시작해 성취감을 쌓는",
  },
  inverted_triangle: {
    unconscious: "억지로 괜찮은 척하지 않아도 될 때",
    current: "속에 든 기분을 어떻게 꺼낼지 살피는",
    recovery: "부담 없는 말 한마디로 속을 털어놓을 틈을 만드는",
  },
  square: {
    unconscious: "예측 가능한 순서와 기준이 있을 때",
    current: "계획을 세우고 하나씩 마무리하는",
    recovery: "손에 잡히는 일부터 해내며 하루의 구조를 다시 세우는",
  },
  diamond: {
    unconscious: "익숙한 답 하나로 서두르지 않을 때",
    current: "다른 선택지도 비교해 보는",
    recovery: "새로운 방법을 부담 없이 시험해 보는",
  },
  pentagon: {
    unconscious: "흩어진 관심사 사이에서 나만의 이유가 보일 때",
    current: "여러 역할을 연결해 납득할 방향을 만드는",
    recovery: "쌓아 온 경험을 다음 선택에 연결하는",
  },
  hexagon: {
    unconscious: "믿을 사람과 힘을 나눌 수 있을 때",
    current: "서로의 역할을 맞춰 함께 해낼 방법을 찾는",
    recovery: "부담을 나누고 함께 해나갈 길을 찾는",
  },
};

function topicParticle(value: string) {
  const code = value.charCodeAt(value.length - 1);
  if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 > 0 ? "은" : "는";
  return "은";
}

/**
 * 개별 심리카드 본문을 되풀이하지 않고, 1번의 바탕·2번의 현재 선택·3번의 회복 실천을 짧게 연결한다.
 * 화면과 서버·네이티브 PDF가 같은 문자열을 사용한다.
 */
export function buildPremiumCardFlowSummary(cards: readonly [CardData, CardData, CardData]): string {
  const [unconsciousCard, currentCard, recoveryCard] = cards;
  const inner = COLOR_FLOW_SUMMARY[unconsciousCard.color].unconscious;
  const current = COLOR_FLOW_SUMMARY[currentCard.color].current;
  const recovery = COLOR_FLOW_SUMMARY[recoveryCard.color].recovery;
  const innerShape = SHAPE_FLOW_SUMMARY[unconsciousCard.shape].unconscious;
  const currentShape = SHAPE_FLOW_SUMMARY[currentCard.shape].current;
  const recoveryShape = SHAPE_FLOW_SUMMARY[recoveryCard.shape].recovery;
  const innerLabel = `${unconsciousCard.colorKor} ${unconsciousCard.shapeKor}`;
  const currentLabel = `${currentCard.colorKor} ${currentCard.shapeKor}`;
  const recoveryLabel = `${recoveryCard.colorKor} ${recoveryCard.shapeKor}`;

  return [
    `1번 ${innerLabel}${topicParticle(innerLabel)} 평소 ${inner} 마음을 바탕에 둡니다. ${innerShape} 그 바탕이 더 또렷해질 수 있습니다.`,
    `2번 ${currentLabel}${topicParticle(currentLabel)} 지금 ${current} 흐름을 더합니다. 그래서 ${currentShape} 선택이 자연스러울 수 있습니다.`,
    `3번 ${recoveryLabel}${topicParticle(recoveryLabel)} 회복할 때 ${recovery} 방향을 제안합니다. ${recoveryShape} 작은 실천부터 시작해 보세요.`,
  ].join("\n\n");
}
