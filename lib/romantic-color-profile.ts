export type RomanticColorProfile = {
  /** 기존 컬러 원문에 있는 관계 강점을 짧게 압축한 표현 */
  relationshipStrength: string;
  /** 기존 컬러 원문의 그림자·회복 방향을 짧게 압축한 점검 문장 */
  overloadCaution: string;
};

/**
 * 부부·연인 결과에서 사용하는 컬러별 관계 언어입니다.
 * 새 의미를 덧붙이지 않고, COLOR_DATA의 strengths/shadows/reading/relStyle을
 * 관계 역할·관계 특성 문장에 짧게 반영하기 위한 원문 보존형 요약입니다.
 */
export const ROMANTIC_COLOR_PROFILES: Record<string, RomanticColorProfile> = {
  red: {
    relationshipStrength: "마음을 행동으로 옮기고 관계의 흐름을 여는 추진력",
    overloadCaution: "상대의 준비가 늦게 느껴질 때는 속도를 먼저 확인하는 편이 좋습니다.",
  },
  orange: {
    relationshipStrength: "분위기에 활기를 더하고 새로운 경험을 제안하는 친밀한 에너지",
    overloadCaution: "분위기를 살피느라 자신의 피로를 뒤로 미루지 않는 균형이 필요합니다.",
  },
  yellow: {
    relationshipStrength: "생각을 정리해 현실적인 기준을 세우는 균형 감각",
    overloadCaution: "생각이 많아질 때는 두 사람에게 중요한 한 가지를 먼저 정하는 편이 도움이 됩니다.",
  },
  green: {
    relationshipStrength: "신뢰를 천천히 쌓고 관계의 평온을 돌보는 힘",
    overloadCaution: "평온을 지키려 자신의 마음을 숨기지 않도록 짧게라도 표현하는 것이 필요합니다.",
  },
  blue: {
    relationshipStrength: "약속을 지키며 말의 무게로 신뢰를 쌓는 태도",
    overloadCaution: "혼자 감당하는 쪽으로 기울면 마음속 말을 나누는 시간이 필요합니다.",
  },
  indigo: {
    relationshipStrength: "관계의 이유와 의미를 깊게 살피는 통찰",
    overloadCaution: "생각 속에 오래 머물기보다 정리한 마음을 한 문장으로 꺼내는 편이 좋습니다.",
  },
  violet: {
    relationshipStrength: "분위기와 가치를 섬세하게 읽는 내면의 감수성",
    overloadCaution: "이상과 현실의 간격이 커질 때는 지금의 마음을 구체적으로 나누는 것이 도움이 됩니다.",
  },
  pink: {
    relationshipStrength: "감정을 공감하며 관계의 온기를 살피는 다정함",
    overloadCaution: "상대의 반응을 기다리기 전에 필요한 공감을 말로 알려주는 것이 필요합니다.",
  },
  magenta: {
    relationshipStrength: "진심이 통하는 깊은 관계를 소중히 여기는 몰입",
    overloadCaution: "감정을 모두 안에 담아두지 않도록 안전한 방식으로 조금씩 나누는 편이 좋습니다.",
  },
  coral: {
    relationshipStrength: "밝은 반응과 정서적 교감으로 연결을 살리는 활기",
    overloadCaution: "공감을 기다리며 서운함이 쌓이기 전에 자신의 필요를 알려주는 것이 필요합니다.",
  },
  gold: {
    relationshipStrength: "자기 가치와 기준을 지키며 관계에 품격을 더하는 자신감",
    overloadCaution: "비교로 자신을 낮추기보다 서로가 잘해낸 장면을 인정하는 편이 도움이 됩니다.",
  },
  brown: {
    relationshipStrength: "현실의 안정과 꾸준한 생활 감각으로 곁을 지키는 든든함",
    overloadCaution: "익숙한 방식만 고수하고 싶어질 때는 부담 없는 변화 하나를 함께 시도해보세요.",
  },
  beige: {
    relationshipStrength: "갈등의 온도를 낮추고 편안한 거리를 만드는 온화함",
    overloadCaution: "조화를 지키면서도 자신의 의견을 한 문장으로 남기는 것이 필요합니다.",
  },
  white: {
    relationshipStrength: "복잡한 흐름을 정돈하고 진정성을 가려내는 명료함",
    overloadCaution: "거리가 필요할 때도 다시 연결할 마음을 함께 알려주는 편이 좋습니다.",
  },
  black: {
    relationshipStrength: "경계를 지키며 신뢰할 관계에 깊이 집중하는 힘",
    overloadCaution: "가까워질수록 물러나고 싶을 때는 필요한 거리와 마음을 동시에 말해보세요.",
  },
  silver: {
    relationshipStrength: "한발 물러나 상황을 살피고 합리적으로 판단하는 명료함",
    overloadCaution: "논리로 정리하기 전에 지금의 감정을 한 단어로 알아차리는 시간이 필요합니다.",
  },
  olive: {
    relationshipStrength: "서로의 입장과 전체의 균형을 넓게 살피는 성숙함",
    overloadCaution: "모두를 조율하느라 자신의 바람을 뒤로 미루지 않는 것이 필요합니다.",
  },
  mint: {
    relationshipStrength: "새로운 흐름에 유연하게 적응하며 가벼운 활기를 더하는 치유력",
    overloadCaution: "계속 챙기기보다 충분히 쉬어야 그 산뜻함이 오래 이어집니다.",
  },
  skyblue: {
    relationshipStrength: "가능성을 열어두고 자유로운 경험을 함께 발견하는 개방성",
    overloadCaution: "마음이 여러 방향으로 향할 때는 현실적인 약속 하나를 정해두는 편이 좋습니다.",
  },
  lavender: {
    relationshipStrength: "섬세한 감정을 살피며 진심 어린 연결을 바라는 공감",
    overloadCaution: "기대가 실망으로 쌓이기 전에 원하는 위로나 거리를 부드럽게 말해보세요.",
  },
  peach: {
    relationshipStrength: "작은 반응에도 따뜻하게 마음을 건네는 친근한 배려",
    overloadCaution: "양보하기 전에 자신도 공감받고 싶은 마음을 먼저 확인하는 것이 필요합니다.",
  },
  terracotta: {
    relationshipStrength: "현실적인 온기와 꾸준한 애정으로 일상을 단단히 만드는 힘",
    overloadCaution: "안정과 변화 사이에서 지칠 때는 지금 가장 중요한 한 가지에 집중해보세요.",
  },
  sage: {
    relationshipStrength: "주변의 분위기를 읽고 조용히 관계를 조율하는 치유력",
    overloadCaution: "다른 사람을 편안하게 하느라 자신의 감정을 미루지 않는 것이 필요합니다.",
  },
  teal: {
    relationshipStrength: "생각과 감정 사이에서 중심을 잡아 흐름을 정리하는 균형",
    overloadCaution: "이성적으로 괜찮다고 넘기기 전에 마음의 피로를 가볍게 꺼내보세요.",
  },
  cream: {
    relationshipStrength: "자신에게 맞는 고요한 리듬을 지키며 관계에 안정감을 더하는 태도",
    overloadCaution: "혼자 정리하는 시간이 길어질 때는 부담 없는 안부로 연결을 이어가 보세요.",
  },
};

export function getRomanticColorProfile(colorId?: string): RomanticColorProfile | undefined {
  return colorId ? ROMANTIC_COLOR_PROFILES[colorId] : undefined;
}

function connectiveParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  const hasFinalConsonant = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasFinalConsonant ? "과" : "와";
}

export function buildRomanticColorLead(
  colorNameA: string | undefined,
  colorIdA: string | undefined,
  colorNameB: string | undefined,
  colorIdB: string | undefined,
  context: "감정 교류" | "표현 리듬" | "갈등 회복",
): string | undefined {
  const profileA = getRomanticColorProfile(colorIdA);
  const profileB = getRomanticColorProfile(colorIdB);
  if (!profileA || !profileB || !colorNameA || !colorNameB) return undefined;

  return `${colorNameA}의 ${profileA.relationshipStrength}${connectiveParticle(profileA.relationshipStrength)} ${colorNameB}의 ${profileB.relationshipStrength}이 ${context}에 함께 나타납니다.`;
}
