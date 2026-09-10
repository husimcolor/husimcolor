import type { PremiumPdfReportInput } from "@/lib/premium-pdf-report";
import type { PremiumPdfDownloadPayload } from "@/shared/premium-pdf-download";

/**
 * 웹 결과 화면에서 계산을 마친 값만 서버 PDF 생성기로 전달한다.
 * 이 함수는 해석·오행·회복 데이터를 재계산하거나 새 문장을 생성하지 않는다.
 */
export function buildPremiumPdfDownloadPayload(input: PremiumPdfReportInput): PremiumPdfDownloadPayload {
  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const profileLine = input.profile
    ? [input.profile.age ? `${input.profile.age}세` : "", input.profile.job, input.profile.faith].filter(Boolean).join(" · ")
    : "휴심컬러 개인 심화해석";
  const positions = ["1번 카드 · 무의식", "2번 카드 · 현재 흐름", "3번 카드 · 다음 방향"];

  return {
    profileLine,
    generatedAt,
    selectedColors: input.selectedColors.slice(0, 3).map((color) => ({
      name: "korName" in color ? color.korName : "",
      keywords: "keywords" in color ? color.keywords.slice(0, 3).join(" · ") : "",
    })),
    stage2Bridge: input.stage2Bridge,
    cards: input.cards.slice(0, 3).map((card, index) => {
      const interpretation = input.stage2Cards[index];
      return {
        position: positions[index] ?? `${index + 1}번 카드`,
        label: interpretation?.cardLabel ?? `${card.colorKor} ${card.shapeKor}`,
        colorKeywords: interpretation?.colorKeywords.join(" · ") ?? "",
        shapeKeywords: interpretation?.shapeKeywords.join(" · ") ?? "",
        roleLabel: interpretation?.roleLabel ?? "카드 해석",
        narrative: interpretation?.narrative ?? "",
      };
    }),
    complementColors: input.complementColors.map((color) => ({ ...color })),
    colorFlowDescription: input.colorFlowDescription,
    combinedCoaching: input.combinedCoaching,
    scripture: input.scripture ? { ...input.scripture } : null,
    lifeRole: {
      title: input.lifeRoleReport.coreRole.title,
      description: input.lifeRoleReport.coreRole.description,
      humanStrengths: [...input.lifeRoleReport.humanStrengths],
      directions: input.lifeRoleReport.directions.map((direction) => ({
        title: direction.title,
        description: direction.description,
        preparation: direction.preparation ?? "",
      })),
      environments: [...input.lifeRoleReport.environments],
      shadows: [...input.lifeRoleReport.shadows],
      smallDirection: input.lifeRoleReport.smallDirection,
    },
    energyFlow: {
      currentElements: [...input.lifeEnergyResult.currentFiveElements.elements],
      title: input.lifeEnergyResult.energyFlow.title,
      description: input.lifeEnergyResult.energyFlow.description,
      recovery: input.lifeEnergyResult.energyFlow.recovery,
      balanceKeywords: [...input.lifeEnergyResult.energyFlow.balanceKeywords],
      complementaryElements: [...input.lifeEnergyResult.complementaryFiveElements.elements],
      complementColors: [...(input.lifeEnergyResult.complementaryFiveElements.complementColors ?? [])],
    },
    recoveryRoutine: { ...input.customRecoveryRoutine },
    coachingUrl: input.coachingUrl,
  };
}
