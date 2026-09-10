import type { CardData } from "../constants/cardData";
import type { LightArchetypeResult, PersonAnalysis, RelationType } from "../constants/coupleData";
import { buildLifeRoleEnergyReport, type LifeRoleEnergyReport } from "../constants/lifeRoleEnergy";

type RoleKey = LifeRoleEnergyReport["sourceSummary"]["primaryRole"];

export type ParentChildLabels = {
  parent: string;
  child: string;
};

export type ParentChildCoaching = {
  labels: ParentChildLabels;
  socialRoles: {
    parent: { title: string; description: string };
    child: { title: string; description: string };
  };
  relationshipRoles: {
    parent: { title: string; description: string };
    child: { title: string; description: string };
    together: string;
  };
  childCommunication: {
    closesWhen: string;
    gainsConfidenceWhen: string;
  };
  dialogue: {
    doMessages: string[];
    dontMessages: string[];
  };
};

type ParentChildCoachingInput = {
  relationType: RelationType;
  parentGender?: string;
  childGender?: string;
  parent: {
    colors: readonly string[];
    cards: readonly CardData[];
    analysis: PersonAnalysis;
  };
  child: {
    colors: readonly string[];
    cards: readonly CardData[];
    analysis: PersonAnalysis;
  };
  lightArchetype: LightArchetypeResult;
};

const PARENT_RELATIONSHIP_ROLE: Record<RoleKey, { title: string; description: string }> = {
  connector: {
    title: "대화를 이어 주는 역할",
    description: "서로의 말이 엇갈릴 때 사이를 잇고, 아이가 자신의 생각을 꺼낼 자리를 만들어 주는 역할을 맡기 쉽습니다.",
  },
  healer: {
    title: "마음을 살피고 기다려 주는 역할",
    description: "아이의 작은 변화와 감정을 먼저 알아차리고, 부담을 낮추며 곁을 지키는 역할을 맡기 쉽습니다.",
  },
  analyst: {
    title: "생각의 기준을 세워 주는 역할",
    description: "복잡한 상황을 정리하고 선택의 기준을 함께 살피며, 아이가 스스로 판단할 수 있도록 돕는 역할을 맡기 쉽습니다.",
  },
  leader: {
    title: "방향과 기준을 잡아 주는 역할",
    description: "앞으로의 방향을 제안하고 필요한 약속을 세우며, 아이가 한 걸음 내딛도록 돕는 역할을 맡기 쉽습니다.",
  },
  artist: {
    title: "가능성을 열어 주는 역할",
    description: "아이만의 방식과 시도를 발견하고, 새로운 경험을 통해 자신감을 넓혀 주는 역할을 맡기 쉽습니다.",
  },
  expert: {
    title: "신뢰할 만한 기준을 전하는 역할",
    description: "경험에서 얻은 기준을 차분히 나누고, 아이가 현실에서 자기 힘을 쓸 수 있도록 돕는 역할을 맡기 쉽습니다.",
  },
};

const CHILD_RELATIONSHIP_ROLE: Record<RoleKey, { title: string; description: string }> = {
  connector: {
    title: "관계를 부드럽게 이어 가는 역할",
    description: "주변의 마음을 살피며 대화의 온도를 조절하고, 가족 안에서 서로를 이어 주는 역할 에너지가 드러날 수 있습니다.",
  },
  healer: {
    title: "마음을 섬세하게 알아차리는 역할",
    description: "사람의 변화와 분위기를 빠르게 느끼고, 자신과 주변을 편안하게 만들 방법을 찾는 역할 에너지가 드러날 수 있습니다.",
  },
  analyst: {
    title: "스스로 생각을 정리해 가는 역할",
    description: "상황의 이유와 기준을 충분히 이해한 뒤 자신의 판단을 만들며, 자기 속도로 답을 찾아가는 역할 에너지가 드러날 수 있습니다.",
  },
  leader: {
    title: "자기 방향을 만들어 가는 역할",
    description: "하고 싶은 일과 다음 행동을 스스로 결정해 보며, 경험 속에서 주도성을 키워 가는 역할 에너지가 드러날 수 있습니다.",
  },
  artist: {
    title: "자신만의 가능성을 표현해 가는 역할",
    description: "느낀 것과 생각을 자신다운 방식으로 표현하며, 새로운 시도 안에서 성장의 실마리를 찾는 역할 에너지가 드러날 수 있습니다.",
  },
  expert: {
    title: "자기 속도로 익혀 가는 역할",
    description: "관심 있는 것을 깊이 이해하고 자신만의 기준을 만들어 가며, 충분히 준비된 뒤 힘을 보여 주는 역할 에너지가 드러날 수 있습니다.",
  },
};

const CHILD_CLOSES_WHEN: Record<RoleKey, string> = {
  connector: "여러 사람의 기대나 감정을 한꺼번에 맞춰야 한다고 느낄 때, 자신의 생각을 뒤로 미루며 마음을 닫을 수 있습니다. 한 번에 한 가지씩 묻고, 바로 답하지 않아도 괜찮다는 여유를 주는 편이 부담을 낮춥니다.",
  healer: "부모의 걱정이나 실망을 자기 몫처럼 받아들여야 한다고 느낄 때, 마음을 숨기거나 무리해서 맞추려 할 수 있습니다. 아이의 감정이 먼저 안전하다는 신호를 주면 이야기를 꺼내기 쉬워집니다.",
  analyst: "충분히 이해하기 전에 결론이나 답을 요구받을 때, 자신의 판단이 존중되지 않는다고 느끼며 말문을 닫을 수 있습니다. 이유를 함께 살피고 생각할 시간을 주는 방식이 잘 맞습니다.",
  leader: "방향을 스스로 정해 볼 기회 없이 지시만 이어질 때, 의욕이 반항이나 거리두기처럼 보일 수 있습니다. 선택할 수 있는 작은 범위를 남겨 두면 마음의 문이 다시 열릴 수 있습니다.",
  artist: "자신의 방식보다 정답과 결과만 평가받는다고 느낄 때, 시도 자체를 망설이거나 표현을 줄일 수 있습니다. 과정에서 보인 생각과 감각을 먼저 인정해 주는 것이 도움이 됩니다.",
  expert: "아직 준비되지 않은 마음을 서둘러 설명하거나 바로 보여 달라는 요구를 받을 때, 더 조용해질 수 있습니다. 충분히 익힐 시간과 차분한 질문이 마음을 지키는 데 도움이 됩니다.",
};

const CHILD_CONFIDENCE_WHEN: Record<RoleKey, string> = {
  connector: "아이의 이야기를 끝까지 듣고 ‘네 생각을 듣고 싶어’라고 말해 줄 때, 관계 안에서 자신의 자리를 편안하게 느낄 수 있습니다. 누군가를 배려한 구체적인 행동을 알아봐 주는 말도 자신감을 키웁니다.",
  healer: "작은 변화와 노력을 알아봐 주고, 힘든 마음을 말해도 괜찮다고 알려 줄 때 안정감이 커집니다. ‘네 마음을 먼저 이해하고 싶어’라는 말이 아이의 섬세함을 강점으로 느끼게 돕습니다.",
  analyst: "생각한 과정과 근거를 존중받고, 스스로 정리한 의견을 설명할 기회를 얻을 때 자신감이 살아납니다. 답을 알려 주기보다 ‘너는 어떻게 생각했어?’라고 묻는 대화가 잘 맞습니다.",
  leader: "작은 선택을 직접 해 보고 그 결과를 함께 돌아볼 때 주도성이 자랍니다. ‘네가 해 본 방법에서 무엇을 배웠니?’라는 질문이 아이의 실행력을 응원하는 말이 됩니다.",
  artist: "자신만의 방식과 표현을 반갑게 받아들여 줄 때, 새로운 시도를 계속할 힘을 얻습니다. 결과보다 아이가 발견한 점과 느낀 점을 구체적으로 말해 주는 것이 도움이 됩니다.",
  expert: "관심 있는 것을 깊이 익히고, 준비된 때 자신의 생각을 보여 줄 수 있을 때 자신감이 쌓입니다. ‘천천히 해도 괜찮아, 네 방식이 궁금해’라는 말이 안정감을 줍니다.",
};

const PARENT_DO_FOCUS: Record<RoleKey, string> = {
  connector: "네 이야기를 끝까지 듣고, 우리가 함께 방법을 찾아보자.",
  healer: "힘들었겠구나. 지금은 네 마음을 먼저 듣고 싶어.",
  analyst: "네 생각의 이유가 궁금해. 함께 정리해 볼까?",
  leader: "네가 먼저 정해 보고 싶은 한 가지가 무엇인지 말해 줄래?",
  artist: "네가 생각한 방법이 궁금해. 네 방식으로 한 번 표현해 봐.",
  expert: "천천히 생각해도 괜찮아. 네가 준비되면 들려줘.",
};

const PARENT_DONT_FOCUS: Record<RoleKey, string> = {
  connector: "다른 사람도 있는데 네가 먼저 맞춰야지.",
  healer: "내가 더 힘든데 왜 그것도 못 참니?",
  analyst: "그건 틀렸어. 내가 말한 대로 하면 돼.",
  leader: "이유는 묻지 말고 지금 바로 해.",
  artist: "그런 방식 말고 정답대로 해.",
  expert: "왜 아직도 준비가 안 됐어? 빨리 보여 줘.",
};

const CHILD_DO_FOCUS: Record<RoleKey, string> = {
  connector: "네가 느낀 분위기나 다른 사람의 마음도 들려줄래?",
  healer: "네가 힘들었던 순간을 말해도 괜찮아. 내가 먼저 들을게.",
  analyst: "네가 생각한 이유를 들려줘. 답을 찾기 전에 함께 정리해 보자.",
  leader: "네가 직접 해 보고 싶은 방법을 하나 골라 볼래?",
  artist: "네가 떠올린 생각을 네 방식으로 보여 줘도 좋아.",
  expert: "충분히 생각한 뒤 말해도 돼. 네가 이해한 방식이 궁금해.",
};

const CHILD_DONT_FOCUS: Record<RoleKey, string> = {
  connector: "모두가 편하려면 네 마음은 좀 참아야지.",
  healer: "그 정도 일로 왜 그렇게 예민하게 받아들여?",
  analyst: "생각은 그만하고 내가 말한 답대로 해.",
  leader: "네가 정할 일은 아니야. 시키는 대로 해.",
  artist: "그런 생각은 쓸데없어. 정답만 맞추면 돼.",
  expert: "아직도 모르겠어? 지금 바로 답해.",
};

function toRoleInput(cards: readonly CardData[]) {
  return cards.slice(0, 3).map((card) => ({ color: card.color, shape: card.shape }));
}

export function getParentChildLabels(relationType: RelationType, parentGender?: string, childGender?: string): ParentChildLabels {
  if (relationType === "아빠-아들") return { parent: "아빠", child: "아들" };
  if (relationType === "아빠-딸") return { parent: "아빠", child: "딸" };
  if (relationType === "엄마-아들") return { parent: "엄마", child: "아들" };
  if (relationType === "엄마-딸") return { parent: "엄마", child: "딸" };
  return {
    parent: parentGender === "남성" ? "아빠" : parentGender === "여성" ? "엄마" : "부모",
    child: childGender === "남성" ? "아들" : childGender === "여성" ? "딸" : "자녀",
  };
}

function buildSocialRoleDescription(label: string, report: LifeRoleEnergyReport, isParent: boolean): string {
  const roleContext = isParent
    ? "사회와 일, 가족 안에서 필요한 방향을 살피고 사람을 돕는 모습으로도 이어질 수 있습니다."
    : "관계와 사회 안에서 자신만의 가능성을 차분히 넓혀 가는 바탕이 될 수 있습니다.";
  const strength = report.humanStrengths.slice(0, 2).join("과 ");
  return `${label}의 컬러와 심리카드 흐름에서는 ${report.coreRole.title}의 에너지가 보입니다. ${strength} 같은 강점이 자연스럽게 드러날 수 있습니다. ${roleContext}`;
}

export function buildParentChildCoaching(input: ParentChildCoachingInput): ParentChildCoaching {
  const labels = getParentChildLabels(input.relationType, input.parentGender, input.childGender);
  const parentRoleReport = buildLifeRoleEnergyReport(input.parent.colors, toRoleInput(input.parent.cards));
  const childRoleReport = buildLifeRoleEnergyReport(input.child.colors, toRoleInput(input.child.cards));
  const parentKey = parentRoleReport.sourceSummary.primaryRole;
  const childKey = childRoleReport.sourceSummary.primaryRole;
  const parentRelationshipRole = PARENT_RELATIONSHIP_ROLE[parentKey];
  const childRelationshipRole = CHILD_RELATIONSHIP_ROLE[childKey];
  const typeHint = input.lightArchetype.typeName.replace(/ 관계$/, "");

  return {
    labels,
    socialRoles: {
      parent: {
        title: parentRoleReport.coreRole.title,
        description: buildSocialRoleDescription(labels.parent, parentRoleReport, true),
      },
      child: {
        title: childRoleReport.coreRole.title,
        description: buildSocialRoleDescription(labels.child, childRoleReport, false),
      },
    },
    relationshipRoles: {
      parent: parentRelationshipRole,
      child: childRelationshipRole,
      together: `${labels.parent}가 ${parentRelationshipRole.title}로 마음을 전할 때, ${labels.child}은 그 마음을 방향과 관심으로 받아들일 수 있습니다. 다만 ${labels.child}의 ${childRelationshipRole.title} 에너지가 충분히 표현되지 못하면, 같은 마음도 압박이나 통제로 느껴질 수 있습니다. ${labels.child}의 조용함이나 빠른 반응을 단정하기보다 무엇이 부담스러운지 먼저 묻고, 한 번에 하나의 약속을 함께 정해 보세요. ${typeHint} 흐름에서는 이런 작은 대화의 순서가 서로를 더 편안하게 만듭니다.`,
    },
    childCommunication: {
      closesWhen: CHILD_CLOSES_WHEN[childKey],
      gainsConfidenceWhen: CHILD_CONFIDENCE_WHEN[childKey],
    },
    dialogue: {
      doMessages: [
        `“${labels.child}, ${PARENT_DO_FOCUS[parentKey]}”`,
        `“${labels.child}, ${CHILD_DO_FOCUS[childKey]}”`,
        `“결과와 별개로 네가 해 본 과정과 노력은 내가 보고 있어.”`,
        `“네가 스스로 해 보고 싶은 방법이 있다면, 내가 옆에서 도울게.”`,
      ],
      dontMessages: [
        `“${labels.child}, ${PARENT_DONT_FOCUS[parentKey]}”`,
        `“${labels.child}, ${CHILD_DONT_FOCUS[childKey]}”`,
        `“내가 너를 위해 이렇게 하는데 왜 몰라?”`,
        `“다른 아이들은 다 하는데 너는 왜 못 하니?”`,
      ],
    },
  };
}
