import { existsSync } from "node:fs";
import path from "node:path";

import { PDFDocument } from "./pdfkit-runtime";
import { ZH_CN_PERSONAL_PILOT_REPORT, ZH_CN_PILOT_DISCLAIMER, type ZhCnPilotCardShape } from "../shared/zh-cn-personal-pilot";

const PAGE_LEFT = 43;
const PAGE_BOTTOM = 799;
const CONTENT_WIDTH = 509;
const FONT_NAME = "NotoSansCJKsc";
const FONT_CANDIDATES = [
  path.join(__dirname, "NotoSansCJKsc-Regular.otf"),
  path.join(process.cwd(), "server", "assets", "NotoSansCJKsc-Regular.otf"),
];
const FONT_PATH = FONT_CANDIDATES.find(existsSync);

type PdfWriter = InstanceType<typeof PDFDocument>;

function addPage(document: PdfWriter) {
  document.addPage({ size: "A4", margins: { top: 43, bottom: 43, left: PAGE_LEFT, right: PAGE_LEFT } });
}

function safeText(value: string) {
  return value.replace(/\s{2,}/g, " ").trim();
}

function textHeight(document: PdfWriter, value: string, width = CONTENT_WIDTH, size = 13.2, lineGap = 5.7) {
  document.font(FONT_NAME).fontSize(size);
  return document.heightOfString(safeText(value) || " ", { width, lineGap });
}

function ensureSpace(document: PdfWriter, height: number) {
  if (document.y + height > PAGE_BOTTOM) addPage(document);
}

function paragraph(document: PdfWriter, value: string, options: { size?: number; color?: string; width?: number; lineGap?: number } = {}) {
  const width = options.width ?? CONTENT_WIDTH;
  const size = options.size ?? 13.2;
  const lineGap = options.lineGap ?? 5.7;
  const height = textHeight(document, value, width, size, lineGap);
  ensureSpace(document, height + 4);
  document.font(FONT_NAME).fillColor(options.color ?? "#302B27").fontSize(size).text(safeText(value), { width, lineGap });
  return height;
}

function sectionTitle(document: PdfWriter, title: string, tone = "#2D6A4F", followingHeight = 0) {
  ensureSpace(document, 43 + followingHeight);
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, 30, 7).fill().restore();
  document.font(FONT_NAME).fillColor("#FFFFFF").fontSize(13.2).text(title, PAGE_LEFT + 13, top + 8, { width: CONTENT_WIDTH - 26, lineBreak: false });
  document.y = top + 31;
  document.moveDown(0.62);
}

function cardHeight(document: PdfWriter, blocks: Array<{ label?: string; text: string }>) {
  const innerWidth = CONTENT_WIDTH - 28;
  return blocks.reduce((total, block) => total + (block.label ? 22 : 0) + textHeight(document, block.text, innerWidth) + 11, 42) + 16;
}

function card(document: PdfWriter, title: string, blocks: Array<{ label?: string; text: string }>, tone = "#F6F2EA") {
  const height = cardHeight(document, blocks);
  ensureSpace(document, height);
  const innerWidth = CONTENT_WIDTH - 28;
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, height, 9).fill().restore();
  document.font(FONT_NAME).fillColor("#4A3A2A").fontSize(12.6).text(title, PAGE_LEFT + 14, top + 12, { width: innerWidth });
  document.y = top + 35;
  for (const block of blocks) {
    if (block.label) {
      document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.4).text(block.label, PAGE_LEFT + 14, document.y, { width: innerWidth });
      document.moveDown(0.18);
    }
    document.font(FONT_NAME).fillColor("#302B27").fontSize(13.2).text(safeText(block.text), PAGE_LEFT + 14, document.y, { width: innerWidth, lineGap: 5.7 });
    document.moveDown(0.62);
  }
  document.y = top + height;
  document.moveDown(0.72);
}

function pills(document: PdfWriter, values: string[]) {
  let x = PAGE_LEFT;
  let y = document.y;
  const height = 27;
  const row = 35;
  for (const rawValue of values) {
    const value = safeText(rawValue);
    document.font(FONT_NAME).fontSize(11.5);
    const width = Math.min(document.widthOfString(value) + 20, CONTENT_WIDTH);
    if (x + width > PAGE_LEFT + CONTENT_WIDTH) {
      x = PAGE_LEFT;
      y += row;
    }
    if (y + height > PAGE_BOTTOM) {
      addPage(document);
      x = PAGE_LEFT;
      y = document.y;
    }
    document.save().fillColor("#E8F3EC").roundedRect(x, y, width, height, 13).fill().restore();
    document.font(FONT_NAME).fillColor("#376849").fontSize(11.5).text(value, x + 10, y + 6, { width: width - 20, lineBreak: false });
    x += width + 6;
  }
  document.y = y + row;
}

function bullets(document: PdfWriter, values: string[]) {
  for (const value of values) {
    const height = textHeight(document, value, CONTENT_WIDTH - 20);
    ensureSpace(document, height + 7);
    const top = document.y;
    document.save().fillColor("#8B6914").circle(PAGE_LEFT + 4, top + 7, 2.2).fill().restore();
    document.font(FONT_NAME).fillColor("#302B27").fontSize(13.2).text(safeText(value), PAGE_LEFT + 14, top, { width: CONTENT_WIDTH - 20, lineGap: 5.7 });
    document.moveDown(0.35);
  }
}

function drawShape(document: PdfWriter, shape: ZhCnPilotCardShape, centerX: number, centerY: number, radius: number, fill: string, stroke: string) {
  document.save().lineWidth(1.7).fillColor(fill).strokeColor(stroke);
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

function cardPreviewRow(document: PdfWriter) {
  const cards = ZH_CN_PERSONAL_PILOT_REPORT.cards;
  const gap = 9;
  const width = (CONTENT_WIDTH - gap * 2) / 3;
  const top = document.y;
  ensureSpace(document, 101);
  cards.forEach((item, index) => {
    const x = PAGE_LEFT + index * (width + gap);
    const isLight = item.colorHex.toUpperCase() === "#F5F5F0";
    document.save().fillColor(item.colorHex).strokeColor("#D9D1C8").lineWidth(0.8).roundedRect(x, top, width, 57, 8).fillAndStroke().restore();
    drawShape(document, item.shape, x + width / 2, top + 28, 14, isLight ? "#FFFDF9" : "#FFFFFF", isLight ? "#4A3A2A" : "#FFFFFF");
    document.font(FONT_NAME).fillColor("#4A3A2A").fontSize(8.2).text(`第${index + 1}张卡`, x, top + 65, { width, align: "center", lineBreak: false });
    document.font(FONT_NAME).fillColor("#75695D").fontSize(8.2).text(`${item.colorName} ${item.shapeName}`, x, top + 78, { width, align: "center", lineBreak: false });
  });
  document.y = top + 101;
}

export async function createZhCnPilotPersonalPdfBuffer(): Promise<Buffer> {
  if (!FONT_PATH) throw new Error("Simplified Chinese PDF font is not available.");
  const report = ZH_CN_PERSONAL_PILOT_REPORT;
  const document = new PDFDocument({ size: "A4", margins: { top: 43, bottom: 43, left: PAGE_LEFT, right: PAGE_LEFT }, font: FONT_PATH, info: { Title: "休心色彩 · 个人深度分析中文样本" } });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  const finished = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.registerFont(FONT_NAME, FONT_PATH);
  document.font(FONT_NAME);

  document.rect(0, 0, 595, 842).fill("#F8F4EE");
  document.font(FONT_NAME).fillColor("#4C7A58").fontSize(11.2).text("HUSIM COLOR · PERSONAL DEEP REPORT · ZH-CN PILOT", PAGE_LEFT, 168, { width: CONTENT_WIDTH });
  document.fillColor("#3D3530").fontSize(25).text("我的色彩心理报告", PAGE_LEFT, 204, { width: CONTENT_WIDTH });
  document.fillColor("#685C51").fontSize(12).text("从色彩与图形，温和地看看此刻的内心、生命角色与恢复节奏", PAGE_LEFT, 247, { width: CONTENT_WIDTH });
  document.fillColor("#80649B").fontSize(10.5).text(report.sampleNotice, PAGE_LEFT, 280, { width: CONTENT_WIDTH });
  document.y = 318;
  report.selectedColors.forEach((color) => {
    const top = document.y;
    document.save().fillColor("#FFFDF9").roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, 62, 9).fill().restore();
    document.save().lineWidth(1).fillColor(color.hex).strokeColor("#CBBEAC").circle(PAGE_LEFT + 30, top + 31, 16).fillAndStroke().restore();
    document.font(FONT_NAME).fillColor("#4A3A2A").fontSize(13.2).text(color.name, PAGE_LEFT + 58, top + 11, { width: CONTENT_WIDTH - 72 });
    document.fillColor("#75695D").fontSize(12).text(color.keywords, PAGE_LEFT + 58, top + 34, { width: CONTENT_WIDTH - 72 });
    document.y = top + 69;
  });
  document.fillColor("#75695D").fontSize(11.4).text(`${report.profileLine}\n报告生成日 · ${report.generatedAt}`, PAGE_LEFT, 736, { width: CONTENT_WIDTH, lineGap: 5 });

  addPage(document);
  const firstColor = report.stage1.colors[0];
  sectionTitle(document, "三种色彩的细致解读", "#2D6A4F", cardHeight(document, [{ label: firstColor.role, text: `${firstColor.keywords.join(" · ")}\n${firstColor.description}` }, { label: "优势", text: firstColor.strengths.join(" · ") }, { label: "感到疲惫时", text: firstColor.tiredStates.join(" · ") }]));
  report.stage1.colors.forEach((color) => card(document, color.name, [
    { label: color.role, text: `${color.keywords.join(" · ")}\n${color.description}` },
    { label: "优势", text: color.strengths.join(" · ") },
    { label: "感到疲惫时", text: color.tiredStates.join(" · ") },
  ]));
  sectionTitle(document, "三种色彩的整合解读", "#2D6A4F", 160);
  card(document, "构成你的三种心理线索", [
    { label: "三种色彩同时出现时", text: report.stage1.integrationBridge },
    { label: "心理倾向", text: report.stage1.psychologyTendency },
    { label: "性格倾向", text: report.stage1.personalityTendency },
    { label: "关系倾向", text: report.stage1.relationshipTendency },
  ]);
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("主要优势", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.32);
  pills(document, report.stage1.strengths);
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("可能留意的成长方向", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.32);
  pills(document, report.stage1.growthPossibility);

  sectionTitle(document, "三张心理卡的解读", "#2D6A4F", textHeight(document, report.stage2Bridge));
  card(document, "卡片的流动", [{ text: report.stage2Bridge }], "#FCF8F0");
  cardPreviewRow(document);
  report.cards.forEach((item) => card(document, `${item.position} · ${item.colorName} ${item.shapeName}`, [
    { label: "色彩关键词", text: item.colorKeywords },
    { label: "图形关键词", text: item.shapeKeywords },
    { label: item.roleLabel, text: item.narrative },
  ]));

  sectionTitle(document, `此刻适合你的${report.complementColorTerm}`, "#8B6914", 45);
  paragraph(document, "这些色彩并非要改变你，而是可在当前节奏中帮助缓和容易过度用力的部分，并支持恢复方向的参考。", { size: 12.5, color: "#75695D" });
  document.moveDown(0.25);
  pills(document, report.complementColors.map((color) => `${color.name} · ${color.meaning}`));
  sectionTitle(document, "我的色彩倾向", "#2D6A4F", textHeight(document, report.colorFlowDescription));
  paragraph(document, report.colorFlowDescription);
  document.moveDown(0.75);
  sectionTitle(document, "此刻内心的流动", "#2D6A4F", textHeight(document, report.combinedCoaching[0]));
  report.combinedCoaching.forEach((text, index) => {
    paragraph(document, text);
    if (index < report.combinedCoaching.length - 1) document.moveDown(0.45);
  });

  sectionTitle(document, "我的生命角色能量", "#66557B", 100);
  card(document, report.lifeRole.title, [{ text: report.lifeRole.description }], "#F8F5FF");
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("这份角色能量带来的价值", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.32);
  pills(document, report.lifeRole.humanStrengths);
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("社会中的应用与发展方向", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.32);
  report.lifeRole.directions.forEach((direction) => card(document, direction.title, [{ text: direction.description }, { label: "准备方向", text: direction.preparation }], "#F8F5FF"));
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("较适合的工作环境", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.3);
  bullets(document, report.lifeRole.environments);
  document.font(FONT_NAME).fillColor("#6A5843").fontSize(11.5).text("角色能量的阴影面", PAGE_LEFT + 14, document.y, { width: CONTENT_WIDTH - 14 });
  document.moveDown(0.3);
  bullets(document, report.lifeRole.shadows);
  card(document, "现在可以尝试的小方向", [{ text: report.lifeRole.smallDirection }], "#FCF8F0");

  sectionTitle(document, "此刻身体与内心的节奏", "#2D6A4F", 110);
  paragraph(document, `五行视角 · 当前主要流向 ${report.energyFlow.currentElements.join(" · ")}`, { size: 12.5, color: "#75695D" });
  document.moveDown(0.35);
  card(document, report.energyFlow.title, [{ text: report.energyFlow.description }, { label: "此刻可能需要的支持", text: report.energyFlow.recovery }]);
  pills(document, report.energyFlow.balanceKeywords);
  sectionTitle(document, "今天的专属恢复小练习", "#8B6914", 120);
  paragraph(document, `调和能量 · ${report.energyFlow.complementaryElements.join(" · ")}${report.energyFlow.complementColors.length ? ` · ${report.complementColorTerm} ${report.energyFlow.complementColors.join(" · ")}` : ""}`, { size: 12.5, color: "#75695D" });
  document.moveDown(0.35);
  [
    ["推荐茶饮", report.recoveryRoutine.tea],
    ["推荐食物", report.recoveryRoutine.food],
    ["推荐呼吸", report.recoveryRoutine.breath],
    ["推荐活动", report.recoveryRoutine.movement],
    ["今天的小练习", report.recoveryRoutine.smallPractice],
    ["今天的恢复讯息", report.recoveryRoutine.message],
  ].forEach(([label, text]) => card(document, label, [{ text }], "#FFF9EF"));
  sectionTitle(document, "休心色彩 1:1 色彩教练", "#2D6A4F", 90);
  card(document, "想进一步聊聊时", [
    { text: "如果你想更深入地聊聊此刻的内心节奏，以及适合自己的恢复方向，可以继续了解 1:1 色彩教练。" },
    { text: report.coachingUrl },
  ], "#F2F7F1");
  paragraph(document, ZH_CN_PILOT_DISCLAIMER, { size: 10.4, color: "#8B8176", lineGap: 4.8 });

  document.end();
  return finished;
}
