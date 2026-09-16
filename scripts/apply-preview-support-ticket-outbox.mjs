import mysql from "mysql2/promise";

const shouldApply =
  process.env.VERCEL_ENV === "preview" &&
  process.env.COMMERCE_PREVIEW_SUPPORT_TICKET_MIGRATION === "true";

if (!shouldApply) {
  console.log("[support-ticket-outbox] skipped outside the approved Preview migration scope");
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("[support-ticket-outbox] DATABASE_URL is unavailable in Preview");

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS \`support_tickets\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NULL,
      \`contactEmailHash\` varchar(128) NOT NULL,
      \`contactEmailEncrypted\` text NOT NULL,
      \`subject\` varchar(160) NOT NULL,
      \`messageEncrypted\` text NOT NULL,
      \`status\` enum('open','closed') NOT NULL DEFAULT 'open',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`closedAt\` timestamp NULL,
      PRIMARY KEY (\`id\`),
      INDEX \`support_tickets_user_status_idx\` (\`userId\`, \`status\`)
    )
  `);
  const [columns] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND COLUMN_NAME = 'supportTicketId'",
  );
  if (columns.length === 0) await connection.execute("ALTER TABLE `email_outbox` ADD `supportTicketId` int NULL");
  await connection.execute("ALTER TABLE `email_outbox` MODIFY `purpose` enum('account_link','analysis_result_pdf','support_notification') NOT NULL");
  const [indexes] = await connection.execute(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND INDEX_NAME = 'email_outbox_support_ticket_idx'",
  );
  if (indexes.length === 0) await connection.execute("CREATE INDEX `email_outbox_support_ticket_idx` ON `email_outbox` (`supportTicketId`)");
  console.log("[support-ticket-outbox] Preview support ticket schema ready");
} finally {
  await connection.end();
}
