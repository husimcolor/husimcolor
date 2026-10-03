import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";

import {
  adminAuditLogs,
  couponProductRules,
  coupons,
  customers,
  products,
} from "../../drizzle/schema";
import { getDb } from "../db";
import type { AdminAuditActor } from "./admin-audit-actor";
import { encryptCommerceEmail, hashCommerceEmail, normalizeCommerceEmail } from "./crypto";
import { maskCommerceEmailForAdmin } from "./admin-operations-service";

export const ADMIN_TARGETED_COUPON_PRODUCT_CODES = [
  "personal_deep",
  "couple_love_deep",
  "parent_child_deep",
  "personal_coaching",
  "couple_coaching",
] as const;

export type AdminTargetedCouponProductCode = (typeof ADMIN_TARGETED_COUPON_PRODUCT_CODES)[number];
export type AdminTargetedCouponDiscountType = "fixed" | "percent";

function isAllowedProductCode(value: string): value is AdminTargetedCouponProductCode {
  return (ADMIN_TARGETED_COUPON_PRODUCT_CODES as readonly string[]).includes(value);
}

function normalizeRequestedCode(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{5,63}$/.test(code)) {
    throw new Error("ADMIN_TARGETED_COUPON_CODE_INVALID");
  }
  return code;
}

function createCouponCode(): string {
  return `HC-${randomBytes(7).toString("hex").toUpperCase()}`;
}

function validateInput(input: {
  productCodes: readonly string[];
  discountType: AdminTargetedCouponDiscountType;
  discountValue: number;
  validDays: number;
}): AdminTargetedCouponProductCode[] {
  const productCodes = [...new Set(input.productCodes)];
  if (!productCodes.length || productCodes.some((code) => !isAllowedProductCode(code))) {
    throw new Error("ADMIN_TARGETED_COUPON_PRODUCT_INVALID");
  }
  if (!Number.isInteger(input.validDays) || input.validDays < 1 || input.validDays > 365) {
    throw new Error("ADMIN_TARGETED_COUPON_VALIDITY_INVALID");
  }
  if (!Number.isInteger(input.discountValue) || input.discountValue <= 0) {
    throw new Error("ADMIN_TARGETED_COUPON_DISCOUNT_INVALID");
  }
  if (input.discountType === "percent" && input.discountValue > 100) {
    throw new Error("ADMIN_TARGETED_COUPON_PERCENT_INVALID");
  }
  if (input.discountType === "fixed" && input.discountValue > 1_000_000) {
    throw new Error("ADMIN_TARGETED_COUPON_FIXED_AMOUNT_INVALID");
  }
  return productCodes as AdminTargetedCouponProductCode[];
}

/**
 * 공통 customers/coupons/coupon_product_rules 원장만 재사용한다.
 * 지정 고객 쿠폰은 반드시 한 고객 ID에 묶이며, 별도의 회원·쿠폰 저장소를 만들지 않는다.
 */
export async function issueAdminTargetedCoupon(input: {
  email: string;
  productCodes: readonly string[];
  discountType: AdminTargetedCouponDiscountType;
  discountValue: number;
  validDays: number;
  requestedCode?: string;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<{
  couponId: number;
  code: string;
  expiresAt: string;
  customerEmailMasked: string;
  productCodes: AdminTargetedCouponProductCode[];
}> {
  const productCodes = validateInput(input);
  const requestedCode = normalizeRequestedCode(input.requestedCode);
  const email = normalizeCommerceEmail(input.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_TARGETED_COUPON_EMAIL_INVALID");
  }

  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  const now = new Date();
  const endsAt = new Date(now.getTime() + input.validDays * 24 * 60 * 60 * 1000);
  const emailHash = hashCommerceEmail(email);

  return (db as any).transaction(async (tx: any) => {
    const requestedProducts = await tx
      .select({ id: products.id, code: products.code, requiresPayment: products.requiresPayment })
      .from(products)
      .where(inArray(products.code, productCodes));
    if (
      requestedProducts.length !== productCodes.length ||
      requestedProducts.some((product: { requiresPayment: boolean }) => !product.requiresPayment)
    ) {
      throw new Error("ADMIN_TARGETED_COUPON_PRODUCT_UNAVAILABLE");
    }

    const customerRows = await tx
      .select({ id: customers.id, emailEncrypted: customers.emailEncrypted })
      .from(customers)
      .where(eq(customers.emailHash, emailHash))
      .limit(1);
    let customerId = customerRows[0]?.id as number | undefined;
    let customerEmailEncrypted = customerRows[0]?.emailEncrypted as string | undefined;
    if (!customerId) {
      const inserted = await tx.insert(customers).values({
        emailHash,
        emailEncrypted: encryptCommerceEmail(email),
        status: "active",
      });
      customerId = Number(inserted[0].insertId);
      customerEmailEncrypted = encryptCommerceEmail(email);
    }

    const code = requestedCode ?? createCouponCode();
    const duplicate = await tx.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
    if (duplicate[0]) throw new Error("ADMIN_TARGETED_COUPON_CODE_DUPLICATE");

    const insertedCoupon = await tx.insert(coupons).values({
      code,
      assignedCustomerId: customerId,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmountKrw: 0,
      startsAt: now,
      endsAt,
      maxRedemptions: 1,
      maxPerCustomer: 1,
      status: "active",
    });
    const couponId = Number(insertedCoupon[0].insertId);

    await tx.insert(couponProductRules).values(
      requestedProducts.map((product: { id: number }) => ({ couponId, productId: product.id })),
    );
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "admin_targeted_coupon_issued",
      entityType: "coupon",
      entityId: String(couponId),
      beforeJson: JSON.stringify({ issued: false, auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({
        assignedCustomer: true,
        productCodes,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxRedemptions: 1,
        maxPerCustomer: 1,
        expiresAt: endsAt.toISOString(),
        auditActor: input.auditActor.subject,
      }),
    });

    return {
      couponId,
      code,
      expiresAt: endsAt.toISOString(),
      customerEmailMasked: maskCommerceEmailForAdmin(customerEmailEncrypted ?? encryptCommerceEmail(email)),
      productCodes,
    };
  });
}

export async function revokeAdminTargetedCoupon(input: {
  couponId: number;
  adminUserId: number | null;
  auditActor: AdminAuditActor;
}): Promise<{ revoked: boolean; reason: "REVOKED" | "NOT_FOUND" | "ALREADY_INACTIVE" }> {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const rows = await tx
      .select({ id: coupons.id, status: coupons.status })
      .from(coupons)
      .where(and(eq(coupons.id, input.couponId), isNotNull(coupons.assignedCustomerId)))
      .limit(1);
    const coupon = rows[0];
    if (!coupon) return { revoked: false as const, reason: "NOT_FOUND" as const };
    if (coupon.status !== "active") return { revoked: false as const, reason: "ALREADY_INACTIVE" as const };

    const updated = await tx
      .update(coupons)
      .set({ status: "paused" })
      .where(and(eq(coupons.id, coupon.id), eq(coupons.status, "active")));
    if (Number(updated[0]?.affectedRows ?? 0) !== 1) {
      return { revoked: false as const, reason: "ALREADY_INACTIVE" as const };
    }
    await tx.insert(adminAuditLogs).values({
      adminUserId: input.adminUserId,
      action: "admin_targeted_coupon_revoked",
      entityType: "coupon",
      entityId: String(coupon.id),
      beforeJson: JSON.stringify({ status: "active", auditActor: input.auditActor.subject }),
      afterJson: JSON.stringify({ status: "paused", auditActor: input.auditActor.subject }),
    });
    return { revoked: true as const, reason: "REVOKED" as const };
  });
}

export async function getAdminTargetedCouponList(limit = 20) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  const rows = await db
    .select({
      id: coupons.id,
      code: coupons.code,
      discountType: coupons.discountType,
      discountValue: coupons.discountValue,
      status: coupons.status,
      endsAt: coupons.endsAt,
      assignedCustomerEmailEncrypted: customers.emailEncrypted,
    })
    .from(coupons)
    .innerJoin(customers, eq(customers.id, coupons.assignedCustomerId))
    .where(isNotNull(coupons.assignedCustomerId))
    .orderBy(desc(coupons.createdAt))
    .limit(Math.min(Math.max(limit, 1), 50));

  return rows.map((row) => ({
    ...row,
    assignedCustomerEmailMasked: maskCommerceEmailForAdmin(row.assignedCustomerEmailEncrypted),
  }));
}
