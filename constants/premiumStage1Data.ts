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
  growthPossibility: string[];
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

type PrimaryMotive =
  | "action" | "connection" | "understanding" | "harmony" | "trust"
  | "insight" | "meaning" | "care" | "devotion" | "achievement"
  | "stability" | "peace" | "clarity" | "boundary" | "perspective"
  | "novelty" | "freedom" | "sensitivity" | "calm";
type SupportStyle =
  | "direct" | "lively" | "curious" | "considerate" | "thoughtful"
  | "reflective" | "expressive" | "warm" | "wholehearted" | "responsive"
  | "principled" | "practical" | "accommodating" | "organizing" | "guarded"
  | "analytical" | "mediating" | "flexible" | "exploring" | "unhurried";
type BalanceDirection =
  | "pace" | "warmth" | "clarity" | "mutual" | "reliability" | "meaningful"
  | "realistic" | "reciprocal" | "authentic" | "together" | "satisfaction"
  | "grounded" | "ease" | "order" | "autonomy" | "distance" | "fairness"
  | "freedom" | "openness" | "innerPace" | "tenderness" | "continuity"
  | "peaceful" | "standards";
type RelationStyle =
  | "direct" | "friendly" | "conversational" | "dependable" | "loyal"
  | "deep" | "attuned" | "caring" | "devoted" | "responsive" | "respectful"
  | "practical" | "gentle" | "selective" | "guarded" | "measured" | "considerate"
  | "light" | "open" | "empathic" | "steady" | "calm" | "clear" | "unhurried";

interface ColorEngineProfile {
  motive: PrimaryMotive;
  support: SupportStyle;
  balance: BalanceDirection;
  relation: RelationStyle;
}

/**
 * 컬러별 문장을 조합하지 않고, 위치별 역할의 상호작용만 읽기 위한 엔진 값이다.
 * 같은 컬러라도 1번·2번·3번 위치에서 각각 동력·표현 방식·보완 방향으로 작동한다.
 */
const COLOR_ENGINE_PROFILES: Record<string, ColorEngineProfile> = {
  red: { motive: "action", support: "direct", balance: "pace", relation: "direct" },
  orange: { motive: "connection", support: "lively", balance: "warmth", relation: "friendly" },
  yellow: { motive: "understanding", support: "curious", balance: "clarity", relation: "conversational" },
  green: { motive: "harmony", support: "considerate", balance: "mutual", relation: "dependable" },
  blue: { motive: "trust", support: "thoughtful", balance: "reliability", relation: "loyal" },
  indigo: { motive: "insight", support: "reflective", balance: "meaningful", relation: "deep" },
  violet: { motive: "meaning", support: "expressive", balance: "realistic", relation: "attuned" },
  pink: { motive: "care", support: "warm", balance: "reciprocal", relation: "caring" },
  magenta: { motive: "devotion", support: "wholehearted", balance: "authentic", relation: "devoted" },
  coral: { motive: "connection", support: "responsive", balance: "together", relation: "responsive" },
  gold: { motive: "achievement", support: "principled", balance: "satisfaction", relation: "respectful" },
  brown: { motive: "stability", support: "practical", balance: "grounded", relation: "practical" },
  beige: { motive: "peace", support: "accommodating", balance: "ease", relation: "gentle" },
  white: { motive: "clarity", support: "organizing", balance: "order", relation: "selective" },
  black: { motive: "boundary", support: "guarded", balance: "autonomy", relation: "guarded" },
  silver: { motive: "perspective", support: "analytical", balance: "distance", relation: "measured" },
  olive: { motive: "harmony", support: "mediating", balance: "fairness", relation: "considerate" },
  mint: { motive: "novelty", support: "flexible", balance: "freedom", relation: "light" },
  skyblue: { motive: "freedom", support: "exploring", balance: "openness", relation: "open" },
  lavender: { motive: "sensitivity", support: "reflective", balance: "innerPace", relation: "empathic" },
  peach: { motive: "care", support: "warm", balance: "tenderness", relation: "empathic" },
  terracotta: { motive: "stability", support: "practical", balance: "continuity", relation: "steady" },
  sage: { motive: "calm", support: "mediating", balance: "peaceful", relation: "calm" },
  teal: { motive: "clarity", support: "analytical", balance: "standards", relation: "clear" },
  cream: { motive: "calm", support: "unhurried", balance: "pace", relation: "unhurried" },
};

const INTEGRATION_START: Record<PrimaryMotive, string> = {
  action: "해야 할 일이 생기면 먼저 방향을 잡고 움직이려 합니다", connection: "사람과 함께할 때 삶의 활력을 느낍니다",
  understanding: "무엇이 맞는지 충분히 알고 싶어 합니다", harmony: "주변이 편안한 상태를 중요하게 여깁니다",
  trust: "말보다 꾸준한 행동으로 믿음을 확인하고 싶어 합니다", insight: "겉으로 보이는 것보다 이유와 뜻을 살피려 합니다",
  meaning: "내가 중요하게 여기는 가치를 따라 움직이고 싶어 합니다", care: "서로의 마음이 따뜻하게 오가는 것을 소중히 여깁니다",
  devotion: "중요한 일과 사람에게 마음을 깊이 쓰는 편입니다", achievement: "해낸 만큼 분명한 만족을 느끼고 싶어 합니다",
  stability: "일상이 단단하게 이어질 때 마음이 놓입니다", peace: "불필요한 갈등 없이 편안하게 지내고 싶어 합니다",
  clarity: "복잡한 일을 정리해 기준을 분명히 하고 싶어 합니다", boundary: "나에게 맞는 선과 거리를 지키고 싶어 합니다",
  perspective: "한발 물러나 전체 상황을 객관적으로 보고 싶어 합니다", novelty: "새로운 방법과 분위기에 자연스럽게 마음이 갑니다",
  freedom: "답답함 없이 선택할 수 있는 여지를 소중히 여깁니다", sensitivity: "작은 말과 분위기 변화도 놓치지 않으려 합니다",
  calm: "서두르지 않고 자기 속도를 지키는 쪽을 편안하게 여깁니다",
};
const INTEGRATION_SUPPORT: Record<SupportStyle, string> = {
  direct: "판단은 비교적 분명하게 내리며", lively: "밝은 반응으로 분위기를 열며", curious: "여러 가능성을 살펴보며",
  considerate: "각자의 입장을 고르게 살피며", thoughtful: "말을 충분히 듣고 생각하며", reflective: "한 번 더 이유를 짚어 보며",
  expressive: "느낀 점을 자기 방식으로 풀어내며", warm: "다정한 관심을 먼저 건네며", wholehearted: "중요한 마음을 정성껏 다루며",
  responsive: "상대의 반응에 자연스럽게 호응하며", principled: "스스로 세운 기준을 지키며", practical: "현실에서 할 수 있는 일부터 챙기며",
  accommodating: "상대가 편안한지 먼저 살피며", organizing: "필요한 것을 순서대로 정리하며", guarded: "충분히 살핀 뒤 마음을 열며",
  analytical: "사실과 이유를 차분히 확인하며", mediating: "서로 불편하지 않은 방법을 찾으며", flexible: "상황에 따라 방식을 바꾸며",
  exploring: "새로운 경험을 가볍게 시도하며", unhurried: "서두르지 않고 시간을 두며",
};
const INTEGRATION_BALANCE: Record<BalanceDirection, string> = {
  pace: "내가 감당할 수 있는 속도로 일을 이어갑니다", warmth: "서로 편하게 이야기할 수 있을 때 기운이 납니다",
  clarity: "생각이 정리된 뒤에 다음 선택을 합니다", mutual: "서로 불편하지 않은 선을 지키려 합니다",
  reliability: "오래 믿을 수 있는 사람과 방식을 택합니다", meaningful: "스스로 납득할 수 있는 방향을 고릅니다",
  realistic: "마음에 맞고 현실적으로도 가능한 방법을 찾습니다", reciprocal: "주고받는 일이 한쪽으로 치우치지 않게 살핍니다",
  authentic: "진심을 숨기지 않아도 되는 자리에서 편안함을 느낍니다", together: "함께 웃고 반응을 나눌 수 있는 쪽을 택합니다",
  satisfaction: "해낸 일을 인정하고 다음 일을 준비합니다", grounded: "생활에 필요한 기본부터 차근차근 챙깁니다",
  ease: "무리하지 않아도 되는 방법을 고릅니다", order: "해야 할 일의 순서가 보일 때 마음이 편해집니다",
  autonomy: "나에게 맞는 거리와 기준을 유지합니다", distance: "필요한 거리를 두고 상황을 바라봅니다",
  fairness: "어느 한쪽으로 치우치지 않는 길을 찾습니다", freedom: "답답하지 않은 선택의 여지를 남겨 둡니다",
  openness: "새로운 선택지를 남겨 둘 때 편안함을 느낍니다", innerPace: "내가 따라갈 수 있는 속도를 지키려 합니다",
  tenderness: "다정함을 주고받는 자리에서 안정감을 느낍니다", continuity: "익숙한 일상을 지키며 천천히 나아갑니다",
  peaceful: "시끄럽고 복잡하지 않은 쪽을 선택합니다", standards: "기준이 분명할 때 생각이 정리됩니다",
};

/** 세 컬러 연결 문구 전용: 각 위치의 역할을 하나의 성격 구조로 읽는다. */
const NARRATIVE_CORE: Record<PrimaryMotive, string> = {
  action: "할 일이 생기면 먼저 방향을 정하고", connection: "사람과 함께할 때 기운을 얻고", understanding: "궁금한 점은 끝까지 확인하고",
  harmony: "주변 사람이 불편하지 않은지 살피고", trust: "말보다 꾸준한 행동으로 믿음을 확인하고", insight: "겉으로 보이는 답보다 이유를 더 살피고",
  meaning: "내가 중요하게 여기는 이유가 있어야 움직이고", care: "상대가 어떤 기분인지 먼저 생각하고", devotion: "중요한 일과 사람에게 오래 정성을 들이고",
  achievement: "분명한 결과를 만들고 싶어 하고", stability: "맡은 일을 꾸준히 해내고", peace: "불필요한 갈등 없이 지내고 싶어 하고",
  clarity: "복잡한 일을 정리해 기준을 세우고", boundary: "쉽게 휘둘리지 않으려 하고", perspective: "한쪽으로 치우치지 않게 상황을 보고",
  novelty: "새로운 방법을 찾아보고", freedom: "내가 고를 수 있는 방법을 남겨 두고", sensitivity: "상대가 편한지 세심하게 살피고",
  calm: "서두르지 않고 내 속도를 지키고",
};
const NARRATIVE_EXPRESSION: Record<SupportStyle, string> = {
  direct: "할 일을 미루지 않는", lively: "밝은 반응으로 분위기를 여는", curious: "궁금한 점을 직접 확인해 보는",
  considerate: "주변의 입장을 함께 헤아리는", thoughtful: "말을 충분히 듣고 판단하는", reflective: "한 번 더 생각해 본 뒤 움직이는",
  expressive: "느낀 점을 자기 방식으로 표현하는", warm: "다정한 관심을 먼저 건네는", wholehearted: "중요한 일에 오래 집중하는",
  responsive: "달라진 상황을 보고 바로 움직이는", principled: "자신의 기준을 지키는", practical: "지금 할 수 있는 일부터 챙기는",
  accommodating: "상대가 편안한지 먼저 살피는", organizing: "필요한 것을 순서대로 정리하는", guarded: "충분히 확인한 뒤에야 마음을 보이는",
  analytical: "사실과 이유를 확인하는", mediating: "서로 다른 의견을 조율하는", flexible: "상황에 맞춰 방법을 바꾸는",
  exploring: "낯선 것을 직접 해 보는", unhurried: "필요한 정보를 확인한 뒤 판단하는",
};
const NARRATIVE_DIRECTION: Record<BalanceDirection, string> = {
  pace: "빠르게 움직여도 자기 리듬을 잃지 않으려 합니다", warmth: "서로 편하게 이야기할 수 있는 관계에서 기운이 납니다",
  clarity: "생각이 정돈된 뒤에야 마음을 놓습니다", mutual: "상대의 개인 시간을 존중하는 관계를 좋아합니다",
  reliability: "오래 믿을 수 있는 사람과 방식을 선택합니다", meaningful: "스스로 납득할 수 있는 길을 고릅니다",
  realistic: "마음에 맞고 현실적으로도 가능한 방법을 찾습니다", reciprocal: "신뢰가 쌓이면 속마음도 나누고 싶어 합니다",
  authentic: "진심을 숨기지 않아도 되는 자리에서 편안함을 느낍니다", together: "함께 웃고 반응을 나눌 때 자연스러워집니다",
  satisfaction: "해낸 일을 인정하며 다음으로 나아갑니다", grounded: "생활에 필요한 기본을 챙길 때 안정됩니다",
  ease: "과하지 않은 속도와 부드러운 분위기를 고릅니다", order: "정돈된 환경에서 편안함을 느낍니다",
  autonomy: "나에게 맞는 거리와 기준을 유지합니다", distance: "필요한 거리를 두며 관계와 일을 바라봅니다",
  fairness: "내 일과 주변 사람을 모두 챙길 수 있는 방법을 찾습니다", freedom: "답답하지 않은 선택의 여지를 남겨 둡니다",
  openness: "새로운 선택지가 남아 있을 때 가장 편안합니다", innerPace: "일정을 너무 빽빽하게 잡지 않으려 합니다",
  tenderness: "다정한 말과 관심이 오갈 때 마음을 엽니다", continuity: "익숙한 일상을 지키며 천천히 나아갑니다",
  peaceful: "시끄럽고 복잡하지 않은 쪽을 선택합니다", standards: "기준이 분명할 때 생각을 정리합니다",
};

/** 3번 보완방향 컬러의 고유한 기질을 통합문의 마무리에 반영한다. */
const THIRD_COLOR_DIRECTION: Record<string, string> = {
  red: "마지막까지 해낼 수 있는 속도를 찾습니다",
  orange: "즐겁게 이어 갈 수 있는 자리를 고릅니다",
  yellow: "이해가 되면 다음 선택으로 넘어갑니다",
  green: "모두가 무리 없는 방향을 찾습니다",
  blue: "오래 지킬 수 있는 방식을 택합니다",
  indigo: "스스로 납득되는 결론을 따릅니다",
  violet: "마음에 맞고 현실적인 방법을 찾습니다",
  pink: "한쪽만 힘들지 않은 관계를 바랍니다",
  magenta: "꾸밈없이 말할 수 있는 자리를 고릅니다",
  coral: "함께 웃을 수 있는 분위기를 만들고 싶어 합니다",
  gold: "해낸 일을 인정하고 다음을 준비합니다",
  brown: "생활에 필요한 기본부터 차근차근 챙깁니다",
  beige: "무리하지 않아도 되는 길을 고릅니다",
  white: "정돈된 순서가 보일 때 안심합니다",
  black: "나에게 맞는 거리와 기준을 지킵니다",
  silver: "한걸음 떨어져 상황을 바라봅니다",
  olive: "어느 한쪽으로 치우치지 않는 길을 찾습니다",
  mint: "답답하지 않은 선택의 여지를 남겨 둡니다",
  skyblue: "새로운 선택지가 남아 있을 때 여유가 생깁니다",
  lavender: "내가 따라갈 수 있는 속도를 지킵니다",
  peach: "다정한 관심을 받으며 마음을 엽니다",
  terracotta: "익숙한 일상을 지키며 천천히 나아갑니다",
  sage: "시끄럽고 복잡하지 않은 쪽을 고릅니다",
  teal: "기준이 분명할 때 생각이 정리됩니다",
  cream: "내가 감당할 수 있는 속도로 일을 이어갑니다",
};

/** 3번 컬러가 내면의 안정 조건으로 남기는 고유한 결을 반영한다. */
const THIRD_COLOR_PSYCHOLOGY: Record<string, string> = {
  red: "해낸 일이 눈에 보일 때 자신감이 생깁니다",
  orange: "가볍게 웃을 수 있을 때 기분이 살아납니다",
  yellow: "궁금한 점이 풀릴 때 답답함이 줄어듭니다",
  green: "생활이 무리 없이 돌아갈 때 숨이 놓입니다",
  blue: "계획한 일이 꾸준히 이어질 때 안심합니다",
  indigo: "이유가 납득될 때 생각이 가라앉습니다",
  violet: "중요하게 여기는 뜻이 보일 때 힘이 납니다",
  pink: "따뜻한 말을 들을 때 기분이 풀립니다",
  magenta: "진심을 숨기지 않아도 될 때 긴장이 풀립니다",
  coral: "웃을 일이 생기면 기분이 금방 살아납니다",
  gold: "해낸 일이 눈에 보일 때 만족을 느낍니다",
  brown: "익숙한 일상이 이어질 때 든든합니다",
  beige: "부드러운 자리에서 숨이 놓입니다",
  white: "해야 할 일이 정돈되면 머리가 맑아집니다",
  black: "내 선이 지켜질 때 긴장이 풀립니다",
  silver: "한걸음 떨어져 생각할 때 판단이 또렷해집니다",
  olive: "여러 선택이 고르게 맞을 때 안심합니다",
  mint: "방식을 바꿀 여지가 있을 때 답답함이 줄어듭니다",
  skyblue: "넓게 생각할 틈이 있을 때 기분이 가벼워집니다",
  lavender: "작은 변화를 천천히 받아들일 때 안정됩니다",
  peach: "다정한 말을 들을 때 표정이 풀립니다",
  terracotta: "손에 익은 일을 해낼 때 든든합니다",
  sage: "소란이 잦아들면 기운이 돌아옵니다",
  teal: "핵심이 분명해지면 생각이 가벼워집니다",
  cream: "일정을 너무 빽빽하게 잡지 않을 때 숨이 놓입니다",
};

/** 3번 컬러가 실제 선택·일 처리의 마무리에 더하는 고유한 방식을 반영한다. */
const THIRD_COLOR_ACTION: Record<string, string> = {
  red: "마지막 고비에서도 추진력을 잃지 않습니다",
  orange: "분위기를 살릴 수 있는 방법을 더합니다",
  yellow: "필요한 정보를 모은 뒤 다음 단계로 갑니다",
  green: "과정이 오래 갈 수 있도록 속도를 맞춥니다",
  blue: "계획한 일을 끝까지 해낼 수 있는 방법을 고릅니다",
  indigo: "겉보다 이유를 짚어 본 뒤 결론을 냅니다",
  violet: "자기다운 방법으로 생각을 풀어냅니다",
  pink: "호의가 한쪽으로 쏠리지 않게 조절합니다",
  magenta: "중요한 부분에 힘을 모아 끝까지 밀고 갑니다",
  coral: "반응이 살아나는 쪽으로 일을 풀어갑니다",
  gold: "목표에 닿았는지 점검하며 마무리합니다",
  brown: "생활에 바로 이어질 수 있게 일을 마무리합니다",
  beige: "부담이 덜한 순서를 골라 진행합니다",
  white: "빠진 일이 없는지 점검하며 끝냅니다",
  black: "내가 감당할 수 있는 범위에서 선을 정합니다",
  silver: "여러 경우를 비교해 더 나은 쪽을 고릅니다",
  olive: "엇갈린 조건을 고르게 맞춰 마무리합니다",
  mint: "한 가지 방법에 묶이지 않고 선택지를 바꿉니다",
  skyblue: "새 길을 남겨 둔 채 다음으로 넘어갑니다",
  lavender: "생각할 틈을 남겨 두고 급하게 결론 내리지 않습니다",
  peach: "말 한마디가 거칠어지지 않게 표현을 고릅니다",
  terracotta: "평소 리듬이 크게 흔들리지 않게 이어 갑니다",
  sage: "복잡한 일은 단순한 순서부터 잡습니다",
  teal: "핵심부터 짚어 결론을 냅니다",
  cream: "내 리듬에 맞춰 일을 나누어 처리합니다",
};

/** 3번 컬러가 가까운 관계에서 드러내는 고유한 거리·신뢰·소통 방식을 반영한다. */
const THIRD_COLOR_RELATION: Record<string, string> = {
  red: "서로의 의도를 분명히 알 때 가까워집니다",
  orange: "함께 웃고 반응을 나눌 때 금방 친해집니다",
  yellow: "관심 있는 주제를 나누며 이야기를 이어갑니다",
  green: "약속을 지키고 무리 없는 거리를 둘 때 오래 갑니다",
  blue: "말보다 꾸준한 행동에서 신뢰를 느낍니다",
  indigo: "겉도는 말보다 깊이 있는 이야기에 끌립니다",
  violet: "생각의 의미를 나눌 수 있을 때 마음을 엽니다",
  pink: "서로 챙기는 마음이 자연스러울 때 친밀해집니다",
  magenta: "진심이 통한다고 느끼는 관계에 오래 힘을 씁니다",
  coral: "따뜻한 반응이 오갈 때 거리감이 줄어듭니다",
  gold: "서로의 노력을 인정할 때 믿음이 깊어집니다",
  brown: "필요한 때 곁을 지키는 사람을 믿습니다",
  beige: "부담 없이 말을 건넬 수 있는 관계를 좋아합니다",
  white: "약속과 역할이 분명할 때 신뢰가 생깁니다",
  black: "서로의 선을 존중하는 사람에게 천천히 다가갑니다",
  silver: "필요한 거리를 지키며 서서히 가까워집니다",
  olive: "서로 다른 생각도 고르게 나눌 수 있기를 바랍니다",
  mint: "가볍게 이야기하며 자연스럽게 친해집니다",
  skyblue: "새로운 이야기를 함께할 때 관계가 넓어집니다",
  lavender: "말하지 않아도 헤아려주는 사람에게 편해집니다",
  peach: "다정한 말 한마디에 친밀감을 느낍니다",
  terracotta: "꾸준히 안부를 나누며 관계를 이어갑니다",
  sage: "조용히 곁에 있어 주는 관계를 소중히 여깁니다",
  teal: "생각을 분명히 말할 수 있을 때 오해가 줄어듭니다",
  cream: "서두르지 않아도 되는 관계에서 오래 편해집니다",
};

const PSYCHOLOGY_VALUE: Record<PrimaryMotive, string> = {
  action: "결과가 제자리걸음 하는 느낌에 민감한", connection: "활기 없이 지내는 시간이 길어지면 기분이 가라앉는",
  understanding: "설명이 빠진 상황에서 불안해지는", harmony: "주변이 어수선하면 기운이 쉽게 빠지는",
  trust: "말과 행동이 다를 때 마음이 멀어지는", insight: "겉으로 보이는 답만으로는 충분하지 않은",
  meaning: "내 마음에 맞는 이유가 있어야 움직일 수 있는", care: "따뜻한 말과 관심을 받고 싶어 하는",
  devotion: "소중한 일의 무게를 가볍게 넘기기 어려운", achievement: "내가 세운 기준에 닿지 않으면 아쉬워하는",
  stability: "갑자기 계획이 바뀌면 불안해하는", peace: "거친 분위기 속에 오래 있으면 쉽게 지치는",
  clarity: "생각이 복잡하게 얽히면 답답해지는", boundary: "내 선을 넘는 요구에 예민해지는",
  perspective: "한쪽 이야기만 들을 때 쉽게 결론 내리지 않는", novelty: "매일 같은 방식만 반복되면 답답해지는",
  freedom: "선택할 수 있는 방법이 줄어들면 답답해지는", sensitivity: "말투와 표정의 작은 변화에도 마음이 오래 쓰이는",
  calm: "급한 분위기와 과한 자극에 쉽게 피로해지는",
};
const PSYCHOLOGY_FILTER: Record<SupportStyle, string> = {
  direct: "직접 해 본 뒤 생각을 정리합니다", lively: "주변 분위기가 밝을 때 마음이 한결 가벼워집니다", curious: "새로운 정보를 찾아야 생각이 정리됩니다",
  considerate: "여러 일이 겹치면 무엇부터 할지 먼저 생각합니다", thoughtful: "말하지 않은 부분까지 생각해 봅니다", reflective: "혼자 생각하며 내 감정을 정리합니다",
  expressive: "느낀 점을 말로 꺼내야 답답함이 풀립니다", warm: "다정한 말을 들으면 기분이 한결 풀립니다", wholehearted: "중요한 일은 쉽게 넘기고 싶지 않습니다",
  responsive: "예상 밖의 변화가 생기면 바로 반응합니다", principled: "내 기준과 맞는지부터 확인합니다", practical: "현실적으로 가능한지 확인해야 안심합니다",
  accommodating: "일이 순서대로 진행돼야 숨이 놓입니다", organizing: "할 일이 정리되어야 숨이 놓입니다", guarded: "확신이 생긴 뒤에야 속을 보입니다",
  analytical: "감정보다 사실을 확인해야 안심합니다", mediating: "여러 선택지 중 어느 쪽이 맞는지 생각합니다", flexible: "막히면 다른 방법을 찾아 답답함을 풉니다",
  exploring: "새로운 경험을 하면 답답함이 줄어듭니다", unhurried: "천천히 생각할 시간이 있어야 편안합니다",
};
const PSYCHOLOGY_STABILITY: Record<BalanceDirection, string> = {
  pace: "숨 돌릴 틈이 있을 때 안정됩니다", warmth: "다정한 말을 들을 때 안정됩니다", clarity: "생각의 답이 보일 때 안정됩니다",
  mutual: "내가 지킬 범위가 분명할 때 안정됩니다", reliability: "예측할 수 있는 일정이 이어질 때 안정됩니다", meaningful: "스스로 납득할 수 있을 때 안정됩니다",
  realistic: "현실적인 가능성이 보일 때 안정됩니다", reciprocal: "내 마음을 편하게 말할 수 있을 때 안정됩니다", authentic: "꾸밈없이 말해도 된다고 느낄 때 안정됩니다",
  together: "좋아하는 일을 하며 웃을 때 안정됩니다", satisfaction: "내가 한 일을 받아들일 때 안정됩니다", grounded: "하루 일과가 안정될 때 안정됩니다",
  ease: "부드러운 분위기 안에서 안정됩니다", order: "할 일의 순서가 보일 때 안정됩니다", autonomy: "나만의 공간이 있을 때 안정됩니다",
  distance: "혼자 생각할 자리가 있을 때 안정됩니다", fairness: "해야 할 일이 한꺼번에 몰리지 않을 때 안정됩니다", freedom: "고를 수 있는 여지가 있을 때 안정됩니다",
  openness: "새로운 선택지가 보일 때 안정됩니다", innerPace: "생각을 정리할 시간이 있어야 안정됩니다", tenderness: "따뜻한 관심을 받을 때 안정됩니다",
  continuity: "일상이 일정하게 이어질 때 안정됩니다", peaceful: "조용한 시간이 있을 때 안정됩니다", standards: "기준이 또렷할 때 안정됩니다",
};

const DECISION_START: Record<PrimaryMotive, string> = {
  action: "일의 우선순위를 빠르게 잡습니다", connection: "즐겁게 해낼 수 있는 방법부터 찾습니다", understanding: "필요한 정보를 먼저 찾아봅니다",
  harmony: "여러 선택이 충돌하면 전체에 무리가 없는 쪽을 고릅니다", trust: "끝까지 지킬 수 있는지부터 따집니다", insight: "겉보다 핵심이 무엇인지 확인합니다",
  meaning: "내가 왜 이 일을 하는지부터 생각합니다", care: "마음이 불편하지 않은 방식을 먼저 떠올립니다", devotion: "중요한 일에는 깊이 들어갑니다",
  achievement: "목표와 기준을 분명히 세웁니다", stability: "계획이 오래 갈 수 있는지 먼저 따집니다", peace: "부담이 적은 방법을 먼저 찾습니다",
  clarity: "복잡한 일을 순서대로 나눕니다", boundary: "나에게 맞는 범위인지부터 판단합니다", perspective: "여러 가능성을 비교한 뒤 정합니다",
  novelty: "새로운 방법이 있는지 먼저 봅니다", freedom: "선택지를 충분히 열어 둡니다", sensitivity: "작은 차이도 놓치지 않고 살핀 뒤 정합니다",
  calm: "서두르기보다 자기 속도에 맞춰 정합니다",
};
const WORK_PROCESS: Record<SupportStyle, string> = {
  direct: "결정이 서면 바로 행동으로 옮깁니다", lively: "진행이 막히면 분위기를 바꾸어 다시 풀어갑니다", curious: "여러 방법을 비교해 봅니다",
  considerate: "여러 조건을 살핀 뒤 조정합니다", thoughtful: "듣고 생각한 뒤 답을 냅니다", reflective: "혼자 정리한 뒤 움직입니다",
  expressive: "자기 방식으로 아이디어를 풀어냅니다", warm: "상황이 거칠어지지 않도록 속도를 조절하며 진행합니다", wholehearted: "중요한 부분에 집중해 몰입합니다",
  responsive: "상황 변화에 맞춰 빠르게 바꿉니다", principled: "정해 둔 기준을 지키며 진행합니다", practical: "할 수 있는 일부터 차근차근 처리합니다",
  accommodating: "무리 없는 쪽으로 순서를 조정하며 진행합니다", organizing: "필요한 것을 정리해 하나씩 끝냅니다", guarded: "확신이 생길 때까지 충분히 확인합니다",
  analytical: "근거를 확인하며 차분히 처리합니다", mediating: "엇갈린 조건을 조정하며 풀어갑니다", flexible: "상황에 맞는 새 방식을 시도합니다",
  exploring: "새로운 시도를 하며 나만의 방식을 만들어갑니다", unhurried: "빠진 일이 없는지 확인하며 진행합니다",
};
const FINISH_STYLE: Record<BalanceDirection, string> = {
  pace: "무리 없는 일정으로 일을 이어갑니다", warmth: "부드럽게 조율하며 마무리합니다", clarity: "머릿속이 정리된 뒤에 결론을 냅니다",
  mutual: "결과와 과정 모두 무리가 없게 끝을 냅니다", reliability: "꾸준히 이어 갈 수 있는 방법을 택합니다", meaningful: "스스로 납득한 결론으로 마무리합니다",
  realistic: "현실에서 오래 갈 수 있는 방법을 택합니다", reciprocal: "내 노력과 기대가 한쪽으로 치우치지 않았는지 살핍니다", authentic: "내 뜻에 맞는 방식인지 확인합니다",
  together: "즐거움이 남는 방식으로 마무리합니다", satisfaction: "해낸 부분을 확인하며 다음으로 넘어갑니다", grounded: "생활에 바로 이어질 수 있게 정리합니다",
  ease: "과하지 않은 속도로 끝을 냅니다", order: "마지막 단계까지 깔끔하게 마무리합니다", autonomy: "내가 감당할 수 있는 범위에서 마무리합니다",
  distance: "한걸음 물러나 다시 확인합니다", fairness: "할 일을 한쪽에 몰지 않도록 나눕니다", freedom: "다음 선택을 열어 둔 채 마무리합니다",
  openness: "새로운 가능성을 남긴 채 끝을 냅니다", innerPace: "내가 소화할 수 있는 만큼씩 차근차근 정리합니다", tenderness: "마무리한 뒤에도 찜찜한 점이 없는지 확인합니다",
  continuity: "평소 하던 방식이 크게 바뀌지 않게 마무리합니다", peaceful: "조용하고 안정된 방식으로 마무리합니다", standards: "정한 기준을 확인한 뒤 끝을 냅니다",
};

const PRIMARY_STRENGTH: Record<PrimaryMotive, string> = {
  action: "분명한 추진력", connection: "활기찬 연결력", understanding: "깊이 있는 탐구심", harmony: "고른 균형감", trust: "든든한 책임감",
  insight: "핵심을 보는 통찰", meaning: "흔들리지 않는 가치관", care: "섬세한 배려", devotion: "진심 어린 몰입", achievement: "목표를 이루는 끈기",
  stability: "꾸준한 생활력", peace: "부드러운 친화력", clarity: "명료한 정리력", boundary: "단단한 자기 기준", perspective: "넓은 상황 파악",
  novelty: "산뜻한 적응력", freedom: "열린 시야", sensitivity: "세밀한 공감", calm: "조용한 중심감",
};
const SUPPORT_STRENGTH: Record<SupportStyle, string> = {
  direct: "빠른 결단", lively: "분위기 조성", curious: "다양한 방법 찾기", considerate: "상황 조율", thoughtful: "신중한 검토",
  reflective: "깊은 성찰", expressive: "창의적 표현", warm: "따뜻한 소통", wholehearted: "집중력 있는 실행", responsive: "빠른 반응 읽기",
  principled: "기준 있는 판단", practical: "현실적인 처리", accommodating: "유연한 협업", organizing: "꼼꼼한 마무리", guarded: "신중한 선택",
  analytical: "냉정한 분석", mediating: "갈등 완화", flexible: "변화 대응", exploring: "새로운 발상", unhurried: "차분한 진행",
};
const BALANCE_STRENGTH: Record<BalanceDirection, string> = {
  pace: "자기 리듬 유지", warmth: "편안한 교류", clarity: "정돈된 결론", mutual: "서로 편한 거리", reliability: "꾸준한 신뢰",
  meaningful: "스스로 납득하는 결론", realistic: "생활 속 안정", reciprocal: "다정한 교류", authentic: "진심의 일관성", together: "함께하는 즐거움",
  satisfaction: "건강한 성취감", grounded: "든든한 일상", ease: "부드러운 조화", order: "체계적인 정리 능력", autonomy: "독립적인 거리",
  distance: "객관적인 시선", fairness: "공정한 조정", freedom: "선택의 여유", openness: "가능성을 보는 눈", innerPace: "생각할 여유",
  tenderness: "다정한 유대", continuity: "지속하는 안정", peaceful: "평온한 분위기", standards: "분명한 판단력",
};
const FUSION_STRENGTH: Record<PrimaryMotive, string> = {
  action: "급한 일도 순서를 잡는 힘", connection: "사람 사이 분위기를 편하게 만드는 힘", understanding: "복잡한 일을 정리하는 힘", harmony: "서로 다른 의견을 맞추는 힘",
  trust: "약속을 지키는 힘", insight: "숨은 원인을 찾는 힘", meaning: "가치를 현실로 옮기는 힘", care: "상대 마음을 살피는 말",
  devotion: "중요한 것을 끝까지 지키는 힘", achievement: "기준을 결과로 만드는 힘", stability: "일상을 단단히 세우는 힘", peace: "불편한 상황을 부드럽게 푸는 힘",
  clarity: "복잡한 일을 정리하는 힘", boundary: "필요할 때 선을 긋는 힘", perspective: "한걸음 떨어져 살피는 시각", novelty: "낯선 일을 가볍게 시작하는 힘",
  freedom: "선택지를 넓히는 힘", sensitivity: "작은 신호를 알아차리는 감각", calm: "복잡한 상황을 가라앉히는 힘",
};

const PRIMARY_GROWTH: Record<PrimaryMotive, string> = {
  action: "일이 급하면 속도를 먼저 내는 편", connection: "사람들과 어울리느라 내 할 일을 뒤로 미루는 편", understanding: "충분히 알아본 뒤에야 결정을 내리는 편",
  harmony: "모두의 입장을 생각하느라 내 기준을 늦게 말하는 편", trust: "맡은 일을 혼자 끝까지 감당하는 편", insight: "생각이 깊어져 결론을 늦게 내리는 편",
  meaning: "마음에 맞지 않으면 시작을 오래 망설이는 편", care: "상대의 기분을 먼저 살피느라 내 마음을 뒤로 미루는 편", devotion: "중요한 일에 힘을 한꺼번에 쓰는 편",
  achievement: "결과가 마음에 들 때까지 일을 붙잡는 편", stability: "익숙한 방식을 지키느라 변화를 천천히 받아들이는 편", peace: "갈등을 피하려고 의견을 바로 말하지 않는 편",
  clarity: "정리가 될 때까지 대화를 잠시 미루는 편", boundary: "혼자 판단한 뒤에야 생각을 나누는 편", perspective: "여러 경우를 따지느라 결정을 늦추는 편",
  novelty: "새로운 일에 관심이 옮겨가며 계획을 자주 바꾸는 편", freedom: "선택지를 열어 두느라 한 가지에 오래 집중하지 않는 편", sensitivity: "상대의 사소한 반응에 혼자 고민이 많아지는 편",
  calm: "급한 일이 계속되면 마음을 혼자 정리하는 편",
};
const SUPPORT_GROWTH: Record<SupportStyle, string> = {
  direct: "결정이 서면 설명보다 행동을 먼저 하는 편", lively: "분위기를 살리느라 내 피로를 늦게 알아차리는 편", curious: "여러 방법을 비교하느라 시작이 늦어지는 편",
  considerate: "주변 반응을 살피느라 말을 한 번 더 고르는 편", thoughtful: "생각을 정리하느라 답을 늦게 주는 편", reflective: "혼자 생각하느라 대화를 미루는 편",
  expressive: "느낀 점이 많아 설명이 길어지는 편", warm: "상대가 편안한지 확인하느라 내 순서를 미루는 편", wholehearted: "중요한 부분에 몰입해 다른 일을 미루는 편",
  responsive: "상대 반응에 맞추느라 내 생각을 늦게 말하는 편", principled: "정한 기준이 흐려지면 일을 다시 확인하는 편", practical: "할 수 있는 일을 먼저 챙기느라 큰 그림을 늦게 보는 편",
  accommodating: "갈등을 줄이려다 의견을 바로 꺼내지 않는 편", organizing: "순서를 맞추느라 사소한 부분까지 확인하는 편", guarded: "확신이 생기기 전에는 마음을 쉽게 말하지 않는 편",
  analytical: "이유를 따지느라 감정을 나중에 살피는 편", mediating: "양쪽 입장을 맞추느라 결론을 천천히 내리는 편", flexible: "새로운 방법을 찾느라 계획을 바꾸는 편",
  exploring: "새로운 즐거움에 빠져 원래 하던 일을 뒤로 미루는 편", unhurried: "서두르지 않으려다 답을 미루는 편",
};
const BALANCE_GROWTH: Record<BalanceDirection, string> = {
  pace: "바쁠수록 내 리듬을 지키려다 연락을 늦게 하는 편", warmth: "관계가 어색해지면 먼저 분위기를 풀려고 하는 편", clarity: "마음이 복잡하면 정리가 될 때까지 결론을 미루는 편",
  mutual: "의견이 엇갈리면 먼저 양보하는 편", reliability: "믿음이 흔들리면 말을 아끼고 시간을 두는 편", meaningful: "내가 납득하지 못하면 결정을 오래 미루는 편",
  realistic: "현실적인 방법을 찾느라 마음의 바람을 나중에 말하는 편", reciprocal: "호의를 받으면 바로 보답해야 한다고 생각하는 편", authentic: "진심이 확인될 때까지 거리를 두는 편",
  together: "함께하는 분위기를 지키느라 속상함을 넘기는 편", satisfaction: "해낸 일을 인정하기보다 다음 목표를 먼저 보는 편", grounded: "익숙한 일상을 지키느라 새 제안을 미루는 편",
  ease: "불편한 일이 생기면 조용히 넘기려 하는 편", order: "준비가 덜 됐다고 느끼면 대답을 늦추는 편", autonomy: "부담이 느껴지면 혼자 해결하려 하는 편",
  distance: "마음이 복잡하면 거리를 두고 생각하는 편", fairness: "한쪽에 치우치지 않으려 결정을 늦추는 편", freedom: "답답함이 느껴지면 다른 선택지를 찾는 편",
  openness: "가능성을 남겨 두느라 확답을 늦추는 편", innerPace: "마음이 복잡할수록 말보다 생각을 먼저 하는 편", tenderness: "상대가 서운할까 봐 내 의견을 미루는 편",
  continuity: "변화가 크면 익숙한 방식으로 돌아가려 하는 편", peaceful: "갈등이 생기면 분위기부터 가라앉히려 하는 편", standards: "기준이 맞지 않으면 결론을 다시 검토하는 편",
};

const RELATION_START: Record<RelationStyle, string> = {
  direct: "서로의 생각을 분명히 나누며 방향을 맞추고 싶어 합니다", friendly: "가볍게 말을 건네며 관계의 문을 엽니다", conversational: "궁금한 것을 묻고 대화로 가까워집니다",
  dependable: "작은 약속을 지키며 신뢰를 쌓습니다", loyal: "시간이 지나도 변하지 않는 믿음을 중요하게 여깁니다", deep: "겉도는 대화보다 진심 있는 이야기를 원합니다",
  attuned: "말보다 표정과 말투의 작은 변화를 먼저 읽습니다", caring: "상대의 기분을 살피며 다정하게 다가갑니다", devoted: "진심이 느껴지는 관계에 오래 마음을 씁니다",
  responsive: "반응을 주고받으며 서로 편하게 말할 수 있게 합니다", respectful: "예의를 지키며 믿음직하게 다가갑니다", practical: "필요한 때 곁을 지키는 방식으로 마음을 보입니다",
  gentle: "편안한 분위기를 먼저 만들어 가까워집니다", selective: "진심이 확인될 때까지 천천히 마음을 엽니다", guarded: "쉽게 가까워지기보다 믿을 만한 사람을 가려 둡니다",
  measured: "관계를 서두르지 않고 충분히 살핀 뒤 가까워집니다", considerate: "서로의 입장을 맞추며 편안한 거리를 찾습니다", light: "부담 없는 이야기로 자연스럽게 다가갑니다",
  open: "새로운 사람과 이야기를 나누며 관계를 넓힙니다", empathic: "말하지 않은 마음까지 이해하고 싶어 합니다", steady: "꾸준한 관심으로 관계를 이어갑니다",
  calm: "조용히 곁을 지키며 마음을 살핍니다", clear: "생각을 정리해 오해 없이 말하려 합니다", unhurried: "편안한 속도로 천천히 가까워집니다",
};
const RELATION_EXPRESSION: Record<SupportStyle, string> = {
  direct: "필요한 말은 비교적 솔직하게 꺼냅니다", lively: "밝은 반응으로 어색함을 풀어냅니다", curious: "상대의 생각을 물으며 이야기를 이어갑니다",
  considerate: "말 한마디가 남길 느낌까지 살핍니다", thoughtful: "상대의 이야기를 듣고 신중하게 답합니다", reflective: "생각을 정리한 뒤 조심스럽게 마음을 전합니다",
  expressive: "느낀 점을 자기만의 말로 표현합니다", warm: "먼저 안부를 묻거나 필요한 것을 챙겨주며 마음을 전합니다", wholehearted: "중요한 사람에게는 속마음을 깊이 나눕니다",
  responsive: "상대 반응에 맞춰 대화의 온도를 조절합니다", principled: "예의와 약속을 지키며 믿음을 보입니다", practical: "필요한 도움을 챙기는 것으로 마음을 표현합니다",
  accommodating: "상대가 편안한 쪽으로 말을 고릅니다", organizing: "생각이 정리되어야 마음을 꺼냅니다", guarded: "확신이 들기 전에는 속을 쉽게 보이지 않습니다",
  analytical: "감정보다 상황을 정리해 설명하려 합니다", mediating: "서로 오해하지 않도록 중간을 맞춥니다", flexible: "상황에 맞춰 말하는 방식을 바꿉니다",
  exploring: "새로운 이야기로 관계에 활기를 더합니다", unhurried: "대화가 끝난 뒤에도 생각을 정리한 다음 답합니다",
};
const RELATION_DEEPENING: Record<BalanceDirection, string> = {
  pace: "가까워질수록 서로의 속도를 존중하려 합니다", warmth: "마음이 편안히 오갈 때 더 깊이 가까워집니다", clarity: "오해가 풀려야 마음이 놓입니다",
  mutual: "약속한 범위를 지킬 때 오래 편안합니다", reliability: "꾸준한 약속 속에서 애정을 느낍니다", meaningful: "서로의 생각이 통할 때 관계에 힘을 씁니다",
  realistic: "생활에서 함께할 수 있는 방식이 중요합니다", reciprocal: "다정한 안부에 답하며 친밀함을 쌓습니다", authentic: "진심을 나눌 수 있는 관계를 원합니다",
  together: "즐거운 반응을 주고받을 때 친밀감을 느낍니다", satisfaction: "서로의 노력을 인정할 때 관계가 단단해집니다", grounded: "일상을 함께 지킬 수 있을 때 믿음이 생깁니다",
  ease: "부담 없이 머물 수 있는 관계를 좋아합니다", order: "서로의 약속이 분명할 때 편안합니다", autonomy: "각자의 공간이 있을 때 관계도 건강하다고 느낍니다",
  distance: "필요한 거리가 있어야 마음을 오래 지킵니다", fairness: "한쪽만 애쓰지 않는 관계를 원합니다", freedom: "서로 부담을 주지 않는 관계에서 마음이 열립니다",
  openness: "새로운 이야기를 함께 나눌 때 가까워집니다", innerPace: "말을 길게 하지 않아도 내 마음을 알아주는 관계를 바랍니다", tenderness: "다정한 말과 관심에서 친밀함을 느낍니다",
  continuity: "시간이 쌓일수록 더 깊은 믿음을 보입니다", peaceful: "조용하고 편안한 분위기에서 마음을 엽니다", standards: "서로의 기준을 존중할 때 신뢰가 생깁니다",
};

function profileFor(color: ColorData): PremiumColorProfile {
  const profile = PREMIUM_STAGE1_PROFILES[color.id];
  if (!profile) {
    throw new Error("선택한 컬러의 1단계 해석 프로필을 찾을 수 없습니다.");
  }
  return profile;
}

function engineFor(color: ColorData): ColorEngineProfile {
  const engine = COLOR_ENGINE_PROFILES[color.id];
  if (!engine) {
    throw new Error("선택한 컬러의 통합 해석 엔진 값을 찾을 수 없습니다.");
  }
  return engine;
}

/**
 * 1단계 결과의 마지막 한국어 품질 보정 단계.
 * 역할 기반 조합 규칙은 유지하고, 사용자에게 보이는 문장만 생활 언어로 다듬는다.
 */
const KOREAN_NATURAL_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/마음이 남는/g, "계속 신경 쓰이는"],
  [/마음의 여유를 찾습니다/g, "새로운 일을 해 보면 답답함이 줄어듭니다"],
  [/내면의 여백/g, "생각할 여유"],
  [/마음의 속도를 따라갈 때/g, "생각을 정리할 시간이 있을 때"],
  [/마음의 속도를 존중하는 방향으로 돌아옵니다/g, "내가 따라갈 수 있는 속도를 지키려 합니다"],
  [/한쪽에 부담이 쏠리지 않게 정리합니다/g, "할 일을 한쪽에 몰지 않도록 나눕니다"],
  [/마음과 현실이 함께 갈 수 있는 길을 찾습니다/g, "마음에 맞고 현실적으로도 가능한 방법을 찾습니다"],
  [/마음의 온도를 읽습니다/g, "사람들의 표정과 반응을 보며 분위기를 읽습니다"],
  [/정서적 거리를 확인합니다/g, "상대가 다정하게 반응하는지 보며 가까워졌다고 느낍니다"],
  [/마음이 풀립니다/g, "답답함이 풀립니다"],
  [/흐름이 함께 보입니다/g, "어떤 점이 함께 작용하는지 보입니다"],
  [/힘을 이어줍니다/g, "계속 해낼 수 있게 합니다"],
];

const AMBIGUOUS_KOREAN_PATTERNS: ReadonlyArray<RegExp> = [
  /마음이 남는/, /마음의 여유/, /내면의 여백/, /마음의 속도를 따라/, /한쪽에 부담이 쏠리지/,
  /마음과 현실이 함께 갈/, /마음의 온도/, /정서적 거리/, /흐름이 함께 보이/, /힘을 이어주/,
];

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

/** 한 문장 안에서 같은 어근·부사가 이어지는 경우만 자연스럽게 바꾼다. */
function softenInternalRepetition(text: string): string {
  return text
    .replace(/궁금한 점은 끝까지 확인하고 궁금한 점을 직접 확인해 보는/g, "궁금한 점을 끝까지 파고들며 직접 해 보는")
    .replace(/이야기를 이어갑니다\. 관심 있는 주제를 나누며 이야기를 이어갑니다/g, "대화를 이어갑니다. 관심 있는 주제는 함께 찾아봅니다")
    .replace(/정리하는 편입니다\. 생각이 정리된 뒤/g, "정리하는 편입니다. 생각이 가라앉은 뒤")
    .replace(/먼저([^.!?]{0,80})먼저/g, (_match, between: string) => `먼저${between}차분히`)
    .replace(/살피고([^.!?]{0,80})살피는/g, (_match, between: string) => `살피고${between}헤아리는`)
    .replace(/확인하고([^.!?]{0,80})확인하는/g, (_match, between: string) => `확인하고${between}살펴보는`);
}

/** 앞선 영역에 같은 어휘가 몰릴 때에만 현재 영역의 표현을 최소한으로 분산한다. */
function diversifyRepeatedVocabulary(candidate: string, previousSections: string[]): string {
  const combined = `${previousSections.join(" ")} ${candidate}`;
  let diversified = candidate;

  if (countMatches(combined, /살피/g) >= 3) {
    diversified = diversified
      .replace(/살핍니다/g, "확인합니다")
      .replace(/살피며/g, "고려하며")
      .replace(/살핀 뒤/g, "확인한 뒤")
      .replace(/살피는/g, "생각하는");
  }
  if (countMatches(combined, /챙기/g) >= 3) {
    diversified = diversified
      .replace(/챙깁니다/g, "처리합니다")
      .replace(/챙기며/g, "마무리하며")
      .replace(/챙기는/g, "처리하는");
  }
  if (countMatches(combined, /편안/g) >= 3) {
    diversified = diversified
      .replace(/편안합니다/g, "부담이 적습니다")
      .replace(/편안한/g, "부담 없는")
      .replace(/편안하게/g, "부담 없이");
  }
  if (countMatches(combined, /균형/g) >= 3) {
    diversified = diversified
      .replace(/균형을/g, "고른 방향을")
      .replace(/균형이/g, "조화가");
  }
  if (countMatches(combined, /마음/g) >= 3) {
    diversified = diversified
      .replace(/마음에 맞고 현실적으로도 가능한/g, "현실적으로도 가능한")
      .replace(/내 마음을/g, "내 생각을")
      .replace(/내 마음에 맞는/g, "내 뜻에 맞는")
      .replace(/마음에 맞지 않으면/g, "내 뜻에 맞지 않으면")
      .replace(/마음에 맞는/g, "내 뜻에 맞는")
      .replace(/마음이 불편하지 않게/g, "찜찜하지 않게")
      .replace(/마음을 엽니다/g, "경계를 풉니다")
      .replace(/마음을 보이는/g, "속을 보이는")
      .replace(/마음을 쉽게 말하지/g, "속얘기를 쉽게 꺼내지")
      .replace(/마음을 전합니다/g, "고마움을 전합니다")
      .replace(/마음을 꺼냅니다/g, "생각을 말합니다")
      .replace(/마음을 표현합니다/g, "뜻을 전합니다")
      .replace(/속마음을/g, "속얘기를")
      .replace(/마음이 오래 쓰이는/g, "신경이 오래 쓰이는")
      .replace(/마음의 바람을/g, "내 바람을")
      .replace(/마음까지/g, "속생각까지")
      .replace(/마음이 복잡하면/g, "생각이 얽히면");
  }
  if (countMatches(combined, /먼저/g) >= 3) {
    diversified = diversified
      .replace(/을 먼저/g, "을 우선")
      .replace(/이 먼저/g, "이 앞서")
      .replace(/먼저 하는/g, "앞세우는")
      .replace(/먼저 떠올립니다/g, "우선 떠올립니다")
      .replace(/먼저 찾아/g, "우선 찾아")
      .replace(/먼저 자리를/g, "부담 없는 자리를")
      .replace(/먼저 안부를/g, "안부를")
      .replace(/먼저/g, "우선");
  }
  if (countMatches(combined, /정리/g) >= 3) {
    diversified = diversified
      .replace(/정리가 될 때까지/g, "생각이 가라앉을 때까지")
      .replace(/정리할 시간이/g, "생각을 가다듬을 시간이")
      .replace(/생각이 정리되어야/g, "생각이 가라앉아야")
      .replace(/생각을 정리합니다/g, "생각을 가다듬습니다")
      .replace(/정리해야/g, "정돈해야")
      .replace(/정리하며/g, "가다듬으며")
      .replace(/정리하는/g, "가다듬는")
      .replace(/정리합니다/g, "가다듬습니다")
      .replace(/정리해/g, "가다듬어")
      .replace(/정리한/g, "가다듬은")
      .replace(/정리된/g, "정돈된")
      .replace(/정리력/g, "구조화 감각")
      .replace(/정리 능력/g, "정돈력");
  }
  if (countMatches(combined, /기준/g) >= 3) {
    diversified = diversified
      .replace(/내 기준/g, "내 원칙")
      .replace(/기준과/g, "원칙과")
      .replace(/정한 기준/g, "세운 원칙")
      .replace(/기준이/g, "원칙이")
      .replace(/기준을/g, "판단의 선을")
      .replace(/기준에/g, "눈높이에");
  }
  if (countMatches(combined, /확인/g) >= 2) {
    diversified = diversified
      .replace(/진심이 확인될 때까지/g, "진심을 알기 전에는")
      .replace(/확인합니다/g, "점검합니다")
      .replace(/확인하며/g, "따져 보며")
      .replace(/확인한 뒤/g, "살펴본 뒤")
      .replace(/확인해야/g, "짚어 봐야")
      .replace(/확인하는/g, "따져 보는")
      .replace(/확인할/g, "점검할")
      .replace(/다시 확인/g, "다시 점검")
      .replace(/확인을/g, "점검을")
      .replace(/확인이/g, "검토가");
  }
  if (countMatches(combined, /새로운/g) >= 2) {
    diversified = diversified
      .replace(/새로운 방법/g, "낯선 방법")
      .replace(/새로운 선택지/g, "다른 선택지")
      .replace(/새로운 경험/g, "처음 해 보는 경험")
      .replace(/새로운 시도/g, "다른 시도")
      .replace(/새로운 이야기/g, "색다른 이야기")
      .replace(/새로운/g, "다른");
  }
  if (countMatches(combined, /고르|고르게/g) >= 3) {
    diversified = diversified
      .replace(/고르게/g, "균형 있게")
      .replace(/고른/g, "알맞은")
      .replace(/고릅니다/g, "선택합니다");
  }
  if (countMatches(combined, /한쪽/g) >= 3) {
    diversified = diversified
      .replace(/한쪽으로/g, "어느 한편으로")
      .replace(/한쪽만/g, "한 사람만")
      .replace(/한쪽에/g, "한 곳에");
  }
  if (countMatches(combined, /느낀 점/g) >= 3) {
    diversified = diversified.replace(/느낀 점/g, "생각");
  }
  if (countMatches(combined, /다정/g) >= 3) {
    diversified = diversified
      .replace(/다정한/g, "따뜻한")
      .replace(/다정함/g, "온기");
  }
  if (countMatches(combined, /속도/g) >= 4) {
    diversified = diversified
      .replace(/속도로/g, "리듬으로")
      .replace(/속도를/g, "리듬을")
      .replace(/속도가/g, "리듬이");
  }
  if (countMatches(combined, /조용/g) >= 4) {
    diversified = diversified
      .replace(/조용한/g, "차분한")
      .replace(/조용히/g, "천천히");
  }
  if (countMatches(combined, /분위기/g) >= 3) {
    diversified = diversified
      .replace(/분위기를 살리/g, "활기를 더하")
      .replace(/분위기부터 가라앉히/g, "주변을 먼저 가라앉히")
      .replace(/분위기가/g, "주변이")
      .replace(/분위기를/g, "자리를")
      .replace(/분위기에서/g, "자리에서")
      .replace(/주변 분위기/g, "주변");
  }
  if (countMatches(combined, /서두르/g) >= 3) {
    diversified = diversified
      .replace(/서두르지/g, "급하게 움직이지")
      .replace(/서두르기보다/g, "급하게 결정하기보다");
  }

  return diversified;
}

function polishKoreanOutput(text: string, previousSections: string[] = []): string {
  const polished = KOREAN_NATURAL_REPLACEMENTS.reduce(
    (polished, [pattern, replacement]) => polished.replace(pattern, replacement),
    text,
  ).replace(/\s{2,}/g, " ").trim();
  return softenInternalRepetition(diversifyRepeatedVocabulary(polished, previousSections));
}

function wordTrigrams(text: string): Set<string> {
  const words = text
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
  return new Set(words.slice(0, -2).map((_, index) => words.slice(index, index + 3).join(" ")));
}

function hasSharedLongPhrase(left: string, right: string): boolean {
  const leftPhrases = wordTrigrams(left);
  return [...wordTrigrams(right)].some((phrase) => leftPhrases.has(phrase));
}

function passesKoreanQualityCheck(candidate: string, previousSections: string[]): boolean {
  return !AMBIGUOUS_KOREAN_PATTERNS.some((pattern) => pattern.test(candidate))
    && previousSections.every((section) => !hasSharedLongPhrase(candidate, section));
}

function ensureUniqueTags(tags: string[]): string[] {
  return [...new Set(tags)];
}

function buildIntegrationBridge(
  primary: ColorEngineProfile,
  support: ColorEngineProfile,
  thirdColor: ColorData,
): string {
  return polishKoreanOutput(
    `${NARRATIVE_CORE[primary.motive]} ${NARRATIVE_EXPRESSION[support.support]} 편입니다. ${THIRD_COLOR_DIRECTION[thirdColor.id]}.`,
  );
}

/** 각 영역 문장을 개별적으로 다듬고, 앞선 영역과 겹치지 않는 후보만 선택한다. */
function chooseNaturalNonOverlapping(candidates: string[], previousSections: string[]): string {
  const polishedCandidates = candidates.map((candidate) => polishKoreanOutput(candidate, previousSections));
  return polishedCandidates.find((candidate) => passesKoreanQualityCheck(candidate, previousSections))
    ?? polishedCandidates.find((candidate) => !AMBIGUOUS_KOREAN_PATTERNS.some((pattern) => pattern.test(candidate))
    )
    ?? polishedCandidates[0];
}

/**
 * 1단계에만 사용하는 3컬러 통합 해석.
 * 1번은 동력, 2번은 표현·조절, 3번은 균형 방향으로 읽어 세 컬러를 한 사람의 생활 성향으로 연결한다.
 */
export function buildPremiumStage1Interpretation(colors: readonly ColorData[]): PremiumStage1Interpretation {
  if (colors.length !== 3) {
    throw new Error("유료 심화해석 1단계에는 컬러 3개가 필요합니다.");
  }

  const [p1, p2, p3] = colors.map(profileFor);
  const [e1, e2, e3] = colors.map(engineFor);
  const thirdColor = colors[2];

  const integrationBridge = buildIntegrationBridge(e1, e2, thirdColor);
  const psychologyTendency = chooseNaturalNonOverlapping(
    [
      `${PSYCHOLOGY_VALUE[e1.motive]} 편입니다. ${PSYCHOLOGY_FILTER[e2.support]}. ${THIRD_COLOR_PSYCHOLOGY[thirdColor.id]}.`,
      `${THIRD_COLOR_PSYCHOLOGY[thirdColor.id]}. ${PSYCHOLOGY_VALUE[e1.motive]} 편이며, ${PSYCHOLOGY_FILTER[e2.support]}.`,
    ],
    [integrationBridge],
  );
  const personalityTendency = chooseNaturalNonOverlapping(
    [
      `${DECISION_START[e1.motive]}. ${WORK_PROCESS[e2.support]}. ${THIRD_COLOR_ACTION[thirdColor.id]}.`,
      `${WORK_PROCESS[e2.support]}. ${DECISION_START[e1.motive]} 뒤, ${THIRD_COLOR_ACTION[thirdColor.id]}.`,
    ],
    [integrationBridge, psychologyTendency],
  );
  const relationshipTendency = chooseNaturalNonOverlapping(
    [
      `${RELATION_START[e1.relation]}. ${RELATION_EXPRESSION[e2.support]}. ${THIRD_COLOR_RELATION[thirdColor.id]}.`,
      `${RELATION_START[e1.relation]}. ${THIRD_COLOR_RELATION[thirdColor.id]} 그리고 ${RELATION_EXPRESSION[e2.support]}.`,
    ],
    [integrationBridge, psychologyTendency, personalityTendency],
  );

  const miniContexts: string[] = [];
  const miniInterpretations = colors.map((color, index) => {
      const profile = [p1, p2, p3][index];
      const description = polishKoreanOutput(
        `${profile.psychology} 편입니다. ${profile.behavior} 모습이 보입니다.`,
        miniContexts,
      );
      miniContexts.push(description);
      return {
        colorId: color.id,
        colorName: color.korName,
        hex: color.hex,
        keywords: color.keywords.slice(0, 3),
        description,
        strengths: profile.strengths.slice(0, 2).map((strength) => polishKoreanOutput(strength)),
        tiredStates: profile.tiredStates.slice(0, 2).map((tiredState) => polishKoreanOutput(tiredState)),
      };
    });
  const strengths = ensureUniqueTags([
      PRIMARY_STRENGTH[e1.motive],
      SUPPORT_STRENGTH[e2.support],
      BALANCE_STRENGTH[e3.balance],
      FUSION_STRENGTH[e1.motive],
    ].map((strength) => polishKoreanOutput(strength)));
  const growthPossibility = ensureUniqueTags([
      PRIMARY_GROWTH[e1.motive],
      SUPPORT_GROWTH[e2.support],
      BALANCE_GROWTH[e3.balance],
    ].map((growth) => polishKoreanOutput(growth)));

  const finalBridge = polishKoreanOutput(integrationBridge);
  const finalPsychology = polishKoreanOutput(psychologyTendency, [finalBridge]);
  const finalPersonality = polishKoreanOutput(personalityTendency, [finalBridge, finalPsychology]);
  const finalStrengths = ensureUniqueTags(strengths.map((strength, index) =>
    polishKoreanOutput(strength, [finalBridge, finalPsychology, finalPersonality, ...strengths.slice(0, index)]),
  ));
  const finalGrowth = ensureUniqueTags(growthPossibility.map((growth, index) =>
    polishKoreanOutput(growth, [
      finalBridge,
      finalPsychology,
      finalPersonality,
      ...finalStrengths,
      ...growthPossibility.slice(0, index),
    ]),
  ));
  const finalRelationship = polishKoreanOutput(relationshipTendency, [
    finalBridge,
    finalPsychology,
    finalPersonality,
    ...finalStrengths,
    ...finalGrowth,
  ]);

  return {
    miniInterpretations,
    integrationBridge: finalBridge,
    psychologyTendency: finalPsychology,
    personalityTendency: finalPersonality,
    strengths: finalStrengths,
    growthPossibility: finalGrowth,
    relationshipTendency: finalRelationship,
  };
}
