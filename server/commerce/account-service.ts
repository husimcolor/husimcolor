import { randomInt } from "node:crypto";
import { and, desc, eq, gt, inArray, isNull } from "drizzle-orm";

import {
  accountIdentities,
  accountLinkChallenges,
  analysisRuns,
  couponRedemptions,
  coupons,
  customers,
  emailOutbox,
  entitlements,
  orderItems,
  orders,
  paymentTransactions,
  privateDocuments,
  products,
  coachingBookings,
  supportTickets,
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
import { isRestorableGuestClaim } from "./guest-claim-state";
import { ensurePreviewAccountLinkOutboxSchema } from "./preview-account-link-schema";
import { storageGetSignedUrl } from "../storage";

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

export function getNoCommerceGuestClaimResult(): { customerId: null; linkedOrders: 0 } {
  return { customerId: null, linkedOrders: 0 };
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

/**
 * 페이지 새로고침 뒤에도 기존 인증 메일을 다시 보내지 않고, 현재 사용자의 유효한 챌린지만 복구한다.
 * 이메일·코드·암호화 원문은 반환하지 않는다.
 */
export async function getRestorableGuestCommerceClaim(user: AuthenticatedMember): Promise<{
  challengeId: number;
  expiresAt: Date;
} | null> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: accountLinkChallenges.id,
      status: accountLinkChallenges.status,
      expiresAt: accountLinkChallenges.expiresAt,
    })
    .from(accountLinkChallenges)
    .where(and(
      eq(accountLinkChallenges.userId, user.id),
      eq(accountLinkChallenges.purpose, "claim_guest_commerce"),
      eq(accountLinkChallenges.status, "pending"),
      gt(accountLinkChallenges.expiresAt, new Date()),
    ))
    .orderBy(desc(accountLinkChallenges.createdAt))
    .limit(1);
  const claim = rows[0];
  if (!claim || !isRestorableGuestClaim(claim)) return null;
  return { challengeId: claim.id, expiresAt: claim.expiresAt };
}

export async function confirmGuestCommerceClaim(input: {
  user: AuthenticatedMember;
  challengeId: number;
  code: string;
}): Promise<{ customerId: number | null; linkedOrders: number }> {
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
    // 인증 대상 이메일에 기존 구매 고객이 없을 수 있다. 이 경우에도 이메일
    // 소유권 검증 자체는 완료해야 하며, 기존 원장 행을 새로 만들거나 수정하지 않는다.
    if (!customer) {
      await tx
        .update(accountLinkChallenges)
        .set({ status: "verified", verifiedAt: now })
        .where(eq(accountLinkChallenges.id, challenge.id));
      return getNoCommerceGuestClaimResult();
    }
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

  const [account, orderRows, entitlementRows, analysisRows, bookingRows, documentRows, couponRows, inquiryRows] = await Promise.all([
    getCommonAccountSnapshot(user),
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(50),
    db.select().from(entitlements).where(eq(entitlements.userId, user.id)).orderBy(desc(entitlements.createdAt)).limit(50),
    db.select().from(analysisRuns).where(eq(analysisRuns.userId, user.id)).orderBy(desc(analysisRuns.startedAt)).limit(50),
    db.select().from(coachingBookings).where(eq(coachingBookings.userId, user.id)).orderBy(desc(coachingBookings.createdAt)).limit(50),
    db.select().from(privateDocuments).where(eq(privateDocuments.userId, user.id)).orderBy(desc(privateDocuments.createdAt)).limit(50),
    db.select({
      id: couponRedemptions.id, state: couponRedemptions.state, reservedAt: couponRedemptions.reservedAt, consumedAt: couponRedemptions.consumedAt, releasedAt: couponRedemptions.releasedAt,
      code: coupons.code, discountType: coupons.discountType, discountValue: coupons.discountValue, status: coupons.status, endsAt: coupons.endsAt,
    }).from(couponRedemptions).innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId)).where(eq(couponRedemptions.userId, user.id)).orderBy(desc(couponRedemptions.reservedAt)).limit(50),
    db.select({ id: supportTickets.id, inquiryType: supportTickets.inquiryType, status: supportTickets.status, subject: supportTickets.subject, createdAt: supportTickets.createdAt, respondedAt: supportTickets.respondedAt, }).from(supportTickets).where(eq(supportTickets.userId, user.id)).orderBy(desc(supportTickets.createdAt)).limit(50),
  ]);

  const orderIds = orderRows.map((order) => order.id);
  const [itemRows, paymentRows] = orderIds.length
    ? await Promise.all([
      db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds)),
      db.select({ orderId: paymentTransactions.orderId, status: paymentTransactions.status }).from(paymentTransactions).where(inArray(paymentTransactions.orderId, orderIds)),
    ])
    : [[], []] as const;
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
  const paymentStatusByOrderId = new Map(paymentRows.map((payment) => [payment.orderId, payment.status]));

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
        listAmountKrw: order.listAmountKrw,
        discountAmountKrw: order.discountAmountKrw,
        paymentStatus: paymentStatusByOrderId.get(order.id) ?? null,
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
      hasSavedResult: Boolean(analysis.resultReference),
    })),
    coachingBookings: bookingRows.map((booking) => ({
      id: booking.id,
      productName: productNameById.get(booking.productId) ?? "코칭 프로그램",
      status: booking.status,
      sessionMode: booking.sessionMode,
      scheduledAt: booking.scheduledAt,
      createdAt: booking.createdAt,
    })),
    privateDocuments: documentRows.map((document) => ({ id: document.id, analysisRunId: document.analysisRunId, status: document.status, retentionExpiresAt: document.retentionExpiresAt, generatedAt: document.generatedAt, available: document.status === "generated" && Boolean(document.storageKey) && document.retentionExpiresAt > new Date(), })),
    coupons: couponRows,
    inquiries: inquiryRows,
  };
}

/** 로그인한 본인의 보관기간 내 PDF만 기존 private storage에서 일회성 URL로 재발급한다. */
export async function getMemberPrivateDocumentDownload(user: AuthenticatedMember, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db.select().from(privateDocuments).where(and(eq(privateDocuments.id, documentId), eq(privateDocuments.userId, user.id), eq(privateDocuments.status, "generated"), gt(privateDocuments.retentionExpiresAt, new Date()))).limit(1);
  const document = rows[0];
  if (!document?.storageKey) throw new Error("PRIVATE_DOCUMENT_NOT_AVAILABLE");
  return { documentId: document.id, url: await storageGetSignedUrl(document.storageKey) };
}
