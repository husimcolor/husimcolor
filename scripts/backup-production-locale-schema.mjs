import { existsSync, rmSync, writeFileSync } from "node:fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const envPath = process.env.PRODUCTION_ENV_FILE ?? ".env.production";
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });

const outputPath = process.env.ZH_CN_LOCALE_SCHEMA_BACKUP_FILE ?? "zh-cn-locale-schema-before.sql";
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl || databaseUrl.includes("[SENSITIVE]")) throw new Error("PRODUCTION_DATABASE_URL_MISSING");

let parsedDatabaseUrl;
try {
  parsedDatabaseUrl = new URL(databaseUrl);
} catch {
  throw new Error("PRODUCTION_DATABASE_URL_INVALID");
}
const isLoopback = parsedDatabaseUrl.hostname === "127.0.0.1" || parsedDatabaseUrl.hostname === "localhost";
const productionApproved = process.env.ALLOW_PRODUCTION_ZH_CN_LOCALE_MIGRATION === "true";
const localTestApproved = process.env.ALLOW_LOCAL_ZH_CN_LOCALE_MIGRATION_TEST === "true";
if (!productionApproved && !(isLoopback && localTestApproved)) {
  throw new Error("ZH_CN_LOCALE_SCHEMA_BACKUP_APPROVAL_REQUIRED");
}

const tables = ["analysis_runs", "relationship_sessions", "email_outbox"];

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [schemaRows] = await connection.query("SELECT DATABASE() AS schemaName");
    const schemaName = schemaRows?.[0]?.schemaName;
    if (!schemaName) throw new Error("PRODUCTION_SCHEMA_NOT_SELECTED");

    const chunks = [
      "-- HUSIM COLOR zh-CN locale metadata pre-migration schema backup",
      "-- Contains table DDL only. No customer rows, PDFs, orders, emails, tokens or credentials.",
      `-- Schema: ${schemaName}`,
      `-- Created at: ${new Date().toISOString()}`,
      "",
    ];
    const tableCounts = [];
    for (const table of tables) {
      const [definitionRows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const definition = definitionRows?.[0]?.["Create Table"];
      if (typeof definition !== "string") throw new Error(`ZH_CN_LOCALE_SCHEMA_BACKUP_TABLE_MISSING:${table}`);
      const [countRows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
      tableCounts.push({ table, rows: Number(countRows?.[0]?.count ?? 0) });
      // 이 artifact는 운영 스키마를 읽기 전용으로 기록한다. 복사·실행으로 고객
      // 데이터를 지울 수 있는 table deletion statement는 어떤 형태로도 포함하지 않는다.
      chunks.push(`-- Existing table preserved: \`${table}\``);
      chunks.push(`${definition};`, "");
    }
    writeFileSync(outputPath, chunks.join("\n"), "utf8");
    console.log(JSON.stringify({
      backup: "zh-cn-locale-pre-migration-schema",
      schemaOnly: true,
      containsCustomerRows: false,
      tableCounts,
      tables,
    }));
  } finally {
    await connection.end();
    if (process.env.REMOVE_PRODUCTION_ENV_FILE === "true" && existsSync(envPath)) {
      rmSync(envPath, { force: true });
    }
  }
}

await main();
