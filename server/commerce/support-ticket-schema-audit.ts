import { sql } from "drizzle-orm";

import { getDb } from "../db";

const REQUIRED_COLUMNS = [
  "contactNameEncrypted",
  "inquiryType",
  "respondedAt",
  "updatedAt",
] as const;

type ColumnRow = {
  columnName: string;
  columnType: string;
  isNullable: "YES" | "NO";
  columnDefault: string | null;
};

function rowsFromExecuteResult(result: unknown): ColumnRow[] {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0] as ColumnRow[];
  return Array.isArray(result) ? result as ColumnRow[] : [];
}

export function summarizeSupportTicketSchema(rows: ColumnRow[]) {
  const byName = new Map(rows.map((row) => [row.columnName, row]));
  const missingColumns = REQUIRED_COLUMNS.filter((name) => !byName.has(name));
  const status = byName.get("status");
  const statusType = status?.columnType ?? null;
  const supportsFinalLifecycle = Boolean(
    statusType
    && statusType.includes("received")
    && statusType.includes("reviewing")
    && statusType.includes("answered")
    && !statusType.includes("'open'")
    && !statusType.includes("'closed'"),
  );

  return {
    tableAvailable: rows.length > 0,
    missingColumns,
    statusType,
    supportsFinalLifecycle,
    safeToSkipMigration: rows.length > 0 && missingColumns.length === 0 && supportsFinalLifecycle,
    requiredPlan: rows.length === 0
      ? "support_tickets 테이블 부재: Production 배포 중단 후 기존 원장 상태를 별도 조사"
      : missingColumns.length > 0 || !supportsFinalLifecycle
        ? "실제 Production 스키마 차이만 반영하는 단일 비파괴 migration을 준비하고, source journal 정합성을 먼저 확정"
        : "스키마는 최종 형태이므로 migration을 재실행하지 않고 journal 정합성만 별도 검토",
  };
}

/**
 * Production과 Preview가 같은 공통 원장을 가리킬 수 있으므로, 이 감사는
 * information_schema만 읽고 절대로 ALTER/UPDATE/INSERT를 실행하지 않는다.
 */
export async function getSupportTicketSchemaAudit() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const result = await (db as any).execute(sql`
    SELECT
      COLUMN_NAME AS columnName,
      COLUMN_TYPE AS columnType,
      IS_NULLABLE AS isNullable,
      COLUMN_DEFAULT AS columnDefault
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'support_tickets'
      AND COLUMN_NAME IN ('status', 'contactNameEncrypted', 'inquiryType', 'respondedAt', 'updatedAt')
    ORDER BY ORDINAL_POSITION
  `);
  return summarizeSupportTicketSchema(rowsFromExecuteResult(result));
}
