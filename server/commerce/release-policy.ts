import { isPaidAnalysisProduct, type CommerceProductCode } from "../../shared/commerce";
import { isExplicitTestPaymentRuntime } from "./test-runtime";

function isVercelRuntime(environment: NodeJS.ProcessEnv): boolean {
  return environment.VERCEL === "1" || Boolean(environment.VERCEL_URL) || Boolean(environment.VERCEL_ENV);
}

/**
 * 운영 공개 상태는 결제 키나 상품 active 상태와 분리한다.
 * 승인 전 Production은 기본적으로 닫혀 있으며, 최종 실결제 QA가 끝난 뒤에만
 * 공개 gate와 별도의 실결제 QA 승인값을 모두 명시적으로 확인한 뒤에만 연다.
 */
export function isPublicPaidAnalysisEnabled(environment = process.env): boolean {
  if (isExplicitTestPaymentRuntime(environment) && environment.VERCEL_ENV === "preview") return true;
  // Prebuilt functions can omit NODE_ENV or VERCEL_ENV at runtime. Any Vercel
  // deployment without the explicit Production identity must fail closed rather
  // than accidentally treat itself as a local development server.
  if (isVercelRuntime(environment)) {
    return environment.VERCEL_ENV === "production"
      && environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true"
      && environment.COMMERCE_REAL_PAYMENT_QA_APPROVED === "true";
  }
  if (environment.NODE_ENV !== "production") return true;
  return environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true"
    && environment.COMMERCE_REAL_PAYMENT_QA_APPROVED === "true";
}

export function assertPublicPaidAnalysisCheckout(
  productCode: CommerceProductCode,
  environment = process.env,
): void {
  if (isPaidAnalysisProduct(productCode) && !isPublicPaidAnalysisEnabled(environment)) {
    throw new Error("PAID_ANALYSIS_PREPARING_FOR_LAUNCH");
  }
}
