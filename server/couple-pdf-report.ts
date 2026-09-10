import path from "node:path";
import PDFDocument from "pdfkit";
import type { CouplePdfDownloadPayload, CouplePdfShape } from "../shared/couple-pdf-download";

const PAGE_LEFT = 43;
const PAGE_TOP = 43;
const PAGE_BOTTOM = 798;
const CONTENT_WIDTH = 509;
const FONT_PATH = path.join(process.cwd(), "server", "assets", "HusimPdfKorean.ttf");
const BODY_SIZE = 15.5;
const LABEL_SIZE = 12.6;
const BODY_LINE_GAP = 5.8;
const SECTION_BAR_GAP = 10;
const SUBTITLE_SIZE = 16.2;
const SUBTITLE_LABEL_SIZE = 15.1;
const SUBTITLE_LINE_GAP = 2;
const CARD_TITLE_BLOCK_HEIGHT = 46;
const CARD_LABEL_BLOCK_HEIGHT = 29;
const CARD_PARAGRAPH_GAP = 18;

type PdfWriter = InstanceType<typeof PDFDocument>;
type CardParagraph = {
  label?: string;
  text?: string;
  bullets?: string[];
};

function correctPdfText(value: string) {
  return value
    .replaceAll("붙어있는 시간보다", "붙어 있는 시간보다")
    .replaceAll("짧은 포옹이나 손 잡기가", "짧은 포옹이나 손잡기가");
}

function clean(value: string) {
  return correctPdfText(value)
    .replace(/[☒☑✓✔☐□○△▽◇⬠⬡]/g, "")
    .replace(/\n·\s*/g, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function splitCouplePdfCardNarrative(position: string, narrative: string) {
  const source = correctPdfText(narrative);
  if (!position.startsWith("3번 카드")) return { summary: clean(source), actions: [] as string[] };
  const parts = source
    .split(/\n\s*[·•]\s*/)
    .map((part) => clean(part))
    .filter(Boolean);
  return { summary: parts[0] ?? clean(source), actions: parts.slice(1) };
}

function addPage(document: PdfWriter) {
  document.addPage({ size: "A4", margins: { top: PAGE_TOP, bottom: PAGE_TOP, left: PAGE_LEFT, right: PAGE_LEFT } });
}

function ensureSpace(document: PdfWriter, height: number) {
  if (document.y + height > PAGE_BOTTOM) addPage(document);
}

function heightOf(document: PdfWriter, text: string, width = CONTENT_WIDTH, size = BODY_SIZE) {
  document.fontSize(size);
  return document.heightOfString(clean(text) || " ", { width, lineGap: BODY_LINE_GAP });
}

function subtitleHeight(document: PdfWriter, text: string, width: number, size: number) {
  document.fontSize(size);
  return document.heightOfString(clean(text) || " ", { width, lineGap: SUBTITLE_LINE_GAP });
}

/** 얇은 한글 폰트에서도 카드 소제목이 본문과 구분되도록 절제된 stroke로 Semi-bold처럼 표시한다. */
function writeSubtitle(document: PdfWriter, text: string, x: number, y: number, width: number, size: number) {
  document
    .fillColor("#3F3029")
    .strokeColor("#3F3029")
    .lineWidth(0.24)
    .fontSize(size)
    .text(clean(text), x, y, { width, lineGap: SUBTITLE_LINE_GAP, fill: true, stroke: true });
}

function bulletListHeight(document: PdfWriter, bullets: string[], width: number) {
  return bullets.reduce((sum, bullet) => sum + Math.max(20, heightOf(document, bullet, width)) + 7, 0);
}

function writeBulletList(document: PdfWriter, bullets: string[], textX: number, bulletX: number, width: number) {
  bullets.forEach((bullet) => {
    const top = document.y;
    document.fillColor("#8A6B4D").fontSize(BODY_SIZE).text("•", bulletX, top, { width: 14, lineGap: BODY_LINE_GAP });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(bullet), textX, top, { width, lineGap: BODY_LINE_GAP });
    document.moveDown(0.38);
  });
}

function writeSectionTitle(document: PdfWriter, title: string, tone = "#5C7F68", minFollowingHeight = 108) {
  const needsGap = document.y > PAGE_TOP + 2;
  const requiredHeight = (needsGap ? SECTION_BAR_GAP : 0) + 39 + minFollowingHeight;
  if (document.y + requiredHeight > PAGE_BOTTOM) addPage(document);
  else if (needsGap) document.y += SECTION_BAR_GAP;
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, 30, 7).fill().restore();
  document.fillColor("#FFFFFF").fontSize(14).text(clean(title), PAGE_LEFT + 13, top + 8, { width: CONTENT_WIDTH - 26, lineBreak: false });
  document.y = top + 39;
}

function writeCard(document: PdfWriter, title: string, paragraphs: CardParagraph[], tone = "#FCF8F1") {
  const innerWidth = CONTENT_WIDTH - 30;
  const contentHeight = paragraphs.reduce((sum, paragraph) => {
    const labelHeight = paragraph.label ? CARD_LABEL_BLOCK_HEIGHT : 0;
    const textHeight = paragraph.text ? heightOf(document, paragraph.text, innerWidth) : 0;
    const listHeight = paragraph.bullets ? bulletListHeight(document, paragraph.bullets, innerWidth - 22) : 0;
    const textToListGap = paragraph.text && paragraph.bullets?.length ? 5 : 0;
    return sum + labelHeight + textHeight + textToListGap + listHeight + CARD_PARAGRAPH_GAP;
  }, CARD_TITLE_BLOCK_HEIGHT);
  ensureSpace(document, contentHeight + 19);
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, contentHeight + 19, 9).fill().restore();
  writeSubtitle(document, title, PAGE_LEFT + 15, top + 12, innerWidth, SUBTITLE_SIZE);
  document.y = top + CARD_TITLE_BLOCK_HEIGHT;
  paragraphs.forEach((paragraph) => {
    if (paragraph.label) {
      const labelTop = document.y;
      writeSubtitle(document, paragraph.label, PAGE_LEFT + 15, labelTop, innerWidth, SUBTITLE_LABEL_SIZE);
      document.y = labelTop + subtitleHeight(document, paragraph.label, innerWidth, SUBTITLE_LABEL_SIZE) + 7;
    }
    if (paragraph.text) {
      document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(paragraph.text), PAGE_LEFT + 15, document.y, { width: innerWidth, lineGap: BODY_LINE_GAP });
    }
    if (paragraph.bullets?.length) {
      if (paragraph.text) document.moveDown(0.28);
      writeBulletList(document, paragraph.bullets, PAGE_LEFT + 32, PAGE_LEFT + 15, innerWidth - 22);
    }
    document.moveDown(0.78);
  });
  document.y = top + contentHeight + 19;
  document.moveDown(0.7);
}

function writeCardWithActions(document: PdfWriter, title: string, summary: string, actions: string[], tone = "#FCF8F1") {
  const innerWidth = CONTENT_WIDTH - 30;
  const actionWidth = innerWidth - 22;
  const contentHeight = CARD_TITLE_BLOCK_HEIGHT
    + heightOf(document, summary, innerWidth)
    + 8
    + actions.reduce((sum, action) => sum + Math.max(20, heightOf(document, action, actionWidth)) + 6, 0);
  ensureSpace(document, contentHeight + 19);
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, contentHeight + 19, 9).fill().restore();
  writeSubtitle(document, title, PAGE_LEFT + 15, top + 12, innerWidth, SUBTITLE_SIZE);
  document.y = top + CARD_TITLE_BLOCK_HEIGHT;
  document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(summary), PAGE_LEFT + 15, document.y, { width: innerWidth, lineGap: BODY_LINE_GAP });
  document.moveDown(0.36);
  actions.forEach((action) => {
    const actionTop = document.y;
    document.fillColor("#8A6B4D").fontSize(BODY_SIZE).text("•", PAGE_LEFT + 15, actionTop, { width: 14, lineGap: BODY_LINE_GAP });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(action), PAGE_LEFT + 32, actionTop, { width: actionWidth, lineGap: BODY_LINE_GAP });
    document.moveDown(0.34);
  });
  document.y = top + contentHeight + 19;
  document.moveDown(0.7);
}

function drawShape(document: PdfWriter, shape: CouplePdfShape, centerX: number, centerY: number, radius: number, fill: string, stroke: string) {
  document.save().lineWidth(1.4).fillColor(fill).strokeColor(stroke);
  if (shape === "circle") document.circle(centerX, centerY, radius).fillAndStroke();
  else if (shape === "square") document.roundedRect(centerX - radius, centerY - radius, radius * 2, radius * 2, 2).fillAndStroke();
  else {
    const vertices = shape === "triangle"
      ? [[0, -1], [-0.92, 0.8], [0.92, 0.8]]
      : shape === "inverted_triangle"
        ? [[0, 1], [-0.92, -0.8], [0.92, -0.8]]
        : shape === "diamond"
          ? [[0, -1.15], [-0.95, 0], [0, 1.15], [0.95, 0]]
          : Array.from({ length: shape === "pentagon" ? 5 : 6 }, (_, index) => {
              const angle = -Math.PI / 2 + (Math.PI * 2 * index) / (shape === "pentagon" ? 5 : 6);
              return [Math.cos(angle), Math.sin(angle)];
            });
    const points = vertices.map(([x, y]) => [centerX + x * radius, centerY + y * radius] as const);
    document.moveTo(points[0][0], points[0][1]);
    points.slice(1).forEach(([x, y]) => document.lineTo(x, y));
    document.closePath().fillAndStroke();
  }
  document.restore();
}

function writeColorCards(document: PdfWriter, colors: CouplePdfDownloadPayload["personA"]["colors"]) {
  colors.forEach((color) => {
    const height = Math.max(76, heightOf(document, color.interpretation, CONTENT_WIDTH - 92) + 43);
    ensureSpace(document, height + 8);
    const top = document.y;
    document.save().fillColor("#FFFDF9").roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, height, 9).fill().restore();
    document.save().fillColor(color.hex).strokeColor("#CBBEAC").lineWidth(1).circle(PAGE_LEFT + 31, top + 31, 17).fillAndStroke().restore();
    document.fillColor("#4A3A2A").fontSize(12.5).text(clean(`${color.role} · ${color.name}`), PAGE_LEFT + 61, top + 12, { width: CONTENT_WIDTH - 76 });
    document.fillColor("#75695D").fontSize(11.5).text(clean(color.keywords), PAGE_LEFT + 61, top + 31, { width: CONTENT_WIDTH - 76 });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(color.interpretation), PAGE_LEFT + 15, top + 53, { width: CONTENT_WIDTH - 30, lineGap: BODY_LINE_GAP });
    document.y = top + height + 8;
  });
}

function writeCards(document: PdfWriter, cards: CouplePdfDownloadPayload["personA"]["cards"]) {
  cards.forEach((card) => {
    ensureSpace(document, 32);
    const top = document.y;
    document.save().fillColor(card.colorHex).roundedRect(PAGE_LEFT, top, 36, 36, 7).fill().restore();
    drawShape(document, card.shape, PAGE_LEFT + 18, top + 18, 9, "#FFFDF9", "#FFFDF9");
    document.fillColor("#4A3A2A").fontSize(13.5).text(clean(`${card.position} · ${card.colorName} ${card.shapeName}`), PAGE_LEFT + 47, top + 10, { width: CONTENT_WIDTH - 47 });
    document.y = top + 43;
    const narrative = splitCouplePdfCardNarrative(card.position, card.narrative);
    if (narrative.actions.length > 0) {
      writeCardWithActions(document, card.title, narrative.summary, narrative.actions, "#FCF8F1");
    } else {
      writeCard(document, card.title, [{ text: narrative.summary }], "#FCF8F1");
    }
  });
}

function writePerson(document: PdfWriter, person: CouplePdfDownloadPayload["personA"], tone: string, startsOnNewPage = false) {
  if (startsOnNewPage) addPage(document);
  writeSectionTitle(document, `${person.label}의 컬러·심리카드 결과`, tone, 120);
  writeCard(document, "선택한 3컬러", [{ text: "선택한 컬러는 현재의 마음과 관계 안에서 중요하게 느끼는 방향을 함께 보여줍니다." }], "#F7F4EE");
  writeColorCards(document, person.colors);
  writeSectionTitle(document, `${person.label}의 심리카드 해석`, tone, 155);
  writeCards(document, person.cards);
  writeCard(document, "컬러 × 심리카드 통합 분석", person.integratedAnalysis.split(/\n\n+/).filter(Boolean).map((text) => ({ text })), "#F2F7F3");
  writeCard(document, "관계 성향과 회복 방향", [
    { label: "관계 성향", text: person.relationshipStyle },
    { label: "감정 표현", text: person.emotionExpression },
    { label: `보완 컬러 · ${person.complementColor.name}`, text: person.complementColor.meaning },
    { label: "오늘의 코칭", text: person.coachingMessage },
  ], "#F8F4FA");
}

function writeRelationship(document: PdfWriter, payload: CouplePdfDownloadPayload) {
  const relation = payload.relationship;
  addPage(document);
  writeSectionTitle(document, "두 사람의 관계 통합 분석", "#80649B", 120);
  writeCard(document, "왜 끌리는데 왜 힘든지", [{ text: relation.attractionAnalysis }], "#F6F1FA");
  writeCard(document, "두 사람의 관계 속 역할 분석", [
    { label: `첫 번째 사람 · ${relation.roles.personATitle}`, text: relation.roles.personADescription },
    { label: `두 번째 사람 · ${relation.roles.personBTitle}`, text: relation.roles.personBDescription },
    { label: "두 역할이 만났을 때", text: relation.roles.together },
  ], "#F6F1FA");
  writeSectionTitle(document, "관계 핵심", "#5F8069", 120);
  writeCard(document, relation.core.headline, [
    { label: "핵심 키워드", text: relation.core.keywords.join(" · ") },
    { text: relation.core.description },
  ], "#EFF7F0");
  writeSectionTitle(document, "생활 속 관계 패턴", "#8B7259", 120);
  writeCard(document, relation.lifePattern.headline, relation.lifePattern.items.flatMap((item) => [
    { label: item.label, text: `첫 번째 사람: ${item.personA}\n두 번째 사람: ${item.personB}` },
    { label: "둘이 만났을 때 · 조율 포인트", text: item.tension },
  ]), "#FBF6EF");
  writeSectionTitle(document, "싸움 패턴", "#B16A75", 150);
  writeCard(document, "이 관계의 갈등 흐름", [
    { label: "싸움이 시작되는 순간", text: relation.conflict.trigger },
    { label: "갈등 직후 반응", text: relation.conflict.reaction },
    { label: "반복 위험 패턴", text: relation.conflict.danger },
    { label: "싸울 때 조심할 말", text: relation.conflict.forbiddenWords.join("\n") },
  ], "#FFF3F3");
  writeSectionTitle(document, "연결 방식", "#B87B91", 130);
  writeCard(document, relation.connection.headline, [
    { text: relation.connection.description },
    { label: "함께 해볼 연결", text: relation.connection.actions.join("\n") },
    { label: "스킨십 · 친밀감", text: relation.connection.intimacyNote },
  ], "#FFF4F7");
  writeSectionTitle(document, "관계 성장 포인트", "#4F8B70", 140);
  writeCard(document, "이 관계가 오래가는 이유와 성장 방향", [
    { label: "이 관계의 강점", text: relation.growth.strength },
    { label: "조금 더 의식하면", text: relation.growth.blindSpot },
    { label: "함께 성장해야 할 방향", text: relation.growth.direction },
    { label: "오늘 해볼 수 있는 것", text: relation.growth.tip },
  ], "#F0F8F2");
  writeSectionTitle(document, "추천 컬러와 함께하는 회복 루틴", "#94723D", 130);
  writeCard(document, "두 사람에게 권하는 컬러", relation.recommendedColors.map((color) => ({ label: color.name, text: color.reason })), "#FCF8EF");
  writeCard(document, "함께하면 좋은 회복 루틴", [
    { label: "이번 주 함께 해볼 것", bullets: relation.togetherRoutine.routines },
    { label: "함께하면 살아나는 에너지", text: relation.togetherRoutine.energyNote },
    ...(relation.togetherRoutine.faithRoutine ? [{ label: "함께 나누는 루틴", text: relation.togetherRoutine.faithRoutine }] : []),
  ], "#F0F6F1");
  writeCard(document, "건강한 관계를 위한 기본 원칙", [{ text: relation.basicPrinciples }], "#EEF4F0");
  writeCard(document, "마무리 코칭 메시지", [{ text: relation.closingMessage }], "#F4F0EA");
}

export function validateCouplePdfPayload(value: unknown): CouplePdfDownloadPayload {
  if (!value || typeof value !== "object") throw new Error("커플 PDF 리포트 데이터가 없습니다.");
  const payload = value as CouplePdfDownloadPayload;
  if ((payload.relationType !== "부부" && payload.relationType !== "연인") || !payload.personA || !payload.personB || !payload.relationship) {
    throw new Error("부부·연인 PDF 리포트 데이터 형식이 올바르지 않습니다.");
  }
  if (payload.personA.colors.length !== 3 || payload.personB.colors.length !== 3 || payload.personA.cards.length !== 3 || payload.personB.cards.length !== 3) {
    throw new Error("부부·연인 PDF 리포트에는 각 사람의 컬러와 심리카드 3장이 필요합니다.");
  }
  if (JSON.stringify(payload).length > 220_000) throw new Error("커플 PDF 리포트 데이터가 너무 큽니다.");
  return payload;
}

/** 현재 웹 결과의 최종 데이터를 읽기 편한 A4 리포트로 재배치한다. */
export async function createCouplePdfBuffer(payload: CouplePdfDownloadPayload): Promise<Buffer> {
  const document = new PDFDocument({
    size: "A4",
    margins: { top: PAGE_TOP, bottom: PAGE_TOP, left: PAGE_LEFT, right: PAGE_LEFT },
    font: FONT_PATH,
    info: { Title: "휴심컬러 부부·연인 관계 리포트" },
  });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.registerFont("NotoSansKR", FONT_PATH);
  document.font("NotoSansKR");

  document.rect(0, 0, 595, 842).fill("#F8F4EE");
  document.fillColor("#5F8069").fontSize(12).text("HUSIM COLOR · COUPLE RELATIONSHIP REPORT", PAGE_LEFT, 160, { width: CONTENT_WIDTH });
  document.fillColor("#3D3530").fontSize(25).text(`${payload.relationType} 관계 리포트`, PAGE_LEFT, 198, { width: CONTENT_WIDTH });
  document.fillColor("#685C51").fontSize(12).text("두 사람의 컬러와 심리카드 흐름으로 읽는 관계의 연결과 회복", PAGE_LEFT, 240, { width: CONTENT_WIDTH });
  document.fillColor("#80649B").fontSize(16).text(clean(payload.couple.typeName), PAGE_LEFT, 316, { width: CONTENT_WIDTH });
  document.fillColor("#4A3A2A").fontSize(16).text(clean(payload.couple.coreSummary), PAGE_LEFT, 348, { width: CONTENT_WIDTH, lineGap: 6 });
  document.fillColor("#75695D").fontSize(13).text(clean(payload.couple.tensionDescription), PAGE_LEFT, 408, { width: CONTENT_WIDTH, lineGap: 5 });
  document.fillColor("#75695D").fontSize(11).text(`리포트 생성일 · ${payload.generatedAt}`, PAGE_LEFT, 740, { width: CONTENT_WIDTH });

  addPage(document);
  writePerson(document, payload.personA, "#A86773");
  writePerson(document, payload.personB, "#5677A5", true);
  writeRelationship(document, payload);
  document.end();
  return finished;
}
