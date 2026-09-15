import mysql from "mysql2/promise";

let readinessPromise: Promise<void> | null = null;

/**
 * Preview 공통 DB에서만 계정 연결 인증용 추가 컬럼을 멱등 확인한다.
 * Production 데이터는 이 경로에서 변경하지 않으며, Production 반영은 정식
 * Drizzle migration으로만 수행한다.
 */
export function ensurePreviewAccountLinkOutboxSchema(): Promise<void> {
  const isApprovedPreview =
    process.env.VERCEL_ENV === "preview" &&
    process.env.COMMERCE_PREVIEW_ACCOUNT_LINK_OUTBOX_MIGRATION === "true";

  if (!isApprovedPreview) return Promise.resolve();
  if (readinessPromise) return readinessPromise;

  readinessPromise = (async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("PREVIEW_ACCOUNT_LINK_DATABASE_UNAVAILABLE");
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    try {
      const [challengeColumns] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'account_link_challenges' AND COLUMN_NAME = 'codeEncrypted'",
      );
      if ((challengeColumns as unknown[]).length === 0) {
        await connection.execute("ALTER TABLE `account_link_challenges` ADD `codeEncrypted` text NULL");
      }

      const [outboxColumns] = await connection.execute(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND COLUMN_NAME = 'accountLinkChallengeId'",
      );
      if ((outboxColumns as unknown[]).length === 0) {
        await connection.execute("ALTER TABLE `email_outbox` ADD `accountLinkChallengeId` int NULL");
      }

      const [indexes] = await connection.execute(
        "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_outbox' AND INDEX_NAME = 'email_outbox_account_link_challenge_idx'",
      );
      if ((indexes as unknown[]).length === 0) {
        await connection.execute("CREATE INDEX `email_outbox_account_link_challenge_idx` ON `email_outbox` (`accountLinkChallengeId`)");
      }
    } finally {
      await connection.end();
    }
  })().catch((error) => {
    readinessPromise = null;
    const reason = error instanceof Error ? error.message : "UNKNOWN";
    console.error("[account-link-outbox] Preview schema readiness failed", reason);
    throw error;
  });

  return readinessPromise;
}
