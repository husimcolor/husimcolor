import { z } from "zod";

import { isExplicitLivePaymentRuntime } from "./live-runtime";

const TOSS_LIVE_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

const tossApprovedPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  totalAmount: z.number().int().nonnegative(),
  status: z.literal("DONE"),
  method: z.string().optional(),
});

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

function getRequiredLiveKey(name: "TOSS_LIVE_CLIENT_KEY" | "TOSS_LIVE_SECRET_KEY", prefix: string): string {
  const value = process.env[name]?.trim();
  if (!value || !value.startsWith(prefix)) throw new Error(`${name}_NOT_CONFIGURED`);
  return value;
}

/**
 * 라이브 키는 Production의 명시적 이중 gate에서만 유효하다. 이 함수는 secret을
 * 반환하지 않으며, 테스트키 runtime과 함께 켜져 있어도 라이브 경로가 우선한다.
 */
export function isTossLivePaymentEnabled(): boolean {
  return isExplicitLivePaymentRuntime()
    && process.env.TOSS_LIVE_CLIENT_KEY?.trim().startsWith("live_ck_") === true
    && process.env.TOSS_LIVE_SECRET_KEY?.trim().startsWith("live_sk_") === true;
}

/** 클라이언트에는 공개 라이브 Client Key만 전달한다. */
export function getTossLiveClientConfig(): { clientKey: string } {
  if (!isTossLivePaymentEnabled()) throw new Error("TOSS_LIVE_PAYMENT_DISABLED");
  return { clientKey: getRequiredLiveKey("TOSS_LIVE_CLIENT_KEY", "live_ck_") };
}

/**
 * 라이브 결제창이 발급한 paymentKey는 서버에서만 승인한다. 주문번호와 최종 금액은
 * DB 주문 스냅샷과 대조하며, 전달받은 화면 데이터는 권한 근거로 사용하지 않는다.
 */
export async function confirmTossLivePayment(
  input: { paymentKey: string; orderNumber: string; amountKrw: number },
  fetcher: FetchLike = fetch,
): Promise<{
  paymentKey: string;
  orderNumber: string;
  amountKrw: number;
  method: string | null;
  rawPayload: string;
}> {
  if (!isTossLivePaymentEnabled()) throw new Error("TOSS_LIVE_PAYMENT_DISABLED");
  const secretKey = getRequiredLiveKey("TOSS_LIVE_SECRET_KEY", "live_sk_");
  const authorization = Buffer.from(`${secretKey}:`, "utf8").toString("base64");
  const response = await fetcher(TOSS_LIVE_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `husim-${input.orderNumber}`.slice(0, 300),
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderNumber,
      amount: input.amountKrw,
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`TOSS_LIVE_CONFIRM_FAILED_${response.status}`);
  const approved = tossApprovedPaymentSchema.safeParse(payload);
  if (!approved.success || approved.data.orderId !== input.orderNumber || approved.data.totalAmount !== input.amountKrw) {
    throw new Error("TOSS_LIVE_CONFIRM_RESPONSE_MISMATCH");
  }
  return {
    paymentKey: approved.data.paymentKey,
    orderNumber: approved.data.orderId,
    amountKrw: approved.data.totalAmount,
    method: approved.data.method ?? null,
    rawPayload: JSON.stringify(payload),
  };
}
