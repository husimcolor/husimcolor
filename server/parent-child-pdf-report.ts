import path from "node:path";
import { existsSync } from "node:fs";
import PDFDocument from "pdfkit";
import type { CouplePdfPerson, CouplePdfShape } from "../shared/couple-pdf-download";
import type { ParentChildPdfDownloadPayload } from "../shared/parent-child-pdf-download";

const PAGE_LEFT = 43;
const PAGE_TOP = 43;
const PAGE_BOTTOM = 798;
const CONTENT_WIDTH = 509;
const BUNDLED_FONT_PATH = path.join(__dirname, "HusimPdfKorean.ttf");
const FONT_PATH = existsSync(BUNDLED_FONT_PATH)
  ? BUNDLED_FONT_PATH
  : path.join(process.cwd(), "server", "assets", "HusimPdfKorean.ttf");
const BODY_SIZE = 15.2;
const BODY_LINE_GAP = 5.5;
const SECTION_BAR_GAP = 10;
const SUBTITLE_SIZE = 18.4;
const SUBTITLE_LABEL_SIZE = 16.6;
const CARD_TITLE_BLOCK_HEIGHT = 57;
const CARD_LABEL_BLOCK_HEIGHT = 38;
const CARD_PARAGRAPH_GAP = 20;

type PdfWriter = InstanceType<typeof PDFDocument>;
type CardParagraph = { label?: string; text?: string; bullets?: string[] };

function clean(value: string) {
  return value
    .replace(/[☒☑✓✔☐□○△▽◇⬠⬡]/g, "")
    .replace(/\n·\s*/g, "\n")
    .replace(/\s{2,}/g, " ")
    .trim();
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
  return document.heightOfString(clean(text) || " ", { width, lineGap: 3 });
}

function writeSubtitle(document: PdfWriter, text: string, x: number, y: number, width: number, size: number) {
  document
    .fillColor("#2F2019")
    .strokeColor("#2F2019")
    .lineWidth(0.45)
    .fontSize(size)
    .text(clean(text), x, y, { width, lineGap: 3, fill: true, stroke: true });
}

function bulletListHeight(document: PdfWriter, bullets: string[], width: number) {
  return bullets.reduce((sum, bullet) => sum + Math.max(20, heightOf(document, bullet, width)) + 7, 0);
}

function writeBulletList(document: PdfWriter, bullets: string[], textX: number, bulletX: number, width: number) {
  bullets.forEach((bullet) => {
    const top = document.y;
    document.fillColor("#8A6B4D").fontSize(BODY_SIZE).text("•", bulletX, top, { width: 14, lineGap: BODY_LINE_GAP });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(bullet), textX, top, { width, lineGap: BODY_LINE_GAP });
    document.moveDown(0.34);
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
      document.y = labelTop + subtitleHeight(document, paragraph.label, innerWidth, SUBTITLE_LABEL_SIZE) + 12;
    }
    if (paragraph.text) {
      document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(paragraph.text), PAGE_LEFT + 15, document.y, { width: innerWidth, lineGap: BODY_LINE_GAP });
    }
    if (paragraph.bullets?.length) {
      if (paragraph.text) document.moveDown(0.25);
      writeBulletList(document, paragraph.bullets, PAGE_LEFT + 32, PAGE_LEFT + 15, innerWidth - 22);
    }
    document.moveDown(0.86);
  });
  document.y = top + contentHeight + 19;
  document.moveDown(0.65);
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

function writeColorCards(document: PdfWriter, colors: CouplePdfPerson["colors"]) {
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

function writeCards(document: PdfWriter, cards: CouplePdfPerson["cards"]) {
  cards.forEach((card) => {
    ensureSpace(document, 32);
    const top = document.y;
    document.save().fillColor(card.colorHex).roundedRect(PAGE_LEFT, top, 36, 36, 7).fill().restore();
    drawShape(document, card.shape, PAGE_LEFT + 18, top + 18, 9, "#FFFDF9", "#FFFDF9");
    document.fillColor("#4A3A2A").fontSize(13.5).text(clean(`${card.position} · ${card.colorName} ${card.shapeName}`), PAGE_LEFT + 47, top + 10, { width: CONTENT_WIDTH - 47 });
    document.y = top + 43;
    writeCard(document, card.title, [{ text: card.narrative }], "#FCF8F1");
  });
}

function writePerson(document: PdfWriter, person: CouplePdfPerson, tone: string) {
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

function writeRelationship(document: PdfWriter, payload: ParentChildPdfDownloadPayload) {
  const relation = payload.relationship;
  addPage(document);
  writeSectionTitle(document, "두 사람의 종합 관계 분석", "#80649B", 120);
  writeCard(document, "두 사람의 컬러 및 심리카드 흐름 요약", [
    { text: relation.coreSummary },
    { text: relation.description },
    { label: "두 사람의 현재 심리 흐름", text: relation.cardFlowSummary },
  ], "#F6F1FA");
  writeCard(document, "관계 유형", [{ label: relation.typeName, text: relation.coreSummary }], "#EFF7F0");
  writeSectionTitle(document, "부모와 자녀로 만나는 두 역할", "#5F8069", 150);
  writeCard(document, "각자의 사회적 역할", [
    { label: `${relation.labels.parent}의 사회적 역할 · ${relation.socialRoles.parent.title}`, text: relation.socialRoles.parent.description },
    { label: `${relation.labels.child}의 사회적 역할 · ${relation.socialRoles.child.title}`, text: relation.socialRoles.child.description },
  ], "#F2F7F3");
  writeCard(document, "우리 관계의 역할 에너지", [
    { label: `${relation.labels.parent} · ${relation.relationshipRoles.parent.title}`, text: relation.relationshipRoles.parent.description },
    { label: `${relation.labels.child} · ${relation.relationshipRoles.child.title}`, text: relation.relationshipRoles.child.description },
    { label: "두 역할이 만났을 때", text: relation.relationshipRoles.together },
  ], "#F2F7F3");
  writeSectionTitle(document, "자녀 기질 맞춤 소통", "#B16A75", 150);
  writeCard(document, `${relation.labels.child}의 마음을 이해하는 방법`, [
    { label: "마음이 닫히기 쉬운 순간", text: relation.childCommunication.closesWhen },
    { label: "자신감을 얻는 순간", text: relation.childCommunication.gainsConfidenceWhen },
  ], "#FFF3F3");
  if (relation.lifeScenes.strengths.length || relation.lifeScenes.tensions.length) {
    writeSectionTitle(document, "잘 맞는 부분과 부딪히는 부분", "#8B7259", 130);
    if (relation.lifeScenes.strengths.length) {
      writeCard(document, "잘 맞는 부분", relation.lifeScenes.strengths.map((scene) => ({ label: scene.title, text: scene.description })), "#FBF6EF");
    }
    if (relation.lifeScenes.tensions.length) {
      writeCard(document, "부딪히는 부분", relation.lifeScenes.tensions.map((scene) => ({ label: scene.title, text: scene.description })), "#FFF3F3");
    }
  }
  writeSectionTitle(document, "부모의 대화 DO & DON'T", "#A86773", 145);
  writeCard(document, `${relation.labels.child}에게 힘이 되는 말 · DO`, [{ bullets: relation.dialogue.doMessages }], "#FFF4F7");
  writeCard(document, `${relation.labels.child}이 부담을 느끼는 말 · DON'T`, [{ bullets: relation.dialogue.dontMessages }], "#FFF3F3");
  writeSectionTitle(document, "갈등이 생기는 이유와 다시 연결되는 순서", "#B87B91", 155);
  writeCard(document, "갈등이 시작되는 지점", [
    { label: "갈등이 시작되는 지점", text: relation.conflictRecovery.conflictStart },
    { label: `${relation.labels.parent}의 의도`, text: relation.conflictRecovery.parentIntent },
    { label: `${relation.labels.child}이 받아들이는 방식`, text: relation.conflictRecovery.childReception },
  ], "#FFF3F3");
  writeCard(document, "관계가 어긋나는 지점", [{ text: relation.conflictRecovery.mismatch }], "#FFF3F3");
  writeCard(document, "회복에 필요한 순서", [{ text: relation.conflictRecovery.recoveryOrder }], "#F0F6F1");
  writeSectionTitle(document, "추천 컬러와 우리 관계를 위한 3가지 실천", "#94723D", 130);
  writeCard(document, "두 사람에게 권하는 컬러", relation.recommendedColors.map((color) => ({ label: color.name, text: color.reason })), "#FCF8EF");
  writeCard(document, "우리 관계를 위한 3가지 실천", [{ bullets: relation.practices }], "#F0F6F1");
  writeCard(document, "마무리 코칭 메시지", [{ text: relation.closingMessage }], "#F4F0EA");
}

export function validateParentChildPdfPayload(value: unknown): ParentChildPdfDownloadPayload {
  if (!value || typeof value !== "object") throw new Error("부모·자녀 PDF 리포트 데이터가 없습니다.");
  const payload = value as ParentChildPdfDownloadPayload;
  const isParentChild = ["아빠-아들", "아빠-딸", "엄마-아들", "엄마-딸", "부모-자녀"].includes(payload.relationType);
  if (!isParentChild || !payload.personA || !payload.personB || !payload.relationship) {
    throw new Error("부모·자녀 PDF 리포트 데이터 형식이 올바르지 않습니다.");
  }
  if (payload.personA.colors.length !== 3 || payload.personB.colors.length !== 3 || payload.personA.cards.length !== 3 || payload.personB.cards.length !== 3) {
    throw new Error("부모·자녀 PDF 리포트에는 각 사람의 컬러와 심리카드 3장이 필요합니다.");
  }
  if (JSON.stringify(payload).length > 220_000) throw new Error("부모·자녀 PDF 리포트 데이터가 너무 큽니다.");
  return payload;
}

/** 현재 웹 결과의 부모·자녀 종합 분석과 각 개인 분석을 새 해석 없이 A4 리포트 순서로 재배치한다. */
export async function createParentChildPdfBuffer(payload: ParentChildPdfDownloadPayload): Promise<Buffer> {
  const document = new PDFDocument({
    size: "A4",
    margins: { top: PAGE_TOP, bottom: PAGE_TOP, left: PAGE_LEFT, right: PAGE_LEFT },
    font: FONT_PATH,
    info: { Title: "휴심컬러 부모·자녀 감성 심리코칭 리포트" },
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
  document.fillColor("#5F8069").fontSize(12).text("HUSIM COLOR · PARENT & CHILD RELATIONSHIP REPORT", PAGE_LEFT, 160, { width: CONTENT_WIDTH });
  document.fillColor("#3D3530").fontSize(25).text("휴심컬러 부모·자녀\n감성 심리코칭 리포트", PAGE_LEFT, 198, { width: CONTENT_WIDTH, lineGap: 7 });
  document.fillColor("#80649B").fontSize(17).text(`${payload.relationship.labels.parent}–${payload.relationship.labels.child}`, PAGE_LEFT, 302, { width: CONTENT_WIDTH });
  document.fillColor("#4A3A2A").fontSize(17).text(clean(payload.relationship.typeName), PAGE_LEFT, 338, { width: CONTENT_WIDTH });
  document.fillColor("#685C51").fontSize(12.5).text(clean(payload.relationship.coreSummary), PAGE_LEFT, 376, { width: CONTENT_WIDTH, lineGap: 6 });
  document.fillColor("#75695D").fontSize(11).text(`리포트 생성일 · ${payload.generatedAt}`, PAGE_LEFT, 740, { width: CONTENT_WIDTH });

  writeRelationship(document, payload);
  addPage(document);
  writePerson(document, payload.personA, "#A86773");
  addPage(document);
  writePerson(document, payload.personB, "#5677A5");
  document.end();
  return finished;
}
