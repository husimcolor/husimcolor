import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for the additive experience-request schema preparation");

const createMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0020_year_end_three_color_experience_requests.sql"), "utf8");
const cancellationMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0021_year_end_three_color_experience_request_cancellation.sql"), "utf8");
const relationshipMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0022_year_end_three_color_relationship_details.sql"), "utf8");
if (!createMigration.includes("CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests`") || !createMigration.includes("`requestFingerprintHash`")) {
  throw new Error("Unexpected experience-request creation migration content");
}
if (!cancellationMigration.includes("cancellationReasonEncrypted")) {
  throw new Error("Unexpected experience-request cancellation migration content");
}
if (!relationshipMigration.includes("relationship_coaching_experience") || !relationshipMigration.includes("childAgeEncrypted")) {
  throw new Error("Unexpected experience-request relationship migration content");
}
for (const migration of [createMigration, cancellationMigration, relationshipMigration]) {
  for (const forbidden of ["DROP TABLE", "payment_transactions", "email_outbox", "entitlements", "orders", "confirmed_slots"]) {
    if (migration.includes(forbidden)) throw new Error("Experience-request migration contains a non-additive commerce operation or a capacity limit");
  }
}

const uri = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
const connection = await mysql.createConnection({ uri, ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" } });

async function hasColumn(columnName) {
  const [rows] = await connection.query("SHOW COLUMNS FROM `year_end_three_color_experience_requests` LIKE ?", [columnName]);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

try {
  await connection.query(createMigration);

  const productColumn = await hasColumn("productCode");
  if (!String(productColumn?.Type ?? "").includes("relationship_coaching_experience")) {
    await connection.query("ALTER TABLE `year_end_three_color_experience_requests` MODIFY COLUMN `productCode` enum('personal_three_color_experience','engaged_couple_three_color_experience','relationship_coaching_experience') NOT NULL");
  }
  if (!await hasColumn("relationshipType")) {
    await connection.query("ALTER TABLE `year_end_three_color_experience_requests` ADD COLUMN `relationshipType` enum('married_couple','lovers','parent_child') NULL");
  }
  if (!await hasColumn("childAgeEncrypted")) {
    await connection.query("ALTER TABLE `year_end_three_color_experience_requests` ADD COLUMN `childAgeEncrypted` text NULL");
  }
  if (!await hasColumn("cancellationReasonEncrypted")) {
    await connection.query("ALTER TABLE `year_end_three_color_experience_requests` ADD COLUMN `cancellationReasonEncrypted` text NULL");
  }

  const productAfter = await hasColumn("productCode");
  const relationshipAfter = await hasColumn("relationshipType");
  const childAgeAfter = await hasColumn("childAgeEncrypted");
  const cancellationAfter = await hasColumn("cancellationReasonEncrypted");
  if (!String(productAfter?.Type ?? "").includes("relationship_coaching_experience") || !relationshipAfter || !childAgeAfter || !cancellationAfter) {
    throw new Error("Experience-request relationship schema verification failed");
  }
  console.log("year-end experience request relationship schema ready");
} finally {
  await connection.end();
}
