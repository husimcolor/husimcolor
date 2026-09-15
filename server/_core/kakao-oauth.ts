import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";

import { getUserByEmail, getUserByOpenId, upsertUser } from "../db";
import { ensureCommonAccountForAuthenticatedUser } from "../commerce/account-service";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { getProductionFrontendOrigin } from "./oauth";
import { sdk } from "./sdk";

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";
const KAKAO_STATE_COOKIE = "husim_kakao_state";
const KAKAO_STATE_TTL_MS = 10 * 60 * 1000;

export const KAKAO_CALLBACK_PATH = "/api/auth/kakao/callback";
const DEFAULT_KAKAO_REDIRECT_ORIGIN = "https://husimcolor.vercel.app";

type KakaoState = {
  issuedAt: number;
  nonce: string;
  returnTo: string;
};

type KakaoUserResponse = {
  id?: number | string;
  kakao_account?: {
    email?: string;
    is_email_valid?: boolean;
    is_email_verified?: boolean;
    profile?: { nickname?: string };
  };
};

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signState(payload: string) {
  return createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
}

export function isKakaoLoginEnabled(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
) {
  return Boolean(
    env.KAKAO_LOGIN_ENABLED === "true" &&
      env.KAKAO_REST_API_KEY &&
      env.KAKAO_CLIENT_SECRET &&
      env.JWT_SECRET,
  );
}

export function normalizeReturnTo(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export function createKakaoState(returnTo: string, now = Date.now()) {
  const state: KakaoState = {
    issuedAt: now,
    nonce: randomBytes(24).toString("base64url"),
    returnTo: normalizeReturnTo(returnTo),
  };
  const payload = base64Url(JSON.stringify(state));
  return `${payload}.${signState(payload)}`;
}

export function parseKakaoState(value: string | undefined, now = Date.now()): KakaoState | null {
  if (!value) return null;
  const [payload, signature, ...rest] = value.split(".");
  if (!payload || !signature || rest.length > 0 || !safeEqual(signature, signState(payload))) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as KakaoState;
    if (
      !decoded ||
      typeof decoded.issuedAt !== "number" ||
      typeof decoded.nonce !== "string" ||
      decoded.nonce.length < 20 ||
      now - decoded.issuedAt > KAKAO_STATE_TTL_MS ||
      decoded.issuedAt > now + 60_000
    ) {
      return null;
    }
    return { ...decoded, returnTo: normalizeReturnTo(decoded.returnTo) };
  } catch {
    return null;
  }
}

/**
 * 카카오는 사전에 등록된 URI만 허용하므로 변동하는 Preview 호스트가 아니라
 * 공통 인증 앱의 고정 도메인을 사용한다. 필요하면 서버 환경변수로만 변경한다.
 */
export function getKakaoRedirectUri() {
  const configuredOrigin = process.env.KAKAO_REDIRECT_ORIGIN?.trim().replace(/\/+$/, "");
  return `${configuredOrigin || DEFAULT_KAKAO_REDIRECT_ORIGIN}${KAKAO_CALLBACK_PATH}`;
}

export function createKakaoAuthorizeUrl(input: { redirectUri: string; state: string }) {
  const url = new URL(KAKAO_AUTHORIZE_URL);
  url.searchParams.set("client_id", process.env.KAKAO_REST_API_KEY ?? "");
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", input.state);
  // 두 항목은 카카오 콘솔에서 선택 동의로 설정한다. 제공하지 않아도 로그인은 완료된다.
  url.searchParams.set("scope", "profile_nickname,account_email");
  return url.toString();
}

async function exchangeKakaoCode(code: string, redirectUri: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: redirectUri,
    code,
    client_secret: process.env.KAKAO_CLIENT_SECRET ?? "",
  });
  const response = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  if (!response.ok) throw new Error("KAKAO_TOKEN_EXCHANGE_FAILED");
  const payload = (await response.json()) as { access_token?: string };
  if (!payload.access_token) throw new Error("KAKAO_ACCESS_TOKEN_MISSING");
  return payload.access_token;
}

async function getKakaoUser(accessToken: string): Promise<KakaoUserResponse> {
  const response = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("KAKAO_USER_LOOKUP_FAILED");
  const user = (await response.json()) as KakaoUserResponse;
  if (user.id === undefined || user.id === null) throw new Error("KAKAO_SUBJECT_MISSING");
  return user;
}

async function syncKakaoUser(kakaoUser: KakaoUserResponse) {
  const subject = String(kakaoUser.id);
  const openId = `kakao:${subject}`;
  const account = kakaoUser.kakao_account;
  const verifiedEmail =
    account?.email && account.is_email_valid === true && account.is_email_verified === true
      ? account.email
      : null;
  const name = account?.profile?.nickname ?? "카카오 사용자";

  // 검증된 이메일로 기존 회원을 찾을 때만 같은 canonical users.id에 카카오 식별자를 추가한다.
  // 이력 연결은 account-service가 동일 이메일과 단일 계정 조건을 다시 확인한다.
  let user = await getUserByOpenId(openId);
  if (!user && verifiedEmail) user = await getUserByEmail(verifiedEmail);
  if (!user) {
    await upsertUser({
      openId,
      name,
      email: verifiedEmail,
      loginMethod: "kakao",
      lastSignedIn: new Date(),
    });
    user = await getUserByOpenId(openId);
  } else {
    await upsertUser({
      openId: user.openId,
      name: user.name || name,
      email: user.email ?? verifiedEmail,
      lastSignedIn: new Date(),
    });
    user = await getUserByOpenId(user.openId);
  }
  if (!user) throw new Error("KAKAO_USER_SYNC_FAILED");
  await ensureCommonAccountForAuthenticatedUser(user, { provider: "kakao", providerSubject: subject });
  return user;
}

function redirectWithError(res: Response, origin: string, returnTo: string, error: string) {
  const destination = new URL(returnTo, origin);
  destination.searchParams.set("loginError", error);
  res.redirect(302, destination.toString());
}

export function registerKakaoOAuthRoutes(app: Express) {
  app.get("/api/auth/kakao/login", (req, res) => {
    if (!isKakaoLoginEnabled()) {
      res.status(404).json({ error: "Kakao login is not enabled" });
      return;
    }
    const state = createKakaoState(normalizeReturnTo(req.query.returnTo));
    res.cookie(KAKAO_STATE_COOKIE, state, {
      ...getSessionCookieOptions(req),
      sameSite: "lax",
      maxAge: KAKAO_STATE_TTL_MS,
    });
    res.redirect(302, createKakaoAuthorizeUrl({ redirectUri: getKakaoRedirectUri(), state }));
  });

  app.get(KAKAO_CALLBACK_PATH, async (req, res) => {
    const origin = getProductionFrontendOrigin(req);
    const state = typeof req.query.state === "string" ? req.query.state : undefined;
    const savedState = parseCookieHeader(req.headers.cookie ?? "")[KAKAO_STATE_COOKIE];
    const parsedState = parseKakaoState(state);
    const returnTo = parsedState?.returnTo ?? "/";
    res.clearCookie(KAKAO_STATE_COOKIE, { ...getSessionCookieOptions(req), sameSite: "lax" });
    if (!isKakaoLoginEnabled() || !parsedState || !savedState || !safeEqual(state ?? "", savedState)) {
      redirectWithError(res, origin, returnTo, "kakao_state_invalid");
      return;
    }
    const code = typeof req.query.code === "string" ? req.query.code : undefined;
    if (!code) {
      redirectWithError(res, origin, returnTo, "kakao_authorization_cancelled");
      return;
    }
    try {
      const accessToken = await exchangeKakaoCode(code, getKakaoRedirectUri());
      const user = await syncKakaoUser(await getKakaoUser(accessToken));
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "카카오 사용자",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, new URL(returnTo, origin).toString());
    } catch (error) {
      console.error("[Kakao OAuth] callback failed", error instanceof Error ? error.message : error);
      redirectWithError(res, origin, returnTo, "kakao_login_failed");
    }
  });
}
