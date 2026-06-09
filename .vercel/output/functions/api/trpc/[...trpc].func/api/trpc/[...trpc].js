"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
/**
 * Vercel Serverless Function - tRPC API Handler
 *
 * 이 파일은 Vercel 배포 환경에서 /api/trpc/* 경로의 요청을 처리합니다.
 * DB에 직접 연결하여 데이터를 반환합니다.
 */
require("dotenv/config");
const express_1 = require("@trpc/server/adapters/express");
const express_2 = __importDefault(require("express"));
const routers_1 = require("../../server/routers");
const context_1 = require("../../server/_core/context");
const app = (0, express_2.default)();
app.use(express_2.default.json({ limit: "50mb" }));
app.use(express_2.default.urlencoded({ limit: "50mb", extended: true }));
// CORS 설정
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
        res.sendStatus(200);
        return;
    }
    next();
});
app.use("/api/trpc", (0, express_1.createExpressMiddleware)({
    router: routers_1.appRouter,
    createContext: context_1.createContext,
}));
function handler(req, res) {
    // /api/trpc/[...trpc] -> req.url을 /api/trpc/xxx 형태로 변환
    return app(req, res);
}
//# sourceMappingURL=%5B...trpc%5D.js.map