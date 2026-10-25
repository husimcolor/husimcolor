import { and, eq, gt, isNull, lte, or } from "drizzle-orm";

import {
  entitlements,
  orderItems,
  orders,
  paymentTransactions,
  productPrices,
  products,
  customers,
  coachingBookings,
  coachingBookingEvents,
  emailOutbox,
} from "../../drizzle/schema";
import type { CommercePaymentOutcome, CommerceProductCode } from "../../shared/commerce";
import {
  decryptCommerceValue,
  encryptCommerceEmail,
  encryptCommerceValue,
  hashCommerceEmail,
  normalizeCommerceEmail,
} from "./crypto";
import { getDb } from "../db";
import {
  confirmTossTestPayment,
  getTossTestPayment,
  getTossTestClientConfig,
  isTossTestPaymentEnabled,
} from "./toss-test-provider";
import {
  confirmTossLivePayment,
  getTossLiveClientConfig,
  isTossLivePaymentEnabled,
} from "./toss-live-provider";
import { isExplicitTestPaymentRuntime } from "./test-runtime";
import {
  consumeCouponReservation,
  releaseCouponReservation,
  reserveCouponForOrder,
} from "./coupon-service";
import { createEntitlementStartGrant, type EntitlementStartGrant } from "./entitlement-service";
import { assertPublicPaidAnalysisCheckout } from "./release-policy";
import { linkCheckoutCustomerToAuthenticatedUser } from "./account-service";
import {
  confirmTelephoneCoachingSlot,
  ensureTelephoneCoachingPreviewSchema,
  getTelephoneCoachingDetails,
  isTelephoneCoachingProduct,
  normalizeTelephoneCoachingBookingRequest,
  releaseTelephoneCoachingSlotForOrder,
  type TelephoneCoachingBookingRequest,
  type NormalizedTelephoneCoachingBookingRequest,
  reserveTelephoneCoachingSlot,
} from "./telephone-coaching-service";
import { deliverTelephoneCoachingConfirmationOutboxItem } from "./email-outbox-service";

const ORDER_TIMEOUT_MS = 30 * 60 * 1000;

type CheckoutResponse = {
  orderNumber: string;
  productCode: CommerceProductCode;
  productName: string;
  listAmountKrw: number;
  discountAmountKrw: number;
  finalAmountKrw: number;
  expiresAt: Date;
  status: "pending" | "paid" | "failed" | "cancelled";
  startGrant: EntitlementStartGrant | null;
};

type PaymentResponse = {
  orderNumber: string;
  paymentId: string | null;
  status: "paid" | "failed" | "cancelled";
  entitlementId: number | null;
  startGrant: EntitlementStartGrant | null;
  alreadyProcessed: boolean;
  coachingEmailOutboxId?: number | null;
};

export type TossTestTerminalOutcome = "failed" | "cancelled";

/**
 * Toss redirects both buyer-initiated exits and authentication aborts to the
 * configured failUrl. These terminal states must release a Preview-only
 * coupon reservation, but must never create an entitlement.
 */
export function getTossTestTerminalOutcome(errorCode: string): TossTestTerminalOutcome {
  return errorCode === "PAY_PROCESS_CANCELED" || errorCode === "PAY_PROCESS_ABORTED"
    ? "cancelled"
    : "failed";
}

export type CoachingBookingRequest = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: string;
  requestedWindowEnd: string;
  sessionMode: "online" | "in_person" | "telephone";
  notes?: string;
  topic?: string;
  fiveElementsOptIn?: boolean;
  birthDate?: string;
  birthCalendarType?: "solar" | "lunar";
  isLeapMonth?: boolean;
  adultConfirmed?: boolean;
};

type NormalizedCoachingBookingRequest = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: Date;
  requestedWindowEnd: Date;
  sessionMode: "online" | "in_person" | "telephone";
  notes: string | null;
  topic: string | null;
  fiveElementsOptIn: boolean;
  birthDate: string | null;
  birthCalendarType: "solar" | "lunar" | null;
  isLeapMonth: boolean;
};

const PENDING_COACHING_BOOKING_VERSION = 2;

/**
 * 코칭 주문은 확정 전까지 transaction 원문 칼럼에 암호화된 예약 요청을 보관한다.
 * 승인 provider 원문은 예약이 없는 주문에만 기록해 예약 일시·방식의 복원을 보장한다.
 */
export function getApprovedPaymentRawPayload(
  pendingBookingRequestEncrypted: string | null,
  providerRawPayloadEncrypted: string | null | undefined,
): string | null {
  return pendingBookingRequestEncrypted ?? providerRawPayloadEncrypted ?? null;
}

export function normalizeCoachingBookingRequest(request: CoachingBookingRequest | undefined): NormalizedCoachingBookingRequest | null {
  if (!request) return null;
  if (request.sessionMode === "telephone") return normalizeTelephoneCoachingBookingRequest(request as TelephoneCoachingBookingRequest);
  const contactName = request.contactName.trim();
  const contactPhone = request.contactPhone.trim();
  const requestedWindowStart = new Date(request.requestedWindowStart);
  const requestedWindowEnd = new Date(request.requestedWindowEnd);
  const notes = request.notes?.trim() || null;
  if (!contactName || contactName.length > 100) throw new Error("INVALID_COACHING_CONTACT_NAME");
  if (!contactPhone || contactPhone.length > 40) throw new Error("INVALID_COACHING_CONTACT_PHONE");
  if (Number.isNaN(requestedWindowStart.getTime()) || Number.isNaN(requestedWindowEnd.getTime()) || requestedWindowEnd <= requestedWindowStart) throw new Error("INVALID_COACHING_REQUESTED_WINDOW");
  if (request.sessionMode !== "online" && request.sessionMode !== "in_person") throw new Error("INVALID_COACHING_SESSION_MODE");
  if (notes && notes.length > 2000) throw new Error("INVALID_COACHING_NOTES");
  return { contactName, contactPhone, requestedWindowStart, requestedWindowEnd, sessionMode: request.sessionMode, notes, topic: null, fiveElementsOptIn: false, birthDate: null, birthCalendarType: null, isLeapMonth: false };
}

export function encryptPendingCoachingBookingRequest(request: NormalizedCoachingBookingRequest): string {
  return encryptCommerceValue(JSON.stringify({ version: PENDING_COACHING_BOOKING_VERSION, request: {
    contactName: request.contactName, contactPhone: request.contactPhone,
    requestedWindowStart: request.requestedWindowStart.toISOString(), requestedWindowEnd: request.requestedWindowEnd.toISOString(),
    sessionMode: request.sessionMode, notes: request.notes,
    topic: request.topic, fiveElementsOptIn: request.fiveElementsOptIn, birthDate: request.birthDate,
    birthCalendarType: request.birthCalendarType, isLeapMonth: request.isLeapMonth,
    // 이 payload는 이미 성인 확인을 통과한 정규화 요청이다. 승인 시에도 이를 복원해야 전화 예약이 빈 일정으로 생성되지 않는다.
    adultConfirmed: request.sessionMode === "telephone" ? true : undefined,
  } }));
}

export function decryptPendingCoachingBookingRequest(value: string | null | undefined): NormalizedCoachingBookingRequest | null {
  if (!value) return null;
  try {
    const payload = JSON.parse(decryptCommerceValue(value)) as { version?: number; request?: CoachingBookingRequest };
    if (payload.version !== 1 && payload.version !== PENDING_COACHING_BOOKING_VERSION) return null;
    const request = payload.request;
    if (!request) return null;
    // v1 및 초기 payload에는 adultConfirmed가 없었다. 해당 요청은 주문 생성 시 이미 확인을 통과했으므로 승인 시에만 안전하게 복원한다.
    if (request.sessionMode === "telephone") {
      request.adultConfirmed = true;
      // 기존 암호문에는 양력/음력 메타데이터가 없으므로 보수적으로 양력·윤달 아님으로 읽는다.
      if (request.birthDate && !request.birthCalendarType) request.birthCalendarType = "solar";
      if (request.birthDate && request.isLeapMonth === undefined) request.isLeapMonth = false;
    }
    return normalizeCoachingBookingRequest(request);
  } catch {
    return null;
  }
}

export function getCoachingBookingPersistence(request: NormalizedCoachingBookingRequest | null) {
  if (!request) return { sessionMode: "undecided" as const, requestedWindowStart: null, requestedWindowEnd: null, detailsEncrypted: null };
  return {
    sessionMode: request.sessionMode,
    requestedWindowStart: request.requestedWindowStart,
    requestedWindowEnd: request.requestedWindowEnd,
    detailsEncrypted: encryptCommerceValue(JSON.stringify({
      contactName: request.contactName,
      contactPhone: request.contactPhone,
      notes: request.notes,
      ...(request.sessionMode === "telephone" ? getTelephoneCoachingDetails(request as NormalizedTelephoneCoachingBookingRequest) : {}),
    })),
  };
}

function newOrderNumber(): string {
  return `HC-${crypto.randomUUID().replace(/-/g, "").slice(0, 24).toUpperCase()}`;
}

function assertCheckoutEmail(value: string): string {
  const email = normalizeCommerceEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("INVALID_CHECKOUT_EMAIL");
  }
  return email;
}

function asCheckoutResponse(row: {
  orderNumber: string;
  productCode: string;
  productName: string;
  listAmountKrw: number;
  discountAmountKrw: number;
  finalAmountKrw: number;
  expiresAt: Date;
  orderStatus: "pending" | "paid" | "failed" | "cancelled";
  startGrant?: EntitlementStartGrant | null;
}): CheckoutResponse {
  return {
    orderNumber: row.orderNumber,
    productCode: row.productCode as CommerceProductCode,
    productName: row.productName,
    listAmountKrw: row.listAmountKrw,
    discountAmountKrw: row.discountAmountKrw,
    finalAmountKrw: row.finalAmountKrw,
    expiresAt: row.expiresAt,
    status: row.orderStatus,
    startGrant: row.startGrant ?? null,
  };
}

export function isTestPaymentEnabled(): boolean {
  return isExplicitTestPaymentRuntime();
}

/**
 * 테스트·라이브 Toss provider가 공통으로 쓰는 주문 서비스다. 화면의 금액을
 * 신뢰하지 않고 DB의 활성 가격 행을 스냅샷하며, entitlement는 서버 승인 성공 뒤에만 생성한다.
 */
async function createCheckoutForProvider(input: {
  productCode: CommerceProductCode;
  email: string;
  idempotencyKey: string;
  couponCode?: string;
  bookingRequest?: CoachingBookingRequest;
  channel?: "app" | "web";
  userId?: number;
  authenticatedEmail?: string | null;
}, provider: "test" | "toss_pg" | "toss_live"): Promise<CheckoutResponse> {
  assertPublicPaidAnalysisCheckout(input.productCode);
  if (provider === "test" && !isTestPaymentEnabled()) {
    throw new Error("TEST_PAYMENT_DISABLED_IN_PRODUCTION");
  }
  if (provider === "toss_pg" && !isTossTestPaymentEnabled()) {
    throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  }
  if (provider === "toss_live" && !isTossLivePaymentEnabled()) {
    throw new Error("TOSS_LIVE_PAYMENT_DISABLED");
  }
  if (!input.idempotencyKey || input.idempotencyKey.length < 16) {
    throw new Error("INVALID_CHECKOUT_IDEMPOTENCY_KEY");
  }

  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const email = assertCheckoutEmail(input.email);
  const emailHash = hashCommerceEmail(email);
  const channel = input.channel === "web" ? "web" : "app";
  /** Toss 라이브 결제만 운영 매출 원장으로 기록한다. */
  const isTestOrder = provider === "test" || provider === "toss_pg";
  const bookingRequest = normalizeCoachingBookingRequest(input.bookingRequest);
  if (isTelephoneCoachingProduct(input.productCode)) {
    await ensureTelephoneCoachingPreviewSchema();
  }
  const now = new Date();

  return (db as any).transaction(async (tx: any) => {
    const existing = await tx
      .select({
        orderNumber: orders.orderNumber,
        productCode: orderItems.productCodeSnapshot,
        productName: orderItems.productNameSnapshot,
        listAmountKrw: orderItems.listAmountKrw,
        discountAmountKrw: orderItems.discountAmountKrw,
        finalAmountKrw: orderItems.finalAmountKrw,
        expiresAt: orders.expiresAt,
        orderStatus: orders.status,
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(customers, eq(customers.id, orders.customerId))
      .where(eq(paymentTransactions.idempotencyKey, input.idempotencyKey))
      .limit(1);
    if (existing[0]) return asCheckoutResponse(existing[0]);

    const productRows = await tx
      .select()
      .from(products)
      .where(and(eq(products.code, input.productCode), eq(products.active, true)))
      .limit(1);
    const product = productRows[0];
    if (
      !product ||
      !product.requiresPayment ||
      (product.fulfillmentType !== "analysis" && product.fulfillmentType !== "coaching")
    ) {
      throw new Error("TEST_CHECKOUT_REQUIRES_AN_ACTIVE_PAID_PRODUCT");
    }

    if (bookingRequest && product.fulfillmentType !== "coaching") throw new Error("COACHING_BOOKING_REQUEST_REQUIRES_COACHING_PRODUCT");

    const priceRows = await tx
      .select()
      .from(productPrices)
      .where(
        and(
          eq(productPrices.productId, product.id),
          eq(productPrices.active, true),
          lte(productPrices.validFrom, now),
          or(isNull(productPrices.validTo), gt(productPrices.validTo, now)),
        ),
      )
      .limit(1);
    const price = priceRows[0];
    if (!price) throw new Error("PRODUCT_PRICE_NOT_AVAILABLE");

    const customerRows = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.emailHash, emailHash))
      .limit(1);
    let customerId = customerRows[0]?.id;
    if (!customerId) {
      // 동일 이메일의 첫 checkout 요청이 아주 짧은 간격으로 겹쳐도 emailHash
      // unique 충돌로 주문 생성을 실패시키지 않는다. 기존 고객의 암호화 이메일·계정
      // 연결은 절대 덮어쓰지 않고, upsert 뒤 해당 행만 다시 읽는다.
      await tx.insert(customers).values({
        userId: null,
        emailHash,
        emailEncrypted: encryptCommerceEmail(email),
        status: "active",
      }).onDuplicateKeyUpdate({ set: { emailHash } });
      const resolvedCustomerRows = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.emailHash, emailHash))
        .limit(1);
      customerId = resolvedCustomerRows[0]?.id;
      if (!customerId) throw new Error("CHECKOUT_CUSTOMER_RESOLUTION_FAILED");
    }
    const linkedUserId = await linkCheckoutCustomerToAuthenticatedUser(tx, {
      customerId,
      userId: input.userId,
      checkoutEmail: email,
      authenticatedEmail: input.authenticatedEmail,
    });

    const expiresAt = new Date(now.getTime() + ORDER_TIMEOUT_MS);
    const orderInsert = await tx.insert(orders).values({
      orderNumber: newOrderNumber(),
      customerId,
      userId: linkedUserId,
      guestEmailHash: emailHash,
      status: "pending",
      channel,
      isTest: isTestOrder,
      regularAmountKrw: price.regularAmountKrw || price.amountKrw,
      listAmountKrw: price.amountKrw,
      discountAmountKrw: 0,
      finalAmountKrw: price.amountKrw,
      expiresAt,
    });
    const orderId = Number(orderInsert[0].insertId);
    const order = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    const createdOrder = order[0];
    if (!createdOrder) throw new Error("ORDER_CREATE_FAILED");
    const coupon = input.couponCode
      ? await reserveCouponForOrder(tx, {
          couponCode: input.couponCode,
          productId: product.id,
          customerId,
          userId: linkedUserId,
          orderId,
          listAmountKrw: price.amountKrw,
        })
      : null;
    const discountAmountKrw = coupon?.discountAmountKrw ?? 0;
    const finalAmountKrw = coupon?.finalAmountKrw ?? price.amountKrw;
    if (coupon) {
      await tx
        .update(orders)
        .set({ discountAmountKrw, finalAmountKrw })
        .where(eq(orders.id, orderId));
    }

    if (isTelephoneCoachingProduct(product.code)) {
      if (!bookingRequest || bookingRequest.sessionMode !== "telephone") {
        throw new Error("TELEPHONE_COACHING_BOOKING_REQUIRED");
      }
      await reserveTelephoneCoachingSlot(tx, {
        orderId,
        productId: product.id,
        request: bookingRequest as NormalizedTelephoneCoachingBookingRequest,
        expiresAt,
        now,
      });
    }

    await tx.insert(orderItems).values({
      orderId,
      productId: product.id,
      productCodeSnapshot: product.code,
      productNameSnapshot: product.name,
      fulfillmentType: product.fulfillmentType,
      priceVersion: price.version,
      regularAmountKrw: price.regularAmountKrw || price.amountKrw,
      listAmountKrw: price.amountKrw,
      discountAmountKrw,
      finalAmountKrw,
    });
    const itemRows = await tx
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId))
      .limit(1);
    const orderItemId = itemRows[0]?.id;
    if (!orderItemId) throw new Error("ORDER_ITEM_CREATE_FAILED");

    if (finalAmountKrw === 0) {
      const paidAt = new Date();
      await tx.update(orders).set({ status: "paid", paidAt }).where(eq(orders.id, orderId));
      await tx.insert(paymentTransactions).values({
        orderId,
        provider: "coupon",
        providerOrderId: createdOrder.orderNumber,
        status: "approved",
        idempotencyKey: input.idempotencyKey,
        approvedAt: paidAt,
      });
      const entitlementInsert = await tx.insert(entitlements).values({
        customerId,
        userId: linkedUserId,
        orderItemId,
        productId: product.id,
        status: "active",
        source: "purchase",
        usageLimit: 1,
        usedCount: 0,
      });
      await consumeCouponReservation(tx, orderId);
      const entitlementId = Number(entitlementInsert[0].insertId);
      if (product.fulfillmentType === "coaching") {
        const bookingPersistence = getCoachingBookingPersistence(bookingRequest);
        const bookingInsert = await tx.insert(coachingBookings).values({
          userId: linkedUserId,
          customerId,
          orderId,
          productId: product.id,
          status: isTelephoneCoachingProduct(product.code) ? "scheduled" : "pending_schedule",
          ...(isTelephoneCoachingProduct(product.code)
            ? { scheduledAt: bookingPersistence.requestedWindowStart, scheduledEndAt: bookingPersistence.requestedWindowEnd }
            : {}),
          ...bookingPersistence,
        });
        if (isTelephoneCoachingProduct(product.code)) {
          await confirmTelephoneCoachingSlot(tx, { orderId, bookingId: Number(bookingInsert[0].insertId), now: paidAt });
        }
        await tx.insert(coachingBookingEvents).values({
          bookingId: Number(bookingInsert[0].insertId),
          eventType: isTelephoneCoachingProduct(product.code) ? "telephone_booking_confirmed_after_payment" : "booking_created",
          toStatus: isTelephoneCoachingProduct(product.code) ? "scheduled" : "pending_schedule",
        });
      }
      const startGrant = product.fulfillmentType === "analysis"
        ? createEntitlementStartGrant({
            entitlementId,
            customerId,
            productCode: product.code as CommerceProductCode,
          })
        : null;
      return asCheckoutResponse({
        orderNumber: createdOrder.orderNumber,
        productCode: product.code,
        productName: product.name,
        listAmountKrw: price.amountKrw,
        discountAmountKrw,
        finalAmountKrw,
        expiresAt,
        orderStatus: "paid",
        startGrant,
      });
    }
    await tx.insert(paymentTransactions).values({
      orderId,
      provider,
      providerOrderId: createdOrder.orderNumber,
      status: "ready",
      idempotencyKey: input.idempotencyKey,
      ...(bookingRequest ? { rawPayloadEncrypted: encryptPendingCoachingBookingRequest(bookingRequest) } : {}),
    });

    return asCheckoutResponse({
      orderNumber: createdOrder.orderNumber,
      productCode: product.code,
      productName: product.name,
      listAmountKrw: price.amountKrw,
      discountAmountKrw,
      finalAmountKrw,
      expiresAt,
      orderStatus: "pending",
      startGrant: null,
    });
  });
}

export async function createTestCheckout(input: {
  productCode: CommerceProductCode;
  email: string;
  idempotencyKey: string;
  couponCode?: string;
  bookingRequest?: CoachingBookingRequest;
  channel?: "app" | "web";
  userId?: number;
  authenticatedEmail?: string | null;
}): Promise<CheckoutResponse> {
  return createCheckoutForProvider(input, "test");
}

export async function createTossTestCheckout(input: {
  productCode: CommerceProductCode;
  email: string;
  idempotencyKey: string;
  couponCode?: string;
  bookingRequest?: CoachingBookingRequest;
  channel?: "app" | "web";
  userId?: number;
  authenticatedEmail?: string | null;
}): Promise<CheckoutResponse & { tossClientKey: string }> {
  const checkout = await createCheckoutForProvider(input, "toss_pg");
  return { ...checkout, tossClientKey: getTossTestClientConfig().clientKey };
}

/** 라이브 주문은 테스트 provider와 별도 원장 값(toss_live)으로 생성한다. */
export async function createTossLiveCheckout(input: {
  productCode: CommerceProductCode;
  email: string;
  idempotencyKey: string;
  couponCode?: string;
  bookingRequest?: CoachingBookingRequest;
  channel?: "app" | "web";
  userId?: number;
  authenticatedEmail?: string | null;
}): Promise<CheckoutResponse & { tossClientKey: string }> {
  const checkout = await createCheckoutForProvider(input, "toss_live");
  return { ...checkout, tossClientKey: getTossLiveClientConfig().clientKey };
}

async function completePaymentForProvider(input: {
  orderNumber: string;
  providerPaymentId: string;
  outcome: CommercePaymentOutcome;
  amountKrw?: number;
  provider: "test" | "toss_pg" | "toss_live";
  rawPayloadEncrypted?: string;
}): Promise<PaymentResponse> {
  if (input.provider === "test" && !isTestPaymentEnabled()) {
    throw new Error("TEST_PAYMENT_DISABLED_IN_PRODUCTION");
  }
  if (input.provider === "toss_pg" && !isTossTestPaymentEnabled()) {
    throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  }
  if (input.provider === "toss_live" && !isTossLivePaymentEnabled()) {
    throw new Error("TOSS_LIVE_PAYMENT_DISABLED");
  }
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const response: PaymentResponse = await (db as any).transaction(async (tx: any) => {
    const rows = await tx
      .select({
        transactionId: paymentTransactions.id,
        transactionStatus: paymentTransactions.status,
        savedPaymentId: paymentTransactions.providerPaymentId,
        pendingBookingRequestEncrypted: paymentTransactions.rawPayloadEncrypted,
        orderId: orders.id,
        orderStatus: orders.status,
        orderNumber: orders.orderNumber,
        expiresAt: orders.expiresAt,
        finalAmountKrw: orders.finalAmountKrw,
        customerId: orders.customerId,
        userId: orders.userId,
        customerEmailHash: customers.emailHash,
        customerEmailEncrypted: customers.emailEncrypted,
        orderItemId: orderItems.id,
        productId: orderItems.productId,
        productCode: orderItems.productCodeSnapshot,
        fulfillmentType: orderItems.fulfillmentType,
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(and(eq(paymentTransactions.provider, input.provider), eq(orders.orderNumber, input.orderNumber)))
      .limit(1);
    const record = rows[0];
    if (!record) throw new Error("TOSS_ORDER_NOT_FOUND");
    // Toss does not include the amount in every failUrl redirect. Keep the
    // strict amount comparison for an approval, while still allowing a
    // terminal failure/cancellation to release an otherwise reserved coupon.
    if (input.outcome === "success" && record.finalAmountKrw !== input.amountKrw) {
      throw new Error("ORDER_AMOUNT_MISMATCH");
    }

    const existingEntitlements = await tx
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(eq(entitlements.orderItemId, record.orderItemId))
      .limit(1);

    if (record.transactionStatus === "approved") {
      if (record.savedPaymentId !== input.providerPaymentId) {
        throw new Error("TEST_PAYMENT_ID_CONFLICT");
      }
      return {
        orderNumber: record.orderNumber,
        paymentId: record.savedPaymentId,
        status: "paid",
        entitlementId: existingEntitlements[0]?.id ?? null,
        startGrant: null,
        alreadyProcessed: true,
      };
    }
    if (record.transactionStatus === "failed" || record.transactionStatus === "cancelled") {
      if (record.savedPaymentId !== input.providerPaymentId) {
        throw new Error("TEST_PAYMENT_ID_CONFLICT");
      }
      return {
        orderNumber: record.orderNumber,
        paymentId: record.savedPaymentId,
        status: record.transactionStatus,
        entitlementId: null,
        startGrant: null,
        alreadyProcessed: true,
      };
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      await tx
        .update(orders)
        .set({ status: "expired" })
        .where(eq(orders.id, record.orderId));
      await releaseCouponReservation(tx, record.orderId);
      if (isTelephoneCoachingProduct(record.productCode)) {
        await releaseTelephoneCoachingSlotForOrder(tx, record.orderId);
      }
      throw new Error("TOSS_ORDER_EXPIRED");
    }
    if (record.transactionStatus !== "ready") throw new Error("TOSS_PAYMENT_PROCESSING");

    // 동일 결제 승인 콜백이 동시에 도착해도 ready 상태의 한 행만 선점할 수 있다.
    const claimed = await tx
      .update(paymentTransactions)
      .set({ status: "processing" })
      .where(and(eq(paymentTransactions.id, record.transactionId), eq(paymentTransactions.status, "ready")));
    if (Number(claimed[0]?.affectedRows ?? 0) !== 1) {
      throw new Error("TOSS_PAYMENT_PROCESSING");
    }

    const now = new Date();
    if (input.outcome === "success") {
      await tx
        .update(paymentTransactions)
        .set({
          status: "approved",
          providerPaymentId: input.providerPaymentId,
          // 코칭 승인 시 이 칼럼에는 결제 전 암호화한 예약 요청이 들어 있다.
          // 승인 원문으로 덮어쓰면 같은 transaction 안의 예약 확정이 일시·방식을
          // 복원하지 못하므로, 예약 요청이 있으면 끝까지 유지한다.
          rawPayloadEncrypted: getApprovedPaymentRawPayload(
            record.pendingBookingRequestEncrypted,
            input.rawPayloadEncrypted,
          ),
          approvedAt: now,
        })
        .where(eq(paymentTransactions.id, record.transactionId));
      await tx
        .update(orders)
        .set({ status: "paid", paidAt: now })
        .where(eq(orders.id, record.orderId));
      await consumeCouponReservation(tx, record.orderId);
      const entitlementInsert = await tx.insert(entitlements).values({
        orderItemId: record.orderItemId,
        productId: record.productId,
        customerId: record.customerId,
        userId: record.userId,
        status: "active",
        source: "purchase",
        usageLimit: 1,
        usedCount: 0,
      });
      const entitlementId = Number(entitlementInsert[0].insertId);
      const itemProductRows = await tx
        .select({ code: products.code })
        .from(products)
        .where(eq(products.id, record.productId))
        .limit(1);
      const productCode = itemProductRows[0]?.code as CommerceProductCode | undefined;
      if (!productCode) throw new Error("ENTITLEMENT_PRODUCT_NOT_FOUND");
      let coachingEmailOutboxId: number | null = null;
      if (record.fulfillmentType === "coaching") {
        const bookingPersistence = getCoachingBookingPersistence(decryptPendingCoachingBookingRequest(record.pendingBookingRequestEncrypted));
        if (isTelephoneCoachingProduct(record.productCode) && (
          bookingPersistence.sessionMode !== "telephone"
          || !bookingPersistence.requestedWindowStart
          || !bookingPersistence.requestedWindowEnd
        )) {
          throw new Error("TELEPHONE_COACHING_PENDING_BOOKING_INVALID");
        }
        const bookingInsert = await tx.insert(coachingBookings).values({
          userId: record.userId,
          customerId: record.customerId,
          orderId: record.orderId,
          productId: record.productId,
          status: isTelephoneCoachingProduct(record.productCode) ? "scheduled" : "pending_schedule",
          ...(isTelephoneCoachingProduct(record.productCode)
            ? { scheduledAt: bookingPersistence.requestedWindowStart, scheduledEndAt: bookingPersistence.requestedWindowEnd }
            : {}),
          ...bookingPersistence,
        });
        if (isTelephoneCoachingProduct(record.productCode)) {
          await confirmTelephoneCoachingSlot(tx, { orderId: record.orderId, bookingId: Number(bookingInsert[0].insertId), now });
          const emailOutboxInsert = await tx.insert(emailOutbox).values({
            userId: record.userId,
            customerId: record.customerId,
            orderId: record.orderId,
            purpose: "coaching_booking_confirmation",
            toEmailHash: record.customerEmailHash,
            toEmailEncrypted: record.customerEmailEncrypted,
            status: "queued",
            nextAttemptAt: now,
          });
          coachingEmailOutboxId = Number(emailOutboxInsert[0].insertId);
        }
        await tx.insert(coachingBookingEvents).values({
          bookingId: Number(bookingInsert[0].insertId),
          eventType: isTelephoneCoachingProduct(record.productCode) ? "telephone_booking_confirmed_after_payment" : "booking_created",
          toStatus: isTelephoneCoachingProduct(record.productCode) ? "scheduled" : "pending_schedule",
        });
      }
      return {
        orderNumber: record.orderNumber,
        paymentId: input.providerPaymentId,
        status: "paid",
        entitlementId,
        startGrant: record.fulfillmentType === "analysis"
          ? createEntitlementStartGrant({ entitlementId, customerId: record.customerId, productCode })
          : null,
        alreadyProcessed: false,
        coachingEmailOutboxId,
      };
    }

    const status = input.outcome === "failed" ? "failed" : "cancelled";
    await tx
      .update(paymentTransactions)
      .set({
        status,
        providerPaymentId: input.providerPaymentId,
        rawPayloadEncrypted: input.rawPayloadEncrypted ?? null,
        cancelledAt: now,
      })
      .where(eq(paymentTransactions.id, record.transactionId));
    await tx
      .update(orders)
      .set({ status, cancelledAt: now })
      .where(eq(orders.id, record.orderId));
    await releaseCouponReservation(tx, record.orderId);
    if (isTelephoneCoachingProduct(record.productCode)) {
      await releaseTelephoneCoachingSlotForOrder(tx, record.orderId, now);
    }
    return {
      orderNumber: record.orderNumber,
      paymentId: input.providerPaymentId,
      status,
      entitlementId: null,
      startGrant: null,
      alreadyProcessed: false,
    };
  });
  if (response.coachingEmailOutboxId) {
    // 예약 확정은 메일과 독립적으로 완료된다. 메일 전송 실패는 Outbox 재시도로 남긴다.
    await deliverTelephoneCoachingConfirmationOutboxItem(response.coachingEmailOutboxId);
  }
  return response;
}

export async function completeTestPayment(input: {
  orderNumber: string;
  providerPaymentId: string;
  outcome: CommercePaymentOutcome;
  amountKrw: number;
}): Promise<PaymentResponse> {
  return completePaymentForProvider({ ...input, provider: "test" });
}

/**
 * A browser can revisit the success URL after the first server-side approval.
 * In that case, do not send the same paymentKey to Toss a second time: read the
 * locally final transaction first and return the original entitlement instead.
 */
async function getKnownTossSuccess(provider: "toss_pg" | "toss_live", input: {
  orderNumber: string;
  paymentKey: string;
  amountKrw: number;
}): Promise<PaymentResponse | null> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const rows = await (db as any)
    .select({
      transactionStatus: paymentTransactions.status,
      savedPaymentId: paymentTransactions.providerPaymentId,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      finalAmountKrw: orders.finalAmountKrw,
      orderItemId: orderItems.id,
    })
    .from(paymentTransactions)
    .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(eq(paymentTransactions.provider, provider), eq(orders.orderNumber, input.orderNumber)))
    .limit(1);
  const record = rows[0];
  if (!record) return null;
  if (record.finalAmountKrw !== input.amountKrw) throw new Error("ORDER_AMOUNT_MISMATCH");

  if (record.transactionStatus === "approved") {
    if (record.savedPaymentId !== input.paymentKey) throw new Error("TOSS_PAYMENT_ID_CONFLICT");
    const entitlementRows = await (db as any)
      .select({ id: entitlements.id })
      .from(entitlements)
      .where(eq(entitlements.orderItemId, record.orderItemId))
      .limit(1);
    return {
      orderNumber: record.orderNumber,
      paymentId: record.savedPaymentId,
      status: "paid",
      entitlementId: entitlementRows[0]?.id ?? null,
      startGrant: null,
      alreadyProcessed: true,
    };
  }
  if (record.transactionStatus === "failed" || record.transactionStatus === "cancelled") {
    throw new Error("TOSS_ORDER_ALREADY_TERMINAL");
  }
  return null;
}

/** 토스 승인 응답과 DB 주문 스냅샷을 모두 대조한 뒤에만 구매권한을 부여한다. */
export async function completeTossTestPayment(input: {
  orderNumber: string;
  paymentKey: string;
  amountKrw: number;
}): Promise<PaymentResponse> {
  if (!isTossTestPaymentEnabled()) throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  const known = await getKnownTossSuccess("toss_pg", input);
  if (known) return known;
  const confirmationInput = {
    paymentKey: input.paymentKey,
    orderNumber: input.orderNumber,
    amountKrw: input.amountKrw,
  };
  let approved: Awaited<ReturnType<typeof confirmTossTestPayment>>;
  try {
    approved = await confirmTossTestPayment(confirmationInput);
  } catch (error) {
    // Toss can reject a second confirm after it has already approved the card.
    // A prior DB transaction failure must be recoverable, but only after a
    // strict server-side readback proves this exact payment is DONE.
    if (!(error instanceof Error) || !/^TOSS_TEST_CONFIRM_FAILED_(400|409)$/.test(error.message)) {
      throw error;
    }
    approved = await getTossTestPayment(confirmationInput);
  }
  return completePaymentForProvider({
    orderNumber: approved.orderNumber,
    providerPaymentId: approved.paymentKey,
    outcome: "success",
    amountKrw: approved.amountKrw,
    provider: "toss_pg",
    rawPayloadEncrypted: encryptCommerceValue(approved.rawPayload),
  });
}

/**
 * 라이브 결제도 DB 주문 스냅샷과 Toss 승인 응답을 모두 대조한다. provider가
 * toss_live이므로 테스트 결제 주문·이용권·매출 집계와 섞이지 않는다.
 */
export async function completeTossLivePayment(input: {
  orderNumber: string;
  paymentKey: string;
  amountKrw: number;
}): Promise<PaymentResponse> {
  if (!isTossLivePaymentEnabled()) throw new Error("TOSS_LIVE_PAYMENT_DISABLED");
  const known = await getKnownTossSuccess("toss_live", input);
  if (known) return known;
  const approved = await confirmTossLivePayment({
    paymentKey: input.paymentKey,
    orderNumber: input.orderNumber,
    amountKrw: input.amountKrw,
  });
  return completePaymentForProvider({
    orderNumber: approved.orderNumber,
    providerPaymentId: approved.paymentKey,
    outcome: "success",
    amountKrw: approved.amountKrw,
    provider: "toss_live",
    rawPayloadEncrypted: encryptCommerceValue(approved.rawPayload),
  });
}

/**
 * Completes only a non-approved Toss test redirect. This is intentionally
 * limited by the existing Preview/test runtime guard in completePaymentForProvider.
 * No Toss approval API is called and no entitlement can be issued here.
 */
export async function completeTossTestPaymentFailure(input: {
  orderNumber: string;
  errorCode: string;
  errorMessage?: string;
}): Promise<PaymentResponse> {
  const outcome = getTossTestTerminalOutcome(input.errorCode);
  const providerPaymentId = `toss-test-${outcome}-${input.orderNumber}`.slice(0, 160);
  return completePaymentForProvider({
    orderNumber: input.orderNumber,
    providerPaymentId,
    outcome,
    provider: "toss_pg",
    rawPayloadEncrypted: encryptCommerceValue(JSON.stringify({
      redirect: "failUrl",
      errorCode: input.errorCode,
      errorMessage: input.errorMessage ?? null,
    })),
  });
}

/** 승인되지 않은 라이브 failUrl은 주문을 terminal 처리하고 쿠폰 예약만 해제한다. */
export async function completeTossLivePaymentFailure(input: {
  orderNumber: string;
  errorCode: string;
  errorMessage?: string;
}): Promise<PaymentResponse> {
  const outcome = getTossTestTerminalOutcome(input.errorCode);
  const providerPaymentId = `toss-live-${outcome}-${input.orderNumber}`.slice(0, 160);
  return completePaymentForProvider({
    orderNumber: input.orderNumber,
    providerPaymentId,
    outcome,
    provider: "toss_live",
    rawPayloadEncrypted: encryptCommerceValue(JSON.stringify({
      redirect: "failUrl",
      errorCode: input.errorCode,
      errorMessage: input.errorMessage ?? null,
    })),
  });
}
