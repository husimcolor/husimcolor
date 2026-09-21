import { randomUUID } from "node:crypto";

import { getCommerceProduct, isPaidAnalysisProduct, type CommerceProductCode } from "../../shared/commerce";

type CardReviewProductCode = Extract<
  CommerceProductCode,
  "personal_deep" | "couple_love_deep" | "parent_child_deep"
>;

function isCardReviewProductCode(value: CommerceProductCode): value is CardReviewProductCode {
  return isPaidAnalysisProduct(value);
}

function hasTestClientKey(environment: NodeJS.ProcessEnv): boolean {
  return Boolean(environment.TOSS_TEST_CLIENT_KEY?.trim().startsWith("test_ck_"));
}

/**
 * Toss card-review is intentionally separate from checkout and approval.
 * Preview uses the existing test runtime. Production needs an additional,
 * explicit flag and only the public Toss test client key; it never needs the
 * secret key and never calls an approval endpoint.
 */
export function isTossCardReviewEnabled(environment: NodeJS.ProcessEnv = process.env): boolean {
  const previewEnabled = environment.VERCEL_ENV === "preview" && environment.COMMERCE_TEST_MODE === "true";
  const productionReviewEnabled = environment.VERCEL_ENV === "production"
    && environment.COMMERCE_TOSS_CARD_REVIEW_ENABLED === "true";

  return hasTestClientKey(environment) && (previewEnabled || productionReviewEnabled);
}

function requireReviewClientKey(environment: NodeJS.ProcessEnv): string {
  const clientKey = environment.TOSS_TEST_CLIENT_KEY?.trim();
  if (!clientKey || !clientKey.startsWith("test_ck_")) {
    throw new Error("TOSS_CARD_REVIEW_CLIENT_KEY_NOT_CONFIGURED");
  }
  return clientKey;
}

function createReviewOrderNumber(productCode: CardReviewProductCode): string {
  const productSegment = productCode.replace(/_/g, "-").toUpperCase();
  const randomSegment = randomUUID().replace(/-/g, "").slice(0, 20);
  return `HC-REVIEW-${productSegment}-${randomSegment}`;
}

/**
 * Produces only non-persistent checkout presentation data. This function must
 * remain free of database, order-service, payment confirmation, entitlement,
 * analysis, document and booking dependencies.
 */
export function getTossCardReviewConfig(
  productCode: CommerceProductCode,
  environment: NodeJS.ProcessEnv = process.env,
): {
  productCode: CardReviewProductCode;
  productName: string;
  amountKrw: number;
  orderNumber: string;
  tossClientKey: string;
  customerEmail: "review@husimcolor.com";
} {
  if (!isCardReviewProductCode(productCode)) {
    throw new Error("TOSS_CARD_REVIEW_REQUIRES_PAID_ANALYSIS_PRODUCT");
  }
  if (!isTossCardReviewEnabled(environment)) {
    throw new Error("TOSS_CARD_REVIEW_DISABLED");
  }

  const product = getCommerceProduct(productCode);
  if (!product || !product.requiresPayment || !product.amountKrw) {
    throw new Error("TOSS_CARD_REVIEW_PRODUCT_NOT_AVAILABLE");
  }

  return {
    productCode,
    productName: product.name,
    amountKrw: product.amountKrw,
    orderNumber: createReviewOrderNumber(productCode),
    tossClientKey: requireReviewClientKey(environment),
    customerEmail: "review@husimcolor.com",
  };
}
