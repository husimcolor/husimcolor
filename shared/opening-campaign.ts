import { isPaidAnalysisProduct } from "./commerce";

/**
 * 공개 오픈 기념 할인은 한국 표준시 기준 2026-10-30 23:59:59까지다.
 * 서버의 쿠폰 유효기간도 같은 종료 시각을 사용해야 하며, 이 파일은 노출/자동 숨김만 담당한다.
 */
/** Internal campaign identifier; customers apply it through the promotion button. */
export const OPENING_CAMPAIGN_COUPON_CODE = "OCT20OPEN2026";
export const OPENING_CAMPAIGN_ENDS_AT_KST = "2026-10-30T23:59:59+09:00";
export const OPENING_CAMPAIGN_DISCOUNT_PERCENT = 20;

export function isOpeningCampaignActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(OPENING_CAMPAIGN_ENDS_AT_KST).getTime();
}

export function isOpeningCampaignEligibleProduct(productCode: string | undefined): boolean {
  return Boolean(productCode && isPaidAnalysisProduct(productCode));
}

export function isOpeningCampaignAvailable(productCode: string | undefined, now: Date = new Date()): boolean {
  return isOpeningCampaignEligibleProduct(productCode) && isOpeningCampaignActive(now);
}
