import { describe, expect, it } from "vitest";
import {
  COMMERCE_PRODUCTS,
  calculateDiscountedAmount,
  getCommerceProduct,
  isFreeCommerceProduct,
  isPaidAnalysisProduct,
} from "../shared/commerce";

describe("commerce product catalog", () => {
  it("keeps the confirmed analysis products and server price baseline", () => {
    expect(COMMERCE_PRODUCTS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "free_color_trial", amountKrw: 0, requiresPayment: false }),
        expect.objectContaining({ code: "personal_deep", amountKrw: 29_000, requiresPayment: true }),
        expect.objectContaining({ code: "couple_love_deep", amountKrw: 59_000, requiresPayment: true }),
        expect.objectContaining({ code: "parent_child_deep", amountKrw: 39_000, requiresPayment: true }),
        expect.objectContaining({ code: "friend_relationship", amountKrw: 0, requiresPayment: false }),
      ]),
    );
    expect(getCommerceProduct("personal_deep")?.name).toBe("컬러 + 심리카드 개인 심화분석");
    expect(isPaidAnalysisProduct("personal_deep")).toBe(true);
    expect(isPaidAnalysisProduct("friend_relationship")).toBe(false);
    expect(isFreeCommerceProduct("free_color_trial")).toBe(true);
    expect(isFreeCommerceProduct("friend_relationship")).toBe(true);
  });

  it("caps discounts at the server price and never produces a negative total", () => {
    expect(calculateDiscountedAmount({ listAmountKrw: 29_000, discountType: "percent", discountValue: 10 }))
      .toEqual({ discountAmountKrw: 2_900, finalAmountKrw: 26_100 });
    expect(calculateDiscountedAmount({ listAmountKrw: 29_000, discountType: "fixed", discountValue: 50_000 }))
      .toEqual({ discountAmountKrw: 29_000, finalAmountKrw: 0 });
  });

  it("keeps coaching test-checkout prices in the shared catalog", () => {
    expect(getCommerceProduct("personal_coaching")).toMatchObject({
      fulfillmentType: "coaching",
      requiresPayment: true,
      regularAmountKrw: 120_000,
      amountKrw: 100_000,
      active: true,
    });
    expect(getCommerceProduct("couple_coaching")).toMatchObject({
      fulfillmentType: "coaching",
      requiresPayment: true,
      regularAmountKrw: 250_000,
      amountKrw: 180_000,
      active: true,
    });
  });
});
