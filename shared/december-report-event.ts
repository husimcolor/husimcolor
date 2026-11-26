import { calculateDiscountedAmount } from "./commerce";

export const DECEMBER_REPORT_EVENT_KEY = "december-report-2026";
export const DECEMBER_REPORT_STARTS_AT = new Date("2026-11-30T15:00:00.000Z");
export const DECEMBER_REPORT_ENDS_AT = new Date("2026-12-31T15:00:00.000Z");
export const DECEMBER_REPORT_OFFERS = [
  { productCode: "personal_deep", name: "개인 심화분석", couponCode: "DEC2026-PERSONAL", listAmountKrw: 29_000, finalAmountKrw: 9_900, discountType: "fixed", discountValue: 19_100 },
  { productCode: "couple_love_deep", name: "부부·연인 관계 심화분석", couponCode: "DEC2026-COUPLE", listAmountKrw: 59_000, finalAmountKrw: 23_600, discountType: "percent", discountValue: 60 },
  { productCode: "parent_child_deep", name: "부모·자녀 관계 심화분석", couponCode: "DEC2026-PARENT-CHILD", listAmountKrw: 39_000, finalAmountKrw: 15_600, discountType: "percent", discountValue: 60 },
] as const;

export type DecemberReportProductCode = typeof DECEMBER_REPORT_OFFERS[number]["productCode"];
export type DecemberReportOfferState = "available" | "issued" | "reserved" | "used" | "expired";
export type DecemberReportStatus = {
  active: boolean;
  serverNow: Date;
  startsAt: Date;
  endsAt: Date;
  offers: Array<(typeof DECEMBER_REPORT_OFFERS)[number] & { state: DecemberReportOfferState }>;
};

export function isDecemberReportEventActive(now: Date = new Date()): boolean {
  return now.getTime() >= DECEMBER_REPORT_STARTS_AT.getTime() && now.getTime() < DECEMBER_REPORT_ENDS_AT.getTime();
}
export function getDecemberReportOffer(productCode: string) {
  return DECEMBER_REPORT_OFFERS.find((offer) => offer.productCode === productCode);
}
export function getDecemberReportOfferByCoupon(code: string) {
  return DECEMBER_REPORT_OFFERS.find((offer) => offer.couponCode === code.trim().toUpperCase());
}
export function assertDecemberReportPrice(productCode: string, amountKrw: number): void {
  const offer = getDecemberReportOffer(productCode);
  if (!offer || amountKrw !== offer.listAmountKrw || calculateDiscountedAmount({ listAmountKrw: amountKrw, discountType: offer.discountType, discountValue: offer.discountValue }).finalAmountKrw !== offer.finalAmountKrw) {
    throw new Error("COUPON_DECEMBER_PRICE_CHANGED");
  }
}
