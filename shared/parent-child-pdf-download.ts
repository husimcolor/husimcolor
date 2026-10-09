import type { CouplePdfPerson } from "./couple-pdf-download";

export type ParentChildPdfDownloadPayload = {
  relationType: "아빠-아들" | "아빠-딸" | "엄마-아들" | "엄마-딸" | "부모-자녀";
  generatedAt: string;
  /** 공개용 가상 데이터 리포트에만 표지에 표시한다. 고객 PDF에는 전달하지 않는다. */
  sampleNotice?: string;
  personA: CouplePdfPerson;
  personB: CouplePdfPerson;
  relationship: {
    labels: { parent: string; child: string };
    typeName: string;
    coreSummary: string;
    description: string;
    cardFlowSummary: string;
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
    lifeScenes: {
      strengths: Array<{ title: string; description: string }>;
      tensions: Array<{ title: string; description: string }>;
    };
    dialogue: { doMessages: string[]; dontMessages: string[] };
    conflictRecovery: {
      conflictStart: string;
      parentIntent: string;
      childReception: string;
      mismatch: string;
      recoveryOrder: string;
    };
    recommendedColors: Array<{ name: string; hex: string; reason: string }>;
    practices: string[];
    closingMessage: string;
  };
};
