import { and, eq } from "drizzle-orm";

import { adminAuditLogs, adminSettings, coachingBookings } from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";

const COACHING_BLACKOUT_SETTINGS_KEY = "coaching_blackout_dates_v1";
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type CoachingBlackoutDate = {
  date: string;
  note: string | null;
  createdAt: string;
  createdBy: AdminAuditActor["subject"];
};

type StoredCoachingBlackoutDate = Partial<CoachingBlackoutDate>;

function isValidCalendarDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

export function normalizeCoachingBlackoutDates(value: unknown): CoachingBlackoutDate[] {
  if (!Array.isArray(value)) return [];
  const byDate = new Map<string, CoachingBlackoutDate>();
  for (const item of value as StoredCoachingBlackoutDate[]) {
    if (!item || typeof item.date !== "string" || !isValidCalendarDate(item.date)) continue;
    byDate.set(item.date, {
      date: item.date,
      note: typeof item.note === "string" && item.note.trim() ? item.note.trim().slice(0, 500) : null,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
      createdBy: item.createdBy === "authenticated_admin" ? "authenticated_admin" : "legacy_password_admin",
    });
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

async function getStoredCoachingBlackoutDates(): Promise<{ dates: CoachingBlackoutDate[]; raw: string | null }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db.select().from(adminSettings).where(eq(adminSettings.key, COACHING_BLACKOUT_SETTINGS_KEY)).limit(1);
  const raw = rows[0]?.value ?? null;
  if (!raw) return { dates: [], raw: null };
  try {
    return { dates: normalizeCoachingBlackoutDates(JSON.parse(raw)), raw };
  } catch {
    // A malformed operator setting must never expose dates as open.
    throw new Error("COACHING_BLACKOUT_SETTING_INVALID");
  }
}

async function saveCoachingBlackoutDates(dates: CoachingBlackoutDate[]) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await db.insert(adminSettings).values({
    key: COACHING_BLACKOUT_SETTINGS_KEY,
    value: JSON.stringify(normalizeCoachingBlackoutDates(dates)),
  }).onDuplicateKeyUpdate({
    set: { value: JSON.stringify(normalizeCoachingBlackoutDates(dates)) },
  });
}

function getKstCalendarDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (part: "year" | "month" | "day") => parts.find((item) => item.type === part)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** Returns temporary closures only; administrator notes remain private. */
export async function getPublicCoachingBlackoutDates(fromDate: string, toDate: string) {
  if (!isValidCalendarDate(fromDate) || !isValidCalendarDate(toDate) || fromDate > toDate) {
    throw new Error("COACHING_BLACKOUT_DATE_RANGE_INVALID");
  }
  const { dates } = await getStoredCoachingBlackoutDates();
  return dates.filter((item) => item.date >= fromDate && item.date <= toDate).map((item) => item.date);
}

export async function getAdminCoachingBlackoutDates() {
  const { dates } = await getStoredCoachingBlackoutDates();
  return dates;
}

/**
 * A blackout never cancels or changes bookings. Before saving it, only already
 * scheduled, in-person bookings are counted and returned to the operator.
 */
export async function createAdminCoachingBlackoutDate(input: {
  date: string;
  note?: string;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}) {
  if (!isValidCalendarDate(input.date)) throw new Error("COACHING_BLACKOUT_DATE_INVALID");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const existingScheduled = await db.select({ id: coachingBookings.id, scheduledAt: coachingBookings.scheduledAt })
    .from(coachingBookings)
    .where(and(eq(coachingBookings.status, "scheduled"), eq(coachingBookings.sessionMode, "in_person")));
  const confirmedBookingCount = existingScheduled.filter((item) => item.scheduledAt && getKstCalendarDate(item.scheduledAt) === input.date).length;
  if (confirmedBookingCount > 0) {
    return { created: false as const, reason: "CONFIRMED_BOOKINGS_EXIST" as const, confirmedBookingCount };
  }

  const { dates } = await getStoredCoachingBlackoutDates();
  if (dates.some((item) => item.date === input.date)) {
    return { created: false as const, reason: "ALREADY_BLACKED_OUT" as const, confirmedBookingCount: 0 };
  }

  const item: CoachingBlackoutDate = {
    date: input.date,
    note: input.note?.trim().slice(0, 500) || null,
    createdAt: new Date().toISOString(),
    createdBy: input.auditActor.subject,
  };
  const afterDates = [...dates, item];
  await saveCoachingBlackoutDates(afterDates);
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "coaching_blackout_created",
    entityType: "coaching_blackout_date",
    entityId: input.date,
    beforeJson: JSON.stringify({ blackoutDates: dates, auditActor: input.auditActor.subject }),
    afterJson: JSON.stringify({ blackoutDate: item, auditActor: input.auditActor.subject }),
  });
  return { created: true as const, reason: null, confirmedBookingCount: 0, blackoutDate: item };
}

export async function removeAdminCoachingBlackoutDate(input: {
  date: string;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}) {
  if (!isValidCalendarDate(input.date)) throw new Error("COACHING_BLACKOUT_DATE_INVALID");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const { dates } = await getStoredCoachingBlackoutDates();
  const before = dates.find((item) => item.date === input.date);
  if (!before) return { removed: false as const };

  const afterDates = dates.filter((item) => item.date !== input.date);
  await saveCoachingBlackoutDates(afterDates);
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "coaching_blackout_removed",
    entityType: "coaching_blackout_date",
    entityId: input.date,
    beforeJson: JSON.stringify({ blackoutDate: before, auditActor: input.auditActor.subject }),
    afterJson: JSON.stringify({ blackoutDates: afterDates, auditActor: input.auditActor.subject }),
  });
  return { removed: true as const };
}
