import { existsSync, rmSync } from "node:fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const envPath = process.env.PRODUCTION_ENV_FILE ?? ".env.production";
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("PRODUCTION_DATABASE_URL_MISSING");

const parsedDatabaseUrl = new URL(databaseUrl);
const isLoopback = parsedDatabaseUrl.hostname === "127.0.0.1" || parsedDatabaseUrl.hostname === "localhost";
const productionApproved = process.env.ALLOW_PRODUCTION_ZH_CN_LOCALE_MIGRATION === "true";
const localTestApproved = process.env.ALLOW_LOCAL_ZH_CN_LOCALE_MIGRATION_TEST === "true";
if (!productionApproved && !(isLoopback && localTestApproved)) {
  throw new Error("ZH_CN_LOCALE_MIGRATION_APPROVAL_REQUIRED");
}

const additions = [
  { table: "analysis_runs", column: "locale", definition: "varchar(12) NULL" },
  { table: "analysis_runs", column: "copyVersion", definition: "varchar(80) NULL" },
  { table: "relationship_sessions", column: "locale", definition: "varchar(12) NULL" },
  { table: "relationship_sessions", column: "copyVersion", definition: "varchar(80) NULL" },
  { table: "email_outbox", column: "locale", definition: "varchar(12) NULL" },
  { table: "email_outbox", column: "copyVersion", definition: "varchar(80) NULL" },
];

function columnKey(entry) {
  return `${entry.table}.${entry.column}`;
}

async function readColumns(connection) {
  const tableNames = [...new Set(additions.map((entry) => entry.table))];
  const columnNames = [...new Set(additions.map((entry) => entry.column))];
  const [rows] = await connection.query(
    `SELECT table_name AS tableName, column_name AS columnName, column_type AS columnType, is_nullable AS isNullable
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name IN (${tableNames.map(() => "?").join(",")})
        AND column_name IN (${columnNames.map(() => "?").join(",")})
      ORDER BY table_name, column_name`,
    [...tableNames, ...columnNames],
  );
  return rows;
}

async function readTableCounts(connection) {
  const tableNames = [...new Set(additions.map((entry) => entry.table))];
  const [rows] = await connection.query(
    `SELECT table_name AS tableName, table_rows AS estimatedRows
       FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name IN (${tableNames.map(() => "?").join(",")})
      ORDER BY table_name`,
    tableNames,
  );
  if (rows.length !== tableNames.length) throw new Error("ZH_CN_LOCALE_MIGRATION_REQUIRED_TABLE_MISSING");
  return rows.map((row) => ({ table: row.tableName, estimatedRows: Number(row.estimatedRows ?? 0) }));
}

function validateColumns(rows) {
  const present = new Map(rows.map((row) => [`${row.tableName}.${row.columnName}`, row]));
  for (const entry of additions) {
    const row = present.get(columnKey(entry));
    if (!row) throw new Error(`ZH_CN_LOCALE_MIGRATION_COLUMN_MISSING:${columnKey(entry)}`);
    const expectedType = entry.column === "locale" ? "varchar(12)" : "varchar(80)";
    if (String(row.columnType).toLowerCase() !== expectedType || row.isNullable !== "YES") {
      throw new Error(`ZH_CN_LOCALE_MIGRATION_COLUMN_MISMATCH:${columnKey(entry)}`);
    }
  }
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [schemaRows] = await connection.query("SELECT DATABASE() AS schemaName");
    const schemaName = schemaRows?.[0]?.schemaName;
    if (!schemaName) throw new Error("PRODUCTION_SCHEMA_NOT_SELECTED");

    const tableCountsBefore = await readTableCounts(connection);
    const before = await readColumns(connection);
    const beforeKeys = new Set(before.map((row) => `${row.tableName}.${row.columnName}`));
    const applied = [];

    for (const entry of additions) {
      if (beforeKeys.has(columnKey(entry))) continue;
      await connection.query(`ALTER TABLE \`${entry.table}\` ADD COLUMN \`${entry.column}\` ${entry.definition}`);
      applied.push(columnKey(entry));
    }

    const after = await readColumns(connection);
    validateColumns(after);
    const tableCountsAfter = await readTableCounts(connection);

    console.log(JSON.stringify({
      migration: "0020_locale_snapshot_metadata",
      schemaVerified: true,
      dataMutation: false,
      existingRowsUpdated: 0,
      destructiveStatements: 0,
      appliedColumns: applied,
      columns: after.map((row) => ({
        table: row.tableName,
        column: row.columnName,
        type: row.columnType,
        nullable: row.isNullable === "YES",
      })),
      tableCountsBefore,
      tableCountsAfter,
      rollback: {
        application: "배포 코드만 직전 revision으로 되돌려도 기존 행과 새 nullable metadata 열은 보존됩니다.",
        schema: "새 zh-CN 결과를 생성하기 전이며 appliedColumns가 비어 있지 않을 때만, 동일 열을 DROP COLUMN으로 되돌릴 수 있습니다. 생성 후에는 열을 삭제하지 않고 application rollback만 사용합니다.",
      },
    }));
  } finally {
    await connection.end();
    if (process.env.REMOVE_PRODUCTION_ENV_FILE === "true" && existsSync(envPath)) {
      rmSync(envPath, { force: true });
    }
  }
}

await main();
