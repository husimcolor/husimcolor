import { randomUUID } from "node:crypto";

import {
  calculateDiscountedAmount,
  getCommerceProduct,
  type CommercePaymentOutcome,
  type CommerceProductCode,
} from "../../shared/commerce";
import {
  encryptCommerceEmail,
  hashCommerceEmail,
  normalizeCommerceEmail,
} from "./crypto";

export type TestCheckout = {
  orderNumber: string;
  productCode: CommerceProductCode;
  customerEmailHash: string;
  customerEmailEncrypted: string;
  listAmountKrw: number;
  discountAmountKrw: number;
  finalAmountKrw: number;
  status: "pending" | "paid" | "failed" | "cancelled";
  paymentId?: string;
  entitlementId?: string;
};

export type TestPaymentCompletion = {
  orderNumber: string;
  paymentId: string;
  status: TestCheckout["status"];
  entitlementId?: string;
  alreadyProcessed: boolean;
};

function assertCheckoutEmail(value: string): string {
  const normalized = normalizeCommerceEmail(value);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("INVALID_CHECKOUT_EMAIL");
  }
  return normalized;
}

/**
 * 토스 심사 전에는 실제 금액 이동 없이 상태 전이와 권한 부여를 검증한다.
 * 이 구현은 메모리 전용이며 NODE_ENV=production에서 tRPC로 노출되지 않는다.
 */
export class TestPaymentService {
  private readonly checkouts = new Map<string, TestCheckout>();
  private readonly paymentIdempotency = new Map<string, TestPaymentCompletion>();

  createCheckout(input: {
    productCode: CommerceProductCode;
    email: string;
    idempotencyKey: string;
    discountType?: "fixed" | "percent";
    discountValue?: number;
  }): TestCheckout {
    const product = getCommerceProduct(input.productCode);
    if (!product || !product.active) throw new Error("PRODUCT_NOT_AVAILABLE");
    if (!product.requiresPayment || product.amountKrw === null) {
      throw new Error("TEST_CHECKOUT_REQUIRES_A_PAID_ANALYSIS_PRODUCT");
    }

    const email = assertCheckoutEmail(input.email);
    if (!input.idempotencyKey || input.idempotencyKey.length < 16) {
      throw new Error("INVALID_CHECKOUT_IDEMPOTENCY_KEY");
    }

    const existing = this.checkouts.get(input.idempotencyKey);
    if (existing) return existing;

    const amount = calculateDiscountedAmount({
      listAmountKrw: product.amountKrw,
      discountType: input.discountType,
      discountValue: input.discountValue,
    });
    const checkout: TestCheckout = {
      orderNumber: `TEST-${randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()}`,
      productCode: product.code,
      customerEmailHash: hashCommerceEmail(email),
      customerEmailEncrypted: encryptCommerceEmail(email),
      listAmountKrw: product.amountKrw,
      discountAmountKrw: amount.discountAmountKrw,
      finalAmountKrw: amount.finalAmountKrw,
      status: "pending",
    };
    this.checkouts.set(input.idempotencyKey, checkout);
    return checkout;
  }

  completePayment(input: {
    checkoutIdempotencyKey: string;
    paymentIdempotencyKey: string;
    outcome: CommercePaymentOutcome;
    amountKrw: number;
  }): TestPaymentCompletion {
    const existingCompletion = this.paymentIdempotency.get(input.paymentIdempotencyKey);
    if (existingCompletion) {
      return { ...existingCompletion, alreadyProcessed: true };
    }

    const checkout = this.checkouts.get(input.checkoutIdempotencyKey);
    if (!checkout) throw new Error("TEST_ORDER_NOT_FOUND");
    if (checkout.finalAmountKrw !== input.amountKrw) {
      throw new Error("ORDER_AMOUNT_MISMATCH");
    }

    const paymentId = `testpay_${randomUUID().replace(/-/g, "")}`;
    if (checkout.status === "paid") {
      const completion: TestPaymentCompletion = {
        orderNumber: checkout.orderNumber,
        paymentId: checkout.paymentId ?? paymentId,
        status: "paid",
        entitlementId: checkout.entitlementId,
        alreadyProcessed: true,
      };
      this.paymentIdempotency.set(input.paymentIdempotencyKey, completion);
      return completion;
    }
    if (checkout.status !== "pending") {
      throw new Error("TEST_ORDER_ALREADY_TERMINAL");
    }

    if (input.outcome === "success") {
      checkout.status = "paid";
      checkout.paymentId = paymentId;
      checkout.entitlementId = `testent_${randomUUID().replace(/-/g, "")}`;
    } else {
      checkout.status = input.outcome === "failed" ? "failed" : "cancelled";
      checkout.paymentId = paymentId;
    }

    const completion: TestPaymentCompletion = {
      orderNumber: checkout.orderNumber,
      paymentId,
      status: checkout.status,
      entitlementId: checkout.entitlementId,
      alreadyProcessed: false,
    };
    this.paymentIdempotency.set(input.paymentIdempotencyKey, completion);
    return completion;
  }

  issueFreeGrant(productCode: CommerceProductCode): {
    productCode: CommerceProductCode;
    source: "free";
    orderCreated: false;
    paymentCreated: false;
    entitlementId: string;
  } {
    const product = getCommerceProduct(productCode);
    if (!product || !product.active || product.requiresPayment) {
      throw new Error("FREE_GRANT_REQUIRES_AN_ACTIVE_FREE_PRODUCT");
    }

    return {
      productCode,
      source: "free",
      orderCreated: false,
      paymentCreated: false,
      entitlementId: `testfree_${randomUUID().replace(/-/g, "")}`,
    };
  }
}

export const testPaymentService = new TestPaymentService();
