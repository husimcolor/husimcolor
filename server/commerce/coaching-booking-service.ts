import { desc, eq } from "drizzle-orm";

import { adminAuditLogs, coachingBookingEvents, coachingBookings } from "../../drizzle/schema";
import { getDb } from "../db";
import { encryptCommerceValue } from "./crypto";

export type CoachingBookingStatus =
  | "pending_schedule"
  | "change_requested"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

const ALLOWED_NEXT_STATUSES: Record<CoachingBookingStatus, readonly CoachingBookingStatus[]> = {
  pending_schedule: ["pending_schedule", "change_requested", "scheduled", "cancelled"],
  change_requested: ["change_requested", "scheduled", "cancelled"],
  scheduled: ["scheduled", "change_requested", "completed", "cancelled", "no_show"],
  completed: ["completed"],
  cancelled: ["cancelled"],
  no_show: ["no_show"],
};

export function assertCoachingBookingTransition(input: {
  from: CoachingBookingStatus;
  to: CoachingBookingStatus;
  scheduledAt?: Date | null;
}): void {
  if (!ALLOWED_NEXT_STATUSES[input.from].includes(input.to)) {
    throw new Error("COACHING_BOOKING_INVALID_STATUS_TRANSITION");
  }
  if (input.to === "scheduled" && !input.scheduledAt) {
    throw new Error("COACHING_BOOKING_SCHEDULED_AT_REQUIRED");
  }
}

export async function updateAdminCoachingBooking(input: {
  bookingId: number;
  status: CoachingBookingStatus;
  scheduledAt?: Date | null;
  scheduledEndAt?: Date | null;
  sessionMode?: "undecided" | "online" | "in_person";
  requestedWindowStart?: Date | null;
  requestedWindowEnd?: Date | null;
  assignedAdminUserId?: number | null;
  internalNote?: string;
  cancelReason?: string;
  adminUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const rows = await tx.select().from(coachingBookings).where(eq(coachingBookings.id, input.bookingId)).limit(1);
    const before = rows[0];
    if (!before) throw new Error("COACHING_BOOKING_NOT_FOUND");

    assertCoachingBookingTransition({
      from: before.status as CoachingBookingStatus,
      to: input.status,
      scheduledAt: input.scheduledAt === undefined ? before.scheduledAt : input.scheduledAt,
    });

    const now = new Date();
    const update: Record<string, unknown> = {
      status: input.status,
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
      ...(input.scheduledEndAt !== undefined ? { scheduledEndAt: input.scheduledEndAt } : {}),
      ...(input.sessionMode !== undefined ? { sessionMode: input.sessionMode } : {}),
      ...(input.requestedWindowStart !== undefined ? { requestedWindowStart: input.requestedWindowStart } : {}),
      ...(input.requestedWindowEnd !== undefined ? { requestedWindowEnd: input.requestedWindowEnd } : {}),
      ...(input.assignedAdminUserId !== undefined ? { assignedAdminUserId: input.assignedAdminUserId } : {}),
      ...(input.internalNote !== undefined ? { internalNoteEncrypted: encryptCommerceValue(input.internalNote) } : {}),
      ...(input.status === "cancelled" ? { cancelledAt: now, cancelReason: input.cancelReason ?? null } : {}),
      ...(input.status === "completed" ? { completedAt: now } : {}),
      ...(input.status === "no_show" ? { noShowAt: now } : {}),
    };
    await tx.update(coachingBookings).set(update).where(eq(coachingBookings.id, input.bookingId));
    await tx.insert(coachingBookingEvents).values({
      bookingId: input.bookingId,
      adminUserId: input.adminUserId,
      eventType: "booking_status_updated",
      fromStatus: before.status,
      toStatus: input.status,
      payloadEncrypted: encryptCommerceValue(JSON.stringify({
        scheduledAt: input.scheduledAt?.toISOString() ?? null,
        scheduledEndAt: input.scheduledEndAt?.toISOString() ?? null,
        sessionMode: input.sessionMode ?? null,
        hasInternalNote: input.internalNote !== undefined,
        cancelReason: input.cancelReason ?? null,
      })),
    });
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "coaching_booking_updated",
      entityType: "coaching_booking",
      entityId: String(input.bookingId),
      beforeJson: JSON.stringify({ status: before.status, scheduledAt: before.scheduledAt }),
      afterJson: JSON.stringify({ status: input.status, scheduledAt: input.scheduledAt ?? before.scheduledAt }),
    });

    const updated = await tx.select().from(coachingBookings).where(eq(coachingBookings.id, input.bookingId)).limit(1);
    return updated[0];
  });
}

export async function getAdminCoachingBookingEvents(bookingId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return db
    .select({
      id: coachingBookingEvents.id,
      adminUserId: coachingBookingEvents.adminUserId,
      eventType: coachingBookingEvents.eventType,
      fromStatus: coachingBookingEvents.fromStatus,
      toStatus: coachingBookingEvents.toStatus,
      createdAt: coachingBookingEvents.createdAt,
    })
    .from(coachingBookingEvents)
    .where(eq(coachingBookingEvents.bookingId, bookingId))
    .orderBy(desc(coachingBookingEvents.createdAt));
}
