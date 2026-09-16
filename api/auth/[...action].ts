import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { registerKakaoOAuthRoutes } from "../../server/_core/kakao-oauth";
import { registerLegacyAdminRoutes } from "../../server/_core/legacy-admin";
import { registerOAuthRoutes } from "../../server/_core/oauth";

/**
 * Expo 정적 웹 배포에서도 인증 API가 fallback HTML로 전환되지 않도록,
 * Manus·카카오 인증 경로를 같은 Vercel 함수에서 명시적으로 처리한다.
 */
const app = express();
app.use(express.json({ limit: "8kb" }));
registerOAuthRoutes(app);
registerKakaoOAuthRoutes(app);
registerLegacyAdminRoutes(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query.action;
  const requestUrl = req.url ?? "";
  if (!requestUrl.startsWith("/api/auth/") && Array.isArray(action) && action.length > 0) {
    const queryStart = requestUrl.indexOf("?");
    const search = queryStart >= 0 ? requestUrl.slice(queryStart) : "";
    req.url = `/api/auth/${action.join("/")}${search}`;
  }
  return app(req, res);
}
