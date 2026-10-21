import { createHmac, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";

import {
  analysisRuns,
  entitlements,
  orderItems,
  products,
  relationshipSetups,
} from "../../drizzle/schema";
import type { CommerceProductCode } from "../../shared/commerce";
import { getDb } from "../db";
import { decryptCommerceValue, encryptCommerceValue } from "./crypto";
import {
  createRelationshipInviteSession,
  type RelationshipInviteStart,
  type RelationshipInviteMode,
} from "./relationship-invite-service";
import {
  isRelationshipRolePairValid,
  type RelationType,
  type RelationshipRole,
} from "../../constants/coupleData";

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

type RelationshipProductCode = Extract<
  CommerceProductCode,
  "couple_love_deep" | "parent_child_deep"
>;
type SetupRelationType = Extract<RelationType, "연인" | "부부" | "부모-자녀">;

export type StoredRelationshipSetup = {
  entitlementId: number;
  productCode: RelationshipProductCode;
  relationType: SetupRelationType;
  /** A는 사용자가 설정 화면에서 선택한 첫 참여자이며, parent/child 순서가 아니다. */
  roleA: RelationshipRole;
  roleB: RelationshipRole;
};

function isRelationshipProductCode(
  value: CommerceProductCode,
): value is RelationshipProductCode {
  return value === "couple_love_deep" || value === "parent_child_deep";
}

function isSetupRelationForProduct(
  productCode: RelationshipProductCode,
  relationType: RelationType,
): relationType is SetupRelationType {
  return productCode === "couple_love_deep"
    ? relationType === "연인" || relationType === "부부"
    : relationType === "부모-자녀";
}

function parseRelationshipSetup(row: {
  entitlementId: number;
  productCode: string;
  configurationEncrypted: string;
}): StoredRelationshipSetup {
  try {
    if (
      row.productCode !== "couple_love_deep" &&
      row.productCode !== "parent_child_deep"
    )
      throw new Error("RELATIONSHIP_SETUP_INVALID");
    const productCode = row.productCode as RelationshipProductCode;
    const parsed = JSON.parse(
      decryptCommerceValue(row.configurationEncrypted),
    ) as Omit<StoredRelationshipSetup, "entitlementId" | "productCode">;
    if (
      !isSetupRelationForProduct(productCode, parsed.relationType) ||
      !isRelationshipRolePairValid(
        parsed.relationType,
        parsed.roleA,
        parsed.roleB,
      )
    ) {
      throw new Error("RELATIONSHIP_SETUP_INVALID");
    }
    return { entitlementId: row.entitlementId, productCode, ...parsed };
  } catch {
    throw new Error("RELATIONSHIP_SETUP_INVALID");
  }
}

async function assertRelationshipSetup(
  tx: any,
  input: {
    entitlementId: number;
    productCode: CommerceProductCode;
    relationType?: RelationType;
    roleA?: RelationshipRole;
    roleB?: RelationshipRole;
  },
) {
  if (!isRelationshipProductCode(input.productCode)) return null;
  const row = (
    await tx
      .select()
      .from(relationshipSetups)
      .where(eq(relationshipSetups.entitlementId, input.entitlementId))
      .limit(1)
  )[0];
  if (!row) throw new Error("RELATIONSHIP_SETUP_REQUIRED");
  const setup = parseRelationshipSetup(row);
  if (
    setup.productCode !== input.productCode ||
    setup.relationType !== input.relationType ||
    setup.roleA !== input.roleA ||
    setup.roleB !== input.roleB
  )
    throw new Error("RELATIONSHIP_SETUP_MISMATCH");
  return setup;
}

function getTokenSecret(): string {
  const secret = process.env.COMMERCE_EMAIL_HASH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("COMMERCE_EMAIL_HASH_SECRET is not configured securely");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function serialize(payload: EntitlementTokenPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${TOKEN_VERSION}.${encodedPayload}.${sign(encodedPayload)}`;
}

function parse(accessToken: string): EntitlementTokenPayload {
  const [version, encodedPayload, providedSignature, extra] =
    accessToken.split(".");
  if (
    version !== TOKEN_VERSION ||
    !encodedPayload ||
    !providedSignature ||
    extra !== undefined
  ) {
    throw new Error("INVALID_ENTITLEMENT_TOKEN");
  }
  const expectedSignature = sign(encodedPayload);
  const expected = Buffer.from(expectedSignature, "base64url");
  const provided = Buffer.from(providedSignature, "base64url");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("INVALID_ENTITLEMENT_TOKEN");
  }
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as EntitlementTokenPayload;
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
  /** 이용권 만료일을 넘는 시작 링크는 만들지 않는다. */
  expiresAt?: Date;
}): EntitlementStartGrant {
  if (!input.customerId) throw new Error("ENTITLEMENT_CUSTOMER_REQUIRED");
  const tokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
  const expiresAt =
    input.expiresAt && input.expiresAt.getTime() > Date.now()
      ? new Date(Math.min(tokenExpiresAt.getTime(), input.expiresAt.getTime()))
      : tokenExpiresAt;
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
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
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
  const [version, encodedPayload, providedSignature, extra] =
    input.accessToken.split(".");
  if (
    version !== "d1" ||
    !encodedPayload ||
    !providedSignature ||
    extra !== undefined
  ) {
    throw new Error("INVALID_ANALYSIS_DELIVERY_TOKEN");
  }
  const expected = Buffer.from(sign(encodedPayload), "base64url");
  const provided = Buffer.from(providedSignature, "base64url");
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    throw new Error("INVALID_ANALYSIS_DELIVERY_TOKEN");
  }
  const payload = JSON.parse(
    Buffer.from(encodedPayload, "base64url").toString("utf8"),
  ) as AnalysisDeliveryTokenPayload;
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

export async function configureRelationshipSetup(input: {
  accessToken: string;
  relationType: SetupRelationType;
  roleA: RelationshipRole;
  roleB: RelationshipRole;
}): Promise<StoredRelationshipSetup> {
  const token = parse(input.accessToken);
  if (
    !isRelationshipProductCode(token.productCode) ||
    !isSetupRelationForProduct(token.productCode, input.relationType) ||
    !isRelationshipRolePairValid(input.relationType, input.roleA, input.roleB)
  )
    throw new Error("RELATIONSHIP_SETUP_INVALID");
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  return (db as any).transaction(async (tx: any) => {
    const entitlement = (
      await tx
        .select({
          id: entitlements.id,
          status: entitlements.status,
          customerId: entitlements.customerId,
          usedCount: entitlements.usedCount,
          usageLimit: entitlements.usageLimit,
          validUntil: entitlements.validUntil,
          productCode: products.code,
        })
        .from(entitlements)
        .innerJoin(products, eq(entitlements.productId, products.id))
        .where(
          and(
            eq(entitlements.id, token.entitlementId),
            eq(entitlements.customerId, token.customerId),
          ),
        )
        .limit(1)
    )[0];
    if (
      !entitlement ||
      entitlement.productCode !== token.productCode ||
      entitlement.status !== "active" ||
      entitlement.usedCount >= entitlement.usageLimit ||
      (entitlement.validUntil && entitlement.validUntil.getTime() <= Date.now())
    )
      throw new Error("RELATIONSHIP_SETUP_ENTITLEMENT_UNAVAILABLE");
    const existing = (
      await tx
        .select()
        .from(relationshipSetups)
        .where(eq(relationshipSetups.entitlementId, entitlement.id))
        .limit(1)
    )[0];
    if (existing) {
      const saved = parseRelationshipSetup(existing);
      if (
        saved.relationType !== input.relationType ||
        saved.roleA !== input.roleA ||
        saved.roleB !== input.roleB
      )
        throw new Error("RELATIONSHIP_SETUP_ALREADY_CONFIRMED");
      return saved;
    }
    const configurationEncrypted = encryptCommerceValue(
      JSON.stringify({
        relationType: input.relationType,
        roleA: input.roleA,
        roleB: input.roleB,
      }),
    );
    try {
      await tx.insert(relationshipSetups).values({
        entitlementId: entitlement.id,
        productCode: token.productCode,
        configurationEncrypted,
      });
    } catch (error) {
      // Two tabs can confirm at the same moment. The unique entitlement key is the lock:
      // return the same saved value idempotently, but never let a different pair overwrite it.
      const concurrent = (
        await tx
          .select()
          .from(relationshipSetups)
          .where(eq(relationshipSetups.entitlementId, entitlement.id))
          .limit(1)
      )[0];
      if (!concurrent) throw error;
      const saved = parseRelationshipSetup(concurrent);
      if (
        saved.relationType !== input.relationType ||
        saved.roleA !== input.roleA ||
        saved.roleB !== input.roleB
      ) {
        throw new Error("RELATIONSHIP_SETUP_ALREADY_CONFIRMED");
      }
      return saved;
    }
    return {
      entitlementId: entitlement.id,
      productCode: token.productCode,
      relationType: input.relationType,
      roleA: input.roleA,
      roleB: input.roleB,
    };
  });
}

export async function getRelationshipSetupForGrant(input: {
  accessToken: string;
}): Promise<StoredRelationshipSetup | null> {
  const token = parse(input.accessToken);
  if (!isRelationshipProductCode(token.productCode)) return null;
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  // 서명된 grant만으로는 부족하다. 아직 활성·미소비 상태인 같은 고객·상품의
  // entitlement에 묶인 setup만 읽으며, 고객/주문/결과 본문은 반환하지 않는다.
  const row = (
    await db
      .select({
        setup: relationshipSetups,
        validUntil: entitlements.validUntil,
      })
      .from(relationshipSetups)
      .innerJoin(
        entitlements,
        eq(relationshipSetups.entitlementId, entitlements.id),
      )
      .innerJoin(products, eq(entitlements.productId, products.id))
      .where(
        and(
          eq(relationshipSetups.entitlementId, token.entitlementId),
          eq(entitlements.customerId, token.customerId),
          eq(entitlements.status, "active"),
          gt(entitlements.usageLimit, entitlements.usedCount),
          eq(products.code, token.productCode),
        ),
      )
      .limit(1)
  )[0];
  if (!row || (row.validUntil && row.validUntil.getTime() <= Date.now()))
    return null;
  return parseRelationshipSetup(row.setup);
}

/**
 * 정보 입력 완료 시 서버가 단 한 번만 entitlement를 소비한다.
 * 브라우저 플래그·결제 성공 URL은 권한 근거가 될 수 없으며 이 토큰과 DB 상태를 함께 만족해야 한다.
 */
export async function consumeEntitlementForAnalysisStart(input: {
  accessToken: string;
  productCode: CommerceProductCode;
  relationshipMode?: RelationshipInviteMode;
  relationType?: RelationType;
  /** 초대 방식의 새 세션은 설정 화면에서 확정한 역할쌍을 서버에 암호화해 고정한다. */
  roleA?: RelationshipRole;
  roleB?: RelationshipRole;
}): Promise<{
  entitlementId: number;
  analysisRunId: number;
  productCode: CommerceProductCode;
  status: "consumed";
  deliveryGrant: AnalysisDeliveryGrant;
  relationshipInvite: RelationshipInviteStart | null;
}> {
  const token = parse(input.accessToken);
  if (token.productCode !== input.productCode)
    throw new Error("ENTITLEMENT_PRODUCT_MISMATCH");
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
      .where(
        and(
          eq(entitlements.id, token.entitlementId),
          eq(entitlements.customerId, token.customerId),
        ),
      )
      .limit(1);
    const entitlement = rows[0];
    if (!entitlement || entitlement.productCode !== input.productCode) {
      throw new Error("ENTITLEMENT_NOT_FOUND");
    }
    if (
      entitlement.status !== "active" ||
      entitlement.usedCount >= entitlement.usageLimit
    ) {
      throw new Error("ENTITLEMENT_ALREADY_USED_OR_INACTIVE");
    }
    if (
      entitlement.validUntil &&
      entitlement.validUntil.getTime() <= Date.now()
    ) {
      await tx
        .update(entitlements)
        .set({ status: "expired" })
        .where(eq(entitlements.id, entitlement.entitlementId));
      throw new Error("ENTITLEMENT_EXPIRED");
    }
    // 부부·연인과 부모·자녀는 결제 후 한 번 확정한 server setup과 분석 시작 인수를 반드시 대조한다.
    await assertRelationshipSetup(tx, {
      entitlementId: entitlement.entitlementId,
      productCode: input.productCode,
      relationType: input.relationType,
      roleA: input.roleA,
      roleB: input.roleB,
    });

    const claimed = await tx
      .update(entitlements)
      .set({ status: "consumed", usedCount: entitlement.usedCount + 1 })
      .where(
        and(
          eq(entitlements.id, entitlement.entitlementId),
          eq(entitlements.status, "active"),
          gt(entitlements.usageLimit, entitlements.usedCount),
        ),
      );
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
    const relationshipInvite =
      input.relationshipMode === "invite_link"
        ? await createRelationshipInviteSession(tx, {
            analysisRunId,
            entitlementId: entitlement.entitlementId,
            orderId: entitlement.orderId ?? null,
            productId: entitlement.productId,
            productCode: input.productCode,
            relationType:
              input.relationType ??
              (() => {
                throw new Error("RELATIONSHIP_TYPE_REQUIRED");
              })(),
            ...(input.roleA && input.roleB
              ? { roleA: input.roleA, roleB: input.roleB }
              : {}),
          })
        : null;
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
      relationshipInvite,
    };
  });
}
