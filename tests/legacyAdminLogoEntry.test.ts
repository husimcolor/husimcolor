import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const vercelAuthHandler = readFileSync(resolve(process.cwd(), "api/auth/[...action].ts"), "utf8");
const adminScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/admin.tsx"), "utf8");
const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/deploy.yml"), "utf8");

describe("기존 관리자 심볼 진입", () => {
  it("심볼 5회 탭은 OAuth가 아닌 기존 비밀번호 관리자 탭으로 이동한다", () => {
    expect(homeScreen).toContain("if (newCount >= 5)");
    expect(homeScreen).toContain("router.push('/admin' as any)");
    expect(homeScreen).not.toContain("startOAuthLogin");
  });

  it("Vercel 인증 함수 원본이 기존 비밀번호 관리자 세션 경로를 등록한다", () => {
    expect(vercelAuthHandler).toContain('import { registerLegacyAdminRoutes } from "../../server/_core/legacy-admin";');
    expect(vercelAuthHandler).toContain("registerLegacyAdminRoutes(app);");
  });

  it("관리자 화면은 OAuth가 아닌 기존 비밀번호 로그인만 제공한다", () => {
    expect(adminScreen).toContain("비밀번호로 로그인");
    expect(adminScreen).toContain("서버 서명된 통합 관리자 세션");
    expect(adminScreen).not.toContain("startOAuthLogin");
  });

  it("명시적 prebuilt Functions가 기존 관리자 URI만 처리한다", () => {
    expect(workflow).toContain('"/api/auth/legacy-admin-login"');
    expect(workflow).toContain('"/api/auth/legacy-admin-session"');
    expect(workflow).toContain('"/api/auth/legacy-admin-logout"');
    expect(workflow).not.toContain('npx esbuild "api/auth/[...action].ts"');
    expect(workflow).not.toContain("legacyAdminRoute");
  });
});
