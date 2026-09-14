import { count, desc, eq, max } from "drizzle-orm";

import {
  adminAuditLogs,
  analysisRuns,
  coachingBookings,
  customers,
  emailOutbox,
  entitlements,
  orderItems,
  orders,
  paymentRecords,
  paymentTransactions,
  privateDocuments,
  reviews,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { decryptCommerceEmail } from "./crypto";

function asCount(value: unknown): number {
  return Number(value ?? 0);
}

export function maskCommerceEmailForAdmin(encryptedEmail: string | null): string {
  if (!encryptedEmail) return "—";
  try {
    const email = decryptCommerceEmail(encryptedEmail);
    const [local, domain] = email.split("@");
    if (!local || !domain) return "보호된 이메일";
    const visible = local.slice(0, Math.min(2, local.length));
    return `${visible}${"•".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
  } catch {
    return "보호된 이메일";
  }
}

async function getCount(table: any, where?: any): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const query = db.select({ value: count() }).from(table);
  const rows = where ? await query.where(where) : await query;
  return asCount(rows[0]?.value);
}

export async function getAdminOperationsDashboard() {
  const [paidOrders, pendingOrders, activeEntitlements, startedAnalyses, failedDocuments, failedEmails, pendingBookings, legacyPending, totalCustomers] = await Promise.all([
    getCount(orders, eq(orders.status, "paid")),
    getCount(orders, eq(orders.status, "pending")),
    getCount(entitlements, eq(entitlements.status, "active")),
    getCount(analysisRuns, eq(analysisRuns.status, "started")),
    getCount(privateDocuments, eq(privateDocuments.status, "failed")),
    getCount(emailOutbox, eq(emailOutbox.status, "failed")),
    getCount(coachingBookings, eq(coachingBookings.status, "pending_schedule")),
    getCount(paymentRecords, eq(paymentRecords.status, "pending")),
    getCount(customers),
  ]);

  return {
    paidOrders,
    pendingOrders,
    activeEntitlements,
    startedAnalyses,
    failedDocuments,
    failedEmails,
    pendingBookings,
    legacyPending,
    totalCustomers,
  };
}

export async function getAdminOrderList(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      regularAmountKrw: orders.regularAmountKrw,
      listAmountKrw: orders.listAmountKrw,
      discountAmountKrw: orders.discountAmountKrw,
      finalAmountKrw: orders.finalAmountKrw,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
      customerId: customers.id,
      customerEmailEncrypted: customers.emailEncrypted,
      userId: orders.userId,
      productCode: orderItems.productCodeSnapshot,
      productName: orderItems.productNameSnapshot,
      fulfillmentType: orderItems.fulfillmentType,
      provider: paymentTransactions.provider,
      paymentStatus: paymentTransactions.status,
      entitlementStatus: entitlements.status,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(paymentTransactions, eq(paymentTransactions.orderId, orders.id))
    .leftJoin(entitlements, eq(entitlements.orderItemId, orderItems.id))
    .orderBy(desc(orders.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map((row) => ({
    ...row,
    customerEmailMasked: maskCommerceEmailForAdmin(row.customerEmailEncrypted),
  }));
}

export async function getAdminCustomerList(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: customers.id,
      userId: customers.userId,
      emailEncrypted: customers.emailEncrypted,
      emailVerifiedAt: customers.emailVerifiedAt,
      status: customers.status,
      createdAt: customers.createdAt,
      orderCount: count(orders.id),
      latestOrderAt: max(orders.createdAt),
    })
    .from(customers)
    .leftJoin(orders, eq(orders.customerId, customers.id))
    .groupBy(
      customers.id,
      customers.userId,
      customers.emailEncrypted,
      customers.emailVerifiedAt,
      customers.status,
      customers.createdAt,
    )
    .orderBy(desc(customers.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    emailMasked: maskCommerceEmailForAdmin(row.emailEncrypted),
    emailVerifiedAt: row.emailVerifiedAt,
    status: row.status,
    createdAt: row.createdAt,
    orderCount: asCount(row.orderCount),
    latestOrderAt: row.latestOrderAt,
  }));
}

export async function getAdminCustomerDetail(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const customerRows = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
  const customer = customerRows[0];
  if (!customer) return null;

  const [customerOrders, customerEntitlements, customerAnalyses, customerDocuments, customerEmails, customerBookings] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt)).limit(100),
    db.select().from(entitlements).where(eq(entitlements.customerId, customerId)).orderBy(desc(entitlements.createdAt)).limit(100),
    db.select().from(analysisRuns).where(eq(analysisRuns.customerId, customerId)).orderBy(desc(analysisRuns.startedAt)).limit(100),
    db.select().from(privateDocuments).where(eq(privateDocuments.customerId, customerId)).orderBy(desc(privateDocuments.createdAt)).limit(100),
    db.select().from(emailOutbox).where(eq(emailOutbox.customerId, customerId)).orderBy(desc(emailOutbox.createdAt)).limit(100),
    db.select().from(coachingBookings).where(eq(coachingBookings.customerId, customerId)).orderBy(desc(coachingBookings.createdAt)).limit(100),
  ]);

  return {
    customer: {
      id: customer.id,
      userId: customer.userId,
      emailMasked: maskCommerceEmailForAdmin(customer.emailEncrypted),
      emailVerifiedAt: customer.emailVerifiedAt,
      status: customer.status,
      createdAt: customer.createdAt,
    },
    orders: customerOrders,
    entitlements: customerEntitlements,
    analysisRuns: customerAnalyses,
    privateDocuments: customerDocuments,
    emailOutbox: customerEmails.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      purpose: item.purpose,
      status: item.status,
      attemptCount: item.attemptCount,
      nextAttemptAt: item.nextAttemptAt,
      lastErrorCode: item.lastErrorCode,
      sentAt: item.sentAt,
      createdAt: item.createdAt,
    })),
    coachingBookings: customerBookings,
  };
}

export async function getAdminLegacyPaymentRecords(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return db
    .select()
    .from(paymentRecords)
    .orderBy(desc(paymentRecords.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function updateAdminLegacyPaymentStatus(input: {
  id: number;
  status: "pending" | "confirmed" | "rejected";
  memo?: string;
  adminUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db.select().from(paymentRecords).where(eq(paymentRecords.id, input.id)).limit(1);
  const before = rows[0];
  if (!before) throw new Error("LEGACY_PAYMENT_NOT_FOUND");

  const after = {
    status: input.status,
    memo: input.memo ?? before.memo,
  };
  await db.update(paymentRecords).set(after).where(eq(paymentRecords.id, input.id));
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "legacy_payment_status_updated",
    entityType: "payment_record",
    entityId: String(input.id),
    beforeJson: JSON.stringify({ status: before.status, memo: before.memo }),
    afterJson: JSON.stringify(after),
  });
  return { success: true } as const;
}

export async function getAdminReviews(limit = 100) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(Math.min(Math.max(limit, 1), 200));
}

export async function deleteAdminReview(input: { id: number; adminUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db.select().from(reviews).where(eq(reviews.id, input.id)).limit(1);
  const before = rows[0];
  if (!before) throw new Error("REVIEW_NOT_FOUND");
  await db.delete(reviews).where(eq(reviews.id, input.id));
  await db.insert(adminAuditLogs).values({
    adminUserId: input.adminUserId,
    action: "review_deleted",
    entityType: "review",
    entityId: String(input.id),
    beforeJson: JSON.stringify({ rating: before.rating, nickname: before.nickname }),
  });
  return { success: true } as const;
}

export async function getAdminCoachingBookingList(limit = 50) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: coachingBookings.id,
      status: coachingBookings.status,
      requestedWindowStart: coachingBookings.requestedWindowStart,
      requestedWindowEnd: coachingBookings.requestedWindowEnd,
      sessionMode: coachingBookings.sessionMode,
      scheduledAt: coachingBookings.scheduledAt,
      scheduledEndAt: coachingBookings.scheduledEndAt,
      timezone: coachingBookings.timezone,
      assignedAdminUserId: coachingBookings.assignedAdminUserId,
      cancelledAt: coachingBookings.cancelledAt,
      completedAt: coachingBookings.completedAt,
      noShowAt: coachingBookings.noShowAt,
      createdAt: coachingBookings.createdAt,
      orderId: orders.id,
      orderNumber: orders.orderNumber,
      orderStatus: orders.status,
      productCode: orderItems.productCodeSnapshot,
      productName: orderItems.productNameSnapshot,
      customerId: customers.id,
      customerEmailEncrypted: customers.emailEncrypted,
    })
    .from(coachingBookings)
    .innerJoin(orders, eq(orders.id, coachingBookings.orderId))
    .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
    .innerJoin(customers, eq(customers.id, coachingBookings.customerId))
    .orderBy(desc(coachingBookings.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));

  return rows.map((row) => ({
    ...row,
    customerEmailMasked: maskCommerceEmailForAdmin(row.customerEmailEncrypted),
  }));
}
