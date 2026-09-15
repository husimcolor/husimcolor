/**
 * Vercel Preview는 배포 런타임의 NODE_ENV가 production일 수 있으므로,
 * Preview 식별값과 명시적 테스트 모드가 모두 있어야만 테스트 결제를 허용한다.
 * Production은 항상 차단한다.
 */
export function isExplicitTestPaymentRuntime(environment = process.env): boolean {
  const isPreviewDeployment = environment.VERCEL_ENV === "preview";
  const isLocalOrTestRuntime = environment.NODE_ENV !== "production";
  return (isPreviewDeployment || isLocalOrTestRuntime) && environment.COMMERCE_TEST_MODE === "true";
}
