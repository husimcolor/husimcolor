import type { CardData } from "@/constants/cardData";
import type { PremiumStage1Interpretation } from "@/constants/premiumStage1Data";
import type { Stage2CardInterpretation } from "@/constants/premiumStage2CardInterpretation";
import type { LifeEnergyResult } from "@/constants/lifeArchetype";
import type { LifeRoleEnergyReport } from "@/constants/lifeRoleEnergy";
import type { UserProfile } from "@/app/(tabs)/profile";
import { localizePayload, localizeStaticCopy } from "./zh-cn-copy";
import type { AppLocale } from "../shared/localization";
type ComplementColor = { name: string; meaning: string };
export type PremiumPdfReportInput = {
  /** Native PDF도 결과가 생성된 언어를 사용한다. 저장되지 않은 기존 결과는 한국어로 유지한다. */
  locale?: AppLocale;
  profile: UserProfile | null;
  selectedColors: CardData[] | { korName: string; keywords: string[]; hex?: string }[];
  stage1Interpretation?: PremiumStage1Interpretation;
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
  const locale = input.locale ?? "ko";
  // 네이티브 인쇄는 서버 PDF와 별도 경로이므로, 조립 전의 모든 해석 데이터도
  // 서버 PDF와 같은 payload 단위의 공통 변환을 먼저 적용한다.
  input = locale === "zh-CN" ? localizePayload(input, locale) : input;
  const isZh = locale === "zh-CN";
  const copy = isZh ? {
    documentTitle: "HUSIM COLOR 个人深度分析报告", brand: "HUSIM COLOR · 个人深度分析报告", coverTitle: "我的色彩心理报告",
    coverSubtitle: "通过色彩与图形，了解当下的内心感受、社会角色与自我调节的方向", generatedAt: "报告生成日期",
    selectedColours: "所选三种颜色的详细解读", cardInterpretation: "三张心理卡解读", complementColours: "推荐调和色",
    complementDescription: "这种颜色能在当前状态中缓和容易走向过度的倾向，并帮助指引恢复方向。", colourTendency: "我的色彩倾向",
    currentFlow: "当下的内心变化", lifeRole: "我的社会角色与优势", coreRole: "我的核心角色", roleValue: "这个角色带来的价值",
    careerDirection: "社会用途 · 职业方向", workingEnvironment: "适合的工作环境", roleShadow: "需要留意的一面", smallDirection: "当前可以尝试的小方向",
    bodyMind: "当下的身心状态", energyPerspective: "从五行能量角度", currentNeed: "当前所需", routine: "今日专属恢复练习",
    balancingEnergy: "调和能量", recommendedTea: "推荐茶", recommendedFood: "推荐食物", recommendedBreath: "推荐呼吸法", recommendedMovement: "推荐动作",
    smallPractice: "今天的小行动", recoveryMessage: "今天给自己的话", coaching: "HUSIM COLOR 一对一色彩心理辅导",
    coachingDescription: "如果想更深入地分享当前状态和适合自己的恢复方向，可以继续进行一对一色彩心理辅导。",
    disclaimer: "本报告基于当前选择结果，作为自我理解与日常自我照顾的参考资料，不替代医疗诊断或治疗。",
  } : {
    documentTitle: "휴심컬러 개인 심화 리포트", brand: "HUSIM COLOR · PERSONAL DEEP REPORT", coverTitle: "나의 컬러 심리 리포트",
    coverSubtitle: "색과 도형으로 살펴본 현재의 마음, 삶의 역할, 회복 리듬", generatedAt: "리포트 생성일",
    selectedColours: "선택한 세 컬러의 상세 해석", cardInterpretation: "3장의 심리카드 해석", complementColours: "추천 보완컬러",
    complementDescription: "현재 흐름에서 과해지기 쉬운 결을 누그러뜨리고, 회복 방향을 돕는 컬러입니다.", colourTendency: "나의 컬러 성향",
    currentFlow: "지금 마음의 흐름", lifeRole: "나의 삶의 역할 에너지", coreRole: "나의 핵심 역할", roleValue: "이 역할이 더하는 가치",
    careerDirection: "사회적 쓰임새 · 진로 방향", workingEnvironment: "잘 맞는 일의 환경", roleShadow: "역할 에너지의 그림자", smallDirection: "지금의 작은 방향",
    bodyMind: "지금 몸과 마음의 흐름", energyPerspective: "에너지 관점", currentNeed: "지금 필요한 것", routine: "오늘의 맞춤 회복 루틴",
    balancingEnergy: "보완 에너지", recommendedTea: "추천 차", recommendedFood: "추천 음식", recommendedBreath: "추천 호흡", recommendedMovement: "추천 움직임",
    smallPractice: "오늘의 작은 실천", recoveryMessage: "오늘의 회복 메시지", coaching: "휴심컬러 1:1 컬러코칭",
    coachingDescription: "지금의 마음 흐름과 나에게 맞는 회복의 방향을 더 깊이 나누고 싶다면, 1:1 컬러코칭으로 이어갈 수 있습니다.",
    disclaimer: "본 리포트는 현재 선택 결과를 바탕으로 한 자기이해·생활 웰니스 참고 자료이며, 의료적 진단이나 치료를 대신하지 않습니다.",
  };
  const generatedAt = new Intl.DateTimeFormat(locale === "zh-CN" ? "zh-CN" : "ko-KR", {
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
    const position = ["1번 카드 · 무의식", "2번 카드 · 현재흐름", "3번 카드 · 회복방향"][index] ?? `${index + 1}번 카드`;
    return `<article class="report-card card-detail">
      <p class="eyebrow">${escapeHtml(position)}</p>
      <h3>${escapeHtml(`${card.colorKor} ${card.shapeKor}`)}</h3>
      <p class="keywords"><b>컬러</b> ${escapeHtml(interpretation?.colorKeywords.join(" · ") ?? "")}<br /><b>도형</b> ${escapeHtml(interpretation?.shapeKeywords.join(" · ") ?? "")}</p>
      <p><b>${escapeHtml(interpretation?.roleLabel ?? "카드 해석")}</b><br />${paragraph(interpretation?.narrative)}</p>
    </article>`;
  }).join("");
  const stage1ColorDetails = input.stage1Interpretation?.miniInterpretations.map((item, index) => `<article class="report-card color-detail">
    <p class="eyebrow">${escapeHtml(index === 0 ? "주기질" : index === 1 ? "보조기질" : "회복방향")}</p>
    <h3>${escapeHtml(item.colorName)}</h3>
    <p class="keywords">${escapeHtml(item.keywords.join(" · "))}</p>
    <p>${paragraph(item.description)}</p>
    <p class="meta"><b>강점</b> · ${escapeHtml(item.strengths.join(" · "))}<br /><b>마음이 지칠 때</b> · ${escapeHtml(item.tiredStates.join(" · "))}</p>
  </article>`).join("") ?? "";
  const stage1Summary = input.stage1Interpretation ? `
    <article class="report-card"><h3>세 컬러가 함께 나타날 때</h3><p>${paragraph(input.stage1Interpretation.integrationBridge)}</p></article>
    <article class="report-card"><p class="small-title">심리 성향</p><p>${paragraph(input.stage1Interpretation.psychologyTendency)}</p><p class="small-title">성격 경향</p><p>${paragraph(input.stage1Interpretation.personalityTendency)}</p><p class="small-title">관계 성향</p><p>${paragraph(input.stage1Interpretation.relationshipTendency)}</p></article>
    <p class="small-title">주요 장점</p><div class="tag-grid">${tagList(input.stage1Interpretation.strengths)}</div>
    <p class="small-title" style="margin-top:12px">성장 가능성</p><div class="tag-grid">${tagList(input.stage1Interpretation.growthPossibility)}</div>
  ` : "";
  const directions = input.lifeRoleReport.directions.map((direction) => `<article class="direction-card">
    <h3>${escapeHtml(direction.title)}</h3>
    <p>${paragraph(direction.description)}</p>
    <p class="preparation"><b>준비 방향</b> · ${paragraph(direction.preparation)}</p>
  </article>`).join("");
  const cardFlowParagraphs = input.combinedCoaching
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `<p>${paragraph(item)}</p>`)
    .join("");
  const coachingUrl = escapeHtml(input.coachingUrl);

  const html = `<!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.documentTitle}</title>
    <style>
      @page { size: A4; margin: 14mm 13mm 16mm; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; color: #302B27; font-family: ${isZh ? '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", sans-serif' : '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif'}; font-size: 18.5pt; line-height: 1.9; word-break: normal; overflow-wrap: anywhere; }
      h1, h2, h3, p { margin-top: 0; }
      h1 { font-size: 25pt; line-height: 1.28; margin-bottom: 8px; letter-spacing: -0.6px; color: #3D3530; }
      h2 { font-size: 15pt; line-height: 1.4; margin-bottom: 12px; color: #2D6A4F; }
      h3 { font-size: 12.5pt; line-height: 1.45; margin-bottom: 6px; color: #4A3A2A; }
      .cover { min-height: 255mm; display: flex; flex-direction: column; justify-content: center; padding: 20mm 10mm; background: linear-gradient(150deg, #F8F4EE, #F0F7F4); page-break-after: always; }
      .brand { color: #4C7A58; font-size: 11pt; font-weight: 700; letter-spacing: 1.2px; margin-bottom: 12px; }
      .subtitle { color: #685C51; font-size: 12pt; margin-bottom: 28px; }
      .meta { color: #75695D; font-size: 13pt; }
      .color-grid, .tag-grid { display: flex; flex-wrap: wrap; gap: 7px; }
      .color-chip { min-width: 30%; flex: 1; border: 1px solid #DDCFBD; background: #FFFDF9; border-radius: 10px; padding: 10px; break-inside: avoid; }
      .color-chip strong, .color-chip span { display: block; }
      .color-chip span { color: #766B60; font-size: 14pt; margin-top: 3px; }
      .report-section { margin: 0 0 18px; padding: 16px; border: 1px solid #D7E6DC; border-radius: 12px; break-inside: avoid-page; page-break-inside: avoid; }
      .role-section { break-inside: auto; page-break-inside: auto; }
      .report-section.green { background: #F4FAF6; }
      .report-section.gold { background: #FFF9EF; border-color: #E7D6B5; }
      .report-section.purple { background: #F8F5FF; border-color: #DDD2F0; }
      .report-card, .direction-card { margin: 0 0 10px; padding: 13px; border: 1px solid #E4DDD3; border-radius: 9px; background: #fff; break-inside: avoid-page; page-break-inside: avoid; }
      .report-card:last-child, .direction-card:last-child { margin-bottom: 0; }
      .eyebrow { color: #4A7A4A; font-size: 13.3pt; font-weight: 700; margin-bottom: 4px; }
      .keywords { color: #64594D; font-size: 15.5pt; }
      .tag { display: inline-block; margin: 0 5px 5px 0; padding: 5px 9px; border-radius: 99px; background: #E8F3EC; border: 1px solid #CAE1D2; color: #376849; font-size: 13.5pt; }
      .note { padding: 12px 14px; background: #FCF8F0; border-left: 3px solid #C4956A; border-radius: 6px; break-inside: avoid-page; page-break-inside: avoid; }
      .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .small-title { color: #6A5843; font-weight: 700; margin-bottom: 4px; }
      .preparation { color: #66557B; font-size: 15pt; margin-bottom: 0; }
      .routine-row { display: grid; grid-template-columns: 23mm 1fr; gap: 8px; padding: 8px 0; border-bottom: 1px solid #E9DDC8; break-inside: avoid; }
      .routine-row:last-child { border-bottom: 0; }
      .routine-label { color: #8B6914; font-weight: 700; }
      .page-break { break-before: page; page-break-before: always; }
      .footer { margin-top: 16px; text-align: center; color: #8B8176; font-size: 11.5pt; }
      .cta { padding: 20px; background: #F2F7F1; border: 1px solid #C7DEC8; border-radius: 12px; break-inside: avoid-page; page-break-inside: avoid; }
      .cta a { color: #287A43; font-weight: 700; text-decoration: none; word-break: break-all; }
      @media print { .page-break { break-before: page; page-break-before: always; } }
    </style>
  </head>
  <body>
    <main>
      <section class="cover">
        <p class="brand">${copy.brand}</p>
        <h1>${copy.coverTitle}</h1>
        <p class="subtitle">${copy.coverSubtitle}</p>
        <div class="color-grid">${selectedColors}</div>
        <p class="meta">${profileLine}<br />${copy.generatedAt} · ${escapeHtml(generatedAt)}</p>
      </section>

      ${input.stage1Interpretation ? section(copy.selectedColours, `<div class="card-stack">${stage1ColorDetails}</div>${stage1Summary}`) : ""}
      ${section(copy.cardInterpretation, `<p class="note">${paragraph(input.stage2Bridge)}</p><div class="card-stack">${cardDetails}</div>`)}
      ${section(copy.complementColours, `<p class="meta">${copy.complementDescription}</p><div class="tag-grid">${input.complementColors.map((color) => `<span class="tag"><b>${escapeHtml(color.name)}</b> · ${escapeHtml(color.meaning)}</span>`).join("")}</div>`, "gold")}
      ${section(copy.colourTendency, `<p>${paragraph(input.colorFlowDescription)}</p>`)}
      ${section(copy.currentFlow, cardFlowParagraphs)}
      ${input.scripture ? section(plainPdfLabel(input.scripture.label), `<p>“${paragraph(input.scripture.text)}”</p><p class="meta">— ${escapeHtml(input.scripture.ref)}</p>`, "gold") : ""}

      ${section(copy.lifeRole, `
        <article class="report-card"><p class="eyebrow">${copy.coreRole}</p><h3>${escapeHtml(input.lifeRoleReport.coreRole.title)}</h3><p>${paragraph(input.lifeRoleReport.coreRole.description)}</p></article>
        <p class="small-title">${copy.roleValue}</p><div class="tag-grid">${tagList(input.lifeRoleReport.humanStrengths)}</div>
        <p class="small-title" style="margin-top:12px">${copy.careerDirection}</p>${directions}
        <div class="two-column"><article class="report-card"><p class="small-title">${copy.workingEnvironment}</p>${input.lifeRoleReport.environments.map((value) => `<p>· ${escapeHtml(value)}</p>`).join("")}</article><article class="report-card"><p class="small-title">${copy.roleShadow}</p>${input.lifeRoleReport.shadows.map((value) => `<p>· ${escapeHtml(value)}</p>`).join("")}</article></div>
        <div class="note" style="margin-top:10px"><b>${copy.smallDirection}</b><br />${paragraph(input.lifeRoleReport.smallDirection)}</div>
      `, "purple", "role-section")}

      ${section(copy.bodyMind, `
        <p class="meta">${copy.energyPerspective} · ${isZh ? "当前主要变化" : "현재 주요 흐름"} ${escapeHtml(input.lifeEnergyResult.currentFiveElements.elements.join(" · "))}</p>
        <article class="report-card"><h3>${escapeHtml(input.lifeEnergyResult.energyFlow.title)}</h3><p>${paragraph(input.lifeEnergyResult.energyFlow.description)}</p><p class="note"><b>${copy.currentNeed}</b><br />${paragraph(input.lifeEnergyResult.energyFlow.recovery)}</p><div class="tag-grid">${tagList(input.lifeEnergyResult.energyFlow.balanceKeywords)}</div></article>
      `)}
      ${section(copy.routine, `
        <p class="meta">${copy.balancingEnergy} · ${escapeHtml(input.lifeEnergyResult.complementaryFiveElements.elements.join(" · "))}${input.lifeEnergyResult.complementaryFiveElements.complementColors?.length ? ` · ${isZh ? "推荐调和色" : "추천 보완컬러"} ${escapeHtml(input.lifeEnergyResult.complementaryFiveElements.complementColors.slice(0, 2).join(" · "))}` : ""}</p>
        <div class="routine-row"><span class="routine-label">${copy.recommendedTea}</span><span>${escapeHtml(input.customRecoveryRoutine.tea ?? "")}</span></div>
        <div class="routine-row"><span class="routine-label">${copy.recommendedFood}</span><span>${escapeHtml(input.customRecoveryRoutine.food)}</span></div>
        <div class="routine-row"><span class="routine-label">${copy.recommendedBreath}</span><span>${escapeHtml(input.customRecoveryRoutine.breath)}</span></div>
        <div class="routine-row"><span class="routine-label">${copy.recommendedMovement}</span><span>${escapeHtml(input.customRecoveryRoutine.movement)}</span></div>
        <div class="routine-row"><span class="routine-label">${copy.smallPractice}</span><span>${escapeHtml(input.customRecoveryRoutine.smallPractice)}</span></div>
        <div class="note" style="margin-top:12px"><b>${copy.recoveryMessage}</b><br />${paragraph(input.customRecoveryRoutine.message)}</div>
      `, "gold")}
      <section class="cta">
        <h2>${copy.coaching}</h2>
        <p>${copy.coachingDescription}</p>
        <p><a href="${coachingUrl}">${coachingUrl}</a></p>
      </section>
      <p class="footer">${copy.disclaimer}</p>
    </main>
  </body>
  </html>`;
  // 모바일/네이티브 인쇄 경로는 서버 PDF와 다른 HTML 경로를 사용한다. 최종 HTML의
  // 고정 제목·동적 해석값을 같은 공통 zh-CN 변환기에 통과시켜 화면/서버 PDF와 언어를 맞춘다.
  return locale === "zh-CN"
    ? localizeStaticCopy(html, locale).replace('<html lang="ko">', '<html lang="zh-CN">')
    : html;
}
