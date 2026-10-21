import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");
const vercelAuthHandler = readFileSync(resolve(process.cwd(), "api/auth/[...action].ts"), "utf8");
const adminScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/admin.tsx"), "utf8");
const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/deploy.yml"), "utf8");

describe("숨김 관리자 심볼 진입", () => {
  it("심볼 전체 영역을 첫 탭부터 5초 안에 5회 탭해야 OAuth가 아닌 기존 비밀번호 관리자 탭으로 이동한다", () => {
    expect(homeScreen).toContain("const ADMIN_LOGO_TAP_COUNT_REQUIRED = 5");
    expect(homeScreen).toContain("const ADMIN_LOGO_TAP_WINDOW_MS = 5000");
    expect(homeScreen).toContain("const ADMIN_LOGO_DUPLICATE_TAP_GUARD_MS = 120");
    expect(homeScreen).toContain("const adminLogoTapCount = useRef(0)");
    expect(homeScreen).toContain("const adminLogoLastTapAt = useRef(0)");
    expect(homeScreen).toContain("const adminLogoNavigationInProgress = useRef(false)");
    expect(homeScreen).toContain("if (adminLogoNavigationInProgress.current) return");
    expect(homeScreen).toContain("if (now - adminLogoLastTapAt.current < ADMIN_LOGO_DUPLICATE_TAP_GUARD_MS) return");
    expect(homeScreen).toContain("if (adminLogoTapCount.current >= ADMIN_LOGO_TAP_COUNT_REQUIRED)");
    expect(homeScreen).toContain("setTimeout(clearAdminLogoTapWindow, ADMIN_LOGO_TAP_WINDOW_MS)");
    expect(homeScreen).toContain("onPress={handleAdminLogoTap}");
    expect(homeScreen).toContain("hitSlop={6}");
    expect(homeScreen).toContain("router.push('/admin' as any)");
    expect(homeScreen).not.toContain("onLongPress={handleAdminLogoLongPress}");
    expect(homeScreen).not.toContain("delayLongPress=");
    expect(homeScreen).not.toContain("startOAuthLogin");
  });

  it("일반 사용자 홈에는 눈에 보이는 관리자 링크나 route 버튼이 없다", () => {
    expect(homeScreen).not.toContain("관리자 링크 - 하단");
    expect(homeScreen).not.toContain("styles.adminLink");
    expect(homeScreen).not.toContain("adminLinkText");
    expect(homeScreen).not.toContain("router.push('/(tabs)/admin' as any)");
  });

  it("Vercel 인증 함수 원본이 기존 비밀번호 관리자 세션 경로를 등록한다", () => {
    expect(vercelAuthHandler).toContain('import { registerLegacyAdminRoutes } from "../../server/_core/legacy-admin";');
    expect(vercelAuthHandler).toContain("registerLegacyAdminRoutes(app);");
  });

  it("관리자 화면은 OAuth가 아닌 기존 비밀번호 로그인만 제공한다", () => {
    expect(adminScreen).toContain("비밀번호로 로그인");
    expect(adminScreen).toContain("서버 서명된 통합 관리자 세션");
    expect(adminScreen).toContain("홈 심볼을 첫 터치부터 5초 안에 5회 연속 탭해");
    expect(adminScreen).not.toContain("홈 심볼을 2초 안에 5회 연속 탭해");
    expect(adminScreen).not.toContain("startOAuthLogin");
  });

  it("커플 코칭 전체 세션 테스트 준비는 인증된 관리자 화면에서만 제공한다", () => {
    expect(adminScreen).toContain("if (!hasAdminAccess) return");
    expect(adminScreen).toContain("💑 커플 코칭 전체 세션 테스트");
    expect(adminScreen).toContain("💑 커플 코칭 테스트 준비하기");
    expect(adminScreen).toContain('setTrialProduct("couple_love_deep")');
    expect(adminScreen).toContain('setTab("상품·쿠폰")');
    expect(homeScreen).not.toContain("💑 커플 코칭 테스트 준비하기");
  });

  it("명시적 prebuilt Functions가 기존 관리자 URI만 처리한다", () => {
    expect(workflow).toContain('"/api/auth/legacy-admin-login"');
    expect(workflow).toContain('"/api/auth/legacy-admin-session"');
    expect(workflow).toContain('"/api/auth/legacy-admin-logout"');
    expect(workflow).not.toContain('npx esbuild "api/auth/[...action].ts"');
    expect(workflow).not.toContain("legacyAdminRoute");
  });
});
