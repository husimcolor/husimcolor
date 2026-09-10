import type { ColorData } from "./colorData";
import type { CardColorType, CardData, ShapeType } from "./cardData";

export type Stage2CardRole = "unconscious" | "current" | "recovery";

type CardRoleLens = Record<Stage2CardRole, string>;

type CardColorLens = CardRoleLens & {
  keywords: readonly [string, string, string];
};

type CardShapeLens = CardRoleLens & {
  keywords: readonly [string, string, string];
};

export interface Stage2CardInterpretation {
  role: Stage2CardRole;
  roleTitle: string;
  roleLabel: string;
  roleQuestion: string;
  cardLabel: string;
  colorKeywords: readonly [string, string, string];
  shapeKeywords: readonly [string, string, string];
  narrative: string;
}

const ROLE_METADATA: Record<Stage2CardRole, Pick<Stage2CardInterpretation, "roleTitle" | "roleLabel" | "roleQuestion">> = {
  unconscious: {
    roleTitle: "마음 깊은 곳의 욕구",
    roleLabel: "내면의 바람",
    roleQuestion: "겉으로 말하지 않아도, 나는 무엇을 바라고 있을까요?",
  },
  current: {
    roleTitle: "지금의 마음과 삶의 흐름",
    roleLabel: "지금의 반응",
    roleQuestion: "나는 요즘 어떤 방식으로 선택하고 움직이고 있을까요?",
  },
  recovery: {
    roleTitle: "마음이 향하는 다음 방향",
    roleLabel: "다음 방향",
    roleQuestion: "지금의 나는 어디로 조금씩 움직이고 싶을까요?",
  },
};

// 기존 63장 카드에 반복되어 있는 컬러 의미를 카드별 출력 근거로 정리했다.
// 본문은 키워드를 나열하지 않고, 컬러와 도형이 함께 만드는 생활 장면으로 작성한다.
const COLOR_LENSES: Record<CardColorType, CardColorLens> = {
  red: {
    keywords: ["추진", "표현", "활력"],
    unconscious: "원하는 것이 생기면 직접 움직여 보고 싶다는 바람이 커질 수 있습니다.",
    current: "해야 할 일이 뚜렷할수록 속도를 내고 눈에 보이는 진척을 만들려 합니다.",
    recovery: "기운을 한 가지 일에 모아 작은 실행으로 이어가고 싶은 쪽으로 향합니다.",
  },
  orange: {
    keywords: ["따뜻함", "연결", "창의성"],
    unconscious: "따뜻한 반응을 주고받으며 내가 환영받는다는 느낌을 바랄 수 있습니다.",
    current: "익숙한 사람이나 즐거운 활동에서 기분이 살아나는 순간을 찾게 됩니다.",
    recovery: "고마움이나 호감을 부담 없이 표현해 보고 싶은 쪽으로 향합니다.",
  },
  yellow: {
    keywords: ["호기심", "이해", "현실감"],
    unconscious: "궁금한 것을 그냥 넘기지 않고 제대로 이해하고 싶어집니다.",
    current: "새 정보와 현실 조건을 비교하며 납득할 수 있는 답을 고릅니다.",
    recovery: "알아본 것을 일상 속 작은 선택으로 확인해 보고 싶은 쪽으로 향합니다.",
  },
  green: {
    keywords: ["돌봄", "성장", "조화"],
    unconscious: "내가 있는 자리와 하루의 리듬이 무리 없이 이어지기를 바랄 수 있습니다.",
    current: "주변 일정과 내 컨디션을 함께 보며 무리 없는 속도를 택합니다.",
    recovery: "나에게 맞는 리듬을 되찾고 오래 지킬 수 있는 방식을 고르려 합니다.",
  },
  blue: {
    keywords: ["신뢰", "차분함", "몰입"],
    unconscious: "내 생각을 믿고 차분히 몰입할 수 있는 시간이 필요하게 느껴질 수 있습니다.",
    current: "할 일을 차례로 풀며 스스로 납득한 방식으로 진행합니다.",
    recovery: "불필요한 자극을 줄이고 한 가지에 집중할 수 있는 쪽으로 향합니다.",
  },
  navy: {
    keywords: ["깊이", "통찰", "신중함"],
    unconscious: "겉으로 보이는 답보다 이유와 맥락까지 알고 싶어집니다.",
    current: "결정하기 전 자료를 더 확인하고 충분히 생각한 뒤 결론을 냅니다.",
    recovery: "복잡했던 생각을 차분히 가다듬고 핵심을 짚는 쪽으로 향합니다.",
  },
  purple: {
    keywords: ["직관", "감수성", "상상력"],
    unconscious: "말로 다 설명되지 않는 느낌에도 의미를 찾고 싶어질 수 있습니다.",
    current: "떠오른 생각을 자신만의 방식으로 풀어 보며 가능성을 넓힙니다.",
    recovery: "속에 있던 생각을 글이나 말로 꺼내 보며 방향을 찾고 싶어합니다.",
  },
  white: {
    keywords: ["정돈", "여백", "명료함"],
    unconscious: "복잡한 것을 덜어내고 무엇이 중요한지 분명히 알고 싶어집니다.",
    current: "여러 일을 단순하게 나누고 기준에 맞춰 마무리하려 합니다.",
    recovery: "불필요한 부담을 덜고 한결 가벼운 방식으로 하루를 꾸리고 싶어합니다.",
  },
  black: {
    keywords: ["보호", "경계", "집중"],
    unconscious: "내 영역을 지키며 쉽게 흔들리지 않을 자리를 바랄 수 있습니다.",
    current: "급하게 열기보다 충분히 확인한 뒤 필요한 일에 집중합니다.",
    recovery: "내가 감당할 범위를 분명히 하고 힘을 아껴 쓰는 쪽으로 향합니다.",
  },
};

// 도형은 컬러 기질이 드러나는 방식과 상황을 조절하는 근거로만 사용한다.
const SHAPE_LENSES: Record<ShapeType, CardShapeLens> = {
  circle: {
    keywords: ["포용", "순환", "조화"],
    unconscious: "그럴 때 있는 그대로 받아들여지는 자리가 있으면 속이 한결 놓입니다.",
    current: "그 과정에서 나와 주변 모두에게 무리가 덜한 쪽을 함께 고려합니다.",
    recovery: "나와 주변이 모두 버겁지 않은 속도로 하루를 이어가려는 쪽에 더 관심이 갑니다.",
  },
  triangle: {
    keywords: ["목표", "성장", "추진"],
    unconscious: "그 바람은 스스로 정한 목표가 보일 때 더 또렷해집니다.",
    current: "그중에서도 우선순위를 정해 한 가지에 힘을 싣는 모습이 나타납니다.",
    recovery: "미뤄 둔 계획도 작게 시작해 성취감을 쌓는 쪽으로 걸음을 옮깁니다.",
  },
  inverted_triangle: {
    keywords: ["내려놓음", "수용", "표현"],
    unconscious: "억지로 괜찮은 척하지 않아도 될 때 이런 욕구가 더 분명해집니다.",
    current: "겉으로는 잔잔해 보여도 속에 든 기분을 어떻게 꺼낼지 생각하게 됩니다.",
    recovery: "부담 없는 말 한마디로 속을 털어놓을 틈을 만들고 싶어합니다.",
  },
  square: {
    keywords: ["구조", "안정", "현실감"],
    unconscious: "예측 가능한 순서와 약속된 기준이 있으면 이런 마음이 한결 든든합니다.",
    current: "계획을 세우고 하나씩 끝내며 하루를 안정적으로 운영합니다.",
    recovery: "하루의 틀을 다시 세우고 손에 잡히는 일부터 해내는 방향을 택합니다.",
  },
  diamond: {
    keywords: ["변화", "관점 전환", "유연함"],
    unconscious: "익숙한 답 하나로 서두르지 않을 때 더 넓게 생각해 볼 수 있습니다.",
    current: "여러 경우를 비교해 지금과 다른 선택지도 열어 둡니다.",
    recovery: "새로운 방법을 부담 없이 시험하며 다음 기회를 찾아봅니다.",
  },
  pentagon: {
    keywords: ["연결", "통합", "의미 확장"],
    unconscious: "흩어진 관심사 사이에서도 나만의 이유가 보일 때 속이 든든해집니다.",
    current: "여러 역할을 연결해 내가 납득할 수 있는 방향을 만들어 갑니다.",
    recovery: "지금까지 쌓은 경험을 한 줄로 묶어 다음 선택에 쓰려 합니다.",
  },
  hexagon: {
    keywords: ["협력", "균형", "공동체"],
    unconscious: "믿을 사람과 힘을 나눌 수 있을 때 그 바람이 더 편하게 자리 잡습니다.",
    current: "서로의 역할을 맞추며 함께 해낼 방법을 찾습니다.",
    recovery: "믿을 사람과 부담을 나누며 함께 해나갈 길을 찾습니다.",
  },
};

function polishStage2Narrative(text: string): string {
  // 기존 문장 결합에서 자주 보이던 추상 표현과 동일 어근의 연속을 마지막에만 최소 교정한다.
  return text
    .replace(/마음 한편/g, "속으로는")
    .replace(/힘을 이어주/g, "다음 선택으로 이어주")
    .replace(/흐름이 함께 보이/g, "모습이 드러나")
    .replace(/먼저([^.!?]{0,28})먼저/g, "먼저$1")
    .replace(/살피고([^.!?]{0,28})살피/g, "살피고$1들여다보")
    .replace(/비교하며([^.!?]{0,28})비교하면서/g, "비교하며$1다른 경우도 열어 두면서")
    .replace(/바랄 수 있습니다\.\s*[^.!?]*바랄 수 있습니다\./g, "바랄 수 있습니다. 그 욕구가 더 크게 느껴질 수 있습니다.")
    .replace(/싶어집니다\.\s*([^.!?]*?)싶어집니다\./g, "싶어집니다. $1관심이 갑니다.");
}

function fuseStage2Lenses(colorSentence: string, shapeSentence: string, role: Stage2CardRole): string {
  const transitionByRole: Record<Stage2CardRole, string> = {
    unconscious: "그래서",
    current: "그 과정에서",
    recovery: "그러면서",
  };
  const transition = transitionByRole[role];
  const startsWithTransition = shapeSentence.startsWith(transition);

  return polishStage2Narrative(`${colorSentence} ${startsWithTransition ? "" : `${transition} `}${shapeSentence}`.replace(/\s+/g, " ").trim());
}

export function getStage2CardInterpretation(card: CardData, role: Stage2CardRole): Stage2CardInterpretation {
  const colorLens = COLOR_LENSES[card.color];
  const shapeLens = SHAPE_LENSES[card.shape];
  const metadata = ROLE_METADATA[role];

  return {
    role,
    ...metadata,
    cardLabel: `${card.colorKor} · ${card.shapeKor}`,
    colorKeywords: colorLens.keywords,
    shapeKeywords: shapeLens.keywords,
    narrative: fuseStage2Lenses(colorLens[role], shapeLens[role], role),
  };
}

export function buildStage2CardInterpretations(cards: readonly [CardData, CardData, CardData]): Stage2CardInterpretation[] {
  return [
    getStage2CardInterpretation(cards[0], "unconscious"),
    getStage2CardInterpretation(cards[1], "current"),
    getStage2CardInterpretation(cards[2], "recovery"),
  ];
}

export function buildStage2ColorBridge(colors: readonly ColorData[]): string {
  const names = colors.slice(0, 3).map((color) => color.korName).filter(Boolean);
  if (names.length === 3) {
    return `${names.join(" · ")}에서 드러난 기본 성향을 바탕으로, 세 장의 카드는 숨은 바람 · 지금의 반응 · 다음 방향을 차례로 비춥니다.`;
  }
  return "세 장의 카드는 숨은 바람 · 지금의 반응 · 다음 방향을 차례로 비춥니다.";
}

export const STAGE2_CARD_KEYWORD_SOURCES = { COLOR_LENSES, SHAPE_LENSES };
