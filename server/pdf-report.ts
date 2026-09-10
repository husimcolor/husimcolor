import { createReadStream } from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { PremiumPdfDownloadPayload } from "../shared/premium-pdf-download";

const PAGE_BOTTOM = 799;
const PAGE_LEFT = 43;
const CONTENT_WIDTH = 509;
const FONT_PATH = path.join(process.cwd(), "server", "assets", "HusimPdfKorean.ttf");
const BODY_TEXT_SIZE = 18.5;
const BODY_LABEL_SIZE = 16;
const CARD_TITLE_SIZE = 13.5;
const DETAIL_TEXT_SIZE = 15.4;
const PILL_TEXT_SIZE = 13.5;
const BODY_LINE_GAP = 7.5;
const PILL_HEIGHT = 28;
const PILL_ROW_HEIGHT = 35;

type PdfWriter = InstanceType<typeof PDFDocument>;
type PdfShape = PremiumPdfDownloadPayload["cards"][number]["shape"];

function normalizePdfText(value: string) {
  return value
    .replaceAll("낙살 시간 에 10분 햇빛 속에 앜아있기", "낮 시간에 10분 햇빛 속에 앉아 있기")
    .replaceAll("낙실 시간 에 10분 햇빛 속에 앉아있기", "낮 시간에 10분 햇빛 속에 앉아 있기")
    .replaceAll("낙실 시간 에 10분 햇빛 속에 앉아 있기", "낮 시간에 10분 햇빛 속에 앉아 있기")
    .replace(/[☒☑✓✔☐□○△▽◇⬠⬡]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function addPage(document: PdfWriter) {
  document.addPage({ size: "A4", margins: { top: 43, bottom: 43, left: PAGE_LEFT, right: PAGE_LEFT } });
}

function ensureSpace(document: PdfWriter, height: number) {
  if (document.y + height > PAGE_BOTTOM) addPage(document);
}

function textHeight(document: PdfWriter, value: string, width = CONTENT_WIDTH, size = BODY_TEXT_SIZE, lineGap = BODY_LINE_GAP) {
  document.fontSize(size);
  return document.heightOfString(normalizePdfText(value) || " ", { width, lineGap });
}

function writeParagraph(document: PdfWriter, value: string, options: { width?: number; size?: number; color?: string; lineGap?: number } = {}) {
  const safeValue = normalizePdfText(value);
  const width = options.width ?? CONTENT_WIDTH;
  const size = options.size ?? BODY_TEXT_SIZE;
  const lineGap = options.lineGap ?? BODY_LINE_GAP;
  const height = textHeight(document, safeValue, width, size, lineGap);
  ensureSpace(document, height + 3);
  document.fillColor(options.color ?? "#302B27").fontSize(size).text(safeValue, { width, lineGap });
  return height;
}

function writeSectionTitle(document: PdfWriter, title: string, tone = "#2D6A4F") {
  const safeTitle = normalizePdfText(title).replace(/^[^가-힣A-Za-z0-9]+/, "");
  ensureSpace(document, 44);
  const top = document.y;
  document.fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, 31, 7).fill();
  document.fillColor("#FFFFFF").fontSize(14).text(safeTitle, PAGE_LEFT + 13, top + 8, { width: CONTENT_WIDTH - 26, lineBreak: false });
  document.y = top + 31;
  document.moveDown(0.7);
}

function writeCard(document: PdfWriter, title: string, paragraphs: Array<{ label?: string; text: string }>, tone = "#F4FAF6") {
  const innerWidth = CONTENT_WIDTH - 28;
  const contentHeight = paragraphs.reduce((sum, paragraph) => {
    const label = paragraph.label ? 24 : 0;
    return sum + label + textHeight(document, normalizePdfText(paragraph.text), innerWidth, BODY_TEXT_SIZE, BODY_LINE_GAP) + 12;
  }, 33);
  ensureSpace(document, contentHeight + 16);
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, contentHeight + 16, 9).fill().restore();
  document.fillColor("#4A3A2A").fontSize(CARD_TITLE_SIZE).text(normalizePdfText(title), PAGE_LEFT + 14, top + 12, { width: innerWidth });
  document.y = top + 34;
  for (const paragraph of paragraphs) {
    if (paragraph.label) {
      document.fillColor("#6A5843").fontSize(BODY_LABEL_SIZE).text(normalizePdfText(paragraph.label), PAGE_LEFT + 14, document.y, { width: innerWidth });
      document.moveDown(0.22);
    }
    document.fillColor("#302B27").fontSize(BODY_TEXT_SIZE).text(normalizePdfText(paragraph.text), PAGE_LEFT + 14, document.y, { width: innerWidth, lineGap: BODY_LINE_GAP });
    document.moveDown(0.76);
  }
  document.y = top + contentHeight + 16;
  document.moveDown(0.7);
}

function writePills(document: PdfWriter, values: string[]) {
  const available = CONTENT_WIDTH;
  let x = PAGE_LEFT;
  let y = document.y;
  for (const value of values) {
    const safeValue = normalizePdfText(value);
    document.fontSize(PILL_TEXT_SIZE);
    const width = Math.min(document.widthOfString(safeValue) + 18, available);
    if (x + width > PAGE_LEFT + available) {
      x = PAGE_LEFT;
      y += PILL_ROW_HEIGHT;
    }
    if (y + PILL_HEIGHT > PAGE_BOTTOM) {
      addPage(document);
      x = PAGE_LEFT;
      y = document.y;
    }
    document.save().fillColor("#E8F3EC").roundedRect(x, y, width, PILL_HEIGHT, 14).fill().restore();
    document.fillColor("#376849").fontSize(PILL_TEXT_SIZE).text(safeValue, x + 9, y + 6, { width: width - 18, lineBreak: false });
    x += width + 6;
  }
  document.y = y + PILL_ROW_HEIGHT;
}

function writeBullets(document: PdfWriter, values: string[]) {
  values.forEach((value) => {
    const safeValue = normalizePdfText(value);
    const height = textHeight(document, safeValue, CONTENT_WIDTH - 20, BODY_TEXT_SIZE, BODY_LINE_GAP);
    ensureSpace(document, height + 5);
    const top = document.y;
    document.save().fillColor("#8B6914").circle(PAGE_LEFT + 4, top + 7, 2.2).fill().restore();
    document.fillColor("#302B27").fontSize(BODY_TEXT_SIZE).text(safeValue, PAGE_LEFT + 14, top, { width: CONTENT_WIDTH - 20, lineGap: BODY_LINE_GAP });
    document.moveDown(0.35);
  });
}

function drawShape(document: PdfWriter, shape: PdfShape, centerX: number, centerY: number, radius: number, fill: string, stroke: string) {
  document.save().lineWidth(1.7).fillColor(fill).strokeColor(stroke);
  if (shape === "circle") {
    document.circle(centerX, centerY, radius).fillAndStroke();
  } else if (shape === "square") {
    document.roundedRect(centerX - radius, centerY - radius, radius * 2, radius * 2, 2).fillAndStroke();
  } else {
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

function writeCoverColorChip(document: PdfWriter, color: PremiumPdfDownloadPayload["selectedColors"][number]) {
  const top = document.y;
  const height = 62;
  document.save().fillColor("#FFFDF9").roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, height, 9).fill().restore();
  document.save().lineWidth(1).fillColor(color.hex).strokeColor("#CBBEAC").circle(PAGE_LEFT + 30, top + 31, 16).fillAndStroke().restore();
  document.fillColor("#4A3A2A").fontSize(14).text(normalizePdfText(color.name), PAGE_LEFT + 58, top + 11, { width: CONTENT_WIDTH - 72 });
  document.fillColor("#75695D").fontSize(14).text(normalizePdfText(color.keywords), PAGE_LEFT + 58, top + 34, { width: CONTENT_WIDTH - 72 });
  document.y = top + height + 7;
}

function writeCardPreviewRow(document: PdfWriter, cards: PremiumPdfDownloadPayload["cards"]) {
  const gap = 9;
  const cardWidth = (CONTENT_WIDTH - gap * 2) / 3;
  const cardHeight = 94;
  ensureSpace(document, cardHeight + 10);
  const top = document.y;
  cards.forEach((card, index) => {
    const x = PAGE_LEFT + index * (cardWidth + gap);
    const isLightCard = card.colorHex.toUpperCase() === "#F5F5F0" || card.colorHex.toUpperCase() === "#FDD835";
    document.save().fillColor(card.colorHex).strokeColor("#D9D1C8").lineWidth(0.8).roundedRect(x, top, cardWidth, 57, 8).fillAndStroke().restore();
    drawShape(document, card.shape, x + cardWidth / 2, top + 28, 14, isLightCard ? "#FFFDF9" : "#FFFFFF", isLightCard ? "#4A3A2A" : "#FFFFFF");
    document.fillColor("#4A3A2A").fontSize(8.7).text(`${index + 1}번 카드`, x, top + 65, { width: cardWidth, align: "center", lineBreak: false });
    document.fillColor("#75695D").fontSize(8.2).text(`${normalizePdfText(card.colorName)} ${normalizePdfText(card.shapeName)}`, x, top + 78, { width: cardWidth, align: "center", lineBreak: false });
  });
  document.y = top + cardHeight + 5;
}

export function validatePremiumPdfPayload(value: unknown): PremiumPdfDownloadPayload {
  if (!value || typeof value !== "object") throw new Error("PDF 리포트 데이터가 없습니다.");
  const payload = value as PremiumPdfDownloadPayload;
  if (!Array.isArray(payload.cards) || payload.cards.length !== 3 || !Array.isArray(payload.selectedColors)) {
    throw new Error("PDF 리포트 데이터 형식이 올바르지 않습니다.");
  }
  if (JSON.stringify(payload).length > 180_000) throw new Error("PDF 리포트 데이터가 너무 큽니다.");
  return payload;
}

/** 현재 화면에서 완성된 데이터만 문서 레이아웃으로 옮겨 PDF Buffer를 만든다. */
export async function createPremiumPdfBuffer(payload: PremiumPdfDownloadPayload): Promise<Buffer> {
  const document = new PDFDocument({
    size: "A4",
    margins: { top: 43, bottom: 43, left: PAGE_LEFT, right: PAGE_LEFT },
    font: FONT_PATH,
    info: { Title: "휴심컬러 나의 컬러 심리 해석" },
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
  document.fillColor("#4C7A58").fontSize(12).text("HUSIM COLOR · PERSONAL DEEP REPORT", PAGE_LEFT, 168, { width: CONTENT_WIDTH });
  document.fillColor("#3D3530").fontSize(25).text("나의 컬러 심리 리포트", PAGE_LEFT, 204, { width: CONTENT_WIDTH });
  document.fillColor("#685C51").fontSize(12).text("색과 도형으로 살펴본 현재의 마음, 삶의 역할, 회복 리듬", PAGE_LEFT, 247, { width: CONTENT_WIDTH });
  document.y = 315;
  payload.selectedColors.slice(0, 3).forEach((color) => writeCoverColorChip(document, color));
  document.fillColor("#75695D").fontSize(12).text(`${payload.profileLine}\n리포트 생성일 · ${payload.generatedAt}`, PAGE_LEFT, 736, { width: CONTENT_WIDTH, lineGap: 5 });

  addPage(document);
  writeSectionTitle(document, "3장의 심리카드 해석");
  writeCard(document, "카드 흐름", [{ text: payload.stage2Bridge }], "#FCF8F0");
  writeCardPreviewRow(document, payload.cards);
  payload.cards.forEach((card) => writeCard(document, `${card.position} · ${card.colorName} ${card.shapeName}`, [
    { label: "컬러", text: card.colorKeywords },
    { label: "도형", text: card.shapeKeywords },
    { label: card.roleLabel, text: card.narrative },
  ]));
  writeSectionTitle(document, "지금 나에게 필요한 컬러", "#8B6914");
  writePills(document, payload.complementColors.map((color) => `${color.name} · ${color.meaning}`));
  writeSectionTitle(document, "나의 컬러 성향");
  writeParagraph(document, payload.colorFlowDescription);
  document.moveDown(1);
  writeSectionTitle(document, "지금 마음의 흐름");
  writeParagraph(document, payload.combinedCoaching);
  document.moveDown(1);
  if (payload.scripture) {
    writeSectionTitle(document, payload.scripture.label, "#8B6914");
    writeCard(document, "오늘의 문장", [{ text: `“${payload.scripture.text}”` }, { text: payload.scripture.ref }], "#FFF9EF");
  }

  writeSectionTitle(document, "나의 삶의 역할 에너지", "#66557B");
  writeCard(document, payload.lifeRole.title, [{ text: payload.lifeRole.description }], "#F8F5FF");
  document.fillColor("#6A5843").fontSize(BODY_LABEL_SIZE).text("이 역할이 더하는 가치", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.4);
  writePills(document, payload.lifeRole.humanStrengths);
  document.moveDown(0.6);
  document.fillColor("#6A5843").fontSize(BODY_LABEL_SIZE).text("사회적 쓰임새 · 진로 방향", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.4);
  payload.lifeRole.directions.forEach((direction) => writeCard(document, direction.title, [
    { text: direction.description },
    { label: "준비 방향", text: direction.preparation },
  ], "#F8F5FF"));
  document.fillColor("#6A5843").fontSize(BODY_LABEL_SIZE).text("잘 맞는 일의 환경", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.35);
  writeBullets(document, payload.lifeRole.environments);
  document.moveDown(0.5);
  document.fillColor("#6A5843").fontSize(BODY_LABEL_SIZE).text("역할 에너지의 그림자", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.35);
  writeBullets(document, payload.lifeRole.shadows);
  writeCard(document, "지금의 작은 방향", [{ text: payload.lifeRole.smallDirection }], "#FCF8F0");

  writeSectionTitle(document, "지금 몸과 마음의 흐름");
  writeParagraph(document, `에너지 관점 · 현재 주요 흐름 ${payload.energyFlow.currentElements.join(" · ")}`, { size: DETAIL_TEXT_SIZE, color: "#75695D" });
  document.moveDown(0.45);
  writeCard(document, payload.energyFlow.title, [
    { text: payload.energyFlow.description },
    { label: "지금 필요한 것", text: payload.energyFlow.recovery },
  ]);
  writePills(document, payload.energyFlow.balanceKeywords);
  document.moveDown(0.6);
  writeSectionTitle(document, "오늘의 맞춤 회복 루틴", "#8B6914");
  writeParagraph(document, `보완 에너지 · ${payload.energyFlow.complementaryElements.join(" · ")}${payload.energyFlow.complementColors.length ? ` · 보완 컬러 ${payload.energyFlow.complementColors.join(" · ")}` : ""}`, { size: DETAIL_TEXT_SIZE, color: "#75695D" });
  document.moveDown(0.45);
  [
    ["추천 차", payload.recoveryRoutine.tea],
    ["추천 음식", payload.recoveryRoutine.food],
    ["추천 호흡", payload.recoveryRoutine.breath],
    ["추천 움직임", payload.recoveryRoutine.movement],
    ["오늘의 작은 실천", payload.recoveryRoutine.smallPractice],
    ["오늘의 회복 메시지", payload.recoveryRoutine.message],
  ].forEach(([label, text]) => writeCard(document, label, [{ text }], "#FFF9EF"));
  ensureSpace(document, 220);
  writeSectionTitle(document, "휴심컬러 1:1 컬러코칭");
  writeCard(document, "더 깊은 나눔이 필요할 때", [
    { text: "지금의 마음 흐름과 나에게 맞는 회복의 방향을 더 깊이 나누고 싶다면, 1:1 컬러코칭으로 이어갈 수 있습니다." },
    { text: payload.coachingUrl },
  ], "#F2F7F1");
  writeParagraph(document, "본 리포트는 현재 선택 결과를 바탕으로 한 자기이해·생활 웰니스 참고 자료이며, 의료적 진단이나 치료를 대신하지 않습니다.", { size: 11.5, color: "#8B8176", lineGap: 5.5 });

  document.end();
  return finished;
}
