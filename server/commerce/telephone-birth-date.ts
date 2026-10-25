import KoreanLunarCalendar from "korean-lunar-calendar";

export type BirthCalendarType = "solar" | "lunar";

export type ValidatedTelephoneBirthDate = {
  birthDate: string;
  birthCalendarType: BirthCalendarType;
  isLeapMonth: boolean;
  solarBirthDate: string;
};

function formatIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseIsoDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  return { year, month, day };
}

/**
 * 생년월일은 선택 정보이지만, 입력된 경우에는 한국 음양력 라이브러리로 실제
 * 존재하는 날짜인지 서버에서 한 번 더 확인한다. 반환값은 오행 참고용 암호화
 * 예약 세부정보에만 저장된다.
 */
export function validateTelephoneBirthDate(input: {
  birthDate: string;
  birthCalendarType?: BirthCalendarType;
  isLeapMonth?: boolean;
}): ValidatedTelephoneBirthDate {
  const parts = parseIsoDate(input.birthDate);
  if (!parts) throw new Error("INVALID_TELEPHONE_COACHING_BIRTH_DATE");

  const birthCalendarType = input.birthCalendarType ?? "solar";
  const isLeapMonth = birthCalendarType === "lunar" && input.isLeapMonth === true;
  if (birthCalendarType === "solar" && input.isLeapMonth === true) {
    throw new Error("TELEPHONE_COACHING_LEAP_MONTH_REQUIRES_LUNAR_DATE");
  }

  const calendar = new KoreanLunarCalendar();
  const valid = birthCalendarType === "solar"
    ? calendar.setSolarDate(parts.year, parts.month, parts.day)
    : calendar.setLunarDate(parts.year, parts.month, parts.day, isLeapMonth);
  if (!valid) throw new Error("INVALID_TELEPHONE_COACHING_BIRTH_DATE");

  const solar = calendar.getSolarCalendar();
  return {
    birthDate: formatIsoDate(parts.year, parts.month, parts.day),
    birthCalendarType,
    isLeapMonth,
    solarBirthDate: formatIsoDate(solar.year, solar.month, solar.day),
  };
}

/** 제공된 생년월일은 성인 대상 상품과 모순되지 않는지만 확인한다. 미입력 고객은 성인 확인 동의를 사용한다. */
export function isAdultTelephoneBirthDate(validated: ValidatedTelephoneBirthDate, now = new Date()): boolean {
  const [year, month, day] = validated.solarBirthDate.split("-").map(Number);
  const adulthood = new Date(Date.UTC(year + 18, month - 1, day));
  return adulthood.getTime() <= now.getTime();
}
