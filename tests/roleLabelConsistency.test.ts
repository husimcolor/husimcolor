import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CARD_DATA } from "../constants/cardData";
import { buildStage2CardInterpretations } from "../constants/premiumStage2CardInterpretation";

const source = (path: string) => readFileSync(`${process.cwd()}/${path}`, "utf8");

const KoreanRoleLabels = {
  colors: ["주기질", "보조기질", "회복방향"],
  cards: ["무의식", "현재흐름", "회복방향"],
  recommendation: "추천 보완컬러",
} as const;

describe("선택 결과 역할 명칭 일관성", () => {
  it("세 심리카드의 역할을 무의식·현재흐름·회복방향으로 구분한다", () => {
    const [first, second, third] = CARD_DATA;
    const interpretations = buildStage2CardInterpretations([first, second, third]);

    expect(interpretations.map((item) => item.roleLabel)).toEqual(KoreanRoleLabels.cards);
    expect(interpretations.map((item) => item.roleTitle)).toEqual([
      "무의식",
      "현재흐름",
      "회복방향",
    ]);
  });

  it("무료·개인 심화·관계 선택 화면에서 세 컬러와 세 카드 역할을 분리한다", () => {
    const sources = [
      source("app/(tabs)/select.tsx"),
      source("app/(tabs)/result.tsx"),
      source("app/(tabs)/premium-color-select.tsx"),
      source("app/(tabs)/premium-select.tsx"),
      source("app/(tabs)/premium-result.tsx"),
      source("app/(tabs)/couple-card-select.tsx"),
      source("app/(tabs)/couple-card-result.tsx"),
      source("app/(tabs)/couple-result.tsx"),
      source("scripts/generate-public-sample-reports.ts"),
    ];

    for (const role of KoreanRoleLabels.colors) {
      expect(sources.some((value) => value.includes(role))).toBe(true);
    }
    for (const role of KoreanRoleLabels.cards) {
      expect(sources.some((value) => value.includes(role))).toBe(true);
    }

    expect(source("app/(tabs)/result.tsx")).toContain("보조기질 — 함께 드러나는 성향");
    expect(source("app/(tabs)/premium-result.tsx")).toContain("현재흐름 · 현재의 반응");
    expect(source("app/(tabs)/premium-result.tsx")).toContain("회복방향 · 회복의 실천");
  });

  it("별도 추천 색을 선택한 세 번째 컬러와 구분해 추천 보완컬러로 표기한다", () => {
    const sources = [
      source("app/(tabs)/result.tsx"),
      source("app/(tabs)/premium-result.tsx"),
      source("app/(tabs)/couple-color-result.tsx"),
      source("components/premium-share-summary-card.tsx"),
      source("server/pdf-report.ts"),
      source("server/couple-pdf-report.ts"),
      source("server/parent-child-pdf-report.ts"),
    ];

    for (const value of sources) {
      expect(value).toContain(KoreanRoleLabels.recommendation);
    }
  });

  it("새 개인·관계 PDF payload가 현재흐름과 회복방향을 사용하고 이전 역할명으로 되돌아가지 않는다", () => {
    const sources = [
      source("lib/premium-pdf-download.ts"),
      source("lib/premium-pdf-report.ts"),
      source("app/(tabs)/couple-result.tsx"),
      source("server/commerce/relationship-invite-service.ts"),
    ].join("\n");

    expect(sources).toContain("2번 카드 · 현재흐름");
    expect(sources).toContain("3번 카드 · 회복방향");
    expect(sources).toContain('index === 0 ? "주기질" : index === 1 ? "보조기질" : "회복방향"');
    expect(sources).not.toContain("3번 카드 · 다음 방향");
    expect(sources).not.toContain("나의 또 다른 성향");
  });
});
