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
  const map: Record<EnergyFamily, string> = {
    warm_active: `감정을 직접적으로 표현하는 편이며, 느끼는 것을 바로 드러내는 경향이 있습니다. ${card.korName}의 에너지처럼 솔직하고 즉각적인 표현 방식을 가지고 있습니다.`,
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
  const conflictPattern = buildMisunderstandingPattern(dominantA, dominantB, relationType, shapeCtxA, shapeCtxB);

  // 가까워지는 방법 (연결 방식 + 애정 스타일 통합)
  const connectionStyle = buildConnectionStyle(dominantA, dominantB, relationType);

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
      return {
        modifier: '경계를 중시하고 자신을 지키려는',
        conflictTrait: '경계를 지키려는 태도가 상대에게 차갑게 느껴질 수 있습니다',
        recoveryTrait: '경계 회복과 혼자만의 시간이 필요합니다',
        affectionStyle: '신뢰가 쌓인 후 천천히 마음을 여는 방식으로',
        conversationStyle: '경계를 존중하는 짧고 명확한 대화가',
      };
    case 'inverted_triangle':
      return {
        modifier: '감정이 깊이 내려앉고 예민하게 반응하는',
        conflictTrait: '감정이 안으로 침잠할 때 상대가 원인을 알기 어렵습니다',
        recoveryTrait: '감정을 천천히 꺼내는 시간과 조용한 공간이 필요합니다',
        affectionStyle: '감정을 충분히 소화한 후 진심으로 표현하는 방식으로',
        conversationStyle: '감정을 먼저 인정하는 부드러운 대화가',
      };
    case 'circle':
      return {
        modifier: '감정이 순환하고 부드럽게 연결되는',
        conflictTrait: '감정이 빠르게 순환하여 상대가 현재 상태를 파악하기 어려울 수 있습니다',
        recoveryTrait: '감정 순환을 돕는 부드러운 연결과 공감이 필요합니다',
        affectionStyle: '자연스럽게 감정을 나누고 연결되는 방식으로',
        conversationStyle: '감정의 흐름을 따라가는 부드러운 대화가',
      };
    case 'square':
      return {
        modifier: '현실적이고 구조적으로 안정을 추구하는',
        conflictTrait: '구조와 책임을 중시하는 태도가 상대에게 딱딱하게 느껴질 수 있습니다',
        recoveryTrait: '일상의 안정된 구조와 책임감 있는 루틴이 회복을 돕습니다',
        affectionStyle: '꾸준하고 안정적인 행동으로 신뢰를 쌓는 방식으로',
        conversationStyle: '구체적이고 현실적인 주제의 대화가',
      };
    case 'diamond':
      return {
        modifier: '관계 감수성이 높고 섬세하게 균형을 맞추는',
        conflictTrait: '섬세한 감수성으로 인해 작은 변화에도 민감하게 반응할 수 있습니다',
        recoveryTrait: '감수성을 존중하는 섬세한 공감과 균형 회복이 필요합니다',
        affectionStyle: '세심한 배려와 균형 잡힌 표현으로',
        conversationStyle: '섬세한 감정 교류와 균형 잡힌 대화가',
      };
    case 'pentagon':
      return {
        modifier: '자기 방향성이 뚜렷하고 성장을 추구하는',
        conflictTrait: '자기 방향성이 강해 상대의 속도와 맞지 않을 때 갈등이 생길 수 있습니다',
        recoveryTrait: '자기 성장과 방향성을 존중하는 공간이 필요합니다',
        affectionStyle: '서로의 성장을 응원하고 방향을 함께 나누는 방식으로',
        conversationStyle: '각자의 방향과 성장을 나누는 대화가',
      };
    case 'hexagon':
      return {
        modifier: '연결과 공동체를 중시하고 조화를 추구하는',
        conflictTrait: '관계 조화를 중시하다 보니 자신의 감정을 뒤로 미룰 수 있습니다',
        recoveryTrait: '관계 연결과 공동체 안에서의 따뜻한 소속감이 회복을 돕습니다',
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
  for (const f of families) count[f] = (count[f] ?? 0) + 1;
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
    return sameMsg[rel] ?? `${relLabel}은 비슷한 에너지 결을 가지고 있습니다. ${nameA}와 ${nameB}처럼 서로 닮은 흐름이 있어 공감대가 깊고, 같은 방향을 바라볼 때 서로 가까워질 수 있습니다. 다만 비슷한 성향이 만날 때는 서로의 약한 부분도 함께 드러날 수 있어, 이해와 여유가 더욱 중요합니다.`;
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
  shapeCtxB?: ReturnType<typeof buildShapeContext>
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

  return `한 사람은 ${recoveryA} 방식으로 회복되고, 다른 사람은 ${recoveryB} 방식으로 회복됩니다. ${relLabel}의 회복 방향은 서로의 방식을 강요하지 않고, 각자가 필요한 방식으로 쉴 수 있도록 공간을 주는 것입니다.${context ? ' ' + context : ' 그 공간 안에서 다시 가까워질 수 있습니다.'}`;
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
      { id: 'white', korName: '화이트', hex: '#F8F8F8', reason: '복잡한 내면을 가다듬고 새롭게 시작하는 힘을 줍니다.' },
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
  // 도형별 관계 특성 보완 문장
  const shapeProfileNote = (shapeCtxA && shapeCtxB)
    ? `\n\n도형이 말해주는 표현 구조: 첫 번째 사람은 ${shapeCtxA.modifier} 방식으로 관계를 이어갑니다. 두 번째 사람은 ${shapeCtxB.modifier} 방식으로 연결됩니다. 같은 컬러 에너지라도 도형에 따라 표현 방식이 달라집니다.`
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

  // 포낙 — 계열별 기본 대비 문장
  const fallbackA = getFamilyProfileLabel(fA);
  const fallbackB = getFamilyProfileLabel(fB);

  const attrLine = getAttractionLine(fA, fB);
  const baseResult = contrastMap[key] ?? contrastMap[reverseKey] ?? `${nameA}의 성향을 가진 사람은 ${fallbackA} 중심으로 살아갑니다. ${nameB}의 성향을 가진 사람은 ${fallbackB} 중심으로 살아갑니다.\n${attrLine}\n반복되는 패턴은 이렇게 나타납니다. 서로의 방식이 다를 뿐인데, 그 다름이 거리감으로 읽히는 순간이 생깁니다. 서로의 의도를 먼저 확인하는 것이 오해를 줄이는 가장 빠른 방법입니다.`;
  return baseResult + (shapeProfileNote ?? '');
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

// 에너지 조합 키 → archetype 매핑
const ARCHETYPE_MAP: Record<string, RelationArchetype> = {
  // 온도차형: 표현 vs 내면 정리
  'warm_active-cool_deep': '온도차형',
  'cool_deep-warm_active': '온도차형',
  'warm_soft-cool_deep': '온도차형',
  'cool_deep-warm_soft': '온도차형',
  'warm_active-cool_clear': '온도차형',
  'cool_clear-warm_active': '온도차형',

  // 성장자극형: 서로 다른 방향성이 충돌하며 성장
  'warm_active-nature': '성장자극형',
  'nature-warm_active': '성장자극형',
  'cool_clear-warm_grounded': '성장자극형',
  'warm_grounded-cool_clear': '성장자극형',
  'cool_deep-nature': '성장자극형',
  'nature-cool_deep': '성장자극형',

  // 안정추구형: 비슷한 에너지 — 편안하지만 정체 가능
  'warm_grounded-warm_grounded': '안정추구형',
  'neutral-warm_grounded': '안정추구형',
  'warm_grounded-neutral': '안정추구형',
  'cool_clear-cool_clear': '안정추구형',
  'neutral-neutral': '안정추구형',

  // 감정순환형: 감정이 빠르게 돌고 회복도 빠름
  'warm_active-warm_soft': '감정순환형',
  'warm_soft-warm_active': '감정순환형',
  'warm_soft-warm_soft': '감정순환형',
  'warm_active-warm_active': '감정순환형',

  // 거리조절형: 가까워졌다 멀어지는 반복
  'cool_deep-cool_deep': '거리조절형',
  'cool_deep-cool_clear': '거리조절형',
  'cool_clear-cool_deep': '거리조절형',
  'cool_clear-nature': '거리조절형',
  'nature-cool_clear': '거리조절형',

  // 보호자형: 한 사람이 감싸고 다른 사람이 기대는 구조
  'warm_soft-warm_grounded': '보호자형',
  'warm_grounded-warm_soft': '보호자형',
  'warm_soft-nature': '보호자형',
  'nature-warm_soft': '보호자형',
  'warm_grounded-nature': '보호자형',
  'nature-warm_grounded': '보호자형',

  // 친구형: 편안하지만 감정 깊이가 얕아질 수 있음
  'neutral-cool_clear': '친구형',
  'cool_clear-neutral': '친구형',
  'neutral-nature': '친구형',
  'nature-neutral': '친구형',
  'nature-nature': '친구형',

  // 이상주의형: 깊은 연결을 꿈꾸지만 현실과 충돌
  'cool_deep-warm_grounded': '이상주의형',
  'warm_grounded-cool_deep': '이상주의형',
  'cool_deep-neutral': '이상주의형',
  'neutral-cool_deep': '이상주의형',

  // 현실균형형: 실용적이고 안정적이지만 감성 연결 필요
  'warm_grounded-warm_active': '현실균형형',
  'warm_active-warm_grounded': '현실균형형',
  'cool_clear-warm_soft': '현실균형형',
  'warm_soft-cool_clear': '현실균형형',

  // 회복형: 갈등 후 회복 패턴이 반복됨 (도형 보정으로 적용 — 역삼각형/마름모 도형 조합에서 적용)
  'warm_soft-neutral': '회복형',
  'neutral-warm_soft': '회복형',
};

// 도형 긴장 방향이 archetype을 보정하는 경우
function adjustArchetypeByShape(
  base: RelationArchetype,
  shapeTension: ShapeTension
): RelationArchetype {
  // 역삼각형(방어) → 거리조절형으로 강화
  if (shapeTension === 'defense' && base !== '거리조절형') return '거리조절형';
  // 마름모(민감) → 감정순환형 또는 회복형으로 보정
  if (shapeTension === 'sensitive' && base === '안정추구형') return '감정순환형';
  // 오각형(성장) → 성장자극형으로 강화
  if (shapeTension === 'growth' && base === '친구형') return '성장자극형';
  // 삼각형(경계) → 온도차형으로 보정
  if (shapeTension === 'boundary' && base === '안정추구형') return '온도차형';
  return base;
}

// archetype별 상세 데이터
const ARCHETYPE_DATA: Record<RelationArchetype, Omit<ArchetypeResult, 'archetype'>> = {
  온도차형: {
    typeName: '온도차형 관계',
    typeEmoji: '🌡️',
    coreSummary: '한 사람이 이미 결론에 도달했을 때, 다른 사람은 아직 감정 안에 있습니다.',
    tensionDescription: '두 사람은 같은 상황을 다른 속도로 경험합니다. 한 사람은 빠르게 정리하고 넘어가고, 다른 사람은 천천히 감정을 소화합니다. 이 속도 차이가 오해를 만듭니다.',
    misunderstandingPattern: '"왜 아직도 그 얘기야?" "왜 벌써 끝난 거야?" — 두 사람은 같은 사건을 다른 시간대에 살고 있습니다. 빠른 사람은 느린 사람이 집착한다고 느끼고, 느린 사람은 빠른 사람이 무관심하다고 느낍니다.',
    connectionStyle: '속도를 맞추려 하지 말고, 속도가 다르다는 것을 인정하는 것이 이 관계의 연결 방식입니다. "나는 지금 여기야, 넌 어디야?"라고 묻는 것이 시작입니다.',
    recoveryRoutine: '30분 각자 정리 후 다시 만나기. 빠른 사람이 먼저 기다려주는 것이 이 관계의 회복 열쇠입니다.',
    neededWords: '"나 아직 정리 중이야. 조금만 기다려줘."',
    recommendedActivity: '각자 좋아하는 것을 하다가 다시 만나는 시간. 함께 있되 각자의 속도를 존중하는 활동.',
    emotionRecoveryStyle: '빠른 사람은 기다리고, 느린 사람은 "나 지금 어디에 있는지" 말해주는 것. 침묵이 거리감이 아니라 정리 중이라는 신호임을 서로 알아야 합니다.',
    conversationRoutine: '오늘 가장 빨리 지나간 순간과 가장 오래 머문 순간 이야기하기. 속도가 다른 두 사람이 같은 하루를 어떻게 경험했는지 나누는 대화.',
    connectionRoutine: '"나는 지금 여기야" 라고 서로 위치를 알려주는 것. 감정의 현재 위치를 공유하는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '말 없이 옆에 앉아 있기. 빠른 사람이 느린 사람 곁에 조용히 머물러 주는 것이 이 관계에서 가장 따뜻한 표현입니다.',
    emotionRoutine: '각자의 속도로 감정을 처리하고, 준비가 됐을 때 다시 연결하기. 억지로 맞추려 하지 않는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '속도가 다른 것은 이 관계의 약점이 아닙니다. 한 사람이 먼저 도착해서 기다려주는 것, 그것이 이 관계의 사랑 방식입니다. 두 사람은 결국 같은 곳에 도달합니다.',
    temperatureGraph: { emotionGap: 72, expressionIntensity: 45, recoverySpeed: 40 },
    expressionSpeed: { personA: '빠른 정리', personB: '천천히 소화', description: '한 사람은 감정을 빠르게 정리하고 다음으로 넘어가고, 다른 사람은 충분히 소화한 후에야 앞으로 갑니다.' },
    recoveryStyle: { icon: 'alone' as const, label: '각자 정리 후 재연결', description: '혼자 정리하는 시간이 필요합니다. 30분 각자 시간 후 다시 만나는 것이 이 관계의 회복 패턴입니다.' },
    dangerPattern: '침묵이 거리감으로 번지는 패턴. 빠른 사람이 "이미 끝났어"라고 생각하는 동안 느린 사람은 혼자 감정을 삭이고 있습니다. 이 간극이 쌓이면 "우리 사이가 멀어졌다"는 느낌이 됩니다.',
    forbiddenWords: ['"왜 아직도 그 얘기야?"', '"그냥 넘어가면 되잖아"', '"벌써 잊었어?"', '"예민하게 굴지 마"'],
    relationStrength: '한 사람의 빠름이 방향을 잡고, 다른 사람의 느림이 깊이를 만듭니다. 속도가 다른 두 사람이 함께 가는 것 자체가 이 관계의 힘입니다.',
    intimacyConnection: {
      marriageNote: '바쁜 일상 속에서 속도가 달라도, 몸의 연결은 말보다 빠르게 마음을 닿게 합니다. 빠른 사람이 먼저 손을 내미는 것이 이 관계에서 가장 용기 있는 행동입니다.',
      loverNote: '속도가 달라서 어색할 때, 말 대신 가까이 앉는 것부터 시작해보세요. 거리가 좁혀지면 말도 자연스럽게 따라옵니다.',
      actions: ['말 없이 옆에 앉아 있기', '빠른 사람이 먼저 손 내밀기', '각자 시간 후 다시 만날 때 짧게 안아주기', '"기다려줘서 고마워" 한마디'],
    },
  },
  성장자극형: {
    typeName: '성장자극형 관계',
    typeEmoji: '⚡',
    coreSummary: '두 사람은 서로를 흔들고, 흔들리면서 성장합니다.',
    tensionDescription: '이 관계에는 긴장이 있습니다. 편안함보다 자극이 있고, 안정보다 변화가 있습니다. 그 긴장이 때로는 갈등이 되지만, 그 갈등이 두 사람을 더 크게 만듭니다.',
    misunderstandingPattern: '"왜 항상 도전해?"  "왜 그냥 넘어가지 못해?" — 한 사람의 자극이 다른 사람에게는 압박이 됩니다. 성장을 원하는 마음이 상대에게는 불편함으로 전달될 수 있습니다.',
    connectionStyle: '갈등 후 "그래서 우리가 성장했어"라고 말할 수 있는 관계. 부딪힌 후 더 가까워지는 것이 이 관계의 연결 방식입니다.',
    recoveryRoutine: '갈등 후 함께 새로운 것을 경험하기. 움직이면서 회복하는 관계입니다. 앉아서 대화하기보다 함께 걷거나 새로운 장소에 가는 것이 효과적입니다.',
    neededWords: '"우리 또 한 단계 올라갔어."',
    recommendedActivity: '처음 가보는 레스토랑, 함께 등산, 새로운 취미 도전. 자극과 변화가 이 관계의 에너지입니다.',
    emotionRecoveryStyle: '갈등 후 바로 대화보다 함께 움직이는 것이 먼저입니다. 걸으면서, 드라이브하면서, 새로운 것을 경험하면서 감정이 자연스럽게 풀립니다.',
    conversationRoutine: '"요즘 네가 도전하고 싶은 게 뭐야?" — 서로의 성장 욕구를 나누는 대화. 현재 상태보다 앞으로 가고 싶은 방향을 이야기하는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '"우리 이번에 뭘 배웠지?" — 갈등이나 새로운 경험 후 함께 배운 것을 나누는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '함께 새로운 것에 도전하기. 처음 해보는 활동을 함께 경험하는 것이 이 관계의 가장 강한 애정 표현입니다.',
    emotionRoutine: '감정을 말로 풀기보다 행동으로 전환하기. 함께 움직이면서 감정이 자연스럽게 정리됩니다.',
    closingMessage: '이 관계는 편안하지 않을 수 있습니다. 하지만 편안함만이 좋은 관계가 아닙니다. 두 사람은 서로를 더 나은 사람으로 만들고 있습니다. 그 긴장이 이 관계의 가장 큰 선물입니다.',
    temperatureGraph: { emotionGap: 58, expressionIntensity: 85, recoverySpeed: 70 },
    expressionSpeed: { personA: '직접적 표현', personB: '내면 처리 후 표현', description: '한 사람은 감정을 바로 표현하고, 다른 사람은 내면에서 처리한 후 표현합니다. 이 차이가 때로는 갈등의 시작이 됩니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '활동 회복형', description: '함께 움직이면서 회복합니다. 대화보다 새로운 경험이 이 관계의 회복 방식입니다.' },
    dangerPattern: '자극이 압박이 되는 패턴. 성장을 원하는 마음이 상대에게 "나는 부족해"라는 느낌을 줄 수 있습니다. 자극과 지지의 균형이 중요합니다.',
    forbiddenWords: ['"왜 그것밖에 못 해?"', '"나라면 벌써 했을 텐데"', '"그게 최선이야?"', '"변화가 없네"'],
    relationStrength: '서로를 흔드는 관계는 드뭅니다. 편안함에 안주하지 않고 서로를 더 나은 방향으로 밀어주는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    intimacyConnection: {
      marriageNote: '긴장과 자극이 많은 관계에서 몸의 연결은 "우리는 여전히 한 팀"이라는 신호입니다. 갈등 후 먼저 안아주는 것이 이 관계에서 가장 강한 화해의 언어입니다.',
      loverNote: '부딪힌 후 가장 먼저 해야 할 것은 가까이 앉는 것입니다. 말보다 먼저 거리를 좁히면 대화가 훨씬 쉬워집니다.',
      actions: ['갈등 후 먼저 안아주기', '새로운 도전 후 함께 자축하기', '긴장이 풀린 순간 손잡기', '"우리 잘 했어" 말하며 토닥이기'],
    },
  },
  안정추구형: {
    typeName: '안정추구형 관계',
    typeEmoji: '🏠',
    coreSummary: '두 사람은 함께 있을 때 가장 편안합니다. 그 편안함이 이 관계의 전부입니다.',
    tensionDescription: '이 관계는 드라마틱하지 않습니다. 큰 갈등도, 극적인 화해도 없습니다. 대신 작은 배려와 익숙한 루틴이 쌓여 신뢰가 됩니다. 그 신뢰가 이 관계의 기반입니다.',
    misunderstandingPattern: '"우리 너무 무난한 거 아니야?" — 안정이 무감각으로 보일 때가 있습니다. 편안함이 당연해지면 서로에 대한 감사가 줄어들 수 있습니다.',
    connectionStyle: '매일 반복되는 작은 것들 — 함께 먹는 밥, 나누는 일상 이야기, 습관처럼 하는 연락. 그 루틴이 이 관계의 연결입니다.',
    recoveryRoutine: '평소 하던 것을 함께 하기. 특별한 것이 필요 없습니다. 익숙한 카페, 자주 가던 산책길, 좋아하는 음식. 일상으로 돌아오는 것이 이 관계의 회복입니다.',
    neededWords: '"우리 오늘도 잘 지냈다."',
    recommendedActivity: '자주 가던 카페에서 각자 좋아하는 것 마시기, 함께 요리하기, 주말 아침 느긋하게 보내기.',
    emotionRecoveryStyle: '특별한 회복 의식이 필요 없습니다. 그냥 평소처럼 함께 있는 것, 그것이 이 관계의 감정 회복입니다.',
    conversationRoutine: '오늘 뭐 먹었어? 오늘 어떤 일 있었어? — 특별하지 않은 일상 이야기가 이 관계의 대화 루틴입니다. 깊은 대화보다 일상을 나누는 것이 이 관계를 유지하는 힘입니다.',
    connectionRoutine: '함께 있는 시간 자체가 이 관계의 정서 연결입니다. 같은 공간에서 각자 좋아하는 것을 하면서도 연결감을 느끼는 것이 이 관계의 특징입니다.',
    affectionRoutine: '함께 요리하기, 같이 드라마 보기, 주말 아침 느긋하게 보내기. 생활 속에서 자연스럽게 함께하는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '감정이 복잡해질 때 평소 하던 루틴으로 돌아오기. 익숙한 것들이 이 관계의 감정 안전망입니다.',
    closingMessage: '이 관계는 조용합니다. 하지만 조용한 것이 덜 사랑하는 것이 아닙니다. 매일 함께 있는 것, 그것이 이 관계의 가장 깊은 사랑 방식입니다. 익숙함 속의 애정을 잊지 마세요.',
    temperatureGraph: { emotionGap: 25, expressionIntensity: 35, recoverySpeed: 55 },
    expressionSpeed: { personA: '안정적 표현', personB: '안정적 표현', description: '두 사람 모두 감정을 크게 표현하지 않습니다. 그 안정감이 이 관계의 편안함이 됩니다.' },
    recoveryStyle: { icon: 'routine' as const, label: '일상 루틴 회복형', description: '특별한 회복 의식이 필요 없습니다. 평소 하던 것을 함께 하는 것이 이 관계의 회복입니다.' },
    dangerPattern: '편안함이 무감각이 되는 패턴. 안정이 당연해지면 서로에 대한 감사와 설렘이 줄어들 수 있습니다. 의식적으로 "오늘 함께해서 좋았어"라고 말하는 것이 필요합니다.',
    forbiddenWords: ['"우리 너무 재미없는 것 같아"', '"항상 똑같아"', '"설레는 게 없어"', '"변화가 없네"'],
    relationStrength: '폭풍이 와도 흔들리지 않는 관계. 안정감이 있다는 것은 서로를 충분히 믿는다는 뜻입니다. 그 신뢰가 이 관계의 가장 큰 자산입니다.',
    intimacyConnection: {
      marriageNote: '오래된 관계에서 익숙한 스킨십은 "나는 여전히 당신 곁에 있어"라는 신호입니다. 매일 하는 작은 것들 — 어깨 토닥이기, 손잡기, 포옹 — 이 관계를 따뜻하게 유지합니다.',
      loverNote: '특별한 날이 아니어도 괜찮습니다. 평범한 날 먼저 손잡는 것, 그것이 이 관계에서 가장 따뜻한 표현입니다.',
      actions: ['매일 아침 짧게 안아주기', '함께 요리하면서 어깨 기대기', '잠들기 전 손잡기', '"오늘도 함께해서 좋았어" 한마디'],
    },
  },
  감정순환형: {
    typeName: '감정순환형 관계',
    typeEmoji: '🌊',
    coreSummary: '두 사람의 감정은 파도처럼 오고 갑니다. 그 흐름을 함께 타는 것이 이 관계입니다.',
    tensionDescription: '이 관계에는 감정의 파도가 있습니다. 가까워졌다가 멀어지고, 따뜻해졌다가 차가워집니다. 그 순환이 이 관계의 리듬입니다. 파도가 무서운 것이 아니라, 파도를 함께 타는 법을 배우는 것이 이 관계의 과제입니다.',
    misunderstandingPattern: '"왜 갑자기 차가워졌어?" "왜 갑자기 가까워지려 해?" — 감정의 파도가 상대에게는 예측 불가능하게 느껴집니다. 감정이 변하는 것이 변심이 아니라 순환임을 서로 이해해야 합니다.',
    connectionStyle: '감정의 파도를 함께 타는 것. "지금 네 감정이 어디에 있어?"라고 묻고, 그 위치를 함께 느끼는 것이 이 관계의 연결입니다.',
    recoveryRoutine: '감정이 가라앉을 때까지 기다리기. 파도가 지나가면 반드시 잔잔해집니다. 파도 중에 억지로 해결하려 하지 말고, 파도가 지나간 후 연결하기.',
    neededWords: '"지금 네 감정이 어디에 있는지 알아. 기다릴게."',
    recommendedActivity: '감정이 잔잔할 때 함께 좋아하는 것 하기. 카페에서 조용히 앉아 있기, 함께 음악 듣기, 드라이브하기.',
    emotionRecoveryStyle: '파도가 지나갈 때까지 기다리는 것. 감정이 격할 때 해결하려 하지 말고, 잔잔해진 후 "그때 어떤 마음이었어?"라고 묻는 것이 이 관계의 회복 방식입니다.',
    conversationRoutine: '"요즘 감정이 어때?" — 일상보다 감정 상태를 먼저 묻는 대화. 사건보다 감정을 먼저 나누는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '감정이 잔잔할 때 "지금 이 순간이 좋아"라고 말하는 것. 파도 사이의 잔잔한 순간을 함께 느끼는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '감정이 잔잔할 때 먼저 가까이 다가가기. 파도가 지나간 후 조용히 손잡기, 어깨 기대기, 함께 음악 듣기.',
    emotionRoutine: '감정의 파도를 인정하기. "지금 파도가 왔어"라고 말하는 것만으로도 이 관계의 감정 회복이 시작됩니다.',
    closingMessage: '감정이 오르내리는 것은 이 관계의 약점이 아닙니다. 파도가 있다는 것은 살아있다는 뜻입니다. 두 사람은 파도를 함께 타는 법을 배우고 있습니다. 그 과정이 이 관계를 깊게 만듭니다.',
    temperatureGraph: { emotionGap: 60, expressionIntensity: 75, recoverySpeed: 65 },
    expressionSpeed: { personA: '감정 파도', personB: '감정 파도', description: '두 사람 모두 감정의 기복이 있습니다. 서로의 파도가 겹칠 때 갈등이 생기고, 엇갈릴 때 연결이 됩니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '공감 대화 회복형', description: '감정이 잔잔해진 후 "그때 어떤 마음이었어?"라고 묻는 대화가 이 관계의 회복입니다.' },
    dangerPattern: '파도가 동시에 오는 패턴. 두 사람의 감정 파도가 동시에 높아지면 갈등이 증폭됩니다. 한 사람이 먼저 파도에서 내려오는 것이 이 관계의 가장 중요한 기술입니다.',
    forbiddenWords: ['"왜 이렇게 감정적이야?"', '"좀 차분하게 말해"', '"또 그 감정이야?"', '"예민하게 굴지 마"'],
    relationStrength: '감정을 깊이 느끼는 두 사람이 만났습니다. 그 깊이가 때로는 갈등이 되지만, 그 깊이 덕분에 이 관계의 연결도 깊습니다. 감정을 함께 느끼는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    intimacyConnection: {
      marriageNote: '감정의 파도가 지나간 후 몸의 연결이 마음을 다시 이어줍니다. 파도가 잔잔해진 순간 먼저 안아주는 것이 이 관계에서 가장 강한 회복의 신호입니다.',
      loverNote: '감정이 복잡할 때 말보다 먼저 가까이 앉아보세요. 몸의 온기가 감정의 파도를 잠재울 수 있습니다.',
      actions: ['파도가 지나간 후 조용히 손잡기', '감정이 잔잔할 때 어깨 기대기', '"지금 이 순간이 좋아" 말하며 안아주기', '함께 음악 들으며 가까이 앉기'],
    },
  },
  거리조절형: {
    typeName: '거리조절형 관계',
    typeEmoji: '↔️',
    coreSummary: '가까워지면 숨막히고, 멀어지면 불안합니다. 두 사람은 지금 그 사이 어딘가를 찾고 있습니다.',
    tensionDescription: '이 관계의 핵심 긴장은 거리입니다. 너무 가까우면 숨막히고, 너무 멀면 불안합니다. 한 사람이 다가가면 다른 사람이 물러서고, 물러서면 다시 다가옵니다. 이 패턴이 반복됩니다.',
    misunderstandingPattern: '"왜 가까워지려 하면 도망가?" "왜 내가 물러서면 쫓아와?" — 거리를 조절하는 방식이 달라서 생기는 오해입니다. 도망가는 것이 거부가 아니라 숨 쉬기 위한 것임을 이해해야 합니다.',
    connectionStyle: '거리를 존중하는 것이 이 관계의 연결 방식입니다. "나 지금 공간이 필요해"라고 말할 수 있는 것, 그리고 그 말을 거부로 듣지 않는 것.',
    recoveryRoutine: '각자의 공간을 충분히 갖고, 준비가 됐을 때 다시 연결하기. 억지로 가까워지려 하지 않는 것이 이 관계의 회복 방식입니다.',
    neededWords: '"나 지금 공간이 필요해. 거부가 아니야."',
    recommendedActivity: '같은 공간에서 각자 좋아하는 것 하기. 함께 있되 각자의 시간을 갖는 활동.',
    emotionRecoveryStyle: '혼자만의 시간이 충전입니다. 공간이 필요할 때 "나 잠깐 혼자 있을게"라고 말하고, 돌아왔을 때 "기다려줘서 고마워"라고 말하는 것.',
    conversationRoutine: '"요즘 혼자 있고 싶은 시간이 얼마나 돼?" — 서로의 공간 필요를 확인하는 대화. 가까움보다 적절한 거리를 함께 찾는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '각자의 공간에서 돌아왔을 때 "다시 만나서 반가워"라고 말하는 것. 거리를 존중한 후의 재연결이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '부담 없는 연결. 짧은 메시지, 가벼운 연락, 억지로 만들지 않는 시간. 자연스럽게 연결되는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '공간이 필요할 때 솔직하게 말하기. "나 지금 충전이 필요해"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '거리는 이 관계의 약점이 아닙니다. 각자의 공간을 존중하면서 함께 있는 것, 그것이 이 관계의 사랑 방식입니다. 가까워지고 싶을 때 다가올 수 있는 관계, 그것이 이 관계의 가장 큰 자유입니다.',
    temperatureGraph: { emotionGap: 65, expressionIntensity: 40, recoverySpeed: 50 },
    expressionSpeed: { personA: '거리 필요', personB: '연결 필요', description: '한 사람은 공간이 필요할 때 물러서고, 다른 사람은 연결이 필요할 때 다가옵니다. 이 타이밍의 차이가 이 관계의 핵심 긴장입니다.' },
    recoveryStyle: { icon: 'alone' as const, label: '공간 회복형', description: '각자의 공간에서 충전하고 돌아오는 것이 이 관계의 회복 방식입니다.' },
    dangerPattern: '추격-도피 패턴. 한 사람이 다가가면 다른 사람이 물러서고, 물러서면 다시 쫓아가는 패턴. 이 패턴이 반복되면 두 사람 모두 지칩니다.',
    forbiddenWords: ['"왜 도망가?"', '"나한테 관심 없어?"', '"왜 항상 혼자 있으려 해?"', '"나랑 있기 싫어?"'],
    relationStrength: '각자의 공간을 존중하면서도 함께 있는 것. 독립적이면서도 연결된 관계는 드뭅니다. 그 균형이 이 관계의 가장 큰 자산입니다.',
    intimacyConnection: {
      marriageNote: '공간이 필요한 관계에서 스킨십은 "나는 여전히 여기 있어"라는 신호입니다. 억지로 가까워지려 하지 말고, 자연스럽게 연결되는 순간을 소중히 하세요.',
      loverNote: '공간이 필요할 때 솔직하게 말하고, 돌아왔을 때 먼저 손잡는 것. 그 작은 행동이 이 관계에서 가장 큰 연결입니다.',
      actions: ['돌아왔을 때 짧게 안아주기', '공간 후 재연결 시 손잡기', '억지로 가까워지지 않기', '"돌아와줘서 고마워" 한마디'],
    },
  },
  보호자형: {
    typeName: '보호자형 관계',
    typeEmoji: '🛡️',
    coreSummary: '한 사람이 지키고, 한 사람이 기댑니다. 그 역할이 때로는 짐이 됩니다.',
    tensionDescription: '이 관계에는 보호하는 사람과 보호받는 사람이 있습니다. 그 역할이 자연스럽게 형성되었지만, 시간이 지나면서 보호하는 사람은 지치고, 보호받는 사람은 의존이 됩니다.',
    misunderstandingPattern: '"왜 항상 내가 챙겨야 해?" "왜 나를 믿어주지 않아?" — 보호하는 사람은 지치고, 보호받는 사람은 통제받는다고 느낍니다. 보호와 통제의 경계가 흐려지는 것이 이 관계의 오해입니다.',
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
    dangerPattern: '역할 고착 패턴. 보호하는 사람은 점점 지치고, 보호받는 사람은 점점 의존합니다. 역할이 고정되면 두 사람 모두 갇히게 됩니다.',
    forbiddenWords: ['"내가 없으면 어떻게 할 거야?"', '"항상 내가 챙겨야 해?"', '"왜 스스로 못 해?"', '"나만 힘들어"'],
    relationStrength: '한 사람이 지키고 한 사람이 기대는 관계는 깊은 신뢰가 있습니다. 그 신뢰를 바탕으로 역할을 나누는 것, 그것이 이 관계의 가장 큰 자산입니다.',
    intimacyConnection: {
      marriageNote: '보호하는 사람이 가끔 기대는 것, 그것이 이 관계에서 가장 용기 있는 행동입니다. 보호받는 사람이 먼저 안아주는 것이 이 관계의 가장 깊은 연결입니다.',
      loverNote: '보호받는 사람이 먼저 다가가는 것. 그 작은 역할 전환이 이 관계를 더 균형 있게 만듭니다.',
      actions: ['보호받는 사람이 먼저 안아주기', '보호하는 사람이 기댈 수 있도록 공간 만들기', '역할 바꿔서 손잡기', '"오늘은 내가 챙길게" 말하기'],
    },
  },
  친구형: {
    typeName: '친구형 관계',
    typeEmoji: '🤝',
    coreSummary: '두 사람은 연인이기 전에 친구입니다. 그 편안함이 이 관계의 가장 큰 자산입니다.',
    tensionDescription: '이 관계는 편안합니다. 연인 같지 않을 때도 있습니다. 그 편안함이 때로는 "우리 너무 친구 같은 거 아니야?"라는 의문을 만들기도 합니다.',
    misunderstandingPattern: '"우리 설레는 게 없어진 것 같아" — 편안함이 설렘을 대체할 때 생기는 오해입니다. 설렘이 줄어든 것이 사랑이 식은 것이 아니라, 더 깊은 신뢰로 발전한 것임을 이해해야 합니다.',
    connectionStyle: '함께 웃는 것. 같이 바보 같은 것을 하고, 같이 웃고, 같이 편안한 것. 그것이 이 관계의 연결입니다.',
    recoveryRoutine: '함께 웃을 수 있는 것 하기. 좋아하는 음식 먹기, 재미있는 것 보기, 같이 바보 같은 것 하기. 웃음이 이 관계의 회복 방식입니다.',
    neededWords: '"우리 오늘 뭐 재미있는 거 하자."',
    recommendedActivity: '함께 좋아하는 것 하기. 게임, 영화, 맛집 탐방, 함께 웃을 수 있는 모든 것.',
    emotionRecoveryStyle: '진지한 대화보다 함께 웃는 것이 먼저입니다. 웃고 나면 진지한 이야기도 자연스럽게 됩니다.',
    conversationRoutine: '"요즘 뭐가 재미있어?" — 일상과 취미를 나누는 대화. 깊은 감정 대화보다 일상을 함께 즐기는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '함께 웃는 순간. 같이 바보 같은 것을 하고 웃는 그 순간이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '함께 좋아하는 것 하기. 게임하기, 맛집 가기, 재미있는 것 보기. 함께 즐기는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '함께 웃는 것으로 감정을 회복하기. 진지한 것보다 가벼운 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '연인이기 전에 친구인 관계는 드뭅니다. 편안함은 사랑이 식은 것이 아니라, 더 깊어진 것입니다. 두 사람은 서로의 가장 좋은 친구이자 연인입니다.',
    temperatureGraph: { emotionGap: 20, expressionIntensity: 40, recoverySpeed: 75 },
    expressionSpeed: { personA: '편안한 표현', personB: '편안한 표현', description: '두 사람 모두 편안하게 표현합니다. 그 편안함이 이 관계의 가장 큰 특징입니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '함께 즐기기 회복형', description: '함께 웃을 수 있는 것을 하면서 자연스럽게 회복됩니다.' },
    dangerPattern: '편안함이 설렘을 대체하는 패턴. 너무 편안해지면 서로에 대한 특별함이 줄어들 수 있습니다. 의식적으로 "연인"으로서의 시간을 만드는 것이 필요합니다.',
    forbiddenWords: ['"우리 너무 친구 같아"', '"설레는 게 없어"', '"재미없어졌어"', '"변한 것 같아"'],
    relationStrength: '편안함과 신뢰. 어떤 상황에서도 함께 웃을 수 있는 관계. 그 편안함이 이 관계의 가장 단단한 기반입니다.',
    intimacyConnection: {
      marriageNote: '친구 같은 관계에서 의식적인 스킨십이 "우리는 친구 이상이야"라는 신호가 됩니다. 편안한 관계에서도 연인으로서의 연결을 잊지 마세요.',
      loverNote: '편안한 관계에서 가끔 먼저 손잡는 것, 그것이 "우리는 친구 이상이야"라는 가장 자연스러운 표현입니다.',
      actions: ['함께 웃다가 자연스럽게 손잡기', '편안한 순간 먼저 안아주기', '같이 좋아하는 것 하면서 어깨 기대기', '"오늘 함께해서 좋았어" 말하기'],
    },
  },
  이상주의형: {
    typeName: '이상주의형 관계',
    typeEmoji: '✨',
    coreSummary: '두 사람은 서로에게서 특별한 무언가를 봅니다. 그 시선이 이 관계를 아름답게 만들고, 때로는 힘들게 합니다.',
    tensionDescription: '이 관계에는 높은 기대가 있습니다. 서로를 이상화하고, 그 이상에 미치지 못할 때 실망합니다. 현실의 상대와 마음속의 상대 사이의 간극이 이 관계의 긴장입니다.',
    misunderstandingPattern: '"왜 예전 같지 않아?" "왜 기대에 못 미쳐?" — 이상화된 상대와 현실의 상대를 비교하는 것이 이 관계의 오해입니다. 현실의 상대를 있는 그대로 보는 것이 이 관계의 과제입니다.',
    connectionStyle: '현실의 상대를 이상화하지 않고 있는 그대로 보는 것. "완벽하지 않아도 괜찮아"라고 말하는 것이 이 관계의 연결입니다.',
    recoveryRoutine: '기대를 내려놓고 지금 이 순간의 상대를 보기. "지금 네가 좋아"라고 말하는 것이 이 관계의 회복입니다.',
    neededWords: '"완벽하지 않아도 괜찮아. 지금 네가 좋아."',
    recommendedActivity: '일상적인 것을 함께 하기. 특별한 것보다 평범한 것을 함께 경험하면서 현실의 상대를 보는 것.',
    emotionRecoveryStyle: '기대를 내려놓는 것. "이 사람이 완벽하지 않아도 괜찮아"라고 스스로에게 말하는 것이 이 관계의 감정 회복 시작입니다.',
    conversationRoutine: '"요즘 어떤 게 힘들어?" — 이상적인 모습이 아닌 현실의 상대를 보는 대화. 완벽하지 않은 모습을 함께 나누는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '"완벽하지 않아도 괜찮아"라고 말하는 순간. 서로의 현실을 인정하는 것이 이 관계의 가장 깊은 정서 연결입니다.',
    affectionRoutine: '평범한 순간을 특별하게 만들기. 일상 속에서 "지금 이 순간이 좋아"라고 말하는 것이 이 관계의 애정 표현입니다.',
    emotionRoutine: '기대와 현실의 간극을 인정하기. "나는 이 사람에게 너무 많은 것을 기대했어"라고 인정하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '이상을 꿈꾸는 것은 아름다운 일입니다. 하지만 현실의 상대도 아름답습니다. 완벽하지 않은 서로를 있는 그대로 보는 것, 그것이 이 관계의 가장 깊은 사랑입니다.',
    temperatureGraph: { emotionGap: 55, expressionIntensity: 70, recoverySpeed: 55 },
    expressionSpeed: { personA: '이상화', personB: '현실', description: '한 사람은 상대를 이상화하고, 다른 사람은 현실적으로 봅니다. 이 시각 차이가 이 관계의 긴장입니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '현실 공유 대화형', description: '이상이 아닌 현실의 서로를 나누는 대화가 이 관계의 회복입니다.' },
    dangerPattern: '이상화와 실망의 반복 패턴. 이상화가 높을수록 실망도 큽니다. 현실의 상대를 있는 그대로 보는 연습이 필요합니다.',
    forbiddenWords: ['"예전 같지 않아"', '"왜 기대에 못 미쳐?"', '"처음엔 달랐는데"', '"내가 생각한 사람이 아니야"'],
    relationStrength: '서로를 특별하게 보는 시선. 그 시선이 현실과 균형을 이룰 때, 이 관계는 가장 아름다워집니다.',
    intimacyConnection: {
      marriageNote: '이상이 아닌 현실의 상대와 함께하는 친밀한 시간이 이 관계를 현실에 뿌리내리게 합니다. 완벽하지 않은 순간에도 가까이 있는 것이 이 관계의 가장 깊은 연결입니다.',
      loverNote: '완벽하지 않은 순간에 먼저 손잡는 것. "지금 네가 좋아"라고 말하며 가까이 다가가는 것이 이 관계의 가장 현실적인 사랑 표현입니다.',
      actions: ['평범한 순간에 먼저 안아주기', '"지금 네가 좋아" 말하며 손잡기', '완벽하지 않은 날 가까이 앉기', '일상 속 작은 것 함께 즐기기'],
    },
  },
  현실균형형: {
    typeName: '현실균형형 관계',
    typeEmoji: '⚖️',
    coreSummary: '두 사람은 현실을 함께 살아갑니다. 그 현실 속에서 사랑을 찾는 것이 이 관계의 과제입니다.',
    tensionDescription: '이 관계는 현실적입니다. 감정보다 상황이 먼저이고, 설렘보다 책임이 먼저입니다. 그 현실 속에서 사랑의 감각을 잃지 않는 것이 이 관계의 긴장입니다.',
    misunderstandingPattern: '"우리 너무 현실적인 것 같아" "감정이 없어진 것 같아" — 현실적인 것이 감정이 없는 것이 아닙니다. 현실을 함께 살아가는 것 자체가 깊은 사랑임을 이해해야 합니다.',
    connectionStyle: '현실을 함께 나누는 것. 고민을 함께 해결하고, 어려움을 함께 넘어가는 것이 이 관계의 연결입니다.',
    recoveryRoutine: '현실적인 문제를 함께 해결하기. 문제가 해결되면 자연스럽게 가까워집니다. 감정보다 행동이 먼저인 관계입니다.',
    neededWords: '"우리 함께 해결해보자."',
    recommendedActivity: '함께 계획 세우기, 함께 문제 해결하기, 함께 목표 정하기. 현실을 함께 살아가는 활동.',
    emotionRecoveryStyle: '문제를 해결하면서 감정도 회복됩니다. 현실적인 것을 함께 해결하는 것이 이 관계의 감정 회복 방식입니다.',
    conversationRoutine: '"요즘 가장 걱정되는 게 뭐야?" — 현실적인 고민을 나누는 대화. 감정보다 상황을 먼저 나누는 것이 이 관계의 대화 루틴입니다.',
    connectionRoutine: '현실적인 문제를 함께 해결한 후 "우리 해냈어"라고 말하는 것. 함께 현실을 살아가는 것이 이 관계의 정서 연결입니다.',
    affectionRoutine: '현실적인 배려. 필요한 것을 먼저 챙겨주기, 어려울 때 옆에 있기, 함께 계획 세우기. 현실 속의 배려가 이 관계의 애정 표현입니다.',
    emotionRoutine: '현실적인 문제를 해결하면서 감정도 정리하기. 행동이 감정을 이끄는 관계입니다.',
    closingMessage: '현실을 함께 살아가는 것이 가장 깊은 사랑입니다. 설렘은 줄어들 수 있지만, 함께 현실을 살아가는 신뢰는 더 깊어집니다. 두 사람은 현실 속에서 사랑을 만들어가고 있습니다.',
    temperatureGraph: { emotionGap: 30, expressionIntensity: 45, recoverySpeed: 60 },
    expressionSpeed: { personA: '현실적 판단', personB: '현실적 판단', description: '두 사람 모두 현실적으로 생각하고 행동합니다. 그 현실감이 이 관계의 안정감이 됩니다.' },
    recoveryStyle: { icon: 'activity' as const, label: '문제 해결 회복형', description: '현실적인 문제를 함께 해결하면서 자연스럽게 회복됩니다.' },
    dangerPattern: '현실에 치여 감정을 잊는 패턴. 현실적인 것에 집중하다 보면 서로에 대한 감정 표현이 줄어들 수 있습니다. 의식적으로 감정을 표현하는 것이 필요합니다.',
    forbiddenWords: ['"감정적으로 굴지 마"', '"현실적으로 생각해"', '"그게 중요해?"', '"그냥 해결하면 되잖아"'],
    relationStrength: '현실을 함께 살아가는 신뢰. 어떤 어려움도 함께 해결할 수 있다는 믿음. 그 신뢰가 이 관계의 가장 단단한 기반입니다.',
    intimacyConnection: {
      marriageNote: '현실적인 관계에서 의식적인 친밀함이 "우리는 현실 이상의 연결이 있어"라는 신호입니다. 바쁜 일상 속에서도 몸의 연결을 잊지 마세요.',
      loverNote: '현실적인 대화 후 가까이 앉는 것. 문제를 함께 해결한 후 손잡는 것이 이 관계의 가장 자연스러운 연결입니다.',
      actions: ['문제 해결 후 함께 안아주기', '현실적인 대화 후 손잡기', '"우리 해냈어" 말하며 토닥이기', '바쁜 날 짧게 포옹하기'],
    },
  },
  회복형: {
    typeName: '회복형 관계',
    typeEmoji: '🌱',
    coreSummary: '두 사람은 갈등 후 반드시 다시 연결됩니다. 그 회복이 이 관계의 가장 큰 힘입니다.',
    tensionDescription: '이 관계에는 갈등이 있습니다. 하지만 갈등보다 중요한 것은 회복입니다. 두 사람은 싸우고, 상처받고, 그리고 다시 가까워집니다. 그 회복의 반복이 이 관계를 더 단단하게 만듭니다.',
    misunderstandingPattern: '"우리 왜 이렇게 자주 싸우지?" — 갈등이 많다는 것이 관계가 나쁘다는 것이 아닙니다. 갈등 후 회복하는 것이 반복될수록 이 관계는 더 깊어집니다.',
    connectionStyle: '갈등을 함께 넘어온 경험이 이 관계의 가장 깊은 연결입니다. "우리 이번에도 해냈어"라는 감각이 쌓일수록 이 관계는 더 단단해집니다.',
    recoveryRoutine: '갈등 후 충분한 시간을 갖고, 다시 만날 때 "그때 힘들었지? 나도 미안했어"라고 시작하기. 빠른 화해보다 진심 어린 회복이 이 관계를 더 단단하게 만듭니다.',
    neededWords: '"우리 또 회복했어. 이번에도 우리가 이겼어."',
    recommendedActivity: '갈등 후 함께 즐거운 시간 만들기. 맛있는 것 먹기, 좋아하는 장소 방문, 함께 웃을 수 있는 것. 회복 후의 연결이 이 관계를 더 단단하게 만듭니다.',
    emotionRecoveryStyle: '갈등 후 빠른 화해보다 충분한 감정 처리 시간이 필요합니다. "나 아직 정리가 안 됐어, 조금만 기다려줘"라고 말하는 것이 이 관계의 가장 정직한 회복 방식입니다.',
    conversationRoutine: '갈등 후 다시 만날 때 "그때 어떤 마음이었어?"라고 먼저 묻기. 사건보다 감정을 먼저 나누는 대화가 진짜 회복을 만듭니다.',
    connectionRoutine: '"우리 또 회복했어"라고 함께 인정하는 순간이 이 관계의 가장 깊은 정서 연결입니다. 갈등을 함께 넘어온 것 자체가 신뢰의 증거입니다.',
    affectionRoutine: '갈등 후 회복했을 때 먼저 안아주기. 화해 후의 포옹이 이 관계에서 가장 따뜻한 애정 표현입니다.',
    emotionRoutine: '갈등 후 빠른 화해보다 충분한 감정 처리 시간 갖기. "나 아직 정리가 안 됐어, 조금만 기다려줘"라고 말하는 것이 이 관계의 감정 회복 방식입니다.',
    closingMessage: '갈등 후 회복하는 것을 반복하며 이 관계는 더 단단해지고 있습니다. 싸우는 것이 문제가 아니라, 어떻게 회복하느냐가 이 관계의 핵심입니다. 두 사람은 이미 그 방법을 알고 있습니다.',
    temperatureGraph: { emotionGap: 55, expressionIntensity: 65, recoverySpeed: 85 },
    expressionSpeed: { personA: '갈등 후 정리', personB: '갈등 후 표현', description: '갈등이 생기면 한 사람은 혼자 정리하고, 다른 사람은 표현하면서 회복합니다. 회복 방식의 차이가 있지만, 두 사람 모두 회복을 원합니다.' },
    recoveryStyle: { icon: 'talk' as const, label: '진심 대화 회복형', description: '충분한 시간이 지난 후 진심 어린 대화로 회복됩니다. 빠른 화해보다 진짜 회복을 선택합니다.' },
    dangerPattern: '회복이 반복되면서 지치는 패턴. 갈등과 회복이 반복되다 보면 "또 이 패턴이야"라는 피로감이 쌓입니다. 회복 후 근본적인 원인을 다루지 않으면 같은 갈등이 반복됩니다.',
    forbiddenWords: ['"또 이 얘기야?"', '"이미 사과했잖아"', '"왜 아직도 그래?"', '"그냥 넘어가면 되잖아"'],
    relationStrength: '갈등 후 회복하는 능력. 싸우고 나서 더 가까워지는 관계는 드뭅니다. 두 사람은 이미 그 방법을 알고 있습니다. 회복을 반복하면서 이 관계는 점점 더 단단해지고 있습니다.',
    intimacyConnection: {
      marriageNote: '회복하는 부부에게 화해의 포옹은 말보다 먼저 마음을 열어줍니다. 갈등 후 먼저 손을 내미는 것, 그것이 이 관계에서 가장 용기 있는 행동입니다.',
      loverNote: '회복하는 과정에서 말이 어렵다면 먼저 가까이 앉는 것부터 시작하세요. 거리가 좁혀지면 말도 자연스럽게 따라옵니다.',
      actions: ['갈등 후 먼저 옆에 앉기', '말 없이 손을 내밀기', '화해 후 짧게 안아주기', '"우리 잘 했어" 말하며 토닥이기'],
    },
  },
};

export function getRelationArchetype(
  familiesA: EnergyFamily[],
  familiesB: EnergyFamily[],
  shapeA?: string,
  shapeB?: string
): ArchetypeResult {
  const dominantA = getDominantFamily(familiesA);
  const dominantB = getDominantFamily(familiesB);
  const key = `${dominantA}-${dominantB}`;
  const reverseKey = `${dominantB}-${dominantA}`;

  // 에너지 조합으로 기본 archetype 결정
  let baseArchetype: RelationArchetype = ARCHETYPE_MAP[key] ?? ARCHETYPE_MAP[reverseKey] ?? '온도차형';

  // 도형 긴장 방향으로 보정
  const shapeTension = getShapeTension(shapeA, shapeB);
  const finalArchetype = adjustArchetypeByShape(baseArchetype, shapeTension);

  return {
    archetype: finalArchetype,
    ...ARCHETYPE_DATA[finalArchetype],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  경량 Archetype 시스템 (친구 / 부모자녀 / 형제자매 / 동료)
// ═══════════════════════════════════════════════════════════════════════════

export interface LightArchetypeResult {
  /** 유형 이름 */
  typeName: string;
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
}

// ─── 친구 5유형 ─────────────────────────────────────────────────────────────
type FriendArchetype =
  | '편안한공감형'
  | '거리존중형'
  | '감정교류형'
  | '오래가는안정형'
  | '자극성장형';

const FRIEND_ARCHETYPE_DATA: Record<FriendArchetype, LightArchetypeResult> = {
  편안한공감형: {
    typeName: '편안한 공감형 우정',
    coreSummary: '말하지 않아도 통하는 사이, 그것이 이 우정의 가장 큰 힘입니다.',
    description: '두 사람은 서로의 감정을 자연스럽게 읽어내는 흐름이 있습니다. 말이 많지 않아도 편안하고, 함께 있는 것만으로 충분한 관계입니다. 다만 서로 너무 배려하다 보면 정작 하고 싶은 말을 못 하는 순간이 생길 수 있습니다.',
    misunderstandingPattern: '배려하느라 솔직한 말을 참다가 나중에 서운함이 쌓이는 패턴이 있습니다.',
    connectionStyle: '조용히 옆에 있어주는 것, 말 없이 함께 있는 시간이 이 우정의 연결 방식입니다.',
    conversationRoutine: '하루 중 기억나는 순간 하나씩 나누기 / 서로 "요즘 어때?" 한 마디로 시작하기',
    recoveryRoutine: '어색해지면 평소처럼 연락하기 / 굳이 설명하지 않아도 다시 연결되는 흐름 믿기',
    relationStrength: '서로를 판단하지 않는 편안함이 이 우정의 가장 큰 자산입니다. 오래 함께할수록 더 자연스러워지는 관계입니다.',
    closingMessage: '이 우정은 말이 많지 않아도 따뜻합니다. 편안함이 진심이라는 것을 두 사람 모두 알고 있습니다.',
  },
  거리존중형: {
    typeName: '거리 존중형 우정',
    coreSummary: '각자의 공간을 지키면서도 필요할 때 곁에 있는 관계입니다.',
    description: '두 사람은 서로의 독립적인 시간과 공간을 존중하는 흐름이 있습니다. 자주 연락하지 않아도 멀어진 것이 아니고, 다시 만나면 바로 연결되는 관계입니다. 다만 한 사람이 더 자주 연락을 원할 때 온도 차이가 느껴질 수 있습니다.',
    misunderstandingPattern: '연락이 뜸해지면 "나한테 관심이 없나?"라고 오해할 수 있습니다.',
    connectionStyle: '강요 없이 서로의 페이스를 맞추는 것, 다시 만날 때 자연스럽게 이어지는 흐름이 연결 방식입니다.',
    conversationRoutine: '연락 없이 지내다가 생각날 때 먼저 연락하기 / 만나면 근황 나누기',
    recoveryRoutine: '거리가 생겨도 먼저 "잘 지내?" 한 마디로 다시 연결하기',
    relationStrength: '서로의 공간을 존중하면서도 다시 연결될 수 있다는 신뢰가 이 우정의 힘입니다.',
    closingMessage: '자주 만나지 않아도 마음속에 있는 관계가 있습니다. 이 우정이 그런 관계입니다.',
  },
  감정교류형: {
    typeName: '감정 교류형 우정',
    coreSummary: '감정을 솔직하게 나눌 수 있는 사이, 그것이 이 우정의 핵심입니다.',
    description: '두 사람은 감정을 나누는 것이 자연스러운 흐름입니다. 기쁨도 슬픔도 함께 느끼고, 서로의 감정에 진심으로 반응하는 관계입니다. 다만 감정의 파도가 클 때 서로에게 부담이 될 수 있습니다.',
    misunderstandingPattern: '감정을 많이 나누다 보면 한 사람이 에너지를 더 많이 쓰는 불균형이 생길 수 있습니다.',
    connectionStyle: '감정을 솔직하게 표현하고 공감받는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '오늘 기분 어때? 한 마디로 시작하기 / 힘든 일 생기면 먼저 연락하기',
    recoveryRoutine: '서운한 감정이 생기면 바로 이야기하기 / 공감 먼저, 해결은 나중에',
    relationStrength: '감정을 숨기지 않아도 되는 관계, 그것이 이 우정의 가장 큰 선물입니다.',
    closingMessage: '서로의 감정을 진심으로 받아주는 사람이 있다는 것, 그것만으로도 충분합니다.',
  },
  오래가는안정형: {
    typeName: '오래가는 안정형 우정',
    coreSummary: '시간이 지날수록 더 편안해지는, 오래된 나무 같은 우정입니다.',
    description: '두 사람은 오랜 시간을 함께하며 쌓인 신뢰가 있습니다. 특별한 이벤트 없이도 함께 있는 것이 자연스럽고, 서로의 변화를 가장 가까이서 지켜본 관계입니다. 다만 익숙함이 당연함이 되지 않도록 가끔은 감사를 표현하는 것이 필요합니다.',
    misunderstandingPattern: '너무 익숙해져서 서로에게 소홀해지거나 당연하게 여기는 순간이 생길 수 있습니다.',
    connectionStyle: '함께한 시간과 공유된 기억이 이 우정의 연결 방식입니다.',
    conversationRoutine: '오래된 추억 이야기하기 / 요즘 달라진 것 나누기',
    recoveryRoutine: '멀어진 느낌이 들면 함께했던 장소 다시 가보기 / 예전처럼 연락하기',
    relationStrength: '세월이 쌓인 관계는 쉽게 흔들리지 않습니다. 이 우정은 시간이 증명한 관계입니다.',
    closingMessage: '오래된 우정은 새로운 설렘은 없어도, 어떤 관계보다 깊은 안정감을 줍니다.',
  },
  자극성장형: {
    typeName: '자극 성장형 우정',
    coreSummary: '서로를 더 나은 사람으로 만드는 우정, 편안하지만 자극이 있습니다.',
    description: '두 사람은 서로에게 긍정적인 자극을 주는 흐름이 있습니다. 대화를 나누면 새로운 생각이 생기고, 함께 있으면 더 성장하고 싶어지는 관계입니다. 다만 경쟁심이나 비교가 생기지 않도록 서로를 응원하는 방향을 유지하는 것이 중요합니다.',
    misunderstandingPattern: '서로의 성장을 응원하다가 어느 순간 비교하거나 경쟁하는 느낌이 생길 수 있습니다.',
    connectionStyle: '서로의 목표와 성장을 공유하고 응원하는 것이 이 우정의 연결 방식입니다.',
    conversationRoutine: '요즘 하고 있는 것 나누기 / 서로의 꿈과 목표 이야기하기',
    recoveryRoutine: '경쟁 느낌이 생기면 "나는 네가 잘 됐으면 좋겠어"라고 솔직하게 말하기',
    relationStrength: '서로를 더 나은 방향으로 이끄는 우정은 드뭅니다. 이 관계가 그런 우정입니다.',
    closingMessage: '함께 성장하는 친구가 있다는 것은 삶에서 가장 큰 선물 중 하나입니다.',
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
  // 에너지 조합 기반 분류
  if (domA === domB) return '편안한공감형';
  if ((domA === 'warm_active' && domB === 'cool_deep') || (domA === 'cool_deep' && domB === 'warm_active')) return '자극성장형';
  if ((domA === 'cool_deep' || domB === 'cool_deep') && (domA === 'neutral' || domB === 'neutral')) return '거리존중형';
  if ((domA === 'warm_soft' || domB === 'warm_soft') || (domA === 'nature' || domB === 'nature')) return '감정교류형';
  if ((domA === 'warm_grounded' || domB === 'warm_grounded') || (domA === 'cool_clear' || domB === 'cool_clear')) return '오래가는안정형';
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

