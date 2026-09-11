import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createParentChildPdfBuffer, validateParentChildPdfPayload } from "../server/parent-child-pdf-report";
import type { ParentChildPdfDownloadPayload } from "../shared/parent-child-pdf-download";

const payload: ParentChildPdfDownloadPayload = {
  relationType: "엄마-딸",
  generatedAt: "2026년 9월 11일",
  personA: {
    label: "첫 번째 사람 - 엄마",
    colors: [
      { role: "주기질", name: "그린", hex: "#5D8A62", keywords: "균형 · 돌봄", interpretation: "관계의 균형과 안정된 흐름을 소중히 여깁니다." },
      { role: "보조기질", name: "세이지그린", hex: "#9AAF88", keywords: "배려 · 지속", interpretation: "차분하게 살피며 꾸준한 연결을 이어갑니다." },
      { role: "회복 방향", name: "라벤더", hex: "#B9A5C9", keywords: "여백 · 회복", interpretation: "마음을 가라앉히고 서로의 여백을 존중합니다." },
    ],
    cards: [
      { position: "1번 카드 · 무의식", colorName: "레드", shapeName: "동그라미", colorHex: "#E65B50", shape: "circle", title: "따뜻한 시작", narrative: "관계를 지키고 싶은 마음이 있습니다." },
      { position: "2번 카드 · 현재 흐름", colorName: "화이트", shapeName: "네모", colorHex: "#EEECE2", shape: "square", title: "정리의 시간", narrative: "지금은 핵심을 차분히 정리하고 싶을 수 있습니다." },
      { position: "3번 카드 · 다음 방향", colorName: "블루", shapeName: "마름모", colorHex: "#5677A5", shape: "diamond", title: "신뢰의 회복", narrative: "한 번에 한 가지씩 마음을 확인해 보세요." },
    ],
    integratedAnalysis: "안정과 배려를 함께 중요하게 여깁니다.\n\n마음을 지키며 관계의 균형을 찾습니다.",
    relationshipStyle: "꾸준한 돌봄과 일관된 행동으로 관계를 이어갑니다.",
    emotionExpression: "충분히 생각한 뒤 차분하게 표현합니다.",
    complementColor: { name: "라벤더", hex: "#B9A5C9", meaning: "마음을 가라앉히고 여백을 회복하는 흐름" },
    coachingMessage: "오늘은 한 가지 마음만 짧게 확인해 보세요.",
  },
  personB: {
    label: "두 번째 사람 - 딸",
    colors: [
      { role: "주기질", name: "옐로우", hex: "#E1B84F", keywords: "이해 · 탐색", interpretation: "이유와 가능성을 살피며 스스로 답을 찾아갑니다." },
      { role: "보조기질", name: "핑크", hex: "#D98A9C", keywords: "연결 · 공감", interpretation: "따뜻한 반응 안에서 마음을 표현합니다." },
      { role: "회복 방향", name: "코랄", hex: "#D77961", keywords: "표현 · 활력", interpretation: "작은 표현으로 관계의 숨통을 엽니다." },
    ],
    cards: [
      { position: "1번 카드 · 무의식", colorName: "옐로우", shapeName: "동그라미", colorHex: "#E1B84F", shape: "circle", title: "이해의 흐름", narrative: "이유를 충분히 알고 싶은 마음이 있습니다." },
      { position: "2번 카드 · 현재 흐름", colorName: "퍼플", shapeName: "마름모", colorHex: "#8D6AA8", shape: "diamond", title: "의미의 탐색", narrative: "지금은 여러 마음을 비교하며 생각을 정리합니다." },
      { position: "3번 카드 · 다음 방향", colorName: "그린", shapeName: "육각형", colorHex: "#5D8A62", shape: "hexagon", title: "관계의 균형", narrative: "편안한 대화로 다시 연결해 보세요." },
    ],
    integratedAnalysis: "이해와 연결을 함께 중요하게 여깁니다.\n\n충분히 생각한 뒤 자신의 마음을 표현합니다.",
    relationshipStyle: "이유를 납득하고 공감받을 때 관계에 더 편안하게 참여합니다.",
    emotionExpression: "생각을 정리한 뒤 마음을 나눕니다.",
    complementColor: { name: "코랄", hex: "#D77961", meaning: "작은 표현으로 관계의 활력을 되찾는 흐름" },
    coachingMessage: "오늘은 이유 하나와 마음 한 단어를 나누어 보세요.",
  },
  relationship: {
    labels: { parent: "엄마", child: "딸" },
    typeName: "신뢰와 탐색의 조율 관계",
    coreSummary: "기준을 지키려는 마음과 이유를 살피는 마음이 만나 서로를 배우는 관계입니다.",
    description: "서로의 속도를 확인하면 기준과 질문이 함께 살아날 수 있습니다.",
    cardFlowSummary: "엄마의 현재 흐름 · 정리의 시간\n지금은 핵심을 차분히 정리하고 싶을 수 있습니다.\n\n딸의 현재 흐름 · 의미의 탐색\n지금은 여러 마음을 비교하며 생각을 정리합니다.",
    socialRoles: { parent: { title: "균형을 살피는 역할", description: "관계의 안정된 흐름을 지키는 역할입니다." }, child: { title: "이유를 탐색하는 역할", description: "이유를 살피며 자신의 판단을 만드는 역할입니다." } },
    relationshipRoles: { parent: { title: "기준을 세우는 역할", description: "필요한 약속을 함께 정리합니다." }, child: { title: "가능성을 살피는 역할", description: "자기 속도로 이유를 확인합니다." }, together: "기준과 질문을 함께 놓을 때 서로를 더 정확히 이해합니다." },
    childCommunication: { closesWhen: "이유를 살피기 전에 결론을 요구받을 때 마음을 닫을 수 있습니다.", gainsConfidenceWhen: "생각한 과정과 이유를 설명할 기회를 얻을 때 자신감이 살아납니다." },
    lifeScenes: { strengths: [{ title: "하루의 이유를 나누는 시간", description: "경험을 차분히 되짚으며 서로의 생각을 들을 수 있습니다." }], tensions: [{ title: "약속을 정하는 속도", description: "빠른 결론과 충분한 질문 사이에서 속도 차이가 느껴질 수 있습니다." }] },
    dialogue: { doMessages: ["엄마는 “네가 생각한 이유를 먼저 듣고 싶어.”라고 말합니다."], dontMessages: ["엄마는 “더 묻지 말고 지금 정한 대로 해.”라고 단정하지 않습니다."] },
    conflictRecovery: { conflictStart: "기준을 먼저 세우려는 순간과 이유를 더 살피려는 순간이 겹칠 때 갈등이 시작될 수 있습니다.", parentIntent: "엄마는 딸이 편안하게 움직일 수 있도록 방향을 잡아 주려 합니다.", childReception: "딸은 자신의 생각을 확인할 기회가 줄어든다고 느낄 수 있습니다.", mismatch: "엄마의 보호가 딸에게는 질문을 멈추라는 신호로, 딸의 탐색은 엄마에게는 결정을 미루는 모습으로 읽힐 수 있습니다.", recoveryOrder: "먼저 한 가지 기준을 말하고, 다음으로 딸의 이유를 들은 뒤, 함께 정한 작은 약속만 확인합니다." },
    recommendedColors: [{ name: "라벤더", hex: "#B9A5C9", reason: "결론을 서두르기보다 서로의 여백을 지키도록 돕습니다." }],
    practices: ["엄마는 중요한 기준 한 가지만 말하고, 딸은 자신의 이유 한 가지만 덧붙입니다.", "대화가 길어지면 둘 다 한 문장으로 지금 마음을 정리한 뒤 잠시 쉬어 갑니다.", "하루가 끝날 때 서로 고마웠던 행동 하나만 짧게 나눕니다."],
    closingMessage: "서로의 기준과 질문을 함께 지킬 때, 두 사람의 연결은 더 편안해질 수 있습니다.",
  },
};

describe("부모·자녀 전용 PDF 리포트", () => {
  it("웹에서 전달한 엄마·딸 세션의 종합 분석과 개인 분석을 새 해석 없이 유효한 한글 PDF로 생성한다", async () => {
    const validated = validateParentChildPdfPayload(payload);
    const pdf = await createParentChildPdfBuffer(validated);

    expect(pdf.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(4_000);
    expect(validated.relationship.labels).toEqual({ parent: "엄마", child: "딸" });
    expect(validated.relationship.conflictRecovery.mismatch).toContain("질문을 멈추라는 신호");
    expect(validated.relationship.cardFlowSummary).toContain("딸의 현재 흐름");
    expect(validated.personB.integratedAnalysis).toContain("이해와 연결");
  });

  it("표지→종합 관계 분석→첫 번째 사람 새 페이지→두 번째 사람 새 페이지 순서와 현재 세션 호칭을 유지한다", () => {
    const source = readFileSync(resolve(process.cwd(), "server/parent-child-pdf-report.ts"), "utf8");
    const screen = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(source).toContain("휴심컬러 부모·자녀\\n감성 심리코칭 리포트");
    expect(source).toContain("writeRelationship(document, payload);");
    expect(source).toContain("addPage(document);\n  writePerson(document, payload.personA");
    expect(source).toContain("addPage(document);\n  writePerson(document, payload.personB");
    expect(screen).toContain("첫 번째 사람 - ${parentChildLabels.parent}");
  });

  it("부부·연인 PDF와 분리된 API·쿠키·CTA를 사용하고 부모·자녀일 때만 노출한다", () => {
    const screen = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");
    const api = readFileSync(resolve(process.cwd(), "api/parent-child-pdf-report.ts"), "utf8");

    expect(screen).toContain("/api/parent-child-pdf-report");
    expect(screen).toContain("husim_parent_child_pdf_download");
    expect(screen).toContain("isParentChildRel && parentChildCoaching && parentChildSummary");
    expect(api).toContain("husim_parent_child_pdf_download");
    expect(api).toContain("Content-Disposition");
    const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/deploy.yml"), "utf8");
    expect(workflow).toContain("parent-child-pdf-report.func/index.js");
    expect(workflow).toContain("parent-child-pdf-report.func/HusimPdfKorean.ttf");
  });
});
