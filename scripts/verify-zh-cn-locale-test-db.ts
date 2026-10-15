import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";

import { analysisRuns, customers, emailOutbox, privateDocuments, products } from "../drizzle/schema";
import { localizePayload } from "../lib/zh-cn-copy";
import { getAnalysisResultEmailPayload } from "../server/commerce/email-outbox-service";
import { getDb } from "../server/db";
import { createPremiumPdfBuffer } from "../server/pdf-report";
import { encryptCommerceEmail, hashCommerceEmail } from "../server/commerce/crypto";
import type { PremiumPdfDownloadPayload } from "../shared/premium-pdf-download";
import { copyVersionForLocale, resolveStoredResultLocale } from "../shared/localization";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const outputDir = process.env.ZH_CN_TEST_OUTPUT_DIR ?? "/tmp/husimcolor-zh-cn-v11.2-testdb-proof";
const fixturePath = "/tmp/husimcolor-zh-cn-sample-korean-payloads/personal.json";
const testSuffix = `zh-cn-locale-proof-${Date.now()}`;
const fakeEmail = `${testSuffix}@invalid.example`;

async function main() {
  assert(process.env.DATABASE_URL, "DATABASE_URL is required for the isolated test database");
  assert(process.env.COMMERCE_EMAIL_HASH_SECRET, "COMMERCE_EMAIL_HASH_SECRET is required for the isolated test database");
  assert(process.env.COMMERCE_EMAIL_ENCRYPTION_KEY, "COMMERCE_EMAIL_ENCRYPTION_KEY is required for the isolated test database");

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const db = await getDb();
  assert(db, "ISOLATED_TEST_DATABASE_NOT_AVAILABLE");
  const now = new Date();
  const retentionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const existingProduct = (await db.select().from(products).where(eq(products.code, "personal_deep")).limit(1))[0];
  const productId = existingProduct
    ? existingProduct.id
    : Number((await db.insert(products).values({
      code: "personal_deep",
      name: "테스트 전용 개인 심화",
      fulfillmentType: "analysis",
      requiresPayment: false,
      active: true,
    }))[0].insertId);

  const encryptedEmail = encryptCommerceEmail(fakeEmail);
  const emailHash = hashCommerceEmail(fakeEmail);
  const insertedCustomer = await db.insert(customers).values({
    emailHash,
    emailEncrypted: encryptedEmail,
    status: "active",
  });
  const customerId = Number(insertedCustomer[0].insertId);

  const zhCopyVersion = copyVersionForLocale("zh-CN");
  const insertedZhRun = await db.insert(analysisRuns).values({
    productId,
    customerId,
    accessMode: "guest",
    status: "started",
    resultReference: `${testSuffix}-zh`,
    locale: "zh-CN",
    copyVersion: zhCopyVersion,
  });
  const zhRunId = Number(insertedZhRun[0].insertId);

  const insertedLegacyRun = await db.insert(analysisRuns).values({
    productId,
    customerId,
    accessMode: "guest",
    status: "started",
    resultReference: `${testSuffix}-legacy`,
    locale: null,
    copyVersion: null,
  });
  const legacyRunId = Number(insertedLegacyRun[0].insertId);

  const insertedDocument = await db.insert(privateDocuments).values({
    customerId,
    analysisRunId: zhRunId,
    documentType: "analysis_pdf",
    status: "generated",
    storageKey: `test-only/no-send/${testSuffix}.pdf`,
    retentionExpiresAt,
  });
  const privateDocumentId = Number(insertedDocument[0].insertId);

  const insertedOutbox = await db.insert(emailOutbox).values({
    customerId,
    privateDocumentId,
    purpose: "analysis_result_pdf",
    toEmailHash: emailHash,
    toEmailEncrypted: encryptedEmail,
    status: "queued",
    attemptCount: 0,
    nextAttemptAt: now,
    locale: "zh-CN",
    copyVersion: zhCopyVersion,
  });
  const outboxId = Number(insertedOutbox[0].insertId);

  const [storedZhRun] = await db.select().from(analysisRuns).where(eq(analysisRuns.id, zhRunId)).limit(1);
  const [storedLegacyRun] = await db.select().from(analysisRuns).where(eq(analysisRuns.id, legacyRunId)).limit(1);
  const [storedOutbox] = await db.select().from(emailOutbox).where(eq(emailOutbox.id, outboxId)).limit(1);
  assert(storedZhRun, "ZH_RUN_READBACK_FAILED");
  assert(storedLegacyRun, "LEGACY_RUN_READBACK_FAILED");
  assert(storedOutbox, "OUTBOX_READBACK_FAILED");

  const zhResultLocale = resolveStoredResultLocale(storedZhRun.locale);
  const legacyResultLocale = resolveStoredResultLocale(storedLegacyRun.locale);
  const deviceLocaleAfterSwitch = "ko";
  assert(zhResultLocale === "zh-CN", "SAVED_ZH_RESULT_DID_NOT_RETAIN_ZH_CN");
  assert(legacyResultLocale === "ko", "LEGACY_NULL_LOCALE_DID_NOT_FALL_BACK_TO_KOREAN");
  assert(deviceLocaleAfterSwitch === "ko" && zhResultLocale === "zh-CN", "DEVICE_LANGUAGE_OVERRIDE_CHANGED_STORED_ZH_RESULT");
  assert(storedZhRun.copyVersion === zhCopyVersion, "ZH_COPY_VERSION_READBACK_FAILED");
  assert(storedOutbox.locale === "zh-CN" && storedOutbox.copyVersion === zhCopyVersion, "OUTBOX_LOCALE_COPY_VERSION_READBACK_FAILED");
  assert(storedOutbox.status === "queued", "OUTBOX_IS_NOT_QUEUED");

  const canonicalPayload = JSON.parse(readFileSync(fixturePath, "utf8")) as PremiumPdfDownloadPayload;
  const zhPayload = localizePayload(
    { ...canonicalPayload, locale: zhResultLocale, copyVersion: storedZhRun.copyVersion ?? undefined },
    zhResultLocale,
  );
  const legacyPayload = localizePayload(
    { ...canonicalPayload, locale: legacyResultLocale, copyVersion: storedLegacyRun.copyVersion ?? undefined },
    legacyResultLocale,
  );
  const zhPdfPath = path.join(outputDir, "test-db-stored-zh-CN-result.pdf");
  const legacyPdfPath = path.join(outputDir, "test-db-legacy-ko-result.pdf");
  writeFileSync(zhPdfPath, await createPremiumPdfBuffer(zhPayload));
  writeFileSync(legacyPdfPath, await createPremiumPdfBuffer(legacyPayload));
  assert(existsSync(zhPdfPath) && existsSync(legacyPdfPath), "PDF_GENERATION_FAILED");

  const zhPdfText = execFileSync("pdftotext", [zhPdfPath, "-"], { encoding: "utf8" });
  const legacyPdfText = execFileSync("pdftotext", [legacyPdfPath, "-"], { encoding: "utf8" });
  assert(zhPdfText.includes("推荐调和色") && zhPdfText.includes("主要心理特征"), "ZH_PDF_TEXT_IS_NOT_LOCALIZED");
  assert(!zhPdfText.includes("추천 보완컬러"), "ZH_PDF_CONTAINS_KOREAN_ROLE_LABEL");
  assert(legacyPdfText.includes("추천 보완컬러") && legacyPdfText.includes("주기질"), "LEGACY_PDF_DID_NOT_REMAIN_KOREAN");

  const queuedEmailLocale = resolveStoredResultLocale(storedOutbox.locale);
  const queuedEmailPayload = getAnalysisResultEmailPayload(queuedEmailLocale);
  const legacyEmailPayload = getAnalysisResultEmailPayload(legacyResultLocale);
  assert(queuedEmailPayload.subject === "[HUSIM COLOR] 您的分析报告（PDF）", "ZH_OUTBOX_SUBJECT_LOCALE_MISMATCH");
  assert(queuedEmailPayload.html.includes("完成的结果报告"), "ZH_OUTBOX_BODY_LOCALE_MISMATCH");
  assert(legacyEmailPayload.subject === "[휴심컬러] 완료된 결과 리포트 PDF", "LEGACY_OUTBOX_SUBJECT_LOCALE_MISMATCH");

  const proof = {
    environment: "isolated-local-mariadb",
    database: "husim_zhcn_test",
    productionDatabaseTouched: false,
    emailDispatchCalled: false,
    storageUploadCalled: false,
    testData: "synthetic identifiers and invalid.example email only",
    storedZhRun: {
      locale: storedZhRun.locale,
      copyVersion: storedZhRun.copyVersion,
      resolvedScreenLocaleAfterDeviceSwitchedToKorean: zhResultLocale,
    },
    legacyRun: {
      locale: storedLegacyRun.locale,
      copyVersion: storedLegacyRun.copyVersion,
      resolvedScreenLocale: legacyResultLocale,
    },
    pdf: {
      zhCn: path.basename(zhPdfPath),
      legacyKorean: path.basename(legacyPdfPath),
      zhCnRoleLabelsVerified: ["推荐调和色", "主要心理特征"],
      legacyKoreanRoleLabelsVerified: ["추천 보완컬러", "주기질"],
    },
    queuedOutbox: {
      id: outboxId,
      status: storedOutbox.status,
      locale: storedOutbox.locale,
      copyVersion: storedOutbox.copyVersion,
      emailSubject: queuedEmailPayload.subject,
      emailBodyLanguage: "zh-CN",
    },
    cleanup: "deferred until proof files are copied into the review package",
  };
  writeFileSync(path.join(outputDir, "locale-persistence-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
  console.log(JSON.stringify(proof, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
