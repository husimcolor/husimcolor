import type { ColorData } from "./colorData";

export interface PremiumStage1MiniInterpretation {
  colorId: string;
  colorName: string;
  hex: string;
  keywords: string[];
  description: string;
  strengths: string[];
  tiredStates: string[];
}

export interface PremiumStage1Interpretation {
  miniInterpretations: PremiumStage1MiniInterpretation[];
  integrationBridge: string;
  psychologyTendency: string;
  personalityTendency: string;
  strengths: string[];
  growthPossibility: string;
  relationshipTendency: string;
}

interface PremiumColorProfile {
  psychology: string;
  driver: string;
  focus: string;
  expression: string;
  balance: string;
  behavior: string;
  relationship: string;
  strengths: readonly string[];
  tiredStates: readonly string[];
}

/**
 * 유료 심화해석 1단계 전용 컬러 프로필.
 * 1번 컬러는 동력, 2번 컬러는 표현·조절, 3번 컬러는 균형 방향으로 통합한다.
 * 2단계 심리카드 및 이후 분석과는 분리된, 비교적 지속적인 성향 데이터다.
 */
export const PREMIUM_STAGE1_PROFILES: Record<string, PremiumColorProfile> = {
  red: {
    psychology: "목표가 분명할 때 마음이 놓이는", driver: "목표를 향해 바로 움직이는 힘", focus: "빠른 실행과 분명한 결과",
    expression: "주변의 흐름을 세심하게 살피는", balance: "내 속도를 지키는", behavior: "결정이 서면 바로 움직이는",
    relationship: "의견을 솔직히 말하고 함께 방향을 정하는", strengths: ["빠른 실행", "분명한 의사", "끝까지 밀어감"], tiredStates: ["조급한 마음", "쉼 없는 질주"],
  },
  orange: {
    psychology: "사람들과 어울릴 때 마음이 살아나는", driver: "사람 사이에 즐거움을 만드는 힘", focus: "새로운 자극과 즐거운 대화",
    expression: "분위기를 편안하게 풀어내는", balance: "가볍게 마음을 나누는", behavior: "사람들과 있을 때 먼저 분위기를 띄우는",
    relationship: "가볍게 말을 걸고 즐거운 분위기를 만드는", strengths: ["유쾌한 유머", "기발한 발상", "다정한 친화력"], tiredStates: ["애써 밝게 굴기", "속마음 미루기"],
  },
  yellow: {
    psychology: "궁금한 것을 알아갈 때 즐거운", driver: "더 알고 이해하려는 힘", focus: "배움과 충분한 이해",
    expression: "여러 가능성을 찾아보는", balance: "생각을 가볍게 정리하는", behavior: "궁금한 것을 직접 찾아보고 준비하는",
    relationship: "궁금한 점을 묻고 대화로 생각을 나누는", strengths: ["밝은 호기심", "현실적 감각", "꼼꼼한 준비"], tiredStates: ["생각이 많아짐", "시작이 느려짐"],
  },
  green: {
    psychology: "일상의 조화와 안정이 중요한", driver: "사람 사이의 균형을 지키는 힘", focus: "편안한 관계와 균형",
    expression: "주변의 입장을 고르게 살피는", balance: "서로 편안한 거리를 지키는", behavior: "주변의 입장을 고르게 살피는",
    relationship: "작은 약속을 지키며 신뢰를 쌓는", strengths: ["균형감", "꾸준한 돌봄", "안정적인 태도"], tiredStates: ["말을 아끼게 됨", "내 마음 미룸"],
  },
  blue: {
    psychology: "성실하게 임하고 깊은 신뢰를 바라는", driver: "약속을 지키며 책임을 다하는 힘", focus: "책임 있는 관계와 약속",
    expression: "상대의 말을 충분히 듣고 생각하는", balance: "꾸준한 신뢰를 쌓는", behavior: "말보다 행동으로 약속을 지키는",
    relationship: "상대의 말을 충분히 듣고 천천히 마음을 전하는", strengths: ["책임감", "깊은 경청", "든든한 신뢰"], tiredStates: ["혼자 감당함", "속마음 삼킴"],
  },
  indigo: {
    psychology: "겉모습보다 진짜 이유가 궁금한", driver: "본질을 끝까지 이해하려는 힘", focus: "본질을 이해하는 깊이",
    expression: "생각의 이유를 차분히 짚어 보는", balance: "스스로 납득한 방향을 따르는", behavior: "한 가지 궁금증을 끝까지 파고드는",
    relationship: "깊이 있는 이야기와 진심을 나누는", strengths: ["본질 탐구", "직관적 판단", "깊은 통찰"], tiredStates: ["생각에 오래 머묾", "대화 늦어짐"],
  },
  violet: {
    psychology: "마음의 소리를 듣고 의미를 찾는", driver: "가치 있는 것을 표현하려는 힘", focus: "내가 믿는 가치와 꿈",
    expression: "느낀 점을 자기 방식으로 풀어내는", balance: "현실과 마음의 간격을 살피는", behavior: "느낀 점을 자신만의 방식으로 표현하는",
    relationship: "말 너머의 섬세한 감정을 읽고 진심을 나누는", strengths: ["깊은 직관", "풍부한 감수성", "조용한 창조성"], tiredStates: ["생각에 잠김", "대화 미룸"],
  },
  pink: {
    psychology: "상대의 기분을 헤아리고 공감하는", driver: "따뜻한 마음을 나누려는 힘", focus: "따뜻한 관심과 정서적 연결",
    expression: "상대의 표정과 마음을 살피는", balance: "서로 다정함을 주고받는", behavior: "가까운 사람을 세심하게 챙기는",
    relationship: "상대의 기분을 살피고 다정하게 표현하는", strengths: ["다정한 관심", "포근한 배려", "깊은 유대"], tiredStates: ["남을 먼저 챙김", "서운함 삼킴"],
  },
  magenta: {
    psychology: "진심과 소중한 가치에 마음을 다하는", driver: "중요한 일에 깊이 몰입하는 힘", focus: "깊은 애정과 의미 있는 관계",
    expression: "중요한 마음을 정성껏 다루는", balance: "진심이 통하는 자리를 지키는", behavior: "중요한 일에 마음을 다해 몰입하는",
    relationship: "진심이 느껴지는 깊은 대화를 원하는", strengths: ["깊은 애정", "진심 어린 몰입", "변화를 만드는 힘"], tiredStates: ["힘을 한꺼번에 씀", "마음 감춤"],
  },
  coral: {
    psychology: "사람과 따뜻하게 연결될 때 즐거운", driver: "반응을 나누며 활기를 만드는 힘", focus: "반응을 나누는 활기찬 교류",
    expression: "친근한 말과 리액션을 건네는", balance: "함께 웃을 수 있는 분위기를 만드는", behavior: "리액션을 주고받으며 분위기를 만드는",
    relationship: "풍부한 반응으로 마음의 거리를 좁히는", strengths: ["다정한 소통", "활기찬 교류", "빠른 공감"], tiredStates: ["애써 분위기 맞춤", "위로받고 싶은 마음 숨김"],
  },
  gold: {
    psychology: "분명한 기준을 따라 더 나아지고 싶은", driver: "정한 목표를 끝까지 이루려는 힘", focus: "성취의 기쁨과 자기 신뢰",
    expression: "스스로 세운 기준을 지키는", balance: "해낸 만큼 만족을 느끼는", behavior: "세운 목표를 차근차근 완성하는",
    relationship: "예의를 지키며 믿음직한 모습을 보이는", strengths: ["자기 신뢰", "뚜렷한 목표", "정중한 언행"], tiredStates: ["결과에 마음 씀", "비교하는 마음"],
  },
  brown: {
    psychology: "눈앞의 확실함과 든든한 바탕을 바라는", driver: "일상을 꾸준히 지켜 가는 힘", focus: "생활의 안정과 꾸준함",
    expression: "할 수 있는 일을 차근차근 해내는", balance: "익숙한 바탕을 단단히 만드는", behavior: "맡은 일을 일상에서 꾸준히 해내는",
    relationship: "필요한 때 곁을 지키며 실질적인 도움을 주는", strengths: ["꾸준한 실행", "야무진 생활력", "묵묵한 성실함"], tiredStates: ["익숙함 붙잡기", "시작 망설임"],
  },
  beige: {
    psychology: "갈등 없이 주변과 평온하게 지내고 싶은", driver: "편안한 분위기를 지키는 힘", focus: "부드러운 분위기와 일상의 조화",
    expression: "상대가 편안한지 먼저 살피는", balance: "부드러운 속도로 가까워지는", behavior: "주변 분위기에 맞춰 부드럽게 움직이는",
    relationship: "편안한 분위기를 먼저 만드는", strengths: ["온화한 친화력", "일상의 조화", "유연한 적응"], tiredStates: ["의견을 미룸", "속마음 삼킴"],
  },
  white: {
    psychology: "복잡한 생각을 정리하고 개운해지고 싶은", driver: "분명한 기준으로 정돈하는 힘", focus: "명료한 기준과 깔끔한 마무리",
    expression: "필요한 것을 차분히 정리하는", balance: "마음이 편한 순서를 만드는", behavior: "할 일을 정리해 깔끔하게 마무리하는",
    relationship: "진심이 확인될 때까지 천천히 마음을 여는", strengths: ["명료한 기준", "높은 완성도", "꼼꼼한 정돈"], tiredStates: ["혼자 정리하려 함", "먼저 거리 둠"],
  },
  black: {
    psychology: "나만의 선을 지키며 스스로를 보호하는", driver: "쉽게 흔들리지 않는 집중의 힘", focus: "분명한 경계와 믿을 수 있는 관계",
    expression: "상황을 충분히 살핀 뒤 판단하는", balance: "나에게 맞는 거리를 지키는", behavior: "충분히 살핀 뒤 신중하게 결정하는",
    relationship: "믿을 수 있는 사람과 깊이 가까워지는", strengths: ["깊은 집중", "분명한 경계", "독립적인 태도"], tiredStates: ["혼자 감당함", "마음 여는 데 시간"],
  },
  silver: {
    psychology: "한발 물러나 상황을 차분히 살피는", driver: "여러 가능성을 냉정하게 살피는 힘", focus: "차분한 판단과 이성적인 선택",
    expression: "생각을 정리해 이유를 찾는", balance: "필요한 거리를 두고 바라보는", behavior: "상황을 정리해 더 나은 방법을 찾는",
    relationship: "감정을 서두르지 않고 차분하게 소통하는", strengths: ["상황 파악", "신중한 태도", "정갈한 표현"], tiredStates: ["정답 찾기에 몰입", "감정 미룸"],
  },
  olive: {
    psychology: "주변을 두루 살피고 모두의 편안함을 생각하는", driver: "여러 입장을 연결해 균형을 만드는 힘", focus: "넓은 관점과 관계의 균형",
    expression: "다른 사람의 입장을 고르게 살피는", balance: "서로 불편하지 않은 길을 찾는", behavior: "여러 사람의 입장을 고려하는",
    relationship: "서로의 입장을 맞추며 편안한 길을 찾는", strengths: ["넓은 시야", "깊은 생각", "따뜻한 배려"], tiredStates: ["내 필요 미룸", "마음 담아둠"],
  },
  mint: {
    psychology: "새로운 분위기와 변화를 반기는", driver: "새로운 방법을 가볍게 시도하는 힘", focus: "산뜻한 시작과 유연한 적응",
    expression: "익숙한 방식에만 머무르지 않는", balance: "가볍게 방향을 바꾸는", behavior: "새로운 방법을 가볍게 시도하는",
    relationship: "부담 없이 이야기를 나누고 편안하게 소통하는", strengths: ["유연한 태도", "산뜻한 감각", "빠른 적응"], tiredStates: ["주변 먼저 살핌", "일정이 빽빽해짐"],
  },
  skyblue: {
    psychology: "넓은 세상과 새로운 가능성을 보고 싶은", driver: "새로운 가능성에 먼저 눈길이 가는 힘", focus: "자유로운 상상과 가벼운 출발",
    expression: "여러 선택지를 가볍게 열어 두는", balance: "마음 가는 방향을 넓게 보는", behavior: "새로운 경험을 먼저 찾아보는",
    relationship: "새로운 이야기를 나누며 가볍게 다가가는", strengths: ["넓은 시야", "기발한 생각", "빠른 적응"], tiredStates: ["선택지 많아짐", "마음이 분산됨"],
  },
  lavender: {
    psychology: "마음의 작은 변화를 세심하게 느끼는", driver: "마음을 깊이 이해하려는 힘", focus: "조용한 공감과 깊은 이해",
    expression: "분위기와 말투를 세심하게 살피는", balance: "내면의 속도를 존중하는", behavior: "마음의 변화를 조용히 살피는",
    relationship: "말하지 않은 마음까지 이해받고 싶어 하는", strengths: ["섬세한 감수성", "조용한 공감", "내면 성찰"], tiredStates: ["생각이 많아짐", "감정 소모"],
  },
  peach: {
    psychology: "따뜻한 반응과 정서적 연결을 소중히 여기는", driver: "다정한 관심으로 마음을 잇는 힘", focus: "다정한 관심과 공감",
    expression: "상대의 표정과 마음을 세심하게 살피는", balance: "따뜻한 반응을 주고받는", behavior: "상대의 표정과 말을 세심하게 살피는",
    relationship: "감정을 이해받고 따뜻하게 나누고 싶은", strengths: ["정서적 공감", "섬세한 배려", "친화력"], tiredStates: ["내 마음 미룸", "서운함 담아둠"],
  },
  terracotta: {
    psychology: "익숙한 안정을 아끼면서도 변화를 바라는", driver: "일상을 단단하게 꾸려 가는 힘", focus: "단단한 일상과 꾸준한 애정",
    expression: "현실에서 할 수 있는 일을 챙기는", balance: "익숙한 바탕을 지키며 나아가는", behavior: "익숙한 일을 단단하게 꾸려가는",
    relationship: "꾸준한 관심으로 관계를 이어가는", strengths: ["현실 감각", "꾸준한 애정", "단단한 안정감"], tiredStates: ["변화 앞 망설임", "익숙함에 머묾"],
  },
  sage: {
    psychology: "마음의 평온과 조화를 소중히 여기는", driver: "주변을 편안하게 조율하는 힘", focus: "편안한 분위기와 차분한 균형",
    expression: "과하지 않게 관계의 온도를 맞추는", balance: "조용한 평온을 지키는", behavior: "과하지 않게 관계의 균형을 맞추는",
    relationship: "조용히 곁을 지키며 마음을 살피는", strengths: ["세심한 배려", "차분한 균형", "편안한 분위기"], tiredStates: ["의견을 아낌", "감정 혼자 정리"],
  },
  teal: {
    psychology: "머리와 마음 사이에서 분명한 답을 찾는", driver: "복잡한 일의 핵심을 가려내는 힘", focus: "명료한 판단과 깊이 있는 이해",
    expression: "생각을 차분히 정리해 보는", balance: "분명한 기준을 세우는", behavior: "복잡한 일을 핵심부터 정리하는",
    relationship: "생각을 분명히 정리해 오해 없이 말하는", strengths: ["핵심 파악", "차분한 대처", "깔끔한 일 처리"], tiredStates: ["생각이 앞섬", "완벽히 챙김"],
  },
  cream: {
    psychology: "복잡한 생각을 덜고 평온함을 지키고 싶은", driver: "자기 속도를 지키며 정돈하는 힘", focus: "편안한 리듬과 조용한 정돈",
    expression: "서두르지 않고 차분히 살피는", balance: "자기 리듬을 지키는", behavior: "자신의 속도에 맞춰 차분하게 움직이는",
    relationship: "서두르지 않고 편안한 속도로 가까워지는", strengths: ["차분한 태도", "세심한 감각", "단정한 일상"], tiredStates: ["대화가 줄어듦", "생각이 길어짐"],
  },
};

function uniqueTags(values: readonly string[], limit: number): string[] {
  return [...new Set(values)].slice(0, limit);
}

function objectParticle(word: string): string {
  const trimmed = word.trim();
  const lastCode = trimmed.charCodeAt(trimmed.length - 1);
  const isHangul = lastCode >= 0xac00 && lastCode <= 0xd7a3;
  return isHangul && (lastCode - 0xac00) % 28 !== 0 ? "을" : "를";
}

function profileFor(color: ColorData): PremiumColorProfile {
  const profile = PREMIUM_STAGE1_PROFILES[color.id];
  if (!profile) {
    throw new Error("선택한 컬러의 1단계 해석 프로필을 찾을 수 없습니다.");
  }
  return profile;
}

function templateIndex(colors: readonly ColorData[]): number {
  return colors
    .map((color) => color.id)
    .join("")
    .split("")
    .reduce((total, letter) => total + letter.charCodeAt(0), 0) % 4;
}

function buildGrowthPossibility(
  p1: PremiumColorProfile,
  p2: PremiumColorProfile,
  p3: PremiumColorProfile,
  index: number,
): string {
  const templates = [
    `${p1.strengths[0]}과 ${p2.strengths[0]}이 함께 있는 조합입니다. ${p3.strengths[0]}${objectParticle(p3.strengths[0])} 지키는 흐름이 이 장점을 오래 이어 줍니다.`,
    `${p1.focus}${objectParticle(p1.focus)} 향한 힘에 ${p2.focus}이 더해지며, ${p3.focus}까지 놓치지 않는 균형을 만듭니다.`,
    `${p1.strengths[1]}과 ${p2.strengths[1]}이 어우러져, ${p3.strengths[1]}${objectParticle(p3.strengths[1])} 잃지 않는 단단함이 됩니다.`,
    `${p1.driver}과 ${p2.expression} 태도가 함께 있습니다. ${p3.balance} 흐름이 그 힘을 무리 없이 이어 줍니다.`,
  ];
  return templates[index];
}

function buildFusionStrengths(
  p1: PremiumColorProfile,
  p2: PremiumColorProfile,
  p3: PremiumColorProfile,
): string[] {
  return uniqueTags(
    [
      `${p1.strengths[0]}과 ${p2.strengths[0]}`,
      `${p1.strengths[1]}${objectParticle(p1.strengths[1])} 살린 실행`,
      `${p2.strengths[1]}${objectParticle(p2.strengths[1])} 더한 판단`,
      `${p3.strengths[0]}${objectParticle(p3.strengths[0])} 지키는 태도`,
    ],
    4,
  );
}

/**
 * 1단계에만 사용하는 3컬러 통합 해석.
 * 1번은 동력, 2번은 표현·조절, 3번은 균형 방향으로 읽어 세 컬러를 한 사람의 생활 성향으로 연결한다.
 */
export function buildPremiumStage1Interpretation(colors: readonly ColorData[]): PremiumStage1Interpretation {
  if (colors.length !== 3) {
    throw new Error("유료 심화해석 1단계에는 컬러 3개가 필요합니다.");
  }

  const [c1, c2, c3] = colors;
  const [p1, p2, p3] = colors.map(profileFor);

  return {
    miniInterpretations: colors.map((color, index) => {
      const profile = [p1, p2, p3][index];
      return {
        colorId: color.id,
        colorName: color.korName,
        hex: color.hex,
        keywords: color.keywords.slice(0, 3),
        description: `${profile.psychology} 편입니다. ${profile.behavior} 모습이 보입니다.`,
        strengths: profile.strengths.slice(0, 2),
        tiredStates: profile.tiredStates.slice(0, 2),
      };
    }),
    integrationBridge: `${p1.driver}은 ${p2.expression} 방식으로 표현되고, ${p3.balance} 흐름 속에서 균형을 찾습니다.`,
    psychologyTendency:
      `${p1.psychology} 편입니다. ${p2.expression} 태도로, ${p3.balance} 균형을 찾습니다.`,
    personalityTendency:
      `${p1.behavior} 편입니다. ${p2.expression} 태도와 ${p3.balance} 흐름이 함께 보입니다.`,
    strengths: buildFusionStrengths(p1, p2, p3),
    growthPossibility: buildGrowthPossibility(p1, p2, p3, templateIndex([c1, c2, c3])),
    relationshipTendency:
      `관계에서는 ${p1.relationship} 편입니다. ${p2.strengths[0]}과 ${p3.strengths[0]}${objectParticle(p3.strengths[0])} 함께 중요하게 여깁니다.`,
  };
}
