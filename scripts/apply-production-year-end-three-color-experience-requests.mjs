import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for the additive experience-request schema preparation");
const migration = fs.readFileSync(path.resolve(process.cwd(), "drizzle/0020_year_end_three_color_experience_requests.sql"), "utf8");
if (!migration.includes("CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests`") || !migration.includes("`requestFingerprintHash`")) throw new Error("Unexpected experience-request migration content");
for (const forbidden of ["ALTER TABLE", "DROP TABLE", "payment_transactions", "email_outbox", "entitlements", "orders"]) {
  if (migration.includes(forbidden)) throw new Error("Experience-request migration contains a non-additive commerce operation");
}

const uri = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
const connection = await mysql.createConnection({ uri, ssl: { rejectUnauthorized: false, minVersion: "TLSv1.2" } });
try {
  await connection.query(migration);
  const [rows] = await connection.query("SHOW TABLES LIKE 'year_end_three_color_experience_requests'");
  if (!Array.isArray(rows) || rows.length !== 1) throw new Error("Experience-request table verification failed");
  console.log("year_end_three_color_experience_requests schema ready");
} finally {
  await connection.end();
}
