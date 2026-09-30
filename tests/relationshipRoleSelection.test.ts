import { describe, expect, it } from "vitest";

import {
  getRelationshipRoleOptions,
  isRelationshipRolePairValid,
  resolveRoleBasedRelationType,
} from "../constants/coupleData";

describe("각자 휴대폰 관계 검사 역할 선택", () => {
  it("부부·연인 역할은 성별과 실제 관계에 맞게 제한한다", () => {
    expect(getRelationshipRoleOptions("부부", "남성")).toEqual(["남편"]);
    expect(getRelationshipRoleOptions("부부", "여성", "남편")).toEqual(["아내"]);
    expect(getRelationshipRoleOptions("연인", "여성", "남자친구")).toEqual(["여자친구"]);
  });

  it("부모·자녀 역할은 결제·검사 순서와 무관하게 실제 역할을 보존한다", () => {
    expect(getRelationshipRoleOptions("부모-자녀", "여성")).toEqual(["엄마", "딸"]);
    expect(getRelationshipRoleOptions("부모-자녀", "여성", "아들")).toEqual(["엄마"]);
    expect(getRelationshipRoleOptions("부모-자녀", "남성", "엄마")).toEqual(["아들"]);
    expect(resolveRoleBasedRelationType("부모-자녀", "딸", "엄마")).toBe("엄마-딸");
  });

  it("서로 맞지 않는 역할 조합은 서버에서 거절할 수 있다", () => {
    expect(isRelationshipRolePairValid("부부", "남편", "아내")).toBe(true);
    expect(isRelationshipRolePairValid("부부", "남편", "여자친구")).toBe(false);
    expect(isRelationshipRolePairValid("부모-자녀", "엄마", "딸")).toBe(true);
    expect(isRelationshipRolePairValid("부모-자녀", "아들", "딸")).toBe(false);
  });
});
