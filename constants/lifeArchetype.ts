/**
 * 휴심컬러 — 삶의 역할 에너지 Archetype + 오행 기반 몸·감정 흐름 해석
 *
 * 내부 로직에서만 오행(화/토/금/수/목)을 사용하며,
 * 사용자에게는 자연스러운 코칭 문장으로만 출력합니다.
 */

import type { CardColorType } from './cardData';

// ─────────────────────────────────────────────────────────────────────────────
// 1. 오행 타입 정의 (내부 전용)
// ─────────────────────────────────────────────────────────────────────────────

type OhangElement = '화' | '토' | '금' | '수' | '목';

// ─────────────────────────────────────────────────────────────────────────────
// 2. 컬러 ID → 오행 매핑 (내부 전용)
// ─────────────────────────────────────────────────────────────────────────────

/** 컬러 ID(colorData.ts 기준) → 오행 */
const COLOR_ID_TO_OHANG: Record<string, OhangElement> = {
  // 화(火) — 열정·긴장·활성·빠른 반응
  red:        '화',
  coral:      '화',
  magenta:    '화',
  orange:     '화',
  pink:       '화',
  peach:      '화',
  // 토(土) — 안정·무거움·중심·정체
  yellow:     '토',
  gold:       '토',
  beige:      '토',
  cream:      '토',
  brown:      '토',
  terracotta: '토',
  // 금(金) — 정화·명료·예민·긴장 해소
  white:      '금',
  silver:     '금',
  lavender:   '금',
  // 수(水) — 피로·침잠·깊이·수면·감정 저장
  blue:       '수',
  indigo:     '수',
  navy:       '수',
  black:      '수',
  teal:       '수',
  // 목(木) — 성장·회복·생명력·유연성
  green:      '목',
  olive:      '목',
  mint:       '목',
  sage:       '목',
  skyblue:    '목',
  violet:     '목', // 보라는 목(성장·영성·확장) 계열로 분류
};

/** 심리카드 컬러(CardColorType) → 오행 */
const CARD_COLOR_TO_OHANG: Record<CardColorType, OhangElement> = {
  red:    '화',
  orange: '화',
  yellow: '토',
  green:  '목',
  blue:   '수',
  navy:   '수',
  purple: '목',
  white:  '금',
  black:  '수',
};

/** 도형 → 에너지 강도 가중치 (1.0 기본, 1.3 강화, 0.8 약화) */
const SHAPE_WEIGHT: Record<string, number> = {
  triangle:          1.3,  // 삼각형: 긴장·집중·강화
  inverted_triangle: 1.2,  // 역삼각형: 내면 침잠·감정 하강
  pentagon:          1.2,  // 오각형: 확장·통합
  hexagon:           1.1,  // 육각형: 연결·공동체
  circle:            1.0,  // 원: 순환·기본
  diamond:           1.0,  // 마름모: 균형
  square:            0.9,  // 네모: 안정·현실
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. 오행 점수 계산 (내부 전용)
// ─────────────────────────────────────────────────────────────────────────────

interface OhangScore {
  화: number; 토: number; 금: number; 수: number; 목: number;
}

/**
 * 컬러 3장(colorData) + 심리카드 3장(cardData) 기반 오행 점수 계산
 * - 컬러 3장: 현재 감정 흐름 / 기본 에너지 (가중치 1.0)
 * - 심리카드 3장: 무의식·관계·긴장 구조 (가중치 1.0 × 도형 가중치)
 * - 1번 카드(무의식): ×1.2 추가 가중치
 * - 3번 카드(회복방향): ×0.8 (부족한 에너지를 찾는 방향이므로 역가중)
 */
export function calcOhangScore(
  colorIds: string[],           // 컬러 3장 ID (colorData.ts 기준)
  cards: { color: CardColorType; shape: string }[], // 심리카드 3장
): OhangScore {
  const score: OhangScore = { 화: 0, 토: 0, 금: 0, 수: 0, 목: 0 };

  // 컬러 3장 점수
  colorIds.forEach((id) => {
    const el = COLOR_ID_TO_OHANG[id];
    if (el) score[el] += 1.0;
  });

  // 심리카드 3장 점수 (도형 가중치 적용)
  cards.forEach((card, idx) => {
    const el = CARD_COLOR_TO_OHANG[card.color];
    if (!el) return;
    const shapeW = SHAPE_WEIGHT[card.shape] ?? 1.0;
    const posW = idx === 0 ? 1.2 : idx === 2 ? 0.8 : 1.0;
    score[el] += shapeW * posW;
  });

  return score;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. 오행 흐름 해석 → 사용자 출력 문장 (오행 용어 미노출)
// ─────────────────────────────────────────────────────────────────────────────

export interface EnergyFlowResult {
  /** 현재 몸·감정 흐름 제목 (예: "긴장과 활성이 높은 시기") */
  title: string;
  /** 현재 흐름 설명 2~3문장 */
  description: string;
  /** 회복 방향 제안 1~2문장 */
  recovery: string;
  /** 균형 키워드 (짧은 태그 2~3개) */
  balanceKeywords: string[];
}

/** 총점 대비 특정 오행의 비율 */
function ratio(score: OhangScore, el: OhangElement): number {
  const total = Object.values(score).reduce((a, b) => a + b, 0);
  return total === 0 ? 0 : score[el] / total;
}

/** 가장 높은 오행 반환 */
function dominant(score: OhangScore): OhangElement {
  return (Object.keys(score) as OhangElement[]).reduce((a, b) =>
    score[a] >= score[b] ? a : b
  );
}

/** 가장 낮은 오행 반환 */
function weakest(score: OhangScore): OhangElement {
  return (Object.keys(score) as OhangElement[]).reduce((a, b) =>
    score[a] <= score[b] ? a : b
  );
}

/**
 * 오행 점수 → 사용자에게 보여줄 에너지 흐름 해석 생성
 * 오행 용어는 절대 출력하지 않음
 */
export function interpretEnergyFlow(score: OhangScore): EnergyFlowResult {
  const dom = dominant(score);
  const weak = weakest(score);
  const domRatio = ratio(score, dom);

  // 과다 임계값: 전체의 35% 이상이면 과다로 판단
  const isOverloaded = domRatio >= 0.35;

  // ── 화(火) 과다: 긴장·예민·압박감 ──
  if (dom === '화' && isOverloaded) {
    return {
      title: '긴장과 활성이 높은 시기',
      description:
        '지금은 감정이 빠르게 반응하고 자극에 예민해지는 시기입니다. ' +
        '열정과 추진력이 강하게 살아있지만, 그만큼 몸과 마음이 쉽게 지치는 흐름이기도 합니다. ' +
        '머릿속이 분주하거나 잠들기 어려운 날이 이어질 수 있습니다.',
      recovery:
        '지금은 속도를 조금 낮추고 호흡을 고르는 시간이 필요합니다. ' +
        '차가운 물 한 잔, 짧은 산책, 조용한 음악이 몸의 긴장을 풀어주는 데 도움이 됩니다.',
      balanceKeywords: ['속도 조절', '호흡 회복', '조용한 쉼'],
    };
  }

  // ── 수(水) 과다: 피로·감정 침잠·수면 리듬 저하 ──
  if (dom === '수' && isOverloaded) {
    return {
      title: '감정이 안으로 가라앉는 시기',
      description:
        '지금은 감정이 깊이 가라앉아 있고, 몸도 쉽게 피로해지는 흐름입니다. ' +
        '생각이 많아지거나 수면 리듬이 흐트러질 수 있습니다. ' +
        '혼자 감정을 담아두다가 어느 순간 무거워지는 패턴이 반복될 수 있습니다.',
      recovery:
        '지금은 따뜻한 것들이 필요한 시기입니다. ' +
        '따뜻한 차 한 잔, 신뢰하는 사람과의 짧은 대화, 몸을 따뜻하게 하는 루틴이 회복에 도움이 됩니다.',
      balanceKeywords: ['따뜻한 연결', '감정 표현', '몸 온기'],
    };
  }

  // ── 토(土) 정체: 무거움·답답함·감정 정체 ──
  if (dom === '토' && isOverloaded) {
    return {
      title: '안정을 찾지만 무거움이 느껴지는 시기',
      description:
        '지금은 안정을 원하지만 동시에 답답함이나 무거움이 느껴지는 시기입니다. ' +
        '변화보다 익숙한 것을 선택하게 되고, 감정이 잘 흐르지 않고 정체되는 느낌이 들 수 있습니다. ' +
        '소화가 잘 안 되거나 몸이 무겁게 느껴지는 날이 있을 수 있습니다.',
      recovery:
        '작은 변화 하나가 감정의 흐름을 다시 열어줍니다. ' +
        '산책, 가벼운 스트레칭, 새로운 장소 방문처럼 몸을 움직이는 것이 정체된 에너지를 풀어줍니다.',
      balanceKeywords: ['움직임', '작은 변화', '흐름 회복'],
    };
  }

  // ── 금(金) 과다: 예민·정화 욕구·긴장 ──
  if (dom === '금' && isOverloaded) {
    return {
      title: '정리와 명료함을 원하는 시기',
      description:
        '지금은 주변을 정리하고 싶은 마음이 강하게 올라오는 시기입니다. ' +
        '감정이나 관계에서 불필요한 것을 덜어내고 싶고, 혼자만의 공간이 필요하게 느껴집니다. ' +
        '예민함이 높아져 작은 자극에도 쉽게 피로해질 수 있습니다.',
      recovery:
        '지금은 공간을 비우고 조용한 시간을 갖는 것이 회복에 도움이 됩니다. ' +
        '방 정리, 불필요한 연락 줄이기, 혼자 있는 시간이 마음의 여백을 만들어줍니다.',
      balanceKeywords: ['공간 정리', '조용한 시간', '여백'],
    };
  }

  // ── 목(木) 과다: 성장 욕구 과잉·방향 분산 ──
  if (dom === '목' && isOverloaded) {
    return {
      title: '성장과 확장 욕구가 강한 시기',
      description:
        '지금은 새로운 것을 배우고 확장하려는 욕구가 강하게 살아있는 시기입니다. ' +
        '관심사가 여러 방향으로 뻗어나가며 에너지가 분산될 수 있습니다. ' +
        '무언가를 이루고 싶은 마음이 크지만, 방향이 너무 많아 지치는 순간이 올 수 있습니다.',
      recovery:
        '지금은 한 가지에 집중하는 시간이 필요합니다. ' +
        '가장 중요한 것 하나를 정하고, 나머지는 잠시 내려놓는 것이 에너지를 모아줍니다.',
      balanceKeywords: ['집중', '방향 정리', '한 가지'],
    };
  }

  // ── 균형 상태 또는 특정 오행 부족 ──
  if (weak === '화' && ratio(score, '화') < 0.1) {
    return {
      title: '활력과 표현이 필요한 시기',
      description:
        '지금은 감정 표현이나 행동력이 조금 낮아져 있는 시기입니다. ' +
        '의욕이 잘 살아나지 않거나, 하고 싶은 것이 있어도 실행이 느려지는 흐름이 있습니다.',
      recovery:
        '작은 행동 하나가 활력을 되살려줍니다. ' +
        '좋아하는 음악 듣기, 가벼운 운동, 오랫동안 하고 싶었던 것을 시작해보는 것이 도움이 됩니다.',
      balanceKeywords: ['활력 회복', '행동', '표현'],
    };
  }

  if (weak === '수' && ratio(score, '수') < 0.1) {
    return {
      title: '깊이와 성찰이 필요한 시기',
      description:
        '지금은 바깥으로 향하는 에너지가 강하고, 안으로 쉬는 시간이 부족한 흐름입니다. ' +
        '생각을 정리하거나 감정을 돌아보는 시간이 줄어들어 있을 수 있습니다.',
      recovery:
        '하루 중 조용히 혼자 있는 시간을 만들어보세요. ' +
        '일기 쓰기, 명상, 조용한 산책이 내면의 균형을 회복시켜줍니다.',
      balanceKeywords: ['내면 성찰', '조용한 시간', '감정 정리'],
    };
  }

  // 기본 균형 상태
  return {
    title: '비교적 균형 잡힌 에너지 흐름',
    description:
      '지금은 감정과 몸의 에너지가 비교적 균형을 이루고 있는 시기입니다. ' +
      '특정 방향으로 치우치지 않고 여러 흐름이 함께 살아있습니다. ' +
      '이 균형을 유지하면서 자신에게 필요한 것을 조금씩 채워가는 것이 좋습니다.',
    recovery:
      '지금의 균형을 유지하면서 자신을 조금 더 돌봐주는 시간을 만들어보세요. ' +
      '작은 루틴 하나가 이 흐름을 더 안정적으로 만들어줍니다.',
    balanceKeywords: ['균형 유지', '자기 돌봄', '루틴'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. 삶의 역할 Archetype 정의
// ─────────────────────────────────────────────────────────────────────────────

export type LifeArchetypeKey =
  | 'caregiver'       // 사람돌봄형
  | 'healer'          // 마음돌봄형
  | 'analyst'         // 논리분석형
  | 'leader'          // 리더형
  | 'expert'          // 전문가형
  | 'artist'          // 예술가형
  | 'servant'         // 사역자형
  | 'connector'       // 연결자형
  | 'guardian'        // 수호자형
  | 'explorer';       // 탐구자형

export interface LifeArchetype {
  key: LifeArchetypeKey;
  /** 사용자에게 보여줄 역할 이름 */
  label: string;
  /** 핵심 에너지 설명 (1문장) */
  coreEnergy: string;
  /** 살아나는 환경 (1문장) */
  thriveIn: string;
  /** 지치는 패턴 (1문장) */
  drainPattern: string;
  /** 삶의 방향성 (1~2문장) */
  lifeDirection: string;
  /** 연결 방식 (1문장) */
  connectionStyle: string;
}

const ARCHETYPE_MAP: Record<LifeArchetypeKey, LifeArchetype> = {
  caregiver: {
    key: 'caregiver',
    label: '사람을 돌보는 역할',
    coreEnergy: '사람의 필요를 먼저 알아채고 채워주는 역할에서 에너지가 살아납니다.',
    thriveIn: '누군가가 나를 필요로 하는 환경, 관계 중심의 공간에서 가장 빛납니다.',
    drainPattern: '자신의 필요보다 타인의 필요를 먼저 채우다가 소진되는 패턴이 반복될 수 있습니다.',
    lifeDirection: '돌봄과 연결 중심의 삶이 자연스럽게 맞습니다. 자신도 돌봄받는 시간이 함께 있어야 오래 지속됩니다.',
    connectionStyle: '먼저 다가가고, 상대의 감정 상태를 먼저 확인하는 방식으로 연결됩니다.',
  },
  healer: {
    key: 'healer',
    label: '마음을 회복시키는 역할',
    coreEnergy: '사람의 감정과 내면을 읽고 회복시키는 역할에서 에너지가 살아납니다.',
    thriveIn: '깊은 대화가 가능한 환경, 감정적 안전감이 있는 공간에서 가장 빛납니다.',
    drainPattern: '타인의 감정을 너무 깊이 흡수하다가 자신이 지치는 패턴이 생길 수 있습니다.',
    lifeDirection: '의미와 회복 중심의 삶이 자연스럽게 맞습니다. 경계를 지키면서 돌보는 방식을 찾는 것이 중요합니다.',
    connectionStyle: '상대의 감정 흐름을 먼저 읽고, 말보다 존재감으로 연결되는 방식입니다.',
  },
  analyst: {
    key: 'analyst',
    label: '분석하고 정리하는 역할',
    coreEnergy: '복잡한 것을 명료하게 정리하고 본질을 찾아내는 역할에서 에너지가 살아납니다.',
    thriveIn: '논리적 사고가 필요한 환경, 깊이 있는 문제를 다루는 공간에서 가장 빛납니다.',
    drainPattern: '감정적 상황에서 논리를 먼저 꺼내다가 관계가 멀어지는 패턴이 생길 수 있습니다.',
    lifeDirection: '깊이와 신뢰 기반의 역할이 자연스럽게 맞습니다. 감정적 연결을 함께 유지하는 것이 균형을 만들어줍니다.',
    connectionStyle: '신뢰를 쌓은 후 깊이 연결되는 방식, 말보다 행동으로 관계를 증명합니다.',
  },
  leader: {
    key: 'leader',
    label: '방향을 이끄는 역할',
    coreEnergy: '사람들을 모으고 방향을 제시하는 역할에서 에너지가 살아납니다.',
    thriveIn: '결정이 필요한 환경, 팀이나 공동체를 이끄는 공간에서 가장 빛납니다.',
    drainPattern: '혼자 모든 것을 책임지려다가 소진되는 패턴이 반복될 수 있습니다.',
    lifeDirection: '영향력과 책임 중심의 삶이 자연스럽게 맞습니다. 위임하고 쉬는 것도 리더십의 일부입니다.',
    connectionStyle: '먼저 비전을 제시하고, 사람들이 자연스럽게 따라오는 방식으로 연결됩니다.',
  },
  expert: {
    key: 'expert',
    label: '전문성을 쌓는 역할',
    coreEnergy: '한 분야를 깊이 파고들어 전문성을 쌓는 역할에서 에너지가 살아납니다.',
    thriveIn: '집중할 수 있는 환경, 깊이 있는 연구나 작업이 가능한 공간에서 가장 빛납니다.',
    drainPattern: '완벽함을 추구하다가 시작을 미루거나 자신을 지나치게 평가하는 패턴이 생길 수 있습니다.',
    lifeDirection: '깊이와 전문성 중심의 삶이 자연스럽게 맞습니다. 완성보다 성장의 과정을 즐기는 것이 중요합니다.',
    connectionStyle: '공통 관심사나 전문 영역을 통해 연결되며, 신뢰가 쌓인 관계를 소중히 합니다.',
  },
  artist: {
    key: 'artist',
    label: '감정과 분위기를 표현하는 역할',
    coreEnergy: '감정과 분위기를 읽고 창의적으로 표현하는 역할에서 에너지가 살아납니다.',
    thriveIn: '자유롭게 표현할 수 있는 환경, 창의성이 존중받는 공간에서 가장 빛납니다.',
    drainPattern: '감정이 너무 강하게 올라오거나 표현이 막힐 때 내면에서 압박감이 쌓이는 패턴이 생길 수 있습니다.',
    lifeDirection: '감성과 표현 중심의 삶이 자연스럽게 맞습니다. 감정을 표현하는 루틴이 있을 때 가장 안정적입니다.',
    connectionStyle: '감정과 분위기로 먼저 연결되며, 공감이 깊은 관계에서 에너지가 살아납니다.',
  },
  servant: {
    key: 'servant',
    label: '의미와 사명 중심의 역할',
    coreEnergy: '삶의 의미와 사명을 중심으로 움직이는 역할에서 에너지가 살아납니다.',
    thriveIn: '가치 있는 일을 하는 환경, 공동체나 사명 중심의 공간에서 가장 빛납니다.',
    drainPattern: '의미 없는 일을 반복할 때 빠르게 소진되고, 방향을 잃은 느낌이 드는 패턴이 생길 수 있습니다.',
    lifeDirection: '의미와 연결 중심의 삶이 자연스럽게 맞습니다. 자신의 사명과 일상의 균형을 찾는 것이 중요합니다.',
    connectionStyle: '공통된 가치와 방향성을 통해 깊이 연결되며, 의미 있는 관계를 소중히 합니다.',
  },
  connector: {
    key: 'connector',
    label: '사람과 사람을 연결하는 역할',
    coreEnergy: '사람과 사람 사이를 자연스럽게 연결하고 관계를 만들어가는 역할에서 에너지가 살아납니다.',
    thriveIn: '다양한 사람들이 모이는 환경, 관계와 소통이 활발한 공간에서 가장 빛납니다.',
    drainPattern: '관계 사이에서 중간 역할을 하다가 자신의 감정을 뒤로 미루는 패턴이 생길 수 있습니다.',
    lifeDirection: '관계와 공동체 중심의 삶이 자연스럽게 맞습니다. 자신의 필요도 함께 표현하는 것이 균형을 만들어줍니다.',
    connectionStyle: '자연스럽게 먼저 다가가고, 상대가 편안하게 느끼도록 분위기를 만드는 방식으로 연결됩니다.',
  },
  guardian: {
    key: 'guardian',
    label: '안정과 신뢰를 지키는 역할',
    coreEnergy: '안정적인 환경을 만들고 신뢰를 지키는 역할에서 에너지가 살아납니다.',
    thriveIn: '책임감이 요구되는 환경, 신뢰와 안정이 중요한 공간에서 가장 빛납니다.',
    drainPattern: '변화가 많거나 불확실한 상황에서 에너지가 빠르게 소진되는 패턴이 생길 수 있습니다.',
    lifeDirection: '신뢰와 안정 중심의 삶이 자연스럽게 맞습니다. 변화를 조금씩 받아들이는 연습이 성장을 만들어줍니다.',
    connectionStyle: '천천히 신뢰를 쌓아가며, 한번 연결된 관계를 오래 유지하는 방식입니다.',
  },
  explorer: {
    key: 'explorer',
    label: '탐구하고 확장하는 역할',
    coreEnergy: '새로운 것을 탐구하고 지식과 경험을 확장하는 역할에서 에너지가 살아납니다.',
    thriveIn: '새로운 자극이 있는 환경, 배움과 탐구가 가능한 공간에서 가장 빛납니다.',
    drainPattern: '너무 많은 방향으로 관심이 분산되어 한 가지에 집중하기 어려운 패턴이 생길 수 있습니다.',
    lifeDirection: '성장과 확장 중심의 삶이 자연스럽게 맞습니다. 방향을 하나씩 정해가는 것이 에너지를 모아줍니다.',
    connectionStyle: '공통 관심사나 새로운 경험을 통해 자연스럽게 연결되며, 지적 교류를 즐깁니다.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. 컬러 + 도형 + 오행 → Archetype 도출 로직
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 컬러 ID → 1차 Archetype 후보 목록
 * (한 컬러가 여러 archetype과 연결될 수 있음)
 */
const COLOR_TO_ARCHETYPES: Record<string, LifeArchetypeKey[]> = {
  red:        ['leader', 'explorer'],
  orange:     ['connector', 'caregiver'],
  yellow:     ['analyst', 'explorer'],
  green:      ['caregiver', 'guardian'],
  blue:       ['analyst', 'guardian'],
  indigo:     ['healer', 'expert'],
  violet:     ['healer', 'servant'],
  pink:       ['caregiver', 'connector'],
  magenta:    ['healer', 'artist'],
  coral:      ['connector', 'artist'],
  gold:       ['leader', 'guardian'],
  brown:      ['guardian', 'expert'],
  beige:      ['caregiver', 'guardian'],
  white:      ['expert', 'healer'],
  black:      ['analyst', 'expert'],
  silver:     ['analyst', 'guardian'],
  olive:      ['guardian', 'servant'],
  mint:       ['healer', 'caregiver'],
  skyblue:    ['connector', 'explorer'],
  lavender:   ['healer', 'artist'],
  peach:      ['caregiver', 'connector'],
  terracotta: ['guardian', 'servant'],
  sage:       ['healer', 'guardian'],
  teal:       ['healer', 'analyst'],
  cream:      ['caregiver', 'guardian'],
};

/** 심리카드 컬러 → Archetype 후보 */
const CARD_COLOR_TO_ARCHETYPES: Record<CardColorType, LifeArchetypeKey[]> = {
  red:    ['leader', 'explorer'],
  orange: ['connector', 'caregiver'],
  yellow: ['analyst', 'explorer'],
  green:  ['caregiver', 'guardian'],
  blue:   ['analyst', 'guardian'],
  navy:   ['expert', 'guardian'],
  purple: ['healer', 'servant'],
  white:  ['expert', 'healer'],
  black:  ['analyst', 'expert'],
};

/** 도형 → Archetype 강화 키 */
const SHAPE_TO_ARCHETYPE_BOOST: Record<string, LifeArchetypeKey[]> = {
  circle:            ['connector', 'caregiver'],
  triangle:          ['leader', 'analyst'],
  inverted_triangle: ['healer', 'artist'],
  square:            ['guardian', 'expert'],
  diamond:           ['healer', 'analyst'],
  pentagon:          ['explorer', 'servant'],
  hexagon:           ['connector', 'servant'],
};

/**
 * 컬러 3장 + 심리카드 3장 기반으로 상위 2~3개 Archetype 도출
 */
export function deriveLifeArchetypes(
  colorIds: string[],
  cards: { color: CardColorType; shape: string }[],
): LifeArchetype[] {
  const scoreMap: Partial<Record<LifeArchetypeKey, number>> = {};

  const addScore = (key: LifeArchetypeKey, weight: number) => {
    scoreMap[key] = (scoreMap[key] ?? 0) + weight;
  };

  // 컬러 3장 점수 (1번 컬러: 1.2, 2번: 1.0, 3번: 0.9)
  const colorWeights = [1.2, 1.0, 0.9];
  colorIds.forEach((id, idx) => {
    const archetypes = COLOR_TO_ARCHETYPES[id] ?? [];
    archetypes.forEach((a) => addScore(a, colorWeights[idx] ?? 1.0));
  });

  // 심리카드 3장 점수 (1번 카드: 1.3, 2번: 1.0, 3번: 0.8)
  const cardWeights = [1.3, 1.0, 0.8];
  cards.forEach((card, idx) => {
    const archetypes = CARD_COLOR_TO_ARCHETYPES[card.color] ?? [];
    archetypes.forEach((a) => addScore(a, cardWeights[idx] ?? 1.0));
    // 도형 강화
    const shapeBoosts = SHAPE_TO_ARCHETYPE_BOOST[card.shape] ?? [];
    shapeBoosts.forEach((a) => addScore(a, 0.5));
  });

  // 점수 내림차순 정렬 후 상위 2~3개 반환
  const sorted = (Object.entries(scoreMap) as [LifeArchetypeKey, number][])
    .sort((a, b) => b[1] - a[1]);

  // 상위 3개 또는 점수 차이가 0.5 이내인 것까지 포함 (최대 3개)
  const top = sorted.slice(0, 3);
  const result: LifeArchetype[] = [];

  top.forEach(([key, score], idx) => {
    // 1위와 점수 차이가 너무 크면 제외 (1위 점수의 40% 미만)
    if (idx > 0 && score < (top[0][1] * 0.4)) return;
    const archetype = ARCHETYPE_MAP[key];
    if (archetype) result.push(archetype);
  });

  // 최소 1개는 반환
  if (result.length === 0 && sorted.length > 0) {
    const archetype = ARCHETYPE_MAP[sorted[0][0]];
    if (archetype) result.push(archetype);
  }

  return result.slice(0, 3);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. 종합 Archetype 코칭 문장 생성
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 도출된 Archetype 목록 기반으로 종합 코칭 문장 생성
 * (2~3개 archetype이 함께 있을 때의 복합 해석)
 */
export function buildArchetypeCoaching(archetypes: LifeArchetype[]): string {
  if (archetypes.length === 0) return '';

  if (archetypes.length === 1) {
    const a = archetypes[0];
    return (
      `${a.coreEnergy} ` +
      `${a.thriveIn} ` +
      `${a.lifeDirection}`
    );
  }

  if (archetypes.length === 2) {
    const [a, b] = archetypes;
    return (
      `${a.coreEnergy} ` +
      `동시에 ${b.coreEnergy.replace(/^[가-힣]+의 /, '')} ` +
      `${a.thriveIn} ` +
      `${a.drainPattern} ` +
      `${a.lifeDirection}`
    );
  }

  // 3개
  const [a, b, c] = archetypes;
  return (
    `${a.coreEnergy} ` +
    `${b.coreEnergy.replace(/^[가-힣]+의 /, '')} ` +
    `이 두 흐름이 함께 살아있으면서, ${c.coreEnergy.replace(/^[가-힣]+의 /, '')} ` +
    `${a.thriveIn} ` +
    `${a.drainPattern} ` +
    `${a.lifeDirection}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. 외부 인터페이스 — 심화 결과 화면에서 호출하는 메인 함수
// ─────────────────────────────────────────────────────────────────────────────

export interface LifeEnergyResult {
  /** 삶의 역할 Archetype 목록 (2~3개) */
  archetypes: LifeArchetype[];
  /** 종합 Archetype 코칭 문장 */
  archetypeCoaching: string;
  /** 몸·감정 에너지 흐름 해석 */
  energyFlow: EnergyFlowResult;
}

/**
 * 심화 결과 화면에서 호출하는 메인 함수
 * @param colorIds 컬러 3장 ID (colorData.ts 기준)
 * @param cards 심리카드 3장 { color, shape }
 */
export function buildLifeEnergyResult(
  colorIds: string[],
  cards: { color: CardColorType; shape: string }[],
): LifeEnergyResult {
  const ohangScore = calcOhangScore(colorIds, cards);
  const archetypes = deriveLifeArchetypes(colorIds, cards);
  const archetypeCoaching = buildArchetypeCoaching(archetypes);
  const energyFlow = interpretEnergyFlow(ohangScore);

  return { archetypes, archetypeCoaching, energyFlow };
}
