"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const zod_1 = require("zod");
const const_js_1 = require("../shared/const.js");
const cookies_1 = require("./_core/cookies");
const systemRouter_1 = require("./_core/systemRouter");
const trpc_1 = require("./_core/trpc");
const db = __importStar(require("./db"));
exports.appRouter = (0, trpc_1.router)({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
    system: systemRouter_1.systemRouter,
    auth: (0, trpc_1.router)({
        me: trpc_1.publicProcedure.query((opts) => opts.ctx.user),
        logout: trpc_1.publicProcedure.mutation(({ ctx }) => {
            const cookieOptions = (0, cookies_1.getSessionCookieOptions)(ctx.req);
            ctx.res.clearCookie(const_js_1.COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
            return {
                success: true,
            };
        }),
    }),
    // 관리자 인증 API (DB 기반 - 브라우저 무관)
    admin: (0, trpc_1.router)({
        // 비밀번호 검증
        verifyPassword: trpc_1.publicProcedure
            .input(zod_1.z.object({ password: zod_1.z.string() }))
            .mutation(async ({ input }) => {
            const correct = await db.getAdminPassword();
            if (input.password !== correct) {
                throw new Error("WRONG_PASSWORD");
            }
            return { success: true };
        }),
        // 비밀번호 변경
        changePassword: trpc_1.publicProcedure
            .input(zod_1.z.object({
            currentPassword: zod_1.z.string(),
            newPassword: zod_1.z.string().min(4).max(100),
        }))
            .mutation(async ({ input }) => {
            const correct = await db.getAdminPassword();
            if (input.currentPassword !== correct) {
                throw new Error("WRONG_PASSWORD");
            }
            await db.setAdminPassword(input.newPassword);
            return { success: true };
        }),
    }),
    // 입금 기록 API
    payments: (0, trpc_1.router)({
        create: trpc_1.publicProcedure
            .input(zod_1.z.object({
            senderName: zod_1.z.string().min(1).max(100),
            contact: zod_1.z.string().min(1).max(100),
            depositorName: zod_1.z.string().min(1).max(100),
            amount: zod_1.z.number().int().default(30000),
        }))
            .mutation(({ input }) => {
            return db.createPaymentRecord(input);
        }),
        list: trpc_1.publicProcedure.query(() => {
            return db.getPaymentRecords();
        }),
        updateStatus: trpc_1.publicProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number().int(),
            status: zod_1.z.enum(['pending', 'confirmed', 'rejected']),
            memo: zod_1.z.string().max(500).optional(),
        }))
            .mutation(({ input }) => {
            return db.updatePaymentStatus(input.id, input.status, input.memo);
        }),
    }),
    // 방문자 수 추적 API
    visitors: (0, trpc_1.router)({
        log: trpc_1.publicProcedure
            .input(zod_1.z.object({
            deviceId: zod_1.z.string().min(1).max(128),
            visitType: zod_1.z.enum([
                'home', 'free_trial', 'premium',
                'free_start', 'free_result',
                'deep_start', 'deep_result',
                'couple_start', 'couple_result',
            ]),
            testType: zod_1.z.string().max(50).optional(),
            relationshipType: zod_1.z.string().max(50).optional(),
            selectedColors: zod_1.z.string().max(255).optional(),
            selectedCards: zod_1.z.string().max(255).optional(),
        }))
            .mutation(({ input }) => {
            return db.logVisitor(input);
        }),
        stats: trpc_1.publicProcedure.query(() => {
            return db.getVisitorStats();
        }),
        testStats: trpc_1.publicProcedure.query(() => {
            return db.getTestSessionStats();
        }),
    }),
    // 후기 API
    reviews: (0, trpc_1.router)({
        list: trpc_1.publicProcedure.query(() => {
            return db.getReviews();
        }),
        stats: trpc_1.publicProcedure.query(() => {
            return db.getReviewStats();
        }),
        create: trpc_1.publicProcedure
            .input(zod_1.z.object({
            nickname: zod_1.z.string().min(1).max(50),
            rating: zod_1.z.number().int().min(1).max(5),
            content: zod_1.z.string().max(500).optional(),
            checkItems: zod_1.z.string().max(500).optional(), // 선택형 체크 항목 (콤마 구분)
            tags: zod_1.z.string().max(255).optional(),
            colorCombo: zod_1.z.string().max(100).optional(),
        }))
            .mutation(({ input }) => {
            return db.createReview(input);
        }),
        update: trpc_1.publicProcedure
            .input(zod_1.z.object({
            id: zod_1.z.number().int(),
            rating: zod_1.z.number().int().min(1).max(5).optional(),
            content: zod_1.z.string().max(500).optional(),
            tags: zod_1.z.string().max(255).optional(),
        }))
            .mutation(({ input }) => {
            const { id, ...data } = input;
            return db.updateReview(id, data);
        }),
        delete: trpc_1.publicProcedure
            .input(zod_1.z.object({ id: zod_1.z.number().int() }))
            .mutation(({ input }) => {
            return db.deleteReview(input.id);
        }),
    }),
});
//# sourceMappingURL=routers.js.map