"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettings = exports.visitorLogs = exports.paymentRecords = exports.reviews = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: (0, mysql_core_1.varchar)("openId", { length: 64 }).notNull().unique(),
    name: (0, mysql_core_1.text)("name"),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }),
    loginMethod: (0, mysql_core_1.varchar)("loginMethod", { length: 64 }),
    role: (0, mysql_core_1.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: (0, mysql_core_1.timestamp)("lastSignedIn").defaultNow().notNull(),
});
// 후기 테이블
exports.reviews = (0, mysql_core_1.mysqlTable)("reviews", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    nickname: (0, mysql_core_1.varchar)("nickname", { length: 50 }).notNull(),
    rating: (0, mysql_core_1.int)("rating").notNull(), // 1~5
    content: (0, mysql_core_1.text)("content").notNull(),
    tags: (0, mysql_core_1.varchar)("tags", { length: 255 }), // 공감 포인트 태그 (콤마 구분)
    colorCombo: (0, mysql_core_1.varchar)("colorCombo", { length: 100 }), // 예: "라벤더 + 인디고 + 세이지"
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// 입금 기록 테이블
exports.paymentRecords = (0, mysql_core_1.mysqlTable)("payment_records", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    senderName: (0, mysql_core_1.varchar)("senderName", { length: 100 }).notNull(), // 이름/닉네임
    contact: (0, mysql_core_1.varchar)("contact", { length: 100 }).notNull(), // 연락처
    depositorName: (0, mysql_core_1.varchar)("depositorName", { length: 100 }).notNull(), // 입금자명
    amount: (0, mysql_core_1.int)("amount").default(30000).notNull(), // 결제 금액
    status: (0, mysql_core_1.mysqlEnum)("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
    memo: (0, mysql_core_1.text)("memo"), // 관리자 메모
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// 방문자 수 추적 테이블
exports.visitorLogs = (0, mysql_core_1.mysqlTable)("visitor_logs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    deviceId: (0, mysql_core_1.varchar)("deviceId", { length: 128 }).notNull(), // 기기별 고유 ID
    visitType: (0, mysql_core_1.mysqlEnum)("visitType", [
        "home",
        "free_trial",
        "premium",
        // 테스트 세션 추적 이벤트
        "free_start", // 무료 컬러 테스트 시작
        "free_result", // 무료 컬러 테스트 결과 도달
        "deep_start", // 심화 테스트 시작
        "deep_result", // 심화 테스트 결과 도달
        "couple_start", // 커플 테스트 시작
        "couple_result", // 커플 테스트 결과 도달
    ]).default("home").notNull(),
    // 익명 세션 추가 정보
    testType: (0, mysql_core_1.varchar)("testType", { length: 50 }), // 'free' | 'deep' | 'couple'
    relationshipType: (0, mysql_core_1.varchar)("relationshipType", { length: 50 }), // 관계 유형
    selectedColors: (0, mysql_core_1.varchar)("selectedColors", { length: 255 }), // 선택 컬러 (콤마 구분)
    selectedCards: (0, mysql_core_1.varchar)("selectedCards", { length: 255 }), // 선택 심리카드 (콤마 구분)
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
// 관리자 설정 테이블 (비밀번호 등 전역 설정 - DB 기반으로 브라우저 무관)
exports.adminSettings = (0, mysql_core_1.mysqlTable)("admin_settings", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    key: (0, mysql_core_1.varchar)("key", { length: 100 }).notNull().unique(), // 설정 키 (예: 'admin_password')
    value: (0, mysql_core_1.text)("value").notNull(), // 설정 값
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
//# sourceMappingURL=schema.js.map