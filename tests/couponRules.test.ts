import { describe, expect, it } from "vitest";
import { calculateDiscountedAmount } from "../shared/commerce";
import { assertCouponCustomerEligibility, normalizeCouponCode } from "../server/commerce/coupon-service";

describe("coupon rules", () => {
  it("normalizes customer-entered coupon codes without changing their semantic value", () => {
    expect(normalizeCouponCode("  welcome-2026  ")).toBe("WELCOME-2026");
  });

  it("applies fixed and percent discounts from the server baseline and caps at the order amount", () => {
    expect(calculateDiscountedAmount({ listAmountKrw: 59_000, discountType: "percent", discountValue: 25 }))
      .toEqual({ discountAmountKrw: 14_750, finalAmountKrw: 44_250 });
    expect(calculateDiscountedAmount({ listAmountKrw: 39_000, discountType: "fixed", discountValue: 39_000 }))
      .toEqual({ discountAmountKrw: 39_000, finalAmountKrw: 0 });
  });

  it("allows an unbound public campaign coupon for guest preflight", () => {
    expect(() => assertCouponCustomerEligibility({ assignedCustomerId: null })).not.toThrow();
  });

  it("requires the designated common customer before a targeted coupon can be quoted or reserved", () => {
    expect(() => assertCouponCustomerEligibility({ assignedCustomerId: 41 })).toThrow("COUPON_CUSTOMER_CONTEXT_REQUIRED");
    expect(() => assertCouponCustomerEligibility({ assignedCustomerId: 41, customerId: 42 })).toThrow("COUPON_ASSIGNED_TO_ANOTHER_CUSTOMER");
    expect(() => assertCouponCustomerEligibility({ assignedCustomerId: 41, customerId: 41 })).not.toThrow();
  });
});
