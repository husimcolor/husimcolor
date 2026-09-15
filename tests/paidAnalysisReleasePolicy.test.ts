import { describe, expect, it } from "vitest";

import { assertPublicPaidAnalysisCheckout, isPublicPaidAnalysisEnabled } from "../server/commerce/release-policy";

describe("유료 분석 공개 상태 정책", () => {
  it("개발 환경에서는 테스트 결제·검사 경로를 유지한다", () => {
    expect(isPublicPaidAnalysisEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(() => assertPublicPaidAnalysisCheckout("personal_deep", { NODE_ENV: "development" })).not.toThrow();
  });

  it("Production은 명시적 활성화 전 유료 분석 checkout을 막는다", () => {
    expect(isPublicPaidAnalysisEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(() => assertPublicPaidAnalysisCheckout("couple_love_deep", { NODE_ENV: "production" })).toThrow("PAID_ANALYSIS_PREPARING_FOR_LAUNCH");
  });

  it("명시적 테스트 모드의 Vercel Preview에서만 유료 분석 테스트 주문을 허용한다", () => {
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "production", VERCEL_ENV: "preview", COMMERCE_TEST_MODE: "true" };
    expect(isPublicPaidAnalysisEnabled(environment)).toBe(true);
    expect(() => assertPublicPaidAnalysisCheckout("personal_deep", environment)).not.toThrow();
    expect(isPublicPaidAnalysisEnabled({ NODE_ENV: "production", VERCEL_ENV: "preview" })).toBe(false);
  });

  it("최종 결제 QA 후 설정 하나로 유료 분석 공개를 열 수 있다", () => {
    const environment: NodeJS.ProcessEnv = { NODE_ENV: "production", COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED: "true" };
    expect(isPublicPaidAnalysisEnabled(environment)).toBe(true);
    expect(() => assertPublicPaidAnalysisCheckout("parent_child_deep", environment)).not.toThrow();
  });
});
