import AsyncStorage from "@react-native-async-storage/async-storage";

export const TRIAL_KEY = "trialStartedAt";
export const PREMIUM_KEY = "premiumUnlocked";
// 48시간 제한 일시 중지 - 주말 무료체험 오픈 기간 동안 비활성화
// 재활성화 시: TRIAL_LIMIT_ENABLED = true 로 변경
const TRIAL_LIMIT_ENABLED = false;
export const TRIAL_DURATION_MS = 48 * 60 * 60 * 1000; // 48시간 (재활성화 시 사용)

/** 현재 프리미엄 접근 가능 여부 (결제 완료 OR 체험 기간 내) */
export async function isPremiumActive(): Promise<boolean> {
  const [paid, trialStart] = await Promise.all([
    AsyncStorage.getItem(PREMIUM_KEY),
    AsyncStorage.getItem(TRIAL_KEY),
  ]);
  if (paid === "true") return true;
  if (trialStart) {
    // 제한 비활성화 시: 체험 시작 기록만 있으면 항상 활성
    if (!TRIAL_LIMIT_ENABLED) return true;
    const elapsed = Date.now() - parseInt(trialStart, 10);
    return elapsed < TRIAL_DURATION_MS;
  }
  return false;
}

/** 체험 상태 반환 */
export type TrialStatus =
  | "paid"         // 결제 완료
  | "active"       // 체험 중
  | "expired"      // 체험 만료
  | "none";        // 체험 미시작

export async function getTrialStatus(): Promise<TrialStatus> {
  const [paid, trialStart] = await Promise.all([
    AsyncStorage.getItem(PREMIUM_KEY),
    AsyncStorage.getItem(TRIAL_KEY),
  ]);
  if (paid === "true") return "paid";
  if (!trialStart) return "none";
  // 제한 비활성화 시: 체험 시작 기록만 있으면 항상 active
  if (!TRIAL_LIMIT_ENABLED) return "active";
  const elapsed = Date.now() - parseInt(trialStart, 10);
  return elapsed < TRIAL_DURATION_MS ? "active" : "expired";
}

/** 남은 체험 시간 문자열 반환 (제한 비활성화 시 null 반환) */
export async function getTrialRemainingLabel(): Promise<string | null> {
  if (!TRIAL_LIMIT_ENABLED) return null;
  const trialStart = await AsyncStorage.getItem(TRIAL_KEY);
  if (!trialStart) return null;
  const remaining = TRIAL_DURATION_MS - (Date.now() - parseInt(trialStart, 10));
  if (remaining <= 0) return null;
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

/** 무료체험 시작 (최초 1회만) */
export async function startTrial(): Promise<void> {
  const existing = await AsyncStorage.getItem(TRIAL_KEY);
  if (!existing) {
    await AsyncStorage.setItem(TRIAL_KEY, String(Date.now()));
  }
}
