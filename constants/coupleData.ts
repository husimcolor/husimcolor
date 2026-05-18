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
  | '형제자매'
  | '동료';

export type GenderType = '남성' | '여성' | '기타';
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

  // 관계 성향
  const relStyle = card2.relStyle ?? ['따뜻하게 연결되는', '감성적인'];
  const relationshipStyle = `${relStyle[0]} 성향이 있으며, ${relStyle[1]} 방식으로 관계를 이어갑니다.`;

  // 감정 표현 방식 — 1번 카드 기반
  const f1 = getFamily(card1.id);
  const emotionExpression = getEmotionExpression(f1, card1);

  // 보완 컬러 — 3번 카드와 반대 계열에서 선택
  const complement = pickComplementColor(session.colors, card3.id);

  // 코칭 메시지
  const coachingMessage = buildPersonCoachingMessage(card1, card3, session.info.faith);

  return {
    psychologyFlow: card1.reading1,
    currentFlow: card2.reading2,
    recoveryDirection: card3.reading3,
    relationshipStyle,
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
  /** 두 사람의 공통점 */
  commonGround: string;
  /** 서로 다른 기질 */
  differentTemperament: string;
  /** 감정 표현 차이 */
  emotionDifference: string;
  /** 관계 리듬 차이 */
  rhythmDifference: string;
  /** 오해가 생기기 쉬운 패턴 */
  misunderstandingPattern: string;
  /** 관계 회복 방향 */
  recoveryDirection: string;
  /** 정서적 친밀감 스타일 */
  intimacyStyle: string;
  /** 애정 표현 방식 */
  affectionStyle: string;
  /** 서로에게 필요한 표현 */
  neededExpression: { forA: string; forB: string };
  /** 커플 보완 루틴 */
  coupleRoutine: CoupleRoutine;
  /** 마무리 코칭 메시지 */
  closingMessage: string;
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

  // 공통점
  const commonGround = buildCommonGround(hasCommon, commonFamilies, colorsA, colorsB);

  // 다른 기질
  const differentTemperament = buildDifferentTemperament(dominantA, dominantB, colorsA, colorsB);

  // 감정 표현 차이
  const emotionDifference = buildEmotionDifference(familiesA, familiesB, colorsA, colorsB);

  // 관계 리듬 차이
  const rhythmDifference = buildRhythmDifference(dominantA, dominantB);

  // 오해 패턴
  const misunderstandingPattern = buildMisunderstandingPattern(dominantA, dominantB, relationType);

  // 관계 회복 방향
  const recoveryDirection = buildCoupleRecoveryDirection(dominantA, dominantB, relationType);

  // 정서적 친밀감 스타일
  const intimacyStyle = buildIntimacyStyle(dominantA, dominantB, relationType);

  // 애정 표현 방식
  const affectionStyle = buildAffectionStyle(dominantA, dominantB, relationType);

  // 서로에게 필요한 표현
  const neededExpression = buildNeededExpression(dominantA, dominantB, colorsA, colorsB);

  // 커플 보완 루틴
  const coupleRoutine = buildCoupleRoutine(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith);

  // 마무리 코칭 메시지
  const closingMessage = buildClosingMessage(dominantA, dominantB, relationType, personA.info.faith, personB.info.faith);

  return {
    relationFlow,
    commonGround,
    differentTemperament,
    emotionDifference,
    rhythmDifference,
    misunderstandingPattern,
    recoveryDirection,
    intimacyStyle,
    affectionStyle,
    neededExpression,
    coupleRoutine,
    closingMessage,
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
    'warm_active-cool_deep': `${nameA}의 표현하는 흐름과 ${nameB}의 내면으로 담아두는 흐름이 만나고 있습니다. 한 사람은 감정을 밖으로 드러내고, 다른 사람은 안으로 정리하는 방식이라 처음에는 서로 다르다고 느낄 수 있습니다. 하지만 이 차이는 서로를 보완하는 힘이 될 수 있습니다.`,
    'cool_deep-warm_active': `${nameA}의 내면으로 담아두는 흐름과 ${nameB}의 표현하는 흐름이 만나고 있습니다. 서로 다른 방식으로 감정을 다루지만, 그 차이 안에 서로를 채워주는 힘이 있습니다.`,
    'warm_soft-cool_clear': `${nameA}의 따뜻하고 배려하는 흐름과 ${nameB}의 명료하고 신뢰 중심의 흐름이 만나고 있습니다. 감성과 이성이 균형을 이루는 관계로, 서로의 다름이 안정적인 연결을 만들어줄 수 있습니다.`,
    'cool_clear-warm_soft': `${nameA}의 명료하고 신뢰 중심의 흐름과 ${nameB}의 따뜻하고 배려하는 흐름이 만나고 있습니다. 이성과 감성이 자연스럽게 균형을 이루는 관계입니다.`,
    'nature-warm_active': `${nameA}의 조용하고 균형 잡힌 흐름과 ${nameB}의 활기차고 표현하는 흐름이 만나고 있습니다. 한 사람이 안정을 잡아주고 다른 사람이 활력을 불어넣는 보완적인 관계입니다.`,
    'warm_active-nature': `${nameA}의 활기차고 표현하는 흐름과 ${nameB}의 조용하고 균형 잡힌 흐름이 만나고 있습니다. 서로 다른 리듬이 만나 자연스럽게 균형을 이루는 관계입니다.`,
  };

  const key = `${fA}-${fB}`;
  const base = combos[key] ?? `${nameA}와 ${nameB}처럼 서로 다른 결이 만나고 있습니다. 이 차이는 때로 갈등의 씨앗이 되기도 하지만, 서로에게 없는 것을 채워주는 힘이기도 합니다.`;
  // 관계 유형별 마무리 문장 추가
  const relSuffix: Partial<Record<RelationType, string>> = {
    '부부': ' 오랜 시간이 쌓인 관계일수록, 서로의 다름을 다시 이해하는 것이 새로운 시작이 됩니다.',
    '부모-자녀': ' 세대의 차이가 있어도, 서로를 향한 마음은 같습니다. 이해의 방식이 다를 뿐입니다.',
    '형제자매': ' 가장 가까운 사이이기에 더 솔직하게, 더 깊이 이해할 수 있는 관계입니다.',
    '동료': ' 함께 일하는 사이에서도 서로의 결을 이해하면 더 자연스럽게 협력할 수 있습니다.',
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
  colorsA: ColorData[], colorsB: ColorData[]
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
  return sceneMap[key] ?? `${nameA}의 흐름을 가진 사람과 ${nameB}의 흐름을 가진 사람은 감정을 다루는 방식이 다릅니다. 같은 상황에서도 서로 다른 반응이 나올 수 있으며, 이것이 때로는 오해의 씨앗이 됩니다. 서로의 방식이 틀린 것이 아니라 다른 것임을 기억하는 것이 중요합니다.`;
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
    'warm_active-cool_deep': '한 사람이 감정을 바로 표현할 때, 다른 사람은 그 강도에 압도되어 더 안으로 들어갈 수 있습니다. 표현이 없다고 관심이 없는 것이 아니라, 내면에서 조용히 정리하는 중일 수 있습니다.',
    'cool_deep-warm_active': '한 사람이 조용히 있을 때, 다른 사람은 "나를 싫어하는 건가?"라고 오해할 수 있습니다. 침묵은 거리두기가 아니라, 깊이 생각하는 방식입니다.',
    'warm_soft-cool_clear': '한 사람이 감정적으로 표현할 때, 다른 사람은 논리적으로 해결하려 할 수 있습니다. "공감받고 싶은 것"과 "해결책을 주려는 것"의 차이가 오해를 만들 수 있습니다.',
    'cool_clear-warm_soft': '한 사람이 이성적으로 정리하려 할 때, 다른 사람은 "차갑게 느껴진다"고 받아들일 수 있습니다. 이성적 표현 뒤에도 진심이 있습니다.',
    'warm_active-nature': '한 사람이 빠르게 반응하고 표현할 때, 다른 사람은 그 속도에 지칠 수 있습니다. 천천히 가는 것이 무관심이 아니라, 자신의 방식으로 함께하는 것입니다.',
    'nature-warm_active': '한 사람이 조용히 자신의 리듬을 지킬 때, 다른 사람은 "왜 반응이 없지?"라고 느낄 수 있습니다. 조용한 존재감도 함께하는 방식입니다.',
  };

  const key = `${fA}-${fB}`;
  return patterns[key] ?? `두 사람은 서로 다른 방식으로 관계에 반응합니다. 한 사람의 행동이 다른 사람에게 다르게 해석될 수 있으며, 이것이 오해의 씨앗이 되기도 합니다. 서로의 의도를 직접 물어보는 것이 오해를 줄이는 가장 좋은 방법입니다.`;
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
  const styleA = getIntimacyStyleShort(fA);
  const styleB = getIntimacyStyleShort(fB);
  const isCouple = rel === '연인' || rel === '부부';

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

function getIntimacyStyleShort(family: EnergyFamily): string {
  const map: Record<EnergyFamily, string> = {
    warm_active: '함께 활동하고 표현을 나누는',
    warm_soft: '따뜻한 말과 스킨십으로',
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
    warm_soft: isCouple ? '부드러운 말과 따뜻한 스킨십으로' : '따뜻한 말과 배려로',
    warm_grounded: isCouple ? '안정적인 행동과 함께하는 시간으로' : '꾸준한 행동으로',
    cool_clear: isCouple ? '신뢰와 약속을 지키는 것으로' : '신뢰와 일관성으로',
    cool_deep: isCouple ? '깊은 대화와 진심 어린 표현으로' : '진심 어린 말로',
    nature: isCouple ? '조용히 함께 있는 것으로' : '편안한 존재감으로',
    neutral: isCouple ? '정리된 말과 편안한 분위기로' : '균형 잡힌 방식으로',
  };
  return map[family];
}

function buildNeededExpression(
  fA: EnergyFamily, fB: EnergyFamily,
  colorsA: ColorData[], colorsB: ColorData[]
): { forA: string; forB: string } {
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
    forA: `A에게 필요한 표현: ${needed[fA]}`,
    forB: `B에게 필요한 표현: ${needed[fB]}`,
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
    ? buildAffectionRoutine(fA, fB)
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
  const base = [
    '조용한 카페에서 차 한 잔 나누기',
    '자연 속 산책 (공원, 숲길, 강변)',
    '함께 요리하거나 식사 준비하기',
  ];

  if (fA === 'warm_active' || fB === 'warm_active') {
    base.push('가벼운 운동이나 스트레칭 함께하기');
  }
  if (fA === 'cool_deep' || fB === 'cool_deep') {
    base.push('조용한 음악 감상이나 독서 함께하기');
  }
  if (fA === 'nature' || fB === 'nature') {
    base.push('식물 가꾸기나 정원 산책');
  }
  if (rel === '연인' || rel === '부부') {
    base.push('저녁 산책 후 따뜻한 음료 나누기');
  }

  return base.slice(0, 4);
}

function buildRecommendedColors(fA: EnergyFamily, fB: EnergyFamily): { id: string; korName: string; hex: string; reason: string }[] {
  const result: { id: string; korName: string; hex: string; reason: string }[] = [];

  // 항상 그린 포함 (회복·균형)
  result.push({ id: 'green', korName: '그린', hex: '#8FA68E', reason: '두 사람 사이에 자연스러운 회복과 균형을 가져다줍니다.' });

  // 따뜻한 연결이 필요한 경우
  if (fA === 'cool_deep' || fB === 'cool_deep' || fA === 'cool_clear' || fB === 'cool_clear') {
    result.push({ id: 'peach', korName: '피치', hex: '#F4A882', reason: '따뜻한 감정 연결과 부드러운 소통을 도와줍니다.' });
  }

  // 안정이 필요한 경우
  if (fA === 'warm_active' || fB === 'warm_active') {
    result.push({ id: 'lavender', korName: '라벤더', hex: '#B8A9C9', reason: '빠른 흐름 속에서 조용한 안정을 찾아줍니다.' });
  } else {
    result.push({ id: 'sage', korName: '세이지', hex: '#9CAF88', reason: '감정을 자연스럽게 정리하고 균형을 회복합니다.' });
  }

  return result.slice(0, 2);
}

function buildEmotionRecovery(fA: EnergyFamily, fB: EnergyFamily): string {
  if (fA === 'warm_active' && fB === 'cool_deep') {
    return '한 사람이 감정을 표현하고 싶을 때, 다른 사람은 "지금 들을 준비가 됐어"라고 먼저 말해주세요. 준비된 공간에서 나누는 감정이 더 깊이 닿습니다.';
  }
  if (fA === 'cool_deep' && fB === 'warm_active') {
    return '한 사람이 조용히 있을 때, 다른 사람은 그 침묵을 존중해 주세요. 충분히 정리된 후 자연스럽게 나눌 수 있습니다.';
  }
  return '감정이 쌓였을 때 바로 해결하려 하기보다, 먼저 "지금 어떤 마음이야?"라고 물어보는 것이 회복의 시작입니다. 판단 없이 듣는 것이 가장 큰 위로가 됩니다.';
}

function buildConversationRoutine(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string {
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
  if (fA === 'cool_deep' || fB === 'cool_deep') {
    return '같은 공간에서 각자 하고 싶은 것을 하는 "함께하는 혼자 시간"이 두 사람 모두에게 회복이 됩니다. 말 없이 함께 있는 것도 충분한 연결입니다.';
  }
  if (fA === 'warm_active' || fB === 'warm_active') {
    return '가벼운 산책이나 함께하는 움직임이 두 사람의 에너지를 자연스럽게 맞춰줍니다. 움직이면서 나누는 대화가 더 편안하게 느껴질 수 있습니다.';
  }
  return '조용한 음악과 함께 차를 마시며 아무 말 없이 쉬는 시간을 가져보세요. 서로에게 아무것도 요구하지 않는 시간이 가장 깊은 회복이 됩니다.';
}

function buildConnectionRoutine(
  fA: EnergyFamily, fB: EnergyFamily,
  faithA: FaithType, faithB: FaithType
): string {
  const hasFaith = faithA === '기독교' || faithB === '기독교';
  if (hasFaith) {
    return '함께 짧은 감사 기도를 나누거나, 오늘 하루 감사한 것 하나씩 말해보세요. 같은 방향을 바라보는 시간이 정서적 연결을 깊게 만들어줍니다.';
  }
  return '하루를 마치며 "오늘 고마웠던 것" 하나씩 나눠보세요. 작은 감사 표현이 관계의 온기를 유지하는 가장 간단한 루틴입니다.';
}

function buildAffectionRoutine(fA: EnergyFamily, fB: EnergyFamily): string {
  const needsPhysical = fA === 'warm_soft' || fB === 'warm_soft' || fA === 'warm_active' || fB === 'warm_active';
  const needsWords = fA === 'cool_deep' || fB === 'cool_deep';

  if (needsPhysical && needsWords) {
    return '아침이나 저녁에 짧은 포옹과 함께 "오늘도 고마워"라는 말을 나눠보세요. 스킨십과 말이 함께할 때 두 사람 모두에게 닿습니다.';
  }
  if (needsPhysical) {
    return '손잡기, 짧은 포옹, 눈 맞추기 같은 작은 스킨십이 두 사람의 정서적 연결을 유지해줍니다. 말보다 먼저 몸으로 전달되는 따뜻함이 있습니다.';
  }
  if (needsWords) {
    return '"네가 있어서 좋아", "오늘도 수고했어" 같은 짧은 말이 깊이 닿습니다. 거창한 표현보다 진심 어린 한 마디가 더 큰 연결을 만들어줍니다.';
  }
  return '함께하는 일상 속에서 "오늘 뭐 먹고 싶어?", "오늘 어땠어?" 같은 작은 관심이 관계를 따뜻하게 유지해줍니다. 특별한 것보다 꾸준한 것이 더 중요합니다.';
}

function buildClosingMessage(
  fA: EnergyFamily, fB: EnergyFamily,
  rel: RelationType,
  faithA: FaithType, faithB: FaithType
): string {
  const relLabel = rel === '연인' || rel === '부부' ? '두 분' : '두 사람';
  const hasFaith = faithA === '기독교' || faithB === '기독교';

  const messages: Record<string, string> = {
    '연인': `지금 ${relLabel}에게 필요한 것은 완벽한 관계가 아니라, 서로의 다름을 이해하는 시간입니다. 오늘 이 흐름을 함께 나눈 것만으로도 이미 한 걸음 더 가까워졌습니다.`,
    '부부': `오랜 시간을 함께해온 ${relLabel}의 관계 안에는 이미 많은 이해가 쌓여 있습니다. 지금 필요한 것은 새로운 시작이 아니라, 서로를 다시 바라보는 따뜻한 시선입니다. 오늘 이 시간이 그 시작이 되길 바랍니다.`,
    '친구': `좋은 친구 사이에도 서로 다른 감정 흐름이 있습니다. 오늘 서로의 흐름을 이해한 것이 두 사람의 우정을 더 깊고 편안하게 만들어줄 것입니다.`,
    '부모-자녀': `세대가 다르고 경험이 달라도, 서로를 향한 마음은 같습니다. 이해의 언어가 다를 뿐, 두 사람 모두 더 가까이 연결되고 싶은 마음이 있습니다. 오늘 이 흐름이 그 연결의 시작이 되길 바랍니다.`,
    '형제자매': `가장 가까운 사이이기에 더 솔직하고, 때로는 더 상처받기도 합니다. 오늘 서로의 흐름을 이해한 것이 두 사람 사이에 더 따뜻한 공간을 만들어줄 것입니다.`,
    '동료': `함께 일하는 사이에서도 서로의 결을 이해하면 더 자연스럽게 협력하고 편안하게 함께할 수 있습니다. 오늘의 흐름이 더 좋은 관계의 시작이 되길 바랍니다.`,
  };

  const base = messages[rel] ?? `${relLabel}의 관계 흐름을 함께 살펴보았습니다. 서로를 이해하는 것이 관계 회복의 시작입니다.`;

  if (hasFaith) {
    return base + ' 두 분의 관계 위에 하나님의 은혜와 평안이 함께하기를 바랍니다.';
  }

  return base;
}
