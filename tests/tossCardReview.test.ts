import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getTossCardReviewConfig,
  isTossCardReviewEnabled,
} from "../server/commerce/toss-card-review";

describe("Toss card-review presentation flow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("enables Preview card review with only the public Toss test client key", () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
      COMMERCE_TEST_MODE: "true",
      TOSS_TEST_CLIENT_KEY: "test_ck_preview_review",
    };

    expect(isTossCardReviewEnabled(environment)).toBe(true);
    expect(getTossCardReviewConfig("personal_deep", environment)).toMatchObject({
      productCode: "personal_deep",
      productName: "컬러 + 심리카드 개인 심화분석",
      amountKrw: 29_000,
      tossClientKey: "test_ck_preview_review",
      customerEmail: "review@husimcolor.com",
    });
  });

  it("keeps Production card review closed even when stale review flags remain", () => {
    const productionEnvironment: NodeJS.ProcessEnv = {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      TOSS_TEST_CLIENT_KEY: "test_ck_production_review",
      COMMERCE_TEST_MODE: "true",
      COMMERCE_PRODUCTION_TEST_MODE: "true",
      COMMERCE_TOSS_CARD_REVIEW_ENABLED: "true",
      COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED: "true",
    };

    expect(isTossCardReviewEnabled(productionEnvironment)).toBe(false);
    expect(() => getTossCardReviewConfig("couple_love_deep", productionEnvironment)).toThrow("TOSS_CARD_REVIEW_DISABLED");
  });

  it("returns a fresh non-persistent review order number and preserves fixed catalog prices", () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      VERCEL_ENV: "preview",
      COMMERCE_TEST_MODE: "true",
      TOSS_TEST_CLIENT_KEY: "test_ck_preview_review",
    };
    const first = getTossCardReviewConfig("parent_child_deep", environment);
    const second = getTossCardReviewConfig("parent_child_deep", environment);

    expect(first.amountKrw).toBe(39_000);
    expect(first.orderNumber).toMatch(/^HC-REVIEW-PARENT-CHILD-DEEP-[a-f0-9]{20}$/);
    expect(first.orderNumber).not.toBe(second.orderNumber);
  });

  it("rejects free products and disabled review mode before any checkout operation", () => {
    const environment: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      VERCEL_ENV: "preview",
      COMMERCE_TEST_MODE: "true",
      TOSS_TEST_CLIENT_KEY: "test_ck_preview_review",
    };

    expect(() => getTossCardReviewConfig("friend_relationship", environment)).toThrow(
      "TOSS_CARD_REVIEW_REQUIRES_PAID_PRODUCT",
    );
    expect(() => getTossCardReviewConfig("personal_deep", { NODE_ENV: "test" })).toThrow("TOSS_CARD_REVIEW_DISABLED");
  });
});
