import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getTossCardReviewConfig,
  isTossCardReviewEnabled,
} from "../server/commerce/toss-card-review";

describe("coaching Toss card-review presentation flow", () => {
  afterEach(() => vi.unstubAllEnvs());

  const previewEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: "production",
    VERCEL_ENV: "preview",
    COMMERCE_TEST_MODE: "true",
    TOSS_TEST_CLIENT_KEY: "test_ck_preview_review",
  };

  it("returns fixed non-persistent review data for both coaching products", () => {
    expect(getTossCardReviewConfig("personal_coaching", previewEnvironment)).toMatchObject({
      productCode: "personal_coaching",
      productName: "1:1 프리미엄 컬러심리 코칭",
      amountKrw: 100_000,
      tossClientKey: "test_ck_preview_review",
      customerEmail: "review@husimcolor.com",
    });
    expect(getTossCardReviewConfig("couple_coaching", previewEnvironment)).toMatchObject({
      productCode: "couple_coaching",
      productName: "부부·커플 관계 코칭",
      amountKrw: 180_000,
      tossClientKey: "test_ck_preview_review",
      customerEmail: "review@husimcolor.com",
    });
  });

  it("uses a fresh review order number without the order service or a Toss secret key", () => {
    const first = getTossCardReviewConfig("personal_coaching", previewEnvironment);
    const second = getTossCardReviewConfig("personal_coaching", previewEnvironment);

    expect(first.orderNumber).toMatch(/^HC-REVIEW-PERSONAL-COACHING-[a-f0-9]{20}$/);
    expect(first.orderNumber).not.toBe(second.orderNumber);
    expect(isTossCardReviewEnabled({
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      COMMERCE_TOSS_CARD_REVIEW_ENABLED: "true",
      TOSS_TEST_CLIENT_KEY: "test_ck_production_review",
    })).toBe(true);
  });

  it("rejects a non-review product before producing presentation data", () => {
    expect(() => getTossCardReviewConfig("friend_relationship", previewEnvironment)).toThrow(
      "TOSS_CARD_REVIEW_REQUIRES_PAID_PRODUCT",
    );
  });
});
