import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const homeScreen = readFileSync(resolve(process.cwd(), "app/(tabs)/index.tsx"), "utf8");

describe("기존 관리자 심볼 진입", () => {
  it("심볼 5회 탭은 OAuth가 아닌 기존 비밀번호 관리자 탭으로 이동한다", () => {
    expect(homeScreen).toContain("if (newCount >= 5)");
    expect(homeScreen).toContain("router.push('/(tabs)/admin' as any)");
    expect(homeScreen).not.toContain("router.push('/admin' as any)");
    expect(homeScreen).not.toContain("startOAuthLogin");
  });

  it("일반 사용자 화면에는 별도 관리자 링크를 노출하지 않는다", () => {
    expect(homeScreen).not.toContain("{/* 관리자 링크 - 하단 */}");
    expect(homeScreen).not.toContain("style={styles.adminLink}");
  });
});
