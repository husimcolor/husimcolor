import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 입금 기록 API
  payments: router({
    create: publicProcedure
      .input(z.object({
        senderName: z.string().min(1).max(100),
        contact: z.string().min(1).max(100),
        depositorName: z.string().min(1).max(100),
        amount: z.number().int().default(30000),
      }))
      .mutation(({ input }) => {
        return db.createPaymentRecord(input);
      }),
    list: publicProcedure.query(() => {
      return db.getPaymentRecords();
    }),
    updateStatus: publicProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(['pending', 'confirmed', 'rejected']),
        memo: z.string().max(500).optional(),
      }))
      .mutation(({ input }) => {
        return db.updatePaymentStatus(input.id, input.status, input.memo);
      }),
  }),

  // 방문자 수 추적 API
  visitors: router({
    log: publicProcedure
      .input(z.object({
        deviceId: z.string().min(1).max(128),
        visitType: z.enum(['home', 'free_trial', 'premium']),
      }))
      .mutation(({ input }) => {
        return db.logVisitor(input);
      }),
    stats: publicProcedure.query(() => {
      return db.getVisitorStats();
    }),
  }),

  // 후기 API
  reviews: router({
    list: publicProcedure.query(() => {
      return db.getReviews();
    }),
    stats: publicProcedure.query(() => {
      return db.getReviewStats();
    }),
    create: publicProcedure
      .input(z.object({
        nickname: z.string().min(1).max(50),
        rating: z.number().int().min(1).max(5),
        content: z.string().max(500).default(''),
        tags: z.string().max(255).optional(),
        colorCombo: z.string().max(100).optional(),
      }))
      .mutation(({ input }) => {
        return db.createReview(input);
      }),
    update: publicProcedure
      .input(z.object({
        id: z.number().int(),
        rating: z.number().int().min(1).max(5).optional(),
        content: z.string().max(500).optional(),
        tags: z.string().max(255).optional(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateReview(id, data);
      }),
    delete: publicProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ input }) => {
        return db.deleteReview(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
