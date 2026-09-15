const RESEND_API_BASE_URL = "https://api.resend.com";

export type ResendDomainSummary = {
  id?: string;
  name?: string;
  status?: string;
};

type ResendDomainsResponse = {
  data?: ResendDomainSummary[];
};

type ResendEmailResponse = {
  id?: string;
};

type ResendAttachment = { filename: string; content: string };

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim().toLowerCase();
  if (!apiKey || !apiKey.startsWith("re_")) {
    throw new Error("RESEND_API_KEY_MISSING_OR_INVALID");
  }
  if (fromEmail !== "result@husimcolor.com") {
    throw new Error("RESEND_FROM_EMAIL_MUST_BE_RESULT_HUSIMCOLOR_COM");
  }
  return { apiKey, fromEmail };
}

/** 발송 없이 도메인 목록만 조회해 API 키와 발신 도메인 연결을 검증한다. */
export async function listResendDomains(): Promise<ResendDomainSummary[]> {
  const { apiKey } = getResendConfig();
  const response = await fetch(`${RESEND_API_BASE_URL}/domains`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    throw new Error(`RESEND_DOMAIN_LOOKUP_FAILED_${response.status}`);
  }
  const payload = (await response.json()) as ResendDomainsResponse;
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
  idempotencyKey: string;
  attachments?: ResendAttachment[];
}): Promise<{ providerMessageId: string }> {
  const { apiKey, fromEmail } = getResendConfig();
  const response = await fetch(`${RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      from: `휴심컬러 <${fromEmail}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.attachments?.length ? { attachments: input.attachments } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`RESEND_EMAIL_SEND_FAILED_${response.status}`);
  }
  const payload = (await response.json()) as ResendEmailResponse;
  if (!payload.id) throw new Error("RESEND_EMAIL_RESPONSE_MISSING_ID");
  return { providerMessageId: payload.id };
}

export async function sendResendPdfEmail(input: {
  to: string;
  subject: string;
  html: string;
  filename: string;
  pdf: Buffer;
  idempotencyKey: string;
}): Promise<{ providerMessageId: string }> {
  return sendResendEmail({
    to: input.to,
    subject: input.subject,
    html: input.html,
    idempotencyKey: input.idempotencyKey,
    attachments: [{ filename: input.filename, content: input.pdf.toString("base64") }],
  });
}
