import type { CardData } from "@/constants/cardData";
import type { Stage2CardInterpretation } from "@/constants/premiumStage2CardInterpretation";
import type { LifeEnergyResult } from "@/constants/lifeArchetype";
import type { LifeRoleEnergyReport } from "@/constants/lifeRoleEnergy";
import type { UserProfile } from "@/app/(tabs)/profile";

type ComplementColor = { name: string; meaning: string };

export type PremiumPdfReportInput = {
  profile: UserProfile | null;
  selectedColors: CardData[] | { korName: string; keywords: string[]; hex?: string }[];
  cards: CardData[];
  stage2Bridge: string;
  stage2Cards: Stage2CardInterpretation[];
  complementColors: ComplementColor[];
  colorFlowDescription: string;
  combinedCoaching: string;
  scripture: { label: string; text: string; ref: string } | null;
  lifeRoleReport: LifeRoleEnergyReport;
  lifeEnergyResult: LifeEnergyResult;
  customRecoveryRoutine: {
    food: string;
    tea: string;
    breath: string;
    movement: string;
    smallPractice: string;
    message: string;
  };
  coachingUrl: string;
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraph(value: string | null | undefined): string {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function plainPdfLabel(value: string): string {
  return value.replace(/[🌿✝️🍵🍚🌬️🌱🏡💡☒☑✓✔☐□○△▽◇⬠⬡]/g, "").replace(/\s{2,}/g, " ").trim();
}

function tagList(values: readonly string[]): string {
  return values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("");
}

function section(title: string, body: string, tone = "green", extraClass = ""): string {
  return `<section class="report-section ${tone} ${extraClass}"><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

/**
 * 현재 결과 화면에서 이미 산출한 값만 받아 한글 A4 인쇄용 HTML로 재배치한다.
 * 심리·오행·회복 해석을 이 함수 안에서 새로 생성하지 않는다.
 */
export function buildPremiumPdfHtml(input: PremiumPdfReportInput): string {
  const generatedAt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const profileLine = input.profile
    ? [input.profile.age ? `${input.profile.age}세` : "", input.profile.job, input.profile.faith]
        .filter(Boolean)
        .map(escapeHtml)
        .join(" · ")
    : "휴심컬러 개인 심화해석";
  const selectedColors = input.selectedColors.slice(0, 3).map((color) => {
    const name = "korName" in color ? color.korName : "";
    const keywords = "keywords" in color ? color.keywords.slice(0, 3).join(" · ") : "";
    return `<div class="color-chip"><strong>${escapeHtml(name)}</strong><span>${escapeHtml(keywords)}</span></div>`;
  }).join("");
  const cardDetails = input.cards.slice(0, 3).map((card, index) => {
    const interpretation = input.stage2Cards[index];
    const position = ["1번 카드 · 무의식", "2번 카드 · 현재 흐름", "3번 카드 · 다음 방향"][index] ?? `${index + 1}번 카드`;
    return `<article class="report-card card-detail">
      <p class="eyebrow">${escapeHtml(position)}</p>
      <h3>${escapeHtml(`${card.colorKor} ${card.shapeKor}`)}</h3>
      <p class="keywords"><b>컬러</b> ${escapeHtml(interpretation?.colorKeywords.join(" · ") ?? "")}<br /><b>도형</b> ${escapeHtml(interpretation?.shapeKeywords.join(" · ") ?? "")}</p>
      <p><b>${escapeHtml(interpretation?.roleLabel ?? "카드 해석")}</b><br />${paragraph(interpretation?.narrative)}</p>
    </article>`;
  }).join("");
  const directions = input.lifeRoleReport.directions.map((direction) => `<article class="direction-card">
    <h3>${escapeHtml(direction.title)}</h3>
    <p>${paragraph(direction.description)}</p>
    <p class="preparation"><b>준비 방향</b> · ${paragraph(direction.preparation)}</p>
  </article>`).join("");
  const coachingUrl = escapeHtml(input.coachingUrl);

  return `<!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>휴심컬러 개인 심화 리포트</title>
    <style>
      @page { size: A4; margin: 14mm 13mm 16mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #302B27; font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif; font-size: 13.5pt; line-height: 1.68; word-break: normal; overflow-wrap: anywhere; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: 25pt; line-height: 1.28; margin-bottom: 8px; letter-spacing: -0.6px; color: #3D3530; }
      h2 { font-size: 15pt; line-height: 1.4; margin-bottom: 12px; color: #2D6A4F; }
      h3 { font-size: 12.5pt; line-height: 1.45; margin-bottom: 6px; color: #4A3A2A; }
      .cover { min-height: 255mm; display: flex; flex-direction: column; justify-content: center; padding: 20mm 10mm; background: linear-gradient(150deg, #F8F4EE, #F0F7F4); page-break-after: always; }
      .brand { color: #4C7A58; font-size: 11pt; font-weight: 700; letter-spacing: 1.2px; margin-bottom: 12px; }
      .subtitle { color: #685C51; font-size: 12pt; margin-bottom: 28px; }
      .meta { color: #75695D; font-size: 9.5pt; }
      .color-grid, .tag-grid { display: flex; flex-wrap: wrap; gap: 7px; }
      .color-chip { min-width: 30%; flex: 1; border: 1px solid #DDCFBD; background: #FFFDF9; border-radius: 10px; padding: 10px; break-inside: avoid; }
      .color-chip strong, .color-chip span { display: block; }
      .color-chip span { color: #766B60; font-size: 10.1pt; margin-top: 3px; }
      .report-section { margin: 0 0 18px; padding: 16px; border: 1px solid #D7E6DC; border-radius: 12px; break-inside: avoid-page; page-break-inside: avoid; }
      .role-section { break-inside: auto; page-break-inside: auto; }
      .report-section.green { background: #F4FAF6; }
      .report-section.gold { background: #FFF9EF; border-color: #E7D6B5; }
      .report-section.purple { background: #F8F5FF; border-color: #DDD2F0; }
      .report-card, .direction-card { margin: 0 0 10px; padding: 13px; border: 1px solid #E4DDD3; border-radius: 9px; background: #fff; break-inside: avoid-page; page-break-inside: avoid; }
      .report-card:last-child, .direction-card:last-child { margin-bottom: 0; }
      .eyebrow { color: #4A7A4A; font-size: 10pt; font-weight: 700; margin-bottom: 4px; }
      .keywords { color: #64594D; font-size: 11.6pt; }
      .tag { display: inline-block; margin: 0 5px 5px 0; padding: 4px 8px; border-radius: 99px; background: #E8F3EC; border: 1px solid #CAE1D2; color: #376849; font-size: 10.4pt; }
      .note { padding: 12px 14px; background: #FCF8F0; border-left: 3px solid #C4956A; border-radius: 6px; break-inside: avoid-page; page-break-inside: avoid; }
      .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .small-title { color: #6A5843; font-weight: 700; margin-bottom: 4px; }
      .preparation { color: #66557B; font-size: 11pt; margin-bottom: 0; }
      .routine-row { display: grid; grid-template-columns: 23mm 1fr; gap: 8px; padding: 8px 0; border-bottom: 1px solid #E9DDC8; break-inside: avoid; }
      .routine-row:last-child { border-bottom: 0; }
      .routine-label { color: #8B6914; font-weight: 700; }
      .page-break { break-before: page; page-break-before: always; }
      .footer { margin-top: 16px; text-align: center; color: #8B8176; font-size: 8.5pt; }
      .cta { padding: 20px; background: #F2F7F1; border: 1px solid #C7DEC8; border-radius: 12px; break-inside: avoid-page; page-break-inside: avoid; }
      .cta a { color: #287A43; font-weight: 700; text-decoration: none; word-break: break-all; }
      @media print { .page-break { break-before: page; page-break-before: always; } }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <p class="brand">HUSIM COLOR · PERSONAL DEEP REPORT</p>
        <h1>나의 컬러 심리 리포트</h1>
        <p class="subtitle">색과 도형으로 살펴본 현재의 마음, 삶의 역할, 회복 리듬</p>
        <div class="color-grid">${selectedColors}</div>
        <p class="meta">${profileLine}<br />리포트 생성일 · ${escapeHtml(generatedAt)}</p>
      </section>

      ${section("3장의 심리카드 해석", `<p class="note">${paragraph(input.stage2Bridge)}</p><div class="card-stack">${cardDetails}</div>`)}
      ${section("지금 나에게 필요한 컬러", `<div class="tag-grid">${input.complementColors.map((color) => `<span class="tag"><b>${escapeHtml(color.name)}</b> · ${escapeHtml(color.meaning)}</span>`).join("")}</div>`, "gold")}
      ${section("나의 컬러 성향", `<p>${paragraph(input.colorFlowDescription)}</p>`)}
      ${section("지금 마음의 흐름", `<p>${paragraph(input.combinedCoaching)}</p>`)}
      ${input.scripture ? section(plainPdfLabel(input.scripture.label), `<p>“${paragraph(input.scripture.text)}”</p><p class="meta">— ${escapeHtml(input.scripture.ref)}</p>`, "gold") : ""}

      ${section("나의 삶의 역할 에너지", `
        <article class="report-card"><p class="eyebrow">나의 핵심 역할</p><h3>${escapeHtml(input.lifeRoleReport.coreRole.title)}</h3><p>${paragraph(input.lifeRoleReport.coreRole.description)}</p></article>
        <p class="small-title">이 역할이 더하는 가치</p><div class="tag-grid">${tagList(input.lifeRoleReport.humanStrengths)}</div>
        <p class="small-title" style="margin-top:12px">사회적 쓰임새 · 진로 방향</p>${directions}
        <div class="two-column"><article class="report-card"><p class="small-title">잘 맞는 일의 환경</p>${input.lifeRoleReport.environments.map((value) => `<p>· ${escapeHtml(value)}</p>`).join("")}</article><article class="report-card"><p class="small-title">역할 에너지의 그림자</p>${input.lifeRoleReport.shadows.map((value) => `<p>· ${escapeHtml(value)}</p>`).join("")}</article></div>
        <div class="note" style="margin-top:10px"><b>지금의 작은 방향</b><br />${paragraph(input.lifeRoleReport.smallDirection)}</div>
      `, "purple", "role-section")}

      ${section("지금 몸과 마음의 흐름", `
        <p class="meta">에너지 관점 · 현재 주요 흐름 ${escapeHtml(input.lifeEnergyResult.currentFiveElements.elements.join(" · "))}</p>
        <article class="report-card"><h3>${escapeHtml(input.lifeEnergyResult.energyFlow.title)}</h3><p>${paragraph(input.lifeEnergyResult.energyFlow.description)}</p><p class="note"><b>지금 필요한 것</b><br />${paragraph(input.lifeEnergyResult.energyFlow.recovery)}</p><div class="tag-grid">${tagList(input.lifeEnergyResult.energyFlow.balanceKeywords)}</div></article>
      `)}
      ${section("오늘의 맞춤 회복 루틴", `
        <p class="meta">보완 에너지 · ${escapeHtml(input.lifeEnergyResult.complementaryFiveElements.elements.join(" · "))}${input.lifeEnergyResult.complementaryFiveElements.complementColors?.length ? ` · 보완 컬러 ${escapeHtml(input.lifeEnergyResult.complementaryFiveElements.complementColors.slice(0, 2).join(" · "))}` : ""}</p>
        <div class="routine-row"><span class="routine-label">추천 차</span><span>${escapeHtml(input.customRecoveryRoutine.tea ?? "")}</span></div>
        <div class="routine-row"><span class="routine-label">추천 음식</span><span>${escapeHtml(input.customRecoveryRoutine.food)}</span></div>
        <div class="routine-row"><span class="routine-label">추천 호흡</span><span>${escapeHtml(input.customRecoveryRoutine.breath)}</span></div>
        <div class="routine-row"><span class="routine-label">추천 움직임</span><span>${escapeHtml(input.customRecoveryRoutine.movement)}</span></div>
        <div class="routine-row"><span class="routine-label">오늘의 작은 실천</span><span>${escapeHtml(input.customRecoveryRoutine.smallPractice)}</span></div>
        <div class="note" style="margin-top:12px"><b>오늘의 회복 메시지</b><br />${paragraph(input.customRecoveryRoutine.message)}</div>
      `, "gold")}
      <section class="cta">
        <h2>휴심컬러 1:1 컬러코칭</h2>
        <p>지금의 마음 흐름과 나에게 맞는 회복의 방향을 더 깊이 나누고 싶다면, 1:1 컬러코칭으로 이어갈 수 있습니다.</p>
        <p><a href="${coachingUrl}">${coachingUrl}</a></p>
      </section>
      <p class="footer">본 리포트는 현재 선택 결과를 바탕으로 한 자기이해·생활 웰니스 참고 자료이며, 의료적 진단이나 치료를 대신하지 않습니다.</p>
    </main>
  </body>
  </html>`;
}
