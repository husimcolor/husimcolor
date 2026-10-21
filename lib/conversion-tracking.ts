import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export const CONVERSION_EVENT_NAMES = [
  "free_result", "paid_guide_click", "sample_view", "checkout_view",
  "toss_request", "payment_success", "payment_cancelled", "payment_failed",
] as const;
export type ConversionEventName = (typeof CONVERSION_EVENT_NAMES)[number];
export type ConversionProductCode = "free_color_trial" | "personal_deep" | "couple_love_deep" | "parent_child_deep";
const FUNNEL_SESSION_KEY = "@conversion_funnel_session_v1";
const DEVICE_ID_KEY = "husim_device_id";

function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });
}

/** 익명 이벤트 중복 방지용 local session이다. 이메일·결제키·선택값·리포트는 포함하지 않는다. */
export async function getConversionFunnelSessionId(): Promise<string> {
  const current = await AsyncStorage.getItem(FUNNEL_SESSION_KEY);
  if (current && current.length >= 12) return current;
  const created = randomId();
  await AsyncStorage.setItem(FUNNEL_SESSION_KEY, created);
  return created;
}

/** 홈이 아직 열리지 않은 직접 URL에서도 anonymous device UUID를 보장한다. */
export async function getAnonymousDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  const created = randomId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  if (typeof window !== "undefined") {
    try { window.localStorage.setItem(DEVICE_ID_KEY, created); window.sessionStorage.setItem(DEVICE_ID_KEY, created); } catch { /* storage is optional */ }
  }
  return created;
}

export async function createConversionEventKey(input: { eventName: ConversionEventName; productCode: ConversionProductCode; scope?: string }): Promise<string> {
  const sessionId = await getConversionFunnelSessionId();
  return [sessionId, input.eventName, input.productCode, input.scope ?? "screen"].join(":");
}

export async function createConversionEventInput(input: { eventName: ConversionEventName; productCode: ConversionProductCode; scope?: string; locale?: "ko-KR" | "zh-CN" }) {
  return {
    eventKey: await createConversionEventKey({ eventName: input.eventName, productCode: input.productCode, scope: input.scope }),
    deviceId: await getAnonymousDeviceId(),
    eventType: input.eventName,
    productCode: input.productCode,
    locale: input.locale ?? "ko-KR",
    channel: Platform.OS === "web" ? "web" as const : "app" as const,
  };
}
