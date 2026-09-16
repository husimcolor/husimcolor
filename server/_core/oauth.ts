import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";

import type { Express, Request, Response } from "express";

import { getUserByOpenId, upsertUser } from "../db";

import { ensureCommonAccountForAuthenticatedUser } from "../commerce/account-service";

import { getSessionCookieOptions } from "./cookies";

import { ENV } from "./env";

import { sdk } from "./sdk";

import { registerLegacyAdminRoutes } from "./legacy-admin";



function getQueryParam(req: Request, key: string): string | undefined {
  
  const value = req.query[key];
  
  return typeof value === "string" ? value : undefined;
  
}



function firstForwardedHeader(value: string | string[] | undefined): string | undefined {
  
  if (Array.isArray(value)) return value[0];
  
  return value?.split(",")[0]?.trim();
  
}



export function createOAuthLoginUrl({ appId, redirectUri, portalUrl = "https://manus.im" }: { appId: string; redirectUri: string; portalUrl?: string }): string {
  
  const url = new URL("/app-auth", portalUrl);
  
  url.searchParams.set("appId", appId);
  
  url.searchParams.set("redirectUri", redirectUri);
  
  url.searchParams.set("state", Buffer.from(redirectUri, "utf8").toString("base64"));
  
  url.searchParams.set("type", "signIn");
  
  return url.toString();
  
}



export function getProductionFrontendOrigin(req: Request): string {
  
  const forwardedHost = firstForwardedHeader(req.headers["x-forwarded-host"]);
  
  const host = forwardedHost || req.get("host");
  
  const forwardedProto = firstForwardedHeader(req.headers["x-forwarded-proto"]);
  
  const protocol = forwardedProto || req.protocol || "https";
  
  if (!host) return "https://husimcolor.vercel.app";
  
  return `${protocol}://${host}`;
  
}



async function syncUser(userInfo: { openId?: string | null; name?: string | null; email?: string | null; loginMethod?: string | null; platform?: string | null }) {
  
  if (!userInfo.openId) throw new Error("openId missing from user info");
  
  const lastSignedIn = new Date();
  
  await upsertUser({ openId: userInfo.openId, name: userInfo.name || null, email: userInfo.email ?? null, loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null, lastSignedIn });
  
  const saved = await getUserByOpenId(userInfo.openId);
  
  if (saved) await ensureCommonAccountForAuthenticatedUser(saved);
  
  return saved ?? { openId: userInfo.openId, name: userInfo.name, email: userInfo.email, loginMethod: userInfo.loginMethod ?? null, lastSignedIn };
  
}



function buildUserResponse(user: Awaited<ReturnType<typeof getUserByOpenId>> | { openId: string; name?: string | null; email?: string | null; loginMethod?: string | null; lastSignedIn?: Date | null }) {
  
  return { id: (user as any)?.id ?? null, openId: user?.openId ?? null, name: user?.name ?? null, email: user?.email ?? null, loginMethod: user?.loginMethod ?? null, role: (user as any)?.role ?? "user", lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString() };
  
}



export function registerOAuthRoutes(app: Express) {
  
  void registerLegacyAdminRoutes(app);
  

  
  app.get("/api/auth/login", (req: Request, res: Response) => {
    
    if (!ENV.appId) { res.status(503).json({ error: "OAuth application is not configured" }); return; }
    


































