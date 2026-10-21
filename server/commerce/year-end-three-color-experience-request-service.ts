import { timingSafeEqual } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import { adminAuditLogs, yearEndThreeColorExperienceRequests } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";
import { decryptCommerceValue, encryptCommerceValue, hashCommerceValue } from "./crypto";

export const YEAR_END_THREE_COLOR_EXPERIENCE_LAST_DATE = "2026-11-30";
export const YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT = Date.UTC(2026, 10, 30, 14, 59, 59, 999);

/** Existing pre-marriage entries remain readable; new submissions never create that legacy code. */
export type StoredExperienceProductCode = "personal_three_color_experience" | "engaged_couple_three_color_experience" | "relationship_coaching_experience";
export type ExperienceProductCode = "personal_three_color_experience" | "relationship_coaching_experience";
export type ExperienceRelationshipType = "married_couple" | "lovers" | "parent_child";
export type ExperienceRequestStatus = "received" | "reviewing" | "confirmed" | "cancelled";

const PRODUCT_LABELS: Record<StoredExperienceProductCode, string> = {
  personal_three_color_experience: "일대일 코칭체험",
  engaged_couple_three_color_experience: "예비부부 3컬러 관계 체험",
  relationship_coaching_experience: "두 사람 관계코칭 체험",
};

const RELATIONSHIP_LABELS: Record<ExperienceRelationshipType, string> = {
  married_couple: "부부",
  lovers: "연인",
  parent_child: "부모자녀",
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
    \`productCode\` enum('personal_three_color_experience','engaged_couple_three_color_experience','relationship_coaching_experience') NOT NULL,
    \`relationshipType\` enum('married_couple','lovers','parent_child') NULL,
    \`childAgeEncrypted\` text NULL,
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

async function columnRows(db: any, columnName: string): Promise<any[]> {
  const result = await db.execute(sql.raw(`SHOW COLUMNS FROM \`year_end_three_color_experience_requests\` LIKE '${columnName}'`));
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : result;
}

async function ensureColumn(db: any, columnName: string, definition: string): Promise<void> {
  const rows = await columnRows(db, columnName);
  if (Array.isArray(rows) && rows.length > 0) return;
  try {
    await db.execute(sql.raw(`ALTER TABLE \`year_end_three_color_experience_requests\` ADD COLUMN \`${columnName}\` ${definition}`));
  } catch (error: any) {
    if (error?.code !== "ER_DUP_FIELDNAME") throw error;
  }
}

async function ensureExperienceRequestSchema(db: any): Promise<void> {
  await db.execute(sql.raw(ADDITIVE_SCHEMA_SQL));

  const productRows = await columnRows(db, "productCode");
  const productType = String(productRows?.[0]?.Type ?? productRows?.[0]?.type ?? "");
  if (!productType.includes("relationship_coaching_experience")) {
    await db.execute(sql.raw("ALTER TABLE `year_end_three_color_experience_requests` MODIFY COLUMN `productCode` enum('personal_three_color_experience','engaged_couple_three_color_experience','relationship_coaching_experience') NOT NULL"));
  }

  await ensureColumn(db, "relationshipType", "enum('married_couple','lovers','parent_child') NULL");
  await ensureColumn(db, "childAgeEncrypted", "text NULL");
  await ensureColumn(db, "cancellationReasonEncrypted", "text NULL");
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

function decryptOptionalAgeSafely(value: string | null): number | null {
  if (!value) return null;
  try {
    const age = Number(decryptCommerceValue(value));
    return Number.isInteger(age) && age >= 0 && age <= 120 ? age : null;
  } catch {
    return null;
  }
}

function isStoredExperienceProductCode(value: string): value is StoredExperienceProductCode {
  return Object.prototype.hasOwnProperty.call(PRODUCT_LABELS, value);
}

function isExperienceRelationshipType(value: unknown): value is ExperienceRelationshipType {
  return value === "married_couple" || value === "lovers" || value === "parent_child";
}

export function assertExperienceRequestRelationship(input: {
  productCode: ExperienceProductCode;
  relationshipType?: ExperienceRelationshipType;
  childAge?: number;
}): { relationshipType: ExperienceRelationshipType | null; childAge: number | null } {
  if (input.productCode === "personal_three_color_experience") {
    if (input.relationshipType !== undefined || input.childAge !== undefined) throw new Error("EXPERIENCE_REQUEST_RELATIONSHIP_UNEXPECTED");
    return { relationshipType: null, childAge: null };
  }

  if (input.productCode !== "relationship_coaching_experience") throw new Error("EXPERIENCE_REQUEST_PRODUCT_INVALID");
  if (!isExperienceRelationshipType(input.relationshipType)) throw new Error("EXPERIENCE_REQUEST_RELATIONSHIP_REQUIRED");

  if (input.relationshipType === "parent_child") {
    if (!Number.isInteger(input.childAge) || (input.childAge as number) < 0 || (input.childAge as number) > 120) {
      throw new Error("EXPERIENCE_REQUEST_CHILD_AGE_REQUIRED");
    }
    return { relationshipType: input.relationshipType, childAge: input.childAge as number };
  }

  if (input.childAge !== undefined) throw new Error("EXPERIENCE_REQUEST_CHILD_AGE_UNEXPECTED");
  return { relationshipType: input.relationshipType, childAge: null };
}

function requestFingerprint(input: {
  productCode: ExperienceProductCode;
  relationshipType: ExperienceRelationshipType | null;
  childAge: number | null;
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
  relationshipType?: ExperienceRelationshipType;
  childAge?: number;
  preferredDate: string;
  preferredTime: string;
  name: string;
  contactPhone: string;
  privacyConsentAccepted: boolean;
  idempotencyKey: string;
}) {
  assertLandingRequestSecret(input.landingRequestSecret);
  const relationship = assertExperienceRequestRelationship(input);
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
    relationshipType: relationship.relationshipType,
    childAge: relationship.childAge,
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
      relationshipType: relationship.relationshipType,
      childAgeEncrypted: relationship.childAge === null ? null : encryptCommerceValue(String(relationship.childAge)),
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime,
      nameEncrypted: encryptCommerceValue(name),
      contactPhoneEncrypted: encryptCommerceValue(contactPhone),
      privacyConsentAcceptedAt: new Date(),
      privacyConsentVersion: "2026-10-year-end-three-color-v2",
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
  return rows.map((row) => {
    const productCode = isStoredExperienceProductCode(row.productCode) ? row.productCode : "personal_three_color_experience";
    const relationshipType = isExperienceRelationshipType(row.relationshipType) ? row.relationshipType : null;
    return {
      id: row.id,
      productCode,
      productLabel: PRODUCT_LABELS[productCode],
      relationshipType,
      relationshipLabel: relationshipType ? RELATIONSHIP_LABELS[relationshipType] : null,
      childAge: relationshipType === "parent_child" ? decryptOptionalAgeSafely(row.childAgeEncrypted) : null,
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
    };
  });
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
