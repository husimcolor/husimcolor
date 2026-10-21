import { and, eq, gte, isNull, lt, ne, or, sql } from "drizzle-orm";

import { orderItems, orders, paymentTransactions, visitorLogs } from "../../drizzle/schema";
import { getCommerceFunnelEventRows, getDb } from "../db";

/**
 * 운영 홈의 신규 지표는 기존 체험 통계를 지우지 않고, 2026-10-09 KST 이후의
 * 원장/완료 이벤트만 다시 읽는다. 해당 시점 전의 레코드는 원본으로 보존한다.
 */
export const OPERATIONS_REPORTING_START_AT = new Date("2026-10-08T15:00:00.000Z");
export const HOMEPAGE_VISITOR_COLLECTION_START_LABEL = "2026.10.12 KST";

export type KstDayRange = { start: Date; end: Date; label: string };

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((item) => item.type === type)?.value ?? 0);
}

export function getKstDayRange(now = new Date()): KstDayRange {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = part(parts, "year");
  const month = part(parts, "month");
  const day = part(parts, "day");
  const start = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, label: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` };
}

function valueOf(row: Record<string, unknown> | undefined, key: string): number {
  return Number(row?.[key] ?? 0);
}

async function countDistinctDevices(where: unknown): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({ value: sql<number>`COUNT(DISTINCT ${visitorLogs.deviceId})` })
    .from(visitorLogs)
    .where(where as any);
  return valueOf(rows[0] as Record<string, unknown> | undefined, "value");
}

/**
 * 당일 완료 화면의 새로고침은 같은 deviceId를 다시 기록할 수 있다. 운영 홈은
 * 같은 기기·같은 완료 종류의 당일 재진입을 한 건으로 보아 중복 표시하지 않는다.
 */
export async function getAdminDailyOperationsSignals(now = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const day = getKstDayRange(now);
  const reportingStart = day.start > OPERATIONS_REPORTING_START_AT ? day.start : OPERATIONS_REPORTING_START_AT;
  const visitorToday = (additional: unknown) => and(
    gte(visitorLogs.createdAt, reportingStart),
    lt(visitorLogs.createdAt, day.end),
    additional as any,
  );

  const [homepageVisitors, appVisitors, freeColorCompletions, friendCompletions, paymentRows] = await Promise.all([
    // 홈페이지는 landing proxy가 home + testType=landing으로 기록한다.
    countDistinctDevices(visitorToday(and(eq(visitorLogs.visitType, "home"), eq(visitorLogs.testType, "landing")))),
    // 기존 앱 홈 이벤트는 testType을 비워 두었으므로 기존 원장을 보존해 재집계한다.
    countDistinctDevices(visitorToday(and(
      eq(visitorLogs.visitType, "home"),
      or(isNull(visitorLogs.testType), ne(visitorLogs.testType, "landing")),
    ))),
    countDistinctDevices(visitorToday(eq(visitorLogs.visitType, "free_result"))),
    countDistinctDevices(visitorToday(and(
      eq(visitorLogs.visitType, "couple_result"),
      eq(visitorLogs.relationshipType, "친구"),
    ))),
    db
      .select({
        paidOrderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
        revenueKrw: sql<number>`COALESCE(SUM(${orders.finalAmountKrw}), 0)`,
        personalDeepCount: sql<number>`COALESCE(SUM(CASE WHEN ${orderItems.productCodeSnapshot} = 'personal_deep' THEN 1 ELSE 0 END), 0)`,
        coupleLoveDeepCount: sql<number>`COALESCE(SUM(CASE WHEN ${orderItems.productCodeSnapshot} = 'couple_love_deep' THEN 1 ELSE 0 END), 0)`,
        parentChildDeepCount: sql<number>`COALESCE(SUM(CASE WHEN ${orderItems.productCodeSnapshot} = 'parent_child_deep' THEN 1 ELSE 0 END), 0)`,
      })
      .from(orders)
      .innerJoin(paymentTransactions, eq(paymentTransactions.orderId, orders.id))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(
        eq(orders.status, "paid"),
        eq(orders.isTest, false),
        eq(paymentTransactions.provider, "toss_live"),
        eq(paymentTransactions.status, "approved"),
        gte(orders.paidAt, reportingStart),
        lt(orders.paidAt, day.end),
      )),
  ]);

  const payments = paymentRows[0] as Record<string, unknown> | undefined;
  return {
    reportingStartAt: OPERATIONS_REPORTING_START_AT,
    kstDate: day.label,
    homepageVisitorCollectionStartLabel: HOMEPAGE_VISITOR_COLLECTION_START_LABEL,
    homepageVisitors,
    appVisitors,
    freeColorCompletions,
    friendFreeCompletions: friendCompletions,
    livePaidOrderCount: valueOf(payments, "paidOrderCount"),
    personalDeepPaidCount: valueOf(payments, "personalDeepCount"),
    coupleLoveDeepPaidCount: valueOf(payments, "coupleLoveDeepCount"),
    parentChildDeepPaidCount: valueOf(payments, "parentChildDeepCount"),
    revenueKrw: valueOf(payments, "revenueKrw"),
  };
}


function kstRangeForDateLabel(label: string): KstDayRange {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (!match) throw new Error("FUNNEL_DATE_INVALID");
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText); const month = Number(monthText); const day = Number(dayText);
  const start = new Date(Date.UTC(year, month - 1, day - 1, 15, 0, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, label };
}

/** 새 퍼널은 최초 수집일 이후의 event 원장만 반환한다. 기존 방문 로그를 소급 추정하지 않는다. */
export async function getAdminFunnelDaily(input: { fromKst: string; toKst: string }) {
  const from = kstRangeForDateLabel(input.fromKst);
  const to = kstRangeForDateLabel(input.toKst);
  if (to.start < from.start || to.start.getTime() - from.start.getTime() > 30 * 24 * 60 * 60 * 1000) throw new Error("FUNNEL_DATE_RANGE_INVALID");
  const end = new Date(to.end.getTime());
  // DB session timezone에 의존하지 않도록 각 KST 일자를 독립 window로 집계한다. 최대 31일이다.
  const dailyRows = await Promise.all(Array.from({ length: Math.floor((end.getTime() - from.start.getTime()) / (24 * 60 * 60 * 1000)) }, async (_, index) => {
    const start = new Date(from.start.getTime() + index * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const label = new Date(start.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const row = await getCommerceFunnelEventRows({ start, end: dayEnd });
    return row.map((item) => ({ kstDate: label, ...item, eventCount: Number(item.eventCount), deviceCount: Number(item.deviceCount) }));
  }));
  return { fromKst: from.label, toKst: to.label, rows: dailyRows.flat() };
}
