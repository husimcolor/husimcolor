import { and, count, eq, gt, inArray } from "drizzle-orm";

import { adminAuditLogs, customers, entitlements, products } from "../../drizzle/schema";
import { PAID_ANALYSIS_PRODUCT_CODES, type CommerceProductCode } from "../../shared/commerce";
import { getDb } from "../db";
import { createEntitlementStartGrant, type EntitlementStartGrant } from "./entitlement-service";
import type { AdminAuditActor } from "./admin-audit-actor";
import { encryptCommerceEmail, hashCommerceEmail, normalizeCommerceEmail } from "./crypto";

const ADMIN_TEST_ENTITLEMENT_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

export const ADMIN_TEST_ENTITLEMENT_PRODUCT_CODES = PAID_ANALYSIS_PRODUCT_CODES;
export type AdminTestEntitlementProductCode = (typeof ADMIN_TEST_ENTITLEMENT_PRODUCT_CODES)[number];

type AdminTrialOutcome = "issued" | "link_reissued" | "already_used" | "expired" | "revoked";

export type AdminTestEntitlementResult = {
  outcome: AdminTrialOutcome;
  entitlementId: number;
  productCode: AdminTestEntitlementProductCode;
  expiresAt: string | null;
  startGrant: EntitlementStartGrant | null;
};

function isAdminTestEntitlementProduct(value: string): value is AdminTestEntitlementProductCode {
  return (ADMIN_TEST_ENTITLEMENT_PRODUCT_CODES as readonly string[]).includes(value);
}

/**
 * 기존 공통 customer/entitlement 원장만 사용해, 관리자 비밀번호 세션에서만
 * 유료 분석 체험 권한을 1회·7일로 발급한다. 주문·결제·쿠폰은 만들지 않는다.
 */
export async function issueAdminTestEntitlement(input: {
  email: string;
  productCode: AdminTestEntitlementProductCode;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<AdminTestEntitlementResult> {
  if (!isAdminTestEntitlementProduct(input.productCode)) {
    throw new Error("ADMIN_TEST_ENTITLEMENT_PRODUCT_INVALID");
  }

  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const email = normalizeCommerceEmail(input.email);
  const emailHash = hashCommerceEmail(email);
  const now = new Date();
  const validUntil = new Date(now.getTime() + ADMIN_TEST_ENTITLEMENT_VALIDITY_MS);

  return (db as any).transaction(async (tx: any) => {
    const productRows = await tx
      .select({ id: products.id, code: products.code, requiresPayment: products.requiresPayment, fulfillmentType: products.fulfillmentType })
      .from(products)
      .where(eq(products.code, input.productCode))
      .limit(1);
    const product = productRows[0];
    if (!product || !product.requiresPayment || product.fulfillmentType !== "analysis") {
      throw new Error("ADMIN_TEST_ENTITLEMENT_PRODUCT_UNAVAILABLE");
    }

    const customerRows = await tx
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.emailHash, emailHash))
      .limit(1);
    let customerId = customerRows[0]?.id as number | undefined;
    if (!customerId) {
      const inserted = await tx.insert(customers).values({
        emailHash,
        emailEncrypted: encryptCommerceEmail(email),
        status: "active",
      });
      customerId = Number(inserted[0].insertId);
    }

    const previousRows = await tx
      .select({
        id: entitlements.id,
        status: entitlements.status,
        usedCount: entitlements.usedCount,
        usageLimit: entitlements.usageLimit,
        validUntil: entitlements.validUntil,
      })
      .from(entitlements)
      .where(and(
        eq(entitlements.customerId, customerId),
        eq(entitlements.productId, product.id),
        eq(entitlements.source, "admin"),
      ))
      .limit(1);
    const previous = previousRows[0];

    if (previous) {
      const isExpired = previous.status === "expired" || Boolean(previous.validUntil && previous.validUntil.getTime() <= now.getTime());
      const outcome: Exclude<AdminTrialOutcome, "issued" | "link_reissued"> = previous.status === "revoked"
        ? "revoked"
        : isExpired
          ? "expired"
          : "already_used";
      if (previous.status === "active" && previous.usedCount < previous.usageLimit && !isExpired) {
        const expiresAt = previous.validUntil ?? validUntil;
        const startGrant = createEntitlementStartGrant({
          entitlementId: previous.id,
          customerId,
          productCode: input.productCode,
          expiresAt,
        });
        await tx.insert(adminAuditLogs).values({
          adminUserId: input.adminUserId,
          action: "admin_test_entitlement_link_reissued",
          entityType: "entitlement",
          entityId: String(previous.id),
          beforeJson: JSON.stringify({ status: previous.status, usedCount: previous.usedCount, auditActor: input.auditActor.subject }),
          afterJson: JSON.stringify({ productCode: input.productCode, validUntil: expiresAt.toISOString(), auditActor: input.auditActor.subject }),
        });
        return {
          outcome: "link_reissued" as const,
          entitlementId: previous.id,
          productCode: input.productCode,
          expiresAt: expiresAt.toISOString(),
          startGrant,
        };
      }
      return {
        outcome,
        entitlementId: previous.id,
        productCode: input.productCode,
        expiresAt: previous.validUntil?.toISOString() ?? null,
        startGrant: null,
      };
    }

    // 체험 담당자는 동시에 최대 두 명까지만 유지한다. 만료·회수된 체험은 이 제한에 포함하지 않는다.
    const activeTrialRows = await tx
      .select({ value: count() })
      .from(entitlements)
      .where(and(
        eq(entitlements.source, "admin"),
        inArray(entitlements.status, ["active", "consumed"]),
        gt(entitlements.validUntil, now),
      ));
    if (Number(activeTrialRows[0]?.value ?? 0) >= 2) {
      throw new Error("ADMIN_TEST_ENTITLEMENT_RECIPIENT_LIMIT");
    }

    const entitlementInsert = await tx.insert(entitlements).values({
      customerId,
      productId: product.id,
      status: "active",
      source: "admin",
      usageLimit: 1,
      usedCount: 0,
      validUntil,
    });
    const entitlementId = Number(entitlementInsert[0].insertId);
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "admin_test_entitlement_issued",
      entityType: "entitlement",
      entityId: String(entitlementId),
      beforeJson: JSON.stringify({ issued: false, auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({
        productCode: input.productCode,
        source: "admin",
        usageLimit: 1,
        validUntil: validUntil.toISOString(),
        auditActor: input.auditActor.subject,
      }),
    });
    return {
      outcome: "issued" as const,
      entitlementId,
      productCode: input.productCode,
      expiresAt: validUntil.toISOString(),
      startGrant: createEntitlementStartGrant({
        entitlementId,
        customerId,
        productCode: input.productCode,
        expiresAt: validUntil,
      }),
    };
  });
}

/** 발급 후 검사 시작 전까지의 체험 이용권만 안전하게 회수한다. */
export async function revokeAdminTestEntitlement(input: {
  email: string;
  productCode: AdminTestEntitlementProductCode;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<{ revoked: boolean; reason: "REVOKED" | "NOT_FOUND" | "ALREADY_USED_OR_INACTIVE" }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const customerRows = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.emailHash, hashCommerceEmail(normalizeCommerceEmail(input.email))))
    .limit(1);
  const customerId = customerRows[0]?.id;
  if (!customerId) return { revoked: false, reason: "NOT_FOUND" };

  return (db as any).transaction(async (tx: any) => {
    const rows = await tx
      .select({ id: entitlements.id, status: entitlements.status, usedCount: entitlements.usedCount, productId: products.id })
      .from(entitlements)
      .innerJoin(products, eq(products.id, entitlements.productId))
      .where(and(
        eq(entitlements.customerId, customerId),
        eq(products.code, input.productCode),
        eq(entitlements.source, "admin"),
      ))
      .limit(1);
    const entitlement = rows[0];
    if (!entitlement) return { revoked: false as const, reason: "NOT_FOUND" as const };
    if (entitlement.status !== "active" || entitlement.usedCount > 0) {
      return { revoked: false as const, reason: "ALREADY_USED_OR_INACTIVE" as const };
    }
    const revokedAt = new Date();
    const changed = await tx
      .update(entitlements)
      .set({ status: "revoked", revokedAt })
      .where(and(eq(entitlements.id, entitlement.id), eq(entitlements.status, "active"), eq(entitlements.usedCount, 0)));
    if (Number(changed[0]?.affectedRows ?? 0) !== 1) {
      return { revoked: false as const, reason: "ALREADY_USED_OR_INACTIVE" as const };
    }
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "admin_test_entitlement_revoked",
      entityType: "entitlement",
      entityId: String(entitlement.id),
      beforeJson: JSON.stringify({ status: "active", usedCount: 0, auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({ status: "revoked", revokedAt: revokedAt.toISOString(), auditActor: input.auditActor.subject }),
    });
    return { revoked: true as const, reason: "REVOKED" as const };
  });
}
