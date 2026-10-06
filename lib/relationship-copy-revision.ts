import type { CardData } from "../constants/cardData";
import type { ColorData } from "../constants/colorData";
import type { ArchetypeResult, FaithType, RelationType } from "../constants/coupleData";

type CopyColor = Pick<ColorData, "id" | "korName" | "keywords" | "recovery">;
type CopyCard = Pick<CardData, "color" | "shape" | "colorKor" | "shapeKor" | "energyTitle">;

type CardPosition = "inner" | "current" | "recovery";

const COLOR_FOCUS: Record<string, { need: string; response: string; practice: string; relationship: string }> = {
  red: { need: "분명한 마음을 행동으로 옮길 자리", response: "반응이 빠르거나 먼저 방향을 정하고 싶어질 수 있습니다.", practice: "말하기 전 숨을 한 번 고르고, 오늘 꼭 전할 한 문장만 골라 보세요.", relationship: "직접적인 반응과 솔직한 확인" },
  orange: { need: "사람들과 즐거움을 나눌 자리", response: "함께할 때 힘을 얻고 반응을 주고받고 싶어질 수 있습니다.", practice: "기분이 좋아졌던 순간 하나를 먼저 나누고, 상대의 이야기도 끝까지 들어 보세요.", relationship: "함께하는 시간과 가벼운 대화" },
  yellow: { need: "궁금한 것을 이해하고 질문할 자리", response: "생각이 많아질수록 답을 찾으려 대화를 넓힐 수 있습니다.", practice: "지금 해결할 일과 그냥 나누고 싶은 마음을 구분해 메모해 보세요.", relationship: "호기심을 나누는 대화" },
  green: { need: "일상에 편안함을 만드는 자리", response: "주변의 분위기를 살피며 갈등을 낮추려 할 수 있습니다.", practice: "상대를 배려하기 전에 내게 필요한 것을 한 문장으로 말해 보세요.", relationship: "평온한 일상과 꾸준한 배려" },
  blue: { need: "약속과 신뢰를 확인할 자리", response: "충분히 생각한 뒤 정확하게 말하고 싶어질 수 있습니다.", practice: "말을 정리하는 동안에도 ‘생각해 보고 다시 말할게’라고 먼저 알려 보세요.", relationship: "신뢰를 쌓는 약속과 경청" },
  navy: { need: "맡은 몫을 차분히 지킬 자리", response: "말보다 행동으로 책임을 보이려 할 수 있습니다.", practice: "혼자 해결하려는 일 하나를 골라 도움이나 마음을 나눠 보세요.", relationship: "꾸준한 행동과 책임감" },
  indigo: { need: "생각의 의미를 깊게 살필 자리", response: "마음이 정리될 때까지 말수가 줄어들 수 있습니다.", practice: "혼자 생각할 시간이 필요할 때, 다시 이야기할 시간을 함께 정해 보세요.", relationship: "깊이 듣고 천천히 나누는 대화" },
  violet: { need: "감정과 가치의 의미를 돌아볼 자리", response: "말의 뉘앙스와 관계의 의미를 섬세하게 살필 수 있습니다.", practice: "느낀 점을 해석하기 전에 ‘나는 지금 이랬어’라고 짧게 사실부터 말해 보세요.", relationship: "마음의 의미를 함께 살피는 시간" },
  pink: { need: "다정함을 주고받을 자리", response: "따뜻한 반응과 애정 표현이 관계의 중요한 신호가 될 수 있습니다.", practice: "기다리기보다 받고 싶은 다정함을 구체적인 말이나 행동으로 알려 보세요.", relationship: "다정한 말과 반가운 표현" },
  magenta: { need: "진심을 숨기지 않고 나눌 자리", response: "관계가 깊어질수록 마음을 크게 느끼거나 조심스러워질 수 있습니다.", practice: "한 번에 모두 말하려 하지 말고, 오늘의 진심 한 가지만 골라 나눠 보세요.", relationship: "진솔한 대화와 마음의 확인" },
  coral: { need: "밝은 반응과 함께하는 즐거움", response: "상대의 표정과 반응에서 관계의 온기를 느끼기 쉬울 수 있습니다.", practice: "공감이 먼저 필요한 날에는 ‘해결보다 들어주면 좋겠어’라고 말해 보세요.", relationship: "반응을 주고받는 가벼운 교류" },
  gold: { need: "내 기준과 가치를 지킬 자리", response: "존중받는지와 역할의 균형을 확인하고 싶어질 수 있습니다.", practice: "잘 해낸 일 하나를 인정하고, 상대에게 바라는 존중도 구체적으로 말해 보세요.", relationship: "서로의 기준과 수고를 인정하는 태도" },
  brown: { need: "현실적인 일상을 단단히 다질 자리", response: "익숙한 방식과 예측 가능한 약속에서 편안함을 느낄 수 있습니다.", practice: "일상에서 바꿔 보고 싶은 것 하나를 작게 정해 함께 시도해 보세요.", relationship: "생활의 약속과 안정감" },
  beige: { need: "부드럽게 어울릴 자리", response: "분위기를 거칠게 만들기보다 편안하게 맞추려 할 수 있습니다.", practice: "조심스럽더라도 내 의견을 ‘나는 이렇게 느껴’로 시작해 보세요.", relationship: "편안한 거리와 온화한 대화" },
  white: { need: "복잡한 생각을 정돈할 자리", response: "기준이 흐려질 때 거리를 두고 정리하고 싶어질 수 있습니다.", practice: "정리할 시간과 대화를 다시 시작할 시간을 따로 정해 보세요.", relationship: "명료한 약속과 정돈된 대화" },
  black: { need: "안전한 경계와 신뢰를 가릴 자리", response: "마음을 열기 전에 충분히 살피고 자기 기준을 지키려 할 수 있습니다.", practice: "경계를 설명한 뒤에도 이어가고 싶은 관계의 마음을 함께 말해 보세요.", relationship: "존중받는 경계와 깊은 신뢰" },
  silver: { need: "상황을 차분히 관찰할 자리", response: "감정보다 사실과 순서를 정리하며 말하고 싶어질 수 있습니다.", practice: "해결책을 말하기 전에 ‘그랬구나’라는 공감 한마디를 먼저 건네 보세요.", relationship: "차분한 관찰과 명료한 합의" },
  olive: { need: "여러 입장을 조율할 자리", response: "모두가 편안한 선택을 찾느라 내 의견을 늦출 수 있습니다.", practice: "다른 사람의 입장을 들은 뒤, 내 선택도 한 문장으로 덧붙여 보세요.", relationship: "넓게 듣고 조율하는 태도" },
  mint: { need: "새로운 기분을 가볍게 환기할 자리", response: "무거운 분위기보다 산뜻한 전환을 찾고 싶어질 수 있습니다.", practice: "부담 없는 산책이나 새로운 활동을 하나 정해 마음의 환기를 만들어 보세요.", relationship: "가벼운 전환과 유연한 제안" },
  skyblue: { need: "가능성을 열어둘 자리", response: "답을 서두르기보다 넓게 상상하고 자유롭게 움직이고 싶어질 수 있습니다.", practice: "다음에 해보고 싶은 일을 하나만 정해 현실적인 첫걸음을 붙여 보세요.", relationship: "열린 대화와 각자의 여유" },
  lavender: { need: "섬세한 감정을 천천히 살필 자리", response: "분위기와 말의 결을 세심하게 느끼며 표현을 고를 수 있습니다.", practice: "좋아하는 음악이나 글로 마음을 정리한 뒤, 상대에게 필요한 말을 한 문장으로 전해 보세요.", relationship: "섬세한 공감과 부드러운 표현" },
  peach: { need: "따뜻한 반응을 나눌 자리", response: "상대가 편안한지 먼저 살피며 마음을 표현할 수 있습니다.", practice: "배려하기 전에 내 감정도 ‘나는 오늘 이랬어’라고 먼저 알려 보세요.", relationship: "부드러운 반응과 다정한 배려" },
  terracotta: { need: "현실적인 온기를 지킬 자리", response: "생활의 안정과 마음의 열정을 함께 놓치고 싶지 않을 수 있습니다.", practice: "바쁜 날에도 고마웠던 일 하나를 말하며 하루를 마무리해 보세요.", relationship: "생활 감각과 꾸준한 애정" },
  sage: { need: "주변의 분위기를 조용히 돌볼 자리", response: "갈등보다 조화를 먼저 생각하며 감정을 뒤로 미룰 수 있습니다.", practice: "돌봄을 건네기 전에 오늘 내 마음이 어떤지 먼저 확인해 보세요.", relationship: "차분한 배려와 조율" },
  teal: { need: "생각과 감정을 함께 살필 자리", response: "상황을 분석하며 감정을 정리하고 싶어질 수 있습니다.", practice: "무엇이 맞는지 말하기 전에, 지금 기분을 한 단어로 붙여 보세요.", relationship: "생각과 마음을 함께 나누는 대화" },
  cream: { need: "편안한 리듬을 지킬 자리", response: "자극이 많을수록 단순하고 조용한 방식으로 돌아가고 싶어질 수 있습니다.", practice: "해야 할 일을 하나 덜고, 쉬는 시간을 약속처럼 남겨 보세요.", relationship: "고요한 일상과 부담 없는 대화" },
};

const SHAPE_FOCUS: Record<string, { inner: string; current: string; recovery: string }> = {
  circle: { inner: "관계 안에서 서로의 반응을 느끼고 싶은 마음", current: "대화와 분위기의 변화를 민감하게 살피는 방식", recovery: "끊기지 않는 안부와 가벼운 재연결" },
  triangle: { inner: "기준을 세우고 마음을 지키고 싶은 마음", current: "분명한 결론을 찾거나 잠시 거리를 두는 방식", recovery: "경계를 존중한 뒤 짧고 분명하게 다시 말하기" },
  inverted_triangle: { inner: "바로 드러내지 못한 감정을 안에서 정리하려는 마음", current: "말하기 전에 충분히 가라앉는 방식", recovery: "쉬는 시간을 알리고 약속한 때에 다시 대화하기" },
  square: { inner: "일상과 약속을 안정적으로 지키고 싶은 마음", current: "문제의 순서와 현실적인 해결을 먼저 살피는 방식", recovery: "역할과 다음 행동을 한 가지씩 나누기" },
  diamond: { inner: "관계의 작은 변화를 세심하게 알아차리는 마음", current: "말의 뉘앙스와 분위기를 오래 살피는 방식", recovery: "짐작 대신 확인하는 질문을 건네기" },
  pentagon: { inner: "자신의 방향과 관계의 성장을 함께 지키고 싶은 마음", current: "각자의 목표와 선택을 분명히 하려는 방식", recovery: "서로의 다음 목표를 듣고 응원 한마디 더하기" },
  hexagon: { inner: "함께하는 관계와 소속감을 소중히 여기는 마음", current: "모두가 편안한 선택을 찾으려는 방식", recovery: "함께할 시간과 각자의 몫을 가볍게 맞추기" },
};

const FALLBACK_FOCUS = { need: "지금의 마음을 편안히 살필 자리", response: "자신에게 맞는 방식으로 마음을 정리하려 할 수 있습니다.", practice: "오늘 느낀 점 하나를 짧게 적거나 나눠 보세요.", relationship: "서로의 마음을 확인하는 대화" };
const FALLBACK_SHAPE = { inner: "자신에게 맞는 방식으로 마음을 지키려는 마음", current: "상황을 자기 속도로 살피는 방식", recovery: "부담 없는 말로 다시 연결하기" };

function colorFocus(color?: CopyColor | null) {
  return COLOR_FOCUS[color?.id ?? ""] ?? FALLBACK_FOCUS;
}

function shapeFocus(card?: CopyCard | null) {
  return SHAPE_FOCUS[card?.shape ?? ""] ?? FALLBACK_SHAPE;
}

function cardColorFocus(card?: CopyCard | null) {
  return COLOR_FOCUS[card?.color ?? ""] ?? COLOR_FOCUS[card?.colorKor === "퍼플" ? "violet" : ""] ?? FALLBACK_FOCUS;
}

function formatFaithPractice(faith: FaithType) {
  if (faith === "기독교") return "기도나 말씀 묵상으로 오늘의 마음을 잠시 돌아보셔도 좋겠습니다.";
  if (faith === "기타") return "본인에게 익숙한 묵상이나 쉼의 방식으로 오늘의 마음을 돌아보셔도 좋겠습니다.";
  return "자신에게 편안한 방식으로 잠시 쉬며 오늘의 마음을 돌아보셔도 좋겠습니다.";
}

export function buildRelationshipPersonCopy(colors: readonly CopyColor[], faith: FaithType) {
  const [primary, secondary, recovery] = colors;
  const first = colorFocus(primary);
  const second = colorFocus(secondary);
  const third = colorFocus(recovery);
  const primaryName = primary?.korName ?? "첫 번째 컬러";
  const secondaryName = secondary?.korName ?? "두 번째 컬러";
  const recoveryName = recovery?.korName ?? "세 번째 컬러";

  return {
    psychologyFlow: `${primaryName}은 ${first.need}을 떠올리게 합니다. 이 선택은 지금 관계에서 ${first.relationship}을 소중히 보고 있을 가능성을 보여줍니다.`,
    currentFlow: `${secondaryName}은 ${second.response} 현재 마음의 한 장면으로 읽어볼 수 있습니다. 상대의 반응을 단정하기보다, 무엇을 바라는지 짧게 확인해 보세요.`,
    recoveryDirection: `${recoveryName}은 ${third.practice}처럼 작고 구체적인 돌봄을 권합니다. 한 번에 관계를 바꾸기보다 오늘 가능한 행동 하나면 충분합니다.`,
    relationshipStyle: `${first.relationship}을 중요하게 여기면서도, ${second.relationship}이 함께 있을 때 편안함을 느낄 수 있습니다. 이것은 성격의 확정이 아니라 지금 선택에서 보이는 관계의 선호입니다.`,
    emotionExpression: `${primaryName}과 ${secondaryName} 선택은 마음을 바로 말하기보다 상황과 상대를 살핀 뒤 표현하고 싶어질 수 있음을 보여줍니다. 말할 준비가 되지 않은 때에는 그 사실을 알려 주는 것만으로도 오해를 줄일 수 있습니다.`,
    complementMeaning: `보완 컬러는 지금의 선택과 반대되는 성격을 뜻하지 않습니다. 관계에서 ${third.relationship}을 조금 더 의식해 볼 수 있는 참고점입니다.`,
    coachingMessage: `${first.practice} ${formatFaithPractice(faith)}`,
  };
}

export function buildRelationshipCardNarrative(card: CopyCard, position: CardPosition) {
  const color = cardColorFocus(card);
  const shape = shapeFocus(card);
  const cardName = `${card.colorKor} ${card.shapeKor}`;

  if (position === "inner") {
    return `${cardName} 카드는 ${shape.inner}을 떠올리게 합니다. ${color.need}이 지금 마음의 중요한 바람일 수 있습니다. 이 해석은 현재 선택을 비춰 보는 하나의 관점입니다.`;
  }
  if (position === "current") {
    return `${cardName} 카드는 ${shape.current}을 보여줍니다. ${color.response} 상대의 의도를 짐작하기보다, 지금 필요한 말을 한 문장으로 나누어 보세요.`;
  }
  return `${cardName} 카드는 ${shape.recovery}를 권합니다. ${color.practice} 부담 없는 한 걸음이 관계와 자기돌봄을 함께 돕습니다.`;
}

export function buildRelationshipCardFlow(cards: readonly CopyCard[], colors: readonly CopyColor[], faith: FaithType) {
  const [firstCard, secondCard, thirdCard] = cards;
  const [primary, secondary, recovery] = colors;
  const first = cardColorFocus(firstCard);
  const second = cardColorFocus(secondCard);
  const third = cardColorFocus(thirdCard);
  const primaryName = primary?.korName ?? firstCard?.colorKor ?? "첫 번째 선택";
  const secondaryName = secondary?.korName ?? secondCard?.colorKor ?? "두 번째 선택";
  const recoveryName = recovery?.korName ?? thirdCard?.colorKor ?? "세 번째 선택";

  return {
    flow: `${primaryName}과 ${firstCard?.shapeKor ?? "첫 카드"} 선택은 ${first.relationship}을 바라는 마음을 비춰 봅니다. 그 바람이 곧 사실이나 성격을 단정하는 것은 아니며, 지금 마음을 이해하는 출발점이 될 수 있습니다.\n\n${secondaryName}과 ${secondCard?.shapeKor ?? "두 번째 카드"} 선택은 ${second.response} 대화가 어긋날 때는 바로 답을 정하기보다, 듣고 싶은지 생각할 시간이 필요한지 먼저 알려 보세요.\n\n${recoveryName}과 ${thirdCard?.shapeKor ?? "세 번째 카드"} 선택은 ${third.practice}처럼 작은 회복을 권합니다. 관계를 위해 애쓰는 마음과 내 마음을 돌보는 일은 함께 갈 수 있습니다.`,
    coaching: `${third.practice} ${formatFaithPractice(faith)}`,
    routine: third.practice,
  };
}

function coupleScene(relationType: "부부" | "연인") {
  return relationType === "부부"
    ? {
        title: "일상과 역할을 함께 맞추는 관계",
        sceneA: "생활비·집안일·일정처럼 반복되는 일을 어떻게 나눌지", 
        sceneB: "갈등 뒤에도 다시 대화할 시간을 어떻게 남길지",
        actions: ["이번 주 조율할 생활 일을 하나만 고르기", "서운함이 생기면 사실과 감정을 나누어 말하기", "대화가 멈추면 다시 이야기할 시간을 정하기"],
        intimacy: "가까움의 방식은 정답이 없습니다. 서로 편안한 거리와 애정 표현을 말로 확인해 보세요.",
      }
    : {
        title: "연락과 각자의 시간을 함께 지키는 관계",
        sceneA: "연락 빈도와 다음 만남을 어떤 방식으로 정할지", 
        sceneB: "각자의 시간을 존중하면서도 안부를 어떻게 이어갈지",
        actions: ["이번 주 만남 또는 통화 시간을 하나 정하기", "바쁜 날의 연락 기준을 짧게 맞추기", "각자 쉬는 시간이 필요할 때 다시 연락할 때를 알려주기"],
        intimacy: "가까움의 방식은 정답이 없습니다. 서로 편안한 속도와 애정 표현을 말로 확인해 보세요.",
      };
}

function shortPersonStyle(color?: CopyColor | null, card?: CopyCard | null) {
  const colorText = colorFocus(color).relationship;
  const shapeText = shapeFocus(card).current.replace(/을 보여줍니다$/, "").replace(/방식$/, "방식");
  return `${colorText}을 중요하게 여기며, ${shapeText}이 나타날 수 있습니다.`;
}

/**
 * 부부·연인 최종 결과의 다섯 통합 블록을 선택한 컬러·도형에 맞춰 다시 구성한다.
 * 기존 유형·시각 요소는 유지하되, 개인 분석의 반복과 관계 유형에 맞지 않는 생활 문구를 대체한다.
 */
export function reviseRomanticArchetype(
  base: ArchetypeResult,
  input: {
    relationType: "부부" | "연인";
    colorsA: readonly CopyColor[];
    colorsB: readonly CopyColor[];
    cardsA: readonly CopyCard[];
    cardsB: readonly CopyCard[];
  },
): ArchetypeResult {
  const { relationType, colorsA, colorsB, cardsA, cardsB } = input;
  const a = colorFocus(colorsA[0]);
  const b = colorFocus(colorsB[0]);
  const labelA = colorsA[0]?.korName ?? "A의 첫 컬러";
  const labelB = colorsB[0]?.korName ?? "B의 첫 컬러";
  const scene = coupleScene(relationType);
  const aStyle = shortPersonStyle(colorsA[0], cardsA[1]);
  const bStyle = shortPersonStyle(colorsB[0], cardsB[1]);
  const aRecovery = shapeFocus(cardsA[2]).recovery;
  const bRecovery = shapeFocus(cardsB[2]).recovery;
  const relationshipNoun = relationType === "부부" ? "두 분의 생활" : "두 분의 만남";
  const coreHeadline = `${labelA}의 ${a.relationship}과 ${labelB}의 ${b.relationship}이 만나는 관계`;
  const coreDescription = `${relationshipNoun}에는 서로 다른 반응 속도와 편안함의 기준이 함께 있습니다. 차이는 맞고 틀림의 근거가 아니라, 어떤 설명과 약속이 필요한지 알려 주는 단서가 될 수 있습니다.`;
  const profile = `${labelA} 선택은 ${a.relationship}을, ${labelB} 선택은 ${b.relationship}을 중요하게 볼 수 있음을 보여줍니다. 한쪽의 방식이 부족해서가 아니라 확인하는 언어가 달라서 서운함이 생길 수 있습니다. 상대의 마음을 추측하기 전에, 지금 바라는 것을 짧게 묻고 답해 보세요.`;

  const unifiedSections: NonNullable<ArchetypeResult["unifiedSections"]> = {
    coreEnergy: {
      headline: coreHeadline,
      description: coreDescription,
      keywords: [colorsA[0]?.korName ?? "첫 번째 선택", colorsB[0]?.korName ?? "두 번째 선택", "대화의 타이밍", "서로의 선택 존중"],
    },
    lifePattern: {
      headline: scene.title,
      items: [
        {
          icon: relationType === "부부" ? "🏠" : "📱",
          label: relationType === "부부" ? "일상과 역할" : "연락과 약속",
          personA: aStyle,
          personB: bStyle,
          tension: `${scene.sceneA}에 대한 기대가 말로 맞춰지지 않으면, 같은 행동도 무관심이나 압박으로 느껴질 수 있습니다.`,
        },
        {
          icon: "🫶",
          label: relationType === "부부" ? "함께 보내는 시간" : "각자의 시간",
          personA: `${a.relationship}이 느껴질 때 관계가 편안해질 수 있습니다.`,
          personB: `${b.relationship}이 느껴질 때 관계가 편안해질 수 있습니다.`,
          tension: "함께 있고 싶은 시간과 혼자 정리할 시간이 다를 수 있습니다. 먼저 필요한 시간을 말하고, 다시 만날 시점을 함께 정해 보세요.",
        },
        {
          icon: "💬",
          label: "의견이 달라진 뒤",
          personA: `${aRecovery}이 도움이 될 수 있습니다.`,
          personB: `${bRecovery}이 도움이 될 수 있습니다.`,
          tension: `${scene.sceneB}를 미리 정하면, 잠시 멈춘 대화도 관계의 끝처럼 느껴지지 않을 수 있습니다.`,
        },
      ],
    },
    conflictFlow: {
      trigger: "상대가 원하는 반응의 속도나 방식이 다를 때, 설명하지 않은 기대가 서운함으로 이어질 수 있습니다.",
      reaction: `A는 ${shapeFocus(cardsA[1]).current}이 나타날 수 있고, B는 ${shapeFocus(cardsB[1]).current}이 나타날 수 있습니다.`,
      danger: "상대의 침묵을 무관심으로, 빠른 말을 공격으로 단정하면 같은 갈등이 반복될 수 있습니다.",
      forbiddenWords: ["왜 항상 그래?", "넌 내 마음을 전혀 몰라.", "지금 당장 결론 내."],
    },
    connectionFlow: {
      headline: relationType === "부부" ? "생활 대화와 마음 대화를 나누어 하기" : "연락의 약속과 마음의 여유를 함께 정하기",
      description: "해결할 일과 마음을 듣는 시간을 구분하면, 현실적인 대화도 다정함을 잃지 않을 수 있습니다. 작은 확인을 자주 나누는 편이 큰 해석보다 도움이 됩니다.",
      actions: scene.actions,
      skinshipNote: scene.intimacy,
    },
    growthPoint: {
      strength: `${a.relationship}과 ${b.relationship}은 서로 다른 장점입니다. 둘 다 관계를 소중히 다루고 싶다는 마음에서 출발할 수 있습니다.`,
      blindSpot: "한 사람이 계속 설명하고 다른 사람이 계속 기다리는 역할로 굳어지면 둘 다 지칠 수 있습니다.",
      growthDirection: "상대의 방식에 맞추기보다, 각자가 편안한 표현과 다시 대화할 시간을 함께 정해 보세요.",
      tip: relationType === "부부" ? "오늘 저녁, 생활에서 고마웠던 일 하나와 조율하고 싶은 일 하나를 나눠 보세요." : "오늘, 다음에 연락하거나 만날 시간을 하나 정하고 서로의 바쁜 시간을 먼저 물어 보세요.",
    },
  };

  return {
    ...base,
    coreSummary: relationType === "부부" ? "서로 다른 생활의 언어를 맞춰 갈 수 있는 관계입니다." : "서로 다른 연락과 표현의 리듬을 맞춰 갈 수 있는 관계입니다.",
    tensionDescription: coreDescription,
    misunderstandingPattern: unifiedSections.conflictFlow.trigger,
    connectionStyle: unifiedSections.connectionFlow.description,
    recoveryRoutine: unifiedSections.growthPoint.tip,
    neededWords: "지금은 듣고 싶어, 조금 뒤에 말할게, 고마웠어.",
    recommendedActivity: relationType === "부부" ? "함께 정한 생활 일 하나를 마친 뒤 10분간 오늘의 기분을 나누기" : "다음 만남이나 통화의 시간을 정한 뒤 서로의 한 주를 가볍게 묻기",
    emotionRecoveryStyle: "잠시 쉬는 시간과 다시 대화할 시점을 함께 정하는 방식",
    conversationRoutine: relationType === "부부" ? "생활의 의제와 마음의 의제를 분리해 짧게 나누기" : "연락의 기대와 각자 필요한 시간을 짧게 맞추기",
    connectionRoutine: unifiedSections.connectionFlow.actions[0],
    affectionRoutine: scene.intimacy,
    emotionRoutine: "상대의 의도를 추측하기 전에 지금 바라는 것을 한 문장으로 말하기",
    closingMessage: "서로를 바꾸려 하기보다, 오늘 필요한 말과 시간을 함께 정하는 작은 합의가 관계를 돌보는 시작이 될 수 있습니다.",
    dangerPattern: unifiedSections.conflictFlow.danger,
    forbiddenWords: unifiedSections.conflictFlow.forbiddenWords,
    relationStrength: unifiedSections.growthPoint.strength,
    profileContrastOverride: {
      attractionContrast: profile,
      relationFlow: coreDescription,
      expressionDifference: "두 사람은 표현을 준비하는 시간과 확인하고 싶은 방식이 다를 수 있습니다. 어느 한쪽이 틀린 것이 아니라, 서로에게 필요한 신호를 말로 맞추는 과정이 중요합니다.",
      conflictPattern: unifiedSections.conflictFlow.danger,
      connectionStyle: unifiedSections.connectionFlow.description,
    },
    unifiedSections,
    togetherRoutine: {
      ...base.togetherRoutine,
      routines: unifiedSections.connectionFlow.actions,
      energyNote: "함께 있는 시간의 길이보다, 서로의 필요를 확인하는 짧고 구체적인 말이 관계의 편안함을 돕습니다.",
      faithRoutine: base.togetherRoutine.faithRoutine
        ? "함께 감사한 일 한 가지와 기도 제목 또는 소망 한 가지를 나누고, 서로를 위해 짧게 기도하거나 묵상해 보세요."
        : undefined,
    },
  };
}
