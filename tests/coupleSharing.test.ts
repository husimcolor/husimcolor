import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { isCoupleShareSnapshot, parseCoupleShareSnapshot } from "../shared/couple-share";

const snapshot = {
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
  createdAt: "2026-09-10T00:00:00.000Z",
};

describe("커플 결과 고유 공유 링크", () => {
  it("관계 유형·두 사람의 세 컬러와 세 심리카드·분석 스냅샷을 함께 검증한다", () => {
    expect(isCoupleShareSnapshot(snapshot)).toBe(true);
    expect(parseCoupleShareSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(isCoupleShareSnapshot({ ...snapshot, sessionData: { ...snapshot.sessionData, personA: { ...snapshot.sessionData.personA, cards: ["one"] } } })).toBe(false);
    expect(isCoupleShareSnapshot({ ...snapshot, sessionData: { ...snapshot.sessionData, relationType: "아빠-딸" } })).toBe(false);
  });

  it("공유 시점 결과를 새 검사 결과와 분리하는 shareId 저장·조회 API를 사용한다", () => {
    const schemaSource = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    const dbSource = readFileSync(resolve(process.cwd(), "server/db.ts"), "utf8");
    const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");

    expect(schemaSource).toContain('mysqlTable("couple_shared_results"');
    expect(schemaSource).toContain('shareId: varchar("shareId", { length: 64 }).notNull().unique()');
    expect(dbSource).toContain("createCoupleSharedResult");
    expect(dbSource).toContain("getCoupleSharedResult");
    expect(dbSource).not.toContain("onDuplicateKeyUpdate({ set: { resultSnapshot");
    expect(routerSource).toContain("coupleShares: router({");
    expect(routerSource).toContain("parseCoupleShareSnapshot");
  });

  it("카카오 공유 URL에 고유 shareId를 포함하고 공유 링크에서는 저장된 스냅샷을 우선 표시한다", () => {
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(screenSource).toContain("useLocalSearchParams");
    expect(screenSource).toContain("trpc.coupleShares.get.useQuery");
    expect(screenSource).toContain("createCoupleShare.mutateAsync");
    expect(screenSource).toContain("결과 도달 시점에 결과 전체를 단 한 번 고정 저장한다");
    expect(screenSource).toContain("const isRomanticResult = data.relationType === '연인' || data.relationType === '부부';");
    expect(screenSource).toContain("if (isRomanticResult && data.shareId)");
    expect(screenSource).toContain("await AsyncStorage.setItem('@couple_session', JSON.stringify(storedSession))");
    expect(screenSource).toContain("/couple-result?shareId=${encodeURIComponent(shareId)}");
    expect(screenSource).toContain("setSessionData(snapshot.sessionData)");
    expect(screenSource).toContain("sharedSnapshot.romanticRelationTraits");
    expect(screenSource).toContain("handleCoupleKakaoShare(archetypeResult.typeName)");
    expect(screenSource).not.toContain("handleCoupleKakaoShare(lightArchetypeResult.typeName)");
    expect(screenSource).toContain("await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '휴심컬러 결과 공유' })");
    expect(screenSource).toContain("const shareUrl = typeof window !== 'undefined' ? window.location.href");
  });
});
