/**
 * 공통 상품 정의. UI 가격 표시는 이 정의를 참고할 수 있지만,
 * 실제 주문 금액과 권한 부여의 근거는 서버 DB의 가격 스냅샷이다.
 */
export const COMMERCE_PRODUCTS = [
  {
    code: "free_color_trial",
    name: "무료 컬러 체험",
    fulfillmentType: "analysis",
    requiresPayment: false,
    amountKrw: 0,
    active: true,
  },
  {
    code: "personal_deep",
    name: "컬러 + 심리카드 개인 심화분석",
    fulfillmentType: "analysis",
    requiresPayment: true,
    amountKrw: 29_000,
    active: true,
  },
  {
    code: "couple_love_deep",
    name: "부부 · 연인 관계 심화분석",
    fulfillmentType: "analysis",
    requiresPayment: true,
    amountKrw: 59_000,
    active: true,
  },
  {
    code: "parent_child_deep",
    name: "부모 · 자녀 관계 심화분석",
    fulfillmentType: "analysis",
    requiresPayment: true,
    amountKrw: 39_000,
    active: true,
  },
  {
    code: "friend_relationship",
    name: "친구 관계 분석",
    fulfillmentType: "analysis",
    requiresPayment: false,
    amountKrw: 0,
    active: true,
  },
  {
    code: "personal_coaching",
    name: "1:1 프리미엄 컬러심리 코칭",
    fulfillmentType: "coaching",
    requiresPayment: true,
    regularAmountKrw: 120_000,
    amountKrw: 100_000,
    active: true,
  },
  {
    code: "couple_coaching",
    name: "부부 · 커플 관계 코칭",
    fulfillmentType: "coaching",
    requiresPayment: true,
    regularAmountKrw: 250_000,
    amountKrw: 180_000,
    active: true,
  },
  {
    code: "relationship_coaching",
    name: "기타 관계 코칭",
    fulfillmentType: "coaching",
    requiresPayment: true,
    /** 판매가는 상품 운영 정책 확정 후 DB 가격 버전으로 활성화한다. */
    amountKrw: 0,
    active: false,
  },
] as const;

export type CommerceProduct = (typeof COMMERCE_PRODUCTS)[number];
export type CommerceProductCode = CommerceProduct["code"];

export const PAID_ANALYSIS_PRODUCT_CODES = [
  "personal_deep",
  "couple_love_deep",
  "parent_child_deep",
] as const satisfies readonly CommerceProductCode[];

export type CommercePaymentProvider = "test" | "toss_pg" | "google_play";
export type CommercePaymentOutcome = "success" | "failed" | "cancelled";

export function getCommerceProduct(code: string): CommerceProduct | undefined {
  return COMMERCE_PRODUCTS.find((product) => product.code === code);
}

export function isFreeCommerceProduct(code: string): boolean {
  const product = getCommerceProduct(code);
  return Boolean(product && !product.requiresPayment);
}

export function isPaidAnalysisProduct(code: string): boolean {
  return (PAID_ANALYSIS_PRODUCT_CODES as readonly string[]).includes(code);
}

export function calculateDiscountedAmount(input: {
  listAmountKrw: number;
  discountType?: "fixed" | "percent";
  discountValue?: number;
}): { discountAmountKrw: number; finalAmountKrw: number } {
  const listAmountKrw = Math.max(0, Math.trunc(input.listAmountKrw));
  const discountValue = Math.max(0, Math.trunc(input.discountValue ?? 0));
  const rawDiscount =
    input.discountType === "percent"
      ? Math.floor((listAmountKrw * Math.min(discountValue, 100)) / 100)
      : discountValue;
  const discountAmountKrw = Math.min(listAmountKrw, rawDiscount);

  return {
    discountAmountKrw,
    finalAmountKrw: listAmountKrw - discountAmountKrw,
  };
}

export function isTerminalPaymentOutcome(outcome: CommercePaymentOutcome): boolean {
  return outcome === "failed" || outcome === "cancelled";
}
