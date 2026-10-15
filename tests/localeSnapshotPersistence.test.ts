import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseCoupleShareSnapshot } from "../shared/couple-share";
import { copyVersionForLocale, resolveStoredResultLocale } from "../shared/localization";

const legacyKoreanSnapshot = {
  schemaVersion: 1 as const,
  sessionData: {
    relationType: "부부" as const,
    personA: { info: { gender: "여성" as const, faith: "무교" as const }, colors: ["pink", "green", "lavender"], cards: ["red_triangle", "blue_circle", "green_square"] },
    personB: { info: { gender: "남성" as const, faith: "기독교" as const }, colors: ["blue", "yellow", "brown"], cards: ["yellow_circle", "purple_diamond", "white_hexagon"] },
  },
  personAAnalysis: {},
  personBAnalysis: {},
  coupleAnalysis: {},
  archetypeResult: {},
  lightArchetypeResult: null,
  romanticRelationTraits: [],
  romanticRelationshipRoles: null,
  personAIntegratedAnalysis: "첫 번째 사람의 통합 분석",
  personBIntegratedAnalysis: "두 번째 사람의 통합 분석",
  createdAt: "2026-10-15T00:00:00.000Z",
};

describe("저장 결과 locale 고정", () => {
  it("새 zh-CN 스냅샷은 locale·copyVersion을 보존하고, 과거 null/undefined 스냅샷은 한국어로 읽는다", () => {
    const zhSnapshot = {
      ...legacyKoreanSnapshot,
      locale: "zh-CN" as const,
      copyVersion: copyVersionForLocale("zh-CN"),
    };

    const parsedZh = parseCoupleShareSnapshot(JSON.stringify(zhSnapshot));
    const parsedLegacy = parseCoupleShareSnapshot(JSON.stringify(legacyKoreanSnapshot));

    expect(parsedZh?.locale).toBe("zh-CN");
    expect(parsedZh?.copyVersion).toBe("zh-CN-2026-10-12-v1");
    expect(resolveStoredResultLocale(parsedZh?.locale)).toBe("zh-CN");
    expect(parsedLegacy?.locale).toBeUndefined();
    expect(resolveStoredResultLocale(parsedLegacy?.locale)).toBe("ko");
    expect(resolveStoredResultLocale("en-US")).toBe("ko");
  });

  it("관계 결과·개인 결과·PDF 전달이 저장된 locale을 우선하도록 연결한다", () => {
    const relationshipService = readFileSync(resolve(process.cwd(), "server/commerce/relationship-invite-service.ts"), "utf8");
    const relationshipScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");
    const personalScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/premium-result.tsx"), "utf8");

    expect(relationshipService).toContain("locale: relationshipSessions.locale");
    expect(relationshipService).toContain("copyVersion: relationshipSessions.copyVersion");
    expect(relationshipService).toContain("resolveStoredResultLocale(session.locale)");
    expect(relationshipScreen).toContain("resolveStoredResultLocale(snapshot.locale)");
    expect(relationshipScreen).toContain("payload.locale = resultLocale");
    expect(relationshipScreen).toContain("<ResultLocaleProvider locale={resultLocale}");
    expect(personalScreen).toContain("resolveStoredResultLocale(delivery.locale)");
    expect(personalScreen).toContain("payload.locale = delivery.locale ?? resultLocale");
    expect(personalScreen).toContain("<ResultLocaleProvider locale={resultLocale}");
  });
});
