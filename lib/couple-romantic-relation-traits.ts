import type { CardData } from "../constants/cardData";

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
  cardsA: Array<CardData | undefined>;
  cardsB: Array<CardData | undefined>;
  expressionDescription: string;
  recoveryDescription: string;
};

function leadSentence(text: string | undefined, fallback: string): string {
  const trimmed = text?.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;

  const sentence = trimmed.match(/^(.+?[.!?]|.+$)/)?.[1] ?? trimmed;
  return sentence.trim();
}

/**
 * 부부·연인 관계 전용의 비수치형 관계 특성 카드입니다.
 * 개별 컬러 해석과 심리카드 해석이 이미 산출한 문장을 다시 계산하지 않고,
 * A/B의 색채 성향과 1·2·3번 카드 흐름을 짧은 관계 언어로 함께 읽습니다.
 */
export function buildRomanticRelationTraits({
  personA,
  personB,
  cardsA,
  cardsB,
  expressionDescription,
  recoveryDescription,
}: RomanticRelationTraitInput): RomanticRelationTrait[] {
  const aInner = leadSentence(cardsA[0]?.psychologyFlow, "자신의 마음을 이해받고 싶은 바람이 있습니다.");
  const bInner = leadSentence(cardsB[0]?.psychologyFlow, "관계 안에서 편안한 연결을 바라고 있습니다.");
  const aCurrent = leadSentence(cardsA[1]?.personalityFlow, personA.emotionExpression);
  const bCurrent = leadSentence(cardsB[1]?.personalityFlow, personB.emotionExpression);
  const aRecovery = leadSentence(cardsA[2]?.recoveryDirection, "잠시 숨을 고르고 다시 연결할 시간이 필요합니다.");
  const bRecovery = leadSentence(cardsB[2]?.recoveryDirection, "서로의 속도를 존중하며 마음을 나눌 수 있습니다.");

  return [
    {
      title: "감정 교류",
      description: `첫 번째 사람은 ${aInner} 두 번째 사람은 ${bInner} 서로에게 중요한 마음을 천천히 확인할 때 더 편안하게 연결될 수 있습니다.`,
    },
    {
      title: "표현 리듬",
      description: `첫 번째 사람은 ${aCurrent} 두 번째 사람은 ${bCurrent} ${leadSentence(expressionDescription, "표현의 속도와 방식이 다를 수 있습니다.")}`,
    },
    {
      title: "갈등 회복",
      description: `첫 번째 사람에게는 ${aRecovery} 두 번째 사람에게는 ${bRecovery} ${leadSentence(recoveryDescription, "서로에게 필요한 회복의 시간을 인정하는 것이 도움이 됩니다.")}`,
    },
  ];
}
