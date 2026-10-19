import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for the additive experience-request schema preparation");

const createMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0020_year_end_three_color_experience_requests.sql"), "utf8");
const cancellationMigration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0021_year_end_three_color_experience_request_cancellation.sql"), "utf8");
if (!createMigration.includes("CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests`") || !createMigration.includes("`requestFingerprintHash`")) {
  throw new Error("Unexpected experience-request creation migration content");
}
if (!cancellationMigration.includes("cancellationReasonEncrypted")) {
  throw new Error("Unexpected experience-request cancellation migration content");
}
for (const migration of [createMigration, cancellationMigration]) {
  for (const forbidden of ["DROP TABLE", "payment_transactions", "email_outbox", "entitlements", "orders", "confirmed_slots"]) {
    if (migration.includes(forbidden)) throw new Error("Experience-request migration contains a non-additive commerce operation or a capacity limit");
  }
}

const uri = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
const connection = await mysql.createConnection({ uri, ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" } });
try {
  await connection.query(createMigration);
  const [columns] = await connection.query("SHOW COLUMNS FROM `year_end_three_color_experience_requests` LIKE 'cancellationReasonEncrypted'");
  if (!Array.isArray(columns) || columns.length === 0) {
    await connection.query("ALTER TABLE `year_end_three_color_experience_requests` ADD COLUMN `cancellationReasonEncrypted` text NULL");
  }
  const [requestTables] = await connection.query("SHOW TABLES LIKE 'year_end_three_color_experience_requests'");
  if (!Array.isArray(requestTables) || requestTables.length !== 1) throw new Error("Experience-request cancellation schema verification failed");
  console.log("year-end experience request cancellation schema ready");
} finally {
  await connection.end();
}
