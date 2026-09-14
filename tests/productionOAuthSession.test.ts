import { describe, expect, it } from "vitest";

import { getParentDomain, getSessionCookieOptions } from "../server/_core/cookies";
import { createOAuthLoginUrl, getProductionFrontendOrigin } from "../server/_core/oauth";

function request(overrides: Record<string, unknown> = {}) {
  return {
    hostname: "husimcolor.vercel.app",
    protocol: "http",
    headers: { "x-forwarded-proto": "https" },
    get: (name: string) => (name === "host" ? "husimcolor.vercel.app" : undefined),
    ...overrides,
  } as any;
}

describe("production OAuth session policy", () => {
  it("uses a host-only cookie on Vercel public domains", () => {
    expect(getParentDomain("husimcolor.vercel.app")).toBeUndefined();
    expect(getSessionCookieOptions(request())).toMatchObject({
      domain: undefined,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
  });

  it("keeps a shared cookie parent for sandbox sibling ports", () => {
    expect(getParentDomain("8081-example.sg2.manus.computer")).toBe(".manus.computer");
  });

  it("returns to the host that initiated a Production OAuth login", () => {
    expect(getProductionFrontendOrigin(request({
      headers: { "x-forwarded-host": "husimcolor.vercel.app", "x-forwarded-proto": "https" },
    }))).toBe("https://husimcolor.vercel.app");
  });

  it("constructs the web login URL from server-only OAuth configuration", () => {
    const url = new URL(createOAuthLoginUrl({
      appId: "app_123",
      redirectUri: "https://husimcolor.vercel.app/api/oauth/callback",
    }));
    expect(url.origin).toBe("https://manus.im");
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("appId")).toBe("app_123");
    expect(url.searchParams.get("redirectUri")).toBe("https://husimcolor.vercel.app/api/oauth/callback");
  });
});
