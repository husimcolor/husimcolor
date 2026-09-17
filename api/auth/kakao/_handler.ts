import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { registerKakaoOAuthRoutes } from "../../../server/_core/kakao-oauth";

const app = express();
app.use(express.json({ limit: "8kb" }));
registerKakaoOAuthRoutes(app);

/**
 * Vercel은 dedicated function의 request URL을 pathname 또는 `/`로 제공할 수 있다.
 * 각 public OAuth entrypoint는 자신이 처리할 기존 pathname만 복원한 뒤,
 * 기존 Express route 등록기를 그대로 사용한다.
 */
export function createKakaoOAuthHandler(pathname: "/api/auth/kakao/login" | "/api/auth/kakao/callback") {
  return function handler(req: VercelRequest, res: VercelResponse) {
    const requestUrl = req.url ?? "/";
    if (requestUrl === "/" || requestUrl.startsWith("?")) {
      req.url = `${pathname}${requestUrl === "/" ? "" : requestUrl}`;
    }
    return app(req as any, res as any);
  };
}
