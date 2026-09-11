import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PARENT_CHILD_PRIORITY_PILOT,
  PARENT_CHILD_PRIORITY_PILOT_QUERY,
  PARENT_CHILD_PRIORITY_PILOT_SESSION,
} from "../lib/parent-child-priority-pilot";

describe("엄마·딸 우선순위 기반 시범 결과 UI", () => {
  it("고정 QA 입력과 1·2순위 생활기질·3순위 회복 방향·심리카드 보완 근거를 보존한다", () => {
    expect(PARENT_CHILD_PRIORITY_PILOT_QUERY).toBe("mother-daughter-priority-pilot-20260911");
    expect(PARENT_CHILD_PRIORITY_PILOT_SESSION.relationType).toBe("엄마-딸");
    expect(PARENT_CHILD_PRIORITY_PILOT_SESSION.personA.colors).toEqual(["green", "sage", "lavender"]);
    expect(PARENT_CHILD_PRIORITY_PILOT_SESSION.personB.colors).toEqual(["yellow", "pink", "coral"]);
    expect(PARENT_CHILD_PRIORITY_PILOT_SESSION.personA.cards).toEqual(["red_circle", "white_square", "blue_diamond"]);
    expect(PARENT_CHILD_PRIORITY_PILOT_SESSION.personB.cards).toEqual(["yellow_circle", "purple_diamond", "green_hexagon"]);
    expect(PARENT_CHILD_PRIORITY_PILOT.basis.parent).toContain("그린·세이지그린");
    expect(PARENT_CHILD_PRIORITY_PILOT.basis.child).toContain("옐로우·핑크");
    expect(PARENT_CHILD_PRIORITY_PILOT.basis.recovery).toContain("라벤더");
    expect(PARENT_CHILD_PRIORITY_PILOT.basis.recovery).toContain("코랄");
    expect(PARENT_CHILD_PRIORITY_PILOT.lifeScenes.strengths).toHaveLength(2);
    expect(PARENT_CHILD_PRIORITY_PILOT.lifeScenes.tensions).toHaveLength(2);
  });

  it("시범 UI는 개발 환경의 고정 QA 경로에서만 부모·자녀 결과 UI에 표시한다", () => {
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(screenSource).toContain("process.env.NODE_ENV !== 'production'");
    expect(screenSource).toContain("PARENT_CHILD_PRIORITY_PILOT_QUERY");
    expect(screenSource).toContain("로컬 시범 분석 · Production에는 적용되지 않음");
    expect(screenSource).toContain("실제 생활에서 만나는 지점");
    expect(screenSource).toContain("잘 맞는 부분과 부딪히는 부분");
  });
});
