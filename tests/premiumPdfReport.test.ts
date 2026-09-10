import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_DATA, type CardData } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { buildCustomRecoveryRoutine, buildLifeEnergyResult } from "../constants/lifeArchetype";
import { buildLifeRoleEnergyReport } from "../constants/lifeRoleEnergy";
import { buildPremiumPdfHtml } from "../lib/premium-pdf-report";
import { buildPremiumPdfDownloadPayload } from "../lib/premium-pdf-download";
import { buildPremiumShareCardData } from "../lib/premium-share-card";
import { createPremiumPdfBuffer, validatePremiumPdfPayload } from "../server/pdf-report";
import { buildStage2CardInterpretations, buildStage2ColorBridge } from "../constants/premiumStage2CardInterpretation";

const getCard = (id: string): CardData => {
  const card = CARD_DATA.find((item) => item.id === id);
  if (!card) throw new Error(`Missing fixture card: ${id}`);
  return card;
};

describe("유료 결과 PDF 리포트", () => {
  const cards = [getCard("red_triangle"), getCard("blue_diamond"), getCard("white_square")] as [CardData, CardData, CardData];
  const colors = COLOR_DATA.filter((color) => ["red", "blue", "white"].includes(color.id));
  const energy = buildLifeEnergyResult(
    colors.map((color) => color.id),
    cards.map((card) => ({ color: card.color, shape: card.shape })),
    cards[2].complementColors,
  );
  const routine = buildCustomRecoveryRoutine(
    energy.complementaryFiveElements.elements,
    cards[2].wellness,
    energy.routines,
    energy.currentRoutines,
  );
  const stage2Cards = buildStage2CardInterpretations(cards);
  const lifeRole = buildLifeRoleEnergyReport(colors.map((color) => color.id), cards, "45세");
  const html = buildPremiumPdfHtml({
    profile: null,
    selectedColors: colors,
    cards,
    stage2Bridge: buildStage2ColorBridge(colors),
    stage2Cards,
    complementColors: cards[2].complementColors,
    colorFlowDescription: "레드·블루·화이트의 현재 성향 설명입니다.",
    combinedCoaching: "웹 화면에 표시되는 지금 마음의 흐름입니다.",
    scripture: { label: "🌿 오늘의 위로", text: "웹 결과의 위로 문구입니다.", ref: "" },
    lifeRoleReport: lifeRole,
    lifeEnergyResult: energy,
    customRecoveryRoutine: {
      tea: cards[2].wellness.tea,
      food: routine.food,
      breath: routine.breath,
      movement: routine.movement,
      smallPractice: routine.smallPractice,
      message: routine.message,
    },
    coachingUrl: "https://naver.me/ID3fxw2W",
  });

  it("웹 결과의 카드·오행·회복·역할 데이터를 새 해석 없이 A4 HTML로 재배치한다", () => {
    expect(html).toContain(stage2Cards[0].narrative);
    expect(html).toContain(energy.currentFiveElements.elements.join(" · "));
    expect(html).toContain(energy.complementaryFiveElements.elements.join(" · "));
    expect(html).toContain(routine.food);
    expect(html).toContain(lifeRole.coreRole.title);
    expect(html).toContain("휴심컬러 1:1 컬러코칭");
    expect(html).toContain("@page { size: A4");
    expect(html).toContain("break-inside: avoid-page");
  });

  it("결과 화면이 간단 결과 공유와 별개로 PDF 다운로드 CTA를 제공한다", () => {
    const source = readFileSync(resolve(process.cwd(), "app/(tabs)/premium-result.tsx"), "utf8");
    expect(source).toContain("결과 공유하기");
    expect(source).toContain("PDF 리포트 다운로드");
    expect(source).toContain("buildPremiumPdfHtml");
    expect(source).toContain("Print.printToFileAsync");
    expect(source).toContain("shareOrDownloadWebFile");
    expect(source).toContain("PremiumShareSummaryCard");
    expect(source).toContain("submitServerPdfDownload");
    expect(source).toContain("/api/pdf-report");
  });

  it("요약 공유카드는 화면의 최종 카드·역할·오행·회복 값을 개인정보 없이 압축한다", () => {
    const shareCard = buildPremiumShareCardData({
      selectedColors: colors,
      cards,
      stage2Cards,
      combinedCoaching: "웹 화면에 표시되는 지금 마음의 흐름입니다.",
      lifeRoleReport: lifeRole,
      lifeEnergyResult: energy,
      recoveryMessage: routine.message,
    });
    expect(shareCard.colors).toHaveLength(3);
    expect(shareCard.cards[0].summary).toContain(stage2Cards[0].narrative.split(/[.!?]/)[0]);
    expect(shareCard.currentFlow).toContain("웹 화면에 표시되는");
    expect(shareCard.role.title).toBe(lifeRole.coreRole.title);
    expect(shareCard.currentElements).toEqual(energy.currentFiveElements.elements);
    expect(shareCard.complementaryElements).toEqual(energy.complementaryFiveElements.elements);
    expect(shareCard.recoveryMessage).toContain(routine.message.split(/[.!?]/)[0]);
    expect(Object.keys(shareCard)).not.toContain("profile");
  });

  it("서버 PDF는 같은 최종 결과 데이터로 유효한 PDF 바이트를 생성한다", async () => {
    const payload = buildPremiumPdfDownloadPayload({
      profile: null,
      selectedColors: colors,
      cards,
      stage2Bridge: buildStage2ColorBridge(colors),
      stage2Cards,
      complementColors: cards[2].complementColors,
      colorFlowDescription: "레드·블루·화이트의 현재 성향 설명입니다.",
      combinedCoaching: "웹 화면에 표시되는 지금 마음의 흐름입니다.",
      scripture: { label: "🌿 오늘의 위로", text: "웹 결과의 위로 문구입니다.", ref: "" },
      lifeRoleReport: lifeRole,
      lifeEnergyResult: energy,
      customRecoveryRoutine: {
        tea: cards[2].wellness.tea,
        food: routine.food,
        breath: routine.breath,
        movement: routine.movement,
        smallPractice: routine.smallPractice,
        message: routine.message,
      },
      coachingUrl: "https://naver.me/ID3fxw2W",
    });
    const validated = validatePremiumPdfPayload(payload);
    const pdf = await createPremiumPdfBuffer(validated);
    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(2_000);
    expect(validated.cards[0].narrative).toBe(stage2Cards[0].narrative);
    expect(validated.energyFlow.currentElements).toEqual(energy.currentFiveElements.elements);
  });
});
