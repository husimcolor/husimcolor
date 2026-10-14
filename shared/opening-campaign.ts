import { isPaidAnalysisProduct } from "./commerce";

/**
 * 공개 오픈 기념 할인은 한국 표준시 기준 2026-10-30 23:59:59까지다.
 * 서버의 쿠폰 유효기간도 같은 종료 시각을 사용해야 하며, 이 파일은 노출/자동 숨김만 담당한다.
 */
/** 결제 안내 진입 시 적용되어 정가와 할인가를 함께 보여 주는 공개 캠페인 코드다. */
export const OPENING_CAMPAIGN_COUPON_CODE = "OCT20OPEN2026";
export const OPENING_CAMPAIGN_ENDS_AT_KST = "2026-10-30T23:59:59+09:00";
export const OPENING_CAMPAIGN_DISCOUNT_PERCENT = 20;

/**
 * 공개 카드용 정가·행사가. 실제 결제 시에는 서버가 활성 쿠폰을 다시 검증한다.
 * 이 값은 OCT20OPEN2026의 20% 적용 결과와 함께 회귀 테스트로 고정한다.
 */
export const OPENING_CAMPAIGN_DISPLAY_PRICES = {
  personal_deep: { listAmountKrw: 29_000, finalAmountKrw: 23_200 },
  couple_love_deep: { listAmountKrw: 59_000, finalAmountKrw: 47_200 },
  parent_child_deep: { listAmountKrw: 39_000, finalAmountKrw: 31_200 },
} as const;

export function isOpeningCampaignActive(now: Date = new Date()): boolean {
  return now.getTime() <= new Date(OPENING_CAMPAIGN_ENDS_AT_KST).getTime();
}

export function isOpeningCampaignEligibleProduct(productCode: string | undefined): boolean {
  return Boolean(productCode && isPaidAnalysisProduct(productCode));
}

export function isOpeningCampaignAvailable(productCode: string | undefined, now: Date = new Date()): boolean {
  return isOpeningCampaignEligibleProduct(productCode) && isOpeningCampaignActive(now);
}
