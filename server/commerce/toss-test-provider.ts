import { z } from "zod";
import { isExplicitTestPaymentRuntime } from "./test-runtime";

const TOSS_TEST_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";

const tossApprovedPaymentSchema = z.object({
  paymentKey: z.string().min(1),
  orderId: z.string().min(1),
  totalAmount: z.number().int().nonnegative(),
  status: z.literal("DONE"),
  method: z.string().optional(),
});

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

function getRequiredTestKey(name: "TOSS_TEST_CLIENT_KEY" | "TOSS_TEST_SECRET_KEY", prefix: string): string {
  const value = process.env[name]?.trim();
  if (!value || !value.startsWith(prefix)) {
    throw new Error(`${name}_NOT_CONFIGURED`);
  }
  return value;
}

export function isTossTestPaymentEnabled(): boolean {
  return isExplicitTestPaymentRuntime() &&
    Boolean(process.env.TOSS_TEST_CLIENT_KEY?.trim()) &&
    Boolean(process.env.TOSS_TEST_SECRET_KEY?.trim());
}

/** 클라이언트에는 토스의 공개 테스트 Client Key만 전달하며 Secret Key는 절대 반환하지 않는다. */
export function getTossTestClientConfig(): { clientKey: string } {
  if (!isTossTestPaymentEnabled()) throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  return { clientKey: getRequiredTestKey("TOSS_TEST_CLIENT_KEY", "test_ck_") };
}

/**
 * 테스트 결제창이 발급한 paymentKey는 서버에서만 승인한다.
 * 요청 금액·주문번호는 이후 DB 스냅샷과 다시 대조하므로 화면 입력값을 권한 근거로 사용하지 않는다.
 */
export async function confirmTossTestPayment(
  input: { paymentKey: string; orderNumber: string; amountKrw: number },
  fetcher: FetchLike = fetch,
): Promise<{
  paymentKey: string;
  orderNumber: string;
  amountKrw: number;
  method: string | null;
  rawPayload: string;
}> {
  if (!isTossTestPaymentEnabled()) throw new Error("TOSS_TEST_PAYMENT_DISABLED");
  const secretKey = getRequiredTestKey("TOSS_TEST_SECRET_KEY", "test_sk_");
  const authorization = Buffer.from(`${secretKey}:`, "utf8").toString("base64");
  const response = await fetcher(TOSS_TEST_CONFIRM_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${authorization}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      paymentKey: input.paymentKey,
      orderId: input.orderNumber,
      amount: input.amountKrw,
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`TOSS_TEST_CONFIRM_FAILED_${response.status}`);
  }
  const approved = tossApprovedPaymentSchema.safeParse(payload);
  if (!approved.success || approved.data.orderId !== input.orderNumber || approved.data.totalAmount !== input.amountKrw) {
    throw new Error("TOSS_TEST_CONFIRM_RESPONSE_MISMATCH");
  }

  return {
    paymentKey: approved.data.paymentKey,
    orderNumber: approved.data.orderId,
    amountKrw: approved.data.totalAmount,
    method: approved.data.method ?? null,
    rawPayload: JSON.stringify(payload),
  };
}
