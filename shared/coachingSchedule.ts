export const TELEPHONE_COACHING_SCHEDULE_BLOCK_MINUTES = 60;
/** 기존 방문 코칭 관리자 확정의 보수적 기본 점유 시간이다. */
export const MANUAL_COACHING_SCHEDULE_BLOCK_MINUTES = 120;

export function getCoachingScheduleBlockMinutes(productCode: string | null | undefined): number {
  return productCode === "telephone_coaching"
    ? TELEPHONE_COACHING_SCHEDULE_BLOCK_MINUTES
    : MANUAL_COACHING_SCHEDULE_BLOCK_MINUTES;
}

export function getCoachingScheduledEnd(
  scheduledAt: Date,
  productCode: string | null | undefined,
  scheduledEndAt?: Date | null,
): Date {
  if (scheduledEndAt) return scheduledEndAt;
  return new Date(scheduledAt.getTime() + getCoachingScheduleBlockMinutes(productCode) * 60_000);
}
