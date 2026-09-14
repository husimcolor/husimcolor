import { isPaidAnalysisProduct, type CommerceProductCode } from "../../shared/commerce";

/**
 * 운영 공개 상태는 결제 키나 상품 active 상태와 분리한다.
 * 승인 전 Production은 기본적으로 닫혀 있으며, 최종 실결제 QA가 끝난 뒤에만
 * COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED=true로 명시적으로 연다.
 */
export function isPublicPaidAnalysisEnabled(environment = process.env): boolean {
  if (environment.NODE_ENV !== "production") return true;
  return environment.COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED === "true";
}

export function assertPublicPaidAnalysisCheckout(
  productCode: CommerceProductCode,
  environment = process.env,
): void {
  if (isPaidAnalysisProduct(productCode) && !isPublicPaidAnalysisEnabled(environment)) {
    throw new Error("PAID_ANALYSIS_PREPARING_FOR_LAUNCH");
  }
}
