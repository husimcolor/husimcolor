import { and, eq } from "drizzle-orm";

import {
  analysisRuns,
  customers,
  emailOutbox,
  privateDocuments,
  products,
} from "../../drizzle/schema";
import type { CommerceProductCode } from "../../shared/commerce";
import type { CouplePdfDownloadPayload } from "../../shared/couple-pdf-download";
import type { ParentChildPdfDownloadPayload } from "../../shared/parent-child-pdf-download";
import type { PremiumPdfDownloadPayload } from "../../shared/premium-pdf-download";
import { createCouplePdfBuffer, validateCouplePdfPayload } from "../couple-pdf-report";
import { getDb } from "../db";
import { createParentChildPdfBuffer, validateParentChildPdfPayload } from "../parent-child-pdf-report";
import { createPremiumPdfBuffer, validatePremiumPdfPayload } from "../pdf-report";
import { storagePut } from "../storage";

export type AnalysisPdfKind = "personal_deep" | "couple_love_deep" | "parent_child_deep";

type AnalysisPdfPayload = PremiumPdfDownloadPayload | CouplePdfDownloadPayload | ParentChildPdfDownloadPayload;

const MEMBER_RETENTION_DAYS = 365;
const GUEST_RETENTION_DAYS = 7;

export function getPrivateDocumentRetentionExpiresAt(accessMode: "member" | "guest" | "free", now = new Date()): Date {
  const days = accessMode === "member" ? MEMBER_RETENTION_DAYS : GUEST_RETENTION_DAYS;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getPrivatePdfFilename(kind: AnalysisPdfKind): string {
  if (kind === "personal_deep") return "휴심컬러_나의컬러심리해석.pdf";
  if (kind === "couple_love_deep") return "휴심컬러_부부연인_관계리포트.pdf";
  return "휴심컬러_부모자녀_관계리포트.pdf";
}

async function buildExistingPdf(kind: AnalysisPdfKind, value: unknown): Promise<Buffer> {
  if (kind === "personal_deep") return createPremiumPdfBuffer(validatePremiumPdfPayload(value));
  if (kind === "couple_love_deep") return createCouplePdfBuffer(validateCouplePdfPayload(value));
  return createParentChildPdfBuffer(validateParentChildPdfPayload(value));
}

function assertMatchingProduct(kind: AnalysisPdfKind, productCode: string): asserts productCode is CommerceProductCode {
  if (kind !== productCode) throw new Error("PDF_PRODUCT_MISMATCH");
}

/**
 * 기존 PDF 생성기를 변경하지 않고 결과 Buffer만 private storage에 보관한 뒤 이메일 outbox에 한 번 적재한다.
 * 공개 URL은 만들지 않으며, 실제 발송 worker는 attachment로만 문서를 전달한다.
 */
export async function queuePrivateAnalysisPdfDelivery(input: {
  analysisRunId: number;
  kind: AnalysisPdfKind;
  payload: AnalysisPdfPayload;
}): Promise<{
  privateDocumentId: number;
  outboxId: number | null;
  alreadyQueued: boolean;
  retentionExpiresAt: Date;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const runRows = await db
    .select({
      analysisRunId: analysisRuns.id,
      accessMode: analysisRuns.accessMode,
      userId: analysisRuns.userId,
      customerId: analysisRuns.customerId,
      orderId: analysisRuns.orderId,
      productCode: products.code,
      emailHash: customers.emailHash,
      emailEncrypted: customers.emailEncrypted,
    })
    .from(analysisRuns)
    .innerJoin(products, eq(analysisRuns.productId, products.id))
    .innerJoin(customers, eq(analysisRuns.customerId, customers.id))
    .where(eq(analysisRuns.id, input.analysisRunId))
    .limit(1);
  const run = runRows[0];
  if (!run) throw new Error("ANALYSIS_RUN_NOT_FOUND");
  assertMatchingProduct(input.kind, run.productCode);

  const retentionExpiresAt = getPrivateDocumentRetentionExpiresAt(run.accessMode);
  const existingRows = await db
    .select()
    .from(privateDocuments)
    .where(and(eq(privateDocuments.analysisRunId, run.analysisRunId), eq(privateDocuments.documentType, "analysis_pdf")))
    .limit(1);
  const existing = existingRows[0];

  if (existing?.status === "generated") {
    const existingOutbox = await db
      .select({ id: emailOutbox.id })
      .from(emailOutbox)
      .where(and(eq(emailOutbox.privateDocumentId, existing.id), eq(emailOutbox.purpose, "analysis_result_pdf")))
      .limit(1);
    return {
      privateDocumentId: existing.id,
      outboxId: existingOutbox[0]?.id ?? null,
      alreadyQueued: true,
      retentionExpiresAt: existing.retentionExpiresAt,
    };
  }

  let privateDocumentId = existing?.id;
  if (!privateDocumentId) {
    const inserted = await db.insert(privateDocuments).values({
      userId: run.userId,
      customerId: run.customerId,
      orderId: run.orderId,
      analysisRunId: run.analysisRunId,
      documentType: "analysis_pdf",
      status: "queued",
      retentionExpiresAt,
    });
    privateDocumentId = Number(inserted[0].insertId);
  } else {
    await db
      .update(privateDocuments)
      .set({ status: "queued", errorCode: null, deletedAt: null, retentionExpiresAt })
      .where(eq(privateDocuments.id, privateDocumentId));
  }

  try {
    const buffer = await buildExistingPdf(input.kind, input.payload);
    if (buffer.length < 512) throw new Error("PDF_BUFFER_TOO_SMALL");
    const stored = await storagePut(
      `private/analysis-results/${run.analysisRunId}/${input.kind}.pdf`,
      buffer,
      "application/pdf",
    );
    const now = new Date();
    const outboxResult = await (db as any).transaction(async (tx: any) => {
      await tx
        .update(privateDocuments)
        .set({ storageKey: stored.key, status: "generated", generatedAt: now, errorCode: null })
        .where(eq(privateDocuments.id, privateDocumentId));
      const existingOutbox = await tx
        .select({ id: emailOutbox.id })
        .from(emailOutbox)
        .where(and(eq(emailOutbox.privateDocumentId, privateDocumentId), eq(emailOutbox.purpose, "analysis_result_pdf")))
        .limit(1);
      if (existingOutbox[0]) return existingOutbox[0].id as number;
      const createdOutbox = await tx.insert(emailOutbox).values({
        userId: run.userId,
        customerId: run.customerId,
        orderId: run.orderId,
        privateDocumentId,
        purpose: "analysis_result_pdf",
        toEmailHash: run.emailHash,
        toEmailEncrypted: run.emailEncrypted,
        status: "queued",
        attemptCount: 0,
        nextAttemptAt: now,
      });
      await tx
        .update(analysisRuns)
        .set({ status: "completed", completedAt: now })
        .where(eq(analysisRuns.id, run.analysisRunId));
      return Number(createdOutbox[0].insertId);
    });
    return { privateDocumentId, outboxId: outboxResult, alreadyQueued: false, retentionExpiresAt };
  } catch (error) {
    await db
      .update(privateDocuments)
      .set({ status: "failed", errorCode: error instanceof Error ? error.message.slice(0, 120) : "PDF_DELIVERY_FAILED" })
      .where(eq(privateDocuments.id, privateDocumentId));
    throw error;
  }
}
