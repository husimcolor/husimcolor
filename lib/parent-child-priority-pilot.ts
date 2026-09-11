import type { CoupleSessionData } from "../constants/coupleData";
import type { ParentChildCoaching } from "./parent-child-coaching";

/**
 * 로컬 QA에서만 사용하는 엄마·딸 우선순위 기반 시범 입력입니다.
 * 이 모듈은 Production 결과 생성기에 연결하지 않습니다.
 */
export const PARENT_CHILD_PRIORITY_PILOT_QUERY = "mother-daughter-priority-pilot-20260911";

export const PARENT_CHILD_PRIORITY_PILOT_SESSION: CoupleSessionData = {
  relationType: "엄마-딸",
  personA: {
    info: { gender: "여성", faith: "무교" },
    colors: ["green", "sage", "lavender"],
    cards: ["red_circle", "white_square", "blue_diamond"],
  },
  personB: {
    info: { gender: "여성", faith: "무교" },
    colors: ["yellow", "pink", "coral"],
    cards: ["yellow_circle", "purple_diamond", "green_hexagon"],
  },
};

type PilotRelationshipSummary = {
  typeName: string;
  coreSummary: string;
  description: string;
  accentColor: string;
  recommendedColors: Array<{ id: string; korName: string; hex: string; reason: string }>;
  closingMessage: string;
};

type PilotSectionEvidence = {
  section: string;
  colorBasis: string;
  cardSupport: string;
  recoveryUse?: string;
};

export type ParentChildPriorityPilot = {
  relationshipSummary: PilotRelationshipSummary;
  basis: {
    parent: string;
    child: string;
    recovery: string;
    cards: string;
  };
  coaching: ParentChildCoaching;
  lifeScenes: {
    strengths: Array<{ title: string; description: string; evidence: string }>;
    tensions: Array<{ title: string; description: string; evidence: string }>;
  };
  sectionEvidence: PilotSectionEvidence[];
};

/**
 * 이 한 건의 문장은 1·2순위 컬러의 교차 관계를 먼저 읽고,
 * 3순위는 회복 방향, 심리카드는 현재 반응 보완으로만 사용한다.
 */
export const PARENT_CHILD_PRIORITY_PILOT: ParentChildPriorityPilot = {
  relationshipSummary: {
    typeName: "신뢰와 탐색의 조율 관계",
    coreSummary: "안정된 관계 안에서 생각의 이유와 마음을 함께 살피며, 서로의 리듬을 맞춰 가는 관계입니다.",
    description: "엄마의 그린·세이지그린은 관계를 오래 편안하게 지키고 현실적인 돌봄을 놓치지 않으려는 흐름을 만듭니다. 딸의 옐로우·핑크는 충분히 이해한 뒤 마음을 나누고 싶어 하는 흐름을 더합니다. 두 기질이 함께할 때, 엄마의 안정감은 딸의 탐색을 지지하는 바탕이 되고 딸의 질문은 관계에 새로운 관점과 따뜻한 대화를 보탤 수 있습니다.",
    accentColor: "#6B8A5A",
    recommendedColors: [
      { id: "blue", korName: "블루", hex: "#4A7FA8", reason: "생각의 이유와 마음을 차분히 설명하고 확인하는 대화의 컬러입니다." },
      { id: "peach", korName: "피치", hex: "#F4A882", reason: "엄마의 조율이 딸에게 따뜻한 반응으로 닿도록 돕는 연결의 컬러입니다." },
    ],
    closingMessage: "엄마의 안정감과 딸의 호기심은 한쪽이 다른 쪽을 고치는 관계가 아니라, 서로의 선택을 더 안전하고 따뜻하게 만드는 힘이 될 수 있습니다.",
  },
  basis: {
    parent: "엄마의 1·2순위 그린·세이지그린은 관계의 신뢰를 돌보고, 일상을 무리 없이 조율하려는 생활기질의 중심 근거입니다.",
    child: "딸의 1·2순위 옐로우·핑크는 충분히 이해한 뒤 마음을 나누고, 자신의 이유가 존중될 때 편안해지는 생활기질의 중심 근거입니다.",
    recovery: "엄마의 라벤더와 딸의 코랄은 현재 성향이나 역할을 정하지 않고, 갈등 뒤 차분히 마음을 다시 듣고 따뜻하게 연결하는 회복 방향으로만 사용했습니다.",
    cards: "엄마의 레드·화이트·블루 카드와 딸의 옐로우·퍼플·그린 카드는 각각의 주기질을 바꾸지 않고, 현재의 정리·탐색·소통·연결 반응을 보완하는 근거로만 사용했습니다.",
  },
  coaching: {
    labels: { parent: "엄마", child: "딸" },
    socialRoles: {
      parent: {
        title: "신뢰의 기반을 차분히 만드는 조율자",
        description: "엄마는 사람 사이의 약속과 분위기를 오래 편안하게 지키고, 서로가 무리하지 않는 방법을 살피는 힘이 드러날 수 있습니다. 사회·일·가족 안에서도 관계의 흐름을 안정적으로 이어 가며, 필요한 돌봄을 현실적인 방식으로 정리하는 역할 에너지로 이어질 수 있습니다.",
      },
      child: {
        title: "이유와 마음을 함께 살피는 탐색자",
        description: "딸은 궁금한 점을 충분히 비교해 보고, 자신의 마음이 가는 이유까지 이해받는 관계 안에서 가능성을 넓혀 갈 수 있습니다. 새로운 정보와 사람의 마음을 함께 살피며, 자신만의 판단을 따뜻하게 표현해 가는 역할 에너지가 보입니다.",
      },
    },
    relationshipRoles: {
      parent: {
        title: "관계의 약속을 안정적으로 돌보는 역할",
        description: "엄마는 가족의 시간과 약속이 지나치게 흔들리지 않도록 살피고, 딸이 편안하게 돌아올 수 있는 관계의 기반을 마련하려는 역할로 나타날 수 있습니다.",
      },
      child: {
        title: "질문으로 선택의 폭을 넓히는 역할",
        description: "딸은 한 가지 답을 바로 받아들이기보다 여러 이유와 가능성을 살피며, 관계 안에 새로운 관점과 마음의 온도를 더하는 역할로 나타날 수 있습니다.",
      },
      together: "엄마가 관계의 약속을 안정적으로 돌보고 딸이 자신의 질문을 숨기지 않을 때, 두 사람은 ‘안전한 기반 위에서 함께 생각하는 방식’을 만들 수 있습니다. 다만 엄마가 불확실함을 빨리 줄이려 할수록 딸에게는 선택의 폭이 닫히는 느낌으로 닿을 수 있고, 딸이 이유를 오래 비교할수록 엄마에게는 일상의 리듬이 흐트러지는 모습으로 보일 수 있습니다. 이 관계의 핵심은 누가 더 맞는지를 정하는 데 있지 않고, 약속할 일과 더 살펴볼 일을 구분하는 데 있습니다.",
    },
    childCommunication: {
      closesWhen: "딸이 선택해야 하는 일을 두고 이유를 비교하고 있는데, ‘안정적인 답’을 먼저 정해 버리면 자신의 판단과 마음이 함께 빠진 느낌을 받을 수 있습니다. 엄마가 걱정을 줄이려는 의도라도, 딸에게는 생각보다 결론이 앞섰다는 신호로 닿아 말을 줄일 수 있습니다.",
      gainsConfidenceWhen: "딸이 무엇을 고를지보다 왜 그쪽이 마음에 가는지부터 이야기할 수 있을 때 자신감이 살아날 수 있습니다. 엄마가 딸의 이유를 들은 뒤 현실적으로 확인할 한 가지만 함께 정해 주면, 딸은 자신의 판단과 엄마의 신뢰를 동시에 느끼기 쉽습니다.",
    },
    dialogue: {
      doMessages: [
        "“이번 약속에서 엄마가 미리 정해 둘 일 하나와 네가 더 알아보고 싶은 일 하나를 나눠 볼까?”",
        "“그 선택이 마음에 가는 이유와 걱정되는 이유를 하나씩만 들려줘.”",
        "“네 기분이 먼저 닿았어. 그다음에 엄마가 현실적으로 확인하고 싶은 한 가지만 말해도 될까?”",
        "“이번에는 네가 고른 방법을 작은 범위에서 해 보고, 편했던 점을 같이 살펴보자.”",
      ],
      dontMessages: [
        "“편한 쪽으로 이미 정했으니 더 비교할 필요 없어.”",
        "“이유보다 결과가 중요하니 일단 엄마 말대로 해.”",
        "“그렇게 느낀 건 나중에 말하고, 먼저 답부터 정하자.”",
        "“자꾸 다른 가능성을 말하면 엄마도 뭘 도와줘야 할지 모르겠어.”",
      ],
    },
    conflictRecovery: {
      conflictStart: "갈등은 엄마가 가족의 약속·시간·선택을 안정적으로 정리하고 싶어 하는 순간과, 딸이 여러 이유와 마음의 반응을 더 살펴보고 싶은 순간이 겹칠 때 시작될 수 있습니다.",
      parentIntent: "엄마가 선택을 좁히거나 현실적인 기준을 먼저 말하는 행동은 그린·세이지그린의 돌봄과 신뢰를 지키려는 마음, 그리고 현재 화이트 사각형 카드의 정리 반응에서 출발할 수 있습니다.",
      childReception: "딸은 옐로우·핑크의 흐름상 자신의 이유와 감정이 아직 함께 설명되지 않았을 때, 그 제안을 도움보다 ‘내 생각은 여기까지’라는 신호로 느낄 수 있습니다. 현재 퍼플 마름모 카드의 다각도 탐색 반응은 이 순간에 생각을 더 붙잡게 할 수 있습니다.",
      mismatch: "엄마는 딸이 이유를 더 살피는 모습을 일상을 늦추는 망설임으로 읽기 쉽고, 딸은 엄마가 기준을 먼저 제시하는 모습을 자신의 마음을 건너뛴 정리로 읽기 쉽습니다. 이 차이는 엄마·딸이라는 관계나 성별의 특성이 아니라, 신뢰와 조율을 먼저 세우는 기질과 이해와 공감을 먼저 확인하는 기질이 만날 때 생길 수 있는 해석의 차이입니다.",
      recoveryOrder: "회복할 때는 먼저 ‘무엇이 서운했는지’와 ‘무엇이 걱정됐는지’를 각각 한 문장으로 확인해 감정을 제자리로 돌려놓습니다. 그다음 이번에 바로 약속할 일 하나와 더 알아본 뒤 다시 정할 일 하나를 분리합니다. 이 순서가 지켜지면 엄마의 라벤더·블루 흐름과 딸의 코랄·그린 흐름은 조용히 마음을 정돈하고 다시 연결하는 회복의 방향으로 쓰일 수 있습니다.",
    },
    practices: [
      "가족 일정이나 약속을 정하는 날, 종이에 ‘이번에 확정할 일’ 한 가지와 ‘딸이 더 알아볼 일’ 한 가지를 나눠 적고 두 칸을 섞지 않기",
      "하루 중 마음에 남은 일이 있을 때 딸은 이유를 한 문장으로, 엄마는 들은 감정을 한 단어로 말한 뒤 그 자리에서는 해결책을 덧붙이지 않기",
      "딸이 직접 선택해 보고 싶은 일이 생기면 작은 범위로 한 번만 시도하고, 다음 날 편했던 점과 불편했던 점을 각각 하나씩만 나누기",
    ],
  },
  lifeScenes: {
    strengths: [
      {
        title: "하루의 경험을 이유와 감정으로 나누는 저녁",
        description: "딸이 학교·친구·취미에서 마음에 남은 일을 말할 때, 엄마가 바로 해결책을 고르기보다 ‘왜 그 일이 마음에 남았는지’를 들어 주면 두 기질의 강점이 자연스럽게 만날 수 있습니다. 딸은 생각과 감정이 함께 존중된다고 느끼고, 엄마는 관계를 안정적으로 돌보는 방식으로 대화를 이어 갈 수 있습니다.",
        evidence: "근거 · 엄마 1·2순위 그린·세이지그린의 신뢰·조율 / 딸 1·2순위 옐로우·핑크의 이해·공감 / 엄마 블루·딸 옐로우 카드의 소통·이유 확인 반응",
      },
    ],
    tensions: [
      {
        title: "약속을 확정하는 순간의 속도 차이",
        description: "외출 시간·가족 약속·수업 신청처럼 결정을 내려야 하는 날, 엄마가 일상을 편안하게 만들려는 뜻으로 답을 빨리 좁히면 딸에게는 비교해 볼 여지가 사라진 느낌으로 닿을 수 있습니다. 반대로 딸이 여러 가능성을 계속 말하면 엄마는 약속이 불안정해진다고 느낄 수 있습니다.",
        evidence: "근거 · 엄마 1·2순위 그린·세이지그린의 안정·정리 욕구 / 딸 1·2순위 옐로우·핑크의 이유 확인·관계적 수용 욕구 / 엄마 화이트 사각형·딸 퍼플 마름모 카드의 현재 정리·다각도 탐색 반응",
      },
    ],
  },
  sectionEvidence: [
    {
      section: "관계 요약과 사회적 역할",
      colorBasis: "엄마 그린·세이지그린의 신뢰·조율과 딸 옐로우·핑크의 이해·공감이 만나는 관계로 읽음.",
      cardSupport: "역할을 결정하지 않고 엄마 레드·화이트·블루, 딸 옐로우·퍼플·그린의 현재 반응을 보완함.",
    },
    {
      section: "우리 관계의 역할 에너지",
      colorBasis: "엄마는 약속과 관계 기반을 안정적으로 돌보고, 딸은 질문으로 선택의 폭을 넓히는 상호보완으로 읽음.",
      cardSupport: "엄마 화이트의 정리 반응과 딸 퍼플의 탐색 반응이 속도 차이를 설명함.",
    },
    {
      section: "자녀 기질 맞춤 소통",
      colorBasis: "딸 옐로우의 이유 확인과 핑크의 정서 수용 욕구를 중심으로, 엄마의 그린·세이지 조율 방식이 닿는 지점을 읽음.",
      cardSupport: "딸 퍼플 마름모는 현재 다각도 탐색 반응을 보완함.",
    },
    {
      section: "잘 맞는 생활 장면",
      colorBasis: "신뢰·조율과 이해·공감의 교차점이 분명한 저녁 대화 장면 1개만 선별함.",
      cardSupport: "엄마 블루·딸 옐로우 카드는 소통과 이유 확인 반응을 보완함.",
    },
    {
      section: "부딪히는 생활 장면",
      colorBasis: "엄마의 안정·정리 욕구와 딸의 비교·정서 확인 욕구의 차이가 가장 분명한 약속 확정 장면 1개만 선별함.",
      cardSupport: "엄마 화이트 사각형과 딸 퍼플 마름모이 현재 정리·탐색 반응을 보완함.",
    },
    {
      section: "DO & DON'T",
      colorBasis: "앞선 약속 확정·감정 확인 장면에서 발견된 실제 충돌을 대화 문장으로 전환함.",
      cardSupport: "카드는 현재 반응의 강도를 보완하며, 대화의 중심 근거는 1·2순위 컬러임.",
    },
    {
      section: "갈등과 회복",
      colorBasis: "신뢰와 조율을 먼저 세우는 엄마의 기질과 이해·공감을 먼저 확인하는 딸의 기질의 해석 차이를 설명함.",
      cardSupport: "화이트·퍼플은 정리·탐색이 현재 더 강해질 수 있는 반응을 보완함.",
      recoveryUse: "라벤더·코랄은 감정 확인 후 다시 연결하는 회복 단계에서만 사용함.",
    },
    {
      section: "3가지 실천",
      colorBasis: "약속, 감정 표현, 선택권이라는 서로 다른 생활 영역을 각각 한 번에 실행할 행동으로 분리함.",
      cardSupport: "심리카드는 실천 소재를 결정하지 않고 현재 대화 반응을 보완함.",
    },
  ],
};
