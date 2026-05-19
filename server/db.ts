import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Parse DATABASE_URL manually to handle ssl={...} JSON param that
      // mysql2's URL parser may not support in all environments (e.g. Vercel).
      const rawUrl = process.env.DATABASE_URL;
      // Strip the ssl=... query param and pass ssl config explicitly
      const urlWithoutSsl = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
      const pool = mysql.createPool({
        uri: urlWithoutSsl,
        ssl: { rejectUnauthorized: true },
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 10000,
      }).promise();
      _db = drizzle(pool) as any;
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// 후기 관련 DB 함수
import { InsertReview, reviews } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export async function getReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(50);
}

export async function createReview(data: InsertReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(data);
  return result[0].insertId;
}

export async function updateReview(id: number, data: Partial<InsertReview>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set(data).where(eq(reviews.id, id));
  return { success: true };
}

export async function getReviewById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteReview(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
  return { success: true };
}

export async function getReviewStats() {
  const db = await getDb();
  if (!db) return { total: 0, avgRating: 0, tagCounts: {} as Record<string, number> };
  const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(500);
  const total = all.length;
  const avgRating = total > 0 ? Math.round((all.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
  const tagCounts: Record<string, number> = {};
  for (const r of all) {
    if (r.tags) {
      for (const t of r.tags.split(',').map(s => s.trim()).filter(Boolean)) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }
  }
  return { total, avgRating, tagCounts };
}

// 입금 기록 관련 DB 함수
import { InsertPaymentRecord, paymentRecords } from "../drizzle/schema";

export async function createPaymentRecord(data: InsertPaymentRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(paymentRecords).values(data);
  return result[0].insertId;
}

// 통계/목록에서 제외할 관리자 연락처 목록
const ADMIN_CONTACTS = ['01025997977'];

export async function getPaymentRecords() {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(paymentRecords).orderBy(desc(paymentRecords.createdAt)).limit(200);
  // 관리자 연락처 제외
  return all.filter(r => !ADMIN_CONTACTS.includes(r.contact.replace(/-/g, '')));
}

export async function updatePaymentStatus(id: number, status: 'pending' | 'confirmed' | 'rejected', memo?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paymentRecords)
    .set({ status, ...(memo !== undefined ? { memo } : {}) })
    .where(eq(paymentRecords.id, id));
  return { success: true };
}

// 관리자 설정 DB 함수
import { adminSettings } from "../drizzle/schema";

export async function getAdminPassword(): Promise<string> {
  const db = await getDb();
  if (!db) return "hyusim2024";
  const result = await db.select().from(adminSettings).where(eq(adminSettings.key, "admin_password")).limit(1);
  return result.length > 0 ? result[0].value : "hyusim2024";
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminSettings)
    .values({ key: "admin_password", value: newPassword })
    .onDuplicateKeyUpdate({ set: { value: newPassword } });
}

// 방문자 수 추적 DB 함수
import { InsertVisitorLog, visitorLogs } from "../drizzle/schema";
import { count, sql } from "drizzle-orm";

export async function logVisitor(data: InsertVisitorLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(visitorLogs).values(data);
  } catch (e) {
    console.warn("[DB] logVisitor failed", e);
  }
}

export async function getTestSessionStats() {
  const db = await getDb();
  if (!db) return {
    freeStart: 0, freeResult: 0,
    deepStart: 0, deepResult: 0,
    coupleStart: 0, coupleResult: 0,
  };
  const freeStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'free_start'));
  const freeResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'free_result'));
  const deepStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'deep_start'));
  const deepResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'deep_result'));
  const coupleStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'couple_start'));
  const coupleResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'couple_result'));
  return {
    freeStart: Number(freeStartResult[0]?.cnt ?? 0),
    freeResult: Number(freeResultResult[0]?.cnt ?? 0),
    deepStart: Number(deepStartResult[0]?.cnt ?? 0),
    deepResult: Number(deepResultResult[0]?.cnt ?? 0),
    coupleStart: Number(coupleStartResult[0]?.cnt ?? 0),
    coupleResult: Number(coupleResultResult[0]?.cnt ?? 0),
  };
}

export async function getVisitorStats() {
  const db = await getDb();
  if (!db) return {
    totalLogs: 0, totalVisitors: 0, todayVisitors: 0,
    freeTrial: 0, premium: 0,
    freeStart: 0, freeResult: 0,
    deepStart: 0, deepResult: 0,
    coupleStart: 0, coupleResult: 0,
  };
  // 전체 방문 로그 수 (재방문 포함)
  const totalLogsResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs);
  // 고유 기기 수 기준 전체 방문자
  const totalResult = await db
    .select({ cnt: sql<number>`COUNT(DISTINCT ${visitorLogs.deviceId})` })
    .from(visitorLogs);
  // 오늘 방문자 (고유 기기 기준)
  const todayResult = await db
    .select({ cnt: sql<number>`COUNT(DISTINCT ${visitorLogs.deviceId})` })
    .from(visitorLogs)
    .where(sql`DATE(${visitorLogs.createdAt}) = CURDATE()`);
  const freeTrialResult = await db
    .select({ cnt: sql<number>`COUNT(DISTINCT ${visitorLogs.deviceId})` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'free_trial'));
  const premiumResult = await db
    .select({ cnt: sql<number>`COUNT(DISTINCT ${visitorLogs.deviceId})` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'premium'));
  // 테스트 세션 추적 통계 (이벤트 발생 횟수 기준)
  const freeStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'free_start'));
  const freeResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'free_result'));
  const deepStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'deep_start'));
  const deepResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'deep_result'));
  const coupleStartResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'couple_start'));
  const coupleResultResult = await db
    .select({ cnt: sql<number>`COUNT(*)` })
    .from(visitorLogs)
    .where(eq(visitorLogs.visitType, 'couple_result'));
  return {
    totalLogs: Number(totalLogsResult[0]?.cnt ?? 0),
    totalVisitors: Number(totalResult[0]?.cnt ?? 0),
    todayVisitors: Number(todayResult[0]?.cnt ?? 0),
    freeTrial: Number(freeTrialResult[0]?.cnt ?? 0),
    premium: Number(premiumResult[0]?.cnt ?? 0),
    freeStart: Number(freeStartResult[0]?.cnt ?? 0),
    freeResult: Number(freeResultResult[0]?.cnt ?? 0),
    deepStart: Number(deepStartResult[0]?.cnt ?? 0),
    deepResult: Number(deepResultResult[0]?.cnt ?? 0),
    coupleStart: Number(coupleStartResult[0]?.cnt ?? 0),
    coupleResult: Number(coupleResultResult[0]?.cnt ?? 0),
  };
}
