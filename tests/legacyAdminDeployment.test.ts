import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const legacyRoutes = [
  "legacy-admin-login",
  "legacy-admin-session",
  "legacy-admin-logout",
] as const;

describe("legacy administrator prebuilt deployment contract", () => {
  const workflow = read(".github/workflows/deploy.yml");
  const handler = read("api/auth/legacy-admin/_handler.ts");

  it("emits exactly the three existing legacy-admin URIs as dedicated Functions", () => {
    for (const route of legacyRoutes) {
      expect(workflow).toContain(`mkdir -p \".vercel/output/functions/api/auth/${route}.func\"`);
      expect(workflow).toContain(`npx esbuild \"api/auth/${route}.ts\"`);
      expect(workflow).toContain(`api/auth/${route}.func/.vc-config.json`);
      expect(workflow).toContain(`{ \"src\": \"/api/auth/${route}\", \"dest\": \"/api/auth/${route}\" }`);
    }
  });

  it("reuses the original legacy password and session registration without new auth semantics", () => {
    expect(handler).toContain('import { registerLegacyAdminRoutes } from "../../../server/_core/legacy-admin";');
    expect(handler).toContain("registerLegacyAdminRoutes(app);");
    expect(handler).not.toContain("getAdminPassword(");
    expect(handler).not.toContain("createLegacyAdminSessionToken(");
  });

  it("does not emit an auth catch-all or an alias route", () => {
    expect(workflow).not.toContain('npx esbuild "api/auth/[...action].ts"');
    expect(workflow).not.toContain("api/legacy-admin");
    expect(workflow).not.toContain("legacyAdminRoute");
  });

  it("puts the three exact routes ahead of the SPA fallback", () => {
    const fallbackIndex = workflow.indexOf('{ "src": "/((?!_expo/|assets/).*)", "dest": "/index.html" }');
    expect(fallbackIndex).toBeGreaterThan(-1);
    for (const route of legacyRoutes) {
      expect(workflow.indexOf(`{ \"src\": \"/api/auth/${route}\", \"dest\": \"/api/auth/${route}\" }`)).toBeLessThan(fallbackIndex);
    }
  });
});
