import { existsSync, writeFileSync } from "node:fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const envPath = process.env.PRODUCTION_ENV_FILE ?? ".env.production";
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("PRODUCTION_DATABASE_URL_MISSING");
if (process.env.ALLOW_PRODUCTION_RELATIONSHIP_CONVERSION_MIGRATION !== "true") {
  throw new Error("RELATIONSHIP_CONVERSION_MIGRATION_APPROVAL_REQUIRED");
}

const outputPath = process.env.RELATIONSHIP_CONVERSION_SCHEMA_BACKUP_FILE ?? "relationship-conversion-schema-before.sql";
const baselineTables = ["relationship_participants", "relationship_sessions", "entitlements", "products"];
const additiveTables = ["relationship_setups", "commerce_funnel_events"];

async function getExistingTableNames(connection, names) {
  const [rows] = await connection.query(
    `SELECT table_name AS tableName
       FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name IN (${names.map(() => "?").join(",")})`,
    names,
  );
  return new Set(rows.map((row) => String(row.tableName)));
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [schemaRows] = await connection.query("SELECT DATABASE() AS schemaName");
    if (!schemaRows?.[0]?.schemaName) throw new Error("PRODUCTION_SCHEMA_NOT_SELECTED");

    const existingBaseline = await getExistingTableNames(connection, baselineTables);
    if (existingBaseline.size !== baselineTables.length) {
      throw new Error("RELATIONSHIP_CONVERSION_REQUIRED_TABLE_MISSING");
    }
    const existingAdditive = await getExistingTableNames(connection, additiveTables);
    const statements = [
      "-- husimcolor relationship conversion schema backup (schema only; no customer rows)",
      "-- Captured before additive 0023 relationship setup and conversion funnel migration.",
      "",
    ];

    for (const table of baselineTables) {
      const [rows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const createSql = rows?.[0]?.["Create Table"];
      if (!createSql) throw new Error(`RELATIONSHIP_CONVERSION_SCHEMA_BACKUP_FAILED:${table}`);
      statements.push(`-- Existing table: ${table}`, `${createSql};`, "");
    }
    for (const table of additiveTables) {
      if (existingAdditive.has(table)) {
        const [rows] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
        const createSql = rows?.[0]?.["Create Table"];
        if (!createSql) throw new Error(`RELATIONSHIP_CONVERSION_SCHEMA_BACKUP_FAILED:${table}`);
        statements.push(`-- Existing additive table: ${table}`, `${createSql};`, "");
      } else {
        statements.push(`-- Table absent before migration: ${table}`, "");
      }
    }

    writeFileSync(outputPath, `${statements.join("\n")}\n`, { mode: 0o600 });
    console.log(JSON.stringify({
      migration: "0023_relationship_setup_and_conversion_funnel",
      schemaVerified: true,
      dataRead: false,
      customerRowsExported: 0,
      secretValuesLogged: false,
      backedUpTables: [...baselineTables, ...existingAdditive].sort(),
      additiveTablesAlreadyPresent: [...existingAdditive].sort(),
      output: outputPath,
    }));
  } finally {
    await connection.end();
  }
}

await main();
