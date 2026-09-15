import mysql from "mysql2/promise";

const shouldApply =
  process.env.VERCEL_ENV === "preview" &&
  process.env.COMMERCE_PREVIEW_ACCOUNT_LINK_OUTBOX_MIGRATION === "true";

if (!shouldApply) {
  console.log("[account-link-outbox] skipped outside the approved Preview migration scope");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  throw new Error("[account-link-outbox] DATABASE_URL is unavailable in Preview");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [challengeColumns] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'account_link_challenges' AND COLUMN_NAME = 'codeEncrypted'",
  );
  if (challengeColumns.length === 0) {
    await connection.execute("ALTER TABLE `account_link_challenges` ADD `codeEncrypted` text NULL");
  }

  const [outboxColumns] = await connection.execute(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND COLUMN_NAME = 'accountLinkChallengeId'",
  );
  if (outboxColumns.length === 0) {
    await connection.execute("ALTER TABLE `email_outbox` ADD `accountLinkChallengeId` int NULL");
  }

  const [indexes] = await connection.execute(
    "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND INDEX_NAME = 'email_outbox_account_link_challenge_idx'",
  );
  if (indexes.length === 0) {
    await connection.execute("CREATE INDEX `email_outbox_account_link_challenge_idx` ON `email_outbox` (`accountLinkChallengeId`)");
  }
  console.log("[account-link-outbox] Preview email outbox schema ready");
} finally {
  await connection.end();
}
