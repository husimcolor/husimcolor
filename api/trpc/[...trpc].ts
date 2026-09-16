/**
 * Vercel Serverless Function - tRPC API Handler
 * 
 * 이 파일은 Vercel 배포 환경에서 /api/trpc/* 경로의 요청을 처리합니다.
 * DB에 직접 연결하여 데이터를 반환합니다.
 */
import "dotenv/config";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";
import { createOAuthLoginUrl, getProductionFrontendOrigin } from "../../server/_core/oauth";
import { registerLegacyAdminRoutes } from "../../server/_core/legacy-admin";
import { ENV } from "../../server/_core/env";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerLegacyAdminRoutes(app);

// CORS 설정
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// This route intentionally lives under /api/trpc because the current Vercel
// prebuilt workflow already routes that prefix to this serverless function.
// It avoids relying on build-time EXPO_PUBLIC OAuth variables in Expo output.
app.get("/api/trpc/auth-login", (req, res) => {
  if (!ENV.appId) {
    res.status(503).json({ error: "OAuth application is not configured" });
    return;
  }

  const origin = getProductionFrontendOrigin(req);
  const redirectUri = `${origin}/api/oauth/callback`;
  res.json({
    url: createOAuthLoginUrl({
      appId: ENV.appId,
      redirectUri,
      portalUrl: process.env.OAUTH_PORTAL_URL || "https://manus.im",
    }),
  });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export default function handler(req: VercelRequest, res: VercelResponse) {
  // /api/trpc/[...trpc] -> req.url을 /api/trpc/xxx 형태로 변환
  return app(req as any, res as any);
}
