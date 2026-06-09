"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.upsertUser = upsertUser;
exports.getUserByOpenId = getUserByOpenId;
exports.getReviews = getReviews;
exports.createReview = createReview;
exports.updateReview = updateReview;
exports.getReviewById = getReviewById;
exports.deleteReview = deleteReview;
exports.getReviewStats = getReviewStats;
exports.createPaymentRecord = createPaymentRecord;
exports.getPaymentRecords = getPaymentRecords;
exports.updatePaymentStatus = updatePaymentStatus;
exports.getAdminPassword = getAdminPassword;
exports.setAdminPassword = setAdminPassword;
exports.logVisitor = logVisitor;
exports.getTestSessionStats = getTestSessionStats;
exports.getVisitorStats = getVisitorStats;
const drizzle_orm_1 = require("drizzle-orm");
const mysql2_1 = require("drizzle-orm/mysql2");
const mysql2_2 = __importDefault(require("mysql2"));
const schema_1 = require("../drizzle/schema");
const env_1 = require("./_core/env");
let _db = null;
// Lazily create the drizzle instance so local tooling can run without a DB.
async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            // Parse DATABASE_URL manually to handle ssl={...} JSON param that
            // mysql2's URL parser may not support in all environments (e.g. Vercel).
            const rawUrl = process.env.DATABASE_URL;
            // Strip the ssl=... query param and pass ssl config explicitly
            const urlWithoutSsl = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
            const pool = mysql2_2.default.createPool({
                uri: urlWithoutSsl,
                ssl: {
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2',
                },
                waitForConnections: true,
                connectionLimit: 5,
                connectTimeout: 15000,
            }).promise();
            _db = (0, mysql2_1.drizzle)(pool);
            console.log("[Database] Connected successfully");
        }
        catch (error) {
            console.warn("[Database] Failed to connect:", error);
            _db = null;
        }
    }
    return _db;
}
async function upsertUser(user) {
    if (!user.openId) {
        throw new Error("User openId is required for upsert");
    }
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }
    try {
        const values = {
            openId: user.openId,
        };
        const updateSet = {};
        const textFields = ["name", "email", "loginMethod"];
        const assignNullable = (field) => {
            const value = user[field];
            if (value === undefined)
                return;
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
        }
        else if (user.openId === env_1.ENV.ownerOpenId) {
            values.role = "admin";
            updateSet.role = "admin";
        }
        if (!values.lastSignedIn) {
            values.lastSignedIn = new Date();
        }
        if (Object.keys(updateSet).length === 0) {
            updateSet.lastSignedIn = new Date();
        }
        await db.insert(schema_1.users).values(values).onDuplicateKeyUpdate({
            set: updateSet,
        });
    }
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
async function getUserByOpenId(openId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
// 후기 관련 DB 함수
const schema_2 = require("../drizzle/schema");
const drizzle_orm_2 = require("drizzle-orm");
async function getReviews() {
    const db = await getDb();
    if (!db)
        return [];
    return db.select().from(schema_2.reviews).orderBy((0, drizzle_orm_2.desc)(schema_2.reviews.createdAt)).limit(50);
}
async function createReview(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = await db.insert(schema_2.reviews).values(data);
    return result[0].insertId;
}
async function updateReview(id, data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.update(schema_2.reviews).set(data).where((0, drizzle_orm_1.eq)(schema_2.reviews.id, id));
    return { success: true };
}
async function getReviewById(id) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = await db.select().from(schema_2.reviews).where((0, drizzle_orm_1.eq)(schema_2.reviews.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
async function deleteReview(id) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.delete(schema_2.reviews).where((0, drizzle_orm_1.eq)(schema_2.reviews.id, id));
    return { success: true };
}
async function getReviewStats() {
    const db = await getDb();
    if (!db)
        return { total: 0, avgRating: 0, tagCounts: {} };
    const all = await db.select().from(schema_2.reviews).orderBy((0, drizzle_orm_2.desc)(schema_2.reviews.createdAt)).limit(500);
    const total = all.length;
    const avgRating = total > 0 ? Math.round((all.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
    const tagCounts = {};
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
const schema_3 = require("../drizzle/schema");
async function createPaymentRecord(data) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    const result = await db.insert(schema_3.paymentRecords).values(data);
    return result[0].insertId;
}
// 통계/목록에서 제외할 관리자 연락처 목록
const ADMIN_CONTACTS = ['01025997977'];
async function getPaymentRecords() {
    const db = await getDb();
    if (!db)
        return [];
    const all = await db.select().from(schema_3.paymentRecords).orderBy((0, drizzle_orm_2.desc)(schema_3.paymentRecords.createdAt)).limit(200);
    // 관리자 연락처 제외
    return all.filter(r => !ADMIN_CONTACTS.includes(r.contact.replace(/-/g, '')));
}
async function updatePaymentStatus(id, status, memo) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.update(schema_3.paymentRecords)
        .set({ status, ...(memo !== undefined ? { memo } : {}) })
        .where((0, drizzle_orm_1.eq)(schema_3.paymentRecords.id, id));
    return { success: true };
}
// 관리자 설정 DB 함수
const schema_4 = require("../drizzle/schema");
async function getAdminPassword() {
    const db = await getDb();
    if (!db)
        return "hyusim2024";
    const result = await db.select().from(schema_4.adminSettings).where((0, drizzle_orm_1.eq)(schema_4.adminSettings.key, "admin_password")).limit(1);
    return result.length > 0 ? result[0].value : "hyusim2024";
}
async function setAdminPassword(newPassword) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.insert(schema_4.adminSettings)
        .values({ key: "admin_password", value: newPassword })
        .onDuplicateKeyUpdate({ set: { value: newPassword } });
}
// 방문자 수 추적 DB 함수
const schema_5 = require("../drizzle/schema");
const drizzle_orm_3 = require("drizzle-orm");
async function logVisitor(data) {
    const db = await getDb();
    if (!db)
        return;
    try {
        await db.insert(schema_5.visitorLogs).values(data);
    }
    catch (e) {
        console.warn("[DB] logVisitor failed", e);
    }
}
async function getTestSessionStats() {
    const db = await getDb();
    if (!db)
        return {
            freeStart: 0, freeResult: 0,
            deepStart: 0, deepResult: 0,
            coupleStart: 0, coupleResult: 0,
        };
    // 고유 deviceId 기준으로 집계 - 새로고침/재진입 중복 카운트 방지
    const freeStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'free_start'));
    const freeResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'free_result'));
    const deepStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'deep_start'));
    const deepResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'deep_result'));
    const coupleStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'couple_start'));
    const coupleResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'couple_result'));
    return {
        freeStart: Number(freeStartResult[0]?.cnt ?? 0),
        freeResult: Number(freeResultResult[0]?.cnt ?? 0),
        deepStart: Number(deepStartResult[0]?.cnt ?? 0),
        deepResult: Number(deepResultResult[0]?.cnt ?? 0),
        coupleStart: Number(coupleStartResult[0]?.cnt ?? 0),
        coupleResult: Number(coupleResultResult[0]?.cnt ?? 0),
    };
}
async function getVisitorStats() {
    const db = await getDb();
    if (!db)
        return {
            totalLogs: 0, totalVisitors: 0, todayVisitors: 0,
            freeTrial: 0, premium: 0,
            freeStart: 0, freeResult: 0,
            deepStart: 0, deepResult: 0,
            coupleStart: 0, coupleResult: 0,
        };
    // 전체 방문 로그 수 (재방문 포함)
    const totalLogsResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(*)` })
        .from(schema_5.visitorLogs);
    // 고유 기기 수 기준 전체 방문자
    const totalResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs);
    // 오늘 방문자 (고유 기기 기준)
    const todayResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_3.sql) `DATE(${schema_5.visitorLogs.createdAt}) = CURDATE()`);
    const freeTrialResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'free_trial'));
    const premiumResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'premium'));
    // 테스트 세션 추적 통계 (고유 deviceId 기준 - 새로고침/재진입 중복 카운트 방지)
    const freeStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'free_start'));
    const freeResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'free_result'));
    const deepStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'deep_start'));
    const deepResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'deep_result'));
    const coupleStartResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'couple_start'));
    const coupleResultResult = await db
        .select({ cnt: (0, drizzle_orm_3.sql) `COUNT(DISTINCT ${schema_5.visitorLogs.deviceId})` })
        .from(schema_5.visitorLogs)
        .where((0, drizzle_orm_1.eq)(schema_5.visitorLogs.visitType, 'couple_result'));
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
//# sourceMappingURL=db.js.map