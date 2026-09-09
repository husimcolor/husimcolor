import type { ColorData } from "./colorData";

export interface PremiumStage1Interpretation {
  psychologyTendency: string;
  personalityTendency: string;
  strengths: string[];
  shadows: string[];
  relationshipTendency: string;
}

interface PremiumColorProfile {
  psychology: string;
  focus: string;
  behavior: string;
  relationship: string;
  strengths: readonly string[];
  growth: readonly string[];
}

/**
 * 유료 심화해석 1단계 전용 컬러 프로필.
 * 각 값은 키워드 나열이 아니라, 3컬러 조합 안에서 자연스럽게 연결할 수 있는 생활 언어로 관리한다.
 */
export const PREMIUM_STAGE1_PROFILES: Record<string, PremiumColorProfile> = {
  red: {
    psychology: "목표가 분명할 때 마음이 놓이는",
    focus: "빠른 실행과 분명한 결과",
    behavior: "결정이 서면 바로 움직이는",
    relationship: "의견을 솔직히 말하고 함께 방향을 정하는",
    strengths: ["빠른 실행", "분명한 의사", "끝까지 밀어감"],
    growth: ["목표를 향해 쉼 없이 달려가는 편", "생각보다 먼저 움직이는 편"],
  },
  orange: {
    psychology: "사람들과 어울릴 때 마음이 살아나는",
    focus: "새로운 자극과 즐거운 대화",
    behavior: "사람들과 있을 때 먼저 분위기를 띄우는",
    relationship: "가볍게 말을 걸고 즐거운 분위기를 만드는",
    strengths: ["유쾌한 유머", "기발한 발상", "다정한 친화력"],
    growth: ["관계에 힘을 많이 쏟는 편", "속마음을 뒤늦게 꺼내는 편"],
  },
  yellow: {
    psychology: "궁금한 것을 알아갈 때 즐거운",
    focus: "배움과 충분한 이해",
    behavior: "궁금한 것을 직접 찾아보고 준비하는",
    relationship: "궁금한 점을 묻고 대화로 생각을 나누는",
    strengths: ["밝은 호기심", "현실적 감각", "꼼꼼한 준비"],
    growth: ["생각이 많아 결정이 늦어지는 편", "준비하느라 시작을 미루는 편"],
  },
  green: {
    psychology: "일상의 조화와 안정이 중요한",
    focus: "편안한 관계와 균형",
    behavior: "주변의 입장을 고르게 살피는",
    relationship: "작은 약속을 지키며 신뢰를 쌓는",
    strengths: ["균형감", "꾸준한 돌봄", "안정적인 태도"],
    growth: ["갈등 앞에서 말을 아끼는 편", "내 마음을 뒤로 미루는 편"],
  },
  blue: {
    psychology: "성실하게 임하고 깊은 신뢰를 바라는",
    focus: "책임 있는 관계와 약속",
    behavior: "말보다 행동으로 약속을 지키는",
    relationship: "상대의 말을 충분히 듣고 천천히 마음을 전하는",
    strengths: ["책임감", "깊은 경청", "든든한 신뢰"],
    growth: ["힘든 일을 혼자 감당하는 편", "속마음을 안으로 삼키는 편"],
  },
  indigo: {
    psychology: "겉모습보다 진짜 이유가 궁금한",
    focus: "본질을 이해하는 깊이",
    behavior: "한 가지 궁금증을 끝까지 파고드는",
    relationship: "깊이 있는 이야기와 진심을 나누는",
    strengths: ["본질 탐구", "직관적 판단", "깊은 통찰"],
    growth: ["혼자 모든 답을 찾으려 하는 편", "속마음을 밖으로 늦게 꺼내는 편"],
  },
  violet: {
    psychology: "마음의 소리를 듣고 의미를 찾는",
    focus: "내가 믿는 가치와 꿈",
    behavior: "느낀 점을 자신만의 방식으로 표현하는",
    relationship: "말 너머의 섬세한 감정을 읽고 진심을 나누는",
    strengths: ["깊은 직관", "풍부한 감수성", "조용한 창조성"],
    growth: ["이상과 현실 사이에서 고민하는 편", "생각에 빠져 소통을 미루는 편"],
  },
  pink: {
    psychology: "상대의 기분을 헤아리고 공감하는",
    focus: "따뜻한 관심과 정서적 연결",
    behavior: "가까운 사람을 세심하게 챙기는",
    relationship: "상대의 기분을 살피고 다정하게 표현하는",
    strengths: ["다정한 관심", "포근한 배려", "깊은 유대"],
    growth: ["남을 돌보다 나를 뒤로 미루는 편", "받고 싶은 호의를 말하지 않는 편"],
  },
  magenta: {
    psychology: "진심과 소중한 가치에 마음을 다하는",
    focus: "깊은 애정과 의미 있는 관계",
    behavior: "중요한 일에 마음을 다해 몰입하는",
    relationship: "진심이 느껴지는 깊은 대화를 원하는",
    strengths: ["깊은 애정", "진심 어린 몰입", "변화를 만드는 힘"],
    growth: ["한꺼번에 힘을 많이 쓰는 편", "밝은 척하며 마음을 감추는 편"],
  },
  coral: {
    psychology: "사람과 따뜻하게 연결될 때 즐거운",
    focus: "반응을 나누는 활기찬 교류",
    behavior: "리액션을 주고받으며 분위기를 만드는",
    relationship: "풍부한 반응으로 마음의 거리를 좁히는",
    strengths: ["다정한 소통", "활기찬 교류", "빠른 공감"],
    growth: ["주변을 챙기며 내 기분을 미루는 편", "위로받고 싶은 마음을 숨기는 편"],
  },
  gold: {
    psychology: "분명한 기준을 따라 더 나아지고 싶은",
    focus: "성취의 기쁨과 자기 신뢰",
    behavior: "세운 목표를 차근차근 완성하는",
    relationship: "예의를 지키며 믿음직한 모습을 보이는",
    strengths: ["자기 신뢰", "뚜렷한 목표", "정중한 언행"],
    growth: ["남과 비교해 성취를 작게 여기는 편", "결과에 마음을 많이 쓰는 편"],
  },
  brown: {
    psychology: "눈앞의 확실함과 든든한 바탕을 바라는",
    focus: "생활의 안정과 꾸준함",
    behavior: "맡은 일을 일상에서 꾸준히 해내는",
    relationship: "필요한 때 곁을 지키며 실질적인 도움을 주는",
    strengths: ["꾸준한 실행", "야무진 생활력", "묵묵한 성실함"],
    growth: ["익숙한 방식에 오래 머무는 편", "충분히 살피느라 시작을 망설이는 편"],
  },
  beige: {
    psychology: "갈등 없이 주변과 평온하게 지내고 싶은",
    focus: "부드러운 분위기와 일상의 조화",
    behavior: "주변 분위기에 맞춰 부드럽게 움직이는",
    relationship: "편안한 분위기를 먼저 만드는",
    strengths: ["온화한 친화력", "일상의 조화", "유연한 적응"],
    growth: ["갈등이 걱정돼 속마음을 삼키는 편", "분위기를 맞추며 의견을 미루는 편"],
  },
  white: {
    psychology: "복잡한 생각을 정리하고 개운해지고 싶은",
    focus: "명료한 기준과 깔끔한 마무리",
    behavior: "할 일을 정리해 깔끔하게 마무리하는",
    relationship: "진심이 확인될 때까지 천천히 마음을 여는",
    strengths: ["명료한 기준", "높은 완성도", "꼼꼼한 정돈"],
    growth: ["생각을 혼자서만 정리하려는 편", "상처를 받으면 먼저 거리를 두는 편"],
  },
  black: {
    psychology: "나만의 선을 지키며 스스로를 보호하는",
    focus: "분명한 경계와 믿을 수 있는 관계",
    behavior: "충분히 살핀 뒤 신중하게 결정하는",
    relationship: "믿을 수 있는 사람과 깊이 가까워지는",
    strengths: ["깊은 집중", "분명한 경계", "독립적인 태도"],
    growth: ["혼자 모든 것을 감당하는 편", "마음을 여는 데 시간이 걸리는 편"],
  },
  silver: {
    psychology: "한발 물러나 상황을 차분히 살피는",
    focus: "차분한 판단과 이성적인 선택",
    behavior: "상황을 정리해 더 나은 방법을 찾는",
    relationship: "감정을 서두르지 않고 차분하게 소통하는",
    strengths: ["상황 파악", "신중한 태도", "정갈한 표현"],
    growth: ["정답을 찾느라 마음을 놓치는 편", "기분보다 이유를 먼저 따지는 편"],
  },
  olive: {
    psychology: "주변을 두루 살피고 모두의 편안함을 생각하는",
    focus: "넓은 관점과 관계의 균형",
    behavior: "여러 사람의 입장을 고려하는",
    relationship: "서로의 입장을 맞추며 편안한 길을 찾는",
    strengths: ["넓은 시야", "깊은 생각", "따뜻한 배려"],
    growth: ["모두를 배려하며 내 필요를 미루는 편", "어색해질까 봐 속마음을 담아두는 편"],
  },
  mint: {
    psychology: "새로운 분위기와 변화를 반기는",
    focus: "산뜻한 시작과 유연한 적응",
    behavior: "새로운 방법을 가볍게 시도하는",
    relationship: "부담 없이 이야기를 나누고 편안하게 소통하는",
    strengths: ["유연한 태도", "산뜻한 감각", "빠른 적응"],
    growth: ["나를 돌보는 일을 뒤로 미루는 편", "쉴 때도 주변을 먼저 살피는 편"],
  },
  skyblue: {
    psychology: "넓은 세상과 새로운 가능성을 보고 싶은",
    focus: "자유로운 상상과 가벼운 출발",
    behavior: "새로운 경험을 먼저 찾아보는",
    relationship: "새로운 이야기를 나누며 가볍게 다가가는",
    strengths: ["넓은 시야", "기발한 생각", "빠른 적응"],
    growth: ["좋은 생각만 하다 시작을 늦추는 편", "하고 싶은 일이 많아 집중이 흐트러지는 편"],
  },
  lavender: {
    psychology: "마음의 작은 변화를 세심하게 느끼는",
    focus: "조용한 공감과 깊은 이해",
    behavior: "마음의 변화를 조용히 살피는",
    relationship: "말하지 않은 마음까지 이해받고 싶어 하는",
    strengths: ["섬세한 감수성", "조용한 공감", "내면 성찰"],
    growth: ["속마음을 혼자 정리하는 편", "상대 기분을 맞추다 지치는 편"],
  },
  peach: {
    psychology: "따뜻한 반응과 정서적 연결을 소중히 여기는",
    focus: "다정한 관심과 공감",
    behavior: "상대의 표정과 말을 세심하게 살피는",
    relationship: "감정을 이해받고 따뜻하게 나누고 싶은",
    strengths: ["정서적 공감", "섬세한 배려", "친화력"],
    growth: ["배려하며 나를 뒤로 미루는 편", "공감받지 못하면 서운해지는 편"],
  },
  terracotta: {
    psychology: "익숙한 안정을 아끼면서도 변화를 바라는",
    focus: "단단한 일상과 꾸준한 애정",
    behavior: "익숙한 일을 단단하게 꾸려가는",
    relationship: "꾸준한 관심으로 관계를 이어가는",
    strengths: ["현실 감각", "꾸준한 애정", "단단한 안정감"],
    growth: ["안정과 변화 사이에서 고민하는 편", "새 환경에 적응할 시간이 필요한 편"],
  },
  sage: {
    psychology: "마음의 평온과 조화를 소중히 여기는",
    focus: "편안한 분위기와 차분한 균형",
    behavior: "과하지 않게 관계의 균형을 맞추는",
    relationship: "조용히 곁을 지키며 마음을 살피는",
    strengths: ["세심한 배려", "차분한 균형", "편안한 분위기"],
    growth: ["감정을 혼자 조용히 정리하는 편", "갈등을 피하려 의견을 아끼는 편"],
  },
  teal: {
    psychology: "머리와 마음 사이에서 분명한 답을 찾는",
    focus: "명료한 판단과 깊이 있는 이해",
    behavior: "복잡한 일을 핵심부터 정리하는",
    relationship: "생각을 분명히 정리해 오해 없이 말하는",
    strengths: ["핵심 파악", "차분한 대처", "깔끔한 일 처리"],
    growth: ["마음보다 생각이 먼저 앞서는 편", "모든 것을 완벽히 챙기려는 편"],
  },
  cream: {
    psychology: "복잡한 생각을 덜고 평온함을 지키고 싶은",
    focus: "편안한 리듬과 조용한 정돈",
    behavior: "자신의 속도에 맞춰 차분하게 움직이는",
    relationship: "서두르지 않고 편안한 속도로 가까워지는",
    strengths: ["차분한 태도", "세심한 감각", "단정한 일상"],
    growth: ["생각하느라 감정 표현이 늦는 편", "혼자 생각하며 소통이 줄어드는 편"],
  },
};

function uniqueTags(values: readonly string[], limit: number): string[] {
  return [...new Set(values)].slice(0, limit);
}

/** 1단계에만 사용하는 3컬러 조합 해석. 2단계 심리카드 및 이후 분석과는 분리한다. */
export function buildPremiumStage1Interpretation(colors: readonly ColorData[]): PremiumStage1Interpretation {
  if (colors.length !== 3) {
    throw new Error("유료 심화해석 1단계에는 컬러 3개가 필요합니다.");
  }

  const [c1, c2, c3] = colors;
  const [p1, p2, p3] = colors.map((color) => PREMIUM_STAGE1_PROFILES[color.id]);

  if (!p1 || !p2 || !p3) {
    throw new Error("선택한 컬러의 1단계 해석 프로필을 찾을 수 없습니다.");
  }

  return {
    psychologyTendency:
      `${p1.psychology} 편입니다. ${p2.focus}, ${p3.focus}도 함께 중요하게 여깁니다.`,
    personalityTendency:
      `일상에서는 ${p1.behavior} 편입니다. ${p2.behavior} 태도와 ${p3.behavior} 방식도 더해집니다.`,
    strengths: uniqueTags([...p1.strengths, ...p2.strengths, ...p3.strengths], 5),
    shadows: uniqueTags([...p1.growth, ...p2.growth, ...p3.growth], 3),
    relationshipTendency:
      `관계에서는 ${p1.relationship} 편이고, ${p2.relationship} 태도와 ${p3.relationship} 모습도 보입니다.`,
  };
}
