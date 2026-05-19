/**
 * 커플 세션 데이터 로직
 * 단순 궁합이 아닌 "서로를 이해하고 관계를 회복하는 감성 심리코칭" 흐름
 */

import { COLOR_DATA, ColorData } from './colorData';

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
  indigo: 'cool_deep', violet: 'cool_deep', black: 'cool_deep', silver: 'cool_deep',
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
    expressive: '지금 마음속에는 감정이 생기면 바로 꺼내고 싶은 충동이 있습니다. 표현하지 못하면 담담해지는 유형입니다. 이 흐름이 관계 안에서 속도차이를 만들고, 심지어 상대가 준비되지 않았을 때 상처가 될 수 있습니다. 앞으로는 표현하기 전에 잠깐 멈춰 묻는 연습이 관계를 한단계 더 따뜻하게 만들어줍니다.',
    warm_connector: '지금 마음속에는 누군가를 돌보고 싶은 마음이 조용히 흐르고 있습니다. 그 마음이 너무 크면 자신의 감정은 뒤로 미루게 됩니다. 이 흐름이 관계 안에서 소진으로 이어집니다. 앞으로는 자신에게도 그 따뜻함을 돌려주는 시간이 필요합니다.',
    stable_seeker: '지금 마음속에는 흔들리지 않는 관계를 원하는 마음이 있습니다. 변화보다 익숙한 안정감에서 편안함을 찾는 편입니다. 이 흐름이 관계 안에서 소통을 늘리는 데 시간이 필요하게 만들고, 상대에게 다가오는 데 시간이 걸릴 수 있습니다. 앞으로는 작은 인정 한 마디가 이 흐름을 편안하게 열어줍니다.',
    free_spirit: '지금 마음속에는 함께 있어도 자신만의 공간이 필요한 마음이 있습니다. 논리적으로 정리되지 않은 것에 불편함을 느끼는 편입니다. 이 흐름이 관계 안에서 감정 연결보다 실질적 소통을 앞세우게 만들고, 상대에게 차갑게 느껴지는 순간이 생길 수 있습니다. 앞으로는 먼저 공감하고 정리하는 순서를 연습하면 관계의 온도가 높아집니다.',
    deep_thinker: '지금 마음속에는 많은 것을 담아두고 있습니다. 침묵이 거리두기가 아니라 정리하는 시간임을 상대가 이해하지 못하면 오해가 생길 수 있습니다. 이 흐름이 관계 안에서 감정적 거리감을 만들고, 소진으로 이어질 수 있습니다. 앞으로는 지금 어떤 마음인지 먼저 한 마디 건네는 것이 이 흐름을 편안하게 만들어줍니다.',
    balanced_healer: '지금 마음속에는 자연스럽게 흐르고 싶은 마음이 있습니다. 억지로 어떤 것을 하기보다 자신의 리듬대로 움직이는 것이 편합니다. 이 흐름이 관계 안에서 조용한 존재감으로 나타나고, 상대에게 무관심으로 읽히는 순간이 생길 수 있습니다. 앞으로는 "나 여기 있어"라고 먼저 말해주는 연습이 도움이 됩니다.',
    clear_minded: '지금 마음속에는 복잡한 것들을 정리하고 싶은 마음이 있습니다. 속마음이 늦게 전달되는 편이라 상대가 오해할 수 있습니다. 이 흐름이 관계 안에서 감정 연결보다 일 정리가 앞서는 순간을 만들고, 상대에게 차갑게 느껴지는 순간이 생길 수 있습니다. 앞으로는 감정을 먼저 인정하고 정리하는 순서를 연습하면 관계의 온도가 높아집니다.',
  };

  // 현재 감정 흐름 — 코칭 대화체 + 전환 표현 강화
  const currentFlowMap: Record<PersonProfile, string> = {
    expressive: '지금 관계 안에서 감정이 활발하게 움직이고 있습니다. 표현하고 싶은 것이 많고, 함께 무언가를 하고 싶은 마음이 강합니다. 이렇게 에너지가 넘치는 시기일수록, 잠깐 속도를 늦추고 상대의 리듬을 확인하는 것이 관계를 더 따뜻하게 만들어줍니다.',
    warm_connector: '지금 누군가와 따뜻하게 연결되고 싶은 마음이 흐르고 있습니다. 그런데 상대를 배려하는 마음이 커질수록 자신의 감정은 뒤로 미루게 됩니다. 지금 가장 필요한 것은 자신에게도 그 따뜻함을 돌려주는 시간입니다.',
    stable_seeker: '지금 안정적인 관계와 일상을 원하는 마음이 있습니다. 변화보다 익숙하고 신뢰할 수 있는 것에서 편안함을 찾고 있습니다. 꾸준한 일상의 작은 인정이 지금 가장 큰 힘이 되는 시점입니다.',
    free_spirit: '지금 자유롭고 가벼운 흐름을 원하고 있습니다. 감정보다 상황을 명료하게 정리하고 싶은 마음이 있고, 관계에서도 각자의 공간이 필요합니다. 부담 없이 솔직하게 소통할 수 있는 환경이 지금 가장 편안합니다.',
    deep_thinker: '지금 마음속에 많은 것을 담아두고 있습니다. 감정을 충분히 정리한 후에야 표현할 수 있어, 겉으로는 조용해 보일 수 있습니다. 혼자만의 시간이 충분히 주어질 때 가장 자연스럽게 열립니다.',
    balanced_healer: '지금 자연스럽게 회복되고 싶은 마음이 있습니다. 억지로 무언가를 하기보다 자신의 리듬대로 천천히 움직이고 싶어 합니다. 조용히 함께 있어주는 것만으로도 충분히 연결된 느낌을 받습니다.',
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
    clear_minded: '담백하고 솔직한 방식으로 관계를 이어가는 성향이 있습니다. 감정을 정리한 후 명료하게 표현하며, 관계에서 솔직함과 균형을 중요하게 여깁니다.',
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
      nature: ' 자연스럽게 흘러가는 관계의 리듬을 소중히 여깁니다.',
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
  const map: Record<EnergyFamily, string> = {
    warm_active: `감정을 직접적으로 표현하는 편이며, 느끼는 것을 바로 드러내는 경향이 있습니다. ${card.korName}의 에너지처럼 솔직하고 즉각적인 표현 방식을 가지고 있습니다.`,
    warm_soft: `감정을 부드럽게 전달하는 편이며, 상대방을 배려하며 표현하는 성향이 있습니다. ${card.korName}의 온기처럼 따뜻하고 섬세하게 감정을 나눕니다.`,
    warm_grounded: `감정을 안정적으로 담아두는 편이며, 신중하게 표현하는 성향이 있습니다. ${card.korName}처럼 현실적이고 차분하게 감정을 전달합니다.`,
    cool_clear: `감정보다 이성을 앞세우는 편이며, 명확하게 표현하는 성향이 있습니다. ${card.korName}처럼 논리적이고 신뢰 있는 방식으로 소통합니다.`,
    cool_deep: `감정을 내면에 담아두는 편이며, 쉽게 드러내지 않는 성향이 있습니다. ${card.korName}처럼 깊이 있게 느끼지만 표현까지 시간이 걸립니다.`,
    nature: `감정을 자연스럽게 흘려보내는 편이며, 억지로 표현하기보다 분위기 속에서 전달하는 성향이 있습니다. ${card.korName}처럼 조용하고 균형 있게 감정을 나눕니다.`,
    neutral: `감정을 정리한 후 표현하는 편이며, 명료하고 균형 잡힌 방식으로 소통하는 성향이 있습니다. ${card.korName}처럼 차분하고 중심 잡힌 표현 방식을 가지고 있습니다.`,
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
    neutral: '감정을 정리하고 새롭게 시작하는 컬러',
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
  green: '자연스럽게 회복되도록 두는',
  olive: '뿌리를 내리고 안정을 찾는',
  sage: '치유의 마음을 자신에게도 돌려주는',
  lavender: '자신을 위한 조용하고 따뜻한 시간을 갖는',
  white: '복잡함을 내려놓고 단순하게 정리하는',
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
    white: '복잡한 것들을 내려놓고 단순하게 정리하고 싶은 마음이 있습니다.',
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

  // 관계 흐름
  const relationFlow = buildRelationFlow(dominantA, dominantB, relationType, colorsA, colorsB);

  // 서로 다른 표현 방식 (감정 차이 + 리듬 차이 통합)
  const expressionDifference = buildExpressionDifference(dominantA, dominantB, familiesA, familiesB, colorsA, colorsB);

  // 오해가 생기는 지점
  const conflictPattern = buildMisunderstandingPattern(dominantA, dominantB, relationType);

  // 가까워지는 방법 (연결 방식 + 애정 스타일 통합)
  const connectionStyle = buildConnectionStyle(dominantA, dominantB, relationType);

  // 서로에게 필요한 표현
  const neededExpression = buildNeededExpression(dominantA, dominantB, colorsA, colorsB);

  // 커플 보완 루틴
  const coupleRoutine = buildCoupleRoutine(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith);

  // 마무리 코칭 메시지
  const closingMessage = buildClosingMessage(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith);

  // 두 사람 프로파일 대비 요약
  const profileContrast = buildProfileContrast(dominantA, dominantB, analysisA, analysisB, colorsA, colorsB, relationType);

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

function getDominantFamily(families: EnergyFamily[]): EnergyFamily {
  const count: Partial<Record<EnergyFamily, number>> = {};
  for (const f of families) count[f] = (count[f] ?? 0) + 1;
  return (Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral') as EnergyFamily;
}

function getRelationFlowPrefix(rel: RelationType): string {
  const map: Record<RelationType, string> = {
    '연인': '두 분의 마음 흐름이 만나고 있습니다.',
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
  return map[rel] ?? '두 사람의 마음 흐름이 만나고 있습니다.';
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
      '형제자매': `${prefix} ${nameA}와 ${nameB}처럼 비슷한 흐름을 가지고 있어 자연스럽게 통하는 부분이 많습니다. 가장 가까운 사이일수록 서로의 다름보다 닮음이 더 크게 느껴질 때, 관계가 편안해집니다.`,
    };
    return sameMsg[rel] ?? `${relLabel}은 비슷한 에너지 결을 가지고 있습니다. ${nameA}와 ${nameB}처럼 서로 닮은 흐름이 있어 공감대가 깊고, 같은 방향을 바라볼 때 자연스럽게 연결됩니다. 다만 비슷한 성향이 만날 때는 서로의 약한 부분도 함께 드러날 수 있어, 이해와 여유가 더욱 중요합니다.`;
  }

  const combos: Partial<Record<string, string>> = {
    'warm_active-cool_deep': `${nameA}의 표현하는 흐름과 ${nameB}의 내면으로 담아두는 흐름이 만나고 있습니다. 한 사람은 감정이 생기면 바로 꺼내야 편해지고, 다른 사람은 충분히 정리된 후에야 말할 수 있습니다. 이 속도 차이가 반복되면 "왜 말을 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 패턴이 생깁니다. 표현의 타이밍이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_deep-warm_active': `${nameA}의 내면으로 담아두는 흐름과 ${nameB}의 표현하는 흐름이 만나고 있습니다. 한 사람의 침묵이 다른 사람에게는 거리두기로 읽히는 순간이 반복될 수 있습니다. 조용한 것이 무관심이 아니라 깊이 생각하는 방식임을 서로 알면, 이 패턴에서 벗어날 수 있습니다.`,
    'warm_soft-cool_clear': `${nameA}의 따뜻하고 배려하는 흐름과 ${nameB}의 명료하고 신뢰 중심의 흐름이 만나고 있습니다. 한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 내놓습니다. 이 차이가 반복되면 "내 말을 들어주지 않는다"는 느낌이 쌓일 수 있습니다. 감성과 이성이 균형을 이룰 때 두 사람의 관계는 가장 안정적입니다.`,
    'cool_clear-warm_soft': `${nameA}의 명료하고 신뢰 중심의 흐름과 ${nameB}의 따뜻하고 배려하는 흐름이 만나고 있습니다. 한 사람의 이성적인 말이 다른 사람에게 차갑게 느껴지는 순간이 반복될 수 있습니다. 논리적인 표현 뒤에도 진심이 있다는 것을 기억하면, 두 사람 사이의 온도가 자연스럽게 맞춰집니다.`,
    'nature-warm_active': `${nameA}의 조용하고 균형 잡힌 흐름과 ${nameB}의 활기차고 표현하는 흐름이 만나고 있습니다. 한 사람이 안정을 잡아주고 다른 사람이 활력을 불어넣는 보완적인 구조입니다. 속도 차이가 반복되면 "왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 패턴이 생깁니다. 서로의 리듬을 존중하는 것이 이 관계의 핵심입니다.`,
    'warm_active-nature': `${nameA}의 활기차고 표현하는 흐름과 ${nameB}의 조용하고 균형 잡힌 흐름이 만나고 있습니다. 한 사람의 빠른 에너지가 다른 사람에게는 부담으로 느껴지는 순간이 생길 수 있습니다. 서로 다른 리듬이 만날 때, 속도를 맞추려는 노력보다 각자의 리듬을 인정하는 것이 더 자연스러운 균형을 만들어줍니다.`,
    'warm_grounded-cool_deep': `${nameA}의 안정적이고 신중한 흐름과 ${nameB}의 내면으로 담아두는 흐름이 만나고 있습니다. 두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
    'warm_soft-warm_active': `${nameA}의 따뜻하고 배려하는 흐름과 ${nameB}의 활기차고 표현하는 흐름이 만나고 있습니다. 두 사람 모두 감정을 중요하게 여기지만, 한 사람은 부드럽게 감싸고 다른 사람은 즉각적으로 표현합니다. 이 온도 차이가 때로는 "왜 그렇게 강하게 반응해?"와 "왜 그렇게 조심스러워?"로 나타날 수 있습니다.`,
    'cool_deep-warm_soft': `내면에서 천천히 정리하는 사람과 따뜻한 연결과 표현을 원하는 사람이 만났습니다. 한 사람은 마음이 충분히 정리될 때까지 조용히 있으려 하고, 다른 사람은 감정을 나누고 온기를 확인하고 싶어 합니다. 조용함이 거리두기로 오해받고, 표현 요구가 압박으로 느껴지는 순간이 반복될 수 있습니다. 침묵이 무관심이 아니라 깊이 생각하는 방식임을 서로 알면, 이 패턴에서 벗어날 수 있습니다.`,
    'warm_soft-cool_deep': `따뜻한 연결과 표현을 원하는 사람과 내면에서 천천히 정리하는 사람이 만났습니다. 한 사람은 감정을 나누고 온기를 확인하고 싶어 하고, 다른 사람은 마음이 충분히 정리될 때까지 조용히 있으려 합니다. 한 사람의 표현 욕구가 다른 사람에게 부담으로 느껴지는 순간이 생길 수 있습니다. 서로의 속도를 인정하면 두 사람의 관계는 훨씬 편안해집니다.`,
    'warm_active-warm_grounded': `즉각적으로 표현하고 빠르게 반응하는 사람과 안정적이고 신중하게 움직이는 사람이 만났습니다. 한 사람은 감정이 생기면 바로 꺼내야 편해지고, 다른 사람은 충분히 생각한 후에야 반응합니다. "왜 이렇게 무덤덤해?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다. 표현의 속도가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'warm_grounded-warm_soft': `안정적이고 꾸준한 흐름을 가진 사람과 따뜻하고 감성적인 흐름을 가진 사람이 만났습니다. 한 사람은 일상 속 꾸준한 행동으로 마음을 전하고, 다른 사람은 따뜻한 말과 감정 표현으로 연결되고 싶어 합니다. 서로의 사랑 언어가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_clear-nature': `명료하고 효율적인 흐름을 가진 사람과 자연스럽고 유연한 리듬을 가진 사람이 만났습니다. 한 사람은 계획적이고 정리된 방식을 선호하고, 다른 사람은 흐름에 맡기는 방식이 편합니다. "왜 이렇게 계획이 없어?"와 "왜 이렇게 딱딱해?"가 교차하는 순간이 있습니다. 두 방식이 균형을 이룰 때 관계가 가장 안정적입니다.`,
  };

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
  const base = combos[key] ?? fallbackByA[fA] ?? `${nameA}와 ${nameB}처럼 서로 다른 결이 만나고 있습니다. 감정 거리감과 표현 속도의 차이가 반복될 수 있지만, 서로에게 없는 것을 채워주는 힘이기도 합니다.`;
  // 관계 유형별 마무리 문장 추가
  const relSuffix: Partial<Record<RelationType, string>> = {
    '부부': ' 오랜 시간이 쌓인 관계일수록, 서로의 다름을 다시 이해하는 것이 새로운 시작이 됩니다.',
    '부모-자녀': ' 세대의 차이가 있어도, 서로를 향한 마음은 같습니다. 이해의 방식이 다를 뿐입니다.',
    '아빠-아들': ' 아빠와 아들 사이에서 감정을 꺼내는 방식이 다를 뿐, 서로를 향한 마음은 같습니다.',
    '아빠-딸': ' 아빠와 딸 사이에서 표현의 온도가 다를 수 있지만, 서로를 향한 마음은 같습니다.',
    '엄마-아들': ' 엄마와 아들 사이에서 감정 언어가 다를 수 있지만, 연결되고 싶은 마음은 같습니다.',
    '엄마-딸': ' 엄마와 딸 사이에서 표현 방식이 달라도, 서로를 이해하려는 마음은 같습니다.',
    '형제자매': ' 가장 가까운 사이이기에 더 솔직하게, 더 깊이 이해할 수 있는 관계입니다.',
    '동료': ' 함께 일하는 사이에서도 서로의 결을 이해하면 더 자연스럽게 협력할 수 있습니다.',
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
  return `두 사람 모두 ${familyLabel} 안에 있는 흐름을 공유하고 있습니다. 이 공통된 결이 서로를 자연스럽게 끌어당기고, 깊은 공감대를 만들어줍니다. 같은 방향을 바라볼 때 두 사람은 가장 편안하게 연결됩니다.`;
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
    return `두 사람은 비슷한 기질을 가지고 있습니다. ${labelA} 흐름이 공통적으로 나타나며, 서로를 쉽게 이해하는 편입니다. 다만 같은 성향끼리 만날 때는 서로의 한계도 함께 공명될 수 있으니, 의식적으로 다른 시각을 나눠보는 것이 도움이 됩니다.`;
  }

  return `한 사람은 ${labelA} 흐름(${nameA} 계열)을, 다른 사람은 ${labelB} 흐름(${nameB} 계열)을 가지고 있습니다. 이 기질의 차이는 서로가 세상을 다르게 경험하고 있다는 것을 의미합니다. 옳고 그름의 문제가 아니라, 서로 다른 방식으로 살아가고 있는 것입니다.`;
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
    'warm_active-cool_deep': `${nameA}의 에너지를 가진 사람은 감정이 생기면 바로 말하고 싶어 합니다. 반면 ${nameB}의 흐름을 가진 사람은 마음이 충분히 정리될 때까지 조용히 있으려 합니다. "왜 아무 말도 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 순간이 생기기 쉽습니다.`,
    'cool_deep-warm_active': `${nameA}의 흐름을 가진 사람은 마음이 정리될 때까지 조용히 있는 편입니다. 반면 ${nameB}의 에너지를 가진 사람은 감정을 바로 꺼내야 편해집니다. 침묵이 거리두기로 오해받는 순간이 생기기 쉽습니다.`,
    'warm_soft-cool_clear': `${nameA}의 흐름을 가진 사람은 "내 마음을 알아줬으면" 하는 바람이 먼저입니다. 반면 ${nameB}의 흐름을 가진 사람은 "어떻게 해결할까"를 먼저 생각합니다. 공감을 원하는데 해결책이 돌아올 때 서운함이 쌓일 수 있습니다.`,
    'cool_clear-warm_soft': `${nameA}의 흐름을 가진 사람은 감정보다 상황 정리를 먼저 합니다. 반면 ${nameB}의 흐름을 가진 사람은 먼저 공감받고 싶어 합니다. 이성적인 말이 차갑게 느껴지는 순간이 생길 수 있습니다.`,
    'warm_active-nature': `${nameA}의 에너지를 가진 사람은 빠르게 반응하고 즉각 표현합니다. 반면 ${nameB}의 흐름을 가진 사람은 자신의 리듬대로 천천히 처리합니다. "왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다.`,
    'nature-warm_active': `${nameA}의 흐름을 가진 사람은 조용히 자신의 리듬을 지킵니다. 반면 ${nameB}의 에너지를 가진 사람은 빠르게 반응하고 표현합니다. 조용한 존재감이 무관심으로 오해받는 순간이 생길 수 있습니다.`,
    'cool_deep-cool_clear': `${nameA}의 흐름을 가진 사람은 감정을 깊이 담아두고 천천히 꺼냅니다. ${nameB}의 흐름을 가진 사람은 논리적으로 정리하고 명료하게 표현합니다. 두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.`,
    'warm_grounded-warm_active': `${nameA}의 흐름을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. 반면 ${nameB}의 에너지를 가진 사람은 즉각적으로 표현합니다. "왜 그렇게 흥분해?"와 "왜 그렇게 무덤덤해?"가 부딪히는 순간이 있습니다.`,
  };

  const key = `${fA}-${fB}`;
  if (sceneMap[key]) return sceneMap[key]!;

  const isParentChild = rel === '부모-자녀' || rel === '아빠-아들' || rel === '아빠-딸' || rel === '엄마-아들' || rel === '엄마-딸';
  const isColleague = rel === '동료';
  const isFriend = rel === '친구';
  const exprA = getEmotionExpressionShort(fA);
  const exprB = getEmotionExpressionShort(fB);

  if (isParentChild) {
    return `${nameA}의 흐름을 가진 사람은 ${exprA} 방식으로 감정을 다루고, ${nameB}의 흐름을 가진 사람은 ${exprB} 방식으로 감정을 다룹니다. 세대 차이보다 감정 언어의 차이가 더 크게 느껴지는 순간이 있습니다. 서로의 방식이 다를 뿐, 두 사람 모두 연결되고 싶은 마음은 같습니다.`;
  } else if (isColleague) {
    return `${nameA}의 흐름을 가진 사람은 ${exprA} 방식으로, ${nameB}의 흐름을 가진 사람은 ${exprB} 방식으로 상황을 처리합니다. 같은 상황에서도 반응 방식이 달라 소통의 온도 차이가 생길 수 있습니다. 서로의 처리 방식을 이해하면 협업이 훨씬 자연스러워집니다.`;
  } else if (isFriend) {
    return `${nameA}의 흐름을 가진 사람은 ${exprA} 방식으로, ${nameB}의 흐름을 가진 사람은 ${exprB} 방식으로 감정을 나눕니다. 편안함을 느끼는 지점이 달라 대화 리듬이 어긋나는 순간이 생길 수 있습니다. 서로의 방식이 다를 뿐임을 기억하면 우정이 더 편안해집니다.`;
  }
  return `${nameA}의 흐름을 가진 사람은 ${exprA} 방식으로, ${nameB}의 흐름을 가진 사람은 ${exprB} 방식으로 감정을 다룹니다. 같은 상황에서도 반응 방식이 달라 관계 온도 차이로 느껴지는 순간이 생길 수 있습니다. 서로의 방식이 틀린 것이 아니라 다른 것임을 기억하는 것이 중요합니다.`;
}

function getEmotionExpressionShort(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '감정을 바로 표현하는',
    warm_soft: '부드럽게 배려하며 표현하는',
    warm_grounded: '안정적으로 담아두는',
    cool_clear: '이성적으로 정리하는',
    cool_deep: '내면에 깊이 담아두는',
    nature: '자연스럽게 흘려보내는',
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
    'nature-cool_clear': '한 사람은 자연스럽게 흘러가는 리듬을 선호하고, 다른 사람은 명료하고 효율적인 흐름을 좋아합니다. "그냥 되는 대로"와 "계획대로"가 부딪히는 순간이 있습니다.',
  };

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    const sameRhythmMap: Record<EnergyFamily, string> = {
      warm_active: '두 사람 모두 빠르게 반응하고 즉각 행동하는 편입니다. 함께 있으면 에너지가 넘치지만, 둘 다 지쳐있을 때는 서로를 쉬게 해주는 것이 필요합니다.',
      warm_soft: '두 사람 모두 부드럽고 감성적인 리듬으로 관계를 이어갑니다. 서로의 감정을 자연스럽게 이해하는 편이지만, 때로는 누군가 먼저 현실적인 결정을 내려야 할 때 망설임이 생길 수 있습니다.',
      warm_grounded: '두 사람 모두 안정적이고 일정한 리듬을 선호합니다. 변화보다 익숙함을 좋아하는 편이라 함께 있으면 편안하지만, 새로운 시도에는 함께 용기가 필요합니다.',
      cool_clear: '두 사람 모두 명료하고 효율적인 흐름을 선호합니다. 서로의 방식을 잘 이해하지만, 감정적인 연결보다 일 처리가 앞서는 순간이 생길 수 있습니다.',
      cool_deep: '두 사람 모두 천천히, 깊이 있게 관계를 이어가는 편입니다. 서로의 침묵을 자연스럽게 이해하지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다.',
      nature: '두 사람 모두 자연스럽고 유연한 리듬을 가지고 있습니다. 서로를 강요하지 않아 편안하지만, 때로는 누군가 먼저 방향을 잡아줄 필요가 있습니다.',
      neutral: '두 사람 모두 균형 잡힌 리듬으로 관계를 이어갑니다. 서로의 페이스를 자연스럽게 맞출 수 있는 편입니다.',
    };
    return sameRhythmMap[fA];
  }

  return rhythmSceneMap[key] ?? rhythmSceneMap[reverseKey] ?? `두 사람의 관계 리듬이 서로 다릅니다. 한 사람의 속도가 다른 사람에게 빠르거나 느리게 느껴질 수 있습니다. 서로의 리듬을 강요하지 않고 중간 지점을 찾아가는 것이 두 사람 관계의 편안함을 만들어줍니다.`;
}

function buildMisunderstandingPattern(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const patterns: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '한 사람이 감정을 바로 표현할 때, 다른 사람은 그 강도에 압도되어 더 안으로 들어갑니다. 이것이 반복되면 한 사람은 "나를 피하는 것 같다"고 느끼고, 다른 사람은 "왜 지금 연락이 안 돼?"라고 느낍니다. "왜 그래?"대신 "지금 어떤 마음이야?"로 시작하는 것이 이 패턴을 바꾸는 첫 걸음입니다.',
    'cool_deep-warm_active': '한 사람이 마음을 정리하는 동안 조용히 있을 때, 다른 사람은 그 침묵을 거절로 읽습니다. 이것이 반복되면 한 사람은 "나를 싫어하는 건가?"라고 오해하고, 다른 사람은 "왜 나를 열어주지 않지?"라고 느낍니다. 침묵은 거리두기가 아니라 정리하는 시간임을 서로 알면, 오해가 줄어듭니다.',
    'warm_soft-cool_clear': '한 사람이 감정적으로 표현할 때, 다른 사람은 자동으로 해결책을 내놓습니다. 한 사람은 "내 말을 들어주지 않는다"고 느끼고, 다른 사람은 "내가 도움이 되려고 한 것인데 왜 서운해하지?"라고 당혹스러워합니다. "도와줘"대신 "지금 어떤 마음이야?"로 시작하면 서로의 언어가 자연스럽게 연결됩니다.',
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
  return patterns[key] ?? fallbackPatterns[key] ?? fallbackPatterns[`${fB}-${fA}`] ?? `${missTraitA} 사람과 ${missTraitB} 사람이 만날 때, 서로의 반응 방식이 다르게 읽히는 순간이 반복될 수 있습니다. 서로의 의도를 직접 물어보는 것이 관계 거리감을 줄이는 가장 좋은 방법입니다.`;
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

  return `한 사람은 ${recoveryA} 방식으로 회복되고, 다른 사람은 ${recoveryB} 방식으로 회복됩니다. ${relLabel}의 회복 방향은 서로의 방식을 강요하지 않고, 각자가 필요한 방식으로 쉴 수 있도록 공간을 주는 것입니다.${context ? ' ' + context : ' 그 공간 안에서 자연스럽게 다시 연결될 수 있습니다.'}`;
}

function getRecoveryStyle(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '움직이고 표현하며',
    warm_soft: '따뜻한 연결과 대화로',
    warm_grounded: '일상의 안정 속에서',
    cool_clear: '혼자 정리하고 명료화하며',
    cool_deep: '조용히 내면으로 들어가',
    nature: '자연 속에서 천천히',
    neutral: '정리하고 비워내며',
  };
  return map[family];
}

function buildIntimacyStyle(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const isCouple = rel === '연인' || rel === '부부';
  const styleA = getIntimacyStyleShort(fA, isCouple);
  const styleB = getIntimacyStyleShort(fB, isCouple);

  // 연결 방식 차이를 구체적인 장면으로 표현
  const connectionSceneMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': isCouple
      ? '한 사람은 함께 무언가를 하고 표현을 나눌 때 가장 연결된 느낌을 받습니다. 다른 사람은 깊은 대화 한 번이 수십 번의 가벼운 표현보다 더 크게 닿습니다. 두 사람이 서로의 연결 방식을 알고 있다면, 각자의 방식으로 먼저 다가가는 것이 가장 좋은 시작입니다.'
      : '한 사람은 함께 활동하며 연결감을 느끼고, 다른 사람은 깊은 대화를 통해 연결됩니다. 서로의 연결 방식이 다르지만, 그 차이를 알면 더 자연스럽게 가까워질 수 있습니다.',
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
    return `두 사람 모두 ${styleA} 방식으로 연결감을 느낍니다. 같은 언어로 연결되기 때문에 서로의 필요를 자연스럽게 알아채는 편입니다. 다만 같은 방식이 오래 반복되면 새로운 연결 시도가 줄어들 수 있으니, 가끔 다른 방식으로 다가가는 것도 관계에 활기를 줍니다.`;
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
  const nameA = colorsA[0]?.korName ?? 'A';
  const nameB = colorsB[0]?.korName ?? 'B';

  const map: Partial<Record<string, string>> = {
    'warm_active-cool_deep': `${nameA}의 흐름을 가진 사람은 감정이 생기면 바로 말하고 빠르게 움직이고 싶어 합니다. ${nameB}의 흐름을 가진 사람은 마음이 충분히 정리될 때까지 조용히 있으려 합니다.\n"왜 아무 말도 안 해?"와 "왜 지금 당장 얘기해야 해?"가 부딪히는 순간이 생기기 쉽습니다.\n표현의 속도가 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'cool_deep-warm_active': `${nameA}의 흐름을 가진 사람은 마음이 정리될 때까지 조용히 있는 편이고, 결정도 천천히 내립니다. ${nameB}의 흐름을 가진 사람은 감정을 바로 꺼내야 편해지고, 빠르게 반응합니다.\n침묵이 거리두기로 오해받는 순간이 생기기 쉽습니다.\n조용한 것이 무관심이 아니라, 깊이 생각하는 방식임을 기억하면 오해가 줄어듭니다.`,
    'warm_soft-cool_clear': `${nameA}의 흐름을 가진 사람은 "내 마음을 알아줬으면" 하는 바람이 먼저입니다. ${nameB}의 흐름을 가진 사람은 감정보다 "어떻게 해결할까"를 먼저 생각합니다.\n공감을 원하는데 해결책이 돌아올 때 서운함이 쌓일 수 있습니다.\n해결하려는 마음 뒤에도 진심이 있다는 것을 기억하면 관계가 편안해집니다.`,
    'cool_clear-warm_soft': `${nameA}의 흐름을 가진 사람은 감정보다 상황 정리를 먼저 합니다. ${nameB}의 흐름을 가진 사람은 먼저 공감받고 싶어 합니다.\n이성적인 말이 차갑게 느껴지는 순간이 생길 수 있습니다.\n논리적인 표현 뒤에도 따뜻한 마음이 있습니다.`,
    'warm_active-nature': `${nameA}의 흐름을 가진 사람은 빠르게 반응하고 즉각 표현합니다. ${nameB}의 흐름을 가진 사람은 자신의 리듬대로 천천히 처리합니다.\n"왜 이렇게 느려?"와 "왜 이렇게 서둘러?"가 교차하는 순간이 있습니다.\n속도의 차이가 있을 뿐, 두 사람 모두 같은 방향을 향하고 있습니다.`,
    'nature-warm_active': `${nameA}의 흐름을 가진 사람은 조용히 자신의 리듬을 지킵니다. ${nameB}의 흐름을 가진 사람은 빠르게 반응하고 표현합니다.\n조용한 존재감이 무관심으로 오해받는 순간이 생길 수 있습니다.\n천천히 가는 것이 함께하지 않는 것이 아닙니다.`,
    'warm_grounded-warm_active': `${nameA}의 흐름을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. ${nameB}의 흐름을 가진 사람은 즉각적으로 표현합니다.\n"왜 그렇게 흥분해?"와 "왜 그렇게 무덤덤해?"가 부딪히는 순간이 있습니다.\n표현의 강도가 다를 뿐, 두 사람 모두 진심으로 반응하고 있습니다.`,
    'cool_deep-cool_clear': `${nameA}의 흐름을 가진 사람은 감정을 깊이 담아두고 천천히 꺼냅니다. ${nameB}의 흐름을 가진 사람은 논리적으로 정리하고 명료하게 표현합니다.\n두 사람 모두 감정을 바로 드러내지 않아 서로의 마음을 읽기 어려울 때가 있습니다.\n먼저 물어보는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
  };

  const key = `${fA}-${fB}`;
  if (fA === fB) {
    const sameMap: Record<EnergyFamily, string> = {
      warm_active: `두 사람 모두 감정을 바로 표현하고 빠르게 반응하는 편입니다.\n함께 있으면 활기차지만, 둘 다 지쳐있을 때는 서로를 쉬게 해주는 것이 필요합니다.\n가끔 먼저 "오늘 어때?"라고 물어보는 것이 관계를 따뜻하게 유지해줍니다.`,
      warm_soft: `두 사람 모두 감성적이고 부드러운 방식으로 감정을 나눕니다.\n서로의 마음을 자연스럽게 이해하지만, 때로는 현실적인 결정을 함께 내려야 할 때 망설임이 생길 수 있습니다.\n감정을 나누는 것만큼 방향을 함께 정하는 시간도 필요합니다.`,
      warm_grounded: `두 사람 모두 안정적이고 신중하게 감정을 다룹니다.\n변화보다 익숙함을 좋아하는 편이라 함께 있으면 편안하지만, 새로운 시도에는 함께 용기가 필요합니다.\n작은 변화 하나가 관계에 새로운 활기를 줄 수 있습니다.`,
      cool_clear: `두 사람 모두 명료하고 효율적인 방식으로 감정을 다룹니다.\n서로의 방식을 잘 이해하지만, 감정적인 연결보다 일 처리가 앞서는 순간이 생길 수 있습니다.\n가끔 "오늘 어떤 마음이야?"라고 물어보는 것이 두 사람 사이를 더 따뜻하게 만들어줍니다.`,
      cool_deep: `두 사람 모두 감정을 깊이 담아두고 천천히 꺼내는 편입니다.\n서로의 침묵을 자연스럽게 이해하지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다.\n먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결합니다.`,
      nature: `두 사람 모두 자연스럽고 유연한 리듬으로 감정을 다룹니다.\n서로를 강요하지 않아 편안하지만, 때로는 누군가 먼저 방향을 잡아줄 필요가 있습니다.\n가끔 "우리 이렇게 해보자"고 먼저 제안하는 것이 관계를 앞으로 나아가게 합니다.`,
      neutral: `두 사람 모두 균형 잡힌 방식으로 감정을 다룹니다.\n서로의 페이스를 자연스럽게 맞출 수 있는 편입니다.\n지금의 균형을 유지하면서 조금씩 더 깊이 연결되어 가는 것이 두 사람에게 맞는 방향입니다.`,
    };
    return sameMap[fA];
  }

  // 폴백 — 계열별 감정 차이 특성 반영
  const fallbackExprMap: Partial<Record<string, string>> = {
    'warm_active-warm_soft': `${nameA}의 흐름을 가진 사람은 감정이 생기면 즉각 표현합니다. ${nameB}의 흐름을 가진 사람은 부드럽게, 조금 더 천천히 표현합니다.\n표현 속도와 강도의 차이가 반복되면 한 사람은 "왜 이렇게 조심스러워?"라고, 다른 사람은 "왜 이렇게 강하게 반응해?"라고 느낄 수 있습니다.\n관계 온도 차이를 인정하면 두 사람 모두 더 편안해집니다.`,
    'warm_soft-warm_active': `${nameA}의 흐름을 가진 사람은 부드럽고 배려 깊게 표현합니다. ${nameB}의 흐름을 가진 사람은 즉각적이고 활기차게 반응합니다.\n한 사람의 조심스러운 표현이 다른 사람에게 소극적으로 느껴지는 순간이 생길 수 있습니다.\n표현 방식이 다를 뿐, 두 사람 모두 관계를 소중히 여기고 있습니다.`,
    'warm_grounded-cool_clear': `${nameA}의 흐름을 가진 사람은 안정적이고 신중하게 감정을 다룹니다. ${nameB}의 흐름을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다.\n안정 추구와 명료함 추구가 부딪히는 순간이 생길 수 있습니다.\n두 방향 모두 관계를 위한 마음에서 나옵니다.`,
    'cool_clear-warm_grounded': `${nameA}의 흐름을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다. ${nameB}의 흐름을 가진 사람은 안정적이고 신중하게 감정을 다룹니다.\n"왜 이렇게 복잡하게 생각해?"와 "왜 이렇게 단순하게 봐?"가 교차하는 순간이 있습니다.\n생각 중심과 안정 중심, 두 방식이 만나면 서로를 보완할 수 있습니다.`,
    'warm_soft-nature': `${nameA}의 흐름을 가진 사람은 따뜻하게 배려하며 관계 온도를 중요하게 여깁니다. ${nameB}의 흐름을 가진 사람은 자신의 리듬과 공간을 소중히 합니다.\n한 사람의 관심이 다른 사람에게 부담으로 느껴지는 순간이 생길 수 있습니다.\n서로의 필요를 확인하는 것이 두 사람 사이의 균형을 만들어줍니다.`,
    'nature-warm_soft': `${nameA}의 흐름을 가진 사람은 자신의 리듬과 공간을 소중히 합니다. ${nameB}의 흐름을 가진 사람은 따뜻하게 배려하며 관계 온도를 중요하게 여깁니다.\n한 사람의 거리감이 다른 사람에게 서운함으로 느껴지는 순간이 생길 수 있습니다.\n자신의 공간을 지키는 것이 관계를 멀리하는 것이 아님을 서로 알면 편안해집니다.`,
    'cool_clear-cool_deep': `${nameA}의 흐름을 가진 사람은 명료하게 정리하고 빠르게 결론을 냅니다. ${nameB}의 흐름을 가진 사람은 깊이 생각하다가 말이 늦어집니다.\n생각의 속도 차이가 반복되면 한 사람은 답답함을, 다른 사람은 압박감을 느낄 수 있습니다.\n생각의 깊이와 속도가 다를 뿐, 두 사람 모두 진지하게 관계를 대하고 있습니다.`,
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
function buildConnectionStyle(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
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

  const key = `${fA}-${fB}`;
  const reverseKey = `${fB}-${fA}`;

  if (fA === fB) {
    return `두 사람 모두 ${styleA} 방식으로 연결감을 느낍니다.\n같은 언어로 연결되기 때문에 서로의 필요를 자연스럽게 알아채는 편입니다.\n다만 같은 방식이 익숙해지면 표현이 줄어들 수 있으니, 가끔 새로운 방식으로 마음을 전해보는 것도 좋습니다.`;
  }

  return map[key] ?? map[reverseKey] ?? `한 사람은 ${styleA} 방식으로 연결감을 느끼고, 다른 사람은 ${styleB} 방식으로 연결감을 느낍니다.\n한 사람은 ${affStyleA} 마음을 전하고, 다른 사람은 ${affStyleB} 표현합니다.\n상대방이 마음이 열리는 방식을 먼저 알고 그 방식으로 다가가는 것이, 두 사람 사이의 거리를 좁히는 가장 빠른 길입니다.`;
}

function buildNeededExpression(
  fA: EnergyFamily, fB: EnergyFamily,
  colorsA: ColorData[], colorsB: ColorData[]
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

  return {
    forA: needed[fA],
    forB: needed[fB],
  };
}

function buildCoupleRoutine(
  fA: EnergyFamily, fB: EnergyFamily,
  rel: RelationType,
  faithA: FaithType, faithB: FaithType
): CoupleRoutine {
  const isCouple = rel === '연인' || rel === '부부';
  const isFamilyOrClose = rel === '부모-자녀' || rel === '형제자매';

  // 함께하기 좋은 활동
  const activities = buildActivities(fA, fB, rel);

  // 추천 컬러
  const recommendedColors = buildRecommendedColors(fA, fB);

  // 감정 회복 루틴
  const emotionRecovery = buildEmotionRecovery(fA, fB);

  // 대화 루틴
  const conversationRoutine = buildConversationRoutine(fA, fB, rel);

  // 함께 쉬는 방식
  const restTogether = buildRestTogether(fA, fB);

  // 정서적 연결 루틴
  const connectionRoutine = buildConnectionRoutine(fA, fB, faithA, faithB);

  // 애정 표현 루틴 (연인/부부)
  const affectionRoutine = isCouple
    ? buildAffectionRoutine(fA, fB, rel)
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
        '점심 식사 후 짧은 산책하기',
        '새로운 카페에서 티타임 갖기',
        '업무 외 가벼운 대화 나누기',
        '팀 점심 식사 함께하기',
      ],
      'warm_active-cool_deep': [
        '점심 식사 후 짧은 산책하기',
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 아이디어 가볍게 나누기',
        '팀 점심 식사 함께하기',
      ],
      'cool_deep-warm_active': [
        '점심 식사 후 짧은 산책하기',
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 아이디어 가볍게 나누기',
        '팀 점심 식사 함께하기',
      ],
      'warm_soft-cool_clear': [
        '티타임이나 커피 한 잔 나누기',
        '가벼운 점심 식사 함께하기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
      'cool_clear-warm_soft': [
        '티타임이나 커피 한 잔 나누기',
        '가벼운 점심 식사 함께하기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
      'cool_deep-cool_deep': [
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 깊은 대화 나누기',
        '점심 식사 후 짧은 산책하기',
        '함께 세미나나 강의 듣기',
      ],
      'warm_grounded-warm_grounded': [
        '점심 식사 함께하기',
        '티타임이나 커피 한 잔 나누기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
    };
    const collegeAct = colleagueActivities[key] ?? colleagueActivities[`${fB}-${fA}`];
    if (collegeAct) return collegeAct.slice(0, 4);
    // 동료 기본 폴백
    return [
      '점심 식사 후 짧은 산책하기',
      '티타임이나 커피 한 잔 나누기',
      '업무 외 가벼운 대화 나누기',
      '팀 점심 식사 함께하기',
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
        '함께 영화 보고 각자 느낀 점 나누기',
        '새로운 음식점 함께 탐방하기',
        '저녁 산책 후 따뜻한 음료 나누기',
      ],
      'cool_deep-warm_active': [
        '가벼운 산책 후 카페에서 대화 나누기',
        '함께 영화 보고 각자 느낀 점 나누기',
        '새로운 음식점 함께 탐방하기',
        '저녁 산책 후 따뜻한 음료 나누기',
      ],
      'warm_soft-cool_clear': [
        '카페에서 차 한 잔 나누며 이야기하기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
        '함께 보드게임이나 퍼즐 즐기기',
        '소품 가게나 서점 함께 구경하기',
      ],
      'cool_clear-warm_soft': [
        '카페에서 차 한 잔 나누며 이야기하기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
        '함께 보드게임이나 퍼즐 즐기기',
        '소품 가게나 서점 함께 구경하기',
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
      '함께 요리하거나 식사 준비하기',
      '조용한 카페에서 차 한 잔 나누기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '함께 영화 보거나 드라마 정주행하기',
    ],
    'cool_clear-warm_soft': [
      '함께 요리하거나 식사 준비하기',
      '조용한 카페에서 차 한 잔 나누기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '함께 영화 보거나 드라마 정주행하기',
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
      '자연 속 가벼운 하이킹이나 산책',
      '공원에서 피크닉 즐기기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 따뜻한 음료 나누기',
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
      '함께 요리하거나 식사 준비하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_grounded-cool_clear': [
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
      '주말 아침 함께 시장 보러 가기',
      '함께 영화 보거나 드라마 정주행하기',
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
      { id: 'white', korName: '화이트', hex: '#F8F8F8', reason: '복잡한 내면을 정리하고 새롭게 시작하는 힙을 줍니다.' },
      { id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '깊은 내면에 조용한 안정과 따뜻한 연결을 가져다줍니다.' },
    ],
    'nature-nature': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '두 사람 사이에 자연스럽습고 평온한 회복의 에너지를 채워줍니다.' },
      { id: 'cream', korName: '크림', hex: '#F5EDD6', reason: '조용하고 따뜻한 휴식의 에너지를 더해줍니다.' },
    ],
    'nature-warm_active': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '활동적인 에너지에 자연스럽습고 평온한 균형을 더해줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬이 자연스럽게 어우러지도록 동로의 에너지를 줍니다.' },
    ],
    'warm_active-nature': [
      { id: 'green', korName: '그린', hex: '#8FA68E', reason: '활동적인 에너지에 자연스럽고 평온한 균형을 더해줍니다.' },
      { id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '서로 다른 리듬이 자연스럽게 어우러지도록 동로의 에너지를 줍니다.' },
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
  result.push({ id: 'green', korName: '그린', hex: '#8FA68E', reason: '두 사람 사이에 자연스럽습고 평온한 회복의 에너지를 채워줍니다.' });
  if (fA === 'cool_deep' || fB === 'cool_deep' || fA === 'cool_clear' || fB === 'cool_clear') {
    result.push({ id: 'peach', korName: '피치', hex: '#F4A882', reason: '따뜻한 감정 연결과 부드러운 소통을 도와줍니다.' });
  } else if (fA === 'warm_active' || fB === 'warm_active') {
    result.push({ id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '빠른 흐름 속에서 조용한 안정을 찾아줍니다.' });
  } else {
    result.push({ id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '감정을 자연스럽게 정리하고 균형을 회복합니다.' });
  }
  return result.slice(0, 2);
}

function buildEmotionRecovery(fA: EnergyFamily, fB: EnergyFamily): string {
  const key = `${fA}-${fB}`;
  const recoveryMap: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '감정이 올라왔을 때 바로 해결하려 하지 마세요. 한 사람이 "지금 들어줄 수 있어?"라고 먼저 물어보세요. 준비된 공간에서 나누는 감정이 더 깊이 닿습니다. "왜 그래?"보다 "지금 어떤 마음이야?"가 더 좋습니다.',
    'cool_deep-warm_active': '한 사람이 조용히 있을 때, 다른 사람은 그 침묵을 거리두기로 오해하지 마세요. 침묵은 정리하는 시간입니다. 충분히 정리된 후 자연스럽게 나눠 수 있습니다. "왜 아무 말도 안 해?"보다 "말하고 싶을 때 들어줄게"가 더 좋습니다.',
    'warm_soft-cool_clear': '한 사람이 감정적으로 표현할 때, 다른 사람은 해결책을 제시하기 전에 먼저 공감해주세요. "어떻게 해"보다 "정말 힘들었겠다"가 먼저입니다. 공감을 맛보고 나서 해결책을 듣는 것이 두 사람 모두에게 더 자연스러운 흐름입니다.',
    'cool_clear-warm_soft': '한 사람이 논리적으로 정리할 때, 다른 사람은 그 말이 차갑게 느껴질 수 있습니다. "차갑게 들린다"고 말하기 전에, 상대의 의도를 먼저 확인해보세요. 이성적인 표현 뒤에도 진심이 있습니다.',
    'warm_active-warm_active': '두 사람 모두 감정이 빠르게 올라오는 편입니다. 감정이 올라왔을 때 바로 해결하려 하지 말고, 잠깐 쉬어가는 시간을 먼저 가지세요. "지금 좋지 않아, 나중에 다시 얘기하자"라고 말하는 것이 두 사람 모두에게 회복의 시간을 줍니다.',
    'cool_deep-cool_deep': '두 사람 모두 감정을 안으로 담아두는 편입니다. 가끔 "지금 마음 어때?"라고 먼저 물어봐주세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 사람에게 가장 큰 위로가 됩니다.',
    'nature-nature': '두 사람 모두 감정을 자연스럽게 흐려보내는 편입니다. 감정이 올라왔을 때 바로 해결하려 하지 말고, 자연 속에서 함께 조용히 쉽는 시간을 가져보세요. 스스로 회복되는 시간이 두 사람 모두에게 필요합니다.',
    'nature-warm_active': '한 사람이 조용히 있고 싶을 때, 다른 사람은 그 조용함을 존중해주세요. "왜 조용해?"보다 "편하게 있어, 시간 되면 말해"가 더 좋습니다.',
    'warm_active-nature': '한 사람이 빠르게 반응할 때, 다른 사람은 그 속도에 지칠 수 있습니다. "지금 어떤 마음이야?"라고 먼저 물어보세요. 상대의 반응을 해석하기 전에 의도를 먼저 확인하는 것이 오해를 줄여줍니다.',
    'warm_grounded-warm_grounded': '두 사람 모두 안정적으로 감정을 다룹니다. 감정이 올라왔을 때 일상의 작은 인정 한 마디가 회복의 시작입니다. "네가 한 거 덕봄에 좋았어", "오늘 네가 있어서 다행이었어" 같은 말이 두 사람의 정서를 따뜻하게 유지해줍니다.',
    'warm_soft-warm_soft': '두 사람 모두 따뜻하고 배려 깊지만, 감정을 표현하는 데 망설일 수 있습니다. "나 지금 조금 힘들어"라고 먼저 말하는 연습이 두 사람 모두에게 회복의 시작입니다.',
  };

  const recovery = recoveryMap[key] ?? recoveryMap[`${fB}-${fA}`];
  if (recovery) return recovery;

  return '감정이 올라왔을 때 바로 해결하려 하기보다, 먼저 "지금 어떤 마음이야?"라고 물어보는 것이 회복의 시작입니다. 판단 없이 듣는 것이 가장 큰 위로가 됩니다.';
}

function buildConversationRoutine(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
  const key = `${fA}-${fB}`;
  // 에너지 조합별 대화 루틴 (연인/부부 전용)
  const comboConversation: Partial<Record<string, string>> = {
    'warm_active-cool_deep': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 분 사이의 가장 자연스러운 대화입니다.',
    'cool_deep-warm_active': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 분 사이의 가장 자연스러운 대화입니다.',
    'warm_active-warm_active': '하루 중 5분, 오늘 있었던 일 중 "좋았던 것 하나"를 나눠보세요. 두 분 모두 에너지가 높을 때는 서로를 쉽게 해주는 작은 대화가 관계의 온도를 유지해줍니다.',
    'cool_deep-cool_deep': '조용한 시간에 짧게 "오늘 어떤 순간이 좋았어?"라고 물어보세요. 깊은 대화가 아니라도, 작은 질문 하나가 두 분의 거리를 좁혀줍니다.',
    'warm_soft-cool_clear': '한 분이 "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 감성과 이성이 자연스럽게 만나는 대화가 두 분 사이를 더 가까운 곳으로 데려다줍니다.',
    'cool_clear-warm_soft': '한 분이 "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 감성과 이성이 자연스럽게 만나는 대화가 두 분 사이를 더 가까운 곳으로 데려다줍니다.',
    'nature-nature': '말 없이 함께 있는 시간이 두 분에게 가장 자연스러운 대화입니다. 가끔 "오늘 어떤 순간이 좋았어?"라는 짧은 질문이 두 분의 연결을 더 따뜻하게 만들어줍니다.',
    'nature-warm_active': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 기다리지 말고, 함께 있는 것이 이미 충분한 연결임을 기억해주세요.',
    'warm_active-nature': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 기다리지 말고, 함께 있는 것이 이미 충분한 연결임을 기억해주세요.',
    'warm_grounded-warm_grounded': '저녁 식사 후 짧게 "오늘 어떤 순간이 좋았어?"라고 물어보세요. 일상 속 작은 대화가 두 분의 정서적 연결을 유지해줍니다.',
    'warm_soft-warm_soft': '하루 중 잠깐, "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 서로를 위하는 마음이 많으니, 그 마음을 조금 더 자주 표현해보세요.',
  };

  // 연인/부부인 경우 에너지 조합별 대화 루틴 우선
  if (rel === '연인' || rel === '부부') {
    const combo = comboConversation[key] ?? comboConversation[`${fB}-${fA}`];
    if (combo) return combo;
  }

  const routineMap: Partial<Record<RelationType, string>> = {
    '연인': '하루 중 5~10분, 오늘 있었던 일 중 "좋았던 것 하나"를 나눠보세요. 문제보다 좋은 것을 먼저 나누는 습관이 관계의 온도를 유지해줍니다.',
    '부부': '저녁 식사 후 짧게 "오늘 어떤 순간이 좋았어?"라고 물어보세요. 오래된 관계일수록 일상 속 작은 대화가 정서적 연결을 유지해줍니다.',
    '부모-자녀': '판단이나 조언 없이 "오늘 어땠어?"라고 물어보는 것으로 시작해 보세요. 답을 기다리는 것이 아니라, 함께 있는 시간 자체가 대화입니다.',
    '형제자매': '"요즘 어떻게 지내?"라는 짧은 연락이 가장 가까운 사이를 더 가깝게 만들어줍니다. 특별한 이유 없이 연락하는 것이 관계를 유지하는 가장 좋은 방법입니다.',
    '친구': '서로에게 "요즘 어때?"라고 먼저 물어보는 것이 우정을 유지하는 가장 간단한 방법입니다. 깊은 대화보다 자주 연결되는 것이 더 중요합니다.',
    '동료': '업무 외의 짧은 대화 — "오늘 점심 뭐 먹었어요?" 같은 가벼운 연결이 함께 일하는 관계를 더 편안하게 만들어줍니다.',
  };
  return routineMap[rel] ?? '서로에게 "요즘 어때?"라고 먼저 물어보는 것이 관계를 유지하는 가장 간단한 방법입니다.';
}

function buildRestTogether(fA: EnergyFamily, fB: EnergyFamily): string {
  const key = `${fA}-${fB}`;
  const restMap: Partial<Record<string, string>> = {
    'cool_deep-cool_deep': '같은 공간에서 각자 하고 싶은 것을 하는 "함께하는 혼자 시간"이 두 사람 모두에게 회복입니다. 말 없이 함께 있는 것만으로도 충분한 연결입니다.',
    'warm_active-warm_active': '두 사람 모두 에너지가 높을 때는 함께 움직이는 것이 회복입니다. 다만 지쳐있을 때는 서로에게 아무것도 요구하지 않는 조용한 시간을 주는 것이 더 큰 사랑입니다.',
    'warm_active-cool_deep': '한 사람은 움직이고 싶고, 다른 사람은 조용히 있고 싶을 수 있습니다. 두 가지 속도가 번갈아 존중되는 시간이 두 사람 모두에게 회복입니다.',
    'cool_deep-warm_active': '한 사람은 조용히 있고 싶고, 다른 사람은 움직이고 싶을 수 있습니다. 두 가지 속도가 번갈아 존중되는 시간이 두 사람 모두에게 회복입니다.',
    'warm_soft-warm_soft': '따뜻한 음료를 마시며 서로의 이야기를 듣는 시간이 두 사람 모두에게 회복입니다. 서로를 위하는 마음이 많으니, 이제는 자신에게도 그 따뜻함을 돌려주세요.',
    'nature-nature': '자연 속에서 함께 조용히 있는 시간이 두 사람 모두에게 가장 자연스러운 회복입니다. 같은 공간에서 조용히 쉬는 것만으로도 두 사람은 자연스럽게 연결됩니다.',
    'warm_grounded-warm_grounded': '일상의 작은 순간에 집중해보세요. 함께 요리하거나 단골 카페에서 조용히 시간을 보내는 것이 두 사람의 에너지를 채워줍니다.',
    'cool_clear-cool_clear': '각자 하고 싶은 것을 하면서 같은 공간에 있는 것이 두 사람 모두에게 편안한 회복입니다. 서로에게 아무것도 요구하지 않는 시간이 가장 큰 신뢰입니다.',
    'warm_soft-cool_clear': '한 사람은 감성적으로, 다른 사람은 조용히 실용적으로 쉬는 방식이 다릅니다. 서로의 휴식 방식을 존중해주는 것이 두 사람 모두에게 회복입니다.',
    'cool_clear-warm_soft': '한 사람은 조용히 실용적으로, 다른 사람은 감성적으로 쉬는 방식이 다릅니다. 서로의 휴식 방식을 존중해주는 것이 두 사람 모두에게 회복입니다.',
  };

  const rest = restMap[key] ?? restMap[`${fB}-${fA}`];
  if (rest) return rest;

  // 계열별 폴백
  if (fA === 'cool_deep' || fB === 'cool_deep') {
    return '같은 공간에서 각자 하고 싶은 것을 하는 "함께하는 혼자 시간"이 두 사람 모두에게 회복입니다. 말 없이 함께 있는 것만으로도 충분한 연결입니다.';
  }
  if (fA === 'warm_active' || fB === 'warm_active') {
    return '함께 가벼운 움직임을 즐기거나 새로운 장소를 다녀보는 것이 두 사람의 에너지를 자연스럽게 맞춰줍니다. 움직이면서 나누는 대화가 더 편안하게 느껴질 수 있습니다.';
  }
  if (fA === 'nature' || fB === 'nature') {
    return '자연 속에서 함께 조용히 있는 시간이 두 사람에게 가장 자연스러운 회복입니다. 굳이 많은 말을 하지 않아도 편안함을 느끼는 흐름입니다.';
  }
  return '조용한 음악과 함께 차를 마시며 서로에게 아무것도 요구하지 않는 시간을 가져보세요. 그 조용함 안에서 두 사람의 에너지가 자연스럽게 정리됩니다.';
}

function buildConnectionRoutine(
  fA: EnergyFamily,
  fB: EnergyFamily,
  faithA: FaithType,
  faithB: FaithType
): string {
  const hasFaith = faithA === '기독교' || faithB === '기독교';

  // 에너지 조합별 연결 루틴
  const key = `${fA}-${fB}`;
  const connectionMap: Partial<Record<string, string>> = {
    'warm_active-warm_active': '하루 중 가장 에너지가 높았던 순간과 가장 지쳐있던 순간을 하나씩 나눠보세요. 서로의 에너지를 인정하고 우리만의 휴식 리듬을 함께 만들어가는 것이 연결의 시작입니다.',
    'warm_active-cool_deep': '한 사람이 먼저 "오늘 어떤 마음이야?"라고 물어보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 가장 큰 연결입니다.',
    'cool_deep-warm_active': '한 사람이 먼저 "오늘 어떤 마음이야?"라고 물어보세요. 답을 강요하지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 가장 큰 연결입니다.',
    'warm_soft-cool_clear': '한 사람이 "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 작은 관심이 두 사람 사이를 따뜻게 유지해줍니다.',
    'cool_clear-warm_soft': '한 사람이 "오늘 나한테 어떤 순간이 좋았어?"라고 물어보세요. 작은 관심이 두 사람 사이를 따뜻게 유지해줍니다.',
    'cool_deep-cool_deep': '말이 없어도 괜찮습니다. 같은 공간에서 조용히 있는 것만으로도 충분한 연결입니다. 다만 가끔 "지금 마음 어때?"라는 짧은 질문이 두 사람의 거리를 좌혀줍니다.',
    'nature-nature': '자연 속에서 함께 조용히 있는 시간이 두 사람에게 가장 자연스러운 연결입니다. 함께 편안히 시간을 보내는 것만으로도 충분한 연결이 됩니다.',
    'nature-warm_active': '한 사람이 조용히 있고 싶을 때, 다른 사람이 그 조용함을 존중해주세요. 함께 있는 것이 항상 같은 속도일 필요는 없습니다.',
    'warm_active-nature': '한 사람이 조용히 있고 싶을 때, 다른 사람이 그 조용함을 존중해주세요. 함께 있는 것이 항상 같은 속도일 필요는 없습니다.',
    'warm_grounded-warm_grounded': '일상의 작은 순간에 집중해보세요. "오늘 저녁 뛰어서 좋았어", "오늘 네가 해준 거 덕봄에 맛있었어" 같은 작은 인정이 두 사람 사이를 따뜻게 유지해줍니다.',
  };

  const routine = connectionMap[key] ?? connectionMap[`${fB}-${fA}`];
  if (routine) {
    if (hasFaith) return routine + ' 함께 짧은 감사를 나누는 시간이 정서적 연결을 더 깊게 만들어줍니다.';
    return routine;
  }

  if (hasFaith) {
    return '함께 짧은 감사 기도를 나누거나, 오늘 하루 감사한 것 하나씩 말해보세요. 같은 방향을 바라보는 시간이 정서적 연결을 깊게 만들어줍니다.';
  }
  return '하루를 마치며 "오늘 고마웠던 것" 하나씩 나눠보세요. 작은 감사 표현이 관계의 온기를 유지하는 가장 간단한 루틴입니다.';
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

function buildAffectionRoutine(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType = '연인'): string {
  const isCouple = rel === '연인' || rel === '부부';
  const connTone = getConnectionByRelType(rel);
  const key = `${fA}-${fB}`;
  const comboAffection: Partial<Record<string, string>> = {
    'warm_active-warm_active': isCouple
      ? '아침에 짧게 안아주거나 "오늘도 파이팅" 한마디로 하루를 열어보세요. 두 분 모두 에너지가 높을 때는 서로를 쉽게 해주는 작은 표현이 가장 큰 연결이 됩니다.'
      : '"오늘도 파이팅" 한마디로 하루를 열어보세요. 두 분 모두 에너지가 높을 때는 서로를 쉽게 해주는 작은 표현이 가장 큰 연결이 됩니다.',
    'warm_active-cool_deep': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 기다리지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 분 사이의 가장 자연스러운 연결입니다.',
    'cool_deep-warm_active': '한 분이 먼저 "오늘 어떤 하루였어?"라고 물어보세요. 답을 기다리지 말고, 말하고 싶을 때 들어줄 수 있다는 신호를 주는 것이 두 분 사이의 가장 자연스러운 연결입니다.',
    'warm_soft-cool_clear': '한 분은 "네가 있어서 좋아"라는 말이 더 큰 선물입니다. 다른 분은 약속을 지키고 필요한 것을 먼저 챙기는 것이 사랑의 언어입니다. 서로의 언어로 한 번씩 마음을 전해보세요.',
    'cool_clear-warm_soft': '한 분은 약속을 지키고 필요한 것을 먼저 챙기는 것이 사랑의 언어입니다. 다른 분은 "네가 있어서 좋아"라는 말이 더 큰 선물입니다. 서로의 언어로 한 번씩 마음을 전해보세요.',
    'cool_deep-cool_deep': '"말 안 해도 네 마음 알아"라는 짧은 한 마디가 두 분 모두에게 깊이 닿습니다. 거창한 표현보다 진심 어린 한 마디가 두 분의 연결을 더 깊게 만들어줍니다.',
    'nature-nature': '말 없이 조용히 옷에 있어주는 것이 두 분에게 가장 큰 사랑의 표현입니다. 가끔 "네가 연에 있어서 좋아"라는 한 마디를 더해보세요.',
    'nature-warm_active': '한 분은 조용히 옷에 있어주는 것으로, 다른 분은 짧은 표현과 활동으로 마음을 전합니다. 서로의 언어로 한 번씩 먼저 다가가는 것이 두 분의 거리를 좌혀줍니다.',
    'warm_active-nature': '한 분은 짧은 표현과 활동으로, 다른 분은 조용히 옷에 있어주는 것으로 마음을 전합니다. 서로의 언어로 한 번씩 먼저 다가가는 것이 두 분의 거리를 좌혀줍니다.',
    'warm_grounded-warm_grounded': '"오늘도 수고했어", "네가 해준 거 덕봄에 맛있었어" 같은 일상적인 인정이 두 분 모두에게 가장 큰 사랑의 언어입니다. 특별한 것보다 일상 속의 꼸준한 관심이 관계를 따뜻하게 유지해줍니다.',
    'warm_soft-warm_soft': '"네가 있어서 정말 다행이야", "오늘도 고마워" 같은 말이 두 분 모두에게 깊이 닿습니다. 서로를 위하는 마음이 많으니, 이제는 그 말을 조금 더 자주 전해보세요.',
    // warm_grounded / cool_clear 계열 조합 추가
    'warm_grounded-cool_clear': '한 분은 일상 속에서 묵묵히 신뢰를 쌓는 방식으로, 다른 분은 명확하게 정리하고 에써주는 방식으로 마음을 전합니다. "네가 해준 거 다 알아", "네가 있어서 든든해" 같은 짧은 인정이 두 분 모두에게 가장 큰 에너지가 됩니다.',
    'cool_clear-warm_grounded': '한 분은 명확하게 정리하고 에써주는 방식으로, 다른 분은 일상 속에서 묵묵히 신뢰를 쌓는 방식으로 마음을 전합니다. "네가 정리해준 거 덕분에 나 편해졌어", "네가 묵묵히 있어줘서 나 안정돼" 같은 짧은 인정이 두 분 모두에게 답니다.',
    'warm_grounded-cool_deep': '한 분은 일상 속 작은 행동으로, 다른 분은 진심 어린 한 마디로 마음을 전합니다. "네가 있어서 나 안정돼", "말 안 해도 네 마음 알아" 같은 짧은 표현이 두 분 사이를 가장 깊게 연결해줍니다.',
    'cool_deep-warm_grounded': '한 분은 진심 어린 한 마디로, 다른 분은 일상 속 작은 행동으로 마음을 전합니다. "네가 있어서 나 든든해", "말 안 해도 괜찮아" 같은 짧은 표현이 두 분 사이를 따뜻하게 이어줍니다.',
    'cool_clear-cool_clear': '두 분 모두 명료하고 직접적인 표현을 선호합니다. "네가 정리해준 거 덕분에 나 편해졌어", "네가 잘 하고 있는 거 알아" 같은 짧고 명확한 인정이 두 분 사이를 더 편안하게 만들어줍니다.',
    'cool_clear-cool_deep': '한 분은 명료한 정리로, 다른 분은 진심 어린 한 마디로 마음을 전합니다. "네가 정리해준 거 덕분에 나 편해졌어", "말 안 해도 네 마음 알아" 같은 짧은 표현이 두 분 사이를 이어줍니다.',
    'cool_deep-cool_clear': '한 분은 진심 어린 한 마디로, 다른 분은 명료한 정리로 마음을 전합니다. "말 안 해도 네 마음 알아", "네가 정리해준 거 덕분에 나 편해졌어" 같은 짧은 표현이 두 분 사이를 더 깊게 연결해줍니다.',
    'warm_grounded-nature': '한 분은 일상 속 작은 행동으로, 다른 분은 자연스러운 존재감으로 마음을 전합니다. "네가 자연스럽게 있어줘서 나 편해", "네가 일상을 지켜줘서 나 안정돼" 같은 짧은 인정이 두 분 사이를 따뜻하게 유지해줍니다.',
    'nature-warm_grounded': '한 분은 자연스러운 존재감으로, 다른 분은 일상 속 작은 행동으로 마음을 전합니다. "네가 일상을 지켜줘서 나 안정돼", "네가 자연스럽게 있어줘서 나 편해" 같은 짧은 인정이 두 분 사이를 따뜻하게 유지해줍니다.',
    'cool_clear-nature': '한 분은 명료한 정리로, 다른 분은 자연스러운 존재감으로 마음을 전합니다. "네가 정리해준 거 덕분에 나 편해졌어", "네가 자연스럽게 있어줘서 나 편해" 같은 짧은 인정이 두 분 사이를 이어줍니다.',
    'nature-cool_clear': '한 분은 자연스러운 존재감으로, 다른 분은 명료한 정리로 마음을 전합니다. "네가 자연스럽게 있어줘서 나 편해", "네가 정리해준 거 덕분에 나 편해졌어" 같은 짧은 인정이 두 분 사이를 더 편안하게 만들어줍니다.',
  };

  const affection = comboAffection[key] ?? comboAffection[`${fB}-${fA}`];
  if (affection) return affection;

  // 기본 폴백
  const needsPhysical = fA === 'warm_soft' || fB === 'warm_soft' || fA === 'warm_active' || fB === 'warm_active';
  const needsWords = fA === 'cool_deep' || fB === 'cool_deep';

  if (needsPhysical && needsWords) {
    return isCouple
      ? `아침이나 저녁에 ${connTone.physicalTouch} "오늘도 고마워"라는 말을 나눠보세요. ${connTone.closingGesture} 두 사람 모두에게 닳습니다.`
      : `저녁에 짧게 안부를 나누고 "오늘도 고마워"라는 말을 나눠보세요. 말과 공감이 함께할 때 두 사람 모두에게 닳습니다.`;
  }
  if (needsPhysical) {
    return isCouple
      ? `손잡기, 짧은 포옹, 눈 맞추기 같은 작은 스킨십이 두 사람의 정서적 연결을 유지해줍니다. 말보다 먼저 몸으로 전달되는 따뜻함이 있습니다.`
      : `따뜻한 말과 공감이 두 사람의 연결을 유지해줍니다. 작은 연락이나 짧은 대화가 생각보다 큰 연결이 될 수 있습니다.`;
  }
  if (needsWords) {
    return '"네가 있어서 좋아", "오늘도 수고했어" 같은 짧은 말이 깊이 닿습니다. 거창한 표현보다 진심 어린 한 마디가 더 큰 연결을 만들어줍니다.';
  }
  return '"오늘 어떤 하루였어?", "네가 있어서 다행이야" 같은 작은 말 한 마디가 두 분 사이를 따뜻하게 유지해줍니다. 특별한 것보다 꼸준한 관심이 더 중요합니다.';
}

/**
 * 두 사람 프로파일 대비 요약
 * 에너지 방향 차이 + 끌림 이유 + 반복 패턴 + 해법 방향을 한 단락으로 요약
 */
function buildProfileContrast(
  fA: EnergyFamily, fB: EnergyFamily,
  analysisA: PersonAnalysis, analysisB: PersonAnalysis,
  colorsA: ColorData[], colorsB: ColorData[],
  rel: RelationType
): string {
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
      cool_deep: `${relLabel} 모두 말보다 마음으로 더 많이 느끼는 사람들입니다. 서로의 침묵을 자연스럽게 이해하지만, 감정을 꺼내는 데 둘 다 시간이 걸릴 수 있습니다. 먼저 한 마디 건네는 것이 두 사람 사이를 가장 빠르게 연결하는 방법입니다.`,
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
    return `${nameA}의 흐름을 가진 사람은 ${labelA} 중심으로 살아갑니다. ${nameB}의 흐름을 가진 사람은 ${labelB} 중심으로 살아갑니다.\n${attrLine}\n반복되는 패턴은 이렇게 나타납니다. ${pattern} ${solution}`;
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
      ? `${nameA}의 흐름을 가진 사람은 빠르게 움직이고 직접 표현하는 방식으로 일합니다. ${nameB}의 흐름을 가진 사람은 명확하게 정리하고 신중하게 에쓰는 방식으로 일합니다.\n한 사람은 빠른 실행을 원하고, 다른 사람은 충분한 검토 후 진행하고 싶어 합니다. 이 속도 차이가 협업에서 마찰의 원인이 되기도 합니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 먼저 실행하고 싶을 때, 다른 사람은 아직 검토 중입니다. "지금 어디까지 정리된 거야?"`
      : isFriend
        ? `${nameA}의 흐름을 가진 사람은 직접적으로 소통하고 빠르게 움직입니다. ${nameB}의 흐름을 가진 사람은 명확하게 정리하고 신중하게 표현합니다.\n한 사람은 빠르게 소통하고 싶고, 다른 사람은 충분히 생각한 후 말하는 편입니다. 이 리듬 차이를 이해하면 우정이 더 편안해집니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 바로 말하고 싶을 때, 다른 사람은 아직 정리 중입니다. "지금 말할 수 있어?"`
        : buildContrastEntry(
            '표현', '명료함',
            '한 사람의 활기찬 에너지가 다른 사람에게 살아있는 느낌을 주고, 한 사람의 명료한 판단이 다른 사람에게 방향감을 줍니다.',
            '한 사람은 빠르게 표현하고, 다른 사람은 충분히 정리하고 싶어 합니다.',
            '한 사람이 빠르게 실행하고 싶을 때, 다른 사람은 아직 검토 중입니다.',
            '"지금 어디까지 정리된 거야?"'
          ),
    'cool_clear-warm_active': isColleague
      ? `${nameA}의 흐름을 가진 사람은 명확한 기준과 시스템으로 일합니다. ${nameB}의 흐름을 가진 사람은 빠르게 움직이고 직접 표현하는 방식으로 일합니다.\n한 사람은 충분한 검토 후 진행하고 싶고, 다른 사람은 빠른 실행을 원합니다. 이 속도 차이가 협업에서 마찰의 원인이 되기도 합니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 아직 검토 중일 때, 다른 사람은 이미 실행을 원합니다. "지금 어디까지 확인된 거야?"`
      : buildContrastEntry(
          '명료함', '표현',
          '한 사람의 명료한 판단이 다른 사람에게 방향감을 주고, 한 사람의 활기찬 에너지가 다른 사람에게 살아있는 느낌을 줍니다.',
          '한 사람은 충분히 정리하고 싶고, 다른 사람은 빠르게 표현합니다.',
          '한 사람의 신중한 태도가 다른 사람에게 느리게 느껴지는 순간이 있습니다.',
          '"지금 어디까지 확인된 거야?"'
        ),
    // 친구 특화 조합 — 우정 유지 패턴 중심
    'warm_soft-cool_deep': isColleague
      ? `${nameA}의 흐름을 가진 사람은 배려 진하고 감정적으로 연결하는 방식으로 일합니다. ${nameB}의 흐름을 가진 사람은 깊이 생각하고 내면에서 천천히 연결되는 방식으로 일합니다.\n한 사람은 관계 중심으로 일하고, 다른 사람은 업무 중심으로 일합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 소통을 원할 때, 다른 사람은 아직 정리 중입니다. "지금 말할 수 있어?"`
      : isFriend
        ? `${nameA}의 흐름을 가진 사람은 배려 진하고 감정적으로 연결하는 사람입니다. ${nameB}의 흐름을 가진 사람은 말보다 마음으로 더 많이 느끼는 사람입니다.\n한 사람은 자주 연락하고 소통하고 싶고, 다른 사람은 스스로 연락하기까지 시간이 필요합니다. 이 리듬 차이가 서로에게 서운하게 느껴지는 순간이 있습니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 먼저 연락하는 일이 많아집니다. "나 연락하는 거 부담 안 돼?"`
        : buildContrastEntry(
            '배려', '내면 성찰',
            '한 사람의 따뜻한 배려가 다른 사람에게 안심감을 주고, 한 사람의 깊은 내면이 다른 사람에게 깊이감을 줍니다.',
            '한 사람은 자주 연락하고 소통하고 싶고, 다른 사람은 스스로 연락하기까지 시간이 필요합니다.',
            '한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다.',
            '"나 연락하는 거 부담 안 돼?"'
          ),
    'cool_deep-warm_soft': isColleague
      ? `${nameA}의 흐름을 가진 사람은 깊이 생각하고 내면에서 천천히 연결되는 방식으로 일합니다. ${nameB}의 흐름을 가진 사람은 배려 진하고 감정적으로 연결하는 방식으로 일합니다.\n한 사람은 업무 중심으로, 다른 사람은 관계 중심으로 일합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 침묵이 다른 사람에게 무관심으로 읽히는 순간이 있습니다. "나 여기 있어"`
      : isFriend
        ? `${nameA}의 흐름을 가진 사람은 말보다 마음으로 더 많이 느끼는 사람입니다. ${nameB}의 흐름을 가진 사람은 배려 진하고 감정적으로 연결하는 사람입니다.\n한 사람은 스스로 연락하기까지 시간이 필요하고, 다른 사람은 자주 연락하고 소통하고 싶어 합니다. 이 리듬 차이가 서로에게 서운하게 느껴지는 순간이 있습니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다. "나 여기 있어"`
        : buildContrastEntry(
            '내면 성찰', '배려',
            '한 사람의 깊은 내면이 다른 사람에게 깊이감을 주고, 한 사람의 따뜻한 배려가 다른 사람에게 안심감을 줍니다.',
            '한 사람은 스스로 연락하기까지 시간이 필요하고, 다른 사람은 자주 연락하고 싶어 합니다.',
            '한 사람의 침묵이 다른 사람에게 거리두기로 읽히는 순간이 있습니다.',
            '"나 여기 있어"'
          ),
    // 동료 특화 조합 — 안정 vs 명료
    'warm_grounded-cool_clear': isColleague
      ? `${nameA}의 흐름을 가진 사람은 일상적인 신뢰를 쌓고 묵묵히 에쓰는 방식으로 일합니다. ${nameB}의 흐름을 가진 사람은 명확한 기준과 시스템으로 일합니다.\n한 사람은 유연하게 적응하고, 다른 사람은 명확한 구조를 선호합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 유연하게 적응할 때, 다른 사람은 명확한 기준을 원합니다. "지금 어디까지 정리된 거야?"`
      : buildContrastEntry(
          '안정', '명료함',
          '한 사람의 안정적인 존재감이 다른 사람에게 신뢰감을 주고, 한 사람의 명료한 판단이 다른 사람에게 방향감을 줍니다.',
          '한 사람은 유연하게 적응하고, 다른 사람은 명확한 구조를 선호합니다.',
          '한 사람이 유연하게 적응할 때, 다른 사람은 명확한 기준을 원합니다.',
          '"지금 어디까지 정리된 거야?"'
        ),
    'cool_clear-warm_grounded': isColleague
      ? `${nameA}의 흐름을 가진 사람은 명확한 기준과 시스템으로 일합니다. ${nameB}의 흐름을 가진 사람은 일상적인 신뢰를 쌓고 묵묵히 에쓰는 방식으로 일합니다.\n한 사람은 명확한 구조를 선호하고, 다른 사람은 유연하게 적응합니다. 이 차이가 협업 스타일의 간극으로 나타납니다.\n반복되는 패턴은 이렇게 나타납니다. 한 사람이 명확한 기준을 원할 때, 다른 사람은 유연하게 적응합니다. "지금 어디까지 확인된 거야?"`
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

  // 포낙 — 계열별 기본 대비 문장
  const fallbackA = getFamilyProfileLabel(fA);
  const fallbackB = getFamilyProfileLabel(fB);

  const attrLine = getAttractionLine(fA, fB);
  return contrastMap[key] ?? contrastMap[reverseKey] ?? `${nameA}의 흐름을 가진 사람은 ${fallbackA} 중심으로 살아갑니다. ${nameB}의 흐름을 가진 사람은 ${fallbackB} 중심으로 살아갑니다.\n${attrLine}\n반복되는 패턴은 이렇게 나타납니다. 서로의 방식이 다를 뿐인데, 그 다름이 거리감으로 읽히는 순간이 생깁니다. 서로의 의도를 먼저 확인하는 것이 오해를 줄이는 가장 빠른 방법입니다.`;
}

function getFamilyProfileLabel(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '표현',
    warm_soft: '배려',
    warm_grounded: '안정',
    cool_clear: '명료함',
    cool_deep: '내면 성찰',
    nature: '자신의 리듬',
    neutral: '균형',
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
    'warm_active-cool_deep-아빠-아들': `아버지와 아들은 에너지의 방향이 다를 수 있습니다. 한 사람은 빠르게 표현하고, 다른 사람은 충분히 정리한 후 말합니다. 오늘 이 흐름이 두 사람 사이에 더 편안한 대화의 문을 열어주는 계기가 되길 바랍니다.`,
    'warm_active-cool_deep-아빠-딸': `아버지와 딸은 에너지의 속도가 다를 수 있습니다. 한 사람은 직접적으로, 다른 사람은 천천히 마음을 엽니다. 오늘 이 흐름이 그 마음을 더 가까이 연결하는 시작이 되길 바랍니다.`,
    'warm_active-cool_deep-엄마-아들': `어머니와 아들은 소통의 리듬이 다를 수 있습니다. 한 사람은 바로 표현하고, 다른 사람은 충분히 정리한 후 말합니다. 오늘 이 흐름이 두 사람 사이에 더 자연스러운 대화의 출발점이 되길 바랍니다.`,
    'warm_active-cool_deep-엄마-딸': `어머니와 딸은 에너지의 방향이 다를 수 있습니다. 한 사람은 빠르게 표현하고, 다른 사람은 천천히 정리합니다. 오늘 이 흐름이 두 사람 사이의 거리를 조금 더 좁혀주는 계기가 되길 바랍니다.`,
    // warm_soft × 관계 유형
    'warm_soft-cool_clear-친구': `한 사람은 공감을 먼저 원하고, 다른 사람은 해결책을 먼저 생각합니다. 오늘 이 차이를 이해한 것이 두 사람의 우정을 더 편안하게 만들어줍니다. 서로의 방식을 인정하는 우정이 가장 오래 지속됩니다.`,
    'warm_soft-cool_clear-동료': `한 사람은 관계 중심으로, 다른 사람은 업무 중심으로 일합니다. 이 차이를 이해하면 협업이 훨씬 자연스러워집니다. 오늘의 흐름이 더 균형 잡힌 협업의 시작이 되길 바랍니다.`,
    'warm_soft-cool_clear-아빠-아들': `아버지와 아들은 마음을 전하는 방식이 다릅니다. 한 사람은 감정으로, 다른 사람은 행동으로 마음을 전합니다. 오늘 이 흐름이 두 사람 사이에 더 따뜻한 이해의 시작이 되길 바랍니다.`,
    'warm_soft-cool_clear-아빠-딸': `아버지와 딸은 마음을 전하는 언어가 다를 수 있습니다. 한 사람은 감정으로, 다른 사람은 실질적인 행동으로 사랑을 전합니다. 오늘 이 흐름이 그 마음을 더 가까이 전하는 계기가 되길 바랍니다.`,
    'warm_soft-cool_clear-엄마-아들': `어머니와 아들은 마음을 전하는 방식이 다를 수 있습니다. 한 사람은 감정적 연결을, 다른 사람은 실질적인 해결을 먼저 생각합니다. 오늘 이 흐름이 두 사람 사이에 더 자연스러운 소통의 출발점이 되길 바랍니다.`,
    'warm_soft-cool_clear-엄마-딸': `어머니와 딸은 닮은 만큼 다를 수 있습니다. 한 사람은 감정으로, 다른 사람은 실질로 마음을 전합니다. 오늘 이 흐름이 두 사람 사이의 온도를 조금 더 높여주는 계기가 되길 바랍니다.`,
    // warm_grounded × 관계 유형
    'warm_grounded-cool_clear-동료': `한 사람은 일상적인 신뢰를 쌓는 방식으로, 다른 사람은 명확한 기준으로 일합니다. 이 차이를 이해하면 협업이 훨씬 효율적이고 편안해집니다. 오늘의 흐름이 더 신뢰 높은 협업의 시작이 되길 바랍니다.`,
    'warm_grounded-cool_clear-친구': `한 사람은 묵묵히 곁에 있어주는 방식으로, 다른 사람은 명확하게 표현하는 방식으로 우정을 쌓습니다. 이 차이가 오히려 서로에게 균형을 줄 수 있습니다. 오늘 이 흐름이 두 사람의 우정을 더 단단하게 만들어줍니다.`,
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
      ? `한 분은 직접적으로 표현하고, 다른 분은 배려로 마음을 전합니다. 두 방식이 만나는 지점에서 두 분의 관계가 가장 따뜻해집니다. 오늘 이 흐름이 그 만남의 시작이 되길 바랍니다.`
      : isColleague
        ? `한 사람은 빠르게 표현하고, 다른 사람은 배려하며 접근합니다. 이 두 방식이 균형을 이루면 팀 전체에 긍정적인 에너지가 됩니다. 오늘의 흐름이 더 좋은 협업의 시작이 되길 바랍니다.`
        : `한 사람은 직접적으로 표현하고, 다른 사람은 배려로 마음을 전합니다. 오늘 서로의 방식을 이해한 것이 두 사람의 관계를 더 따뜻하게 만들어줍니다.`,
    'warm_soft-warm_active': isCouple
      ? `한 분은 배려로, 다른 분은 직접적인 표현으로 마음을 전합니다. 두 방식이 만나는 지점에서 두 분의 관계가 가장 따뜻해집니다. 오늘 이 흐름이 그 만남의 시작이 되길 바랍니다.`
      : `한 사람은 배려로, 다른 사람은 직접적으로 마음을 전합니다. 오늘 서로의 방식을 이해한 것이 두 사람의 관계를 더 편안하게 만들어줍니다.`,
    'warm_grounded-warm_soft': isCouple
      ? `한 분은 안정적인 일상으로, 다른 분은 따뜻한 배려로 사랑을 전합니다. 두 방식이 자연스럽게 어우러지는 것이 두 분의 가장 큰 강점입니다.`
      : `한 사람은 안정적인 방식으로, 다른 사람은 따뜻한 배려로 관계를 이어갑니다. 오늘 이 흐름이 두 사람의 관계를 더 단단하게 만들어줍니다.`,
    'cool_clear-cool_deep': isCouple
      ? `한 분은 명료하게 정리하고, 다른 분은 깊이 느끼는 방식으로 관계를 경험합니다. 두 방식이 균형을 이루면 두 분의 관계는 더 깊고 안정적이 됩니다.`
      : isColleague
        ? `한 사람은 명확한 기준으로, 다른 사람은 깊이 생각하는 방식으로 일합니다. 이 두 방식이 균형을 이루면 팀 전체에 깊이와 명료함이 더해집니다.`
        : `한 사람은 명료하게 정리하고, 다른 사람은 깊이 느끼는 방식으로 관계를 경험합니다. 오늘 이 흐름이 두 사람의 관계를 더 깊게 만들어줍니다.`,
    'warm_grounded-nature': isCouple
      ? `한 분은 안정적인 일상으로, 다른 분은 자연스러운 리듬으로 관계를 이어갑니다. 두 방식이 자연스럽게 어우러지는 것이 두 분의 가장 편안한 연결입니다.`
      : `한 사람은 안정적인 방식으로, 다른 사람은 자신의 리듬으로 관계를 이어갑니다. 오늘 이 흐름이 두 사람의 관계를 더 편안하게 만들어줍니다.`,
    'cool_clear-nature': isColleague
      ? `한 사람은 명확한 기준으로, 다른 사람은 자신의 리듬으로 일합니다. 이 두 방식이 균형을 이루면 협업이 훨씬 자연스러워집니다. 오늘의 흐름이 더 좋은 협업의 시작이 되길 바랍니다.`
      : `한 사람은 명료하게 정리하고, 다른 사람은 자신의 리듬을 지킵니다. 오늘 이 흐름이 두 사람의 관계를 더 자연스럽게 만들어줍니다.`,
  };

  const energyMsg = energyComboMessages[key] ?? energyComboMessages[`${fB}-${fA}`];
  if (energyMsg) return energyMsg + faithSuffix;

  // 관계 유형별 기본 메시지 (에너지 조합 무관)
  const relMessages: Record<RelationType, string> = {
    '연인': `두 분의 에너지 흐름이 다르다는 것은 약점이 아니라, 서로를 더 풍성하게 만드는 힘입니다. 오늘 이 흐름을 함께 나눈 것만으로도 이미 한 걸음 더 가까워졌습니다.`,
    '부부': `오랜 시간을 함께해온 두 분의 관계 안에는 이미 많은 이해가 쌓여 있습니다. 지금 필요한 것은 새로운 시작이 아니라, 서로를 다시 바라보는 따뜻한 시선입니다. 오늘 이 시간이 그 시작이 되길 바랍니다.`,
    '친구': `서로의 에너지 결을 이해하는 우정이 가장 오래 지속됩니다. 오늘 서로의 흐름을 함께 살펴본 것이 두 사람의 우정을 더 깊고 단단하게 만들어줍니다.`,
    '부모-자녀': `세대가 다르고 경험이 달라도, 서로를 향한 마음의 방향은 같습니다. 오늘 두 사람의 에너지 흐름을 함께 살펴본 것이, 더 자연스러운 대화의 출발점이 되길 바랍니다.`,
    '아빠-아들': `아버지와 아들은 서로에게 가장 많은 것을 기대하는 사이입니다. 기대가 클수록 표현이 어려워질 수 있습니다. 오늘 이 흐름이 두 사람 사이에 조금 더 편안한 언어를 만들어주는 계기가 되길 바랍니다.`,
    '아빠-딸': `아버지와 딸은 서로를 아끼는 방식이 다를 수 있습니다. 말보다 행동으로, 행동보다 진심으로 마음을 전하는 순간이 있습니다. 오늘 이 흐름이 그 마음을 더 가까이 전하는 시작이 되길 바랍니다.`,
    '엄마-아들': `어머니와 아들은 서로에게 가장 솔직하면서도 가장 오해하기 쉬운 사이입니다. 오늘 두 사람의 흐름을 함께 살펴본 것이, 더 따뜻한 이해의 시작이 되길 바랍니다.`,
    '엄마-딸': `어머니와 딸은 닮은 만큼 부딪히고, 닮은 만큼 깊이 이해할 수 있는 사이입니다. 오늘 이 흐름이 두 사람 사이의 거리를 조금 더 좁혀주는 계기가 되길 바랍니다.`,
    '형제자매': `가장 가까운 사이이기에 더 솔직하고, 때로는 더 상처받기도 합니다. 오늘 서로의 흐름을 이해한 것이 두 사람 사이에 더 따뜻한 공간을 만들어줍니다. 서로를 이해하는 형제자매가 가장 큰 자산입니다.`,
    '동료': `함께 일하는 사이에서도 서로의 에너지 결을 이해하면 더 자연스럽게 협력하고 편안하게 함께할 수 있습니다. 오늘의 흐름이 더 좋은 협업 관계의 시작이 되길 바랍니다.`,
  };

  const base = relMessages[rel] ?? `${relLabel}의 관계 흐름을 함께 살펴보았습니다. 서로를 이해하는 것이 관계 회복의 시작입니다.`;
  return base + faithSuffix;
}
