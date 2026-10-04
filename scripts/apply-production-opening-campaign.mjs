import { existsSync, rmSync } from "node:fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const envPath = process.env.PRODUCTION_ENV_FILE ?? ".env.production";
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("PRODUCTION_DATABASE_URL_MISSING");

const CAMPAIGN_CODE = "OCT20OPEN2026";
const CAMPAIGN_STARTS_AT = new Date("2026-09-30T15:00:00.000Z"); // 2026-10-01 00:00:00 KST
const CAMPAIGN_ENDS_AT = new Date("2026-10-30T14:59:59.000Z"); // 2026-10-30 23:59:59 KST
const PRODUCT_CODES = ["personal_deep", "couple_love_deep", "parent_child_deep"];

async function queryScalar(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return Number(rows?.[0]?.count ?? 0);
}

async function main() {
  // Vercel stores the exact TiDB-compatible connection string, including its
  // TLS options. Do not log, rewrite, or persist that secret locally.
  const connection = await mysql.createConnection(databaseUrl);

  try {
    const [schemaRows] = await connection.query("SELECT DATABASE() AS schemaName");
    if (!schemaRows?.[0]?.schemaName) throw new Error("PRODUCTION_SCHEMA_NOT_SELECTED");

    const requiredTables = ["coupons", "coupon_product_rules", "products", "customers", "orders", "entitlements"];
    const tableCount = await queryScalar(
      connection,
      `SELECT COUNT(*) AS count FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name IN (${requiredTables.map(() => "?").join(",")})`,
      requiredTables,
    );
    if (tableCount !== requiredTables.length) throw new Error("PRODUCTION_COMMERCE_SCHEMA_INCOMPLETE");

    const assignedColumnCount = await queryScalar(
      connection,
      `SELECT COUNT(*) AS count FROM information_schema.columns
       WHERE table_schema = DATABASE() AND table_name = 'coupons' AND column_name = 'assignedCustomerId'`,
    );
    if (assignedColumnCount === 0) {
      await connection.query("ALTER TABLE `coupons` ADD COLUMN `assignedCustomerId` int NULL");
    }

    const assignedIndexCount = await queryScalar(
      connection,
      `SELECT COUNT(*) AS count FROM information_schema.statistics
       WHERE table_schema = DATABASE() AND table_name = 'coupons' AND index_name = 'coupons_assigned_customer_idx'`,
    );
    if (assignedIndexCount === 0) {
      await connection.query("CREATE INDEX `coupons_assigned_customer_idx` ON `coupons` (`assignedCustomerId`, `status`)");
    }

    const [productRows] = await connection.query(
      `SELECT id, code FROM products
       WHERE code IN (${PRODUCT_CODES.map(() => "?").join(",")}) AND active = true`,
      PRODUCT_CODES,
    );
    if (productRows.length !== PRODUCT_CODES.length) throw new Error("PRODUCTION_CAMPAIGN_PRODUCTS_UNAVAILABLE");

    await connection.query(
      `INSERT INTO coupons
        (code, assignedCustomerId, discountType, discountValue, minOrderAmountKrw, startsAt, endsAt, maxRedemptions, maxPerCustomer, status)
       VALUES (?, NULL, 'percent', 20, 0, ?, ?, NULL, NULL, 'active')
       ON DUPLICATE KEY UPDATE
         assignedCustomerId = NULL,
         discountType = 'percent',
         discountValue = 20,
         minOrderAmountKrw = 0,
         startsAt = VALUES(startsAt),
         endsAt = VALUES(endsAt),
         maxRedemptions = NULL,
         maxPerCustomer = NULL,
         status = 'active'`,
      [CAMPAIGN_CODE, CAMPAIGN_STARTS_AT, CAMPAIGN_ENDS_AT],
    );

    const [couponRows] = await connection.query("SELECT id FROM coupons WHERE code = ? LIMIT 1", [CAMPAIGN_CODE]);
    const couponId = Number(couponRows?.[0]?.id);
    if (!Number.isInteger(couponId) || couponId <= 0) throw new Error("PRODUCTION_CAMPAIGN_COUPON_UNAVAILABLE");

    for (const product of productRows) {
      await connection.query(
        "INSERT IGNORE INTO coupon_product_rules (couponId, productId) VALUES (?, ?)",
        [couponId, Number(product.id)],
      );
    }

    const ruleCount = await queryScalar(
      connection,
      "SELECT COUNT(*) AS count FROM coupon_product_rules WHERE couponId = ?",
      [couponId],
    );
    if (ruleCount !== PRODUCT_CODES.length) throw new Error("PRODUCTION_CAMPAIGN_RULE_COUNT_MISMATCH");

    console.log(JSON.stringify({
      schemaVerified: true,
      targetedCouponSchemaReady: true,
      publicCampaignConfigured: true,
      paidAnalysisProductRuleCount: ruleCount,
      testDataSeeded: false,
    }));
  } finally {
    await connection.end();
    if (process.env.REMOVE_PRODUCTION_ENV_FILE === "true" && existsSync(envPath)) rmSync(envPath, { force: true });
  }
}

await main();
