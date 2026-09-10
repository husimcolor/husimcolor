import type { CardData } from "../constants/cardData";

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
    description: "일상의 기준과 약속을 살피며, 관계가 흔들릴 때 다시 중심을 찾게 하는 역할을 맡기 쉽습니다.",
  },
  movement: {
    title: "관계를 움직이게 하는 역할",
    description: "답답한 흐름에 말과 행동을 더해, 관계가 멈추지 않고 앞으로 나아가게 하는 역할을 맡기 쉽습니다.",
  },
  depth: {
    title: "마음을 깊게 읽는 역할",
    description: "겉으로 드러난 말보다 마음의 결을 살피며, 관계가 놓치기 쉬운 의미를 붙잡는 역할을 맡기 쉽습니다.",
  },
  warmth: {
    title: "관계에 온기를 더하는 역할",
    description: "서로의 기분을 살피고 다정한 연결을 만들어, 함께 있을 때의 편안함을 키우는 역할을 맡기 쉽습니다.",
  },
  space: {
    title: "관계에 숨을 만드는 역할",
    description: "각자의 생각과 리듬을 존중하며, 부담 없이 다시 이야기할 수 있는 여유를 만드는 역할을 맡기 쉽습니다.",
  },
};

function getRoleTheme(person: PersonSignals, cards: Array<CardData | undefined>): RoleTheme {
  const source = [
    person.relationshipStyle,
    person.emotionExpression,
    cards[0]?.psychologyFlow,
    cards[1]?.personalityFlow,
    cards[2]?.recoveryDirection,
  ].filter(Boolean).join(" ");

  if (/(활발|직접|빠르|표현하고 싶은|추진|성장|움직)/.test(source)) return "movement";
  if (/(내면|깊|정리|침묵|성찰|신중)/.test(source)) return "depth";
  if (/(배려|온기|공감|돌보|다정|연결)/.test(source)) return "warmth";
  if (/(공간|자유|가벼|리듬|여유)/.test(source)) return "space";
  return "balance";
}

function alternateTheme(theme: RoleTheme): RoleTheme {
  const map: Record<RoleTheme, RoleTheme> = {
    balance: "warmth",
    movement: "balance",
    depth: "space",
    warmth: "depth",
    space: "balance",
  };
  return map[theme];
}

/**
 * 부부·연인 전용 역할 분석입니다. A/B의 기존 3컬러 성향과 3장 카드 흐름에서
 * 이미 산출된 관계·표현 문장을 근거로, 관계 안에서 자연스럽게 맡기 쉬운 역할을 읽습니다.
 */
export function buildRomanticRelationshipRoles({
  personA,
  personB,
  cardsA,
  cardsB,
}: {
  personA: PersonSignals;
  personB: PersonSignals;
  cardsA: Array<CardData | undefined>;
  cardsB: Array<CardData | undefined>;
}): RomanticRelationshipRoles {
  const themeA = getRoleTheme(personA, cardsA);
  let themeB = getRoleTheme(personB, cardsB);
  if (themeA === themeB) themeB = alternateTheme(themeB);

  const roleA = ROLE_COPY[themeA];
  const roleB = ROLE_COPY[themeB];
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
    together: pairKey in togetherMap
      ? togetherMap[pairKey]
      : `${roleA.title}과 ${roleB.title}이 만나면 서로 다른 장점이 관계를 넓혀갈 수 있습니다. 한쪽의 방식만 정답으로 두기보다, 각자의 역할이 과해질 때는 잠시 바꿔 맡아보며 함께 균형을 찾는 것이 좋습니다.`,
  };
}
