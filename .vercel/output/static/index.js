// server/_core/index.ts
import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  rating: int("rating").notNull(),
  // 1~5
  content: text("content").notNull(),
  tags: varchar("tags", { length: 255 }),
  // 공감 포인트 태그 (콤마 구분)
  colorCombo: varchar("colorCombo", { length: 100 }),
  // 예: "라벤더 + 인디고 + 세이지"
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var paymentRecords = mysqlTable("payment_records", {
  id: int("id").autoincrement().primaryKey(),
  senderName: varchar("senderName", { length: 100 }).notNull(),
  // 이름/닉네임
  contact: varchar("contact", { length: 100 }).notNull(),
  // 연락처
  depositorName: varchar("depositorName", { length: 100 }).notNull(),
  // 입금자명
  amount: int("amount").default(3e4).notNull(),
  // 결제 금액
  status: mysqlEnum("status", ["pending", "confirmed", "rejected"]).default("pending").notNull(),
  memo: text("memo"),
  // 관리자 메모
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var visitorLogs = mysqlTable("visitor_logs", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 128 }).notNull(),
  // 기기별 고유 ID
  visitType: mysqlEnum("visitType", [
    "home",
    "free_trial",
    "premium",
    // 테스트 세션 추적 이벤트
    "free_start",
    // 무료 컬러 테스트 시작
    "free_result",
    // 무료 컬러 테스트 결과 도달
    "deep_start",
    // 심화 테스트 시작
    "deep_result",
    // 심화 테스트 결과 도달
    "couple_start",
    // 커플 테스트 시작
    "couple_result"
    // 커플 테스트 결과 도달
  ]).default("home").notNull(),
  // 익명 세션 추가 정보
  testType: varchar("testType", { length: 50 }),
  // 'free' | 'deep' | 'couple'
  relationshipType: varchar("relationshipType", { length: 50 }),
  // 관계 유형
  selectedColors: varchar("selectedColors", { length: 255 }),
  // 선택 컬러 (콤마 구분)
  selectedCards: varchar("selectedCards", { length: 255 }),
  // 선택 심리카드 (콤마 구분)
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  // 설정 키 (예: 'admin_password')
  value: text("value").notNull(),
  // 설정 값
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const rawUrl = process.env.DATABASE_URL;
      const urlWithoutSsl = rawUrl.replace(/[?&]ssl=[^&]*/g, "").replace(/\?$/, "");
      const pool = mysql.createPool({
        uri: urlWithoutSsl,
        ssl: {
          rejectUnauthorized: false,
          minVersion: "TLSv1.2"
        },
        waitForConnections: true,
        connectionLimit: 5,
        connectTimeout: 15e3
      }).promise();
      _db = drizzle(pool);
      console.log("[Database] Connected successfully");
    } catch (error) {
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
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getReviews() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(50);
}
async function createReview(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviews).values(data);
  return result[0].insertId;
}
async function updateReview(id, data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviews).set(data).where(eq(reviews.id, id));
  return { success: true };
}
async function deleteReview(id) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviews).where(eq(reviews.id, id));
  return { success: true };
}
async function getReviewStats() {
  const db = await getDb();
  if (!db) return { total: 0, avgRating: 0, tagCounts: {} };
  const all = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(500);
  const total = all.length;
  const avgRating = total > 0 ? Math.round(all.reduce((s, r) => s + r.rating, 0) / total * 10) / 10 : 0;
  const tagCounts = {};
  for (const r of all) {
    if (r.tags) {
      for (const t2 of r.tags.split(",").map((s) => s.trim()).filter(Boolean)) {
        tagCounts[t2] = (tagCounts[t2] ?? 0) + 1;
      }
    }
  }
  return { total, avgRating, tagCounts };
}
async function createPaymentRecord(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(paymentRecords).values(data);
  return result[0].insertId;
}
var ADMIN_CONTACTS = ["01025997977"];
async function getPaymentRecords() {
  const db = await getDb();
  if (!db) return [];
  const all = await db.select().from(paymentRecords).orderBy(desc(paymentRecords.createdAt)).limit(200);
  return all.filter((r) => !ADMIN_CONTACTS.includes(r.contact.replace(/-/g, "")));
}
async function updatePaymentStatus(id, status, memo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(paymentRecords).set({ status, ...memo !== void 0 ? { memo } : {} }).where(eq(paymentRecords.id, id));
  return { success: true };
}
async function getAdminPassword() {
  const db = await getDb();
  if (!db) return "hyusim2024";
  const result = await db.select().from(adminSettings).where(eq(adminSettings.key, "admin_password")).limit(1);
  return result.length > 0 ? result[0].value : "hyusim2024";
}
async function setAdminPassword(newPassword) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(adminSettings).values({ key: "admin_password", value: newPassword }).onDuplicateKeyUpdate({ set: { value: newPassword } });
}
async function logVisitor(data) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(visitorLogs).values(data);
  } catch (e) {
    console.warn("[DB] logVisitor failed", e);
  }
}
async function getTestSessionStats() {
  const db = await getDb();
  if (!db) return {
    freeStart: 0,
    freeResult: 0,
    deepStart: 0,
    deepResult: 0,
    coupleStart: 0,
    coupleResult: 0
  };
  const freeStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "free_start"));
  const freeResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "free_result"));
  const deepStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "deep_start"));
  const deepResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "deep_result"));
  const coupleStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "couple_start"));
  const coupleResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "couple_result"));
  return {
    freeStart: Number(freeStartResult[0]?.cnt ?? 0),
    freeResult: Number(freeResultResult[0]?.cnt ?? 0),
    deepStart: Number(deepStartResult[0]?.cnt ?? 0),
    deepResult: Number(deepResultResult[0]?.cnt ?? 0),
    coupleStart: Number(coupleStartResult[0]?.cnt ?? 0),
    coupleResult: Number(coupleResultResult[0]?.cnt ?? 0)
  };
}
async function getVisitorStats() {
  const db = await getDb();
  if (!db) return {
    totalLogs: 0,
    totalVisitors: 0,
    todayVisitors: 0,
    freeTrial: 0,
    premium: 0,
    freeStart: 0,
    freeResult: 0,
    deepStart: 0,
    deepResult: 0,
    coupleStart: 0,
    coupleResult: 0
  };
  const totalLogsResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs);
  const totalResult = await db.select({ cnt: sql`COUNT(DISTINCT ${visitorLogs.deviceId})` }).from(visitorLogs);
  const todayResult = await db.select({ cnt: sql`COUNT(DISTINCT ${visitorLogs.deviceId})` }).from(visitorLogs).where(sql`DATE(${visitorLogs.createdAt}) = CURDATE()`);
  const freeTrialResult = await db.select({ cnt: sql`COUNT(DISTINCT ${visitorLogs.deviceId})` }).from(visitorLogs).where(eq(visitorLogs.visitType, "free_trial"));
  const premiumResult = await db.select({ cnt: sql`COUNT(DISTINCT ${visitorLogs.deviceId})` }).from(visitorLogs).where(eq(visitorLogs.visitType, "premium"));
  const freeStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "free_start"));
  const freeResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "free_result"));
  const deepStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "deep_start"));
  const deepResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "deep_result"));
  const coupleStartResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "couple_start"));
  const coupleResultResult = await db.select({ cnt: sql`COUNT(*)` }).from(visitorLogs).where(eq(visitorLogs.visitType, "couple_result"));
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
    coupleResult: Number(coupleResultResult[0]?.cnt ?? 0)
  };
}

// server/_core/cookies.ts
var LOCAL_HOSTS = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1"]);
function isIpAddress(host) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getParentDomain(hostname) {
  if (LOCAL_HOSTS.has(hostname) || isIpAddress(hostname)) {
    return void 0;
  }
  const parts = hostname.split(".");
  if (parts.length < 3) {
    return void 0;
  }
  return "." + parts.slice(-2).join(".");
}
function getSessionCookieOptions(req) {
  const hostname = req.hostname;
  const domain = getParentDomain(hostname);
  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import jwt from "jsonwebtoken";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(EXCHANGE_TOKEN_PATH, payload);
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(GET_USER_INFO_PATH, {
      accessToken: token.accessToken
    });
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(platforms.filter((p) => typeof p === "string"));
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secret = ENV.cookieSecret;
    return jwt.sign(
      {
        openId: payload.openId,
        appId: payload.appId,
        name: payload.name
      },
      secret,
      {
        algorithm: "HS256",
        expiresIn: Math.floor(expiresInMs / 1e3)
      }
    );
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secret = ENV.cookieSecret;
      const payload = jwt.verify(cookieValue, secret, { algorithms: ["HS256"] });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
async function syncUser(userInfo) {
  if (!userInfo.openId) {
    throw new Error("openId missing from user info");
  }
  const lastSignedIn = /* @__PURE__ */ new Date();
  await upsertUser({
    openId: userInfo.openId,
    name: userInfo.name || null,
    email: userInfo.email ?? null,
    loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
    lastSignedIn
  });
  const saved = await getUserByOpenId(userInfo.openId);
  return saved ?? {
    openId: userInfo.openId,
    name: userInfo.name,
    email: userInfo.email,
    loginMethod: userInfo.loginMethod ?? null,
    lastSignedIn
  };
}
function buildUserResponse(user) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString()
  };
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      const frontendUrl = process.env.EXPO_WEB_PREVIEW_URL || process.env.EXPO_PACKAGER_PROXY_URL || "http://localhost:8081";
      res.redirect(302, frontendUrl);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/oauth/mobile", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      const user = await syncUser(userInfo);
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        app_session_id: sessionToken,
        user: buildUserResponse(user)
      });
    } catch (error) {
      console.error("[OAuth] Mobile exchange failed", error);
      res.status(500).json({ error: "OAuth mobile exchange failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });
  app.get("/api/auth/me", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/me failed:", error);
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
  app.post("/api/auth/session", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        res.status(400).json({ error: "Bearer token required" });
        return;
      }
      const token = authHeader.slice("Bearer ".length).trim();
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ success: true, user: buildUserResponse(user) });
    } catch (error) {
      console.error("[Auth] /api/auth/session failed:", error);
      res.status(401).json({ error: "Invalid token" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL("webdevtoken.v1.WebDevService/SendNotification", normalizedBase).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  // 관리자 인증 API (DB 기반 - 브라우저 무관)
  admin: router({
    // 비밀번호 검증
    verifyPassword: publicProcedure.input(z2.object({ password: z2.string() })).mutation(async ({ input }) => {
      const correct = await getAdminPassword();
      if (input.password !== correct) {
        throw new Error("WRONG_PASSWORD");
      }
      return { success: true };
    }),
    // 비밀번호 변경
    changePassword: publicProcedure.input(z2.object({
      currentPassword: z2.string(),
      newPassword: z2.string().min(4).max(100)
    })).mutation(async ({ input }) => {
      const correct = await getAdminPassword();
      if (input.currentPassword !== correct) {
        throw new Error("WRONG_PASSWORD");
      }
      await setAdminPassword(input.newPassword);
      return { success: true };
    })
  }),
  // 입금 기록 API
  payments: router({
    create: publicProcedure.input(z2.object({
      senderName: z2.string().min(1).max(100),
      contact: z2.string().min(1).max(100),
      depositorName: z2.string().min(1).max(100),
      amount: z2.number().int().default(3e4)
    })).mutation(({ input }) => {
      return createPaymentRecord(input);
    }),
    list: publicProcedure.query(() => {
      return getPaymentRecords();
    }),
    updateStatus: publicProcedure.input(z2.object({
      id: z2.number().int(),
      status: z2.enum(["pending", "confirmed", "rejected"]),
      memo: z2.string().max(500).optional()
    })).mutation(({ input }) => {
      return updatePaymentStatus(input.id, input.status, input.memo);
    })
  }),
  // 방문자 수 추적 API
  visitors: router({
    log: publicProcedure.input(z2.object({
      deviceId: z2.string().min(1).max(128),
      visitType: z2.enum([
        "home",
        "free_trial",
        "premium",
        "free_start",
        "free_result",
        "deep_start",
        "deep_result",
        "couple_start",
        "couple_result"
      ]),
      testType: z2.string().max(50).optional(),
      relationshipType: z2.string().max(50).optional(),
      selectedColors: z2.string().max(255).optional(),
      selectedCards: z2.string().max(255).optional()
    })).mutation(({ input }) => {
      return logVisitor(input);
    }),
    stats: publicProcedure.query(() => {
      return getVisitorStats();
    }),
    testStats: publicProcedure.query(() => {
      return getTestSessionStats();
    })
  }),
  // 후기 API
  reviews: router({
    list: publicProcedure.query(() => {
      return getReviews();
    }),
    stats: publicProcedure.query(() => {
      return getReviewStats();
    }),
    create: publicProcedure.input(z2.object({
      nickname: z2.string().min(1).max(50),
      rating: z2.number().int().min(1).max(5),
      content: z2.string().max(500).default(""),
      tags: z2.string().max(255).optional(),
      colorCombo: z2.string().max(100).optional()
    })).mutation(({ input }) => {
      return createReview(input);
    }),
    update: publicProcedure.input(z2.object({
      id: z2.number().int(),
      rating: z2.number().int().min(1).max(5).optional(),
      content: z2.string().max(500).optional(),
      tags: z2.string().max(255).optional()
    })).mutation(({ input }) => {
      const { id, ...data } = input;
      return updateReview(id, data);
    }),
    delete: publicProcedure.input(z2.object({ id: z2.number().int() })).mutation(({ input }) => {
      return deleteReview(input.id);
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}
startServer().catch(console.error);
