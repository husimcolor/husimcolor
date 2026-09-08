import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const selectScreen = readFileSync(`${root}/app/(tabs)/select.tsx`, "utf8");
const resultScreen = readFileSync(`${root}/app/(tabs)/result.tsx`, "utf8");
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, "utf8");

describe("무료 3컬러 테스트 역할 표기", () => {
  it("선택·홈·결과 화면에서 주기질, 보조기질, 회복방향을 사용한다", () => {
    for (const source of [selectScreen, resultScreen, homeScreen]) {
      expect(source).toContain("주기질");
      expect(source).toContain("보조기질");
      expect(source).toContain("회복방향");
    }
  });

  it("결과 해석 카드가 실제 선택 컬러의 역할과 설명을 함께 표시한다", () => {
    expect(resultScreen).toContain("function ColorContextBadge");
    expect(resultScreen).toContain("card: card1");
    expect(resultScreen).toContain("card: card2");
    expect(resultScreen).toContain("card={card3}");
    expect(resultScreen).toContain("나의 기본 성향");
    expect(resultScreen).toContain("나를 보완하는 성향");
    expect(resultScreen).toContain("지금 필요한 회복");
  });

  it("결과 섹션 제목이 각 컬러 역할 및 해석 목적과 일치한다", () => {
    expect(resultScreen).toContain("주기질 — 나의 기본 성향");
    expect(resultScreen).toContain("보조기질 — 나를 보완하는 성향");
    expect(resultScreen).toContain("회복방향 — 지금 필요한 회복");
  });

  it("보완 컬러를 중립 카드 위의 실제 색상 칩과 회복 의미로 표시한다", () => {
    expect(resultScreen).toContain("backgroundColor: colorInfo?.hex");
    expect(resultScreen).toContain("colorInfo?.recovery");
    expect(resultScreen).toContain("styles.complementChip");
    expect(resultScreen).not.toContain("backgroundColor: '#4A7A5A'");
  });

  it("저장·인스타·카카오 공유가 실제 결과 기반 전용 9:16 요약카드를 사용한다", () => {
    expect(resultScreen).toContain("function ShareSummaryCard");
    expect(resultScreen).toContain("aspectRatio: 9 / 16");
    expect(resultScreen).toContain("const shareCardRef");
    expect(resultScreen).toContain("const captureShareCard");
    expect(resultScreen).toContain("function summarizeForShareCard");
    expect(resultScreen).toContain("primarySummary={summarizeForShareCard(interpretation.psychologyFlow)}");
    expect(resultScreen).toContain("supportingSummary={summarizeForShareCard(interpretation.personalityFlow)}");
    expect(resultScreen).toContain("recoverySummary={summarizeForShareCard(interpretation.recoveryFlow)}");
    expect(resultScreen).toContain("const handleKakaoShare");
    expect(resultScreen).not.toContain("captureRef(viewShotRef");
    expect(resultScreen).toContain("FREE_TEST_START_URL");
    expect(resultScreen).toContain("Clipboard.setStringAsync(FREE_TEST_START_URL)");
    expect(resultScreen).toContain("const handleInstaShare");
    expect(resultScreen).toContain("const uri = await captureShareCard()");
  });

  it("이전 무료 테스트 역할 명칭을 화면 코드에서 사용하지 않는다", () => {
    for (const source of [selectScreen, resultScreen, homeScreen]) {
      expect(source).not.toContain("무의식 / 내면 흐름");
      expect(source).not.toContain("무의식 / 내면 성향");
      expect(source).not.toContain("현재 상태 / 심리 흐름");
      expect(source).not.toContain("회복 방향 / 필요한 에너지");
    }
  });
});
