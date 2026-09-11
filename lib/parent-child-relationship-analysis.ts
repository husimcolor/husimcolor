import type { CardData } from "../constants/cardData";
import { COLOR_DATA, type ColorData } from "../constants/colorData";
import type { RelationType } from "../constants/coupleData";
import { getParentChildLabels, type ParentChildCoaching } from "./parent-child-coaching";

export type ParentChildRelationshipTypeId =
  | "steady_recovery"
  | "emotional_connection"
  | "clarity_balance"
  | "vital_expansion"
  | "space_respect"
  | "trust_exploration"
  | "pace_adjustment";

type RelationDimension =
  | "stability"
  | "care"
  | "inquiry"
  | "connection"
  | "expression"
  | "action"
  | "structure"
  | "space";

type PersonInput = {
  colors: readonly string[];
  cards: readonly CardData[];
};

type RelationshipSummary = {
  id: ParentChildRelationshipTypeId;
  typeName: string;
  coreSummary: string;
  description: string;
  accentColor: string;
  recommendedColors: Array<{ id: string; korName: string; hex: string; reason: string }>;
  closingMessage: string;
};

type LifeScene = {
  title: string;
  description: string;
  evidence: string;
};

type SectionEvidence = {
  section: string;
  colorBasis: string;
  cardSupport: string;
  recoveryUse?: string;
};

export type ParentChildRelationshipAnalysis = {
  relationshipSummary: RelationshipSummary;
  coaching: ParentChildCoaching;
  lifeScenes: {
    strengths: LifeScene[];
    tensions: LifeScene[];
  };
  sectionEvidence: SectionEvidence[];
};

type PersonProfile = {
  colors: [ColorData, ColorData];
  recoveryColor?: ColorData;
  cards: readonly CardData[];
  coreDimensions: RelationDimension[];
  primaryDimension: RelationDimension;
  secondaryDimension: RelationDimension;
};

type TensionPattern = {
  id: "decision_pace" | "care_space" | "expression_space" | "action_structure" | "connection_space" | "different_focus";
  title: string;
  parentFocus: RelationDimension;
  childFocus: RelationDimension;
  description: (parentLabel: string, childLabel: string, parent: PersonProfile, child: PersonProfile) => string;
  doMessages: (parentLabel: string, childLabel: string) => string[];
  dontMessages: (parentLabel: string, childLabel: string) => string[];
  practice: (parentLabel: string, childLabel: string) => string;
  recommendedColors: Array<{ id: string; korName: string; hex: string; reason: string }>;
};

const DIMENSIONS: RelationDimension[] = [
  "stability",
  "care",
  "inquiry",
  "connection",
  "expression",
  "action",
  "structure",
  "space",
];

const COLOR_DIMENSIONS: Record<string, readonly RelationDimension[]> = {
  red: ["action", "expression"],
  orange: ["connection", "expression"],
  yellow: ["inquiry", "structure"],
  green: ["stability", "care"],
  blue: ["structure", "space"],
  indigo: ["space", "inquiry"],
  violet: ["expression", "care"],
  pink: ["connection", "care"],
  magenta: ["expression", "connection"],
  coral: ["action", "connection"],
  gold: ["structure", "action"],
  brown: ["stability", "structure"],
  beige: ["care", "stability"],
  white: ["structure", "inquiry"],
  black: ["space", "structure"],
  silver: ["inquiry", "space"],
  olive: ["stability", "care"],
  mint: ["connection", "space"],
  skyblue: ["expression", "connection"],
  lavender: ["care", "space"],
  peach: ["connection", "care"],
  sage: ["stability", "care"],
  teal: ["structure", "inquiry"],
  cream: ["stability", "space"],
};

const DIMENSION_LABEL: Record<RelationDimension, string> = {
  stability: "안정과 지속성",
  care: "돌봄과 배려",
  inquiry: "이유를 살피는 이해",
  connection: "마음을 잇는 연결",
  expression: "생각과 감정을 드러내는 표현",
  action: "움직임을 시작하는 추진",
  structure: "기준과 순서를 세우는 정리",
  space: "자기 리듬과 거리를 지키는 여백",
};

const DIMENSION_ROLE: Record<RelationDimension, string> = {
  stability: "안정된 흐름을 지키는",
  care: "사람을 편안히 살피는",
  inquiry: "이유와 가능성을 확인하는",
  connection: "마음을 이어 주는",
  expression: "생각과 감정을 드러내는",
  action: "새로운 움직임을 시작하는",
  structure: "기준과 순서를 세우는",
  space: "자기 리듬을 존중하는",
};

const CURRENT_CARD_COLOR: Record<CardData["color"], string> = {
  red: "감정과 행동이 빠르게 이어지는",
  orange: "사람과의 연결을 반갑게 찾는",
  yellow: "여러 가능성을 현실적으로 비교하는",
  green: "관계의 균형을 다시 맞추려는",
  blue: "신뢰를 지키며 마음을 조심스럽게 표현하는",
  navy: "기준과 책임을 분명히 하려는",
  purple: "의미와 감정을 여러 각도에서 살피는",
  white: "복잡한 일을 단순한 기준으로 정리하려는",
  black: "밖으로 드러내기보다 안에서 충분히 정돈하려는",
};

const CURRENT_CARD_SHAPE: Record<CardData["shape"], string> = {
  circle: "감정을 부드럽게 순환시키는",
  triangle: "방향과 결단을 세우는",
  inverted_triangle: "마음을 안쪽에서 천천히 살피는",
  square: "현실적인 구조와 기준을 확인하는",
  diamond: "관계의 여러 면을 섬세하게 비교하는",
  pentagon: "가능성을 넓혀 보는",
  hexagon: "사람 사이의 연결을 유지하려는",
};

const TYPE_META: Record<ParentChildRelationshipTypeId, { name: string; accentColor: string }> = {
  steady_recovery: { name: "안정과 회복의 동행 관계", accentColor: "#6B8A5A" },
  emotional_connection: { name: "정서 공감의 연결 관계", accentColor: "#C47E8A" },
  clarity_balance: { name: "기준과 이해의 균형 관계", accentColor: "#4A7FA8" },
  vital_expansion: { name: "표현과 활력의 확장 관계", accentColor: "#D87655" },
  space_respect: { name: "독립과 거리의 존중 관계", accentColor: "#5B8FBF" },
  trust_exploration: { name: "신뢰와 탐색의 조율 관계", accentColor: "#6B8A5A" },
  pace_adjustment: { name: "서로 다른 속도의 조정 관계", accentColor: "#8A6BB8" },
};

function hasBatchim(value: string): boolean {
  const lastCharacter = value.trim().slice(-1);
  if (!lastCharacter) return false;
  const code = lastCharacter.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
}

function topic(value: string): string {
  return `${value}${hasBatchim(value) ? "은" : "는"}`;
}

function subject(value: string): string {
  return `${value}${hasBatchim(value) ? "이" : "가"}`;
}

function withLabel(value: string): string {
  return `${value}${hasBatchim(value) ? "과" : "와"}`;
}

function object(value: string): string {
  return `${value}${hasBatchim(value) ? "을" : "를"}`;
}

function withRo(value: string): string {
  const lastCharacter = value.trim().slice(-1);
  const code = lastCharacter.charCodeAt(0) - 0xac00;
  const hasFinalConsonant = code >= 0 && code <= 11171 ? code % 28 !== 0 : false;
  const hasRieulFinal = code >= 0 && code <= 11171 ? code % 28 === 8 : false;
  return `${value}${hasFinalConsonant && !hasRieulFinal ? "으로" : "로"}`;
}

function pairSubject(first: string, second: string): string {
  return `${withLabel(first)} ${subject(second)}`;
}

function getColor(id: string): ColorData {
  const color = COLOR_DATA.find((item) => item.id === id);
  if (!color) throw new Error(`알 수 없는 컬러입니다: ${id}`);
  return color;
}

function buildPersonProfile(input: PersonInput): PersonProfile {
  const primary = getColor(input.colors[0] ?? "green");
  const secondary = getColor(input.colors[1] ?? input.colors[0] ?? "sage");
  const recoveryColor = input.colors[2] ? getColor(input.colors[2]) : undefined;
  const primaryDimensions = COLOR_DIMENSIONS[primary.id] ?? ["stability", "care"];
  const secondaryDimensions = COLOR_DIMENSIONS[secondary.id] ?? ["care", "stability"];
  const coreDimensions = [...new Set([...primaryDimensions, ...secondaryDimensions])];
  return {
    colors: [primary, secondary],
    recoveryColor,
    cards: input.cards,
    coreDimensions,
    primaryDimension: primaryDimensions[0] ?? "stability",
    secondaryDimension: secondaryDimensions[0] ?? "care",
  };
}

function has(profile: PersonProfile, ...dimensions: RelationDimension[]): boolean {
  return dimensions.some((dimension) => profile.coreDimensions.includes(dimension));
}

function determineType(parent: PersonProfile, child: PersonProfile): ParentChildRelationshipTypeId {
  const parentCore = parent.primaryDimension;
  const childCore = child.primaryDimension;
  const hasCore = (core: RelationDimension, group: RelationDimension[]) => group.includes(core);
  const steadyGroup: RelationDimension[] = ["stability", "care"];
  const clarityGroup: RelationDimension[] = ["structure", "inquiry"];
  const vitalityGroup: RelationDimension[] = ["action", "expression"];
  const connectionGroup: RelationDimension[] = ["care", "connection"];
  const crosses = (first: RelationDimension[], second: RelationDimension[]) =>
    (hasCore(parentCore, first) && hasCore(childCore, second))
    || (hasCore(parentCore, second) && hasCore(childCore, first));

  if (parentCore === "space" || childCore === "space") return "space_respect";
  if (hasCore(parentCore, connectionGroup) && hasCore(childCore, connectionGroup)) return "emotional_connection";
  if (hasCore(parentCore, clarityGroup) && hasCore(childCore, clarityGroup)) return "clarity_balance";
  if (hasCore(parentCore, vitalityGroup) && hasCore(childCore, vitalityGroup)) return "vital_expansion";
  if (hasCore(parentCore, steadyGroup) && hasCore(childCore, steadyGroup)) return "steady_recovery";
  if (
    (parentCore === "stability" && hasCore(childCore, [...clarityGroup, ...connectionGroup]))
    || (childCore === "stability" && hasCore(parentCore, [...clarityGroup, ...connectionGroup]))
  ) return "trust_exploration";
  if (crosses(clarityGroup, connectionGroup)) return "clarity_balance";
  if (crosses(vitalityGroup, connectionGroup)) return "vital_expansion";
  if (crosses(vitalityGroup, ["stability", ...clarityGroup])) return "pace_adjustment";
  return "pace_adjustment";
}

function currentCardSupport(card?: CardData): string {
  if (!card) return "현재 심리카드가 선택되지 않아 컬러 1·2순위만으로 읽었습니다.";
  return `${card.colorKor} ${card.shapeKor} 카드는 현재 ${CURRENT_CARD_COLOR[card.color]} 반응과 ${CURRENT_CARD_SHAPE[card.shape]} 태도를 보완합니다.`;
}

function recoverySupport(profile: PersonProfile, label: string): string {
  const futureCard = profile.cards[2];
  const colorText = profile.recoveryColor
    ? `${profile.recoveryColor.korName}의 ${profile.recoveryColor.recovery}`
    : "선택한 회복 컬러의 방향";
  const cardText = futureCard ? `${futureCard.colorKor} ${futureCard.shapeKor} 카드` : "미래 카드";
  return `${label}에게는 ${colorText}이 회복 방향으로 쓰일 수 있으며, ${cardText}는 앞으로 필요한 연결 방식을 보완합니다.`;
}

function dimensionPairText(profile: PersonProfile): string {
  return `${profile.colors[0].korName}의 ${DIMENSION_LABEL[profile.primaryDimension]}과 ${profile.colors[1].korName}의 ${DIMENSION_LABEL[profile.secondaryDimension]}`;
}

function findSharedDimension(parent: PersonProfile, child: PersonProfile): RelationDimension | undefined {
  return parent.coreDimensions.find((dimension) => child.coreDimensions.includes(dimension))
    ?? child.coreDimensions.find((dimension) => parent.coreDimensions.includes(dimension));
}

function buildStrengthScene(parentLabel: string, childLabel: string, parent: PersonProfile, child: PersonProfile): LifeScene | null {
  const shared = findSharedDimension(parent, child);
  if (!shared) return null;
  const base = `${withLabel(parentLabel)} ${childLabel}의 ${dimensionPairText(child)}`;
  const evidence = `근거 · ${base} / ${parentLabel} ${currentCardSupport(parent.cards[1])} / ${childLabel} ${currentCardSupport(child.cards[1])}`;

  const scenes: Record<RelationDimension, Omit<LifeScene, "evidence">> = {
    stability: {
      title: "함께 정한 약속을 편안하게 지키는 장면",
      description: `${pairSubject(parentLabel, childLabel)} 모두 일상의 흐름이 지나치게 흔들리지 않을 때 편안함을 느낄 수 있습니다. 함께 정한 한 가지 약속을 지켜 본 뒤 서로에게 편했던 점을 나누면, 신뢰와 안정의 강점이 자연스럽게 살아날 수 있습니다.`,
    },
    care: {
      title: "하루의 경험을 이유와 감정으로 나누는 시간",
      description: `${subject(childLabel)} 마음에 남은 일을 말할 때 ${subject(parentLabel)} 그 이유와 감정을 함께 들어 주면, 돌봄과 공감의 강점이 만날 수 있습니다. ${topic(parentLabel)} 관계를 편안하게 지키고 ${topic(childLabel)} 자신의 마음을 자연스럽게 표현하는 연결이 만들어질 수 있습니다.`,
    },
    inquiry: {
      title: "선택의 기준을 함께 정리하는 장면",
      description: `${pairSubject(parentLabel, childLabel)} 어떤 선택을 앞두고 각자 중요하게 보는 기준을 하나씩 말해 보면, 생각을 충분히 살피는 강점이 관계의 신뢰로 이어질 수 있습니다. 답을 빨리 맞추기보다 이유를 비교하는 과정이 두 사람의 공통 자원이 됩니다.`,
    },
    connection: {
      title: "관심사와 마음을 나누는 대화",
      description: `${pairSubject(parentLabel, childLabel)} 각자 마음이 가는 이야기를 한 가지씩 꺼낼 때, 서로의 반응이 관계의 온도를 높일 수 있습니다. 공감과 연결의 기질이 공통으로 드러나는 조합이라, 짧아도 진심이 담긴 반응이 오래 남을 수 있습니다.`,
    },
    expression: {
      title: "새로운 생각을 함께 표현해 보는 장면",
      description: `${pairSubject(parentLabel, childLabel)} 각자 해 보고 싶은 생각을 말이나 작은 결과물로 보여 줄 때, 표현의 에너지가 서로를 북돋울 수 있습니다. 누가 더 잘했는지보다 무엇이 새로웠는지를 나누는 것이 관계의 활력을 살립니다.`,
    },
    action: {
      title: "작은 시도를 함께 시작하는 장면",
      description: `${pairSubject(parentLabel, childLabel)} 움직이며 경험할 때 관계의 에너지가 살아날 수 있습니다. 거창한 목표보다 함께 정한 작은 시도 하나를 끝까지 해 보면, 서로의 추진력과 응원이 자연스럽게 연결됩니다.`,
    },
    structure: {
      title: "서로의 기준을 확인하고 순서를 맞추는 장면",
      description: `${pairSubject(parentLabel, childLabel)} 해야 할 일을 앞두고 각각 중요하게 보는 기준을 확인하면, 정리와 판단의 강점이 충돌 대신 협력이 될 수 있습니다. ‘무엇을 먼저 할지’를 함께 정하는 과정이 편안함을 만듭니다.`,
    },
    space: {
      title: "각자의 리듬을 존중하고 다시 만나는 시간",
      description: `${pairSubject(parentLabel, childLabel)} 가까이 있는 시간만큼 각자의 호흡을 지키는 시간도 중요하게 느낄 수 있습니다. 혼자 정리한 뒤 다시 이야기를 나누면, 거리 자체가 단절이 아니라 관계를 편안하게 하는 여백이 될 수 있습니다.`,
    },
  };
  return { ...scenes[shared], evidence };
}

function findTension(parent: PersonProfile, child: PersonProfile): TensionPattern {
  const parentStructured = has(parent, "structure", "stability");
  const childStructured = has(child, "structure", "stability");
  const parentExplores = has(parent, "inquiry", "expression", "action");
  const childExplores = has(child, "inquiry", "expression", "action");
  const parentSpace = has(parent, "space");
  const childSpace = has(child, "space");
  const parentConnects = has(parent, "connection", "care");
  const childConnects = has(child, "connection", "care");

  if ((parentStructured && childExplores) || (childStructured && parentExplores)) return TENSION_PATTERNS.decision_pace;
  if ((parentConnects && childSpace) || (childConnects && parentSpace)) return TENSION_PATTERNS.connection_space;
  if ((has(parent, "care") && childSpace) || (has(child, "care") && parentSpace)) return TENSION_PATTERNS.care_space;
  if ((has(parent, "expression", "action") && childSpace) || (has(child, "expression", "action") && parentSpace)) return TENSION_PATTERNS.expression_space;
  if ((has(parent, "action") && has(child, "structure")) || (has(child, "action") && has(parent, "structure"))) return TENSION_PATTERNS.action_structure;
  return TENSION_PATTERNS.different_focus;
}

const TENSION_PATTERNS: Record<TensionPattern["id"], TensionPattern> = {
  decision_pace: {
    id: "decision_pace",
    title: "약속을 확정하는 순간의 속도 차이",
    parentFocus: "structure",
    childFocus: "inquiry",
    description: (parentLabel, childLabel) => `${subject(parentLabel)} 일상을 편안하게 만들려는 뜻으로 선택을 빨리 좁히면, ${childLabel}에게는 이유를 충분히 비교할 여지가 사라진 느낌으로 닿을 수 있습니다. 반대로 ${subject(childLabel)} 여러 가능성을 계속 살피면 ${topic(parentLabel)} 약속의 기준이 늦어진다고 느낄 수 있습니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“이번에는 ${subject(parentLabel)} 미리 정해 둘 일 하나와 ${subject(childLabel)} 더 알아볼 일 하나를 나눠 볼까?”`,
      `“${subject(childLabel)} 마음에 가는 이유를 들은 뒤, ${subject(parentLabel)} 현실적으로 확인할 한 가지만 말해도 될까?”`,
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 이미 정했으니 더 비교할 필요 없어.”`,
      "“이유보다 결과가 중요하니 일단 시키는 대로 해.”",
    ],
    practice: (parentLabel, childLabel) => `${pairSubject(parentLabel, childLabel)} 약속을 정하는 날, 종이에 ‘이번에 확정할 일’과 ‘더 알아볼 일’을 한 가지씩 나눠 적고 두 칸을 섞지 않기`,
    recommendedColors: [
      { id: "blue", korName: "블루", hex: "#4A7FA8", reason: "생각의 이유와 마음을 차분히 설명하고 확인하는 대화의 컬러입니다." },
      { id: "peach", korName: "피치", hex: "#F4A882", reason: "정리의 말이 따뜻한 반응으로 닿도록 돕는 연결의 컬러입니다." },
    ],
  },
  care_space: {
    id: "care_space",
    title: "도움을 건넬 때 필요한 거리",
    parentFocus: "care",
    childFocus: "space",
    description: (parentLabel, childLabel) => `${subject(parentLabel)} 걱정되는 마음으로 가까이 돕고 싶을 때, ${topic(childLabel)} 스스로 정리할 공간이 먼저 필요하다고 느낄 수 있습니다. 반대로 ${subject(childLabel)} 조용해지면 ${topic(parentLabel)} 마음을 닫았다고 받아들일 수 있어, 돌봄의 거리와 시점을 함께 정하는 일이 중요해집니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“${childLabel}아, 지금은 같이 있을까 아니면 네가 먼저 정리할 시간을 가질까?”`,
      `“${topic(parentLabel)} 네가 준비됐을 때 다시 듣고 싶어.”`,
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 왜 혼자 있으려고 해? 지금 바로 말해야 해.”`,
      "“도와주겠다는 데 왜 피하니?”",
    ],
    practice: (parentLabel, childLabel) => `마음이 무거운 날 ${pairSubject(parentLabel, childLabel)} ‘같이 있기’와 ‘혼자 정리하기’ 중 지금 필요한 쪽을 고르고, 정한 시간 뒤에만 다시 안부 묻기`,
    recommendedColors: [
      { id: "sage", korName: "세이지그린", hex: "#9CAF88", reason: "돌봄과 거리 사이의 호흡을 부드럽게 조율하는 컬러입니다." },
      { id: "skyblue", korName: "스카이블루", hex: "#5B8FBF", reason: "부담 없이 다시 말을 꺼낼 수 있는 가벼운 연결의 컬러입니다." },
    ],
  },
  expression_space: {
    id: "expression_space",
    title: "반응의 속도가 다른 순간",
    parentFocus: "expression",
    childFocus: "space",
    description: (parentLabel, childLabel) => `${subject(parentLabel)} 바로 마음을 표현하거나 반응을 확인하고 싶을 때, ${topic(childLabel)} 먼저 혼자 생각을 정리한 뒤 말하고 싶을 수 있습니다. 빠른 반응이 관심의 표현일 수 있고 조용함이 거리두기만을 뜻하는 것은 아니라는 점을 함께 확인할 필요가 있습니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“${childLabel}아, 지금 바로 답하지 않아도 돼. 언제 다시 이야기하면 좋을지 알려줄래?”`,
      `“${topic(parentLabel)} 네 반응을 기다리는 동안 무엇이 궁금한지 한 가지만 말해 둘게.”`,
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 왜 바로 대답을 못 해?”`,
      "“말이 없다는 건 관심이 없다는 뜻이야.”",
    ],
    practice: (parentLabel, childLabel) => `대화가 길어질 때 ${topic(parentLabel)} 궁금한 점을 한 문장으로 남기고 ${topic(childLabel)} 다시 이야기할 시간을 직접 정해 알리기`,
    recommendedColors: [
      { id: "lavender", korName: "라벤더", hex: "#B8A9C9", reason: "감정의 여운을 차분히 정리하고 다시 말을 잇게 돕는 컬러입니다." },
      { id: "blue", korName: "블루", hex: "#4A7FA8", reason: "서로의 속도를 신뢰하는 표현을 돕는 컬러입니다." },
    ],
  },
  action_structure: {
    id: "action_structure",
    title: "시작하고 싶은 마음과 기준을 확인하는 순서",
    parentFocus: "action",
    childFocus: "structure",
    description: (parentLabel, childLabel) => `${parentLabel} 또는 ${childLabel} 한쪽은 해 보면서 방향을 잡고 싶어 할 수 있고, 다른 쪽은 시작 전 기준과 순서를 확인해야 편안할 수 있습니다. 시도를 막거나 기준을 무시하는 문제가 아니라, 시작과 점검의 순서가 다를 때 생길 수 있는 차이입니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“${childLabel}아, 해 보고 싶은 점 하나와 시작 전에 확인할 점 하나를 같이 적어 볼까?”`,
      `“${topic(parentLabel)} 먼저 움직이고 싶은 마음도 이해해. 확인할 부분을 짧게 맞춘 뒤 시작하자.”`,
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 확인은 나중에 하고 일단 시작해.”`,
      "“기준을 따지는 건 괜히 일을 늦추는 거야.”",
    ],
    practice: (parentLabel, childLabel) => `새로운 일을 시작할 때 ${pairSubject(parentLabel, childLabel)} ‘먼저 해 볼 한 가지’와 ‘시작 전 확인할 한 가지’를 적고, 둘 다 끝난 뒤 다음 단계로 넘어가기`,
    recommendedColors: [
      { id: "green", korName: "그린", hex: "#6BAF7A", reason: "시도와 기준 사이에 무리 없는 성장의 리듬을 만드는 컬러입니다." },
      { id: "yellow", korName: "옐로우", hex: "#F0C040", reason: "무엇을 먼저 확인할지 명료하게 정리하는 컬러입니다." },
    ],
  },
  connection_space: {
    id: "connection_space",
    title: "함께 있고 싶은 마음과 혼자 정리하는 시간",
    parentFocus: "connection",
    childFocus: "space",
    description: (parentLabel, childLabel) => `${topic(parentLabel)} 마음이 움직일 때 바로 연결을 느끼고 싶을 수 있고, ${topic(childLabel)} 혼자 정리한 뒤에야 편안하게 관계로 돌아올 수 있습니다. 이 차이는 애정의 크기보다 연결과 휴식의 순서가 다를 때 생길 수 있습니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“${childLabel}아, 오늘은 혼자 있고 싶다면 괜찮아. 다시 연결하고 싶은 시간만 알려줄래?”`,
      `“${topic(parentLabel)} 네가 돌아왔을 때 오늘 어땠는지 한 가지만 듣고 싶어.”`,
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 혼자 있으려는 건 가족을 피하는 거야.”`,
      "“연락이 줄면 마음도 멀어진 거라고 봐야지.”",
    ],
    practice: (parentLabel, childLabel) => `${pairSubject(parentLabel, childLabel)} 각자 쉬는 시간을 정한 뒤, 다시 만났을 때 오늘 좋았던 일 한 가지만 나누기`,
    recommendedColors: [
      { id: "mint", korName: "민트", hex: "#7BC8B2", reason: "가볍게 다시 연결하면서도 각자의 숨을 남겨 주는 컬러입니다." },
      { id: "peach", korName: "피치", hex: "#F4A882", reason: "부담 없이 마음을 반갑게 맞이하는 컬러입니다." },
    ],
  },
  different_focus: {
    id: "different_focus",
    title: "서로 중요하게 보는 기준이 다른 순간",
    parentFocus: "stability",
    childFocus: "connection",
    description: (parentLabel, childLabel) => `${pairSubject(parentLabel, childLabel)} 같은 일을 두고도 한쪽은 안정과 기준을, 다른 쪽은 마음과 가능성을 먼저 볼 수 있습니다. 어느 한쪽의 방식이 부족한 것이 아니라, 먼저 확인하고 싶은 지점이 다를 때 대화의 순서가 어긋날 수 있습니다.`,
    doMessages: (parentLabel, childLabel) => [
      `“${childLabel}아, 너에게 가장 중요한 점 하나를 먼저 들려줘. 그다음 ${subject(parentLabel)} 걱정한 점 하나를 말할게.”`,
      "“서로 다른 기준이 있다는 것을 먼저 확인하고, 오늘은 한 가지만 함께 정해 보자.”",
    ],
    dontMessages: (_parentLabel, childLabel) => [
      `“${childLabel}아, 네가 중요하게 보는 건 지금 별로 중요하지 않아.”`,
      "“한 가지 기준만 맞으면 되니 다른 이야기는 하지 마.”",
    ],
    practice: (parentLabel, childLabel) => `의견이 다른 날 ${pairSubject(parentLabel, childLabel)} 각자 가장 중요한 기준을 한 줄로 적고, 공통으로 지킬 한 가지만 함께 고르기`,
    recommendedColors: [
      { id: "teal", korName: "틸", hex: "#4F9A95", reason: "생각과 마음의 기준을 함께 정리하도록 돕는 컬러입니다." },
      { id: "beige", korName: "베이지", hex: "#CBBFA6", reason: "서로 다른 기준을 편안하게 들을 여백을 만드는 컬러입니다." },
    ],
  },
};

const DIMENSION_NEED: Record<RelationDimension, string> = {
  stability: "익숙한 흐름과 약속",
  care: "마음이 안전하다는 느낌",
  inquiry: "충분히 이유를 살필 시간",
  connection: "관계가 이어진다는 신호",
  expression: "자기 생각을 드러낼 자리",
  action: "직접 해 볼 움직임",
  structure: "납득할 수 있는 기준과 순서",
  space: "혼자 정리할 여백",
};

const CURRENT_CARD_ACTION: Record<CardData["shape"], string> = {
  circle: "감정을 한 단어로 먼저 말합니다",
  triangle: "지금 지키고 싶은 방향을 한 가지로 말합니다",
  inverted_triangle: "더 정리할 시간이 필요하다고 알립니다",
  square: "현실적으로 지킬 조건 하나를 정합니다",
  diamond: "여러 이유 중 더 중요한 한 가지를 고릅니다",
  pentagon: "새로 해 볼 방법 하나를 제안합니다",
  hexagon: "관계를 이어 줄 짧은 안부를 남깁니다",
};

const CURRENT_CARD_PRESSURE: Record<CardData["shape"], string> = {
  circle: "지금 내 마음부터 알아줘야 해",
  triangle: "망설이지 말고 내가 정한 방향으로 해",
  inverted_triangle: "생각은 그만하고 지금 대답해",
  square: "조건을 따지지 말고 정해 둔 대로 해",
  diamond: "여러 이유를 더 보지 말고 하나만 골라",
  pentagon: "네가 해 보고 싶은 일은 나중에 생각해",
  hexagon: "관계를 생각한다면 네 마음부터 접어",
};

const PARENT_CURRENT_PRESSURE: Record<CardData["shape"], string> = {
  circle: "내가 서운한 마음을 지금 바로 풀어야 마음이 놓이니",
  triangle: "내가 정한 방향을 지금 바로 따라야 한다고 생각하니",
  inverted_triangle: "네가 조용하면 더 걱정이 커지니",
  square: "정해 둔 기준을 먼저 지켜야 한다고 생각하니",
  diamond: "여러 사정을 지금 다 따져야 한다고 생각하니",
  pentagon: "새 방법을 바로 시작해야 한다고 생각하니",
  hexagon: "우리 사이가 지금 바로 괜찮아져야 한다고 생각하니",
};

const CURRENT_CARD_DO_PROMPT: Record<CardData["shape"], string> = {
  circle: "지금 마음을 한 단어로 먼저 말해 줄래",
  triangle: "지금 지키고 싶은 점 한 가지만 먼저 말해 줄래",
  inverted_triangle: "더 생각할 시간이 필요하면 언제 다시 말할지 알려줄래",
  square: "오늘 지킬 수 있는 조건 한 가지만 먼저 정해 볼까",
  diamond: "여러 이유 중 가장 중요한 한 가지만 먼저 말해 줄래",
  pentagon: "네가 먼저 해 보고 싶은 방법 한 가지를 들려줄래",
  hexagon: "우리 대화를 이어 갈 수 있게 짧게라도 안부를 말해 줄래",
};

const PARENT_CURRENT_DO_PROMISE: Record<CardData["shape"], string> = {
  circle: "네 마음을 먼저 듣고 바로 판단하지 않을게",
  triangle: "오늘 꼭 정할 일은 한 가지만 말할게",
  inverted_triangle: "네가 조용해도 기다릴 시간을 먼저 정할게",
  square: "서로 지킬 수 있는 조건을 한 가지만 같이 정하자",
  diamond: "여러 사정 중 가장 중요한 한 가지만 먼저 들을게",
  pentagon: "네가 해 보고 싶은 방법부터 한 가지 들어 볼게",
  hexagon: "대화가 길어져도 다시 이야기할 시간을 남겨 둘게",
};

const RECOVERY_ACTION_BY_DIMENSION: Record<RelationDimension, string> = {
  stability: "오늘 지킬 약속 한 가지를 다시 확인합니다",
  care: "상대가 힘들었을 수 있다는 점을 한 문장으로 인정합니다",
  inquiry: "답하기 전에 이유 하나를 더 묻습니다",
  connection: "짧은 안부 한마디로 다시 말을 잇습니다",
  expression: "다시 말하고 싶은 생각을 한 문장으로 꺼냅니다",
  action: "다음에 해 볼 작은 행동 하나를 정합니다",
  structure: "다음 대화에서 확인할 순서 하나를 정합니다",
  space: "다시 이야기할 시간을 직접 정합니다",
};

function colorPair(profile: PersonProfile): string {
  return `${profile.colors[0].korName}·${profile.colors[1].korName}`;
}

function currentCardAction(profile: PersonProfile, label: string): string {
  const card = profile.cards[1];
  if (!card) return `${topic(label)} 지금 가장 중요하게 보는 한 가지를 말합니다.`;
  return `${topic(label)} ${CURRENT_CARD_ACTION[card.shape]}.`;
}

function recoveryAction(profile: PersonProfile, label: string): string {
  const recoveryDimension = profile.recoveryColor
    ? COLOR_DIMENSIONS[profile.recoveryColor.id]?.[0] ?? profile.secondaryDimension
    : profile.secondaryDimension;
  return `${topic(label)} ${RECOVERY_ACTION_BY_DIMENSION[recoveryDimension]}.`;
}

function buildPersonalizedDontMessages(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
  tension: TensionPattern,
): string[] {
  const childPrimaryNeed = DIMENSION_NEED[child.primaryDimension];
  const typeSpecific: Record<ParentChildRelationshipTypeId, string> = {
    steady_recovery: "평소처럼만 하면 되니 네 방식은 나중에 생각해.",
    emotional_connection: "우리 사이가 불편해지면 네 마음부터 접어야 해.",
    clarity_balance: "이유를 더 듣기보다 지금 정한 기준에 맞는지만 말해.",
    vital_expansion: "결과를 바로 보여 주지 못할 거면 더 해 볼 필요 없어.",
    space_respect: "혼자 생각할 시간은 그만 갖고 지금 바로 말해.",
    trust_exploration: `${subject(parentLabel)} 정한 약속부터 따르고 질문은 나중에 해.`,
    pace_adjustment: "내 속도에 지금 맞추지 못하면 더 기다릴 수 없어.",
  };
  const childPressure: Record<RelationDimension, string> = {
    stability: "약속을 지키기 어렵다면 네가 더 맞춰야 해.",
    care: "네 마음을 먼저 말하면 모두가 더 힘들어져.",
    inquiry: "이유를 더 따지는 건 핑계야.",
    connection: "관계를 생각한다면 네 마음은 잠시 접어 둬.",
    expression: "네 생각을 그렇게 드러내는 건 문제야.",
    action: "해 보기 전에 말부터 듣는 게 맞아.",
    structure: "왜 순서를 따져? 그냥 시키는 대로 하면 돼.",
    space: "혼자 정리할 시간은 필요 없어. 지금 답해.",
  };
  const parentCard = parent.cards[1];
  const childCard = child.cards[1];
  const parentCardPressure = parentCard
    ? PARENT_CURRENT_PRESSURE[parentCard.shape]
    : `${subject(parentLabel)} 지키려는 일이 더 중요하니`;
  const childCardPressure = childCard
    ? CURRENT_CARD_PRESSURE[childCard.shape]
    : `네가 지금 가장 중요하게 보는 ${childPrimaryNeed}은 나중에 말해`;

  return [
    `“${childLabel}아, ${typeSpecific[type]}”`,
    `“${childLabel}아, ${childPressure[child.primaryDimension]}”`,
    `“${childLabel}아, ${parentCardPressure} 네 이야기는 나중에 해.”`,
    `“${childLabel}아, ${childCardPressure}.”`,
  ];
}

function buildPersonalizedDoMessages(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
  sharedScene: LifeScene | null,
): string[] {
  const typeSpecific: Record<ParentChildRelationshipTypeId, string> = {
    steady_recovery: "오늘 꼭 지키고 싶은 약속 한 가지를 고르고, 네 방식으로 바꾸고 싶은 점도 한 가지 말해 줄래?",
    emotional_connection: "지금 네 마음이 어떤지 한 단어로 먼저 말해 줄래? 바로 고치려 하기보다 먼저 들을게.",
    clarity_balance: "네가 더 알아보고 싶은 이유 한 가지를 먼저 말해 줄래? 그다음 내가 확인하고 싶은 기준도 한 가지만 말할게.",
    vital_expansion: "해 보고 싶은 일 한 가지와 걱정되는 점 한 가지를 함께 말해 줄래? 작은 범위에서 먼저 해 보자.",
    space_respect: "지금 이야기할 수 있는지, 조금 뒤에 말하고 싶은지 네가 먼저 정해 줄래?",
    trust_exploration: "이 약속을 납득하려면 더 알고 싶은 점 한 가지를 먼저 말해 줄래? 내가 꼭 지키고 싶은 기준도 한 가지만 설명할게.",
    pace_adjustment: "지금 정할 일과 조금 더 생각할 일을 하나씩 나눠 말해 줄래?",
  };
  const childCard = child.cards[1];
  const parentCard = parent.cards[1];
  const childPrompt = childCard
    ? CURRENT_CARD_DO_PROMPT[childCard.shape]
    : "지금 가장 중요한 점 한 가지만 먼저 말해 줄래";
  const parentPromise = parentCard
    ? PARENT_CURRENT_DO_PROMISE[parentCard.shape]
    : "네 이야기를 먼저 듣고 바로 결론내리지 않을게";
  const sharedPrompt = sharedScene
    ? `${sharedScene.title}에서 네가 중요하게 느낀 점 한 가지를 들려줄래`
    : "네가 중요하게 보는 기준 한 가지를 먼저 들려줄래";

  return [
    `“${childLabel}아, ${typeSpecific[type]}”`,
    `“${childLabel}아, ${childPrompt}? ${parentLabel}는 ${parentPromise}.”`,
    `“${childLabel}아, ${sharedPrompt}?”`,
    `“${parentLabel}가 걱정한 점은 한 가지만 말하고, 네가 직접 고를 부분은 남겨 둘게.”`,
  ];
}

function buildConflictStart(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
  tension: TensionPattern,
): string {
  const parentColors = colorPair(parent);
  const childColors = colorPair(child);
  const parentNeed = DIMENSION_NEED[parent.primaryDimension];
  const childNeed = DIMENSION_NEED[child.primaryDimension];
  const typeStart: Record<ParentChildRelationshipTypeId, string> = {
    steady_recovery: `${parentLabel}의 ${subject(parentColors)} 익숙한 약속과 일상의 안정부터 지키려는 때, ${childLabel}의 ${subject(childColors)} 마음의 온도와 자신의 방식도 함께 반영되길 바랄 때`,
    emotional_connection: `${withLabel(parentLabel)} ${subject(childLabel)} 모두 관계의 온도를 중요하게 여기지만, ${subject(parentLabel)} 빠른 공감과 반응을 기대하고 ${subject(childLabel)} 자신의 감정을 먼저 고르는 순간`,
    clarity_balance: `${parentLabel}의 ${subject(parentColors)} 기준과 순서를 분명히 하려는 때, ${childLabel}의 ${subject(childColors)} 이유와 가능성을 더 비교하려는 순간`,
    vital_expansion: `${parentLabel}의 ${withLabel(parentColors)} ${childLabel}의 ${subject(childColors)} 새 시도와 표현을 향하지만, 한쪽의 속도나 결과 기대가 다른 쪽의 방식보다 앞서는 순간`,
    space_respect: `${subject(parentLabel)} 연결이나 정리를 위해 말을 이어 가려는 때, ${subject(childLabel)} 자신의 리듬대로 생각을 정리할 여백이 먼저 필요해지는 순간`,
    trust_exploration: `${parentLabel}의 ${subject(parentColors)} 약속과 신뢰의 기준을 먼저 세우려는 때, ${childLabel}의 ${subject(childColors)} 납득할 이유와 더 살필 가능성을 확인하려는 순간`,
    pace_adjustment: `${parentLabel}의 ${subject(parentColors)} 방향이나 반응을 앞당기려는 때, ${childLabel}의 ${subject(childColors)} 자신의 속도로 기준과 이유를 맞추려는 순간`,
  };
  return `${TYPE_META[type].name}에서는 ${typeStart[type]} ${subject(tension.title)} 시작될 수 있습니다. 이는 ${subject(parentLabel)} ${object(parentNeed)} 지키려는 흐름과 ${subject(childLabel)} ${object(childNeed)} 확인하려는 흐름이 다르기 때문입니다. ${currentCardSupport(parent.cards[1])} ${currentCardSupport(child.cards[1])}`;
}

function buildPersonalizedPractices(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
  tension: TensionPattern,
): string[] {
  const parentNeed = DIMENSION_NEED[parent.primaryDimension];
  const childNeed = DIMENSION_NEED[child.primaryDimension];
  const typePractice: Record<ParentChildRelationshipTypeId, string> = {
    steady_recovery: `이번 주 함께 지킬 약속을 한 가지로 줄이고, ${topic(parentLabel)} ${object(parentNeed)} 위해 지킬 부분을, ${topic(childLabel)} ${object(childNeed)} 위해 조정이 필요한 부분을 각각 한 줄로 적기`,
    emotional_connection: `마음이 서운해진 날, ${pairSubject(parentLabel, childLabel)} 상대의 감정을 해석하기 전에 ‘지금 나는 연결이 필요한지, 잠시 정리가 필요한지’를 한 번씩 말하기`,
    clarity_balance: `선택할 일이 생기면 ${topic(parentLabel)} 먼저 확인할 기준 하나를, ${topic(childLabel)} 더 살펴보고 싶은 이유 하나를 적어 두고 둘 다 확인한 뒤 결론 내리기`,
    vital_expansion: `새로 해 보고 싶은 일이 생기면 ${pairSubject(parentLabel, childLabel)} 각각 기대하는 변화 한 가지와 멈춰야 할 신호 한 가지를 말한 뒤 작은 범위에서만 시작하기`,
    space_respect: `대화가 무거워질 때 ${topic(childLabel)} 다시 이야기할 시간을 직접 정하고, ${topic(parentLabel)} 그 시간 전에는 해결안을 덧붙이지 않기`,
    trust_exploration: `약속을 정하기 전 ${topic(parentLabel)} 꼭 지키고 싶은 기준 하나를, ${topic(childLabel)} 납득을 위해 더 확인할 이유 하나를 말하고 두 문장을 함께 남기기`,
    pace_adjustment: `결정을 서두르게 될 때 ${pairSubject(parentLabel, childLabel)} ‘지금 정할 일’과 ‘조금 더 살필 일’을 한 가지씩 나눠 적고 서로의 칸을 바꾸지 않기`,
  };
  return [
    typePractice[type],
    `의견이 팽팽해질 때, ${currentCardAction(parent, parentLabel)} 이어서 ${currentCardAction(child, childLabel)} 그동안 상대의 말을 바로 해석하거나 고치지 않기`,
    `대화를 마친 뒤 ${recoveryAction(parent, parentLabel)} ${recoveryAction(child, childLabel)} 다음에 함께 해 볼 행동은 한 가지만 정하기`,
  ];
}

const TRIGGER_BY_DIMENSION: Record<RelationDimension, string> = {
  stability: "함께 지키기로 한 흐름이 자주 바뀌거나 약속의 기준이 흔들릴 때",
  care: "감정을 설명하기도 전에 부담이 되거나 누군가를 실망시킨 사람처럼 다뤄질 때",
  inquiry: "이유를 충분히 살피기도 전에 결론·정답·평가부터 요구받을 때",
  connection: "관계의 온도나 마음을 나눌 자리가 빠진 채 결과만 확인될 때",
  expression: "자기 생각을 꺼낸 직후 바로 고쳐지거나 과하다고 판단될 때",
  action: "직접 시도해 볼 기회 없이 준비가 덜 됐다는 이유로 멈춰 세워질 때",
  structure: "무엇을 왜 해야 하는지 모호한 채 책임이나 순응만 요구받을 때",
  space: "생각을 정리할 틈 없이 감정과 답을 바로 설명하라는 요구가 이어질 때",
};

const STRENGTH_CONDITION_BY_DIMENSION: Record<RelationDimension, string> = {
  stability: "자신이 맡은 약속을 차분히 끝까지 지키고, 그 꾸준함을 구체적으로 인정받을 때",
  care: "사람의 마음을 알아차린 방식이나 관계를 편안하게 만든 기여를 알아봐 줄 때",
  inquiry: "여러 가능성을 살핀 과정과 자신이 세운 이유를 설명할 기회를 얻을 때",
  connection: "누군가와 함께 의미를 만들거나 자신의 관심을 나누며 관계의 반응을 느낄 때",
  expression: "생각·감정·표현을 자신다운 방식으로 보여 주고, 결과보다 그 시도를 반갑게 받아들여 줄 때",
  action: "작은 선택을 직접 실행해 보고 그 결과에서 다음 방법을 찾아볼 때",
  structure: "역할과 순서가 분명한 과제에서 자신이 정리한 기준을 실제로 적용해 볼 때",
  space: "스스로 준비한 생각을 자신의 타이밍에 꺼내고, 그 깊이를 존중받을 때",
};

const DIMENSION_CONTRIBUTION: Record<RelationDimension, string> = {
  stability: "흐름을 지속시키는 약속",
  care: "관계의 마음을 살피는 배려",
  inquiry: "이유와 가능성을 비교하는 탐색",
  connection: "함께 의미를 만드는 연결",
  expression: "생각과 감정을 밖으로 꺼내는 표현",
  action: "직접 해 보며 방향을 찾는 시도",
  structure: "기준과 순서를 세우는 정리",
  space: "자기 호흡으로 판단을 익히는 여백",
};

function cardFlowAt(card: CardData | undefined, position: "inner" | "current" | "future", label: string): string {
  if (!card) return "선택된 심리카드 흐름";
  const colorFlow = CURRENT_CARD_COLOR[card.color];
  const shapeFlow = CURRENT_CARD_SHAPE[card.shape];
  if (position === "inner") return `${topic(label)} 무의식에서는 ${colorFlow} 마음을 ${shapeFlow} 방식으로 지키려는 흐름`;
  if (position === "current") return `${topic(label)} 지금 ${colorFlow} 반응이 ${shapeFlow} 태도와 함께 나타나는 흐름`;
  return `${topic(label)} 앞으로 ${colorFlow} 마음을 ${shapeFlow} 방식으로 회복해 갈 필요가 있는 흐름`;
}

function futureCardCue(card: CardData | undefined): string {
  if (!card) return "선택한 미래 심리카드가 가리키는 회복 흐름";
  return `${card.colorKor} ${card.shapeKor} 카드가 보완하는 회복 방향`;
}

function buildChildCommunication(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
): ParentChildCoaching["childCommunication"] {
  const primaryTrigger = TRIGGER_BY_DIMENSION[child.primaryDimension];
  const secondaryTrigger = TRIGGER_BY_DIMENSION[child.secondaryDimension];
  const strengthCondition = STRENGTH_CONDITION_BY_DIMENSION[child.primaryDimension];
  const secondaryContribution = DIMENSION_CONTRIBUTION[child.secondaryDimension];
  const innerFlow = cardFlowAt(child.cards[0], "inner", childLabel);
  const currentFlow = cardFlowAt(child.cards[1], "current", childLabel);
  const futureFlow = futureCardCue(child.cards[2]);
  const parentPressure = DIMENSION_CONTRIBUTION[parent.primaryDimension];
  const childColorPair = `${child.colors[0].korName}·${child.colors[1].korName}`;
  const recoveryNote = child.recoveryColor
    ? `${topic(child.recoveryColor.korName)} 회복 방향에서 마음을 다시 정돈할 여백이 필요하다는 신호로만 보완합니다.`
    : "";

  return {
    closesWhen: `${childLabel}의 1·2순위인 ${topic(childColorPair)} ${primaryTrigger} 특히 예민하게 느낄 수 있습니다. ${innerFlow}이 있고, ${currentFlow}이라 ${subject(parentLabel)} ${object(parentPressure)} 앞세우면 자신의 이유나 감정이 잘려 나간 듯 받아들일 수 있습니다. ${recoveryNote}`,
    gainsConfidenceWhen: `${childLabel}의 강점은 ${strengthCondition} 살아날 수 있습니다. 이때 ${subject(child.colors[1].korName)} 보태는 ${object(secondaryContribution)} 스스로 활용할 수 있으면, 단순히 기다려 준다는 느낌을 넘어 자신의 역량을 관계 안에서 써 볼 기회가 됩니다. 앞으로의 회복에서는 ${object(futureFlow)} 보완 근거로 삼아, 자신이 만든 다음 선택을 돌아보는 시간이 힘이 될 수 있습니다.`,
  };
}

function buildRelationshipMismatch(
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
): string {
  const parentContribution = DIMENSION_CONTRIBUTION[parent.primaryDimension];
  const childContribution = DIMENSION_CONTRIBUTION[child.primaryDimension];
  const mismatchFocus: Record<ParentChildRelationshipTypeId, string> = {
    steady_recovery: `${topic(parentLabel)} 관계를 흔들리지 않게 하려는 마음으로 ${parentContribution}을 앞세우고, ${topic(childLabel)} 그 안에서 자신의 ${childContribution}도 함께 남기고 싶어 할 수 있습니다. 그래서 보호나 배려가 한쪽에는 익숙한 돌봄으로, 다른 쪽에는 변화할 여지가 적은 틀로 읽힐 수 있습니다.`,
    emotional_connection: `${topic(parentLabel)} 마음이 이어져 있다는 확인을 먼저 하고 싶고, ${topic(childLabel)} 자신의 감정을 선택해 꺼내야 연결이 편안해질 수 있습니다. 같은 연결 욕구가 한쪽에는 빠른 공감의 요청으로, 다른 쪽에는 감정의 주도권을 빼앗기는 느낌으로 엇갈릴 수 있습니다.`,
    clarity_balance: `${topic(parentLabel)} ${parentContribution}으로 상황을 분명히 하고 싶고, ${topic(childLabel)} ${childContribution}을 통해 스스로 납득하고 싶을 수 있습니다. 이때 설명은 한쪽에는 도움의 기준이지만, 다른 쪽에는 이미 답이 정해진 대화처럼 닿을 수 있습니다.`,
    vital_expansion: `${topic(parentLabel)} ${withRo(parentContribution)} 관계를 앞으로 움직이고 싶고, ${topic(childLabel)} ${object(childContribution)} 자신의 방식으로 펼치고 싶을 수 있습니다. 격려가 한쪽에는 추진의 힘이지만, 다른 쪽에는 결과를 빨리 보여야 한다는 기대처럼 느껴질 수 있습니다.`,
    space_respect: `${topic(parentLabel)} ${withRo(parentContribution)} 관계를 놓치지 않으려 하고, ${topic(childLabel)} ${object(childContribution)} 지켜야 다시 관계에 편안히 참여할 수 있습니다. 안부와 해결의 제안이 한쪽에는 관심이지만, 다른 쪽에는 생각의 경계를 넘는 개입으로 해석될 수 있습니다.`,
    trust_exploration: `${topic(parentLabel)} ${withRo(parentContribution)} 신뢰할 수 있는 약속을 만들고 싶고, ${topic(childLabel)} ${object(childContribution)} 거쳐야 그 약속을 자기 것으로 받아들일 수 있습니다. 기준을 세우는 말이 한쪽에는 책임의 표현이지만, 다른 쪽에는 질문과 선택을 미리 닫는 말처럼 들릴 수 있습니다.`,
    pace_adjustment: `${topic(parentLabel)} ${withRo(parentContribution)} 다음 방향을 앞당기고 싶고, ${topic(childLabel)} ${object(childContribution)} 자신의 호흡으로 맞추고 싶을 수 있습니다. 같은 목표를 향해도 한쪽의 속도 제안이 다른 쪽에는 준비할 시간을 빼앗는 요구로 다가올 수 있습니다.`,
  };
  return `${mismatchFocus[type]} ${topic(parentLabel)} 자신의 ${parentContribution}을 지키려는 도움으로 말하고, ${topic(childLabel)} 자신의 ${childContribution}이 밀려나는 말로 받아들이면, ${topic(parentLabel)} ${childLabel}의 반응을 협력하지 않는 신호로, ${topic(childLabel)} ${parentLabel}의 말을 존중받지 못하는 신호로 읽어 오해가 깊어질 수 있습니다.`;
}

function buildTensionScene(parentLabel: string, childLabel: string, parent: PersonProfile, child: PersonProfile, tension: TensionPattern): LifeScene {
  return {
    title: tension.title,
    description: tension.description(parentLabel, childLabel, parent, child),
    evidence: `근거 · ${parentLabel} 1·2순위 ${parent.colors.map((color) => color.korName).join("·")}의 ${DIMENSION_LABEL[tension.parentFocus]} / ${childLabel} 1·2순위 ${child.colors.map((color) => color.korName).join("·")}의 ${DIMENSION_LABEL[tension.childFocus]} / ${parentLabel} ${currentCardSupport(parent.cards[1])} / ${childLabel} ${currentCardSupport(child.cards[1])}`,
  };
}

function buildRelationshipSummary(
  typeId: ParentChildRelationshipTypeId,
  parentLabel: string,
  childLabel: string,
  parent: PersonProfile,
  child: PersonProfile,
  tension: TensionPattern,
): RelationshipSummary {
  const type = TYPE_META[typeId];
  const parentText = `${parent.colors[0].korName}·${parent.colors[1].korName}`;
  const childText = `${child.colors[0].korName}·${child.colors[1].korName}`;
  const parentDimension = DIMENSION_LABEL[parent.primaryDimension];
  const childDimension = DIMENSION_LABEL[child.primaryDimension];
  return {
    id: typeId,
    typeName: type.name,
    accentColor: type.accentColor,
    coreSummary: `${parentLabel}의 ${parentDimension}과 ${childLabel}의 ${childDimension}이 만나, 서로의 강점을 관계 안에서 조율해 갈 수 있는 흐름입니다.`,
    description: `${parentLabel}의 1·2순위 ${parentText}는 ${parentDimension}과 ${object(DIMENSION_LABEL[parent.secondaryDimension])} 관계의 중심에 둡니다. ${childLabel}의 1·2순위 ${childText}는 ${childDimension}과 ${object(DIMENSION_LABEL[child.secondaryDimension])} 더합니다. 그래서 두 사람은 ${tension.title}처럼 서로 다른 지점이 생길 수 있지만, 그 차이를 확인하는 방식 자체가 관계의 신뢰를 키우는 자원이 될 수 있습니다.`,
    recommendedColors: tension.recommendedColors,
    closingMessage: `${parentLabel}의 ${parent.colors[0].korName}이 지키려는 ${parentDimension}과 ${childLabel}의 ${child.colors[0].korName}이 찾는 ${childDimension}은 서로를 고치는 방향이 아니라, 함께 더 편안한 선택을 만드는 힘이 될 수 있습니다.`,
  };
}

function buildCoaching(
  relationType: RelationType,
  parentGender: string | undefined,
  childGender: string | undefined,
  parent: PersonProfile,
  child: PersonProfile,
  type: ParentChildRelationshipTypeId,
  tension: TensionPattern,
): ParentChildCoaching {
  const labels = getParentChildLabels(relationType, parentGender, childGender);
  const shared = findSharedDimension(parent, child);
  const parentCurrent = currentCardSupport(parent.cards[1]);
  const childCurrent = currentCardSupport(child.cards[1]);
  const sharedScene = buildStrengthScene(labels.parent, labels.child, parent, child);
  const doMessages = buildPersonalizedDoMessages(labels.parent, labels.child, parent, child, type, sharedScene);
  const dontMessages = buildPersonalizedDontMessages(labels.parent, labels.child, parent, child, type, tension);
  const conflictStart = buildConflictStart(labels.parent, labels.child, parent, child, type, tension);
  const practices = buildPersonalizedPractices(labels.parent, labels.child, parent, child, type, tension);
  const childCommunication = buildChildCommunication(labels.parent, labels.child, parent, child);
  const mismatch = buildRelationshipMismatch(labels.parent, labels.child, parent, child, type);

  return {
    labels,
    socialRoles: {
      parent: {
        title: `${DIMENSION_ROLE[parent.primaryDimension]} 조율자`,
        description: `${topic(labels.parent)} ${parent.colors[0].korName}의 ${DIMENSION_LABEL[parent.primaryDimension]}과 ${parent.colors[1].korName}의 ${object(DIMENSION_LABEL[parent.secondaryDimension])} 바탕으로, 관계가 무리 없이 이어질 방법을 살피는 역할 에너지로 나타날 수 있습니다. ${parentCurrent}`,
      },
      child: {
        title: `${DIMENSION_ROLE[child.primaryDimension]} 탐색자`,
        description: `${topic(labels.child)} ${child.colors[0].korName}의 ${DIMENSION_LABEL[child.primaryDimension]}과 ${child.colors[1].korName}의 ${object(DIMENSION_LABEL[child.secondaryDimension])} 바탕으로, 자신에게 맞는 이유와 관계의 온도를 함께 살피는 역할 에너지로 나타날 수 있습니다. ${childCurrent}`,
      },
    },
    relationshipRoles: {
      parent: {
        title: `${object(DIMENSION_LABEL[parent.primaryDimension])} 관계에 보태는 역할`,
        description: `${topic(labels.parent)} 관계 안에서 ${object(DIMENSION_LABEL[parent.primaryDimension])} 먼저 지키려는 역할로 나타날 수 있습니다.`,
      },
      child: {
        title: `${object(DIMENSION_LABEL[child.primaryDimension])} 관계에 더하는 역할`,
        description: `${topic(labels.child)} 관계 안에서 ${object(DIMENSION_LABEL[child.primaryDimension])} 더하며 자신의 방식으로 참여하려는 역할로 나타날 수 있습니다.`,
      },
      together: `${subject(labels.parent)} ${object(DIMENSION_LABEL[parent.primaryDimension])} 먼저 세우고 ${subject(labels.child)} ${object(DIMENSION_LABEL[child.primaryDimension])} 충분히 말할 수 있을 때, 두 사람은 ${object(shared ? DIMENSION_LABEL[shared] : "서로 다른 기준을 확인하는 대화")} 관계의 자원으로 만들 수 있습니다. 이번 조합에서는 ${tension.title}에 해당하는 차이가 보이므로, 무엇을 바로 정할지와 무엇을 더 살필지를 구분하는 편이 잘 맞습니다.`,
    },
    childCommunication,
    dialogue: {
      doMessages,
      dontMessages: [
        ...dontMessages,
      ],
    },
    conflictRecovery: {
      conflictStart,
      parentIntent: `${labels.parent}의 말과 행동은 ${parent.colors[0].korName}·${parent.colors[1].korName}에서 드러난 ${object(DIMENSION_LABEL[parent.primaryDimension])} 관계 안에 지키고 싶은 마음에서 출발할 수 있습니다. ${parentCurrent}`,
      childReception: `${topic(labels.child)} ${child.colors[0].korName}·${child.colors[1].korName}의 ${object(DIMENSION_LABEL[child.primaryDimension])} 충분히 반영되지 않으면, 도움보다 자신의 방식이 밀려난 신호로 받아들일 수 있습니다. ${childCurrent}`,
      mismatch,
      recoveryOrder: `먼저 ${pairSubject(labels.parent, labels.child)} 각각 무엇을 지키고 싶었는지 한 문장으로 확인합니다. 다음으로 이번에 바로 정할 일과 다시 살펴볼 일을 나눕니다. ${recoverySupport(parent, labels.parent)} ${recoverySupport(child, labels.child)}`,
    },
    practices,
  };
}

export function buildParentChildRelationshipAnalysis(input: {
  relationType: RelationType;
  parentGender?: string;
  childGender?: string;
  parent: PersonInput;
  child: PersonInput;
}): ParentChildRelationshipAnalysis {
  const parent = buildPersonProfile(input.parent);
  const child = buildPersonProfile(input.child);
  const labels = getParentChildLabels(input.relationType, input.parentGender, input.childGender);
  const typeId = determineType(parent, child);
  const tension = findTension(parent, child);
  const strength = buildStrengthScene(labels.parent, labels.child, parent, child);
  const tensionScene = buildTensionScene(labels.parent, labels.child, parent, child, tension);
  const summary = buildRelationshipSummary(typeId, labels.parent, labels.child, parent, child, tension);
  const coaching = buildCoaching(input.relationType, input.parentGender, input.childGender, parent, child, typeId, tension);

  return {
    relationshipSummary: summary,
    coaching,
    lifeScenes: { strengths: strength ? [strength] : [], tensions: [tensionScene] },
    sectionEvidence: [
      {
        section: "관계 요약과 사회적 역할",
        colorBasis: `${labels.parent} 1·2순위 ${parent.colors.map((color) => color.korName).join("·")}의 ${DIMENSION_LABEL[parent.primaryDimension]}·${DIMENSION_LABEL[parent.secondaryDimension]}과 ${labels.child} 1·2순위 ${child.colors.map((color) => color.korName).join("·")}의 ${DIMENSION_LABEL[child.primaryDimension]}·${object(DIMENSION_LABEL[child.secondaryDimension])} 비교했습니다.`,
        cardSupport: `${labels.parent} ${currentCardSupport(parent.cards[1])} ${labels.child} ${currentCardSupport(child.cards[1])}`,
      },
      {
        section: "자녀 기질 맞춤 소통",
        colorBasis: `${labels.child}의 ${DIMENSION_LABEL[child.primaryDimension]}이 ${labels.parent}의 ${DIMENSION_LABEL[parent.primaryDimension]}과 만나는 지점을 읽었습니다.`,
        cardSupport: currentCardSupport(child.cards[1]),
      },
      {
        section: "실제 생활에서 만나는 지점",
        colorBasis: strength
          ? `${strength.title}과 ${tensionScene.title}은 이번 1·2순위 컬러 비교에서 근거가 뚜렷한 장면만 각각 하나씩 선별했습니다.`
          : `${tensionScene.title}만 1·2순위 컬러의 실제 차이가 뚜렷해 선별했습니다. 공통 근거가 약한 잘 맞는 생활 장면은 억지로 만들지 않았습니다.`,
        cardSupport: `${currentCardSupport(parent.cards[1])} ${currentCardSupport(child.cards[1])}`,
      },
      {
        section: "DO & DON'T·갈등과 회복·3가지 실천",
        colorBasis: `${TYPE_META[typeId].name}의 1·2순위 컬러 교차와 ${tension.title}의 실제 긴장을 DON'T·갈등 시작·실천에 각각 다른 역할로 적용했습니다.`,
        cardSupport: "심리카드는 현재 반응을 보완해 DON'T의 부담 지점과 두 번째 실천의 대화 방식에만 반영하며, 관계 유형이나 생활 장면을 결정하지 않습니다.",
        recoveryUse: recoverySupport(parent, labels.parent) + " " + recoverySupport(child, labels.child),
      },
    ],
  };
}

export const PARENT_CHILD_RELATIONSHIP_TYPE_IDS: ParentChildRelationshipTypeId[] = [
  "steady_recovery",
  "emotional_connection",
  "clarity_balance",
  "vital_expansion",
  "space_respect",
  "trust_exploration",
  "pace_adjustment",
];
