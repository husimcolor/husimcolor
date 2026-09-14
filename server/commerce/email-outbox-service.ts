import { and, eq, inArray, lt, lte } from "drizzle-orm";

import { analysisRuns, emailOutbox, privateDocuments, products } from "../../drizzle/schema";
import { getDb } from "../db";
import { storageGetSignedUrl } from "../storage";
import { decryptCommerceEmail } from "./crypto";
import { getPrivatePdfFilename } from "./pdf-delivery-policy";
import { sendResendPdfEmail } from "./resend-provider";

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

function resultEmailHtml() {
  return [
    "<p>안녕하세요. 휴심컬러입니다.</p>",
    "<p>완료된 결과 리포트를 PDF로 첨부합니다. 이 메일에는 공개 결과 링크를 포함하지 않습니다.</p>",
    "<p>본 리포트에는 개인 심리정보가 포함될 수 있으니, 본인만 접근할 수 있는 메일함에서 보관해 주세요.</p>",
  ].join("");
}

async function readPrivatePdf(storageKey: string): Promise<Buffer> {
  const signedUrl = await storageGetSignedUrl(storageKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`PRIVATE_PDF_READ_FAILED_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function claimOutboxItem(outboxId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const claimed = await db
    .update(emailOutbox)
    .set({ status: "sending", attemptCount: (emailOutbox.attemptCount as any) + 1 })
    .where(and(
      eq(emailOutbox.id, outboxId),
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
  const claimed = await claimOutboxItem(outboxId);
  if (!claimed) return { status: "not_claimed" };
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  try {
    if (!claimed.storageKey) throw new Error("PRIVATE_PDF_STORAGE_KEY_MISSING");
    if (claimed.retentionExpiresAt.getTime() <= Date.now()) throw new Error("PRIVATE_PDF_RETENTION_EXPIRED");
    const to = decryptCommerceEmail(claimed.toEmailEncrypted);
    const pdf = await readPrivatePdf(claimed.storageKey);
    if (![
      "personal_deep",
      "couple_love_deep",
      "parent_child_deep",
    ].includes(claimed.productCode)) {
      throw new Error("PRIVATE_PDF_PRODUCT_UNSUPPORTED");
    }
    const result = await sendResendPdfEmail({
      to,
      subject: "[휴심컬러] 완료된 결과 리포트 PDF",
      html: resultEmailHtml(),
      filename: getPrivatePdfFilename(claimed.productCode as "personal_deep" | "couple_love_deep" | "parent_child_deep"),
      pdf,
      idempotencyKey: getOutboxEmailIdempotencyKey(claimed.id),
    });
    await db
      .update(emailOutbox)
      .set({ status: "sent", providerMessageId: result.providerMessageId, sentAt: new Date(), lastErrorCode: null })
      .where(eq(emailOutbox.id, outboxId));
    return { status: "sent", attemptCount: claimed.attemptCount };
  } catch (error) {
    const errorCode = error instanceof Error ? error.message.slice(0, 160) : "EMAIL_DELIVERY_FAILED";
    const nextAttemptAt = getOutboxRetryAt(claimed.attemptCount);
    await db
      .update(emailOutbox)
      .set({
        status: "failed",
        lastErrorCode: errorCode,
        nextAttemptAt,
      })
      .where(eq(emailOutbox.id, outboxId));
    return { status: "retry_scheduled", attemptCount: claimed.attemptCount };
  }
}

export async function retryFailedPrivatePdfOutboxItem(outboxId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await db
    .update(emailOutbox)
    .set({ status: "queued", nextAttemptAt: new Date(), lastErrorCode: null })
    .where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.purpose, "analysis_result_pdf")));
}

export async function processDuePrivatePdfOutbox(limit = 10): Promise<{
  sent: number;
  retryScheduled: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const due = await db
    .select({ id: emailOutbox.id })
    .from(emailOutbox)
    .where(and(
      eq(emailOutbox.purpose, "analysis_result_pdf"),
      inArray(emailOutbox.status, ["queued", "failed"]),
      lte(emailOutbox.nextAttemptAt, new Date()),
      lt(emailOutbox.attemptCount, MAX_AUTOMATIC_ATTEMPTS),
    ))
    .orderBy(emailOutbox.nextAttemptAt)
    .limit(Math.min(Math.max(limit, 1), 25));
  const outcomes = await Promise.all(due.map((item) => deliverPrivatePdfOutboxItem(item.id)));
  return {
    sent: outcomes.filter((outcome) => outcome.status === "sent").length,
    retryScheduled: outcomes.filter((outcome) => outcome.status === "retry_scheduled").length,
    skipped: outcomes.filter((outcome) => outcome.status === "not_claimed").length,
  };
}

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
    .select({
      id: emailOutbox.id,
      orderId: emailOutbox.orderId,
      privateDocumentId: emailOutbox.privateDocumentId,
      status: emailOutbox.status,
      attemptCount: emailOutbox.attemptCount,
      nextAttemptAt: emailOutbox.nextAttemptAt,
      sentAt: emailOutbox.sentAt,
      lastErrorCode: emailOutbox.lastErrorCode,
      createdAt: emailOutbox.createdAt,
    })
    .from(emailOutbox)
    .where(eq(emailOutbox.purpose, "analysis_result_pdf"))
    .orderBy(emailOutbox.createdAt)
    .limit(Math.min(Math.max(limit, 1), 100)) as any;
}

export { MAX_AUTOMATIC_ATTEMPTS };
