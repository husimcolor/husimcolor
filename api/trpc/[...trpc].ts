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
import type { VercelRequest, VercelResponse } from "@vercel/node";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
