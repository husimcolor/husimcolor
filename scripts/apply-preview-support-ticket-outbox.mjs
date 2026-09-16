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
      \`contactNameEncrypted\` text NULL,
      \`contactEmailHash\` varchar(128) NOT NULL,
      \`contactEmailEncrypted\` text NOT NULL,
      \`inquiryType\` enum('payment_refund','analysis_result','pdf_email','coaching_booking','other') NOT NULL DEFAULT 'other',
      \`subject\` varchar(160) NOT NULL,
      \`messageEncrypted\` text NOT NULL,
      \`status\` enum('received','reviewing','answered') NOT NULL DEFAULT 'received',
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`respondedAt\` timestamp NULL,
      \`closedAt\` timestamp NULL,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`support_tickets_user_status_idx\` (\`userId\`, \`status\`)
    )
  `);
  const [supportColumns] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets'",
  );
  const supportColumnNames = new Set(supportColumns.map((row) => row.COLUMN_NAME));
  if (!supportColumnNames.has("contactNameEncrypted")) await connection.execute("ALTER TABLE `support_tickets` ADD `contactNameEncrypted` text NULL");
  if (!supportColumnNames.has("inquiryType")) await connection.execute("ALTER TABLE `support_tickets` ADD `inquiryType` enum('payment_refund','analysis_result','pdf_email','coaching_booking','other') NOT NULL DEFAULT 'other'");
  if (!supportColumnNames.has("respondedAt")) await connection.execute("ALTER TABLE `support_tickets` ADD `respondedAt` timestamp NULL");
  if (!supportColumnNames.has("updatedAt")) await connection.execute("ALTER TABLE `support_tickets` ADD `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  await connection.execute("ALTER TABLE `support_tickets` MODIFY `status` enum('open','closed','received','reviewing','answered') NOT NULL DEFAULT 'received'");
  await connection.execute("UPDATE `support_tickets` SET `status` = 'received' WHERE `status` = 'open'");
  await connection.execute("UPDATE `support_tickets` SET `status` = 'answered', `respondedAt` = COALESCE(`respondedAt`, `closedAt`) WHERE `status` = 'closed'");
  await connection.execute("ALTER TABLE `support_tickets` MODIFY `status` enum('received','reviewing','answered') NOT NULL DEFAULT 'received'");
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
