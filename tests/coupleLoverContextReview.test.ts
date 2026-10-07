import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COUPLE_LOVER_CONTEXT_REVIEW_QUERY,
  COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS,
  getCoupleLoverContextReviewSession,
} from "../lib/couple-lover-context-review";

describe("부부·연인 개발 비교 예시", () => {
  it("같은 컬러·심리카드 입력으로 부부와 연인을 나란히 계산한다", () => {
    const marriage = COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS.marriage;
    const lover = COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS.lover;

    expect(marriage.relationType).toBe("부부");
    expect(lover.relationType).toBe("연인");
    expect(marriage.personA.colors).toEqual(lover.personA.colors);
    expect(marriage.personB.colors).toEqual(lover.personB.colors);
    expect(marriage.personA.cards).toEqual(lover.personA.cards);
    expect(marriage.personB.cards).toEqual(lover.personB.cards);
    expect(marriage.personA.info.relationshipRole).toBe("남편");
    expect(marriage.personB.info.relationshipRole).toBe("아내");
    expect(lover.personA.info.relationshipRole).toBe("남자친구");
    expect(lover.personB.info.relationshipRole).toBe("여자친구");
  });

  it("허용한 두 샘플만 반환하고, 알 수 없는 URL 입력은 거절한다", () => {
    expect(getCoupleLoverContextReviewSession("marriage")).toBe(COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS.marriage);
    expect(getCoupleLoverContextReviewSession("lover")).toBe(COUPLE_LOVER_CONTEXT_REVIEW_SESSIONS.lover);
    expect(getCoupleLoverContextReviewSession("unknown")).toBeNull();
    expect(getCoupleLoverContextReviewSession(undefined)).toBeNull();
  });

  it("결과 화면은 development runtime과 전용 QA 키가 함께 있을 때만 비교 예시를 읽는다", () => {
    const source = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(source).toContain("COUPLE_LOVER_CONTEXT_REVIEW_QUERY");
    expect(source).toContain("process.env.NODE_ENV !== 'production'");
    expect(source).toContain("requestedQa === COUPLE_LOVER_CONTEXT_REVIEW_QUERY");
    expect(source).toContain("같은 컬러·심리카드 조합으로 부부와 연인의 생활 장면만 비교");
    expect(COUPLE_LOVER_CONTEXT_REVIEW_QUERY).toBe("couple-lover-context-review-20261007");
  });
});
