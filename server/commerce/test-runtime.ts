/**
 * Vercel Preview는 배포 런타임의 NODE_ENV가 production일 수 있으므로,
 * Preview 식별값과 명시적 테스트 모드가 모두 있어야만 테스트 결제를 허용한다.
 * Production은 기본 차단이다. 운영 DB에 테스트 주문을 허용하려면 공개 gate와
 * Production 테스트 플래그를 모두 명시해야 하며, 테스트 Toss 키 검증도 별도로 통과해야 한다.
 */
export function isExplicitTestPaymentRuntime(environment = process.env): boolean {
  const isPreviewDeployment = environment.VERCEL_ENV === "preview";
  const isLocalOrTestRuntime = environment.NODE_ENV !== "production";
  const previewOrLocalTest = (isPreviewDeployment || isLocalOrTestRuntime)
    && environment.COMMERCE_TEST_MODE === "true";
  const explicitlyAuthorizedProductionTest = environment.VERCEL_ENV === "production"
    && environment.NODE_ENV === "production"
    && environment.COMMERCE_PRODUCTION_TEST_MODE === "true"
    && environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true"
    // Production live gate가 열리면 공개 test-key checkout은 즉시 비활성화한다.
    // 테스트 주문은 기존 isTest=true 원장으로 남지만 신규 운영 결제와 섞이지 않는다.
    && environment.COMMERCE_LIVE_PAYMENT_ENABLED !== "true";
  return previewOrLocalTest || explicitlyAuthorizedProductionTest;
}
