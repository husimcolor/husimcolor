import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";

import { customers, entitlements, products } from "../drizzle/schema";
import { encryptCommerceEmail, hashCommerceEmail } from "../server/commerce/crypto";
import { createEntitlementStartGrant } from "../server/commerce/entitlement-service";
import { getDb } from "../server/db";

function assertIsolatedE2ERuntime() {
  if (process.env.ZH_CN_UI_E2E_ALLOW !== "1") {
    throw new Error("ZH_CN_UI_E2E_ALLOW_REQUIRED");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("E2E_TEST_DATABASE_URL_REQUIRED");
  const parsed = new URL(databaseUrl);
  const localHost = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (!localHost || parsed.port !== "3308") {
    throw new Error("E2E_LOCAL_DATABASE_REQUIRED");
  }
}

async function main() {
  assertIsolatedE2ERuntime();
  const db = await getDb();
  if (!db) throw new Error("E2E_TEST_DATABASE_NOT_AVAILABLE");
  const suffix = randomUUID().slice(0, 8);
  const email = `zhcn-ui-e2e-${suffix}@invalid.example`;
  const productRows = await db.select().from(products).where(eq(products.code, "personal_deep")).limit(1);
  const product = productRows[0];
  if (!product) throw new Error("PERSONAL_DEEP_PRODUCT_NOT_FOUND");
  const customerInsert = await db.insert(customers).values({
    emailHash: hashCommerceEmail(email),
    emailEncrypted: encryptCommerceEmail(email),
    status: "active",
  });
  const customerId = Number(customerInsert[0].insertId);
  const validUntil = new Date(Date.now() + 60 * 60 * 1000);
  const entitlementInsert = await db.insert(entitlements).values({
    customerId,
    productId: product.id,
    status: "active",
    source: "admin",
    usageLimit: 1,
    usedCount: 0,
    validUntil,
  });
  const entitlementId = Number(entitlementInsert[0].insertId);
  const startGrant = createEntitlementStartGrant({
    entitlementId,
    customerId,
    productCode: "personal_deep",
    expiresAt: validUntil,
  });
  const result = {
    synthetic: true,
    emailDomain: "invalid.example",
    customerId,
    entitlementId,
    startGrant,
  };
  const output = process.env.ZH_CN_UI_E2E_SEED_OUTPUT ?? "/tmp/zh-cn-ui-e2e-seed.json";
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({
    synthetic: true,
    customerId,
    entitlementId,
    productCode: startGrant.productCode,
    expiresAt: startGrant.expiresAt,
    accessTokenCreated: Boolean(startGrant.accessToken),
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
