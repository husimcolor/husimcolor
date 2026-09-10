import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createCouplePdfBuffer, splitCouplePdfCardNarrative, validateCouplePdfPayload } from "../server/couple-pdf-report";
import type { CouplePdfDownloadPayload } from "../shared/couple-pdf-download";

const payload: CouplePdfDownloadPayload = {
  relationType: "부부",
  generatedAt: "2026년 9월 10일",
  couple: { typeName: "회복형 관계", coreSummary: "다시 연결되는 힘이 있는 관계", tensionDescription: "속도 차이를 이해하면 안정적으로 이어질 수 있습니다." },
  personA: {
    label: "첫 번째 사람",
    colors: [
      { role: "주기질", name: "레드", hex: "#E53935", keywords: "열정 · 추진", interpretation: "마음을 움직이는 힘을 소중히 여깁니다." },
      { role: "보조기질", name: "블루", hex: "#1E88E5", keywords: "신뢰 · 경청", interpretation: "신뢰를 확인하며 관계를 이어갑니다." },
      { role: "회복 방향", name: "그린", hex: "#43A047", keywords: "균형 · 회복", interpretation: "조율과 회복의 시간을 만들어 보세요." },
    ],
    cards: [
      { position: "1번 카드 · 무의식", colorName: "레드", shapeName: "동그라미", colorHex: "#E53935", shape: "circle", title: "열정과 포용", narrative: "내면에는 따뜻한 생명력과 연결되고 싶은 마음이 있습니다." },
      { position: "2번 카드 · 현재 흐름", colorName: "블루", shapeName: "마름모", colorHex: "#1E88E5", shape: "diamond", title: "신뢰의 균형", narrative: "지금은 감정을 차분히 표현할 방법을 찾고 있습니다." },
      { position: "3번 카드 · 다음 방향", colorName: "그린", shapeName: "네모", colorHex: "#43A047", shape: "square", title: "안정의 회복", narrative: "작은 일상 리듬으로 마음을 회복해 보세요." },
    ],
    integratedAnalysis: "관계에서 진심과 신뢰를 함께 중요하게 여깁니다.\n\n겉으로는 단단해 보여도 마음을 확인받고 싶을 수 있습니다.\n\n서두르기보다 차분한 대화가 회복을 돕습니다.",
    relationshipStyle: "따뜻한 말과 행동으로 관계를 이어갑니다.",
    emotionExpression: "감정을 비교적 빠르게 표현합니다.",
    complementColor: { name: "그린", hex: "#43A047", meaning: "관계를 안정시키고 자연스럽게 회복하는 흐름" },
    coachingMessage: "오늘은 한 번 더 마음을 확인하는 말을 건네 보세요.",
  },
  personB: {
    label: "두 번째 사람",
    colors: [
      { role: "주기질", name: "라벤더", hex: "#B39DDB", keywords: "섬세함 · 성찰", interpretation: "마음의 결을 깊이 살피는 편입니다." },
      { role: "보조기질", name: "핑크", hex: "#F48FB1", keywords: "교감 · 온기", interpretation: "다정한 연결과 공감을 소중히 여깁니다." },
      { role: "회복 방향", name: "옐로우", hex: "#FDD835", keywords: "이해 · 성장", interpretation: "가벼운 호기심으로 관계의 숨통을 열어 보세요." },
    ],
    cards: [
      { position: "1번 카드 · 무의식", colorName: "퍼플", shapeName: "삼각형", colorHex: "#8E24AA", shape: "triangle", title: "내면의 방향", narrative: "깊은 관계의 의미를 찾고 싶은 마음이 있습니다." },
      { position: "2번 카드 · 현재 흐름", colorName: "화이트", shapeName: "네모", colorHex: "#F5F5F0", shape: "square", title: "정리의 시간", narrative: "생각을 정리한 뒤 안정적으로 표현합니다." },
      { position: "3번 카드 · 다음 방향", colorName: "옐로우", shapeName: "육각형", colorHex: "#FDD835", shape: "hexagon", title: "함께하는 확장", narrative: "부드러운 대화가 다음 연결을 열어 줍니다." },
    ],
    integratedAnalysis: "관계의 온기와 내면의 의미를 함께 중요하게 여깁니다.\n\n표현하기 전 마음을 오래 살필 수 있습니다.\n\n편안하게 말할 수 있는 시간을 만들어 보세요.",
    relationshipStyle: "신뢰가 쌓인 뒤 마음을 나눕니다.",
    emotionExpression: "생각을 정리한 뒤 표현합니다.",
    complementColor: { name: "옐로우", hex: "#FDD835", meaning: "가벼운 대화와 이해의 흐름" },
    coachingMessage: "오늘은 마음속 생각을 짧게라도 나누어 보세요.",
  },
  relationship: {
    attractionAnalysis: "서로 다른 표현 속도가 끌림과 서운함을 함께 만들 수 있습니다.",
    roles: { personATitle: "관계를 움직이는 역할", personADescription: "대화의 시작을 여는 역할입니다.", personBTitle: "관계를 깊게 하는 역할", personBDescription: "마음의 결을 살피는 역할입니다.", together: "두 역할은 서로를 보완하지만 한쪽만 과해지지 않도록 균형이 필요합니다." },
    core: { headline: "속도 차이가 연결이 되는 관계", keywords: ["신뢰", "대화", "회복"], description: "서로의 차이를 이해할 때 관계가 더 안정됩니다." },
    lifePattern: { headline: "일상에서 확인되는 서로 다른 리듬", items: [{ label: "휴식", personA: "함께 이야기하며 쉼을 찾습니다.", personB: "혼자 정리한 뒤 쉼을 찾습니다.", tension: "각자의 쉬는 시간을 먼저 인정해 주세요." }] },
    conflict: { trigger: "확인이 늦어질 때 오해가 시작될 수 있습니다.", reaction: "한쪽은 말하고 싶고 다른 한쪽은 생각할 시간을 원합니다.", danger: "침묵을 무관심으로 해석하지 않도록 주의해 주세요.", forbiddenWords: ["왜 항상 그래?", "말해도 소용없어."] },
    connection: { headline: "작은 확인이 가까움을 만듭니다", description: "짧은 안부와 솔직한 표현이 이 관계를 잇습니다.", actions: ["하루 한 번 안부 묻기", "감사 한마디 나누기"], intimacyNote: "두 사람에게 편안한 거리와 따뜻한 접촉을 함께 찾아 보세요." },
    growth: { strength: "서로를 다시 이해하려는 힘이 있습니다.", blindSpot: "감정을 추측으로 판단하지 않도록 주의해 주세요.", direction: "표현 속도의 차이를 존중해 주세요.", tip: "대화 전에 지금 필요한 것이 공감인지 해결인지 물어보세요." },
    recommendedColors: [{ name: "그린", hex: "#43A047", reason: "관계를 차분하게 조율하는 컬러입니다." }],
    togetherRoutine: { routines: ["저녁에 짧은 안부 나누기", "주말에 함께 산책하기"], energyNote: "함께하는 작은 루틴이 안정감을 키웁니다." },
    basicPrinciples: "서로의 마음을 당연하게 여기지 않고, 감정과 필요를 차분히 확인하는 시간이 신뢰·이해·배려·존중을 함께 키워갈 수 있습니다.",
    closingMessage: "오늘의 작은 확인이 내일의 더 편안한 연결로 이어질 수 있습니다.",
  },
};

describe("부부·연인 전용 PDF 리포트", () => {
  it("3번 카드의 실제 행동 지침만 글머리표 단위로 분리하고 지정된 띄어쓰기를 교정한다", () => {
    const recovery = splitCouplePdfCardNarrative(
      "3번 카드 · 다음 방향",
      "붙어있는 시간보다 마음을 확인하는 시간이 필요합니다.\n· 짧은 포옹이나 손 잡기가 관계의 온도를 높일 수 있습니다.\n· 오늘 한 번 안부를 먼저 건네 보세요.",
    );
    const interpretation = splitCouplePdfCardNarrative(
      "1번 카드 · 무의식",
      "붙어있는 시간보다 마음을 확인하는 시간이 필요합니다.\n· 이 문장은 일반 해석으로 유지합니다.",
    );

    expect(recovery.summary).toBe("붙어 있는 시간보다 마음을 확인하는 시간이 필요합니다.");
    expect(recovery.actions).toEqual([
      "짧은 포옹이나 손잡기가 관계의 온도를 높일 수 있습니다.",
      "오늘 한 번 안부를 먼저 건네 보세요.",
    ]);
    expect(interpretation.actions).toEqual([]);
    expect(interpretation.summary).toContain("붙어 있는 시간보다");
  });

  it("웹에서 산출한 A/B 개인·관계 데이터를 새 해석 없이 유효한 한글 PDF로 생성한다", async () => {
    const validated = validateCouplePdfPayload(payload);
    const pdf = await createCouplePdfBuffer(validated);

    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(4_000);
    expect(validated.personA.cards).toHaveLength(3);
    expect(validated.personB.integratedAnalysis).toContain("관계의 온기");
    expect(validated.relationship.basicPrinciples).toContain("신뢰·이해·배려·존중");
  });

  it("기존 1:1 PDF와 별도 API·쿠키·CTA를 사용하고 부부·연인에만 노출한다", () => {
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");
    const apiSource = readFileSync(resolve(process.cwd(), "api/couple-pdf-report.ts"), "utf8");
    const serverSource = readFileSync(resolve(process.cwd(), "server/couple-pdf-report.ts"), "utf8");

    expect(screenSource).toContain("PDF 리포트 다운로드");
    expect(screenSource).toContain("/api/couple-pdf-report");
    expect(screenSource).toContain("husim_couple_pdf_download");
    expect(screenSource).toContain("isRomanticRel && (");
    expect(screenSource).not.toContain("pdfDownloadState");
    expect(apiSource).toContain("Content-Disposition");
    expect(apiSource).toContain("husim_couple_pdf_download");
    expect(serverSource).toContain("건강한 관계를 위한 기본 원칙");
    expect(serverSource).toContain("스킨십 · 친밀감");
    expect(serverSource).toContain("두 사람의 관계 속 역할 분석");
  });

  it("두 번째 사람과 관계 통합 분석은 새 페이지에서 시작하고 컬러바·핵심 소제목 위계를 유지한다", () => {
    const serverSource = readFileSync(resolve(process.cwd(), "server/couple-pdf-report.ts"), "utf8");

    expect(serverSource).toContain("writePerson(document, payload.personB, \"#5677A5\", true)");
    expect(serverSource).toContain("addPage(document);\n  writeSectionTitle(document, \"두 사람의 관계 통합 분석\"");
    expect(serverSource).toContain("SECTION_BAR_GAP");
    expect(serverSource).toContain("SUBTITLE_SIZE");
    expect(serverSource).toContain("SUBTITLE_LABEL_SIZE");
  });

  it("카드 내부 핵심 소제목은 일관된 강조 스타일을 사용하고 회복 루틴 행동만 글머리표로 표시한다", () => {
    const serverSource = readFileSync(resolve(process.cwd(), "server/couple-pdf-report.ts"), "utf8");

    expect(serverSource).toContain("function writeSubtitle");
    expect(serverSource).toContain("stroke: true");
    expect(serverSource).toContain("SUBTITLE_SIZE = 16.2");
    expect(serverSource).toContain("SUBTITLE_LABEL_SIZE = 15.1");
    expect(serverSource).toContain("function writeBulletList");
    expect(serverSource).toContain('{ label: "이번 주 함께 해볼 것", bullets: relation.togetherRoutine.routines }');
    expect(serverSource).not.toContain('{ label: "이번 주 함께 해볼 것", text: relation.togetherRoutine.routines.join("\\n") }');
  });
});
