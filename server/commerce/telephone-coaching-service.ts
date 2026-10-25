import { and, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";

import {
  coachingBookings,
  coachingScheduleMutex,
  coachingSlotHolds,
  telephoneCoachingSlotSettings,
} from "../../drizzle/schema";

export const TELEPHONE_COACHING_PRODUCT_CODE = "telephone_coaching" as const;
export const TELEPHONE_COACHING_DURATION_MINUTES = 50;
export const TELEPHONE_COACHING_SLOT_MINUTES = 60;
export const DEFAULT_TELEPHONE_COACHING_SLOT_TIMES = ["10:00", "11:30", "14:00", "16:00", "19:00"] as const;

let previewSchemaPreparation: Promise<void> | null = null;

export function isTelephoneCoachingPreviewPreparationEnabled(
  environment: Partial<Pick<NodeJS.ProcessEnv, "VERCEL_ENV" | "COMMERCE_TEST_MODE" | "COMMERCE_PREVIEW_TELEPHONE_COACHING_TEST_ENABLED">> = process.env as Partial<Pick<NodeJS.ProcessEnv, "VERCEL_ENV" | "COMMERCE_TEST_MODE" | "COMMERCE_PREVIEW_TELEPHONE_COACHING_TEST_ENABLED">>,
): boolean {
  return environment.VERCEL_ENV === "preview"
    && environment.COMMERCE_TEST_MODE === "true"
    && environment.COMMERCE_PREVIEW_TELEPHONE_COACHING_TEST_ENABLED === "true";
}

export type TelephoneCoachingDetails = {
  topic: string | null;
  fiveElementsOptIn: boolean;
  birthDate: string | null;
};

export type TelephoneCoachingBookingRequest = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: string;
  requestedWindowEnd: string;
  sessionMode: "telephone";
  notes?: string;
  topic?: string;
  fiveElementsOptIn?: boolean;
  birthDate?: string;
  adultConfirmed?: boolean;
};

export type NormalizedTelephoneCoachingBookingRequest = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: Date;
  requestedWindowEnd: Date;
  sessionMode: "telephone";
  notes: string | null;
  topic: string | null;
  fiveElementsOptIn: boolean;
  birthDate: string | null;
};

export function isTelephoneCoachingProduct(productCode: string): productCode is typeof TELEPHONE_COACHING_PRODUCT_CODE {
  return productCode === TELEPHONE_COACHING_PRODUCT_CODE;
}

export function getKstDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function getKstTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

function isAdultAtBooking(birthDate: string, now = new Date()): boolean {
  const parsed = new Date(`${birthDate}T00:00:00+09:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const adulthood = new Date(parsed.getTime());
  adulthood.setUTCFullYear(adulthood.getUTCFullYear() + 18);
  return adulthood <= now;
}

/**
 * 전화 코칭은 성인 1인 50분이며, 예약 원장에는 준비·정리 시간을 포함해 60분을 점유한다.
 * 생년월일은 오행 참고를 명시적으로 희망한 경우에만 수집한다.
 */
export function normalizeTelephoneCoachingBookingRequest(
  request: TelephoneCoachingBookingRequest | undefined,
  now = new Date(),
): NormalizedTelephoneCoachingBookingRequest {
  if (!request) throw new Error("TELEPHONE_COACHING_BOOKING_REQUIRED");
  const contactName = request.contactName.trim();
  const contactPhone = request.contactPhone.trim();
  const requestedWindowStart = new Date(request.requestedWindowStart);
  const requestedWindowEnd = new Date(request.requestedWindowEnd);
  const notes = request.notes?.trim() || null;
  const topic = request.topic?.trim() || null;
  const fiveElementsOptIn = request.fiveElementsOptIn === true;
  const birthDate = request.birthDate?.trim() || null;

  if (!request.adultConfirmed) throw new Error("TELEPHONE_COACHING_ADULT_CONFIRMATION_REQUIRED");
  if (!contactName || contactName.length > 100) throw new Error("INVALID_COACHING_CONTACT_NAME");
  if (!contactPhone || contactPhone.length > 40) throw new Error("INVALID_COACHING_CONTACT_PHONE");
  if (Number.isNaN(requestedWindowStart.getTime()) || Number.isNaN(requestedWindowEnd.getTime())) {
    throw new Error("INVALID_COACHING_REQUESTED_WINDOW");
  }
  if (requestedWindowEnd.getTime() - requestedWindowStart.getTime() !== TELEPHONE_COACHING_SLOT_MINUTES * 60 * 1000) {
    throw new Error("TELEPHONE_COACHING_REQUIRES_60_MINUTE_SLOT");
  }
  if (requestedWindowStart <= now) throw new Error("TELEPHONE_COACHING_SLOT_IN_PAST");
  if (getKstDate(requestedWindowStart) !== getKstDate(requestedWindowEnd)) {
    throw new Error("TELEPHONE_COACHING_SLOT_CROSSES_DATE");
  }
  if (notes && notes.length > 2000) throw new Error("INVALID_COACHING_NOTES");
  if (topic && topic.length > 500) throw new Error("INVALID_TELEPHONE_COACHING_TOPIC");
  if (fiveElementsOptIn) {
    if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !isAdultAtBooking(birthDate, now)) {
      throw new Error("INVALID_TELEPHONE_COACHING_BIRTH_DATE");
    }
  } else if (birthDate) {
    throw new Error("TELEPHONE_COACHING_BIRTH_DATE_REQUIRES_OPT_IN");
  }

  return {
    contactName,
    contactPhone,
    requestedWindowStart,
    requestedWindowEnd,
    sessionMode: "telephone",
    notes,
    topic,
    fiveElementsOptIn,
    birthDate: fiveElementsOptIn ? birthDate : null,
  };
}

export function getTelephoneCoachingDetails(request: NormalizedTelephoneCoachingBookingRequest): TelephoneCoachingDetails {
  return {
    topic: request.topic,
    fiveElementsOptIn: request.fiveElementsOptIn,
    birthDate: request.birthDate,
  };
}

/** Preview의 별도 DB에서만 additive 스키마와 테스트 상품을 준비한다. */
export async function ensureTelephoneCoachingPreviewSchema(): Promise<void> {
  if (!isTelephoneCoachingPreviewPreparationEnabled()) {
    if (process.env.VERCEL_ENV === "preview") throw new Error("TELEPHONE_COACHING_PREVIEW_NOT_ENABLED");
    return;
  }
  if (!previewSchemaPreparation) {
    previewSchemaPreparation = (async () => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
      const execute = (statement: string) => (db as any).execute(sql.raw(statement));

      const [sessionMode] = await execute("SHOW COLUMNS FROM `coaching_bookings` LIKE 'sessionMode'");
      if (!String((sessionMode as any)?.[0]?.Type ?? "").includes("telephone")) {
        await execute("ALTER TABLE `coaching_bookings` MODIFY COLUMN `sessionMode` enum('undecided','online','in_person','telephone') NOT NULL DEFAULT 'undecided'");
      }
      const [outboxPurpose] = await execute("SHOW COLUMNS FROM `email_outbox` LIKE 'purpose'");
      if (!String((outboxPurpose as any)?.[0]?.Type ?? "").includes("coaching_booking_confirmation")) {
        await execute("ALTER TABLE `email_outbox` MODIFY COLUMN `purpose` enum('account_link','analysis_result_pdf','support_notification','coaching_booking_confirmation') NOT NULL");
      }
      await execute("CREATE TABLE IF NOT EXISTS `coaching_slot_holds` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NOT NULL, `productId` int NOT NULL, `bookingId` int NULL, `slotStart` timestamp NOT NULL, `slotEnd` timestamp NOT NULL, `status` enum('held','confirmed','released','expired') NOT NULL DEFAULT 'held', `expiresAt` timestamp NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `coaching_slot_holds_id` PRIMARY KEY(`id`), CONSTRAINT `coaching_slot_holds_order_unique` UNIQUE(`orderId`), INDEX `coaching_slot_holds_range_status_idx` (`status`,`slotStart`,`slotEnd`), INDEX `coaching_slot_holds_booking_idx` (`bookingId`))");
      await execute("CREATE TABLE IF NOT EXISTS `coaching_schedule_mutex` (`id` int NOT NULL, CONSTRAINT `coaching_schedule_mutex_id` PRIMARY KEY(`id`))");
      await execute("INSERT IGNORE INTO `coaching_schedule_mutex` (`id`) VALUES (1)");
      await execute("CREATE TABLE IF NOT EXISTS `telephone_coaching_slot_settings` (`id` int AUTO_INCREMENT NOT NULL, `slotTime` varchar(5) NOT NULL, `active` boolean NOT NULL DEFAULT true, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `telephone_coaching_slot_settings_id` PRIMARY KEY(`id`), CONSTRAINT `telephone_coaching_slot_settings_time_unique` UNIQUE(`slotTime`))");
      await execute("INSERT INTO `telephone_coaching_slot_settings` (`slotTime`, `active`) VALUES ('10:00', true), ('11:30', true), ('14:00', true), ('16:00', true), ('19:00', true) ON DUPLICATE KEY UPDATE `slotTime` = VALUES(`slotTime`)");
      await execute("INSERT INTO `products` (`code`, `name`, `fulfillmentType`, `requiresPayment`, `active`) VALUES ('telephone_coaching', '비대면 전화 코칭', 'coaching', true, true) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `fulfillmentType` = VALUES(`fulfillmentType`), `requiresPayment` = VALUES(`requiresPayment`), `active` = true");
      await execute("INSERT INTO `product_prices` (`productId`, `regularAmountKrw`, `amountKrw`, `currency`, `version`, `active`) SELECT `id`, 50000, 50000, 'KRW', 1, true FROM `products` WHERE `code` = 'telephone_coaching' ON DUPLICATE KEY UPDATE `regularAmountKrw` = VALUES(`regularAmountKrw`), `amountKrw` = VALUES(`amountKrw`), `active` = true");
    })().catch((error) => {
      previewSchemaPreparation = null;
      throw error;
    });
  }
  return previewSchemaPreparation;
}

async function expireHeldSlots(tx: any, now: Date) {
  await tx
    .update(coachingSlotHolds)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(coachingSlotHolds.status, "held"), lte(coachingSlotHolds.expiresAt, now)));
}

/**
 * 범위 조건에는 일반적인 unique index를 둘 수 없으므로, 같은 DB 트랜잭션 안에서
 * 단일 mutex 행을 잠가 충돌 조회와 보류/확정 저장을 직렬화한다.
 */
async function lockSharedCoachingSchedule(tx: any) {
  await tx.execute(sql`SELECT ${coachingScheduleMutex.id} FROM coaching_schedule_mutex WHERE id = 1 FOR UPDATE`);
}

async function assertNoSharedCoachingConflict(tx: any, input: {
  slotStart: Date;
  slotEnd: Date;
  excludeBookingId?: number;
  excludeOrderId?: number;
  now: Date;
}) {
  await expireHeldSlots(tx, input.now);

  const bookedConditions = [
    eq(coachingBookings.status, "scheduled"),
    lt(coachingBookings.scheduledAt, input.slotEnd),
    gt(coachingBookings.scheduledEndAt, input.slotStart),
  ];
  if (input.excludeBookingId) bookedConditions.push(sql`${coachingBookings.id} <> ${input.excludeBookingId}`);
  const existingBooking = await tx.select({ id: coachingBookings.id })
    .from(coachingBookings)
    .where(and(...bookedConditions))
    .limit(1);
  if (existingBooking[0]) throw new Error("COACHING_SLOT_NOT_AVAILABLE");

  const heldConditions = [
    inArray(coachingSlotHolds.status, ["held", "confirmed"]),
    lt(coachingSlotHolds.slotStart, input.slotEnd),
    gt(coachingSlotHolds.slotEnd, input.slotStart),
  ];
  if (input.excludeOrderId) heldConditions.push(sql`${coachingSlotHolds.orderId} <> ${input.excludeOrderId}`);
  const existingHold = await tx.select({ id: coachingSlotHolds.id })
    .from(coachingSlotHolds)
    .where(and(...heldConditions))
    .limit(1);
  if (existingHold[0]) throw new Error("COACHING_SLOT_NOT_AVAILABLE");
}

export async function reserveTelephoneCoachingSlot(tx: any, input: {
  orderId: number;
  productId: number;
  request: NormalizedTelephoneCoachingBookingRequest;
  expiresAt: Date;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  await lockSharedCoachingSchedule(tx);
  const time = getKstTime(input.request.requestedWindowStart);
  const slot = await tx.select({ active: telephoneCoachingSlotSettings.active })
    .from(telephoneCoachingSlotSettings)
    .where(eq(telephoneCoachingSlotSettings.slotTime, time))
    .limit(1);
  if (!slot[0]?.active) throw new Error("TELEPHONE_COACHING_SLOT_DISABLED");

  await assertNoSharedCoachingConflict(tx, {
    slotStart: input.request.requestedWindowStart,
    slotEnd: input.request.requestedWindowEnd,
    excludeOrderId: input.orderId,
    now,
  });
  await tx.insert(coachingSlotHolds).values({
    orderId: input.orderId,
    productId: input.productId,
    slotStart: input.request.requestedWindowStart,
    slotEnd: input.request.requestedWindowEnd,
    status: "held",
    expiresAt: input.expiresAt,
  });
}

export async function confirmTelephoneCoachingSlot(tx: any, input: {
  orderId: number;
  bookingId: number;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const holds = await tx.select().from(coachingSlotHolds)
    .where(eq(coachingSlotHolds.orderId, input.orderId))
    .limit(1);
  const hold = holds[0];
  if (!hold || hold.status !== "held" || hold.expiresAt <= now) throw new Error("TELEPHONE_COACHING_HOLD_EXPIRED");
  await tx.update(coachingSlotHolds)
    .set({ status: "confirmed", bookingId: input.bookingId, updatedAt: now })
    .where(eq(coachingSlotHolds.id, hold.id));
}

export async function releaseTelephoneCoachingSlotForOrder(tx: any, orderId: number, now = new Date()) {
  await tx.update(coachingSlotHolds)
    .set({ status: "released", updatedAt: now })
    .where(and(eq(coachingSlotHolds.orderId, orderId), inArray(coachingSlotHolds.status, ["held", "confirmed"])));
}

/** 관리자 대면 예약도 전화 코칭 결제 중 보류된 시간을 침범하지 않도록 같은 판정을 쓴다. */
export async function assertSharedCoachingSlotAvailable(tx: any, input: {
  slotStart: Date;
  slotEnd: Date;
  excludeBookingId?: number;
  now?: Date;
}) {
  await lockSharedCoachingSchedule(tx);
  return assertNoSharedCoachingConflict(tx, { ...input, now: input.now ?? new Date() });
}

export async function getPublicTelephoneCoachingAvailability(tx: any, input: { date: string; now?: Date }) {
  const now = input.now ?? new Date();
  await expireHeldSlots(tx, now);
  const settings = await tx.select({ slotTime: telephoneCoachingSlotSettings.slotTime })
    .from(telephoneCoachingSlotSettings)
    .where(eq(telephoneCoachingSlotSettings.active, true));

  const availableTimes: string[] = [];
  for (const setting of settings) {
    const start = new Date(`${input.date}T${setting.slotTime}:00+09:00`);
    const end = new Date(start.getTime() + TELEPHONE_COACHING_SLOT_MINUTES * 60 * 1000);
    if (Number.isNaN(start.getTime()) || start <= now) continue;
    try {
      await assertNoSharedCoachingConflict(tx, { slotStart: start, slotEnd: end, now });
      availableTimes.push(setting.slotTime);
    } catch (error) {
      if (!(error instanceof Error) || error.message !== "COACHING_SLOT_NOT_AVAILABLE") throw error;
    }
  }
  return availableTimes.sort();
}

export async function getAdminTelephoneCoachingSlotSettings() {
  await ensureTelephoneCoachingPreviewSchema();
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return db.select({ slotTime: telephoneCoachingSlotSettings.slotTime, active: telephoneCoachingSlotSettings.active })
    .from(telephoneCoachingSlotSettings)
    .orderBy(telephoneCoachingSlotSettings.slotTime);
}

export async function updateAdminTelephoneCoachingSlotSetting(input: { slotTime: string; active: boolean }) {
  if (!/^\d{2}:\d{2}$/.test(input.slotTime)) throw new Error("INVALID_TELEPHONE_COACHING_SLOT_TIME");
  await ensureTelephoneCoachingPreviewSchema();
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const result = await db.update(telephoneCoachingSlotSettings)
    .set({ active: input.active, updatedAt: new Date() })
    .where(eq(telephoneCoachingSlotSettings.slotTime, input.slotTime));
  if (Number((result as any)[0]?.affectedRows ?? 0) !== 1) throw new Error("TELEPHONE_COACHING_SLOT_SETTING_NOT_FOUND");
  return { slotTime: input.slotTime, active: input.active };
}
