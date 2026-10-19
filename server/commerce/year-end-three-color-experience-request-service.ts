import { timingSafeEqual } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import { adminAuditLogs, yearEndThreeColorExperienceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";
import { decryptCommerceValue, encryptCommerceValue, hashCommerceValue } from "./crypto";

export const YEAR_END_THREE_COLOR_EXPERIENCE_LAST_DATE = "2026-11-30";
export const YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT = Date.UTC(2026, 10, 30, 14, 59, 59, 999);

export type ExperienceProductCode = "personal_three_color_experience" | "engaged_couple_three_color_experience";
export type ExperienceRequestStatus = "received" | "reviewing" | "confirmed" | "cancelled";

const PRODUCT_LABELS: Record<ExperienceProductCode, string> = {
  personal_three_color_experience: "개인 3컬러 체험",
  engaged_couple_three_color_experience: "예비부부 3컬러 관계 체험",
};

const ALLOWED_NEXT_STATUSES: Record<ExperienceRequestStatus, readonly ExperienceRequestStatus[]> = {
  received: ["received", "reviewing", "confirmed", "cancelled"],
  reviewing: ["reviewing", "confirmed", "cancelled"],
  confirmed: ["confirmed", "cancelled"],
  cancelled: ["cancelled"],
};

const ADDITIVE_SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS \`year_end_three_color_experience_requests\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`productCode\` enum('personal_three_color_experience','engaged_couple_three_color_experience') NOT NULL,
    \`preferredDate\` varchar(10) NOT NULL,
    \`preferredTime\` varchar(5) NOT NULL,
    \`nameEncrypted\` text NOT NULL,
    \`contactPhoneEncrypted\` text NOT NULL,
    \`privacyConsentAcceptedAt\` timestamp NOT NULL,
    \`privacyConsentVersion\` varchar(80) NOT NULL,
    \`status\` enum('received','reviewing','confirmed','cancelled') NOT NULL DEFAULT 'received',
    \`idempotencyKeyHash\` varchar(128) NOT NULL,
    \`requestFingerprintHash\` varchar(128) NOT NULL,
    \`confirmedAt\` timestamp NULL,
    \`cancelledAt\` timestamp NULL,
    \`cancellationReasonEncrypted\` text NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`year_end_three_color_experience_requests_id_pk\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`year_end_three_color_experience_requests_idempotency_unique\` UNIQUE(\`idempotencyKeyHash\`),
    INDEX \`year_end_three_color_experience_requests_status_created_idx\` (\`status\`,\`createdAt\`),
    INDEX \`year_end_three_color_experience_requests_date_status_idx\` (\`preferredDate\`,\`status\`)
  )`;

async function ensureExperienceRequestSchema(db: any): Promise<void> {
  await db.execute(sql.raw(ADDITIVE_SCHEMA_SQL));
  const columnResult = await db.execute(sql.raw("SHOW COLUMNS FROM `year_end_three_color_experience_requests` LIKE 'cancellationReasonEncrypted'"));
  const columnRows = Array.isArray(columnResult) && Array.isArray(columnResult[0]) ? columnResult[0] : columnResult;
  if (!Array.isArray(columnRows) || columnRows.length === 0) {
    try {
      await db.execute(sql.raw("ALTER TABLE `year_end_three_color_experience_requests` ADD COLUMN `cancellationReasonEncrypted` text NULL"));
    } catch (error: any) {
      if (error?.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }
}

function kstDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function getEarliestExperienceRequestDate(now = new Date()): string {
  const [year, month, day] = kstDate(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

function assertCalendarDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("EXPERIENCE_REQUEST_DATE_INVALID");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("EXPERIENCE_REQUEST_DATE_INVALID");
}

export function assertExperienceRequestDate(preferredDate: string, now = new Date()): void {
  if (now.getTime() > YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT) throw new Error("EXPERIENCE_EVENT_ENDED");
  assertCalendarDate(preferredDate);
  if (preferredDate < getEarliestExperienceRequestDate(now) || preferredDate > YEAR_END_THREE_COLOR_EXPERIENCE_LAST_DATE) throw new Error("EXPERIENCE_REQUEST_DATE_OUT_OF_RANGE");
}

function assertLandingRequestSecret(provided: string | undefined): void {
  const configured = process.env.HUSIM_APP_LANDING_REQUEST_SECRET;
  if (!configured || Buffer.byteLength(configured, "utf8") < 32 || !provided) throw new Error("LANDING_REQUEST_UNAUTHORIZED");
  const expected = Buffer.from(configured, "utf8");
  const actual = Buffer.from(provided, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("LANDING_REQUEST_UNAUTHORIZED");
}

function maskName(value: string): string {
  const characters = Array.from(value.trim());
  return characters.length <= 1 ? "*" : `${characters[0]}${"*".repeat(Math.max(1, characters.length - 1))}`;
}

function maskPhone(value: string): string {
  const normalized = value.replace(/\D/g, "");
  return normalized.length < 7 ? "***" : `${normalized.slice(0, 3)}-****-${normalized.slice(-4)}`;
}

function maskedSafely(value: string, mask: (plaintext: string) => string): string {
  try {
    return mask(decryptCommerceValue(value));
  } catch {
    return "보호됨";
  }
}

function decryptOptionalSafely(value: string | null): string | null {
  if (!value) return null;
  try {
    return decryptCommerceValue(value);
  } catch {
    return "보호됨";
  }
}

function requestFingerprint(input: {
  productCode: ExperienceProductCode;
  preferredDate: string;
  preferredTime: string;
  name: string;
  contactPhone: string;
  privacyConsentAccepted: boolean;
}): string {
  return hashCommerceValue(JSON.stringify(input));
}

function assertStatusTransition(from: ExperienceRequestStatus, to: ExperienceRequestStatus): void {
  if (!ALLOWED_NEXT_STATUSES[from].includes(to)) throw new Error("EXPERIENCE_REQUEST_INVALID_STATUS_TRANSITION");
}

export async function createYearEndThreeColorExperienceRequest(input: {
  landingRequestSecret?: string;
  productCode: ExperienceProductCode;
  preferredDate: string;
  preferredTime: string;
  name: string;
  contactPhone: string;
  privacyConsentAccepted: boolean;
  idempotencyKey: string;
}) {
  assertLandingRequestSecret(input.landingRequestSecret);
  if (!Object.prototype.hasOwnProperty.call(PRODUCT_LABELS, input.productCode)) throw new Error("EXPERIENCE_REQUEST_PRODUCT_INVALID");
  assertExperienceRequestDate(input.preferredDate);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.preferredTime)) throw new Error("EXPERIENCE_REQUEST_TIME_INVALID");
  const name = input.name.trim();
  const contactPhone = input.contactPhone.trim();
  if (name.length < 1 || name.length > 80) throw new Error("EXPERIENCE_REQUEST_NAME_INVALID");
  if (!/^[0-9+()\-\s]{8,24}$/.test(contactPhone)) throw new Error("EXPERIENCE_REQUEST_PHONE_INVALID");
  if (!input.privacyConsentAccepted) throw new Error("EXPERIENCE_REQUEST_PRIVACY_CONSENT_REQUIRED");
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(input.idempotencyKey)) throw new Error("EXPERIENCE_REQUEST_IDEMPOTENCY_INVALID");

  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await ensureExperienceRequestSchema(db);
  const idempotencyKeyHash = hashCommerceValue(`year-end-three-color-experience:${input.idempotencyKey}`);
  const fingerprintHash = requestFingerprint({
    productCode: input.productCode,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    name,
    contactPhone,
    privacyConsentAccepted: input.privacyConsentAccepted,
  });
  const resolveExisting = async () => {
    const existing = (await db.select().from(yearEndThreeColorExperienceRequests).where(eq(yearEndThreeColorExperienceRequests.idempotencyKeyHash, idempotencyKeyHash)).limit(1))[0];
    if (!existing) return null;
    if (existing.requestFingerprintHash !== fingerprintHash) throw new Error("EXPERIENCE_REQUEST_IDEMPOTENCY_CONFLICT");
    return { requestId: existing.id as number, status: existing.status as ExperienceRequestStatus, replayed: true as const };
  };
  const existing = await resolveExisting();
  if (existing) return existing;
  try {
    const inserted = await db.insert(yearEndThreeColorExperienceRequests).values({
      productCode: input.productCode,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      nameEncrypted: encryptCommerceValue(name),
      contactPhoneEncrypted: encryptCommerceValue(contactPhone),
      privacyConsentAcceptedAt: new Date(),
      privacyConsentVersion: "2026-10-year-end-three-color-v1",
      status: "received",
      idempotencyKeyHash,
      requestFingerprintHash: fingerprintHash,
    });
    return { requestId: Number(inserted[0].insertId), status: "received" as const, replayed: false };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY" || error?.cause?.code === "ER_DUP_ENTRY") {
      const concurrent = await resolveExisting();
      if (concurrent) return concurrent;
    }
    throw error;
  }
}

export async function getAdminYearEndThreeColorExperienceRequests(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await ensureExperienceRequestSchema(db);
  const rows = await db.select().from(yearEndThreeColorExperienceRequests).orderBy(desc(yearEndThreeColorExperienceRequests.createdAt)).limit(Math.min(Math.max(limit, 1), 200));
  return rows.map((row) => ({
    id: row.id,
    productCode: row.productCode as ExperienceProductCode,
    productLabel: PRODUCT_LABELS[row.productCode as ExperienceProductCode],
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    nameMasked: maskedSafely(row.nameEncrypted, maskName),
    contactPhoneMasked: maskedSafely(row.contactPhoneEncrypted, maskPhone),
    status: row.status as ExperienceRequestStatus,
    privacyConsentAcceptedAt: row.privacyConsentAcceptedAt,
    createdAt: row.createdAt,
    confirmedAt: row.confirmedAt,
    cancelledAt: row.cancelledAt,
    cancellationReason: decryptOptionalSafely(row.cancellationReasonEncrypted),
  }));
}

export async function revealAdminYearEndThreeColorExperienceRequestContact(input: { requestId: number; adminUserId: number | null; auditActor: AdminAuditActor }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await ensureExperienceRequestSchema(db);
  const request = (await db.select().from(yearEndThreeColorExperienceRequests).where(eq(yearEndThreeColorExperienceRequests.id, input.requestId)).limit(1))[0];
  if (!request) throw new Error("EXPERIENCE_REQUEST_NOT_FOUND");
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "year_end_experience_request_contact_revealed",
    entityType: "year_end_three_color_experience_request",
    entityId: String(input.requestId),
    beforeJson: JSON.stringify({ auditActor: input.auditActor.subject }),
    afterJson: JSON.stringify({ contactRevealed: true, auditActor: input.auditActor.subject }),
  });
  return { requestId: request.id, name: decryptCommerceValue(request.nameEncrypted), contactPhone: decryptCommerceValue(request.contactPhoneEncrypted) };
}

export async function updateAdminYearEndThreeColorExperienceRequest(input: { requestId: number; status: ExperienceRequestStatus; cancellationReason?: string; adminUserId: number | null; auditActor: AdminAuditActor }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await ensureExperienceRequestSchema(db);
  return (db as any).transaction(async (tx: any) => {
    const before = (await tx.select().from(yearEndThreeColorExperienceRequests).where(eq(yearEndThreeColorExperienceRequests.id, input.requestId)).limit(1))[0];
    if (!before) throw new Error("EXPERIENCE_REQUEST_NOT_FOUND");
    assertStatusTransition(before.status as ExperienceRequestStatus, input.status);
    if (before.status === input.status) return { success: true as const, status: input.status, changed: false as const };

    const cancellationReason = input.cancellationReason?.trim() ?? "";
    if (cancellationReason.length > 500) throw new Error("EXPERIENCE_REQUEST_CANCELLATION_REASON_INVALID");
    if (input.status !== "cancelled" && cancellationReason) throw new Error("EXPERIENCE_REQUEST_CANCELLATION_REASON_UNEXPECTED");

    const now = new Date();
    const changed = await tx.update(yearEndThreeColorExperienceRequests).set({
      status: input.status,
      confirmedAt: input.status === "confirmed" ? now : before.confirmedAt,
      cancelledAt: input.status === "cancelled" ? now : before.cancelledAt,
      cancellationReasonEncrypted: input.status === "cancelled" ? (cancellationReason ? encryptCommerceValue(cancellationReason) : null) : before.cancellationReasonEncrypted,
    }).where(and(eq(yearEndThreeColorExperienceRequests.id, input.requestId), eq(yearEndThreeColorExperienceRequests.status, before.status)));
    if (Number(changed[0]?.affectedRows ?? 0) !== 1) throw new Error("EXPERIENCE_REQUEST_STATUS_CONFLICT");
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "year_end_experience_request_status_updated",
      entityType: "year_end_three_color_experience_request",
      entityId: String(input.requestId),
      beforeJson: JSON.stringify({ status: before.status, auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({ status: input.status, cancellationReasonProvided: input.status === "cancelled" && Boolean(cancellationReason), auditActor: input.auditActor.subject }),
    });
    return { success: true as const, status: input.status, changed: true as const };
  });
}
