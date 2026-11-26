#!/usr/bin/env node
/**
 * Default: offline report (no database connection).
 * Inspect: --inspect --allow-db --expected-database NAME
 * Apply: --apply --allow-db --expected-database NAME --backup-confirmed
 * Remote apply also requires --allow-production --expected-identity-sha256 HASH
 * Rollback (manual, NEVER executed by this script): pause the three DEC2026 coupons;
 * disable the UI/event resolver first. Preserve grants/redemptions/orders for audit.
 * Only if no grants or redemptions exist, delete event rules/coupons/grants table manually
 * after a fresh verified backup. DDL auto-commits; DML transaction rollback cannot undo CREATE.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const args = new Set(process.argv.slice(2));
const value = flag => process.argv[process.argv.indexOf(flag) + 1];
const start = "2026-11-30 15:00:00", end = "2026-12-31 15:00:00";
const offers = [
  { productCode: "personal_deep", code: "DEC2026-PERSONAL", type: "fixed", value: 19100, amount: 29000 },
  { productCode: "couple_love_deep", code: "DEC2026-COUPLE", type: "percent", value: 60, amount: 59000 },
  { productCode: "parent_child_deep", code: "DEC2026-PARENT-CHILD", type: "percent", value: 60, amount: 39000 },
];
const ddl = `CREATE TABLE IF NOT EXISTS december_report_coupon_grants (
  id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  eventKey varchar(40) NOT NULL,
  userId int NOT NULL,
  productCode varchar(80) NOT NULL,
  couponId int NOT NULL,
  issuedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY december_report_grants_account_product_unique (eventKey,userId,productCode),
  KEY december_report_grants_coupon_idx (couponId,userId)
) ENGINE=InnoDB`;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shared = fs.readFileSync(path.join(root, "shared/december-report-event.ts"), "utf8");
if (!offers.every(offer => shared.includes(`"${offer.code}"`))) throw new Error("EVENT_SHARED_CONFIGURATION_MISMATCH");
if (!args.has("--inspect") && !args.has("--apply")) {
  console.log("OFFLINE_REPORT: one additive grants table; three exact product-scoped coupons; no customer/order/payment/price mutations. DB not connected.");
  console.log("Window UTC: 2026-11-30T15:00:00Z inclusive to 2026-12-31T15:00:00Z exclusive.");
  console.log("Apply requires explicit database identity, backup confirmation and database-access authorization. Inspect is read-only.");
  process.exit(0);
}
if (args.has("--inspect") && args.has("--apply")) throw new Error("SELECT_EXACTLY_ONE_MODE");
const expectedDatabase = args.has("--expected-database") ? value("--expected-database") : "";
if (!args.has("--allow-db") || !expectedDatabase || expectedDatabase.startsWith("--")) throw new Error("DB_ACCESS_AND_IDENTITY_REQUIRED");
if (args.has("--apply") && !args.has("--backup-confirmed")) throw new Error("VERIFIED_BACKUP_REQUIRED");
if (args.has("--apply") && process.env.VERCEL_ENV === "production" && !args.has("--allow-production")) throw new Error("PRODUCTION_AUTHORIZATION_REQUIRED");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_CONFIGURATION_REQUIRED");
const mysql = await import("mysql2/promise");
const url = new URL(process.env.DATABASE_URL);
if (decodeURIComponent(url.pathname.slice(1)) !== expectedDatabase) throw new Error("DATABASE_IDENTITY_REJECTED");
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
if (args.has("--apply") && !local && !args.has("--allow-production")) throw new Error("REMOTE_APPLY_AUTHORIZATION_REQUIRED");
if (args.has("--apply") && !local) {
  const expectedIdentity = args.has("--expected-identity-sha256") ? value("--expected-identity-sha256") : "";
  const actualIdentity = createHash("sha256").update(`${url.hostname}|${url.pathname}`).digest("hex");
  if (!/^[a-f0-9]{64}$/.test(expectedIdentity) || expectedIdentity !== actualIdentity) throw new Error("DATABASE_IDENTITY_HASH_REJECTED");
}
let conn;
try {
  conn = await mysql.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), database: expectedDatabase, timezone: "Z", ...(local ? {} : { ssl: { rejectUnauthorized: true } }) });
  const [[identity]] = await conn.query("SELECT DATABASE() AS name");
  if (identity.name !== expectedDatabase) throw new Error("DATABASE_IDENTITY_REJECTED");
  await conn.query("SET time_zone = '+00:00'");
  const [tables] = await conn.query("SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name IN ('coupons','coupon_product_rules','products','product_prices','december_report_coupon_grants')");
  if (tables.length < 4) throw new Error("COMMERCE_SCHEMA_INCOMPLETE");
  const [existing] = await conn.query("SELECT id,code,assignedCustomerId,discountType,discountValue,minOrderAmountKrw,startsAt,endsAt,maxRedemptions,maxPerCustomer,status FROM coupons WHERE code IN (?,?,?)", offers.map(x => x.code));
  for (const row of existing) {
    const offer = offers.find(x => x.code === row.code);
    if (row.assignedCustomerId !== null || row.discountType !== offer.type || Number(row.discountValue) !== offer.value || Number(row.minOrderAmountKrw) !== 0 || row.maxRedemptions !== null || Number(row.maxPerCustomer) !== 1 || row.status !== "active" || row.startsAt.toISOString() !== "2026-11-30T15:00:00.000Z" || row.endsAt?.toISOString() !== "2026-12-31T15:00:00.000Z") throw new Error("COUPON_CODE_COLLISION");
    const [rules] = await conn.query("SELECT p.code FROM coupon_product_rules r INNER JOIN products p ON p.id = r.productId WHERE r.couponId = ?", [row.id]);
    if (rules.length !== 1 || rules[0].code !== offer.productCode) throw new Error("COUPON_RULE_COLLISION");
  }
  for (const offer of offers) {
    const [rows] = await conn.query("SELECT p.id,pp.amountKrw,pp.regularAmountKrw FROM products p INNER JOIN product_prices pp ON pp.productId = p.id WHERE p.code = ? AND p.active = 1 AND p.requiresPayment = 1 AND pp.active = 1 AND pp.validFrom <= UTC_TIMESTAMP() AND (pp.validTo IS NULL OR pp.validTo > UTC_TIMESTAMP())", [offer.productCode]);
    if (rows.length !== 1 || Number(rows[0].amountKrw) !== offer.amount || Number(rows[0].regularAmountKrw || rows[0].amountKrw) !== offer.amount) throw new Error("EVENT_PRODUCT_PRICE_INVALID");
    offer.productId = rows[0].id;
  }
  console.log(`INSPECT_OK: commerce tables=${tables.length}; exact event coupons=${existing.length}; product prices verified; no secrets or customer rows printed.`);
  if (!args.has("--apply")) process.exitCode = 0;
  else {
    await conn.query(ddl); // additive, separately auto-committed by MySQL
    const [columns] = await conn.query("SELECT column_name,column_type,is_nullable FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='december_report_coupon_grants'");
    const columnNames = new Set(columns.map(x => x.COLUMN_NAME ?? x.column_name));
    if (columns.length !== 6 || !['id','eventKey','userId','productCode','couponId','issuedAt'].every(x => columnNames.has(x))) throw new Error("GRANTS_SCHEMA_COLLISION");
    const expectedTypes = { id: "int", eventKey: "varchar(40)", userId: "int", productCode: "varchar(80)", couponId: "int", issuedAt: "timestamp" };
    if (!columns.every(column => {
      const name = column.COLUMN_NAME ?? column.column_name;
      const type = String(column.COLUMN_TYPE ?? column.column_type).replace(/int\(\d+\)/, "int");
      return expectedTypes[name] === type && (column.IS_NULLABLE ?? column.is_nullable) === "NO";
    })) throw new Error("GRANTS_SCHEMA_COLLISION");
    const [indices] = await conn.query("SELECT index_name,non_unique,GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='december_report_coupon_grants' GROUP BY index_name,non_unique");
    if (!indices.some(x => (x.INDEX_NAME ?? x.index_name) === 'december_report_grants_account_product_unique' && Number(x.NON_UNIQUE ?? x.non_unique) === 0 && x.cols === 'eventKey,userId,productCode')) throw new Error("GRANTS_UNIQUE_INDEX_REQUIRED");
    await conn.beginTransaction();
    try {
      for (const offer of offers) {
        const [rows] = await conn.query("SELECT id FROM coupons WHERE code = ? FOR UPDATE", [offer.code]);
        if (rows.length) continue; // verified exact configuration; never overwrite a coupon collision
        const [created] = await conn.execute("INSERT INTO coupons (code,assignedCustomerId,discountType,discountValue,minOrderAmountKrw,startsAt,endsAt,maxRedemptions,maxPerCustomer,status) VALUES (?,NULL,?,?,0,?,?,NULL,1,'active')", [offer.code,offer.type,offer.value,start,end]);
        await conn.execute("INSERT INTO coupon_product_rules (couponId,productId) VALUES (?,?)", [created.insertId,offer.productId]);
      }
      await conn.commit();
      console.log("APPLY_OK: additive schema and exact three coupons/rules committed. No grants issued; no business customer/order/payment rows changed.");
    } catch (error) { await conn.rollback(); throw error; }
  }
} catch (error) {
  // Never print driver errors, credentials, row contents, or provider payloads.
  const code = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : "MIGRATION_FAILED_DETAILS_REDACTED";
  console.error(code); process.exitCode = 1;
} finally { if (conn) await conn.end(); }
