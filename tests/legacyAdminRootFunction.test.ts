import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rootFunction = readFileSync(resolve(process.cwd(), "api/legacy-admin.ts"), "utf8");
const vercelConfig = readFileSync(resolve(process.cwd(), "vercel.json"), "utf8");

describe("Preview root legacy 관리자 전달 계층", () => {
  it("기존 관리자 3개 URI만 root 함수로 전달한다", () => {
    expect(rootFunction).toContain('"legacy-admin-login"');
    expect(rootFunction).toContain('"legacy-admin-session"');
    expect(rootFunction).toContain('"legacy-admin-logout"');
    expect(rootFunction).toContain('"LEGACY_ADMIN_ROUTE_NOT_FOUND"');
    expect(rootFunction).toContain("registerLegacyAdminRoutes(app)");
    expect(rootFunction).not.toContain("registerOAuthRoutes");
    expect(rootFunction).not.toContain("registerKakaoOAuthRoutes");
  });

  it("Vercel rewrite는 기존 3개 URI에만 root 전달 함수를 사용한다", () => {
    const rootRewriteLines = vercelConfig
      .split("\n")
      .filter((line) => line.includes('"destination": "/api/legacy-admin?action='));

    expect(rootRewriteLines).toHaveLength(3);
    expect(rootRewriteLines.join("\n")).toContain("legacy-admin-login");
    expect(rootRewriteLines.join("\n")).toContain("legacy-admin-session");
    expect(rootRewriteLines.join("\n")).toContain("legacy-admin-logout");
    expect(vercelConfig).toContain('"api/legacy-admin.ts"');
  });
});
