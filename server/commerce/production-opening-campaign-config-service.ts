import { eq, inArray, sql } from "drizzle-orm";

import { adminAuditLogs, couponProductRules, coupons, products } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";

const CAMPAIGN_CODE = "OCT20OPEN2026";
const CAMPAIGN_STARTS_AT = new Date("2026-09-30T15:00:00.000Z"); // 2026-10-01 00:00:00 KST
const CAMPAIGN_ENDS_AT = new Date("2026-10-30T14:59:59.000Z"); // 2026-10-30 23:59:59 KST
const PRODUCT_CODES = ["personal_deep", "couple_love_deep", "parent_child_deep"] as const;
const REQUIRED_TABLES = ["coupons", "coupon_product_rules", "products", "customers", "orders", "entitlements", "admin_audit_logs"] as const;

type SchemaRow = { schemaName?: string };
type CountRow = { count?: number | string };

function rowsFromExecute<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0] as T[];
  return Array.isArray(result) ? result as T[] : [];
}

function countFromExecute(result: unknown): number {
  return Number(rowsFromExecute<CountRow>(result)[0]?.count ?? 0);
}

/**
 * Production 공개 테스트 운영에 한해 legacy/password 관리자 또는 role=admin만 실행할 수 있다.
 * - 기존 주문·고객·분석·결제·이용권은 읽거나 변경하지 않는다.
 * - DDL은 nullable column과 index만 보강한다.
 * - 공개 20% 행사는 세 유료 분석 상품에만 멱등으로 upsert한다.
 */
export async function applyProductionOpeningCampaignConfiguration(input: {
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<{
  schemaVerified: true;
  targetedCouponSchemaReady: true;
  publicCampaignConfigured: true;
  paidAnalysisProductRuleCount: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const schemaRows = rowsFromExecute<SchemaRow>(await (db as any).execute(sql`SELECT DATABASE() AS schemaName`));
  const schemaName = schemaRows[0]?.schemaName?.trim();
  if (!schemaName || /preview/i.test(schemaName)) throw new Error("PRODUCTION_SCHEMA_IDENTITY_REJECTED");

  const tableCount = countFromExecute(await (db as any).execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name IN (${sql.join(REQUIRED_TABLES.map((name) => sql`${name}`), sql`, `)})
  `));
  if (tableCount !== REQUIRED_TABLES.length) throw new Error("PRODUCTION_COMMERCE_SCHEMA_INCOMPLETE");

  const assignedColumnCount = countFromExecute(await (db as any).execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'coupons' AND column_name = 'assignedCustomerId'
  `));
  if (assignedColumnCount === 0) {
    await (db as any).execute(sql.raw("ALTER TABLE `coupons` ADD COLUMN `assignedCustomerId` int NULL"));
  }

  const assignedIndexCount = countFromExecute(await (db as any).execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'coupons' AND index_name = 'coupons_assigned_customer_idx'
  `));
  if (assignedIndexCount === 0) {
    await (db as any).execute(sql.raw("CREATE INDEX `coupons_assigned_customer_idx` ON `coupons` (`assignedCustomerId`, `status`)"));
  }

  return (db as any).transaction(async (tx: any) => {
    const campaignProducts = await tx
      .select({ id: products.id, code: products.code, requiresPayment: products.requiresPayment, active: products.active })
      .from(products)
      .where(inArray(products.code, PRODUCT_CODES));
    if (
      campaignProducts.length !== PRODUCT_CODES.length
      || campaignProducts.some((product: { requiresPayment: boolean; active: boolean }) => !product.requiresPayment || !product.active)
    ) {
      throw new Error("PRODUCTION_CAMPAIGN_PRODUCTS_UNAVAILABLE");
    }

    await tx.insert(coupons).values({
      code: CAMPAIGN_CODE,
      assignedCustomerId: null,
      discountType: "percent",
      discountValue: 20,
      minOrderAmountKrw: 0,
      startsAt: CAMPAIGN_STARTS_AT,
      endsAt: CAMPAIGN_ENDS_AT,
      maxRedemptions: null,
      maxPerCustomer: null,
      status: "active",
    }).onDuplicateKeyUpdate({
      set: {
        assignedCustomerId: null,
        discountType: "percent",
        discountValue: 20,
        minOrderAmountKrw: 0,
        startsAt: CAMPAIGN_STARTS_AT,
        endsAt: CAMPAIGN_ENDS_AT,
        maxRedemptions: null,
        maxPerCustomer: null,
        status: "active",
      },
    });

    const couponRows = await tx.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, CAMPAIGN_CODE)).limit(1);
    const couponId = Number(couponRows[0]?.id);
    if (!Number.isInteger(couponId) || couponId <= 0) throw new Error("PRODUCTION_CAMPAIGN_COUPON_UNAVAILABLE");

    for (const product of campaignProducts) {
      await tx.execute(sql`
        INSERT IGNORE INTO coupon_product_rules (couponId, productId)
        VALUES (${couponId}, ${Number(product.id)})
      `);
    }

    const ruleRows = await tx
      .select({ id: couponProductRules.id })
      .from(couponProductRules)
      .where(eq(couponProductRules.couponId, couponId));
    if (ruleRows.length !== PRODUCT_CODES.length) throw new Error("PRODUCTION_CAMPAIGN_RULE_COUNT_MISMATCH");

    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "production_opening_campaign_configured",
      entityType: "coupon",
      entityId: String(couponId),
      beforeJson: JSON.stringify({ campaignCode: CAMPAIGN_CODE, auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({
        assignedCustomer: false,
        discountPercent: 20,
        productCodes: PRODUCT_CODES,
        startsAt: CAMPAIGN_STARTS_AT.toISOString(),
        endsAt: CAMPAIGN_ENDS_AT.toISOString(),
        unlimitedTotal: true,
        unlimitedPerCustomer: true,
        auditActor: input.auditActor.subject,
      }),
    });

    return {
      schemaVerified: true as const,
      targetedCouponSchemaReady: true as const,
      publicCampaignConfigured: true as const,
      paidAnalysisProductRuleCount: ruleRows.length,
    };
  });
}
