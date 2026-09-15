import {
  boolean,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

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
  content: text("content"), // 자유 입력 (선택사항)
  checkItems: varchar("checkItems", { length: 500 }), // 선택형 체크 항목 (콤마 구분)
  tags: varchar("tags", { length: 255 }), // 공감 포인트 태그 (콤마 구분)
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

// 방문자 수 추적 테이블
export const visitorLogs = mysqlTable("visitor_logs", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 128 }).notNull(), // 기기별 고유 ID
  visitType: mysqlEnum("visitType", [
    "home",
    "free_trial",
    "premium",
    // 테스트 세션 추적 이벤트
    "free_start",       // 무료 컬러 테스트 시작
    "free_result",      // 무료 컬러 테스트 결과 도달
    "deep_start",       // 심화 테스트 시작
    "deep_result",      // 심화 테스트 결과 도달
    "couple_start",     // 커플 테스트 시작
    "couple_result",    // 커플 테스트 결과 도달
  ]).default("home").notNull(),
  // 익명 세션 추가 정보
  testType: varchar("testType", { length: 50 }),        // 'free' | 'deep' | 'couple'
  relationshipType: varchar("relationshipType", { length: 50 }), // 관계 유형
  selectedColors: varchar("selectedColors", { length: 255 }),    // 선택 컬러 (콤마 구분)
  selectedCards: varchar("selectedCards", { length: 255 }),      // 선택 심리카드 (콤마 구분)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorLog = typeof visitorLogs.$inferSelect;
export type InsertVisitorLog = typeof visitorLogs.$inferInsert;

// 커플 결과 공유 스냅샷 테이블
// 공유 링크가 이후의 새 검사나 다른 브라우저의 로컬 세션에 영향을 받지 않도록 결과를 고정 저장한다.
export const coupleSharedResults = mysqlTable("couple_shared_results", {
  id: int("id").autoincrement().primaryKey(),
  shareId: varchar("shareId", { length: 64 }).notNull().unique(),
  resultSnapshot: text("resultSnapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CoupleSharedResult = typeof coupleSharedResults.$inferSelect;
export type InsertCoupleSharedResult = typeof coupleSharedResults.$inferInsert;

// 관리자 설정 테이블 (비밀번호 등 전역 설정 - DB 기반으로 브라우저 무관)
export const adminSettings = mysqlTable("admin_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),   // 설정 키 (예: 'admin_password')
  value: text("value").notNull(),                            // 설정 값
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

// ---------------------------------------------------------------------------
// 공통 상거래 기반 테이블
// 기존 payment_records는 과거 수동 입금 이력 보존용으로 유지하며, 아래 신규
// 주문·결제·구매권한 테이블과 혼용하지 않는다.
// ---------------------------------------------------------------------------

export const customers = mysqlTable(
  "customers",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    emailEncrypted: text("emailEncrypted").notNull(),
    emailHash: varchar("emailHash", { length: 128 }).notNull(),
    emailVerifiedAt: timestamp("emailVerifiedAt"),
    status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("customers_email_hash_unique").on(table.emailHash),
    index("customers_user_id_idx").on(table.userId),
  ],
);

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * 앱과 홈페이지가 공통 users.id를 회원의 canonical user_id로 사용한다.
 * provider별 식별자는 원문 대신 HMAC 해시로 보관해, 카카오·네이버·이메일
 * 로그인도 같은 user_id에 안전하게 연결할 수 있다.
 */
export const accountIdentities = mysqlTable(
  "account_identities",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    provider: mysqlEnum("provider", ["manus", "email", "kakao", "naver"]).notNull(),
    providerSubjectHash: varchar("providerSubjectHash", { length: 128 }).notNull(),
    emailHash: varchar("emailHash", { length: 128 }),
    verifiedAt: timestamp("verifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("account_identities_provider_subject_unique").on(table.provider, table.providerSubjectHash),
    index("account_identities_user_idx").on(table.userId),
    index("account_identities_email_idx").on(table.emailHash),
  ],
);

export type AccountIdentity = typeof accountIdentities.$inferSelect;

/** 비회원 주문을 회원 계정에 귀속하기 위한 단발성 이메일 소유권 확인 챌린지다. */
export const accountLinkChallenges = mysqlTable(
  "account_link_challenges",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    targetEmailHash: varchar("targetEmailHash", { length: 128 }).notNull(),
    codeHash: varchar("codeHash", { length: 128 }).notNull(),
    purpose: mysqlEnum("purpose", ["claim_guest_commerce"]).notNull(),
    status: mysqlEnum("status", ["pending", "verified", "expired", "cancelled"])
      .notNull()
      .default("pending"),
    attempts: int("attempts").notNull().default(0),
    expiresAt: timestamp("expiresAt").notNull(),
    verifiedAt: timestamp("verifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("account_link_challenges_user_status_idx").on(table.userId, table.status),
    index("account_link_challenges_email_status_idx").on(table.targetEmailHash, table.status),
  ],
);

export type AccountLinkChallenge = typeof accountLinkChallenges.$inferSelect;

export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    fulfillmentType: mysqlEnum("fulfillmentType", ["analysis", "coaching"]).notNull(),
    requiresPayment: boolean("requiresPayment").notNull().default(false),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("products_code_unique").on(table.code)],
);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export const productPrices = mysqlTable(
  "product_prices",
  {
    id: int("id").autoincrement().primaryKey(),
    productId: int("productId").notNull(),
    /** 정상가. 분석 상품은 판매가와 같고, 코칭 상품은 정상가와 판매가를 함께 보관한다. */
    regularAmountKrw: int("regularAmountKrw").notNull().default(0),
    amountKrw: int("amountKrw").notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("KRW"),
    version: int("version").notNull(),
    validFrom: timestamp("validFrom").defaultNow().notNull(),
    validTo: timestamp("validTo"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_prices_product_version_unique").on(table.productId, table.version),
    index("product_prices_active_idx").on(table.productId, table.active),
  ],
);

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = typeof productPrices.$inferInsert;

export const orders = mysqlTable(
  "orders",
  {
    id: int("id").autoincrement().primaryKey(),
    orderNumber: varchar("orderNumber", { length: 64 }).notNull(),
    customerId: int("customerId"),
    userId: int("userId"),
    guestEmailHash: varchar("guestEmailHash", { length: 128 }),
    status: mysqlEnum("status", [
      "pending",
      "processing",
      "paid",
      "failed",
      "cancelled",
      "expired",
      "refunded",
    ])
      .notNull()
      .default("pending"),
    /** 주문이 시작된 고객 접점. 과거 주문은 app 기본값으로 보존한다. */
    channel: mysqlEnum("channel", ["app", "web"]).notNull().default("app"),
    /** Preview·Toss 테스트 주문은 매출 통계에서 분리한다. */
    isTest: boolean("isTest").notNull().default(false),
    currency: varchar("currency", { length: 3 }).notNull().default("KRW"),
    regularAmountKrw: int("regularAmountKrw").notNull().default(0),
    listAmountKrw: int("listAmountKrw").notNull(),
    discountAmountKrw: int("discountAmountKrw").notNull().default(0),
    finalAmountKrw: int("finalAmountKrw").notNull(),
    policyVersion: varchar("policyVersion", { length: 40 }).notNull().default("pending_legal_review"),
    expiresAt: timestamp("expiresAt").notNull(),
    paidAt: timestamp("paidAt"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("orders_order_number_unique").on(table.orderNumber),
    index("orders_user_status_idx").on(table.userId, table.status),
    index("orders_customer_status_idx").on(table.customerId, table.status),
    index("orders_guest_status_idx").on(table.guestEmailHash, table.status),
    index("orders_channel_test_status_idx").on(table.channel, table.isTest, table.status),
  ],
);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

export const orderItems = mysqlTable(
  "order_items",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    productId: int("productId").notNull(),
    productCodeSnapshot: varchar("productCodeSnapshot", { length: 80 }).notNull(),
    productNameSnapshot: varchar("productNameSnapshot", { length: 200 }).notNull(),
    fulfillmentType: mysqlEnum("fulfillmentType", ["analysis", "coaching"]).notNull(),
    priceVersion: int("priceVersion").notNull(),
    regularAmountKrw: int("regularAmountKrw").notNull().default(0),
    listAmountKrw: int("listAmountKrw").notNull(),
    discountAmountKrw: int("discountAmountKrw").notNull().default(0),
    finalAmountKrw: int("finalAmountKrw").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("order_items_order_id_idx").on(table.orderId)],
);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

export const paymentTransactions = mysqlTable(
  "payment_transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    orderId: int("orderId").notNull(),
    provider: mysqlEnum("provider", ["test", "toss_pg", "google_play", "coupon"]).notNull(),
    providerPaymentId: varchar("providerPaymentId", { length: 160 }),
    providerOrderId: varchar("providerOrderId", { length: 64 }),
    status: mysqlEnum("status", [
      "ready",
      "processing",
      "approved",
      "failed",
      "cancelled",
      "refunded",
    ])
      .notNull()
      .default("ready"),
    idempotencyKey: varchar("idempotencyKey", { length: 128 }).notNull(),
    rawPayloadEncrypted: text("rawPayloadEncrypted"),
    approvedAt: timestamp("approvedAt"),
    cancelledAt: timestamp("cancelledAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("payment_transactions_idempotency_unique").on(table.idempotencyKey),
    uniqueIndex("payment_transactions_provider_payment_unique").on(
      table.provider,
      table.providerPaymentId,
    ),
    index("payment_transactions_order_idx").on(table.orderId),
  ],
);

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = typeof paymentTransactions.$inferInsert;

export const entitlements = mysqlTable(
  "entitlements",
  {
    id: int("id").autoincrement().primaryKey(),
    customerId: int("customerId"),
    userId: int("userId"),
    orderItemId: int("orderItemId"),
    productId: int("productId").notNull(),
    status: mysqlEnum("status", ["active", "reserved", "consumed", "revoked", "expired"])
      .notNull()
      .default("active"),
    source: mysqlEnum("source", ["purchase", "free", "admin", "migration"])
      .notNull()
      .default("purchase"),
    usageLimit: int("usageLimit").notNull().default(1),
    usedCount: int("usedCount").notNull().default(0),
    validUntil: timestamp("validUntil"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("entitlements_order_item_unique").on(table.orderItemId),
    index("entitlements_user_product_idx").on(table.userId, table.productId, table.status),
    index("entitlements_customer_product_idx").on(table.customerId, table.productId, table.status),
  ],
);

export type Entitlement = typeof entitlements.$inferSelect;
export type InsertEntitlement = typeof entitlements.$inferInsert;

export const coupons = mysqlTable(
  "coupons",
  {
    id: int("id").autoincrement().primaryKey(),
    code: varchar("code", { length: 64 }).notNull(),
    discountType: mysqlEnum("discountType", ["fixed", "percent"]).notNull(),
    discountValue: int("discountValue").notNull(),
    minOrderAmountKrw: int("minOrderAmountKrw").notNull().default(0),
    startsAt: timestamp("startsAt").notNull(),
    endsAt: timestamp("endsAt"),
    maxRedemptions: int("maxRedemptions"),
    maxPerCustomer: int("maxPerCustomer"),
    status: mysqlEnum("status", ["active", "paused", "expired"]).notNull().default("active"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("coupons_code_unique").on(table.code)],
);

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;

export const couponProductRules = mysqlTable(
  "coupon_product_rules",
  {
    id: int("id").autoincrement().primaryKey(),
    couponId: int("couponId").notNull(),
    productId: int("productId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("coupon_product_rules_unique").on(table.couponId, table.productId),
    index("coupon_product_rules_product_idx").on(table.productId),
  ],
);

export const couponRedemptions = mysqlTable(
  "coupon_redemptions",
  {
    id: int("id").autoincrement().primaryKey(),
    couponId: int("couponId").notNull(),
    orderId: int("orderId").notNull(),
    customerId: int("customerId"),
    userId: int("userId"),
    state: mysqlEnum("state", ["reserved", "consumed", "released"])
      .notNull()
      .default("reserved"),
    reservedAt: timestamp("reservedAt").defaultNow().notNull(),
    consumedAt: timestamp("consumedAt"),
    releasedAt: timestamp("releasedAt"),
  },
  (table) => [
    uniqueIndex("coupon_redemptions_order_unique").on(table.orderId),
    index("coupon_redemptions_user_state_idx").on(table.userId, table.state),
    index("coupon_redemptions_coupon_state_idx").on(table.couponId, table.state),
  ],
);

export const adminAuditLogs = mysqlTable(
  "admin_audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    adminUserId: int("adminUserId"),
    action: varchar("action", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: varchar("entityId", { length: 80 }).notNull(),
    beforeJson: text("beforeJson"),
    afterJson: text("afterJson"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [index("admin_audit_logs_entity_idx").on(table.entityType, table.entityId)],
);

/** 검사 시작과 결과 도달의 메타데이터만 커머스/회원 추적용으로 보관한다. 분석 문장 자체는 변경하지 않는다. */
export const analysisRuns = mysqlTable(
  "analysis_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    customerId: int("customerId"),
    entitlementId: int("entitlementId"),
    orderId: int("orderId"),
    productId: int("productId").notNull(),
    accessMode: mysqlEnum("accessMode", ["member", "guest", "free"]).notNull(),
    status: mysqlEnum("status", ["started", "completed", "expired", "deleted"])
      .notNull()
      .default("started"),
    resultReference: varchar("resultReference", { length: 160 }),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
    expiresAt: timestamp("expiresAt"),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => [
    index("analysis_runs_user_status_idx").on(table.userId, table.status),
    index("analysis_runs_customer_status_idx").on(table.customerId, table.status),
    index("analysis_runs_entitlement_idx").on(table.entitlementId),
  ],
);

export type AnalysisRun = typeof analysisRuns.$inferSelect;

/** private 저장 PDF의 위치·보관기한·생성 상태를 별도로 추적한다. */
export const privateDocuments = mysqlTable(
  "private_documents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    customerId: int("customerId"),
    orderId: int("orderId"),
    analysisRunId: int("analysisRunId"),
    documentType: mysqlEnum("documentType", ["analysis_pdf"]).notNull(),
    storageKey: varchar("storageKey", { length: 500 }),
    status: mysqlEnum("status", ["queued", "generated", "failed", "deleted"])
      .notNull()
      .default("queued"),
    retentionExpiresAt: timestamp("retentionExpiresAt").notNull(),
    errorCode: varchar("errorCode", { length: 120 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    generatedAt: timestamp("generatedAt"),
    deletedAt: timestamp("deletedAt"),
  },
  (table) => [
    index("private_documents_user_status_idx").on(table.userId, table.status),
    index("private_documents_analysis_idx").on(table.analysisRunId),
    uniqueIndex("private_documents_analysis_type_unique").on(table.analysisRunId, table.documentType),
  ],
);

export type PrivateDocument = typeof privateDocuments.$inferSelect;

/** 결과 PDF 이메일은 outbox에 적재해 provider 응답·실패·재시도를 추적한다. */
export const emailOutbox = mysqlTable(
  "email_outbox",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    customerId: int("customerId"),
    orderId: int("orderId"),
    privateDocumentId: int("privateDocumentId"),
    purpose: mysqlEnum("purpose", ["account_link", "analysis_result_pdf"]).notNull(),
    toEmailHash: varchar("toEmailHash", { length: 128 }).notNull(),
    toEmailEncrypted: text("toEmailEncrypted").notNull(),
    status: mysqlEnum("status", ["queued", "sending", "sent", "failed", "cancelled"])
      .notNull()
      .default("queued"),
    providerMessageId: varchar("providerMessageId", { length: 200 }),
    attemptCount: int("attemptCount").notNull().default(0),
    nextAttemptAt: timestamp("nextAttemptAt").notNull(),
    lastErrorCode: varchar("lastErrorCode", { length: 160 }),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("email_outbox_status_attempt_idx").on(table.status, table.nextAttemptAt),
    index("email_outbox_user_idx").on(table.userId),
    index("email_outbox_document_idx").on(table.privateDocumentId),
    uniqueIndex("email_outbox_document_purpose_unique").on(table.privateDocumentId, table.purpose),
  ],
);

export type EmailOutboxItem = typeof emailOutbox.$inferSelect;

/** 향후 홈페이지 코칭의 전액 결제 주문을 일정·진행 상태와 같은 user_id에 연결한다. */
export const coachingBookings = mysqlTable(
  "coaching_bookings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    customerId: int("customerId").notNull(),
    orderId: int("orderId").notNull(),
    productId: int("productId").notNull(),
    status: mysqlEnum("status", [
      "pending_schedule",
      "change_requested",
      "scheduled",
      "completed",
      "cancelled",
      "no_show",
    ])
      .notNull()
      .default("pending_schedule"),
    requestedWindowStart: timestamp("requestedWindowStart"),
    requestedWindowEnd: timestamp("requestedWindowEnd"),
    sessionMode: mysqlEnum("sessionMode", ["undecided", "online", "in_person"])
      .notNull()
      .default("undecided"),
    scheduledAt: timestamp("scheduledAt"),
    scheduledEndAt: timestamp("scheduledEndAt"),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Asia/Seoul"),
    assignedAdminUserId: int("assignedAdminUserId"),
    detailsEncrypted: text("detailsEncrypted"),
    internalNoteEncrypted: text("internalNoteEncrypted"),
    cancelledAt: timestamp("cancelledAt"),
    cancelReason: varchar("cancelReason", { length: 500 }),
    completedAt: timestamp("completedAt"),
    noShowAt: timestamp("noShowAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("coaching_bookings_user_status_idx").on(table.userId, table.status),
    index("coaching_bookings_order_idx").on(table.orderId),
    index("coaching_bookings_schedule_status_idx").on(table.status, table.scheduledAt),
  ],
);

export type CoachingBooking = typeof coachingBookings.$inferSelect;

/** 예약 상태 변경은 덮어쓰기 대신 운영자·사유·전후 상태를 append-only로 남긴다. */
export const coachingBookingEvents = mysqlTable(
  "coaching_booking_events",
  {
    id: int("id").autoincrement().primaryKey(),
    bookingId: int("bookingId").notNull(),
    adminUserId: int("adminUserId"),
    eventType: varchar("eventType", { length: 80 }).notNull(),
    fromStatus: varchar("fromStatus", { length: 40 }),
    toStatus: varchar("toStatus", { length: 40 }),
    payloadEncrypted: text("payloadEncrypted"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [
    index("coaching_booking_events_booking_idx").on(table.bookingId, table.createdAt),
  ],
);

export type CoachingBookingEvent = typeof coachingBookingEvents.$inferSelect;
