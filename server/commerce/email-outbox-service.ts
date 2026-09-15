import { and, eq, inArray, lt, lte } from "drizzle-orm";

import { accountLinkChallenges, analysisRuns, emailOutbox, privateDocuments, products, supportTickets } from "../../drizzle/schema";
import { getDb } from "../db";
import { storageGetSignedUrl } from "../storage";
import { decryptCommerceEmail, decryptCommerceValue } from "./crypto";
import { getPrivatePdfFilename } from "./pdf-delivery-policy";
import { sendResendEmail, sendResendPdfEmail } from "./resend-provider";

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
  const signedUrl = await storageGetSignedUrl(storageKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`PRIVATE_PDF_READ_FAILED_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function claimPrivatePdfOutboxItem(outboxId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const claimed = await db
    .update(emailOutbox)
    .set({ status: "sending", attemptCount: (emailOutbox.attemptCount as any) + 1 })
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
    .set({ status: "sending", attemptCount: (emailOutbox.attemptCount as any) + 1 })
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
    .set({ status: "sending", attemptCount: (emailOutbox.attemptCount as any) + 1 })
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
      inArray(emailOutbox.purpose, ["analysis_result_pdf", "account_link", "support_notification"]),
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
        : deliverPrivatePdfOutboxItem(item.id),
  ));
  return {
    sent: outcomes.filter((outcome) => outcome.status === "sent").length,
    retryScheduled: outcomes.filter((outcome) => outcome.status === "retry_scheduled").length,
    skipped: outcomes.filter((outcome) => outcome.status === "not_claimed").length,
  };
}

/** 기존 cron import 호환성을 유지하면서 PDF·계정 연결 메일을 함께 처리한다. */
export const processDuePrivatePdfOutbox = processDueEmailOutbox;

export async function getPrivatePdfOutboxSnapshot(limit = 50): Promise<Array<{
  id: number;
  orderId: number | null;
  privateDocumentId: number | null;
  status: "queued" | "sending" | "sent" | "failed" | "cancelled";
  attemptCount: number;
  nextAttemptAt: Date;
  sentAt: Date | null;
  lastErrorCode: string | null;
  createdAt: Date;
}>> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return db
    .select({ id: emailOutbox.id, orderId: emailOutbox.orderId, privateDocumentId: emailOutbox.privateDocumentId, status: emailOutbox.status, attemptCount: emailOutbox.attemptCount, nextAttemptAt: emailOutbox.nextAttemptAt, sentAt: emailOutbox.sentAt, lastErrorCode: emailOutbox.lastErrorCode, createdAt: emailOutbox.createdAt })
    .from(emailOutbox)
    .where(eq(emailOutbox.purpose, "analysis_result_pdf"))
    .orderBy(emailOutbox.createdAt)
    .limit(Math.min(Math.max(limit, 1), 100)) as any;
}

export { MAX_AUTOMATIC_ATTEMPTS };
