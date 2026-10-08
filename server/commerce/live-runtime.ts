/**
 * 라이브 결제는 Production에서만, 공개 유료 분석 gate와 별도 라이브 gate가 모두
 * 명시적으로 열린 경우에만 실행한다. 테스트키 실행 여부와 독립적이다.
 */
export function isExplicitLivePaymentRuntime(environment = process.env): boolean {
  return environment.VERCEL_ENV === "production"
    && environment.NODE_ENV === "production"
    && environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true"
    && environment.COMMERCE_LIVE_PAYMENT_ENABLED === "true";
}
