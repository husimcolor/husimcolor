import { existsSync, rmSync } from "node:fs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const envPath = process.env.PRODUCTION_ENV_FILE ?? ".env.production";
if (existsSync(envPath)) dotenv.config({ path: envPath, override: false, quiet: true });

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("PRODUCTION_DATABASE_URL_MISSING");
if (process.env.ALLOW_PRODUCTION_RELATIONSHIP_CONVERSION_MIGRATION !== "true") {
  throw new Error("RELATIONSHIP_CONVERSION_MIGRATION_APPROVAL_REQUIRED");
}

const requiredTables = ["relationship_participants", "relationship_sessions", "entitlements", "products"];
const migrationName = "0023_relationship_setup_and_conversion_funnel";
const funnelEventTypes = [
  "free_result",
  "paid_guide_click",
  "sample_view",
  "checkout_view",
  "toss_request",
  "payment_success",
  "payment_cancelled",
  "payment_failed",
];
const funnelProductCodes = [
  "free_color_trial",
  "personal_deep",
  "couple_love_deep",
  "parent_child_deep",
];

async function queryCount(connection, sql, params = []) {
  const [rows] = await connection.query(sql, params);
  return Number(rows?.[0]?.count ?? 0);
}

async function hasColumn(connection, table, column) {
  return queryCount(
    connection,
    `SELECT COUNT(*) AS count FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column],
  );
}

async function hasIndex(connection, table, index) {
  return queryCount(
    connection,
    `SELECT COUNT(*) AS count FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index],
  );
}

async function main() {
  const connection = await mysql.createConnection(databaseUrl);
  try {
    const [schemaRows] = await connection.query("SELECT DATABASE() AS schemaName");
    if (!schemaRows?.[0]?.schemaName) throw new Error("PRODUCTION_SCHEMA_NOT_SELECTED");

    const baseTableCount = await queryCount(
      connection,
      `SELECT COUNT(*) AS count FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name IN (${requiredTables.map(() => "?").join(",")})`,
      requiredTables,
    );
    if (baseTableCount !== requiredTables.length) {
      throw new Error("RELATIONSHIP_CONVERSION_REQUIRED_TABLE_MISSING");
    }

    const applied = [];
    if (!(await hasColumn(connection, "relationship_participants", "assignedRoleEncrypted"))) {
      await connection.query("ALTER TABLE `relationship_participants` ADD COLUMN `assignedRoleEncrypted` text NULL AFTER `consentAcceptedAt`");
      applied.push("relationship_participants.assignedRoleEncrypted");
    }

    const relationshipSetupsExists = await queryCount(
      connection,
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'relationship_setups'",
    );
    if (!relationshipSetupsExists) {
      await connection.query(`CREATE TABLE \`relationship_setups\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`entitlementId\` int NOT NULL,
        \`productCode\` varchar(64) NOT NULL,
        \`configurationEncrypted\` text NOT NULL,
        \`configuredAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`relationship_setups_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`relationship_setups_entitlement_unique\` UNIQUE(\`entitlementId\`)
      )`);
      applied.push("relationship_setups");
    }
    if (!(await hasIndex(connection, "relationship_setups", "relationship_setups_product_idx"))) {
      await connection.query("CREATE INDEX `relationship_setups_product_idx` ON `relationship_setups` (`productCode`)");
      applied.push("relationship_setups_product_idx");
    }

    const funnelTableExists = await queryCount(
      connection,
      "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'commerce_funnel_events'",
    );
    if (!funnelTableExists) {
      await connection.query(`CREATE TABLE \`commerce_funnel_events\` (
        \`id\` int AUTO_INCREMENT NOT NULL,
        \`eventKey\` varchar(255) NOT NULL,
        \`deviceId\` varchar(128) NOT NULL,
        \`eventType\` enum(${funnelEventTypes.map((value) => `'${value}'`).join(",")}) NOT NULL,
        \`productCode\` enum(${funnelProductCodes.map((value) => `'${value}'`).join(",")}) NOT NULL,
        \`locale\` varchar(35) NOT NULL DEFAULT 'ko-KR',
        \`channel\` enum('app','web') NOT NULL,
        \`isTest\` boolean NOT NULL DEFAULT false,
        \`occurredAt\` timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT \`commerce_funnel_events_id\` PRIMARY KEY(\`id\`),
        CONSTRAINT \`commerce_funnel_events_event_key_unique\` UNIQUE(\`eventKey\`)
      )`);
      applied.push("commerce_funnel_events");
    }
    if (!(await hasIndex(connection, "commerce_funnel_events", "commerce_funnel_events_rollup_idx"))) {
      await connection.query("CREATE INDEX `commerce_funnel_events_rollup_idx` ON `commerce_funnel_events` (`occurredAt`,`productCode`,`locale`,`channel`,`isTest`,`eventType`,`deviceId`)");
      applied.push("commerce_funnel_events_rollup_idx");
    }

    const verification = {
      assignedRoleEncrypted: Boolean(await hasColumn(connection, "relationship_participants", "assignedRoleEncrypted")),
      relationshipSetups: Boolean(await queryCount(connection, "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'relationship_setups'")),
      relationshipSetupsUnique: Boolean(await hasIndex(connection, "relationship_setups", "relationship_setups_entitlement_unique")),
      funnelEvents: Boolean(await queryCount(connection, "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'commerce_funnel_events'")),
      funnelEventKeyUnique: Boolean(await hasIndex(connection, "commerce_funnel_events", "commerce_funnel_events_event_key_unique")),
      funnelRollupIndex: Boolean(await hasIndex(connection, "commerce_funnel_events", "commerce_funnel_events_rollup_idx")),
    };
    if (Object.values(verification).some((value) => !value)) {
      throw new Error("RELATIONSHIP_CONVERSION_MIGRATION_VERIFICATION_FAILED");
    }

    console.log(JSON.stringify({
      migration: migrationName,
      schemaVerified: true,
      dataMutation: false,
      existingCustomerRowsUpdated: 0,
      existingOrdersUpdated: 0,
      existingResultsUpdated: 0,
      existingPdfOrOutboxRowsUpdated: 0,
      destructiveStatements: 0,
      applied,
      verification,
      rollback: "애플리케이션만 이전 revision으로 되돌린다. 새 DB 객체 삭제는 데이터 손실이므로 자동 rollback 대상이 아니다.",
    }));
  } finally {
    await connection.end();
    if (process.env.REMOVE_PRODUCTION_ENV_FILE === "true" && existsSync(envPath)) {
      rmSync(envPath, { force: true });
    }
  }
}

await main();
