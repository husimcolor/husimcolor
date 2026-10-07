/**
 * Vercel Preview는 배포 런타임의 NODE_ENV가 production일 수 있으므로,
 * Preview 식별값과 명시적 테스트 모드가 모두 있어야만 테스트 결제를 허용한다.
 * Production은 테스트 결제·승인·권한 부여를 항상 차단한다. 심사용 경로는
 * 개발 또는 Preview에서만 유지하며 운영 도메인으로 노출되지 않는다.
 */
export function isExplicitTestPaymentRuntime(environment = process.env): boolean {
  if (environment.VERCEL_ENV === "production") return false;
  const isPreviewDeployment = environment.VERCEL_ENV === "preview";
  const isLocalOrTestRuntime = !environment.VERCEL && !environment.VERCEL_URL && environment.NODE_ENV !== "production";
  const previewOrLocalTest = (isPreviewDeployment || isLocalOrTestRuntime)
    && environment.COMMERCE_TEST_MODE === "true";
  return previewOrLocalTest;
}
