import type { CardData } from "../constants/cardData";
import type { ColorData } from "../constants/colorData";
import { getRomanticColorProfile } from "./romantic-color-profile";

export type RomanticRelationshipRole = {
  title: string;
  description: string;
};

export type RomanticRelationshipRoles = {
  personA: RomanticRelationshipRole;
  personB: RomanticRelationshipRole;
  together: string;
};

type PersonSignals = {
  relationshipStyle: string;
  emotionExpression: string;
};

type RoleTheme = "balance" | "movement" | "depth" | "warmth" | "space";

const ROLE_COPY: Record<RoleTheme, RomanticRelationshipRole> = {
  balance: {
    title: "관계의 균형을 잡는 역할",
    description: "일상의 기준과 약속을 살피며, 관계가 흔들릴 때 다시 중심을 찾는 쪽입니다.",
  },
  movement: {
    title: "관계를 움직이게 하는 역할",
    description: "답답한 흐름에는 말과 행동을 더해, 관계를 앞으로 나아가게 합니다.",
  },
  depth: {
    title: "마음을 깊게 읽는 역할",
    description: "겉으로 드러난 말보다 마음의 결을 살피며, 관계가 놓치기 쉬운 의미를 붙잡습니다.",
  },
  warmth: {
    title: "관계에 온기를 더하는 역할",
    description: "서로의 기분을 살피고 다정한 연결을 만들어, 함께 있을 때의 편안함을 키웁니다.",
  },
  space: {
    title: "관계에 숨을 만드는 역할",
    description: "각자의 생각과 리듬을 존중하며, 부담 없이 다시 이야기할 수 있는 여유를 만듭니다.",
  },
};

const COLOR_THEME: Record<string, RoleTheme> = {
  red: "movement", orange: "movement", yellow: "balance", green: "balance", blue: "balance",
  indigo: "depth", violet: "depth", pink: "warmth", magenta: "depth", coral: "warmth",
  gold: "movement", brown: "balance", beige: "warmth", white: "balance", black: "depth",
  silver: "balance", olive: "balance", mint: "space", skyblue: "space", lavender: "depth",
  peach: "warmth", terracotta: "warmth", sage: "warmth", teal: "space", cream: "space",
};

function getRoleTheme(
  person: PersonSignals,
  cards: Array<CardData | undefined>,
  colors: Array<Pick<ColorData, "id">> | undefined,
): RoleTheme {
  const scores: Record<RoleTheme, number> = { balance: 0, movement: 0, depth: 0, warmth: 0, space: 0 };
  const patterns: Array<[RoleTheme, RegExp]> = [
    ["movement", /(활발|직접|빠르|표현하고 싶은|추진|성장|움직)/g],
    ["depth", /(내면|깊|정리|침묵|성찰|신중)/g],
    ["warmth", /(배려|온기|공감|돌보|다정|따뜻|연결)/g],
    ["space", /(공간|자유|가벼|리듬|여유)/g],
    ["balance", /(안정|신뢰|기준|꾸준|균형|약속)/g],
  ];
  const scoreText = (text: string | undefined, weight: number) => {
    if (!text) return;
    patterns.forEach(([theme, pattern]) => { scores[theme] += (text.match(pattern)?.length ?? 0) * weight; });
  };

  // 1·2·3순위 컬러의 역할을 유지하되, 1순위가 단독으로 모든 해석을 덮지 않도록 차등 반영한다.
  [12, 6, 3].forEach((weight, index) => {
    const theme = colors?.[index] ? COLOR_THEME[colors[index]!.id] : undefined;
    if (theme) scores[theme] += weight;
  });
  scoreText(person.relationshipStyle, 2);
  scoreText(person.emotionExpression, 2);
  // 카드 1·2·3번은 무의식·현재·회복의 결을 보태지만, 한 카드의 일반적인 단어가 컬러 기질 전체를 뒤집지 않게 보조로 반영한다.
  scoreText(cards[0]?.psychologyFlow, 0.5);
  scoreText(cards[1]?.personalityFlow, 0.5);
  scoreText(cards[2]?.recoveryDirection, 0.5);

  const priority: RoleTheme[] = ["balance", "warmth", "depth", "space", "movement"];
  return priority.reduce((best, theme) => scores[theme] > scores[best] ? theme : best, "balance");
}

function hasFinalConsonant(value: string) {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
}

function topicParticle(value: string) {
  return hasFinalConsonant(value) ? "은" : "는";
}

function subjectParticle(value: string) {
  return hasFinalConsonant(value) ? "이" : "가";
}

function objectParticle(value: string) {
  return hasFinalConsonant(value) ? "을" : "를";
}

function sameThemeTogether(
  theme: RoleTheme,
  role: RomanticRelationshipRole,
  colorA?: Pick<ColorData, "id" | "korName">,
  colorB?: Pick<ColorData, "id" | "korName">,
) {
  const profileA = getRomanticColorProfile(colorA?.id);
  const profileB = getRomanticColorProfile(colorB?.id);
  const colorDifference = colorA && colorB && profileA && profileB
    ? `${colorA.korName}${topicParticle(colorA.korName)} ${profileA.relationshipStrength}${objectParticle(profileA.relationshipStrength)} 바탕으로, ${colorB.korName}${topicParticle(colorB.korName)} ${profileB.relationshipStrength}${objectParticle(profileB.relationshipStrength)} 바탕으로 같은 역할 안에서도 서로 다른 힘을 보탭니다.`
    : "같은 역할 안에서도 각자가 관계에 보태는 방식은 다를 수 있습니다.";
  const caution: Record<RoleTheme, string> = {
    balance: "둘 다 기준과 안정을 살피는 만큼, 무엇을 먼저 정할지와 각자의 부담을 말로 나누는 것이 좋습니다.",
    movement: "둘 다 관계를 움직이고 싶어 할수록 속도가 앞설 수 있으니, 함께 움직이기 전 서로의 준비를 확인해 보세요.",
    depth: "둘 다 충분히 생각한 뒤 말하려는 흐름이 길어지지 않도록, 정리 중이라는 짧은 신호를 남겨두는 것이 좋습니다.",
    warmth: "둘 다 상대를 먼저 살피느라 자신의 필요를 짐작에 맡기지 않도록, 받고 싶은 반응을 한 문장으로 알려주는 것이 좋습니다.",
    space: "둘 다 각자의 리듬을 존중하는 만큼, 쉬는 시간의 끝과 다시 연결할 때를 가볍게 약속해 두는 것이 좋습니다.",
  };
  return `두 사람 모두 ${role.title.replace(/ 역할$/, "")} 쪽으로 자연스럽게 힘이 실립니다. ${colorDifference} ${caution[theme]}`;
}

/**
 * 부부·연인 전용 역할 분석입니다. A/B의 기존 3컬러 성향과 3장 카드 흐름에서
 * 이미 산출된 관계·표현 문장을 근거로, 관계 안에서 자연스럽게 맡기 쉬운 역할을 읽습니다.
 */
export function buildRomanticRelationshipRoles({
  personA,
  personB,
  colorsA,
  colorsB,
  cardsA,
  cardsB,
}: {
  personA: PersonSignals;
  personB: PersonSignals;
  /** 선택 순서를 보존한 컬러 근거. 없으면 기존 역할 문구를 그대로 사용한다. */
  colorsA?: Array<Pick<ColorData, "id" | "korName">>;
  colorsB?: Array<Pick<ColorData, "id" | "korName">>;
  cardsA: Array<CardData | undefined>;
  cardsB: Array<CardData | undefined>;
}): RomanticRelationshipRoles {
  const themeA = getRoleTheme(personA, cardsA, colorsA);
  const themeB = getRoleTheme(personB, cardsB, colorsB);

  const colorA = colorsA?.[0];
  const colorB = colorsB?.[0];
  const profileA = getRomanticColorProfile(colorA?.id);
  const profileB = getRomanticColorProfile(colorB?.id);
  const baseRoleA = ROLE_COPY[themeA];
  const baseRoleB = ROLE_COPY[themeB];
  const roleA: RomanticRelationshipRole = profileA && colorA
    ? { ...baseRoleA, description: `${colorA.korName}의 ${profileA.relationshipStrength}${subjectParticle(profileA.relationshipStrength)} 두드러집니다. ${baseRoleA.description} 다만 ${profileA.overloadCaution}` }
    : baseRoleA;
  const roleB: RomanticRelationshipRole = profileB && colorB
    ? { ...baseRoleB, description: `${colorB.korName}의 ${profileB.relationshipStrength}${subjectParticle(profileB.relationshipStrength)} 두드러집니다. ${baseRoleB.description} 다만 ${profileB.overloadCaution}` }
    : baseRoleB;
  const pairKey = [themeA, themeB].sort().join("|");
  const togetherMap: Record<string, string> = {
    "balance|movement": `${roleA.title}과 ${roleB.title}이 만나면 관계에는 안정과 변화가 함께 들어옵니다. 한쪽이 모든 기준을 붙잡거나 다른 한쪽이 속도를 앞세우면 답답함이 커질 수 있으니, 중요한 일은 기준을 먼저 맞추고 그 안에서 새 시도를 더해보는 것이 좋습니다.`,
    "depth|warmth": `${roleA.title}과 ${roleB.title}이 만나면 말하지 못한 마음도 다정하게 다뤄질 수 있습니다. 다만 한쪽이 마음을 오래 품고 다른 한쪽이 계속 분위기를 살피면 둘 다 지칠 수 있으니, 조용한 시간 뒤에는 짧게라도 현재 마음을 나누는 균형이 필요합니다.`,
    "depth|space": `${roleA.title}과 ${roleB.title}이 만나면 서로의 속도와 경계를 존중하는 관계가 될 수 있습니다. 다만 둘 다 말을 아끼는 쪽으로 기울면 거리감으로 느껴질 수 있으니, 혼자 정리할 시간과 다시 대화할 시간을 함께 정해두는 것이 도움이 됩니다.`,
    "balance|warmth": `${roleA.title}과 ${roleB.title}이 만나면 일상의 신뢰와 정서적 편안함이 함께 자랄 수 있습니다. 한쪽이 책임을 너무 많이 지거나 다른 한쪽이 마음을 먼저 챙기느라 지치지 않도록, 고마움과 부담을 말로 나누는 균형이 필요합니다.`,
    "movement|warmth": `${roleA.title}과 ${roleB.title}이 만나면 관계에 활기와 다정함이 함께 더해질 수 있습니다. 다만 한쪽의 빠른 변화가 다른 한쪽에게 부담이 되지 않도록, 먼저 마음을 확인한 뒤 함께 움직이는 순서가 관계를 편안하게 만듭니다.`,
    "movement|space": `${roleA.title}과 ${roleB.title}이 만나면 가까워짐과 각자의 여유가 함께 존중될 수 있습니다. 다만 행동의 속도와 쉬는 시간이 엇갈리면 오해가 생길 수 있으니, 함께할 시간과 혼자 쉬는 시간을 미리 가볍게 맞춰보는 것이 좋습니다.`,
  };

  return {
    personA: roleA,
    personB: roleB,
    // 동일한 성향을 억지로 다른 역할로 바꾸지 않는다. 컬러별 강점·유의점에서 두 사람의 차이를 읽는다.
    together: themeA === themeB
      ? sameThemeTogether(themeA, baseRoleA, colorA, colorB)
      : pairKey in togetherMap
        ? togetherMap[pairKey]
        : `${roleA.title}과 ${roleB.title}이 만나면 서로 다른 장점이 관계를 넓혀갈 수 있습니다. 한쪽의 방식만 정답으로 두기보다, 각자의 역할이 과해질 때는 잠시 바꿔 맡아보며 함께 균형을 찾는 것이 좋습니다.`,
  };
}
