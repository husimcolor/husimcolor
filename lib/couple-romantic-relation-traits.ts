import type { CardData } from "../constants/cardData";
import type { ColorData } from "../constants/colorData";
import { buildRomanticColorLead, getRomanticColorProfile, type RomanticColorProfile } from "./romantic-color-profile";

export type RomanticRelationTrait = {
  title: "감정 교류" | "표현 리듬" | "갈등 회복";
  description: string;
};

type PersonSignals = {
  relationshipStyle: string;
  emotionExpression: string;
};

type RomanticRelationTraitInput = {
  personA: PersonSignals;
  personB: PersonSignals;
  /** 1·2·3순위 컬러의 순서를 보존해 관계 특성의 근거를 보강한다. */
  colorsA?: Array<Pick<ColorData, "id" | "korName">>;
  colorsB?: Array<Pick<ColorData, "id" | "korName">>;
  cardsA: Array<CardData | undefined>;
  cardsB: Array<CardData | undefined>;
  expressionDescription: string;
  recoveryDescription: string;
  /** 부부는 공동생활, 연인은 비동거 만남·연락 문맥으로 fallback을 분기한다. */
  relationType?: string;
  /** 결제자·초대 순서가 아닌 실제 입력 역할을 관계 특성의 근거에 표시한다. */
  personLabels?: { personA: string; personB: string };
};

type InteractionTheme = "balance" | "movement" | "depth" | "warmth" | "space";
type RelationContext = RomanticRelationTrait["title"];
type ColorReference = {
  korName: string;
  profile: RomanticColorProfile;
};

function getInteractionTheme(person: PersonSignals, cards: Array<CardData | undefined>): InteractionTheme {
  const scores: Record<InteractionTheme, number> = {
    balance: 0,
    movement: 0,
    depth: 0,
    warmth: 0,
    space: 0,
  };
  const patterns: Array<[InteractionTheme, RegExp]> = [
    ["movement", /(활발|직접|빠르|표현하고 싶은|추진|성장|움직)/g],
    ["depth", /(내면|깊|정리|침묵|성찰|신중)/g],
    ["warmth", /(배려|온기|공감|돌보|다정|따뜻|연결)/g],
    ["space", /(공간|자유|가벼|리듬|여유)/g],
    ["balance", /(안정|신뢰|기준|꾸준|균형|약속)/g],
  ];
  const addSignalScore = (text: string | undefined, weight: number) => {
    if (!text) return;
    patterns.forEach(([theme, pattern]) => {
      const count = text.match(pattern)?.length ?? 0;
      scores[theme] += count * weight;
    });
  };

  // 개인의 관계 성향과 표현 방식은 이미 3컬러 전체에서 통합된 결과이므로 더 큰 비중을 둡니다.
  addSignalScore(person.relationshipStyle, 3);
  addSignalScore(person.emotionExpression, 3);
  // 카드 흐름은 무의식·현재·회복의 결을 보태되, 한 카드의 일반적인 단어가 전체를 덮지 않게 보조로 반영합니다.
  cards.forEach((card) => {
    addSignalScore(card?.psychologyFlow, 1);
    addSignalScore(card?.personalityFlow, 1);
    addSignalScore(card?.recoveryDirection, 1);
  });

  const priority: InteractionTheme[] = ["balance", "warmth", "depth", "space", "movement"];
  return priority.reduce((best, theme) => scores[theme] > scores[best] ? theme : best, "balance");
}

function getPairKey(themeA: InteractionTheme, themeB: InteractionTheme): string {
  return [themeA, themeB].sort().join("|");
}

function buildEmotionExchange(pairKey: string): string | undefined {
  const copy: Record<string, string> = {
    "balance|movement": "관계의 편안함을 지키고 싶은 마음과 변화를 통해 마음을 확인하고 싶은 흐름이 함께 있습니다. 같은 관심도 한쪽에는 안정이, 다른 한쪽에는 반응이 필요하게 느껴질 수 있으니, 무엇을 바라는지 먼저 짧게 말해주면 감정 교류가 부드러워집니다.",
    "depth|warmth": "말로 다 하지 않은 마음까지 알아주고 싶은 흐름과, 다정하게 마음을 이어가고 싶은 흐름이 만납니다. 서로를 잘 살피는 만큼 짐작만으로 결론 내리지 말고, 지금 필요한 위로나 거리를 가볍게 확인해보는 것이 좋습니다.",
    "depth|space": "마음을 충분히 가다듬고 싶어 하는 흐름과 각자의 리듬을 존중하고 싶은 흐름이 겹칩니다. 조용함이 무관심으로 읽히지 않도록, 혼자 정리하는 중에도 다시 연결할 마음이 있다는 신호를 남겨두면 안정감이 커집니다.",
    "balance|warmth": "일상의 신뢰를 쌓고 싶은 마음과 다정한 연결을 바라는 마음이 함께 흐릅니다. 익숙함 속에서도 고마움과 반가움을 말로 전하면, 두 사람 모두 관계가 소중히 다뤄진다고 느낄 수 있습니다.",
    "movement|warmth": "가까워지고 싶은 힘과 다정하게 반응하고 싶은 마음이 함께 살아 있습니다. 감정이 커졌을 때 바로 답을 찾기보다, 먼저 마음을 받아준 뒤 다음 이야기를 이어가면 친밀감이 더 편안하게 자랍니다.",
    "movement|space": "연결을 확인하고 싶은 힘과 각자의 숨 쉴 여유를 지키고 싶은 마음이 만나고 있습니다. 연락이나 대화의 빈도를 정답으로 삼기보다, 서로가 편안함을 느끼는 신호와 쉬는 시간을 함께 맞춰보는 것이 도움이 됩니다.",
  };
  return copy[pairKey];
}

function buildExpressionRhythm(pairKey: string): string | undefined {
  const copy: Record<string, string> = {
    "balance|movement": "한쪽은 생각을 정리한 뒤에, 다른 한쪽은 움직이며 마음을 확인하고 싶어질 수 있습니다. 중요한 이야기는 바로 결론을 내기보다 ‘지금은 듣고 싶다’와 ‘조금 뒤에 답하고 싶다’를 구분해 말하면 서로의 속도가 존중됩니다.",
    "depth|warmth": "마음을 조심스럽게 꺼내는 리듬과 따뜻한 반응으로 이어가고 싶은 리듬이 만납니다. 깊은 이야기를 나눌 때는 말하는 사람에게는 기다릴 여백을, 듣는 사람에게는 짧은 공감의 표현을 남겨두면 대화가 끊기지 않습니다.",
    "depth|space": "두 사람 모두 속마음을 바로 꺼내기보다 자기 방식으로 정리하는 시간이 필요할 수 있습니다. 대화가 멈춘 순간을 문제로 보기보다, 다시 이야기할 시간과 한 문장의 안부를 약속해두면 침묵도 관계의 여유가 됩니다.",
    "balance|warmth": "일상을 안정적으로 맞추려는 대화와 정서적 반응을 나누고 싶은 대화가 함께 필요해집니다. 해결할 이야기와 마음을 듣는 시간을 나누어두면, 실용적인 대화도 다정함을 잃지 않을 수 있습니다.",
    "movement|warmth": "표현을 통해 관계를 움직이고 싶은 리듬과 다정하게 받아주며 이어가고 싶은 리듬이 만납니다. 감정이 올라온 순간에는 속도를 조금 늦추고, 상대가 들을 준비가 되었는지 확인한 뒤 이야기하면 같은 말도 더 편안하게 전해집니다.",
    "movement|space": "가까워지기 위해 바로 말하고 싶은 순간과, 마음을 가다듬은 뒤 이야기하고 싶은 순간이 엇갈릴 수 있습니다. 급한 대화와 쉬어가는 시간을 미리 구분해두면, 서로 다른 표현 속도가 오해 대신 균형이 됩니다.",
  };
  return copy[pairKey];
}

function buildConflictRecovery(pairKey: string): string | undefined {
  const copy: Record<string, string> = {
    "balance|movement": "갈등 뒤에는 빨리 다시 움직이고 싶은 마음과 충분히 정리한 뒤 안정감을 확인하고 싶은 마음이 함께 나타날 수 있습니다. 바로 해결을 서두르기보다, 잠시 쉬는 시간과 다시 대화할 시점을 함께 정하면 회복이 더 현실적으로 이어집니다.",
    "depth|warmth": "갈등의 의미를 오래 생각하는 흐름과 분위기를 먼저 부드럽게 만들고 싶은 흐름이 만납니다. 사과나 위로를 급하게 완성하려 하기보다, 마음을 받아주는 짧은 말 뒤에 차분히 이유를 나누면 두 사람 모두 덜 지칩니다.",
    "depth|space": "갈등 뒤에는 각자의 마음을 가다듬을 시간이 특히 중요하게 느껴질 수 있습니다. 다만 둘 다 물러난 채 오래 머물지 않도록, 쉬는 시간의 끝과 다시 연결하는 작은 행동을 함께 정해두는 것이 관계를 지켜줍니다.",
    "balance|warmth": "갈등을 정리하고 싶은 마음과 관계의 온기를 먼저 되찾고 싶은 마음이 함께 있습니다. 문제의 순서와 감정의 순서를 나누어 다루면, 해결 과정에서도 서로가 한편이라는 감각을 놓치지 않을 수 있습니다.",
    "movement|warmth": "다시 가까워지기 위해 먼저 움직이고 싶은 마음과 다정하게 안정감을 확인하고 싶은 마음이 만납니다. 감정이 격해진 직후에는 해결책보다 ‘우리는 다시 이야기할 수 있다’는 신호를 먼저 주고받는 편이 회복에 도움이 됩니다.",
    "movement|space": "갈등 뒤 바로 풀고 싶은 힘과 잠시 거리를 두고 회복하고 싶은 흐름이 함께 나타날 수 있습니다. 한쪽의 기다림을 회피로, 다른 한쪽의 시도를 압박으로 읽지 않도록, 쉬는 시간과 재대화 약속을 구체적으로 맞춰보는 것이 좋습니다.",
  };
  return copy[pairKey];
}

function colorReference(color?: Pick<ColorData, "id" | "korName">): ColorReference | undefined {
  const profile = getRomanticColorProfile(color?.id);
  return color && profile ? { korName: color.korName, profile } : undefined;
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

function relationshipScene(relationType: RomanticRelationTraitInput["relationType"], context: RelationContext) {
  const scenes = relationType === "부부"
    ? {
        "감정 교류": "공동생활의 감정이 엇갈릴 때도",
        "표현 리듬": "생활비나 집안일처럼 바로 조율할 일이 생길 때",
        "갈등 회복": "공동 공간과 일상의 리듬을 다시 맞출 때",
      }
    : {
        "감정 교류": "연락과 만남 사이에 감정이 엇갈릴 때도",
        "표현 리듬": "답장이나 다음 만남을 정하는 대화에서",
        "갈등 회복": "각자의 시간을 보낸 뒤 다시 만날 때",
      };
  return scenes[context];
}

function cardBasis(
  context: RelationContext,
  cardsA: Array<CardData | undefined>,
  cardsB: Array<CardData | undefined>,
  labels?: { personA: string; personB: string },
) {
  const index = context === "감정 교류" ? 0 : context === "표현 리듬" ? 1 : 2;
  const position = context === "감정 교류" ? "무의식" : context === "표현 리듬" ? "현재 흐름" : "회복 방향";
  const scene = context === "감정 교류"
    ? "평소 관계에서 무엇을 바라는지"
    : context === "표현 리듬"
      ? "지금 대화와 연락에서 어떤 속도가 편한지"
      : "갈등 뒤 어떤 방식으로 다시 연결할지";
  const describe = (card?: CardData) => card
    ? `${card.colorKor} ${card.shapeKor} "${card.energyTitle}" 카드`
    : "선택한 심리카드";
  const flow = (card?: CardData) => {
    if (!card) return "현재 마음을 살피는";
    const source = context === "감정 교류"
      ? card.psychologyFlow
      : context === "표현 리듬"
        ? card.personalityFlow
        : card.recoveryDirection;
    return source
      .trim()
      .split(/(?<=[.!?])\s+/)[0]
      ?.replace(/^현재 당신은\s*/, "")
      .replace(/^지금 당신은\s*/, "")
      .replace(/^당신은\s*/, "")
      .replace(/[.!?]+$/, "") ?? "현재 마음을 살피는";
  };
  const personA = labels?.personA ?? "첫 번째 사람";
  const personB = labels?.personB ?? "두 번째 사람";
  return `${position}에는 ${personA}${subjectParticle(personA)} 선택한 ${describe(cardsA[index])}와 ${personB}${subjectParticle(personB)} 선택한 ${describe(cardsB[index])}가 놓여 있습니다. ${personA}의 카드에는 "${flow(cardsA[index])}"라는 흐름이, ${personB}의 카드에는 "${flow(cardsB[index])}"라는 흐름이 담겨 있습니다. 이 카드들은 ${scene}를 살피는 근거가 됩니다.`;
}

/**
 * 템플릿이 없는 조합은 같은 범용 문단을 재사용하지 않는다.
 * 해당 순위 컬러의 기존 관계 강점·유의점을 문장 근거로 삼아, 부부/연인 생활 문맥으로 마무리한다.
 */
function buildColorSpecificFallback(
  context: RelationContext,
  colorA?: Pick<ColorData, "id" | "korName">,
  colorB?: Pick<ColorData, "id" | "korName">,
  relationType?: RomanticRelationTraitInput["relationType"],
) {
  const left = colorReference(colorA);
  const right = colorReference(colorB);
  if (!left || !right) {
    return context === "감정 교류"
      ? "서로가 바라는 연결의 모양을 짧게 나누면 감정 교류가 한결 부드러워질 수 있습니다."
      : context === "표현 리듬"
        ? "듣고 싶은 때와 생각을 정리할 때를 알려주면 서로의 리듬이 관계를 지키는 장점이 됩니다."
        : "잠시 숨을 고르는 시간과 다시 연결하는 약속을 함께 만들면 갈등도 관계를 이해하는 계기가 될 수 있습니다.";
  }

  const scene = relationshipScene(relationType, context);
  const sameColor = left.korName === right.korName;
  if (context === "감정 교류") {
    if (sameColor) {
      return `두 사람 모두 ${left.korName}의 ${left.profile.relationshipStrength}으로 연결을 확인하려는 흐름이 있습니다. ${scene} 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다.`;
    }
    return `${left.korName}${topicParticle(left.korName)} ${left.profile.relationshipStrength}으로 마음을 드러내고, ${right.korName}${topicParticle(right.korName)} ${right.profile.relationshipStrength}으로 연결을 확인하려 할 수 있습니다. ${scene} 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다.`;
  }
  if (context === "표현 리듬") {
    if (sameColor) {
      return `두 사람 모두 ${left.korName}의 ${left.profile.relationshipStrength}${subjectParticle(left.profile.relationshipStrength)} 드러나는 방식으로 말할 수 있습니다. ${scene} 바로 답하고 싶은지, 생각을 정리한 뒤 말하고 싶은지를 구분해두면 서로의 속도가 존중됩니다.`;
    }
    return `${left.korName}${topicParticle(left.korName)} ${left.profile.relationshipStrength}${subjectParticle(left.profile.relationshipStrength)} 드러나는 방식으로, ${right.korName}${topicParticle(right.korName)} ${right.profile.relationshipStrength}${subjectParticle(right.profile.relationshipStrength)} 드러나는 방식으로 말할 수 있습니다. ${scene} 바로 답하고 싶은지, 생각을 정리한 뒤 말하고 싶은지를 구분해두면 서로의 속도가 존중됩니다.`;
  }
  if (sameColor) {
    return `두 사람 모두 ${left.korName}의 흐름에서 ${left.profile.overloadCaution} ${scene} 다시 이야기할 시점을 함께 정해두면 각자의 회복 방식이 관계를 지키는 힘이 됩니다.`;
  }
  return `${left.korName} 쪽에서는 ${left.profile.overloadCaution} ${right.korName} 쪽에서는 ${right.profile.overloadCaution} ${scene} 다시 이야기할 시점을 함께 정해두면 각자의 회복 방식이 관계를 지키는 힘이 됩니다.`;
}

/**
 * 부부·연인 관계 전용의 비수치형 관계 특성 카드입니다.
 * A/B 개인 결과를 다시 나열하지 않고, 기존 3컬러 성향과 1·2·3번 카드 흐름을
 * 바탕으로 두 사람 사이의 감정·표현·회복 상호작용을 읽습니다.
 */
export function buildRomanticRelationTraits({
  personA,
  personB,
  colorsA,
  colorsB,
  cardsA,
  cardsB,
  relationType,
  personLabels,
}: RomanticRelationTraitInput): RomanticRelationTrait[] {
  const pairKey = getPairKey(
    getInteractionTheme(personA, cardsA),
    getInteractionTheme(personB, cardsB),
  );

  const buildTrait = (context: RelationContext, template: string | undefined) => {
    // 감정 교류=1순위, 표현 리듬=2순위, 갈등 회복=3순위 컬러를 각각 사용한다.
    const colorIndex = context === "감정 교류" ? 0 : context === "표현 리듬" ? 1 : 2;
    const colorA = colorsA?.[colorIndex];
    const colorB = colorsB?.[colorIndex];
    // 짝 테마 템플릿이 있을 때는 컬러 근거를 한 번만 붙이고, 없는 조합은 컬러별 fallback 본문 자체가 근거가 된다.
    if (template) {
      const lead = buildRomanticColorLead(
        colorA?.korName,
        colorA?.id,
        colorB?.korName,
        colorB?.id,
        context,
      ) ?? "";
      const basis = cardBasis(context, cardsA, cardsB, personLabels);
      return lead ? `${lead} ${basis} ${template}` : `${basis} ${template}`;
    }
    return `${cardBasis(context, cardsA, cardsB, personLabels)} ${buildColorSpecificFallback(context, colorA, colorB, relationType)}`;
  };

  return [
    { title: "감정 교류", description: buildTrait("감정 교류", buildEmotionExchange(pairKey)) },
    { title: "표현 리듬", description: buildTrait("표현 리듬", buildExpressionRhythm(pairKey)) },
    { title: "갈등 회복", description: buildTrait("갈등 회복", buildConflictRecovery(pairKey)) },
  ];
}
