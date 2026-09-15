import { randomInt } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";

import {
  accountIdentities,
  accountLinkChallenges,
  analysisRuns,
  couponRedemptions,
  customers,
  emailOutbox,
  entitlements,
  orderItems,
  orders,
  products,
  coachingBookings,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  encryptCommerceEmail,
  encryptCommerceValue,
  hashCommerceEmail,
  hashCommerceValue,
  normalizeCommerceEmail,
} from "./crypto";
import { ensurePreviewAccountLinkOutboxSchema } from "./preview-account-link-schema";

const CLAIM_TTL_MS = 15 * 60 * 1000;
const MAX_CLAIM_ATTEMPTS = 5;

type AuthenticatedMember = Pick<User, "id" | "openId" | "email">;
type IdentityProvider = "manus" | "kakao";

export function canAutoLinkAuthenticatedCheckout(input: {
  checkoutEmail: string;
  authenticatedEmail: string | null | undefined;
}): boolean {
  if (!input.authenticatedEmail) return false;
  return normalizeCommerceEmail(input.checkoutEmail) === normalizeCommerceEmail(input.authenticatedEmail);
}

function accountIdentityHash(provider: IdentityProvider | "email", subject: string): string {
  return hashCommerceValue(`${provider}:${subject.trim().toLowerCase()}`);
}

async function linkCommerceRowsForCustomer(tx: any, input: { customerId: number; userId: number }) {
  const matchCustomer = eq(orders.customerId, input.customerId);
  await tx.update(orders).set({ userId: input.userId }).where(matchCustomer);
  await tx.update(entitlements).set({ userId: input.userId }).where(eq(entitlements.customerId, input.customerId));
  await tx.update(couponRedemptions).set({ userId: input.userId }).where(eq(couponRedemptions.customerId, input.customerId));
  await tx.update(analysisRuns).set({ userId: input.userId }).where(eq(analysisRuns.customerId, input.customerId));
  await tx.update(emailOutbox).set({ userId: input.userId }).where(eq(emailOutbox.customerId, input.customerId));
}

/**
 * Manus OAuth 로그인 완료 뒤 앱과 홈페이지가 동일한 users.id를 canonical user_id로 쓰게 만든다.
 * OAuth 이메일과 동일한 기존 비회원 고객만 자동 연결하며, 다른 이메일은 별도 소유권 확인을 요구한다.
 */
export async function ensureCommonAccountForAuthenticatedUser(
  user: AuthenticatedMember,
  identity: { provider: IdentityProvider; providerSubject: string } = {
    provider: "manus",
    providerSubject: user.openId,
  },
): Promise<{
  userId: number;
  customerId: number | null;
  autoLinked: boolean;
}> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const now = new Date();
    await tx
      .insert(accountIdentities)
      .values({
        userId: user.id,
        provider: identity.provider,
        providerSubjectHash: accountIdentityHash(identity.provider, identity.providerSubject),
        emailHash: user.email ? hashCommerceEmail(user.email) : null,
        verifiedAt: now,
      })
      .onDuplicateKeyUpdate({
        set: { userId: user.id, emailHash: user.email ? hashCommerceEmail(user.email) : null, verifiedAt: now },
      });

    if (!user.email) return { userId: user.id, customerId: null, autoLinked: false };
    const email = normalizeCommerceEmail(user.email);
    const emailHash = hashCommerceEmail(email);
    const identitySubjectHash = accountIdentityHash("email", emailHash);
    const existingEmailIdentity = await tx
      .select({ userId: accountIdentities.userId })
      .from(accountIdentities)
      .where(and(eq(accountIdentities.provider, "email"), eq(accountIdentities.providerSubjectHash, identitySubjectHash)))
      .limit(1);
    if (existingEmailIdentity[0] && existingEmailIdentity[0].userId !== user.id) {
      throw new Error("EMAIL_ALREADY_LINKED_TO_ANOTHER_ACCOUNT");
    }
    await tx
      .insert(accountIdentities)
      .values({
        userId: user.id,
        provider: "email",
        providerSubjectHash: identitySubjectHash,
        emailHash,
        verifiedAt: now,
      })
      .onDuplicateKeyUpdate({ set: { userId: user.id, verifiedAt: now } });

    const customerRows = await tx
      .select({ id: customers.id, userId: customers.userId })
      .from(customers)
      .where(eq(customers.emailHash, emailHash))
      .limit(1);
    const customer = customerRows[0];
    if (!customer) return { userId: user.id, customerId: null, autoLinked: false };
    if (customer.userId && customer.userId !== user.id) {
      throw new Error("EMAIL_ALREADY_LINKED_TO_ANOTHER_ACCOUNT");
    }
    await tx
      .update(customers)
      .set({ userId: user.id, emailVerifiedAt: now })
      .where(eq(customers.id, customer.id));
    await linkCommerceRowsForCustomer(tx, { customerId: customer.id, userId: user.id });
    return { userId: user.id, customerId: customer.id, autoLinked: true };
  });
}

/** checkout에서 OAuth 이메일이 주문 이메일과 일치할 때만 customer/user_id를 연결한다. */
export async function linkCheckoutCustomerToAuthenticatedUser(
  tx: any,
  input: { customerId: number; userId?: number; checkoutEmail: string; authenticatedEmail?: string | null },
): Promise<number | null> {
  if (
    !input.userId ||
    !canAutoLinkAuthenticatedCheckout({
      checkoutEmail: input.checkoutEmail,
      authenticatedEmail: input.authenticatedEmail ?? null,
    })
  ) {
    return null;
  }
  const customerRows = await tx
    .select({ userId: customers.userId })
    .from(customers)
    .where(eq(customers.id, input.customerId))
    .limit(1);
  const existingUserId = customerRows[0]?.userId;
  if (existingUserId && existingUserId !== input.userId) {
    throw new Error("EMAIL_ALREADY_LINKED_TO_ANOTHER_ACCOUNT");
  }
  await tx
    .update(customers)
    .set({ userId: input.userId, emailVerifiedAt: new Date() })
    .where(eq(customers.id, input.customerId));
  await linkCommerceRowsForCustomer(tx, { customerId: input.customerId, userId: input.userId });
  return input.userId;
}

export async function createGuestCommerceClaim(input: { user: AuthenticatedMember; email: string }): Promise<{
  challengeId: number;
  outboxId: number;
  expiresAt: Date;
}> {
  await ensurePreviewAccountLinkOutboxSchema();
  await ensureCommonAccountForAuthenticatedUser(input.user);
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const email = normalizeCommerceEmail(input.email);
  const emailHash = hashCommerceEmail(email);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CLAIM_TTL_MS);
  const code = String(randomInt(100000, 1_000_000));
  const codeHash = hashCommerceValue(`claim:${input.user.id}:${emailHash}:${code}`);

  return (db as any).transaction(async (tx: any) => {
    await tx
      .update(accountLinkChallenges)
      .set({ status: "cancelled" })
      .where(
        and(
          eq(accountLinkChallenges.userId, input.user.id),
          eq(accountLinkChallenges.targetEmailHash, emailHash),
          eq(accountLinkChallenges.status, "pending"),
        ),
      );
    const inserted = await tx.insert(accountLinkChallenges).values({
      userId: input.user.id,
      targetEmailHash: emailHash,
      codeHash,
      codeEncrypted: encryptCommerceValue(code),
      purpose: "claim_guest_commerce",
      expiresAt,
    });
    const challengeId = Number(inserted[0].insertId);
    const outboxInsert = await tx.insert(emailOutbox).values({
      userId: input.user.id,
      accountLinkChallengeId: challengeId,
      purpose: "account_link",
      toEmailHash: emailHash,
      toEmailEncrypted: encryptCommerceEmail(email),
      status: "queued",
      nextAttemptAt: now,
    });
    return { challengeId, outboxId: Number(outboxInsert[0].insertId), expiresAt };
  });
}

export async function confirmGuestCommerceClaim(input: {
  user: AuthenticatedMember;
  challengeId: number;
  code: string;
}): Promise<{ customerId: number; linkedOrders: number }> {
  if (!/^\d{6}$/.test(input.code)) throw new Error("INVALID_CLAIM_CODE");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const now = new Date();
    const rows = await tx
      .select()
      .from(accountLinkChallenges)
      .where(
        and(
          eq(accountLinkChallenges.id, input.challengeId),
          eq(accountLinkChallenges.userId, input.user.id),
          eq(accountLinkChallenges.status, "pending"),
          gt(accountLinkChallenges.expiresAt, now),
        ),
      )
      .limit(1);
    const challenge = rows[0];
    if (!challenge) throw new Error("CLAIM_CHALLENGE_NOT_FOUND_OR_EXPIRED");
    if (challenge.attempts >= MAX_CLAIM_ATTEMPTS) {
      await tx.update(accountLinkChallenges).set({ status: "cancelled" }).where(eq(accountLinkChallenges.id, challenge.id));
      throw new Error("CLAIM_ATTEMPTS_EXCEEDED");
    }
    const expected = hashCommerceValue(`claim:${input.user.id}:${challenge.targetEmailHash}:${input.code}`);
    if (expected !== challenge.codeHash) {
      await tx
        .update(accountLinkChallenges)
        .set({ attempts: challenge.attempts + 1 })
        .where(eq(accountLinkChallenges.id, challenge.id));
      throw new Error("INVALID_CLAIM_CODE");
    }
    const customerRows = await tx
      .select({ id: customers.id, userId: customers.userId })
      .from(customers)
      .where(eq(customers.emailHash, challenge.targetEmailHash))
      .limit(1);
    const customer = customerRows[0];
    if (!customer) throw new Error("GUEST_COMMERCE_NOT_FOUND");
    if (customer.userId && customer.userId !== input.user.id) throw new Error("EMAIL_ALREADY_LINKED_TO_ANOTHER_ACCOUNT");
    await tx
      .update(customers)
      .set({ userId: input.user.id, emailVerifiedAt: now })
      .where(eq(customers.id, customer.id));
    await linkCommerceRowsForCustomer(tx, { customerId: customer.id, userId: input.user.id });
    await tx
      .update(accountLinkChallenges)
      .set({ status: "verified", verifiedAt: now })
      .where(eq(accountLinkChallenges.id, challenge.id));
    const linkedOrderRows = await tx.select({ id: orders.id }).from(orders).where(eq(orders.customerId, customer.id));
    return { customerId: customer.id, linkedOrders: linkedOrderRows.length };
  });
}

export async function getCommonAccountSnapshot(user: AuthenticatedMember) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const emailHash = user.email ? hashCommerceEmail(user.email) : null;
  const customerRows = emailHash
    ? await db.select().from(customers).where(eq(customers.emailHash, emailHash)).limit(1)
    : [];
  return {
    userId: user.id,
    emailLinked: Boolean(customerRows[0]?.userId === user.id),
    customerId: customerRows[0]?.id ?? null,
  };
}

/**
 * 마이페이지용 최소 공통 원장 조회다. 원본 분석·PDF·결제 payload와 이메일 원문은 반환하지 않는다.
 * 주문이 이메일 소유권 확인으로 연결된 경우에만 user_id 기준으로 표시한다.
 */
export async function getMemberCommerceDashboard(user: AuthenticatedMember) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const [account, orderRows, entitlementRows, analysisRows, bookingRows] = await Promise.all([
    getCommonAccountSnapshot(user),
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(50),
    db.select().from(entitlements).where(eq(entitlements.userId, user.id)).orderBy(desc(entitlements.createdAt)).limit(50),
    db.select().from(analysisRuns).where(eq(analysisRuns.userId, user.id)).orderBy(desc(analysisRuns.startedAt)).limit(50),
    db.select().from(coachingBookings).where(eq(coachingBookings.userId, user.id)).orderBy(desc(coachingBookings.createdAt)).limit(50),
  ]);

  const orderIds = orderRows.map((order) => order.id);
  const itemRows = orderIds.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
    : [];
  const productIds = Array.from(
    new Set([
      ...itemRows.map((item) => item.productId),
      ...entitlementRows.map((item) => item.productId),
      ...analysisRows.map((item) => item.productId),
      ...bookingRows.map((item) => item.productId),
    ]),
  );
  const productRows = productIds.length
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  const productNameById = new Map(productRows.map((product) => [product.id, product.name]));
  const firstItemByOrderId = new Map<number, (typeof itemRows)[number]>();
  itemRows.forEach((item) => {
    if (!firstItemByOrderId.has(item.orderId)) firstItemByOrderId.set(item.orderId, item);
  });

  return {
    account,
    summary: {
      orderCount: orderRows.length,
      paidOrderCount: orderRows.filter((order) => order.status === "paid" && !order.isTest).length,
      activeEntitlementCount: entitlementRows.filter((entitlement) => entitlement.status === "active").length,
      completedAnalysisCount: analysisRows.filter((analysis) => analysis.status === "completed").length,
    },
    orders: orderRows.map((order) => {
      const item = firstItemByOrderId.get(order.id);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        channel: order.channel,
        isTest: order.isTest,
        finalAmountKrw: order.finalAmountKrw,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        productName: item?.productNameSnapshot ?? "주문 상품",
        fulfillmentType: item?.fulfillmentType ?? null,
      };
    }),
    entitlements: entitlementRows.map((entitlement) => ({
      id: entitlement.id,
      productName: productNameById.get(entitlement.productId) ?? "분석 이용권",
      status: entitlement.status,
      usedCount: entitlement.usedCount,
      usageLimit: entitlement.usageLimit,
      validUntil: entitlement.validUntil,
    })),
    analyses: analysisRows.map((analysis) => ({
      id: analysis.id,
      productName: productNameById.get(analysis.productId) ?? "심화 분석",
      status: analysis.status,
      startedAt: analysis.startedAt,
      completedAt: analysis.completedAt,
    })),
    coachingBookings: bookingRows.map((booking) => ({
      id: booking.id,
      productName: productNameById.get(booking.productId) ?? "코칭 프로그램",
      status: booking.status,
      sessionMode: booking.sessionMode,
      scheduledAt: booking.scheduledAt,
      createdAt: booking.createdAt,
    })),
  };
}
