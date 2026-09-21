import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { parseCoupleShareSnapshot } from "../shared/couple-share";
import { getCommerceEmailProtectionStatus } from "./commerce/crypto";
import {
  completeTestPayment,
  completeTossTestPayment,
  createTestCheckout,
  createTossTestCheckout,
  isTestPaymentEnabled,
} from "./commerce/order-service";
import { isTossTestPaymentEnabled } from "./commerce/toss-test-provider";
import { getTossCardReviewConfig, isTossCardReviewEnabled } from "./commerce/toss-card-review";
import { isPublicPaidAnalysisEnabled } from "./commerce/release-policy";
import { previewCoupon } from "./commerce/coupon-service";
import { consumeEntitlementForAnalysisStart, verifyAnalysisDeliveryGrant } from "./commerce/entitlement-service";
import {
  deliverAccountLinkOutboxItem,
  deliverPrivatePdfOutboxItem,
  getPrivatePdfOutboxSnapshot,
  processApprovedPreviewOutboxForUser,
  retryFailedPrivatePdfOutboxItem,
} from "./commerce/email-outbox-service";
import {
  confirmGuestCommerceClaim,
  createGuestCommerceClaim,
  ensureCommonAccountForAuthenticatedUser,
  getRestorableGuestCommerceClaim,
  getCommonAccountSnapshot,
  getMemberCommerceDashboard,
  getMemberPrivateDocumentDownload,
} from "./commerce/account-service";
import { isKakaoLoginEnabled } from "./_core/kakao-oauth";
import { createSupportInquiry } from "./commerce/support-service";
import { resolveAdminAuditActor } from "./commerce/admin-audit-actor";
import { getSupportTicketSchemaAudit } from "./commerce/support-ticket-schema-audit";
import {
  deleteAdminReview,
  getAdminCoachingBookingList,
  getAdminCustomerDetail,
  getAdminCustomerList,
  getAdminLegacyPaymentRecords,
  getAdminOperationsDashboard,
  getAdminOrderList,
  getPreviewReadOnlyVerificationSnapshot,
  getAdminReviews,
  getAdminSupportTicketList,
  getAdminCouponOverview,
  updateAdminLegacyPaymentStatus,
  updateAdminSupportTicketStatus,
} from "./commerce/admin-operations-service";
import { getAdminCoachingBookingEvents, updateAdminCoachingBooking } from "./commerce/coaching-booking-service";

/**
 * PDFKit은 Vercel 함수 번들에서 상대 ICC 파일을 해석하지 못할 수 있으므로,
 * 일반 tRPC 요청의 초기 로딩에서는 PDF 생성기를 포함하지 않는다.
 * 실제 PDF 전달 요청에서만 기존 생성기를 불러와 개발·심사용 흐름을 유지한다.
 */
export async function loadPrivatePdfDeliveryService() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("PRIVATE_PDF_DELIVERY_RUNTIME_NOT_ENABLED");
  }
  const sourceModule: string = "./commerce/pdf-delivery-service";
  return import(sourceModule);
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async (opts) => {
      if (opts.ctx.user) await ensureCommonAccountForAuthenticatedUser(opts.ctx.user);
      return opts.ctx.user;
    }),
    kakaoStatus: publicProcedure.query(() => ({ enabled: isKakaoLoginEnabled() })),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 결제 기반의 이메일 암호화 키가 서버에서만 유효한지 확인하는 경량 상태 API.
  // 비밀값·이메일 원문·주문 정보는 절대 반환하지 않는다.
  commerce: router({
    health: publicProcedure.query(() => getCommerceEmailProtectionStatus()),
    support: router({
      submitInquiry: protectedProcedure
        .input(z.object({
          name: z.string().trim().min(1).max(80),
          email: z.string().email().max(320),
          inquiryType: z.enum(["payment_refund", "analysis_result", "pdf_email", "coaching_booking", "other"]),
          subject: z.string().trim().min(2).max(160),
          message: z.string().trim().min(10).max(4000),
        }))
        .mutation(async ({ ctx, input }) => {
          const inquiry = await createSupportInquiry({ user: ctx.user, ...input });
          const { deliverSupportNotificationOutboxItem } = await import("./commerce/email-outbox-service");
          const delivery = await deliverSupportNotificationOutboxItem(inquiry.outboxId);
          return { ...inquiry, delivery };
        }),
    }),
    coupons: router({
      preview: publicProcedure
        .input(z.object({
          couponCode: z.string().min(1).max(64),
          productCode: z.enum(["personal_deep", "couple_love_deep", "parent_child_deep"]),
          listAmountKrw: z.number().int().min(0).max(1_000_000),
        }))
        .query(({ input }) => previewCoupon(input)),
    }),
    entitlement: router({
      consumeForAnalysisStart: publicProcedure
        .input(z.object({
          accessToken: z.string().min(20).max(2048),
          productCode: z.enum(["personal_deep", "couple_love_deep", "parent_child_deep"]),
        }))
        .mutation(({ input }) => consumeEntitlementForAnalysisStart(input)),
    }),
    delivery: router({
      queueAndSendPdf: publicProcedure
        .input(z.object({
          analysisRunId: z.number().int().positive(),
          productCode: z.enum(["personal_deep", "couple_love_deep", "parent_child_deep"]),
          deliveryToken: z.string().min(20).max(2048),
          payload: z.unknown(),
        }))
        .mutation(async ({ input }) => {
          verifyAnalysisDeliveryGrant({
            accessToken: input.deliveryToken,
            analysisRunId: input.analysisRunId,
            productCode: input.productCode,
          });
          const { queuePrivateAnalysisPdfDelivery } = await loadPrivatePdfDeliveryService();
          const queued = await queuePrivateAnalysisPdfDelivery({
            analysisRunId: input.analysisRunId,
            kind: input.productCode,
            payload: input.payload as any,
          });
          const delivery = queued.outboxId
            ? await deliverPrivatePdfOutboxItem(queued.outboxId)
            : { status: "not_claimed" as const };
          return { ...queued, delivery };
        }),
    }),
    adminDelivery: router({
      list: adminProcedure
        .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
        .query(({ input }) => getPrivatePdfOutboxSnapshot(input.limit)),
      retry: adminProcedure
        .input(z.object({ outboxId: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          await retryFailedPrivatePdfOutboxItem(input.outboxId);
          return deliverPrivatePdfOutboxItem(input.outboxId);
        }),
    }),
    account: router({
      snapshot: protectedProcedure.query(async ({ ctx }) => {
        await ensureCommonAccountForAuthenticatedUser(ctx.user);
        return getCommonAccountSnapshot(ctx.user);
      }),
      memberDashboard: protectedProcedure.query(async ({ ctx }) => {
        await ensureCommonAccountForAuthenticatedUser(ctx.user);
        return getMemberCommerceDashboard(ctx.user);
      }),
      downloadPrivateDocument: protectedProcedure
        .input(z.object({ documentId: z.number().int().positive() }))
        .mutation(({ ctx, input }) => getMemberPrivateDocumentDownload(ctx.user, input.documentId)),
      requestGuestClaim: protectedProcedure
        .input(z.object({ email: z.string().email().max(320) }))
        .mutation(async ({ ctx, input }) => {
          const claim = await createGuestCommerceClaim({ user: ctx.user, email: input.email });
          const delivery = await deliverAccountLinkOutboxItem(claim.outboxId);
          return { ...claim, delivery };
        }),
      restorableGuestClaim: protectedProcedure.query(({ ctx }) => getRestorableGuestCommerceClaim(ctx.user)),
      confirmGuestClaim: protectedProcedure
        .input(z.object({ challengeId: z.number().int().positive(), code: z.string().regex(/^\d{6}$/) }))
        .mutation(({ ctx, input }) => confirmGuestCommerceClaim({ user: ctx.user, ...input })),
      processApprovedPreviewOutbox: protectedProcedure
        .mutation(({ ctx }) => processApprovedPreviewOutboxForUser(ctx.user.id)),
    }),
    checkout: router({
      createTest: publicProcedure
        .input(
          z.object({
            productCode: z.enum([
              "personal_deep",
              "couple_love_deep",
              "parent_child_deep",
              "personal_coaching",
              "couple_coaching",
              "relationship_coaching",
            ]),
            email: z.string().email().max(320),
            idempotencyKey: z.string().min(16).max(128),
            couponCode: z.string().min(1).max(64).optional(),
            bookingRequest: z.object({
              contactName: z.string().min(1).max(100),
              contactPhone: z.string().min(8).max(40),
              requestedWindowStart: z.string().datetime({ offset: true }),
              requestedWindowEnd: z.string().datetime({ offset: true }),
              sessionMode: z.enum(["online", "in_person"]),
              notes: z.string().max(2000).optional(),
            }).optional(),
            channel: z.enum(["app", "web"]).optional().default("app"),
          }),
        )
        .mutation(({ input, ctx }) => createTestCheckout({
          ...input,
          userId: ctx.user?.id,
          authenticatedEmail: ctx.user?.email,
        })),
      createTossTest: publicProcedure
        .input(
          z.object({
            productCode: z.enum([
              "personal_deep",
              "couple_love_deep",
              "parent_child_deep",
              "personal_coaching",
              "couple_coaching",
              "relationship_coaching",
            ]),
            email: z.string().email().max(320),
            idempotencyKey: z.string().min(16).max(128),
            couponCode: z.string().min(1).max(64).optional(),
            bookingRequest: z.object({
              contactName: z.string().min(1).max(100),
              contactPhone: z.string().min(8).max(40),
              requestedWindowStart: z.string().datetime({ offset: true }),
              requestedWindowEnd: z.string().datetime({ offset: true }),
              sessionMode: z.enum(["online", "in_person"]),
              notes: z.string().max(2000).optional(),
            }).optional(),
            channel: z.enum(["app", "web"]).optional().default("app"),
          }),
        )
        .mutation(({ input, ctx }) => createTossTestCheckout({
          ...input,
          userId: ctx.user?.id,
          authenticatedEmail: ctx.user?.email,
        })),
      completeTest: publicProcedure
        .input(
          z.object({
            orderNumber: z.string().min(8).max(64),
            providerPaymentId: z.string().min(8).max(160),
            outcome: z.enum(["success", "failed", "cancelled"]),
            amountKrw: z.number().int().min(0).max(1_000_000),
          }),
        )
        .mutation(({ input }) => completeTestPayment(input)),
      completeTossTest: publicProcedure
        .input(
          z.object({
            orderNumber: z.string().min(8).max(64),
            paymentKey: z.string().min(8).max(200),
            amountKrw: z.number().int().min(0).max(1_000_000),
          }),
        )
        .mutation(({ input }) => completeTossTestPayment(input)),
      cardReview: publicProcedure
        .input(z.object({
          productCode: z.enum(["personal_deep", "couple_love_deep", "parent_child_deep"]),
        }))
        .query(({ input }) => getTossCardReviewConfig(input.productCode)),
      testMode: publicProcedure.query(() => ({
        localSimulatorEnabled: isTestPaymentEnabled(),
        tossTestEnabled: isTossTestPaymentEnabled(),
        tossCardReviewEnabled: isTossCardReviewEnabled(),
        paidAnalysisPublicEnabled: isPublicPaidAnalysisEnabled(),
      })),
    }),
  }),

  // 통합 운영 관리 API. 모든 조회·변경은 서버의 users.role=admin을 요구한다.
  admin: router({
    dashboard: adminProcedure.query(() => getAdminOperationsDashboard()),
    orders: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(({ input }) => getAdminOrderList(input.limit)),
    previewVerification: adminProcedure.query(() => getPreviewReadOnlyVerificationSnapshot()),
    supportTicketSchemaAudit: adminProcedure.query(() => getSupportTicketSchemaAudit()),
    customers: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(({ input }) => getAdminCustomerList(input.limit)),
    supportTickets: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
      .query(({ input }) => getAdminSupportTicketList(input.limit)),
    updateSupportTicket: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["received", "reviewing", "answered"]) }))
      .mutation(({ input, ctx }) => {
        const auditActor = resolveAdminAuditActor({ adminUserId: ctx.user?.id, legacyAdmin: ctx.legacyAdmin });
        return updateAdminSupportTicketStatus({ ...input, ...auditActor, auditActor });
      }),
    coupons: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
      .query(({ input }) => getAdminCouponOverview(input.limit)),
    customerDetail: adminProcedure
      .input(z.object({ customerId: z.number().int().positive() }))
      .query(({ input }) => getAdminCustomerDetail(input.customerId)),
    legacyPayments: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
      .query(({ input }) => getAdminLegacyPaymentRecords(input.limit)),
    updateLegacyPayment: adminProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["pending", "confirmed", "rejected"]),
        memo: z.string().max(500).optional(),
      }))
      .mutation(({ input, ctx }) => {
        const auditActor = resolveAdminAuditActor({ adminUserId: ctx.user?.id, legacyAdmin: ctx.legacyAdmin });
        return updateAdminLegacyPaymentStatus({ ...input, ...auditActor, auditActor });
      }),
    reviews: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
      .query(({ input }) => getAdminReviews(input.limit)),
    deleteReview: adminProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(({ input, ctx }) => {
        const auditActor = resolveAdminAuditActor({ adminUserId: ctx.user?.id, legacyAdmin: ctx.legacyAdmin });
        return deleteAdminReview({ ...input, ...auditActor, auditActor });
      }),
    coachingBookings: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(({ input }) => getAdminCoachingBookingList(input.limit)),
    coachingBookingEvents: adminProcedure
      .input(z.object({ bookingId: z.number().int().positive() }))
      .query(({ input }) => getAdminCoachingBookingEvents(input.bookingId)),
    updateCoachingBooking: adminProcedure
      .input(z.object({
        bookingId: z.number().int().positive(),
        status: z.enum(["pending_schedule", "change_requested", "scheduled", "completed", "cancelled", "no_show"]),
        scheduledAt: z.date().nullable().optional(),
        scheduledEndAt: z.date().nullable().optional(),
        sessionMode: z.enum(["undecided", "online", "in_person"]).optional(),
        requestedWindowStart: z.date().nullable().optional(),
        requestedWindowEnd: z.date().nullable().optional(),
        assignedAdminUserId: z.number().int().positive().nullable().optional(),
        internalNote: z.string().max(2000).optional(),
        cancelReason: z.string().max(500).optional(),
      }))
      .mutation(({ input, ctx }) => {
        const auditActor = resolveAdminAuditActor({ adminUserId: ctx.user?.id, legacyAdmin: ctx.legacyAdmin });
        return updateAdminCoachingBooking({ ...input, ...auditActor, auditActor });
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
    list: adminProcedure.query(() => {
      return db.getPaymentRecords();
    }),
    updateStatus: adminProcedure
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
        visitType: z.enum([
          'home', 'free_trial', 'premium',
          'free_start', 'free_result',
          'deep_start', 'deep_result',
          'couple_start', 'couple_result',
        ]),
        testType: z.string().max(50).optional(),
        relationshipType: z.string().max(50).optional(),
        selectedColors: z.string().max(255).optional(),
        selectedCards: z.string().max(255).optional(),
      }))
      .mutation(({ input }) => {
        return db.logVisitor(input);
      }),
    stats: publicProcedure.query(() => {
      return db.getVisitorStats();
    }),
    testStats: publicProcedure.query(() => {
      return db.getTestSessionStats();
    }),
  }),

  // 관계 결과 공유 API: 공유 시점의 스냅샷만 저장·조회하며 기존 결과를 수정하지 않는다.
  coupleShares: router({
    create: publicProcedure
      .input(z.object({ snapshot: z.string().min(100).max(55_000) }))
      .mutation(async ({ input }) => {
        if (!parseCoupleShareSnapshot(input.snapshot)) {
          throw new Error("INVALID_COUPLE_SHARE_SNAPSHOT");
        }
        return db.createCoupleSharedResult(input.snapshot);
      }),
    get: publicProcedure
      .input(z.object({ shareId: z.string().uuid() }))
      .query(async ({ input }) => {
        const result = await db.getCoupleSharedResult(input.shareId);
        if (!result) return null;
        const snapshot = parseCoupleShareSnapshot(result.resultSnapshot);
        return snapshot ? { snapshot } : null;
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
        content: z.string().max(500).optional(),
        checkItems: z.string().max(500).optional(), // 선택형 체크 항목 (콤마 구분)
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
    delete: adminProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ input }) => {
        return db.deleteReview(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
