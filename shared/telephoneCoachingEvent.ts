export const TELEPHONE_EVENT_OFFER_CODE = "december_year_end_2026" as const;
export const TELEPHONE_EVENT_NAME = "오행 기반 성향 분석 및 고민 상담";
export const TELEPHONE_EVENT_PRICE_KRW = 35_000;
export const TELEPHONE_EVENT_DURATION_MINUTES = 40;
export const TELEPHONE_REGULAR_PRICE_KRW = 50_000;
export const TELEPHONE_REGULAR_DURATION_MINUTES = 50;
export const TELEPHONE_EVENT_START_DATE = "2026-12-01";
export const TELEPHONE_EVENT_END_DATE = "2026-12-30";
export const TELEPHONE_EVENT_START_AT = new Date("2026-12-01T00:00:00+09:00");
export const TELEPHONE_EVENT_END_EXCLUSIVE = new Date("2026-12-31T00:00:00+09:00");
export const TELEPHONE_CONTACT_NUMBER = "0507-1379-9383";
export const TELEPHONE_EVENT_DESCRIPTION = "전통 오행을 바탕으로 자신의 성향과 감정적 특성을 살펴보고, 현재 겪고 있는 고민과 관계 문제를 함께 이야기하는 1:1 전화 상담입니다.";
export const TELEPHONE_CONNECTION_NOTICE = "홈페이지에서 예약과 결제를 완료하신 후, 예약된 시간에 휴심컬러 네이버 대표 안심번호(0507-1379-9383)로 전화해 주세요.";
export const TELEPHONE_CONDUCT_NOTICE = "상담 목적과 무관한 성적 대화 요구, 성희롱성 발언, 폭언 또는 반복적인 부적절한 요구가 있을 경우 상담이 즉시 중단될 수 있습니다.";
export const TELEPHONE_CONDUCT_REFUND_NOTICE = "고객의 부적절한 행위로 상담이 중단된 경우, 이미 진행된 상담에 대한 환불은 제한될 수 있으며 구체적인 환불 여부는 사전 안내된 환불 규정과 관계 법령에 따라 처리됩니다.";
export type TelephoneEventOfferCode = typeof TELEPHONE_EVENT_OFFER_CODE;

export function isTelephoneEventPaymentOpen(now = new Date()): boolean {
  return now < TELEPHONE_EVENT_END_EXCLUSIVE;
}

export function isTelephoneEventConsultationDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= TELEPHONE_EVENT_START_DATE && date <= TELEPHONE_EVENT_END_DATE;
}

export function getTelephoneEventDateError(date: string): string | null {
  return isTelephoneEventConsultationDate(date) ? null : "연말 전화 상담의 상담일은 2026년 12월 1일~30일 중 선택해 주세요.";
}
