export type CouplePdfShape = "circle" | "triangle" | "inverted_triangle" | "square" | "diamond" | "pentagon" | "hexagon";

export type CouplePdfColor = {
  role: string;
  name: string;
  hex: string;
  keywords: string;
  interpretation: string;
};

export type CouplePdfCard = {
  position: string;
  colorName: string;
  shapeName: string;
  colorHex: string;
  shape: CouplePdfShape;
  title: string;
  narrative: string;
};

export type CouplePdfPerson = {
  label: string;
  colors: CouplePdfColor[];
  cards: CouplePdfCard[];
  integratedAnalysis: string;
  relationshipStyle: string;
  emotionExpression: string;
  complementColor: { name: string; hex: string; meaning: string };
  coachingMessage: string;
};

export type CouplePdfDownloadPayload = {
  relationType: "부부" | "연인";
  generatedAt: string;
  couple: {
    typeName: string;
    coreSummary: string;
    tensionDescription: string;
  };
  personA: CouplePdfPerson;
  personB: CouplePdfPerson;
  relationship: {
    attractionAnalysis: string;
    roles: {
      personATitle: string;
      personADescription: string;
      personBTitle: string;
      personBDescription: string;
      together: string;
    };
    core: {
      headline: string;
      keywords: string[];
      description: string;
    };
    lifePattern: {
      headline: string;
      items: Array<{ label: string; personA: string; personB: string; tension: string }>;
    };
    conflict: {
      trigger: string;
      reaction: string;
      danger: string;
      forbiddenWords: string[];
    };
    connection: {
      headline: string;
      description: string;
      actions: string[];
      intimacyNote: string;
    };
    growth: {
      strength: string;
      blindSpot: string;
      direction: string;
      tip: string;
    };
    recommendedColors: Array<{ name: string; hex: string; reason: string }>;
    togetherRoutine: {
      routines: string[];
      energyNote: string;
      faithRoutine?: string;
    };
    basicPrinciples: string;
    closingMessage: string;
  };
};
