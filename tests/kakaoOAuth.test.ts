import { describe, expect, it } from "vitest";

import {
  createKakaoAuthorizeUrl,
  createKakaoState,
  getKakaoRedirectUri,
  isKakaoLoginEnabled,
  normalizeReturnTo,
  parseKakaoState,
} from "../server/_core/kakao-oauth";

describe("Kakao OAuth configuration", () => {
  it("only enables the flow with explicit true and both server-side credentials", () => {
    expect(isKakaoLoginEnabled({ KAKAO_LOGIN_ENABLED: "false", KAKAO_REST_API_KEY: "key", KAKAO_CLIENT_SECRET: "secret", JWT_SECRET: "jwt" })).toBe(false);
    expect(isKakaoLoginEnabled({ KAKAO_LOGIN_ENABLED: "true", KAKAO_REST_API_KEY: "key", KAKAO_CLIENT_SECRET: "secret", JWT_SECRET: "jwt" })).toBe(true);
  });

  it("keeps return paths on the current site and rejects open redirects", () => {
    expect(normalizeReturnTo("/mypage")).toBe("/mypage");
    expect(normalizeReturnTo("https://example.com")).toBe("/");
    expect(normalizeReturnTo("//example.com")).toBe("/");
  });

  it("signs state and rejects expired or modified values", () => {
    const state = createKakaoState("/mypage", 1_000);
    expect(parseKakaoState(state, 2_000)).toMatchObject({ returnTo: "/mypage" });
    expect(parseKakaoState(`${state}x`, 2_000)).toBeNull();
    expect(parseKakaoState(state, 1_000 + 10 * 60 * 1000 + 1)).toBeNull();
  });

  it("builds a REST authorization URL without exposing the client secret", () => {
    const original = process.env.KAKAO_REST_API_KEY;
    process.env.KAKAO_REST_API_KEY = "rest-key-for-test";
    const url = new URL(createKakaoAuthorizeUrl({ redirectUri: "https://husimcolor.vercel.app/api/auth/kakao/callback", state: "state" }));
    expect(url.origin).toBe("https://kauth.kakao.com");
    expect(url.searchParams.get("client_id")).toBe("rest-key-for-test");
    expect(url.searchParams.get("client_secret")).toBeNull();
    expect(url.searchParams.get("redirect_uri")).toBe("https://husimcolor.vercel.app/api/auth/kakao/callback");
    if (original === undefined) delete process.env.KAKAO_REST_API_KEY;
    else process.env.KAKAO_REST_API_KEY = original;
  });

  it("uses the registered fixed app callback origin instead of a changing Preview host", () => {
    expect(getKakaoRedirectUri()).toBe("https://husimcolor.vercel.app/api/auth/kakao/callback");
  });
});
