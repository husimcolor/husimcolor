import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Kakao OAuth prebuilt deployment contract", () => {
  const workflow = read(".github/workflows/deploy.yml");
  const handler = read("api/auth/kakao/_handler.ts");
  const login = read("api/auth/kakao/login.ts");
  const callback = read("api/auth/kakao/callback.ts");

  it("emits only dedicated Kakao login and callback functions", () => {
    expect(workflow).toContain('mkdir -p ".vercel/output/functions/api/auth/kakao/login.func"');
    expect(workflow).toContain('mkdir -p ".vercel/output/functions/api/auth/kakao/callback.func"');
    expect(workflow).toContain('npx esbuild "api/auth/kakao/login.ts"');
    expect(workflow).toContain('npx esbuild "api/auth/kakao/callback.ts"');
    expect(workflow).toContain('api/auth/kakao/login.func/.vc-config.json');
    expect(workflow).toContain('api/auth/kakao/callback.func/.vc-config.json');
    expect(workflow).not.toContain('npx esbuild "api/auth/[...action].ts"');
  });

  it("reuses the existing Kakao OAuth route registration without new auth semantics", () => {
    expect(handler).toContain('registerKakaoOAuthRoutes(app);');
    expect(handler).not.toContain("createSessionToken(");
    expect(handler).not.toContain("ensureCommonAccountForAuthenticatedUser(");
    expect(login).toContain('createKakaoOAuthHandler("/api/auth/kakao/login")');
    expect(callback).toContain('createKakaoOAuthHandler("/api/auth/kakao/callback")');
  });

  it("keeps function discovery ahead of the SPA fallback", () => {
    const filesystemIndex = workflow.indexOf('{ "handle": "filesystem" }');
    const fallbackIndex = workflow.indexOf('{ "src": "/((?!_expo/|assets/).*)", "dest": "/index.html" }');
    expect(filesystemIndex).toBeGreaterThan(-1);
    expect(fallbackIndex).toBeGreaterThan(filesystemIndex);
  });

  it("uses the same prebuilt artifact for Preview pull requests without Production deployment", () => {
    expect(workflow).toContain("pull_request:");
    expect(workflow).toContain('if [ "${{ github.event_name }}" = "push" ]; then');
    expect(workflow).toContain("vercel deploy --prebuilt --prod");
    expect(workflow).toContain("vercel deploy --prebuilt --token");
  });
});
