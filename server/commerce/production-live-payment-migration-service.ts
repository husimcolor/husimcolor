import { sql } from "drizzle-orm";

import { adminAuditLogs } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";

type SchemaRow = { schemaName?: string };
type ColumnRow = { columnType?: string };
type CountRow = { count?: number | string };

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0] as T[];
  return Array.isArray(result) ? result as T[] : [];
}

/**
 * Production legacy/password 관리자만 실행하는 additive migration이다.
 * payment_transactions.provider enum에 toss_live만 추가하며, 기존 주문·결제·이용권을
 * 수정하지 않는다. Preview schema에서의 실행은 명시적으로 거부한다.
 */
export async function applyProductionLivePaymentProviderMigration(input: {
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<{ schemaVerified: true; livePaymentProviderReady: true; alreadyApplied: boolean }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const schemaRows = rowsFromExecute<SchemaRow>(await (db as any).execute(sql`SELECT DATABASE() AS schemaName`));
  const schemaName = schemaRows[0]?.schemaName?.trim();
  if (!schemaName || /preview/i.test(schemaName)) throw new Error("PRODUCTION_SCHEMA_IDENTITY_REJECTED");

  const tableRows = rowsFromExecute<CountRow>(await (db as any).execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = 'payment_transactions'
  `));
  if (Number(tableRows[0]?.count ?? 0) !== 1) throw new Error("PRODUCTION_PAYMENT_SCHEMA_INCOMPLETE");

  const columnRows = rowsFromExecute<ColumnRow>(await (db as any).execute(sql`
    SELECT COLUMN_TYPE AS columnType
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'payment_transactions'
      AND column_name = 'provider'
    LIMIT 1
  `));
  const columnType = columnRows[0]?.columnType ?? "";
  if (!columnType.startsWith("enum(")) throw new Error("PRODUCTION_PAYMENT_PROVIDER_TYPE_UNEXPECTED");

  const alreadyApplied = columnType.includes("'toss_live'");
  if (!alreadyApplied) {
    await (db as any).execute(sql.raw(
      "ALTER TABLE `payment_transactions` MODIFY COLUMN `provider` enum('test','toss_pg','toss_live','google_play','coupon') NOT NULL",
    ));
  }

  await (db as any).insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "production_live_payment_provider_migrated",
    entityType: "payment_transactions",
    entityId: "provider",
    beforeJson: JSON.stringify({ liveProviderPresent: alreadyApplied, auditActor: input.auditActor.subject }),
    afterJson: JSON.stringify({ liveProviderPresent: true, additiveOnly: true, auditActor: input.auditActor.subject }),
  });

  return { schemaVerified: true, livePaymentProviderReady: true, alreadyApplied };
}
