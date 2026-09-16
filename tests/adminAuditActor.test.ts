import { describe, expect, it } from "vitest";
import { resolveAdminAuditActor } from "../server/commerce/admin-audit-actor";

describe("관리자 감사 주체", () => {
  it("기존 비밀번호 세션은 개인정보 없이 명시적인 감사 주체로 기록한다", () => {
    expect(resolveAdminAuditActor({ adminUserId: null, legacyAdmin: true })).toEqual({
      adminUserId: null,
      subject: "legacy_password_admin",
    });
  });

  it("정식 관리자 계정은 기존 사용자 식별자를 계속 사용한다", () => {
    expect(resolveAdminAuditActor({ adminUserId: 7, legacyAdmin: false })).toEqual({
      adminUserId: 7,
      subject: "authenticated_admin",
    });
  });
});
