import path from "node:path";
import { existsSync } from "node:fs";
import PDFDocument from "pdfkit";
import type { CouplePdfDownloadPayload, CouplePdfShape } from "../shared/couple-pdf-download";

const PAGE_LEFT = 43;
const PAGE_TOP = 43;
const PAGE_BOTTOM = 798;
const CONTENT_WIDTH = 509;
const BUNDLED_FONT_PATH = path.join(__dirname, "HusimPdfKorean.ttf");
const FONT_PATH = existsSync(BUNDLED_FONT_PATH)
  ? BUNDLED_FONT_PATH
  : path.join(process.cwd(), "server", "assets", "HusimPdfKorean.ttf");
const BODY_SIZE = 15.5;
const LABEL_SIZE = 12.6;
const BODY_LINE_GAP = 5.8;
const SECTION_BAR_GAP = 7;
const SUBTITLE_SIZE = 19.2;
const SUBTITLE_LABEL_SIZE = 17.4;
const SUBTITLE_LINE_GAP = 3.1;
const CARD_TITLE_BLOCK_HEIGHT = 38;
const CARD_LABEL_BLOCK_HEIGHT = 26;
const CARD_PARAGRAPH_GAP = 2;
// PDFKit의 실제 줄바꿈·한글 stroke 렌더링 여유를 반영해, 카드 배경만 남기고
// 본문이 다음 페이지로 넘치는 상황을 막는다.
const CARD_LAYOUT_SAFETY = 6;
const MAX_CARD_TEXT_HEIGHT = 285;

type PdfWriter = InstanceType<typeof PDFDocument>;
type CardParagraph = {
  label?: string;
  text?: string;
  bullets?: string[];
};

function correctPdfText(value: string) {
  return value
    .replaceAll("붙어있는 시간보다", "붙어 있는 시간보다")
    .replaceAll("짧은 포옹이나 손 잡기가", "짧은 포옹이나 손잡기가")
    .replaceAll("‘", '"')
    .replaceAll("’", '"')
    .replaceAll("“", '"')
    .replaceAll("”", '"');
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

/** 얇은 한글 폰트에서도 카드 소제목이 본문과 분명히 구분되도록 절제된 stroke로 Semi-bold처럼 표시한다. */
function writeSubtitle(document: PdfWriter, text: string, x: number, y: number, width: number, size: number) {
  document
    .fillColor("#2F2019")
    .strokeColor("#2F2019")
    .lineWidth(0.5)
    .fontSize(size)
    .text(clean(text), x, y, { width, lineGap: SUBTITLE_LINE_GAP, fill: true, stroke: true });
}

function bulletListHeight(document: PdfWriter, bullets: string[], width: number) {
  return bullets.reduce((sum, bullet) => sum + Math.max(20, heightOf(document, bullet, width)) + 2, 0);
}

function writeBulletList(document: PdfWriter, bullets: string[], textX: number, bulletX: number, width: number) {
  bullets.forEach((bullet) => {
    const top = document.y;
    document.fillColor("#8A6B4D").fontSize(BODY_SIZE).text("•", bulletX, top, { width: 14, lineGap: BODY_LINE_GAP });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(bullet), textX, top, { width, lineGap: BODY_LINE_GAP });
    document.moveDown(0.15);
  });
}

function writeSectionTitle(document: PdfWriter, title: string, tone = "#5C7F68", minFollowingHeight = 120) {
  const needsGap = document.y > PAGE_TOP + 2;
  const followingHeight = Math.max(minFollowingHeight, 100);
  const requiredHeight = (needsGap ? SECTION_BAR_GAP : 0) + 39 + followingHeight;
  // 페이지 맨 위에서는 즉시 제목을 시작하되, 이미 본문이 있는 페이지에서는
  // 다음 카드가 함께 시작할 여유가 없으면 제목도 다음 페이지로 옮긴다.
  if (needsGap && document.y + requiredHeight > PAGE_BOTTOM) addPage(document);
  else if (needsGap) document.y += SECTION_BAR_GAP;
  const top = document.y;
  document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, 30, 7).fill().restore();
  document.fillColor("#FFFFFF").fontSize(14).text(clean(title), PAGE_LEFT + 13, top + 8, { width: CONTENT_WIDTH - 26, lineBreak: false });
  document.y = top + 39;
}

/** 긴 관계 특성 본문은 문장 단위로 나눠, 배경 없이 다음 쪽에 꼬리 문장만 남지 않도록 한다. */
function splitCardParagraph(document: PdfWriter, paragraph: CardParagraph): CardParagraph[] {
  if (paragraph.bullets?.length) return [paragraph];
  if (!paragraph.text || heightOf(document, paragraph.text, CONTENT_WIDTH - 30) <= MAX_CARD_TEXT_HEIGHT) {
    return [paragraph];
  }

  const sentences = clean(paragraph.text).split(/(?<=[.!?])\s+/).filter(Boolean);
  if (sentences.length < 2) return [paragraph];

  const chunks: CardParagraph[] = [];
  let current = "";
  sentences.forEach((sentence) => {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && heightOf(document, candidate, CONTENT_WIDTH - 30) > MAX_CARD_TEXT_HEIGHT) {
      chunks.push({ label: chunks.length === 0 ? paragraph.label : undefined, text: current });
      current = sentence;
    } else {
      current = candidate;
    }
  });
  if (current) chunks.push({ label: chunks.length === 0 ? paragraph.label : undefined, text: current });
  return chunks.length ? chunks : [paragraph];
}

function writeCard(
  document: PdfWriter,
  title: string,
  paragraphs: CardParagraph[],
  tone = "#FCF8F1",
  options?: { continueFromCurrentPage?: boolean },
) {
  const innerWidth = CONTENT_WIDTH - 30;
  const paragraphHeight = (paragraph: CardParagraph) => {
    // 레이블의 실제 줄 높이를 반영해 제목만 페이지 끝에 남지 않게 한다.
    const labelHeight = paragraph.label
      ? subtitleHeight(document, paragraph.label, innerWidth, SUBTITLE_LABEL_SIZE) + 8
      : 0;
    const textHeight = paragraph.text ? heightOf(document, paragraph.text, innerWidth) : 0;
    const listHeight = paragraph.bullets ? bulletListHeight(document, paragraph.bullets, innerWidth - 22) : 0;
    const textToListGap = paragraph.text && paragraph.bullets?.length ? 5 : 0;
    const contentHeight = textHeight + textToListGap + listHeight;
    // 긴 문단은 PDFKit의 실제 줄바꿈 오차를 넉넉히 반영하고, 짧은 카드에는
    // 과도한 여백을 만들지 않는다.
    const overflowSafety = contentHeight > 180
      ? CARD_LAYOUT_SAFETY * 6
      : contentHeight > 90
        ? CARD_LAYOUT_SAFETY * 2
        : CARD_LAYOUT_SAFETY;
    return labelHeight + contentHeight + CARD_PARAGRAPH_GAP + overflowSafety;
  };
  const drawCard = (cardTitle: string, cardParagraphs: CardParagraph[], showTitle = true) => {
    const titleHeight = showTitle ? CARD_TITLE_BLOCK_HEIGHT : 8;
    const contentHeight = cardParagraphs.reduce((sum, paragraph) => sum + paragraphHeight(paragraph), titleHeight);
    const top = document.y;
    document.save().fillColor(tone).roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, contentHeight + 19, 9).fill().restore();
    if (showTitle) writeSubtitle(document, cardTitle, PAGE_LEFT + 15, top + 12, innerWidth, SUBTITLE_SIZE);
    document.y = top + titleHeight;
    cardParagraphs.forEach((paragraph) => {
      if (paragraph.label) {
        const labelTop = document.y;
        writeSubtitle(document, paragraph.label, PAGE_LEFT + 15, labelTop, innerWidth, SUBTITLE_LABEL_SIZE);
        document.y = labelTop + subtitleHeight(document, paragraph.label, innerWidth, SUBTITLE_LABEL_SIZE) + 8;
      }
      if (paragraph.text) {
        document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(paragraph.text), PAGE_LEFT + 15, document.y, { width: innerWidth, lineGap: BODY_LINE_GAP });
      }
      if (paragraph.bullets?.length) {
        if (paragraph.text) document.moveDown(0.28);
        writeBulletList(document, paragraph.bullets, PAGE_LEFT + 32, PAGE_LEFT + 15, innerWidth - 22);
      }
      document.moveDown(0.1);
    });
    document.y = top + contentHeight + 19;
    document.moveDown(0.2);
  };

  const normalizedParagraphs = paragraphs.flatMap((paragraph) => splitCardParagraph(document, paragraph));
  const totalHeight = normalizedParagraphs.reduce((sum, paragraph) => sum + paragraphHeight(paragraph), CARD_TITLE_BLOCK_HEIGHT);
  const usablePageHeight = PAGE_BOTTOM - PAGE_TOP - 20;
  if (totalHeight + 19 <= usablePageHeight && !options?.continueFromCurrentPage) {
    ensureSpace(document, totalHeight + 19);
    drawCard(title, normalizedParagraphs);
    return;
  }

  // 생활 패턴처럼 한 카드 안에 여러 생활 장면이 담겨 한 페이지를 넘는 경우에는,
  // 제목과 첫 문단을 함께 두고 문단 단위로 자연스럽게 이어 준다.
  let remaining = [...normalizedParagraphs];
  let isFirstSegment = true;
  while (remaining.length > 0) {
    const isShortLabeledContinuation = !isFirstSegment
      && remaining.length === 1
      && Boolean(remaining[0]?.label)
      && paragraphHeight(remaining[0]) < 180;
    const titleHeight = isShortLabeledContinuation ? 8 : CARD_TITLE_BLOCK_HEIGHT;
    const minimumStartHeight = titleHeight + Math.min(paragraphHeight(remaining[0]!), 210) + 19;
    ensureSpace(document, minimumStartHeight);
    const available = PAGE_BOTTOM - document.y - 19 - titleHeight;
    const segment: CardParagraph[] = [];
    let used = 0;
    while (remaining.length > 0) {
      const candidate = remaining[0]!;
      const candidateHeight = paragraphHeight(candidate);
      const isClosingMessage = candidate.label === "마무리 코칭 메시지" && remaining.length === 1;
      // 회복 루틴의 마지막 짧은 코칭은 실제 렌더링 여백 안에 함께 두어,
      // 마무리 문단만 단독 페이지로 떨어지지 않게 한다.
      const canUseClosingAllowance = isClosingMessage && used + candidateHeight <= available + 110;
      if (segment.length > 0 && used + candidateHeight > available && !canUseClosingAllowance) break;
      segment.push(candidate);
      remaining = remaining.slice(1);
      used += candidateHeight;
      if (used >= available) break;
    }
    // 단일 문단이 한 페이지를 넘는 비정상 입력에서도 제목만 남기지 않는다.
    if (segment.length === 0) {
      addPage(document);
      segment.push(remaining[0]!);
      remaining = remaining.slice(1);
    }
    drawCard(isFirstSegment ? title : `${title} · 계속`, segment, !isShortLabeledContinuation);
    isFirstSegment = false;
  }
}

function writeCardWithActions(document: PdfWriter, title: string, summary: string, actions: string[], tone = "#FCF8F1") {
  writeCard(document, title, [{ text: summary, bullets: actions }], tone);
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
  const totalHeight = colors.reduce((sum, color) => (
    sum + Math.max(70, heightOf(document, color.interpretation, CONTENT_WIDTH - 92) + 40) + 8
  ), 0);
  // 각자의 세 컬러는 시작 페이지에 함께 둔다. 긴 입력만 카드 단위로 자연스럽게 나뉜다.
  if (totalHeight <= PAGE_BOTTOM - PAGE_TOP && document.y + totalHeight > PAGE_BOTTOM) addPage(document);
  colors.forEach((color) => {
    const height = Math.max(70, heightOf(document, color.interpretation, CONTENT_WIDTH - 92) + 40);
    ensureSpace(document, height + 8);
    const top = document.y;
    document.save().fillColor("#FFFDF9").roundedRect(PAGE_LEFT, top, CONTENT_WIDTH, height, 9).fill().restore();
    document.save().fillColor(color.hex).strokeColor("#CBBEAC").lineWidth(1).circle(PAGE_LEFT + 31, top + 31, 17).fillAndStroke().restore();
    document.fillColor("#4A3A2A").fontSize(12.5).text(clean(`${color.role} · ${color.name}`), PAGE_LEFT + 61, top + 12, { width: CONTENT_WIDTH - 76 });
    document.fillColor("#75695D").fontSize(11.5).text(clean(color.keywords), PAGE_LEFT + 61, top + 31, { width: CONTENT_WIDTH - 76 });
    document.fillColor("#302B27").fontSize(BODY_SIZE).text(clean(color.interpretation), PAGE_LEFT + 15, top + 50, { width: CONTENT_WIDTH - 30, lineGap: BODY_LINE_GAP });
    document.y = top + height + 8;
  });
}

function writeCards(document: PdfWriter, cards: CouplePdfDownloadPayload["personA"]["cards"]) {
  cards.forEach((card) => {
    const narrative = splitCouplePdfCardNarrative(card.position, card.narrative);
    const innerWidth = CONTENT_WIDTH - 30;
    const narrativeHeight = narrative.actions.length > 0
      ? CARD_TITLE_BLOCK_HEIGHT + heightOf(document, narrative.summary, innerWidth) + 8 + bulletListHeight(document, narrative.actions, innerWidth - 22) + 19
      : CARD_TITLE_BLOCK_HEIGHT + heightOf(document, narrative.summary, innerWidth) + CARD_PARAGRAPH_GAP + 19;
    const minimumNarrativeHeight = Math.min(narrativeHeight, PAGE_BOTTOM - PAGE_TOP - 20);
    ensureSpace(document, 35 + minimumNarrativeHeight + 4);
    const top = document.y;
    document.save().fillColor(card.colorHex).roundedRect(PAGE_LEFT, top, 30, 30, 7).fill().restore();
    drawShape(document, card.shape, PAGE_LEFT + 15, top + 15, 8, "#FFFDF9", "#FFFDF9");
    document.fillColor("#4A3A2A").fontSize(13.2).text(clean(`${card.position} · ${card.colorName} ${card.shapeName}`), PAGE_LEFT + 41, top + 7, { width: CONTENT_WIDTH - 41 });
    document.y = top + 33;
    if (narrative.actions.length > 0) {
      writeCardWithActions(document, card.title, narrative.summary, narrative.actions, "#FCF8F1");
    } else {
      writeCard(document, card.title, [{ text: narrative.summary }], "#FCF8F1");
    }
  });
}

function writePerson(document: PdfWriter, person: CouplePdfDownloadPayload["personA"], tone: string, startsOnNewPage = false) {
  if (startsOnNewPage) addPage(document);
  writeSectionTitle(document, `${person.label}의 개인 해석`, tone, 210);
  writeColorCards(document, person.colors);
  // 개인 컬러 3개와 심리카드 3장을 섞지 않는다. 심리카드는 항상 새 페이지에서 시작한다.
  addPage(document);
  writeSectionTitle(document, `${person.label}의 심리카드 3장`, tone, 210);
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
  const personA = relation.personLabels?.personA ?? "첫 번째 사람";
  const personB = relation.personLabels?.personB ?? "두 번째 사람";
  addPage(document);
  writeSectionTitle(document, "두 사람의 관계 통합 분석", "#80649B", 230);
  writeCard(document, "왜 끌리는데 왜 힘든지", relation.attractionAnalysis
    .split(/\n\n+/)
    .filter(Boolean)
    .map((text) => ({ text })), "#F6F1FA");
  writeCard(document, "두 사람의 관계 속 역할 분석", [
    { label: `${personA} · ${relation.roles.personATitle}`, text: relation.roles.personADescription },
    { label: `${personB} · ${relation.roles.personBTitle}`, text: relation.roles.personBDescription },
    { label: "두 역할이 만났을 때", text: relation.roles.together },
  ], "#F6F1FA");
  if (relation.traits?.length) {
    writeSectionTitle(document, "감정 교류 · 표현 리듬 · 갈등 회복", "#A86773", 460);
    relation.traits.forEach((trait, index) => {
      writeCard(document, "두 사람의 상호작용 흐름", [{
        label: trait.title,
        text: trait.description,
      }], "#FFF4F7", index === 0 ? { continueFromCurrentPage: true } : undefined);
    });
  }
  // 관계 해석은 한 항목마다 새 쪽을 만들지 않는다. 제목과 첫 본문을 함께 둘 수 있는
  // 최소 높이만 확보해 앞 카드의 남는 공간을 자연스럽게 활용한다.
  writeSectionTitle(document, "관계 핵심", "#5F8069", 270);
  writeCard(document, relation.core.headline, [
    { label: "핵심 키워드", text: relation.core.keywords.join(" · ") },
    { text: relation.core.description },
  ], "#EFF7F0", { continueFromCurrentPage: true });
  writeSectionTitle(document, "생활 속 관계 패턴", "#8B7259", 260);
  writeCard(document, relation.lifePattern.headline, relation.lifePattern.items.flatMap((item) => [
    { label: `${item.label} · ${personA}`, text: item.personA },
    { label: personB, text: item.personB },
    { label: "조율 포인트", text: item.tension },
  ]), "#FBF6EF", { continueFromCurrentPage: true });
  // 갈등 카드는 제목과 첫 설명을 함께 두고, 남은 문단만 자연스럽게 이어 준다.
  writeSectionTitle(document, "싸움 패턴", "#B16A75", 255);
  writeCard(document, "이 관계의 갈등 흐름", [
    { label: "싸움이 시작되는 순간", text: relation.conflict.trigger },
    { label: "갈등 직후 반응", text: relation.conflict.reaction },
    { label: "반복 위험 패턴", text: relation.conflict.danger },
    { label: "싸울 때 조심할 말", text: relation.conflict.forbiddenWords.join("\n") },
  ], "#FFF3F3", { continueFromCurrentPage: true });
  writeSectionTitle(document, "연결 방식", "#B87B91", 250);
  writeCard(document, relation.connection.headline, [
    { text: relation.connection.description },
    { label: "함께 해볼 연결", text: relation.connection.actions.join("\n") },
    { label: "스킨십 · 친밀감", text: relation.connection.intimacyNote },
  ], "#FFF4F7", { continueFromCurrentPage: true });
  // 성장 포인트도 제목만 남기지 않고 첫 해석과 같은 페이지에서 시작한다.
  writeSectionTitle(document, "관계 성장 포인트", "#4F8B70", 260);
  writeCard(document, "이 관계가 오래가는 이유와 성장 방향", [
    { label: "이 관계의 강점", text: relation.growth.strength },
    { label: "조금 더 의식하면", text: relation.growth.blindSpot },
    { label: "함께 성장해야 할 방향", text: relation.growth.direction },
    { label: "오늘 해볼 수 있는 것", text: relation.growth.tip },
  ], "#F0F8F2", { continueFromCurrentPage: true });
  // 앞선 성장 포인트의 남는 공간을 활용해 회복 루틴이 불필요하게 한 페이지 늦게 시작하지 않도록 한다.
  // 실제 카드 본문은 writeCard가 단락 단위로 안전하게 다음 페이지로 넘긴다.
  writeSectionTitle(document, "추천 컬러와 함께하는 회복 루틴", "#94723D", 280);
  writeCard(document, "함께 회복하는 이번 주의 흐름", [
    ...relation.recommendedColors.map((color) => ({ label: `추천 컬러 · ${color.name}`, text: color.reason })),
    ...relation.togetherRoutine.routines.map((routine, index) => ({
      label: index === 0 ? "이번 주 함께 해볼 것" : undefined,
      bullets: [routine],
    })),
    { label: "함께하면 살아나는 에너지", text: relation.togetherRoutine.energyNote },
    ...(relation.togetherRoutine.faithRoutine ? [{ label: "함께 나누는 루틴", text: relation.togetherRoutine.faithRoutine }] : []),
    { label: "건강한 관계를 위한 기본 원칙", text: relation.basicPrinciples },
    { label: "마무리 코칭 메시지", text: relation.closingMessage },
  ], "#F0F6F1", { continueFromCurrentPage: true });
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
  if (payload.sampleNotice) {
    document.fillColor("#80649B").fontSize(10.5).text(clean(payload.sampleNotice), PAGE_LEFT, 270, { width: CONTENT_WIDTH });
  }
  document.fillColor("#80649B").fontSize(16).text(clean(payload.couple.typeName), PAGE_LEFT, 316, { width: CONTENT_WIDTH });
  document.fillColor("#4A3A2A").fontSize(16).text(clean(payload.couple.coreSummary), PAGE_LEFT, 348, { width: CONTENT_WIDTH, lineGap: 6 });
  document.fillColor("#75695D").fontSize(13).text(clean(payload.couple.tensionDescription), PAGE_LEFT, 408, { width: CONTENT_WIDTH, lineGap: 5 });
  document.fillColor("#75695D").fontSize(11).text(`리포트 생성일 · ${payload.generatedAt}`, PAGE_LEFT, 740, { width: CONTENT_WIDTH });

  writeRelationship(document, payload);
  writePerson(document, payload.personA, "#A86773", true);
  writePerson(document, payload.personB, "#5677A5", true);
  document.end();
  return finished;
}
