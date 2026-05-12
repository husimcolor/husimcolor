import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// 후기 테이블
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  rating: int("rating").notNull(), // 1~5
  content: text("content").notNull(),
  colorCombo: varchar("colorCombo", { length: 100 }), // 예: "라벤더 + 인디고 + 세이지"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// 입금 기록 테이블
export const paymentRecords = mysqlTable("payment_records", {
  id: int("id").autoincrement().primaryKey(),
  senderName: varchar("senderName", { length: 100 }).notNull(),   // 이름/닉네임
  contact: varchar("contact", { length: 100 }).notNull(),          // 연락처
  depositorName: varchar("depositorName", { length: 100 }).notNull(), // 입금자명
  amount: int("amount").default(30000).notNull(),                  // 결제 금액
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  memo: text("memo"),                                              // 관리자 메모
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;
