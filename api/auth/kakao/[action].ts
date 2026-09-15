import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { registerKakaoOAuthRoutes } from "../../../server/_core/kakao-oauth";

const app = express();
registerKakaoOAuthRoutes(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
