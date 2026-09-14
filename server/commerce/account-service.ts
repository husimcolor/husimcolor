import { randomInt } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";

import {
  accountIdentities,
  accountLinkChallenges,
  analysisRuns,
  couponRedemptions,
  customers,
  emailOutbox,
  entitlements,
  orders,
} from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { getDb } from "../db";
import {
  encryptCommerceEmail,
  hashCommerceEmail,
  hashCommerceValue,
  normalizeCommerceEmail,
} from "./crypto";

const CLAIM_TTL_MS = 15 * 60 * 1000;
const MAX_CLAIM_ATTEMPTS = 5;

type AuthenticatedMember = Pick<User, "id" | "openId" | "email">;

export function canAutoLinkAuthenticatedCheckout(input: {
  checkoutEmail: string;
  authenticatedEmail: string | null | undefined;
}): boolean {
  if (!input.authenticatedEmail) return false;
  return normalizeCommerceEmail(input.checkoutEmail) === normalizeCommerceEmail(input.authenticatedEmail);
}

function accountIdentityHash(provider: "manus" | "email", subject: string): string {
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
export async function ensureCommonAccountForAuthenticatedUser(user: AuthenticatedMember): Promise<{
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
        provider: "manus",
        providerSubjectHash: accountIdentityHash("manus", user.openId),
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
  expiresAt: Date;
}> {
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
      purpose: "claim_guest_commerce",
      expiresAt,
    });
    const challengeId = Number(inserted[0].insertId);
    // result@ 발송 worker는 다음 구현 단계에서 이 outbox를 읽어 인증 코드를 전달한다.
    await tx.insert(emailOutbox).values({
      userId: input.user.id,
      purpose: "account_link",
      toEmailHash: emailHash,
      toEmailEncrypted: encryptCommerceEmail(email),
      status: "queued",
      nextAttemptAt: now,
    });
    return { challengeId, expiresAt };
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
