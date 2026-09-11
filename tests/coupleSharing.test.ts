import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  getCoupleShareSessionSignature,
  isCoupleShareSnapshot,
  parseCoupleShareSnapshot,
} from "../shared/couple-share";

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
    expect(isCoupleShareSnapshot({ ...snapshot, sessionData: { ...snapshot.sessionData, relationType: "아빠-딸" } })).toBe(true);
  });

  it("서로 다른 관계 세션은 색·카드·관계 유형을 가진 별도 불변 스냅샷으로 파싱된다", () => {
    const parentChildSnapshot = {
      ...snapshot,
      sessionData: {
        relationType: "엄마-딸" as const,
        personA: { info: { gender: "여성" as const, faith: "무교" as const }, colors: ["green", "sage", "lavender"], cards: ["red_circle", "white_square", "blue_diamond"] },
        personB: { info: { gender: "여성" as const, faith: "무교" as const }, colors: ["yellow", "pink", "coral"], cards: ["yellow_circle", "purple_diamond", "green_hexagon"] },
      },
    };

    const parsedCouple = parseCoupleShareSnapshot(JSON.stringify(snapshot));
    const parsedParentChild = parseCoupleShareSnapshot(JSON.stringify(parentChildSnapshot));
    expect(parsedCouple?.sessionData.relationType).toBe("부부");
    expect(parsedParentChild?.sessionData.relationType).toBe("엄마-딸");
    expect(parsedParentChild?.sessionData.personA.colors).toEqual(["green", "sage", "lavender"]);
    expect(parsedParentChild?.sessionData.personB.cards).toEqual(["yellow_circle", "purple_diamond", "green_hexagon"]);
    expect(parsedCouple?.sessionData).not.toEqual(parsedParentChild?.sessionData);
  });

  it("공유 중 새 검사 세션이 열리면 이전 진행 요청의 shareId를 재사용하지 않는다", () => {
    const nextSession = {
      ...snapshot.sessionData,
      relationType: "친구" as const,
      personA: { ...snapshot.sessionData.personA, colors: ["green", "pink", "brown"] },
      personB: { ...snapshot.sessionData.personB, cards: ["magenta_circle", "coral_triangle", "yellow_square"] },
    };

    expect(getCoupleShareSessionSignature(snapshot.sessionData))
      .toBe(getCoupleShareSessionSignature({ ...snapshot.sessionData }));
    expect(getCoupleShareSessionSignature(nextSession))
      .not.toBe(getCoupleShareSessionSignature(snapshot.sessionData));
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
    expect(screenSource).toContain("/couple-result?shareId=${encodeURIComponent(shareId)}");
    expect(screenSource).toContain("setSessionData(snapshot.sessionData)");
    expect(screenSource).toContain("sharedSnapshot.romanticRelationTraits");
    expect(screenSource).toContain("handleCoupleKakaoShare(archetypeResult.typeName)");
    expect(screenSource).toContain("handleCoupleKakaoShare(lightArchetypeResult.typeName)");
    expect(screenSource).toContain("카카오 공유를 누른 바로 그 시점의 화면 데이터를 새 불변 스냅샷으로 저장한다");
    expect(screenSource).toContain("이전 검사에서 AsyncStorage에 남아 있을 수 있는 shareId는 새 공유 스냅샷에 재사용하지 않는다.");
    expect(screenSource).toContain("동일 세션에서만 진행 중인 스냅샷 요청을 재사용한다.");
    expect(screenSource).toContain("getCoupleShareSessionSignature(snapshot.sessionData)");
    expect(screenSource).not.toContain("if (activeShareId) return getUrl(activeShareId);");
  });
});
