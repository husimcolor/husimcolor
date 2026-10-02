import { and, eq } from "drizzle-orm";

import {
  emailOutbox,
  privateDocuments,
  relationshipSessions,
} from "../../drizzle/schema";
import { getDb } from "../db";

/**
 * 관계 초대 세션은 PDF가 생성된 것만으로 완료되지 않는다.
 * 기존 outbox가 실제 sent가 된 경우에만 초대 링크를 만료시키는 완료 상태로 전이한다.
 */
export async function markRelationshipSessionEmailDelivered(outboxId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const rows = await db
    .select({ analysisRunId: privateDocuments.analysisRunId })
    .from(emailOutbox)
    .innerJoin(privateDocuments, eq(emailOutbox.privateDocumentId, privateDocuments.id))
    .where(and(eq(emailOutbox.id, outboxId), eq(emailOutbox.purpose, "analysis_result_pdf")))
    .limit(1);
  const analysisRunId = rows[0]?.analysisRunId;
  if (!analysisRunId) return;

  const now = new Date();
  await db
    .update(relationshipSessions)
    .set({
      status: "completed",
      emailDeliveredAt: now,
      completedAt: now,
      reportErrorCode: null,
    })
    .where(and(
      eq(relationshipSessions.analysisRunId, analysisRunId),
      eq(relationshipSessions.status, "email_pending"),
    ));
}
