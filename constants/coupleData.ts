/**
 * 커플 세션 데이터 로직
 * 단순 궁합이 아닌 "서로를 이해하고 관계를 회복하는 감성 심리코칭" 흐름
 */

import { COLOR_DATA, ColorData } from './colorData';
import { CARD_DATA, ShapeType } from './cardData';

// ── 관계 유형 ────────────────────────────────────────────────────
export type RelationType =
  | '연인'
  | '부부'
  | '친구'
  | '부모-자녀'
  | '아빠-아들'
  | '아빠-딸'
  | '엄마-아들'
  | '엄마-딸'
  | '형제자매'
  | '동료';

export type GenderType = '남성' | '여성';
export type FaithType = '기독교' | '무교' | '기타';

export interface PersonInfo {
  gender: GenderType;
  faith: FaithType;
}

export interface PersonSession {
  info: PersonInfo;
  /** 선택한 컬러 3개 id */
  colors: string[];
  /** 선택한 카드 3장 id */
  cards: string[];
}

export interface CoupleSessionData {
  relationType: RelationType;
  personA: PersonSession;
  personB: PersonSession;
}

// ── 컬러 에너지 계열 분류 ─────────────────────────────────────────
type EnergyFamily =
  | 'warm_active'    // 레드, 오렌지, 코랄, 마젠타 — 표현·추진·열정
  | 'warm_soft'      // 핑크, 피치, 베이지, 크림 — 배려·온기·부드러움
  | 'warm_grounded'  // 골드, 브라운, 테라코타 — 안정·현실·신뢰
  | 'cool_clear'     // 블루, 스카이블루, 틸, 민트 — 신뢰·명료·자유
  | 'cool_deep'      // 인디고, 바이올렛, 블랙, 실버 — 내면·깊이·경계
  | 'nature'         // 그린, 올리브, 세이지, 라벤더 — 회복·균형·치유
  | 'neutral'        // 화이트, 옐로우 — 정화·균형·명료

const ENERGY_FAMILY: Record<string, EnergyFamily> = {
  red: 'warm_active', orange: 'warm_active', coral: 'warm_active', magenta: 'warm_active',
  pink: 'warm_soft', peach: 'warm_soft', beige: 'warm_soft', cream: 'warm_soft',
  gold: 'warm_grounded', brown: 'warm_grounded', terracotta: 'warm_grounded',
  blue: 'cool_clear', skyblue: 'cool_clear', teal: 'cool_clear', mint: 'cool_clear',
  indigo: 'cool_deep', violet: 'cool_deep', black: 'cool_deep', silver: 'cool_deep', navy: 'cool_deep',
  green: 'nature', olive: 'nature', sage: 'nature', lavender: 'nature',
  white: 'neutral', yellow: 'neutral',
};

function getFamily(colorId: string): EnergyFamily {
  return ENERGY_FAMILY[colorId] ?? 'neutral';
}

function getFamilyLabel(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '표현·추진 에너지',
    warm_soft: '배려·온기 에너지',
    warm_grounded: '안정·현실 에너지',
    cool_clear: '신뢰·명료 에너지',
    cool_deep: '내면·깊이 에너지',
    nature: '회복·균형 에너지',
    neutral: '정화·균형 에너지',
  };
  return map[family];
}

// ── 개인 에너지 프로파일 (3개 컬러 조합 기반) ─────────────────────
type PersonProfile =
  | 'expressive'      // warm_active 우세 — 표현 중심, 즉각적, 활동 공유
  | 'warm_connector'  // warm_soft 우세 — 배려 중심, 온기, 스킨십
  | 'stable_seeker'   // warm_grounded 우세 — 안정·신뢰 중심, 꾸준함
  | 'free_spirit'     // cool_clear 우세 — 자유·명료 중심, 공간 필요
  | 'deep_thinker'    // cool_deep 우세 — 내면 정리 중심, 깊이·신뢰
  | 'balanced_healer' // nature 우세 — 균형·치유 중심, 자연스러운 흐름
  | 'clear_minded';   // neutral 우세 — 정화·명료 중심, 새로운 시작

function getPersonEnergyProfile(families: EnergyFamily[]): {
  dominant: EnergyFamily;
  secondary: EnergyFamily | null;
  profile: PersonProfile;
  psychologyFlowText: string;
  currentFlowText: string;
  relationshipStyleText: string;
} {
  // 빈도 계산
  const count: Partial<Record<EnergyFamily, number>> = {};
  for (const f of families) count[f] = (count[f] ?? 0) + 1;
  const sorted = Object.entries(count).sort((a, b) => (b[1] as number) - (a[1] as number));
  const dominant = (sorted[0]?.[0] ?? 'neutral') as EnergyFamily;
  const secondary = sorted.length > 1 && (sorted[1]?.[1] as number) >= 1
    ? (sorted[1]?.[0] as EnergyFamily)
    : null;

  // 프로파일 결정
  const profileMap: Record<EnergyFamily, PersonProfile> = {
    warm_active: 'expressive',
    warm_soft: 'warm_connector',
    warm_grounded: 'stable_seeker',
    cool_clear: 'free_spirit',
    cool_deep: 'deep_thinker',
    nature: 'balanced_healer',
    neutral: 'clear_minded',
  };
  const profile = profileMap[dominant];

  // 심리 흐름 (무의식/내면 흐름) — 조합 기반 차별화 + 감정 흐름 전환 표현 강화
  const psychologyFlowMap: Record<PersonProfile, string> = {
    expressive: '지금 마음속에는 감정이 생기면 바로 꺼내고 싶은 충동이 있습니다. 표현하지 못하면 담담해지는 유형입니다. 이 결이 관계 안에서 속도차이를 만들고, 심지어 상대가 준비되지 않았을 때 상처가 될 수 있습니다. 앞으로는 표현하기 전에 잠깐 멈춰 묻는 연습이 관계를 한단계 더 따뜻하게 만들어줍니다.',
    warm_connector: '지금 마음속에는 누군가를 돌보고 싶은 마음이 조용히 흐르고 있습니다. 그 마음이 너무 크면 자신의 감정은 뒤로 미루게 됩니다. 이 결이 관계 안에서 소진으로 이어집니다. 앞으로는 자신에게도 그 따뜻함을 돌려주는 시간이 필요합니다.',
    stable_seeker: '지금 마음속에는 흔들리지 않는 관계를 원하는 마음이 있습니다. 변화보다 익숙한 안정감에서 편안함을 찾는 편입니다. 이 결이 관계 안에서 소통을 늘리는 데 시간이 필요하게 만들고, 상대에게 다가오는 데 시간이 걸릴 수 있습니다. 앞으로는 작은 인정 한 마디가 이 결을 편안하게 열어줍니다.',
    free_spirit: '지금 마음속에는 함께 있어도 자신만의 공간이 필요한 마음이 있습니다. 논리적으로 정리되지 않은 것에 불편함을 느끼는 편입니다. 이 결이 관계 안에서 감정 연결보다 실질적 소통을 앞세우게 만들고, 상대에게 차갑게 느껴지는 순간이 생길 수 있습니다. 앞으로는 먼저 공감하고 정리하는 순서를 연습하면 관계의 온도가 높아집니다.',
    deep_thinker: '지금 마음속에는 많은 것을 담아두고 있습니다. 침묵이 거리두기가 아니라 정리하는 시간임을 상대가 이해하지 못하면 오해가 생길 수 있습니다. 이 결이 관계 안에서 감정적 거리감을 만들고, 소진으로 이어질 수 있습니다. 앞으로는 지금 어떤 마음인지 먼저 한 마디 건네는 것이 이 결을 편안하게 만들어줍니다.',
    balanced_healer: '지금 마음속에는 자연스럽게 흐르고 싶은 마음이 있습니다. 억지로 어떤 것을 하기보다 자신의 리듬대로 움직이는 것이 편합니다. 이 결이 관계 안에서 조용한 존재감으로 나타나고, 상대에게 무관심으로 읽히는 순간이 생길 수 있습니다. 앞으로는 "나 여기 있어"라고 먼저 말해주는 연습이 도움이 됩니다.',
    clear_minded: '지금 마음속에는 복잡한 것들을 정리하고 싶은 마음이 있습니다. 속마음이 늦게 전달되는 편이라 상대가 오해할 수 있습니다. 이 결이 관계 안에서 감정 연결보다 일 정리가 앞서는 순간을 만들고, 상대에게 차갑게 느껴지는 순간이 생길 수 있습니다. 앞으로는 감정을 먼저 인정하고 정리하는 순서를 연습하면 관계의 온도가 높아집니다.',
  };

  // 현재 감정 흐름 — 코칭 대화체 + 전환 표현 강화
  const currentFlowMap: Record<PersonProfile, string> = {
    expressive: '지금 관계 안에서 감정이 활발하게 움직이고 있습니다. 표현하고 싶은 것이 많고, 함께 무언가를 하고 싶은 마음이 강합니다. 이렇게 에너지가 넘치는 시기일수록, 잠깐 속도를 늦추고 상대의 리듬을 확인하는 것이 관계를 더 따뜻하게 만들어줍니다.',
    warm_connector: '지금 누군가와 따뜻하게 연결되고 싶은 마음이 흐르고 있습니다. 그런데 상대를 배려하는 마음이 커질수록 자신의 감정은 뒤로 미루게 됩니다. 지금 가장 필요한 것은 자신에게도 그 따뜻함을 돌려주는 시간입니다.',
    stable_seeker: '지금 안정적인 관계와 일상을 원하는 마음이 있습니다. 변화보다 익숙하고 신뢰할 수 있는 것에서 편안함을 찾고 있습니다. 꾸준한 일상의 작은 인정이 지금 가장 큰 힘이 되는 시점입니다.',
    free_spirit: '지금 자유롭고 가벼운 흐름을 원하고 있습니다. 감정보다 상황을 명료하게 정리하고 싶은 마음이 있고, 관계에서도 각자의 공간이 필요합니다. 부담 없이 솔직하게 소통할 수 있는 환경이 지금 가장 편안합니다.',
    deep_thinker: '지금 마음속에 많은 것을 담아두고 있습니다. 감정이 충분히 가라앉은 후에야 표현할 수 있어, 겉으로는 조용해 보일 수 있습니다. 혼자만의 시간이 충분히 주어질 때 비로소 마음이 열립니다.',
    balanced_healer: '지금 억지 없이 천천히 회복되고 싶은 마음이 있습니다. 억지로 무언가를 하기보다 자신의 리듬대로 천천히 움직이고 싶어 합니다. 조용히 함께 있어주는 것만으로도 충분히 연결된 느낌을 받습니다.',
    clear_minded: '지금 복잡한 것들을 정리하고 새롭게 시작하고 싶은 마음이 있습니다. 감정을 담백하게 정리하며, 솔직하고 명료한 소통을 원합니다. 지금은 자신에게 필요한 것이 무엇인지 조용히 확인하는 시간이 도움이 됩니다.',
  };

  // 관계 성향 — 조합 기반 차별화 (secondary 반영)
  const relationshipStyleMap: Record<PersonProfile, string> = {
    expressive: '감정을 직접 표현하며 관계를 이끌어가는 성향이 있습니다. 함께 활동하고 표현을 나눌 때 가장 연결된 느낌을 받으며, 관계에서 활기와 공유를 중요하게 여깁니다.',
    warm_connector: '따뜻하게 배려하며 관계를 이어가는 성향이 있습니다. 상대방의 감정을 먼저 살피며, 온기 있는 말과 스킨십으로 연결되는 것을 소중히 여깁니다.',
    stable_seeker: '안정적이고 꾸준하게 관계를 이어가는 성향이 있습니다. 약속을 지키고 일관된 행동으로 신뢰를 쌓으며, 관계에서 편안함과 지속성을 가장 중요하게 여깁니다.',
    free_spirit: '자유롭고 명료한 방식으로 관계를 이어가는 성향이 있습니다. 각자의 공간을 존중하며, 부담 없이 솔직하게 소통할 수 있는 관계를 선호합니다.',
    deep_thinker: '깊이 있는 신뢰를 바탕으로 관계를 이어가는 성향이 있습니다. 말보다 행동으로, 오래 기억하고 진심 어린 방식으로 마음을 전하며, 관계에서 깊이와 진정성을 가장 소중히 여깁니다.',
    balanced_healer: '자연스럽고 편안한 방식으로 관계를 이어가는 성향이 있습니다. 조용히 곁에 있어주는 것이 가장 큰 표현이며, 관계에서 균형과 편안함을 중요하게 여깁니다.',
    clear_minded: '담백하고 솔직한 방식으로 관계를 이어가는 성향이 있습니다. 감정을 추스른 후 명료하게 표현하며, 관계에서 솔직함과 균형을 중요하게 여깁니다.',
  };

  // secondary 계열이 있을 때 관계 성향에 뉘앙스 추가
  let finalRelStyle = relationshipStyleMap[profile];
  if (secondary && secondary !== dominant) {
    const secondaryNuance: Partial<Record<EnergyFamily, string>> = {
      warm_active: ' 때로는 즉각적으로 표현하고 싶은 마음이 올라오기도 합니다.',
      warm_soft: ' 상대방을 배려하는 마음이 함께 흐르고 있습니다.',
      warm_grounded: ' 안정적인 일상 속에서 관계의 신뢰를 쌓아가는 것을 중요하게 여깁니다.',
      cool_clear: ' 때로는 각자의 공간이 필요하다는 것을 느끼기도 합니다.',
      cool_deep: ' 내면에서 충분히 정리된 후에야 마음을 열 수 있는 부분도 있습니다.',
      nature: ' 관계의 리듬이 자연히 흘러가도록 두는 것을 소중히 여깁니다.',
      neutral: ' 감정을 담백하게 정리하고 표현하는 성향도 함께 있습니다.',
    };
    finalRelStyle += secondaryNuance[secondary] ?? '';
  }

  return {
    dominant,
    secondary,
    profile,
    psychologyFlowText: psychologyFlowMap[profile],
    currentFlowText: currentFlowMap[profile],
    relationshipStyleText: finalRelStyle,
  };
}

// ── 개인 분석 결과 생성 ──────────────────────────────────────────
export interface PersonAnalysis {
  /** 심리 흐름 (1번 카드 기반) */
  psychologyFlow: string;
  /** 현재 감정 흐름 (2번 카드 기반) */
  currentFlow: string;
  /** 회복 방향 (3번 카드 기반) */
  recoveryDirection: string;
  /** 관계 성향 */
  relationshipStyle: string;
  /** 감정 표현 방식 */
  emotionExpression: string;
  /** 보완 컬러 1개 */
  complementColor: { id: string; korName: string; hex: string; meaning: string };
  /** 개인 코칭 메시지 */
  coachingMessage: string;
}

export function generatePersonAnalysis(
  session: PersonSession,
  label: 'A' | 'B'
): PersonAnalysis {
  const [c1, c2, c3] = session.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean) as ColorData[];
  const card1 = c1 ?? COLOR_DATA[0];
  const card2 = c2 ?? COLOR_DATA[1];
  const card3 = c3 ?? COLOR_DATA[2];

  // 3개 컬러의 EnergyFamily 조합으로 개인 에너지 프로파일 도출
  const allFamilies = [card1, card2, card3].map(c => getFamily(c.id));
  const energyProfile = getPersonEnergyProfile(allFamilies);

  // 감정 표현 방식 — 1번 카드 기반 (기존 유지)
  const f1 = getFamily(card1.id);
  const emotionExpression = getEmotionExpression(f1, card1);

  // 보완 컬러 — 3번 카드와 반대 계열에서 선택
  const complement = pickComplementColor(session.colors, card3.id);

  // 코칭 메시지
  const coachingMessage = buildPersonCoachingMessage(card1, card3, session.info.faith);

  return {
    // 컬러 조합 기반 에너지 프로파일로 차별화된 해석 생성
    psychologyFlow: energyProfile.psychologyFlowText,
    currentFlow: energyProfile.currentFlowText,
    recoveryDirection: card3.reading3,
    relationshipStyle: energyProfile.relationshipStyleText,
    emotionExpression,
    complementColor: complement,
    coachingMessage,
  };
}

function getEmotionExpression(family: EnergyFamily, card: ColorData): string {
  // 컬러 ID 기반 세분화 — 같은 계열이어도 고유 감정 방식 차별화
  const colorIdMap: Partial<Record<string, string>> = {
    white: '감정이 생기면 혼자 조용히 정리하는 편입니다. 마음이 정리되기 전에는 표현하지 않으며, 상처가 생기면 거리를 두는 방식으로 감정을 다룹니다.',
    black: '감정을 쉽게 드러내지 않으며, 경계를 지키며 표현합니다. 마음을 열기까지 시간이 걸리고, 한번 닫히면 다시 열기가 어렵습니다.',
    navy: '감정을 안으로 참는 편입니다. 책임감이 강해 혼자 감당하려 하고, 표현보다 행동으로 마음을 전하는 경향이 있습니다.',
    blue: '감정을 신중하게 정리한 후 표현합니다. 즉각 반응보다 충분히 생각한 뒤 말하는 편이며, 신뢰가 쌓인 관계에서만 마음을 엽니다.',
    indigo: '감정을 깊이 느끼지만 표현까지 시간이 걸립니다. 혼자 오래 생각하다가 말하는 편이며, 표현이 늦어도 감정의 깊이는 깊습니다.',
    violet: '감정을 섬세하게 느끼며, 이상적인 연결을 원합니다. 정서적으로 통한다고 느낄 때 깊이 몰입하고, 이해받지 못하면 거리감이 생깁니다.',
    lavender: '감정을 조용히 느끼며, 직접 표현보다 분위기로 전달하는 편입니다. 섬세하게 감지하지만 말로 꺼내기까지 시간이 필요합니다.',
    red: '감정이 생기면 바로 표현하는 편입니다. 답답함을 참지 못하고 즉각 반응하며, 표현 속도가 빠르고 직선적입니다.',
    orange: '감정을 활기차게 표현하며, 관계 속에서 에너지를 나누는 것을 좋아합니다. 표현이 자연스럽고 관계 온도를 중요하게 여깁니다.',
    coral: '감정을 따뜻하게 표현하지만, 상처를 받으면 조용히 물러나는 편입니다. 배려하는 마음이 크지만 자신의 감정은 뒤로 미루는 경향이 있습니다.',
    magenta: '감정을 깊이 느끼고 강렬하게 표현합니다. 관계에 몰입하는 편이며, 상처가 생기면 오래 품는 경향이 있습니다.',
    pink: '감정을 따뜻하고 부드럽게 표현합니다. 애정 표현을 중요하게 여기며, 차가운 반응에 쉽게 서운함을 느낍니다.',
    peach: '감정을 부드럽게 전달하며, 주변을 배려하는 방식으로 표현합니다. 직접 표현보다 분위기와 행동으로 마음을 전하는 편입니다.',
    yellow: '감정을 밝고 가볍게 표현하는 편이지만, 내면에는 생각이 많습니다. 걱정을 혼자 담아두다가 한꺼번에 꺼내는 경우가 있습니다.',
    gold: '감정을 품위 있게 표현하며, 자신의 가치를 중요하게 여깁니다. 인정받을 때 마음이 열리고, 무시당하면 닫히는 경향이 있습니다.',
    green: '감정을 조용히 담아두는 편이며, 갈등을 피하려는 성향이 있습니다. 배려하는 마음이 크지만 자신의 감정을 직접 표현하는 것이 어렵습니다.',
    sage: '감정을 차분하게 다루며, 갈등보다 조화를 선호합니다. 표현보다 행동으로 마음을 전하는 편입니다.',
    mint: '감정을 가볍고 산뜻하게 표현하며, 무거운 감정보다 회복과 이완을 중요하게 여깁니다.',
    olive: '감정을 묵묵히 담아두며, 안정적으로 표현합니다. 변화보다 꾸준함으로 마음을 전하는 편입니다.',
    teal: '감정을 이성적으로 정리한 후 표현합니다. 감정과 이성의 균형을 중요하게 여기며, 충동적인 표현을 자제합니다.',
    skyblue: '감정을 자유롭고 가볍게 표현합니다. 무거운 감정보다 가벼운 소통을 선호하며, 부담 없는 관계를 원합니다.',
    beige: '감정을 포근하고 안정적으로 표현합니다. 급하게 표현하기보다 천천히 편안하게 전달하는 편입니다.',
    cream: '감정을 조용하고 고요하게 표현합니다. 복잡한 것보다 단순하고 명료한 소통을 선호합니다.',
    brown: '감정을 안정적이고 신중하게 표현합니다. 변화보다 익숙한 방식으로 마음을 전하며, 꾸준한 행동으로 신뢰를 쌓습니다.',
    terracotta: '감정을 현실적이고 차분하게 표현합니다. 안정과 열정 사이에서 균형을 찾으며 소통합니다.',
    silver: '감정을 명료하게 정리한 후 표현합니다. 감정보다 논리를 앞세우는 편이며, 정리된 상태에서만 마음을 엽니다.',
  };
  if (colorIdMap[card.id]) {
    return colorIdMap[card.id]!;
  }
  const map: Record<EnergyFamily, string> = {
    warm_active: `감정을 직접적으로 표현하는 편이며, 느끼는 것을 바로 드러내는 경향이 있습니다. ${card.korName}처럼 솔직하고 즉각적인 표현 방식을 가지고 있습니다.`,
    warm_soft: `감정을 부드럽게 전달하는 편이며, 상대방을 배려하며 표현하는 성향이 있습니다. ${card.korName}의 온기처럼 따뜻하고 섬세하게 감정을 나눕니다.`,
    warm_grounded: `감정을 안정적으로 담아두는 편이며, 신중하게 표현하는 성향이 있습니다. ${card.korName}처럼 현실적이고 차분하게 감정을 전달합니다.`,
    cool_clear: `감정보다 이성을 앞세우는 편이며, 명확하게 표현하는 성향이 있습니다. ${card.korName}처럼 논리적이고 신뢰 있는 방식으로 소통합니다.`,
    cool_deep: `감정을 내면에 담아두는 편이며, 쉽게 드러내지 않는 성향이 있습니다. ${card.korName}처럼 깊이 있게 느끼지만 표현까지 시간이 걸립니다.`,
    nature: `감정을 억지로 붙잡지 않고 흘려보내는 편이며, 억지로 표현하기보다 분위기 속에서 전달하는 성향이 있습니다. ${card.korName}처럼 조용하고 균형 있게 감정을 나눕니다.`,
    neutral: `감정을 추스른 후 표현하는 편이며, 명료하고 균형 잡힌 방식으로 소통하는 성향이 있습니다. ${card.korName}처럼 차분하고 중심 잡힌 표현 방식을 가지고 있습니다.`,
  };
  return map[family];
}

function pickComplementColor(
  selectedIds: string[],
  recoveryColorId: string
): { id: string; korName: string; hex: string; meaning: string } {
  const recoveryFamily = getFamily(recoveryColorId);
  // 회복 방향과 다른 계열에서 보완 컬러 선택
  const candidates = COLOR_DATA.filter(c =>
    !selectedIds.includes(c.id) &&
    getFamily(c.id) !== recoveryFamily &&
    c.id !== 'red' // 레드는 기본 제외
  );
  // 회복·안정 계열 우선
  const preferred = candidates.filter(c =>
    ['nature', 'warm_soft', 'cool_clear'].includes(getFamily(c.id))
  );
  const pool = preferred.length > 0 ? preferred : candidates;
  const picked = pool[Math.floor(Math.random() * pool.length)] ?? COLOR_DATA[5];

  const meaningMap: Record<string, string> = {
    warm_active: '활력과 표현을 깨우는 컬러',
    warm_soft: '따뜻한 관계와 온기를 채우는 컬러',
    warm_grounded: '안정과 현실감을 더해주는 컬러',
    cool_clear: '명료함과 신뢰를 회복하는 컬러',
    cool_deep: '내면의 깊이와 성찰을 돕는 컬러',
    nature: '자연스러운 회복과 균형을 돕는 컬러',
    neutral: '감정을 추스르고 새롭게 시작하는 컬러',
  };

  return {
    id: picked.id,
    korName: picked.korName,
    hex: picked.hex,
    meaning: meaningMap[getFamily(picked.id)],
  };
}

// 컬러별 고유 회복 키워드 맵 (3번 카드 기반)
const RECOVERY_KEYWORD: Record<string, string> = {
  red: '잠시 속도를 늦추고 자신을 쉬게 해주는',
  orange: '따뜻한 관계 속에서 생기를 되찾는',
  coral: '자신을 먼저 돌봐주는',
  magenta: '억눌린 감정을 부드럽게 꺼내는',
  pink: '자신에게 따뜻하게 대해주는',
  peach: '자신을 사랑하는 연습을 시작하는',
  beige: '포근하고 부드러운 안정을 찾는',
  cream: '자신만의 고요한 리듬으로 돌아가는',
  gold: '자신의 고유한 가치를 편안하게 인정하는',
  brown: '익숙한 것에서 조금씩 유연해지는',
  terracotta: '내면의 고요한 평화를 찾는',
  blue: '믿을 수 있는 사람에게 솔직하게 표현하는',
  skyblue: '현실에 발을 딛고 꿈을 향해 나아가는',
  teal: '감정을 정화하고 균형을 되찾는',
  mint: '몸과 마음을 충분히 쉬게 해주는',
  indigo: '자신의 직관을 신뢰하며 깊이 성찰하는',
  violet: '지금 있는 그대로의 자신을 조용히 바라보는',
  black: '경계를 지키며 자신을 보호하는',
  silver: '감정을 천천히 정리하고 명료함을 찾는',
  green: '스스로 회복되도록 기다려주는',
  olive: '뿌리를 내리고 안정을 찾는',
  sage: '치유의 마음을 자신에게도 돌려주는',
  lavender: '자신을 위한 조용하고 따뜻한 시간을 갖는',
  white: '조용히 감정을 정리하며 진정성 있게 연결되는',
  yellow: '밝고 가벼운 마음으로 다시 시작하는',
};

// 1번 카드(현재 심리) 기반 도입 문장
function buildCard1Intro(card1: ColorData): string {
  const id = card1.id;
  const intros: Record<string, string> = {
    red: '지금 많은 힘을 쏟으며 달려오고 있습니다.',
    orange: '관계 속에서 많은 것을 주고 있는 시기입니다.',
    coral: '주변을 돌보느라 자신을 뒤로 미뤄온 것 같습니다.',
    magenta: '강렬한 감정이 마음속에 쌓여 있는 시기입니다.',
    pink: '타인을 위해 많은 감정을 쏟아온 시간이었습니다.',
    peach: '따뜻하게 주변을 챙겨왔지만 정작 자신은 지쳐 있습니다.',
    beige: '조용히 안정을 유지하려 애써온 시기입니다.',
    cream: '복잡한 것들을 정리하고 고요히 머물고 싶은 마음이 있습니다.',
    gold: '자신의 가치를 충분히 인정받지 못한 느낌이 있을 수 있습니다.',
    brown: '안정을 원하면서도 변화 앞에서 마음이 경직되는 시기입니다.',
    terracotta: '안정과 열정 사이에서 내면의 갈등이 있는 시기입니다.',
    blue: '책임감 있게 살아왔지만 감정을 표현하지 못해 답답함이 쌓여 있습니다.',
    skyblue: '자유롭고 싶은 마음이 강하지만 현실의 무게가 느껴지는 시기입니다.',
    teal: '이성적으로는 잘 정리되어 있지만 감정과의 연결이 조금 부족한 시기입니다.',
    mint: '새롭게 시작하고 싶지만 먼저 깊은 휴식이 필요한 상태입니다.',
    indigo: '혼자 오래 생각하며 많은 것을 마음속에 담아온 시기입니다.',
    violet: '내면을 깊이 들여다보고 싶은 마음이 강한 시기입니다.',
    black: '많은 것을 혼자 감당하며 경계를 지켜온 시기입니다.',
    silver: '감정을 조용히 정리하며 명료함을 찾고 있는 시기입니다.',
    green: '균형을 유지하려 노력해왔지만 내면의 회복이 필요한 시기입니다.',
    olive: '묵묵히 자리를 지켜왔지만 자신을 위한 시간이 부족했습니다.',
    sage: '주변을 치유하느라 자신의 감정은 조용히 쌓아온 시기입니다.',
    lavender: '감정을 섬세하게 느끼며 천천히 정리하고 싶은 시기입니다.',
    white: '상처가 생기면 조용히 거리를 두며 혼자 정리하려는 시간이 필요합니다.',
    yellow: '밝게 지내려 했지만 내면에는 정리되지 않은 감정이 있습니다.',
  };
  return intros[id] ?? `지금 마음속에 많은 것들이 쌓여 있는 시기입니다.`;
}

function buildPersonCoachingMessage(
  card1: ColorData,
  card3: ColorData,
  faith: FaithType
): string {
  const faithNote =
    faith === '기독교'
      ? ' 기도와 말씀 안에서 그 흐름을 찾아가실 수 있습니다.'
      : faith === '무교'
      ? ' 조용한 산책이나 혼자만의 시간이 그 흐름을 도와줄 것입니다.'
      : '';

  const intro = buildCard1Intro(card1);
  const recoveryKeyword = RECOVERY_KEYWORD[card3.id] ?? `한 걸음씩 자신에게 돌아오는`;

  return `${intro} ${recoveryKeyword} 시간이 지금 가장 필요합니다.${faithNote}`;
}

// ── 통합 관계 해석 ────────────────────────────────────────────────
export interface CoupleAnalysis {
  /** 관계 흐름 요약 */
  relationFlow: string;
  /** 서로 다른 표현 방식 (감정 차이 + 리듬 차이 통합) */
  expressionDifference: string;
  /** 오해가 생기기 쉬운 지점 */
  conflictPattern: string;
  /** 가까워지는 방법 (연결 방식 + 애정 스타일 통합) */
  connectionStyle: string;
  /** 서로에게 필요한 표현 */
  neededExpression: { forA: string; forB: string };
  /** 커플 보완 루틴 */
  coupleRoutine: CoupleRoutine;
  /** 마무리 코칭 메시지 */
  closingMessage: string;
  /** 두 사람 프로파일 대비 요약 (에너지 방향 차이 + 끌림 이유 + 반복 패턴) */
  profileContrast: string;
}

export interface CoupleRoutine {
  /** 함께하기 좋은 활동 */
  activities: string[];
  /** 추천 컬러 */
  recommendedColors: { id: string; korName: string; hex: string; reason: string }[];
  /** 감정 회복 루틴 */
  emotionRecovery: string;
  /** 대화 루틴 */
  conversationRoutine: string;
  /** 함께 쉬는 방식 */
  restTogether: string;
  /** 정서적 연결 루틴 */
  connectionRoutine: string;
  /** 애정 표현 루틴 (연인/부부) */
  affectionRoutine?: string;
}

export function generateCoupleAnalysis(
  data: CoupleSessionData,
  analysisA: PersonAnalysis,
  analysisB: PersonAnalysis
): CoupleAnalysis {
  const { relationType, personA, personB } = data;

  const colorsA = personA.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean) as ColorData[];
  const colorsB = personB.colors.map(id => COLOR_DATA.find(c => c.id === id)).filter(Boolean) as ColorData[];

  const familiesA = colorsA.map(c => getFamily(c.id));
  const familiesB = colorsB.map(c => getFamily(c.id));

  // 공통 계열
  const commonFamilies = familiesA.filter(f => familiesB.includes(f));
  const hasCommon = commonFamilies.length > 0;

  // 주요 에너지 계열
  const dominantA = getDominantFamily(familiesA);
  const dominantB = getDominantFamily(familiesB);

  // 도형 특성 추출 (3번 카드 우선)
  const shapeA = extractDominantShape(personA.cards);
  const shapeB = extractDominantShape(personB.cards);
  const shapeCtxA = buildShapeContext(shapeA);
  const shapeCtxB = buildShapeContext(shapeB);

  // 관계 흐름
  const relationFlow = buildRelationFlow(dominantA, dominantB, relationType, colorsA, colorsB);

  // 서로 다른 표현 방식 (감정 차이 + 리듬 차이 통합)
  const expressionDifference = buildExpressionDifference(dominantA, dominantB, familiesA, familiesB, colorsA, colorsB);

  // 오해가 생기는 지점
  const conflictPattern = buildMisunderstandingPattern(dominantA, dominantB, relationType, shapeCtxA, shapeCtxB, colorsA, colorsB);

  // 가까워지는 방법 (연결 방식 + 애정 스타일 통합)
  const connectionStyle = buildConnectionStyle(dominantA, dominantB, relationType, colorsA, colorsB);

  // 서로에게 필요한 표현
  const neededExpression = buildNeededExpression(dominantA, dominantB, colorsA, colorsB, shapeCtxA, shapeCtxB);

  // 커플 보완 루틴
  const coupleRoutine = buildCoupleRoutine(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith, shapeCtxA, shapeCtxB);

  // 마무리 코칭 메시지
  const closingMessage = buildClosingMessage(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith);

  // 두 사람 프로파일 대비 요약
  const profileContrast = buildProfileContrast(dominantA, dominantB, analysisA, analysisB, colorsA, colorsB, relationType, shapeCtxA, shapeCtxB);

  return {
    relationFlow,
    expressionDifference,
    conflictPattern,
    connectionStyle,
    neededExpression,
    coupleRoutine,
    closingMessage,
    profileContrast,
  };
}

// ── 통합 해석 빌더 함수들 ─────────────────────────────────────────


// ── 도형별 관계 특성 헬퍼 ─────────────────────────────────────────
/**
 * 도형별 관계 표현 특성 반환
 * 컬러 = 에너지 방향, 도형 = 표현 구조
 */
function buildShapeContext(shape: ShapeType | undefined): {
  modifier: string;
  conflictTrait: string;
  recoveryTrait: string;
  affectionStyle: string;
  conversationStyle: string;
} {
  switch (shape) {
    case 'triangle':
      // 삼각형: 경계/버틸/긴장/보호 — 감정을 직접 표현하지 않고 내부에서 정리한 후 표현
      return {
        modifier: '감정을 내부에서 정리한 후 직접적으로 표현하는',
        conflictTrait: '갈등 직후에 말이 없어지고 경계가 생길 수 있습니다. 상대는 이를 거절로 읽기 쉬운 패턴입니다',
        recoveryTrait: '혼자 정리하는 시간이 선행되어야 합니다. 이후 짧고 명확한 연결이 회복을 돕습니다',
        affectionStyle: '신뢰가 쌓인 후 직접적으로 표현하는 방식으로',
        conversationStyle: '경계를 존중하는 짧고 명확한 대화가',
      };
    case 'inverted_triangle':
      // 역삼각형: 감정 침잠형 — 감정이 안으로 하강하여 스스로 소화하는 패턴
      return {
        modifier: '감정이 안으로 침잠하며 내면에서 먼저 소화하는',
        conflictTrait: '갈등 직후 조용해지거나 말이 없어집니다. 상대는 원인을 모르고 기다리는 상황이 되고, 이 침묵이 거리감으로 번지는 패턴이 있습니다',
        recoveryTrait: '감정을 천천히 꺼내는 조용한 공간과 시간이 필요합니다. 서두르지 않는 연결이 마음을 엽어줍니다',
        affectionStyle: '감정을 충분히 소화한 후 진심으로 표현하는 방식으로',
        conversationStyle: '감정을 먼저 인정하고 기다려주는 부드러운 대화가',
      };
    case 'circle':
      // 원: 순환/관계 흐름형 — 감정이 순환하며 부드럽게 연결되는 패턴
      return {
        modifier: '감정이 순환하며 관계를 중심으로 연결되는',
        conflictTrait: '갈등 후에도 연결을 원하지만, 감정이 빠르게 변하여 상대가 현재 상태를 파악하기 어려울 수 있습니다',
        recoveryTrait: '관계 안에서 감정을 나누는 것 자체가 회복입니다. 연결이 끝나지 않는다는 신호가 필요합니다',
        affectionStyle: '자연스럽게 감정을 나누고 연결되는 방식으로',
        conversationStyle: '감정의 흐름을 따라가며 연결을 유지하는 부드러운 대화가',
      };
    case 'square':
      // 네모: 기준/질서형 — 현실적 구조와 책임감으로 관계를 이어가는 패턴
      return {
        modifier: '현실적 기준과 질서를 중시하며 안정적으로 관계를 이어가는',
        conflictTrait: '갈등 직후 원인과 해결책을 먼저 찾는 패턴이 있습니다. 감정보다 상황 정리가 앞서면 상대는 공감받지 못한다고 느낄 수 있습니다',
        recoveryTrait: '일상의 안정된 루틴과 현실적 해결 후 관계 회복이 자연스럽습니다',
        affectionStyle: '꼼준한 행동과 신뢰할 수 있는 안정감으로',
        conversationStyle: '구체적 상황과 현실적 해결에 집중하는 대화가',
      };
    case 'diamond':
      // 마름모: 긴장/변화 반응형 — 관계 감수성이 높고 작은 변화에도 민감하게 반응
      return {
        modifier: '관계의 작은 변화에도 민감하게 반응하며 균형을 조율하는',
        conflictTrait: '갈등 직후 긴장이 오래 지속되고 작은 말 한마디가 마음에 오래 남는 패턴이 있습니다',
        recoveryTrait: '섬세한 공감과 관계의 안정성을 확인하는 신호가 회복을 돕습니다',
        affectionStyle: '세심한 배려와 작은 표현에도 민감하게 반응하는 방식으로',
        conversationStyle: '작은 변화도 알아채주는 섬세한 연결 대화가',
      };
    case 'pentagon':
      // 오각형: 자기 방향성/성장 추구형 — 자신의 방향성을 중시하며 관계에서도 성장을 원함
      return {
        modifier: '자기 방향성이 명확하고 관계 안에서도 성장을 추구하는',
        conflictTrait: '갈등 직후 자신의 방향성을 지키려는 태도가 상대에게 밀어내는 느낙으로 읽힐 수 있습니다',
        recoveryTrait: '각자의 방향성을 존중하는 공간이 선행되어야 합니다. 그 후 함께 나아갈 방향을 이야기하는 연결이 필요합니다',
        affectionStyle: '서로의 성장을 응원하고 방향을 함께 나누는 방식으로',
        conversationStyle: '각자의 방향과 성장을 서로 인정하는 대화가',
      };
    case 'hexagon':
      // 육각형: 연결/공동체 흐름형 — 관계 조화를 위해 자신의 감정을 뒤로 미루는 패턴
      return {
        modifier: '관계의 조화를 위해 자신의 감정을 조율하며 연결을 유지하는',
        conflictTrait: '갈등 직후 관계를 지키려는 마음에 자신의 감정을 숨기는 패턴이 있습니다. 상대는 실제 상태를 모를 수 있습니다',
        recoveryTrait: '관계의 연결이 유지된다는 확인과 소속감이 회복을 돕습니다',
        affectionStyle: '함께하는 활동과 공동체적 연결로',
        conversationStyle: '관계와 연결을 중심으로 한 따뜻한 대화가',
      };
    default:
      return {
        modifier: '자신만의 방식으로',
        conflictTrait: '서로의 표현 방식이 달라 오해가 생길 수 있습니다',
        recoveryTrait: '서로의 방식을 존중하는 시간이 필요합니다',
        affectionStyle: '자신만의 방식으로',
        conversationStyle: '편안한 대화가',
      };
  }
}

/**
 * 카드 ID 배열에서 주요 도형 추출 (3번 카드 우선, 없으면 1번 카드)
 */
function extractDominantShape(cardIds: string[]): ShapeType | undefined {
  const card3 = cardIds[2] ? CARD_DATA.find(c => c.id === cardIds[2]) : undefined;
  if (card3?.shape) return card3.shape;
  const card1 = cardIds[0] ? CARD_DATA.find(c => c.id === cardIds[0]) : undefined;
  return card1?.shape;
}

function getDominantFamily(families: EnergyFamily[]): EnergyFamily {
  const count: Partial<Record<EnergyFamily, number>> = {};
  // 첫 번째 컬러(무의식 카드)에 가중치 2배 부여 — 가장 핵심 에너지를 정확히 반영
  families.forEach((f, i) => { count[f] = (count[f] ?? 0) + (i === 0 ? 2 : 1); });
  return (Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral') as EnergyFamily;
}

function getRelationFlowPrefix(rel: RelationType): string {
  const map: Record<RelationType, string> = {
    '연인': '두 분의 마음 상태가 만나고 있습니다.',
    '부부': '오랜 시간을 함께해온 두 분의 흐름이 지금 이 자리에서 다시 만나고 있습니다.',
    '친구': '두 사람의 서로 다른 결이 우정 안에서 만나고 있습니다.',
    '부모-자녀': '세대가 다른 두 사람의 마음이 같은 공간에서 만나고 있습니다.',
    '아빠-아들': '아빠와 아들의 서로 다른 감정 흐름이 지금 이 자리에서 만나고 있습니다.',
    '아빠-딸': '아빠와 딸의 서로 다른 감정 흐름이 지금 이 자리에서 만나고 있습니다.',
    '엄마-아들': '엄마와 아들의 서로 다른 감정 흐름이 지금 이 자리에서 만나고 있습니다.',
    '엄마-딸': '엄마와 딸의 서로 다른 감정 흐름이 지금 이 자리에서 만나고 있습니다.',
    '형제자매': '가장 가까운 사이인 두 사람의 흐름이 지금 이 자리에서 다시 마주하고 있습니다.',
    '동료': '함께 일하는 두 사람의 에너지 결이 만나고 있습니다.',
  };
  return map[rel] ?? '두 사람의 마음 상태가 만나고 있습니다.';
}

function buildRelationFlow(
  fA: EnergyFamily, fB: EnergyFamily,
  rel: RelationType,
  colorsA: ColorData[], colorsB: ColorData[]
): string {
  const nameA = colorsA[0]?.korName ?? '';
  const nameB = colorsB[0]?.korName ?? '';
  const relLabel = rel === '연인' || rel === '부부' ? '두 분' : '두 사람';
  const prefix = getRelationFlowPrefix(rel);

  if (fA === fB) {
    const sameMsg: Partial<Record<RelationType, string>> = {
      '부부': `${prefix} ${nameA}와 ${nameB}처럼 서로 닮은 흐름이 있어 오랫동안 함께할 수 있었던 이유가 있습니다. 다만 같은 성향이 오래 만나면 서로의 약한 부분도 함께 드러날 수 있습니다. 지금 필요한 것은 새로운 자극이 아니라, 서로를 다시 바라보는 따뜻한 시선입니다.`,
      '부모-자녀': `${prefix} ${nameA}와 ${nameB}처럼 비슷한 기질을 가지고 있어 서로를 이해하는 부분이 많습니다. 하지만 같은 성향끼리는 서로의 기대가 높아지기도 합니다. 이해의 언어를 조금 더 부드럽게 표현하는 것이 관계를 따뜻하게 만들어줍니다.`,
      '형제자매': `${prefix} ${nameA}와 ${nameB}처럼 비슷한 결을 가지고 있어 서로 통하는 부분이 많습니다. 가장 가까운 사이일수록 서로의 다름보다 닮음이 더 크게 느껴질 때, 관계가 편안해집니다.`,
    };
    const sameFamilyMsg: Record<EnergyFamily, string> = {
      warm_active: `${relLabel}은 둘 다 감정이 생기면 바로 표현하고 빠르게 반응하는 에너지를 가지고 있습니다. 함께 있으면 활기차고 공감이 빠르지만, 둘 다 흥분하면 감정 강도가 함께 올라가는 순간이 생깁니다. 서로 닮아서 과열되는 패턴을 인식하고, 한 사람이 먼저 속도를 낮춰주는 것이 이 관계의 핵심입니다.`,
      warm_soft: `${relLabel}은 둘 다 따뜻하게 배려하고 감성적으로 연결되는 에너지를 가지고 있습니다. 서로의 마음을 잘 알아채지만, 둘 다 자신의 감정을 뒤로 미루다가 소진되는 패턴이 생길 수 있습니다. 가끔 자신의 감정을 먼저 꺼내는 것이 두 사람 모두에게 필요합니다.`,
      warm_grounded: `${relLabel}은 둘 다 안정적이고 신중하게 관계를 이어가는 에너지를 가지고 있습니다. 함께 있으면 편안하지만, 변화나 결정이 필요한 순간에 둘 다 망설이다가 정체되는 패턴이 생길 수 있습니다. 작은 제안 하나가 관계를 앞으로 나아가게 합니다.`,
      cool_clear: `${relLabel}은 둘 다 명료하고 효율적인 방식으로 소통하는 에너지를 가지고 있습니다. 서로의 방식을 잘 이해하지만, 감정적 연결보다 결론을 먼저 내리다가 관계가 사무적으로 느껴지는 순간이 생길 수 있습니다. 가끔 감정을 먼저 나누는 시간이 필요합니다.`,
      cool_deep: `${relLabel}은 둘 다 감정을 깊이 담아두고 천천히 꺼내는 에너지를 가지고 있습니다. 서로의 침묵을 이해하지만, 둘 다 기다리다가 연결이 늦어지는 패턴이 반복될 수 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결합니다.`,
      nature: `${relLabel}은 둘 다 자연스럽고 유연한 리듬으로 관계를 이어가는 에너지를 가지고 있습니다. 서로를 강요하지 않아 편안하지만, 둘 다 방향을 기다리다가 관계가 정체되는 순간이 생길 수 있습니다. 누군가 먼저 방향을 제안하는 것이 관계를 앞으로 나아가게 합니다.`,
      neutral: `${relLabel}은 둘 다 균형 잡힌 방식으로 감정을 다루는 에너지를 가지고 있습니다. 서로의 속도를 편안하게 맞춰가지만, 때로는 누군가 먼저 감정을 꺼내는 것이 필요합니다. 지금의 균형을 유지하면서 조금씩 더 깊이 연결되어 가는 것이 두 사람에게 맞는 방향입니다.`,
    };
    return sameMsg[rel] ?? sameFamilyMsg[fA];
  }

  const combos: Partial<Record<string, string>> = {
    'warm_active-cool_deep': `${nameA}의 표현하는 흐름과 ${nameB}의 내면으로 담아두는 성향이 만나고 있습니다. 한 사람은 감정이 생기면 바로 꺼내야 편해지고, 다른 사람은 충분히 정리된 후에야 말할 수 있습니다. 이 속도 차이가 반복되면 "왜 말을 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 패턴이 생깁니다. 표현의 타이밍이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_deep-warm_active': `${nameA}의 내면으로 담아두는 흐름과 ${nameB}의 표현하는 성향이 만나고 있습니다. 한 사람의 침묵이 다른 사람에게는 거리두기로 읽히는 순간이 반복될 수 있습니다. 조용한 것이 무관심이 아니라 깊이 생각하는 방식임을 서로 알면, 이 패턴에서 벗어날 수 있습니다.`,
    'warm_soft-cool_clear': `${nameA}의 따뜻하고 배려하는 성향과 ${nameB}의 명료하고 신뢰 중심의 성향이 만나고 있습니다. 한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 내놓습니다. 이 차이가 반복되면 "내 말을 들어주지 않는다"는 느낌이 쌓일 수 있습니다. 감성과 이성이 균형을 이룰 때 두 사람의 관계는 가장 안정적입니다.`,
    'cool_clear-warm_soft': `${nameA}의 명료하고 신뢰 중심의 성향과 ${nameB}의 따뜻하고 배려하는 성향이 만나고 있습니다. 한 사람의 이성적인 말이 다른 사람에게 차갑게 느껴지는 순간이 반복될 수 있습니다. 논리적인 표현 뒤에도 진심이 있다는 것을 기억하면, 두 사람 사이의 온도 차이가 좁혀집니다.`,
    'nature-warm_active': `${nameA}의 조용하고 균형 잡힌 성향과 ${nameB}의 활기차고 표현하는 성향이 만나고 있습니다. 한 사람이 안정을 잡아주고 다른 사람이 활력을 불어넣는 보완적인 구조입니다. 속도 차이가 반복되면 "왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 패턴이 생깁니다. 서로의 리듬을 존중하는 것이 이 관계의 핵심입니다.`,
    'warm_active-nature': `${nameA}의 활기차고 표현하는 성향과 ${nameB}의 조용하고 균형 잡힌 성향이 만나고 있습니다. 한 사람의 빠른 에너지가 다른 사람에게는 부담으로 느껴지는 순간이 생길 수 있습니다. 서로 다른 리듬이 만날 때, 속도를 맞추려는 노력보다 각자의 리듬을 인정하는 것이 더 자연스러운 균형을 만들어줍니다.`,
    'warm_grounded-cool_deep': `${nameA}의 안정적이고 신중한 성향과 ${nameB}의 내면으로 담아두는 성향이 만나고 있습니다. 두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
    'warm_soft-warm_active': `${nameA}의 따뜻하고 배려하는 성향과 ${nameB}의 활기차고 표현하는 성향이 만나고 있습니다. 두 사람 모두 감정을 중요하게 여기지만, 한 사람은 부드럽게 감싸고 다른 사람은 즉각적으로 표현합니다. 이 온도 차이가 때로는 "왜 그렇게 강하게 반응해?"와 "왜 그렇게 조심스러워?"로 나타날 수 있습니다.`,
    'cool_deep-warm_soft': `내면에서 천천히 정리하는 사람과 따뜻한 연결과 표현을 원하는 사람이 만났습니다. 한 사람은 마음이 충분히 가라앉을 때까지 조용히 있으려 하고, 다른 사람은 감정을 나누고 온기를 확인하고 싶어 합니다. 조용함이 거리두기로 오해받고, 표현 요구가 압박으로 느껴지는 순간이 반복될 수 있습니다. 침묵이 무관심이 아니라 깊이 생각하는 방식임을 서로 알면, 이 패턴에서 벗어날 수 있습니다.`,
    'warm_soft-cool_deep': `따뜻한 연결과 표현을 원하는 사람과 내면에서 천천히 정리하는 사람이 만났습니다. 한 사람은 감정을 나누고 온기를 확인하고 싶어 하고, 다른 사람은 마음이 충분히 가라앉을 때까지 조용히 있으려 합니다. 한 사람의 표현 욕구가 다른 사람에게 부담으로 느껴지는 순간이 생길 수 있습니다. 서로의 속도를 인정하면 두 사람의 관계는 훨씬 편안해집니다.`,
    'warm_active-warm_grounded': `즉각적으로 표현하고 빠르게 반응하는 사람과 안정적이고 신중하게 움직이는 사람이 만났습니다. 한 사람은 감정이 생기면 바로 꺼내야 편해지고, 다른 사람은 충분히 생각한 후에야 반응합니다. "왜 이렇게 무덤덤해?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다. 표현의 속도가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'warm_grounded-warm_soft': `안정적이고 꾸준한 성향을 가진 사람과 따뜻하고 감성적인 성향을 가진 사람이 만났습니다. 한 사람은 일상 속 꾸준한 행동으로 마음을 전하고, 다른 사람은 따뜻한 말과 감정 표현으로 연결되고 싶어 합니다. 서로의 사랑 언어가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_clear-nature': `명료하고 효율적인 성향을 가진 사람과 유연하고 여유 있는 리듬을 가진 사람이 만났습니다. 한 사람은 계획적이고 체계적인 방식을 선호하고, 다른 사람은 흐름에 맡기는 방식이 편합니다. "왜 이렇게 계획이 없어?"와 "왜 이렇게 딱딱해?"가 교차하는 순간이 있습니다. 두 방식이 균형을 이룰 때 관계가 가장 안정적입니다.`,
  };
  // 컬러 ID 기반 관계 흐름 — 생활 긴장 구조 중심
  const colorIdCombos: Partial<Record<string, string>> = {
    // 화이트 포함 조합 — 거리두기·정리·완벽주의 긴장
    'white-pink': `정리와 거리두기를 중요하게 여기는 사람과 따뜻한 연결을 원하는 사람이 만났습니다. 한 사람은 감정이 복잡해지면 혼자 정리하려 하고, 다른 사람은 그 거리감이 서운하게 느껴집니다. "왜 혼자 있으려 해?"와 "왜 이렇게 붙어 있으려 해?"가 교차할 수 있습니다. 서로의 회복 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'white-red': `정리와 명료함을 중요하게 여기는 사람과 즉각적이고 빠르게 반응하는 사람이 만났습니다. 한 사람은 감정을 혼자 정리하려 하고, 다른 사람은 지금 당장 표현하고 싶어 합니다. 청소·정리 방식이나 생활 기준의 차이가 반복적인 긴장 포인트가 될 수 있습니다.`,
    'white-magenta': `조용히 감정을 비워내는 사람과 감정에 깊이 몰입하는 사람이 만났습니다. 한 사람은 거리를 두며 정화하려 하고, 다른 사람은 그 거리감이 상처로 느껴집니다. 감정 정리 방식의 차이가 반복적인 오해를 만들 수 있습니다.`,
    'white-navy': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 공간을 정리하며 회복하고, 다른 사람은 혼자 책임을 지며 버팁니다. 서로 표현이 부족해 거리감이 쌓일 수 있지만, 각자의 방식으로 관계를 지키고 있습니다.`,
    'white-black': `두 사람 모두 마음을 쉽게 열지 않습니다. 한 사람은 감정을 정화하고 거리를 두며 회복하고, 다른 사람은 경계를 지키며 자신을 보호합니다. 서로의 침묵이 오해로 이어지지 않도록 작은 표현이 중요합니다.`,
    // 블랙 포함 조합 — 통제·경계·주도권 긴장
    'black-pink': `경계와 통제를 중요하게 여기는 사람과 따뜻한 연결을 원하는 사람이 만났습니다. 한 사람의 경계가 다른 사람에게 차갑게 느껴지고, 다른 사람의 애정 표현이 한 사람에게 부담스럽게 느껴질 수 있습니다.`,
    'black-red': `두 사람 모두 강한 에너지를 가지고 있습니다. 주도권 문제와 자기 방식 고수가 반복적인 충돌 포인트가 될 수 있습니다. 서로의 방식을 강요하지 않는 것이 관계의 핵심입니다.`,
    'black-magenta': `경계를 지키는 사람과 감정에 깊이 몰입하는 사람이 만났습니다. 한 사람의 거리두기가 다른 사람에게 거절로 느껴지는 순간이 반복될 수 있습니다. 서로의 감정 방식이 다를 뿐임을 이해하는 것이 중요합니다.`,
    // 네이비/블루 포함 조합 — 책임·신뢰·표현 부족 긴장
    'navy-pink': `책임감 있게 묵묵히 버티는 사람과 따뜻한 표현을 원하는 사람이 만났습니다. 한 사람의 표현 부족이 다른 사람에게 무관심으로 느껴질 수 있습니다. "왜 말을 안 해?"와 "말 안 해도 알잖아"가 반복되는 패턴이 생길 수 있습니다.`,
    'navy-red': `신중하고 책임감 있는 사람과 즉각적이고 빠른 사람이 만났습니다. 한 사람의 신중함이 다른 사람에게 답답함으로, 다른 사람의 속도가 한 사람에게 부담으로 느껴질 수 있습니다. 표현 속도 차이가 반복적인 긴장 포인트입니다.`,
    'navy-magenta': `혼자 버티는 사람과 감정에 깊이 몰입하는 사람이 만났습니다. 한 사람의 침묵이 다른 사람에게 거리감으로 느껴지고, 다른 사람의 감정 표현이 한 사람에게 부담스럽게 느껴질 수 있습니다.`,
    'blue-pink': `신뢰와 신중함을 중요하게 여기는 사람과 따뜻한 연결을 원하는 사람이 만났습니다. 한 사람은 충분히 생각한 후에야 표현하고, 다른 사람은 지금 당장 따뜻한 반응을 원합니다. 표현 타이밍의 차이가 서운함으로 이어질 수 있습니다.`,
    // 레드 포함 조합 — 속도·즉각반응·감정폭발 긴장
    'red-green': `즉각적이고 빠른 사람과 갈등을 피하려는 사람이 만났습니다. 한 사람의 강한 표현이 다른 사람에게 부담이 되고, 다른 사람의 회피가 한 사람에게 답답함으로 느껴질 수 있습니다.`,
    'red-violet': `즉각 반응하는 사람과 깊이 생각하는 사람이 만났습니다. 한 사람의 빠른 속도가 다른 사람에게 압박이 되고, 다른 사람의 느린 반응이 한 사람에게 무관심으로 느껴질 수 있습니다.`,
    'red-lavender': `즉각적이고 표현이 강한 사람과 섬세하고 조용한 사람이 만났습니다. 한 사람의 강한 표현이 다른 사람에게 상처가 되기 쉽고, 다른 사람의 조용함이 한 사람에게 답답함으로 느껴질 수 있습니다.`,
    // 핑크/마젠타 포함 조합 — 애정욕구·감정몰입 긴장
    'pink-green': `애정 표현을 중요하게 여기는 사람과 갈등을 피하며 조용히 배려하는 사람이 만났습니다. 한 사람은 더 많은 표현을 원하고, 다른 사람은 그 기대가 부담스러울 수 있습니다.`,
    'magenta-green': `감정에 깊이 몰입하는 사람과 갈등을 피하려는 사람이 만났습니다. 한 사람의 강한 감정 표현이 다른 사람에게 부담이 되고, 다른 사람의 회피가 한 사람에게 거절로 느껴질 수 있습니다.`,
    // 퍼플/바이올렛 포함 조합 — 이상·예민·이해받지 못함 긴장
    'violet-yellow': `이상적인 연결을 원하는 사람과 현실적이고 밝은 사람이 만났습니다. 한 사람은 깊은 의미와 감정적 연결을 원하고, 다른 사람은 가볍고 현실적인 소통을 선호합니다. "왜 이렇게 깊이 생각해?"와 "왜 이렇게 가볍게 봐?"가 교차할 수 있습니다.`,
    'violet-red': `깊이 생각하는 사람과 즉각 반응하는 사람이 만났습니다. 한 사람의 느린 반응이 다른 사람에게 무관심으로, 다른 사람의 빠른 속도가 한 사람에게 압박으로 느껴질 수 있습니다.`,
    // 그린 포함 조합 — 갈등회피·중재·감정 참기 긴장
    'green-navy': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 갈등을 피하며 배려하고, 다른 사람은 혼자 책임을 지며 버팁니다. 서로 표현이 부족해 거리감이 쌓일 수 있습니다.`,
    'green-yellow': `갈등을 피하려는 사람과 현실적이고 걱정이 많은 사람이 만났습니다. 두 사람 모두 감정을 직접 표현하기보다 안으로 담아두는 경향이 있어, 쌓인 감정이 한꺼번에 터지는 패턴이 생길 수 있습니다.`,
    // 레드·블루·블랙 조합 — 신뢰 욕구 + 기준 + 정리/질서
    'red-blue': `감정을 바로 표현하고 즉각 반응을 원하는 사람과 신중하게 생각한 후 말하는 사람이 만났습니다. 한 사람의 빠른 감정 표현이 다른 사람에게 충동적으로 느껴지고, 다른 사람의 침묵이 한 사람에게 무관심으로 읽힙니다. "지금 바로 말해줘"와 "나는 정리 중이야"가 반복되는 패턴입니다. 신뢰와 기준을 중요하게 여기는 사람과 즉각적인 연결을 원하는 사람이 서로의 속도를 인정하는 것이 핵심입니다.`,
    'red-black': `두 사람 모두 강한 에너지를 가지고 있습니다. 한 사람은 감정을 바로 표현하고 즉각 반응을 원하며, 다른 사람은 자기 기준과 방식을 고수하며 간섭을 불편해합니다. 주도권 충돌과 생활 기준 차이가 반복적인 긴장 포인트가 됩니다. "왜 이렇게 고집이 세?"와 "왜 이렇게 강요해?"가 교차합니다.`,
    'blue-black': `신중하고 신뢰를 중요하게 여기는 사람과 경계와 자기 방식을 고수하는 사람이 만났습니다. 두 사람 모두 감정을 쉽게 드러내지 않아 서로의 마음을 읽기 어렵습니다. 집안 정리 기준이나 생활 루틴에 대한 기대가 다를 때 조용히 긴장이 쌓입니다. 먼저 한 마디 건네는 것이 두 사람 사이를 연결하는 가장 빠른 방법입니다.`,
    // 핑크·인디고·옐로우 조합 — 따뜻한 연결 + 인정 욕구 + 현실 안정 + 책임감
    'pink-indigo': `따뜻한 연결과 표현을 원하는 사람과 깊이 생각하며 신중하게 반응하는 사람이 만났습니다. 한 사람은 지금 당장 따뜻한 반응을 원하고, 다른 사람은 충분히 생각한 후에야 말합니다. "왜 반응이 없어?"와 "나는 생각 중이야"가 반복됩니다. 인정 욕구와 신중함이 균형을 이룰 때 두 사람의 관계는 가장 안정적입니다.`,
    'indigo-yellow': `깊이 생각하며 신중하게 반응하는 사람과 현실적이고 걱정이 많은 사람이 만났습니다. 두 사람 모두 현실 안정을 중요하게 여기지만, 한 사람은 내면 정리 후 표현하고 다른 사람은 현실 계획과 책임감으로 관계를 이어갑니다. 감정 표현이 줄어드는 패턴이 생길 수 있어, 가끔 마음을 나누는 시간이 필요합니다.`,
    'pink-yellow': `따뜻한 연결을 원하는 사람과 현실적이고 책임감 있는 사람이 만났습니다. 한 사람은 말과 스킨십으로 마음을 확인하고 싶어 하고, 다른 사람은 현실적인 행동으로 마음을 보여줍니다. "말로도 해줘"와 "이미 다 하고 있잖아"가 반복됩니다. 인정 욕구와 현실 안정 욕구가 다른 방향으로 표현되는 패턴입니다.`,
    // 오렌지·퍼플·라벤더 조합
    'orange-purple': `즉각적이고 활기찬 사람과 깊이 생각하고 분위기를 중요하게 여기는 사람이 만났습니다. 한 사람의 빠른 속도가 다른 사람에게 부담이 되고, 다른 사람의 느린 반응이 한 사람에게 무관심으로 느껴집니다. 속도 차이를 인정하는 것이 이 관계의 핵심입니다.`,
    'orange-indigo': `즉각적으로 반응하는 사람과 신중하게 생각하는 사람이 만났습니다. 한 사람의 활기찬 에너지가 다른 사람에게 자극이 되고, 다른 사람의 신중함이 한 사람에게 안정감을 줍니다. 표현 속도 차이가 반복적인 긴장 포인트가 될 수 있습니다.`,
    'lavender-indigo': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 섬세하게 분위기를 읽고, 다른 사람은 깊이 생각한 후 말합니다. 서로 표현이 부족해 거리감이 쌓일 수 있지만, 각자의 방식으로 관계를 소중히 여기고 있습니다.`,
  };
  // 컬러 ID 기반 문장이 있으면 우선 사용
  const colorA0 = colorsA[0]?.id ?? '';
  const colorB0 = colorsB[0]?.id ?? '';
  const colorIdKey = `${colorA0}-${colorB0}`;
  const colorIdKeyRev = `${colorB0}-${colorA0}`;
  const colorIdResult = colorIdCombos[colorIdKey] ?? colorIdCombos[colorIdKeyRev];

  const key = `${fA}-${fB}`;

  // 폴백 문장 다양화 — A+B 양쪽 특성이 균형 있게 드러나도록 개선
  const getFamilyTrait = (f: EnergyFamily): string => {
    const traitMap: Record<EnergyFamily, string> = {
      warm_active: '감정을 바로 표현하고 빠르게 반응하는',
      warm_soft: '따뜻하게 배려하며 관계 온도를 중요하게 여기는',
      warm_grounded: '안정적이고 꾸준하게 신뢰를 쌓는',
      cool_clear: '명료하게 정리하고 논리적으로 판단하는',
      cool_deep: '내면에서 천천히 정리하며 깊이 생각하는',
      nature: '자신의 리듬을 지키며 유연하게 흘러가는',
      neutral: '균형 잡힌 방식으로 관계를 이어가는',
    };
    return traitMap[f];
  };
  const traitA = getFamilyTrait(fA);
  const traitB = getFamilyTrait(fB);
  const fallbackByA: Partial<Record<EnergyFamily, string>> = {
    warm_active: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람의 빠른 표현이 다른 사람에게 부담으로 느껴지거나, 다른 사람의 반응 방식이 무관심으로 오해받는 순간이 생길 수 있습니다. 서로의 속도와 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    warm_soft: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람은 감정을 나누고 연결을 확인하고 싶어 하고, 다른 사람은 그 방식이 다를 수 있습니다. 서로의 표현 언어를 이해하는 것이 두 사람 관계의 핵심입니다.`,
    warm_grounded: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람의 꾸준하고 신중한 방식이 다른 사람에게 느리거나 무덤덤하게 느껴지는 순간이 생길 수 있습니다. 속도와 방향의 차이를 인정하는 것이 관계의 균형을 만들어줍니다.`,
    cool_clear: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람의 이성적이고 명료한 방식이 다른 사람에게 차갑게 느껴지는 순간이 생길 수 있습니다. 생각 중심과 감정 중심, 두 방식이 균형을 이룰 때 관계가 가장 안정적입니다.`,
    cool_deep: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람의 침묵과 내향적인 방식이 다른 사람에게 거리두기로 오해받는 순간이 생길 수 있습니다. 표현 타이밍의 차이가 관계의 온도 차이로 느껴질 수 있지만, 서로의 방식을 이해하면 오해가 줄어듭니다.`,
    nature: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 한 사람의 조용하고 유연한 방식이 다른 사람에게 무관심으로 느껴지는 순간이 생길 수 있습니다. 각자의 속도를 인정하는 것이 관계를 편안하게 만들어줍니다.`,
    neutral: `${traitA} 사람과 ${traitB} 사람이 만났습니다. 서로 다른 방식이 만날 때, 그 차이를 이해하는 것이 관계 회복의 첫 걸음입니다.`,
  };
  const base = colorIdResult ?? combos[key] ?? fallbackByA[fA] ?? `${nameA}와 ${nameB}처럼 서로 다른 결이 만나고 있습니다. 감정 거리감과 표현 속도의 차이가 반복될 수 있지만, 서로에게 없는 것을 채워주는 힘이기도 합니다.`;
  // 관계 유형별 마무리 문장 추가
  const relSuffix: Partial<Record<RelationType, string>> = {
    '부부': ' 오랜 시간이 쌓인 관계일수록, 서로의 다름을 다시 이해하는 것이 새로운 시작이 됩니다.',
    '부모-자녀': ' 세대의 차이가 있어도, 서로를 향한 마음은 같습니다. 이해의 방식이 다를 뿐입니다.',
    '아빠-아들': ' 아빠와 아들 사이에서 감정을 꺼내는 방식이 다를 뿐, 서로를 향한 마음은 같습니다.',
    '아빠-딸': ' 아빠와 딸 사이에서 표현의 온도가 다를 수 있지만, 서로를 향한 마음은 같습니다.',
    '엄마-아들': ' 엄마와 아들 사이에서 감정 언어가 다를 수 있지만, 연결되고 싶은 마음은 같습니다.',
    '엄마-딸': ' 엄마와 딸 사이에서 표현 방식이 달라도, 서로를 이해하려는 마음은 같습니다.',
    '형제자매': ' 가장 가까운 사이이기에 더 솔직하게, 더 깊이 이해할 수 있는 관계입니다.',
    '동료': ' 함께 일하는 사이에서도 서로의 결을 이해하면 더 편안하게 협력할 수 있습니다.',
    '친구': ' 서로의 다름을 아는 우정이 가장 오래 지속됩니다.',
  };
  return base + (relSuffix[rel] ?? ` ${relLabel}의 다름을 이해하는 것이 관계 회복의 첫 걸음입니다.`);
}

function buildCommonGround(
  hasCommon: boolean,
  commonFamilies: EnergyFamily[],
  colorsA: ColorData[], colorsB: ColorData[]
): string {
  if (!hasCommon) {
    return `두 사람은 서로 다른 에너지 계열을 가지고 있지만, 그 안에서도 공통된 마음이 있습니다. 관계를 소중히 여기고, 서로에게 진심으로 연결되고 싶은 마음은 두 사람 모두에게 있습니다.`;
  }
  const familyLabel = getFamilyLabel(commonFamilies[0]);
  return `두 사람 모두 ${familyLabel} 안에 있는 결을 나누고 있습니다. 이 공통된 결이 서로를 서로를 가깝게 당기고, 깊은 공감대를 만들어줍니다. 같은 방향을 바라볼 때 두 사람은 가장 편안하게 연결됩니다.`;
}

function buildDifferentTemperament(
  fA: EnergyFamily, fB: EnergyFamily,
  colorsA: ColorData[], colorsB: ColorData[]
): string {
  const labelA = getFamilyLabel(fA);
  const labelB = getFamilyLabel(fB);
  const nameA = colorsA[0]?.korName ?? 'A';
  const nameB = colorsB[0]?.korName ?? 'B';

  if (fA === fB) {
    return `두 사람은 비슷한 기질을 가지고 있습니다. ${labelA} 기질이 공통적으로 나타나며, 서로를 쉽게 이해하는 편입니다. 다만 같은 성향끼리 만날 때는 서로의 한계도 함께 공명될 수 있으니, 의식적으로 다른 시각을 나눠보는 것이 도움이 됩니다.`;
  }

  return `한 사람은 ${labelA} 기질(${nameA} 계열)을, 다른 사람은 ${labelB} 기질(${nameB} 계열)을 가지고 있습니다. 이 기질의 차이는 서로가 세상을 다르게 경험하고 있다는 것을 의미합니다. 옳고 그름의 문제가 아니라, 서로 다른 방식으로 살아가고 있는 것입니다.`;
}

function buildEmotionDifference(
  familiesA: EnergyFamily[], familiesB: EnergyFamily[],
  colorsA: ColorData[], colorsB: ColorData[],
  rel?: RelationType
): string {
  const fA = getDominantFamily(familiesA);
  const fB = getDominantFamily(familiesB);
  const nameA = colorsA[0]?.korName ?? 'A';
  const nameB = colorsB[0]?.korName ?? 'B';

  // 현실 공감 장면이 담긴 조합별 문장
  const sceneMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': `${nameA}의 에너지를 가진 사람은 감정이 생기면 바로 말하고 싶어 합니다. 반면 ${nameB}의 성향을 가진 사람은 마음이 충분히 가라앉을 때까지 조용히 있으려 합니다. "왜 아무 말도 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 순간이 생기기 쉽습니다.`,
    'cool_deep-warm_active': `${nameA}의 성향을 가진 사람은 마음이 가라앉을 때까지 조용히 있는 편입니다. 반면 ${nameB}의 에너지를 가진 사람은 감정을 바로 꺼내야 편해집니다. 침묵이 거리두기로 오해받는 순간이 생기기 쉽습니다.`,
    'warm_soft-cool_clear': `${nameA}의 성향을 가진 사람은 "내 마음을 알아줬으면" 하는 바람이 먼저입니다. 반면 ${nameB}의 성향을 가진 사람은 "어떻게 해결할까"를 먼저 생각합니다. 공감을 원하는데 해결책이 돌아올 때 서운함이 쌓일 수 있습니다.`,
    'cool_clear-warm_soft': `${nameA}의 성향을 가진 사람은 감정보다 상황 정리를 먼저 합니다. 반면 ${nameB}의 성향을 가진 사람은 먼저 공감받고 싶어 합니다. 이성적인 말이 차갑게 느껴지는 순간이 생길 수 있습니다.`,
    'warm_active-nature': `${nameA}의 에너지를 가진 사람은 빠르게 반응하고 즉각 표현합니다. 반면 ${nameB}의 성향을 가진 사람은 자신의 리듬대로 천천히 처리합니다. "왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다.`,
    'nature-warm_active': `${nameA}의 성향을 가진 사람은 조용히 자신의 리듬을 지킵니다. 반면 ${nameB}의 에너지를 가진 사람은 빠르게 반응하고 표현합니다. 조용한 존재감이 무관심으로 오해받는 순간이 생길 수 있습니다.`,
    'cool_deep-cool_clear': `${nameA}의 성향을 가진 사람은 감정을 깊이 담아두고 천천히 꺼냅니다. ${nameB}의 성향을 가진 사람은 논리적으로 정리하고 명료하게 표현합니다. 두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.`,
    'warm_grounded-warm_active': `${nameA}의 성향을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. 반면 ${nameB}의 에너지를 가진 사람은 즉각적으로 표현합니다. "왜 그렇게 흥분해?"와 "왜 그렇게 무덤덤해?"가 부딪히는 순간이 있습니다.`,
  };

  const key = `${fA}-${fB}`;
  if (sceneMap[key]) return sceneMap[key]!;

  const isParentChild = rel === '부모-자녀' || rel === '아빠-아들' || rel === '아빠-딸' || rel === '엄마-아들' || rel === '엄마-딸';
  const isColleague = rel === '동료';
  const isFriend = rel === '친구';
  const exprA = getEmotionExpressionShort(fA);
  const exprB = getEmotionExpressionShort(fB);

  if (isParentChild) {
    return `${nameA}의 성향을 가진 사람은 ${exprA} 방식으로 감정을 다루고, ${nameB}의 성향을 가진 사람은 ${exprB} 방식으로 감정을 다룹니다. 세대 차이보다 감정 언어의 차이가 더 크게 느껴지는 순간이 있습니다. 서로의 방식이 다를 뿐, 두 사람 모두 연결되고 싶은 마음은 같습니다.`;
  } else if (isColleague) {
    return `${nameA}의 성향을 가진 사람은 ${exprA} 방식으로, ${nameB}의 성향을 가진 사람은 ${exprB} 방식으로 상황을 처리합니다. 같은 상황에서도 반응 방식이 달라 소통의 온도 차이가 생길 수 있습니다. 서로의 처리 방식을 이해하면 협업이 훨씬 자연스러워집니다.`;
  } else if (isFriend) {
    return `${nameA}의 성향을 가진 사람은 ${exprA} 방식으로, ${nameB}의 성향을 가진 사람은 ${exprB} 방식으로 감정을 나눕니다. 편안함을 느끼는 지점이 달라 대화 리듬이 어긋나는 순간이 생길 수 있습니다. 서로의 방식이 다를 뿐임을 기억하면 우정이 더 편안해집니다.`;
  }
  const misBase = `${nameA}의 성향을 가진 사람은 ${exprA} 방식으로, ${nameB}의 성향을 가진 사람은 ${exprB} 방식으로 감정을 다룹니다. 같은 상황에서도 반응 방식이 달라 관계 온도 차이로 느껴지는 순간이 생길 수 있습니다. 서로의 방식이 틀린 것이 아니라 다른 것임을 기억하는 것이 중요합니다.`;
  return misBase;
}

function getEmotionExpressionShort(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '감정을 바로 표현하는',
    warm_soft: '부드럽게 배려하며 표현하는',
    warm_grounded: '안정적으로 담아두는',
    cool_clear: '이성적으로 정리하는',
    cool_deep: '내면에 깊이 담아두는',
    nature: '부드럽게 흘려보내는',
    neutral: '정리한 후 표현하는',
  };
  return map[family];
}

function buildRhythmDifference(fA: EnergyFamily, fB: EnergyFamily): string {
  const rhythmSceneMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '한 사람은 결정을 빠르게 내리고 바로 행동하고 싶어 합니다. 다른 사람은 충분히 생각하고 나서야 움직이는 편입니다. "왜 이렇게 오래 걸려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다. 두 사람이 각자의 속도를 인정하면 오히려 더 안정적인 흐름이 만들어집니다.',
    'cool_deep-warm_active': '한 사람은 천천히, 깊이 생각하며 움직입니다. 다른 사람은 빠르게 반응하고 즉각 행동합니다. 이 속도 차이가 때로는 답답함으로 느껴질 수 있지만, 서로의 리듬이 합쳐지면 신중함과 추진력이 균형을 이룹니다.',
    'warm_active-warm_soft': '두 사람 모두 따뜻하게 연결되고 싶은 마음이 있지만, 한 사람은 즉각적으로 표현하고 다른 사람은 부드럽게 천천히 다가갑니다. 속도의 차이가 있지만 방향은 같습니다.',
    'warm_grounded-cool_deep': '두 사람 모두 천천히, 신중하게 관계를 이어가는 편입니다. 안정적이고 깊이 있는 흐름이 두 사람의 공통된 리듬입니다. 다만 변화나 결정이 필요한 순간에 함께 움직이는 데 시간이 걸릴 수 있습니다.',
    'nature-cool_clear': '한 사람은 관계가 흘러가는 대로 두는 리듬을 선호하고, 다른 사람은 명료하고 효율적인 흐름을 좋아합니다. "그냥 되는 대로"와 "계획대로"가 부딪히는 순간이 있습니다.',
  };

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    const sameRhythmMap: Record<EnergyFamily, string> = {
      warm_active: '두 사람 모두 빠르게 반응하고 즉각 행동하는 편입니다. 함께 있으면 에너지가 넘치지만, 둘 다 지쳐있을 때는 서로를 쉬게 해주는 것이 필요합니다.',
      warm_soft: '두 사람 모두 부드럽고 감성적인 리듬으로 관계를 이어갑니다. 서로의 감정을 쉽게 알아채는 편이지만, 때로는 누군가 먼저 현실적인 결정을 내려야 할 때 망설임이 생길 수 있습니다.',
      warm_grounded: '두 사람 모두 안정적이고 일정한 리듬을 선호합니다. 변화보다 익숙함을 좋아하는 편이라 함께 있으면 편안하지만, 새로운 시도에는 함께 용기가 필요합니다.',
      cool_clear: '두 사람 모두 명료하고 효율적인 흐름을 선호합니다. 서로의 방식을 잘 이해하지만, 감정적인 연결보다 일 처리가 앞서는 순간이 생길 수 있습니다.',
      cool_deep: '두 사람 모두 천천히, 깊이 있게 관계를 이어가는 편입니다. 서로의 침묵을 말 없이 받아들이지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다.',
      nature: '두 사람 모두 자연스럽고 유연한 리듬을 가지고 있습니다. 서로를 강요하지 않아 편안하지만, 때로는 누군가 먼저 방향을 잡아줄 필요가 있습니다.',
      neutral: '두 사람 모두 균형 잡힌 리듬으로 관계를 이어갑니다. 서로의 속도를 편안하게 맞춰가는 편입니다.',
    };
    return sameRhythmMap[fA];
  }

  return rhythmSceneMap[key] ?? rhythmSceneMap[reverseKey] ?? `두 사람의 관계 리듬이 서로 다릅니다. 한 사람의 속도가 다른 사람에게 빠르거나 느리게 느껴질 수 있습니다. 서로의 리듬을 강요하지 않고 중간 지점을 찾아가는 것이 두 사람 관계의 편안함을 만들어줍니다.`;
}

function buildMisunderstandingPattern(
  fA: EnergyFamily, fB: EnergyFamily, rel: RelationType,
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>,
  colorsA?: ColorData[],
  colorsB?: ColorData[]
): string {
  // 도형 특성 보완 문장
  const shapeNote = (shapeCtxA && shapeCtxB && shapeCtxA.conflictTrait !== shapeCtxB.conflictTrait)
    ? `\n특히 ${shapeCtxA.conflictTrait}. 그리고 ${shapeCtxB.conflictTrait}. 이 두 가지 특성이 겹칠 때 오해가 깊어질 수 있습니다.`
    : shapeCtxA
      ? `\n특히 ${shapeCtxA.conflictTrait}. 이 점을 먼저 인식하는 것이 오해를 줄이는 시작입니다.`
      : '';
  const patterns: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '한 사람이 감정을 바로 표현할 때, 다른 사람은 그 강도에 압도되어 더 안으로 들어갑니다. 이것이 반복되면 한 사람은 "나를 피하는 것 같다"고 느끼고, 다른 사람은 "왜 지금 연락이 안 돼?"라고 느낍니다. "왜 그래?"대신 "지금 어떤 마음이야?"로 시작하는 것이 이 패턴을 바꾸는 첫 걸음입니다.',
    'cool_deep-warm_active': '한 사람이 마음을 가다듬는 동안 조용히 있을 때, 다른 사람은 그 침묵을 거절로 읽습니다. 이것이 반복되면 한 사람은 "나를 싫어하는 건가?"라고 오해하고, 다른 사람은 "왜 나를 열어주지 않지?"라고 느낍니다. 침묵은 거리두기가 아니라 정리하는 시간임을 서로 알면, 오해가 줄어듭니다.',
    'warm_soft-cool_clear': '한 사람이 감정적으로 표현할 때, 다른 사람은 자동으로 해결책을 내놓습니다. 한 사람은 "내 말을 들어주지 않는다"고 느끼고, 다른 사람은 "내가 도움이 되려고 한 것인데 왜 서운해하지?"라고 당혹스러워합니다. "도와줘"대신 "지금 어떤 마음이야?"로 시작하면 서로의 언어가 서로 가까워질 수 있습니다.',
    'cool_clear-warm_soft': '한 사람이 상황을 논리적으로 정리할 때, 다른 사람은 감정적 공감을 먼저 원합니다. "왜 그렇게 차갑게 말해?"와 "나는 해결하려고 한 것들인데"가 반복되는 패턴이 생깁니다. 이성적인 말을 하기 전에 "네 마음이 힘들겠구나"한 마디가 실제로 큰 차이를 만들어냅니다.',
    'warm_active-nature': '한 사람이 빠르게 반응하고 표현할 때, 다른 사람은 그 속도에 압도되어 안으로 들어갑니다. 한 사람은 "왜 반응이 없지?"라고 느끼고, 다른 사람은 "왜 이렇게 강요하지?"라고 느낍니다. 속도를 맞추려고 하기보다 "네 페이스로 해"라고 먼저 말해주는 것이 이 패턴을 넘는 방법입니다.',
    'nature-warm_active': '한 사람이 자신의 리듬대로 조용히 있을 때, 다른 사람은 그 존재감을 무관심으로 읽습니다. 한 사람은 "나는 함께 있는데"라고 느끼고, 다른 사람은 "왜 말이 없지?"라고 당혹스러워합니다. 조용한 동행이 함께하는 방식임을 서로 알면, 이 패턴에서 벗어날 수 있습니다.',
    'warm_grounded-warm_active': '한 사람이 안정적으로 신중하게 반응할 때, 다른 사람은 즉각적으로 강하게 표현합니다. 한 사람은 "왜 그렇게 흥분해?"라고 느끼고, 다른 사람은 "왜 그렇게 무덤덤해?"라고 당혹스러워합니다. 표현의 강도가 다를 뿐, 두 사람 모두 진심으로 반응하고 있습니다.',
    'cool_deep-cool_clear': '두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다. 한 사람은 언제나 논리적으로 정리하고, 다른 사람은 언제나 더 생각하다가 말합니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.',
  };

  const key = `${fA}-${fB}`;

  // 폴백 문장 — 계열 조합별로 다른 관계 갈등 패턴 표현
  const fallbackPatterns: Partial<Record<string, string>> = {
    'warm_active-warm_soft': '한 사람이 빠르게 표현할 때, 다른 사람은 그 강도에 부담을 느낄 수 있습니다. 한 사람은 "왜 이렇게 조심스러워?"라고 느끼고, 다른 사람은 "왜 이렇게 강하게 반응해?"라고 느낍니다. 표현의 강도를 조금 낮추거나 높이는 것이 두 사람 사이의 온도를 맞추는 방법입니다.',
    'warm_soft-warm_active': '한 사람이 부드럽게 배려할 때, 다른 사람은 그 조심스러움이 거리두기로 느껴질 수 있습니다. 한 사람은 "왜 이렇게 강하게 반응해?"라고 느끼고, 다른 사람은 "왜 이렇게 조심스러워?"라고 느낍니다. 서로의 표현 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.',
    'warm_grounded-cool_clear': '한 사람이 안정을 유지하려 할 때, 다른 사람은 명료한 해결을 원합니다. "왜 결정을 못 해?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 생깁니다. 안정 추구와 명료함 추구, 두 방향이 다를 뿐 모두 관계를 위한 마음입니다.',
    'cool_clear-warm_grounded': '한 사람이 명료하게 정리하려 할 때, 다른 사람은 안정적인 흐름을 원합니다. "왜 이렇게 복잡하게 생각해?"와 "왜 이렇게 단순하게 봐?"가 교차하는 순간이 생깁니다. 두 방식 모두 관계를 안정적으로 유지하려는 마음에서 나옵니다.',
    'warm_soft-nature': '한 사람이 따뜻하게 배려할 때, 다른 사람은 그 관심이 부담스럽게 느껴질 수 있습니다. 관계 온도를 중요하게 여기는 사람과 자신의 공간을 중요하게 여기는 사람이 만날 때, 서로의 필요를 확인하는 것이 중요합니다.',
    'nature-warm_soft': '한 사람이 자신의 공간을 지키려 할 때, 다른 사람은 그 거리감이 서운하게 느껴질 수 있습니다. 자신의 리듬을 지키는 것이 관계를 멀리하는 것이 아님을 서로 알면, 이 패턴에서 벗어날 수 있습니다.',
    'warm_grounded-nature': '두 사람 모두 안정적이고 조용한 방식을 선호합니다. 하지만 변화나 결정이 필요한 순간에 서로 기다리다가 아무것도 진행되지 않는 패턴이 생길 수 있습니다. 누군가 먼저 "이렇게 해보자"고 제안하는 것이 두 사람을 앞으로 나아가게 합니다.',
    'cool_clear-cool_deep': '한 사람이 명료하게 정리하려 할 때, 다른 사람은 더 깊이 생각하다가 말이 늦어집니다. "왜 이렇게 오래 걸려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다. 생각의 깊이와 속도가 다를 뿐, 두 사람 모두 진지하게 관계를 대하고 있습니다.',
  };

  const getMissTrait = (f: EnergyFamily): string => {
    const m: Record<EnergyFamily, string> = {
      warm_active: '감정을 바로 표현하고 빠른 반응을 기대하는',
      warm_soft: '관계 온도를 중요하게 여기고 공감을 먼저 원하는',
      warm_grounded: '안정적으로 신중하게 반응하는',
      cool_clear: '명료하게 정리하고 해결책을 먼저 찾는',
      cool_deep: '마음을 정리하다 침묵으로 있는',
      nature: '자신의 리듬대로 유연하게 반응하는',
      neutral: '균형 잡힌 방식으로 반응하는',
    };
    return m[f];
  };
  const missTraitA = getMissTrait(fA);
  const missTraitB = getMissTrait(fB);
  // ── 유사형 관계 분기 (fA === fB) ──
  if (fA === fB) {
    const sameMissMap: Record<EnergyFamily, string> = {
      warm_active: '두 사람 모두 감정이 생기면 바로 표현하고 빠르게 반응하는 편입니다. 같은 언어를 쓰기 때문에 소통이 빠르지만, 둘 다 흥분하면 감정 강도가 함께 올라가는 순간이 생깁니다. "왜 이렇게 예민하게 반응해?"가 아니라 "지금 우리 둘 다 지쳐있는 것 같아"라고 먼저 말해주는 것이 이 패턴을 넘는 방법입니다.',
      warm_soft: '두 사람 모두 상대방의 감정을 먼저 살피고 배려하는 편입니다. 서로를 잘 이해하지만, 둘 다 자신의 감정을 뒤로 미루다가 어느 순간 "나는 항상 참는 것 같아"라는 말이 나오는 패턴이 생길 수 있습니다. 가끔 "나는 지금 이런 마음이야"라고 먼저 표현하는 것이 두 사람 모두에게 필요합니다.',
      warm_grounded: '두 사람 모두 안정적이고 신중하게 감정을 다루는 편입니다. 함께 있으면 편안하지만, 변화나 새로운 시도가 필요한 순간에 둘 다 망설이다가 아무것도 진행되지 않는 패턴이 생길 수 있습니다. 누군가 먼저 "우리 이렇게 해보자"고 제안하는 것이 관계를 앞으로 나아가게 합니다.',
      cool_clear: '두 사람 모두 명료하고 효율적인 방식으로 소통하는 편입니다. 서로의 방식을 잘 이해하지만, 감정적인 연결보다 결론을 먼저 내리다가 "우리 요즘 대화가 너무 사무적인 것 같아"라는 느낌이 드는 순간이 생길 수 있습니다. 가끔 "오늘 어떤 마음이야?"라고 먼저 물어보는 것이 두 사람 사이를 더 따뜻하게 만들어줍니다.',
      cool_deep: '두 사람 모두 감정을 깊이 담아두고 천천히 꺼내는 편입니다. 서로의 침묵을 이해하지만, 둘 다 기다리다가 연결이 늦어지는 패턴이 반복될 수 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.',
      nature: '두 사람 모두 자연스럽고 유연한 리듬으로 관계를 이어가는 편입니다. 서로를 강요하지 않아 편안하지만, 둘 다 방향을 기다리다가 관계가 정체되는 순간이 생길 수 있습니다. 가끔 "우리 이렇게 해보자"고 먼저 제안하는 것이 관계를 앞으로 나아가게 합니다.',
      neutral: '두 사람 모두 균형 잡힌 방식으로 감정을 다루는 편입니다. 서로의 속도를 편안하게 맞춰가지만, 때로는 누군가 먼저 감정을 꺼내는 것이 필요합니다. 지금의 균형을 유지하면서 조금씩 더 깊이 연결되어 가는 것이 두 사람에게 맞는 방향입니다.',
    };
    return sameMissMap[fA] + shapeNote;
  }
  // 컬러 ID 기반 생활 긴장 구조 문장
  const colorIdA0 = colorsA?.[0]?.id ?? '';
  const colorIdB0 = colorsB?.[0]?.id ?? '';
  const missColorKey = `${colorIdA0}-${colorIdB0}`;
  const missColorKeyRev = `${colorIdB0}-${colorIdA0}`;
  const colorIdMissPatterns: Partial<Record<string, string>> = {
    // 화이트 — 집안 정리·생활 루틴·감정 정리 후 표현
    'white-pink': '갈등이 생기면 한 사람은 조용히 집을 정리하거나 혼자 있으려 합니다. 다른 사람은 그 침묵이 "나를 거부하는 것"처럼 느껴집니다. "왜 말을 안 해?"라고 물으면, 한 사람은 "지금 정리 중이야"라고 합니다. 이 패턴이 반복됩니다. 감정 정리 후 표현하는 방식이 회복임을 서로 이해하면 오해가 줄어듭니다.',
    'white-red': '한 사람은 집이 정돈되어 있어야 마음이 편안합니다. 다른 사람은 집안 상태보다 지금 당장 함께 뭔가 하고 싶습니다. "왜 이렇게 어질러?"와 "왜 이렇게 예민해?"가 반복됩니다. 생활 기준 차이가 작은 갈등으로 쌓입니다.',
    'white-magenta': '한 사람이 감정이 복잡해지면 공간을 두고 혼자 정리하려 합니다. 다른 사람은 그 거리감이 "나를 밀어내는 것"으로 느껴집니다. "지금 혼자 있어야 해"와 "왜 나를 밀어내?"가 교차합니다. 거리두기가 관계를 끊으려는 것이 아님을 확인하는 것이 중요합니다.',
    'white-navy': '두 사람 모두 "괜찮아"라고 말하며 혼자 버팁니다. 서로의 마음을 모르는 상태가 지속됩니다. 집안 분위기가 조용하고 안정적이지만, 어느 순간 "우리 요즘 왜 이렇게 어색해?"라는 말이 나옵니다. 작은 표현 하나가 두 사람 사이의 거리를 좁혀줍니다.',
    // 블랙 — 혼자 회복·간섭 부담·조용해도 관계가 식은 건 아님
    'black-pink': '한 사람은 혼자 있는 시간이 필요합니다. 다른 사람은 그 시간이 "나한테 관심이 없는 것"처럼 느껴집니다. "왜 나한테만 차가워?"라고 물으면, 한 사람은 "나는 원래 이래"라고 합니다. 조용한 것이 관계가 식은 것이 아님을 서로 확인하는 것이 필요합니다.',
    'black-red': '한 사람은 자기 방식이 있고 간섭받는 것이 불편합니다. 다른 사람은 바로 반응하고 즉각적인 연결을 원합니다. "내 방식대로 해야 해"와 "왜 이렇게 고집이 세?"가 충돌합니다. 주도권 갈등이 반복되는 패턴입니다.',
    'black-magenta': '한 사람은 감정이 복잡해지면 혼자 있으려 합니다. 다른 사람은 그 거리감이 거절처럼 느껴집니다. 한 사람이 공간을 원할수록 다른 사람은 더 가까이 다가갑니다. 그러면 한 사람은 더 물러섭니다. 이 패턴이 반복됩니다.',
    // 네이비 — 책임감·행동으로 표현·말보다 행동
    'navy-pink': '한 사람은 말 없이 밥을 차려주고, 먼저 일을 처리하고, 행동으로 마음을 전합니다. 다른 사람은 "그래도 말로 해줘"라고 원합니다. "이미 다 하고 있잖아"와 "그래도 말로 해줘"가 반복됩니다. 행동과 말, 두 가지 언어를 번역해주는 것이 필요합니다.',
    'navy-red': '한 사람은 신중하게 생각한 후 말합니다. 다른 사람은 감정이 생기면 바로 꺼냅니다. 한 사람의 신중함이 다른 사람에게 답답함으로, 다른 사람의 빠른 반응이 한 사람에게 충동적으로 느껴집니다. 표현 속도 차이가 반복적인 긴장을 만듭니다.',
    'navy-magenta': '한 사람은 "괜찮아"라고 말하며 혼자 버팁니다. 다른 사람은 "정말 괜찮아? 나한테 말해줘"라고 원합니다. 한 사람의 침묵이 다른 사람에게 거리두기로 읽히고, 다른 사람의 감정 표현이 한 사람에게 부담이 됩니다.',
    'blue-pink': '한 사람이 충분히 생각한 후에야 표현할 때, 다른 사람은 지금 당장 따뜻한 반응을 원합니다. "왜 이렇게 반응이 없어?"와 "나는 생각 중이야"가 교차합니다. 표현 타이밍의 차이가 서운함으로 이어지는 패턴입니다.',
    // 레드 — 즉각 반응·스킨십·답답한 분위기 힘듦
    'red-green': '한 사람은 감정이 생기면 바로 표현합니다. 다른 사람은 갈등을 피하며 조용히 넘기려 합니다. 한 사람의 직선적인 표현이 다른 사람에게 공격적으로 느껴지고, 다른 사람의 회피가 한 사람에게 "나한테 관심 없어?"로 느껴집니다.',
    'red-violet': '한 사람은 지금 당장 반응을 원합니다. 다른 사람은 충분히 생각한 후에야 말합니다. "왜 반응이 없어?"와 "왜 이렇게 빨리 결론 내려?"가 반복됩니다. 속도 차이가 이 관계의 반복적인 긴장입니다.',
    // 핑크/마젠타 — 애정 확인·감정 공유·연결감
    'pink-green': '한 사람은 "나 사랑해?"라고 자주 확인하고 싶습니다. 다른 사람은 그 기대가 부담스럽습니다. "왜 항상 확인해?"와 "왜 표현을 안 해?"가 반복됩니다. 관계 온도 차이가 반복적인 서운함을 만듭니다.',
    'magenta-green': '한 사람은 감정에 깊이 몰입하여 강하게 표현합니다. 다른 사람은 갈등을 피하며 조용히 넘기려 합니다. 한 사람의 강한 감정이 다른 사람에게 부담이 되고, 다른 사람의 회피가 한 사람에게 거절로 느껴집니다.',
    // 퍼플/바이올렛 — 감정 공감·분위기·깊은 대화
    'violet-yellow': '한 사람은 "우리 관계에 대해 깊이 얘기하고 싶어"라고 원합니다. 다른 사람은 "그냥 오늘 뭐 먹을지 얘기하면 안 돼?"라고 합니다. "왜 이렇게 깊이 생각해?"와 "왜 이렇게 가볍게 봐?"가 반복됩니다.',
    'violet-red': '한 사람은 충분히 생각한 후에야 반응합니다. 다른 사람은 지금 당장 반응을 원합니다. 한 사람의 느린 반응이 다른 사람에게 무관심으로, 다른 사람의 빠른 속도가 한 사람에게 압박으로 느껴집니다.',
    // 그린 — 편안한 일상·자연스럽게 챙김·안정감
    'green-navy': '두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 갈등을 피하며 조용히 배려하고, 다른 사람은 혼자 책임을 지며 버팁니다. 서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다.',
    // 옐로우 — 현실적 대화·생활 패턴·책임감·미래 계획
    'yellow-navy': '한 사람은 "앞으로 어떻게 할 거야?"라고 현실적인 계획을 원합니다. 다른 사람은 "지금 당장 결정 안 해도 되잖아"라고 합니다. 미래 계획에 대한 온도 차이가 반복적인 긴장을 만듭니다.',
    // 추가 조합
    'white-violet': '한 사람은 감정이 정리된 후 말합니다. 다른 사람은 지금 당장 감정을 나누고 싶어 합니다. "지금 말하기 싫어?"와 "나는 아직 정리 중이야"가 교차합니다. 정리 시간이 거부가 아님을 확인하는 것이 중요합니다.',
    'white-green': '두 사람 모두 갈등을 피하는 편입니다. 한 사람은 청결과 루틴이 깨지면 예민해지고, 다른 사람은 그 예민함이 부담스럽습니다. "왜 이렇게 예민해?"와 "왜 이렇게 무신경해?"가 조용히 쌓입니다.',
    'black-violet': '"지금 혼자 있어야 해"와 "나랑 얘기하기 싫어?"가 반복됩니다. 한 사람의 회복 공간이 다른 사람에게 단절로 읽힙니다. 조용한 것이 관계가 식은 것이 아님을 서로 확인하는 것이 필요합니다.',
    'black-navy': '두 사람 모두 "괜찮아"라고 말하며 혼자 버팁니다. 서로의 마음을 모르는 상태가 지속됩니다. 어느 순간 "우리 요즘 왜 이렇게 어색해?"라는 말이 나옵니다.',
    'red-yellow': '"지금 당장 반응해줘"와 "지금 그게 중요해?"가 교차합니다. 한 사람은 즉각 반응을 원하고, 다른 사람은 현실 상황 정리가 먼저입니다. 감정 우선과 현실 우선의 충돌입니다.',
    'pink-violet': '두 사람 모두 감정 표현을 중요하게 여기지만 방식이 다릅니다. 한 사람은 말과 스킨십으로, 다른 사람은 깊은 대화와 분위기로 연결됩니다. "왜 이렇게 표면적이야?"와 "왜 이렇게 무거워?"가 교차합니다.',
    'pink-yellow': '"말로도 해줘"와 "이미 다 하고 있잖아"가 반복됩니다. 사랑의 언어가 달라서 생기는 오해입니다. 행동이 표현이라는 것을 한 사람이 알면 관계가 편안해집니다.',
    'navy-violet': '"이미 다 하고 있잖아"와 "그래도 감정 얘기가 하고 싶어"가 교차합니다. 행동으로 보여주는 것과 말로 나누는 것, 두 사람의 사랑 언어가 다릅니다.',
    'navy-yellow': '두 사람 모두 감정 표현이 적습니다. "우리 요즘 감정 얘기를 안 하는 것 같아"라는 말이 나올 수 있습니다. 현실 대화 속에서도 "오늘 고마웠어" 한 마디가 관계를 따뜻하게 유지해줍니다.',
    // 레드·블루·블랙 조합 — 신뢰 + 기준 + 정리/질서 민감도
    'red-blue': '한 사람은 감정이 생기면 바로 표현하고, 다른 사람은 충분히 생각한 후에야 말합니다. 한 사람의 빠른 반응이 다른 사람에게 충동적으로, 다른 사람의 침묵이 한 사람에게 무관심으로 느껴집니다. 신뢰와 기준을 중요하게 여기는 사람과 즉각적인 연결을 원하는 사람이 서로의 속도를 인정하는 것이 오해를 줄입니다.',
    'red-black': '한 사람은 감정이 생기면 바로 꺼내고 즉각 반응을 원합니다. 다른 사람은 자기 방식이 있고 간섭받는 것이 불편합니다. "내 방식대로 해"와 "왜 이렇게 강요해?"가 반복됩니다. 주도권 충돌이 반복적인 긴장 포인트입니다. 서로의 방식을 먼저 인정하고, 작은 양보를 번갈아 하는 것이 두 사람 사이의 긴장을 줄여줍니다.',
    'blue-black': '두 사람 모두 감정을 쉽게 드러내지 않아 서로의 마음을 읽기 어렵습니다. 한 사람은 신뢰와 신중함으로 관계를 이어가고, 다른 사람은 경계를 지키며 자신을 보호합니다. 집안 정리 기준이나 생활 루틴에 대한 기대가 다를 때 조용히 긴장이 쌓입니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.',
    // 핑크·인디고·옐로우 조합 — 인정 욕구 + 현실 안정 + 책임감
    'pink-indigo': '한 사람은 따뜻한 말과 표현으로 연결감을 확인하고 싶어 합니다. 다른 사람은 충분히 생각한 후에야 말하는 편입니다. "왜 반응이 없어?"와 "나는 생각 중이야"가 반복됩니다. 인정 욕구와 신중함이 균형을 이룰 때 두 사람의 관계는 가장 편안해집니다.',
    'indigo-yellow': '한 사람은 내면 정리 후 말하고, 다른 사람은 현실 계획과 책임감으로 관계를 이어갑니다. 두 사람 모두 현실 안정을 중요하게 여기지만, 감정 표현이 줄어드는 패턴이 생길 수 있습니다. 가끔 "오늘 어땠어?"라고 먼저 묻는 것이 두 사람 사이를 따뜻하게 유지해줍니다.',
    'orange-purple': '한 사람은 감정이 생기면 바로 표현하고 즉각 반응을 원합니다. 다른 사람은 충분히 생각한 후에야 말하는 편입니다. "왜 반응이 없어?"와 "왜 이렇게 빨리 결론 내려?"가 반복됩니다. 속도 차이가 이 관계의 반복적인 긴장입니다.',
    'orange-indigo': '한 사람은 활기찬 에너지로 바로 표현하고, 다른 사람은 신중하게 생각한 후 말합니다. 한 사람의 빠른 속도가 다른 사람에게 부담이 되고, 다른 사람의 느린 반응이 한 사람에게 답답함으로 느껴집니다. 속도 차이를 인정하는 것이 이 관계의 핵심입니다.',
    'lavender-indigo': '두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 섬세하게 분위기를 읽고, 다른 사람은 깊이 생각한 후 말합니다. 서로 표현이 부족해 거리감이 쌓일 수 있지만, 각자의 방식으로 관계를 소중히 여기고 있습니다.',
  };
  const colorIdMissResult = colorIdMissPatterns[missColorKey] ?? colorIdMissPatterns[missColorKeyRev];
  return colorIdMissResult ?? patterns[key] ?? fallbackPatterns[key] ?? fallbackPatterns[`${fB}-${fA}`] ?? `${missTraitA} 사람과 ${missTraitB} 사람이 만날 때, 서로의 반응 방식이 다르게 읽히는 순간이 반복될 수 있습니다. 서로의 의도를 직접 물어보는 것이 관계 거리감을 줄이는 가장 좋은 방법입니다.`;
}

function buildCoupleRecoveryDirection(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const relLabel = rel === '연인' || rel === '부부' ? '두 분' : '두 사람';

  // 관계 유형별 회복 방향 맥락 추가
  const relContext: Partial<Record<RelationType, string>> = {
    '부부': '오랜 관계일수록 회복은 새로운 시작이 아니라, 서로를 다시 바라보는 것에서 시작됩니다.',
    '부모-자녀': '세대가 다른 두 사람의 회복은 서로의 방식을 강요하지 않는 것에서 시작됩니다.',
    '형제자매': '가장 가까운 사이의 회복은 작은 인정 한 마디에서 시작될 수 있습니다.',
    '동료': '함께 일하는 관계의 회복은 업무 밖에서 잠깐 편안하게 연결되는 시간에서 시작됩니다.',
    '친구': '좋은 우정의 회복은 서로의 다름을 다시 이해하는 것에서 시작됩니다.',
  };
  const context = relContext[rel] ?? '';

  if (fA === fB) {
    return `${relLabel}은 비슷한 회복 방식을 가지고 있습니다. 함께 조용히 쉬거나, 같은 공간에서 각자의 시간을 갖는 것이 자연스러운 회복이 됩니다.${context ? ' ' + context : ''}`;
  }

  const recoveryA = getRecoveryStyle(fA);
  const recoveryB = getRecoveryStyle(fB);

  return `한 사람은 ${recoveryA} 방식으로 회복되고, 다른 사람은 ${recoveryB} 방식으로 회복됩니다. ${relLabel}의 회복 방향은 서로의 방식을 강요하지 않고, 각자가 필요한 방식으로 쉴 수 있도록 공간을 주는 것입니다.${context ? ' ' + context : ' 그 공간 안에서 다시 가까워질 수 있습니다.'}`;
}

function getRecoveryStyle(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '함께 움직이고 즉각 표현하며',
    warm_soft: '따뜻한 말과 스킨십으로 연결되며',
    warm_grounded: '일상의 안정된 루틴 속에서',
    cool_clear: '혼자 생각을 정리하고 명료화하며',
    cool_deep: '조용히 혼자 내면을 정리하며',
    nature: '자연스러운 흐름 속에서 천천히',
    neutral: '공간을 정리하고 감정을 비워내며',
  };
  return map[family];
}

// 컬러 ID 기반 회복 방식 세분화
function getRecoveryStyleById(colorId: string): string {
  const map: Record<string, string> = {
    white: '혼자 공간을 정리하고 조용히 감정을 비워내며',
    black: '개인 공간을 지키고 간섭 없이 쉬며',
    navy: '조용히 혼자 있는 시간을 가지며',
    blue: '압박 없는 대화와 혼자 생각 정리로',
    indigo: '혼자 깊이 생각하고 성찰하며',
    violet: '깊은 대화와 감정 의미 공유로',
    lavender: '조용한 공감과 음악·감성 속에서',
    red: '함께 움직이고 드라이브·산책으로',
    orange: '사람들과 연결되고 함께 웃으며',
    coral: '따뜻한 배려와 자기 돌봄으로',
    magenta: '진심 어린 대화와 감정 공감으로',
    pink: '따뜻한 말과 안아주기·애정 표현으로',
    peach: '부드러운 배려와 포근한 연결로',
    yellow: '가벼운 웃음과 현실 부담 나누기로',
    gold: '자기 가치 인정과 품위 있는 쉼으로',
    green: '차분한 대화와 중간지점 찾기로',
    sage: '조용한 자연 속에서 천천히',
    mint: '몸과 마음을 충분히 이완하며',
    olive: '익숙한 일상의 안정 속에서',
    teal: '감정을 정화하고 균형을 되찾으며',
    skyblue: '자유롭고 가벼운 활동으로',
    beige: '포근하고 부드러운 일상 속에서',
    cream: '고요하고 단순한 공간에서',
    brown: '익숙한 루틴과 안정된 환경 속에서',
    terracotta: '현실적인 안정과 따뜻한 연결로',
    silver: '명료하게 정리하고 감정을 추스르며',
  };
  return map[colorId] ?? '자신의 방식대로 천천히';
}

function buildIntimacyStyle(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const isCouple = rel === '연인' || rel === '부부';
  const styleA = getIntimacyStyleShort(fA, isCouple);
  const styleB = getIntimacyStyleShort(fB, isCouple);

  // 연결 방식 차이를 구체적인 장면으로 표현
  const connectionSceneMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': isCouple
      ? '한 사람은 함께 무언가를 하고 표현을 나눌 때 가장 연결된 느낌을 받습니다. 다른 사람은 깊은 대화 한 번이 수십 번의 가벼운 표현보다 더 크게 닿습니다. 두 사람이 서로의 연결 방식을 알고 있다면, 각자의 방식으로 먼저 다가가는 것이 가장 좋은 시작입니다.'
      : '한 사람은 함께 활동하며 연결감을 느끼고, 다른 사람은 깊은 대화를 통해 연결됩니다. 서로의 연결 방식이 다르지만, 그 차이를 알면 더 편안하게 가까워질 수 있습니다.',
    'warm_soft-cool_clear': isCouple
      ? '한 사람은 따뜻한 말 한 마디와 스킨십에서 연결감을 느낍니다. 다른 사람은 약속을 지키고 신뢰를 쌓는 것이 사랑의 언어입니다. "왜 말로 표현 안 해?"와 "내가 이렇게 행동으로 보여주고 있잖아"가 교차하는 순간이 있습니다.'
      : '한 사람은 따뜻한 감정 표현으로, 다른 사람은 신뢰와 일관성으로 연결됩니다. 서로의 연결 언어를 이해하면 오해가 줄어듭니다.',
    'cool_deep-warm_soft': isCouple
      ? '한 사람은 진심 어린 깊은 대화에서 연결감을 느낍니다. 다른 사람은 따뜻한 말과 스킨십이 먼저입니다. 깊이 있는 연결을 원하는 사람과 따뜻한 온기를 원하는 사람이 만나면, 서로의 방식으로 먼저 다가가는 것이 가장 좋은 선물이 됩니다.'
      : '한 사람은 깊은 대화로, 다른 사람은 따뜻한 감정 표현으로 연결됩니다.',
    'nature-warm_active': isCouple
      ? '한 사람은 말 없이 조용히 함께 있는 것만으로도 충분히 연결된 느낌을 받습니다. 다른 사람은 함께 무언가를 하고 표현을 나눌 때 살아있는 느낌이 납니다. "그냥 옆에 있어줘"와 "뭔가 같이 하자"가 교차하는 순간이 있습니다.'
      : '한 사람은 조용한 동행으로, 다른 사람은 함께하는 활동으로 연결됩니다.',
  };

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    return `두 사람 모두 ${styleA} 방식으로 연결감을 느낍니다. 같은 언어로 연결되기 때문에 서로의 필요를 먼저 알아채는 편입니다. 다만 같은 방식이 오래 반복되면 새로운 연결 시도가 줄어들 수 있으니, 가끔 다른 방식으로 다가가는 것도 관계에 활기를 줍니다.`;
  }

  return connectionSceneMap[key] ?? connectionSceneMap[reverseKey] ?? `한 사람은 ${styleA} 방식으로 연결감을 느끼고, 다른 사람은 ${styleB} 방식으로 연결감을 느낍니다. 상대방이 어떤 방식으로 마음이 열리는지 알고 그 방식으로 먼저 다가가는 것이, 두 사람 사이의 거리를 좁히는 가장 빠른 길입니다.`;
}

function getIntimacyStyleShort(family: EnergyFamily, isCouple: boolean = false): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: isCouple ? '함께 활동하고 표현을 나누는' : '함께 활동하며 공감을 나누는',
    warm_soft: isCouple ? '따뜻한 말과 스킨십으로' : '따뜻한 말과 배려로 마음을 전하는',
    warm_grounded: '안정적인 일상을 함께하는',
    cool_clear: '신뢰와 약속을 지키는',
    cool_deep: '깊은 대화와 이해를 나누는',
    nature: '조용히 함께 있는',
    neutral: '편안하고 부담 없이 함께하는',
  };
  return map[family];
}

function buildAffectionStyle(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const isCouple = rel === '연인' || rel === '부부';
  const styleA = getAffectionStyleShort(fA, isCouple);
  const styleB = getAffectionStyleShort(fB, isCouple);

  if (!isCouple) {
    // 연인/부부가 아닌 경우 — 짧고 간결하게
    if (fA === fB) {
      return `두 사람 모두 ${styleA} 방식으로 마음을 전달하는 편입니다. 같은 방식으로 표현하기 때문에 서로의 진심이 자연스럽게 닿습니다.`;
    }
    return `한 사람은 ${styleA} 방식으로 마음을 전달하고, 다른 사람은 ${styleB} 방식으로 표현합니다. 표현 방식이 달라도 두 사람 모두 진심으로 관계를 소중히 여기고 있습니다.`;
  }

  // 연인/부부 — 구체적인 사랑의 언어 장면
  const loveLanguageMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '한 사람은 "사랑해", "보고 싶어"를 자주 말하고 표현하는 것이 자연스럽습니다. 다른 사람은 말보다 행동으로, 오래 기억하고 깊이 생각하는 방식으로 마음을 전합니다. 표현의 빈도가 다를 뿐, 두 사람 모두 진심입니다.',
    'cool_deep-warm_active': '한 사람은 말보다 행동으로, 깊이 기억하고 오래 생각하는 방식으로 마음을 전합니다. 다른 사람은 자주 표현하고 즉각적으로 감정을 나누는 것이 자연스럽습니다. 표현의 방식이 다를 뿐, 두 사람 모두 진심입니다.',
    'warm_soft-cool_clear': '한 사람은 따뜻한 말과 스킨십으로 사랑을 전합니다. 다른 사람은 약속을 지키고, 필요한 것을 먼저 챙기는 것이 사랑의 언어입니다. "말로 해줘"와 "내가 이렇게 하고 있잖아"가 교차하는 순간, 서로의 언어를 번역해주는 것이 필요합니다.',
    'cool_clear-warm_soft': '한 사람은 신뢰와 일관성으로 사랑을 표현합니다. 다른 사람은 따뜻한 말과 스킨십이 먼저입니다. 행동으로 보여주는 사랑과 말로 전하는 사랑, 두 가지 모두 진심입니다.',
    'warm_grounded-warm_soft': '두 사람 모두 따뜻하고 안정적인 방식으로 사랑을 전합니다. 한 사람은 꾸준한 행동으로, 다른 사람은 감성적인 말과 표현으로 마음을 전합니다. 서로의 방식이 자연스럽게 어우러지는 관계입니다.',
  };

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    return `두 사람 모두 ${styleA} 방식으로 사랑을 표현합니다. 같은 언어로 마음을 전하기 때문에 서로의 진심이 자연스럽게 닿는 편입니다. 다만 같은 방식이 익숙해지면 표현이 줄어들 수 있으니, 가끔 새로운 방식으로 마음을 전해보는 것도 좋습니다.`;
  }

  return loveLanguageMap[key] ?? loveLanguageMap[reverseKey] ?? `한 사람은 ${styleA} 방식으로 사랑을 전하고, 다른 사람은 ${styleB} 방식으로 마음을 표현합니다. 서로의 사랑 언어가 다를 때, 상대방의 방식으로 한 번 표현해보는 것이 두 사람 사이를 더 가깝게 만들어줍니다.`;
}

function getAffectionStyleShort(family: EnergyFamily, isCouple: boolean): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: isCouple ? '직접적인 말과 스킨십으로' : '직접적이고 활기차게',
    warm_soft: isCouple ? '부드러운 말과 따뜻한 스킨십으로' : '따뜻한 표현과 배려로 마음을 전하는',
    warm_grounded: isCouple ? '안정적인 행동과 함께하는 시간으로' : '꾸준한 행동으로',
    cool_clear: isCouple ? '신뢰와 약속을 지키는 것으로' : '신뢰와 일관성으로',
    cool_deep: isCouple ? '깊은 대화와 진심 어린 표현으로' : '진심 어린 말로',
    nature: isCouple ? '조용히 함께 있는 것으로' : '편안한 존재감으로',
    neutral: isCouple ? '정리된 말과 편안한 분위기로' : '균형 잡힌 방식으로',
  };
  return map[family];
}

// ── 새 통합 빌더 함수 ──────────────────────────────────────────────

/**
 * 서로 다른 표현 방식 — 감정 차이 + 리듬 차이를 하나의 단락으로 통합
 * 핵심 2~3줄 + 강조 1줄 구조
 */
function buildExpressionDifference(
  fA: EnergyFamily, fB: EnergyFamily,
  familiesA: EnergyFamily[], familiesB: EnergyFamily[],
  colorsA: ColorData[], colorsB: ColorData[]
): string {
  // colorId 기반 세분화 맵 — 컬러 고유 표현 방식 차이
  const colorIdExprMap: Partial<Record<string, string>> = {
    'white-pink': `한 사람은 감정이 과부하가 되면 혼자 정리하는 시간이 필요합니다. 다른 사람은 그 순간 더 많은 표현과 확인을 원합니다. 한 사람에게 거리두기는 정화의 시간이지만, 다른 사람에게는 거절처럼 느껴집니다. "지금 혼자 있어야 해"와 "왜 나를 피해?"가 교차하는 패턴입니다.`,
    'white-red': `한 사람은 감정을 정리한 후 담백하게 표현하고, 다른 사람은 감정이 생기면 바로 꺼냅니다. 한 사람의 침묵이 다른 사람에게 냉담함으로 느껴지고, 다른 사람의 즉각 반응이 한 사람에게 부담이 됩니다.`,
    'white-black': `두 사람 모두 감정을 쉽게 꺼내지 않습니다. 한 사람은 정리될 때까지 기다리고, 다른 사람은 경계를 세우며 기다립니다. 서로 기다리다 연결이 늦어지는 패턴이 반복됩니다.`,
    'white-navy': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 정리 후 표현하고, 다른 사람은 행동으로 보여줍니다. 말로 확인하는 순간이 적어 서로 "괜찮아?"를 묻지 않고 지나치는 패턴이 생깁니다.`,
    'black-red': `한 사람은 혼자 회복할 시간이 필요합니다. 말이 많아지면 피로해집니다. 다른 사람은 바로 표현하고 즉각 반응을 원합니다. 답답한 분위기가 힘듭니다.\n한 사람의 침묵이 다른 사람에게 벽처럼 느껴지고, 다른 사람의 빠른 반응이 한 사람에게 침범으로 느껴집니다.`,
    'black-pink': `한 사람은 조용해도 관계가 식은 것이 아닙니다. 혼자 있는 시간이 충전입니다. 다른 사람은 따뜻한 표현과 확인을 자주 원합니다.\n"나는 이미 여기 있잖아"와 "왜 말을 안 해줘?"가 반복됩니다. 조용한 것이 무관심이 아님을 서로 확인하는 것이 필요합니다.`,
    'navy-pink': `한 사람은 책임감 있는 행동과 꾸준함으로 마음을 보여줍니다. 밥을 차려주고, 먼저 일을 처리하고, 말 없이 곁에 있습니다. 다른 사람은 스킨십과 말로 사랑을 확인하고 싶어 합니다.\n"이미 다 하고 있잖아"와 "그래도 말로 해줘"가 교차하는 패턴입니다.`,
    'navy-red': `한 사람은 신중하게 생각한 후 표현합니다. 충분히 정리된 후에야 말합니다. 다른 사람은 감정이 생기면 바로 꺼냅니다. 지금 당장 반응이 없으면 답답합니다.\n한 사람의 신중함이 다른 사람에게 답답함으로, 다른 사람의 빠른 반응이 한 사람에게 충동적으로 느껴집니다.`,
    'navy-magenta': `한 사람은 "괜찮아"라고 말하며 혼자 버팁니다. 감정을 드러내는 것이 불편합니다. 다른 사람은 감정을 깊이 나누고 싶어 합니다. 공감받지 못하면 외로워집니다.\n한 사람의 침묵이 다른 사람에게 거리두기로 읽히고, 다른 사람의 강한 감정이 한 사람에게 부담이 됩니다.`,
    'red-green': `한 사람은 감정이 생기면 바로 표현합니다. 스킨십과 활동형 연결을 원합니다. 답답한 분위기가 힘듭니다. 다른 사람은 편안한 일상이 중요합니다. 갈등을 피하며 조용히 배려합니다.\n한 사람의 직선적인 표현이 다른 사람에게 공격적으로 느껴지고, 다른 사람의 회피가 한 사람에게 무관심으로 느껴집니다.`,
    'red-violet': `한 사람은 지금 당장 반응을 원합니다. 즉각적인 표현과 스킨십으로 연결감을 확인합니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다.\n속도 차이가 반복되면 한 사람은 "왜 반응이 없어?"라고 느끼고, 다른 사람은 "왜 이렇게 빨리 결론 내려?"라고 느낍니다.`,
    'pink-green': `한 사람은 애정 표현을 자주 원합니다. "사랑해"라는 말, 스킨십, 따뜻한 확인이 필요합니다. 다른 사람은 편안한 일상 속에서 자연스럽게 챙기는 것이 사랑입니다.\n한 사람의 표현 기대가 다른 사람에게 부담이 되고, 다른 사람의 조용한 배려가 한 사람에게 무관심으로 느껴집니다.`,
    'magenta-green': `한 사람은 감정에 깊이 몰입합니다. 관계에서 진심 어린 연결을 원하고, 상처도 깊게 받습니다. 다른 사람은 안정감 있는 관계를 선호합니다. 갈등보다 편안한 일상이 중요합니다.\n한 사람의 강한 감정이 다른 사람에게 부담이 되고, 다른 사람의 회피가 한 사람에게 거절로 느껴집니다.`,
    'violet-yellow': `한 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다. 다른 사람은 현실적인 대화와 생활 패턴이 중요합니다. 책임감과 미래 계획을 중요하게 여깁니다.\n"왜 이렇게 깊이 생각해?"와 "왜 이렇게 가볍게 봐?"가 반복됩니다.`,
    'green-navy': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 편안한 일상 속에서 자연스럽게 챙기고, 다른 사람은 책임감 있는 행동으로 관계를 지킵니다.\n서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다. 가끔 말로 확인하는 시간이 필요합니다.`,
    'white-violet': `한 사람은 감정을 정리한 후 담백하게 표현합니다. 공간이 깨끗하고 조용해야 마음이 편안합니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다.\n한 사람의 침묵이 다른 사람에게 거리감으로 느껴지고, 다른 사람의 깊은 감정 표현이 한 사람에게 부담이 됩니다. 정리된 공간에서 조용히 차 한 잔 마시며 대화하는 것이 두 사람에게 맞는 연결 방식입니다.`,
    'white-green': `두 사람 모두 조용하고 안정적인 관계를 선호합니다. 한 사람은 생활 루틴과 청결이 중요하고, 다른 사람은 편안한 일상과 자연스러운 배려가 중요합니다.\n서로 갈등을 피하는 편이라 "괜찮아"라고 말하면서 실제로는 각자 쌓아두는 패턴이 생깁니다. 가끔 "오늘 어때?"라고 먼저 묻는 것이 두 사람 사이를 따뜻하게 유지해줍니다.`,
    'black-violet': `한 사람은 혼자 회복하는 시간이 필요합니다. 말이 많아지면 피로해집니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 연결감이 없으면 외로워집니다.\n한 사람의 침묵이 다른 사람에게 단절로 느껴지고, 다른 사람의 깊은 감정 표현이 한 사람에게 부담이 됩니다. "지금 혼자 있어야 해"와 "나랑 얘기하기 싫어?"가 반복됩니다.`,
    'black-navy': `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 혼자 회복하고, 다른 사람은 혼자 책임을 지며 버팁니다.\n서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다. 두 사람 모두 표현이 서툴러 거리감이 조용히 쌓입니다. 먼저 "요즘 어때?"라고 묻는 것이 이 관계를 따뜻하게 유지합니다.`,
    'red-yellow': `한 사람은 감정이 생기면 바로 표현합니다. 즉각적인 반응과 스킨십이 중요합니다. 다른 사람은 현실적인 대화와 미래 계획을 중요하게 여깁니다. 감정보다 상황 정리가 먼저입니다.\n"지금 당장 반응해줘"와 "지금 그게 중요해?"가 교차합니다. 한 사람의 즉각적인 감정 표현이 다른 사람에게 충동적으로 느껴지는 순간이 있습니다.`,
    'pink-violet': `두 사람 모두 감정 표현과 연결감을 중요하게 여깁니다. 한 사람은 따뜻한 스킨십과 말로 사랑을 확인하고, 다른 사람은 깊은 감정 공감과 분위기 있는 대화를 원합니다.\n표현 방식은 다르지만 두 사람 모두 관계에 깊이 투자합니다. 가끔 "나는 이렇게 표현하는데 왜 충분하지 않아?"라는 서운함이 생길 수 있습니다.`,
    'pink-yellow': `한 사람은 따뜻한 표현과 스킨십으로 사랑을 확인하고 싶어 합니다. 다른 사람은 현실적인 책임과 꾸준한 행동으로 마음을 보여줍니다.\n"말로도 해줘"와 "이미 다 하고 있잖아"가 반복됩니다. 사랑의 언어가 달라서 생기는 오해입니다. 한 사람의 표현 욕구와 다른 사람의 행동 언어를 서로 알면 관계가 편안해집니다.`,
    'navy-violet': `한 사람은 책임감 있는 행동과 꾸준함으로 관계를 지킵니다. 말보다 행동이 먼저입니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다.\n"이미 다 하고 있잖아"와 "그래도 감정 얘기가 하고 싶어"가 교차합니다. 행동 언어와 감성 언어가 달라서 생기는 오해입니다.`,
    'navy-yellow': `두 사람 모두 현실적이고 책임감 있는 방식으로 관계를 이어갑니다. 한 사람은 신뢰와 꾸준함으로, 다른 사람은 현실 계획과 생활 패턴으로 관계를 지킵니다.\n두 사람 모두 감정 표현이 적어 "우리 요즘 감정 얘기를 안 하는 것 같아"라는 말이 나올 수 있습니다. 현실 대화 속에서도 "오늘 고마웠어" 한 마디가 관계를 따뜻하게 유지해줍니다.`,
  };
  const colorA0 = colorsA[0]?.id ?? '';
  const colorB0 = colorsB[0]?.id ?? '';
  const colorExprResult = colorIdExprMap[`${colorA0}-${colorB0}`] ?? colorIdExprMap[`${colorB0}-${colorA0}`];
  if (colorExprResult) return colorExprResult;
  const nameA = colorsA[0]?.korName ?? 'A';
  const nameB = colorsB[0]?.korName ?? 'B';

  const map: Partial<Record<string, string>> = {
    'warm_active-cool_deep': `${nameA}의 성향을 가진 사람은 감정이 생기면 바로 말하고 빠르게 움직이고 싶어 합니다. ${nameB}의 성향을 가진 사람은 마음이 충분히 가라앉을 때까지 조용히 있으려 합니다.\n"왜 아무 말도 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 순간이 생기기 쉽습니다.\n표현의 속도가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_deep-warm_active': `${nameA}의 성향을 가진 사람은 마음이 가라앉을 때까지 조용히 있는 편이고, 결정도 천천히 내립니다. ${nameB}의 성향을 가진 사람은 감정을 바로 꺼내야 편해지고, 빠르게 반응합니다.\n침묵이 거리두기로 오해받는 순간이 생기기 쉽습니다.\n조용한 것이 무관심이 아니라, 깊이 생각하는 방식임을 기억하면 오해가 줄어듭니다.`,
    'warm_soft-cool_clear': `${nameA}의 성향을 가진 사람은 "내 마음을 알아줬으면" 하는 바람이 먼저입니다. ${nameB}의 성향을 가진 사람은 감정보다 "어떻게 해결할까"를 먼저 생각합니다.\n공감을 원하는데 해결책이 돌아올 때 서운함이 쌓일 수 있습니다.\n해결하려는 마음 뒤에도 진심이 있다는 것을 기억하면 관계가 편안해집니다.`,
    'cool_clear-warm_soft': `${nameA}의 성향을 가진 사람은 감정보다 상황 정리를 먼저 합니다. ${nameB}의 성향을 가진 사람은 먼저 공감받고 싶어 합니다.\n이성적인 말이 차갑게 느껴지는 순간이 생길 수 있습니다.\n논리적인 표현 뒤에도 따뜻한 마음이 있습니다.`,
    'warm_active-nature': `${nameA}의 성향을 가진 사람은 빠르게 반응하고 즉각 표현합니다. ${nameB}의 성향을 가진 사람은 자신의 리듬대로 천천히 처리합니다.\n"왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다.\n속도의 차이가 있을 뿐, 두 사람 모두 같은 방향을 향하고 있습니다.`,
    'nature-warm_active': `${nameA}의 성향을 가진 사람은 조용히 자신의 리듬을 지킵니다. ${nameB}의 성향을 가진 사람은 빠르게 반응하고 표현합니다.\n조용한 존재감이 무관심으로 오해받는 순간이 생길 수 있습니다.\n천천히 가는 것이 함께하지 않는 것이 아닙니다.`,
    'warm_grounded-warm_active': `${nameA}의 성향을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. ${nameB}의 성향을 가진 사람은 즉각적으로 표현합니다.\n"왜 그렇게 흥분해?"와 "왜 그렇게 무덤덤해?"가 부딪히는 순간이 있습니다.\n표현의 강도가 다를 뿐, 두 사람 모두 진심으로 반응하고 있습니다.`,
    'cool_deep-cool_clear': `${nameA}의 성향을 가진 사람은 감정을 깊이 담아두고 천천히 꺼냅니다. ${nameB}의 성향을 가진 사람은 논리적으로 정리하고 명료하게 표현합니다.\n두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.\n먼저 물어보는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
  };

  const key = `${fA}-${fB}`;
  if (fA === fB) {
    const sameMap: Record<EnergyFamily, string> = {
      warm_active: `두 사람 모두 감정을 바로 표현하고 빠르게 반응하는 편입니다.\n함께 있으면 활기차지만, 둘 다 지쳐있을 때는 서로를 쉬게 해주는 것이 필요합니다.\n가끔 먼저 "오늘 어때?"라고 물어보는 것이 관계를 따뜻하게 유지해줍니다.`,
      warm_soft: `두 사람 모두 감성적이고 부드러운 방식으로 감정을 나눕니다.\n서로의 마음을 자연스럽게 이해하지만, 때로는 현실적인 결정을 함께 내려야 할 때 망설임이 생길 수 있습니다.\n감정을 나누는 것만큼 방향을 함께 정하는 시간도 필요합니다.`,
      warm_grounded: `두 사람 모두 안정적이고 신중하게 감정을 다룹니다.\n변화보다 익숙함을 좋아하는 편이라 함께 있으면 편안하지만, 새로운 시도에는 함께 용기가 필요합니다.\n작은 변화 하나가 관계에 새로운 활기를 줄 수 있습니다.`,
      cool_clear: `두 사람 모두 명료하고 효율적인 방식으로 감정을 다룹니다.\n서로의 방식을 잘 이해하지만, 감정적인 연결보다 일 처리가 앞서는 순간이 생길 수 있습니다.\n가끔 "오늘 어떤 마음이야?"라고 물어보는 것이 두 사람 사이를 더 따뜻하게 만들어줍니다.`,
      cool_deep: `두 사람 모두 감정을 깊이 담아두고 천천히 꺼내는 편입니다.\n서로의 침묵을 말 없이 받아들이지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다.\n먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결합니다.`,
      nature: `두 사람 모두 자연스럽고 유연한 리듬으로 감정을 다룹니다.\n서로를 강요하지 않아 편안하지만, 때로는 누군가 먼저 방향을 잡아줄 필요가 있습니다.\n가끔 "우리 이렇게 해보자"고 먼저 제안하는 것이 관계를 앞으로 나아가게 합니다.`,
      neutral: `두 사람 모두 균형 잡힌 방식으로 감정을 다룹니다.\n서로의 속도를 편안하게 맞춰가는 편입니다.\n지금의 균형을 유지하면서 조금씩 더 깊이 연결되어 가는 것이 두 사람에게 맞는 방향입니다.`,
    };
    return sameMap[fA];
  }

  // 폴백 — 계열별 감정 차이 특성 반영
  const fallbackExprMap: Partial<Record<string, string>> = {
    'warm_active-warm_soft': `${nameA}의 성향을 가진 사람은 감정이 생기면 즉각 표현합니다. ${nameB}의 성향을 가진 사람은 부드럽게, 조금 더 천천히 표현합니다.\n표현 속도와 강도의 차이가 반복되면 한 사람은 "왜 이렇게 조심스러워?"라고, 다른 사람은 "왜 이렇게 강하게 반응해?"라고 느낄 수 있습니다.\n관계 온도 차이를 인정하면 두 사람 모두 더 편안해집니다.`,
    'warm_soft-warm_active': `${nameA}의 성향을 가진 사람은 부드럽고 배려 깊게 표현합니다. ${nameB}의 성향을 가진 사람은 즉각적이고 활기차게 반응합니다.\n한 사람의 조심스러운 표현이 다른 사람에게 소극적으로 느껴지는 순간이 생길 수 있습니다.\n표현 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'warm_grounded-cool_clear': `${nameA}의 성향을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. ${nameB}의 성향을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다.\n안정 추구와 명료함 추구가 부딪히는 순간이 생길 수 있습니다.\n두 방향 모두 관계를 위한 마음에서 나옵니다.`,
    'cool_clear-warm_grounded': `${nameA}의 성향을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다. ${nameB}의 성향을 가진 사람은 안정적이고 신중하게 감정을 다룹니다.\n"왜 이렇게 복잡하게 생각해?"와 "왜 이렇게 단순하게 봐?"가 교차하는 순간이 있습니다.\n생각 중심과 안정 중심, 두 방식이 만나면 서로를 보완할 수 있습니다.`,
    'warm_soft-nature': `${nameA}의 성향을 가진 사람은 따뜻하게 배려하며 관계 온도를 중요하게 여깁니다. ${nameB}의 성향을 가진 사람은 자신의 리듬과 공간을 소중히 합니다.\n한 사람의 관심이 다른 사람에게 부담으로 느껴지는 순간이 생길 수 있습니다.\n서로의 필요를 확인하는 것이 두 사람 사이의 균형을 만들어줍니다.`,
    'nature-warm_soft': `${nameA}의 성향을 가진 사람은 자신의 리듬과 공간을 소중히 합니다. ${nameB}의 성향을 가진 사람은 따뜻하게 배려하며 관계 온도를 중요하게 여깁니다.\n한 사람의 거리감이 다른 사람에게 서운함으로 느껴지는 순간이 생길 수 있습니다.\n자신의 공간을 지키는 것이 관계를 멀리하는 것이 아님을 서로 알면 편안해집니다.`,
    'cool_clear-cool_deep': `${nameA}의 성향을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다. ${nameB}의 성향을 가진 사람은 깊이 생각하다가 말이 늦어집니다.\n생각의 속도 차이가 반복되면 한 사람은 답답함을, 다른 사람은 압박감을 느낄 수 있습니다.\n생각의 깊이와 속도가 다를 뿐, 두 사람 모두 진지하게 관계를 대하고 있습니다.`,
  };

  const getFamilyExprTrait = (f: EnergyFamily): string => {
    const m: Record<EnergyFamily, string> = {
      warm_active: '감정이 생기면 바로 표현하고 빠르게 반응하는',
      warm_soft: '부드럽게 배려하며 관계 온도를 중요하게 여기는',
      warm_grounded: '안정적이고 신중하게 감정을 다루는',
      cool_clear: '명료하게 정리하고 논리적으로 판단하는',
      cool_deep: '내면에서 정리하다 천천히 표현하는',
      nature: '자신의 리듬대로 유연하게 반응하는',
      neutral: '균형 잡힌 방식으로 감정을 다루는',
    };
    return m[f];
  };
  const exprTraitA = getFamilyExprTrait(fA);
  const exprTraitB = getFamilyExprTrait(fB);
  return map[key] ?? fallbackExprMap[key] ?? fallbackExprMap[`${fB}-${fA}`] ?? `${exprTraitA} 사람과 ${exprTraitB} 사람은 같은 상황에서도 서로 다른 방식으로 반응합니다.\n한 사람의 표현 방식이 다른 사람에게 낯설게 느껴지는 순간이 반복될 수 있습니다.\n서로의 방식이 틀린 것이 아니라 다른 것임을 기억하는 것이 중요합니다.`;
}

/**
 * 가까워지는 방법 — 연결 방식 + 애정 스타일을 하나의 단락으로 통합
 * 핵심 2~3줄 + 강조 1줄 구조
 */
function buildConnectionStyle(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType, colorsA?: ColorData[], colorsB?: ColorData[]): string {
  const isCouple = rel === '연인' || rel === '부부';
  const styleA = getIntimacyStyleShort(fA);
  const styleB = getIntimacyStyleShort(fB);
  const affStyleA = getAffectionStyleShort(fA, isCouple);
  const affStyleB = getAffectionStyleShort(fB, isCouple);

  const map: Partial<Record<string, string>> = {
    'warm_active-cool_deep': isCouple
      ? `한 사람은 함께 무언가를 하고 표현을 나눌 때 가장 연결된 느낌을 받습니다. 다른 사람은 깊은 대화 한 번이 수십 번의 가벼운 표현보다 더 크게 닿습니다.\n한 사람은 "사랑해"를 자주 말하는 것이 자연스럽고, 다른 사람은 말보다 오래 기억하고 깊이 생각하는 방식으로 마음을 전합니다.\n서로의 연결 언어를 알고 그 방식으로 먼저 다가가는 것이 가장 좋은 시작입니다.`
      : `한 사람은 함께 활동하며 연결감을 느끼고, 다른 사람은 깊은 대화를 통해 연결됩니다.\n표현의 빈도가 다를 뿐, 두 사람 모두 진심으로 연결되고 싶어 합니다.\n상대방의 방식으로 한 번 다가가보는 것이 관계를 더 가깝게 만들어줍니다.`,
    'warm_soft-cool_clear': isCouple
      ? `한 사람은 따뜻한 말 한 마디와 스킨십에서 연결감을 느낍니다. 다른 사람은 약속을 지키고 신뢰를 쌓는 것이 사랑의 언어입니다.\n"말로 해줘"와 "내가 이렇게 행동으로 보여주고 있잖아"가 교차하는 순간, 서로의 언어를 번역해주는 것이 필요합니다.\n행동으로 보여주는 사랑과 말로 전하는 사랑, 두 가지 모두 진심입니다.`
      : `한 사람은 따뜻한 감정 표현으로, 다른 사람은 신뢰와 일관성으로 연결됩니다.\n서로의 연결 언어를 이해하면 오해가 줄어듭니다.\n상대방의 방식이 나와 다르더라도, 그 안에 진심이 있습니다.`,
    'cool_deep-warm_soft': isCouple
      ? `한 사람은 진심 어린 깊은 대화에서 연결감을 느낍니다. 다른 사람은 따뜻한 말과 스킨십이 먼저입니다.\n깊이 있는 연결을 원하는 사람과 따뜻한 온기를 원하는 사람이 만나면, 서로의 방식으로 먼저 다가가는 것이 가장 좋은 선물이 됩니다.\n말 한 마디와 진심 어린 대화, 두 가지 모두 두 사람에게 필요합니다.`
      : `한 사람은 깊은 대화로, 다른 사람은 따뜻한 감정 표현으로 연결됩니다.\n서로의 방식이 다르지만, 그 안에 진심이 있습니다.\n상대방의 방식을 먼저 인정하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'nature-warm_active': isCouple
      ? `한 사람은 말 없이 조용히 함께 있는 것만으로도 충분히 연결된 느낌을 받습니다. 다른 사람은 함께 무언가를 하고 표현을 나눌 때 살아있는 느낌이 납니다.\n"그냥 옆에 있어줘"와 "뭔가 같이 하자"가 교차하는 순간이 있습니다.\n조용한 동행과 함께하는 활동, 두 가지를 번갈아 나눠보는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 조용한 동행으로, 다른 사람은 함께하는 활동으로 연결됩니다.\n서로의 방식이 다르지만, 함께하고 싶은 마음은 같습니다.\n상대방의 방식으로 한 번 다가가보는 것이 관계를 더 따뜻하게 만들어줍니다.`,
  };

  // colorId 기반 생활 언어 연결 방식 맵
  const colorIdConnMap: Partial<Record<string, string>> = {
    'white-red': isCouple
      ? `한 사람은 집안 분위기와 생활 리듬이 안정되어야 편안함을 느낍니다. 다른 사람은 감정이 생기면 바로 표현하며 스킨십과 활동으로 연결감을 확인하고 싶어 합니다.\n"지금 좀 정리하고 싶어"와 "지금 당장 같이 뭔가 하자"가 교차하는 순간이 있습니다.\n한 사람의 정리 시간을 존중하고, 다른 사람의 즉각적인 연결 욕구를 가볍게 받아주는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 안정된 생활 리듬으로, 다른 사람은 즉각적인 표현과 활동으로 연결됩니다.\n서로의 속도를 맞춰가는 것이 관계의 핵심입니다.`,
    'white-pink': isCouple
      ? `한 사람은 감정이 쌓이면 혼자 정리하는 시간이 필요합니다. 다른 사람은 그 순간 따뜻한 말 한 마디와 표현으로 연결감을 확인하고 싶어 합니다.\n"지금 혼자 있어야 해"와 "왜 나를 피해?"가 반복되는 패턴이 있습니다.\n거리두기가 회복 방식임을 서로 알면, 다시 연결되는 시간이 더 따뜻해집니다.`
      : `한 사람은 조용한 거리두기로, 다른 사람은 따뜻한 표현으로 회복합니다.\n서로의 회복 방식을 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'white-violet': isCouple
      ? `한 사람은 생활 공간이 정돈되고 루틴이 유지될 때 편안함을 느낍니다. 다른 사람은 깊은 대화와 감성적인 연결에서 관계를 느낍니다.\n"지금 정리하고 싶어"와 "지금 깊은 이야기를 나누고 싶어"가 교차하는 순간이 있습니다.\n한 사람의 정리 시간을 존중하고, 다른 사람의 감성적 연결 욕구를 가볍게 받아주는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 안정된 생활 루틴으로, 다른 사람은 깊은 감성 대화로 연결됩니다.\n서로의 연결 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'black-pink': isCouple
      ? `한 사람은 혼자 회복하는 시간이 필요하고, 말이 많아지면 피로를 느낍니다. 다른 사람은 따뜻한 표현과 확인으로 연결감을 느낍니다.\n조용해도 관계가 식은 것이 아님을 다른 사람이 알면, 한 사람의 침묵이 더 이상 상처가 되지 않습니다.\n한 사람의 회복 공간을 지켜주고, 다른 사람의 표현 욕구를 가볍게 받아주는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 혼자 회복하는 공간이 필요하고, 다른 사람은 따뜻한 표현으로 연결됩니다.\n서로의 방식을 이해하면 관계가 더 편안해집니다.`,
    'black-red': isCouple
      ? `한 사람은 간섭이 부담스럽고 자기 방식을 고수하는 편입니다. 다른 사람은 즉각 반응하고 표현하며 연결감을 확인합니다.\n두 사람 모두 자기 방식이 강해 주도권 충돌이 반복될 수 있습니다.\n서로의 방식을 먼저 인정하고, 작은 양보를 번갈아 하는 것이 두 사람 사이의 긴장을 줄여줍니다.`
      : `한 사람은 경계와 자기 방식을 중요하게 여기고, 다른 사람은 즉각적인 표현과 반응을 원합니다.\n서로의 방식을 인정하는 것이 관계의 핵심입니다.`,
    'red-green': isCouple
      ? `한 사람은 바로 표현하고 답답한 분위기를 힘들어합니다. 다른 사람은 편안한 일상과 자연스러운 연결을 선호합니다.\n한 사람의 활기가 다른 사람에게 자극이 되고, 다른 사람의 안정감이 한 사람에게 쉼이 됩니다.\n표현의 강도를 조금 낮추고, 일상의 편안함을 함께 만들어가는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 즉각적인 표현과 활동으로, 다른 사람은 편안한 일상으로 연결됩니다.\n서로의 속도를 맞춰가는 것이 관계를 더 안정적으로 만들어줍니다.`,
    'red-violet': isCouple
      ? `한 사람은 감정이 생기면 바로 꺼내고 스킨십과 활동으로 연결감을 확인합니다. 다른 사람은 깊은 감정 공감과 분위기 있는 대화에서 연결을 느낍니다.\n한 사람의 빠른 속도가 다른 사람에게 압박이 되고, 다른 사람의 느린 반응이 한 사람에게 무관심으로 느껴지는 순간이 있습니다.\n속도를 조금 늦추고, 깊은 대화 한 번이 수십 번의 가벼운 표현보다 더 크게 닿는다는 것을 기억하면 좋습니다.`
      : `한 사람은 즉각적인 표현과 활동으로, 다른 사람은 깊은 감성 대화로 연결됩니다.\n서로의 연결 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'green-navy': isCouple
      ? `두 사람 모두 안정감 있는 관계를 선호합니다. 한 사람은 자연스럽게 챙기며 편안한 일상을 중요하게 여기고, 다른 사람은 책임감과 신뢰로 관계를 이어갑니다.\n서로 표현이 부족해 거리감이 조용히 쌓이는 패턴이 있습니다.\n가끔 "오늘 어때?"라고 먼저 물어보는 것만으로도 두 사람 사이의 거리가 좁혀집니다.`
      : `두 사람 모두 안정감 있는 관계를 선호합니다. 가끔 말로 확인하는 시간이 관계를 더 따뜻하게 만들어줍니다.`,
    'yellow-navy': isCouple
      ? `한 사람은 현실적인 대화와 미래 계획을 함께 나누는 것에서 연결감을 느낍니다. 다른 사람도 책임감과 신뢰를 중요하게 여기지만, 감정 표현보다 행동으로 보여주는 편입니다.\n두 사람 모두 현실 지향적이어서 감정 표현이 줄어드는 패턴이 생길 수 있습니다.\n현실 대화 속에서도 "오늘 고마웠어"라는 한 마디가 두 사람의 연결을 따뜻하게 유지해줍니다.`
      : `두 사람 모두 현실적이고 책임감 있는 방식으로 관계를 이어갑니다. 가끔 감정 표현을 더하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
    'violet-yellow': isCouple
      ? `한 사람은 깊은 감정 공감과 분위기 있는 대화에서 연결을 느낍니다. 다른 사람은 현실적인 대화와 밝은 소통을 선호합니다.\n"왜 이렇게 깊이 생각해?"와 "왜 이렇게 가볍게 봐?"가 반복되는 패턴이 있습니다.\n한 사람의 감성적 연결 욕구를 존중하고, 다른 사람의 밝은 에너지를 함께 즐기는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 깊은 감성 대화로, 다른 사람은 현실적이고 밝은 소통으로 연결됩니다.\n서로의 연결 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'magenta-green': isCouple
      ? `한 사람은 감정을 깊이 나누고 강한 연결감을 원합니다. 다른 사람은 편안한 일상과 자연스러운 배려로 관계를 이어갑니다.\n한 사람의 강한 감정 표현이 다른 사람에게 부담이 되고, 다른 사람의 조용한 배려가 한 사람에게 무관심으로 느껴지는 순간이 있습니다.\n감정의 강도를 조금 낮추고, 다른 사람의 조용한 배려 안에 진심이 있음을 기억하면 좋습니다.`
      : `한 사람은 깊은 감정 표현으로, 다른 사람은 편안한 일상으로 연결됩니다.\n서로의 방식을 이해하면 관계가 더 편안해집니다.`,
    'blue-red': isCouple
      ? `한 사람은 충분히 생각한 후 신중하게 표현합니다. 다른 사람은 감정이 생기면 바로 꺼내고 즉각 반응을 원합니다.\n한 사람의 신중함이 다른 사람에게 답답함으로, 다른 사람의 빠른 반응이 한 사람에게 충동적으로 느껴지는 순간이 있습니다.\n한 사람은 "지금 생각 중이야"라고 알려주고, 다른 사람은 조금 기다려주는 것이 두 사람 사이의 긴장을 줄여줍니다.`
      : `한 사람은 신중하게 생각한 후 표현하고, 다른 사람은 즉각적으로 반응합니다.\n서로의 속도를 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'blue-pink': isCouple
      ? `한 사람은 충분히 생각한 후에야 표현합니다. 다른 사람은 지금 당장 따뜻한 반응과 표현으로 연결감을 확인하고 싶어 합니다.\n표현 타이밍의 차이가 서운함으로 이어지는 패턴이 있습니다.\n한 사람은 "지금 생각 중이야, 조금만 기다려줘"라고 알려주고, 다른 사람은 그 시간을 믿어주는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 신중하게 생각한 후 표현하고, 다른 사람은 따뜻한 즉각 반응을 원합니다.\n표현 타이밍의 차이를 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'blue-yellow': isCouple
      ? `한 사람은 신중하게 생각한 후 표현하고, 책임감 있게 관계를 이어갑니다. 다른 사람은 현실적인 대화와 밝은 소통을 선호합니다.\n두 사람 모두 현실 지향적이어서 감정 표현이 줄어드는 패턴이 생길 수 있습니다.\n가끔 "오늘 어때?"라고 먼저 물어보는 것만으로도 두 사람 사이의 거리가 좁혀집니다.`
      : `두 사람 모두 현실적이고 신중한 방식으로 관계를 이어갑니다. 가끔 감정 표현을 더하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
    'lavender-red': isCouple
      ? `한 사람은 분위기와 감정 공감을 중요하게 여기고, 깊은 대화에서 연결을 느낍니다. 다른 사람은 바로 표현하고 스킨십과 활동으로 연결감을 확인합니다.\n한 사람의 예민한 감수성이 다른 사람에게 낯설게 느껴지고, 다른 사람의 빠른 속도가 한 사람에게 부담이 되는 순간이 있습니다.\n한 사람의 감성적 연결 욕구를 존중하고, 다른 사람의 활기찬 표현을 함께 즐기는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 감성적인 연결로, 다른 사람은 즉각적인 표현과 활동으로 연결됩니다.\n서로의 연결 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    // 레드·블루·블랙 조합 — 신뢰 + 기준 + 질서 연결
    'red-blue': isCouple
      ? `한 사람은 감정이 생기면 바로 표현하고 즉각 반응으로 연결감을 확인합니다. 다른 사람은 충분히 생각한 후에야 말하며, 신뢰와 기준으로 관계를 이어갑니다.\n한 사람의 빠른 표현이 다른 사람에게 충동적으로, 다른 사람의 침묵이 한 사람에게 무관심으로 느껴지는 순간이 반복됩니다.\n"지금 생각 중이야, 조금만 기다려줘"라고 먼저 말해주는 것이 두 사람 사이의 거리감을 줄여줍니다.`
      : `한 사람은 즉각적인 표현으로, 다른 사람은 신뢰와 기준으로 연결됩니다.\n서로의 속도를 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'red-black': isCouple
      ? `한 사람은 감정을 바로 표현하고 즉각 반응으로 연결감을 확인합니다. 다른 사람은 자기 방식과 경계를 지키며 관계를 이어갑니다.\n주도권 충돌과 생활 기준 차이가 반복적인 긴장을 만듭니다. 서로의 방식을 먼저 인정하고, 작은 양보를 번갈아 하는 것이 두 사람 사이의 연결을 유지하는 방법입니다.`
      : `한 사람은 즉각적인 표현으로, 다른 사람은 자기 방식과 경계로 연결됩니다.\n서로의 방식을 인정하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'blue-black': isCouple
      ? `두 사람 모두 감정을 쉽게 드러내지 않아 서로의 마음을 읽기 어렵습니다. 한 사람은 신뢰와 신중함으로, 다른 사람은 경계와 자신만의 방식으로 관계를 이어갑니다.\n집안 정리 기준이나 생활 루틴에 대한 기대가 다를 때 조용히 긴장이 쌓입니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`
      : `두 사람 모두 표현이 적지만, 각자의 방식으로 관계를 소중히 여기고 있습니다.\n먼저 한 마디 건네는 것이 두 사람 사이를 연결하는 가장 빠른 방법입니다.`,
    // 핑크·인디고·옐로우 조합 — 인정 욕구 + 현실 안정 + 책임감 연결
    'pink-indigo': isCouple
      ? `한 사람은 따뜻한 말과 표현으로 연결감을 확인하고 싶어 합니다. 다른 사람은 충분히 생각한 후에야 말하며 신중하게 관계를 이어갑니다.\n인정 욕구와 신중함이 균형을 이룰 때 두 사람의 관계는 가장 안정적입니다. "지금 생각 중이야"라고 먼저 말해주는 것이 한 사람의 서운함을 줄여줍니다.`
      : `한 사람은 따뜻한 표현으로, 다른 사람은 신중함과 인정으로 연결됩니다.\n서로의 연결 방식을 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'indigo-yellow': isCouple
      ? `한 사람은 내면 정리 후 말하며 신중하게 관계를 이어갑니다. 다른 사람은 현실 계획과 책임감으로 관계를 이어갑니다.\n두 사람 모두 현실 안정을 중요하게 여기지만, 감정 표현이 줄어드는 패턴이 생길 수 있습니다. 가끔 "오늘 어땠어?"라고 먼저 묻는 것이 두 사람 사이를 따뜻하게 유지해줍니다.`
      : `두 사람 모두 현실 지향적으로 연결됩니다.\n감정 표현을 더하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
    'orange-purple': isCouple
      ? `한 사람은 즉각적인 표현과 활동으로 연결감을 확인합니다. 다른 사람은 분위기와 깊은 대화에서 연결을 느낍니다.\n한 사람의 빠른 속도가 다른 사람에게 부담이 되고, 다른 사람의 느린 반응이 한 사람에게 무관심으로 느껴집니다.\n속도 차이를 인정하고, 서로의 연결 방식을 함께 즐기는 것이 두 사람에게 맞는 방법입니다.`
      : `한 사람은 즉각적인 활동으로, 다른 사람은 깊은 대화로 연결됩니다.\n서로의 연결 방식을 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'orange-indigo': isCouple
      ? `한 사람은 활기찬 에너지로 바로 표현하고, 다른 사람은 신중하게 생각한 후 말합니다.\n한 사람의 빠른 속도가 다른 사람에게 부담이 되고, 다른 사람의 느린 반응이 한 사람에게 답답함으로 느껴집니다.\n"지금 생각 중이야"라고 먼저 말해주는 것이 두 사람 사이의 거리감을 줄여줍니다.`
      : `한 사람은 활기찬 표현으로, 다른 사람은 신중함으로 연결됩니다.\n서로의 속도를 이해하는 것이 관계를 더 편안하게 만들어줍니다.`,
    'lavender-indigo': isCouple
      ? `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 섬세하게 분위기를 읽고, 다른 사람은 깊이 생각한 후 말합니다.\n서로 표현이 부족해 거리감이 쌓일 수 있지만, 각자의 방식으로 관계를 소중히 여기고 있습니다. 가끔 먼저 한 마디 건네는 것이 두 사람 사이를 따뜻하게 유지해줍니다.`
      : `두 사람 모두 표현이 적지만, 각자의 방식으로 관계를 소중히 여기고 있습니다.\n먼저 한 마디 건네는 것이 두 사람 사이를 연결하는 가장 빠른 방법입니다.`,
  };
  const colorIdA_conn = colorsA?.[0]?.id ?? '';
  const colorIdB_conn = colorsB?.[0]?.id ?? '';
  const colorConnResult = colorIdConnMap[`${colorIdA_conn}-${colorIdB_conn}`] ?? colorIdConnMap[`${colorIdB_conn}-${colorIdA_conn}`];
  if (colorConnResult) return colorConnResult;

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    return `두 사람 모두 ${styleA} 방식으로 연결감을 느낍니다.\n같은 언어로 연결되기 때문에 서로의 필요를 먼저 알아채는 편입니다.\n다만 같은 방식이 익숙해지면 표현이 줄어들 수 있으니, 가끔 새로운 방식으로 마음을 전해보는 것도 좋습니다.`;
  }

  return map[key] ?? map[reverseKey] ?? `한 사람은 ${styleA} 방식으로 연결감을 느끼고, 다른 사람은 ${styleB} 방식으로 연결감을 느낍니다.\n한 사람은 ${affStyleA} 마음을 전하고, 다른 사람은 ${affStyleB} 표현합니다.\n상대방이 마음이 열리는 방식을 먼저 알고 그 방식으로 다가가는 것이, 두 사람 사이의 거리를 좁히는 가장 빠른 길입니다.`;
}

function buildNeededExpression(
  fA: EnergyFamily, fB: EnergyFamily,
  colorsA: ColorData[], colorsB: ColorData[],
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): { forA: string; forB: string } {
  // 실제 컬러 ID 기반 조합별 맞춤 표현 (더 구체적인 차별화)
  const colorIdA = colorsA[0]?.id ?? '';
  const colorIdB = colorsB[0]?.id ?? '';
  const colorKey = `${colorIdA}-${colorIdB}`;
  const colorKeyRev = `${colorIdB}-${colorIdA}`;

  // 컬러 ID 조합별 맞춤 문장 — 감정 인정·표현 방식·관계 온도 차별화
  const neededByColorCombo: Partial<Record<string, { forA: string; forB: string }>> = {
    // 핑크 계열 + 옐로우 계열 → 감정 인정 + 밝은 표현
    'pink-yellow': {
      forA: '"오늘 네 감정이 다 맞아. 그냥 느끼는 대로 있어도 돼."',
      forB: '"네 밝은 에너지가 나한테 힘이 돼. 고마워."',
    },
    'pink-orange': {
      forA: '"네가 표현해줘서 나도 편해. 계속 말해줘."',
      forB: '"지금 내 마음이 조금 복잡해. 잠깐 들어줄 수 있어?"',
    },
    'pink-skyblue': {
      forA: '"네가 자유롭게 있어도 나는 괜찮아. 부담 갖지 마."',
      forB: '"지금 내 마음이 조금 무거워. 가볍게 들어줄 수 있어?"',
    },
    'lavender-yellow': {
      forA: '"네 밝음이 나한테 위로가 돼. 오늘도 고마워."',
      forB: '"지금 내 마음을 조용히 들어줄 수 있어? 말 많이 안 해도 돼."',
    },
    'lavender-orange': {
      forA: '"네가 먼저 말 걸어줘서 좋아. 그게 나한테 큰 힘이야."',
      forB: '"지금은 조용히 있고 싶어. 조금만 기다려줄 수 있어?"',
    },
    'lavender-skyblue': {
      forA: '"네가 자유롭게 있어도 나는 여기 있어. 부담 갖지 마."',
      forB: '"지금 내 마음을 천천히 들어줄 수 있어?"',
    },
    // 블루 계열 + 화이트/크림 계열 → 침묵 이해 + 안정감
    'blue-white': {
      forA: '"말 없이 옆에 있어줘도 충분해. 그게 나한테 안정이야."',
      forB: '"지금 내가 조용한 건 괜찮다는 뜻이야. 걱정하지 마."',
    },
    'blue-cream': {
      forA: '"네가 조용히 있어줘서 나도 편해. 고마워."',
      forB: '"지금 내 마음을 천천히 정리하고 있어. 기다려줄 수 있어?"',
    },
    'indigo-white': {
      forA: '"말 없이 함께 있는 것만으로도 충분해."',
      forB: '"지금 생각 정리 중이야. 조금만 기다려줘."',
    },
    'navy-white': {
      forA: '"네가 옆에 있어줘서 든든해. 말 안 해도 알아."',
      forB: '"지금 내가 말이 없는 건 생각 중이라서야. 걱정 마."',
    },
    // 레드 계열 + 네이비/블루 계열 → 인정 욕구 + 책임감
    'red-navy': {
      forA: '"네가 책임감 있게 해주는 거 나 다 알아. 고마워."',
      forB: '"지금 내 열정이 조금 강하게 느껴질 수 있어. 이해해줘서 고마워."',
    },
    'red-blue': {
      forA: '"네가 진지하게 들어줘서 나 힘이 나. 고마워."',
      forB: '"지금 내 에너지가 세게 느껴질 수 있어. 그래도 옆에 있어줘."',
    },
    'coral-navy': {
      forA: '"네가 묵묵히 지켜봐줘서 나 안정돼. 고마워."',
      forB: '"지금 내 감정이 복잡해. 판단 없이 들어줄 수 있어?"',
    },
    // 옐로우 + 스카이블루 → 자유 + 가벼운 소통
    'yellow-skyblue': {
      forA: '"오늘 같이 가볍게 웃을 수 있어서 좋았어."',
      forB: '"네 자유로운 모습이 나한테 활기를 줘. 고마워."',
    },
    // 그린/세이지/민트 + 따뜻한 계열 → 자연스러운 회복 + 따뜻한 연결
    'green-pink': {
      forA: '"네 따뜻함이 나한테 회복이 돼. 고마워."',
      forB: '"지금 자연스럽게 쉬고 싶어. 함께 조용히 있어줄 수 있어?"',
    },
    'mint-peach': {
      forA: '"네가 따뜻하게 챙겨줘서 나 편해졌어. 고마워."',
      forB: '"지금 가볍게 쉬고 싶어. 조용히 옆에 있어줄 수 있어?"',
    },
    'sage-lavender': {
      forA: '"네가 조용히 있어줘서 나도 편안해. 고마워."',
      forB: '"지금 내 마음을 천천히 들어줄 수 있어?"',
    },
  };

  const colorCombo = neededByColorCombo[colorKey] ?? neededByColorCombo[colorKeyRev];
  if (colorCombo) return colorCombo;

  // 에너지 계열 기반 조합별 맞춤 표현 — 상대방의 에너지 결을 고려한 실전 코칭 언어
  const neededByCombo: Partial<Record<string, { forA: string; forB: string }>> = {
    'warm_active-cool_deep': {
      forA: '"지금 당장 답 안 해도 괜찮아. 네 속도로 말해줘."',
      forB: '"지금 어떤 마음인지 조금만 말해줄 수 있어? 궁금해서."',
    },
    'cool_deep-warm_active': {
      forA: '"지금 어떤 마음인지 조금만 말해줄 수 있어? 궁금해서."',
      forB: '"지금 당장 답 안 해도 괜찮아. 네 속도로 말해줘."',
    },
    'warm_soft-cool_clear': {
      forA: '"네 마음이 힘들겠구나. 해결 말고 그냥 들을게."',
      forB: '"지금은 해결보다 그냥 내 말 들어주는 게 더 필요해."',
    },
    'cool_clear-warm_soft': {
      forA: '"지금은 해결보다 그냥 내 말 들어주는 게 더 필요해."',
      forB: '"네 마음이 힘들겠구나. 해결 말고 그냥 들을게."',
    },
    'warm_active-nature': {
      forA: '"네 페이스로 해. 서두르지 않아도 돼."',
      forB: '"오늘 같이 뭔가 해볼까? 네가 원하는 거 뭐든."',
    },
    'nature-warm_active': {
      forA: '"오늘 같이 뭔가 해볼까? 네가 원하는 거 뭐든."',
      forB: '"네 페이스로 해. 서두르지 않아도 돼."',
    },
    'warm_grounded-cool_deep': {
      forA: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
      forB: '"네 방식이 맞아. 천천히 해도 돼."',
    },
    'cool_deep-cool_clear': {
      forA: '"네 판단을 믿어. 잘 하고 있어."',
      forB: '"말 안 해도 괜찮아. 네 마음 알아."',
    },
    // 추가 조합 — 미매핑 에너지 계열 세분화
    'warm_active-warm_soft': {
      forA: '"네가 배려해줘서 나 힘이 나. 오늘도 고마워."',
      forB: '"지금 많이 힘들지? 잠깐 쉬어도 괜찮아."',
    },
    'warm_soft-warm_active': {
      forA: '"지금 많이 힘들지? 잠깐 쉬어도 괜찮아."',
      forB: '"네가 배려해줘서 나 힘이 나. 오늘도 고마워."',
    },
    'warm_active-warm_grounded': {
      forA: '"네가 묵묵히 있어줘서 나 안정돼. 고마워."',
      forB: '"오늘 같이 뭔가 새로운 거 해볼까? 네가 정해줘."',
    },
    'warm_grounded-warm_active': {
      forA: '"오늘 같이 뭔가 새로운 거 해볼까? 네가 정해줘."',
      forB: '"네가 묵묵히 있어줘서 나 안정돼. 고마워."',
    },
    'warm_active-cool_clear': {
      forA: '"네가 명확하게 정리해줘서 나 편해. 고마워."',
      forB: '"지금 내 마음이 복잡해. 판단 말고 그냥 들어줄 수 있어?"',
    },
    'cool_clear-warm_active': {
      forA: '"지금 내 마음이 복잡해. 판단 말고 그냥 들어줄 수 있어?"',
      forB: '"네가 명확하게 정리해줘서 나 편해. 고마워."',
    },
    'warm_soft-nature': {
      forA: '"네가 자연스럽게 있어줘서 나 편해. 고마워."',
      forB: '"지금 내 마음을 조용히 들어줄 수 있어?"',
    },
    'nature-warm_soft': {
      forA: '"지금 내 마음을 조용히 들어줄 수 있어?"',
      forB: '"네가 자연스럽게 있어줘서 나 편해. 고마워."',
    },
    'warm_soft-warm_grounded': {
      forA: '"네가 안정적으로 있어줘서 나 든든해. 고마워."',
      forB: '"지금 내 마음이 조금 복잡해. 그냥 들어줄 수 있어?"',
    },
    'warm_grounded-warm_soft': {
      forA: '"지금 내 마음이 조금 복잡해. 그냥 들어줄 수 있어?"',
      forB: '"네가 안정적으로 있어줘서 나 든든해. 고마워."',
    },
    'warm_soft-cool_deep': {
      forA: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
      forB: '"네가 따뜻하게 챙겨줘서 나 편해졌어. 고마워."',
    },
    'cool_deep-warm_soft': {
      forA: '"네가 따뜻하게 챙겨줘서 나 편해졌어. 고마워."',
      forB: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
    },
    'warm_grounded-warm_grounded': {
      forA: '"오늘도 수고했어. 네가 있어서 든든해."',
      forB: '"네가 묵묵히 해줘서 나 정말 고마워."',
    },
    'warm_grounded-cool_clear': {
      forA: '"네가 명확하게 정리해줘서 나 편해. 고마워."',
      forB: '"네 방식이 맞아. 천천히 해도 돼."',
    },
    'cool_clear-warm_grounded': {
      forA: '"네 방식이 맞아. 천천히 해도 돼."',
      forB: '"네가 명확하게 정리해줘서 나 편해. 고마워."',
    },
    'warm_grounded-nature': {
      forA: '"네 페이스로 해. 서두르지 않아도 돼."',
      forB: '"오늘도 수고했어. 네가 있어서 든든해."',
    },
    'nature-warm_grounded': {
      forA: '"오늘도 수고했어. 네가 있어서 든든해."',
      forB: '"네 페이스로 해. 서두르지 않아도 돼."',
    },
    'cool_clear-nature': {
      forA: '"네 페이스로 해. 서두르지 않아도 돼."',
      forB: '"네가 정리해준 방식이 맞아. 잘 됐어."',
    },
    'nature-cool_clear': {
      forA: '"네가 정리해준 방식이 맞아. 잘 됐어."',
      forB: '"네 페이스로 해. 서두르지 않아도 돼."',
    },
    'cool_clear-cool_clear': {
      forA: '"네 판단을 믿어. 잘 하고 있어."',
      forB: '"네가 정리한 방식이 맞아. 잘 됐어."',
    },
    'nature-cool_deep': {
      forA: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
      forB: '"그냥 옆에 있어줄게. 아무것도 안 해도 돼."',
    },
    'cool_deep-nature': {
      forA: '"그냥 옆에 있어줄게. 아무것도 안 해도 돼."',
      forB: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
    },
    'cool_deep-warm_grounded': {
      forA: '"네 방식이 맞아. 천천히 해도 돼."',
      forB: '"말 안 해도 괜찮아. 네 마음 알아."',
    },
    'nature-nature': {
      forA: '"그냥 옆에 있어줄게. 아무것도 안 해도 돼."',
      forB: '"그냥 옆에 있어줄게. 아무것도 안 해도 돼."',
    },
    'warm_active-warm_active': {
      forA: '"지금 많이 힘들지? 잠깐 쉬어도 괜찮아."',
      forB: '"오늘도 수고했어. 잠깐 쉬어도 돼."',
    },
    'warm_soft-warm_soft': {
      forA: '"네가 있어서 정말 다행이야. 고마워."',
      forB: '"네가 있어서 나 힘이 나. 오늘도 고마워."',
    },
    'cool_deep-cool_deep': {
      forA: '"말 안 해도 괜찮아. 네 마음 알아."',
      forB: '"말 안 해도 괜찮아. 그냥 옆에 있을게."',
    },
  };

  const key = `${fA}-${fB}`;
  const combo = neededByCombo[key];
  if (combo) return combo;

  // 기본 에너지별 표현
  const needed: Record<EnergyFamily, string> = {
    warm_active: '"지금 많이 힘들지? 잠깐 쉬어도 괜찮아."',
    warm_soft: '"네가 있어서 정말 다행이야. 고마워."',
    warm_grounded: '"네 방식이 맞아. 천천히 해도 돼."',
    cool_clear: '"네 판단을 믿어. 잘 하고 있어."',
    cool_deep: '"말 안 해도 괜찮아. 네 마음 알아."',
    nature: '"그냥 옆에 있어줄게. 아무것도 안 해도 돼."',
    neutral: '"네가 정리한 방식이 맞아. 잘 됐어."',
  };

  const baseNeeded = {
    forA: needed[fA],
    forB: needed[fB],
  };
  if (shapeCtxA && shapeCtxB) {
    return {
      forA: baseNeeded.forA + `\n(${shapeCtxA.affectionStyle} 마음을 전하는 것이 더 자연스럽습니다.)`,
      forB: baseNeeded.forB + `\n(${shapeCtxB.affectionStyle} 마음을 전하는 것이 더 자연스럽습니다.)`,
    };
  }
  return baseNeeded;
}

function buildCoupleRoutine(
  fA: EnergyFamily, fB: EnergyFamily,
  rel: RelationType,
  faithA: FaithType, faithB: FaithType,
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): CoupleRoutine {
  const isCouple = rel === '연인' || rel === '부부';
  const isFamilyOrClose = rel === '부모-자녀' || rel === '형제자매';

  // 함께하기 좋은 활동
  const activities = buildActivities(fA, fB, rel);

  // 추천 컬러
  const recommendedColors = buildRecommendedColors(fA, fB);

  // 감정 회복 루틴
  const emotionRecovery = buildEmotionRecovery(fA, fB, rel);

  // 대화 루틴
  const conversationRoutine = buildConversationRoutine(fA, fB, rel, shapeCtxA, shapeCtxB);

  // 함께 쉬는 방식
  const restTogether = buildRestTogether(fA, fB);

  // 정서적 연결 루틴
  const connectionRoutine = buildConnectionRoutine(fA, fB, faithA, faithB, shapeCtxA, shapeCtxB);

  // 애정 표현 루틴 (연인/부부)
  const affectionRoutine = isCouple
    ? buildAffectionRoutine(fA, fB, rel, shapeCtxA, shapeCtxB)
    : undefined;

  return {
    activities,
    recommendedColors,
    emotionRecovery,
    conversationRoutine,
    restTogether,
    connectionRoutine,
    affectionRoutine,
  };
}

function buildActivities(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string[] {
  const isCouple = rel === '연인' || rel === '부부';
  const isFriend = rel === '친구' || rel === '형제자매';
  const isColleague = rel === '동료';

  // 에너지 조합별 특화 활동 — 관계 유형별 분기
  const key = `${fA}-${fB}`;

  // ── 동료 관계 전용 활동 ──────────────────────────────────────────────
  if (isColleague) {
    const colleagueActivities: Partial<Record<string, string[]>> = {
      'warm_active-warm_active': [
        '점심 후 빠른 산책으로 기분 전환하기',
        '새로운 음식점 함께 탐방하기',
        '팀 프로젝트 아이디어 브레인스토밍하기',
        '퇴근 후 가벼운 운동이나 스트레칭 함께하기',
      ],
      'warm_active-cool_deep': [
        '점심 식사 후 짧은 산책하기',
        '업무 아이디어 브레인스토밍 후 조용히 정리하는 시간 갖기',
        '각자 집중 작업 후 짧은 대화로 연결하기',
        '퇴근 후 가벼운 음료 한 잔 나누기',
      ],
      'cool_deep-warm_active': [
        '조용한 공간에서 업무 아이디어 깊이 나누기',
        '각자 작업하며 같은 공간에 있기',
        '점심 식사 후 짧은 산책하기',
        '세미나나 강의 함께 참여하기',
      ],
      'warm_soft-cool_clear': [
        '점심 식사 후 가벼운 대화 나누기',
        '업무 피드백을 부드럽게 주고받기',
        '팀 회의 후 간식 나누며 소통하기',
        '서로의 강점을 인정하는 짧은 메모 남기기',
      ],
      'cool_clear-warm_soft': [
        '업무 피드백을 명확하게 주고받기',
        '팀 프로젝트 목표와 역할 명확히 정리하기',
        '팀 회의 후 간식 나누며 소통하기',
        '서로의 업무 방식을 인정하는 짧은 대화 나누기',
      ],
      'cool_deep-cool_deep': [
        '조용한 카페에서 각자 작업하거나 독서하기',
        '업무 관련 깊은 주제로 대화 나누기',
        '함께 세미나나 강의 참여하기',
        '점심 식사 후 조용히 산책하기',
      ],
      'warm_grounded-warm_grounded': [
        '점심 식사 함께하며 일상 이야기 나누기',
        '팀 회의 후 간식 나누기',
        '업무 외 짧은 대화로 관계 유지하기',
        '함께 프로젝트 마무리 후 소소한 축하하기',
      ],
    };
    const collegeAct = colleagueActivities[key] ?? colleagueActivities[`${fB}-${fA}`];
    if (collegeAct) return collegeAct.slice(0, 4);
    // 동료 기본 폴백
    return [
      '점심 식사 후 짧은 산책하기',
      '업무 외 가벼운 대화로 관계 유지하기',
      '팀 회의 후 간식 나누며 소통하기',
      '서로의 강점을 인정하는 짧은 대화 나누기',
    ];
  }

  // ── 친구 / 형제자매 관계 전용 활동 ──────────────────────────────────
  if (isFriend) {
    const friendActivities: Partial<Record<string, string[]>> = {
      'warm_active-warm_active': [
        '새로운 음식점 함께 탐방하기',
        '함께 운동하거나 스포츠 즐기기',
        '주말 당일치기 여행 계획하기',
        '공원에서 피크닉 즐기기',
      ],
      'warm_active-cool_deep': [
        '가벼운 산책 후 카페에서 대화 나누기',
        '새로운 음식점 함께 탐방하기',
        '함께 영화 보고 각자 느낀 점 나누기',
        '저녁 산책 후 따뜻한 음료 나누기',
      ],
      'cool_deep-warm_active': [
        '조용한 카페에서 깊은 주제로 대화 나누기',
        '전시회나 미술관 함께 방문하기',
        '함께 영화 보고 각자 느낀 점 나누기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
      'warm_soft-cool_clear': [
        '카페에서 차 한 잔 나누며 이야기하기',
        '꽃 시장이나 소품 가게 함께 구경하기',
        '감성적인 영화 보고 감상 나누기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
      'cool_clear-warm_soft': [
        '함께 보드게임이나 퍼즐 즐기기',
        '소품 가게나 서점 함께 구경하기',
        '카페에서 차 한 잔 나누며 이야기하기',
        '새로운 주제로 함께 공부하거나 강의 듣기',
      ],
      'cool_deep-cool_deep': [
        '조용한 카페에서 각자 독서하거나 작업하기',
        '전시회나 미술관 함께 방문하기',
        '깊은 주제로 대화하는 시간 갖기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
      'nature-nature': [
        '자연 속 산책 (공원, 숲길, 강변)',
        '식물 가꾸기나 정원 산책',
        '공원에서 피크닉 즐기기',
        '따뜻한 음료 마시며 조용한 시간 보내기',
      ],
      'warm_grounded-warm_grounded': [
        '단골 카페에서 차 나누기',
        '함께 영화 보거나 드라마 정주행하기',
        '함께 요리하거나 식사 준비하기',
        '가벼운 산책 후 식사 즐기기',
      ],
      'warm_soft-warm_soft': [
        '따뜻한 음료 마시며 서로의 이야기 나누기',
        '꽃 시장이나 소품 가게 함께 구경하기',
        '감성적인 영화 보고 감상 나누기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
    };
    const friendAct = friendActivities[key] ?? friendActivities[`${fB}-${fA}`];
    if (friendAct) return friendAct.slice(0, 4);
    // 친구/형제자매 기본 폴백
    const friendBase: string[] = [];
    if (fA === 'warm_active' || fB === 'warm_active') {
      friendBase.push('새로운 음식점 함께 탐방하기');
      friendBase.push('함께 운동하거나 스포츠 즐기기');
      friendBase.push('공원에서 피크닉 즐기기');
      friendBase.push('주말 당일치기 여행 계획하기');
    } else if (fA === 'cool_deep' || fB === 'cool_deep') {
      friendBase.push('조용한 카페에서 각자 독서하거나 작업하기');
      friendBase.push('전시회나 미술관 함께 방문하기');
      friendBase.push('서로의 플레이리스트 공유하고 음악 감상하기');
      friendBase.push('가벼운 산책 후 카페에서 대화 나누기');
    } else if (fA === 'nature' || fB === 'nature') {
      friendBase.push('자연 속 산책 (공원, 숲길, 강변)');
      friendBase.push('공원에서 피크닉 즐기기');
      friendBase.push('따뜻한 음료 마시며 조용한 시간 보내기');
      friendBase.push('식물 가꾸기나 정원 산책');
    } else {
      friendBase.push('카페에서 차 한 잔 나누며 이야기하기');
      friendBase.push('함께 보드게임이나 퍼즐 즐기기');
      friendBase.push('서로의 플레이리스트 공유하고 음악 감상하기');
      friendBase.push('가벼운 산책 후 식사 즐기기');
    }
    return friendBase.slice(0, 4);
  }

  // ── 연인 / 부부 관계 활동 (기존 comboActivities 유지) ────────────────
  const comboActivities: Partial<Record<string, string[]>> = {
    'warm_active-warm_active': [
      '함께 달리기나 자전거 타기',
      '새로운 음식점 탐방하기',
      '함께 운동하거나 스트레칭 루틴 만들기',
      '주말 드라이브나 당일치기 여행 계획하기',
    ],
    'warm_active-cool_deep': [
      '가벼운 산책 후 조용한 카페에서 대화 나누기',
      '함께 영화 보고 각자 느낀 점 나누기',
      '한 사람이 활동을 제안하고 다른 사람이 장소를 고르기',
      '드라이브하며 음악 함께 듣기',
    ],
    'cool_deep-warm_active': [
      '가벼운 산책 후 조용한 카페에서 대화 나누기',
      '함께 영화 보고 각자 느낀 점 나누기',
      '한 사람이 활동을 제안하고 다른 사람이 장소를 고르기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_soft-cool_clear': [
      '따뜻한 음료 마시며 서로의 이야기 나누기',
      '꽃 시장이나 소품 가게 함께 구경하기',
      '감성적인 영화 보고 감상 나누기',
      '함께 요리하거나 베이킹하기',
    ],
    'cool_clear-warm_soft': [
      '함께 요리하거나 식사 준비하기',
      '새로운 주제로 함께 공부하거나 강의 듣기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '조용한 카페에서 각자 작업하기',
    ],
    'cool_deep-cool_deep': [
      '조용한 카페에서 책 읽거나 각자 작업하기',
      '전시회나 미술관 함께 방문하기',
      '조용한 음악 틀어놓고 각자 하고 싶은 것 하기',
      '깊은 주제로 대화하는 시간 갖기',
    ],
    'nature-nature': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '식물 가꾸기나 정원 가꾸기',
      '함께 텃밭 가꾸거나 꽃 심기',
      '조용한 카페에서 차 한 잔 나누기',
    ],
    'nature-warm_active': [
      '자연 속 가벼운 하이킹이나 산책',
      '공원에서 피크닉 즐기기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 따뜻한 음료 나누기',
    ],
    'warm_active-nature': [
      '함께 달리기나 자전거 타기',
      '새로운 음식점 탐방 후 공원 산책하기',
      '드라이브하며 음악 함께 듣기',
      '주말 당일치기 여행 계획하기',
    ],
    'warm_grounded-warm_grounded': [
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
      '함께 영화 보거나 드라마 정주행하기',
      '주말 아침 함께 시장 보러 가기',
    ],
    'warm_soft-warm_soft': [
      '따뜻한 음료 마시며 서로의 이야기 나누기',
      '함께 요리하거나 베이킹하기',
      '꽃 시장이나 소품 가게 함께 구경하기',
      '감성적인 영화 보고 감상 나누기',
    ],
    'warm_active-warm_soft': [
      '가벼운 산책 후 따뜻한 카페에서 시간 보내기',
      '새로운 음식점 함께 탐방하기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 영화 보기',
    ],
    'warm_grounded-cool_deep': [
      '조용한 카페에서 각자 독서하거나 작업하기',
      '전시회나 미술관 함께 방문하기',
      '드라이브하며 음악 함께 듣기',
      '집에서 나란히 각자 하고 싶은 것 하기',
    ],
    'warm_grounded-cool_clear': [
      '집 근처 단골 카페에서 차 나누기',
      '주말 아침 함께 시장 보러 가기',
      '함께 영화 보거나 드라마 정주행하기',
      '새로운 주제로 함께 공부하거나 강의 듣기',
    ],
    'warm_soft-cool_deep': [
      '조용한 카페에서 각자 원하는 것 하기',
      '전시회나 미술관 함께 방문하기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_soft-warm_grounded': [
      '따뜻한 음료 마시며 서로의 이야기 나누기',
      '함께 요리하거나 브런치 즐기기',
      '집 근처 단골 카페에서 조용한 시간 보내기',
      '주말 아침 함께 시장 보러 가기',
    ],
    'cool_clear-cool_deep': [
      '조용한 카페에서 각자 작업하거나 독서하기',
      '전시회나 미술관 함께 방문하기',
      '깊은 주제로 대화하는 시간 갖기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
    ],
    'cool_clear-cool_clear': [
      '새로운 주제로 함께 공부하거나 강의 듣기',
      '조용한 카페에서 각자 작업하기',
      '서로의 관심사를 공유하고 대화하기',
      '함께 요리하거나 식사 준비하기',
    ],
    'nature-warm_soft': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '따뜻한 음료 마시며 조용한 시간 보내기',
      '식물 가꾸기나 정원 가꾸기',
      '함께 요리하거나 브런치 즐기기',
    ],
    'nature-cool_deep': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '조용한 카페에서 각자 원하는 것 하기',
      '전시회나 미술관 함께 방문하기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
    ],
    'nature-cool_clear': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '조용한 카페에서 각자 작업하거나 독서하기',
      '함께 요리하거나 식사 준비하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_grounded-warm_active': [
      '가벼운 산책 후 식사 즐기기',
      '주말 드라이브나 당일치기 여행 계획하기',
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
    ],
  };

  const activities = comboActivities[key] ?? comboActivities[`${fB}-${fA}`];
  if (activities) return activities.slice(0, 4);

  // 기본 활동 (연인/부부, 조합 미매핑 시) — 계열별 세분화
  const base: string[] = [];

  if (fA === 'warm_active' || fB === 'warm_active') {
    base.push('가벼운 산책이나 조깅 함께하기');
    base.push('새로운 음식점 함께 탐방하기');
    base.push('주말 드라이브나 당일치기 여행 계획하기');
    base.push('공원에서 피크닉 즐기기');
  } else if (fA === 'cool_deep' || fB === 'cool_deep') {
    base.push('조용한 카페에서 각자 독서하거나 작업하기');
    base.push('전시회나 미술관 함께 방문하기');
    base.push('서로의 플레이리스트 공유하고 음악 감상하기');
    base.push('드라이브하며 음악 함께 듣기');
  } else if (fA === 'cool_clear' || fB === 'cool_clear') {
    base.push('새로운 주제로 함께 공부하거나 강의 듣기');
    base.push('조용한 카페에서 차 한 잔 나누기');
    base.push('함께 요리하거나 식사 준비하기');
    base.push('서로의 관심사를 공유하고 대화하기');
  } else if (fA === 'nature' || fB === 'nature') {
    base.push('자연 속 산책 (공원, 숲길, 강변)');
    base.push('식물 가꾸기나 정원 가꾸기');
    base.push('따뜻한 음료 마시며 조용한 시간 보내기');
    base.push('함께 요리하거나 브런치 즐기기');
  } else if (fA === 'warm_soft' || fB === 'warm_soft') {
    base.push('따뜻한 음료 마시며 서로의 이야기 나누기');
    base.push('꽃 시장이나 소품 가게 함께 구경하기');
    base.push('감성적인 영화 보고 감상 나누기');
    base.push('함께 베이킹하거나 요리하기');
  } else {
    base.push('조용한 카페에서 차 한 잔 나누기');
    base.push('자연 속 산책 (공원, 숲길, 강변)');
    base.push('함께 요리하거나 식사 준비하기');
    base.push('드라이브하며 음악 함께 듣기');
  }
  return base.slice(0, 4);
}

function buildRecommendedColors(fA: EnergyFamily, fB: EnergyFamily): { id: string; korName: string; hex: string; reason: string }[] {
  // 에너지 조합별 콜러 추천 맵
  const key = `${fA}-${fB}`;
  const comboColors: Partial<Record<string, { id: string; korName: string; hex: string; reason: string }[]>> = {
    'warm_active-warm_active': [
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '빠른 에너지 속에서 조용한 안정과 휴식을 가져다줍니다.' },
      { id: 'teal', korName: '틸', hex: '#4AADA8', reason: '감정을 정화하고 두 사람 사이의 균형을 돌려줍니다.' },
    ],
    'warm_active-cool_deep': [
      { id: 'blue', korName: '블루', hex: '#5B8DB8', reason: '신뢰와 소통의 다리가 되어줍니다. 서로의 말을 진지하게 듣는 흙을 줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬을 자연스럽게 조율하는 데 도움을 줍니다.' },
    ],
    'cool_deep-warm_active': [
      { id: 'blue', korName: '블루', hex: '#5B8DB8', reason: '신뢰와 소통의 다리가 되어줍니다. 서로의 말을 진지하게 듣는 흙을 줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬을 자연스럽게 조율하는 데 도움을 줍니다.' },
    ],
    'warm_soft-cool_clear': [
      { id: 'mint', korName: '민트', hex: '#A8D8C8', reason: '감성과 이성이 자연스럽게 만나는 지점을 만들어줍니다.' },
      { id: 'cream', korName: '크림', hex: '#F5EDD6', reason: '두 사람 모두에게 편안하고 안정적인 공간을 만들어줍니다.' },
    ],
    'cool_clear-warm_soft': [
      { id: 'mint', korName: '민트', hex: '#A8D8C8', reason: '감성과 이성이 자연스럽게 만나는 지점을 만들어줍니다.' },
      { id: 'cream', korName: '크림', hex: '#F5EDD6', reason: '두 사람 모두에게 편안하고 안정적인 공간을 만들어줍니다.' },
    ],
    'cool_deep-cool_deep': [
      { id: 'white', korName: '화이트', hex: '#F8F8F8', reason: '정화와 비움의 힘으로 진심이 통하는 연결을 다시 시작하게 돕습니다.' },
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '깊은 내면에 조용한 안정과 따뜻한 연결을 가져다줍니다.' },
    ],
    'nature-nature': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '두 사람 사이에 자연스럽고 평온한 회복의 에너지를 채워줍니다.' },
      { id: 'cream', korName: '크림', hex: '#F5EDD6', reason: '조용하고 따뜻한 휴식의 에너지를 더해줍니다.' },
    ],
    'nature-warm_active': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '활동적인 에너지에 자연스럽고 평온한 균형을 더해줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬이 자연스럽게 어우러지도록 동료의 에너지를 줍니다.' },
    ],
    'warm_active-nature': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '활동적인 에너지에 자연스럽고 평온한 균형을 더해줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬이 자연스럽게 어우러지도록 동료의 에너지를 줍니다.' },
    ],
    'warm_grounded-warm_grounded': [
      { id: 'gold', korName: '골드', hex: '#D4A843', reason: '안정된 에너지에 따뜻한 자신감과 품격을 더해줍니다.' },
      { id: 'beige', korName: '베이지', hex: '#D4B896', reason: '일상의 편안함과 따뜻한 연결을 유지하는 데 도움을 줍니다.' },
    ],
  };

  const colors = comboColors[key] ?? comboColors[`${fB}-${fA}`];
  if (colors) return colors.slice(0, 2);

  // 기본 추천 (조합 미매핑 시)
  const result: { id: string; korName: string; hex: string; reason: string }[] = [];
  result.push({ id: 'green', korName: '그린', hex: '#8FA68E', reason: '두 사람 사이에 자연스럽고 평온한 회복의 에너지를 채워줍니다.' });
  if (fA === 'cool_deep' || fB === 'cool_deep' || fA === 'cool_clear' || fB === 'cool_clear') {
    result.push({ id: 'peach', korName: '피치', hex: '#F4A882', reason: '따뜻한 감정 연결과 부드러운 소통을 도와줍니다.' });
  } else if (fA === 'warm_active' || fB === 'warm_active') {
    result.push({ id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '빠른 흐름 속에서 조용한 안정을 찾아줍니다.' });
  } else {
    result.push({ id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '감정을 자연스럽게 정리하고 균형을 회복합니다.' });
  }
  return result.slice(0, 2);
}

function buildEmotionRecovery(fA: EnergyFamily, fB: EnergyFamily, rel?: RelationType): string {
  const key = `${fA}-${fB}`;
  const isColleague = rel === '동료';
  const isFriend = rel === '친구' || rel === '형제자매';
  const isParentChild = rel === '부모-자녀' || rel === '아빠-아들' || rel === '아빠-딸' || rel === '엄마-아들' || rel === '엄마-딸';

  // 에너지 조합 × 관계 유형 교차 분기 (동료/친구/부모자녀 특화)
  const crossMap: Partial<Record<string, string>> = {
    // 동료 전용
    'warm_active-cool_deep-동료': '한 사람이 빠르게 의견을 낼 때, 다른 사람은 충분히 생각한 후 말하는 편입니다. "왜 말이 없어요?"보다 "천천히 생각해보세요"가 더 좋은 협업 분위기를 만듭니다.',
    'warm_soft-cool_clear-동료': '한 사람은 관계 분위기를 먼저 살피고, 다른 사람은 업무 효율을 먼저 생각합니다. 이 차이를 이해하면 갈등 없이 서로의 강점을 활용할 수 있습니다.',
    'warm_active-warm_active-동료': '두 사람 모두 빠르게 움직이는 편입니다. 의견 충돌이 생겼을 때 잠깐 멈추고 "어떻게 생각해요?"라고 먼저 물어보는 것이 협업의 질을 높여줍니다.',
    'cool_deep-cool_deep-동료': '두 사람 모두 신중하고 깊이 생각하는 편입니다. 의견을 말하기 전에 충분히 정리하는 시간이 필요하다는 것을 서로 이해하면 더 좋은 결과가 나옵니다.',
    // 친구/형제자매 전용
    'warm_active-cool_deep-친구': '한 사람이 빠르게 반응할 때, 다른 사람은 조용히 정리하고 있을 수 있습니다. "왜 아무 말도 안 해?"보다 "말하고 싶을 때 들어줄게"가 더 좋은 우정을 만듭니다.',
    'warm_soft-cool_clear-친구': '한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 생각합니다. 이 차이를 알고 나면 서로에게 더 편안한 친구가 될 수 있습니다.',
    'warm_active-warm_active-친구': '두 사람 모두 감정이 빠르게 올라오는 편입니다. 감정이 올라왔을 때 잠깐 쉬고 "지금 좀 힘들어"라고 솔직하게 말하는 것이 우정을 더 깊게 만들어줍니다.',
    'cool_deep-cool_deep-친구': '두 사람 모두 감정을 안으로 담아두는 편입니다. 연락이 뜸해도 서로를 잊지 않는다는 것을 알고 있습니다. 가끔 "요즘 어때?"라는 짧은 연락이 두 사람의 거리를 좁혀줍니다.',
    // 부모-자녀 전용
    'warm_active-cool_deep-부모-자녀': '한 사람이 빠르게 표현할 때, 다른 사람은 충분히 정리한 후 말하는 편입니다. "왜 말이 없어?"보다 "말하고 싶을 때 들어줄게"가 두 사람 사이를 더 편안하게 만들어줍니다.',
    'warm_soft-cool_clear-부모-자녀': '한 사람은 감정으로, 다른 사람은 실질적인 해결로 마음을 전합니다. 이 차이를 이해하면 서로에게 더 자연스럽게 다가갈 수 있습니다.',
    'warm_active-warm_active-부모-자녀': '두 사람 모두 감정이 빠르게 올라오는 편입니다. 감정이 올라왔을 때 잠깐 멈추고 "지금 어떤 마음이야?"라고 먼저 물어보는 것이 회복의 시작입니다.',
    'cool_deep-cool_deep-부모-자녀': '두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 "요즘 어때?"라고 먼저 물어봐주세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 사람에게 가장 큰 위로가 됩니다.',
  };

  const relStr = rel ?? '';
  const crossKey = `${key}-${relStr}`;
  const crossKeyRev = `${fB}-${fA}-${relStr}`;
  const crossMsg = crossMap[crossKey] ?? crossMap[crossKeyRev];
  if (crossMsg) return crossMsg;

  // 에너지 조합별 기본 분기 (연인/부부 및 미분류)
  const recoveryMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '감정이 올라왔을 때 바로 해결하려 하지 마세요. 한 사람이 "지금 들어줄 수 있어?"라고 먼저 물어보세요. 준비된 공간에서 나누는 감정이 더 깊이 닿습니다. "왜 그래?"보다 "지금 어떤 마음이야?"가 더 좋습니다.',
    'cool_deep-warm_active': '한 사람이 조용히 있을 때, 다른 사람은 그 침묵을 거리두기로 오해하지 마세요. 침묵은 정리하는 시간입니다. 충분히 정리된 후 자연스럽게 나눌 수 있습니다. "왜 아무 말도 안 해?"보다 "말하고 싶을 때 들어줄게"가 더 좋습니다.',
    'warm_soft-cool_clear': '한 사람이 감정적으로 표현할 때, 다른 사람은 해결책을 제시하기 전에 먼저 공감해주세요. "어떻게 해"보다 "정말 힘들었겠다"가 먼저입니다. 공감을 충분히 받은 후에야 해결책이 마음에 닿습니다.',
    'cool_clear-warm_soft': '한 사람이 논리적으로 정리할 때, 다른 사람은 그 말이 차갑게 느껴질 수 있습니다. "왜 이렇게 차가워?"보다 "지금 어떤 마음으로 말하는 거야?"가 더 좋습니다. 명료한 언어 뒤에도 진심이 담겨 있습니다.',
    'warm_active-warm_active': '두 사람 모두 감정이 빠르게 올라오는 편입니다. 감정이 올라왔을 때 바로 해결하려 하지 말고, 잠깐 쉬어가는 시간을 먼저 가지세요. "지금 좋지 않아, 나중에 다시 얘기하자"라고 말하는 것이 두 사람 모두에게 회복의 시간을 줍니다.',
    'cool_deep-cool_deep': '두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 "지금 마음 어때?"라고 먼저 물어봐주세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 사람에게 가장 큰 위로가 됩니다.',
    'nature-nature': '두 사람 모두 감정을 부드럽게 흘려보내는 편입니다. 감정이 올라왔을 때 바로 해결하려 하지 말고, 같은 공간에서 조용히 쉬는 시간을 가져보세요. 스스로 회복되는 시간이 두 사람 모두에게 필요합니다.',
    'nature-warm_active': '한 사람이 조용히 있고 싶을 때, 다른 사람은 그 조용함을 존중해주세요. "왜 조용해?"보다 "편하게 있어, 시간 되면 말해"가 더 좋습니다.',
    'warm_active-nature': '한 사람이 빠르게 반응할 때, 다른 사람은 그 속도에 지칠 수 있습니다. 상대의 반응을 해석하기 전에 의도를 먼저 확인하는 것이 오해를 줄여줍니다.',
    'warm_grounded-warm_grounded': '두 사람 모두 안정적으로 감정을 다룹니다. 일상의 작은 인정 한 마디가 회복의 시작입니다. "오늘 네가 있어서 다행이었어" 같은 말이 두 사람의 정서를 따뜻하게 유지해줍니다.',
    'warm_soft-warm_soft': '두 사람 모두 따뜻하고 배려 깊지만, 감정을 표현하는 데 망설일 수 있습니다. "나 지금 조금 힘들어"라고 먼저 말하는 연습이 두 사람 모두에게 회복의 시작입니다.',
    // 동료 관계 에너지 조합 폴백
    'warm_grounded-cool_clear': isColleague
      ? '한 사람은 안정적인 방식으로, 다른 사람은 명확한 기준으로 일합니다. 서로의 업무 방식을 인정하면 갈등 없이 더 좋은 결과를 만들 수 있습니다.'
      : '한 사람은 안정적인 방식으로, 다른 사람은 명확하게 표현하는 방식으로 관계를 이어갑니다. 서로의 방식을 인정하는 것이 회복의 시작입니다.',
    'nature-cool_clear': isColleague
      ? '한 사람은 자신의 리듬으로, 다른 사람은 명확한 기준으로 일합니다. 서로의 업무 속도를 존중하면 더 자연스러운 협업이 가능합니다.'
      : '한 사람은 자신의 리듬을 지키고, 다른 사람은 명확하게 정리하는 방식으로 관계를 이어갑니다. 서로의 방식을 존중하는 것이 편안한 관계를 만듭니다.',
    // 친구/형제자매 관계 에너지 조합 폴백
    'warm_grounded-warm_soft': isFriend
      ? '두 사람 모두 안정적이고 따뜻한 방식으로 관계를 이어갑니다. 가끔 "요즘 어때?"라는 짧은 연락이 두 사람의 우정을 더 따뜻하게 유지해줍니다.'
      : '두 사람 모두 안정적이고 따뜻한 방식으로 관계를 이어갑니다. 서로를 향한 마음이 많으니, 그 마음을 조금 더 자주 표현해보세요.',
    'nature-warm_soft': isFriend
      ? '한 사람은 자신의 리듬으로, 다른 사람은 따뜻한 배려로 관계를 이어갑니다. 억지로 맞추려 하지 않아도 편안한 우정이 두 사람의 강점입니다.'
      : '한 사람은 자신의 리듬으로, 다른 사람은 따뜻한 배려로 관계를 이어갑니다. 서로의 방식을 존중하는 것이 편안한 관계를 만듭니다.',
    // 부모-자녀 관계 에너지 조합 폴백
    'warm_grounded-cool_deep': isParentChild
      ? '한 사람은 안정적인 일상으로, 다른 사람은 깊이 생각하는 방식으로 마음을 전합니다. 서로의 방식을 이해하면 더 자연스러운 대화가 가능합니다.'
      : '한 사람은 안정적인 방식으로, 다른 사람은 깊이 느끼는 방식으로 관계를 이어갑니다. 서로의 방식을 존중하는 것이 회복의 시작입니다.',
    'warm_soft-warm_active': isParentChild
      ? '한 사람은 따뜻하게 배려하고, 다른 사람은 빠르게 반응하는 편입니다. 서로의 속도가 다르다는 것을 이해하면 더 편안한 대화가 가능합니다.'
      : '한 사람은 따뜻하게 배려하고, 다른 사람은 빠르게 반응하는 편입니다. 서로의 속도를 존중하는 것이 관계를 편안하게 만들어줍니다.',
  };

  const recovery = recoveryMap[key] ?? recoveryMap[`${fB}-${fA}`];
  if (recovery) return typeof recovery === 'string' ? recovery : recovery;

  // 관계 유형별 폴백 (에너지 조합 미매핑 시)
  if (isColleague) {
    return '의견 차이가 생겼을 때 "어떻게 생각해요?"라고 먼저 물어보세요. 서로의 관점을 확인하는 것이 갈등을 줄이고 협업을 더 자연스럽게 만들어줍니다.';
  }
  if (isFriend) {
    return '감정이 올라왔을 때 바로 해결하려 하기보다, "요즘 어때?"라고 먼저 물어보는 것이 회복의 시작입니다. 가장 가까운 사이일수록 솔직하게 말하는 연습이 필요합니다.';
  }
  if (isParentChild) {
    return '판단이나 조언 없이 "요즘 어때?"라고 먼저 물어보세요. 답을 기다리는 것이 아니라, 함께 있는 시간 자체가 이미 충분한 회복입니다.';
  }
  return '감정이 올라왔을 때 바로 해결하려 하기보다, 먼저 "지금 어떤 마음이야?"라고 물어보는 것이 회복의 시작입니다. 판단 없이 듣는 것이 가장 큰 위로가 됩니다.';
}

function buildConversationRoutine(
  fA: EnergyFamily, fB: EnergyFamily, rel: RelationType,
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): string {
  // 도형별 대화 스타일 보완
  const shapeConvNote = (shapeCtxA && shapeCtxB && shapeCtxA.conversationStyle !== shapeCtxB.conversationStyle)
    ? `\n한 분에게는 ${shapeCtxA.conversationStyle} 더 편안하고, 다른 분에게는 ${shapeCtxB.conversationStyle} 더 자연스럽습니다.`
    : shapeCtxA
      ? `\n${shapeCtxA.conversationStyle} 두 분 사이를 더 가깝게 만들어줍니다.`
      : '';
  const key = `${fA}-${fB}`;
  // 에너지 조합별 대화 루틴 (연인/부부 전용)
  const comboConversation: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '하루 중 가장 기억에 남는 순간 하나씩 나눠보세요. 한 분은 바로 이야기하고, 다른 분은 조금 정리한 후 말하는 편입니다. 그 속도 차이를 인정하면 두 분의 대화가 더 자연스럽게 이어집니다.',
    'cool_deep-warm_active': '오늘 있었던 일 중 "가장 힘들었던 것"과 "가장 좋았던 것" 하나씩 나눠보세요. 깊이 생각하는 분과 빠르게 표현하는 분이 만나는 지점에서 두 분의 대화가 가장 진솔해집니다.',
    'warm_active-warm_active': '하루 중 5분, 오늘 있었던 일 중 "가장 지쳤던 순간과 가장 좋았던 순간"을 하나씩 나눠보세요. 두 분 모두 에너지가 높을 때는 서로를 쉽게 해주는 작은 대화가 관계의 온도를 유지해줍니다.',
    'cool_deep-cool_deep': '오늘 있었던 일 중 인상에 남는 것 하나씩 나눠보세요. 깊은 이야기가 아니어도 괜찮습니다. 일상의 작은 조각을 공유하는 것이 두 분의 대화를 가장 자연스럽게 이어줍니다.',
    'warm_soft-cool_clear': '하루 중 "오늘 가장 기억나는 순간"을 하나씩 나눠보세요. 한 분은 감정 중심으로, 다른 분은 사실 중심으로 이야기하는 편입니다. 그 차이가 두 분의 대화를 더 풍성하게 만들어줍니다.',
    'cool_clear-warm_soft': '오늘 있었던 일 중 "잘 됐다고 느낀 것"과 "아쉬웠던 것" 하나씩 나눠보세요. 명료하게 정리하는 분과 감정으로 받아들이는 분이 만나는 대화가 두 분 사이를 더 가깝게 만들어줍니다.',
    'nature-nature': '오늘 있었던 일 중 기억에 남는 것 하나씩 나눠보세요. 말이 많지 않아도 괜찮습니다. 짧게 나누는 일상 이야기가 두 분의 연결을 자연스럽게 유지해줍니다.',
    'nature-warm_active': '오늘 있었던 일 중 "가장 기억나는 순간"을 나눠보세요. 한 분은 바로 이야기하고, 다른 분은 조용히 받아들이는 편입니다. 그 속도 차이를 인정하면 두 분의 대화가 더 편안해집니다.',
    'warm_active-nature': '하루 중 "잘 됐다고 느낀 것"과 "힘들었던 것" 하나씩 나눠보세요. 한 분은 빠르게 표현하고, 다른 분은 천천히 받아들이는 편입니다. 그 리듬 차이가 두 분의 대화를 더 풍성하게 만들어줍니다.',
    'warm_grounded-warm_grounded': '저녁 식사 후 짧게 "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 일상 속 작은 대화가 두 분의 정서적 연결을 유지해줍니다.',
    'warm_soft-warm_soft': '오늘 있었던 일 중 "가장 따뜻했던 순간"을 하나씩 나눠보세요. 서로를 위하는 마음이 많으니, 그 마음을 일상의 이야기로 조금 더 자주 나눠보세요.',
    'warm_active-warm_soft': '하루 중 "가장 기억나는 순간"과 "힘들었던 순간" 하나씩 나눠보세요. 한 분은 바로 이야기하고, 다른 분은 천천히 배려하며 받아들이는 편입니다. 그 차이가 두 분의 대화를 더 따뜻하게 만들어줍니다.',
    'warm_soft-warm_active': '오늘 있었던 일 중 "잘 됐다고 느낀 것"을 하나씩 나눠보세요. 배려하며 듣는 분과 바로 표현하는 분이 만나는 대화가 두 분 사이를 가장 따뜻하게 이어줍니다.',
    'warm_grounded-cool_deep': '오늘 있었던 일 중 "가장 인상 깊었던 것"을 하나씩 나눠보세요. 일상의 이야기를 꾸준히 나누다 보면 내면의 이야기도 자연스럽게 열립니다.',
    'cool_deep-warm_grounded': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 깊이 생각하는 분의 이야기를 일상의 안정감 위에서 천천히 들어주는 것이 두 분의 대화를 가장 편안하게 만들어줍니다.',
    'warm_active-cool_clear': '오늘 있었던 일 중 "잘 됐다고 느낀 것"과 "아쉬웠던 것" 하나씩 나눠보세요. 빠르게 표현하는 분과 명료하게 정리하는 분이 만나는 대화가 두 분의 관계를 더 단단하게 만들어줍니다.',
    'cool_clear-warm_active': '하루 중 "가장 기억나는 순간"을 하나씩 나눠보세요. 명료하게 정리하는 분과 빠르게 표현하는 분이 만나는 대화가 두 분의 관계를 더 단단하게 만들어줍니다.',
    'cool_clear-cool_deep': '오늘 있었던 일 중 "가장 인상 깊었던 것"을 하나씩 나눠보세요. 명료하게 정리하는 분과 깊이 생각하는 분이 만나는 대화가 두 분 사이를 더 단단하게 이어줍니다.',
    'cool_deep-cool_clear': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 깊이 생각하는 분과 명료하게 정리하는 분이 만나는 대화가 두 분 사이를 더 단단하게 이어줍니다.',
    'warm_grounded-warm_soft': '오늘 있었던 일 중 "가장 따뜻했던 순간"을 하나씩 나눠보세요. 안정적인 일상 위에 따뜻한 감성이 더해질 때 두 분의 대화가 가장 풍성해집니다.',
    'warm_soft-warm_grounded': '하루 중 "가장 기억나는 순간"을 하나씩 나눠보세요. 따뜻한 감성과 안정적인 일상이 만나는 대화가 두 분 사이를 더 편안하게 만들어줍니다.',
    'warm_grounded-cool_clear': '오늘 있었던 일 중 "잘 됐다고 느낀 것"과 "아쉬웠던 것" 하나씩 나눠보세요. 일상의 안정감과 명료한 표현이 만날 때 두 분의 대화가 가장 효율적이고 편안해집니다.',
    'cool_clear-warm_grounded': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 명료하게 정리하는 분과 안정적으로 받아들이는 분이 만나는 대화가 두 분 사이를 더 편안하게 만들어줍니다.',
    'nature-cool_deep': '오늘 있었던 일 중 인상에 남는 것 하나씩 나눠보세요. 두 분 모두 말이 많지 않은 편이지만, 짧게 나누는 일상 이야기가 두 분의 연결을 자연스럽게 유지해줍니다.',
    'cool_deep-nature': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 깊이 생각하는 분과 자연스럽게 있는 분이 만나는 대화가 두 분 사이를 더 편안하게 이어줍니다.',
    'nature-warm_soft': '오늘 있었던 일 중 "가장 따뜻했던 순간"을 하나씩 나눠보세요. 조용한 존재감과 따뜻한 배려가 만나는 대화가 두 분 사이를 가장 편안하게 이어줍니다.',
    'warm_soft-nature': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 따뜻하게 배려하는 분과 자연스럽게 있는 분이 만나는 대화가 두 분 사이를 가장 편안하게 이어줍니다.',
    'nature-cool_clear': '오늘 있었던 일 중 "잘 됐다고 느낀 것"을 하나씩 나눠보세요. 조용한 존재감과 명료한 표현이 만나는 대화가 두 분 사이를 더 단단하게 만들어줍니다.',
    'cool_clear-nature': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 명료하게 정리하는 분과 자연스럽게 있는 분이 만나는 대화가 두 분 사이를 더 단단하게 만들어줍니다.',
    'warm_grounded-nature': '오늘 있었던 일 중 "가장 따뜻했던 순간"을 하나씩 나눠보세요. 안정적인 일상과 조용한 존재감이 만나는 대화가 두 분 사이를 가장 편안하게 이어줍니다.',
    'nature-warm_grounded': '하루 중 "가장 기억나는 순간"을 짧게 나눠보세요. 조용한 존재감과 안정적인 일상이 만나는 대화가 두 분 사이를 가장 편안하게 이어줍니다.',
  };

  // 연인/부부인 경우 에너지 조합별 대화 루틴 우선
  if (rel === '연인' || rel === '부부') {
    const combo = comboConversation[key] ?? comboConversation[`${fB}-${fA}`];
    if (combo) return combo;
  }

  const routineMap: Partial<Record<RelationType, string>> = {
    '연인': '하루 중 5~10분, 오늘 있었던 일 중 "가장 기억나는 순간"과 "힘들었던 순간" 하나씩 나눠보세요. 문제 해결보다 일상 공유가 먼저입니다. 그 습관이 관계의 온도를 유지해줍니다.',
    '부부': '저녁 식사 후 짧게 "오늘 있었던 일 중 가장 기억나는 것" 하나씩 나눠보세요. 오래된 관계일수록 일상의 작은 이야기가 정서적 연결을 유지해줍니다.',
    '부모-자녀': '"오늘 어땠어?" 한 마디로 시작해보세요. 답을 기대하기보다 일상을 함께 나누는 시간 자체가 대화의 시작입니다.',
    '형제자매': '"요즘 어떻게 지내?" 짧은 연락 하나가 가장 가까운 사이를 더 가깝게 만들어줍니다. 특별한 이유 없이 일상을 나누는 것이 관계를 유지하는 가장 좋은 방법입니다.',
    '친구': '"요즘 뭐 하고 지내?" 가볍게 일상을 묻는 것이 우정을 유지하는 가장 간단한 방법입니다. 깊은 대화보다 자주 일상을 나누는 것이 더 중요합니다.',
    '동료': '"오늘 점심 뭐 드셨어요?" 같은 가벼운 일상 대화가 함께 일하는 관계를 더 편안하게 만들어줍니다.',
  };
  const baseConv = routineMap[rel] ?? '서로에게 "요즘 어때?"라고 먼저 물어보는 것이 관계를 유지하는 가장 간단한 방법입니다.';
  return baseConv + (shapeConvNote ?? '');
}

function buildRestTogether(fA: EnergyFamily, fB: EnergyFamily): string {
  const key = `${fA}-${fB}`;
  const restMap: Partial<Record<string, string>> = {
    'cool_deep-cool_deep': '같은 공간에서 각자 하고 싶은 것을 하는 "함께하는 혼자 시간"이 두 사람 모두에게 회복입니다. 책을 읽거나 음악을 들으며 말 없이 함께 있는 것만으로도 충분한 연결이 됩니다.',
    'warm_active-warm_active': '두 사람 모두 지쳐있을 때는 서로에게 아무것도 요구하지 않는 시간이 더 큰 사랑입니다. 함께 가볍게 몸을 움직이거나, 각자 하고 싶은 것을 하며 같은 공간에 있어보세요.',
    'warm_active-cool_deep': '한 사람은 몸을 움직이며 기분을 전환하고, 다른 사람은 조용히 내면을 정리하며 회복됩니다. 각자의 방식으로 쉰 후 다시 만나는 것이 두 사람 모두에게 자연스러운 충전입니다.',
    'cool_deep-warm_active': '한 사람은 조용히 내면을 정리하고, 다른 사람은 몸을 움직이며 기분을 전환합니다. 각자의 방식으로 쉰 후 다시 만나는 것이 두 사람 모두에게 자연스러운 충전입니다.',
    'warm_soft-warm_soft': '서로의 이야기를 판단 없이 들어주는 시간이 두 사람 모두에게 가장 깊은 회복입니다. 따뜻한 음료를 나누거나 좋아하는 음악을 틀어놓고 나란히 앉아있는 것만으로도 충분합니다. 서로를 위하는 마음이 많으니, 이제는 자신에게도 그 따뜻함을 돌려주세요.',
    'nature-nature': '자연 속에서 함께 조용히 있는 시간이 두 사람 모두에게 가장 자연스러운 회복입니다. 공원 산책이나 창가에서 바깥을 바라보는 것만으로도 두 사람은 서로 가까워질 수 있습니다.',
    'warm_grounded-warm_grounded': '두 사람 모두 일상의 루틴 속에서 가장 편안함을 느낍니다. 함께 저녁을 준비하거나 좋아하는 드라마를 보며 나란히 앉아있는 시간, 그 평범한 반복이 두 사람의 관계를 단단하게 만들어줍니다.',
    'cool_clear-cool_clear': '각자 하고 싶은 것을 하면서 같은 공간에 있는 것이 두 사람 모두에게 편안한 회복입니다. 책을 읽거나 각자의 작업을 하며 나란히 있는 것, 서로에게 아무것도 요구하지 않는 그 시간이 가장 큰 신뢰의 표현입니다.',
    'warm_soft-cool_clear': '한 사람은 감성적인 대화로, 다른 사람은 조용히 자기 방식으로 쉽니다. 서로의 휴식 방식이 다르다는 것을 인정하는 것이 두 사람 모두에게 회복의 시작입니다.',
    'cool_clear-warm_soft': '한 사람은 조용히 정리하며, 다른 사람은 감성적인 방식으로 쉽니다. 서로의 회복 방식을 존중해주는 것이 두 사람 모두에게 편안한 시간을 만들어줍니다.',
    'warm_active-warm_soft': '한 사람은 가볍게 움직이며 기분을 전환하고, 다른 사람은 따뜻한 대화와 연결로 회복됩니다. 두 방식이 번갈아 존중될 때 두 사람 모두 충전됩니다.',
    'warm_soft-warm_active': '한 사람은 따뜻한 연결로, 다른 사람은 몸을 움직이며 기분을 전환합니다. 서로의 방식을 번갈아 맞춰주는 것이 두 사람 모두에게 회복입니다.',
    'warm_grounded-cool_deep': '한 사람은 일상의 루틴 속에서, 다른 사람은 조용히 혼자 생각을 정리하며 회복됩니다. 각자의 방식을 강요하지 않는 것이 두 사람에게 가장 편안한 쉼입니다.',
    'cool_deep-warm_grounded': '한 사람은 조용히 내면을 정리하고, 다른 사람은 일상의 안정 속에서 회복됩니다. 서로의 회복 속도를 존중하는 것이 두 사람의 관계를 더 단단하게 만들어줍니다.',
    'warm_active-warm_grounded': '한 사람은 활발하게 움직이며, 다른 사람은 안정된 일상 속에서 회복됩니다. 가끔 함께 새로운 장소를 다녀오거나, 집에서 나란히 각자의 시간을 보내는 것이 두 사람 모두에게 충전이 됩니다.',
    'warm_active-cool_clear': '한 사람은 움직이며 기분을 전환하고, 다른 사람은 혼자 생각을 정리하며 회복됩니다. 각자의 방식으로 쉰 후 다시 만나는 것이 두 사람 모두에게 자연스러운 회복입니다.',
    'nature-warm_soft': '한 사람은 조용한 자연 속에서, 다른 사람은 따뜻한 연결과 대화 속에서 회복됩니다. 공원을 함께 걸으며 가볍게 이야기 나누는 것이 두 사람 모두에게 좋은 회복 방식입니다.',
    'nature-cool_deep': '두 사람 모두 조용히 자신만의 방식으로 회복되는 편입니다. 같은 공간에서 각자 책을 읽거나 음악을 들으며 말 없이 함께 있는 것이 두 사람에게 가장 자연스러운 쉼입니다.',
    'nature-cool_clear': '한 사람은 자연 속에서, 다른 사람은 혼자 생각을 정리하며 회복됩니다. 가끔 공원을 함께 산책하며 각자의 생각을 나누는 것이 두 사람 모두에게 좋은 회복 방식입니다.',
    'warm_grounded-warm_soft': '두 사람 모두 따뜻하고 안정적인 방식으로 회복됩니다. 함께 요리하거나, 좋아하는 공간에서 나란히 쉬는 시간이 두 사람 모두에게 충전이 됩니다.',
    'warm_grounded-cool_clear': '한 사람은 일상의 루틴 속에서, 다른 사람은 혼자 생각을 정리하며 회복됩니다. 저녁에 각자 하고 싶은 것을 하면서 같은 공간에 있는 것이 두 사람 모두에게 편안한 쉼입니다.',
    'warm_grounded-nature': '두 사람 모두 조용하고 안정적인 방식으로 회복됩니다. 집 근처 공원을 함께 걷거나, 집에서 나란히 각자의 시간을 보내는 것이 두 사람 모두에게 자연스러운 쉼입니다.',
    'cool_clear-cool_deep': '두 사람 모두 조용히 혼자 정리하는 방식으로 회복됩니다. 같은 공간에서 각자 하고 싶은 것을 하며 말 없이 함께 있는 것이 두 사람 모두에게 편안한 회복입니다.',
    'cool_clear-nature': '한 사람은 혼자 생각을 정리하며, 다른 사람은 자연 속에서 회복됩니다. 가끔 함께 공원을 산책하거나, 집에서 각자 하고 싶은 것을 하며 나란히 있는 것이 두 사람 모두에게 좋은 쉼입니다.',
  };

  const rest = restMap[key] ?? restMap[`${fB}-${fA}`];
  if (rest) return rest;

  // 계열별 폴백 — 컬러 특성 반영
  if (fA === 'cool_deep' || fB === 'cool_deep') {
    return '같은 공간에서 각자 하고 싶은 것을 하는 "함께하는 혼자 시간"이 두 사람 모두에게 회복입니다. 책을 읽거나 음악을 들으며 말 없이 함께 있는 것만으로도 충분한 연결이 됩니다.';
  }
  if (fA === 'warm_active' || fB === 'warm_active') {
    return '함께 가볍게 몸을 움직이거나 새로운 장소를 다녀보는 것이 두 사람의 기분을 자연스럽게 전환시켜줍니다. 움직이면서 나누는 대화가 더 편안하게 느껴질 수 있습니다.';
  }
  if (fA === 'nature' || fB === 'nature') {
    return '자연 속에서 함께 조용히 있는 시간이 두 사람에게 가장 자연스러운 회복입니다. 공원 산책이나 창가에서 바깥을 바라보는 것만으로도 편안함을 느낄 수 있습니다.';
  }
  if (fA === 'warm_soft' || fB === 'warm_soft') {
    return '서로의 이야기를 판단 없이 들어주는 시간이 두 사람 모두에게 가장 깊은 회복입니다. 따뜻한 공간에서 나란히 앉아 각자의 감정을 나눠보세요.';
  }
  if (fA === 'cool_clear' || fB === 'cool_clear') {
    return '각자 하고 싶은 것을 하면서 같은 공간에 있는 것이 두 사람 모두에게 편안한 회복입니다. 서로에게 아무것도 요구하지 않는 시간이 가장 큰 신뢰의 표현입니다.';
  }
  return '서로에게 아무것도 요구하지 않는 조용한 시간을 가져보세요. 나란히 앉아 각자의 방식으로 쉬는 것, 그 공간 안에서 두 사람의 관계가 자연스럽게 회복됩니다.';
}

function buildConnectionRoutine(
  fA: EnergyFamily,
  fB: EnergyFamily,
  faithA: FaithType,
  faithB: FaithType,
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): string {
  const hasFaith = faithA === '기독교' || faithB === '기독교';
  // 도형별 정서 연결 보완
  const shapeConnNote = (shapeCtxA && shapeCtxB)
    ? `\n한 분은 ${shapeCtxA.recoveryTrait}. 다른 분은 ${shapeCtxB.recoveryTrait}. 서로의 회복 방식을 먼저 인정해주는 것이 가장 깊은 연결입니다.`
    : shapeCtxA
      ? `\n${shapeCtxA.recoveryTrait}. 이 점을 서로 인식하는 것이 정서 연결의 시작입니다.`
      : '';

  // 에너지 조합별 연결 루틴
  const key = `${fA}-${fB}`;
  const connectionMap: Partial<Record<string, string>> = {
    'warm_active-warm_active': '"오늘 마음은 어땠어?" 한 마디로 시작해보세요. 두 분 모두 빠르게 달려오는 사람들이라, 감정을 잠깐 꺼내놓는 시간이 필요합니다. 해결보다 먼저 들어주는 것이 두 분의 연결을 더 깊게 만들어줍니다.',
    'warm_active-cool_deep': '"오늘 마음은 어땠어?"라고 먼저 물어보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 분 사이의 가장 깊은 연결입니다. 감정을 먼저 공감하고, 해결은 그 다음입니다.',
    'cool_deep-warm_active': '"지금 어떤 감정이야?"라고 먼저 물어보세요. 조용히 있는 분의 감정을 해석하기 전에 먼저 확인하는 것이 중요합니다. 말하고 싶을 때 들어줄 수 있다는 신호가 두 분의 연결을 더 안전하게 만들어줍니다.',
    'warm_soft-cool_clear': '"오늘 마음은 어땠어?"라고 먼저 물어보세요. 따뜻한 분에게는 공감이 먼저이고, 명료한 분에게는 감정을 인정받는 것이 먼저입니다. 해결책보다 "정말 힘들었겠다"가 먼저입니다.',
    'cool_clear-warm_soft': '"지금 어떤 감정이야?"라고 먼저 물어보세요. 명료하게 정리하기 전에 감정을 먼저 확인해주세요. 따뜻한 분에게는 공감이 먼저 닿습니다. 해결보다 들어주기가 먼저입니다.',
    'cool_deep-cool_deep': '"지금 마음 어때?"라는 짧은 질문이 두 분의 거리를 좁혀줍니다. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주세요. 같은 공간에서 조용히 있는 것만으로도 충분한 감정 연결이 됩니다.',
    'nature-nature': '"오늘 마음은 어땠어?" 가끔 이 한 마디가 두 분의 감정 연결을 더 따뜻하게 만들어줍니다. 함께 편안히 있는 것만으로도 충분하지만, 감정을 짧게 나누는 시간이 두 분 사이를 더 깊게 이어줍니다.',
    'nature-warm_active': '"지금 어떤 감정이야?"라고 먼저 물어보세요. 조용한 분의 감정을 해석하기 전에 먼저 확인하는 것이 중요합니다. 감정을 먼저 공감하고, 해결은 그 다음입니다.',
    'warm_active-nature': '"오늘 마음은 어땠어?"라고 먼저 물어보세요. 빠르게 반응하기 전에 상대의 감정을 먼저 확인해주세요. 말하고 싶을 때 들어줄 수 있다는 신호가 두 분의 연결을 더 안전하게 만들어줍니다.',
    'warm_grounded-warm_grounded': '"오늘 마음은 어땠어?" 일상 속에서 감정을 짧게 확인하는 습관이 두 분의 정서적 연결을 유지해줍니다. "오늘 네가 있어서 다행이었어" 같은 감정 표현이 두 분 사이를 따뜻하게 유지해줍니다.',
  };

  const routine = connectionMap[key] ?? connectionMap[`${fB}-${fA}`];
  if (routine) {
    if (hasFaith) return routine + ' 함께 짧은 감사를 나누는 시간이 정서적 연결을 더 깊게 만들어줍니다.';
    return routine;
  }

  if (hasFaith) {
    return '함께 짧은 감사 기도를 나누거나, 오늘 하루 감사한 것 하나씩 말해보세요. 같은 방향을 바라보는 시간이 정서적 연결을 깊게 만들어줍니다.';
  }
  return '"오늘 마음은 어땠어?" 한 마디로 시작해보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 가장 큰 감정 연결입니다. 해결보다 공감이 먼저입니다.';
}

/**
 * 관계 유형별 신체 접촉 표현 → 비연인 관계에서는 공감/대화 표현으로 변환
 * 향후 확장 가능한 구조: 연인/부부/친구/가족/동료 각각 다른 톤 적용
 */
function getConnectionByRelType(rel: RelationType): {
  physicalTouch: string;    // 스킨십/포옹 대체 표현
  warmGreeting: string;     // 따뜻한 인사 방식
  closingGesture: string;   // 마무리 연결 표현
} {
  const isCouple = rel === '연인' || rel === '부부';
  if (isCouple) {
    return {
      physicalTouch: '짧은 포옹과 따뜻한 스킨십으로',
      warmGreeting: '안아주거나 손잡으며',
      closingGesture: '스킨십과 말이 함께할 때',
    };
  }
  if (rel === '아빠-아들' || rel === '아빠-딸') {
    return {
      physicalTouch: '따뜻한 대화와 진심어린 공감으로',
      warmGreeting: '짧게 안부를 묻거나 함께 시간을 보내며',
      closingGesture: '말과 이해가 함께할 때',
    };
  }
  if (rel === '엄마-아들' || rel === '엄마-딸') {
    return {
      physicalTouch: '따뜻한 대화와 세심한 공감으로',
      warmGreeting: '짧게 안부를 묻거나 함께 시간을 보내며',
      closingGesture: '말과 마음이 함께할 때',
    };
  }
  if (rel === '부모-자녀' || rel === '형제자매') {
    return {
      physicalTouch: '따뜻한 대화와 공감으로',
      warmGreeting: '짧게 안부를 묻거나 어깨를 두드리며',
      closingGesture: '말과 마음이 함께할 때',
    };
  }
  if (rel === '동료') {
    return {
      physicalTouch: '편안한 대화와 연결로',
      warmGreeting: '짧게 안부를 묻거나 짧은 대화로',
      closingGesture: '말과 신뢰가 함께할 때',
    };
  }
  // 친구 및 기타
  return {
    physicalTouch: '따뜻한 말과 함께하는 시간으로',
    warmGreeting: '짧게 안부를 묻거나 짧은 연락으로',
    closingGesture: '말과 공감이 함께할 때',
  };
}

function buildAffectionRoutine(
  fA: EnergyFamily, fB: EnergyFamily, rel: RelationType = '연인',
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): string {
  const isCouple = rel === '연인' || rel === '부부';
  // 도형별 애정 표현 보완
  const shapeAffNote = (shapeCtxA && shapeCtxB && shapeCtxA.affectionStyle !== shapeCtxB.affectionStyle)
    ? isCouple
      ? `\n한 분은 ${shapeCtxA.affectionStyle} 마음이 전해집니다. 다른 분은 ${shapeCtxB.affectionStyle} 사랑을 느낍니다. 서로의 방식으로 한 번씩 먼저 다가가보세요.`
      : `\n한 분은 ${shapeCtxA.affectionStyle} 연결되고, 다른 분은 ${shapeCtxB.affectionStyle} 가까워집니다.`
    : shapeCtxA
      ? `\n${shapeCtxA.affectionStyle} 마음을 전하는 것이 가장 자연스럽습니다.`
      : '';
  const connTone = getConnectionByRelType(rel);
  const key = `${fA}-${fB}`;
  const comboAffection: Partial<Record<string, string>> = {
    'warm_active-warm_active': isCouple
      ? '아침에 짧게 안아주거나 "오늘도 파이팅" 한마디로 하루를 열어보세요. 저녁에는 "오늘도 수고했어", "네가 있어서 좋아" 같은 짧은 칭찬으로 마무리해보세요.'
      : '"오늘도 파이팅", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 가깝게 만들어줍니다.',
    'warm_active-cool_deep': isCouple
      ? '아침에 짧게 안아주거나 "오늘도 고마워" 한마디로 하루를 열어보세요. 빠르게 표현하는 분이 먼저 다가가면, 깊은 내면을 가진 분도 마음이 열립니다. 말보다 먼저 몸으로 전달되는 따뜻함이 있습니다.'
      : '"오늘도 고마워", "네가 있어서 든든해" 같은 짧은 표현이 두 분 사이를 더 가깝게 만들어줍니다.',
    'cool_deep-warm_active': isCouple
      ? '"말 안 해도 네 마음 알아" 같은 짧은 한 마디가 깊이 닿습니다. 눈을 맞추거나 손을 잡는 작은 스킨십이 두 분의 연결을 더 따뜻하게 만들어줍니다.'
      : '"말 안 해도 네 마음 알아", "오늘도 수고했어" 같은 짧은 표현이 두 분 사이를 더 가깝게 만들어줍니다.',
    'warm_soft-cool_clear': isCouple
      ? '따뜻한 분에게는 "네가 있어서 좋아"라는 말이, 명료한 분에게는 약속을 지키고 먼저 챙기는 행동이 가장 큰 사랑의 언어입니다. 손잡기나 짧은 포옹으로 먼저 다가가보세요.'
      : '"네가 있어서 좋아", "오늘 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_clear-warm_soft': isCouple
      ? '명료한 분에게는 약속을 지키고 먼저 챙기는 행동이, 따뜻한 분에게는 "네가 있어서 좋아"라는 말이 가장 큰 사랑의 언어입니다. 눈을 맞추거나 손을 잡는 작은 표현으로 먼저 다가가보세요.'
      : '"오늘 수고했어", "네가 있어서 든든해" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_deep-cool_deep': isCouple
      ? '"말 안 해도 네 마음 알아"라는 짧은 한 마디가 두 분 모두에게 깊이 닿습니다. 눈을 맞추거나 손을 잡는 작은 스킨십이 두 분의 연결을 더 깊게 만들어줍니다.'
      : '"말 안 해도 네 마음 알아", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'nature-nature': isCouple
      ? '말 없이 조용히 곁에 있어주는 것이 두 분에게 가장 큰 사랑의 표현입니다. "네가 곁에 있어서 좋아", "오늘 반가웠어" 같은 짧은 칭찬과 함께 손잡기나 눈 맞추기 같은 작은 스킨십을 더해보세요.'
      : '"네가 곁에 있어서 좋아", "오늘 반가웠어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'nature-warm_active': isCouple
      ? '"오늘 반가웠어", "네가 곁에 있어서 좋아" 같은 짧은 표현이 두 분의 거리를 좁혀줍니다. 조용한 분은 말 없이 곁에 있어주는 것으로, 활기찬 분은 짧은 칭찬으로 마음을 전해보세요.'
      : '"오늘 반가웠어", "네가 있어서 좋아" 같은 짧은 표현이 두 분 사이를 더 가깝게 만들어줍니다.',
    'warm_active-nature': isCouple
      ? '"오늘도 고마워", "네가 곁에 있어서 좋아" 같은 짧은 표현이 두 분의 거리를 좁혀줍니다. 활기찬 분은 짧은 칭찬으로, 조용한 분은 눈을 맞추거나 손을 잡는 것으로 마음을 전해보세요.'
      : '"오늘도 고마워", "네가 있어서 든든해" 같은 짧은 표현이 두 분 사이를 더 가깝게 만들어줍니다.',
    'warm_grounded-warm_grounded': isCouple
      ? '"오늘도 수고했어", "네가 해준 거 덕분에 맛있었어" 같은 일상적인 칭찬이 두 분 모두에게 가장 큰 사랑의 언어입니다. 짧은 포옹이나 손잡기 같은 작은 스킨십을 함께 더해보세요.'
      : '"오늘도 수고했어", "네가 있어서 든든해" 같은 일상적인 칭찬이 두 분 모두에게 가장 큰 연결의 언어입니다.',
    'warm_soft-warm_soft': isCouple
      ? '"네가 있어서 정말 다행이야", "오늘도 고마워" 같은 말이 두 분 모두에게 깊이 닿습니다. 짧은 포옹이나 손잡기 같은 작은 스킨십을 함께 더해보세요. 서로를 위하는 마음이 많으니, 이제는 그 마음을 조금 더 자주 표현해보세요.'
      : '"네가 있어서 정말 다행이야", "오늘도 고마워" 같은 짧은 칭찬이 두 분 모두에게 깊이 닿습니다. 서로를 위하는 마음을 조금 더 자주 표현해보세요.',
    // warm_grounded / cool_clear 계열 조합 추가
    'warm_grounded-cool_clear': isCouple
      ? '"네가 해준 거 다 알아", "네가 있어서 든든해" 같은 짧은 칭찬이 두 분 모두에게 가장 큰 사랑의 언어입니다. 눈을 맞추거나 손을 잡는 작은 스킨십을 함께 더해보세요.'
      : '"네가 있어서 든든해", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_clear-warm_grounded': isCouple
      ? '"네가 정리해준 거 덕분에 나 편해졌어", "네가 묵묵히 있어줘서 나 안정돼" 같은 짧은 칭찬이 두 분 모두에게 깊이 닿습니다. 짧은 포옹이나 눈 맞추기 같은 작은 표현을 함께 더해보세요.'
      : '"네가 있어서 든든해", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'warm_grounded-cool_deep': isCouple
      ? '"네가 있어서 나 안정돼", "말 안 해도 네 마음 알아" 같은 짧은 표현이 두 분 사이를 가장 깊게 연결해줍니다. 손잡기나 짧은 포옹 같은 작은 스킨십을 함께 더해보세요.'
      : '"네가 있어서 든든해", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_deep-warm_grounded': isCouple
      ? '"말 안 해도 괜찮아", "네가 있어서 나 든든해" 같은 짧은 표현이 두 분 사이를 따뜻하게 이어줍니다. 눈을 맞추거나 손을 잡는 작은 스킨십을 함께 더해보세요.'
      : '"말 안 해도 괜찮아", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_clear-cool_clear': isCouple
      ? '"네가 정리해준 거 덕분에 나 편해졌어", "오늘도 수고했어" 같은 짧고 명확한 칭찬이 두 분 모두에게 가장 큰 사랑의 언어입니다. 눈을 맞추거나 짧은 포옹 같은 작은 표현을 함께 더해보세요.'
      : '"네가 잘 하고 있는 거 알아", "오늘도 수고했어" 같은 짧고 명확한 칭찬이 두 분 사이를 더 편안하게 만들어줍니다.',
    'cool_clear-cool_deep': isCouple
      ? '"네가 정리해준 거 덕분에 나 편해졌어", "말 안 해도 네 마음 알아" 같은 짧은 칭찬이 두 분 사이를 이어줍니다. 눈을 맞추거나 손을 잡는 작은 표현을 함께 더해보세요.'
      : '"오늘도 수고했어", "말 안 해도 네 마음 알아" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_deep-cool_clear': isCouple
      ? '"말 안 해도 네 마음 알아", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 깊게 연결해줍니다. 짧은 포옹이나 눈 맞추기 같은 작은 표현을 함께 더해보세요.'
      : '"말 안 해도 네 마음 알아", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'warm_grounded-nature': isCouple
      ? '"네가 자연스럽게 있어줘서 나 편해", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 따뜻하게 유지해줍니다. 손잡기나 짧은 포옹 같은 작은 스킨십을 함께 더해보세요.'
      : '"네가 있어서 든든해", "오늘도 수고했어" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'nature-warm_grounded': isCouple
      ? '"네가 일상을 지켜줘서 나 안정돼", "오늘 반가웠어" 같은 짧은 칭찬이 두 분 사이를 따뜻하게 유지해줍니다. 눈을 맞추거나 손을 잡는 작은 표현을 함께 더해보세요.'
      : '"네가 있어서 좋아", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
    'cool_clear-nature': isCouple
      ? '"네가 정리해준 거 덕분에 나 편해졌어", "오늘 반가웠어" 같은 짧은 칭찬이 두 분 사이를 이어줍니다. 눈을 맞추거나 짧은 포옹 같은 작은 표현을 함께 더해보세요.'
      : '"오늘도 수고했어", "네가 있어서 든든해" 같은 짧은 칭찬이 두 분 사이를 더 편안하게 만들어줍니다.',
    'nature-cool_clear': isCouple
      ? '"네가 자연스럽게 있어줘서 나 편해", "오늘도 고마워" 같은 짧은 칭찬이 두 분 사이를 더 편안하게 만들어줍니다. 손잡기나 눈 맞추기 같은 작은 스킨십을 함께 더해보세요.'
      : '"오늘도 고마워", "네가 있어서 좋아" 같은 짧은 칭찬이 두 분 사이를 더 따뜻하게 만들어줍니다.',
  };

  const affection = comboAffection[key] ?? comboAffection[`${fB}-${fA}`];
  if (affection) return affection;

  // 기본 폴백
  const needsPhysical = fA === 'warm_soft' || fB === 'warm_soft' || fA === 'warm_active' || fB === 'warm_active';
  const needsWords = fA === 'cool_deep' || fB === 'cool_deep';

  if (needsPhysical && needsWords) {
    return isCouple
      ? `손잡기, 짧은 포옹, 눈 맞추기 같은 작은 스킨십과 함께 "오늘도 고마워"라는 말을 나눠보세요. 말과 따뜻한 표현이 함께할 때 두 사람 모두에게 깊이 닿습니다.`
      : `"오늘도 고마워", "네가 있어서 든든해" 같은 짧은 표현이 두 사람의 연결을 유지해줍니다. 작은 칭찬 한 마디가 생각보다 큰 연결이 됩니다.`;
  }
  if (needsPhysical) {
    return isCouple
      ? `손잡기, 짧은 포옹, 눈 맞추기 같은 작은 스킨십이 두 사람의 정서적 연결을 유지해줍니다. "오늘도 파이팅", "오늘 반가웠어" 같은 짧은 표현을 함께 더해보세요.`
      : `"오늘도 수고했어", "네가 있어서 좋아" 같은 짧은 칭찬이 두 사람의 연결을 유지해줍니다. 작은 표현이 생각보다 큰 따뜻함이 됩니다.`;
  }
  if (needsWords) {
    return '"네가 있어서 좋아", "오늘도 수고했어" 같은 짧은 말이 깊이 닿습니다. 거창한 표현보다 진심 어린 한 마디가 더 큰 연결을 만들어줍니다.';
  }
  const baseAff = isCouple
    ? '손잡기, 짧은 포옹, 눈 맞추기 같은 작은 스킨십이 두 분의 정서적 연결을 유지해줍니다. "오늘 반가웠어", "네가 있어서 다행이야" 같은 짧은 표현을 함께 더해보세요.'
    : '"오늘도 고마워", "네가 있어서 든든해" 같은 작은 말 한 마디가 두 분 사이를 따뜻하게 유지해줍니다. 특별한 것보다 꾸준한 표현이 더 중요합니다.';
  return baseAff + (shapeAffNote ?? '');
}

/**
 * 두 사람 프로파일 대비 요약
 * 에너지 방향 차이 + 끌림 이유 + 반복 패턴 + 해법 방향을 한 단락으로 요약
 */
function buildProfileContrast(
  fA: EnergyFamily, fB: EnergyFamily,
  analysisA: PersonAnalysis, analysisB: PersonAnalysis,
  colorsA: ColorData[], colorsB: ColorData[],
  rel: RelationType,
  shapeCtxA?: ReturnType<typeof buildShapeContext>,
  shapeCtxB?: ReturnType<typeof buildShapeContext>
): string {
  // 컬러 에너지 + 도형 반응 구조 통합 표현
  // 컬러 = 감정 에너지 방향, 도형 = 갈등 직후 반응 구조
  const shapeProfileNote = (shapeCtxA && shapeCtxB)
    ? `\n\n도형이 말해주는 표현 구조: 첫 번째 사람은 ${shapeCtxA.modifier} 방식으로 관계를 이어갑니다. 두 번째 사람은 ${shapeCtxB.modifier} 방식으로 연결됩니다. 컬러는 감정 에너지의 방향을, 도형은 갈등 직후 반응 구조를 말해줍니다.`
    : shapeCtxA
      ? `\n\n도형이 말해주는 표현 구조: ${shapeCtxA.modifier} 방식으로 관계를 이어가는 특성이 있습니다.`
      : '';
  const relLabel = rel === '연인' || rel === '부부' ? '두 분' : '두 사람';
  const nameA = colorsA[0]?.korName ?? 'A';
  const nameB = colorsB[0]?.korName ?? 'B';

  // 동일 계열 조합 — 유사성에서 오는 특유 갈등 패턴
  if (fA === fB) {
    const sameContrast: Record<EnergyFamily, string> = {
      warm_active: `${relLabel} 모두 감정을 바로 표현하고 빠르게 반응하는 에너지를 가지고 있습니다. 함께 있으면 활기차지만, 둘 다 지쳐있을 때는 서로를 쉽게 해주는 사람이 없어 감정이 충돌할 수 있습니다. 두 사람 모두 빠르게 달려오는 사람들이라면, 지금 필요한 것은 서로를 쉽게 해주는 연습입니다. "오늘 나 쉬어"라고 먼저 말하는 것이 두 사람 모두에게 회복의 시작입니다.`,
      warm_soft: `${relLabel} 모두 배려 깊고 따뜻한 사람들입니다. 서로를 위하는 마음이 많지만, 그 마음이 너무 크면 서로의 기대도 커집니다. 한 사람이 지쳐있을 때 다른 사람이 알아야 한다는 부담이 생길 수 있습니다. "지금 나 조금 힘들어"라고 먼저 말하는 연습이 두 사람 모두에게 필요합니다.`,
      warm_grounded: `${relLabel} 모두 안정적이고 신중한 사람들입니다. 함께 있으면 편안하지만, 변화가 필요한 순간에는 둘 다 망설일 수 있습니다. 작은 변화 하나를 함께 시도하는 것이 두 사람의 관계에 새로운 활기를 줄 수 있습니다.`,
      cool_clear: `${relLabel} 모두 명료하고 효율적인 사람들입니다. 서로의 방식을 잘 이해하지만, 감정적인 연결보다 일 정리가 앞서는 순간이 생길 수 있습니다. 가끔 "오늘 어때요?" 한 마디가 두 사람 사이를 더 따뜻하게 만들어줍니다.`,
      cool_deep: `${relLabel} 모두 말보다 마음으로 더 많이 느끼는 사람들입니다. 서로의 침묵을 말 없이 받아들이지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
      nature: `${relLabel} 모두 자연스럽고 유연한 리듬을 가지고 있습니다. 서로를 강요하지 않아 편안하지만, 때로는 누군가 먼저 방향을 잡아줄 필요가 있습니다. "우리 이렇게 해보자"고 먼저 제안하는 것이 관계를 앞으로 나아가게 합니다.`,
      neutral: `${relLabel} 모두 균형 잡힌 방식으로 관계를 이어갑니다. 서로의 페이스를 자연스럽게 맞추는 편입니다. 지금의 균형을 유지하면서 조금씩 더 깊이 연결되어 가는 것이 두 사람에게 맞는 방향입니다.`,
    };
    return sameContrast[fA];
  }

  // 관계 유형별 핵심 테마 분기
  const isCouple = rel === '연인' || rel === '부부';
  const isParentChild = rel === '부모-자녀' || rel === '아빠-아들' || rel === '아빠-딸' || rel === '엄마-아들' || rel === '엄마-딸';
  const isColleague = rel === '동료';
  const isFriend = rel === '친구';
  const isSibling = rel === '형제자매';

  // 관계 유형별 연결 테마 문장 생성 헬퍼
  const getAttractionLine = (a: EnergyFamily, b: EnergyFamily): string => {
    const traitA = getFamilyProfileLabel(a);
    const traitB = getFamilyProfileLabel(b);
    if (isCouple) {
      return `서로에게 끌리는 이유는 명확합니다. 한 사람의 ${traitA} 방식이 다른 사람에게 새로운 에너지를 주고, 한 사람의 ${traitB} 방식이 다른 사람에게 균형감을 줍니다.`;
    } else if (isParentChild) {
      return `두 사람이 서로를 이해하는 방식이 다릅니다. 한 사람은 ${traitA} 방식으로, 다른 사람은 ${traitB} 방식으로 관계를 경험합니다. 이 차이가 때로는 거리감으로 느껴지지만, 서로 배우는 흐름이기도 합니다.`;
    } else if (isColleague) {
      return `두 사람의 업무 방식과 소통 리듬이 다릅니다. 한 사람은 ${traitA} 방식으로, 다른 사람은 ${traitB} 방식으로 상황을 처리합니다. 이 차이를 이해하면 협업이 훨씬 자연스러워집니다.`;
    } else if (isFriend) {
      return `두 사람이 편안함을 느끼는 방식이 다릅니다. 한 사람은 ${traitA} 방식으로, 다른 사람은 ${traitB} 방식으로 우정을 쌓습니다. 이 차이가 오히려 서로에게 새로운 시각을 줄 수 있습니다.`;
    } else {
      return `두 사람의 관계 방식이 다릅니다. 한 사람은 ${traitA} 방식으로, 다른 사람은 ${traitB} 방식으로 연결됩니다. 이 차이를 이해하는 것이 관계를 더 깊게 만들어줍니다.`;
    }
  };

  // 다른 계열 조합 — 에너지 방향 차이 + 관계 유형별 테마 + 반복 패턴 + 해법
  const buildContrastEntry = (
    labelA: string, labelB: string,
    coupleAttr: string, nonCoupleAttr: string,
    pattern: string, solution: string
  ): string => {
    const attrLine = isCouple ? coupleAttr : nonCoupleAttr;
    return `${nameA}의 성향을 가진 사람은 ${labelA} 중심으로 살아갑니다. ${nameB}의 성향을 가진 사람은 ${labelB} 중심으로 살아갑니다.\n${attrLine}\n반복되는 패턴은 이렇게 나타납니다. ${pattern} ${solution}`;
  };

  const contrastMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': buildContrastEntry(
      '표현', '내면 정리',
      '한 사람의 활기차고 직접적인 에너지가 다른 사람에게 살아있는 느낌을 주고, 한 사람의 깊고 조용한 내면이 다른 사람에게 안정감을 줍니다.',
      isParentChild
        ? '한 사람은 빠르게 표현하고 싶어 하고, 다른 사람은 충분히 정리된 후에야 말할 수 있습니다. 세대 차이보다 표현 속도의 차이가 더 크게 느껴지는 관계입니다.'
        : isFriend
          ? '한 사람은 바로 말하고 싶고, 다른 사람은 천천히 정리하는 편입니다. 이 리듬 차이를 이해하면 우정이 더 편안해집니다.'
          : '한 사람은 빠르게 표현하고, 다른 사람은 천천히 정리합니다. 이 속도 차이를 이해하면 관계가 훨씬 자연스러워집니다.',
      '한 사람이 바로 말하고 싶을 때, 다른 사람은 아직 정리 중입니다.',
      '"지금 말할 수 있어?"라고 먼저 묻는 것이 이 패턴을 넘는 가장 빠른 방법입니다.'
    ),
    'cool_deep-warm_active': buildContrastEntry(
      '내면 정리', '표현',
      '한 사람의 깊고 조용한 내면이 다른 사람에게 안정감을 주고, 한 사람의 활기차고 직접적인 에너지가 다른 사람에게 살아있는 느낌을 줍니다.',
      isParentChild
        ? '한 사람은 충분히 정리된 후에야 말하고, 다른 사람은 빠르게 표현하고 싶어 합니다. 이 속도 차이가 세대 간 소통의 핵심 지점입니다.'
        : '한 사람은 천천히 정리하고, 다른 사람은 바로 표현합니다. 이 리듬 차이를 이해하면 관계가 훨씬 편안해집니다.',
      '한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다.',
      '"말하고 싶을 때 들어줄게"라고 먼저 말해주는 것이 이 패턴에서 보호해줍니다.'
    ),
    'warm_soft-cool_clear': buildContrastEntry(
      '감정', '신뢰와 실질',
      '한 사람의 따뜻한 감성이 다른 사람에게 안심감을 주고, 한 사람의 명료한 판단이 다른 사람에게 방향감을 줍니다.',
      isParentChild
        ? '한 사람은 감정적 연결을 원하고, 다른 사람은 실질적인 해결을 먼저 생각합니다. 이 차이가 "왜 내 마음을 몰라"와 "내가 해결해주려고 한 건데"로 나타날 수 있습니다.'
        : isFriend
          ? '한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 생각합니다. 이 차이를 알면 대화가 훨씬 자연스러워집니다.'
          : '한 사람은 감정을 나누고 싶고, 다른 사람은 상황을 정리하고 싶습니다. 이 차이를 이해하면 오해가 줄어듭니다.',
      '한 사람은 공감을 원하고, 다른 사람은 해결책을 내놓습니다.',
      '"해결보다 먼저 들어줄게"라고 먼저 말하는 것이 두 사람 사이의 온도를 높여줍니다.'
    ),
    'cool_clear-warm_soft': buildContrastEntry(
      '신뢰와 실질', '감정',
      '한 사람의 명료한 판단이 다른 사람에게 방향감을 주고, 한 사람의 따뜻한 감성이 다른 사람에게 안심감을 줍니다.',
      isParentChild
        ? '한 사람은 실질적인 해결을 먼저 생각하고, 다른 사람은 감정적 연결을 원합니다. 이 차이가 소통의 온도 차이로 느껴질 수 있습니다.'
        : '한 사람은 상황을 정리하고 싶고, 다른 사람은 감정을 나누고 싶습니다. 이 차이를 이해하면 관계가 편안해집니다.',
      '한 사람의 이성적인 말이 다른 사람에게 차갑게 느껴지는 순간이 있습니다.',
      '"네 마음이 힘들겠구나" 한 마디가 두 사람 사이의 온도를 높여줍니다.'
    ),
    'warm_active-nature': buildContrastEntry(
      '표현', '자신의 리듬',
      '한 사람의 활기차고 직접적인 에너지가 다른 사람에게 살아있는 느낌을 주고, 한 사람의 조용하고 편안한 존재감이 다른 사람에게 안정감을 줍니다.',
      isColleague
        ? '한 사람은 빠르게 움직이고 표현하고, 다른 사람은 자신의 리듬대로 처리합니다. 협업 속도 차이가 생길 수 있습니다.'
        : '한 사람은 빠르게 표현하고, 다른 사람은 자신의 리듬을 지킵니다. 속도 차이를 인정하면 관계가 편안해집니다.',
      '한 사람의 빠른 에너지가 다른 사람에게 부담으로 느껴지는 순간이 있습니다.',
      '"네 페이스로 해"라고 먼저 말해주는 것이 이 패턴을 넘는 가장 빠른 방법입니다.'
    ),
    'nature-warm_active': buildContrastEntry(
      '자신의 리듬', '표현',
      '한 사람의 조용하고 편안한 존재감이 다른 사람에게 안정감을 주고, 한 사람의 활기차고 직접적인 에너지가 다른 사람에게 살아있는 느낌을 줍니다.',
      isColleague
        ? '한 사람은 자신의 리듬대로 처리하고, 다른 사람은 빠르게 움직이고 표현합니다. 이 속도 차이를 이해하면 협업이 훨씬 자연스러워집니다.'
        : '한 사람은 자신의 리듬을 지키고, 다른 사람은 빠르게 표현합니다. 이 차이를 인정하면 관계가 편안해집니다.',
      '한 사람의 조용한 존재감이 다른 사람에게 무관심으로 읽히는 순간이 있습니다.',
      '"나 여기 있어"라고 먼저 말해주는 것이 이 패턴에서 보호해줍니다.'
    ),
    'warm_soft-warm_active': buildContrastEntry(
      '배려', '표현',
      '한 사람의 따뜻한 배려가 다른 사람에게 안심감을 주고, 한 사람의 직접적인 표현이 다른 사람에게 살아있는 느낌을 줍니다.',
      isParentChild
        ? '한 사람은 조심스럽게 배려하고, 다른 사람은 직접적으로 표현합니다. 이 차이가 "왜 말을 안 해"와 "왜 이렇게 강하게 말해"로 나타날 수 있습니다.'
        : '한 사람은 부드럽게 배려하고, 다른 사람은 직접적으로 표현합니다. 이 온도 차이를 이해하면 관계가 편안해집니다.',
      '한 사람의 조심스러운 표현이 다른 사람에게 소극적으로 느껴지는 순간이 있습니다.',
      '"네 표현 방식이 나는 좋아"라고 먼저 말해주는 것이 두 사람 사이의 온도를 높여줍니다.'
    ),
    'warm_grounded-cool_deep': buildContrastEntry(
      '안정', '내면 성찰',
      '한 사람의 안정적인 존재감이 다른 사람에게 신뢰감을 주고, 한 사람의 깊은 내면이 다른 사람에게 깊이감을 줍니다.',
      isParentChild
        ? '한 사람은 안정적인 일상으로 관계를 지키고, 다른 사람은 깊은 내면에서 천천히 연결됩니다. 두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.'
        : '한 사람은 안정적인 방식으로, 다른 사람은 깊이 생각하는 방식으로 관계를 경험합니다.',
      '두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.',
      '먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.'
    ),
    // 동료 특화 조합 — 협업 스타일 차이 중심
    'warm_active-cool_clear': isColleague
      ? `${nameA}의 성향을 가진 사람은 빠르게 움직이고 직접 표현하는 방식으로 일합니다. ${nameB}의 성향을 가진 사람은 명확하게 정리하고 신중하게 에쓰는 방식으로 일합니다.\n한 사람은 빠른 실행을 원하고, 다른 사람은 충분한 검토 후 진행하고 싶어 합니다. 이 속도 차이가 협업에서 마찰의 원인이 되기도 합니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 먼저 실행하고 싶을 때, 다른 사람은 아직 검토 중입니다. "지금 어디까지 정리된 거야?"`
      : isFriend
        ? `${nameA}의 성향을 가진 사람은 직접적으로 소통하고 빠르게 움직입니다. ${nameB}의 성향을 가진 사람은 명확하게 정리하고 신중하게 표현합니다.\n한 사람은 빠르게 소통하고 싶고, 다른 사람은 충분히 생각한 후 말하는 편입니다. 이 리듬 차이를 이해하면 우정이 더 편안해집니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 바로 말하고 싶을 때, 다른 사람은 아직 정리 중입니다. "지금 말할 수 있어?"`
        : buildContrastEntry(
            '표현', '명료함',
            '한 사람의 활기찬 에너지가 다른 사람에게 살아있는 느낌을 주고, 한 사람의 명료한 판단이 다른 사람에게 방향감을 줍니다.',
            '한 사람은 빠르게 표현하고, 다른 사람은 충분히 정리하고 싶어 합니다.',
            '한 사람이 빠르게 실행하고 싶을 때, 다른 사람은 아직 검토 중입니다.',
            '"지금 어디까지 정리된 거야?"'
          ),
    'cool_clear-warm_active': isColleague
      ? `${nameA}의 성향을 가진 사람은 명확한 기준과 시스템으로 일합니다. ${nameB}의 성향을 가진 사람은 빠르게 움직이고 직접 표현하는 방식으로 일합니다.\n한 사람은 충분한 검토 후 진행하고 싶고, 다른 사람은 빠른 실행을 원합니다. 이 속도 차이가 협업에서 마찰의 원인이 되기도 합니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 아직 검토 중일 때, 다른 사람은 이미 실행을 원합니다. "지금 어디까지 확인된 거야?"`
      : buildContrastEntry(
          '명료함', '표현',
          '한 사람의 명료한 판단이 다른 사람에게 방향감을 주고, 한 사람의 활기찬 에너지가 다른 사람에게 살아있는 느낌을 줍니다.',
          '한 사람은 충분히 정리하고 싶고, 다른 사람은 빠르게 표현합니다.',
          '한 사람의 신중한 태도가 다른 사람에게 느리게 느껴지는 순간이 있습니다.',
          '"지금 어디까지 확인된 거야?"'
        ),
    // 친구 특화 조합 — 우정 유지 패턴 중심
    'warm_soft-cool_deep': isColleague
      ? `${nameA}의 성향을 가진 사람은 배려 진하고 감정적으로 연결하는 방식으로 일합니다. ${nameB}의 성향을 가진 사람은 깊이 생각하고 내면에서 천천히 연결되는 방식으로 일합니다.\n한 사람은 관계 중심으로 일하고, 다른 사람은 업무 중심으로 일합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 소통을 원할 때, 다른 사람은 아직 정리 중입니다. "지금 말할 수 있어?"`
      : isFriend
        ? `${nameA}의 성향을 가진 사람은 배려 진하고 감정적으로 연결하는 사람입니다. ${nameB}의 성향을 가진 사람은 말보다 마음으로 더 많이 느끼는 사람입니다.\n한 사람은 자주 연락하고 소통하고 싶고, 다른 사람은 스스로 연락하기까지 시간이 필요합니다. 이 리듬 차이가 서로에게 서운하게 느껴지는 순간이 있습니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 먼저 연락하는 일이 많아집니다. "나 연락하는 거 부담 안 돼?"`
        : buildContrastEntry(
            '배려', '내면 성찰',
            '한 사람의 따뜻한 배려가 다른 사람에게 안심감을 주고, 한 사람의 깊은 내면이 다른 사람에게 깊이감을 줍니다.',
            '한 사람은 자주 연락하고 소통하고 싶고, 다른 사람은 스스로 연락하기까지 시간이 필요합니다.',
            '한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다.',
            '"나 연락하는 거 부담 안 돼?"'
          ),
    'cool_deep-warm_soft': isColleague
      ? `${nameA}의 성향을 가진 사람은 깊이 생각하고 내면에서 천천히 연결되는 방식으로 일합니다. ${nameB}의 성향을 가진 사람은 배려 진하고 감정적으로 연결하는 방식으로 일합니다.\n한 사람은 업무 중심으로, 다른 사람은 관계 중심으로 일합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 침묵이 다른 사람에게 무관심으로 읽히는 순간이 있습니다. "나 여기 있어"`
      : isFriend
        ? `${nameA}의 성향을 가진 사람은 말보다 마음으로 더 많이 느끼는 사람입니다. ${nameB}의 성향을 가진 사람은 배려 진하고 감정적으로 연결하는 사람입니다.\n한 사람은 스스로 연락하기까지 시간이 필요하고, 다른 사람은 자주 연락하고 소통하고 싶어 합니다. 이 리듬 차이가 서로에게 서운하게 느껴지는 순간이 있습니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다. "나 여기 있어"`
        : buildContrastEntry(
            '내면 성찰', '배려',
            '한 사람의 깊은 내면이 다른 사람에게 깊이감을 주고, 한 사람의 따뜻한 배려가 다른 사람에게 안심감을 줍니다.',
            '한 사람은 스스로 연락하기까지 시간이 필요하고, 다른 사람은 자주 연락하고 싶어 합니다.',
            '한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다.',
            '"나 여기 있어"'
          ),
    // 동료 특화 조합 — 안정 vs 명료
    'warm_grounded-cool_clear': isColleague
      ? `${nameA}의 성향을 가진 사람은 일상적인 신뢰를 쌓고 묵묵히 에쓰는 방식으로 일합니다. ${nameB}의 성향을 가진 사람은 명확한 기준과 시스템으로 일합니다.\n한 사람은 유연하게 적응하고, 다른 사람은 명확한 구조를 선호합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 유연하게 적응할 때, 다른 사람은 명확한 기준을 원합니다. "지금 어디까지 정리된 거야?"`
      : buildContrastEntry(
          '안정', '명료함',
          '한 사람의 안정적인 존재감이 다른 사람에게 신뢰감을 주고, 한 사람의 명료한 판단이 다른 사람에게 방향감을 줍니다.',
          '한 사람은 유연하게 적응하고, 다른 사람은 명확한 구조를 선호합니다.',
          '한 사람이 유연하게 적응할 때, 다른 사람은 명확한 기준을 원합니다.',
          '"지금 어디까지 정리된 거야?"'
        ),
    'cool_clear-warm_grounded': isColleague
      ? `${nameA}의 성향을 가진 사람은 명확한 기준과 시스템으로 일합니다. ${nameB}의 성향을 가진 사람은 일상적인 신뢰를 쌓고 묵묵히 에쓰는 방식으로 일합니다.\n한 사람은 명확한 구조를 선호하고, 다른 사람은 유연하게 적응합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 명확한 기준을 원할 때, 다른 사람은 유연하게 적응합니다. "지금 어디까지 확인된 거야?"`
      : buildContrastEntry(
          '명료함', '안정',
          '한 사람의 명료한 판단이 다른 사람에게 방향감을 주고, 한 사람의 안정적인 존재감이 다른 사람에게 신뢰감을 줍니다.',
          '한 사람은 명확한 구조를 선호하고, 다른 사람은 유연하게 적응합니다.',
          '한 사람의 명확한 기준이 다른 사람에게 엄격하게 느껴지는 순간이 있습니다.',
          '"지금 어디까지 확인된 거야?"'
        ),
  };

    const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  // colorId 기반 profileContrast — 컬러 고유 성향 + 끌림 이유 + 반복 패턴
  const colorIdContrastMap: Partial<Record<string, string>> = {
    'white-pink': isCouple
      ? `한 사람은 정리, 거리두기, 감정 비움을 중요하게 여깁니다. 다른 사람은 애정 표현, 정서 반응, 따뜻한 연결을 중요하게 여깁니다.\n한 사람의 조용하고 정돈된 에너지가 다른 사람에게 안정감을 주고, 다른 사람의 따뜻한 표현이 한 사람에게 온기를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 감정 과부하로 거리를 두면, 다른 사람은 그것을 거절로 읽습니다. "지금 혼자 있어야 해"와 "왜 나를 피해?"가 반복됩니다.`
      : `한 사람은 정리와 거리두기로, 다른 사람은 따뜻한 표현으로 관계를 이어갑니다. 서로의 회복 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'white-red': isCouple
      ? `한 사람은 집안 정리와 생활 리듬이 안정되어야 마음이 편안합니다. 청결 기준이 높고, 질서가 깨지면 예민해집니다. 다른 사람은 감정을 바로 표현하며 연결감을 확인하고 싶어 합니다. 스킨십과 즉각적인 반응이 중요합니다.\n한 사람은 "지금 좀 정리하고 싶어"라고 말하고, 다른 사람은 "지금 당장 같이 뭔가 하자"라고 합니다.\n반복되는 패턴은 이렇게 나타납니다. "왜 이렇게 어질러?"와 "왜 이렇게 예민해?"가 교차합니다. 생활 기준과 즉각적인 연결 욕구가 부딪힙니다.`
      : `한 사람은 정리와 생활 루틴이 중요하고, 다른 사람은 즉각적인 표현과 반응을 원합니다. 속도와 기준 차이가 반복적인 긴장 포인트입니다.`,
    'white-black': isCouple
      ? `한 사람은 집안 정리와 생활 루틴이 안정되어야 편안합니다. 감정 정리 후 표현합니다. 다른 사람은 혼자 회복하는 시간이 필요합니다. 말이 많아지면 피로해집니다. 간섭이 부담입니다.\n두 사람 모두 마음을 쉽게 열지 않는 편입니다.\n반복되는 패턴은 이렇게 나타납니다. 서로 기다리다 연결이 늦어집니다. 청소·정리 기준과 생활 방식 차이가 조용히 쌓입니다.`
      : `두 사람 모두 마음을 쉽게 열지 않습니다. 서로의 독립성을 존중하면서 조금씩 다가가는 것이 필요합니다.`,
    'white-navy': isCouple
      ? `한 사람은 집안 정리와 생활 루틴이 안정되어야 마음이 편안합니다. 다른 사람은 책임감과 꾸준한 행동으로 관계를 지킵니다. 미래 계획과 신뢰를 중요하게 여깁니다.\n두 사람 모두 감정을 안으로 담아두는 편입니다.\n반복되는 패턴은 이렇게 나타납니다. 서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다. 가끔 "오늘 어땠어?"라고 먼저 묻는 것이 이 관계를 따뜻하게 유지합니다.`
      : `두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 말로 확인하는 시간이 필요합니다.`,
    'white-magenta': isCouple
      ? `한 사람은 감정을 비우고 정리하려는 성향이 있습니다. 다른 사람은 감정에 깊이 몰입하고 진심 어린 연결을 원합니다.\n한 사람의 정화 에너지가 다른 사람에게 안정감을 주고, 다른 사람의 깊이가 한 사람에게 의미를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 감정 과부하로 거리를 두면, 다른 사람은 그것을 거절로 읽습니다. "지금 혼자 있어야 해"와 "왜 나를 밀어내?"가 교차합니다.`
      : `한 사람은 감정을 비우며 정리하고, 다른 사람은 감정에 깊이 몰입합니다. 서로의 회복 방식이 다를 뿐입니다.`,
    'black-red': isCouple
      ? `한 사람은 혼자 회복하는 시간이 필요합니다. 말이 많아지면 피로해집니다. 간섭이 부담입니다. 다른 사람은 바로 표현하고 즉각 반응을 원합니다. 스킨십과 활동형 연결이 중요합니다.\n한 사람의 깊이가 다른 사람에게 신뢰감을 주고, 다른 사람의 활기가 한 사람에게 자극이 됩니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 공간을 원할 때 다른 사람은 더 가까이 다가갑니다. "왜 혼자 있으려 해?"와 "왜 항상 붙어있으려 해?"가 교차합니다.`
      : `한 사람은 혼자 회복하는 시간이 필요하고, 다른 사람은 즉각적인 연결을 원합니다. 거리 조절이 반복적인 긴장 포인트입니다.`,
    'black-pink': isCouple
      ? `한 사람은 혼자 있는 시간이 충전입니다. 조용해도 관계가 식은 것이 아닙니다. 다른 사람은 애정 표현과 따뜻한 확인이 필요합니다. "사랑해"라는 말, 스킨십, 함께하는 시간이 중요합니다.\n한 사람의 깊이가 다른 사람에게 신비감을 주고, 다른 사람의 따뜻함이 한 사람에게 온기를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. "왜 나한테만 차가워?"와 "나는 이미 여기 있잖아"가 반복됩니다.`
      : `한 사람은 혼자만의 공간이 필요하고, 다른 사람은 따뜻한 표현을 원합니다. 서로의 방식을 이해하는 것이 시작입니다.`,
    'navy-pink': isCouple
      ? `한 사람은 책임감 있는 행동과 꾸준함으로 마음을 보여줍니다. 밥을 차려주고, 먼저 일을 처리하고, 말 없이 곁에 있습니다. 다른 사람은 스킨십과 말로 사랑을 확인하고 싶어 합니다. "사랑해"라는 말이 필요합니다.\n한 사람의 안정감이 다른 사람에게 신뢰를 주고, 다른 사람의 따뜻함이 한 사람에게 온기를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. "이미 다 하고 있잖아"와 "그래도 말로 해줘"가 반복됩니다.`
      : `한 사람은 행동으로, 다른 사람은 말로 사랑을 표현합니다. 서로의 언어를 번역해주는 것이 필요합니다.`,
    'navy-red': isCouple
      ? `한 사람은 책임감, 신뢰, 신중함이 특징입니다. 다른 사람은 즉각 반응, 추진력, 빠른 속도가 특징입니다.\n한 사람의 안정감이 다른 사람에게 신뢰를 주고, 다른 사람의 활기가 한 사람에게 자극이 됩니다.\n반복되는 패턴은 이렇게 나타납니다. 속도 차이가 반복됩니다. 한 사람은 "왜 이렇게 빨리 결정해?"라고 느끼고, 다른 사람은 "왜 이렇게 느려?"라고 느낍니다.`
      : `한 사람은 신중하게, 다른 사람은 즉각적으로 움직입니다. 속도 차이가 반복적인 긴장 포인트입니다.`,
    'navy-magenta': isCouple
      ? `한 사람은 책임감, 신뢰, 혼자 감정 삭임이 특징입니다. 다른 사람은 감정 몰입, 깊은 연결, 상처 후 회복이 특징입니다.\n한 사람의 안정감이 다른 사람에게 신뢰를 주고, 다른 사람의 깊이가 한 사람에게 의미를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. "왜 아무 말도 안 해?"와 "왜 이렇게 감정적이야?"가 반복됩니다.`
      : `한 사람은 감정을 혼자 삭이고, 다른 사람은 깊이 나누고 싶어 합니다. 표현 방식 차이가 반복적인 긴장 포인트입니다.`,
    'red-green': isCouple
      ? `한 사람은 즉각 반응, 표현 직선성, 빠른 속도가 특징입니다. 다른 사람은 갈등 회피, 배려, 조용한 중재가 특징입니다.\n한 사람의 활기가 다른 사람에게 자극이 되고, 다른 사람의 부드러움이 한 사람에게 안정감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 직선적 표현이 다른 사람에게 공격적으로 느껴지고, 다른 사람의 회피가 한 사람에게 무관심으로 느껴집니다.`
      : `한 사람은 즉각적으로 표현하고, 다른 사람은 갈등을 피하며 조용히 배려합니다. 표현 방식 차이가 반복적인 긴장 포인트입니다.`,
    'red-violet': isCouple
      ? `한 사람은 즉각 반응, 추진력, 표현 직선성이 특징입니다. 다른 사람은 깊은 감정, 이상적 연결, 내면 성찰이 특징입니다.\n한 사람의 활기가 다른 사람에게 자극이 되고, 다른 사람의 깊이가 한 사람에게 신비감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 속도 차이가 반복됩니다. 한 사람은 "왜 반응이 없어?"라고 느끼고, 다른 사람은 "왜 이렇게 빨리 결론 내려?"라고 느낍니다.`
      : `한 사람은 즉각적으로 반응하고, 다른 사람은 깊이 생각한 후 표현합니다. 속도 차이가 반복적인 긴장 포인트입니다.`,
    'pink-green': isCouple
      ? `한 사람은 애정 표현, 정서 반응, 따뜻한 연결이 특징입니다. 다른 사람은 갈등 회피, 배려, 조용한 중재가 특징입니다.\n한 사람의 따뜻함이 다른 사람에게 온기를 주고, 다른 사람의 부드러움이 한 사람에게 안정감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 표현 기대가 다른 사람에게 부담이 되고, 다른 사람의 조용한 배려가 한 사람에게 무관심으로 느껴집니다.`
      : `한 사람은 따뜻한 표현으로, 다른 사람은 조용한 배려로 관계를 이어갑니다. 표현 방식 차이를 이해하는 것이 필요합니다.`,
    'magenta-green': isCouple
      ? `한 사람은 감정 몰입, 깊은 연결, 상처 후 회복이 특징입니다. 다른 사람은 갈등 회피, 배려, 조용한 중재가 특징입니다.\n한 사람의 깊이가 다른 사람에게 의미를 주고, 다른 사람의 부드러움이 한 사람에게 안정감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 강한 감정이 다른 사람에게 부담이 되고, 다른 사람의 회피가 한 사람에게 거절로 느껴집니다.`
      : `한 사람은 감정에 깊이 몰입하고, 다른 사람은 갈등을 피하며 조용히 배려합니다. 감정 표현 방식 차이가 반복적인 긴장 포인트입니다.`,
    'violet-yellow': isCouple
      ? `한 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다. 다른 사람은 현실적인 대화와 생활 패턴이 중요합니다. 책임감과 미래 계획을 중요하게 여깁니다.\n한 사람의 깊이가 다른 사람에게 의미를 주고, 다른 사람의 현실감이 한 사람에게 균형을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. "우리 관계에 대해 깊이 얘기하고 싶어"와 "그냥 오늘 뭐 먹을지 얘기하면 안 돼?"가 교차합니다.`
      : `한 사람은 깊이와 의미를 중요하게 여기고, 다른 사람은 현실적이고 밝게 소통합니다. 관점 차이가 반복적인 긴장 포인트입니다.`,
    'green-navy': isCouple
      ? `한 사람은 편안한 일상이 중요합니다. 자연스럽게 챙기고, 안정감 있는 관계를 선호합니다. 다른 사람은 책임감과 꾸준한 행동으로 관계를 지킵니다. 미래 계획과 신뢰를 중요하게 여깁니다.\n두 사람 모두 감정을 안으로 담아두는 편입니다.\n반복되는 패턴은 이렇게 나타납니다. 서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다. 가끔 "오늘 고마웠어"라는 한 마디가 이 관계를 따뜻하게 유지합니다.`
      : `두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 말로 확인하는 시간이 관계를 더 따뜻하게 만들어줍니다.`,
    'white-violet': isCouple
      ? `한 사람은 집안 정리와 생활 루틴이 안정되어야 마음이 편안합니다. 감정을 정리한 후 표현합니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다.\n한 사람의 침묵이 다른 사람에게 거리감으로 느껴지고, 다른 사람의 깊은 감정 표현이 한 사람에게 부담이 됩니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 공간을 정리하며 감정을 비울 때, 다른 사람은 지금 당장 감정을 나누고 싶어 합니다.`
      : `한 사람은 정리와 생활 루틴으로, 다른 사람은 깊은 감성 대화로 연결됩니다. 서로의 연결 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'white-green': isCouple
      ? `두 사람 모두 조용하고 안정적인 관계를 선호합니다. 한 사람은 생활 루틴과 청결이 중요하고, 다른 사람은 편안한 일상과 자연스러운 배려가 중요합니다.\n서로 갈등을 피하는 편이라 "괜찮아"라고 말하면서 각자 쌓아두는 패턴이 생깁니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 청결 기준이 깨지면 예민해지고, 다른 사람은 그 예민함이 부담스럽습니다.`
      : `두 사람 모두 안정적인 관계를 선호합니다. 가끔 말로 확인하는 시간이 관계를 더 따뜻하게 만들어줍니다.`,
    'black-violet': isCouple
      ? `한 사람은 혼자 회복하는 시간이 필요합니다. 말이 많아지면 피로해집니다. 간섭이 부담입니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 연결감이 없으면 외로워집니다.\n한 사람의 침묵이 다른 사람에게 단절로 느껴지고, 다른 사람의 깊은 감정 표현이 한 사람에게 부담이 됩니다.\n반복되는 패턴은 이렇게 나타납니다. "지금 혼자 있어야 해"와 "나랑 얘기하기 싫어?"가 반복됩니다.`
      : `한 사람은 혼자 회복하는 공간이 필요하고, 다른 사람은 깊은 감성 대화로 연결됩니다. 서로의 방식을 이해하면 관계가 더 편안해집니다.`,
    'black-navy': isCouple
      ? `두 사람 모두 감정을 안으로 담아두는 편입니다. 한 사람은 혼자 회복하고, 다른 사람은 혼자 책임을 지며 버팁니다.\n서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 패턴이 생깁니다.\n반복되는 패턴은 이렇게 나타납니다. 두 사람 모두 표현이 서툴러 거리감이 조용히 쌓입니다. 먼저 "요즘 어때?"라고 묻는 것이 이 관계를 따뜻하게 유지합니다.`
      : `두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 말로 확인하는 시간이 관계를 더 따뜻하게 만들어줍니다.`,
    'red-yellow': isCouple
      ? `한 사람은 감정이 생기면 바로 표현합니다. 즉각적인 반응과 스킨십이 중요합니다. 다른 사람은 현실적인 대화와 미래 계획을 중요하게 여깁니다. 감정보다 상황 정리가 먼저입니다.\n한 사람의 즉각적인 감정 표현이 다른 사람에게 충동적으로 느껴지고, 다른 사람의 현실 우선 태도가 한 사람에게 냉담하게 느껴집니다.\n반복되는 패턴은 이렇게 나타납니다. "지금 당장 반응해줘"와 "지금 그게 중요해?"가 교차합니다.`
      : `한 사람은 즉각적인 표현과 활동으로, 다른 사람은 현실적인 계획과 책임으로 관계를 이어갑니다. 서로의 우선순위를 이해하는 것이 관계의 핵심입니다.`,
    'pink-violet': isCouple
      ? `두 사람 모두 감정 표현과 연결감을 중요하게 여깁니다. 한 사람은 따뜻한 스킨십과 말로 사랑을 확인하고, 다른 사람은 깊은 감정 공감과 분위기 있는 대화를 원합니다.\n표현 방식은 다르지만 두 사람 모두 관계에 깊이 투자합니다.\n반복되는 패턴은 이렇게 나타납니다. "왜 이렇게 표면적이야?"와 "왜 이렇게 무거워?"가 교차합니다.`
      : `두 사람 모두 감정 표현을 중요하게 여깁니다. 표현 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'pink-yellow': isCouple
      ? `한 사람은 따뜻한 표현과 스킨십으로 사랑을 확인하고 싶어 합니다. 다른 사람은 현실적인 책임과 꾸준한 행동으로 마음을 보여줍니다.\n한 사람의 표현 욕구와 다른 사람의 행동 언어가 달라서 생기는 오해입니다.\n반복되는 패턴은 이렇게 나타납니다. "말로도 해줘"와 "이미 다 하고 있잖아"가 반복됩니다.`
      : `한 사람은 따뜻한 표현으로, 다른 사람은 현실적인 행동으로 관계를 이어갑니다. 서로의 사랑 언어를 이해하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
    'navy-violet': isCouple
      ? `한 사람은 책임감 있는 행동과 꾸준함으로 관계를 지킵니다. 말보다 행동이 먼저입니다. 다른 사람은 감정 공감과 깊은 대화를 원합니다. 분위기와 감성 연결이 중요합니다.\n행동 언어와 감성 언어가 달라서 생기는 오해입니다.\n반복되는 패턴은 이렇게 나타납니다. "이미 다 하고 있잖아"와 "그래도 감정 얘기가 하고 싶어"가 교차합니다.`
      : `한 사람은 책임감 있는 행동으로, 다른 사람은 깊은 감성 대화로 연결됩니다. 서로의 사랑 언어를 이해하는 것이 관계를 더 가깝게 만들어줍니다.`,
    'navy-yellow': isCouple
      ? `두 사람 모두 현실적이고 책임감 있는 방식으로 관계를 이어갑니다. 한 사람은 신뢰와 꾸준함으로, 다른 사람은 현실 계획과 생활 패턴으로 관계를 지킵니다.\n두 사람 모두 감정 표현이 적어 거리감이 조용히 쌓이는 패턴이 있습니다.\n반복되는 패턴은 이렇게 나타납니다. "우리 요즘 감정 얘기를 안 하는 것 같아"라는 말이 나올 수 있습니다. 현실 대화 속에서도 "오늘 고마웠어" 한 마디가 관계를 따뜻하게 유지해줍니다.`
      : `두 사람 모두 현실적이고 책임감 있는 방식으로 관계를 이어갑니다. 가끔 감정 표현을 더하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
    'red-pink': isCouple
      ? `한 사람은 감정이 생기면 바로 표현합니다. 즉각적인 반응과 스킨십, 빠른 연결이 중요합니다. 생활 속에서도 빠른 결정과 실행을 선호하고, 정체되는 상황을 답답하게 느낍니다. 다른 사람은 따뜻한 말과 인정, 감정적 공감이 필요합니다. 관계 온도를 중요하게 여기고, 상처를 받으면 오래 기억하는 편입니다.\n한 사람의 즉각적인 에너지가 다른 사람에게 활기를 주고, 다른 사람의 따뜻한 배려가 한 사람에게 온기를 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 빠르게 표현하고 넘어가려 할 때, 다른 사람은 아직 감정이 정리되지 않은 상태입니다. "이미 말했잖아"와 "그때 그 말이 아직 마음에 걸려"가 교차합니다. 표현 속도와 감정 회복 속도가 다릅니다.`
      : `한 사람은 즉각적으로 표현하고, 다른 사람은 감정을 천천히 소화합니다. 표현 속도 차이가 반복적인 긴장 포인트입니다.`,
    'red-blue': isCouple
      ? `한 사람은 감정이 생기면 바로 표현합니다. 즉각적인 반응과 스킨십이 중요합니다. 생활 속에서 빠른 결정과 실행을 선호합니다. 다른 사람은 신뢰와 약속, 정돈된 생활 흐름을 중요하게 여깁니다. 감정을 충분히 정리한 후에야 표현하고, 기준이 깨지면 예민해집니다.\n한 사람의 즉각적인 에너지가 다른 사람에게 활기를 주고, 다른 사람의 신뢰감이 한 사람에게 안정감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 "지금 바로 반응해줘"라고 느낄 때, 다른 사람은 "나는 정리 중이야"라는 상태입니다. 생활 속에서 "왜 이렇게 즉흥적이야"와 "왜 이렇게 딱딱해"가 교차합니다. 속도와 기준의 차이가 반복됩니다.`
      : `한 사람은 즉각적으로 반응하고, 다른 사람은 신뢰와 기준을 중심으로 움직입니다. 속도와 기준 차이가 반복적인 긴장 포인트입니다.`,
    'white-blue': isCouple
      ? `한 사람은 집안 정리와 생활 루틴이 안정되어야 마음이 편안합니다. 감정을 정리한 후 표현하고, 청결 기준이 높습니다. 다른 사람은 신뢰와 약속, 정돈된 관계 흐름을 중요하게 여깁니다. 감정보다 원칙과 기준을 먼저 챙기는 편입니다.\n두 사람 모두 감정을 안으로 담아두는 편이고, 생활 기준이 명확합니다.\n반복되는 패턴은 이렇게 나타납니다. 서로 "괜찮아"라고 말하면서 실제로는 기대와 실망이 쌓이는 패턴이 생깁니다. 정리 기준이나 생활 방식이 다를 때 조용히 예민해지고, 그 예민함을 말로 꺼내지 않아 거리감이 생깁니다. 가끔 "오늘 어땠어?"라고 먼저 묻는 것이 이 관계를 따뜻하게 유지합니다.`
      : `두 사람 모두 감정을 안으로 담아두고 생활 기준이 명확합니다. 가끔 말로 확인하는 시간이 관계를 더 따뜻하게 만들어줍니다.`,
    'pink-indigo': isCouple
      ? `한 사람은 따뜻한 말과 인정, 감정적 공감이 필요합니다. 지금 당장 따뜻한 반응을 원하고, 스킨십과 함께하는 시간이 중요합니다. 다른 사람은 깊이 생각하며 신중하게 반응합니다. 충분히 내면을 정리한 후에야 말하고, 감정보다 의미와 방향을 중요하게 여깁니다.\n한 사람의 따뜻함이 다른 사람에게 온기를 주고, 다른 사람의 깊이가 한 사람에게 신뢰감을 줍니다.\n반복되는 패턴은 이렇게 나타납니다. "왜 반응이 없어?"와 "나는 생각 중이야"가 반복됩니다. 한 사람이 인정과 공감을 원할 때, 다른 사람은 아직 정리 중입니다. 인정 욕구와 신중함이 균형을 이룰 때 두 사람의 관계는 가장 안정적입니다.`
      : `한 사람은 따뜻한 표현과 인정을 원하고, 다른 사람은 깊이 생각한 후 반응합니다. 표현 속도 차이가 반복적인 긴장 포인트입니다.`,
    'indigo-yellow': isCouple
      ? `한 사람은 깊이 생각하며 신중하게 반응합니다. 내면을 정리한 후에야 말하고, 의미와 방향을 중요하게 여깁니다. 다른 사람은 현실적인 안정과 책임감을 중요하게 여깁니다. 재정 계획, 생활 루틴, 미래 준비가 관계 신뢰의 기반입니다.\n두 사람 모두 현실 안정을 중요하게 여기지만, 한 사람은 내면 정리 후 표현하고 다른 사람은 현실 계획과 행동으로 마음을 보여줍니다.\n반복되는 패턴은 이렇게 나타납니다. 감정 표현이 줄어드는 패턴이 생깁니다. 서로 "괜찮아"라고 말하면서 실제로는 지쳐가는 흐름이 쌓입니다. 가끔 "오늘 마음은 어땠어?"라고 먼저 묻는 것이 두 사람 사이를 따뜻하게 유지해줍니다.`
      : `두 사람 모두 현실 안정을 중요하게 여깁니다. 가끔 감정 표현을 더하는 것이 관계를 더 따뜻하게 만들어줍니다.`,
  };
  const colorA0_contrast = colorsA[0]?.id ?? '';
  const colorB0_contrast = colorsB[0]?.id ?? '';
  const colorContrastResult = colorIdContrastMap[`${colorA0_contrast}-${colorB0_contrast}`] ?? colorIdContrastMap[`${colorB0_contrast}-${colorA0_contrast}`];
  if (colorContrastResult) return colorContrastResult + (shapeProfileNote ?? '');

  // 포낙 — 계열별 기본 대비 문장
  const fallbackA = getFamilyProfileLabel(fA);
  const fallbackB = getFamilyProfileLabel(fB);
  const attrLine = getAttractionLine(fA, fB);
  const baseResult = contrastMap[key] ?? contrastMap[reverseKey] ?? `${nameA}의 성향을 가진 사람은 ${fallbackA} 방식으로 관계를 이어갑니다. ${nameB}의 성향을 가진 사람은 ${fallbackB} 방식으로 연결됩니다.\n${attrLine}\n반복되는 패턴은 이렇게 나타납니다. 서로의 방식이 다를 뿐인데, 그 다름이 거리감으로 읽히는 순간이 생깁니다. 서로의 의도를 먼저 확인하는 것이 오해를 줄이는 가장 빠른 방법입니다.`;
  return baseResult + (shapeProfileNote ?? '');
}

function getFamilyProfileLabel(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '감정을 바로 표현하고 빠르게 반응하는',
    warm_soft: '따뜻하게 배려하며 관계 온도를 중요하게 여기는',
    warm_grounded: '안정적이고 꾸준하게 신뢰를 쌓는',
    cool_clear: '명료하게 정리하고 논리적으로 판단하는',
    cool_deep: '내면에서 천천히 정리하며 깊이 생각하는',
    nature: '자신의 리듬을 따르며 자연스럽게 흐르는',
    neutral: '균형을 유지하며 안정적으로 살아가는',
  };
  return map[family];
}

function buildClosingMessage(
  fA: EnergyFamily, fB: EnergyFamily,
  rel: RelationType,
  faithA: FaithType, faithB: FaithType
): string {
  const relLabel = rel === '연인' || rel === '부부' ? '두 분' : '두 사람';
  const hasFaith = faithA === '기독교' || faithB === '기독교';
  const faithSuffix = hasFaith ? ' 두 분의 관계 위에 하나님의 은혜와 평안이 함께하기를 바랍니다.' : '';

  // 에너지 조합별 감정 온도 차별화
  const key = `${fA}-${fB}`;

  // 연인/부부 조합별 메시지
  const coupleComboMessages: Partial<Record<string, string>> = {
    'warm_active-warm_active': `두 분 모두 많은 것을 주고 달려온 시간이었습니다. 이제는 서로를 쉽게 해주는 시간을 연습하세요. 두 분이 함께 쉽는 방법을 찾아가는 것이 지금 가장 아름다운 연습입니다.`,
    'warm_active-cool_deep': `한 분은 말하고 싶고, 다른 분은 조용히 정리하고 싶었을 겁니다. 두 방식 모두 상대를 향한 진심에서 비롯됩니다. 서로의 속도를 존중하는 것이 두 분 사이의 신뢰를 더 깊게 만들어줍니다.`,
    'cool_deep-warm_active': `한 분은 조용히 정리하고 싶고, 다른 분은 말하고 싶었을 겁니다. 두 방식 모두 상대를 향한 진심에서 비롯됩니다. 서로의 속도를 존중하는 것이 두 분 사이의 신뢰를 더 깊게 만들어줍니다.`,
    'warm_soft-cool_clear': `한 분은 마음으로, 다른 분은 행동으로 사랑을 전합니다. 두 방식 모두 진심입니다. 서로의 언어를 조금씩 번역해주는 노력이 두 분 사이를 더 가까운 곳으로 데려다줍니다.`,
    'cool_clear-warm_soft': `한 분은 행동으로, 다른 분은 마음으로 사랑을 전합니다. 두 방식 모두 진심입니다. 서로의 언어를 조금씩 번역해주는 노력이 두 분 사이를 더 가까운 곳으로 데려다줍니다.`,
    'cool_deep-cool_deep': `두 분 모두 말보다 마음으로 더 많이 느끼는 사람들입니다. 지금 두 분에게 필요한 것은 더 많은 대화가 아니라, 서로의 침묵을 이해하는 시간입니다. 오늘 이 자리가 그 시작이 되길 바랍니다.`,
    'nature-nature': `두 분 모두 조용히, 천천히 함께하는 것을 좋아하는 사람들입니다. 서로를 서두르지 않는 것이 두 분의 가장 큰 선물입니다. 오늘 이 시간이 두 분의 연결을 더 편안하게 만들어줍니다.`,
    'nature-warm_active': `한 분은 조용히 있고 싶고, 다른 분은 함께 무언가를 하고 싶었을 겁니다. 두 방식이 자연스럽게 어우러지는 순간이 두 분의 관계를 가장 편안하게 만들어줍니다.`,
    'warm_active-nature': `한 분은 함께 무언가를 하고 싶고, 다른 분은 조용히 있고 싶었을 겁니다. 두 방식이 자연스럽게 어우러지는 순간이 두 분의 관계를 가장 편안하게 만들어줍니다.`,
    'warm_grounded-warm_grounded': `두 분 모두 안정적이고 일상적인 것에서 사랑을 느낍니다. 지금 두 분에게 필요한 것은 새로운 것이 아니라, 일상 속 작은 순간에 다시 집중하는 것입니다. 오늘 이 시간이 그 연습의 시작이 되길 바랍니다.`,
    'warm_soft-warm_soft': `두 분 모두 따뜻하고 배려 깊은 사람들입니다. 서로를 위하는 마음이 다른 누구보다 많으니, 이제는 자신에게도 그 따뜻함을 돌려주세요. 서로를 쉽게 해주는 것이 두 분의 관계를 더 풍성하게 만들어줍니다.`,
  };

  // 연인/부부인 경우 조합별 메시지 우선
  if ((rel === '연인' || rel === '부부') && (coupleComboMessages[key] || coupleComboMessages[`${fB}-${fA}`])) {
    const msg = coupleComboMessages[key] ?? coupleComboMessages[`${fB}-${fA}`] ?? '';
    // 부부는 추가 문장
    const marriageSuffix = rel === '부부' ? ' 오랜 시간이 쌓인 관계일수록, 서로를 다시 바라보는 시선이 새로운 시작이 됩니다.' : '';
    return msg + marriageSuffix + faithSuffix;
  }

  // 에너지 조합 × 관계 유형별 세분화 메시지 — 반복 패턴 4종(표현 방식 차이/연결 욕구/혼자만의 시간/산책) 제거
  const isCouple = rel === '연인' || rel === '부부';
  const isParentChild = rel === '부모-자녀' || rel === '아빠-아들' || rel === '아빠-딸' || rel === '엄마-아들' || rel === '엄마-딸';
  const isColleague = rel === '동료';
  const isFriend = rel === '친구';

  // 에너지 조합 × 관계 유형 조합 메시지
  const comboRelKey = `${key}-${rel}`;
  const comboRelMessages: Partial<Record<string, string>> = {
    // warm_active × 관계 유형
    'warm_active-cool_deep-친구': `한 사람은 바로 말하고 싶고, 다른 사람은 충분히 정리한 후 말합니다. 오늘 이 리듬 차이를 이해한 것만으로도 두 사람의 우정은 이미 더 단단해졌습니다. 먼저 연락하는 사람이 항상 같지 않아도 됩니다.`,
    'warm_active-cool_deep-동료': `한 사람은 빠르게 실행하고, 다른 사람은 충분히 검토한 후 움직입니다. 이 속도 차이를 이해하면 협업이 훨씬 자연스러워집니다. 오늘의 흐름이 더 효율적이고 편안한 협업의 시작이 되길 바랍니다.`,
    'warm_active-cool_deep-아빠-아들': `아버지와 아들은 에너지의 방향이 다를 수 있습니다. 한 사람은 빠르게 표현하고, 다른 사람은 충분히 정리한 후 말합니다. 오늘 이 결이 두 사람 사이에 더 편안한 대화의 문을 열어주는 계기가 되길 바랍니다.`,
    'warm_active-cool_deep-아빠-딸': `아버지와 딸은 에너지의 속도가 다를 수 있습니다. 한 사람은 직접적으로, 다른 사람은 천천히 마음을 엽니다. 오늘 이 결이 그 마음을 더 가까이 연결하는 시작이 되길 바랍니다.`,
    'warm_active-cool_deep-엄마-아들': `어머니와 아들은 소통의 리듬이 다를 수 있습니다. 한 사람은 바로 표현하고, 다른 사람은 충분히 정리한 후 말합니다. 오늘 이 결이 두 사람 사이에 더 자연스러운 대화의 출발점이 되길 바랍니다.`,
    'warm_active-cool_deep-엄마-딸': `어머니와 딸은 에너지의 방향이 다를 수 있습니다. 한 사람은 빠르게 표현하고, 다른 사람은 천천히 정리합니다. 오늘 이 결이 두 사람 사이의 거리를 조금 더 좁혀주는 계기가 되길 바랍니다.`,
    // warm_soft × 관계 유형
    'warm_soft-cool_clear-친구': `한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 생각합니다. 오늘 이 차이를 이해한 것이 두 사람의 우정을 더 편안하게 만들어줍니다. 서로의 방식을 인정하는 우정이 가장 오래 지속됩니다.`,
    'warm_soft-cool_clear-동료': `한 사람은 관계 중심으로, 다른 사람은 업무 중심으로 일합니다. 이 차이를 이해하면 협업이 훨씬 자연스러워집니다. 오늘의 흐름이 더 균형 잡힌 협업의 시작이 되길 바랍니다.`,
    'warm_soft-cool_clear-아빠-아들': `아버지와 아들은 마음을 전하는 방식이 다릅니다. 한 사람은 감정으로, 다른 사람은 행동으로 마음을 전합니다. 오늘 이 결이 두 사람 사이에 더 따뜻한 이해의 시작이 되길 바랍니다.`,
    'warm_soft-cool_clear-아빠-딸': `아버지와 딸은 마음을 전하는 언어가 다를 수 있습니다. 한 사람은 감정으로, 다른 사람은 실질적인 행동으로 사랑을 전합니다. 오늘 이 결이 그 마음을 더 가까이 전하는 계기가 되길 바랍니다.`,
    'warm_soft-cool_clear-엄마-아들': `어머니와 아들은 마음을 전하는 방식이 다를 수 있습니다. 한 사람은 감정적 연결을, 다른 사람은 실질적인 해결을 먼저 생각합니다. 오늘 이 결이 두 사람 사이에 더 자연스러운 소통의 출발점이 되길 바랍니다.`,
    'warm_soft-cool_clear-엄마-딸': `어머니와 딸은 닮은 만큼 다를 수 있습니다. 한 사람은 감정으로, 다른 사람은 실질로 마음을 전합니다. 오늘 이 결이 두 사람 사이의 온도를 조금 더 높여주는 계기가 되길 바랍니다.`,
    // warm_grounded × 관계 유형
    'warm_grounded-cool_clear-동료': `한 사람은 일상적인 신뢰를 쌓는 방식으로, 다른 사람은 명확한 기준으로 일합니다. 이 차이를 이해하면 협업이 훨씬 효율적이고 편안해집니다. 오늘의 흐름이 더 신뢰 높은 협업의 시작이 되길 바랍니다.`,
    'warm_grounded-cool_clear-친구': `한 사람은 묵묵히 곁에 있어주는 방식으로, 다른 사람은 명확하게 표현하는 방식으로 우정을 쌓습니다. 이 차이가 오히려 서로에게 균형을 줄 수 있습니다. 오늘 이 결이 두 사람의 우정을 더 단단하게 만들어줍니다.`,
    // cool_deep × 관계 유형
    'cool_deep-cool_deep-친구': `두 사람 모두 말보다 마음으로 더 많이 느끼는 사람들입니다. 연락이 뜸해도 서로를 잊지 않는다는 것을 알고 있습니다. 오늘 이 자리가 두 사람의 연결을 다시 확인하는 시간이 되길 바랍니다.`,
    'cool_deep-cool_deep-동료': `두 사람 모두 깊이 생각하고 신중하게 움직이는 사람들입니다. 함께 일하면 서로의 깊이를 존중하는 협업이 가능합니다. 오늘의 흐름이 더 깊이 있는 협업의 시작이 되길 바랍니다.`,
    // nature × 관계 유형
    'nature-nature-친구': `두 사람 모두 자연스러운 리듬을 가진 사람들입니다. 억지로 연락하지 않아도 편안한 우정이 두 사람의 강점입니다. 오늘 이 시간이 그 편안함을 다시 확인하는 계기가 되길 바랍니다.`,
    'nature-nature-동료': `두 사람 모두 자신의 리듬을 지키며 일하는 사람들입니다. 서로를 강요하지 않는 협업 방식이 두 사람의 강점입니다. 오늘의 흐름이 더 자연스러운 협업의 시작이 되길 바랍니다.`,
    // warm_active × warm_active
    'warm_active-warm_active-친구': `두 사람 모두 에너지가 높고 직접적인 사람들입니다. 함께 있으면 활기차지만, 둘 다 지쳐있을 때는 서로를 쉬게 해주는 연습이 필요합니다. 오늘 이 시간이 그 연습의 시작이 되길 바랍니다.`,
    'warm_active-warm_active-동료': `두 사람 모두 빠르게 움직이고 직접 표현하는 사람들입니다. 함께 일하면 추진력이 강하지만, 서로의 속도를 조율하는 연습이 더 좋은 결과를 만들어줍니다. 오늘의 흐름이 그 조율의 시작이 되길 바랍니다.`,
  };

  // 에너지 조합 × 관계 유형 조합 메시지 우선 적용
  const comboMsg = comboRelMessages[comboRelKey] ?? comboRelMessages[`${fB}-${fA}-${rel}`];
  if (comboMsg) return comboMsg + faithSuffix;

  // 에너지 조합별 관계 유형 공통 메시지 (관계 유형 무관)
  const energyComboMessages: Partial<Record<string, string>> = {
    'warm_active-warm_soft': isCouple
      ? `한 분은 직접적으로 표현하고, 다른 분은 배려로 마음을 전합니다. 두 방식이 만나는 지점에서 두 분의 관계가 가장 따뜻해집니다. 오늘 이 결이 그 만남의 시작이 되길 바랍니다.`
      : isColleague
        ? `한 사람은 빠르게 표현하고, 다른 사람은 배려하며 접근합니다. 이 두 방식이 균형을 이루면 팀 전체에 긍정적인 에너지가 됩니다. 오늘의 흐름이 더 좋은 협업의 시작이 되길 바랍니다.`
        : `한 사람은 직접적으로 표현하고, 다른 사람은 배려로 마음을 전합니다. 오늘 서로의 방식을 이해한 것이 두 사람의 관계를 더 따뜻하게 만들어줍니다.`,
    'warm_soft-warm_active': isCouple
      ? `한 분은 배려로, 다른 분은 직접적인 표현으로 마음을 전합니다. 두 방식이 만나는 지점에서 두 분의 관계가 가장 따뜻해집니다. 오늘 이 결이 그 만남의 시작이 되길 바랍니다.`
      : `한 사람은 배려로, 다른 사람은 직접적으로 마음을 전합니다. 오늘 서로의 방식을 이해한 것이 두 사람의 관계를 더 편안하게 만들어줍니다.`,
    'warm_grounded-warm_soft': isCouple
      ? `한 분은 안정적인 일상으로, 다른 분은 따뜻한 배려로 사랑을 전합니다. 두 방식이 자연스럽게 어우러지는 것이 두 분의 가장 큰 강점입니다.`
      : `한 사람은 안정적인 방식으로, 다른 사람은 따뜻한 배려로 관계를 이어갑니다. 오늘 이 결이 두 사람의 관계를 더 단단하게 만들어줍니다.`,
    'cool_clear-cool_deep': isCouple
      ? `한 분은 명료하게 정리하고, 다른 분은 깊이 느끼는 방식으로 관계를 경험합니다. 두 방식이 균형을 이루면 두 분의 관계는 더 깊고 안정적이 됩니다.`
      : isColleague
        ? `한 사람은 명확한 기준으로, 다른 사람은 깊이 생각하는 방식으로 일합니다. 이 두 방식이 균형을 이루면 팀 전체에 깊이와 명료함이 더해집니다.`
        : `한 사람은 명료하게 정리하고, 다른 사람은 깊이 느끼는 방식으로 관계를 경험합니다. 오늘 이 결이 두 사람의 관계를 더 깊게 만들어줍니다.`,
    'warm_grounded-nature': isCouple
      ? `한 분은 안정적인 일상으로, 다른 분은 자연스러운 리듬으로 관계를 이어갑니다. 두 방식이 자연스럽게 어우러지는 것이 두 분의 가장 편안한 연결입니다.`
      : `한 사람은 안정적인 방식으로, 다른 사람은 자신의 리듬으로 관계를 이어갑니다. 오늘 이 결이 두 사람의 관계를 더 편안하게 만들어줍니다.`,
    'cool_clear-nature': isColleague
      ? `한 사람은 명확한 기준으로, 다른 사람은 자신의 리듬으로 일합니다. 이 두 방식이 균형을 이루면 협업이 훨씬 자연스러워집니다. 오늘의 흐름이 더 좋은 협업의 시작이 되길 바랍니다.`
      : `한 사람은 명료하게 정리하고, 다른 사람은 자신의 리듬을 지킵니다. 오늘 이 결이 두 사람의 관계를 더 자연스럽게 만들어줍니다.`,
  };

  const energyMsg = energyComboMessages[key] ?? energyComboMessages[`${fB}-${fA}`];
  if (energyMsg) return energyMsg + faithSuffix;

  // 관계 유형별 기본 메시지 (에너지 조합 무관)
  const relMessages: Record<RelationType, string> = {
    '연인': `두 분의 에너지 결이 다르다는 것은 약점이 아니라, 서로를 더 풍성하게 만드는 힘입니다. 오늘 이 결을 함께 나눈 것만으로도 이미 한 걸음 더 가까워졌습니다.`,
    '부부': `오랜 시간을 함께해온 두 분의 관계 안에는 이미 많은 이해가 쌓여 있습니다. 지금 필요한 것은 새로운 시작이 아니라, 서로를 다시 바라보는 따뜻한 시선입니다. 오늘 이 시간이 그 시작이 되길 바랍니다.`,
    '친구': `서로의 에너지 결을 이해하는 우정이 가장 오래 지속됩니다. 오늘 서로의 흐름을 함께 살펴본 것이 두 사람의 우정을 더 깊고 단단하게 만들어줍니다.`,
    '부모-자녀': `세대가 다르고 경험이 달라도, 서로를 향한 마음의 방향은 같습니다. 오늘 두 사람의 에너지 결을 함께 살펴본 것이, 더 편안한 대화의 출발점이 되길 바랍니다.`,
    '아빠-아들': `아버지와 아들은 서로에게 가장 많은 것을 기대하는 사이입니다. 기대가 클수록 표현이 어려워질 수 있습니다. 오늘 이 결이 두 사람 사이에 조금 더 편안한 언어를 만들어주는 계기가 되길 바랍니다.`,
    '아빠-딸': `아버지와 딸은 서로를 아끼는 방식이 다를 수 있습니다. 말보다 행동으로, 행동보다 진심으로 마음을 전하는 순간이 있습니다. 오늘 이 결이 그 마음을 더 가까이 전하는 시작이 되길 바랍니다.`,
    '엄마-아들': `어머니와 아들은 서로에게 가장 솔직하면서도 가장 오해하기 쉬운 사이입니다. 오늘 두 사람의 에너지 결을 함께 살펴본 것이, 더 따뜻한 이해의 시작이 되길 바랍니다.`,
    '엄마-딸': `어머니와 딸은 닮은 만큼 부딪히고, 닮은 만큼 깊이 이해할 수 있는 사이입니다. 오늘 두 사람의 에너지 결을 살펴본 것이 서로를 더 깊이 이해하는 계기가 되길 바랍니다.`,
    '형제자매': `가장 가까운 사이이기에 더 솔직하고, 때로는 더 상처받기도 합니다. 오늘 서로의 에너지 결을 함께 살펴본 것이 두 사람 사이에 더 따뜻한 공간을 만들어줍니다. 서로를 이해하는 형제자매가 가장 큰 자산입니다.`,
    '동료': `함께 일하는 사이에서도 서로의 에너지 결을 이해하면 갈등 없이 더 잘 협력할 수 있습니다. 오늘 두 사람의 에너지 방향을 살펴본 것이 더 편안한 협업 관계의 출발점이 되길 바랍니다.`,
  };

  const base = relMessages[rel] ?? `${relLabel}의 에너지 결을 함께 살펴보았습니다. 서로를 이해하는 것이 관계를 더 깊게 만드는 시작입니다.`;
  return base + faithSuffix;
}

// ── 관계 Archetype 시스템 ─────────────────────────────────────────────────────
/**
 * 10가지 관계 유형 (archetype)
 * 컬러 에너지 조합 + 도형 특성 → 관계의 핵심 긴장 구조 결정
 */
export type RelationArchetype =
  | '온도차형'        // 표현 속도·온도 차이 중심
  | '성장자극형'      // 서로를 변화시키는 긴장 중심
  | '안정추구형'      // 평온하지만 정체될 수 있는 패턴
  | '감정순환형'      // 감정이 빠르게 돌고 회복도 빠름
  | '거리조절형'      // 가까워졌다 멀어지는 반복 패턴
  | '보호자형'        // 한 사람이 감싸고 다른 사람이 기대는 구조
  | '친구형'          // 편안하지만 감정 깊이가 얕아질 수 있음
  | '이상주의형'      // 깊은 연결을 꿈꾸지만 현실과 충돌
  | '현실균형형'      // 실용적이고 안정적이지만 감성 연결 필요
  | '회복형';         // 갈등 후 회복 패턴이 반복됨

export interface ArchetypeResult {
  archetype: RelationArchetype;
  /** 유형 대표 컬러 (카드 배경/배지/강조에 사용) */
  accentColor: string;
  /** 결과 상단에 표시되는 유형 이름 */
  typeName: string;
  /** 유형 이모지 */
  typeEmoji: string;
  /** 한 줄 핵심 요약 (캡쳐/공유용) */
  coreSummary: string;
  /** 이 관계의 핵심 긴장 구조 설명 */
  tensionDescription: string;
  /** 오해 패턴 (archetype 고유) */
  misunderstandingPattern: string;
  /** 연결 방식 (archetype 고유) */
  connectionStyle: string;
  /** 회복 루틴 (archetype 고유) */
  recoveryRoutine: string;
  /** 필요한 말 (archetype 고유) */
  neededWords: string;
  /** 추천 활동 (archetype 고유) */
  recommendedActivity: string;
  /** 감정 회복 방식 (archetype 고유) */
  emotionRecoveryStyle: string;
  /** 대화 루틴 (archetype 고유) */
  conversationRoutine: string;
  /** 정서 연결 루틴 (archetype 고유) */
  connectionRoutine: string;
  /** 애정 표현 루틴 (archetype 고유) */
  affectionRoutine: string;
  /** 감정 회복 루틴 (archetype 고유) */
  emotionRoutine: string;
  /** 마지막 코칭 메시지 (archetype 고유 엔딩 분위기) */
  closingMessage: string;
  /** 관계 온도 지표 (0-100 범위, 감정온도/표현강도/회복속도) */
  temperatureGraph: { emotionGap: number; expressionIntensity: number; recoverySpeed: number };
  /** 표현 속도 차이 (A: 빠름/느림 레이블, B: 빠름/느림 레이블) */
  expressionSpeed: { personA: string; personB: string; description: string };
  /** 회복 방식 아이콘 타입 */
  recoveryStyle: { icon: 'alone' | 'talk' | 'activity' | 'touch' | 'mixed' | 'routine'; label: string; description: string };
  /** 이 관계의 위험 패턴 */
  dangerPattern: string;
  /** 싸울 때 하면 안 되는 말 */
  forbiddenWords: string[];
  /** 이 관계가 오래가는 이유 (실제 강점) */
  relationStrength: string;
  /** archetype 기반 추천 컬러 (유형별 감정 에너지 맞춤) */
  recommendedColors?: { id: string; korName: string; hex: string; reason: string }[];
  /** 현실 감정 — 이 관계에서 올라올 수 있는 감정과 회복 흐름 연결 (선택적) */
  realEmotions?: {
    /** "이런 감정이 올라올 수 있습니다" 목록 */
    feelings: string[];
    /** 현실 감정 뒤 회복 흐름 연결 문장 */
    recoveryBridge: string;
  };
  /**
   * profileContrast 섹션 오버라이드 (선택적)
   * 설정 시 컬러 조합 기반 자동 생성 텍스트 대신 archetype 감정선 텍스트가 표시됩니다.
   */
  profileContrastOverride?: {
    /** "왜 끌리는데 왜 힘든지" 섹션 오버라이드 */
    attractionContrast?: string;
    /** "두 사람의 관계 패턴" 섹션 오버라이드 */
    relationFlow?: string;
    /** "서로 다른 표현 방식" 섹션 오버라이드 */
    expressionDifference?: string;
    /** "오해가 생기는 순간" 섹션 오버라이드 */
    conflictPattern?: string;
    /** "두 사람이 연결되는 방식" 섹션 오버라이드 */
    connectionStyle?: string;
  };
  /**
   * 생활 관계 섹션 — 컬러+도형 조합 기반 실제 생활 패턴 분석
   * 재정 스타일 / 청소·정리 / 휴식 방식 / 애정 표현 / 갈등 직후 반응
   */
  lifestyleSections?: {
    /** 재정 스타일 차이 */
    finance?: { title: string; description: string; personA: string; personB: string; tension: string };
    /** 청소·정리 스타일 */
    cleaning?: { title: string; description: string; personA: string; personB: string; tension: string };
    /** 휴식·회복 방식 */
    rest?: { title: string; description: string; personA: string; personB: string; tension: string };
    /** 애정 표현 생활 방식 */
    affection?: { title: string; description: string; personA: string; personB: string; tip: string };
    /** 갈등 직후 반응 차이 */
    conflict?: { title: string; description: string; personA: string; personB: string; tip: string };
  };
  /**
   * 갈등 순간 반응 패턴 — misunderstandingPattern + conflict 통합
   * 오해 발생 → 갈등 직후 반응 → 감정 처리 방식을 하나의 흐름으로
   */
  conflictReactionPattern?: string;
  /**
   * 사랑과 연결 방식 — connectionStyle + affection + intimacy 통합
   * 사랑 느끼는 방식 → 표현 방식 → 안정감 → 연결 방식
   */
  loveConnectionStyle?: string;
  /**
   * 관계 성장 코칭 — 5축 구조
   * 강점 / 사랑 방식 / 서로 살아나는 방식 / 부족해지기 쉬운 부분 / 건강하게 오래 가기 위한 균형
   */
  growthCoaching?: {
    /** 이 관계의 강점 */
    strengths: { keywords: string[]; description: string };
    /** 이 관계가 사랑하는 방식 */
    loveStyle: { keywords: string[]; description: string };
    /** 서로 살아나는 방식 */
    alivePattern: { keywords: string[]; description: string };
    /** 부족해지기 쉬운 부분 (뱄난 없이 부드럽게) */
    blindSpot: { description: string };
    /** 건강하게 오래 가기 위한 균형 */
    growthBalance: { description: string };
  };
  /**
   * 5축 통합 섹션 — 이 필드가 있으면 couple-result.tsx에서 기존 중복 섹션 대체
   * 1. 관계 핵심 / 2. 생활 관계 패턴 / 3. 싸움 패턴 / 4. 연결 방식 / 5. 성장 포인트
   */
  unifiedSections?: {
    /** 1. 관계 핵심 — 왜 끌리는지, 무엇 때문에 연결되는지 */
    coreEnergy: {
      headline: string;        // 한 줄 핵심 (예: "속도 차이가 끌림이 되는 관계")
      description: string;     // 2~3문장 관계 에너지 설명
      keywords: string[];      // 핵심 키워드 3~5개
    };
    /** 2. 생활 관계 패턴 — 실제 같이 사는 느낌 */
    lifePattern: {
      headline: string;
      items: Array<{
        icon: string;          // 이모지 아이콘
        label: string;         // 항목명 (예: "재정 스타일")
        personA: string;       // A의 방식
        personB: string;       // B의 방식
        tension: string;       // 충돌/긴장 포인트
      }>;
    };
    /** 3. 싸움 패턴 — 갈등 시작→반응→위험→금지 말 흐름 */
    conflictFlow: {
      trigger: string;         // 싸움이 시작되는 순간
      reaction: string;        // 갈등 직후 반응 (A vs B)
      danger: string;          // 반복 위험 패턴
      forbiddenWords: string[]; // 절대 조심할 말
    };
    /** 4. 연결 방식 — 이 관계가 가까워지는 방식 (유형별 완전히 다름) */
    connectionFlow: {
      headline: string;
      description: string;     // 이 관계만의 연결 방식
      actions: string[];       // 구체적 연결 행동 3~5개
      skinshipNote: string;    // 스킨십/친밀감 방식
    };
    /** 5. 성장 포인트 — 함께 배우고 성장해야 할 방향 */
    growthPoint: {
      strength: string;        // 이 관계의 강점 (1~2문장)
      blindSpot: string;       // 부족해지기 쉬운 부분 (부드럽게)
      growthDirection: string; // 함께 성장해야 할 방향
      tip: string;             // 실용적 한 줄 팁
    };
  };
  /**
   * 함께하면 좋은 회복 루틴 — 관계 유형별 실제 생활 감성 루틴
   * 분석이 아닌 "함께 살아가는 느낌"을 주는 섹션
   */
  togetherRoutine: {
    /** 루틴 목록 (3~6개) */
    routines: string[];
    /** 함께하면 살아나는 에너지 설명 (1~2문장) */
    energyNote: string;
    /** 기독교인 전용 루틴 (선택적) */
    faithRoutine?: string;
  };
  /** 친밀감 연결 방식 — 부부/연인 전용 (유형별 구체적 행동) */
  intimacyConnection: {
    /** 부부용 고정 안내 문구 */
    marriageNote: string;
    /** 연인용 경량 안내 문구 */
    loverNote: string;
    /** 유형별 구체적 연결 방식 (손잡기/포옹/기대기 등) */
    actions: string[];
  };
}

// 도형 조합 → 관계 긴장 방향 분류
type ShapeTension =
  | 'defense'       // 역삼각형 포함 — 방어/거리두기
  | 'stable'        // 네모 포함 — 안정/구조
  | 'flow'          // 원 포함 — 감정 순환/부드러운 연결
  | 'sensitive'     // 마름모 포함 — 감정 긴장/민감성
  | 'growth'        // 오각형 포함 — 성장/방향성
  | 'harmony'       // 육각형 포함 — 조율/균형
  | 'boundary'      // 삼각형 포함 — 경계/보호
  | 'mixed';        // 혼합

function getShapeTension(shapeA: string | undefined, shapeB: string | undefined): ShapeTension {
  const shapes = [shapeA, shapeB].filter(Boolean) as string[];
  if (shapes.includes('inverted_triangle')) return 'defense';
  if (shapes.includes('triangle')) return 'boundary';
  if (shapes.includes('diamond')) return 'sensitive';
  if (shapes.includes('pentagon')) return 'growth';
  if (shapes.includes('hexagon')) return 'harmony';
  if (shapes.includes('square')) return 'stable';
  if (shapes.includes('circle')) return 'flow';
  return 'mixed';
}

// ─── 다차원 감정 결 점수 테이블 ───────────────────────────────────────────
// 각 컬러 ID에 대해 6개 차원의 점수를 부여
// 차원: distance(거리/정화), tension(긴장/성장), recovery(회복/재연결), stable(안정/신뢰), expression(표현/즉각), circulation(감정순환/파도)
type EmotionDimension = {
  distance: number;    // 거리두기·정화·혼자 정리 신호
  tension: number;     // 긴장·충돌·성장 압박 신호
  recovery: number;    // 갈등 후 회복·재연결·다시 돌아오는 신호
  stable: number;      // 안정·신뢰·생활 루틴 신호
  expression: number;  // 즉각 표현·추진·감정 분출 신호
  circulation: number; // 감정 파도·빠른 순환·감정 온도 변화 신호
};

const COLOR_EMOTION_SCORE: Record<string, EmotionDimension> = {
  // ── 화이트: 거리/정화/감정 비움/완벽주의
  white:      { distance: 9, tension: 2, recovery: 3, stable: 4, expression: 1, circulation: 2 },
  // ── 그린: 관계 조율/회복/중재/균형
  green:      { distance: 3, tension: 2, recovery: 8, stable: 6, expression: 3, circulation: 4 },
  olive:      { distance: 3, tension: 3, recovery: 7, stable: 7, expression: 2, circulation: 3 },
  sage:       { distance: 4, tension: 2, recovery: 7, stable: 6, expression: 2, circulation: 3 },
  // ── 네이비: 책임/신뢰/압박/통제/긴장
  navy:       { distance: 5, tension: 7, recovery: 3, stable: 8, expression: 3, circulation: 2 },
  // ── 인디고: 내면/깊이/경계/성찰
  indigo:     { distance: 7, tension: 5, recovery: 4, stable: 5, expression: 2, circulation: 3 },
  // ── 바이올렛: 깊은 연결/이상/내면 탐색
  violet:     { distance: 5, tension: 4, recovery: 5, stable: 4, expression: 3, circulation: 5 },
  // ── 핑크: 애정/정서 회복/배려
  pink:       { distance: 2, tension: 2, recovery: 8, stable: 4, expression: 5, circulation: 7 },
  peach:      { distance: 2, tension: 2, recovery: 7, stable: 5, expression: 5, circulation: 6 },
  // ── 레드: 추진/욕구/즉각 반응/충돌
  red:        { distance: 2, tension: 8, recovery: 3, stable: 2, expression: 9, circulation: 6 },
  coral:      { distance: 2, tension: 6, recovery: 4, stable: 3, expression: 8, circulation: 6 },
  // ── 마젠타: 감정 몰입/깊은 연결/상처 후 회복
  magenta:    { distance: 3, tension: 5, recovery: 7, stable: 3, expression: 7, circulation: 8 },
  // ── 오렌지: 활력/관계/표현/생기
  orange:     { distance: 1, tension: 5, recovery: 5, stable: 3, expression: 8, circulation: 7 },
  // ── 블루: 신뢰/표현/진솔한 소통
  blue:       { distance: 4, tension: 3, recovery: 5, stable: 7, expression: 6, circulation: 4 },
  skyblue:    { distance: 3, tension: 2, recovery: 5, stable: 6, expression: 6, circulation: 5 },
  teal:       { distance: 4, tension: 2, recovery: 6, stable: 6, expression: 4, circulation: 4 },
  mint:       { distance: 3, tension: 1, recovery: 7, stable: 5, expression: 4, circulation: 5 },
  // ── 골드: 안정된 자신감/품격/현실
  gold:       { distance: 3, tension: 3, recovery: 4, stable: 9, expression: 4, circulation: 3 },
  brown:      { distance: 3, tension: 2, recovery: 4, stable: 9, expression: 2, circulation: 2 },
  terracotta: { distance: 3, tension: 4, recovery: 5, stable: 7, expression: 5, circulation: 4 },
  // ── 블랙: 경계/보호/깊이/내면 침잠
  black:      { distance: 8, tension: 6, recovery: 2, stable: 5, expression: 2, circulation: 2 },
  silver:     { distance: 6, tension: 3, recovery: 3, stable: 6, expression: 3, circulation: 3 },
  // ── 라벤더: 회복/균형/치유/부드러움
  lavender:   { distance: 4, tension: 1, recovery: 8, stable: 5, expression: 3, circulation: 5 },
  // ── 옐로우: 명료/밝음/가벼운 소통
  yellow:     { distance: 2, tension: 2, recovery: 5, stable: 5, expression: 7, circulation: 6 },
  // ── 베이지/크림: 편안함/안정/익숙함
  beige:      { distance: 2, tension: 1, recovery: 5, stable: 8, expression: 3, circulation: 3 },
  cream:      { distance: 2, tension: 1, recovery: 5, stable: 8, expression: 3, circulation: 3 },
};

// 기본값 (알 수 없는 컬러)
const DEFAULT_EMOTION_SCORE: EmotionDimension = { distance: 3, tension: 3, recovery: 4, stable: 5, expression: 4, circulation: 4 };

// 3컬러 배열에서 각 차원 합산 점수 계산
function calcEmotionScore(colorIds: string[]): EmotionDimension {
  const total: EmotionDimension = { distance: 0, tension: 0, recovery: 0, stable: 0, expression: 0, circulation: 0 };
  for (const id of colorIds) {
    const s = COLOR_EMOTION_SCORE[id] ?? DEFAULT_EMOTION_SCORE;
    total.distance    += s.distance;
    total.tension     += s.tension;
    total.recovery    += s.recovery;
    total.stable      += s.stable;
    total.expression  += s.expression;
    total.circulation += s.circulation;
  }
  return total;
}

// 두 사람의 점수를 합산하여 관계 신호 계산
function calcRelationSignal(scoreA: EmotionDimension, scoreB: EmotionDimension): EmotionDimension {
  return {
    distance:    scoreA.distance    + scoreB.distance,
    tension:     scoreA.tension     + scoreB.tension,
    recovery:    scoreA.recovery    + scoreB.recovery,
    stable:      scoreA.stable      + scoreB.stable,
    expression:  scoreA.expression  + scoreB.expression,
    circulation: scoreA.circulation + scoreB.circulation,
  };
}

// 모든 archetype 점수 반환 (도형 보너스 적용 시 비교용)
function scoreToArchetypeScores(signal: EmotionDimension): Record<RelationArchetype, number> {
  const { distance, tension, recovery, stable, expression, circulation } = signal;
  // 감정순환형: circulation 합 30 초과 시만 보너스 (두 사람 모두 높을 때)
  const circulationBonus = circulation > 30 ? (circulation - 30) * 1.0 : 0;
  // 온도차형: expression과 distance의 차이 + expression이 높을 때 보너스
  const tempGap = Math.abs(expression - distance);
  const tempBonus = expression > 20 ? 8 : (expression > 16 ? 4 : 0);
  // 친구형: tension이 낙고 stable이 중간 이상일 때 강하게
  const friendBonus = tension < 14 ? 15 : tension < 18 ? 8 : 0;
  // 현실균형형: stable이 중간 이상이고 tension이 낙을 때
  const realBonus = stable > 22 && tension < 22 ? 8 : 0;
  // 안정추구형: stable이 매우 높고 expression이 낙을 때만 강하게 진입
  const stableBonus = (stable > 40 && expression < 25) ? 12 : (stable > 35 ? 4 : 0);
  return {
    '거리조절형':  distance * 1.5 + tension * 0.3 + (distance > 22 ? 10 : 0),
    '성장자극형':  tension * 1.5 + expression * 0.9,
    '회복형':      recovery * 1.2 + (tension > 22 ? 6 : 0) + (distance < 14 ? 4 : 0),
    '감정순환형':  circulation * 1.0 + expression * 0.5 + circulationBonus,
    '온도차형':    tempGap * 1.5 + tension * 0.4 + tempBonus,
    '안정추구형':  stable * 1.1 + recovery * 0.2 + stableBonus,
    '보호자형':    stable * 0.8 + recovery * 0.7 + (expression < 14 ? 10 : 0),
    '친구형':      stable * 0.9 + circulation * 0.5 + friendBonus,
    '이상주의형':  distance * 0.7 + tension * 0.5 + (stable < 18 ? 10 : 0),
    '현실균형형':  stable * 1.0 + expression * 0.9 + realBonus,
  };
}

// 점수 기반 archetype 결정 (다차원 가중치 — 시뮬레이션 검증완료)
function scoreToArchetype(signal: EmotionDimension): RelationArchetype {
  const { distance, tension, recovery, stable, expression, circulation } = signal;

  // 감정순환형: circulation 합 30 초과 시만 보너스 (두 사람 모두 높을 때)
  const circulationBonus = circulation > 30 ? (circulation - 30) * 1.0 : 0;
  // 온도차형: expression과 distance의 차이 + expression이 높을 때 보너스
  const tempGap = Math.abs(expression - distance);
  const tempBonus = expression > 20 ? 8 : (expression > 16 ? 4 : 0);
  // 친구형: tension이 낙고 stable이 중간 이상일 때 강하게
  const friendBonus = tension < 14 ? 15 : tension < 18 ? 8 : 0;
  // 현실균형형: stable이 중간 이상이고 tension이 낙을 때
  const realBonus = stable > 22 && tension < 22 ? 8 : 0;
  // 안정추구형: stable이 매우 높고 expression이 낙을 때만 강하게 진입
  const stableBonus = (stable > 40 && expression < 25) ? 12 : (stable > 35 ? 4 : 0);

  // 각 archetype 후보 점수 계산
  const scores: Record<RelationArchetype, number> = {
    '거리조절형':  distance * 1.5 + tension * 0.3 + (distance > 22 ? 10 : 0),
    '성장자극형':  tension * 1.5 + expression * 0.9,
    '회복형':      recovery * 1.2 + (tension > 22 ? 6 : 0) + (distance < 14 ? 4 : 0),
    '감정순환형':  circulation * 1.0 + expression * 0.5 + circulationBonus,
    '온도차형':    tempGap * 1.5 + tension * 0.4 + tempBonus,
    '안정추구형':  stable * 1.1 + recovery * 0.2 + stableBonus,
    '보호자형':    stable * 0.8 + recovery * 0.7 + (expression < 14 ? 10 : 0),
    '친구형':      stable * 0.9 + circulation * 0.5 + friendBonus,
    '이상주의형':  distance * 0.7 + tension * 0.5 + (stable < 18 ? 10 : 0),
    '현실균형형':  stable * 1.0 + expression * 0.9 + realBonus,
  };

  // 가장 높은 점수의 archetype 선택
  let best: RelationArchetype = '온도차형';
  let bestScore = -1;
  for (const [arch, score] of Object.entries(scores) as [RelationArchetype, number][]) {
    if (score > bestScore) {
      bestScore = score;
      best = arch;
    }
  }
  return best;
}

// 도형 긴장 방향이 archetype을 보정하는 경우 (확장)
function adjustArchetypeByShape(
  base: RelationArchetype,
  shapeTension: ShapeTension,
  signal: EmotionDimension
): RelationArchetype {
  // 역삼각형(방어) → 거리조절형 강화
  if (shapeTension === 'defense') {
    if (base === '안정추구형' || base === '보호자형' || base === '친구형') return '거리조절형';
    if (base === '감정순환형' && signal.distance > signal.circulation) return '거리조절형';
  }
  // 마름모(민감) → 회복형 또는 감정순환형
  if (shapeTension === 'sensitive') {
    if (base === '안정추구형') return signal.recovery > signal.circulation ? '회복형' : '감정순환형';
    if (base === '친구형' || base === '보호자형') return '회복형';
  }
  // 오각형(성장) → 성장자극형 강화
  if (shapeTension === 'growth') {
    if (base === '친구형' || base === '안정추구형') return '성장자극형';
    if (base === '온도차형') return '성장자극형';
  }
  // 삼각형(경계) → 온도차형 또는 거리조절형
  if (shapeTension === 'boundary') {
    if (base === '안정추구형') return '온도차형';
    if (base === '보호자형') return signal.distance > signal.recovery ? '거리조절형' : '온도차형';
  }
  // 원(순환) → 감정순환형 강화
  if (shapeTension === 'flow') {
    if (base === '안정추구형' || base === '친구형') return '감정순환형';
  }
  // 육각형(조화) → 안정추구형 강화
  if (shapeTension === 'harmony') {
    if (base === '거리조절형' && signal.stable > signal.distance) return '안정추구형';
  }
  // 네모(안정) → 안정추구형 강화
  if (shapeTension === 'stable') {
    if (base === '감정순환형' && signal.stable > signal.circulation) return '안정추구형';
  }
  return base;
}

// archetype별 상세 데이터
const ARCHETYPE_DATA: Record<RelationArchetype, Omit<ArchetypeResult, 'archetype'>> = {
  온도차형: {
    accentColor: '#8FA68E',
    typeName: '온도차형 관계',
    typeEmoji: '🌡️',
    coreSummary: '같은 상황을 다른 속도로 살아갑니다.',
    tensionDescription: '싸운 다음 날 아침, 한 사람은 이미 평소체럼 움직입니다. 다른 사람은 아직 어젟밤 안에 머물러 있습니다. "어떻게 아무렇지 않아?"  이 말이 나옵니다. 한 사람은 "이미 끝난 거 아니야?"  라고 답합니다. 이 속도 차이가 반복됩니다. "왜 아직도 그래?" 와 "왜 이미 넘어간 것처럼 해?"가 교차합니다.',
    misunderstandingPattern: '갈등 다음 날, 한 사람은 평소체럼 행동합니다. 다른 사람은 아직 어젟밤 안에 있습니다. "어떻게 아무렇지 않아?" 라는 말이 나옵니다. 한 사람은 "이미 끝난 거 아니야?" 라고 합니다. 빠른 사람은 느린 사람이 집착한다고 느버고, 느린 사람은 빠른 사람이 무관심하다고 느낄니다. 속도 차이가 오해가 됩니다.',
    connectionStyle: '한 사람이 "나 아직 정리 중이야" 라고 말하고, 다른 사람이 "알겠어, 기다릴게" 라고 답하는 것. 속도를 맞추려 하지 않고, 서로 다른 속도를 인정하는 것이 연결입니다. 속도 차이를 연결의 장애물이 아니라 서로의 방식으로 인정할 때, 이 관계는 안정됩니다.',
    recoveryRoutine: '각자 30분 정도 시간을 갖고 다시 만나기. 빠른 사람이 느린 사람 곳에 조용히 앉아 있어주는 것. "다 됐을 때 말해줘" 라고 말하며 기다리는 것이 이 관계의 핸심 패턴입니다.',
    neededWords: '"\ub098 아직 속도 조절 중이야. 조금만 기다려줘."',
    recommendedActivity: '각자 좋아하는 것을 하다가 다시 만나는 시간. 함께 있되 각자의 속도를 존중하는 활동.',
    emotionRecoveryStyle: '빠른 사람은 기다리고, 느린 사람은 "나 지금 어디에 있는지" 말해주는 것. 침묵이 거리감이 아닌 속도 조절 중이라는 신호임을 서로 알아야 합니다.',
    conversationRoutine: '"오늘 가장 빠리 지나간 순간과 가장 오래 머문 순간 이야기해줘." 속도가 다른 두 사람이 같은 하루를 어떻게 다르게 경험했는지 나누는 대화입니다.',
    connectionRoutine: '"나는 지금 여기야" 라고 서로 위치를 알려주는 것. 감정의 현재 속도를 공유하는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '말 없이 옆에 앉아 있기. 느린 사람이 속도를 조절하는 동안 곳에 있어주는 것. "다 됐을 때 엘기해줘" 라고 말하며 기다리는 것. 서두르지 않는 것 자체가 이 관계에서 가장 따뜻한 사랑 표현입니다.',
    emotionRoutine: '각자의 속도로 감정을 처리하고, 준비가 됐을 때 다시 연결하기. 억지로 맞추려 하지 않는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '속도가 다른 것은 이 관계의 약점이 아닙니다. 한 사람이 먼저 도착해서 기다려주는 것, 그것이 이 관계의 사랑 방식입니다. 속도 차이를 인정하면 두 사람은 결국 같은 곳에 도달합니다.',
    temperatureGraph: { emotionGap: 72, expressionIntensity: 45, recoverySpeed: 40 },
    expressionSpeed: { personA: '빠른 정리', personB: '천천히 소화', description: '한 사람은 감정을 빠르게 정리하고 다음으로 넘어가고, 다른 사람은 충분히 소화한 후에야 앞으로 갑니다.' },
    recoveryStyle: { icon: 'alone' as const, label: '각자 정리 후 재연결', description: '혼자 정리하는 시간이 필요합니다. 30분 각자 시간 후 다시 만나는 것이 이 관계의 회복 패턴입니다.' },
    realEmotions: {
      feelings: [
        '말하면 더 커질 것 같아 혼자 정리하려 할 수 있습니다.',
        '상대가 이미 끝냈다고 느낄 때 혼자 남겨진 느낌이 올라올 수 있습니다.',
        '빨리 넘어가는 상대가 답답하게 느껴질 수 있습니다.',
        '내 감정이 아직 정리되지 않았는데 상대는 이미 다른 곳에 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 서로 다른 속도를 인정하는 시간이 필요합니다. 먼저 도착한 사람이 기다려주는 것, 그것이 이 관계의 사랑입니다.',
    },
    dangerPattern: '침묵이 거리감으로 번지는 패턴.\n빠른 사람은 이미 끝났다고 생각하고 일상으로 돌아갑니다.\n느린 사람은 아직 혼자 삭이고 있습니다.\n그 간극을 아무도 말하지 않습니다.\n속도 차이를 말하지 않으면 거리감이 됩니다.',
    forbiddenWords: ['"왜 아직도 그 얘기야?"', '"그냥 넘어가면 되잖아"', '"벌써 잊었어?"', '"예민하게 굴지 마"'],
    relationStrength: '한 사람의 빠름이 방향을 잡고, 다른 사람의 느림이 깊이를 만듭니다. 속도가 다른 두 사람이 함께 가는 것 자체가 이 관계의 힘입니다.',
    recommendedColors: [
      { id: 'navy', korName: '네이비', hex: '#2C3E6B', reason: '거리감을 안정적으로 담아주는 깊고 차분한 연결 에너지입니다.' },
      { id: 'steel_blue', korName: '스틸블루', hex: '#6B8CAE', reason: '속도 차이를 자연스럽게 조율하는 신뢰의 에너지입니다.' },
    ],
        conflictReactionPattern: '갈등이 생기면 한 사람은 빠르게 정리하고 평소처럼 행동합니다. 다른 사람은 아직 그 안에 있습니다. "어떻게 아무렇지 않아?"라는 말이 나옵니다. 빠른 사람은 이미 끝난 거라고 생각하고, 느린 사람은 아직 혼자 삭이고 있습니다. 그 간극을 아무도 말하지 않으면 거리감이 됩니다. 이 관계에서 갈등 직후 가장 필요한 것은 "나는 아직 정리 중이야"라는 한마디입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 속도를 맞추는 것이 아니라 속도 차이를 인정하는 것입니다. 빠른 사람이 먼저 도착해서 기다려주는 것, 느린 사람이 "조금만 기다려줘"라고 말하는 것. 함께 있어도 각자의 리듬이 다를 수 있다는 것을 받아들일 때 이 관계는 안정됩니다. 사랑을 느끼는 순간은 "기다려줘서 고마워"라는 말을 들을 때입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['속도 존중', '개인 공간', '독립성', '부담 없는 연결'],
            description: '서로의 속도와 공간을 자연스럽게 존중합니다. 억지로 맞추려 하지 않아도 각자의 리듬이 있고, 그 리듬이 관계를 오래 유지하는 힘이 됩니다.',
          },
          loveStyle: {
            keywords: ['조용한 배려', '간섭 없는 존중', '편안한 거리감'],
            description: '말보다 행동으로, 간섭하지 않는 방식으로 사랑합니다. 상대가 필요할 때 곁에 있어주는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['각자의 시간', '재충전 후 재연결', '편안한 침묵'],
            description: '각자 충분히 쉬고 재충전한 뒤 다시 만날 때 가장 살아납니다. 함께 있어도 각자의 공간이 보장될 때 관계 에너지가 높아집니다.',
          },
          blindSpot: {
            description: '표현이 줄어들면서 상대가 ’관심이 없나?’ 하고 느끼는 순간이 생길 수 있습니다. 거리감이 자연스러운 이 관계에서, 작은 연결 신호를 조금 더 자주 보내는 것이 관계 온도를 유지하는 데 도움이 됩니다.',
          },
          growthBalance: {
            description: '혼자만의 시간을 충분히 존중하면서도, 짧은 한마디나 작은 표현으로 ’나 여기 있어’라는 신호를 자주 주고받으면 이 관계는 오래도록 편안하게 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '속도 차이가 끌림이 되는 관계',
            description: '한 사람은 빠르게 표현하고, 다른 사람은 천천히 정리합니다. 처음에는 그 차이가 신선하고 보완적으로 느껴졌습니다. 빠른 사람은 느린 사람의 깊이에 끌리고, 느린 사람은 빠른 사람의 활력에 끌립니다.',
            keywords: ['속도 차이', '표현 vs 정리', '끌림', '보완', '리듬 차이'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🧹',
                label: '정리 스타일',
                personA: '어질러져도 나중에 한꺼번에 정리',
                personB: '어질러지면 바로 정리해야 안정됨',
                tension: '청소 기준 차이로 서로 답답함',
              },
              {
                icon: '🍽️',
                label: '식사 루틴',
                personA: '배고프면 바로 먹자고 함',
                personB: '뭐 먹을지 미리 생각해두는 편',
                tension: '즉흥 vs 계획 충돌',
              },
              {
                icon: '😴',
                label: '피곤할 때',
                personA: '피곤하면 혼자 있고 싶어함',
                personB: '피곤할 때 더 붙어있고 싶어함',
                tension: '피곤한 타이밍이 다름',
              },
              {
                icon: '💬',
                label: '대화 속도',
                personA: '생각나면 바로 말함',
                personB: '정리되면 말함 (침묵이 길어짐)',
                tension: '"왜 말 안 해?" vs "아직 생각 중이야"',
              },
            ],
          },
          conflictFlow: {
            trigger: '한 사람이 "우리 얘기 좀 해"라고 하는데, 다른 사람은 "지금 당장?"이라고 반응하는 순간',
            reaction: '빠른 사람은 지금 해결하고 싶고, 느린 사람은 혼자 정리할 시간이 필요합니다. 빠른 사람은 "왜 피해?"라고 느끼고, 느린 사람은 "왜 몰아붙여?"라고 느낍니다.',
            danger: '빠른 사람이 계속 대화를 요구하고, 느린 사람이 계속 침묵하면 — 빠른 사람은 포기하고, 느린 사람은 혼자 삭이다 지칩니다.',
            forbiddenWords: ['"왜 항상 도망가?"', '"왜 항상 몰아붙여?"', '"말을 해야 알지"', '"생각 좀 하고 말해"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '빠른 사람이 먼저 도착해서 기다려줄 때, 느린 사람이 "조금만 기다려줘"라고 말할 때. 서로의 속도를 인정하는 순간 이 관계는 가장 따뜻해집니다.',
            actions: ['느린 사람이 준비됐을 때 먼저 말 걸기', '빠른 사람이 기다리는 동안 다른 것 하기', '"나 지금 정리 중이야" 한마디 건네기', '속도 차이를 탓하지 않기', '정리된 후 함께 짧게 이야기하기'],
            skinshipNote: '빠른 사람이 먼저 손을 내밀고, 느린 사람이 받아줄 때 이 관계의 온도가 올라갑니다. 포옹은 말보다 먼저 연결되는 방법입니다.',
          },
          growthPoint: {
            strength: '서로 다른 속도가 관계를 깊게 만듭니다. 빠른 사람은 느린 사람에게 활력을, 느린 사람은 빠른 사람에게 깊이를 줍니다.',
            blindSpot: '속도 차이가 "무관심" 또는 "압박"으로 오해될 수 있습니다. 서로의 리듬이 다를 뿐이라는 것을 자주 확인해주는 것이 중요합니다.',
            growthDirection: '빠른 사람은 기다리는 연습을, 느린 사람은 "지금 어떤 상태인지" 짧게 알려주는 연습을 함께 해가면 이 관계는 더 안정됩니다.',
            tip: '"나 지금 정리 중이야, 조금만 기다려줘" — 이 한마디가 이 관계를 지킵니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '바쁜 일상 속에서 속도가 달라도, 몸의 연결은 말보다 빠르게 마음을 닿게 합니다. 빠른 사람이 먼저 손을 내미는 것이 이 관계에서 가장 용기 있는 행동입니다.',
      loverNote: '속도가 달라서 어색할 때, 말 대신 가까이 앉는 것부터 시작해보세요. 거리가 좁혀지면 말도 자연스럽게 따라옵니다.',
      actions: ['말 없이 옆에 앉아 있기', '빠른 사람이 먼저 손 내밀기', '각자 시간 후 다시 만날 때 짧게 안아주기', '"기다려줘서 고마워" 한마디'],
    },
    togetherRoutine: {
      routines: [
        '산책하면서 조용히 이야기하기',
        '서로 다른 속도를 인정하며 식사하기',
        '제각각 혼자 시간 후 짧게 연락하기',
        '드라이브하며 말하기',
        '자기만의 식당 정하기',
        '잠자기 전 "오늘 어땠어?" 한마디',
      ],
      energyNote: '속도가 달라도 같은 방향으로 가는 시간이 생깁니다. 서로의 리듬을 존중하면서 함께하는 것, 그것이 이 관계를 오래 유지하는 힘입니다.',
      faithRoutine: '손잡고 기도하기 — 속도가 달라도 같은 마음으로 기도할 때 연결됩니다.',
    },
  },
  성장자극형: {
    accentColor: '#D4603A',
    typeName: '성장자극형 관계',
    typeEmoji: '⚡',
    coreSummary: '우리는 부딪히며 성장합니다.',
    tensionDescription: '이 관계는 편안하지 않습니다. 한 사람이 "이렇게 해봐"라고 말할 때, 다른 사람은 "왜 내가 부족한 것처럼 말해?"라고 느낍니다. 성장을 원하는 마음이 상대에게는 압박이 됩니다. 사랑하지만 지치는 순간이 있습니다. 그 충돌 뒤에 성장이 있습니다. 부딪힌 후 더 가까워지는 것, 그것이 이 관계의 방식입니다.',
    misunderstandingPattern: '한 사람이 "이렇게 하면 더 잘 될 것 같아"라고 말합니다. 다른 사람은 "지금도 충분한데 왜 항상 더 하라고 해?"라고 느낍니다. 응원이 압박으로 들리는 순간입니다. 한 사람은 "나는 그냥 도와주려 했는데"라고 하고, 다른 사람은 "그 말이 나를 부족하게 만들어"라고 합니다. 이 오해가 반복됩니다.',
    connectionStyle: '부딪히면서 연결됩니다. 편안하지 않지만 성장합니다. 긴장이 있어야 변화가 옵니다. 갈등이 끝이 아니라 시작인 관계. "그래서 우리가 성장했어"라고 말할 수 있을 때, 이 관계의 연결이 완성됩니다.',
    recoveryRoutine: '갈등 직후 대화하지 마세요. 먼저 움직이세요. 함께 걷거나, 드라이브하거나, 새로운 장소에 가세요. 몸이 먼저 풀리면 말도 따라옵니다. 이 관계는 앉아서 해결되지 않습니다.',
    neededWords: '"부딪혔지만 우리 또 한 단계 올라갔어."',
    recommendedActivity: '처음 가보는 레스토랑, 함께 등산, 새로운 취미 도전. 자극과 변화가 이 관계의 에너지입니다.',
    emotionRecoveryStyle: '갈등 후 바로 대화보다 함께 움직이는 것이 먼저입니다. 걸으면서, 드라이브하면서, 새로운 것을 경험하면서 감정이 자연스럽게 풀립니다.',
    conversationRoutine: '"요즘 네가 도전하고 싶은 게 뭐야?" — 서로의 성장 욕구를 나누는 대화. 현재 상태보다 앞으로 가고 싶은 방향을 이야기하는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '"우리 이번에 뭘 배웠지?" — 갈등이나 새로운 경험 후 함께 배운 것을 나누는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '함께 새로운 것에 도전하기. 처음 가보는 곳, 처음 해보는 활동을 함께 경험하는 것. "우리 이거 해봤어"라고 말할 수 있는 기억을 만드는 것이 이 관계의 가장 강한 애정 표현입니다.',
    emotionRoutine: '감정을 말로 풀기보다 행동으로 전환하기. 함께 움직이면서 감정이 자연스럽게 정리됩니다.',
    closingMessage: '이 관계는 편안하지 않습니다. 긴장이 있고, 충돌이 있고, 지치는 순간도 있습니다. 그러나 그 긴장이 두 사람을 더 크게 만듭니다. 편안한 관계가 아니라 성장하는 관계. 그것이 이 관계의 선물입니다.',
    temperatureGraph: { emotionGap: 58, expressionIntensity: 85, recoverySpeed: 70 },
    expressionSpeed: { personA: '직접적 표현', personB: '내면 처리 후 표현', description: '한 사람은 감정을 바로 표현하고, 다른 사람은 내면에서 처리한 후 표현합니다. 이 차이가 때로는 갈등의 시작이 됩니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '활동 회복형', description: '함께 움직이면서 회복합니다. 대화보다 새로운 경험이 이 관계의 회복 방식입니다.' },
    dangerPattern: '응원이 압박이 되는 패턴.\n"이렇게 해봐"가 "너는 부족해"로 들립니다.\n도전이 비난처럼 느껴집니다.\n"나는 그냥 도와주려 했는데" — "그 말이 나를 지치게 해."\n자극과 지지의 균형이 무너지면, 성장 대신 상처가 남습니다.',
    forbiddenWords: ['"왜 그것밖에 못 해?"', '"나라면 벌써 했을 텐데"', '"그게 최선이야?"', '"변화가 없네"'],
    relationStrength: '서로를 흔드는 관계는 드뭅니다. 편안함에 안주하지 않고 서로를 더 나은 방향으로 밀어주는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'coral', korName: '코랄', hex: '#E8735A', reason: '긴장과 변화 에너지를 따뜻하게 전환하는 활력 컬러입니다.' },
      { id: 'deep_navy', korName: '딥네이비', hex: '#1A2744', reason: '충돌 에너지를 깊이 있는 성장으로 이어주는 안정 컬러입니다.' },
    ],
    realEmotions: {
      feelings: [
        '사랑하지만 동시에 지치는 순간이 있을 수 있습니다',
        '자극이 때로는 압박으로 느껴질 수 있습니다',
        '말하면 더 커질 것 같아 혼자 정리하려 할 수 있습니다',
        '긴장이 쌓이면 잠시 멀어지고 싶어질 수 있습니다',
      ],
      recoveryBridge: '이 긴장은 이 관계가 살아있다는 신호입니다. 지치는 순간이 있어도 괜찮습니다. 그 긴장 뒤에 성장이 있습니다.',
    },
        conflictReactionPattern: '한 사람이 ’이렇게 하면 더 잘 될 것 같아’라고 말합니다. 다른 사람은 ’왜 항상 내가 부족한 것처럼 말해?’라고 느낍니다. 응원이 압박으로 들리는 순간입니다. 갈등 직후 한 사람은 ’나는 그냥 도와주려 했는데’라고 하고, 다른 사람은 ’그 말이 나를 작아지게 만들어’라고 합니다. 이 관계에서 갈등 직후 가장 필요한 것은 앉아서 해결하려는 것이 아니라 함께 움직이는 것입니다. 걷거나 드라이브하면 몸이 먼저 풀립니다.',
        loveConnectionStyle: '이 관계에서 사랑은 편안함이 아니라 서로를 더 나아지게 하는 힘입니다. 한 사람의 기대가 다른 사람을 성장시키고, 그 성장이 다시 관계를 깊게 만듭니다. 사랑을 느끼는 순간은 ’네 덕분에 내가 더 나아진 것 같아’라는 말을 들을 때입니다. 긴장이 있어야 변화가 오는 관계입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['자극', '성장', '긴장감', '변화 에너지'],
            description: '서로가 서로를 자극하며 함께 성장합니다. 안주하지 않고 계속 나아가는 에너지가 이 관계의 가장 큰 힘입니다.',
          },
          loveStyle: {
            keywords: ['도전', '자극', '함께 성장', '진지한 대화'],
            description: '서로를 더 나은 사람으로 이끌어주는 방식으로 사랑합니다. 편안함보다 함께 성장하는 과정에서 연결감을 느낍니다.',
          },
          alivePattern: {
            keywords: ['새로운 도전', '진지한 토론', '목표 공유'],
            description: '함께 새로운 것에 도전하거나 진지하게 이야기를 나눌 때 가장 살아납니다. 서로의 생각을 자극하는 대화가 이 관계의 에너지원입니다.',
          },
          blindSpot: {
            description: '자극과 긴장이 강해지면 쉬는 시간이 줄어들고, 서로 지치는 순간이 올 수 있습니다. 성장 에너지만큼 함께 쉬고 회복하는 시간도 의식적으로 만드는 것이 이 관계를 오래 유지하는 열쇠입니다.',
          },
          growthBalance: {
            description: '도전과 성장의 에너지를 유지하면서도, 가끔은 아무것도 하지 않고 그냥 함께 쉬는 시간을 허락하면 이 관계는 더 깊고 오래 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '서로를 더 나아지게 하는 관계',
            description: '한 사람의 기대가 다른 사람을 성장시키고, 그 성장이 다시 관계를 깊게 만듭니다. 편안함보다 자극과 변화가 이 관계의 에너지입니다. 서로가 서로의 코치 같은 관계입니다.',
            keywords: ['성장', '자극', '기대', '변화', '긴장'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '📋',
                label: '생활 기준',
                personA: '더 잘할 수 있다는 기준이 높음',
                personB: '지금 이대로도 충분하다고 느낌',
                tension: '기준 차이로 "왜 항상 부족하게 봐?"',
              },
              {
                icon: '🧹',
                label: '정리 기준',
                personA: '정리된 공간이 집중력에 영향',
                personB: '어느 정도 어질러져도 괜찮음',
                tension: '청소 기준 차이로 긴장',
              },
              {
                icon: '⏰',
                label: '시간 관리',
                personA: '계획대로 움직이는 것이 중요',
                personB: '즉흥적으로 흘러가도 괜찮음',
                tension: '계획 vs 즉흥 충돌',
              },
              {
                icon: '💪',
                label: '피곤할 때',
                personA: '피곤해도 해야 할 것은 함',
                personB: '피곤하면 쉬어야 한다고 생각',
                tension: '"왜 쉬어?" vs "왜 무리해?"',
              },
            ],
          },
          conflictFlow: {
            trigger: '"이렇게 하면 더 잘 될 것 같아"라는 말이 "왜 항상 내가 부족한 것처럼 말해?"로 들리는 순간',
            reaction: '응원하는 사람은 "나는 그냥 도와주려 했는데"라고 하고, 받는 사람은 "그 말이 나를 작아지게 만들어"라고 합니다. 둘 다 맞습니다.',
            danger: '기대가 압박이 되고, 압박이 거리감이 됩니다. 한 사람은 점점 말을 아끼고, 다른 사람은 점점 혼자 노력합니다.',
            forbiddenWords: ['"그것도 못 해?"', '"내가 기대한 게 이게 아닌데"', '"왜 항상 이래?"', '"나는 이미 다 했잖아"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '"네 덕분에 내가 더 나아진 것 같아"라는 말을 들을 때 이 관계는 가장 깊어집니다. 함께 무언가를 이루거나 도전할 때 연결감이 강해집니다.',
            actions: ['함께 목표 세우기', '서로의 성장을 인정해주기', '잘한 것 먼저 말해주기', '걷거나 드라이브하며 이야기하기', '"오늘 고생했어" 한마디'],
            skinshipNote: '이 관계에서 스킨십은 "수고했어"의 표현입니다. 어깨를 토닥이거나 손을 잡는 것이 "잘하고 있어"보다 더 깊이 전달됩니다.',
          },
          growthPoint: {
            strength: '서로를 더 나아지게 하는 힘이 있습니다. 이 관계 안에서 두 사람 모두 성장합니다.',
            blindSpot: '기대가 클수록 상대가 작아지는 느낌을 받을 수 있습니다. 성장을 요구하기 전에 지금 이 모습을 인정해주는 것이 먼저입니다.',
            growthDirection: '기대와 인정을 함께 표현하는 연습이 필요합니다. "더 잘할 수 있어" 전에 "지금도 잘하고 있어"를 먼저 말해보세요.',
            tip: '오늘 상대가 잘한 것 하나를 구체적으로 말해주세요. 그것이 이 관계의 긴장을 풀어줍니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '긴장과 자극이 많은 관계에서 몸의 연결은 "우리는 여전히 한 팀"이라는 신호입니다. 갈등 후 먼저 안아주는 것이 이 관계에서 가장 강한 화해의 언어입니다.',
      loverNote: '부딪힌 후 가장 먼저 해야 할 것은 가까이 앉는 것입니다. 말보다 먼저 거리를 좁히면 대화가 훨씬 쉬워집니다.',
      actions: ['갈등 후 먼저 안아주기', '새로운 도전 후 함께 자축하기', '긴장이 풀린 순간 손잡기', '"우리 잘 했어" 말하며 토닥이기'],
    },
    togetherRoutine: {
      routines: [
        '함께 목표 세우기',
        '등산이나 새로운 장소 가보기',
        '드라이브하면서 이야기하기',
        '새로운 음식점 함께 가기',
        '서로의 성장을 인정하는 대화 나누기',
        '오늘 잘한 것 하나씩 말해주기',
      ],
      energyNote: '함께 새로운 것을 경험할 때 이 관계의 에너지가 살아납니다. 성장을 요구하기 전에 지금 이 모습을 인정하는 시간이 두 사람을 회복시킵니다.',
      faithRoutine: '함께 목표를 위해 기도하기 — 서로의 성장을 응원하는 기도가 이 관계를 강하게 만듭니다.',
    },
  },
  안정추구형: {
    accentColor: '#8A7B6A',
    typeName: '생활동반자형 관계',
    typeEmoji: '🏠',
    coreSummary: '생활 루틴이 이 관계의 언어입니다.',
    tensionDescription: '이 관계는 드라마틱하지 않습니다. 주말 아침 함께 커피를 마시고, 장을 함께 보고, 저녁에 같이 요리합니다. 큰 갈등도, 극적인 화해도 없습니다. 그래서 때로는 "우리 너무 무난한 거 아니야?"라는 생각이 스칩니다. 하지만 매일 함께 밥을 먹는 것, 잠들기 전 "내일 뭐 시간 어때?" 라고 묻는 것, 그 작은 것들이 쌓여 이 관계가 됩니다.',
    misunderstandingPattern: '"오늘 뒤 스케줄 어때?" "이번 주 마트 가야 하는데." "다음 달 고정지출 얼마야?" 이런 대화만 남으면 "우리 관계에 감정이 없는 거 아니야?"라는 의문이 듭니다. 하지만 일상을 함께 관리하는 것 자체가 이미 깊은 신뢰입니다. 당연해진 것들 안에 사랑이 있습니다.',
    connectionStyle: '이 관계의 연결은 생활 속에 있습니다. 함께 먹는 아침밥, 퇴근 후 "오늘 어땠어?"라는 말, 주말 아침 느긋하게 보내는 시간. 생활 루틴을 함께 만들어가는 것이 이 관계의 가장 깊은 연결입니다. 루틴이 신뢰이고, 신뢰가 연결입니다.',
    recoveryRoutine: '특별한 것이 필요 없습니다. 익숙한 카페, 자주 가던 산책길, 좋아하는 음식. 평소 하던 것을 함께 하세요. 생활 리듬으로 돌아오는 것이 이 관계의 회복입니다.',
    neededWords: '"오늘도 함께해서 좋았어."',
    recommendedActivity: '자주 가던 카페에서 각자 좋아하는 것 마시기, 함께 요리하기, 주말 아침 느긋하게 보내기. 생활 루틴 안에서 함께하는 것.',
    emotionRecoveryStyle: '특별한 회복 의식이 필요 없습니다. 그냥 평소처럼 함께 있는 것, 생활 리듬으로 돌아오는 것이 이 관계의 감정 회복입니다.',
    conversationRoutine: '"오늘 뭐 먹었어? 오늘 어떤 일 있었어?" — 특별하지 않은 일상 이야기가 이 관계의 대화 루틴입니다. 생활을 나누는 것이 이 관계를 유지하는 힘입니다.',
    connectionRoutine: '함께 있는 시간 자체가 이 관계의 정서 연결입니다. 같은 공간에서 각자 좋아하는 것을 하면서도 연결감을 느끼는 것이 이 관계의 특징입니다.',
    affectionRoutine: '함께 요리하기, 같이 드라마 보기, 주말 아침 느긋하게 보내기. 장을 함께 보거나, 좋아하는 카페에 가거나, 잠들기 전 짧게 오늘 이야기 나누기. 생활 속에서 역할을 나누고 함께 움직이는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '감정이 복잡해질 때 평소 하던 생활 루틴으로 돌아오기. 함께 요리하거나, 함께 걷거나, 함께 장을 보는 것이 이 관계의 감정 안전망입니다.',
    closingMessage: '이 관계는 조용합니다. 드라마틱하지 않습니다. 그러나 조용한 것이 덜 사랑하는 것이 아닙니다. 매일 함께 생활을 만들어가는 것, 그것이 이 관계의 가장 깊은 사랑 방식입니다. 생활 속에 있는 애정을 잊지 마세요.',
    temperatureGraph: { emotionGap: 25, expressionIntensity: 35, recoverySpeed: 55 },
    expressionSpeed: { personA: '안정적 표현', personB: '안정적 표현', description: '두 사람 모두 감정을 크게 표현하지 않습니다. 그 안정감이 이 관계의 편안함이 됩니다.' },
    recoveryStyle: { icon: 'routine' as const, label: '일상 루틴 회복형', description: '특별한 회복 의식이 필요 없습니다. 평소 하던 것을 함께 하는 것이 이 관계의 회복입니다.' },
    realEmotions: {
      feelings: [
        '설레는 게 없다는 느낌이 올라올 수 있습니다.',
        '너무 익숙해져서 감사함을 잊을 수 있습니다.',
        '우리 너무 무난한 거 아닌가 싶을 수 있습니다.',
        '변화가 없는 것이 답답하게 느껴질 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 의식적으로 "오늘 함께해서 좋았어"라고 말하는 시간이 필요합니다. 익숙함 속에 있는 사랑을 다시 발견하는 것이 이 관계의 회복입니다.',
    },
    dangerPattern: '생활이 역할 분담만 남는 패턴.\n"오늘 뭐 먹을까?" "마트 다녀왔어?" "공과금 냈어?"\n이런 대화만 남습니다.\n어느 순간 "우리 요즘 대화가 없는 것 같아"라는 말이 나옵니다.\n생활 루틴이 감정 연결을 대체하지 않도록 주의해야 합니다.',
    forbiddenWords: ['"우리 너무 재미없는 것 같아"', '"항상 똑같아"', '"설레는 게 없어"', '"그냥 팀원 같아"'],
    relationStrength: '폭풍이 와도 흔들리지 않는 관계. 생활 리듬을 함께 만들어가는 신뢰. 그 안정감이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'beige', korName: '베이지', hex: '#D4B896', reason: '생활 속 신뢰와 익숙한 편안함을 강화하는 따뜻한 컬러입니다.' },
      { id: 'olive', korName: '올리브', hex: '#7A8C5E', reason: '일상의 안정과 자연스러운 연결감을 더해주는 컬러입니다.' },
    ],
        conflictReactionPattern: '이 관계에서 갈등은 크게 터지지 않습니다. 대신 조용히 쌓입니다. 한 사람이 ’요즘 좀 달라진 것 같아’라고 느끼지만 말하지 않습니다. 다른 사람도 ’뭔가 어색한데’라고 느끼지만 먼저 꺼내지 않습니다. 갈등 직후에는 둘 다 평소처럼 행동하려 합니다. 그러다 어느 날 ’사실 그때 서운했어’라는 말이 나옵니다. 이 관계에서 갈등 직후 가장 필요한 것은 ’나 좀 어색해. 우리 괜찮아?’라는 짧은 확인입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 생활 속에 있습니다. 함께 먹는 아침밥, 퇴근 후 ’오늘 어땠어?’라는 말, 주말 아침 느긋하게 보내는 시간. 생활 루틴을 함께 만들어가는 것이 이 관계의 가장 깊은 연결입니다. 사랑을 느끼는 순간은 ’우리 집에 오면 편안해’라는 말을 들을 때입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['생활 안정', '팀워크', '책임감', '오래 가는 신뢰'],
            description: '함께 생활을 만들어가는 능력이 뛰어납니다. 역할 분담, 생활 루틴, 현실적인 배려가 자연스럽게 이루어지며, 이것이 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['행동으로 챙김', '생활 배려', '현실 지원', '꾸준함'],
            description: '말보다 행동으로, 생활 속 작은 배려로 사랑합니다. 밥을 챙기고, 일정을 기억하고, 필요한 것을 미리 준비하는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['생활 루틴', '함께 요리', '역할 분담', '현실 협력'],
            description: '함께 생활을 꾸려가는 과정에서 가장 살아납니다. 같이 장을 보거나, 집을 정리하거나, 계획을 세울 때 연결감이 높아집니다.',
          },
          blindSpot: {
            description: '생활 중심으로 흐르다 보면 설렘이나 감정 표현, 애정 온도가 낮아지는 순간이 올 수 있습니다. 현실적인 배려만큼 가끔은 데이트 감성이나 따뜻한 말 한마디를 의식하면 관계 온도가 더 살아납니다.',
          },
          growthBalance: {
            description: '생활의 안정감을 유지하면서도, 작은 표현과 감정 교류 시간을 의식적으로 만들면 이 관계는 안정적이면서도 따뜻하게 오래 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '생활이 곧 사랑인 관계',
            description: '함께 먹는 아침밥, 퇴근 후 "오늘 어땠어?", 주말 아침 느긋하게 보내는 시간. 이 관계에서 사랑은 생활 속에 있습니다. 루틴을 함께 만들어가는 것이 가장 깊은 연결입니다.',
            keywords: ['생활 루틴', '안정', '신뢰', '팀워크', '꾸준함'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🧹',
                label: '정리 스타일',
                personA: '정리된 공간에서 안정감을 느낌',
                personB: '어느 정도 어질러져도 괜찮음',
                tension: '청소 기준 차이가 스트레스가 됨',
              },
              {
                icon: '💰',
                label: '재정 스타일',
                personA: '계획적으로 저축하고 지출 관리',
                personB: '필요할 때 쓰면 된다는 생각',
                tension: '재정 계획 차이로 불안감',
              },
              {
                icon: '🛋️',
                label: '휴식 방식',
                personA: '집에서 조용히 쉬는 것이 회복',
                personB: '나가서 활동해야 에너지가 충전됨',
                tension: '주말 계획 충돌',
              },
              {
                icon: '📅',
                label: '생활 리듬',
                personA: '정해진 루틴이 흐트러지면 예민해짐',
                personB: '즉흥적으로 바꿔도 괜찮음',
                tension: '루틴 변화에 대한 반응 차이',
              },
            ],
          },
          conflictFlow: {
            trigger: '한 사람이 "요즘 좀 달라진 것 같아"라고 느끼지만 말하지 않고, 다른 사람도 "뭔가 어색한데"라고 느끼지만 먼저 꺼내지 않는 순간',
            reaction: '둘 다 평소처럼 행동하려 합니다. 그러다 어느 날 "사실 그때 서운했어"라는 말이 나옵니다. 쌓인 감정이 한꺼번에 나오는 패턴입니다.',
            danger: '서운함을 말하지 않고 쌓으면 어느 순간 관계가 조용히 멀어집니다. 작은 불편함을 그때그때 말하지 않으면 나중에 더 큰 거리감이 됩니다.',
            forbiddenWords: ['"왜 항상 그래?"', '"그때도 그랬잖아"', '"말을 해야 알지"', '"네가 먼저 말했어야지"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '"우리 집에 오면 편안해"라는 말을 들을 때 이 관계는 가장 깊어집니다. 함께 밥을 차리고, 같은 공간에서 각자 쉬고, 작은 루틴을 함께 만들어가는 것이 연결입니다.',
            actions: ['함께 밥 차리기', '주말 아침 루틴 만들기', '퇴근 후 짧게 오늘 이야기하기', '집안일 역할 나누기', '"오늘 고마웠어" 자기 전에 말하기'],
            skinshipNote: '이 관계에서 스킨십은 "여기 있어"의 표현입니다. 소파에 나란히 앉거나, 자기 전 손을 잡는 것이 이 관계의 안정감을 높입니다.',
          },
          growthPoint: {
            strength: '생활 속 신뢰와 꾸준함이 이 관계의 가장 큰 힘입니다. 함께 만든 루틴이 두 사람을 안정적으로 연결합니다.',
            blindSpot: '안정을 추구하다 보면 감정 표현이 줄어들 수 있습니다. 서운함을 말하지 않고 쌓으면 조용한 거리감이 생깁니다.',
            growthDirection: '작은 서운함을 그때그때 말하는 연습이 필요합니다. "사실 그때 좀 서운했어"라고 말할 수 있는 관계가 더 오래 갑니다.',
            tip: '오늘 저녁, 함께 밥 한 끼 차려보세요. 그 시간이 이 관계의 가장 깊은 연결입니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '오래된 관계에서 익숙한 스킨십은 "나는 여전히 당신 곁에 있어"라는 신호입니다. 매일 하는 작은 것들 — 어깨 토닥이기, 손잡기, 포옹 — 이 관계를 따뜻하게 유지합니다.',
      loverNote: '특별한 날이 아니어도 괜찮습니다. 평범한 날 먼저 손잡는 것, 그것이 이 관계에서 가장 따뜻한 표현입니다.',
      actions: ['매일 아침 짧게 안아주기', '함께 요리하면서 어깨 기대기', '잠들기 전 손잡기', '"오늘도 함께해서 좋았어" 한마디'],
    },
    togetherRoutine: {
      routines: [
        '같이 요리하기 / 식사 준비하기',
        '주말 아침 커피 함께 마시기',
        '같이 장보기 가기',
        '함께 청소 / 정리하기',
        '저녁에 쉽은 음악 틀어놓고 쉽기',
        '잠자기 전 오늘 좋았던 순간 이야기하기',
      ],
      energyNote: '함께하는 일상이 이 관계의 언어입니다. 특별한 이벤트가 아니라 평범한 하루를 함께 보내는 것이 두 사람을 안정시킵니다.',
      faithRoutine: '함께 식사 전 감사기도 하기 — 일상의 작은 것에 감사하는 습관이 이 관계를 따뜻게 유지합니다.',
    },
  },
  감정순환형: {
    accentColor: '#9B5EA8',
    typeName: '감정순환형 관계',
    typeEmoji: '🌊',
    coreSummary: '감정이 빠르게 변하고, 회복도 빠릅니다.',
    tensionDescription: '이 관계에는 감정의 파도가 있습니다. 어제는 따뜻했는데 오늘은 차갑습니다. 어제는 가까웠는데 오늘은 멀게 느껴집니다. 한 사람이 "왜 갑자기 이래?"라고 물으면, 다른 사람은 "나도 몰라"라고 합니다. 변심이 아닙니다. 파도가 온 겁니다. 파도는 지나갑니다. 잔잔해진 후 다시 연결됩니다.',
    misunderstandingPattern: '어제 따뜻하게 대했는데 오늘 갑자기 차갑습니다. "내가 뭘 잘못했어?"라는 말이 나옵니다. 변심이 아닙니다. 파도가 온 겁니다. "왜 갑자기 가까워지려 해?" — 밀어내는 게 아닙니다. 파도가 지나간 겁니다. 이 관계에서 감정의 변화는 변심이 아니라 순환입니다.',
    connectionStyle: '감정의 파도를 함께 건넙니다. 올라갈 때 함께 올라가고, 내려올 때 함께 내려옵니다. "지금 네 감정이 어디에 있어?"라고 묻는 것. 파도가 지나고 나면 다시 연결됩니다. 그 반복이 이 관계를 깊게 만듭니다.',
    recoveryRoutine: '감정이 가라앉을 때까지 기다리기. 파도가 지나가면 반드시 잔잔해집니다. 파도 중에 억지로 해결하려 하지 말고, 파도가 지나간 후 연결하기.',
    neededWords: '"파도가 왔구나. 기다릴게. 지나가면 다시 만나자."',
    recommendedActivity: '감정이 잔잔할 때 함께 좋아하는 것 하기. 카페에서 조용히 앉아 있기, 함께 음악 듣기, 드라이브하기.',
    emotionRecoveryStyle: '파도가 지나갈 때까지 기다리는 것. 감정이 격할 때 해결하려 하지 말고, 잔잔해진 후 "그때 어떤 마음이었어?"라고 묻는 것이 이 관계의 회복 방식입니다.',
    conversationRoutine: '"요즘 감정이 어때?" — 일상보다 감정 상태를 먼저 묻는 대화. 사건보다 감정을 먼저 나누는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '감정이 잔잔할 때 "지금 이 순간이 좋아"라고 말하는 것. 파도 사이의 잔잔한 순간을 함께 느끼는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '감정이 잔잔할 때 먼저 가까이 다가가기. 파도가 지나간 후 조용히 손잡기, 어깨 기대기, 함께 음악 듣기. "지금 이 순간이 좋아"라고 말하는 것. 파도 사이의 잔잔한 순간을 소중히 하는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '감정의 파도를 인정하기. "지금 파도가 왔어"라고 말하는 것만으로도 이 관계의 감정 회복이 시작됩니다.',
    closingMessage: '감정이 오르내리는 것은 이 관계의 약점이 아닙니다. 파도가 있다는 것은 살아있다는 뜻입니다. 파도가 지나간 자리에 남는 것이 이 관계의 진짜 연결입니다. 두 사람은 파도를 함께 타는 법을 배우고 있습니다.',
    temperatureGraph: { emotionGap: 60, expressionIntensity: 75, recoverySpeed: 65 },
    expressionSpeed: { personA: '감정 파도', personB: '감정 파도', description: '두 사람 모두 감정의 기복이 있습니다. 서로의 파도가 겹칠 때 갈등이 생기고, 엇갈릴 때 연결이 됩니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '공감 대화 회복형', description: '감정이 잔잔해진 후 "그때 어떤 마음이었어?"라고 묻는 대화가 이 관계의 회복입니다.' },
    dangerPattern: '파도가 동시에 오는 패턴.\n두 사람의 감정이 동시에 높아집니다.\n"왜 갑자기 차가워?" — 그 순간 다른 사람도 감정이 올라와 있습니다.\n그 말이 상처가 됩니다.\n"나 지금 파도 중이야, 잠깐 기다려줘" — 이 한마디가 이 관계에서 가장 어렵고 가장 중요합니다.',
    forbiddenWords: ['"왜 이렇게 감정적이야?"', '"좀 차분하게 말해"', '"또 그 감정이야?"', '"예민하게 굴지 마"'],
    relationStrength: '감정을 깊이 느끼는 두 사람이 만났습니다. 그 깊이가 때로는 갈등이 되지만, 그 깊이 덕분에 이 관계의 연결도 깊습니다. 감정을 함께 느끼는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '감정 파도를 따뜻하게 받아주는 공감과 연결의 에너지입니다.' },
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '감정 기복 속에서 조용한 안정을 찾아주는 회복 컬러입니다.' },
    ],
    realEmotions: {
      feelings: [
        '감정이 갑자기 올라와 스스로도 당황할 수 있습니다',
        '파도가 올 때 혼자 있고 싶어질 수 있습니다',
        '너무 가까워질 때 오히려 예민해질 수 있습니다',
        '감정을 표현했는데 오히려 더 힘들어질 수 있습니다',
      ],
      recoveryBridge: '이 감정들은 이 관계가 깊다는 뜻입니다. 파도는 지나갑니다. 파도 사이의 잔잔한 순간이 이 관계의 진짜 연결입니다.',
    },
        conflictReactionPattern: '어제 따뜻하게 대했는데 오늘 갑자기 차갑습니다. ’내가 뭘 잘못했어?’라는 말이 나옵니다. 변심이 아닙니다. 파도가 온 겁니다. 갈등 직후 한 사람은 ’왜 갑자기 가까워지려 해?’라고 느끼고, 다른 사람은 ’왜 갑자기 밀어내?’라고 느낍니다. 이 관계에서 갈등 직후 가장 필요한 것은 ’지금 파도 중이야. 조금 있으면 괜찮아질 거야’라는 말입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 감정의 파도를 함께 타는 것입니다. 가까워졌다 멀어졌다 하는 것이 변심이 아니라 이 관계의 리듬입니다. 사랑을 느끼는 순간은 파도가 지나간 후 다시 돌아왔을 때 상대가 여전히 거기 있을 때입니다. 감정이 복잡할 때 말 없이 옆에 있어주는 것이 이 관계에서 가장 깊은 연결입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['깊은 공감', '감정 연결', '정서적 유대', '회복력'],
            description: '감정을 깊이 나누고 공감하는 능력이 뛰어납니다. 서로의 감정을 진심으로 이해하려는 마음이 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['감정 공유', '깊은 대화', '공감', '정서 연결'],
            description: '감정을 나누고 공감받을 때 가장 사랑받는 느낌을 받습니다. 해결보다 들어주는 것, 이해받는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['감정 나누기', '진심 어린 대화', '함께 울고 웃기'],
            description: '감정을 솔직하게 나눌 때 가장 살아납니다. 기쁨도 슬픔도 함께 느끼는 순간에 이 관계의 에너지가 높아집니다.',
          },
          blindSpot: {
            description: '감정 기복이 커지면 서로 쉽게 지치는 순간이 올 수 있습니다. 감정 표현만큼 회복 시간과 안정 루틴도 함께 중요합니다. 감정이 과열될 때 잠깐 숨을 고르는 것도 이 관계를 지키는 방법입니다.',
          },
          growthBalance: {
            description: '감정의 깊이를 유지하면서도, 가끔은 가볍고 즐거운 시간을 함께 만들면 이 관계는 깊으면서도 지속 가능하게 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '감정 파도를 함께 타는 관계',
            description: '가까워졌다 멀어졌다 하는 것이 변심이 아니라 이 관계의 리듬입니다. 파도가 지나간 후 다시 돌아왔을 때 상대가 여전히 거기 있는 것 — 그것이 이 관계의 가장 깊은 연결입니다.',
            keywords: ['감정 파도', '순환', '리듬', '공감', '회복'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🌊',
                label: '감정 리듬',
                personA: '감정이 올라오면 바로 표현함',
                personB: '감정이 올라오면 혼자 처리하려 함',
                tension: '파도 타이밍이 맞지 않음',
              },
              {
                icon: '🛋️',
                label: '휴식 방식',
                personA: '감정 분위기에 따라 쉬는 방식이 달라짐',
                personB: '일정한 루틴으로 쉬어야 안정됨',
                tension: '감정 상태에 따른 생활 패턴 변화',
              },
              {
                icon: '💬',
                label: '대화 방식',
                personA: '감정이 클 때 대화를 원함',
                personB: '감정이 가라앉아야 대화 가능',
                tension: '"왜 지금 말 안 해?" vs "지금은 힘들어"',
              },
              {
                icon: '🏠',
                label: '공간 사용',
                personA: '감정이 클 때 혼자 있고 싶음',
                personB: '감정이 클 때 곁에 있어주길 원함',
                tension: '혼자 vs 함께 욕구 충돌',
              },
            ],
          },
          conflictFlow: {
            trigger: '어제 따뜻하게 대했는데 오늘 갑자기 차갑습니다. "내가 뭘 잘못했어?"라는 말이 나오는 순간',
            reaction: '파도 중인 사람은 "왜 갑자기 가까워지려 해?"라고 느끼고, 다른 사람은 "왜 갑자기 밀어내?"라고 느낍니다. 변심이 아니라 파도입니다.',
            danger: '파도를 "변심"으로 오해하면 관계가 흔들립니다. "또 이러네"라는 말이 반복되면 파도 중인 사람은 더 깊이 들어갑니다.',
            forbiddenWords: ['"또 이러네"', '"왜 갑자기 차가워져?"', '"감정 기복이 너무 심해"', '"예측이 안 돼"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '파도가 지나간 후 다시 돌아왔을 때 상대가 여전히 거기 있을 때. 감정이 복잡할 때 말 없이 옆에 있어주는 것이 이 관계에서 가장 깊은 연결입니다.',
            actions: ['"지금 파도 중이야, 조금 있으면 괜찮아질 거야" 말하기', '파도 중일 때 조용히 옆에 있기', '파도 후 "괜찮아?" 짧게 묻기', '감정 상태 미리 알려주기', '파도가 지나면 함께 가벼운 것 하기'],
            skinshipNote: '이 관계에서 스킨십은 파도 후 "다시 연결"의 표현입니다. 파도가 지나간 후 먼저 손을 내미는 것이 이 관계를 회복시킵니다.',
          },
          growthPoint: {
            strength: '감정 깊이가 크고 공감 능력이 뛰어납니다. 파도가 지나면 더 깊이 연결되는 힘이 있습니다.',
            blindSpot: '파도 중에 상대가 지칠 수 있습니다. 파도를 혼자 처리하려 하면 상대가 소외감을 느낄 수 있습니다.',
            growthDirection: '파도 중임을 미리 알려주는 연습이 필요합니다. "지금 파도 중이야"라는 한마디가 상대가 기다릴 수 있게 해줍니다.',
            tip: '"지금 파도 중이야, 조금만 기다려줘" — 이 한마디가 이 관계를 지킵니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '감정의 파도가 지나간 후 몸의 연결이 마음을 다시 이어줍니다. 파도가 잔잔해진 순간 먼저 안아주는 것이 이 관계에서 가장 강한 회복의 신호입니다.',
      loverNote: '감정이 복잡할 때 말보다 먼저 가까이 앉아보세요. 몸의 온기가 감정의 파도를 잠재울 수 있습니다.',
      actions: ['파도가 지나간 후 조용히 손잡기', '감정이 잔잔할 때 어깨 기대기', '"지금 이 순간이 좋아" 말하며 안아주기', '함께 음악 들으며 가까이 앉기'],
    },
    togetherRoutine: {
      routines: [
        '잠자기 전 서로의 눈을 바라보며 감사 제목 이야기하기',
        '감정이 잔잔할 때 함께 음악 듣기',
        '산책하면서 조용히 이야기하기',
        '서로에게 짧은 쪽지 남기기',
        '감정이 올라올 때 함께 쉴 수 있는 공간 만들기',
        '파도가 지나간 후 브런치 함께 먹기',
      ],
      energyNote: '감정의 파도가 지나간 후 다시 연결되는 순간이 이 관계를 살립니다. 함께 없어도 연결되는 느낌이 드는 시간이 두 사람을 회복시킵니다.',
      faithRoutine: '잠자기 전 손잡고 기도하기 — 감정의 파도가 있어도 같은 마음으로 기도할 때 연결됩니다.',
    },
  },
  거리조절형: {
    accentColor: '#3A5A8C',
    typeName: '거리조절형 관계',
    typeEmoji: '↔️',
    coreSummary: '가까워지면 숨막히고, 멀어지면 그립습니다.',
    tensionDescription: '한 사람은 함께 있으면 숨막히는 순간이 옵니다. 혼자 있는 시간이 필요합니다. 다른 사람은 그 거리가 불안합니다. "나한테 관심 없는 거 아니야?"라는 생각이 듭니다. 한 사람이 공간을 원할 때 다른 사람은 더 가까이 다가갑니다. 그러면 한 사람은 더 물러섭니다. 이 패턴이 반복됩니다. 두 사람 모두 지칩니다.',
    misunderstandingPattern: '한 사람이 "나 오늘 혼자 있고 싶어"라고 말합니다. 다른 사람은 "내가 뭘 잘못했어?"라고 생각합니다. 혼자 있고 싶은 것이 거절이 아닌데, 거절로 읽힙니다. 다른 사람이 "왜 나를 피해?"라고 물으면, 한 사람은 더 멀어집니다. 도망가는 게 아닙니다. 숨 쉬러 가는 겁니다.',
    connectionStyle: '멀어졌다 다시 연결됩니다. 거리가 이 관계를 끊는 것이 아닙니다. 거리가 이 관계를 숨 쉬게 합니다. "나 지금 공간이 필요해." 이 말을 거부로 듣지 않는 것. 혼자만의 공간이 있어야 다시 가까워질 수 있습니다.',
    recoveryRoutine: '각자의 공간을 충분히 갖고, 준비가 됐을 때 다시 연결하기. 억지로 가까워지려 하지 않는 것이 이 관계의 회복 방식입니다.',
    neededWords: '"잠깐 혼자 있을게. 거부가 아니야. 곧 돌아올게."',
    recommendedActivity: '같은 공간에서 각자 좋아하는 것 하기. 함께 있되 각자의 시간을 갖는 활동.',
    emotionRecoveryStyle: '혼자만의 시간이 충전입니다. 공간이 필요할 때 "나 잠깐 혼자 있을게"라고 말하고, 돌아왔을 때 "기다려줘서 고마워"라고 말하는 것.',
    conversationRoutine: '"요즘 혼자 있고 싶은 시간이 얼마나 돼?" — 서로의 공간 필요를 확인하는 대화. 가까움보다 적절한 거리를 함께 찾는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '각자의 공간에서 돌아왔을 때 "다시 만나서 반가워"라고 말하는 것. 거리를 존중한 후의 재연결이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '부담 없는 연결. 짧은 메시지, 가벼운 연락, 억지로 만들지 않는 시간. 혼자 있다 돌아왔을 때 "기다려줘서 고마워"라고 말하는 것. 자연스럽게 연결되는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '공간이 필요할 때 솔직하게 말하기. "나 지금 충전이 필요해"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '거리는 이 관계의 약점이 아닙니다. 숨을 고를 수 있는 공간이 있기에, 다시 돌아올 수 있습니다. 멀어지는 것이 끝이 아닙니다. 돌아오는 것이 이 관계의 사랑 방식입니다.',
    temperatureGraph: { emotionGap: 65, expressionIntensity: 40, recoverySpeed: 50 },
    expressionSpeed: { personA: '거리 필요', personB: '연결 필요', description: '한 사람은 공간이 필요할 때 물러서고, 다른 사람은 연결이 필요할 때 다가옵니다. 이 타이밍의 차이가 이 관계의 핵심 긴장입니다.' },
    recoveryStyle: { icon: 'alone' as const, label: '공간 회복형', description: '각자의 공간에서 충전하고 돌아오는 것이 이 관계의 회복 방식입니다.' },
    dangerPattern: '추격-도피 패턴.\n한 사람이 공간을 원하면 다른 사람이 더 가까이 다가갑니다.\n그러면 한 사람은 더 물러섭니다.\n"나한테 관심 없어?" — "왜 항상 붙어있으려 해?"\n다가가는 사람은 지치고, 물러서는 사람은 숨막힙니다.',
    forbiddenWords: ['"왜 도망가?"', '"나한테 관심 없어?"', '"왜 항상 혼자 있으려 해?"', '"나랑 있기 싫어?"'],
    relationStrength: '각자의 공간을 존중하면서도 함께 있는 것. 독립적이면서도 연결된 관계는 드뭅니다. 그 균형이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '숨막히지 않는 자연스러운 거리감을 유지하는 호흡의 컬러입니다.' },
      { id: 'deep_blue', korName: '딥블루', hex: '#3A5A8C', reason: '혼자만의 공간과 연결감을 동시에 담아주는 컬러입니다.' },
    ],
    realEmotions: {
      feelings: [
        '가까워질수록 숨이 막히는 감정이 올라올 수 있습니다',
        '혼자만의 공간이 절실하게 필요해질 수 있습니다',
        '사랑하지만 동시에 거리가 필요한 순간이 있습니다',
        '연결되고 싶지만 너무 가까워지면 예민해질 수 있습니다',
      ],
      recoveryBridge: '이 감정은 관계의 약점이 아닙니다. 거리는 이 관계의 방식입니다. 숨을 고를 수 있는 공간과 다시 연결되는 시간이 모두 필요합니다.',
    },
        conflictReactionPattern: '갈등이 생기면 한 사람은 공간이 필요합니다. ’나 좀 혼자 있을게’라고 합니다. 다른 사람은 ’왜 피해?’라고 느낍니다. 거절이 아닙니다. 정리하는 방식이 다른 겁니다. 갈등 직후 거리를 두는 것이 이 관계에서 회복의 첫 단계입니다. 충분히 쉰 후 다시 돌아오는 것이 이 관계의 갈등 처리 방식입니다. ’나 정리하고 올게’라는 말이 이 관계에서 가장 중요한 갈등 언어입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 항상 붙어 있는 것이 아닙니다. 각자의 공간을 존중하면서도 필요할 때 돌아올 수 있다는 신뢰입니다. 사랑을 느끼는 순간은 ’혼자 있다 와도 여기 있어줘서 고마워’라는 말을 들을 때입니다. 공간 후 재연결이 이 관계의 가장 깊은 연결 방식입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['독립성 존중', '공간 배려', '부담 없는 연결', '자유로운 관계'],
            description: '서로의 독립성과 공간을 자연스럽게 존중합니다. 억지로 붙어있지 않아도 연결되어 있다는 느낌이 있고, 이것이 이 관계를 편안하게 만드는 힘입니다.',
          },
          loveStyle: {
            keywords: ['공간 존중', '조용한 배려', '부담 없는 연결'],
            description: '각자의 공간을 지켜주는 방식으로 사랑합니다. 간섭하지 않고, 필요할 때 곁에 있어주는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['각자의 시간', '재충전', '가벼운 재연결'],
            description: '충분히 혼자 있다가 다시 만날 때 가장 살아납니다. 각자의 시간이 보장될 때 만남의 질이 높아집니다.',
          },
          blindSpot: {
            description: '표현이 줄어들면서 상대가 ’나를 원하지 않는 건가?’ 하고 느끼는 순간이 생길 수 있습니다. 공간을 존중하면서도 짧은 연결 신호를 자주 보내는 것이 이 관계의 거리감을 건강하게 유지하는 방법입니다.',
          },
          growthBalance: {
            description: '서로의 공간을 존중하는 방식을 유지하면서도, 작은 표현과 연결 신호를 의식적으로 주고받으면 이 관계는 자유로우면서도 따뜻하게 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '각자의 공간이 관계를 지키는 관계',
            description: '혼자만의 시간이 충분할 때 더 좋은 파트너가 됩니다. 붙어있는 시간보다 각자의 공간을 존중하는 것이 이 관계의 핵심입니다. 거리감이 문제가 아니라 방식입니다.',
            keywords: ['공간', '독립', '존중', '거리', '배려'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🏠',
                label: '공간 사용',
                personA: '혼자 쉬는 공간이 꼭 필요함',
                personB: '함께 있는 시간이 더 중요함',
                tension: '"왜 혼자 있어?" vs "왜 항상 같이 있어야 해?"',
              },
              {
                icon: '📱',
                label: '연락 방식',
                personA: '연락이 자주 없어도 괜찮음',
                personB: '연락이 없으면 불안해짐',
                tension: '연락 빈도 차이로 서운함',
              },
              {
                icon: '🛋️',
                label: '휴식 방식',
                personA: '혼자 쉬어야 에너지가 충전됨',
                personB: '함께 쉬어야 회복됨',
                tension: '주말 공간 사용 충돌',
              },
              {
                icon: '💬',
                label: '대화 방식',
                personA: '필요할 때만 말함',
                personB: '자주 대화하고 싶음',
                tension: '대화 빈도 차이',
              },
            ],
          },
          conflictFlow: {
            trigger: '한 사람이 "우리 좀 더 자주 보자"고 하는데, 다른 사람이 "나는 지금 충분한데"라고 반응하는 순간',
            reaction: '더 원하는 사람은 "나한테 관심 없어?"라고 느끼고, 공간이 필요한 사람은 "왜 항상 더 원해?"라고 느낍니다.',
            danger: '공간이 필요한 사람이 계속 거리를 두면, 더 원하는 사람은 포기하거나 더 강하게 요구합니다. 그 사이클이 반복됩니다.',
            forbiddenWords: ['"왜 혼자 있어?"', '"나한테 관심 없어?"', '"왜 항상 혼자야?"', '"우리 사이가 멀어진 것 같아"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '각자의 시간을 보내고 다시 만났을 때 "보고 싶었어"라는 말을 들을 때. 공간을 존중받으면서도 연결되어 있다는 느낌이 이 관계의 가장 따뜻한 순간입니다.',
            actions: ['혼자 시간 후 "보고 싶었어" 짧게 표현하기', '각자 하고 싶은 것 하고 나중에 공유하기', '연락 빈도 미리 합의하기', '"나 혼자 있어야 할 것 같아" 미리 말하기', '함께 있을 때 온전히 집중하기'],
            skinshipNote: '이 관계에서 스킨십은 "나 여기 있어"의 신호입니다. 짧은 포옹이나 손 잡기가 "나는 멀어진 게 아니야"를 전달합니다.',
          },
          growthPoint: {
            strength: '각자의 독립성이 관계를 신선하게 유지합니다. 공간을 존중하는 것이 이 관계의 강점입니다.',
            blindSpot: '공간을 지키다 보면 표현이 줄어들 수 있습니다. 거리감이 "무관심"으로 오해될 수 있습니다.',
            growthDirection: '혼자 시간을 가지면서도 "나 여기 있어"라는 신호를 자주 보내는 연습이 필요합니다. 짧은 표현이 큰 안정감을 줍니다.',
            tip: '오늘 각자 시간을 보낸 후 "보고 싶었어" 한마디 — 이것이 이 관계를 지킵니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '공간이 필요한 관계에서 스킨십은 "나는 여전히 여기 있어"라는 신호입니다. 억지로 가까워지려 하지 말고, 자연스럽게 연결되는 순간을 소중히 하세요.',
      loverNote: '공간이 필요할 때 솔직하게 말하고, 돌아왔을 때 먼저 손잡는 것. 그 작은 행동이 이 관계에서 가장 큰 연결입니다.',
      actions: ['돌아왔을 때 짧게 안아주기', '공간 후 재연결 시 손잡기', '억지로 가까워지지 않기', '"돌아와줘서 고마워" 한마디'],
    },
    togetherRoutine: {
      routines: [
        '각자 혼자 시간 보낸 후 짧게 연락하기',
        '드라이브하며 이야기하기',
        '같이 조용히 산책하기',
        '서로에게 짧은 쪽지 남기기',
        '자기만의 공간에서 쉰 후 함께 밥 먹기',
        '잠자기 전 "오늘 어땠어?" 한마디',
      ],
      energyNote: '거리가 있어야 다시 그리워집니다. 각자의 시간을 충분히 가진 후 다시 만나는 것이 이 관계를 살아있게 합니다.',
      faithRoutine: '각자 기도한 후 짧게 나누기 — 혼자 기도하고 서로에게 전하는 것이 이 관계의 연결 방식입니다.',
    },
  },
  보호자형: {
    accentColor: '#7B5E3A',
    typeName: '보호자형 관계',
    typeEmoji: '🛡️',
    coreSummary: '사랑이 보호가 되고, 보호가 짐이 되는 관계입니다.',
    tensionDescription: '이 관계에는 자연스럽게 챙기는 사람과 챙김을 받는 사람이 있습니다. 처음에는 자연스러웠습니다. 그런데 시간이 지나면서 챙기는 사람은 지칩니다. "나는 항상 챙기는데, 나는 누가 챙겨줘?"라는 생각이 듭니다. 챙김을 받는 사람은 "왜 항상 내 결정에 개입해?"라고 느끼기 시작합니다. 사랑이 보호가 되고, 보호가 짐이 되는 순간입니다.',
    misunderstandingPattern: '챙기는 사람이 "오늘 밥은 먹었어? 옷은 따뜻하게 입었어?"라고 물으면, 다른 사람은 "왜 항상 나를 어린애 취급해?"라고 느낍니다. 챙기는 사람은 "그냥 걱정돼서 그런 건데"라고 합니다. 보호와 통제의 경계가 흐려지는 순간입니다. 챙기는 사람은 지치고, 챙김을 받는 사람은 통제받는다고 느낍니다.',
    connectionStyle: '역할을 바꿔보는 것. 보호하는 사람이 가끔 기대고, 보호받는 사람이 가끔 챙기는 것. 그 역할 교환이 이 관계의 연결입니다.',
    recoveryRoutine: '보호하는 사람이 "나도 힘들어"라고 말하는 것. 그리고 보호받는 사람이 "내가 챙길게"라고 답하는 것. 역할이 바뀌는 순간이 이 관계의 회복입니다.',
    neededWords: '"나도 가끔 기대도 될까?"',
    recommendedActivity: '역할을 바꿔서 보호받는 사람이 계획하고 이끄는 활동. 보호하는 사람이 따라가는 경험.',
    emotionRecoveryStyle: '보호하는 사람이 자신의 감정을 먼저 돌보는 것. "나 지금 충전이 필요해"라고 말하는 것이 이 관계의 감정 회복 시작입니다.',
    conversationRoutine: '"요즘 네가 힘든 건 뭐야?" — 보호받는 사람이 먼저 보호하는 사람의 상태를 묻는 대화. 역할을 바꿔서 묻는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '보호하는 사람이 "오늘은 내가 기댈게"라고 말하는 순간. 역할이 바뀌는 그 순간이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '보호받는 사람이 먼저 챙기기. 커피 한 잔 가져다주기, 먼저 연락하기, 작은 것 기억해주기. 역할을 바꾸는 작은 행동이 이 관계의 애정 표현입니다.',
    emotionRoutine: '보호하는 사람이 자신의 감정을 말하는 연습. "나도 오늘 힘들었어"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '보호하는 것은 아름다운 사랑 방식입니다. 하지만 보호하는 사람도 보호받아야 합니다. 두 사람이 서로를 번갈아 지켜주는 관계가 될 때, 이 관계는 더 단단해집니다.',
    temperatureGraph: { emotionGap: 50, expressionIntensity: 55, recoverySpeed: 45 },
    expressionSpeed: { personA: '보호/챙김', personB: '의존/기댐', description: '한 사람은 챙기고 이끌고, 다른 사람은 기대고 따릅니다. 이 역할이 고정되면 두 사람 모두 지칩니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '역할 교환 대화형', description: '보호하는 사람이 자신의 감정을 말하고, 보호받는 사람이 챙기는 역할을 경험하는 것이 회복입니다.' },
    realEmotions: {
      feelings: [
        '항상 챙겨야 한다는 부담감이 올라올 수 있습니다.',
        '사랑하지만 동시에 지치는 순간도 있을 수 있습니다.',
        '보호받는 사람은 때로 통제받는 느낌이 들 수 있습니다.',
        '나도 기대고 싶지만 말하기 어려울 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 역할을 잠시 내려놓는 시간이 필요합니다. 보호하는 사람도 기댈 수 있을 때, 이 관계는 더 균형 잡힙니다.',
    },
    dangerPattern: '역할 고착 패턴.\n보호하는 사람은 지칩니다. 말하지 않습니다. 참습니다.\n보호받는 사람은 의존합니다. 그것이 당연해집니다.\n"나는 왜 항상 이래야 해" — "나는 왜 혼자 못 서지"\n역할이 굳어지면 두 사람 모두 갇힙니다.',
    forbiddenWords: ['"내가 없으면 어떻게 할 거야?"', '"항상 내가 챙겨야 해?"', '"왜 스스로 못 해?"', '"나만 힘들어"'],
    relationStrength: '한 사람이 지키고 한 사람이 기대는 관계는 깊은 신뢰가 있습니다. 그 신뢰를 바탕으로 역할을 나누는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'gold', korName: '골드', hex: '#D4A843', reason: '보호 에너지에 따뜻한 자신감과 품격을 더해주는 컬러입니다.' },
      { id: 'warm_brown', korName: '웜브라운', hex: '#8B6348', reason: '안정적인 보호 본능을 따뜻하게 감싸주는 대지의 컬러입니다.' },
    ],
        conflictReactionPattern: '갈등이 생기면 보호자 역할을 하는 사람이 먼저 수습하려 합니다. ’내가 잘못했어. 미안해’라고 빠르게 말합니다. 다른 사람은 ’왜 항상 네가 먼저 사과해?’라고 느낍니다. 또는 보호자가 ’내가 다 책임질게’라고 하면서 감정을 혼자 삭입니다. 갈등 직후 이 관계에서 가장 필요한 것은 역할을 내려놓고 ’나 사실 힘들었어’라고 말하는 것입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 지켜주는 것입니다. 한 사람이 방패가 되어주고, 다른 사람이 그 뒤에서 안심합니다. 하지만 진짜 깊은 연결은 강한 사람도 기댈 수 있을 때 완성됩니다. 사랑을 느끼는 순간은 ’네가 있어서 든든해’라는 말을 들을 때입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['헌신', '보호', '책임감', '든든한 안정감'],
            description: '상대를 지키고 보호하려는 마음이 강합니다. 든든하고 믿음직한 존재감이 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['헌신', '보호', '챙김', '책임'],
            description: '상대를 보호하고 챙기는 방식으로 사랑합니다. 먼저 나서서 해결하고, 상대가 힘들지 않도록 미리 준비하는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['상대를 챙기기', '문제 해결', '든든한 존재'],
            description: '상대에게 실질적인 도움이 될 때 가장 살아납니다. 필요한 것을 미리 준비하고, 어려운 상황에서 함께 해결해나갈 때 연결감이 높아집니다.',
          },
          blindSpot: {
            description: '보호하려는 마음이 강해지면 상대의 자율성을 침해하거나, 자신이 지치는 순간이 올 수 있습니다. 상대를 챙기는 만큼 자신도 돌봄받을 수 있도록 표현하는 것이 이 관계를 균형 있게 유지하는 방법입니다.',
          },
          growthBalance: {
            description: '헌신과 보호의 에너지를 유지하면서도, 상대의 자율성을 존중하고 자신도 돌봄받을 수 있도록 표현하면 이 관계는 더 균형 있고 오래 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '한 사람이 지키고, 한 사람이 기대는 관계',
            description: '한 사람은 자연스럽게 챙기고 보호하는 역할을 합니다. 다른 사람은 그 안에서 편안함을 느낍니다. 이 관계의 힘은 서로의 역할이 명확할 때 나옵니다.',
            keywords: ['보호', '챙김', '의존', '안정', '역할'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🍳',
                label: '생활 챙김',
                personA: '밥 챙겨줬는지, 옷 따뜻하게 입었는지 확인',
                personB: '챙겨주는 것에 익숙해짐',
                tension: '챙기는 사람이 지칠 수 있음',
              },
              {
                icon: '💰',
                label: '재정 관리',
                personA: '재정을 주도적으로 관리함',
                personB: '맡기는 편이 편함',
                tension: '재정 불균형으로 부담감',
              },
              {
                icon: '🤔',
                label: '결정 방식',
                personA: '먼저 결정하고 알려주는 편',
                personB: '결정을 맡기는 편',
                tension: '"왜 항상 네가 결정해?" vs "네가 잘하잖아"',
              },
              {
                icon: '😴',
                label: '피곤할 때',
                personA: '피곤해도 챙기려 함',
                personB: '피곤하면 더 챙겨주길 원함',
                tension: '챙기는 사람의 소진',
              },
            ],
          },
          conflictFlow: {
            trigger: '챙기는 사람이 "나는 항상 챙기는데 나는 누가 챙겨줘?"라고 느끼는 순간',
            reaction: '챙기는 사람은 지쳐서 말이 줄어들고, 챙김 받는 사람은 "왜 갑자기 달라졌어?"라고 느낍니다.',
            danger: '챙기는 사람이 소진되면 관계의 균형이 무너집니다. 역할이 고정되면 한 사람이 점점 지칩니다.',
            forbiddenWords: ['"나는 항상 챙기는데"', '"당연한 거 아니야?"', '"왜 이것도 못 해?"', '"내가 다 해야 해?"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '챙겨주는 사람이 "나도 오늘 힘들었어"라고 말할 때, 챙김 받는 사람이 "내가 챙겨줄게"라고 역할을 바꿀 때. 역할을 교환하는 순간 이 관계는 더 깊어집니다.',
            actions: ['역할 교환하기 (오늘은 내가 챙길게)', '"오늘 힘들었어" 솔직하게 말하기', '챙겨준 것에 감사 표현하기', '함께 쉬는 시간 만들기', '"당신도 쉬어야 해" 말해주기'],
            skinshipNote: '이 관계에서 스킨십은 "나도 여기 있어"의 표현입니다. 챙기는 사람이 기댈 수 있도록 먼저 안아주는 것이 이 관계를 균형 있게 만듭니다.',
          },
          growthPoint: {
            strength: '챙기고 보호하는 힘이 이 관계의 안정감을 만듭니다. 서로의 역할이 명확할 때 이 관계는 강합니다.',
            blindSpot: '역할이 고정되면 챙기는 사람이 소진될 수 있습니다. 챙겨주는 것이 당연해지면 감사함이 줄어듭니다.',
            growthDirection: '역할을 가끔 교환하는 연습이 필요합니다. 챙기는 사람도 챙김 받을 수 있는 관계가 더 오래 갑니다.',
            tip: '오늘은 챙겨주는 사람이 "나도 오늘 힘들었어"라고 말해보세요.',
          },
        },
        intimacyConnection: {
      marriageNote: '보호하는 사람이 가끔 기대는 것, 그것이 이 관계에서 가장 용기 있는 행동입니다. 보호받는 사람이 먼저 안아주는 것이 이 관계의 가장 깊은 연결입니다.',
      loverNote: '보호받는 사람이 먼저 다가가는 것. 그 작은 역할 전환이 이 관계를 더 균형 있게 만듭니다.',
      actions: ['보호받는 사람이 먼저 안아주기', '보호하는 사람이 기댈 수 있도록 공간 만들기', '역할 바꿔서 손잡기', '"오늘은 내가 챙길게" 말하기'],
    },
    togetherRoutine: {
      routines: [
        '같이 먹고 쉬는 일상',
        '산책하면서 조용히 이야기하기',
        '챙기는 사람도 쉴 수 있는 시간 만들기',
        '서로의 수고를 인정하는 대화 나누기',
        '함께 여행 가기',
        '잠자기 전 "오늘 고마웠어" 한마디',
      ],
      energyNote: '챙기는 마음이 이 관계를 따뜻하게 합니다. 그러나 챙기는 사람도 쉬어야 합니다. 서로 돌봐주는 시간이 이 관계를 오래 유지합니다.',
      faithRoutine: '손잡고 기도하기 — 챙기는 마음과 받는 마음이 함께 기도할 때 균형이 생깁니다.',
    },
  },
  친구형: {
    accentColor: '#E8A05A',
    typeName: '로맨틱 연결형 관계',
    typeEmoji: '✨',
    coreSummary: '설렘과 편안함이 공존합니다.',
    tensionDescription: '이 관계는 편안하면서도 설렙니다. 함께 있으면 자연스럽고, 가끔 먼저 연락이 오면 기분이 좋아집니다. 특별한 날 조금 더 신경 써주는 것이 기억에 남습니다. 그런데 어느 날 "우리 설레는 게 줄어든 것 같아"라는 생각이 스칩니다. 설렘이 줄어든 것이 아니라, 표현을 덜 하게 된 것입니다.',
    misunderstandingPattern: '"오늘 왜 연락이 없었어?" "특별한 날인데 그냥 넘어가는 거야?" — 애정 표현의 빈도와 방식이 달라서 생기는 오해입니다. 한 사람은 표현을 기대하고, 다른 사람은 표현하는 것이 어색합니다. 기대를 말로 표현하는 것이 이 관계의 숙제입니다.',
    connectionStyle: '애정 표현이 이 관계의 연결입니다. 먼저 연락하는 것, 기억해주는 것, 작은 것을 챙겨주는 것. 스킨십, 분위기, 설레는 순간들이 이 관계를 살아있게 합니다.',
    recoveryRoutine: '분위기를 만들어주세요. 좋아하는 카페, 함께 가고 싶었던 곳, 작은 선물. 설렘을 의식적으로 만드는 것이 이 관계의 회복 방식입니다.',
    neededWords: '"오늘 너랑 있어서 좋아."',
    recommendedActivity: '함께 가고 싶었던 곳 가기, 특별한 날 챙기기, 분위기 있는 식사, 함께 설레는 경험 만들기.',
    emotionRecoveryStyle: '분위기를 만들어주는 것이 먼저입니다. 설레는 순간이 생기면 감정도 자연스럽게 따라옵니다.',
    conversationRoutine: '"요즘 뭐가 설레?" "나한테 어떤 게 좋아?" — 애정과 설렘을 나누는 대화. 감정을 직접 표현하는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '애정 표현을 주고받는 순간. 먼저 연락하거나, 먼저 손잡거나, 작은 것을 기억해주는 그 순간이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '먼저 연락하기, 기념일 챙기기, 작은 선물, 분위기 있는 시간 만들기. 스킨십과 애정 표현이 이 관계의 생명력입니다.',
    emotionRoutine: '설레는 경험을 의식적으로 만들기. 분위기 있는 곳 가기, 특별한 날 챙기기, 먼저 표현하기.',
    closingMessage: '설렘은 저절로 유지되지 않습니다. 의식적으로 만들어야 합니다. 먼저 연락하고, 먼저 표현하고, 먼저 분위기를 만드는 것. 두 사람은 그 설렘을 함께 만들어갈 수 있습니다.',
    temperatureGraph: { emotionGap: 20, expressionIntensity: 40, recoverySpeed: 75 },
    expressionSpeed: { personA: '편안한 표현', personB: '편안한 표현', description: '두 사람 모두 편안하게 표현합니다. 그 편안함이 이 관계의 가장 큰 특징입니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '함께 즐기기 회복형', description: '함께 웃을 수 있는 것을 하면서 자연스럽게 회복됩니다.' },
    realEmotions: {
      feelings: [
        '애정 표현이 줄어들면서 불안해질 수 있습니다.',
        '먼저 표현하고 싶지만 어색하게 느껴질 수 있습니다.',
        '설레는 순간이 줄어든 것 같아 아쉬울 수 있습니다.',
        '기대했는데 챙겨주지 않으면 서운해질 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 의식적으로 설렘을 만드는 시간이 필요합니다. 먼저 표현하고, 먼저 챙기고, 먼저 분위기를 만드는 것이 이 관계의 생명력입니다.',
    },
    dangerPattern: '설렘이 익숙함으로 대체되는 패턴.\n처음엔 먼저 연락했습니다. 기념일을 챙겼습니다.\n어느 순간 그것들이 줄어듭니다.\n"요즘 표현이 없어진 것 같아."\n설렘은 의식적으로 만들지 않으면 자연스럽게 줄어듭니다.',
    forbiddenWords: ['"왜 요즘 표현이 없어?"', '"설레는 게 없어"', '"처음이랑 달라졌어"', '"기념일도 그냥 넘어가?"'],
    relationStrength: '설렘과 편안함이 공존하는 관계. 애정 표현이 자연스럽고, 함께 있으면 좋은 관계. 그 따뜻함이 이 관계의 가장 큰 자산입니다.',
    recommendedColors: [
      { id: 'sky_blue', korName: '스카이블루', hex: '#87CEEB', reason: '가볍고 자유로운 연결감을 더해주는 밝은 소통 컬러입니다.' },
      { id: 'mint', korName: '민트', hex: '#A8D8C8', reason: '편안하고 신선한 우정 에너지를 유지하는 회복 컬러입니다.' },
    ],
        conflictReactionPattern: '이 관계에서 갈등은 ’우리 왜 이렇게 됐지?’라는 의문에서 시작됩니다. 너무 편해서 설렘이 사라진 것 같은 느낌. 갈등 직후 한 사람은 ’우리 요즘 좀 달라진 것 같아’라고 말하고, 다른 사람은 ’뭐가? 원래 이렇잖아’라고 합니다. 이 관계에서 갈등 직후 가장 필요한 것은 ’우리 오늘 데이트 한 번 하자’라는 말입니다. 설렘을 의식적으로 만드는 것이 이 관계의 갈등 해결 방식입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 설렘입니다. 편안하지만 설레는 것, 친구 같지만 연인인 것. 사랑을 느끼는 순간은 ’너랑 있으면 항상 좋아’라는 말을 들을 때입니다. 이 관계에서 연결은 함께 새로운 것을 경험할 때 가장 강해집니다. 처음 만났을 때의 설렘을 의식적으로 만드는 것이 이 관계의 사랑 방식입니다.',
        growthCoaching: {
          strengths: {
            keywords: ['편안함', '유머', '자연스러운 연결', '친구 같은 안정감'],
            description: '함께 있으면 편안하고 자연스럽습니다. 웃음이 많고, 부담 없이 솔직하게 이야기할 수 있는 것이 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['같이 웃기', '장난', '자연스러운 대화', '편안한 연결'],
            description: '함께 웃고 장난치며 자연스럽게 연결되는 방식으로 사랑합니다. 특별한 이벤트보다 일상 속 편안한 순간이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['함께 웃기', '가벼운 활동', '편안한 대화'],
            description: '함께 웃고 즐거운 시간을 보낼 때 가장 살아납니다. 부담 없이 솔직하게 이야기할 수 있는 순간에 이 관계의 에너지가 높아집니다.',
          },
          blindSpot: {
            description: '편안함만 유지되다 보면 연인 관계의 설렘이나 애정 표현이 줄어드는 순간이 올 수 있습니다. 친구 같은 편안함을 유지하면서도 가끔은 데이트 분위기나 애정 표현을 조금 더 의식하면 관계 온도가 오래 유지됩니다.',
          },
          growthBalance: {
            description: '편안함과 자연스러움을 유지하면서도, 가끔은 특별한 시간이나 애정 표현을 의식적으로 만들면 이 관계는 친밀하면서도 설레는 에너지를 함께 가져갈 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '친구처럼 편안한 연인 관계',
            description: '같이 웃고, 장난치고, 편하게 대화하는 것이 이 관계의 에너지입니다. 긴장 없이 자연스럽게 연결되는 것이 강점입니다. 연인이지만 가장 편한 친구 같은 관계입니다.',
            keywords: ['편안함', '유머', '자연스러움', '친구', '설렘'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '😂',
                label: '일상 분위기',
                personA: '장난치고 웃는 것이 자연스러움',
                personB: '편안하게 받아주는 편',
                tension: '너무 편해서 설렘이 줄어드는 순간',
              },
              {
                icon: '🍕',
                label: '식사/여가',
                personA: '먹고 싶은 것, 하고 싶은 것 바로 말함',
                personB: '맞춰주는 편',
                tension: '한 사람이 항상 맞추는 패턴',
              },
              {
                icon: '💬',
                label: '대화 방식',
                personA: '편하게 뭐든 말함',
                personB: '편하게 들어주는 편',
                tension: '진지한 대화가 어색해지는 순간',
              },
              {
                icon: '💑',
                label: '애정 표현',
                personA: '장난스럽게 표현함',
                personB: '진지한 표현을 원하기도 함',
                tension: '진지한 애정 표현 부족',
              },
            ],
          },
          conflictFlow: {
            trigger: '너무 편해서 "우리 연인 맞아?"라는 생각이 드는 순간, 또는 진지한 이야기를 꺼냈는데 장난으로 받아치는 순간',
            reaction: '진지한 이야기를 원하는 사람은 "왜 항상 장난으로 넘겨?"라고 느끼고, 편안한 사람은 "왜 갑자기 진지해?"라고 느낍니다.',
            danger: '편안함이 무관심으로 느껴지기 시작하면 관계의 온도가 내려갑니다. 설렘이 줄어드는 것을 방치하면 관계가 정체됩니다.',
            forbiddenWords: ['"우리 그냥 친구 같아"', '"왜 항상 장난이야?"', '"진지하게 좀 대해줘"', '"설레는 게 없어"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '함께 웃고 장난치다가 갑자기 진지하게 "나 너 좋아"라고 말할 때. 편안함 속에서 갑자기 설레는 순간이 이 관계의 가장 따뜻한 연결입니다.',
            actions: ['가끔 진지하게 "나 너 좋아" 말하기', '특별한 날 데이트 계획하기', '장난 외에 진심 표현하기', '함께 새로운 것 도전하기', '스킨십 의식적으로 늘리기'],
            skinshipNote: '이 관계에서 스킨십은 "우리 연인이야"의 확인입니다. 편안함에 익숙해지면 스킨십이 줄어들 수 있습니다. 의식적으로 손을 잡거나 안아주는 것이 설렘을 유지합니다.',
          },
          growthPoint: {
            strength: '편안함과 유머가 이 관계의 가장 큰 강점입니다. 함께 있으면 자연스럽게 웃을 수 있는 관계입니다.',
            blindSpot: '편안함이 너무 커지면 설렘이 줄어들 수 있습니다. 연인으로서의 특별함을 의식적으로 만들어가는 것이 필요합니다.',
            growthDirection: '편안함을 유지하면서 가끔 "연인다운" 순간을 만드는 연습이 필요합니다. 특별한 날, 진지한 표현, 스킨십이 이 관계를 더 깊게 만듭니다.',
            tip: '오늘 장난 대신 진심으로 "나 너 좋아"라고 말해보세요.',
          },
        },
        intimacyConnection: {
      marriageNote: '설레는 감정을 의식적으로 만드는 것이 이 관계의 생명력입니다. 먼저 안아주고, 먼저 손잡고, 먼저 분위기를 만드는 것이 이 관계에서 가장 중요한 행동입니다.',
      loverNote: '먼저 연락하고, 먼저 표현하고, 먼저 다가가는 것. 그 작은 행동이 이 관계의 설렘을 유지합니다.',
      actions: ['먼저 연락하기', '특별한 날 챙기기', '분위기 있는 곳 함께 가기', '"오늘 너랑 있어서 좋아" 말하기'],
    },
    togetherRoutine: {
      routines: [
        '같이 카페 가서 각자 하고 싶은 것 하기',
        '좋아하는 음식 함께 먹기',
        '취미 공유하기',
        '가볍게 드라이브하기',
        '서로의 이야기 들어주기',
        '함께 여행가기',
      ],
      energyNote: '편안함이 이 관계의 가장 큰 자산입니다. 특별한 것 없이 그냥 함께 있는 것이 두 사람을 살아나게 합니다.',
      faithRoutine: '함께 예배 가기 — 편안한 친구처럼 함께 신앙생활을 나누는 것이 이 관계를 깊게 합니다.',
    },
  },
  이상주의형: {
    accentColor: '#5B8FBF',
    typeName: '감정몰입형 관계',
    typeEmoji: '🌊',
    coreSummary: '감정 깊이는 크지만 기복도 큽니다.',
    tensionDescription: '이 관계는 감정이 큽니다. 기쁠 때는 매우 기쁘고, 서운할 때는 매우 서운합니다. 감정 분위기에 크게 영향받습니다. 상대의 말 한마디, 표정 하나가 하루를 바꿉니다. 감정이 올라올 때는 폭발적이고, 가라앉을 때는 깊이 가라앉습니다. 그러나 이 감정의 깊이가 이 관계의 가장 큰 에너지입니다.',
    misunderstandingPattern: '"왜 그 말이 그렇게 크게 느껴져?" "왜 그렇게 예민하게 반응해?" — 감정 크기의 차이에서 오는 오해입니다. 한 사람에게는 작은 말이 다른 사람에게는 크게 느껴집니다. 감정이 크다는 것이 약점이 아닙니다. 감정을 표현하는 방식을 함께 찾는 것이 이 관계의 과제입니다.',
    connectionStyle: '감정을 깊이 공감해주는 것. "그 감정 이해해"라고 말하는 것이 이 관계의 가장 깊은 연결입니다. 감정을 함께 느끼고 나누는 것이 이 관계를 살아있게 합니다.',
    recoveryRoutine: '감정이 폭발했을 때 바로 대화하지 마세요. 충분히 가라앉힌 후 "그때 내 감정이 이랬어"라고 말하세요. 감정을 설명하는 것이 이 관계의 회복입니다.',
    neededWords: '"내 마음을 알아줬으면 해."',
    recommendedActivity: '감정을 함께 표현할 수 있는 것. 영화 보며 감정 나누기, 음악 함께 듣기, 감정을 글로 써서 나누기.',
    emotionRecoveryStyle: '감정이 가라앉을 시간이 필요합니다. "나 지금 감정이 너무 커서 잠깐 정리할게"라고 말하는 것이 이 관계의 감정 회복 시작입니다.',
    conversationRoutine: '"요즘 어떤 감정이 가장 커?" "내가 어떻게 해줬으면 해?" — 감정을 직접 나누는 대화. 감정의 크기를 인정하는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '"그 감정 이해해"라고 말하는 순간. 감정을 판단하지 않고 함께 느끼는 것이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '감정을 공감해주는 것. "힘들었겠다"라고 먼저 말하기, 감정이 클 때 옆에 있어주기, 감정을 판단하지 않고 들어주기.',
    emotionRoutine: '감정이 올라올 때 표현하기. "나 지금 이런 감정이야"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '감정이 크다는 것은 이 관계를 깊이 느낀다는 것입니다. 감정 기복이 있어도 괜찮습니다. 감정을 함께 나누는 것, 그것이 이 관계의 가장 깊은 연결입니다.',
    temperatureGraph: { emotionGap: 55, expressionIntensity: 70, recoverySpeed: 55 },
    expressionSpeed: { personA: '감정 표현', personB: '감정 공감', description: '감정을 크게 표현하는 사람과 그 감정을 받아주는 사람. 이 흐름이 이 관계의 패턴입니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '감정 공감 대화형', description: '감정을 판단하지 않고 함께 느끼는 대화가 이 관계의 회복입니다.' },
    realEmotions: {
      feelings: [
        '감정이 너무 크게 느껴져서 힘들 수 있습니다.',
        '감정 기복이 있을 때 스스로도 당황스러울 수 있습니다.',
        '감정을 이해받지 못하면 깊이 외로워질 수 있습니다.',
        '감정이 폭발한 후 미안함과 후회가 올 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 감정을 판단하지 않고 함께 느끼는 시간이 필요합니다. 감정이 크다는 것은 이 관계를 깊이 느낀다는 것입니다.',
    },
    dangerPattern: '감정 폭발과 냉각의 반복 패턴.\n감정이 올라옵니다. 폭발합니다. 가라앉습니다. 미안해집니다.\n다시 올라옵니다.\n"왜 항상 이렇게 예민해?" — "왜 내 감정을 이해 못 해?"\n감정 크기를 서로 인정하지 않으면, 이 패턴이 반복됩니다.',
    forbiddenWords: ['"왜 그렇게 예민해?"', '"별거 아닌데 왜 그래?"', '"감정적으로 굴지 마"', '"또 그 얘기야?"'],
    relationStrength: '감정을 깊이 느끼는 관계. 서로의 감정을 크게 공감하는 것. 그 감정의 깊이가 이 관계의 가장 큰 에너지입니다.',
    recommendedColors: [
      { id: 'purple', korName: '퍼플', hex: '#7B5EA7', reason: '깊은 연결과 영적 감수성을 더해주는 이상의 컬러입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '이상화된 감정을 따뜻하고 부드럽게 현실로 내려주는 회복 컬러입니다.' },
    ],
        conflictReactionPattern: '이 관계에서 갈등은 감정이 폭발하거나 깊이 침잠합니다. 한 사람이 ’내 마음을 왜 몰라?’라고 하면, 다른 사람은 ’나도 힘들어’라고 합니다. 둘 다 감정이 크기 때문에 갈등이 커집니다. 갈등 직후 한 사람은 감정을 쏟아내고, 다른 사람은 안으로 들어갑니다. 이 관계에서 갈등 직후 가장 필요한 것은 ’지금 내 감정이 너무 커서 잠깐 정리할게. 그 다음에 얘기하자’라는 말입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 감정의 깊이입니다. 서로의 감정을 깊이 이해하고 공감하는 것이 이 관계의 가장 강한 연결입니다. 사랑을 느끼는 순간은 ’네 마음 알 것 같아’라는 말을 들을 때입니다. 감정 기복이 있어도 서로를 이해하려는 노력이 이 관계를 깊게 만듭니다.',
        growthCoaching: {
          strengths: {
            keywords: ['깊은 감정', '강한 정서적 유대', '몰입감', '진심 어린 연결'],
            description: '감정의 깊이가 크고 정서적 유대가 강합니다. 서로에게 진심으로 몰입하는 에너지가 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['감정 공유', '깊은 대화', '몰입', '감정 확인'],
            description: '감정을 깊이 나누고 서로에게 몰입하는 방식으로 사랑합니다. 표면적인 대화보다 깊은 감정 교류가 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['깊은 대화', '감정 몰입', '진심 어린 공감'],
            description: '서로의 감정에 깊이 공감하고 몰입할 때 가장 살아납니다. 진심 어린 대화와 감정 교류가 이 관계의 에너지원입니다.',
          },
          blindSpot: {
            description: '감정 기복이 커지면 서로 쉽게 지치거나, 작은 일에도 크게 상처받는 순간이 올 수 있습니다. 감정의 깊이를 유지하면서도 안정적인 루틴과 회복 시간을 함께 만드는 것이 이 관계를 지속 가능하게 하는 방법입니다.',
          },
          growthBalance: {
            description: '감정의 깊이와 진심 어린 연결을 유지하면서도, 가끔은 가볍고 안정적인 시간을 함께 만들면 이 관계는 깊으면서도 오래 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '감정을 깊게 느끼고 깊게 연결되는 관계',
            description: '감정 깊이가 크고 정서적 유대가 강합니다. 깊은 공감과 감정 공유가 이 관계의 핵심입니다. 감정이 클수록 관계도 깊어지지만, 기복도 함께 커집니다.',
            keywords: ['감정 깊이', '공감', '정서 유대', '몰입', '기복'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🌊',
                label: '감정 강도',
                personA: '감정이 크게 올라오면 생활에 영향',
                personB: '감정을 빨리 정리하고 싶어함',
                tension: '감정 처리 속도 차이',
              },
              {
                icon: '💬',
                label: '대화 방식',
                personA: '감정 이야기를 깊게 하고 싶음',
                personB: '감정 이야기가 길어지면 지침',
                tension: '대화 깊이 차이',
              },
              {
                icon: '🏠',
                label: '공간 분위기',
                personA: '감정 분위기에 민감함',
                personB: '분위기에 덜 민감함',
                tension: '공간 감수성 차이',
              },
              {
                icon: '😴',
                label: '회복 방식',
                personA: '감정이 정리될 때까지 시간 필요',
                personB: '빨리 털고 일상으로 돌아가고 싶음',
                tension: '회복 속도 차이',
              },
            ],
          },
          conflictFlow: {
            trigger: '"내 마음을 알아줬으면 해"라는 말이 "또 감정 이야기야?"로 들리는 순간',
            reaction: '감정이 큰 사람은 "왜 공감을 못 해줘?"라고 느끼고, 다른 사람은 "어떻게 공감해야 할지 모르겠어"라고 느낍니다.',
            danger: '감정 기복이 커지면 서로 지칩니다. 감정을 해결하려 하면 더 커지는 패턴이 반복됩니다.',
            forbiddenWords: ['"또 감정 이야기야?"', '"너무 예민한 거 아니야?"', '"그냥 넘어가면 안 돼?"', '"왜 이렇게 힘들게 해?"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '"내 감정을 알아줬어"라는 느낌이 들 때 이 관계는 가장 깊어집니다. 해결하려 하지 않고 그냥 옆에 있어주는 것이 가장 깊은 연결입니다.',
            actions: ['감정을 해결하려 하지 않고 들어주기', '"힘들었겠다" 먼저 말하기', '조용히 옆에 있어주기', '감정이 가라앉을 때까지 기다리기', '감정 상태 미리 알려주기'],
            skinshipNote: '이 관계에서 스킨십은 "네 감정이 느껴져"의 표현입니다. 감정이 클 때 말 없이 안아주는 것이 이 관계에서 가장 깊은 연결입니다.',
          },
          growthPoint: {
            strength: '깊은 공감과 정서적 유대가 이 관계의 가장 큰 힘입니다. 감정을 깊게 나눌 수 있는 관계입니다.',
            blindSpot: '감정 기복이 커지면 서로 지칠 수 있습니다. 감정 표현만큼 회복 시간도 중요합니다.',
            growthDirection: '감정 표현과 함께 안정 루틴을 만드는 연습이 필요합니다. 감정이 클 때 "지금 파도 중이야"라고 알려주는 것이 서로를 지킵니다.',
            tip: '오늘 감정이 클 때 해결하려 하지 말고 그냥 안아주세요.',
          },
        },
        intimacyConnection: {
      marriageNote: '감정이 클 때 가까이 있어주는 것이 이 관계에서 가장 중요한 행동입니다. 감정 폭발 후 먼저 안아주는 것이 이 관계의 가장 깊은 연결입니다.',
      loverNote: '감정이 올라올 때 "그 감정 이해해"라고 말하며 가까이 앉는 것. 감정을 판단하지 않고 함께 느끼는 것이 이 관계의 가장 따뜻한 표현입니다.',
      actions: ['감정이 클 때 옆에 있어주기', '"그 감정 이해해" 말하며 손잡기', '감정 폭발 후 먼저 안아주기', '감정이 가라앉을 때 가까이 앉기'],
    },
    togetherRoutine: {
      routines: [
        '함께 여행 계획 세우기',
        '드라이브하며 꿈 이야기하기',
        '서로에게 짧은 쪽지 남기기',
        '새로운 경험 함께 해보기',
        '잠자기 전 서로의 눈을 바라보며 감사 이야기하기',
        '함께 목표 세우기',
      ],
      energyNote: '깊은 연결을 꿈꾸는 이 관계는 함께 새로운 것을 경험할 때 살아납니다. 이상을 현실에서 함께 만들어가는 시간이 두 사람을 연결합니다.',
      faithRoutine: '함께 기도 제목 나누기 — 서로의 깊은 마음을 기도로 나눌 때 이 관계가 가장 깊어집니다.',
    },
  },
  현실균형형: {
    accentColor: '#6B8A5A',
    typeName: '현실협력형 관계',
    typeEmoji: '🤲',
    coreSummary: '현실을 함께 살아가는 팀입니다.',
    tensionDescription: '이 관계는 현실적입니다. 함께 문제를 해결하고, 함께 계획을 세우고, 함께 목표를 향해 갑니다. "이번 달 저축 얼마 할까?" "다음 달 여행 계획 짜볼까?" "이 문제 어떻게 해결하지?" 이런 대화가 자연스럽습니다. 두 사람은 현실에서 가장 좋은 팀입니다.',
    misunderstandingPattern: '"우리 요즘 감정 얘기를 안 하는 것 같아" — 현실 협력이 감정 연결을 대체하는 순간입니다. 문제를 해결하는 것이 자연스러워지면, 감정을 나누는 것이 어색해집니다. 현실 협력과 감정 연결을 함께 유지하는 것이 이 관계의 과제입니다.',
    connectionStyle: '현실을 함께 해결하는 것. 고민을 함께 나누고, 계획을 함께 세우고, 어려움을 함께 넘어가는 것이 이 관계의 가장 깊은 연결입니다. 팀워크가 이 관계의 언어입니다.',
    recoveryRoutine: '현실적인 문제를 함께 해결하기. 문제가 해결되면 자연스럽게 가까워집니다. 감정보다 행동이 먼저인 관계입니다.',
    neededWords: '"우리 팀이잖아. 같이 해결하자."',
    recommendedActivity: '함께 계획 세우기, 함께 문제 해결하기, 함께 목표 정하기. 현실을 함께 살아가는 활동.',
    emotionRecoveryStyle: '문제를 해결하면서 감정도 회복됩니다. 현실적인 것을 함께 해결하는 것이 이 관계의 감정 회복 방식입니다.',
    conversationRoutine: '"요즘 가장 걱정되는 게 뭐야?" — 현실적인 고민을 나누는 대화. 감정보다 상황을 먼저 나누는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '현실적인 문제를 함께 해결한 후 "우리 해냈어"라고 말하는 것. 함께 현실을 살아가는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '현실적인 배려. 피곤해 보이면 먼저 밥을 차려주기, 힘든 날 옆에 조용히 있어주기, 함께 계획 세우기. 현실 속의 작은 배려가 이 관계의 애정 표현입니다. 가끔 "오늘 고마웠어"라는 한 마디가 이 관계를 따뜻하게 유지합니다.',
    emotionRoutine: '현실적인 문제를 해결하면서 감정도 정리하기. 행동이 감정을 이끄는 관계입니다.',
    closingMessage: '현실을 함께 살아가는 것이 가장 깊은 사랑입니다. 설렘은 줄어들 수 있지만, 함께 현실을 살아가는 신뢰는 더 깊어집니다. 두 사람은 현실 속에서 사랑을 만들어가고 있습니다.',
    temperatureGraph: { emotionGap: 30, expressionIntensity: 45, recoverySpeed: 60 },
    expressionSpeed: { personA: '현실적 판단', personB: '현실적 판단', description: '두 사람 모두 현실적으로 생각하고 행동합니다. 그 현실감이 이 관계의 안정감이 됩니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '문제 해결 회복형', description: '현실적인 문제를 함께 해결하면서 자연스럽게 회복됩니다.' },
    realEmotions: {
      feelings: [
        '현실 문제를 해결하다 보면 감정 표현이 줄어들 수 있습니다.',
        '팀워크는 좋지만 연인 같은 느낌이 줄어드는 것 같아 아쉬울 수 있습니다.',
        '함께 있지만 감정 연결이 옅어지는 느낌이 올 수 있습니다.',
        '바쁜 일상 속에서 "우리 괜찮은 거야?"라는 의문이 들 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 현실 협력 외에도 의식적으로 감정을 나누는 시간이 필요합니다. 현실을 함께 살아가는 것이 깊은 사랑이지만, 감정 연결도 함께 유지해야 합니다.',
    },
    dangerPattern: '현실 협력만 남고 감정 연결이 사라지는 패턴.\n함께 문제를 해결합니다. 함께 계획을 세웁니다.\n그런데 어느 순간 "우리 요즘 감정 얘기를 안 하는 것 같아."\n현실 협력이 자연스러워지면, 감정을 나누는 것이 어색해집니다.\n의식적으로 감정을 나누는 시간을 만드는 것이 이 관계의 과제입니다.',
    forbiddenWords: ['"감정적으로 굴지 마"', '"현실적으로 생각해"', '"그게 중요해?"', '"그냥 해결하면 되잖아"'],
    relationStrength: '현실에서 가장 좋은 팀. 어떤 어려움도 함께 해결할 수 있다는 믿음. 그 팀워크가 이 관계의 가장 단단한 기반입니다.',
    recommendedColors: [
      { id: 'teal', korName: '틸', hex: '#4AADA8', reason: '현실과 감정 사이의 균형을 자연스럽게 조율하는 컬러입니다.' },
      { id: 'warm_gray', korName: '웜그레이', hex: '#A09080', reason: '현실적인 안정감을 따뜻하게 감싸주는 균형의 컬러입니다.' },
    ],
        conflictReactionPattern: '이 관계에서 갈등은 현실 문제에서 시작됩니다. ’이번 달 지출이 너무 많아’, ’집 정리 좀 해줘’, ’약속 시간 좀 지켜줘’. 갈등 직후 한 사람은 ’그냥 해결하면 되잖아’라고 하고, 다른 사람은 ’왜 항상 내 탓이야?’라고 느낍니다. 이 관계에서 갈등 직후 가장 필요한 것은 ’문제 해결 전에 감정 먼저’입니다. ’네 말이 맞아. 근데 나 지금 좀 지쳐있어’라는 말이 이 관계의 갈등 언어입니다.',
        loveConnectionStyle: '이 관계에서 사랑은 현실을 함께 관리하는 것입니다. 함께 계획하고, 함께 해결하고, 함께 책임지는 것. 사랑을 느끼는 순간은 ’우리 이거 같이 해결했어’라는 말을 들을 때입니다. 하지만 현실 대화만 남으면 감정이 메마릅니다. 가끔은 ’오늘 어떤 하루였어?’라는 감정 질문이 이 관계를 따뜻하게 만듭니다.',
        growthCoaching: {
          strengths: {
            keywords: ['현실 협력', '문제 해결', '계획력', '균형 감각'],
            description: '현실적인 문제를 함께 해결하는 능력이 뛰어납니다. 계획적이고 균형 잡힌 방식으로 관계를 운영하는 것이 이 관계의 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['현실 지원', '문제 해결', '계획 공유', '실질적 배려'],
            description: '현실적인 문제를 함께 해결하고 지원하는 방식으로 사랑합니다. 감정 표현보다 실질적인 도움과 계획 공유가 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['함께 계획', '현실 문제 해결', '목표 공유'],
            description: '함께 현실적인 목표를 세우고 해결해나갈 때 가장 살아납니다. 공동의 계획과 역할 분담이 이 관계의 에너지원입니다.',
          },
          blindSpot: {
            description: '현실 중심으로 흐르다 보면 감정 표현이나 애정 온도가 낮아지는 순간이 올 수 있습니다. 현실적인 협력만큼 가끔은 감정을 나누고 따뜻한 표현을 의식하면 관계 온도가 더 살아납니다.',
          },
          growthBalance: {
            description: '현실적인 협력과 균형 감각을 유지하면서도, 감정 교류와 따뜻한 표현을 의식적으로 더하면 이 관계는 안정적이면서도 따뜻하게 오래 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '현실을 함께 해결하는 파트너 관계',
            description: '감정보다 현실 문제를 함께 해결하는 것이 이 관계의 에너지입니다. 서로가 현실적인 파트너로 신뢰할 수 있을 때 가장 안정됩니다. 함께 계획하고 실행하는 것이 연결입니다.',
            keywords: ['현실', '협력', '계획', '신뢰', '파트너십'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '💰',
                label: '재정 관리',
                personA: '재정 계획을 꼼꼼하게 세움',
                personB: '큰 그림만 보고 세부는 맡기는 편',
                tension: '재정 세부 관리 차이',
              },
              {
                icon: '📋',
                label: '집안일',
                personA: '역할 분담이 명확해야 함',
                personB: '상황에 따라 유연하게 하는 편',
                tension: '역할 분담 기준 차이',
              },
              {
                icon: '📅',
                label: '계획 방식',
                personA: '미리 계획하고 준비함',
                personB: '즉흥적으로 결정하는 편',
                tension: '계획 vs 즉흥 충돌',
              },
              {
                icon: '🎯',
                label: '목표 방식',
                personA: '목표를 세우고 달성하는 것이 중요',
                personB: '과정을 즐기는 것이 더 중요',
                tension: '목표 vs 과정 가치관 차이',
              },
            ],
          },
          conflictFlow: {
            trigger: '"이거 어떻게 할 거야?"라는 현실 문제가 감정 싸움으로 번지는 순간',
            reaction: '현실 중심인 사람은 "왜 감정적으로 반응해?"라고 느끼고, 다른 사람은 "왜 항상 해결만 생각해?"라고 느낍니다.',
            danger: '현실 문제를 해결하다 감정 표현이 줄어들면 관계가 사무적으로 느껴집니다. 파트너가 아닌 룸메이트처럼 느껴지는 순간이 옵니다.',
            forbiddenWords: ['"왜 이것도 못 해?"', '"내가 다 해야 해?"', '"그게 그렇게 중요해?"', '"감정적으로 굴지 마"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '함께 문제를 해결하고 "우리 해냈다"라고 느낄 때 이 관계는 가장 깊어집니다. 현실적인 협력이 이 관계의 가장 강한 연결입니다.',
            actions: ['함께 계획 세우기', '역할 분담 명확히 하기', '"우리 해냈다" 함께 확인하기', '현실 문제 해결 후 함께 쉬기', '"고마워, 네가 있어서 다행이야" 말하기'],
            skinshipNote: '이 관계에서 스킨십은 "우리는 팀이야"의 확인입니다. 현실 문제를 해결한 후 함께 쉬면서 손을 잡거나 안아주는 것이 이 관계의 온도를 유지합니다.',
          },
          growthPoint: {
            strength: '현실적인 협력과 신뢰가 이 관계의 가장 큰 힘입니다. 함께 문제를 해결하는 능력이 뛰어납니다.',
            blindSpot: '현실 문제에 집중하다 감정 표현이 줄어들 수 있습니다. 파트너가 아닌 룸메이트처럼 느껴지는 순간이 올 수 있습니다.',
            growthDirection: '현실 협력과 함께 감정 표현을 의식적으로 늘리는 연습이 필요합니다. "고마워, 네가 있어서 다행이야"라는 말이 이 관계를 따뜻하게 유지합니다.',
            tip: '오늘 현실 문제 해결 후 "우리 해냈다, 고마워"라고 말해보세요.',
          },
        },
        intimacyConnection: {
      marriageNote: '현실적인 관계에서 의식적인 친밀함이 "우리는 현실 이상의 연결이 있어"라는 신호입니다. 바쁜 일상 속에서도 몸의 연결을 잊지 마세요.',
      loverNote: '현실적인 대화 후 가까이 앉는 것. 문제를 함께 해결한 후 손잡는 것이 이 관계의 가장 자연스러운 연결입니다.',
      actions: ['문제 해결 후 함께 안아주기', '현실적인 대화 후 손잡기', '"우리 해냈어" 말하며 토닥이기', '바쁜 날 짧게 포옹하기'],
    },
    togetherRoutine: {
      routines: [
        '함께 목표 세우기',
        '같이 장보기 / 식사 준비하기',
        '함께 청소 / 정리하기',
        '주말 계획 함께 짜기',
        '서로의 수고를 인정하는 대화 나누기',
        '잠자기 전 내일 계획 짧게 이야기하기',
      ],
      energyNote: '현실을 함께 살아가는 것이 이 관계의 사랑 방식입니다. 함께 문제를 해결하고 일상을 꾸려가는 것이 두 사람을 살아나게 합니다.',
      faithRoutine: '함께 식사 전 감사기도 하기 — 현실의 작은 것에 감사하는 습관이 이 관계를 따뜻하게 유지합니다.',
    },
  },
  회복형: {
    accentColor: '#C47E8A',
    typeName: '회복형 관계',
    typeEmoji: '🌱',
    coreSummary: '멀어졌다 다시 연결됩니다.',
    tensionDescription: '이 관계에는 갈등이 있습니다. 싸우고 나면 지칩니다. 멀어진 것 같아 불안해집니다. 그런데 시간이 지나면 다시 서로가 생각납니다. 연락하고 싶어집니다. 결국 다시 연결됩니다. "또 이 패턴이야"라는 피로감이 쌓이기도 하지만, 상처보다 다시 연결되는 힘이 더 큰 관계입니다.',
    misunderstandingPattern: '갈등 후 한 사람은 빨리 화해하고 싶습니다. 다른 사람은 아직 정리가 안 됐습니다. "왜 아직도 그래?"와 "왜 이미 끝난 것처럼 행동해?"가 교차합니다. 갈등이 많은 것이 관계가 나쁜 것이 아닙니다. 싸우고 나서 어떻게 돌아오느냐가 이 관계의 핵심입니다.',
    connectionStyle: '싸우고도 결국 다시 연락하게 되는 관계입니다. 갈등 후 안아주는 순간 긴장이 풀립니다. 그 안도감이 이 관계의 가장 깊은 연결입니다. 상처를 함께 아문 사람들만이 아는 감정입니다.',
    recoveryRoutine: '갈등 직후 바로 화해하려 하지 마세요. 충분히 식힌 후 다시 만나세요. 그리고 "그때 힘들었지? 나도 미안했어"로 시작하세요. 빠른 화해보다 진심 어린 회복이 이 관계를 더 단단하게 만듭니다.',
    neededWords: '"우리 또 해냈어. 이번에도 우리가 이겼어."',
    recommendedActivity: '갈등 후 함께 즐거운 시간 만들기. 맛있는 것 먹기, 좋아하는 장소 방문, 함께 웃을 수 있는 것. 회복 후의 연결이 이 관계를 더 단단하게 만듭니다.',
    emotionRecoveryStyle: '갈등 후 빠른 화해보다 충분한 감정 처리 시간이 필요합니다. "나 아직 정리가 안 됐어, 조금만 기다려줘"라고 말하는 것이 이 관계의 가장 정직한 회복 방식입니다.',
    conversationRoutine: '갈등 후 다시 만날 때 "그때 어떤 마음이었어?"라고 먼저 묻기. 사건보다 감정을 먼저 나누는 대화가 진짜 회복을 만듭니다.',
    connectionRoutine: '"우리 또 회복했어"라고 함께 인정하는 순간이 이 관계의 가장 깊은 정서 연결입니다. 갈등을 함께 넘어온 것 자체가 신뢰의 증거입니다.',
    affectionRoutine: '갈등 후 회복했을 때 먼저 안아주기. "우리 또 해냈어"라고 말하며 포옹하기. 화해 후의 안도감을 함께 느끼는 것이 이 관계에서 가장 따뜻한 애정 표현입니다.',
    emotionRoutine: '갈등 후 빠른 화해보다 충분한 감정 처리 시간 갖기. "나 아직 정리가 안 됐어, 조금만 기다려줘"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '갈등 후 안아주는 순간, 울컥하는 감정이 올라올 수 있습니다. 그 감정이 이 관계의 진심입니다. 싸우고도 결국 다시 연결되는 관계. 상처보다 회복이 더 큰 관계. 두 사람은 이미 그 방법을 알고 있습니다.',
    temperatureGraph: { emotionGap: 55, expressionIntensity: 65, recoverySpeed: 85 },
    expressionSpeed: { personA: '갈등 후 정리', personB: '갈등 후 표현', description: '갈등이 생기면 한 사람은 혼자 정리하고, 다른 사람은 표현하면서 회복합니다. 회복 방식의 차이가 있지만, 두 사람 모두 회복을 원합니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '진심 대화 회복형', description: '충분한 시간이 지난 후 진심 어린 대화로 회복됩니다. 빠른 화해보다 진짜 회복을 선택합니다.' },
    realEmotions: {
      feelings: [
        '또 이 패턴이야, 싶은 피로감이 올라올 수 있습니다.',
        '갈등 후 안아주는 순간 울컥하는 감정이 올라올 수 있습니다.',
        '멀어진 것 같아 불안한데, 먼저 연락하기 어려울 수 있습니다.',
        '상처를 받았지만 결국 다시 연결되고 싶은 마음이 더 클 수 있습니다.',
      ],
      recoveryBridge: '그래서 이 관계에는 갈등 후 충분히 쉬는 시간과 다시 연결되는 용기가 모두 필요합니다. 빠른 화해보다 진심 어린 회복이 이 관계를 더 단단하게 만듭니다.',
    },
    dangerPattern: '회복이 반복되면서 지치는 패턴.\n갈등이 옵니다. 회복됩니다. 또 갈등이 옵니다.\n"또 이 패턴이야." 그 피로감이 쌓입니다.\n빠른 화해를 반복하면서 근본 원인을 다루지 않으면 같은 갈등이 반복됩니다.\n"우리 왜 항상 이 문제로 싸우지?" — 회복의 깊이를 더해야 합니다.',
    forbiddenWords: ['"또 이 얘기야?"', '"이미 사과했잖아"', '"왜 아직도 그래?"', '"그냥 넘어가면 되잖아"'],
    relationStrength: '싸우고도 결국 다시 연결되는 힘. 시간이 지나면 다시 서로가 생각나는 관계. 갈등 후 안아주는 순간 긴장이 풀리는 경험. 이 관계의 강점은 회복 그 자체입니다.',
    recommendedColors: [
      { id: 'coral', korName: '코랄', hex: '#E8826A', reason: '갈등 후 재연결과 따뜻한 회복을 도와주는 감정 치유 컬러입니다.' },
      { id: 'ivory', korName: '아이보리', hex: '#F5EDD6', reason: '화해와 새로운 시작을 부드럽게 감싸주는 순수한 컬러입니다.' },
    ],
    profileContrastOverride: {
      attractionContrast: '두 사람은 갈등 후 다시 연결되는 힘이 있습니다. 싸우는 것이 이 관계의 문제가 아닙니다. 싸우고 나서 어떻게 돌아오는지가 이 관계의 핵심입니다. 한 사람이 먼저 연락하고, 다른 사람이 그 연락을 기다리는 흐름이 반복됩니다. 그 반복이 쌓여 이 관계가 됩니다. 상처를 함께 아문 사람들만이 아는 안도감이 이 관계에 있습니다.',
      relationFlow: '갈등 → 거리 → 시간 → 진심 → 재연결. 이 흐름이 이 관계의 패턴입니다. 싸우고 나서 바로 화해하지 않아도 됩니다. 시간이 지나면 다시 서로가 생각납니다. 그 감정이 이 관계를 다시 연결합니다. 회복을 반복하면서 이 관계는 점점 더 단단해지고 있습니다.',
      expressionDifference: '두 사람은 갈등 표현 방식이 다를 수 있습니다. 한 사람은 바로 말하고 싶고, 다른 사람은 혼자 정리가 필요합니다. "나 아직 정리가 안 됐어, 조금만 기다려줘"라는 말이 이 관계에서 가장 정직한 표현입니다. 빠른 화해보다 진심 어린 회복이 이 관계를 더 단단하게 만듭니다.',
      conflictPattern: '"우리 왜 이렇게 자주 싸우지?" — 갈등이 많다는 것이 관계가 나쁘다는 것이 아닙니다. 갈등 후 회복하는 것이 반복될수록 이 관계는 더 깊어집니다. 오해가 생기는 순간은 주로 회복 속도의 차이입니다. 한 사람은 이미 넘어갔는데, 다른 사람은 아직 정리 중인 순간. 그 타이밍을 맞추는 것이 이 관계의 숙제입니다.',
      connectionStyle: '갈등 후 안아주는 순간 긴장이 풀립니다. 그 안도감이 이 관계의 가장 깊은 연결입니다. 먼저 손을 내미는 것, 먼저 연락하는 것, 먼저 옆에 앉는 것. 그 작은 용기가 이 관계를 다시 연결합니다. "우리 또 해냈어"라고 함께 인정하는 순간이 이 관계의 가장 따뜻한 순간입니다.',
    },
        conflictReactionPattern: '갈등이 생기면 처음에는 거리가 생깁니다. 한 사람은 말이 없어지고, 다른 사람은 기다립니다. 시간이 지나면 한 사람이 먼저 연락합니다. ’밥 먹었어?’ 또는 ’오늘 어땠어?’라는 말로 시작됩니다. 갈등이 직접 해결되지 않아도 다시 연결됩니다. 이 관계에서 갈등 직후 가장 필요한 것은 먼저 손을 내미는 용기입니다. 누가 먼저든 상관없습니다.',
        loveConnectionStyle: '이 관계에서 사랑은 회복입니다. 싸워도 결국 다시 연락하게 되는 것, 시간이 지나면 다시 서로가 생각나는 것. 사랑을 느끼는 순간은 갈등 후 상대가 먼저 손을 내밀 때입니다. 이 관계의 가장 강한 연결은 ’우리 또 해냈어’라는 말을 나눌 때 완성됩니다.',
        growthCoaching: {
          strengths: {
            keywords: ['회복력', '재연결', '깊어지는 관계', '갈등 후 성장'],
            description: '갈등 후 다시 연결되며 더 깊어지는 힘이 있습니다. 싸워도 결국 다시 찾게 되는 이 관계의 회복력이 가장 큰 강점입니다.',
          },
          loveStyle: {
            keywords: ['재연결', '회복', '깊은 유대', '갈등 후 가까워짐'],
            description: '갈등 후 다시 연결되는 과정에서 사랑을 확인합니다. 힘든 순간을 함께 넘기며 더 깊어지는 것이 이 관계의 사랑 언어입니다.',
          },
          alivePattern: {
            keywords: ['화해', '재연결', '갈등 후 안아주기'],
            description: '갈등 후 다시 연결될 때 가장 살아납니다. 서로를 다시 찾는 순간, 긴장이 풀리고 관계 에너지가 높아집니다.',
          },
          blindSpot: {
            description: '갈등과 회복의 사이클이 반복되다 보면 서로 지치는 순간이 올 수 있습니다. 회복의 힘을 유지하면서도, 갈등이 생기기 전에 미리 소통하는 루틴을 만드는 것이 이 관계를 더 안정적으로 만드는 방법입니다.',
          },
          growthBalance: {
            description: '회복력과 재연결의 힘을 유지하면서도, 갈등이 쌓이기 전에 미리 표현하고 소통하는 습관을 만들면 이 관계는 더 깊고 안정적으로 이어질 수 있습니다.',
          },
        },

        unifiedSections: {
          coreEnergy: {
            headline: '갈등 후 더 깊어지는 관계',
            description: '싸워도 결국 다시 연락하게 되는 관계입니다. 갈등이 관계를 끊는 것이 아니라 더 깊게 만드는 힘이 있습니다. 회복하는 과정 자체가 이 관계의 언어입니다.',
            keywords: ['회복', '재연결', '갈등 후 성장', '끈기', '깊이'],
          },
          lifePattern: {
            headline: '같이 살면 이런 순간이 반복됩니다',
            items: [
              {
                icon: '🌊',
                label: '갈등 패턴',
                personA: '감정이 올라오면 바로 표현함',
                personB: '혼자 정리하고 나서 말함',
                tension: '갈등 표현 타이밍 차이',
              },
              {
                icon: '🔄',
                label: '회복 방식',
                personA: '빨리 해결하고 싶음',
                personB: '시간이 필요함',
                tension: '회복 속도 차이',
              },
              {
                icon: '💬',
                label: '사과 방식',
                personA: '말로 직접 사과함',
                personB: '행동으로 표현함',
                tension: '사과 방식 차이로 오해',
              },
              {
                icon: '🏠',
                label: '갈등 후 공간',
                personA: '갈등 후 함께 있고 싶음',
                personB: '갈등 후 혼자 있어야 정리됨',
                tension: '갈등 후 공간 욕구 차이',
              },
            ],
          },
          conflictFlow: {
            trigger: '한 사람은 이미 화해했다고 생각하는데, 다른 사람은 아직 마음이 정리되지 않은 순간',
            reaction: '먼저 회복된 사람은 "왜 아직도 그래?"라고 느끼고, 아직 정리 중인 사람은 "왜 이미 끝난 것처럼 행동해?"라고 느낍니다.',
            danger: '회복 속도 차이를 인정하지 않으면 "또 이 패턴"이 반복됩니다. 한 사람이 항상 먼저 손을 내밀면 지칩니다.',
            forbiddenWords: ['"왜 아직도 그래?"', '"내가 먼저 사과했잖아"', '"언제까지 이럴 거야?"', '"그냥 넘어가면 안 돼?"'],
          },
          connectionFlow: {
            headline: '이 관계가 가까워지는 순간',
            description: '갈등 후 다시 손을 내밀 때, "그래도 네가 있어서 다행이야"라는 말을 들을 때. 회복하는 과정 자체가 이 관계를 더 깊게 만듭니다.',
            actions: ['먼저 손 내밀기', '"그래도 네가 있어서 다행이야" 말하기', '갈등 후 함께 밥 먹기', '회복 속도 차이 인정하기', '"나 아직 정리 중이야" 솔직하게 말하기'],
            skinshipNote: '이 관계에서 스킨십은 "우리 괜찮아"의 확인입니다. 갈등 후 먼저 안아주는 것이 이 관계를 회복시키는 가장 빠른 방법입니다.',
          },
          growthPoint: {
            strength: '갈등 후 회복하는 힘이 이 관계의 가장 큰 강점입니다. 싸워도 결국 다시 연결되는 끈기가 있습니다.',
            blindSpot: '회복에 집중하다 갈등의 원인을 해결하지 않으면 같은 패턴이 반복됩니다. 회복과 함께 원인도 함께 이야기해야 합니다.',
            growthDirection: '회복하는 것만큼 "왜 이런 갈등이 반복되는지"를 함께 이야기하는 연습이 필요합니다. 회복 후 짧게 "다음에는 이렇게 해보자"를 나눠보세요.',
            tip: '갈등 후 회복됐을 때 "다음에는 이렇게 해보자" 한마디 — 이것이 이 관계를 성장시킵니다.',
          },
        },
        intimacyConnection: {
      marriageNote: '회복하는 부부에게 화해의 포옹은 말보다 먼저 마음을 열어줍니다. 갈등 후 먼저 손을 내미는 것, 그것이 이 관계에서 가장 용기 있는 행동입니다.',
      loverNote: '회복하는 과정에서 말이 어렵다면 먼저 가까이 앉는 것부터 시작하세요. 거리가 좁혀지면 말도 자연스럽게 따라옵니다.',
      actions: ['갈등 후 먼저 옆에 앉기', '말 없이 손을 내밀기', '화해 후 짧게 안아주기', '"우리 잘 했어" 말하며 토닥이기'],
    },
    togetherRoutine: {
      routines: [
        '같이 조용히 산책하기',
        '브런치 함께 먹기',
        '드라이브하며 이야기하기',
        '서로에게 짧은 쪽지 남기기',
        '잠자기 전 서로의 눈을 바라보며 감사 제목 이야기하기',
        '함께 여행가기',
      ],
      energyNote: '멀어졌다 다시 연결되는 이 관계는 함께 쉬는 시간이 가장 중요합니다. 갈등 후 함께 밥을 먹고 산책하는 것이 두 사람을 회복시킵니다.',
      faithRoutine: '손잡고 기도하기 — 갈등 후 함께 기도할 때 이 관계가 가장 빠르게 회복됩니다.',
    },
  },
};

export function getRelationArchetype(
  familiesA: EnergyFamily[],
  familiesB: EnergyFamily[],
  shapeA?: string,
  shapeB?: string,
  colorIdsA?: string[],
  colorIdsB?: string[]
): ArchetypeResult {
  // ── 레이어형 가중치 구조 ──
  // Layer 1: 컬러 조합 (주축 — archetype의 70~80%)
  //   - 첫 번째 컬러: 1.5배 가중치 (핵심 기질)
  //   - 2·3번째 컬러: 1.0배 가중치
  // Layer 2: 도형 (modifier — 점수 보너스만, archetype 완전교체 금지)
  //   - 같은 컬러 조합이면 도형이 바뀌어도 archetype 유지
  //   - 극단적 조합에서만 인접 archetype으로 이동

  // 1. 컬러 점수 계산 — 첫 번째 컬러 1.5배 가중치
  function calcWeightedEmotionScore(colorIds: string[]): EmotionDimension {
    const total: EmotionDimension = { distance: 0, tension: 0, recovery: 0, stable: 0, expression: 0, circulation: 0 };
    colorIds.forEach((id, idx) => {
      const s = COLOR_EMOTION_SCORE[id] ?? DEFAULT_EMOTION_SCORE;
      const weight = idx === 0 ? 1.5 : 1.0; // 첫 컬러 핵심 기질 가중치
      (Object.keys(total) as (keyof EmotionDimension)[]).forEach(k => {
        total[k] += s[k] * weight;
      });
    });
    return total;
  }

  const scoreA = calcWeightedEmotionScore(colorIdsA ?? []);
  const scoreB = calcWeightedEmotionScore(colorIdsB ?? []);
  const signal = calcRelationSignal(scoreA, scoreB);

  // 2. 컬러 기반 기본 archetype 결정 (안정적 주축)
  const baseArchetype: RelationArchetype = scoreToArchetype(signal);

  // 3. 도형 보정 — 점수 보너스 방식 (archetype 완전교체 금지)
  //    도형은 narrative modifier 역할만 수행
  //    baseArchetype과 인접한 archetype에만 소폭 보너스 부여
  const shapeTension = getShapeTension(shapeA, shapeB);
  const shapeBonus: Partial<Record<RelationArchetype, number>> = {};

  // 도형별 인접 archetype에 보너스 점수 부여 (최대 12점 — 컬러 점수 대비 소폭)
  if (shapeTension === 'defense') {
    // 역삼각형(방어) → 거리조절형·온도차형에 소폭 보너스
    shapeBonus['거리조절형'] = 10;
    shapeBonus['온도차형'] = 6;
  } else   if (shapeTension === 'sensitive') {
    // 마름모(민감) → 감정순환형 우선, 회복형 소폭 보너스 (회복형 과다 방지)
    shapeBonus['감정순환형'] = 10;
    shapeBonus['회복형'] = 4;
  } else if (shapeTension === 'growth') {
    // 오각형(성장) → 성장자극형에 소폭 보너스
    shapeBonus['성장자극형'] = 12;
  } else if (shapeTension === 'boundary') {
    // 삼각형(경계) → 온도차형·거리조절형에 소폭 보너스
    shapeBonus['온도차형'] = 10;
    shapeBonus['거리조절형'] = 6;
  } else if (shapeTension === 'flow') {
    // 원(순환) → 감정순환형 우선, 회복형 소폭 (회복형 과다 방지)
    shapeBonus['감정순환형'] = 12;
    shapeBonus['회복형'] = 3;
    shapeBonus['친구형'] = 5;
  } else if (shapeTension === 'harmony') {
    // 육각형(조화) → 안정추구형·친구형에 보너스 강화
    shapeBonus['안정추구형'] = 14;
    shapeBonus['친구형'] = 10;
    shapeBonus['현실균형형'] = 6;
  } else if (shapeTension === 'stable') {
    // 네모(안정) → 안정추구형·현실균형형에 보너스 강화
    shapeBonus['안정추구형'] = 16;
    shapeBonus['현실균형형'] = 6;
  }

  // 보너스 적용 후 최종 archetype 결정
  // baseArchetype 점수에 충분한 안정 마진(+20) 부여 → 도형 보너스로 쉽게 뒤집히지 않음
  const BASE_STABILITY_MARGIN = 20;
  const archetypeScores = scoreToArchetypeScores(signal);
  const baseScore = archetypeScores[baseArchetype] + BASE_STABILITY_MARGIN;

  let finalArchetype = baseArchetype;
  let bestScore = baseScore;
  for (const [arch, bonus] of Object.entries(shapeBonus) as [RelationArchetype, number][]) {
    if (arch !== baseArchetype) {
      const totalScore = (archetypeScores[arch] ?? 0) + bonus;
      if (totalScore > bestScore) {
        bestScore = totalScore;
        finalArchetype = arch;
      }
    }
  }

  // ── 표현 속도 동적 할당 ──
  // 콜러의 expression 점수를 기반으로 personA/personB 표현 스타일을 실제 입력에 맞게 할당
  // (archetype의 고정값이 아닌, 실제 두 사람의 콜러 성향 반영)
  const baseData = ARCHETYPE_DATA[finalArchetype];
  const exprScoreA = scoreA.expression;
  const exprScoreB = scoreB.expression;
  // ── 유사형 관계 expressionSpeed 오버라이드 ──
  // dominantA === dominantB인 경우 '차이' 중심 description 대신 '유사형 과열' 중심으로 교체
  const dominantA = getDominantFamily(familiesA);
  const dominantB = getDominantFamily(familiesB);
  const isSameEnergyFamily = dominantA === dominantB;
  const sameExprDescMap: Record<EnergyFamily, string> = {
    warm_active: '두 사람 모두 빠르게 반응하는 편입니다. 같은 언어를 쓰지만 둘 다 흥분하면 감정 강도가 함께 올라가는 순간이 생깁니다.',
    warm_soft: '두 사람 모두 감성적으로 표현하는 편입니다. 서로 잘 이해하지만 둘 다 자신의 감정을 뒤로 미루다 소진되는 패턴이 생길 수 있습니다.',
    warm_grounded: '두 사람 모두 신중하게 표현하는 편입니다. 비슷한 속도로 움직이지만 변화가 필요한 순간 둘 다 망설이는 패턴이 생길 수 있습니다.',
    cool_clear: '두 사람 모두 명료하게 표현하는 편입니다. 효율적으로 소통하지만 감정 연결보다 결론을 먼저 내리다 관계가 사무적으로 느껴지는 순간이 생길 수 있습니다.',
    cool_deep: '두 사람 모두 내면 처리 후 표현하는 편입니다. 서로의 침묵을 이해하지만 둘 다 기다리다 연결이 늦어지는 패턴이 반복될 수 있습니다.',
    nature: '두 사람 모두 자연스러운 리듬으로 표현하는 편입니다. 서로를 강요하지 않아 편안하지만 둘 다 방향을 기다리다 관계가 정체되는 순간이 생길 수 있습니다.',
    neutral: '두 사람 모두 균형 잡힌 방식으로 표현하는 편입니다. 비슷한 속도로 맞춰가지만 때로는 누군가 먼저 감정을 꺼내는 것이 필요합니다.',
  };
  // 표현 점수 차이가 2 이상일 때만 동적 할당 (차이가 작으면 archetype 기본값 유지)
  let dynamicExpressionSpeed = isSameEnergyFamily
    ? { personA: baseData.expressionSpeed.personA, personB: baseData.expressionSpeed.personB, description: sameExprDescMap[dominantA] }
    : baseData.expressionSpeed;
  if (!isSameEnergyFamily && Math.abs(exprScoreA - exprScoreB) >= 2) {
    // ── 표현 점수 임계값: 3컬러 가중치 합산 기준 (최대 ~31.5, 최소 ~3.5) ──
    // 단일 컬러 기준(0-10)이 아닌 합산 점수 기준으로 수정
    // 예: 그린·옐로우·바이올렛 = 3*1.5+5+3 = 12.5 → '상황에 따라 표현'
    //     레드·블루·옐로우 = 9*1.5+6+5 = 24.5 → '즉각적 표현'
    const getExprLabel = (score: number): string => {
      if (score >= 22) return '즉각적 표현';     // 레드·오렌지 계열 주도
      if (score >= 16) return '직접적 표현';     // 옐로우·블루 계열 주도
      if (score >= 11) return '상황에 따라 표현'; // 그린·핑크 계열
      if (score >= 7)  return '내면 처리 후 표현'; // 바이올렛·인디고 계열
      return '조용한 표현';                      // 화이트·블랙 계열
    };
    const labelA = getExprLabel(exprScoreA);
    const labelB = getExprLabel(exprScoreB);
    // 두 레이블이 다를 때만 교체 (같으면 archetype 기본값 유지)
    if (labelA !== labelB) {
      dynamicExpressionSpeed = {
        personA: labelA,
        personB: labelB,
        description: baseData.expressionSpeed.description,
      };
    }
  }
  // ── 컬러 조합 기반 생활 섹션 동적 생성 ──────────────────────────────────
  // 두 사람의 첫 번째 컬러(핵심 기질) + 전체 조합으로 생활 패턴 분기
  const c0A = colorIdsA?.[0] ?? '';
  const c0B = colorIdsB?.[0] ?? '';
  const c1A = colorIdsA?.[1] ?? '';
  const c1B = colorIdsB?.[1] ?? '';
  const c2A = colorIdsA?.[2] ?? '';
  const c2B = colorIdsB?.[2] ?? '';

  // 컬러 조합 키 생성 (첫 번째 컬러 기준, 양방향 매칭)
  const lifestyleKey = `${c0A}-${c0B}`;
  const lifestyleKeyRev = `${c0B}-${c0A}`;
  // 3컬러 전체 조합 키 (더 세밀한 분기용)
  const fullKeyA = [c0A, c1A, c2A].filter(Boolean).join('-');
  const fullKeyB = [c0B, c1B, c2B].filter(Boolean).join('-');

  type LifestyleSections = NonNullable<ArchetypeResult['lifestyleSections']>;

  // ── 컬러 조합별 생활 섹션 데이터 맵 ──
  const LIFESTYLE_MAP: Partial<Record<string, LifestyleSections>> = {
    // ── red + pink 조합 ──
    'red-pink': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 빠른 결정과 즉각적인 소비를 선호하고, 다른 사람은 감정적 안정감을 위해 소비합니다.',
        personA: '"지금 필요하면 바로 사자." 계획보다 현재 필요에 반응하는 소비 방식입니다.',
        personB: '"이게 있으면 기분이 좋아질 것 같아." 감정 회복을 위한 소비가 많습니다.',
        tension: '두 사람 모두 즉흥 소비 성향이 있어, 정작 "비상금이 없다"는 현실에 함께 놀라는 순간이 생깁니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 눈에 보이는 것을 빠르게 치우고, 다른 사람은 분위기가 편안해야 정리하고 싶어집니다.',
        personA: '"일단 치우고 보자." 빠른 정리를 선호하지만 완벽하지 않아도 됩니다.',
        personB: '"지금은 쉬고 싶어. 나중에 같이 하자." 감정 상태가 정리 의욕에 영향을 줍니다.',
        tension: '"왜 나만 치워?"와 "나 지금 힘들어"가 반복되면 청소가 갈등 신호가 됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동하며 기분을 전환하고, 다른 사람은 감정적 연결이 있어야 쉬어지는 느낌이 납니다.',
        personA: '"나가서 뭔가 하면 기분 풀려." 움직이면서 회복하는 유형입니다.',
        personB: '"같이 있어주면서 내 말 들어줘." 공감받는 시간이 진짜 휴식입니다.',
        tension: '한 사람이 나가자고 할 때 다른 사람은 "지금 내 마음을 먼저 알아줬으면"이라고 느낄 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 행동으로, 다른 사람은 말과 스킨십으로 사랑을 표현합니다.',
        personA: '"밥 먹었어?" "내가 해줄게." 챙김과 행동이 사랑의 언어입니다.',
        personB: '"오늘 예뻐." "보고 싶었어." 말과 가까이 있는 것이 사랑의 언어입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "왜 표현을 안 해?"보다 "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 바로 해결하고 싶고, 다른 사람은 감정이 가라앉을 시간이 필요합니다.',
        personA: '"지금 바로 얘기하자. 이대로 자면 안 돼." 즉각 해결을 원합니다.',
        personB: '"조금만 시간 줘. 지금은 말하기 싫어." 감정 정리 후 대화를 원합니다.',
        tip: '"30분 후에 다시 얘기하자"는 합의가 두 사람 모두에게 공간을 줍니다.',
      },
    },
    // ── red + blue 조합 ──
    'red-blue': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 현재 중심 소비, 다른 사람은 신뢰와 계획 중심 소비를 합니다.',
        personA: '"좋으면 사는 거지. 지금 행복이 중요해." 경험 소비형입니다.',
        personB: '"비상금은 꼭 있어야 해. 계획 없이 쓰면 불안해." 안정 저축형입니다.',
        tension: '"왜 그걸 꼭 지금 사야 해?"와 "돈보다 경험이 더 중요해"가 반복되면 재정이 갈등 포인트가 됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 즉흥적으로 치우고, 다른 사람은 정해진 방식대로 정리해야 편안합니다.',
        personA: '"대충 치워도 돼. 어차피 또 어질러질 거잖아." 빠른 정리를 선호합니다.',
        personB: '"물건은 제자리에 있어야 해. 이 정도는 기본이야." 정돈된 공간이 심리적 안정입니다.',
        tension: '"왜 이렇게 예민해?"와 "이건 기본 아니야?"가 교차하면 청소가 신뢰 문제로 번집니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 새로운 자극으로, 다른 사람은 익숙한 루틴으로 회복합니다.',
        personA: '"어디 새로운 데 가보자. 집에만 있으면 답답해." 활동 전환형입니다.',
        personB: '"오늘은 그냥 집에서 쉬고 싶어. 루틴이 있어야 편해." 루틴 회복형입니다.',
        tension: '쉬는 방식이 달라 "같이 쉬는데 왜 혼자 쉰 것 같지?"라는 느낌이 생깁니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 즉흥적인 표현, 다른 사람은 일관된 행동으로 사랑을 보여줍니다.',
        personA: '"갑자기 안아주고 싶어." "오늘 뭔가 특별한 거 하자." 즉흥적 표현형입니다.',
        personB: '"매일 연락하고, 약속 지키는 게 사랑이야." 꾸준한 신뢰형입니다.',
        tip: '"왜 갑자기 이래?"보다 "이런 표현이 좋아"라고 말해주면 두 사람 모두 편해집니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 감정이 폭발하고, 다른 사람은 논리적으로 정리하려 합니다.',
        personA: '"지금 당장 얘기해야 해. 이게 말이 돼?" 즉각 반응형입니다.',
        personB: '"감정적으로 말하면 해결이 안 돼. 좀 진정하고 얘기하자." 논리 정리형입니다.',
        tip: '"지금 많이 화났구나"라는 한 마디가 논리보다 먼저 필요합니다.',
      },
    },
    // ── red + white 또는 white + red 조합 ──
    'red-white': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 추진력 있는 소비, 다른 사람은 정리·절제 중심 소비를 합니다.',
        personA: '"기회가 왔을 때 써야 해. 망설이다가 놓치면 후회해." 기회 포착형 소비입니다.',
        personB: '"지금 꼭 필요한 건지 다시 생각해봐. 비워야 채워지는 거야." 절제·정화형 소비입니다.',
        tension: '"왜 이렇게 소극적이야?"와 "왜 이렇게 충동적이야?"가 교차합니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 빠른 실행, 다른 사람은 완벽한 정리를 원합니다.',
        personA: '"일단 치우자. 완벽하지 않아도 돼." 빠른 실행 우선입니다.',
        personB: '"제대로 하려면 다 꺼내서 다시 정리해야 해." 완전한 정리를 원합니다.',
        tension: '한 사람이 치워놓으면 다른 사람이 다시 정리하는 패턴이 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동하며 기분 전환, 다른 사람은 조용한 공간에서 비워내며 회복합니다.',
        personA: '"나가서 뭔가 하면 기분 풀려. 집에만 있으면 답답해." 활동 전환형입니다.',
        personB: '"조용한 데서 혼자 있어야 충전돼. 자극이 없어야 쉬어지는 느낌이야." 고요 회복형입니다.',
        tension: '쉬는 방식이 정반대라 "같이 있어도 따로 쉬는 느낌"이 들 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 즉각적인 표현, 다른 사람은 정제된 표현을 선호합니다.',
        personA: '"지금 보고 싶어. 바로 만나자." 즉각적이고 직접적인 표현형입니다.',
        personB: '"말보다 행동으로 보여주는 게 더 진심이야." 절제된 표현형입니다.',
        tip: '"왜 표현을 안 해?"보다 "이런 방식이 나한테 사랑이야"라고 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 즉각 해결, 다른 사람은 완전히 정리될 때까지 거리를 둡니다.',
        personA: '"지금 바로 해결하자. 이대로 두면 더 커져." 즉각 해결형입니다.',
        personB: '"지금은 말하기 싫어. 완전히 정리되면 얘기할게." 완전 정리 후 대화형입니다.',
        tip: '"언제쯤 얘기할 수 있어?"라고 시간을 정해두면 두 사람 모두 덜 불안합니다.',
      },
    },
    // ── pink + indigo 조합 ──
    'pink-indigo': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 감정적 소비, 다른 사람은 의미 있는 투자를 중심으로 소비합니다.',
        personA: '"이거 사면 기분이 좋아질 것 같아. 우리 같이 즐기자." 감정 회복형 소비입니다.',
        personB: '"이게 정말 필요한 건지, 오래 쓸 수 있는 건지 먼저 생각해봐." 의미·가치 중심 소비입니다.',
        tension: '"왜 이렇게 신중해?"와 "왜 이렇게 충동적이야?"가 반복됩니다. 소비 기준이 다릅니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 따뜻한 분위기를 원하고, 다른 사람은 조용하고 정돈된 공간을 원합니다.',
        personA: '"집이 따뜻하고 예쁘면 돼. 완벽하지 않아도 괜찮아." 분위기 중심입니다.',
        personB: '"물건이 제자리에 있어야 마음이 편해. 정돈된 공간이 필요해." 정돈·질서 중심입니다.',
        tension: '한 사람의 "대충 괜찮아"가 다른 사람에게는 "신경 안 쓰는 것"으로 읽힐 수 있습니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 함께 있어야 쉬어지고, 다른 사람은 혼자 있어야 충전됩니다.',
        personA: '"같이 있어줘. 네가 옆에 있어야 편해." 연결 회복형입니다.',
        personB: '"오늘은 혼자 좀 있고 싶어. 생각 정리할 시간이 필요해." 고독 충전형입니다.',
        tension: '"왜 혼자 있으려 해? 나 싫어?"와 "나 지금 충전 중이야"가 반복됩니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 말과 스킨십으로, 다른 사람은 깊은 대화와 신뢰로 사랑을 표현합니다.',
        personA: '"오늘 예뻐." "보고 싶었어." "안아줘." 말과 스킨십이 사랑의 언어입니다.',
        personB: '"네 얘기 다 들어줄게." "믿어." 깊은 신뢰와 진심 어린 대화가 사랑의 언어입니다.',
        tip: '"왜 표현을 안 해?"보다 "이런 게 나한테 사랑이야"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 즉각 감정을 표현하고, 다른 사람은 내면에서 천천히 정리합니다.',
        personA: '"지금 당장 얘기하자. 이 감정 그냥 넘기면 안 돼." 즉각 표현형입니다.',
        personB: '"조금만 시간 줘. 나 아직 정리가 안 됐어." 내면 정리 후 대화형입니다.',
        tip: '"언제 얘기할 수 있어?"라고 시간을 정하면 두 사람 모두 덜 불안합니다.',
      },
    },
    // ── indigo + yellow 조합 ──
    'indigo-yellow': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 의미 있는 소비, 다른 사람은 현실적인 안정 저축을 중심으로 합니다.',
        personA: '"이게 정말 가치 있는 건지가 중요해. 싸다고 사면 안 돼." 가치 중심 소비입니다.',
        personB: '"비상금이 있어야 마음이 편해. 미래 대비가 먼저야." 안정 저축형입니다.',
        tension: '두 사람 모두 즉흥 소비는 적지만, 소비 기준이 달라 "왜 이걸 샀어?"가 생깁니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 조용하고 정돈된 공간, 다른 사람은 기능적이고 효율적인 공간을 원합니다.',
        personA: '"물건이 너무 많으면 마음이 무거워. 필요한 것만 두자." 미니멀 정리형입니다.',
        personB: '"필요한 건 다 있어야 해. 버리면 나중에 필요할 때 없잖아." 실용 보관형입니다.',
        tension: '"왜 이걸 버려?"와 "왜 이걸 아직도 갖고 있어?"가 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 조용한 내면 정리, 다른 사람은 현실적인 활동으로 회복합니다.',
        personA: '"오늘은 혼자 조용히 있고 싶어. 책 읽거나 생각 정리할 시간이 필요해." 내면 회복형입니다.',
        personB: '"뭔가 하면서 기분 전환해야 해. 집에만 있으면 더 무거워져." 활동 전환형입니다.',
        tension: '쉬는 방식이 달라 "같이 있어도 따로 쉬는 느낌"이 생깁니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 깊은 대화와 신뢰, 다른 사람은 현실적인 챙김으로 사랑을 표현합니다.',
        personA: '"네 생각이 궁금해. 깊은 얘기 하고 싶어." 깊은 연결형입니다.',
        personB: '"밥 먹었어? 오늘 힘들었지?" 현실적인 챙김이 사랑의 언어입니다.',
        tip: '서로의 사랑 언어가 다릅니다. 상대방의 방식도 사랑임을 인정하는 것이 먼저입니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 내면에서 천천히 정리하고, 다른 사람은 현실적인 해결을 원합니다.',
        personA: '"나 아직 정리가 안 됐어. 조금만 기다려줘." 내면 정리 후 대화형입니다.',
        personB: '"언제까지 기다려야 해? 해결하고 넘어가야지." 현실 해결 우선형입니다.',
        tip: '"오늘 저녁에 얘기하자"처럼 시간을 정해두면 두 사람 모두 편합니다.',
      },
    },
    // ── white + blue 조합 ──
    'white-blue': {
      finance: {
        title: '재정 스타일 차이',
        description: '두 사람 모두 계획적이지만, 한 사람은 절제·비움, 다른 사람은 신뢰·안정 기반 소비를 합니다.',
        personA: '"꼭 필요한 것만 사자. 비워야 편해." 절제·정화형 소비입니다.',
        personB: '"믿을 수 있는 브랜드, 오래 쓸 수 있는 것에 투자하자." 신뢰 기반 소비입니다.',
        tension: '두 사람 모두 즉흥 소비는 적지만, 기준이 달라 "왜 이걸 샀어?"가 생깁니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '두 사람 모두 정돈을 중요하게 여기지만, 기준이 달라 갈등이 생깁니다.',
        personA: '"물건이 없어야 마음이 편해. 자꾸 비우자." 미니멀 정리형입니다.',
        personB: '"제자리에 있어야 해. 정해진 방식대로 정리해야 편해." 규칙 정리형입니다.',
        tension: '"왜 이걸 버려?"와 "왜 이렇게 쌓아둬?"가 반복됩니다. 정리 기준이 다릅니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '두 사람 모두 조용한 회복을 선호하지만, 한 사람은 혼자, 다른 사람은 루틴 안에서 쉽니다.',
        personA: '"아무것도 안 하고 조용히 있어야 충전돼." 고요 회복형입니다.',
        personB: '"정해진 루틴대로 하면 자연스럽게 회복돼." 루틴 회복형입니다.',
        tension: '두 사람 모두 조용히 쉬는 편이라, 감정 표현이 줄어들면 서로 멀어지는 느낌이 생깁니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '두 사람 모두 절제된 표현을 선호해, 서로 "표현이 부족하다"고 느낄 수 있습니다.',
        personA: '"말 안 해도 알잖아. 함께 있는 게 표현이야." 존재형 표현입니다.',
        personB: '"약속 지키고, 매일 연락하는 게 사랑이야." 신뢰·일관성형 표현입니다.',
        tip: '"오늘 고마웠어"라는 짧은 한 마디가 두 사람 사이를 따뜻하게 유지합니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '두 사람 모두 감정을 안으로 담아두는 편이라, 조용한 거리감이 쌓입니다.',
        personA: '"지금 말하기 싫어. 혼자 정리할게." 완전 정리 후 대화형입니다.',
        personB: '"감정적으로 말하면 해결이 안 돼. 진정되면 얘기하자." 논리 정리 후 대화형입니다.',
        tip: '두 사람 모두 먼저 말하기 어렵습니다. "나 아직 정리 중이야"라는 신호를 보내는 것만으로도 거리감이 줄어듭니다.',
      },
    },
  };

  // 3컬러 전체 조합 기반 세밀한 분기 (우선순위 높음)
  const FULL_LIFESTYLE_MAP: Partial<Record<string, LifestyleSections>> = {
    // ── red-white-blue + pink-indigo-yellow 조합 ──
    'red-white-blue|pink-indigo-yellow': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 빠른 결정과 절제 사이에서 균형을 잡고, 다른 사람은 감정적 안정과 현실 대비를 함께 원합니다.',
        personA: '"기회가 왔을 때 써야 해. 단, 낭비는 싫어." 추진력 있지만 기준이 있는 소비입니다.',
        personB: '"기분이 좋아지는 것도 중요하고, 미래 대비도 해야 해." 감정과 현실 사이에서 균형을 잡으려 합니다.',
        tension: '"왜 이렇게 소극적이야?"와 "왜 이렇게 충동적이야?"보다, "우리 기준을 같이 정하자"가 필요합니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 빠른 정리와 깔끔한 공간을 원하고, 다른 사람은 따뜻한 분위기와 현실적인 편안함을 원합니다.',
        personA: '"집이 정돈돼 있어야 마음이 편해. 제자리에 있어야 해." 정돈·기준 중심입니다.',
        personB: '"집이 따뜻하고 편안하면 돼. 완벽하지 않아도 괜찮아." 분위기·편안함 중심입니다.',
        tension: '"왜 이렇게 어질러?"와 "왜 이렇게 예민해?"가 반복되면 청소가 신뢰 문제로 번집니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동하거나 조용히 비워내며 회복하고, 다른 사람은 감정적 연결과 현실적인 안정이 함께 있어야 쉬어집니다.',
        personA: '"나가서 뭔가 하거나, 조용히 혼자 있어야 충전돼." 활동 또는 고요 회복형입니다.',
        personB: '"네가 옆에 있어줘야 쉬어지는 느낌이야. 그리고 내일 걱정도 없어야 해." 연결+안정 회복형입니다.',
        tension: '한 사람이 혼자 쉬고 싶을 때 다른 사람은 "왜 나를 피해?"라고 느낄 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 행동과 신뢰로, 다른 사람은 말과 따뜻한 연결로 사랑을 표현합니다.',
        personA: '"약속 지키고, 믿을 수 있게 행동하는 게 사랑이야." 신뢰·행동형입니다.',
        personB: '"오늘 예뻐. 보고 싶었어. 같이 있어줘." 말과 연결이 사랑의 언어입니다.',
        tip: '"왜 표현을 안 해?"보다 "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 정리하고 해결하려 하고, 다른 사람은 먼저 마음을 알아줬으면 합니다.',
        personA: '"지금 바로 정리하자. 이대로 두면 더 커져." 즉각 해결형입니다.',
        personB: '"먼저 내 마음을 알아줬으면 좋겠어. 그 다음에 얘기하자." 공감 먼저형입니다.',
        tip: '"많이 힘들었지"라는 한 마디가 해결보다 먼저 필요합니다.',
      },
    },
    // ── red-blue-black + pink-indigo-yellow 조합 ──
    'red-blue-black|pink-indigo-yellow': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 강한 추진력과 원칙 기반 소비, 다른 사람은 감정·현실 균형형 소비를 합니다.',
        personA: '"투자할 가치가 있으면 써야 해. 기준이 있어야 해." 원칙·추진형 소비입니다.',
        personB: '"기분도 좋아야 하고, 미래 대비도 해야 해." 감정과 현실 사이 균형형입니다.',
        tension: '소비 기준이 달라 "왜 이걸 샀어?"와 "왜 이렇게 딱딱해?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 강한 정돈 기준, 다른 사람은 따뜻하고 편안한 공간을 원합니다.',
        personA: '"집은 정돈돼 있어야 해. 이 정도는 기본이야." 강한 기준·질서형입니다.',
        personB: '"집이 따뜻하고 편안하면 돼. 완벽하지 않아도 괜찮아." 분위기·편안함 중심입니다.',
        tension: '"왜 이렇게 예민해?"와 "이건 기본 아니야?"가 반복되면 청소가 신뢰 문제로 번집니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 혼자 강하게 충전하고, 다른 사람은 연결과 안정이 함께 있어야 쉬어집니다.',
        personA: '"혼자 조용히 있거나, 뭔가 집중하면서 충전해." 독립 충전형입니다.',
        personB: '"네가 옆에 있어줘야 쉬어지는 느낌이야." 연결 회복형입니다.',
        tension: '한 사람이 혼자 충전할 때 다른 사람은 "나를 피하는 건가?"라고 느낄 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 강한 신뢰와 행동, 다른 사람은 따뜻한 말과 연결로 사랑을 표현합니다.',
        personA: '"약속 지키고, 믿을 수 있게 행동하는 게 사랑이야." 신뢰·행동형입니다.',
        personB: '"오늘 예뻐. 보고 싶었어. 같이 있어줘." 말과 연결이 사랑의 언어입니다.',
        tip: '"왜 말을 안 해?"보다 "이런 게 나한테 사랑이야"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 강하게 해결하려 하고, 다른 사람은 먼저 마음을 알아줬으면 합니다.',
        personA: '"지금 바로 정리하자. 이대로 두면 안 돼." 강한 즉각 해결형입니다.',
        personB: '"먼저 내 마음을 알아줬으면 좋겠어." 공감 먼저형입니다.',
        tip: '"많이 힘들었지"라는 한 마디가 해결보다 먼저 필요합니다.',
      },
    },
    // ── white-blue-black + red-yellow-purple 조합 ──
    'white-blue-black|red-yellow-purple': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 절제·신뢰·원칙 기반 소비, 다른 사람은 활력·경험·현재 중심 소비를 합니다.',
        personA: '"꼭 필요한 것만, 믿을 수 있는 것에만 써야 해." 절제·원칙형 소비입니다.',
        personB: '"지금 행복하고 경험하는 게 중요해. 돈은 쓰라고 있는 거야." 경험·현재형 소비입니다.',
        tension: '"왜 이렇게 충동적이야?"와 "왜 이렇게 소극적이야?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 정돈·원칙 중심, 다른 사람은 활기차고 자유로운 공간을 원합니다.',
        personA: '"제자리에 있어야 해. 정돈된 공간이 심리적 안정이야." 규칙·정돈형입니다.',
        personB: '"너무 딱딱하게 정리하면 숨막혀. 좀 자유롭게 살자." 자유·활기형입니다.',
        tension: '"왜 이렇게 어질러?"와 "왜 이렇게 딱딱해?"가 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 조용한 루틴 안에서, 다른 사람은 활동과 새로운 경험으로 회복합니다.',
        personA: '"조용히 집에서 쉬거나, 정해진 루틴대로 하면 충전돼." 루틴·고요 회복형입니다.',
        personB: '"어디 가서 뭔가 하면 기분 풀려. 집에만 있으면 답답해." 활동·경험 전환형입니다.',
        tension: '쉬는 방식이 정반대라 "같이 있어도 따로 쉬는 느낌"이 강합니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 절제된 신뢰, 다른 사람은 활발한 표현과 함께하는 시간으로 사랑을 표현합니다.',
        personA: '"약속 지키고, 믿을 수 있게 행동하는 게 사랑이야." 신뢰·행동형입니다.',
        personB: '"같이 뭔가 하고, 웃고, 표현하는 게 사랑이야." 활동·표현형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "왜 재미없어?"보다 "이런 게 나한테 사랑이야"라고 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 논리적으로 정리하려 하고, 다른 사람은 즉각적으로 감정을 표현합니다.',
        personA: '"감정적으로 말하면 해결이 안 돼. 진정하고 얘기하자." 논리 정리형입니다.',
        personB: '"지금 당장 얘기해야 해. 이 감정 그냥 넘기면 안 돼." 즉각 표현형입니다.',
        tip: '"지금 많이 화났구나"라는 공감 한 마디가 논리보다 먼저 필요합니다.',
      },
    },
    // ── purple-yellow-red + orange-white-yellow 3컬러 전체 조합 ──
    'purple-yellow-red|orange-white-yellow': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 의미와 깊이 있는 소비를 원하고, 다른 사람은 현재 경험과 활력 중심의 소비를 선호합니다.',
        personA: '"이게 정말 가치 있는 건지 먼저 생각해봐야 해." 의미·깊이 중심 소비입니다. 충동 소비보다 신중한 결정을 선호하며, 한 번 결정하면 오래 씁니다.',
        personB: '"지금 이 순간이 중요해. 경험에 쓰는 건 아깝지 않아." 현재 경험 중심 소비입니다. 맛있는 것, 재미있는 것, 함께하는 것에 기꺼이 씁니다.',
        tension: '"왜 이렇게 즉흥적이야?"와 "왜 이렇게 따져?"가 반복될 수 있습니다. 소비 전 간단한 기준 합의가 마찰을 줄입니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 공간의 의미와 분위기를 중시하고, 다른 사람은 활동 중심이라 정리보다 생활이 우선입니다.',
        personA: '"공간이 어수선하면 마음도 어수선해." 분위기·의미 중심 정리형입니다. 물건 하나하나에 의미를 두고, 공간이 감성적으로 정돈되어야 편안합니다.',
        personB: '"치우는 것보다 지금 하고 싶은 게 더 중요해." 활동 우선형입니다. 정리보다 현재 활동에 에너지를 씁니다.',
        tension: '"내 공간은 내가 정리할게, 공용 공간만 같이 기준 정하자"는 합의가 효과적입니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 조용한 내면 충전을 원하고, 다른 사람은 활동과 연결로 에너지를 회복합니다.',
        personA: '"혼자 조용히 있어야 진짜 충전이 돼." 내면 고독 충전형입니다. 깊은 생각, 음악, 독서처럼 내면을 채우는 시간이 필요합니다.',
        personB: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다. 가만히 있으면 오히려 더 지칩니다.',
        tension: '쉬는 방식이 달라 "같이 있어도 따로 쉬는 느낌"이 생길 수 있습니다. "나 지금 충전 중이야"라는 신호가 오해를 줄입니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 깊은 감정 연결로, 다른 사람은 활발한 표현과 함께하는 시간으로 사랑을 표현합니다.',
        personA: '"네가 나를 진짜 이해해줬으면 해." 깊은 연결·공감 중심입니다. 표면적인 표현보다 진심이 느껴지는 연결을 원합니다.',
        personB: '"같이 웃고, 같이 뭔가 하는 게 사랑이야." 활동·표현 중심입니다. 함께 경험하고 즐기는 시간이 애정의 언어입니다.',
        tip: '"오늘 뭐 하고 싶어?"라는 질문 하나가 두 사람을 연결합니다. 깊이와 활력이 만나면 이 관계는 풍성해집니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 내면에서 먼저 정리하고, 다른 사람은 즉각 표현하며 해결하려 합니다.',
        personA: '"조금만 시간 줘. 나 아직 정리가 안 됐어." 내면 정리 후 대화형입니다. 감정이 정리되지 않으면 말이 나오지 않습니다.',
        personB: '"지금 바로 얘기하자. 이 감정 그냥 두면 더 커져." 즉각 해결형입니다. 감정을 바로 표현해야 풀립니다.',
        tip: '"나 지금 정리 중이야, 30분 후에 얘기하자"는 신호가 두 사람 모두에게 필요합니다.',
      },
    },
    // ── orange-white-yellow + purple-yellow-red 역방향 (동일 데이터) ──
    'orange-white-yellow|purple-yellow-red': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 현재 경험 중심 소비, 다른 사람은 의미와 깊이 있는 소비를 선호합니다.',
        personA: '"지금 이 순간이 중요해. 경험에 쓰는 건 아깝지 않아." 현재 경험 중심 소비입니다.',
        personB: '"이게 정말 가치 있는 건지 먼저 생각해봐야 해." 의미·깊이 중심 소비입니다.',
        tension: '소비 기준이 달라 마찰이 생길 수 있습니다. 함께 기준을 정하는 것이 도움이 됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 활동 우선형, 다른 사람은 공간 분위기를 중시합니다.',
        personA: '"치우는 것보다 지금 하고 싶은 게 더 중요해." 활동 우선형입니다.',
        personB: '"공간이 어수선하면 마음도 어수선해." 분위기·의미 중심 정리형입니다.',
        tension: '공용 공간 기준만 함께 정하면 충돌이 줄어듭니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동·연결 회복형, 다른 사람은 내면 고독 충전형입니다.',
        personA: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다.',
        personB: '"혼자 조용히 있어야 진짜 충전이 돼." 내면 고독 충전형입니다.',
        tension: '쉬는 방식이 달라 오해가 생길 수 있습니다. 서로의 충전 방식을 인정하는 것이 중요합니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 활발한 표현과 함께하는 시간으로, 다른 사람은 깊은 감정 연결로 사랑을 표현합니다.',
        personA: '"같이 웃고, 같이 뭔가 하는 게 사랑이야." 활동·표현 중심입니다.',
        personB: '"네가 나를 진짜 이해해줬으면 해." 깊은 연결·공감 중심입니다.',
        tip: '함께하는 시간과 깊은 대화가 균형을 이룰 때 이 관계가 풍성해집니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 즉각 표현, 다른 사람은 내면 정리 후 대화형입니다.',
        personA: '"지금 바로 얘기하자. 이 감정 그냥 두면 더 커져." 즉각 해결형입니다.',
        personB: '"조금만 시간 줘. 나 아직 정리가 안 됐어." 내면 정리 후 대화형입니다.',
        tip: '"나 지금 정리 중이야, 잠깐 기다려줘"라는 신호가 두 사람 모두에게 필요합니다.',
      },
    },
    // ── magenta-cream-lavender + magenta-cream-lavender (같은 계열 조합) ──
    'magenta-cream-lavender|magenta-cream-lavender': {
      finance: {
        title: '재정 스타일 차이',
        description: '두 사람 모두 감정과 관계 중심의 소비 성향이 있습니다.',
        personA: '"기분이 좋아지는 것, 관계를 위한 것에 쓰는 건 아깝지 않아." 감정·관계 중심 소비입니다.',
        personB: '"예쁜 것, 분위기 있는 것에 쓰면 마음이 채워져." 감성·분위기 중심 소비입니다.',
        tension: '두 사람 모두 감정 소비 성향이 강해 현실 재정 관리가 소홀해질 수 있습니다. 함께 저축 목표를 정하는 것이 도움이 됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '두 사람 모두 분위기와 감성을 중시하는 공간 관리 성향입니다.',
        personA: '"공간이 감성적이어야 마음이 편해." 감성 공간 중심형입니다. 물건보다 분위기가 중요합니다.',
        personB: '"예쁘고 아늑한 공간이 있어야 쉴 수 있어." 아늑함 중심형입니다. 정돈보다 분위기를 먼저 만들려 합니다.',
        tension: '두 사람 모두 분위기를 중시하므로 공간 취향이 잘 맞을 수 있습니다. 다만 실용적인 정리 기준도 함께 정하면 좋습니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '두 사람 모두 감정 연결과 아늑한 공간에서 회복하는 성향입니다.',
        personA: '"같이 있어줘. 네가 옆에 있어야 편해." 연결 회복형입니다.',
        personB: '"분위기 좋은 곳에서 조용히 쉬어야 충전돼." 감성 공간 회복형입니다.',
        tension: '두 사람 모두 연결을 원하지만 회복 방식이 미묘하게 다를 수 있습니다. 함께 있되 각자의 공간을 인정하는 균형이 필요합니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '두 사람 모두 감정 깊이와 따뜻한 연결을 중시합니다.',
        personA: '"네가 내 마음을 알아줬으면 해." 감정 공감 중심입니다. 표현보다 이해받는 것이 더 중요합니다.',
        personB: '"같이 있는 시간, 따뜻한 분위기가 사랑이야." 감성 연결 중심입니다.',
        tip: '두 사람 모두 감정 깊이를 원하므로 서로의 마음을 먼저 확인하는 대화가 이 관계의 핵심입니다.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '두 사람 모두 감정이 먼저이고, 상처에 민감한 패턴이 있습니다.',
        personA: '"내 마음을 먼저 알아줬으면 해." 공감 먼저형입니다. 해결보다 이해가 먼저입니다.',
        personB: '"상처받았어. 잠깐 혼자 있고 싶어." 감정 회복 후 대화형입니다.',
        tip: '두 사람 모두 상처에 민감하므로 "지금 많이 힘들었구나"라는 공감 한 마디가 가장 중요합니다.',
      },
    },
    // ── red-orange-coral + pink-beige-cream 조합 (따뜻한 활력 vs 부드러운 배려) ──
    'red-orange-coral|pink-beige-cream': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 즉흥적이고 활발한 소비 성향, 다른 사람은 감정적 안정과 부드러운 현실 균형을 원합니다.',
        personA: '"지금 좋으면 써. 나중에 또 벌면 되지." 즉흥·활력형 소비입니다. 경험과 즐거움에 기꺼이 씁니다.',
        personB: '"기분 좋은 것도 중요하지만, 너무 무리하지 않았으면 해." 감정·균형형 소비입니다.',
        tension: '"왜 이렇게 충동적이야?"와 "왜 이렇게 소극적이야?"가 반복됩니다. 소비 전 간단한 기준 합의가 마찰을 줄입니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 활동 중심이라 정리보다 생활이 우선, 다른 사람은 따뜻하고 부드러운 공간을 원합니다.',
        personA: '"치우는 것보다 지금 하고 싶은 게 더 중요해." 활동 우선형입니다.',
        personB: '"집이 따뜻하고 편안하면 돼. 완벽하지 않아도 괜찮아." 분위기·편안함 중심입니다.',
        tension: '공용 공간 기준만 함께 정하면 충돌이 줄어듭니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동과 에너지 발산으로, 다른 사람은 따뜻한 연결과 편안한 공간에서 회복합니다.',
        personA: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다.',
        personB: '"집에서 따뜻하게 쉬거나, 네가 옆에 있어줘야 충전돼." 온기·연결 회복형입니다.',
        tension: '쉬는 방식이 달라 "같이 있어도 따로 쉬는 느낌"이 생길 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 활발하고 즉각적인 표현, 다른 사람은 따뜻하고 부드러운 연결로 사랑을 표현합니다.',
        personA: '"같이 뭔가 하자. 지금 바로 가자." 즉각·활동형 애정 표현입니다.',
        personB: '"오늘 예뻐. 보고 싶었어. 그냥 옆에 있어줘." 따뜻한 말과 연결이 사랑의 언어입니다.',
        tip: '"왜 표현을 안 해?"보다 "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 빠르게 해결하려 하고, 다른 사람은 먼저 마음을 알아줬으면 합니다.',
        personA: '"지금 바로 정리하자. 이대로 두면 더 커져." 즉각 해결형입니다.',
        personB: '"먼저 내 마음을 알아줬으면 해." 공감 먼저형입니다.',
        tip: '"많이 힘들었지"라는 한 마디가 해결보다 먼저 필요합니다.',
      },
    },
    // ── orange-white-yellow + blue-indigo-violet 조합 (활력·정화 vs 신뢰·깊이) ──
    'orange-white-yellow|blue-indigo-violet': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 경험 중심의 즉흥 소비, 다른 사람은 신중하고 원칙 기반의 소비를 합니다.',
        personA: '"경험에 쓰는 건 아깝지 않아. 지금 좋으면 돼." 경험·즉흥형 소비입니다.',
        personB: '"쓰기 전에 한 번 더 생각해야 해. 기준이 있어야 해." 신중·원칙형 소비입니다.',
        tension: '"왜 이렇게 즉흥적이야?"와 "왜 이렇게 따져?"가 반복됩니다. 소비 전 간단한 기준 합의가 마찰을 줄입니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 활동 우선형, 다른 사람은 정돈과 질서를 중시합니다.',
        personA: '"치우는 것보다 지금 하고 싶은 게 더 중요해." 활동 우선형입니다.',
        personB: '"집은 정돈돼 있어야 마음이 편해. 제자리에 있어야 해." 정돈·질서형입니다.',
        tension: '"왜 이렇게 어질러?"와 "왜 이렇게 예민해?"가 반복되면 청소가 신뢰 문제로 번집니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동과 연결로 에너지를 회복하고, 다른 사람은 혼자 조용히 내면을 충전합니다.',
        personA: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다.',
        personB: '"혼자 조용히 있어야 진짜 충전이 돼." 내면 고독 충전형입니다.',
        tension: '한 사람이 나가고 싶을 때 다른 사람은 혼자 있고 싶어 방향이 엇갈립니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 활발하고 즉각적인 표현, 다른 사람은 신뢰와 깊이 있는 연결로 사랑을 표현합니다.',
        personA: '"같이 뭔가 하자. 지금 바로 가자." 즉각·활동형 애정 표현입니다.',
        personB: '"믿을 수 있어야 해. 깊이 연결되는 게 사랑이야." 신뢰·깊이형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 빠르게 털고 넘어가려 하고, 다른 사람은 충분히 정리한 후 대화하려 합니다.',
        personA: '"빨리 털어버리고 다시 좋아지자." 빠른 전환형입니다.',
        personB: '"충분히 정리되면 얘기하자. 지금은 좀 있어줘." 내면 정리 후 대화형입니다.',
        tip: '"언제쯤 얘기할 수 있어?"라고 시간을 정해두면 두 사람 모두 덜 불안합니다.',
      },
    },
    // ── coral-pink-beige + indigo-violet-black 조합 (따뜻한 표현 vs 깊은 내면) ──
    'coral-pink-beige|indigo-violet-black': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 감정과 관계 중심의 소비, 다른 사람은 의미와 가치 기반의 신중한 소비를 합니다.',
        personA: '"기분 좋아지는 것, 관계에 쓰는 건 아깝지 않아." 감정·관계형 소비입니다.',
        personB: '"의미 있는 것에만 써야 해. 가치가 있어야 해." 의미·가치형 소비입니다.',
        tension: '"왜 이렇게 감정적으로 써?"와 "왜 이렇게 인색해?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 따뜻하고 편안한 공간, 다른 사람은 의미 있는 물건과 정돈된 내면 공간을 원합니다.',
        personA: '"집이 따뜻하고 편안하면 돼." 온기·편안함 중심입니다.',
        personB: '"공간이 어수선하면 마음도 어수선해. 의미 있는 것만 남겨야 해." 의미·정돈형입니다.',
        tension: '공간 기준이 달라 "왜 이걸 버려?"와 "왜 이걸 아직도 갖고 있어?"가 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 따뜻한 연결과 대화로, 다른 사람은 혼자 깊이 있는 시간으로 회복합니다.',
        personA: '"네가 옆에 있어줘야 쉬어지는 느낌이야." 연결 회복형입니다.',
        personB: '"혼자 조용히 생각하거나, 의미 있는 것에 집중해야 충전돼." 내면 충전형입니다.',
        tension: '한 사람이 연결을 원할 때 다른 사람은 혼자 있고 싶어 방향이 엇갈립니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 따뜻한 말과 스킨십, 다른 사람은 깊이 있는 연결과 진심으로 사랑을 표현합니다.',
        personA: '"오늘 예뻐. 보고 싶었어. 안아줘." 따뜻한 표현·스킨십형입니다.',
        personB: '"진심이 느껴져야 해. 깊이 연결되는 게 사랑이야." 깊이·진심형입니다.',
        tip: '"왜 표현을 안 해?"보다 "이런 방식이 나한테 사랑이야"라고 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 빠른 화해와 연결을 원하고, 다른 사람은 충분히 정리한 후 깊이 대화하려 합니다.',
        personA: '"빨리 화해하고 싶어. 안아줘." 빠른 연결형입니다.',
        personB: '"충분히 정리되면 얘기하자. 지금은 혼자 있어야 해." 내면 정리 후 대화형입니다.',
        tip: '"나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      },
    },
    // ── magenta-pink-coral + white-beige-cream 조합 (강한 감정 vs 부드러운 정화) ──
    'magenta-pink-coral|white-beige-cream': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 감정 몰입형 소비, 다른 사람은 정화·절제 중심의 소비를 합니다.',
        personA: '"감동받으면 써야 해. 관계에 쓰는 건 아깝지 않아." 감정 몰입형 소비입니다.',
        personB: '"필요한 것만 써야 해. 단순하게 유지하고 싶어." 정화·절제형 소비입니다.',
        tension: '"왜 이렇게 감정적으로 써?"와 "왜 이렇게 인색해?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 감성적이고 따뜻한 공간, 다른 사람은 단순하고 정화된 공간을 원합니다.',
        personA: '"공간이 감성적이고 따뜻해야 마음이 편해." 감성 공간형입니다.',
        personB: '"비울수록 마음이 편해. 단순하게 유지하고 싶어." 정화·미니멀형입니다.',
        tension: '공간 취향이 달라 "왜 이렇게 복잡해?"와 "왜 이렇게 썰렁해?"가 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 감정 연결과 깊은 대화로, 다른 사람은 조용히 비우고 정화하는 방식으로 회복합니다.',
        personA: '"네가 옆에 있어줘야 해. 깊이 연결되는 시간이 필요해." 연결·깊이 회복형입니다.',
        personB: '"혼자 조용히 비우는 시간이 필요해. 단순하게 쉬어야 충전돼." 정화·고요 회복형입니다.',
        tension: '한 사람이 연결을 원할 때 다른 사람은 혼자 있고 싶어 방향이 엇갈립니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 강렬하고 감정적인 표현, 다른 사람은 조용하고 진심 어린 표현으로 사랑을 표현합니다.',
        personA: '"사랑해. 보고 싶어. 지금 안아줘." 강렬·즉각형 애정 표현입니다.',
        personB: '"말 없이도 알아줬으면 해. 조용히 옆에 있어줘." 조용한 진심형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 감정을 바로 표현하고 연결하려 하고, 다른 사람은 조용히 정리한 후 대화하려 합니다.',
        personA: '"지금 바로 얘기하자. 이대로 두면 더 힘들어." 즉각 표현형입니다.',
        personB: '"조용히 정리되면 얘기하자. 지금은 혼자 있어야 해." 정화 후 대화형입니다.',
        tip: '"나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      },
    },
    // ── red-orange-yellow + green-sage-mint 조합 (활력·추진 vs 회복·균형) ──
    'red-orange-yellow|green-sage-mint': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 즉흥적이고 활발한 소비, 다른 사람은 균형과 안정을 중시하는 소비를 합니다.',
        personA: '"지금 좋으면 써. 경험이 중요해." 즉흥·활력형 소비입니다.',
        personB: '"균형이 중요해. 너무 무리하지 않았으면 해." 균형·안정형 소비입니다.',
        tension: '"왜 이렇게 충동적이야?"와 "왜 이렇게 소극적이야?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 활동 우선형, 다른 사람은 자연스럽고 균형 잡힌 공간을 원합니다.',
        personA: '"치우는 것보다 지금 하고 싶은 게 더 중요해." 활동 우선형입니다.',
        personB: '"공간이 자연스럽고 균형 잡혀야 마음이 편해." 자연·균형형입니다.',
        tension: '공용 공간 기준만 함께 정하면 충돌이 줄어듭니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 활동과 에너지 발산으로, 다른 사람은 자연 속 산책이나 조용한 회복으로 에너지를 충전합니다.',
        personA: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다.',
        personB: '"자연 속에서 걷거나, 조용히 쉬어야 충전돼." 자연·회복형입니다.',
        tension: '쉬는 방식이 달라 "같이 있어도 따로 쉬는 느낌"이 생길 수 있습니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 활발하고 즉각적인 표현, 다른 사람은 자연스럽고 균형 잡힌 연결로 사랑을 표현합니다.',
        personA: '"같이 뭔가 하자. 지금 바로 가자." 즉각·활동형 애정 표현입니다.',
        personB: '"자연스럽게 함께 있는 시간이 좋아." 자연스러운 연결형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 빠르게 해결하려 하고, 다른 사람은 균형을 회복한 후 대화하려 합니다.',
        personA: '"지금 바로 정리하자." 즉각 해결형입니다.',
        personB: '"잠깐 숨 고르고 나서 얘기하자." 균형 회복 후 대화형입니다.',
        tip: '"잠깐 산책하고 와서 얘기하자"는 제안이 이 관계에서 효과적입니다.',
      },
    },
    // ── blue-indigo-black + white-beige-cream 조합 (신뢰·깊이 vs 정화·안정) ──
    'blue-indigo-black|white-beige-cream': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 원칙과 신뢰 기반의 소비, 다른 사람은 절제와 정화 중심의 소비를 합니다.',
        personA: '"쓰기 전에 한 번 더 생각해야 해. 신뢰할 수 있는 것에 써야 해." 원칙·신뢰형 소비입니다.',
        personB: '"필요한 것만 써야 해. 단순하게 유지하고 싶어." 절제·정화형 소비입니다.',
        tension: '두 사람 모두 신중한 편이라 소비 자체보다 우선순위 차이가 마찰을 만듭니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 질서와 시스템 중심, 다른 사람은 비우고 단순하게 유지하는 공간을 원합니다.',
        personA: '"집은 질서가 있어야 해. 시스템이 있어야 마음이 편해." 질서·시스템형입니다.',
        personB: '"비울수록 마음이 편해. 단순하게 유지하고 싶어." 정화·미니멀형입니다.',
        tension: '질서 방식이 달라 "왜 이렇게 어질러?"와 "왜 이렇게 새 것을 자꼬 사?"가 반복될 수 있습니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 혼자 깊이 있는 시간으로, 다른 사람은 조용히 비우고 정화하는 방식으로 회복합니다.',
        personA: '"혼자 조용히 생각하거나, 의미 있는 것에 집중해야 충전돼." 내면 충전형입니다.',
        personB: '"조용히 비우고 단순하게 쉬어야 충전돼." 정화·고요 회복형입니다.',
        tension: '두 사람 모두 혼자 있고 싶어 서로에게 소외감을 줄 수 있습니다. 주기적으로 연결 시간을 의식적으로 만드는 것이 중요합니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 신뢰와 깊이 있는 연결, 다른 사람은 조용하고 진심 어린 표현으로 사랑을 표현합니다.',
        personA: '"만을 수 있어야 해. 깊이 연결되는 게 사랑이야." 신뢰·깊이형입니다.',
        personB: '"말 없이도 알아줬으면 해. 조용히 옆에 있어줘." 조용한 진심형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '두 사람 모두 혼자 정리하는 시간이 필요하고, 충분히 정리된 후 대화하려 합니다.',
        personA: '"충분히 정리되면 얘기하자. 지금은 혼자 있어야 해." 내면 정리 후 대화형입니다.',
        personB: '"조용히 정리되면 얘기하자." 정화 후 대화형입니다.',
        tip: '"언제쯤 얘기할 수 있어?"라고 시간을 정해두면 두 사람 모두 덜 불안합니다.',
      },
    },
    // ── indigo-violet-purple + pink-lavender-cream 조합 (내면 탐색 vs 감성 회복) ──
    'indigo-violet-purple|pink-lavender-cream': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 의미와 성찰 중심의 소비, 다른 사람은 감정적 안정과 관계 중심의 소비를 합니다.',
        personA: '"의미 있는 것에만 써야 해. 성찰에 투자하는 건 아깝지 않아." 의미·성찰형 소비입니다.',
        personB: '"기분 좋아지는 것, 관계에 쓰는 건 아깝지 않아." 감정·관계형 소비입니다.',
        tension: '"왜 이렇게 실용적으로 써?"와 "왜 이렇게 감정적으로 써?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 의미 있는 물건과 정돈된 내면 공간, 다른 사람은 따뜻하고 감성적인 공간을 원합니다.',
        personA: '"의미 있는 것만 남겨야 해. 공간이 정돈돼 있어야 생각이 정리돼." 의미·정돈형입니다.',
        personB: '"공간이 따뜻하고 감성적이어야 마음이 편해." 감성 공간형입니다.',
        tension: '공간 취향이 달라 "왜 이렇게 새로운 것을 자꼬 사?"와 "왜 이렇게 썰렁해?"가 반복됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 혼자 깊이 생각하고 성찰하는 시간으로, 다른 사람은 따뜻한 연결과 감성적 회복로 충전합니다.',
        personA: '"혼자 조용히 생각하거나, 의미 있는 것에 집중해야 충전돼." 내면 성찰형입니다.',
        personB: '"네가 옆에 있어줘야 해. 따뜻한 연결이 있어야 충전돼." 연결·감성 회복형입니다.',
        tension: '한 사람이 혼자 있고 싶을 때 다른 사람은 연결을 원해 방향이 엇갈립니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 깊이 있는 연결과 진심, 다른 사람은 따뜻한 말과 감성적 표현으로 사랑을 표현합니다.',
        personA: '"진심이 느껴져야 해. 깊이 연결되는 게 사랑이야." 깊이·진심형입니다.',
        personB: '"오늘 예뻐. 보고 싶었어. 안아줘." 따뜻한 표현·감성형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 혼자 정리한 후 깊이 대화하려 하고, 다른 사람은 빨리 화해하고 감정적으로 연결하려 합니다.',
        personA: '"충분히 정리되면 얘기하자. 지금은 혼자 있어야 해." 내면 정리 후 대화형입니다.',
        personB: '"빨리 화해하고 싶어. 안아줘." 빨른 연결형입니다.',
        tip: '"나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      },
    },
    // ── green-sage-teal + white-beige-cream 조합 (자연·균형 vs 정화·안정) ──
    'green-sage-teal|white-beige-cream': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 자연스러운 균형과 지속가능성 중심의 소비, 다른 사람은 절제와 단순함 중심의 소비를 합니다.',
        personA: '"지속가능하고 의미 있는 것에 써야 해." 자연·균형형 소비입니다.',
        personB: '"필요한 것만 써야 해. 단순하게 유지하고 싶어." 절제·단순형 소비입니다.',
        tension: '두 사람 모두 신중한 편이라 소비 자체보다 우선순위 차이가 마찰을 만듭니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 자연스러운 공간, 다른 사람은 비우고 단순하게 유지하는 공간을 원합니다.',
        personA: '"공간이 자연스럽고 균형 잡혀야 마음이 편해." 자연·균형형입니다.',
        personB: '"비울수록 마음이 편해. 단순하게 유지하고 싶어." 정화·미니멀형입니다.',
        tension: '정리 기준이 다를 수 있지만 두 사람 모두 조용한 편이라 큰 충돌없이 대화로 해결됩니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 자연 속 산책이나 조용한 활동으로, 다른 사람은 조용히 비우고 정화하는 방식으로 회복합니다.',
        personA: '"자연 속에서 걷거나, 조용히 쉬어야 충전돼." 자연·회복형입니다.',
        personB: '"조용히 비우고 단순하게 쉬어야 충전돼." 정화·고요 회복형입니다.',
        tension: '두 사람 모두 조용한 편이라 서로에게 소외감을 줄 수 있습니다. 주기적으로 연결 시간을 의식적으로 만드는 것이 중요합니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 자연스러운 연결과 조용한 존재감, 다른 사람은 조용하고 진심 어린 표현으로 사랑을 표현합니다.',
        personA: '"자연스럽게 함께 있는 시간이 좋아." 자연스러운 연결형입니다.',
        personB: '"말 없이도 알아줬으면 해. 조용히 옆에 있어줘." 조용한 진심형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '두 사람 모두 조용히 정리하는 시간이 필요하고, 충분히 정리된 후 대화하려 합니다.',
        personA: '"잠깐 산책하고 와서 얘기하자." 자연 회복 후 대화형입니다.',
        personB: '"조용히 정리되면 얘기하자." 정화 후 대화형입니다.',
        tip: '두 사람 모두 조용한 편이라 시간을 주면 자연스럽게 해결됩니다.',
      },
    },
    // ── yellow-gold-beige + blue-sky-white 조합 (밝음·자신감 vs 신뢰·표현) ──
    'yellow-gold-beige|blue-sky-white': {
      finance: {
        title: '재정 스타일 차이',
        description: '한 사람은 자신감과 표현 중심의 소비, 다른 사람은 신뢰와 진심 중심의 소비를 합니다.',
        personA: '"좋은 것에 투자하는 건 아깝지 않아. 자신감이 생기는 것에 써." 표현·자신감형 소비입니다.',
        personB: '"신뢰할 수 있는 것에 써야 해. 진심이 느껴져야 해." 신뢰·진심형 소비입니다.',
        tension: '"왜 이렇게 화려하게 써?"와 "왜 이렇게 따져?"가 반복됩니다.',
      },
      cleaning: {
        title: '청소·정리 스타일',
        description: '한 사람은 밝고 활동적인 공간, 다른 사람은 정돈되고 신뢰할 수 있는 공간을 원합니다.',
        personA: '"공간이 밝고 활기차야 마음이 편해." 밝음·활동형입니다.',
        personB: '"집은 정돈돼 있어야 마음이 편해. 신뢰할 수 있는 공간이어야 해." 정돈·신뢰형입니다.',
        tension: '공간 취향이 달라 "왜 이렇게 단순해?"와 "왜 이렇게 화려해?"가 반복될 수 있습니다.',
      },
      rest: {
        title: '휴식·회복 방식',
        description: '한 사람은 밝고 활동적인 방식으로, 다른 사람은 조용히 신뢰할 수 있는 공간에서 회복합니다.',
        personA: '"나가서 뭔가 하거나, 사람 만나면 기분 풀려." 활동·연결 회복형입니다.',
        personB: '"혼자 조용히 있어야 진짜 충전이 돼." 내면 고독 충전형입니다.',
        tension: '한 사람이 나가고 싶을 때 다른 사람은 혼자 있고 싶어 방향이 엇갈립니다.',
      },
      affection: {
        title: '애정 표현 방식',
        description: '한 사람은 밝고 표현적인 애정, 다른 사람은 신뢰와 진심 어린 연결로 사랑을 표현합니다.',
        personA: '"같이 뭔가 하자. 지금 바로 가자." 밝고 표현적인 애정입니다.',
        personB: '"만을 수 있어야 해. 진심이 느껴져야 해." 신뢰·진심형입니다.',
        tip: '서로의 사랑 언어가 다릅니다. "나는 이렇게 표현해"라고 먼저 알려주세요.',
      },
      conflict: {
        title: '갈등 직후 반응',
        description: '한 사람은 빠르게 털고 넘어가려 하고, 다른 사람은 충분히 정리한 후 대화하려 합니다.',
        personA: '"빨리 털어버리고 다시 좋아지자." 빨른 전환형입니다.',
        personB: '"충분히 정리되면 얘기하자. 지금은 좀 있어줘." 내면 정리 후 대화형입니다.',
        tip: '"언제쯤 얘기할 수 있어?"라고 시간을 정해두면 두 사람 모두 덜 불안합니다.',
      },
    },
  };

  // 전체 조합 키 매칭 (양방향)
  const fullComboKey1 = `${fullKeyA}|${fullKeyB}`;
  const fullComboKey2 = `${fullKeyB}|${fullKeyA}`;
  let lifestyleSections: LifestyleSections | undefined =
    FULL_LIFESTYLE_MAP[fullComboKey1] ??
    FULL_LIFESTYLE_MAP[fullComboKey2] ??
    LIFESTYLE_MAP[lifestyleKey] ??
    LIFESTYLE_MAP[lifestyleKeyRev];

  // 생활 섹션이 없으면 에너지 계열 기반 기본 생성
  if (!lifestyleSections) {
    const fA0 = familiesA[0] ?? 'neutral';
    const fB0 = familiesB[0] ?? 'neutral';
    lifestyleSections = buildDefaultLifestyleSections(fA0, fB0, shapeA, shapeB, finalArchetype);
  }

  // ── 컬러 조합 기반 profileContrastOverride 동적 교체 ──
  // archetype 공통 문장 반복를 방지하기 위해 컬러 조합별로 분기
  type ProfileContrastOverride = NonNullable<ArchetypeResult['profileContrastOverride']>;
  const PROFILE_CONTRAST_OVERRIDE_MAP: Partial<Record<string, ProfileContrastOverride>> = {
    // ── red-white-blue + pink-indigo-yellow 3컬러 전체 조합 ──
    'red-white-blue|pink-indigo-yellow': {
      attractionContrast: '첫 번째 사람은 빠른 실행력과 명확한 정리 욕구가 강합니다. 사랑도 행동으로 보여주고 싶고, 관계 안에서도 신뢰·약속·정돈된 흐름을 중요하게 여깁니다. 두 번째 사람은 따뜻한 연결과 인정, 감정적 공감, 현실적인 안정감을 함께 원합니다. 그래서 한 사람은 "정리하고 해결하자"고 느끼고, 다른 사람은 "먼저 내 마음을 알아줬으면 좋겠다"고 느낄 수 있습니다. 이 관계의 끌림은 따뜻함과 추진력이 만나는 데 있고, 힘든 지점은 표현 속도와 안정 욕구의 차이에서 생깁니다.',
      relationFlow: '한 사람이 먼저 결정하고 실행하면, 다른 사람은 "왜 나한테 먼저 물어보지 않았어?"라고 느끼는 흐름이 반복됩니다. 결정 속도의 차이가 관계 패턴이 됩니다. 빠른 사람이 기다려주고, 신중한 사람이 의견을 먼저 내는 연습이 이 관계의 균형을 만듭니다.',
      expressionDifference: '한 사람은 "지금 바로 말하고 해결하자"는 즉각 표현형입니다. 다른 사람은 "감정이 정리되면 천천히 얘기하고 싶어"라는 내면 정리형입니다. "왜 말을 안 해?"보다 "언제쯤 얘기할 수 있어?"라고 물어보는 것이 이 관계에서 더 효과적입니다.',
      conflictPattern: '한 사람은 "이미 해결했잖아"라고 느끼고, 다른 사람은 "아직 마음이 안 풀렸어"라고 느끼는 순간이 반복됩니다. 해결 속도와 감정 회복 속도가 다릅니다. "다 끝났지?"보다 "아직 마음에 남은 게 있어?"라고 먼저 물어봐 주세요.',
      connectionStyle: '함께 뭔가를 만들거나 계획할 때 두 사람이 가장 잘 연결됩니다. 한 사람의 추진력과 다른 사람의 따뜻한 감각이 합쳐지면 생각보다 좋은 결과가 나옵니다. 같이 요리하거나, 여행 계획을 함께 짜거나, 집 정리를 같이 하는 시간이 이 관계의 연결 방식입니다.',
    },
    // ── red-blue-black + pink-indigo-yellow 3컬러 전체 조합 ──
    'red-blue-black|pink-indigo-yellow': {
      attractionContrast: '첫 번째 사람은 빠른 실행력과 신뢰·기준·질서를 동시에 원합니다. 감정보다 논리가 먼저이고, 약속과 원칙이 흔들리면 관계에 대한 신뢰가 흔들립니다. 두 번째 사람은 따뜻한 인정과 감정적 공감, 현실 안정감을 원합니다. 그래서 한 사람은 "왜 감정적으로 반응해?"라고 느끼고, 다른 사람은 "왜 이렇게 차갑게 말해?"라고 느낄 수 있습니다.',
      relationFlow: '한 사람이 논리적으로 정리하려 하면, 다른 사람은 "내 감정은 어디 갔어?"라고 느끼는 패턴이 반복됩니다. 논리와 감정이 번갈아 충돌합니다. "맞고 틀리고"보다 "네 마음이 어둠어?"가 먼저 필요한 관계입니다.',
      expressionDifference: '한 사람은 "사실 관계를 먼저 정리하자"는 논리 우선형입니다. 다른 사람은 "내 마음을 먼저 알아줬으면 해"라는 감정 우선형입니다. 같은 상황을 완전히 다른 방식으로 경험합니다.',
      conflictPattern: '"왜 감정적이야?"와 "왜 이렇게 딱딱해?"가 교차합니다. 한 사람의 논리가 다른 사람에게는 차가움으로, 다른 사람의 감정 표현이 한 사람에게는 비효율로 느껴집니다. "지금 많이 속상했구나"라는 공감 한 마디가 논리보다 먼저 필요합니다.',
      connectionStyle: '두 사람이 같은 목표를 향해 움직일 때 가장 잘 연결됩니다. 한 사람의 실행력과 다른 사람의 따뜻한 감각이 합쳐지면 강한 팀이 됩니다. 함께 계획하고, 함께 실행하고, 함께 결과를 나누는 경험이 이 관계를 단단하게 만듭니다.',
    },
    // ── white-blue-black + red-yellow-purple 3컬러 전체 조합 ──
    'white-blue-black|red-yellow-purple': {
      attractionContrast: '첫 번째 사람은 정돈·신뢰·깊이를 원합니다. 말보다 행동, 감정보다 구조, 관계 안에서도 질서와 원칙이 중요합니다. 두 번째 사람은 활동·표현·다양한 경험을 원합니다. 지금 이 순간의 에너지가 중요하고, 감정을 바로 표현하는 것이 자연스럽습니다. 한 사람의 안정감이 다른 사람에게는 답답함으로, 다른 사람의 활발함이 한 사람에게는 불안정함으로 느껴질 수 있습니다.',
      relationFlow: '한 사람이 조용히 거리를 두면, 다른 사람은 "왜 갑자기 말이 없어?"라고 불안해합니다. 거리와 활발함이 번갈아 충돌하는 패턴이 반복됩니다. "나 지금 충전 중이야"라고 말해주는 것만으로도 상대의 불안이 줄어듭니다.',
      expressionDifference: '한 사람은 "말 안 해도 알아줬으면 해"라는 내면 표현형입니다. 다른 사람은 "지금 바로 표현하고 싶어"라는 즉각 표현형입니다. 표현 속도와 방식이 완전히 다릅니다.',
      conflictPattern: '"왜 이렇게 즉흥적이야?"와 "왜 이렇게 딱딱해?"가 교차합니다. 한 사람의 신중함이 다른 사람에게는 소극적으로, 다른 사람의 즉흥성이 한 사람에게는 불안정하게 느껴집니다.',
      connectionStyle: '새로운 장소를 함께 가거나, 함께 뭔가를 배우는 경험이 두 사람을 연결합니다. 한 사람의 안정감과 다른 사람의 활력이 만나면 서로에게 없는 에너지를 채워줍니다.',
    },
    // ── blue-indigo-black + white-beige-cream 3컬러 전체 조합 ──
    'blue-indigo-black|white-beige-cream': {
      attractionContrast: '첫 번째 사람은 신뢰·원칙·깊이 있는 연결을 원합니다. 말보다 행동, 감정보다 구조, 관계 안에서도 신뢰와 약속이 흔들리면 거리를 둡니다. 두 번째 사람은 정화·단순함·고요한 안정을 원합니다. 불필요한 것을 비우고, 조용히 자신을 유지하는 것이 중요합니다. 한 사람의 원칙이 다른 사람에게는 무거움으로, 다른 사람의 단순함이 한 사람에게는 거리감으로 느껴질 수 있습니다.',
      relationFlow: '두 사람 모두 혼자 있는 시간이 필요한 패턴입니다. 한 사람이 조용해지면 다른 사람도 조용해지고, 서로 연결이 끊어진 느낌이 반복됩니다. 주기적으로 "오늘 어땠어?"라고 먼저 연결을 시도하는 것이 이 관계의 숙제입니다.',
      expressionDifference: '한 사람은 "신뢰가 쌓여야 표현할 수 있어"라는 신중 표현형입니다. 다른 사람은 "말 없이도 알아줬으면 해"라는 조용한 진심형입니다. 두 사람 모두 표현이 적어 서로의 마음을 오해할 수 있습니다.',
      conflictPattern: '두 사람 모두 혼자 정리하려 하여 갈등 후 연결이 늦어지는 패턴이 반복됩니다. "언제쯤 얘기할 수 있어?"라고 시간을 정해두면 두 사람 모두 덜 불안합니다.',
      connectionStyle: '조용한 공간에서 함께 있는 시간, 의미 있는 대화, 신뢰가 쌓이는 경험이 두 사람을 연결합니다. 말이 많지 않아도 옆에 있는 것만으로 연결감을 느끼는 흐름이 이 관계의 자연스러운 방식입니다.',
    },
    // ── indigo-violet-purple + pink-lavender-cream 3컬러 전체 조합 ──
    'indigo-violet-purple|pink-lavender-cream': {
      attractionContrast: '첫 번째 사람은 내면 탐색·성찰·깊이 있는 연결을 원합니다. 감정보다 의미가 먼저이고, 관계 안에서도 진심과 깊이가 느껴져야 합니다. 두 번째 사람은 따뜻한 감성·공감·아늑한 연결을 원합니다. 기분이 좋아지는 것, 감정적으로 연결되는 것이 중요합니다. 한 사람의 깊이가 다른 사람에게는 무거움으로, 다른 사람의 감성이 한 사람에게는 가벼움으로 느껴질 수 있습니다.',
      relationFlow: '한 사람이 혼자 생각하고 있을 때, 다른 사람은 연결을 원해 방향이 엇갈리는 패턴이 반복됩니다. "나 지금 생각 중이야, 조금만 기다려줘"라는 신호와 "그래, 기다릴게"라는 여유가 이 관계의 균형입니다.',
      expressionDifference: '한 사람은 "진심이 느껴져야 표현할 수 있어"라는 깊이 우선형입니다. 다른 사람은 "오늘 예뻐, 보고 싶었어"라는 즉각 감성 표현형입니다. 표현 방식이 완전히 다릅니다.',
      conflictPattern: '한 사람은 "충분히 정리되면 얘기하자"라고 느끼고, 다른 사람은 "빨리 화해하고 싶어"라고 느낍니다. "나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      connectionStyle: '의미 있는 대화와 감성적인 공간에서 함께 있는 시간이 두 사람을 연결합니다. 한 사람의 깊이와 다른 사람의 따뜻함이 만나면 서로에게 없는 에너지를 채워줍니다.',
    },
    // ── green-sage-teal + white-beige-cream 3컬러 전체 조합 ──
    'green-sage-teal|white-beige-cream': {
      attractionContrast: '첫 번째 사람은 자연스러운 균형·조화·관계 조율을 중시합니다. 관계 안에서도 자연스럽게 흐르는 것이 중요하고, 억지스러운 것을 싫어합니다. 두 번째 사람은 정화·단순함·고요한 안정을 원합니다. 불필요한 것을 비우고, 조용히 자신을 유지하는 것이 중요합니다. 두 사람 모두 조용한 편이라 서로에게 소외감을 줄 수 있습니다.',
      relationFlow: '두 사람 모두 조용하고 신중한 패턴입니다. 갈등이 생겨도 직접 표현하지 않아 서로 눈치만 보는 흐름이 반복됩니다. 먼저 "나 요즘 이런 게 신경 쓰여"라고 말하는 연습이 이 관계의 숙제입니다.',
      expressionDifference: '한 사람은 "자연스럽게 흐르면 돼"라는 자연스러운 연결형입니다. 다른 사람은 "말 없이도 알아줬으면 해"라는 조용한 진심형입니다. 두 사람 모두 표현이 적어 서로의 마음을 오해할 수 있습니다.',
      conflictPattern: '두 사람 모두 조용히 정리하려 하여 갈등 후 연결이 늦어지는 패턴이 반복됩니다. "잠깐 산책하고 와서 얘기하자"는 제안이 이 관계에서 효과적입니다.',
      connectionStyle: '자연 속 산책, 조용한 카페, 함께 요리하기처럼 자연스럽게 함께 있는 시간이 두 사람을 연결합니다. 말이 많지 않아도 편안하게 함께 있는 것이 이 관계의 자연스러운 방식입니다.',
    },
    // ── yellow-gold-beige + blue-sky-white 3컬러 전체 조합 ──
    'yellow-gold-beige|blue-sky-white': {
      attractionContrast: '첫 번째 사람은 자신감·표현·밝은 에너지를 중시합니다. 좋은 것을 함께 나누고, 활발하게 표현하는 것이 자연스럽습니다. 두 번째 사람은 신뢰·진심·조용한 연결을 원합니다. 신뢰가 쌓여야 마음을 열고, 깊이 있는 연결을 원합니다. 한 사람의 활발함이 다른 사람에게는 부담으로, 다른 사람의 신중함이 한 사람에게는 답답함으로 느껴질 수 있습니다.',
      relationFlow: '한 사람이 활발하게 표현할 때, 다른 사람은 아직 신뢰를 쌓는 중인 패턴이 반복됩니다. "나는 이렇게 표현하는 게 자연스러워"라고 먼저 알려주는 것이 이 관계의 시작입니다.',
      expressionDifference: '한 사람은 "좋으면 바로 표현해야 해"라는 즉각 표현형입니다. 다른 사람은 "신뢰가 쌓여야 표현할 수 있어"라는 신중 표현형입니다. 표현 속도와 방식이 다릅니다.',
      conflictPattern: '"왜 이렇게 화려해?"와 "왜 이렇게 따분해?"가 교차합니다. 한 사람의 활발함이 다른 사람에게는 부담으로, 다른 사람의 신중함이 한 사람에게는 소극적으로 느껴집니다.',
      connectionStyle: '함께 새로운 것을 경험하거나, 신뢰가 쌓이는 대화를 나누는 시간이 두 사람을 연결합니다. 한 사람의 활력과 다른 사람의 깊이가 만나면 서로에게 없는 에너지를 채워줍니다.',
    },
    // ── red + pink (첫 컬러 쌍 기준) ──
    'red|pink': {
      attractionContrast: '한 사람은 빠른 실행과 즉각적인 표현으로 사랑을 보여줍니다. 다른 사람은 따뜻한 감정 연결과 인정으로 사랑을 느낍니다. 끌림은 활력과 따뜻함이 만나는 데 있고, 힘든 지점은 표현 속도와 감정 회복 속도의 차이에서 생깁니다.',
      conflictPattern: '한 사람은 "이미 말했잖아, 왜 아직도 그래?"라고 느끼고, 다른 사람은 "그때 그 말이 아직 마음에 걸려"라고 느낍니다. 표현 속도와 감정 처리 속도가 다릅니다.',
      connectionStyle: '함께 활동하면서 감정을 나누는 시간이 두 사람을 연결합니다. 드라이브, 산책, 함께 요리하기처럼 몸을 움직이면서 대화하는 것이 이 관계의 자연스러운 연결 방식입니다.',
    },
    // ── pink + indigo (첫 컬러 쌍 기준) ──
    'pink|indigo': {
      attractionContrast: '한 사람은 감정적 인정과 따뜻한 연결을 원합니다. 다른 사람은 내면을 충분히 정리한 후 깊이 있는 연결을 원합니다. 끌림은 따뜻함과 깊이가 만나는 데 있고, 힘든 지점은 "왜 반응이 없어?"와 "나는 생각 중이야"의 속도 차이에서 생깁니다.',
      conflictPattern: '한 사람은 "왜 말을 안 해? 나한테 화났어?"라고 불안해하고, 다른 사람은 "나는 지금 정리 중이야, 왜 자꾸 물어봐?"라고 답답해합니다. 침묵의 의미가 다릅니다.',
      connectionStyle: '조용한 공간에서 함께 있는 시간이 두 사람을 연결합니다. 말이 많지 않아도 옆에 있는 것만으로 연결감을 느끼는 흐름이 이 관계의 자연스러운 방식입니다.',
    },
    // ── indigo + yellow (첫 컬러 쌍 기준) ──
    'indigo|yellow': {
      attractionContrast: '한 사람은 내면 정리와 신중한 표현을 중심으로 관계를 맺습니다. 다른 사람은 현실 안정과 책임감, 활동적인 연결을 원합니다. 끌림은 깊이와 현실감이 만나는 데 있고, 힘든 지점은 감정 표현이 줄어들면서 서로가 멀어지는 느낌에서 생깁니다.',
      conflictPattern: '한 사람이 조용해지면, 다른 사람은 "뭔가 잘못됐나?"라고 불안해합니다. 침묵이 거리감으로 번지는 패턴이 반복됩니다. "나 지금 생각 중이야"라고 먼저 말해주는 것이 이 관계의 숙제입니다.',
      connectionStyle: '재정 계획이나 생활 루틴을 함께 정하는 시간이 두 사람을 연결합니다. 같이 미래를 설계하고, 현실적인 목표를 공유하는 것이 이 관계의 깊은 연결 방식입니다.',
    },
    // ── purple-yellow-red + orange-white-yellow 3컬러 전체 조합 ──
    'purple-yellow-red|orange-white-yellow': {
      attractionContrast: '첫 번째 사람은 의미 있는 것, 깊이 있는 것, 자신만의 세계를 중시합니다. 표현보다 내면이 먼저이고, 관계 안에서도 진심이 느껴지는 연결을 원합니다. 두 번째 사람은 현재의 활력과 경험, 함께 웃고 즐기는 시간을 중요하게 여깁니다. 그래서 한 사람은 "왜 이렇게 즉흥적이야?"라고 느끼고, 다른 사람은 "왜 이렇게 무거워?"라고 느낄 수 있습니다. 이 관계의 끌림은 깊이와 활력이 만나는 데 있고, 힘든 지점은 생활 리듬과 소비 기준의 차이에서 생깁니다.',
      relationFlow: '한 사람이 신중하게 결정하려 할 때, 다른 사람은 이미 행동하고 있는 패턴이 반복됩니다. 결정 속도와 생활 리듬이 다릅니다. "나 먼저 생각해볼게"라는 신호와 "그래, 기다릴게"라는 여유가 이 관계의 균형입니다.',
      expressionDifference: '한 사람은 "말하기 전에 충분히 정리해야 해"라는 내면 정리형입니다. 다른 사람은 "지금 느끼는 걸 바로 표현하는 게 자연스러워"라는 즉각 표현형입니다. 같은 상황에서 표현 방식이 완전히 다릅니다.',
      conflictPattern: '한 사람은 "나 아직 정리 중이야"라고 느끼고, 다른 사람은 "왜 말을 안 해?"라고 불안해합니다. 침묵과 표현 욕구가 충돌하는 패턴이 반복됩니다. "나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      connectionStyle: '함께 새로운 것을 경험하거나, 의미 있는 대화를 나누는 시간이 두 사람을 연결합니다. 한 사람의 깊이와 다른 사람의 활력이 만나면 서로에게 없는 에너지를 채워줍니다. "오늘 뭐 하고 싶어?"라는 질문 하나가 이 관계의 시작입니다.',
    },
    // ── orange-white-yellow + purple-yellow-red 역방향 ──
    'orange-white-yellow|purple-yellow-red': {
      attractionContrast: '첫 번째 사람은 현재의 활력과 경험, 함께 즐기는 시간을 중요하게 여깁니다. 두 번째 사람은 의미 있는 것, 깊이 있는 연결, 자신만의 세계를 중시합니다. 끌림은 활력과 깊이가 만나는 데 있고, 힘든 지점은 생활 리듬과 결정 속도의 차이에서 생깁니다.',
      relationFlow: '한 사람이 이미 행동하고 있을 때, 다른 사람은 아직 생각 중인 패턴이 반복됩니다. "먼저 생각해볼게"라는 신호와 "그래, 기다릴게"라는 여유가 이 관계의 균형입니다.',
      expressionDifference: '한 사람은 즉각 표현형, 다른 사람은 내면 정리 후 표현형입니다. 표현 속도와 방식이 다릅니다.',
      conflictPattern: '한 사람은 "왜 말을 안 해?"라고 불안해하고, 다른 사람은 "나 아직 정리 중이야"라고 느낍니다. "나 지금 정리 중이야, 조금만 기다려줘"라는 신호가 오해를 줄입니다.',
      connectionStyle: '함께 새로운 것을 경험하거나 의미 있는 대화를 나누는 시간이 두 사람을 연결합니다.',
    },
    // ── magenta-cream-lavender + magenta-cream-lavender (같은 계열 조합) ──
    'magenta-cream-lavender|magenta-cream-lavender': {
      attractionContrast: '두 사람 모두 감정 깊이와 따뜻한 연결을 중시합니다. 한 사람은 감정 공감과 관계 온도를 중요하게 여기고, 다른 사람은 감성적인 분위기와 아늑한 연결을 원합니다. 끌림은 서로의 감정 결이 비슷한 데 있고, 힘든 지점은 두 사람 모두 상처에 민감하여 작은 말 한마디가 오래 남을 수 있다는 것입니다.',
      relationFlow: '두 사람 모두 감정이 먼저인 패턴입니다. 한 사람이 상처받으면 다른 사람도 민감하게 반응하는 흐름이 반복됩니다. 서로의 감정을 먼저 확인하는 습관이 이 관계를 안정적으로 만듭니다.',
      expressionDifference: '한 사람은 "내 마음을 먼저 알아줬으면 해"라는 공감 먼저형입니다. 다른 사람은 "분위기가 좋아야 말이 나와"라는 감성 환경형입니다. 두 사람 모두 감정이 먼저이지만 표현 방식이 미묘하게 다릅니다.',
      conflictPattern: '두 사람 모두 상처에 민감하여 갈등 후 회복이 느릴 수 있습니다. "지금 많이 힘들었구나"라는 공감 한 마디가 이 관계에서 가장 중요한 회복 언어입니다.',
      connectionStyle: '감성적인 공간에서 함께 있는 시간, 따뜻한 대화, 서로의 감정을 나누는 순간이 두 사람을 깊이 연결합니다. 분위기 좋은 카페, 함께 음악 듣기, 조용한 산책이 이 관계의 자연스러운 연결 방식입니다.',
    },
  };
  // 3컬러 전체 조합 키로 먼저 매칭, 없으면 첫 컬러 쌍으로 매칭
  const profileKey1 = `${fullKeyA}|${fullKeyB}`;
  const profileKey2 = `${fullKeyB}|${fullKeyA}`;
  const profileKeySimple1 = `${c0A}|${c0B}`;
  const profileKeySimple2 = `${c0B}|${c0A}`;
  const colorBasedProfileOverride: ProfileContrastOverride | undefined =
    PROFILE_CONTRAST_OVERRIDE_MAP[profileKey1] ??
    PROFILE_CONTRAST_OVERRIDE_MAP[profileKey2] ??
    PROFILE_CONTRAST_OVERRIDE_MAP[profileKeySimple1] ??
    PROFILE_CONTRAST_OVERRIDE_MAP[profileKeySimple2];
  // 기존 archetype profileContrastOverride와 병합 (컬러 기반이 우선)
  const mergedProfileContrast: ProfileContrastOverride | undefined = colorBasedProfileOverride
    ? { ...baseData.profileContrastOverride, ...colorBasedProfileOverride }
    : baseData.profileContrastOverride;

  return {
    archetype: finalArchetype,
    ...baseData,
    profileContrastOverride: mergedProfileContrast,
    expressionSpeed: dynamicExpressionSpeed,
    lifestyleSections,
  };
}

// ── 에너지 계열 기반 기본 생활 섹션 생성 ──────────────────────────────────
function buildDefaultLifestyleSections(
  fA: EnergyFamily,
  fB: EnergyFamily,
  shapeA?: string,
  shapeB?: string,
  archetype?: RelationArchetype
): NonNullable<ArchetypeResult['lifestyleSections']> {
  // 도형별 생활 특성 키워드
  const getShapeLifestyleNote = (shape?: string): string => {
    if (!shape) return '';
    // 도형 = 갈등 직후 반응 구조 + 생활 패턴
    const notes: Record<string, string> = {
      triangle: '갈등 직후 말이 없어지고 경계가 생길 수 있습니다. 혼자 정리하는 시간이 선행되어야 합니다.',
      inverted_triangle: '갈등 직후 조용해지거나 말이 없어집니다. 이 침묵이 거리감으로 번지지 않도록 서두르지 않는 연결이 필요합니다.',
      circle: '갈등 후에도 연결을 원하는 패턴입니다. 관계가 끝나지 않는다는 신호가 회복을 돕습니다.',
      square: '갈등 직후 원인과 해결책을 먼저 찾는 패턴입니다. 감정 공감이 먼저 이루어지면 회복이 빠릅니다.',
      diamond: '갈등 직후 긴장이 오래 지속되고 작은 말 한마디가 마음에 오래 남는 패턴입니다. 섬세한 공감이 회복을 돕습니다.',
      pentagon: '갈등 직후 자신의 방향성을 지키려는 태도가 상대에게 밀어내는 느낙으로 읽힐 수 있습니다.',
      hexagon: '갈등 직후 관계를 지키려는 마음에 자신의 감정을 숨기는 패턴이 있습니다. 상대는 실제 상태를 모를 수 있습니다.',
    };
    return notes[shape] ?? '';
  };
  const shapeNoteA = getShapeLifestyleNote(shapeA);
  const shapeNoteB = getShapeLifestyleNote(shapeB);

  // ── archetype별 표현 오버라이드 맵 ──────────────────────────────
  // 각 archetype에 맞는 restPersonMap/conflictPersonMap 오버라이드
  type ArchetypeOverride = {
    rest?: Partial<Record<EnergyFamily, string>>;
    conflict?: Partial<Record<EnergyFamily, string>>;
    shapeRhythmOverride?: string;
    restDescription?: string;
    conflictDescription?: string;
  };
  const ARCHETYPE_LIFESTYLE_OVERRIDE: Partial<Record<RelationArchetype, ArchetypeOverride>> = {
    성장자극형: {
      rest: {
        nature: '"나가서 뭔가 새로운 걸 해야 충전돼." 활동 전환형입니다.',
        neutral: '"아무것도 안 하고 완전히 비워야 다시 달릴 수 있어." 완전 리셋형입니다.',
        warm_soft: '"함께 새로운 걸 경험하면 충전돼." 공유 활동형입니다.',
        cool_deep: '"혼자 깊이 생각하며 정리해야 충전돼." 내면 정리형입니다.',
      },
      conflict: {
        nature: '"일단 같이 움직이자. 걸으면서 얘기해." 활동 해소형입니다.',
        neutral: '"각자 정리하고 다시 만나자. 그게 더 빨라." 공간 회복형입니다.',
        warm_soft: '"지금 바로 얘기하자. 미루면 더 힘들어." 즉각 해결형입니다.',
      },
      shapeRhythmOverride: undefined,
      restDescription: '두 사람이 쉬는 방식이 다릅니다. 한 사람은 활동으로 에너지를 전환하고, 다른 사람은 자신만의 방식으로 충전합니다.',
      conflictDescription: '갈등 후 두 사람의 반응 방식이 다릅니다. 이 관계에서는 앉아서 해결하기보다 함께 움직이는 것이 먼저입니다.',
    },
    거리조절형: {
      rest: {
        nature: '"혼자만의 시간이 있어야 다시 가까워질 수 있어." 독립 충전형입니다.',
        warm_active: '"나가서 에너지를 쓰고 나면 다시 가까워지고 싶어져." 활동 후 연결형입니다.',
        warm_soft: '"가까이 있다가도 숨 쉴 공간이 필요해." 거리 조절형입니다.',
      },
      conflict: {
        nature: '"잠깐 거리를 두고 각자 숨 좀 쉬자." 공간 회복형입니다.',
        warm_active: '"지금 바로 해결하고 싶어. 미루면 더 멀어져." 즉각 해결형입니다.',
      },
      restDescription: '두 사람이 쉬는 방식이 다릅니다. 가까워졌다 멀어지는 패턴이 휴식 방식에도 나타납니다.',
      conflictDescription: '갈등 후 한 사람은 거리를 두고 싶고, 다른 사람은 바로 해결하고 싶어합니다.',
    },
    온도차형: {
      rest: {
        nature: '"자연스럽게 속도가 맞춰질 때까지 기다려." 속도 조절형입니다.',
        warm_active: '"빨리 풀고 다음으로 넘어가야 충전돼." 빠른 전환형입니다.',
      },
      conflict: {
        nature: '"천천히 정리될 때까지 기다리자." 속도 존중형입니다.',
        neutral: '"각자 정리하고 준비됐을 때 얘기하자." 공간 회복형입니다.',
      },
      restDescription: '두 사람이 쉬는 속도가 다릅니다. 빠른 사람은 이미 충전됐는데 느린 사람은 아직 회복 중일 수 있습니다.',
      conflictDescription: '갈등 후 두 사람의 회복 속도가 다릅니다. 빠른 사람이 기다려주는 것이 이 관계의 핵심입니다.',
    },
    회복형: {
      rest: {
        nature: '"함께 조용히 있는 것만으로도 충전돼." 공존 회복형입니다.',
        warm_soft: '"네가 옆에 있으면 자연스럽게 회복돼." 연결 충전형입니다.',
      },
      conflict: {
        nature: '"잠깐 각자 숨 쉬고, 다시 천천히 연결하자." 재연결형입니다.',
        warm_soft: '"먼저 안아주면 말이 나와." 스킨십 회복형입니다.',
      },
      restDescription: '두 사람이 쉬는 방식이 다릅니다. 회복 후 다시 연결되는 것이 이 관계의 패턴입니다.',
      conflictDescription: '갈등 후 두 사람의 반응 방식이 다릅니다. 이 관계에서는 회복 후 재연결이 핵심입니다.',
    },
    현실균형형: {
      rest: {
        nature: '"계획된 휴식이 있어야 진짜 쉬어지는 느낌이야." 루틴 회복형입니다.',
        warm_active: '"뭔가 해야 쉬는 것 같아." 활동 충전형입니다.',
      },
      conflict: {
        nature: '"논리적으로 정리하고 얘기하자." 현실 해결형입니다.',
        warm_active: '"지금 바로 얘기하고 해결하자." 즉각 해결형입니다.',
      },
      restDescription: '두 사람이 쉬는 방식이 다릅니다. 현실적이고 계획적인 휴식 방식이 이 관계의 특징입니다.',
      conflictDescription: '갈등 후 두 사람의 반응 방식이 다릅니다. 감정보다 현실적 해결을 먼저 찾는 패턴입니다.',
    },
  };


  const archetypeOverride = archetype ? ARCHETYPE_LIFESTYLE_OVERRIDE[archetype] : undefined;

  // 도형별 재정 수식어 보정 - 컬러 family 성향과 충돌하지 않는 의사결정 스타일만 반영
  const shapeFinanceNote = (family: EnergyFamily, shape?: string): string => {
    if (!shape) return '';
    // 컬러 family별로 도형이 어떻게 그 성향을 표현하는지 설명 (성향 자체를 뒤집지 않음)
    const m: Record<string, Partial<Record<EnergyFamily, string>>> = {
      triangle: {
        warm_active: ' 결정이 빠르고 행동으로 바로 이어집니다.',
        warm_soft: ' 감정이 올라오면 바로 표현하는 편입니다.',
        warm_grounded: ' 필요하다고 판단하면 즉각 행동합니다.',
        cool_clear: ' 논리적으로 판단하고 빠르게 결정합니다.',
        cool_deep: ' 내면 기준이 서면 바로 실행합니다.',
        nature: ' 흐름이 맞으면 바로 움직이는 편입니다.',
        neutral: ' 필요한 것은 군더더기 없이 바로 처리합니다.',
      },
      circle: {
        warm_active: ' 에너지가 오를 때 소비가 늘어나는 패턴입니다.',
        warm_soft: ' 감정 상태에 따라 소비 흐름이 달라집니다.',
        warm_grounded: ' 감정이 안정될 때 더 균형 있는 소비를 합니다.',
        cool_clear: ' 감정이 정돈된 상태에서 합리적으로 결정합니다.',
        cool_deep: ' 내면이 정리되면 소비 결정도 명확해집니다.',
        nature: ' 자연스러운 흐름 속에서 소비가 이루어집니다.',
        neutral: ' 감정이 안정될 때 절제가 더 잘 됩니다.',
      },
      square: {
        warm_active: ' 계획보다 현재 필요에 반응하지만 기준이 있습니다.',
        warm_soft: ' 감정 소비이지만 나름의 기준 안에서 이루어집니다.',
        warm_grounded: ' 현실적인 기준과 계획 안에서 소비합니다.',
        cool_clear: ' 체계적인 기준으로 소비를 관리합니다.',
        cool_deep: ' 가치 기준을 세우고 그 안에서 소비합니다.',
        nature: ' 생활 루틴 안에서 자연스럽게 소비가 이루어집니다.',
        neutral: ' 필요한 것만 목록화하여 소비하는 편입니다.',
      },
      pentagon: {
        warm_active: ' 자신만의 기준으로 빠르게 결정합니다.',
        warm_soft: ' 자신에게 의미 있는 것에 감정적으로 투자합니다.',
        warm_grounded: ' 자신의 안정 기준에 맞는 것에만 씁니다.',
        cool_clear: ' 자신만의 효율 기준이 명확합니다.',
        cool_deep: ' 자신의 가치 기준에 맞는 것에 집중합니다.',
        nature: ' 자신의 페이스에 맞게 소비합니다.',
        neutral: ' 자신의 기준에서 벗어나는 소비는 잘 하지 않습니다.',
      },
      hexagon: {
        warm_active: ' 관계와 공동 생활을 위한 소비를 중요하게 여깁니다.',
        warm_soft: ' 함께하는 것에 기꺼이 씁니다.',
        warm_grounded: ' 공동 생활의 안정을 위한 소비를 우선합니다.',
        cool_clear: ' 공동 생활에 필요한 것을 효율적으로 구비합니다.',
        cool_deep: ' 공동체에 의미 있는 것에 투자합니다.',
        nature: ' 함께하는 생활 루틴을 위한 소비를 선호합니다.',
        neutral: ' 공동 생활에 꼭 필요한 것만 구비합니다.',
      },
      inverted_triangle: {
        warm_active: ' 내면에서 필요하다는 확신이 서면 결정합니다.',
        warm_soft: ' 감정을 충분히 느낀 후 소비를 결정합니다.',
        warm_grounded: ' 충분히 생각한 후 안정적으로 결정합니다.',
        cool_clear: ' 내면에서 논리적으로 정리된 후 결정합니다.',
        cool_deep: ' 깊이 성찰한 후 의미 있는 것에 씁니다.',
        nature: ' 자연스럽게 필요하다는 느낌이 올 때 결정합니다.',
        neutral: ' 충분히 비운 후 꼭 필요한 것만 채웁니다.',
      },
      diamond: {
        warm_active: ' 관계와 분위기에 따라 소비 결정이 달라집니다.',
        warm_soft: ' 감성적인 분위기에서 소비 의욕이 높아집니다.',
        warm_grounded: ' 관계 안정감이 있을 때 균형 있는 소비를 합니다.',
        cool_clear: ' 분위기보다 실용성을 우선하는 균형을 유지합니다.',
        cool_deep: ' 감수성 있는 것에 의미 있는 투자를 합니다.',
        nature: ' 자연스러운 관계 흐름 안에서 소비합니다.',
        neutral: ' 분위기에 흔들리지 않고 절제를 유지합니다.',
      },
    };
    return m[shape]?.[family] ?? '';
  };
  // 도형별 휴식 수식어 보정
  const shapeRestNote = (family: EnergyFamily, shape?: string): string => {
    if (!shape) return '';
    // 컬러 family 성향을 강화하는 방향으로 도형의 휴식 스타일 표현
    const m: Record<string, Partial<Record<EnergyFamily, string>>> = {
      triangle: {
        warm_active: ' 몸을 움직이며 에너지를 발산하면 빠르게 회복됩니다.',
        warm_soft: ' 감정을 바로 표현하고 나면 충전이 됩니다.',
        warm_grounded: ' 필요한 것을 빠르게 해결하고 쉬는 편입니다.',
        cool_clear: ' 정리가 끝나면 바로 재충전 모드로 전환합니다.',
        cool_deep: ' 내면 정리가 되면 빠르게 회복됩니다.',
        nature: ' 자연 속에서 빠르게 에너지를 회복합니다.',
        neutral: ' 불필요한 것을 정리하면 바로 충전됩니다.',
      },
      circle: {
        warm_active: ' 사람과 함께 활동하며 에너지를 충전합니다.',
        warm_soft: ' 연결감이 있을 때 자연스럽게 회복됩니다.',
        warm_grounded: ' 안정된 관계 안에서 루틴대로 쉬면 충전됩니다.',
        cool_clear: ' 혼자만의 시간과 연결을 균형 있게 가져야 충전됩니다.',
        cool_deep: ' 조용한 연결 속에서 내면이 회복됩니다.',
        nature: ' 자연스러운 흐름 속에서 사람과 함께 충전됩니다.',
        neutral: ' 고요한 공간에서 혼자 쉬는 것이 진정한 충전입니다.',
      },
      square: {
        warm_active: ' 계획된 활동 안에서 에너지를 발산합니다.',
        warm_soft: ' 정해진 루틴 안에서 감정을 회복합니다.',
        warm_grounded: ' 계획된 루틴대로 쉬어야 안정감이 생깁니다.',
        cool_clear: ' 체계적인 휴식 스케줄이 있어야 효율적으로 충전됩니다.',
        cool_deep: ' 구조화된 고독 시간이 깊은 충전을 만듭니다.',
        nature: ' 정해진 루틴 안에서 자연스럽게 회복됩니다.',
        neutral: ' 계획된 정적인 시간이 최고의 충전입니다.',
      },
      pentagon: {
        warm_active: ' 자신만의 방식으로 활동하며 충전합니다.',
        warm_soft: ' 자신에게 맞는 감정 회복 방식이 있습니다.',
        warm_grounded: ' 자신의 루틴대로 쉬는 것이 가장 편안합니다.',
        cool_clear: ' 자신만의 효율적인 충전 방식을 선호합니다.',
        cool_deep: ' 자신만의 깊은 회복 시간이 필요합니다.',
        nature: ' 자신의 페이스에 맞는 회복 방식을 선호합니다.',
        neutral: ' 자신만의 고요한 충전 방식이 있습니다.',
      },
      hexagon: {
        warm_active: ' 함께 활동하며 에너지를 나누는 것이 충전입니다.',
        warm_soft: ' 함께 있는 것 자체가 회복이 됩니다.',
        warm_grounded: ' 공동 루틴 안에서 안정감을 얻습니다.',
        cool_clear: ' 함께하는 효율적인 휴식 루틴을 선호합니다.',
        cool_deep: ' 함께하는 조용한 시간이 깊은 충전이 됩니다.',
        nature: ' 함께하는 자연스러운 생활 루틴이 회복입니다.',
        neutral: ' 함께하는 고요한 시간이 최고의 충전입니다.',
      },
      inverted_triangle: {
        warm_active: ' 내면이 정리되면 에너지가 다시 올라옵니다.',
        warm_soft: ' 감정을 충분히 느끼고 나면 회복됩니다.',
        warm_grounded: ' 내면이 안정되면 루틴으로 돌아옵니다.',
        cool_clear: ' 혼자 논리적으로 정리하면 충전됩니다.',
        cool_deep: ' 혼자만의 깊은 내면 시간이 진정한 충전입니다.',
        nature: ' 조용한 자연 속에서 내면이 회복됩니다.',
        neutral: ' 완전히 비우는 고요한 시간이 충전입니다.',
      },
      diamond: {
        warm_active: ' 분위기 좋은 공간에서 활동하며 충전합니다.',
        warm_soft: ' 감성적인 분위기에서 감정이 회복됩니다.',
        warm_grounded: ' 안정적인 분위기 속에서 루틴대로 충전합니다.',
        cool_clear: ' 쾌적한 환경에서 효율적으로 충전합니다.',
        cool_deep: ' 감수성 있는 공간에서 깊이 회복됩니다.',
        nature: ' 자연스러운 분위기 속에서 충전됩니다.',
        neutral: ' 정돈된 공간에서 고요하게 충전합니다.',
      },
    };
    return m[shape]?.[family] ?? '';
  };
  // 도형별 갈등 수식어 보정 - 컬러 family 성향과 일관성 유지
  const shapeConflictNote = (family: EnergyFamily, shape?: string): string => {
    if (!shape) return '';
    const m: Record<string, Partial<Record<EnergyFamily, string>>> = {
      triangle: {
        warm_active: ' 바로 말하고 즉각 해결하려는 성향이 강합니다.',
        warm_soft: ' 감정이 올라오면 바로 표현하고 싶어합니다.',
        warm_grounded: ' 필요하다고 판단하면 바로 대화를 시작합니다.',
        cool_clear: ' 논리적으로 정리하고 빠르게 해결하려 합니다.',
        cool_deep: ' 내면 정리가 되면 바로 표현합니다.',
        nature: ' 자연스럽게 흐르면 빠르게 해결하려 합니다.',
        neutral: ' 불필요한 감정 없이 바로 정리하려 합니다.',
      },
      circle: {
        warm_active: ' 감정이 수습되면 빠르게 화해하는 편입니다.',
        warm_soft: ' 감정이 수습되면 자연스럽게 연결을 회복합니다.',
        warm_grounded: ' 감정이 안정되면 루틴으로 돌아오며 회복합니다.',
        cool_clear: ' 감정이 정돈되면 논리적으로 화해합니다.',
        cool_deep: ' 내면이 정리되면 조용히 화해합니다.',
        nature: ' 자연스럽게 감정이 흐르면 회복됩니다.',
        neutral: ' 감정이 가라앉으면 고요하게 화해합니다.',
      },
      square: {
        warm_active: ' 계획적으로 해결하되 행동으로 표현합니다.',
        warm_soft: ' 감정을 정리하고 순서대로 표현합니다.',
        warm_grounded: ' 논리적으로 정리하고 신중하게 해결합니다.',
        cool_clear: ' 체계적으로 논리를 정리하고 해결합니다.',
        cool_deep: ' 구조적으로 내면을 정리하고 표현합니다.',
        nature: ' 루틴 안에서 자연스럽게 해결합니다.',
        neutral: ' 감정 없이 사실만 정리하여 해결합니다.',
      },
      pentagon: {
        warm_active: ' 자신의 페이스로 빠르게 해결하려 합니다.',
        warm_soft: ' 자신의 방식으로 감정을 표현합니다.',
        warm_grounded: ' 자신의 페이스를 지키며 신중하게 해결합니다.',
        cool_clear: ' 자신의 논리 기준으로 해결합니다.',
        cool_deep: ' 자신의 내면 기준으로 정리하고 표현합니다.',
        nature: ' 자신의 페이스를 유지하며 자연스럽게 해결합니다.',
        neutral: ' 자신의 기준으로 조용히 정리합니다.',
      },
      hexagon: {
        warm_active: ' 관계를 위해 적극적으로 조율합니다.',
        warm_soft: ' 관계 유지를 위해 감정적으로 조율합니다.',
        warm_grounded: ' 관계 안정을 위해 신중하게 조율합니다.',
        cool_clear: ' 관계를 위해 논리적으로 조율합니다.',
        cool_deep: ' 관계 깊이를 위해 내면에서 먼저 정리합니다.',
        nature: ' 관계를 위해 자연스럽게 조율합니다.',
        neutral: ' 관계 유지를 위해 조용히 조율합니다.',
      },
      inverted_triangle: {
        warm_active: ' 내면에서 정리된 후 빠르게 표현합니다.',
        warm_soft: ' 감정을 충분히 느끼고 나서 표현합니다.',
        warm_grounded: ' 내면에서 충분히 정리한 후 신중하게 표현합니다.',
        cool_clear: ' 내면에서 논리적으로 정리한 후 표현합니다.',
        cool_deep: ' 깊이 성찰한 후 의미 있는 방식으로 표현합니다.',
        nature: ' 자연스럽게 내면이 정리되면 표현합니다.',
        neutral: ' 완전히 정리된 후 조용히 표현합니다.',
      },
      diamond: {
        warm_active: ' 상대의 감정에 반응하며 빠르게 해결하려 합니다.',
        warm_soft: ' 상대의 감정에 섬세하게 반응하며 공감합니다.',
        warm_grounded: ' 상대의 감정을 살피며 신중하게 해결합니다.',
        cool_clear: ' 상대의 감정을 고려하면서도 논리적으로 해결합니다.',
        cool_deep: ' 상대의 감정에 깊이 공명하며 내면에서 정리합니다.',
        nature: ' 상대의 감정 흐름에 맞춰 자연스럽게 해결합니다.',
        neutral: ' 상대의 감정을 살피며 조용히 정리합니다.',
      },
    };
    return m[shape]?.[family] ?? '';
  };

  // 도형 조합에 따른 생활 리듬 설명 생성
  const getShapeRhythmDesc = (sA?: string, sB?: string): string => {
    if (!sA || !sB) return '';
    if (sA === 'hexagon' && sB === 'inverted_triangle') {
      return '첫 번째 사람은 생활 루틴과 구조를 중시하고, 두 번째 사람은 내면에서 먼저 정리하는 패턴입니다. 일상 속에서 의사결정 속도가 다를 수 있습니다.';
    }
    if (sA === 'pentagon' && sB === 'triangle') {
      return '첫 번째 사람은 자신만의 페이스를 유지하고, 두 번째 사람은 즉각 반응하는 패턴입니다. 생활 속 속도 차이가 마찰이 될 수 있습니다.';
    }
    if (sA === 'triangle' && sB === 'pentagon') {
      return '첫 번째 사람은 즉각 반응하고, 두 번째 사람은 자신만의 페이스를 유지하는 패턴입니다. 생활 속 속도 차이가 마찰이 될 수 있습니다.';
    }
    if ((sA === 'circle' || sB === 'circle') && (sA === 'square' || sB === 'square')) {
      return '한 사람은 감정 순환형, 다른 사람은 구조 안정형입니다. 일상에서 유연성과 질서 사이의 균형이 필요합니다.';
    }
    if (sA === 'hexagon' && sB === 'pentagon') {
      return '첫 번째 사람은 공동 루틴을 중시하고, 두 번째 사람은 자기 방식을 유지하려 합니다. 생활 규칙을 함께 정하는 과정이 중요합니다.';
    }
    if (sA === 'pentagon' && sB === 'hexagon') {
      return '첫 번째 사람은 자기 방식을 유지하려 하고, 두 번째 사람은 공동 루틴을 중시합니다. 생활 규칙을 함께 정하는 과정이 중요합니다.';
    }
    return '';
  };
  // archetype 오버라이드 적용된 shapeRhythmDesc
  let shapeRhythmDesc = getShapeRhythmDesc(shapeA, shapeB);
  // 성장자극형에서 circle+square 조합은 "감정 순환형/구조 안정형" 대신 archetype 맞는 표현으로
  if (archetype === '성장자극형' && ((shapeA === 'circle' || shapeB === 'circle') && (shapeA === 'square' || shapeB === 'square'))) {
    shapeRhythmDesc = '한 사람은 유연하게 흐르고, 다른 사람은 구조를 잡으려 합니다. 이 차이가 성장자극형 관계에서 창의적 긴장의 원천이 됩니다.';
  } else if (archetype === '거리조절형' && ((shapeA === 'circle' || shapeB === 'circle') && (shapeA === 'square' || shapeB === 'square'))) {
    shapeRhythmDesc = '한 사람은 유연하게 연결을 원하고, 다른 사람은 일정한 구조와 거리를 유지하려 합니다.';
  } else if (archetype === '온도차형' && ((shapeA === 'circle' || shapeB === 'circle') && (shapeA === 'square' || shapeB === 'square'))) {
    shapeRhythmDesc = '한 사람은 감정의 흐름을 따르고, 다른 사람은 체계적인 리듬을 선호합니다. 속도와 방식이 다릅니다.';
  }

  // archetype 오버라이드 적용된 restPersonMap/conflictPersonMap 생성
  const applyOverride = (base: Record<EnergyFamily, string>, override?: Partial<Record<EnergyFamily, string>>): Record<EnergyFamily, string> => {
    if (!override) return base;
    return { ...base, ...override };
  };

  // 재정 스타일 맵
  const financePersonMap: Record<EnergyFamily, string> = {
    warm_active: '"지금 필요하면 바로 사자." 현재 중심, 경험 소비형입니다.',
    warm_soft: '"이게 있으면 기분이 좋아질 것 같아." 감정 회복형 소비입니다.',
    warm_grounded: '"비상금은 꼭 있어야 해. 안정이 먼저야." 안정 저축형입니다.',
    cool_clear: '"꼭 필요한 것만, 효율적으로." 합리적 소비형입니다.',
    cool_deep: '"가치 있는 것에만 써야 해." 의미·가치 중심 소비입니다.',
    nature: '"자연스럽게 필요할 때 써." 균형 소비형입니다.',
    neutral: '"낭비 없이 깔끔하게." 절제·정화형 소비입니다.',
  };
  // 갈등 반응 맵
  const conflictPersonMap: Record<EnergyFamily, string> = {
    warm_active: '"지금 바로 얘기하자." 즉각 해결형입니다.',
    warm_soft: '"내 마음을 먼저 알아줬으면 해." 공감 먼저형입니다.',
    warm_grounded: '"천천히 생각하고 얘기하자." 신중 대화형입니다.',
    cool_clear: '"감정 빼고 논리적으로 얘기하자." 논리 정리형입니다.',
    cool_deep: '"조금만 시간 줘. 나 아직 정리가 안 됐어." 내면 정리형입니다.',
    nature: '"자연스럽게 풀릴 때까지 기다리자." 자연 회복형입니다.',
    neutral: '"일단 각자 정리하고 다시 얘기하자." 공간 회복형입니다.',
  };
  // 휴식 방식 맵
  const restPersonMap: Record<EnergyFamily, string> = {
    warm_active: '"나가서 뭔가 하면 기분 풀려." 활동 전환형입니다.',
    warm_soft: '"같이 있어줘. 네가 옆에 있어야 편해." 연결 회복형입니다.',
    warm_grounded: '"집에서 루틴대로 하면 충전돼." 루틴 회복형입니다.',
    cool_clear: '"각자 자유롭게 쉬는 게 최고야." 독립 회복형입니다.',
    cool_deep: '"혼자 조용히 있어야 충전돼." 고독 충전형입니다.',
    nature: '"자연 속에서 천천히 회복해." 자연 회복형입니다.',
    neutral: '"아무것도 안 하고 비워야 충전돼." 고요 회복형입니다.',
  };

  const isSameFamily = fA === fB;

  // archetype 오버라이드 적용
  const effectiveRestMap = applyOverride(restPersonMap, archetypeOverride?.rest);
  const effectiveConflictMap = applyOverride(conflictPersonMap, archetypeOverride?.conflict);
  const restDesc = archetypeOverride?.restDescription
    ? (isSameFamily ? '두 사람의 휴식 방식이 비슷합니다.' : archetypeOverride.restDescription) + (shapeRhythmDesc ? ' ' + shapeRhythmDesc : '')
    : (isSameFamily ? '두 사람의 휴식 방식이 비슷합니다.' : '두 사람이 쉬는 방식이 다릅니다.') + (shapeRhythmDesc ? ' ' + shapeRhythmDesc : '');
  const conflictDesc = archetypeOverride?.conflictDescription
    ? (isSameFamily ? '갈등 후 두 사람의 반응 방식이 비슷합니다.' : archetypeOverride.conflictDescription)
    : (isSameFamily ? '갈등 후 두 사람의 반응 방식이 비슷합니다.' : '갈등 후 두 사람의 반응 방식이 다릅니다.');

  return {
    finance: {
      title: isSameFamily ? '재정 스타일' : '재정 스타일 차이',
      description: isSameFamily
        ? '두 사람의 소비 방식이 비슷합니다. 같은 성향이 만나면 서로의 소비 패턴이 강화되는 순간이 생길 수 있습니다.'
        : '두 사람의 소비 기준과 재정 관리 방식이 다릅니다.',
      personA: financePersonMap[fA] + shapeFinanceNote(fA, shapeA),
      personB: financePersonMap[fB] + shapeFinanceNote(fB, shapeB),
      tension: isSameFamily
        ? '두 사람 모두 비슷한 소비 성향이 있어, 서로의 패턴이 강화되는 순간을 주의하세요. 함께 기준을 정하는 것이 도움이 됩니다.'
        : '소비 기준이 달라 "왜 이걸 샰어?"가 반복될 수 있습니다. 함께 기준을 정하는 것이 도움이 됩니다.',
    },
    rest: {
      title: '휴식·회복 방식',
      description: restDesc,
      personA: effectiveRestMap[fA] + shapeRestNote(fA, shapeA),
      personB: effectiveRestMap[fB] + shapeRestNote(fB, shapeB),
      tension: isSameFamily
        ? '두 사람 모두 비슷한 휴식 패턴이 있어 서로의 성향이 강화되는 순간을 주의하세요. 가끔 다른 방식으로 함께 충전하는 시간을 만들어보세요.'
        : '쉬는 방식이 달라 "같이 있어도 따로 쉬는 느낌"이 생길 수 있습니다.',
    },
    conflict: {
      title: '갈등 직후 반응',
      description: conflictDesc,
      personA: effectiveConflictMap[fA] + shapeConflictNote(fA, shapeA),
      personB: effectiveConflictMap[fB] + shapeConflictNote(fB, shapeB),
      tip: isSameFamily
        ? '두 사람의 갈등 반응 방식이 비슷하기 때문에 서로의 패턴이 강화될 수 있습니다. 한 사람이 먼저 다른 방식으로 다가가는 것이 중요합니다.'
        : '서로의 갈등 반응 방식이 다름을 인정하는 것이 첫 번째 단계입니다.',
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  경량 Archetype 시스템 (친구 / 부모자녀 / 형제자매 / 동료)
// ═══════════════════════════════════════════════════════════════════════════

export interface LightArchetypeResult {
  /** 유형 이름 */
  typeName: string;
  /** 유형 대표 컬러 (카드 배경/배지에 사용) */
  accentColor?: string;
  /** 관계 에너지 맞춤 보완 컬러 (1~2개) */
  recommendedColors?: { id: string; korName: string; hex: string; reason: string }[];
  /** 한 줄 핵심 요약 */
  coreSummary: string;
  /** 이 관계의 핵심 흐름 설명 */
  description: string;
  /** 이 관계에서 자주 생기는 오해 패턴 */
  misunderstandingPattern: string;
  /** 연결 방식 */
  connectionStyle: string;
  /** 대화 루틴 */
  conversationRoutine: string;
  /** 관계 회복 루틴 */
  recoveryRoutine: string;
  /** 이 관계가 오래가는 이유 */
  relationStrength: string;
  /** 마무리 메시지 */
  closingMessage: string;
  /** 함께하면 좋은 루틴 (관계 유형별 분리) */
  togetherRoutine?: {
    routines: string[];
    energyNote: string;
    faithRoutine?: string;
  };
}

// ─── 친구 5유형 ─────────────────────────────────────────────────────────────
type FriendArchetype =
  | '편안한공감형'
  | '거리존중형'
  | '감정교류형'
  | '오래가는안정형'
  | '자극성장형'
  | '장난티키타카형'
  | '프로젝트동반형'
  | '온도차형';

const FRIEND_ARCHETYPE_DATA: Record<FriendArchetype, LightArchetypeResult> = {
  편안한공감형: {
    typeName: '편안한 공감형 우정',
    accentColor: '#C47E8A',
    recommendedColors: [
      { id: 'rose', korName: '로즈', hex: '#C47E8A', reason: '말하지 않아도 통하는 따뜻한 공감 에너지입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '편안하고 자연스러운 연결을 지속시켜주는 컬러입니다.' },
    ],
    coreSummary: '말하지 않아도 통하는 사이, 그것이 이 우정의 가장 큰 힘입니다.',
    description: '두 사람은 서로의 감정을 자연스럽게 읽어내는 흐름이 있습니다. 말이 많지 않아도 편안하고, 함께 있는 것만으로 충분한 관계입니다. 다만 서로 너무 배려하다 보면 정작 하고 싶은 말을 못 하는 순간이 생길 수 있습니다.',
    misunderstandingPattern: '배려하느라 솔직한 말을 참다가 나중에 서운함이 쌓이는 패턴이 있습니다.',
    connectionStyle: '조용히 옆에 있어주는 것, 말 없이 함께 있는 시간이 이 우정의 연결 방식입니다.',
    conversationRoutine: '하루 중 기억나는 순간 하나씩 나누기 / 서로 "요즘 어때?" 한 마디로 시작하기',
    recoveryRoutine: '어색해지면 평소처럼 연락하기 / 굳이 설명하지 않아도 다시 연결되는 흐름 믿기',
    relationStrength: '서로를 판단하지 않는 편안함이 이 우정의 가장 큰 자산입니다. 오래 함께할수록 더 자연스러워지는 관계입니다.',
    closingMessage: '이 우정은 말이 많지 않아도 따뜻합니다. 편안함이 진심이라는 것을 두 사람 모두 알고 있습니다.',
    togetherRoutine: {
      routines: [
        '산책하면서 요즘 이야기 나누기',
        '카페에서 근황 채우기',
        '좋아하는 음악이나 책 공유하기',
        '힘든 일 생기면 먼저 연락하기',
        '각자의 휴식 시간 존중하기',
      ],
      energyNote: '말하지 않아도 편안한 사이일수록, 조용히 함께 있는 시간이 이 우정의 에너지를 살려줍니다.',
    },
  },
  거리존중형: {
    typeName: '거리 존중형 우정',
    accentColor: '#3A5A8C',
    recommendedColors: [
      { id: 'deep_blue', korName: '딥블루', hex: '#3A5A8C', reason: '서로의 공간을 존중하는 조용한 신뢰의 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '거리를 두면서도 연결을 유지하는 호흡의 컬러입니다.' },
    ],
    coreSummary: '각자의 공간을 지키면서도 필요할 때 곁에 있는 관계입니다.',
    description: '두 사람은 서로의 독립적인 시간과 공간을 존중하는 흐름이 있습니다. 자주 연락하지 않아도 멀어진 것이 아니고, 다시 만나면 바로 연결되는 관계입니다. 다만 한 사람이 더 자주 연락을 원할 때 온도 차이가 느껴질 수 있습니다.',
    misunderstandingPattern: '연락이 뜸해지면 "나한테 관심이 없나?"라고 오해할 수 있습니다.',
    connectionStyle: '강요 없이 서로의 페이스를 맞추는 것, 다시 만날 때 자연스럽게 이어지는 흐름이 연결 방식입니다.',
    conversationRoutine: '연락 없이 지내다가 생각날 때 먼저 연락하기 / 만나면 근황 나누기',
    recoveryRoutine: '거리가 생겨도 먼저 "잘 지내?" 한 마디로 다시 연결하기',
    relationStrength: '서로의 공간을 존중하면서도 다시 연결될 수 있다는 신뢰가 이 우정의 힘입니다.',
    closingMessage: '자주 만나지 않아도 마음속에 있는 관계가 있습니다. 이 우정이 그런 관계입니다.',
    togetherRoutine: {
      routines: [
        '생각날 때 먼저 연락하기',
        '만나면 바로 연결되는 장소 찾기',
        '각자의 시간을 충분히 지낸 후 다시 만나기',
        '연락 없어도 멀어진 게 아니라는 것 서로 알기',
      ],
      energyNote: '자주 연락하지 않아도 다시 만나면 바로 연결되는 것, 그것이 이 우정의 가장 큰 에너지입니다.',
    },
  },
  감정교류형: {
    typeName: '감정 교류형 우정',
    accentColor: '#9B5EA8',
    recommendedColors: [
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '감정을 나누고 공감받는 따뜻한 연결의 컬러입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '감정 파도를 부드럽게 받아주는 공감 에너지입니다.' },
    ],
    coreSummary: '감정을 솔직하게 나눌 수 있는 사이, 그것이 이 우정의 핵심입니다.',
    description: '두 사람은 감정을 나누는 것이 자연스러운 흐름입니다. 기쁨도 슬픔도 함께 느끼고, 서로의 감정에 진심으로 반응하는 관계입니다. 다만 감정의 파도가 클 때 서로에게 부담이 될 수 있습니다.',
    misunderstandingPattern: '감정을 많이 나누다 보면 한 사람이 에너지를 더 많이 쓰는 불균형이 생길 수 있습니다.',
    connectionStyle: '감정을 솔직하게 표현하고 공감받는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '오늘 기분 어때? 한 마디로 시작하기 / 힘든 일 생기면 먼저 연락하기',
    recoveryRoutine: '서운한 감정이 생기면 바로 이야기하기 / 공감 먼저, 해결은 나중에',
    relationStrength: '감정을 숨기지 않아도 되는 관계, 그것이 이 우정의 가장 큰 선물입니다.',
    closingMessage: '서로의 감정을 진심으로 받아주는 사람이 있다는 것, 그것만으로도 충분합니다.',
    togetherRoutine: {
      routines: [
        '오늘 기분 어때? 한 마디로 시작하기',
        '힘든 일 생기면 먼저 연락하기',
        '감정 오래 쌓기 전에 말하기',
        '공감 먼저, 해결은 나중에',
        '서로의 휴식이 필요할 때 알려주기',
      ],
      energyNote: '감정을 숨기지 않아도 되는 사이일수록, 서로에게 에너지를 주는 시간이 이 우정을 살려줍니다.',
    },
  },
  오래가는안정형: {
    typeName: '오래가는 안정형 우정',
    accentColor: '#8A7B6A',
    recommendedColors: [
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '시간이 쌓인 신뢰와 안정을 담은 컬러입니다.' },
      { id: 'olive', korName: '올리브', hex: '#8A9A6A', reason: '오래된 우정의 깊이와 자연스러움을 표현하는 컬러입니다.' },
    ],
    coreSummary: '시간이 지날수록 더 편안해지는, 오래된 나무 같은 우정입니다.',
    description: '두 사람은 오랜 시간을 함께하며 쌓인 신뢰가 있습니다. 특별한 이벤트 없이도 함께 있는 것이 자연스럽고, 서로의 변화를 가장 가까이서 지켜본 관계입니다. 다만 익숙함이 당연함이 되지 않도록 가끔은 감사를 표현하는 것이 필요합니다.',
    misunderstandingPattern: '너무 익숙해져서 서로에게 소홀해지거나 당연하게 여기는 순간이 생길 수 있습니다.',
    connectionStyle: '함께한 시간과 공유된 기억이 이 우정의 연결 방식입니다.',
    conversationRoutine: '오래된 추억 이야기하기 / 요즘 달라진 것 나누기',
    recoveryRoutine: '멀어진 느낌이 들면 함께했던 장소 다시 가보기 / 예전처럼 연락하기',
    relationStrength: '세월이 쌓인 관계는 쉽게 흔들리지 않습니다. 이 우정은 시간이 증명한 관계입니다.',
    closingMessage: '오래된 우정은 새로운 설렘은 없어도, 어떤 관계보다 깊은 안정감을 줍니다.',
    togetherRoutine: {
      routines: [
        '오래된 장소에 다시 가보기',
        '예전 이야기 꺼내며 웃기',
        '서로의 변화를 진심으로 인정해주기',
        '오래된 습관으로 연락하기',
        '서로의 삶을 응원하기',
      ],
      energyNote: '시간이 쌓인 우정일수록, 작은 연락이나 오래된 장소에서의 만남이 이 관계의 에너지를 유지합니다.',
    },
  },
  자극성장형: {
    typeName: '자극 성장형 우정',
    accentColor: '#D4603A',
    recommendedColors: [
      { id: 'coral', korName: '코랄', hex: '#D4603A', reason: '서로를 자극하고 성장시키는 활력의 컬러입니다.' },
      { id: 'deep_navy', korName: '딥네이비', hex: '#2C3E6A', reason: '성장 에너지를 안정적으로 담아주는 깊이의 컬러입니다.' },
    ],
    coreSummary: '서로를 더 나은 사람으로 만드는 우정, 편안하지만 자극이 있습니다.',
    description: '두 사람은 서로에게 긍정적인 자극을 주는 흐름이 있습니다. 대화를 나누면 새로운 생각이 생기고, 함께 있으면 더 성장하고 싶어지는 관계입니다. 다만 경쟁심이나 비교가 생기지 않도록 서로를 응원하는 방향을 유지하는 것이 중요합니다.',
    misunderstandingPattern: '서로의 성장을 응원하다가 어느 순간 비교하거나 경쟁하는 느낌이 생길 수 있습니다.',
    connectionStyle: '서로의 목표와 성장을 공유하고 응원하는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '요즘 하고 있는 것 나누기 / 서로의 꿈과 목표 이야기하기',
    recoveryRoutine: '경쟁 느낌이 생기면 "나는 네가 잘 됐으면 좋겠어"라고 솔직하게 말하기',
    relationStrength: '서로를 더 나은 방향으로 이끄는 우정은 드뭅니다. 이 관계가 그런 우정입니다.',
    closingMessage: '함께 성장하는 친구가 있다는 것은 삶에서 가장 큰 선물 중 하나입니다.',
    togetherRoutine: {
      routines: [
        '요즘 하고 있는 것 나누기',
        '서로의 꿈과 목표 이야기하기',
        '새로운 것 함께 시도해보기',
        '서로의 성장을 진심으로 응원하기',
        '경쟁 느낌이 생기면 솔직하게 말하기',
      ],
      energyNote: '서로를 더 나은 방향으로 이끄는 대화가 이 우정의 에너지입니다.',
    },
  },
  장난티키타카형: {
    typeName: '장난 티키타카형 우정',
    accentColor: '#F5A623',
    recommendedColors: [
      { id: 'yellow', korName: '옐로우', hex: '#F5C842', reason: '유쾌하고 활기찬 에너지를 담은 컬러입니다.' },
      { id: 'coral', korName: '코랄', hex: '#D4603A', reason: '장난기와 활력을 살려주는 컬러입니다.' },
    ],
    coreSummary: '말이 오가는 것 자체가 즐거운, 리듬이 있는 우정입니다.',
    description: '두 사람은 대화 자체가 에너지가 되는 흐름이 있습니다. 장난을 주고받고, 말이 빠르게 오가며, 함께 있으면 자연스럽게 웃음이 나옵니다. 진지한 이야기도 가볍게 풀어내는 능력이 이 우정의 강점입니다.',
    misunderstandingPattern: '장난이 선을 넘거나, 한쪽이 진지할 때 상대가 장난으로 받아치면 상처가 될 수 있습니다.',
    connectionStyle: '유머와 장난으로 연결되지만, 진지한 순간에는 진지하게 받아주는 것이 이 우정의 균형입니다.',
    conversationRoutine: '오늘 웃긴 일 하나씩 나누기 / 서로 놀리면서도 응원하기',
    recoveryRoutine: '장난이 선을 넘었다면 "그건 좀 심했어"라고 솔직하게 말하기 / 바로 사과하고 다시 웃기',
    relationStrength: '함께 있으면 자연스럽게 에너지가 올라가는 관계입니다. 이 유쾌함이 이 우정의 가장 큰 자산입니다.',
    closingMessage: '웃음이 많은 우정은 삶을 가볍게 만들어줍니다. 이 관계가 그런 선물입니다.',
    togetherRoutine: {
      routines: [
        '오늘 웃긴 일 하나씩 나누기',
        '서로 놀리면서도 응원하기',
        '새로운 장소나 경험 함께 시도하기',
        '진지한 순간엔 진지하게 받아주기',
        '장난이 선 넘으면 바로 말하기',
      ],
      energyNote: '함께 있으면 자연스럽게 웃음이 나오는 것, 그것이 이 우정의 에너지를 살려줍니다.',
    },
  },
  프로젝트동반형: {
    typeName: '프로젝트 동반형 우정',
    accentColor: '#4A7C59',
    recommendedColors: [
      { id: 'green', korName: '그린', hex: '#4A7C59', reason: '함께 무언가를 만들어가는 성장의 컬러입니다.' },
      { id: 'deep_navy', korName: '딥네이비', hex: '#2C3E6A', reason: '집중과 신뢰를 담은 컬러입니다.' },
    ],
    coreSummary: '함께 무언가를 만들어갈 때 가장 빛나는 우정입니다.',
    description: '두 사람은 공통의 목표나 관심사가 있을 때 가장 잘 연결됩니다. 함께 프로젝트를 진행하거나, 같은 것을 배우거나, 공통의 관심사를 나눌 때 이 우정이 가장 생동감 있습니다. 일상적인 감정 교류보다 함께 하는 활동이 연결의 언어입니다.',
    misunderstandingPattern: '공통 활동이 없어지면 연결이 약해지는 느낌이 들 수 있습니다. 활동 외의 연결도 만들어가는 것이 필요합니다.',
    connectionStyle: '공통의 관심사나 목표를 함께 추구하는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '요즘 관심 있는 것 나누기 / 함께 해보고 싶은 것 이야기하기',
    recoveryRoutine: '멀어진 느낌이 들면 함께 할 수 있는 것 하나 제안하기',
    relationStrength: '공통의 관심사로 연결된 우정은 서로를 성장시킵니다. 이 관계가 그런 힘을 가지고 있습니다.',
    closingMessage: '함께 무언가를 만들어가는 친구가 있다는 것은 삶을 더 풍요롭게 만듭니다.',
    togetherRoutine: {
      routines: [
        '요즘 관심 있는 것 나누기',
        '함께 해보고 싶은 것 하나 정하기',
        '서로의 작업이나 프로젝트 응원하기',
        '새로운 것 함께 배워보기',
        '공통 관심사로 정기적으로 만나기',
      ],
      energyNote: '함께 무언가를 만들거나 배우는 시간이 이 우정의 에너지를 가장 크게 살려줍니다.',
    },
  },
  온도차형: {
    typeName: '온도차형 우정',
    accentColor: '#7B8FA1',
    recommendedColors: [
      { id: 'blue', korName: '블루', hex: '#4A7FA8', reason: '서로 다른 온도를 조율하는 차분한 컬러입니다.' },
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '온도 차이를 부드럽게 연결해주는 컬러입니다.' },
    ],
    coreSummary: '온도가 다르지만, 그 차이가 오히려 균형을 만드는 우정입니다.',
    description: '한 사람은 더 적극적으로 연결을 원하고, 다른 사람은 더 조용히 있고 싶어하는 흐름이 있습니다. 이 온도 차이가 때로는 한쪽이 더 많이 노력하는 느낌을 만들 수 있습니다. 서로의 리듬을 이해하고 맞춰가는 것이 이 우정의 과제입니다.',
    misunderstandingPattern: '적극적인 쪽은 "왜 나만 연락해?"라고 느끼고, 조용한 쪽은 "왜 이렇게 부담스럽게 하지?"라고 느낄 수 있습니다.',
    connectionStyle: '서로의 연결 방식이 다르다는 것을 인정하고, 중간 지점을 찾아가는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '"나는 자주 연락하는 게 좋아" / "나는 각자 시간이 필요해" 솔직하게 말하기',
    recoveryRoutine: '한쪽이 지쳤다면 솔직하게 "요즘 좀 힘들어서 연락이 줄었어"라고 말하기',
    relationStrength: '온도가 다른 두 사람이 만나면 서로에게 없는 것을 채워줄 수 있습니다. 이 차이가 이 우정의 강점입니다.',
    closingMessage: '완벽히 같은 온도의 친구는 없습니다. 서로의 온도를 이해하는 것이 이 우정을 오래가게 합니다.',
    togetherRoutine: {
      routines: [
        '연락 빈도에 대해 솔직하게 이야기하기',
        '만날 때 서로의 리듬 존중하기',
        '한쪽이 지쳤다면 솔직하게 말하기',
        '서로의 연결 방식이 다르다는 것 인정하기',
        '중간 지점 찾아가기',
      ],
      energyNote: '서로의 온도 차이를 이해하고 중간 지점을 찾아가는 것, 그것이 이 우정을 오래 유지하는 에너지입니다.',
    },
  },
};

// ─── 부모자녀 6유형 ──────────────────────────────────────────────────────────
type ParentChildArchetype =
  | '보호자형'
  | '기대압박형'
  | '정서연결형'
  | '성장지원형'
  | '표현서툼형'
  | '거리조율형';

const PARENT_CHILD_ARCHETYPE_DATA: Record<ParentChildArchetype, LightArchetypeResult> = {
  보호자형: {
    typeName: '보호자형 관계',
    accentColor: '#7B5E3A',
    recommendedColors: [
      { id: 'brown', korName: '브라운', hex: '#7B5E3A', reason: '보호와 신뢰를 담은 따뜻한 안정의 컬러입니다.' },
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '역할 교환과 상호 돌봄을 지지하는 컬러입니다.' },
    ],
    coreSummary: '사랑이 보호의 언어로 표현되는 관계입니다.',
    description: '한 사람의 깊은 사랑이 보호와 배려의 형태로 나타나는 흐름입니다. 상대를 지키고 싶은 마음이 크지만, 때로는 그 마음이 통제나 간섭으로 느껴질 수 있습니다. 보호하는 사람도, 보호받는 사람도 서로의 마음을 이해하는 것이 필요합니다.',
    misunderstandingPattern: '사랑에서 나온 보호가 "간섭"이나 "통제"로 느껴지는 순간이 생길 수 있습니다.',
    connectionStyle: '걱정과 배려를 표현하되, 상대의 선택을 존중하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '걱정 대신 "어떻게 하고 싶어?" 먼저 묻기 / 결과보다 과정 응원하기',
    recoveryRoutine: '거리가 생기면 "나는 네가 잘 됐으면 해서 그랬어"라고 솔직하게 말하기',
    relationStrength: '깊은 사랑이 이 관계의 뿌리입니다. 표현 방식을 조금씩 조율하면 이 관계는 더 따뜻해집니다.',
    closingMessage: '사랑의 방식이 달라도, 마음의 방향은 같습니다. 그것이 이 관계의 가장 큰 힘입니다.',
  },
  기대압박형: {
    typeName: '기대 압박형 관계',
    accentColor: '#3A5A8C',
    recommendedColors: [
      { id: 'deep_blue', korName: '딥블루', hex: '#3A5A8C', reason: '기대와 압박 속에서 서로를 이해하는 깊이의 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '긴장을 완화하고 호흡을 찾게 해주는 컬러입니다.' },
    ],
    coreSummary: '기대가 사랑의 언어이지만, 때로는 무게가 되는 관계입니다.',
    description: '한 사람의 기대가 다른 사람에게 동기가 되기도 하고, 부담이 되기도 하는 흐름입니다. 기대하는 사람은 사랑의 표현으로 기대를 전하지만, 받는 사람은 그 무게를 느낄 수 있습니다. 기대를 응원으로 바꾸는 연습이 필요한 관계입니다.',
    misunderstandingPattern: '기대가 크면 클수록 실망도 커지고, 그 실망이 관계를 차갑게 만들 수 있습니다.',
    connectionStyle: '기대 대신 "지금 이대로도 충분해"라는 메시지를 전달하는 것이 연결 방식입니다.',
    conversationRoutine: '"잘 해야 해"보다 "어떻게 하고 싶어?" 먼저 묻기 / 결과보다 노력 인정하기',
    recoveryRoutine: '압박감이 생기면 솔직하게 "조금 힘들어"라고 말하기 / 기대를 줄이고 응원으로 바꾸기',
    relationStrength: '기대의 뿌리는 사랑입니다. 그 사랑을 더 부드러운 방식으로 표현하면 이 관계는 더 가까워집니다.',
    closingMessage: '기대보다 응원이, 평가보다 인정이 이 관계를 더 따뜻하게 만듭니다.',
  },
  정서연결형: {
    typeName: '정서 연결형 관계',
    accentColor: '#C47E8A',
    recommendedColors: [
      { id: 'rose', korName: '로즈', hex: '#C47E8A', reason: '정서적 연결과 따뜻한 유대를 담은 컬러입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '감정을 나누는 따뜻한 가족 에너지입니다.' },
    ],
    coreSummary: '감정을 함께 나눌 수 있는, 세대를 넘은 따뜻한 연결입니다.',
    description: '두 사람은 감정을 자연스럽게 나누는 흐름이 있습니다. 세대 차이가 있어도 서로의 감정을 이해하고 공감하는 능력이 이 관계의 강점입니다. 감정 표현이 자유로운 관계일수록 서로를 더 깊이 이해할 수 있습니다.',
    misunderstandingPattern: '감정 표현 방식이 달라 "왜 저렇게 반응하지?"라고 오해할 수 있습니다.',
    connectionStyle: '서로의 감정을 판단하지 않고 들어주는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '오늘 기분 어땠어? 한 마디로 시작하기 / 감정 먼저 공감하고 조언은 나중에',
    recoveryRoutine: '감정이 상하면 시간을 두고 "그때 내 마음은 이랬어"라고 차분하게 이야기하기',
    relationStrength: '감정을 나눌 수 있는 부모자녀 관계는 드뭅니다. 이 관계의 정서적 연결이 가장 큰 자산입니다.',
    closingMessage: '세대가 달라도 마음이 통하는 관계, 그것이 이 관계의 가장 특별한 부분입니다.',
  },
  성장지원형: {
    typeName: '성장 지원형 관계',
    accentColor: '#6B8A5A',
    recommendedColors: [
      { id: 'olive', korName: '올리브', hex: '#8A9A6A', reason: '성장과 지원을 담은 자연스러운 에너지입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '따뜻한 응원과 연결을 표현하는 컬러입니다.' },
    ],
    coreSummary: '한 사람의 성장을 진심으로 응원하는 관계입니다.',
    description: '한 사람이 다른 사람의 성장을 진심으로 지원하는 흐름이 있습니다. 방향을 제시하되 강요하지 않고, 선택을 존중하면서도 곁에 있어주는 관계입니다. 지원하는 사람의 따뜻한 존재감이 이 관계의 핵심입니다.',
    misunderstandingPattern: '지원이 지나치면 "내가 스스로 할 수 없나?"라는 느낌을 줄 수 있습니다.',
    connectionStyle: '방향을 제시하되 선택은 상대에게 맡기는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '"네가 원하는 게 뭐야?" 먼저 묻기 / 결과보다 과정을 함께 이야기하기',
    recoveryRoutine: '거리가 생기면 "나는 네 편이야"라고 먼저 표현하기',
    relationStrength: '진심 어린 응원이 이 관계의 가장 큰 힘입니다. 방향보다 존재가 더 중요한 관계입니다.',
    closingMessage: '곁에서 응원해주는 사람이 있다는 것만으로도 더 멀리 나아갈 수 있습니다.',
  },
  표현서툼형: {
    typeName: '표현 서툰 관계',
    accentColor: '#8A7B6A',
    recommendedColors: [
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '말 없이도 전해지는 마음을 담은 컬러입니다.' },
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '서툰 표현 뒤의 깊은 감정을 담아주는 컬러입니다.' },
    ],
    coreSummary: '마음은 크지만 표현이 서툰, 그래서 더 오해가 생기는 관계입니다.',
    description: '두 사람 모두 마음이 크지만 표현하는 방식이 서툰 흐름이 있습니다. 사랑하지만 "사랑해"라는 말이 어색하고, 고마워도 표현하기 어려운 관계입니다. 작은 행동과 표현이 이 관계를 더 따뜻하게 만들 수 있습니다.',
    misunderstandingPattern: '표현이 없어서 "관심이 없나?"라고 오해하는 순간이 자주 생깁니다.',
    connectionStyle: '말보다 행동으로 마음을 전하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '작은 것이라도 "고마워", "잘했어" 말하기 / 말이 어색하면 문자로 표현하기',
    recoveryRoutine: '어색함이 쌓이면 함께 식사하거나 드라이브하며 자연스럽게 대화하기',
    relationStrength: '표현이 서툴어도 마음이 깊은 관계입니다. 조금씩 표현을 연습하면 이 관계는 더 따뜻해집니다.',
    closingMessage: '말하지 않아도 알 것 같지만, 말로 표현할 때 관계는 더 깊어집니다.',
  },
  거리조율형: {
    typeName: '거리 조율형 관계',
    accentColor: '#5B8FBF',
    recommendedColors: [
      { id: 'sky_blue', korName: '스카이블루', hex: '#5B8FBF', reason: '거리를 조율하며 연결을 유지하는 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '자연스러운 거리감과 호흡의 컬러입니다.' },
    ],
    coreSummary: '적당한 거리가 이 관계를 더 건강하게 만드는 흐름입니다.',
    description: '두 사람은 서로의 공간과 독립성을 존중하는 흐름이 있습니다. 너무 가까우면 불편하고, 너무 멀면 외로운 관계입니다. 서로에게 맞는 거리를 찾아가는 과정이 이 관계의 핵심입니다.',
    misunderstandingPattern: '거리를 두면 "나를 피하나?"라고 오해하거나, 너무 가까우면 숨막힌다는 느낌이 생길 수 있습니다.',
    connectionStyle: '서로에게 맞는 거리를 대화로 조율하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '"요즘 어때?" 가볍게 묻기 / 서로의 공간을 인정하면서 연결 유지하기',
    recoveryRoutine: '거리가 너무 멀어지면 먼저 연락하기 / 너무 가까워지면 "나 오늘은 혼자 있고 싶어"라고 솔직하게 말하기',
    relationStrength: '서로의 공간을 존중하면서도 연결을 유지하는 것이 이 관계의 가장 성숙한 부분입니다.',
    closingMessage: '적당한 거리가 관계를 더 오래 유지하게 합니다. 이 관계는 그 균형을 찾아가고 있습니다.',
  },
};

// ─── 형제자매 5유형 ──────────────────────────────────────────────────────────
type SiblingArchetype =
  | '친구형형제자매'
  | '보호형형제자매'
  | '거리유지형형제자매'
  | '감정공유형형제자매'
  | '경쟁성장형형제자매';

const SIBLING_ARCHETYPE_DATA: Record<SiblingArchetype, LightArchetypeResult> = {
  친구형형제자매: {
    typeName: '친구형 형제자매',
    accentColor: '#E8A05A',
    recommendedColors: [
      { id: 'peach_orange', korName: '피치오렌지', hex: '#E8A05A', reason: '친구처럼 편안하고 따뜻한 형제자매 연결의 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '자연스럽고 편안한 관계 에너지를 담은 컬러입니다.' },
    ],
    coreSummary: '가족이면서 친구인, 가장 편안한 관계입니다.',
    description: '두 사람은 가족이지만 친구처럼 편안한 흐름이 있습니다. 격식 없이 솔직하게 이야기할 수 있고, 함께 있으면 자연스럽게 웃음이 나오는 관계입니다. 가족의 깊이와 친구의 편안함을 동시에 가진 관계입니다.',
    misunderstandingPattern: '너무 편해서 상처가 되는 말을 무심코 하는 순간이 생길 수 있습니다.',
    connectionStyle: '편안하게 솔직하게 이야기하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '요즘 어때? 가볍게 묻기 / 재미있는 것 함께 찾기',
    recoveryRoutine: '서운한 일이 생기면 "그 말이 조금 상처였어"라고 솔직하게 말하기',
    relationStrength: '가족이면서 친구인 관계는 드뭅니다. 이 관계의 편안함과 솔직함이 가장 큰 자산입니다.',
    closingMessage: '가장 가까운 사람이 가장 편안한 친구이기도 한 것, 그것이 이 관계의 선물입니다.',
  },
  보호형형제자매: {
    typeName: '보호형 형제자매',
    accentColor: '#7B5E3A',
    recommendedColors: [
      { id: 'brown', korName: '브라운', hex: '#7B5E3A', reason: '보호와 신뢰를 담은 따뜻한 형제자매 에너지입니다.' },
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '역할 교환과 상호 돌봄을 지지하는 컬러입니다.' },
    ],
    coreSummary: '한 사람이 다른 사람을 지키려는 마음이 강한 관계입니다.',
    description: '한 사람의 보호하려는 마음이 이 관계를 이끄는 흐름이 있습니다. 형제자매 중 한 사람이 더 많이 배려하고 챙기는 역할을 하는 경우가 많습니다. 보호받는 사람도 자신의 마음을 표현하는 것이 이 관계를 더 균형 있게 만듭니다.',
    misunderstandingPattern: '보호하려는 마음이 "왜 나를 어린아이 취급해?"라는 느낌을 줄 수 있습니다.',
    connectionStyle: '보호하되 상대의 독립성을 존중하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '"내가 도와줄까?" 먼저 묻기 / 상대가 원하는 것 확인하기',
    recoveryRoutine: '역할 불균형이 느껴지면 솔직하게 이야기하기',
    relationStrength: '서로를 지키려는 마음이 이 관계의 가장 깊은 뿌리입니다.',
    closingMessage: '형제자매 사이의 보호는 세상 어떤 관계보다 깊은 사랑에서 나옵니다.',
  },
  거리유지형형제자매: {
    typeName: '거리 유지형 형제자매',
    accentColor: '#3A5A8C',
    recommendedColors: [
      { id: 'deep_blue', korName: '딥블루', hex: '#3A5A8C', reason: '서로의 공간을 존중하는 조용한 신뢰의 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '거리를 두면서도 연결을 유지하는 호흡의 컬러입니다.' },
    ],
    coreSummary: '가족이지만 각자의 공간을 존중하는 성숙한 관계입니다.',
    description: '두 사람은 가족이지만 서로의 독립적인 삶을 존중하는 흐름이 있습니다. 자주 연락하지 않아도 필요할 때 곁에 있을 수 있는 관계입니다. 가족이라는 이유로 너무 가까워지려 하지 않는 것이 오히려 이 관계를 건강하게 유지합니다.',
    misunderstandingPattern: '연락이 뜸하면 "가족인데 왜 이렇게 멀어?"라고 서운함이 생길 수 있습니다.',
    connectionStyle: '서로의 삶을 존중하면서도 중요한 순간에 함께하는 것이 연결 방식입니다.',
    conversationRoutine: '명절이나 특별한 날 연락하기 / 중요한 일 생기면 먼저 알리기',
    recoveryRoutine: '거리가 너무 멀어지면 "요즘 어때?" 한 마디로 다시 연결하기',
    relationStrength: '각자의 삶을 존중하면서도 가족이라는 연결을 유지하는 것이 이 관계의 성숙함입니다.',
    closingMessage: '자주 보지 않아도 마음속에 있는 관계, 그것이 형제자매의 특별함입니다.',
  },
  감정공유형형제자매: {
    typeName: '감정 공유형 형제자매',
    accentColor: '#C47E8A',
    recommendedColors: [
      { id: 'rose', korName: '로즈', hex: '#C47E8A', reason: '감정을 나누는 따뜻한 형제자매 연결의 컬러입니다.' },
      { id: 'peach', korName: '피치', hex: '#F4A882', reason: '공감과 친밀함을 담은 따뜻한 에너지입니다.' },
    ],
    coreSummary: '가족 안에서 감정을 가장 솔직하게 나눌 수 있는 관계입니다.',
    description: '두 사람은 가족 안에서 감정을 자유롭게 나누는 흐름이 있습니다. 기쁨도 슬픔도 함께 느끼고, 서로의 감정에 진심으로 반응하는 관계입니다. 가족이기에 더 솔직하게, 더 깊이 연결될 수 있습니다.',
    misunderstandingPattern: '감정을 너무 솔직하게 표현하다가 상처를 주거나 받는 순간이 생길 수 있습니다.',
    connectionStyle: '감정을 솔직하게 나누되 서로의 감정을 존중하는 것이 연결 방식입니다.',
    conversationRoutine: '오늘 기분 어때? 가볍게 묻기 / 힘든 일 생기면 먼저 연락하기',
    recoveryRoutine: '감정이 상하면 시간을 두고 "그때 나는 이런 마음이었어"라고 이야기하기',
    relationStrength: '감정을 나눌 수 있는 형제자매 관계는 삶에서 가장 큰 지지대가 됩니다.',
    closingMessage: '가장 가까운 가족에게 감정을 솔직하게 나눌 수 있다는 것은 큰 선물입니다.',
  },
  경쟁성장형형제자매: {
    typeName: '경쟁 성장형 형제자매',
    accentColor: '#D4603A',
    recommendedColors: [
      { id: 'coral', korName: '코랄', hex: '#D4603A', reason: '경쟁 속에서도 서로를 성장시키는 활력의 컬러입니다.' },
      { id: 'deep_navy', korName: '딥네이비', hex: '#2C3E6A', reason: '경쟁 에너지를 안정적으로 담아주는 컬러입니다.' },
    ],
    coreSummary: '서로를 자극하며 함께 성장하는, 긴장감 있는 관계입니다.',
    description: '두 사람은 서로에게 자극이 되는 흐름이 있습니다. 경쟁처럼 보이지만 그 안에 서로를 향한 응원이 있는 관계입니다. 비교보다 응원으로 방향을 바꾸면 이 관계는 서로를 가장 성장시키는 관계가 됩니다.',
    misunderstandingPattern: '비교나 경쟁 느낌이 생기면 "나는 왜 저렇게 못하지?"라는 자책이나 서운함이 생길 수 있습니다.',
    connectionStyle: '서로의 성장을 진심으로 응원하는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '서로의 근황과 목표 나누기 / "잘 하고 있어" 응원 한 마디 건네기',
    recoveryRoutine: '경쟁 느낌이 생기면 "나는 네가 잘 됐으면 해"라고 솔직하게 말하기',
    relationStrength: '서로를 자극하며 함께 성장하는 형제자매 관계는 삶에서 가장 강한 동반자가 됩니다.',
    closingMessage: '경쟁이 아닌 응원으로 바뀔 때, 이 관계는 서로를 가장 멀리 데려다주는 힘이 됩니다.',
  },
};

// ─── 동료 4유형 ──────────────────────────────────────────────────────────────
type ColleagueArchetype =
  | '협업균형형'
  | '역할분리형'
  | '소통중심형'
  | '에너지소모형';

const COLLEAGUE_ARCHETYPE_DATA: Record<ColleagueArchetype, LightArchetypeResult> = {
  협업균형형: {
    typeName: '협업 균형형 관계',
    accentColor: '#6B8A5A',
    recommendedColors: [
      { id: 'olive', korName: '올리브', hex: '#8A9A6A', reason: '균형 잡힌 협업과 신뢰를 담은 컬러입니다.' },
      { id: 'warm_beige', korName: '웜베이지', hex: '#C8B89A', reason: '안정적인 업무 관계를 지속시켜주는 컬러입니다.' },
    ],
    coreSummary: '서로의 역할을 존중하며 균형 있게 협업하는 관계입니다.',
    description: '두 사람은 서로의 강점을 인정하고 역할을 자연스럽게 나누는 흐름이 있습니다. 한 사람이 더 많이 하거나 적게 하는 불균형 없이, 서로의 기여를 인정하는 관계입니다. 협업이 자연스럽고 편안한 관계입니다.',
    misunderstandingPattern: '역할 분담이 명확하지 않으면 "내가 더 많이 하는 것 같은데"라는 느낌이 생길 수 있습니다.',
    connectionStyle: '서로의 기여를 인정하고 역할을 명확하게 나누는 것이 연결 방식입니다.',
    conversationRoutine: '업무 시작 전 역할 확인하기 / 마무리 후 서로의 수고 인정하기',
    recoveryRoutine: '불균형이 느껴지면 솔직하게 이야기하고 역할 재조정하기',
    relationStrength: '서로의 강점을 인정하고 균형 있게 협업하는 능력이 이 관계의 가장 큰 자산입니다.',
    closingMessage: '좋은 협업 관계는 업무를 넘어 서로에 대한 신뢰를 만들어냅니다.',
  },
  역할분리형: {
    typeName: '역할 분리형 관계',
    accentColor: '#7B5E3A',
    recommendedColors: [
      { id: 'brown', korName: '브라운', hex: '#7B5E3A', reason: '명확한 역할과 신뢰를 상징하는 컬러입니다.' },
      { id: 'deep_navy', korName: '딥네이비', hex: '#2C3E6A', reason: '전문성과 집중력을 담은 컬러입니다.' },
    ],
    coreSummary: '각자의 역할이 명확하게 분리된, 효율적인 관계입니다.',
    description: '두 사람은 서로의 역할과 영역을 명확하게 구분하는 흐름이 있습니다. 업무에서는 효율적이지만, 개인적인 연결이 부족할 수 있습니다. 역할 너머의 사람을 이해하는 것이 이 관계를 더 풍부하게 만듭니다.',
    misunderstandingPattern: '역할만 보고 사람을 보지 않으면 "우리는 그냥 일하는 사이"라는 거리감이 생길 수 있습니다.',
    connectionStyle: '역할을 존중하되 가끔은 업무 외의 대화로 연결하는 것이 이 관계의 방식입니다.',
    conversationRoutine: '업무 이야기 외에 가끔 가벼운 일상 이야기 나누기 / 점심이나 커피 함께하기',
    recoveryRoutine: '갈등이 생기면 역할과 감정을 분리해서 이야기하기',
    relationStrength: '명확한 역할 분리가 효율적인 협업을 만들고, 그 신뢰가 관계의 기반이 됩니다.',
    closingMessage: '역할이 명확한 관계는 신뢰를 만들고, 그 신뢰가 더 좋은 협업으로 이어집니다.',
  },
  소통중심형: {
    typeName: '소통 중심형 관계',
    accentColor: '#5B8FBF',
    recommendedColors: [
      { id: 'sky_blue', korName: '스카이블루', hex: '#5B8FBF', reason: '열린 소통과 신뢰를 표현하는 컬러입니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '편안한 대화 분위기를 만들어주는 컬러입니다.' },
    ],
    coreSummary: '대화와 소통이 이 관계의 가장 큰 강점입니다.',
    description: '두 사람은 소통이 자연스럽고 편안한 흐름이 있습니다. 업무 이야기도, 개인적인 이야기도 자연스럽게 나눌 수 있는 관계입니다. 소통이 잘 되는 동료 관계는 업무 효율을 높이고 직장 생활을 더 즐겁게 만듭니다.',
    misunderstandingPattern: '소통이 너무 많아지면 업무 집중이 어려워지거나 개인 공간이 침범되는 느낌이 생길 수 있습니다.',
    connectionStyle: '업무와 개인 이야기를 균형 있게 나누는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '업무 시작 전 가볍게 인사하기 / 어려운 일 생기면 먼저 이야기하기',
    recoveryRoutine: '오해가 생기면 바로 이야기하기 / 감정보다 사실 중심으로 대화하기',
    relationStrength: '소통이 잘 되는 동료 관계는 직장 생활의 가장 큰 자산입니다.',
    closingMessage: '좋은 소통은 업무를 넘어 서로를 더 잘 이해하게 만듭니다.',
  },
  에너지소모형: {
    typeName: '에너지 소모형 관계',
    accentColor: '#8A7B6A',
    recommendedColors: [
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '긴장을 완화하고 호흡을 되찾게 해주는 컬러입니다.' },
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '감정 소모를 회복시켜주는 안정의 컬러입니다.' },
    ],
    coreSummary: '함께 있으면 에너지가 소모되는 느낌이 있는 관계입니다.',
    description: '두 사람의 업무 스타일이나 소통 방식이 맞지 않아 에너지가 소모되는 흐름이 있습니다. 갈등이 잦거나 오해가 반복되는 경우가 많습니다. 서로의 방식을 이해하고 최소한의 협업 규칙을 만드는 것이 필요합니다.',
    misunderstandingPattern: '서로의 방식이 달라 "왜 저렇게 하지?"라는 답답함이 반복될 수 있습니다.',
    connectionStyle: '최소한의 명확한 소통 규칙을 만들고 지키는 것이 이 관계의 연결 방식입니다.',
    conversationRoutine: '업무 관련 소통은 명확하게 / 오해가 생기면 바로 확인하기',
    recoveryRoutine: '갈등이 생기면 감정이 아닌 업무 중심으로 이야기하기 / 필요하면 제3자 도움 받기',
    relationStrength: '어려운 관계에서도 협업을 유지하는 것 자체가 이 관계의 강점입니다.',
    closingMessage: '모든 관계가 편안할 수는 없습니다. 최소한의 존중으로 협업을 유지하는 것이 현명한 방법입니다.',
  },
};

// ─── 경량 archetype 분류 함수 ────────────────────────────────────────────────

function getFriendArchetype(familiesA: EnergyFamily[], familiesB: EnergyFamily[]): FriendArchetype {
  const domA = getDominantFamily(familiesA);
  const domB = getDominantFamily(familiesB);
  // 같은 warm_active 두 명 → 장난/티키타카형 (domA===domB 앞에 먼저 체크)
  if (domA === 'warm_active' && domB === 'warm_active') return '장난티키타카형';
  // 같은 에너지 → 편안한공감형
  if (domA === domB) return '편안한공감형';
  // warm_active ↔ cool_deep → 자극성장형
  if ((domA === 'warm_active' && domB === 'cool_deep') || (domA === 'cool_deep' && domB === 'warm_active')) return '자극성장형';
  // warm_active ↔ neutral → 프로젝트동반형 (cool_deep 분기 전에 체크)
  if ((domA === 'warm_active' && domB === 'neutral') || (domA === 'neutral' && domB === 'warm_active')) return '프로젝트동반형';
  // warm_active ↔ cool_clear → 온도차형
  if ((domA === 'warm_active' && domB === 'cool_clear') || (domA === 'cool_clear' && domB === 'warm_active')) return '온도차형';
  // cool_deep ↔ neutral → 거리존중형
  if ((domA === 'cool_deep' && domB === 'neutral') || (domA === 'neutral' && domB === 'cool_deep')) return '거리존중형';
  // warm_soft / nature 포함 → 감정교류형
  if (domA === 'warm_soft' || domB === 'warm_soft' || domA === 'nature' || domB === 'nature') return '감정교류형';
  // warm_grounded / cool_clear 포함 → 오래가는안정형
  if (domA === 'warm_grounded' || domB === 'warm_grounded' || domA === 'cool_clear' || domB === 'cool_clear') return '오래가는안정형';
  return '편안한공감형';
}

function getParentChildArchetype(familiesA: EnergyFamily[], familiesB: EnergyFamily[]): ParentChildArchetype {
  const domA = getDominantFamily(familiesA);
  const domB = getDominantFamily(familiesB);
  if (domA === domB) return '정서연결형';
  if ((domA === 'warm_active' || domB === 'warm_active') && (domA === 'cool_deep' || domB === 'cool_deep')) return '기대압박형';
  if ((domA === 'warm_grounded' || domB === 'warm_grounded')) return '보호자형';
  if ((domA === 'warm_soft' || domB === 'warm_soft') || (domA === 'nature' || domB === 'nature')) return '성장지원형';
  if ((domA === 'neutral' || domB === 'neutral') || (domA === 'cool_clear' || domB === 'cool_clear')) return '거리조율형';
  if ((domA === 'cool_deep' || domB === 'cool_deep')) return '표현서툼형';
  return '정서연결형';
}

function getSiblingArchetype(familiesA: EnergyFamily[], familiesB: EnergyFamily[]): SiblingArchetype {
  const domA = getDominantFamily(familiesA);
  const domB = getDominantFamily(familiesB);
  if (domA === domB) return '감정공유형형제자매';
  if ((domA === 'warm_active' && domB === 'warm_active')) return '경쟁성장형형제자매';
  if ((domA === 'warm_grounded' || domB === 'warm_grounded')) return '보호형형제자매';
  if ((domA === 'cool_deep' || domB === 'cool_deep') && (domA === 'neutral' || domB === 'neutral')) return '거리유지형형제자매';
  if ((domA === 'warm_soft' || domB === 'warm_soft') || (domA === 'nature' || domB === 'nature')) return '친구형형제자매';
  return '친구형형제자매';
}

function getColleagueArchetype(familiesA: EnergyFamily[], familiesB: EnergyFamily[]): ColleagueArchetype {
  const domA = getDominantFamily(familiesA);
  const domB = getDominantFamily(familiesB);
  if (domA === domB) return '소통중심형';
  if ((domA === 'warm_active' && domB === 'cool_deep') || (domA === 'cool_deep' && domB === 'warm_active')) return '에너지소모형';
  if ((domA === 'warm_grounded' || domB === 'warm_grounded') || (domA === 'cool_clear' || domB === 'cool_clear')) return '협업균형형';
  return '역할분리형';
}

/**
 * 관계 유형에 따라 경량 archetype 결과 반환
 * 연인/부부는 기존 getRelationArchetype 사용
 */
export function getLightArchetype(
  relationType: RelationType,
  familiesA: EnergyFamily[],
  familiesB: EnergyFamily[],
): LightArchetypeResult | null {
  const isFriend = relationType === '친구';
  const isParentChild = relationType === '부모-자녀' || relationType === '아빠-아들' || relationType === '아빠-딸' || relationType === '엄마-아들' || relationType === '엄마-딸';
  const isSibling = relationType === '형제자매';
  const isColleague = relationType === '동료';

  if (isFriend) {
    return FRIEND_ARCHETYPE_DATA[getFriendArchetype(familiesA, familiesB)];
  }
  if (isParentChild) {
    return PARENT_CHILD_ARCHETYPE_DATA[getParentChildArchetype(familiesA, familiesB)];
  }
  if (isSibling) {
    return SIBLING_ARCHETYPE_DATA[getSiblingArchetype(familiesA, familiesB)];
  }
  if (isColleague) {
    return COLLEAGUE_ARCHETYPE_DATA[getColleagueArchetype(familiesA, familiesB)];
  }
  // 연인/부부는 null 반환 → 기존 getRelationArchetype 사용
  return null;
}

