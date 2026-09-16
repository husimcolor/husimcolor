import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const adminScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/admin.tsx"), "utf8");

describe("Preview 관리자 인증 화면", () => {
  it("외부 Redirect URI 설정이 없는 환경에서는 비밀번호 기반 통합 관리자 진입만 제공한다", () => {
    expect(adminScreen).toContain("통합 관리자 로그인");
    expect(adminScreen).toContain("서버 서명된 통합 관리자 세션");
    expect(adminScreen).toContain("비밀번호로 로그인");
    expect(adminScreen).not.toContain("Manus OAuth 운영자 로그인");
    expect(adminScreen).not.toContain("startOAuthLogin");
  });
});
