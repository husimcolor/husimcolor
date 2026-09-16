import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

import { getAdminPassword } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

export const LEGACY_ADMIN_COOKIE_NAME = "husim_legacy_admin";
const LEGACY_ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;

type LegacyAdminPayload = {
  v: 1;
  scope: "legacy-admin";
  exp: number;
};

function base64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function readCookie(req: Pick<Request, "headers">, name: string) {
  const rawCookie = req.headers.cookie;
  const cookie = typeof rawCookie === "string" ? rawCookie : Array.isArray(rawCookie) ? rawCookie[0] : undefined;
  if (!cookie) return undefined;
  return cookie.split(";").map((item: string) => item.trim()).find((item: string) => item.startsWith(name + "="))?.slice(name.length + 1);
}

export function legacyAdminPasswordMatches(expected: string, supplied: string) {
  const expectedValue = Buffer.from(expected, "utf8");
  const suppliedValue = Buffer.from(supplied, "utf8");
  return expectedValue.length === suppliedValue.length && timingSafeEqual(expectedValue, suppliedValue);
}

export function createLegacyAdminSessionToken(secret = ENV.cookieSecret, now = Date.now()) {
  if (secret.length < 32) throw new Error("LEGACY_ADMIN_SESSION_SECRET_NOT_CONFIGURED");
  const payload: LegacyAdminPayload = { v: 1, scope: "legacy-admin", exp: now + LEGACY_ADMIN_SESSION_MS };
  const encoded = base64Url(JSON.stringify(payload));
  return encoded + "." + sign(encoded, secret);
}

export function isLegacyAdminSession(req: Pick<Request, "headers">, secret = ENV.cookieSecret, now = Date.now()) {
  if (secret.length < 32) return false;
  const token = readCookie(req, LEGACY_ADMIN_COOKIE_NAME);
  if (!token) return false;
  const [encoded, signature, ...rest] = token.split(".");
  if (!encoded || !signature || rest.length > 0) return false;
  const expectedSignature = sign(encoded, secret);
  const actual = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const payload = JSON.parse(decodeBase64Url(encoded)) as LegacyAdminPayload;
    return payload.v === 1 && payload.scope === "legacy-admin" && Number.isFinite(payload.exp) && payload.exp > now;
  } catch {
    return false;
  }
}

export async function registerLegacyAdminRoutes(app: { get: Function; post: Function }) {
  app.get("/api/auth/legacy-admin-session", (req: Request, res: Response) => {
    res.json({ authenticated: isLegacyAdminSession(req) });
  });

  app.post("/api/auth/legacy-admin-login", async (req: Request, res: Response) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const expectedPassword = await getAdminPassword();
    if (!legacyAdminPasswordMatches(expectedPassword, password)) {
      res.status(401).json({ authenticated: false, error: "INVALID_ADMIN_PASSWORD" });
      return;
    }

    const token = createLegacyAdminSessionToken();
    res.cookie(LEGACY_ADMIN_COOKIE_NAME, token, {
      ...getSessionCookieOptions(req),
      maxAge: LEGACY_ADMIN_SESSION_MS,
    });
    res.json({ authenticated: true });
  });

  app.post("/api/auth/legacy-admin-logout", (req: Request, res: Response) => {
    res.clearCookie(LEGACY_ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    res.json({ authenticated: false });
  });
}
