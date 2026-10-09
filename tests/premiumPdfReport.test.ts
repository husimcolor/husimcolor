import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CARD_DATA, type CardData } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { buildCustomRecoveryRoutine, buildLifeEnergyResult } from "../constants/lifeArchetype";
import { buildLifeRoleEnergyReport } from "../constants/lifeRoleEnergy";
import { buildPremiumStage1Interpretation } from "../constants/premiumStage1Data";
import { buildPremiumPdfHtml } from "../lib/premium-pdf-report";
import { buildPremiumPdfDownloadPayload } from "../lib/premium-pdf-download";
import { buildPremiumShareCardData } from "../lib/premium-share-card";
import { buildPremiumCardFlowSummary } from "../lib/premium-card-flow-summary";
import { buildPremiumColorFlowDescription } from "../lib/premium-color-flow-summary";
import { createPremiumPdfBuffer, validatePremiumPdfPayload } from "../server/pdf-report";
import { COACHING_BOOKING_URL } from "../shared/coaching-booking";
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
  const stage1 = buildPremiumStage1Interpretation(colors);
  const lifeRole = buildLifeRoleEnergyReport(colors.map((color) => color.id), cards, "45세");
  const html = buildPremiumPdfHtml({
    profile: null,
    selectedColors: colors,
    stage1Interpretation: stage1,
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
    expect(html).toContain(stage1.miniInterpretations[0].description);
    expect(html).toContain(stage1.relationshipTendency);
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
    expect(source).toContain("function CardShapeMark");
    expect(source).not.toContain("{card.shapeSymbol}");
    expect(source).toContain("pdfDownloadLockRef.current");
    expect(source).toContain("setPdfDownloadState('preparing')");
    expect(source).toContain("다운로드 중...");
    expect(source).toContain("다운로드에 실패했습니다. 다시 시도해주세요.");
    expect(source).toContain("disabled={pdfDownloadState !== 'idle'}");
    expect(source).toContain("husim_pdf_download");
    const pdfApiSource = readFileSync(resolve(process.cwd(), "api/pdf-report.ts"), "utf8");
    expect(pdfApiSource).toContain('Set-Cookie');
    expect(pdfApiSource).toContain('requestId');
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
      stage1Interpretation: stage1,
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
    expect(validated.stage1?.colors[0].description).toBe(stage1.miniInterpretations[0].description);
    expect(validated.stage1?.relationshipTendency).toBe(stage1.relationshipTendency);
    expect(validated.energyFlow.currentElements).toEqual(energy.currentFiveElements.elements);
    expect(validated.selectedColors[0].hex).toBe(colors[0].hex);
    expect(validated.cards[0]).toMatchObject({ colorHex: cards[0].colorHex, shape: cards[0].shape });
    const source = readFileSync(resolve(process.cwd(), "server/pdf-report.ts"), "utf8");
    expect(source).toContain("writeCoverColorChip");
    expect(source).toContain("writeCardPreviewRow");
    expect(source).toContain('path.join(__dirname, "HusimPdfKorean.ttf")');
    expect(source).toContain("existsSync(BUNDLED_FONT_PATH)");
    expect(source).toContain("BODY_TEXT_SIZE = 18.5");
    expect(source).toContain("BODY_LABEL_SIZE = 16");
    expect(source).toContain("BODY_LINE_GAP = 7.5");
    const nativeHtmlSource = readFileSync(resolve(process.cwd(), "lib/premium-pdf-report.ts"), "utf8");
    expect(nativeHtmlSource).toContain("font-size: 18.5pt; line-height: 1.9");
    expect(source).not.toContain("`• ${value}`");
  });

  it("회복 루틴은 화면·서버·네이티브 PDF에서 같은 여섯 라벨과 음식 용어를 사용한다", () => {
    const labels = ["추천 차", "추천 음식", "추천 호흡", "추천 움직임", "오늘의 작은 실천", "오늘의 회복 메시지"];
    const screen = readFileSync(resolve(process.cwd(), "app/(tabs)/premium-result.tsx"), "utf8");
    const server = readFileSync(resolve(process.cwd(), "server/pdf-report.ts"), "utf8");
    const nativeHtml = readFileSync(resolve(process.cwd(), "lib/premium-pdf-report.ts"), "utf8");
    const recoverySource = readFileSync(resolve(process.cwd(), "constants/lifeArchetype.ts"), "utf8");

    labels.forEach((label) => {
      expect(screen).toContain(label);
      expect(server).toContain(label);
      expect(nativeHtml).toContain(label);
    });
    expect(recoverySource).toContain("검은콩·검은깨 등 검은 음식");
    expect(recoverySource).not.toContain("식재료");
    expect(recoverySource).toContain("낮 시간에 10분 햇빛 속에 앉아 있기");
    expect(recoverySource).not.toMatch(/낙실|낙살|앜아|시간 에|꼼어|쉽히|잋는|흥수/);
  });

  it("현재 흐름이 과열된 경우에는 같은 화 계열을 보완 에너지로 다시 추천하지 않는다", () => {
    expect(energy.flowType).toBe("진장");
    expect(energy.complementaryFiveElements.elements).not.toContain("화");
    expect(energy.complementaryFiveElements.complementColors).not.toContain("레드");
    expect(energy.complementaryFiveElements.complementColors).not.toContain("오렌지");
  });

  it("현재 마음의 흐름은 카드 원문을 되풀이하지 않고 무의식·현재·회복 방향을 구분한다", () => {
    const summary = buildPremiumCardFlowSummary(cards);
    expect(summary).toContain("1번 레드 삼각형은 평소");
    expect(summary).toContain("2번 블루 마름모는 지금");
    expect(summary).toContain("3번 화이트 네모는 회복할 때");
    expect(summary).toContain("회복할 때");
    expect(summary).not.toContain(stage2Cards[0].narrative);
    expect(COACHING_BOOKING_URL).toBe("https://naver.me/ID3fxw2W");
  });

  it("컬러 성향 문장은 마지막 키워드의 종성에 맞춰 화이트의 정화가처럼 연결한다", () => {
    expect(buildPremiumColorFlowDescription([
      { korName: "레드", keywords: ["열정"] },
      { korName: "블루", keywords: ["신뢰"] },
      { korName: "화이트", keywords: ["정화"] },
    ])).toBe("레드의 열정 · 블루의 신뢰 · 화이트의 정화가 당신의 성향을 이루고 있습니다.");
  });

  it("에너지 제목의 조사는 종성에 맞게 처리해 체계을 같은 오류가 재발하지 않는다", () => {
    const screen = readFileSync(resolve(process.cwd(), "app/(tabs)/premium-result.tsx"), "utf8");
    expect(screen).toContain("josaCoach(base, '을', '를')");
    expect(screen).not.toContain("`${base}을 향한 마음");
  });

  it("역할 에너지의 그림자 제목과 모든 항목을 같은 페이지에 배치할 높이를 먼저 확보한다", () => {
    const source = readFileSync(resolve(process.cwd(), "server/pdf-report.ts"), "utf8");
    expect(source).toContain("function bulletListHeight");
    expect(source).toContain("ensureSpace(document, 32 + bulletListHeight(document, payload.lifeRole.shadows));");
  });

  it("세 카드 종합 흐름은 서버·네이티브 PDF 모두 카드 위치별 짧은 문단으로 표시한다", () => {
    const server = readFileSync(resolve(process.cwd(), "server/pdf-report.ts"), "utf8");
    const nativeHtml = readFileSync(resolve(process.cwd(), "lib/premium-pdf-report.ts"), "utf8");
    expect(server).toContain("function writeParagraphBlocks");
    expect(server).toContain("writeParagraphBlocks(document, payload.combinedCoaching);");
    expect(nativeHtml).toContain("const cardFlowParagraphs = input.combinedCoaching");
    expect(nativeHtml).toContain('section("지금 마음의 흐름", cardFlowParagraphs)');
  });
});
