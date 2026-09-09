import type { CardColorType } from "./cardData";
import type { LifeArchetypeKey } from "./lifeArchetype";

type RoleDirection = {
  title: string;
  description: string;
  preparation?: string;
};

type RoleProfile = {
  labels: readonly [string, string, string];
  coreDescription: string;
  humanStrengths: readonly [string, string, string];
  directions: readonly [RoleDirection, RoleDirection, RoleDirection, RoleDirection];
  environments: readonly [string, string];
  shadows: readonly [string, string];
  smallAction: string;
};

export interface LifeRoleEnergyReport {
  coreRole: {
    title: string;
    description: string;
  };
  humanStrengths: string[];
  directions: RoleDirection[];
  environments: string[];
  shadows: string[];
  smallDirection: string;
  sourceSummary: {
    primaryRole: LifeArchetypeKey;
    supportingRole?: LifeArchetypeKey;
  };
}

const ROLE_PROFILES: Record<LifeArchetypeKey, RoleProfile> = {
  connector: {
    labels: [
      "사람과 일을 잇는 협업 조율가형",
      "서로의 강점을 잇는 협업 기획가형",
      "함께 움직일 길을 만드는 현장 조정가형",
    ],
    coreDescription: "사람마다 다른 상황을 읽고, 함께 할 수 있는 방법을 찾는 데 강점이 드러납니다.",
    humanStrengths: ["상황에 맞는 연결", "서로 다른 의견 조율", "신뢰를 쌓는 소통"],
    directions: [
      { title: "협업·운영 조율", description: "팀과 고객, 현장의 요청을 이어 실제로 일이 굴러가게 만드는 방향" },
      { title: "고객 경험·서비스 지원", description: "사람이 겪는 불편을 듣고 더 편한 이용 흐름을 만드는 방향" },
      { title: "커뮤니티·관계 프로그램", description: "같은 관심사를 가진 사람들이 오래 연결될 자리를 만드는 방향" },
      { title: "교육·안내·멘토링", description: "알고 있는 내용을 상대가 이해하기 쉬운 말로 전하는 방향" },
    ],
    environments: ["사람과 직접 소통하는 환경", "역할을 나누며 함께 움직이는 환경"],
    shadows: ["모두의 사정을 먼저 생각하다 내 우선순위를 뒤로 미루는 편", "중간에서 여러 사람의 속도를 맞추느라 결정해야 할 때를 늦추는 편"],
    smallAction: "최근 서로의 필요를 맞춰 문제를 풀었던 장면 하나를 적고, 내가 한 일을 세 단어로 정리해 보세요.",
  },
  healer: {
    labels: [
      "사람의 성장을 곁에서 돕는 지원가형",
      "변화를 편안하게 돕는 관계 동행가형",
      "일상의 회복을 설계하는 돌봄 기획가형",
    ],
    coreDescription: "사람이 막히는 지점과 필요한 도움을 알아차리고, 부담을 덜어 주는 방식에 강점이 드러납니다.",
    humanStrengths: ["세심한 변화 관찰", "부담을 낮추는 안내", "꾸준한 지원"],
    directions: [
      { title: "교육·성장 지원", description: "배움과 적응의 과정을 곁에서 돕는 교육, 멘토링, 프로그램 운영 방향" },
      { title: "고객 지원·사용자 경험", description: "사람이 실제로 겪는 불편을 듣고 서비스 경험을 개선하는 방향" },
      { title: "돌봄·복지 협력", description: "지역과 조직 안에서 필요한 지원을 연결하는 방향" },
      { title: "상담·코칭 보조 분야", description: "충분한 교육과 자격 요건을 살피며 전문 지원 역량을 쌓아 가는 방향" },
    ],
    environments: ["상대의 변화 과정을 볼 수 있는 환경", "신뢰를 천천히 쌓을 수 있는 환경"],
    shadows: ["상대의 어려움을 내 몫처럼 받아들여 기운이 빠지는 편", "도움을 충분히 주고도 내 필요를 나중에 알아차리는 편"],
    smallAction: "최근 누군가가 편해지도록 도왔던 장면 하나를 떠올리고, 그때 내가 잘한 행동을 한 줄로 남겨 보세요.",
  },
  analyst: {
    labels: [
      "복잡한 일을 풀어내는 구조 설계가형",
      "문제의 맥락을 짚는 분석 기획가형",
      "정보를 판단으로 바꾸는 전략 해석가형",
    ],
    coreDescription: "복잡한 정보에서 핵심을 찾고, 다음에 무엇을 할지 정하는 데 강점이 드러납니다.",
    humanStrengths: ["핵심을 짚는 판단", "복잡함을 풀어내는 구조", "근거 있는 선택"],
    directions: [
      { title: "기획·전략", description: "여러 정보와 조건을 비교해 실행할 방향을 만드는 방향" },
      { title: "운영 개선·프로세스 설계", description: "반복되는 문제를 찾아 일하는 순서와 기준을 다듬는 방향" },
      { title: "리서치·분석", description: "현장의 자료와 의견을 읽어 더 나은 판단을 돕는 방향" },
      { title: "전문 지식 콘텐츠", description: "복잡한 내용을 사람들이 이해하기 쉬운 자료로 전하는 방향" },
    ],
    environments: ["깊이 생각할 시간이 보장되는 환경", "기준과 역할이 분명한 환경"],
    shadows: ["충분히 알아본 뒤에야 움직이려다 시작이 늦어지는 편", "더 좋은 답을 찾느라 이미 정한 결론을 다시 검토하는 편"],
    smallAction: "최근 맡았던 일 하나에서 복잡했던 부분과 내가 정리한 방식을 세 줄로 남겨 보세요.",
  },
  leader: {
    labels: [
      "아이디어를 실제 움직임으로 만드는 실행 기획가형",
      "방향을 정하고 사람을 움직이는 추진 조정가형",
      "현장의 변화를 이끄는 실행 리더형",
    ],
    coreDescription: "해야 할 일이 보이면 방향을 정하고, 실제 움직임으로 이어 가는 데 강점이 드러납니다.",
    humanStrengths: ["우선순위 설정", "결정을 행동으로 전환", "현장 실행 조정"],
    directions: [
      { title: "프로젝트·운영 기획", description: "목표와 일정을 세우고 여러 일을 실제로 진행시키는 방향" },
      { title: "서비스·사업 개선", description: "현장에서 보이는 문제를 다음 실행으로 연결하는 방향" },
      { title: "팀·조직 운영", description: "역할을 나누고 구성원이 같은 목표로 움직이게 돕는 방향" },
      { title: "현장 실행·조정", description: "상황에 맞춰 빠르게 판단하고 필요한 자원을 연결하는 방향" },
    ],
    environments: ["결정과 실행 권한이 있는 환경", "변화의 결과를 직접 볼 수 있는 환경"],
    shadows: ["일이 보이면 혼자 먼저 떠안아 속도가 빨라지는 편", "답이 늦게 나오면 기다리기보다 직접 처리하려는 편"],
    smallAction: "지금 맡은 일 하나에서 내가 결정할 수 있는 다음 단계만 한 줄로 적어 보세요.",
  },
  artist: {
    labels: [
      "경험을 새롭게 전하는 창의 표현가형",
      "사람의 느낌을 장면으로 바꾸는 콘텐츠 기획가형",
      "새로운 관점을 만드는 감각적 전달가형",
    ],
    coreDescription: "평범한 경험에서도 다른 느낌과 가능성을 찾아, 사람들이 공감할 수 있게 전하는 데 강점이 드러납니다.",
    humanStrengths: ["새로운 관점 만들기", "느낌을 쉬운 언어로 전달", "경험을 생생하게 표현"],
    directions: [
      { title: "콘텐츠·브랜드 제작", description: "사람이 공감할 이야기를 글, 이미지, 영상, 캠페인으로 만드는 방향" },
      { title: "경험 기획", description: "공간·서비스·행사에서 사람들이 기억할 장면을 설계하는 방향" },
      { title: "디자인·기획 협업", description: "아이디어를 눈에 보이는 결과물로 바꾸는 팀 작업 방향" },
      { title: "문화·교육 콘텐츠", description: "감각과 경험을 배움의 자료로 전하는 방향" },
    ],
    environments: ["새로운 시도와 자신만의 방식이 허용되는 환경", "결과물에 대한 반응을 직접 볼 수 있는 환경"],
    shadows: ["좋은 느낌이 올 때까지 기다리다 시작을 미루는 편", "결과물에 몰입한 뒤 일상의 순서를 놓치는 편"],
    smallAction: "최근 인상 깊었던 장면 하나를 사진·글·메모 중 편한 방식으로 남기고, 왜 기억에 남았는지 한 줄을 덧붙여 보세요.",
  },
  expert: {
    labels: [
      "깊이 있는 경험을 신뢰로 바꾸는 전문 안내가형",
      "한 분야의 지식을 현실에 쓰는 전문 조언가형",
      "쌓아 온 경험을 기준으로 전하는 실무 멘토형",
    ],
    coreDescription: "한 가지를 깊이 이해하고, 그 경험을 믿을 수 있는 판단과 안내로 바꾸는 데 강점이 드러납니다.",
    humanStrengths: ["깊이 있는 문제 이해", "신뢰할 만한 기준", "경험을 전하는 설명"],
    directions: [
      { title: "전문 분야 자문·컨설팅", description: "쌓아 온 경험을 바탕으로 문제를 함께 검토하고 방향을 돕는 방향" },
      { title: "교육·지식 전달", description: "현장에서 익힌 방법을 강의, 안내서, 프로그램으로 전하는 방향" },
      { title: "품질·검토·자문", description: "결과의 완성도와 위험 요소를 꼼꼼히 점검하는 방향" },
      { title: "전문 콘텐츠·기록", description: "오래 쌓은 지식과 사례를 다른 사람이 활용할 수 있게 남기는 방향" },
    ],
    environments: ["전문성을 깊게 쌓을 수 있는 환경", "판단의 근거와 품질을 중요하게 보는 환경"],
    shadows: ["준비가 충분하다고 느낄 때까지 결과를 밖으로 내놓지 않는 편", "내 경험이 당연하다고 여겨 강점을 작게 보는 편"],
    smallAction: "지금까지 해 온 일에서 다른 사람에게 설명할 수 있는 방법 하나를 제목과 세 줄로 정리해 보세요.",
  },
};

const COLOR_SOCIAL_STYLE: Record<string, string> = {
  red: "결단을 행동으로 옮기는 방식",
  orange: "사람과 즐겁게 연결하는 방식",
  yellow: "궁금한 것을 직접 알아보는 방식",
  green: "무리 없는 속도를 고르는 방식",
  blue: "차분히 몰입하는 방식",
  navy: "근거를 확인하는 방식",
  purple: "떠오른 생각을 새롭게 풀어내는 방식",
  white: "일을 단순하게 정돈하는 방식",
  black: "중요한 일에 집중하는 방식",
  coral: "친근하게 반응을 나누는 방식",
  magenta: "에너지를 표현으로 바꾸는 방식",
  pink: "사람의 기분을 세심히 읽는 방식",
  peach: "따뜻하게 말을 건네는 방식",
  gold: "가치 있는 일에 힘을 모으는 방식",
  brown: "꾸준히 완성도를 높이는 방식",
  beige: "편안한 흐름을 만드는 방식",
  silver: "여러 가능성을 냉정하게 비교하는 방식",
  olive: "긴 호흡으로 결과를 돌보는 방식",
  mint: "새로운 방법을 가볍게 시도하는 방식",
  skyblue: "넓은 가능성을 열어 두는 방식",
  lavender: "미세한 차이를 알아차리는 방식",
  terracotta: "현장에서 바로 쓸 방법을 찾는 방식",
  sage: "전체 흐름을 고르게 보는 방식",
  teal: "생각과 감정을 함께 정리하는 방식",
  cream: "내 리듬에 맞춰 꾸준히 이어가는 방식",
};

const SHAPE_ENVIRONMENT: Record<string, string> = {
  circle: "서로의 의견을 주고받을 수 있는 환경",
  triangle: "목표와 우선순위가 보이는 환경",
  inverted_triangle: "생각을 충분히 표현할 수 있는 환경",
  square: "일의 순서와 기준이 분명한 환경",
  diamond: "새로운 방법을 시험할 수 있는 환경",
  pentagon: "여러 경험을 연결해 볼 수 있는 환경",
  hexagon: "믿을 사람과 역할을 나눌 수 있는 환경",
};

const SHAPE_ENVIRONMENT_ALTERNATIVE: Record<string, string> = {
  circle: "서로의 의견이 존중되는 환경",
  triangle: "짧은 주기로 진행 상황을 확인할 수 있는 환경",
  inverted_triangle: "혼자 깊이 생각한 것을 꺼낼 수 있는 환경",
  square: "한 단계씩 결과를 점검할 수 있는 환경",
  diamond: "작은 실험을 부담 없이 해 볼 수 있는 환경",
  pentagon: "여러 경험을 하나의 결과로 묶어 볼 수 있는 환경",
  hexagon: "진행 상황을 함께 공유할 수 있는 환경",
};

const SHAPE_SMALL_DIRECTION: Record<string, string> = {
  circle: "그 일을 누구와 나누면 더 자연스러울지 한 사람을 떠올려 보세요.",
  triangle: "그 일에서 먼저 해 볼 한 단계를 표시해 보세요.",
  inverted_triangle: "그 일을 하며 느낀 점을 솔직한 한 문장으로 적어 보세요.",
  square: "그 일을 세 단계로 나누어 가장 쉬운 단계부터 표시해 보세요.",
  diamond: "익숙한 방식과 다른 방법 하나를 나란히 적어 보세요.",
  pentagon: "이전 경험 중 지금의 일과 연결되는 장면 하나를 찾아 보세요.",
  hexagon: "함께하면 더 잘될 부분 하나를 구체적으로 적어 보세요.",
};

const AGE_CONTEXT: Record<string, string> = {
  "10대": "관심 있는 일을 알아보고 시도하는 과정에서",
  "20대": "경험을 넓히고 나에게 맞는 일을 찾는 과정에서",
  "30대": "쌓아 온 경험을 다음 역할로 넓히는 과정에서",
  "40대": "이미 가진 경험을 더 분명한 강점으로 쓰는 과정에서",
  "50대": "오래 쌓은 경험을 새 역할과 연결하는 과정에서",
  "60대 이상": "삶에서 익힌 감각을 다른 사람과 나누는 과정에서",
};

const ROLE_SOCIAL_VALUE: Record<LifeArchetypeKey, string> = {
  connector: "서로 다른 요구를 맞추는 강점이",
  healer: "사람이 막히는 지점을 알아차리는 힘이",
  analyst: "복잡한 내용을 핵심으로 바꾸는 판단력이",
  leader: "우선순위를 실행으로 옮기는 힘이",
  artist: "익숙한 경험을 새롭게 전달하는 감각이",
  expert: "쌓인 경험을 믿을 만한 안내로 바꾸는 힘이",
};

const DIRECTION_PREPARATION: Record<string, string> = {
  "협업·운영 조율": "작은 공동 작업에서 역할표와 진행 기록을 만들어 보는 경험이 도움이 됩니다.",
  "고객 경험·서비스 지원": "사용 후기 하나를 불편·원인·개선안으로 나누어 적어 보는 연습을 해보세요.",
  "커뮤니티·관계 프로그램": "관심 분야 모임의 운영 보조나 행사 지원으로 현장 흐름을 경험해 볼 수 있습니다.",
  "교육·안내·멘토링": "안내 자료 하나를 쉬운 말로 다시 써 보거나 관련 교육 과정을 살펴보세요.",
  "교육·성장 지원": "교육 보조나 멘토링 경험부터 쌓아보고, 필요하면 관련 교육 요건을 확인해 보세요.",
  "고객 지원·사용자 경험": "자주 듣는 불편을 기록해 보고, 서비스 관련 교육이나 현장 경험을 차근차근 넓혀 보세요.",
  "돌봄·복지 협력": "지역 기관과 프로그램의 역할을 살피고, 필요하면 관련 교육·자격 기준을 확인해 보세요.",
  "상담·코칭 보조 분야": "처음부터 독립 역할을 목표로 하기보다, 교육·자격 요건을 확인하며 현장 경험을 쌓아 보세요.",
  "기획·전략": "작은 과제를 목표·조건·선택지로 나누어 보는 연습으로 판단의 근거를 쌓아 보세요.",
  "운영 개선·프로세스 설계": "반복되는 과정 하나를 관찰하고, 더 편한 순서를 한 장으로 정리해 보세요.",
  "리서치·분석": "관심 주제의 자료를 출처별로 비교해 보는 습관부터 가볍게 만들어 보세요.",
  "전문 지식 콘텐츠": "설명할 수 있는 경험 하나를 짧은 글이나 체크리스트로 남겨 보세요.",
  "프로젝트·운영 기획": "작은 프로젝트에서 일정과 역할을 맡아 보며 진행 감각을 익혀 보세요.",
  "서비스·사업 개선": "사용자가 멈칫한 장면 하나를 기록하고, 바꿔 볼 점을 한 줄로 적어 보세요.",
  "팀·조직 운영": "회의나 공동 작업에서 목표와 다음 할 일을 한 번 정리해 보는 경험을 쌓아 보세요.",
  "현장 실행·조정": "현장에서 자주 생기는 문제 하나를 골라 필요한 사람·도구·순서를 적어 보세요.",
  "콘텐츠·브랜드 제작": "관심 있는 주제로 짧은 글·이미지·영상 중 한 가지 결과물을 꾸준히 만들어 보세요.",
  "경험 기획": "좋았던 공간이나 서비스 경험 하나를 관찰하고, 기억에 남은 이유를 기록해 보세요.",
  "디자인·기획 협업": "아이디어를 말·그림·간단한 화면 중 편한 방식으로 공유하는 연습을 해보세요.",
  "문화·교육 콘텐츠": "좋아하는 주제를 다른 사람이 이해할 수 있게 3분 설명으로 바꿔 보세요.",
  "전문 분야 자문·컨설팅": "기존 경험에서 자주 해결한 문제와 방법을 사례 노트로 정리해 보세요.",
  "교육·지식 전달": "내가 익힌 방법 하나를 짧은 안내문이나 체크리스트로 바꿔 보세요.",
  "품질·검토·자문": "결과물을 볼 때 쓰는 나만의 점검 기준을 5개 안으로 적어 보세요.",
  "전문 콘텐츠·기록": "오래 쌓인 사례 중 다른 사람에게 도움이 될 한 가지를 기록으로 남겨 보세요.",
};

const DIRECTION_WORK_CONTEXT: Record<string, string> = {
  "협업·운영 조율": "팀과 고객, 현장의 요청을 이어 실제 진행을 돕는 업무에",
  "고객 경험·서비스 지원": "이용 흐름을 살피고 불편을 줄이는 지원 업무에",
  "커뮤니티·관계 프로그램": "같은 관심사를 가진 이들이 꾸준히 만나는 활동에",
  "교육·안내·멘토링": "알고 있는 내용을 상대가 이해하기 쉬운 말로 전하는 역할에",
  "교육·성장 지원": "배움과 적응의 과정을 곁에서 돕는 역할에",
  "고객 지원·사용자 경험": "사람이 실제로 겪는 불편을 듣고 서비스 경험을 개선하는 일에",
  "돌봄·복지 협력": "지역과 조직 안에서 필요한 지원을 연결하는 역할에",
  "상담·코칭 보조 분야": "전문가와 함께 변화 과정을 지원하는 보조 역할에",
  "기획·전략": "다음 방향을 정하는 업무에",
  "운영 개선·프로세스 설계": "일의 순서를 더 매끄럽게 고치는 업무에",
  "리서치·분석": "현장의 판단을 돕는 일에",
  "전문 지식 콘텐츠": "자료와 경험을 누구나 이해할 수 있게 전하는 일에",
  "프로젝트·운영 기획": "목표와 일정을 세우고 여러 일을 실제로 진행시키는 역할에",
  "서비스·사업 개선": "불편한 지점을 다음 개선안으로 바꾸는 업무에",
  "팀·조직 운영": "구성원이 같은 목표를 향해 움직일 수 있게 돕는 역할에",
  "현장 실행·조정": "상황에 맞춰 필요한 사람과 자원을 연결하는 업무에",
  "콘텐츠·브랜드 제작": "사람에게 닿는 이야기를 글·이미지·영상으로 만드는 일에",
  "경험 기획": "공간·서비스·행사에서 사람의 동선을 설계하는 업무에",
  "디자인·기획 협업": "아이디어를 실제 화면이나 자료로 이어가는 협업에",
  "문화·교육 콘텐츠": "감각과 경험을 배움의 자료로 전하는 일에",
  "전문 분야 자문·컨설팅": "쌓아 온 경험을 바탕으로 문제를 함께 검토하는 역할에",
  "교육·지식 전달": "현장에서 익힌 방법을 안내서나 프로그램으로 전하는 역할에",
  "품질·검토·자문": "결과의 완성도와 위험 요소를 꼼꼼히 점검하는 업무에",
  "전문 콘텐츠·기록": "오래 쌓은 지식과 사례를 다른 사람이 활용할 수 있게 남기는 일에",
};

const DIRECTION_VALUE_CONTEXT: Record<string, string> = {
  "협업·운영 조율": "서로 다른 요구를 맞추는 힘이",
  "고객 경험·서비스 지원": "사람이 막히는 지점을 알아차리는 감각이",
  "커뮤니티·관계 프로그램": "함께 움직일 계기를 만드는 강점이",
  "교육·안내·멘토링": "어려운 내용을 쉽게 풀어내는 설명력이",
  "교육·성장 지원": "변화 속도를 살펴 곁을 지키는 힘이",
  "고객 지원·사용자 경험": "상대의 불편을 구체적으로 듣는 태도가",
  "돌봄·복지 협력": "필요한 도움을 빠뜨리지 않고 잇는 힘이",
  "상담·코칭 보조 분야": "작은 변화를 오래 지켜보는 성실함이",
  "기획·전략": "기준을 세우는 판단력이",
  "운영 개선·프로세스 설계": "흩어진 과정을 알기 쉬운 흐름으로 바꾸는 힘이",
  "리서치·분석": "필요한 단서를 찾는 능력이",
  "전문 지식 콘텐츠": "알아낸 내용을 쉬운 말로 풀어내는 설명력이",
  "프로젝트·운영 기획": "우선순위를 실제 일정으로 옮기는 추진력이",
  "서비스·사업 개선": "달라진 점을 실제 행동으로 옮기는 실행력이",
  "팀·조직 운영": "사람과 일을 같은 방향으로 묶는 조정력이",
  "현장 실행·조정": "상황에 맞춰 필요한 자원을 골라 쓰는 감각이",
  "콘텐츠·브랜드 제작": "사람의 시선을 붙잡는 표현력이",
  "경험 기획": "평범한 경험에 새로운 의미를 더하는 감각이",
  "디자인·기획 협업": "생각을 결과물로 옮기는 창의력이",
  "문화·교육 콘텐츠": "경험을 배움의 언어로 바꾸는 전달력이",
  "전문 분야 자문·컨설팅": "쌓인 경험에서 실마리를 찾는 통찰이",
  "교육·지식 전달": "익힌 방법을 다른 사람의 언어로 풀어내는 힘이",
  "품질·검토·자문": "놓치기 쉬운 위험을 짚어내는 꼼꼼함이",
  "전문 콘텐츠·기록": "사례를 오래 쓸 수 있는 자료로 남기는 힘이",
};

/**
 * 삶의 역할에서는 기존 몸·감정 흐름용 유형 점수와 별도로, 컬러의 사회적 표현과 카드의 역할을 함께 읽는다.
 * 두 번째 후보도 충분히 반영해 특정 직업군으로 일괄 수렴하지 않도록 한다.
 */
const COLOR_TO_SOCIAL_ROLES: Record<string, readonly [LifeArchetypeKey, LifeArchetypeKey]> = {
  red: ["leader", "artist"], orange: ["connector", "leader"], yellow: ["analyst", "expert"],
  green: ["connector", "healer"], blue: ["analyst", "expert"], navy: ["expert", "analyst"],
  violet: ["artist", "healer"], pink: ["connector", "healer"], magenta: ["artist", "leader"],
  coral: ["artist", "connector"], gold: ["leader", "expert"], brown: ["expert", "analyst"],
  beige: ["connector", "healer"], white: ["analyst", "expert"], black: ["analyst", "expert"],
  silver: ["analyst", "expert"], olive: ["expert", "healer"], mint: ["artist", "connector"],
  skyblue: ["connector", "artist"], lavender: ["artist", "healer"], peach: ["connector", "healer"],
  terracotta: ["leader", "expert"], sage: ["connector", "analyst"], teal: ["analyst", "healer"],
  cream: ["expert", "connector"],
};

const CARD_COLOR_TO_SOCIAL_ROLES: Record<CardColorType, readonly [LifeArchetypeKey, LifeArchetypeKey]> = {
  red: ["leader", "artist"], orange: ["connector", "leader"], yellow: ["analyst", "expert"],
  green: ["connector", "healer"], blue: ["analyst", "expert"], navy: ["expert", "analyst"],
  purple: ["artist", "healer"], white: ["analyst", "expert"], black: ["analyst", "expert"],
};

const SHAPE_TO_SOCIAL_ROLES: Record<string, readonly LifeArchetypeKey[]> = {
  circle: ["connector", "healer"], triangle: ["leader", "analyst"],
  inverted_triangle: ["artist", "healer"], square: ["expert", "analyst"],
  diamond: ["analyst", "artist"], pentagon: ["artist", "expert"], hexagon: ["connector", "leader"],
};

function deriveSocialRoleSignals(
  colorIds: readonly string[],
  cards: readonly { color: CardColorType; shape: string }[],
): { primaryRole: LifeArchetypeKey; supportingRole?: LifeArchetypeKey } {
  const scores: Record<LifeArchetypeKey, number> = {
    connector: 0, healer: 0, analyst: 0, leader: 0, artist: 0, expert: 0,
  };
  const addPair = (roles: readonly [LifeArchetypeKey, LifeArchetypeKey] | undefined, weight: number) => {
    if (!roles) return;
    scores[roles[0]] += weight;
    scores[roles[1]] += weight * 0.78;
  };

  colorIds.forEach((colorId, index) => addPair(COLOR_TO_SOCIAL_ROLES[colorId], [1.3, 1.05, 0.95][index] ?? 0.9));
  cards.forEach((card, index) => {
    addPair(CARD_COLOR_TO_SOCIAL_ROLES[card.color], [1.15, 1.0, 0.9][index] ?? 0.85);
    for (const role of SHAPE_TO_SOCIAL_ROLES[card.shape] ?? []) scores[role] += 0.35;
  });

  const ordered = (Object.entries(scores) as [LifeArchetypeKey, number][]).sort((a, b) => b[1] - a[1]);
  const [first, second] = ordered;
  return {
    primaryRole: first?.[0] ?? "connector",
    supportingRole: second && second[1] >= first[1] * 0.72 ? second[0] : undefined,
  };
}

function deterministicIndex(seed: string, length: number): number {
  let value = 0;
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return value % length;
}

function pickDirections(primary: LifeArchetypeKey, supporting?: LifeArchetypeKey): RoleDirection[] {
  const primaryDirections = [...ROLE_PROFILES[primary].directions];
  const supportingDirections = supporting ? ROLE_PROFILES[supporting].directions : [];
  const candidates = supporting && supporting !== primary
    ? [primaryDirections[0], primaryDirections[1], supportingDirections[0], primaryDirections[2]]
    : primaryDirections.slice(0, 3);
  const unique = candidates.filter((item): item is RoleDirection => Boolean(item)).filter(
    (item, index, list) => list.findIndex((candidate) => candidate.title === item.title) === index,
  );
  return unique.slice(0, supporting && supporting !== primary ? 4 : 3);
}

function buildPracticalDirections(primary: LifeArchetypeKey, supporting?: LifeArchetypeKey): RoleDirection[] {
  const socialValue = ROLE_SOCIAL_VALUE[primary];
  const directionEndings = ["활용될 수 있습니다.", "힘을 보탤 수 있습니다.", "좋은 바탕이 될 수 있습니다.", "특히 도움이 됩니다."];
  return pickDirections(primary, supporting).map((direction, index) => {
    const workContext = DIRECTION_WORK_CONTEXT[direction.title] ?? "내 강점을 현실의 문제 해결에 쓰는 일에";
    const directionValue = DIRECTION_VALUE_CONTEXT[direction.title] ?? socialValue;
    return {
      ...direction,
      description: `${directionValue} ${workContext} ${directionEndings[index % directionEndings.length]}`,
      preparation: DIRECTION_PREPARATION[direction.title] ?? "작은 경험을 기록하며 나에게 맞는 방식인지 천천히 확인해 보세요.",
    };
  });
}

function getThirdEnvironment(existing: readonly string[], shape: string): string {
  const candidate = SHAPE_ENVIRONMENT[shape] ?? "자율적으로 판단할 수 있는 환경";
  const alternative = SHAPE_ENVIRONMENT_ALTERNATIVE[shape] ?? candidate;
  const overlapGroups = [
    ["기준", "순서", "단계"],
    ["역할", "함께", "의견", "공유", "소통"],
    ["표현", "생각한 것을 꺼낼"],
    ["변화", "새로운", "실험"],
    ["집중", "깊이"],
    ["결과", "반응"],
  ];
  const overlaps = (text: string) => overlapGroups.some((group) =>
    group.some((word) => text.includes(word)) && existing.some((item) => group.some((word) => item.includes(word))),
  );
  return overlaps(candidate) ? alternative : candidate;
}

/**
 * 삶의 역할은 직업 진단이 아니라, 선택한 기질과 카드 흐름에서 읽힌 사회적 쓰임의 방향을 제안한다.
 * 나이는 화면에 세대명으로 노출하지 않고 경험을 적용하는 문장에만 부드럽게 반영한다.
 */
export function buildLifeRoleEnergyReport(
  colorIds: readonly string[],
  cards: readonly { color: CardColorType; shape: string }[],
  age?: string,
): LifeRoleEnergyReport {
  const { primaryRole, supportingRole } = deriveSocialRoleSignals(colorIds, cards);
  const profile = ROLE_PROFILES[primaryRole];
  const firstColor = colorIds[0] ?? "";
  const secondColor = colorIds[1] ?? firstColor;
  const thirdCard = cards[2] ?? cards[0];
  const seed = `${colorIds.join("|")}:${cards.map((card) => `${card.color}_${card.shape}`).join("|")}`;
  const label = profile.labels[deterministicIndex(seed, profile.labels.length)];
  const ageContext = AGE_CONTEXT[age ?? ""] ?? "지금까지 해 온 일을 다음 가능성과 연결하는 과정에서";
  const firstRolePhrase = COLOR_SOCIAL_STYLE[firstColor] ?? "자신만의 방식으로 몰입하는 힘";
  const secondRolePhrase = COLOR_SOCIAL_STYLE[secondColor] ?? "현실에 맞게 표현하는 방식";
  const futureEnvironment = getThirdEnvironment(profile.environments, thirdCard?.shape ?? "");

  return {
    coreRole: {
      title: label,
      description: `${profile.coreDescription} ${firstRolePhrase}이 바탕이 되고, ${secondRolePhrase}이 그 힘을 사회에서 드러내는 데 보탬이 됩니다. ${ageContext} 특히 잘 쓸 수 있는 자원입니다.`,
    },
    humanStrengths: [...profile.humanStrengths],
    directions: buildPracticalDirections(primaryRole, supportingRole),
    environments: [...profile.environments, futureEnvironment],
    shadows: [...profile.shadows],
    smallDirection: profile.smallAction,
    sourceSummary: { primaryRole, supportingRole },
  };
}
