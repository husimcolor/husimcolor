import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import { analysisRuns, entitlements, orderItems, products } from "../../drizzle/schema";
import type { CommerceProductCode } from "../../shared/commerce";
import { getDb } from "../db";

const TOKEN_VERSION = "v1";
const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

type EntitlementTokenPayload = {
  v: typeof TOKEN_VERSION;
  entitlementId: number;
  customerId: number;
  productCode: CommerceProductCode;
  exp: number;
};

type AnalysisDeliveryTokenPayload = {
  v: "d1";
  analysisRunId: number;
  customerId: number;
  productCode: CommerceProductCode;
  exp: number;
};

export type EntitlementStartGrant = {
  entitlementId: number;
  productCode: CommerceProductCode;
  accessToken: string;
  expiresAt: string;
};

export type AnalysisDeliveryGrant = {
  analysisRunId: number;
  productCode: CommerceProductCode;
  accessToken: string;
  expiresAt: string;
};

function getTokenSecret(): string {
  const secret = process.env.COMMERCE_EMAIL_HASH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("COMMERCE_EMAIL_HASH_SECRET is not configured securely");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getTokenSecret()).update(encodedPayload).digest("base64url");
}

function serialize(payload: EntitlementTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${TOKEN_VERSION}.${encodedPayload}.${sign(encodedPayload)}`;
}

function parse(accessToken: string): EntitlementTokenPayload {
  const [version, encodedPayload, providedSignature, extra] = accessToken.split(".");
  if (version !== TOKEN_VERSION || !encodedPayload || !providedSignature || extra !== undefined) {
    throw new Error("INVALID_ENTITLEMENT_TOKEN");
  }
  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature, "base64url");
  const provided = Buffer.from(providedSignature, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error("INVALID_ENTITLEMENT_TOKEN");
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as EntitlementTokenPayload;
  if (
    payload.v !== TOKEN_VERSION ||
    !Number.isInteger(payload.entitlementId) ||
    !Number.isInteger(payload.customerId) ||
    !payload.productCode ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Date.now()
  ) {
    throw new Error("ENTITLEMENT_TOKEN_EXPIRED_OR_INVALID");
  }
  return payload;
}

export function createEntitlementStartGrant(input: {
  entitlementId: number;
  customerId: number | null;
  productCode: CommerceProductCode;
}): EntitlementStartGrant {
  if (!input.customerId) throw new Error("ENTITLEMENT_CUSTOMER_REQUIRED");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const payload: EntitlementTokenPayload = {
    v: TOKEN_VERSION,
    entitlementId: input.entitlementId,
    customerId: input.customerId,
    productCode: input.productCode,
    exp: expiresAt.getTime(),
  };
  return {
    entitlementId: input.entitlementId,
    productCode: input.productCode,
    accessToken: serialize(payload),
    expiresAt: expiresAt.toISOString(),
  };
}

export function createAnalysisDeliveryGrant(input: {
  analysisRunId: number;
  customerId: number;
  productCode: CommerceProductCode;
  accessMode: "member" | "guest" | "free";
}): AnalysisDeliveryGrant {
  const retentionDays = input.accessMode === "member" ? 365 : 7;
  const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  const payload: AnalysisDeliveryTokenPayload = {
    v: "d1",
    analysisRunId: input.analysisRunId,
    customerId: input.customerId,
    productCode: input.productCode,
    exp: expiresAt.getTime(),
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return {
    analysisRunId: input.analysisRunId,
    productCode: input.productCode,
    accessToken: `d1.${encodedPayload}.${sign(encodedPayload)}`,
    expiresAt: expiresAt.toISOString(),
  };
}

export function verifyAnalysisDeliveryGrant(input: {
  accessToken: string;
  analysisRunId: number;
  productCode: CommerceProductCode;
}): AnalysisDeliveryTokenPayload {
  const [version, encodedPayload, providedSignature, extra] = input.accessToken.split(".");
  if (version !== "d1" || !encodedPayload || !providedSignature || extra !== undefined) {
    throw new Error("INVALID_ANALYSIS_DELIVERY_TOKEN");
  }
  const expected = Buffer.from(sign(encodedPayload), "base64url");
  const provided = Buffer.from(providedSignature, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error("INVALID_ANALYSIS_DELIVERY_TOKEN");
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AnalysisDeliveryTokenPayload;
  if (
    payload.v !== "d1" ||
    payload.analysisRunId !== input.analysisRunId ||
    payload.productCode !== input.productCode ||
    !Number.isInteger(payload.customerId) ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Date.now()
  ) {
    throw new Error("ANALYSIS_DELIVERY_TOKEN_EXPIRED_OR_INVALID");
  }
  return payload;
}

/**
 * 정보 입력 완료 시 서버가 단 한 번만 entitlement를 소비한다.
 * 브라우저 플래그·결제 성공 URL은 권한 근거가 될 수 없으며 이 토큰과 DB 상태를 함께 만족해야 한다.
 */
export async function consumeEntitlementForAnalysisStart(input: {
  accessToken: string;
  productCode: CommerceProductCode;
}): Promise<{
  entitlementId: number;
  analysisRunId: number;
  productCode: CommerceProductCode;
  status: "consumed";
  deliveryGrant: AnalysisDeliveryGrant;
}> {
  const token = parse(input.accessToken);
  if (token.productCode !== input.productCode) throw new Error("ENTITLEMENT_PRODUCT_MISMATCH");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");

  return (db as any).transaction(async (tx: any) => {
    const rows = await tx
      .select({
        entitlementId: entitlements.id,
        status: entitlements.status,
        usedCount: entitlements.usedCount,
        usageLimit: entitlements.usageLimit,
        validUntil: entitlements.validUntil,
        customerId: entitlements.customerId,
        userId: entitlements.userId,
        productId: entitlements.productId,
        orderId: orderItems.orderId,
        productCode: products.code,
      })
      .from(entitlements)
      .innerJoin(products, eq(entitlements.productId, products.id))
      .leftJoin(orderItems, eq(entitlements.orderItemId, orderItems.id))
      .where(and(eq(entitlements.id, token.entitlementId), eq(entitlements.customerId, token.customerId)))
      .limit(1);
    const entitlement = rows[0];
    if (!entitlement || entitlement.productCode !== input.productCode) {
      throw new Error("ENTITLEMENT_NOT_FOUND");
    }
    if (entitlement.status !== "active" || entitlement.usedCount >= entitlement.usageLimit) {
      throw new Error("ENTITLEMENT_ALREADY_USED_OR_INACTIVE");
    }
    if (entitlement.validUntil && entitlement.validUntil.getTime() <= Date.now()) {
      await tx.update(entitlements).set({ status: "expired" }).where(eq(entitlements.id, entitlement.entitlementId));
      throw new Error("ENTITLEMENT_EXPIRED");
    }

    const claimed = await tx
      .update(entitlements)
      .set({ status: "consumed", usedCount: entitlement.usedCount + 1 })
      .where(and(
        eq(entitlements.id, entitlement.entitlementId),
        eq(entitlements.status, "active"),
        gt(entitlements.usageLimit, entitlements.usedCount),
      ));
    if (Number(claimed[0]?.affectedRows ?? 0) !== 1) {
      throw new Error("ENTITLEMENT_CONSUMPTION_CONFLICT");
    }
    const accessMode = entitlement.userId ? "member" : "guest";
    const runInsert = await tx.insert(analysisRuns).values({
      userId: entitlement.userId,
      customerId: entitlement.customerId,
      entitlementId: entitlement.entitlementId,
      orderId: entitlement.orderId ?? null,
      productId: entitlement.productId,
      accessMode,
      status: "started",
    });
    const analysisRunId = Number(runInsert[0].insertId);
    return {
      entitlementId: entitlement.entitlementId,
      analysisRunId,
      productCode: input.productCode,
      status: "consumed",
      deliveryGrant: createAnalysisDeliveryGrant({
        analysisRunId,
        customerId: entitlement.customerId,
        productCode: input.productCode,
        accessMode,
      }),
    };
  });
}
