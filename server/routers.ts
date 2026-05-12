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
    list: protectedProcedure.query(() => {
      return db.getPaymentRecords();
    }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        status: z.enum(['pending', 'confirmed', 'rejected']),
        memo: z.string().max(500).optional(),
      }))
      .mutation(({ input }) => {
        return db.updatePaymentStatus(input.id, input.status, input.memo);
      }),
  }),

  // 후기 API
  reviews: router({
    list: publicProcedure.query(() => {
      return db.getReviews();
    }),
    create: publicProcedure
      .input(z.object({
        nickname: z.string().min(1).max(50),
        rating: z.number().int().min(1).max(5),
        content: z.string().min(1).max(500),
        colorCombo: z.string().max(100).optional(),
      }))
      .mutation(({ input }) => {
        return db.createReview(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
