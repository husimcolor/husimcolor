import { and, eq, gt, inArray, lt, lte, sql } from "drizzle-orm";

import {
  coachingBookings,
  coachingScheduleMutex,
  coachingSlotClaims,
  coachingSlotHolds,
  telephoneCoachingSlotSettings,
} from "../../drizzle/schema";
import {
  isAdultTelephoneBirthDate,
  type BirthCalendarType,
  validateTelephoneBirthDate,
} from "./telephone-birth-date";

export const TELEPHONE_COACHING_PRODUCT_CODE = "telephone_coaching" as const;
export const TELEPHONE_COACHING_DURATION_MINUTES = 50;
export const TELEPHONE_COACHING_SLOT_MINUTES = 60;
/** 고객 기준 마지막 예약 시작은 20:00(상담 20:50 종료), 운영 슬롯은 21:00까지 점유한다. */
export const DEFAULT_TELEPHONE_COACHING_SLOT_TIMES = ["10:00", "11:30", "14:00", "16:00", "19:00", "20:00"] as const;

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
  birthCalendarType: BirthCalendarType | null;
  isLeapMonth: boolean;
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
  birthCalendarType?: BirthCalendarType;
  isLeapMonth?: boolean;
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
  birthCalendarType: BirthCalendarType | null;
  isLeapMonth: boolean;
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
  // 결제 전 암호문은 선택 생년월일을 비웠을 때도 `null` / `false`를 보존한다.
  // 이는 실제 달력 선택이 아니므로 복원 시 생년월일 입력으로 오인하면 안 된다.
  const birthCalendarType = request.birthCalendarType === "solar" || request.birthCalendarType === "lunar"
    ? request.birthCalendarType
    : undefined;
  const isLeapMonth = request.isLeapMonth === true;
  const hasBirthCalendarMetadata = birthCalendarType !== undefined || isLeapMonth;

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
  if (!fiveElementsOptIn && (birthDate || hasBirthCalendarMetadata)) {
    throw new Error("TELEPHONE_COACHING_BIRTH_DATE_REQUIRES_OPT_IN");
  }
  if (!birthDate && hasBirthCalendarMetadata) {
    throw new Error("TELEPHONE_COACHING_BIRTH_DATE_REQUIRED_FOR_CALENDAR_DETAILS");
  }

  // 오행 참고를 선택해도 생년월일은 선택사항이다. 실제 입력된 경우에만 양력·음력·윤달을 검증·보관한다.
  const validatedBirthDate = birthDate
    ? validateTelephoneBirthDate({
        birthDate,
        birthCalendarType,
        isLeapMonth,
      })
    : null;
  if (validatedBirthDate && !isAdultTelephoneBirthDate(validatedBirthDate, now)) {
    throw new Error("INVALID_TELEPHONE_COACHING_BIRTH_DATE");
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
    birthDate: validatedBirthDate?.birthDate ?? null,
    birthCalendarType: validatedBirthDate?.birthCalendarType ?? null,
    isLeapMonth: validatedBirthDate?.isLeapMonth ?? false,
  };
}

export function getTelephoneCoachingDetails(request: NormalizedTelephoneCoachingBookingRequest): TelephoneCoachingDetails {
  return {
    topic: request.topic,
    fiveElementsOptIn: request.fiveElementsOptIn,
    birthDate: request.birthDate,
    birthCalendarType: request.birthCalendarType,
    isLeapMonth: request.isLeapMonth,
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
      await execute("CREATE TABLE IF NOT EXISTS `coaching_schedule_mutex` (`id` int NOT NULL, `version` int NOT NULL DEFAULT 0, CONSTRAINT `coaching_schedule_mutex_id` PRIMARY KEY(`id`))");
      const [scheduleMutexVersion] = await execute("SHOW COLUMNS FROM `coaching_schedule_mutex` LIKE 'version'");
      if (!(scheduleMutexVersion as any)?.[0]) {
        await execute("ALTER TABLE `coaching_schedule_mutex` ADD COLUMN `version` int NOT NULL DEFAULT 0");
      }
      await execute("INSERT IGNORE INTO `coaching_schedule_mutex` (`id`) VALUES (1)");
      await execute("CREATE TABLE IF NOT EXISTS `coaching_slot_claims` (`id` int AUTO_INCREMENT NOT NULL, `orderId` int NULL, `bookingId` int NULL, `bucketStart` timestamp NOT NULL, `createdAt` timestamp NOT NULL DEFAULT (now()), CONSTRAINT `coaching_slot_claims_id` PRIMARY KEY(`id`), CONSTRAINT `coaching_slot_claims_bucket_unique` UNIQUE(`bucketStart`), INDEX `coaching_slot_claims_order_idx` (`orderId`), INDEX `coaching_slot_claims_booking_idx` (`bookingId`))");
      await execute("CREATE TABLE IF NOT EXISTS `telephone_coaching_slot_settings` (`id` int AUTO_INCREMENT NOT NULL, `slotTime` varchar(5) NOT NULL, `active` boolean NOT NULL DEFAULT true, `createdAt` timestamp NOT NULL DEFAULT (now()), `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP, CONSTRAINT `telephone_coaching_slot_settings_id` PRIMARY KEY(`id`), CONSTRAINT `telephone_coaching_slot_settings_time_unique` UNIQUE(`slotTime`))");
      await execute("INSERT INTO `telephone_coaching_slot_settings` (`slotTime`, `active`) VALUES ('10:00', true), ('11:30', true), ('14:00', true), ('16:00', true), ('19:00', true), ('20:00', true) ON DUPLICATE KEY UPDATE `slotTime` = VALUES(`slotTime`)");
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
  const expired = await tx
    .select({ orderId: coachingSlotHolds.orderId })
    .from(coachingSlotHolds)
    .where(and(eq(coachingSlotHolds.status, "held"), lte(coachingSlotHolds.expiresAt, now)));
  await tx
    .update(coachingSlotHolds)
    .set({ status: "expired", updatedAt: now })
    .where(and(eq(coachingSlotHolds.status, "held"), lte(coachingSlotHolds.expiresAt, now)));
  const expiredOrderIds = expired.map((row: { orderId: number }) => row.orderId);
  if (expiredOrderIds.length > 0) {
    await tx.delete(coachingSlotClaims).where(inArray(coachingSlotClaims.orderId, expiredOrderIds));
  }
}

/**
 * 범위 조건에는 일반적인 unique index를 둘 수 없으므로, 같은 DB 트랜잭션 안에서
 * 단일 mutex 행을 잠가 충돌 조회와 보류/확정 저장을 직렬화한다.
 */
async function lockSharedCoachingSchedule(tx: any) {
  const result = await tx
    .update(coachingScheduleMutex)
    .set({ version: sql`${coachingScheduleMutex.version} + 1` })
    .where(eq(coachingScheduleMutex.id, 1));
  if (Number((result as any)[0]?.affectedRows ?? 0) !== 1) {
    throw new Error("COACHING_SCHEDULE_MUTEX_UNAVAILABLE");
  }
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

const COACHING_SLOT_BUCKET_MS = 30 * 60 * 1000;

function getCoachingSlotBucketStarts(slotStart: Date, slotEnd: Date): Date[] {
  const first = Math.floor(slotStart.getTime() / COACHING_SLOT_BUCKET_MS) * COACHING_SLOT_BUCKET_MS;
  const buckets: Date[] = [];
  for (let value = first; value < slotEnd.getTime(); value += COACHING_SLOT_BUCKET_MS) {
    buckets.push(new Date(value));
  }
  return buckets;
}

/**
 * 30분 단위 bucketStart의 UNIQUE 제약이 동시 트랜잭션에서도 같은 일정 점유를 차단한다.
 * 스케줄 변경이면 기존 예약의 claims를 같은 트랜잭션에서 교체하며, 실패하면 롤백된다.
 */
export async function claimSharedCoachingSlot(tx: any, input: {
  slotStart: Date;
  slotEnd: Date;
  orderId?: number | null;
  bookingId?: number | null;
  replaceBookingId?: number | null;
}) {
  if (input.replaceBookingId) {
    await tx.delete(coachingSlotClaims).where(eq(coachingSlotClaims.bookingId, input.replaceBookingId));
  }
  try {
    await tx.insert(coachingSlotClaims).values(
      getCoachingSlotBucketStarts(input.slotStart, input.slotEnd).map((bucketStart) => ({
        orderId: input.orderId ?? null,
        bookingId: input.bookingId ?? null,
        bucketStart,
      })),
    );
  } catch (error) {
    const code = String((error as { code?: string; cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code ?? "");
    if (code === "ER_DUP_ENTRY" || /duplicate|unique/i.test(String(error))) {
      throw new Error("COACHING_SLOT_NOT_AVAILABLE");
    }
    throw error;
  }
}

export async function releaseSharedCoachingSlotClaimsForBooking(tx: any, bookingId: number) {
  await tx.delete(coachingSlotClaims).where(eq(coachingSlotClaims.bookingId, bookingId));
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
  await claimSharedCoachingSlot(tx, {
    orderId: input.orderId,
    slotStart: input.request.requestedWindowStart,
    slotEnd: input.request.requestedWindowEnd,
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

/**
 * 성공 리디렉션이 늦게 도착한 Preview 테스트 주문을 위한 일회성 재보류다.
 * 기존 만료 보류를 그대로 확정하지 않고, 현재 운영 설정·대면/전화 충돌·bucket
 * unique claim을 다시 통과한 경우에만 짧은 보류를 새로 만든다.
 */
export async function restoreExpiredTelephoneCoachingSlotForOrder(tx: any, input: {
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
  await claimSharedCoachingSlot(tx, {
    orderId: input.orderId,
    slotStart: input.request.requestedWindowStart,
    slotEnd: input.request.requestedWindowEnd,
  });
  const reheld = await tx.update(coachingSlotHolds).set({
    productId: input.productId,
    bookingId: null,
    slotStart: input.request.requestedWindowStart,
    slotEnd: input.request.requestedWindowEnd,
    status: "held",
    expiresAt: input.expiresAt,
    updatedAt: now,
  }).where(and(
    eq(coachingSlotHolds.orderId, input.orderId),
    inArray(coachingSlotHolds.status, ["expired", "released"]),
  ));
  if (Number((reheld as any)[0]?.affectedRows ?? 0) !== 1) {
    throw new Error("TELEPHONE_COACHING_RECOVERY_HOLD_NOT_AVAILABLE");
  }
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
  await tx.update(coachingSlotClaims)
    .set({ bookingId: input.bookingId })
    .where(eq(coachingSlotClaims.orderId, input.orderId));
}

export async function releaseTelephoneCoachingSlotForOrder(tx: any, orderId: number, now = new Date()) {
  await tx.update(coachingSlotHolds)
    .set({ status: "released", updatedAt: now })
    .where(and(eq(coachingSlotHolds.orderId, orderId), inArray(coachingSlotHolds.status, ["held", "confirmed"])));
  await tx.delete(coachingSlotClaims).where(eq(coachingSlotClaims.orderId, orderId));
}

/** 관리자 대면 예약도 전화 코칭 결제 중 보류된 시간을 침범하지 않도록 같은 판정을 쓴다. */
export async function assertSharedCoachingSlotAvailable(tx: any, input: {
  slotStart: Date;
  slotEnd: Date;
  excludeBookingId?: number;
  excludeOrderId?: number;
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
