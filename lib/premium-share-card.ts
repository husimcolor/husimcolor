import type { CardData } from "@/constants/cardData";
import type { ColorData } from "@/constants/colorData";
import type { LifeEnergyResult } from "@/constants/lifeArchetype";
import type { LifeRoleEnergyReport } from "@/constants/lifeRoleEnergy";
import type { Stage2CardInterpretation } from "@/constants/premiumStage2CardInterpretation";

export type PremiumShareCardData = {
  colors: Array<{ name: string; hex: string; shape: string }>;
  cards: Array<{ index: number; label: string; colorShape: string; summary: string }>;
  currentFlow: string;
  role: { title: string; description: string };
  currentElements: string[];
  complementaryElements: string[];
  complementaryColors: string[];
  recoveryMessage: string;
};

function toOneLine(value: string, limit = 78): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  const sentence = normalized.split(/(?<=[.!?])\s|\n/)[0] || normalized;
  return sentence.length > limit ? `${sentence.slice(0, limit - 1).trim()}…` : sentence;
}

/**
 * 화면에서 이미 조립된 최종 결과를 SNS 공유용 짧은 카드 데이터로만 축약한다.
 * 새 심리·오행·회복 해석을 생성하지 않으며 개인정보 필드는 받지 않는다.
 */
export function buildPremiumShareCardData(input: {
  selectedColors: ColorData[];
  cards: CardData[];
  stage2Cards: Stage2CardInterpretation[];
  combinedCoaching: string;
  lifeRoleReport: LifeRoleEnergyReport;
  lifeEnergyResult: LifeEnergyResult;
  recoveryMessage: string;
}): PremiumShareCardData {
  const cardLabels = ["내면의 바람", "지금의 반응", "다음 방향"];
  return {
    colors: input.cards.slice(0, 3).map((card, index) => {
      const selected = input.selectedColors[index] ?? input.selectedColors.find((color) => color.id === card.color);
      return { name: selected?.korName ?? card.colorKor, hex: selected?.hex ?? "#CBBFAE", shape: card.shapeKor };
    }),
    cards: input.cards.slice(0, 3).map((card, index) => ({
      index: index + 1,
      label: cardLabels[index] ?? `${index + 1}번 카드`,
      colorShape: `${card.colorKor} · ${card.shapeKor}`,
      summary: toOneLine(input.stage2Cards[index]?.narrative ?? card.energyTitle),
    })),
    currentFlow: toOneLine(input.combinedCoaching),
    role: {
      title: input.lifeRoleReport.coreRole.title,
      description: toOneLine(input.lifeRoleReport.coreRole.description, 92),
    },
    currentElements: input.lifeEnergyResult.currentFiveElements.elements,
    complementaryElements: input.lifeEnergyResult.complementaryFiveElements.elements,
    complementaryColors: input.lifeEnergyResult.complementaryFiveElements.complementColors?.slice(0, 2) ?? [],
    recoveryMessage: toOneLine(input.recoveryMessage, 86),
  };
}
