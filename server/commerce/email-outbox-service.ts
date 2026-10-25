import { and, asc, desc, eq, inArray, like, lt, lte, or, sql } from "drizzle-orm";

import { accountLinkChallenges, analysisRuns, coachingBookings, emailOutbox, orderItems, orders, privateDocuments, products, supportTickets } from "../../drizzle/schema";
import { getDb } from "../db";
import { storageGetBuffer } from "../storage";
import { decryptCommerceEmail, decryptCommerceValue, hashCommerceEmail } from "./crypto";
import { getPrivatePdfFilename } from "./pdf-delivery-policy";
import {
  isApprovedPreviewOutboxCandidate,
  isPreviewOutboxManualVerificationEnabled,
} from "./preview-outbox-verification";
import { sendResendEmail, sendResendPdfEmail } from "./resend-provider";
import { markRelationshipSessionEmailDelivered } from "./relationship-session-completion";

const MAX_AUTOMATIC_ATTEMPTS = 5;
const RETRY_MINUTES = [5, 15, 60, 240, 1440] as const;

export function getOutboxRetryAt(attemptCount: number, now = new Date()): Date {
  const minutes = RETRY_MINUTES[Math.min(Math.max(attemptCount - 1, 0), RETRY_MINUTES.length - 1)];
  return new Date(now.getTime() + minutes * 60 * 1000);
}

export function getOutboxEmailIdempotencyKey(outboxId: number): string {
  if (!Number.isInteger(outboxId) || outboxId <= 0) throw new Error("INVALID_OUTBOX_ID");
  return `husim-pdf-outbox-${outboxId}`;
}

export function getAccountLinkEmailIdempotencyKey(outboxId: number): string {
  if (!Number.isInteger(outboxId) || outboxId <= 0) throw new Error("INVALID_OUTBOX_ID");
  return `husim-account-link-outbox-${outboxId}`;
}

export function getSupportNotificationIdempotencyKey(outboxId: number): string {
  if (!Number.isInteger(outboxId) || outboxId <= 0) throw new Error("INVALID_OUTBOX_ID");
  return `husim-support-outbox-${outboxId}`;
}

function resultEmailHtml() {
  return [
    "<p>안녕하세요. 휴심컬러입니다.</p>",
    "<p>완료된 결과 리포트를 PDF로 첨부합니다. 이 메일에는 공개 결과 링크를 포함하지 않습니다.</p>",
    "<p>본 리포트에는 개인 심리정보가 포함될 수 있으니, 본인만 접근할 수 있는 메일함에서 보관해 주세요.</p>",
  ].join("");
}

function accountLinkEmailHtml(code: string, expiresAt: Date) {
  const expiresText = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(expiresAt);
  return [
    "<p>안녕하세요. 휴심컬러입니다.</p>",
    "<p>기존 구매 이력을 현재 계정에 안전하게 연결하기 위한 인증코드입니다.</p>",
    `<p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>`,
    `<p>인증코드는 ${expiresText}까지 유효합니다. 본인이 요청하지 않았다면 이 메일을 무시해 주세요.</p>`,
  ].join("");
}

function supportEmailHtml(input: { contactEmail: string; subject: string; message: string }) {
  const escaped = input.message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<p>휴심컬러 고객 문의가 접수되었습니다.</p><p><strong>답변 받을 이메일</strong>: ${input.contactEmail}</p><p><strong>제목</strong>: ${input.subject}</p><p>${escaped}</p>`;
}

async function readPrivatePdf(storageKey: string): Promise<Buffer> {
  return storageGetBuffer(storageKey);
}

async function claimPrivatePdfOutboxItem(outboxId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const claimed = await db
    .update(emailOutbox)
    .set({ status: "sending", attemptCount: sql`${emailOutbox.attemptCount} + 1` })
    .where(and(
      eq(emailOutbox.id, outboxId),
      eq(emailOutbox.purpose, "analysis_result_pdf"),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, now),
    ));
  if (Number((claimed as any)[0]?.affectedRows ?? 0) !== 1) return null;
  const rows = await db
    .select({
      id: emailOutbox.id,
      attemptCount: emailOutbox.attemptCount,
      toEmailEncrypted: emailOutbox.toEmailEncrypted,
      storageKey: privateDocuments.storageKey,
      retentionExpiresAt: privateDocuments.retentionExpiresAt,
      productCode: products.code,
    })
    .from(emailOutbox)
    .innerJoin(privateDocuments, eq(emailOutbox.privateDocumentId, privateDocuments.id))
    .innerJoin(analysisRuns, eq(privateDocuments.analysisRunId, analysisRuns.id))
    .innerJoin(products, eq(analysisRuns.productId, products.id))
    .where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.status, "sending")))
    .limit(1);
  return rows[0] ?? null;
}

export async function deliverPrivatePdfOutboxItem(outboxId: number): Promise<{
  status: "sent" | "retry_scheduled" | "not_claimed";
  attemptCount?: number;
}> {
  const claimed = await claimPrivatePdfOutboxItem(outboxId);
  if (!claimed) return { status: "not_claimed" };
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  try {
    if (!claimed.storageKey) throw new Error("PRIVATE_PDF_STORAGE_KEY_MISSING");
    if (claimed.retentionExpiresAt.getTime() <= Date.now()) throw new Error("PRIVATE_PDF_RETENTION_EXPIRED");
    if (!["personal_deep", "couple_love_deep", "parent_child_deep"].includes(claimed.productCode)) {
      throw new Error("PRIVATE_PDF_PRODUCT_UNSUPPORTED");
    }
    const result = await sendResendPdfEmail({
      to: decryptCommerceEmail(claimed.toEmailEncrypted),
      subject: "[휴심컬러] 완료된 결과 리포트 PDF",
      html: resultEmailHtml(),
      filename: getPrivatePdfFilename(claimed.productCode as "personal_deep" | "couple_love_deep" | "parent_child_deep"),
      pdf: await readPrivatePdf(claimed.storageKey),
      idempotencyKey: getOutboxEmailIdempotencyKey(claimed.id),
    });
    await db.update(emailOutbox).set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastErrorCode: null }).where(eq(emailOutbox.id, outboxId));
    await markRelationshipSessionEmailDelivered(outboxId);
    return { status: "sent", attemptCount: claimed.attemptCount };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 160) : "EMAIL_DELIVERY_FAILED";
    await db.update(emailOutbox).set({ status: "failed", lastErrorCode: errorCode, nextAttemptAt: getOutboxRetryAt(claimed.attemptCount) }).where(eq(emailOutbox.id, outboxId));
    return { status: "retry_scheduled", attemptCount: claimed.attemptCount };
  }
}

async function claimAccountLinkOutboxItem(outboxId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const claimed = await db
    .update(emailOutbox)
    .set({ status: "sending", attemptCount: sql`${emailOutbox.attemptCount} + 1` })
    .where(and(
      eq(emailOutbox.id, outboxId),
      eq(emailOutbox.purpose, "account_link"),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, now),
    ));
  if (Number((claimed as any)[0]?.affectedRows ?? 0) !== 1) return null;
  const rows = await db
    .select({
      id: emailOutbox.id,
      attemptCount: emailOutbox.attemptCount,
      toEmailEncrypted: emailOutbox.toEmailEncrypted,
      codeEncrypted: accountLinkChallenges.codeEncrypted,
      challengeStatus: accountLinkChallenges.status,
      expiresAt: accountLinkChallenges.expiresAt,
    })
    .from(emailOutbox)
    .innerJoin(accountLinkChallenges, eq(emailOutbox.accountLinkChallengeId, accountLinkChallenges.id))
    .where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.status, "sending")))
    .limit(1);
  return rows[0] ?? null;
}

export async function deliverAccountLinkOutboxItem(outboxId: number): Promise<{
  status: "sent" | "retry_scheduled" | "not_claimed";
  attemptCount?: number;
}> {
  const claimed = await claimAccountLinkOutboxItem(outboxId);
  if (!claimed) return { status: "not_claimed" };
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  try {
    if (claimed.challengeStatus !== "pending" || !claimed.codeEncrypted || claimed.expiresAt.getTime() <= Date.now()) throw new Error("ACCOUNT_LINK_CHALLENGE_EXPIRED");
    const result = await sendResendEmail({
      to: decryptCommerceEmail(claimed.toEmailEncrypted),
      subject: "[휴심컬러] 기존 구매 이력 연결 인증코드",
      html: accountLinkEmailHtml(decryptCommerceValue(claimed.codeEncrypted), claimed.expiresAt),
      idempotencyKey: getAccountLinkEmailIdempotencyKey(claimed.id),
    });
    await db.update(emailOutbox).set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastErrorCode: null }).where(eq(emailOutbox.id, outboxId));
    return { status: "sent", attemptCount: claimed.attemptCount };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 160) : "ACCOUNT_LINK_EMAIL_DELIVERY_FAILED";
    await db.update(emailOutbox).set({ status: "failed", lastErrorCode: errorCode, nextAttemptAt: getOutboxRetryAt(claimed.attemptCount) }).where(eq(emailOutbox.id, outboxId));
    return { status: "retry_scheduled", attemptCount: claimed.attemptCount };
  }
}

export async function deliverSupportNotificationOutboxItem(outboxId: number): Promise<{
  status: "sent" | "retry_scheduled" | "not_claimed";
  attemptCount?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const claimed = await db
    .update(emailOutbox)
    .set({ status: "sending", attemptCount: sql`${emailOutbox.attemptCount} + 1` })
    .where(and(
      eq(emailOutbox.id, outboxId),
      eq(emailOutbox.purpose, "support_notification"),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, new Date()),
    ));
  if (Number((claimed as any)[0]?.affectedRows ?? 0) !== 1) return { status: "not_claimed" };
  const rows = await db
    .select({
      id: emailOutbox.id,
      attemptCount: emailOutbox.attemptCount,
      toEmailEncrypted: emailOutbox.toEmailEncrypted,
      contactEmailEncrypted: supportTickets.contactEmailEncrypted,
      subject: supportTickets.subject,
      messageEncrypted: supportTickets.messageEncrypted,
    })
    .from(emailOutbox)
    .innerJoin(supportTickets, eq(emailOutbox.supportTicketId, supportTickets.id))
    .where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.status, "sending")))
    .limit(1);
  const item = rows[0];
  if (!item) return { status: "not_claimed" };
  try {
    const result = await sendResendEmail({
      to: decryptCommerceEmail(item.toEmailEncrypted),
      subject: `[휴심컬러 문의] ${item.subject}`,
      html: supportEmailHtml({
        contactEmail: decryptCommerceEmail(item.contactEmailEncrypted),
        subject: item.subject,
        message: decryptCommerceValue(item.messageEncrypted),
      }),
      idempotencyKey: getSupportNotificationIdempotencyKey(item.id),
    });
    await db.update(emailOutbox).set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastErrorCode: null }).where(eq(emailOutbox.id, outboxId));
    return { status: "sent", attemptCount: item.attemptCount };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 160) : "SUPPORT_EMAIL_DELIVERY_FAILED";
    await db.update(emailOutbox).set({ status: "failed", lastErrorCode: errorCode, nextAttemptAt: getOutboxRetryAt(item.attemptCount) }).where(eq(emailOutbox.id, outboxId));
    return { status: "retry_scheduled", attemptCount: item.attemptCount };
  }
}


function telephoneCoachingConfirmationHtml(input: { scheduledAt: Date | null; scheduledEndAt: Date | null }) {
  const formatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Seoul" });
  const schedule = input.scheduledAt ? formatter.format(input.scheduledAt) : "예약하신 시간";
  return [
    "<p>안녕하세요. 휴심컬러입니다.</p>",
    "<p>비대면 전화 코칭 결제와 예약이 확인되었습니다.</p>",
    `<p><strong>일정</strong>: ${schedule}<br/><strong>진행</strong>: 전화 코칭 50분 (준비·정리 포함 60분 일정 칸)<br/><strong>금액</strong>: 50,000원</p>`,
    "<p>진행자가 예약하신 번호로 전화드립니다. 시작 전 취소는 전액 환불되며, 시작 후 중단은 실제 진행 시간과 사유에 따라 남은 시간 재예약 또는 미진행분 환불을 협의합니다.</p>",
  ].join("");
}

export async function deliverTelephoneCoachingConfirmationOutboxItem(outboxId: number): Promise<{ status: "sent" | "retry_scheduled" | "not_claimed"; attemptCount?: number }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const claimed = await db.update(emailOutbox).set({ status: "sending", attemptCount: sql`${emailOutbox.attemptCount} + 1` }).where(and(
    eq(emailOutbox.id, outboxId),
    eq(emailOutbox.purpose, "coaching_booking_confirmation"),
    inArray(emailOutbox.status, ["queued", "failed"]),
    lte(emailOutbox.nextAttemptAt, now),
  ));
  if (Number((claimed as any)[0]?.affectedRows ?? 0) !== 1) return { status: "not_claimed" };
  const rows = await db.select({ id: emailOutbox.id, attemptCount: emailOutbox.attemptCount, toEmailEncrypted: emailOutbox.toEmailEncrypted, scheduledAt: coachingBookings.scheduledAt, scheduledEndAt: coachingBookings.scheduledEndAt }).from(emailOutbox).innerJoin(coachingBookings, eq(coachingBookings.orderId, emailOutbox.orderId)).where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.status, "sending"))).limit(1);
  const item = rows[0];
  if (!item) return { status: "not_claimed" };
  try {
    const result = await sendResendEmail({
      to: decryptCommerceEmail(item.toEmailEncrypted),
      subject: "[휴심컬러] 비대면 전화 코칭 예약 확인",
      html: telephoneCoachingConfirmationHtml(item),
      idempotencyKey: `husim-telephone-coaching-outbox-${item.id}`,
    });
    await db.update(emailOutbox).set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastErrorCode: null }).where(eq(emailOutbox.id, item.id));
    return { status: "sent", attemptCount: item.attemptCount };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 160) : "TELEPHONE_COACHING_EMAIL_DELIVERY_FAILED";
    await db.update(emailOutbox).set({ status: "failed", lastErrorCode: errorCode, nextAttemptAt: getOutboxRetryAt(item.attemptCount) }).where(eq(emailOutbox.id, item.id));
    return { status: "retry_scheduled", attemptCount: item.attemptCount };
  }
}

/**
 * 관리자 수동 재시도는 분석 PDF와 전화 코칭 예약 확인 메일에만 한정한다.
 * 이미 발송 완료·취소·다른 worker가 처리 중인 행은 다시 보내지 않는다.
 */
export async function retryAdminDeliveryOutboxItem(outboxId: number): Promise<{
  status: "sent" | "retry_scheduled" | "not_claimed";
  attemptCount?: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const retryablePurposes = ["analysis_result_pdf", "coaching_booking_confirmation"] as const;
  const rows = await db
    .select({ purpose: emailOutbox.purpose, status: emailOutbox.status })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, outboxId))
    .limit(1);
  const item = rows[0];
  if (!item || !retryablePurposes.includes(item.purpose as (typeof retryablePurposes)[number])) {
    throw new Error("ADMIN_DELIVERY_OUTBOX_NOT_FOUND");
  }
  if (item.status !== "queued" && item.status !== "failed") {
    throw new Error("ADMIN_DELIVERY_OUTBOX_NOT_RETRYABLE");
  }
  const reset = await db
    .update(emailOutbox)
    .set({ status: "queued", nextAttemptAt: new Date(), lastErrorCode: null })
    .where(and(
      eq(emailOutbox.id, outboxId),
      inArray(emailOutbox.purpose, retryablePurposes),
      inArray(emailOutbox.status, ["queued", "failed"]),
    ));
  if (Number((reset as any)[0]?.affectedRows ?? 0) !== 1) return { status: "not_claimed" };
  return item.purpose === "coaching_booking_confirmation"
    ? deliverTelephoneCoachingConfirmationOutboxItem(outboxId)
    : deliverPrivatePdfOutboxItem(outboxId);
}

/** 기존 분석 PDF 재시도 호출부와의 호환을 유지한다. */
export async function retryFailedPrivatePdfOutboxItem(outboxId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await db.update(emailOutbox).set({ status: "queued", nextAttemptAt: new Date(), lastErrorCode: null }).where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.purpose, "analysis_result_pdf")));
}

export async function processDueEmailOutbox(limit = 10): Promise<{ sent: number; retryScheduled: number; skipped: number }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const due = await db
    .select({ id: emailOutbox.id, purpose: emailOutbox.purpose })
    .from(emailOutbox)
    .where(and(
      inArray(emailOutbox.purpose, ["analysis_result_pdf", "account_link", "support_notification", "coaching_booking_confirmation"]),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, new Date()),
      lt(emailOutbox.attemptCount, MAX_AUTOMATIC_ATTEMPTS),
    ))
    .orderBy(emailOutbox.nextAttemptAt)
    .limit(Math.min(Math.max(limit, 1), 25));
  const outcomes = await Promise.all(due.map((item) =>
    item.purpose === "account_link"
      ? deliverAccountLinkOutboxItem(item.id)
      : item.purpose === "support_notification"
        ? deliverSupportNotificationOutboxItem(item.id)
        : item.purpose === "coaching_booking_confirmation"
          ? deliverTelephoneCoachingConfirmationOutboxItem(item.id)
          : deliverPrivatePdfOutboxItem(item.id),
  ));
  return {
    sent: outcomes.filter((outcome) => outcome.status === "sent").length,
    retryScheduled: outcomes.filter((outcome) => outcome.status === "retry_scheduled").length,
    skipped: outcomes.filter((outcome) => outcome.status === "not_claimed").length,
  };
}

/**
 * Preview에서 현재 로그인한 사용자가 만든 기존 테스트 큐만 제한적으로 처리한다.
 * 새 메일·주문·티켓을 생성하지 않으며, PDF와 일반 문의는 이 경로에 포함하지 않는다.
 */
export async function processApprovedPreviewOutboxForUser(userId: number, limit = 2): Promise<{
  sent: number;
  retryScheduled: number;
  skipped: number;
  selected: Array<{ id: number; purpose: "account_link" | "support_notification" }>;
}> {
  if (!isPreviewOutboxManualVerificationEnabled()) {
    throw new Error("PREVIEW_OUTBOX_VERIFICATION_DISABLED");
  }
  const supportEmail = process.env.SUPPORT_EMAIL?.trim().toLowerCase();
  if (!supportEmail) throw new Error("SUPPORT_EMAIL_NOT_CONFIGURED");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const rows = await db
    .select({
      id: emailOutbox.id,
      purpose: emailOutbox.purpose,
      toEmailEncrypted: emailOutbox.toEmailEncrypted,
      accountLinkStatus: accountLinkChallenges.status,
      accountLinkExpiresAt: accountLinkChallenges.expiresAt,
      supportSubject: supportTickets.subject,
    })
    .from(emailOutbox)
    .leftJoin(accountLinkChallenges, eq(emailOutbox.accountLinkChallengeId, accountLinkChallenges.id))
    .leftJoin(supportTickets, eq(emailOutbox.supportTicketId, supportTickets.id))
    .where(and(
      eq(emailOutbox.userId, userId),
      inArray(emailOutbox.purpose, ["account_link", "support_notification"]),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, now),
      lt(emailOutbox.attemptCount, MAX_AUTOMATIC_ATTEMPTS),
    ))
    .orderBy(asc(emailOutbox.nextAttemptAt))
    .limit(25);

  const selected = rows
    .filter((row): row is typeof row & { purpose: "account_link" | "support_notification" } => {
      if (row.purpose !== "account_link" && row.purpose !== "support_notification") return false;
      let recipientMatchesSupport = false;
      try {
        recipientMatchesSupport = decryptCommerceEmail(row.toEmailEncrypted).trim().toLowerCase() === supportEmail;
      } catch {
        return false;
      }
      return isApprovedPreviewOutboxCandidate({
        purpose: row.purpose,
        recipientMatchesSupport,
        accountLinkStatus: row.accountLinkStatus,
        accountLinkUnexpired: row.accountLinkExpiresAt ? row.accountLinkExpiresAt.getTime() > now.getTime() : null,
        supportSubject: row.supportSubject,
      });
    })
    .slice(0, Math.min(Math.max(limit, 1), 2));

  const outcomes = [];
  for (const item of selected) {
    outcomes.push(item.purpose === "account_link"
      ? await deliverAccountLinkOutboxItem(item.id)
      : await deliverSupportNotificationOutboxItem(item.id));
  }
  return {
    sent: outcomes.filter((outcome) => outcome.status === "sent").length,
    retryScheduled: outcomes.filter((outcome) => outcome.status === "retry_scheduled").length,
    skipped: outcomes.filter((outcome) => outcome.status === "not_claimed").length,
    selected: selected.map((item) => ({ id: item.id, purpose: item.purpose })),
  };
}

/** 기존 cron import 호환성을 유지하면서 PDF·계정 연결 메일을 함께 처리한다. */
export const processDuePrivatePdfOutbox = processDueEmailOutbox;

export async function getPrivatePdfOutboxSnapshot(input: {
  limit?: number;
  search?: string;
} = {}): Promise<Array<{
  id: number;
  purpose: "analysis_result_pdf" | "coaching_booking_confirmation";
  orderId: number | null;
  orderNumber: string | null;
  privateDocumentId: number | null;
  productName: string | null;
  recipientEmailMasked: string;
  status: "queued" | "sending" | "sent" | "failed" | "cancelled";
  attemptCount: number;
  nextAttemptAt: Date;
  sentAt: Date | null;
  lastErrorCode: string | null;
  createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const search = input.search?.trim() ?? "";
  const filters = [inArray(emailOutbox.purpose, ["analysis_result_pdf", "coaching_booking_confirmation"])];
  if (search) {
    const conditions = [like(orders.orderNumber, `%${search}%`)];
    if (search.includes("@")) conditions.push(eq(emailOutbox.toEmailHash, hashCommerceEmail(search)));
    filters.push(or(...conditions)!);
  }
  const rows = await db
    .select({
      id: emailOutbox.id,
      purpose: emailOutbox.purpose,
      orderId: emailOutbox.orderId,
      orderNumber: orders.orderNumber,
      privateDocumentId: emailOutbox.privateDocumentId,
      productName: orderItems.productNameSnapshot,
      toEmailEncrypted: emailOutbox.toEmailEncrypted,
      status: emailOutbox.status,
      attemptCount: emailOutbox.attemptCount,
      nextAttemptAt: emailOutbox.nextAttemptAt,
      sentAt: emailOutbox.sentAt,
      lastErrorCode: emailOutbox.lastErrorCode,
      createdAt: emailOutbox.createdAt,
    })
    .from(emailOutbox)
    .leftJoin(orders, eq(orders.id, emailOutbox.orderId))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(...filters))
    .orderBy(desc(emailOutbox.createdAt))
    .limit(Math.min(Math.max(input.limit ?? 50, 1), 100));

  return rows.map((row) => {
    let recipientEmailMasked = "보호된 이메일";
    try {
      const email = decryptCommerceEmail(row.toEmailEncrypted);
      const [local, domain] = email.split("@");
      recipientEmailMasked = local && domain
        ? `${local.slice(0, Math.min(2, local.length))}${"•".repeat(Math.max(1, local.length - Math.min(2, local.length)))}@${domain}`
        : "보호된 이메일";
    } catch {
      // 암호문이 손상된 과거 레코드도 원장 목록은 안전하게 표시한다.
    }
    return {
      id: row.id,
      purpose: row.purpose,
      orderId: row.orderId,
      orderNumber: row.orderNumber,
      privateDocumentId: row.privateDocumentId,
      productName: row.productName,
      recipientEmailMasked,
      status: row.status,
      attemptCount: row.attemptCount,
      nextAttemptAt: row.nextAttemptAt,
      sentAt: row.sentAt,
      lastErrorCode: row.lastErrorCode,
      createdAt: row.createdAt,
    };
  }) as any;
}

export { MAX_AUTOMATIC_ATTEMPTS };
