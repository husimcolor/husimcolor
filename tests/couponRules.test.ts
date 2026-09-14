import { describe, expect, it } from "vitest";
import { calculateDiscountedAmount } from "../shared/commerce";
import { normalizeCouponCode } from "../server/commerce/coupon-service";

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
});
