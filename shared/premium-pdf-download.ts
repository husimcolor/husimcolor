export type PremiumPdfDownloadPayload = {
  profileLine: string;
  generatedAt: string;
  selectedColors: Array<{ name: string; keywords: string }>;
  stage2Bridge: string;
  cards: Array<{
    position: string;
    label: string;
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
