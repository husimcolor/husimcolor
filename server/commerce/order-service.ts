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
} from "../../drizzle/schema";
import type { CommercePaymentOutcome, CommerceProductCode } from "../../shared/commerce";
import {
  encryptCommerceEmail,
  encryptCommerceValue,
  hashCommerceEmail,
  normalizeCommerceEmail,
} from "./crypto";
import { getDb } from "../db";
import {
  confirmTossTestPayment,
  getTossTestClientConfig,
  isTossTestPaymentEnabled,
} from "./toss-test-provider";
import {
  consumeCouponReservation,
  releaseCouponReservation,
  reserveCouponForOrder,
} from "./coupon-service";
import { createEntitlementStartGrant, type EntitlementStartGrant } from "./entitlement-service";
import { assertPublicPaidAnalysisCheckout } from "./release-policy";
import { linkCheckoutCustomerToAuthenticatedUser } from "./account-service";

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
};

export type CoachingBookingRequestInput = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: string;
  requestedWindowEnd: string;
  sessionMode: "online" | "in_person";
  notes?: string;
};

type NormalizedCoachingBookingRequest = {
  contactName: string;
  contactPhone: string;
  requestedWindowStart: Date;
  requestedWindowEnd: Date;
  sessionMode: "online" | "in_person";
  notes: string | null;
};

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

/**
 * 예약 후 결제용 입력값을 서버에서 정규화한다. 예약 정보는 결제 전에
 * coaching_bookings에 기록되지만, 결제 성공 전에는 확정 상태가 될 수 없다.
 */
export function normalizeCoachingBookingRequest(
  input: CoachingBookingRequestInput | undefined,
): NormalizedCoachingBookingRequest | null {
  if (!input) return null;
  const contactName = input.contactName.trim();
  const contactPhone = input.contactPhone.replace(/[^0-9+\- ]/g, "").trim();
  const requestedWindowStart = new Date(input.requestedWindowStart);
  const requestedWindowEnd = new Date(input.requestedWindowEnd);
  const notes = input.notes?.trim() || null;

  if (!contactName || contactName.length > 100) throw new Error("COACHING_CONTACT_NAME_INVALID");
  if (contactPhone.length < 8 || contactPhone.length > 40) throw new Error("COACHING_CONTACT_PHONE_INVALID");
  if (Number.isNaN(requestedWindowStart.getTime()) || Number.isNaN(requestedWindowEnd.getTime())) {
    throw new Error("COACHING_REQUESTED_TIME_INVALID");
  }
  if (requestedWindowEnd.getTime() <= requestedWindowStart.getTime()) {
    throw new Error("COACHING_REQUESTED_TIME_RANGE_INVALID");
  }
  if (requestedWindowEnd.getTime() - requestedWindowStart.getTime() > 8 * 60 * 60 * 1000) {
    throw new Error("COACHING_REQUESTED_TIME_RANGE_TOO_LONG");
  }
  if (notes && notes.length > 2000) throw new Error("COACHING_NOTES_TOO_LONG");

  return {
    contactName,
    contactPhone,
    requestedWindowStart,
    requestedWindowEnd,
    sessionMode: input.sessionMode,
    notes,
  };
}

async function createPendingPaymentBooking(
  tx: any,
  input: {
    userId?: number | null;
    customerId: number;
    orderId: number;
    productId: number;
    request: NormalizedCoachingBookingRequest;
  },
): Promise<number> {
  const inserted = await tx.insert(coachingBookings).values({
    userId: input.userId,
    customerId: input.customerId,
    orderId: input.orderId,
    productId: input.productId,
    // 기존 공통 상태값을 그대로 사용한다. 연결된 주문이 pending인 동안은
    // 운영자가 확정하지 않으며, 승인 성공에서만 scheduled로 전이한다.
    status: "pending_schedule",
    requestedWindowStart: input.request.requestedWindowStart,
    requestedWindowEnd: input.request.requestedWindowEnd,
    sessionMode: input.request.sessionMode,
    detailsEncrypted: encryptCommerceValue(JSON.stringify({
      contactName: input.request.contactName,
      contactPhone: input.request.contactPhone,
      notes: input.request.notes,
    })),
  });
  const bookingId = Number(inserted[0].insertId);
  await tx.insert(coachingBookingEvents).values({
    bookingId,
    eventType: "booking_request_created_pending_payment",
    toStatus: "pending_schedule",
  });
  return bookingId;
}

async function confirmPaidCoachingBooking(tx: any, orderId: number, now: Date): Promise<void> {
  const rows = await tx
    .select()
    .from(coachingBookings)
    .where(eq(coachingBookings.orderId, orderId))
    .limit(1);
  const booking = rows[0];
  if (!booking || booking.status !== "pending_schedule") return;

  await tx
    .update(coachingBookings)
    .set({
      status: "scheduled",
      scheduledAt: booking.requestedWindowStart,
      scheduledEndAt: booking.requestedWindowEnd,
    })
    .where(eq(coachingBookings.id, booking.id));
  await tx.insert(coachingBookingEvents).values({
    bookingId: booking.id,
    eventType: "payment_approved_booking_confirmed",
    fromStatus: "pending_schedule",
    toStatus: "scheduled",
    payloadEncrypted: encryptCommerceValue(JSON.stringify({ paidAt: now.toISOString() })),
  });
}

async function cancelPendingPaymentBooking(
  tx: any,
  input: { orderId: number; reason: "payment_failed" | "payment_cancelled" | "payment_expired"; now: Date },
): Promise<void> {
  const rows = await tx
    .select()
    .from(coachingBookings)
    .where(eq(coachingBookings.orderId, input.orderId))
    .limit(1);
  const booking = rows[0];
  if (!booking || booking.status !== "pending_schedule") return;

  await tx
    .update(coachingBookings)
    .set({ status: "cancelled", cancelledAt: input.now, cancelReason: input.reason })
    .where(eq(coachingBookings.id, booking.id));
  await tx.insert(coachingBookingEvents).values({
    bookingId: booking.id,
    eventType: input.reason,
    fromStatus: "pending_schedule",
    toStatus: "cancelled",
  });
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
  return process.env.NODE_ENV !== "production" && process.env.COMMERCE_TEST_MODE !== "false";
}

/**
 * 실결제 provider가 아닌 테스트 전용 주문 서비스입니다.
 * 화면의 금액을 신뢰하지 않고 DB의 활성 가격 행을 스냅샷하며, entitlement는
 * 테스트 승인 성공을 서버에서 처리한 경우에만 생성합니다.
 */
async function createCheckoutForProvider(input: {
  productCode: CommerceProductCode;
  email: string;
  idempotencyKey: string;
  couponCode?: string;
  bookingRequest?: CoachingBookingRequestInput;
  userId?: number;
  authenticatedEmail?: string | null;
}, provider: "test" | "toss_pg"): Promise<CheckoutResponse> {
  assertPublicPaidAnalysisCheckout(input.productCode);
  if (provider === "test" && !isTestPaymentEnabled()) {
    throw new Error("TEST_PAYMENT_DISABLED_IN_PRODUCTION");
  }
  if (provider === "toss_pg" && !isTossTestPaymentEnabled()) {
    throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  }
  if (!input.idempotencyKey || input.idempotencyKey.length < 16) {
    throw new Error("INVALID_CHECKOUT_IDEMPOTENCY_KEY");
  }

  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const email = assertCheckoutEmail(input.email);
  const emailHash = hashCommerceEmail(email);
  const bookingRequest = normalizeCoachingBookingRequest(input.bookingRequest);
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
    if (bookingRequest && product.fulfillmentType !== "coaching") {
      throw new Error("COACHING_BOOKING_REQUIRES_COACHING_PRODUCT");
    }

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
      const customerInsert = await tx.insert(customers).values({
        emailHash,
        emailEncrypted: encryptCommerceEmail(email),
        status: "active",
      });
      customerId = Number(customerInsert[0].insertId);
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

    if (bookingRequest) {
      await createPendingPaymentBooking(tx, {
        userId: linkedUserId,
        customerId,
        orderId,
        productId: product.id,
        request: bookingRequest,
      });
    }

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
      if (product.fulfillmentType === "coaching") await confirmPaidCoachingBooking(tx, orderId, paidAt);
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
  bookingRequest?: CoachingBookingRequestInput;
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
  bookingRequest?: CoachingBookingRequestInput;
  userId?: number;
  authenticatedEmail?: string | null;
}): Promise<CheckoutResponse & { tossClientKey: string }> {
  const checkout = await createCheckoutForProvider(input, "toss_pg");
  return { ...checkout, tossClientKey: getTossTestClientConfig().clientKey };
}

async function completePaymentForProvider(input: {
  orderNumber: string;
  providerPaymentId: string;
  outcome: CommercePaymentOutcome;
  amountKrw: number;
  provider: "test" | "toss_pg";
  rawPayloadEncrypted?: string;
}): Promise<PaymentResponse> {
  if (input.provider === "test" && !isTestPaymentEnabled()) {
    throw new Error("TEST_PAYMENT_DISABLED_IN_PRODUCTION");
  }
  if (input.provider === "toss_pg" && !isTossTestPaymentEnabled()) {
    throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  }
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const rows = await tx
      .select({
        transactionId: paymentTransactions.id,
        transactionStatus: paymentTransactions.status,
        savedPaymentId: paymentTransactions.providerPaymentId,
        orderId: orders.id,
        orderStatus: orders.status,
        orderNumber: orders.orderNumber,
        expiresAt: orders.expiresAt,
        finalAmountKrw: orders.finalAmountKrw,
        customerId: orders.customerId,
        userId: orders.userId,
        orderItemId: orderItems.id,
        productId: orderItems.productId,
        fulfillmentType: orderItems.fulfillmentType,
      })
      .from(paymentTransactions)
      .innerJoin(orders, eq(paymentTransactions.orderId, orders.id))
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(paymentTransactions.provider, input.provider), eq(orders.orderNumber, input.orderNumber)))
      .limit(1);
    const record = rows[0];
    if (!record) throw new Error("TEST_ORDER_NOT_FOUND");
    if (record.finalAmountKrw !== input.amountKrw) throw new Error("ORDER_AMOUNT_MISMATCH");

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
      await cancelPendingPaymentBooking(tx, {
        orderId: record.orderId,
        reason: "payment_expired",
        now: new Date(),
      });
      throw new Error("TEST_ORDER_EXPIRED");
    }
    if (record.transactionStatus !== "ready") throw new Error("TEST_PAYMENT_PROCESSING");

    // 동일 결제 승인 콜백이 동시에 도착해도 ready 상태의 한 행만 선점할 수 있다.
    const claimed = await tx
      .update(paymentTransactions)
      .set({ status: "processing" })
      .where(and(eq(paymentTransactions.id, record.transactionId), eq(paymentTransactions.status, "ready")));
    if (Number(claimed[0]?.affectedRows ?? 0) !== 1) {
      throw new Error("TEST_PAYMENT_PROCESSING");
    }

    const now = new Date();
    if (input.outcome === "success") {
      await tx
        .update(paymentTransactions)
        .set({
          status: "approved",
          providerPaymentId: input.providerPaymentId,
          ...(input.rawPayloadEncrypted ? { rawPayloadEncrypted: input.rawPayloadEncrypted } : {}),
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
      if (record.fulfillmentType === "coaching") await confirmPaidCoachingBooking(tx, record.orderId, now);
      return {
        orderNumber: record.orderNumber,
        paymentId: input.providerPaymentId,
        status: "paid",
        entitlementId,
        startGrant: record.fulfillmentType === "analysis"
          ? createEntitlementStartGrant({ entitlementId, customerId: record.customerId, productCode })
          : null,
        alreadyProcessed: false,
      };
    }

    const status = input.outcome === "failed" ? "failed" : "cancelled";
    await tx
      .update(paymentTransactions)
      .set({
        status,
        providerPaymentId: input.providerPaymentId,
        ...(input.rawPayloadEncrypted ? { rawPayloadEncrypted: input.rawPayloadEncrypted } : {}),
        cancelledAt: now,
      })
      .where(eq(paymentTransactions.id, record.transactionId));
    await tx
      .update(orders)
      .set({ status, cancelledAt: now })
      .where(eq(orders.id, record.orderId));
    await releaseCouponReservation(tx, record.orderId);
    await cancelPendingPaymentBooking(tx, {
      orderId: record.orderId,
      reason: input.outcome === "failed" ? "payment_failed" : "payment_cancelled",
      now,
    });
    return {
      orderNumber: record.orderNumber,
      paymentId: input.providerPaymentId,
      status,
      entitlementId: null,
      startGrant: null,
      alreadyProcessed: false,
    };
  });
}

export async function completeTestPayment(input: {
  orderNumber: string;
  providerPaymentId: string;
  outcome: CommercePaymentOutcome;
  amountKrw: number;
}): Promise<PaymentResponse> {
  return completePaymentForProvider({ ...input, provider: "test" });
}

/** 토스 승인 응답과 DB 주문 스냅샷을 모두 대조한 뒤에만 구매권한을 부여한다. */
export async function completeTossTestPayment(input: {
  orderNumber: string;
  paymentKey: string;
  amountKrw: number;
}): Promise<PaymentResponse> {
  const approved = await confirmTossTestPayment({
    paymentKey: input.paymentKey,
    orderNumber: input.orderNumber,
    amountKrw: input.amountKrw,
  });
  return completePaymentForProvider({
    orderNumber: approved.orderNumber,
    providerPaymentId: approved.paymentKey,
    outcome: "success",
    amountKrw: approved.amountKrw,
    provider: "toss_pg",
    rawPayloadEncrypted: encryptCommerceValue(approved.rawPayload),
  });
}
