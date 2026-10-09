export type PremiumPdfDownloadPayload = {
  profileLine: string;
  generatedAt: string;
  /** 공개용 가상 데이터 리포트에만 표지에 표시한다. 고객 PDF에는 전달하지 않는다. */
  sampleNotice?: string;
  selectedColors: Array<{ name: string; keywords: string; hex: string }>;
  /** 결과 화면의 1단계 컬러 상세 해석을 PDF에도 같은 값으로 전달한다. */
  stage1?: {
    colors: Array<{
      role: string;
      name: string;
      hex: string;
      keywords: string[];
      description: string;
      strengths: string[];
      tiredStates: string[];
    }>;
    integrationBridge: string;
    psychologyTendency: string;
    personalityTendency: string;
    strengths: string[];
    growthPossibility: string[];
    relationshipTendency: string;
  };
  stage2Bridge: string;
  cards: Array<{
    position: string;
    label: string;
    colorName: string;
    shapeName: string;
    colorHex: string;
    shape: "circle" | "triangle" | "inverted_triangle" | "square" | "diamond" | "pentagon" | "hexagon";
    colorKeywords: string;
    shapeKeywords: string;
    roleLabel: string;
    narrative: string;
  }>;
  complementColors: Array<{ name: string; meaning: string }>;
  colorFlowDescription: string;
  combinedCoaching: string;
  scripture: { label: string; text: string; ref: string } | null;
  lifeRole: {
    title: string;
    description: string;
    humanStrengths: string[];
    directions: Array<{ title: string; description: string; preparation: string }>;
    environments: string[];
    shadows: string[];
    smallDirection: string;
  };
  energyFlow: {
    currentElements: string[];
    title: string;
    description: string;
    recovery: string;
    balanceKeywords: string[];
    complementaryElements: string[];
    complementColors: string[];
  };
  recoveryRoutine: {
    tea: string;
    food: string;
    breath: string;
    movement: string;
    smallPractice: string;
    message: string;
  };
  coachingUrl: string;
};
