export const PREVIEW_TEST_SUPPORT_SUBJECT_PREFIX = "[Preview Test]";
type PreviewVerificationEnvironment = Record<string, string | undefined>;

export type PreviewOutboxCandidate = {
  purpose: "account_link" | "support_notification" | "analysis_result_pdf";
  recipientMatchesSupport: boolean;
  accountLinkStatus: "pending" | "verified" | "expired" | "cancelled" | null;
  accountLinkUnexpired: boolean | null;
  supportSubject: string | null;
};

/**
 * 이 경로는 운영 발송기가 아니라 Preview 검증을 위한 단발성 보완이다.
 * 카카오 Preview와 커머스 테스트 모드가 모두 켜진 환경에서만 활성화한다.
 */
export function isPreviewOutboxManualVerificationEnabled(env?: PreviewVerificationEnvironment): boolean {
  const runtimeEnv = env ?? (process.env as unknown as PreviewVerificationEnvironment);
  return runtimeEnv.COMMERCE_TEST_MODE === "true" && runtimeEnv.KAKAO_LOGIN_ENABLED === "true";
}

/**
 * 사용자가 승인한 support 수신함 대상의 인증코드와 `[Preview Test]` 문의만 허용한다.
 * PDF, 일반 문의, 만료·취소된 인증 챌린지는 이 경로에서 절대 선택하지 않는다.
 */
export function isApprovedPreviewOutboxCandidate(candidate: PreviewOutboxCandidate): boolean {
  if (!candidate.recipientMatchesSupport) return false;
  if (candidate.purpose === "account_link") {
    return candidate.accountLinkStatus === "pending" && candidate.accountLinkUnexpired === true;
  }
  if (candidate.purpose === "support_notification") {
    return candidate.supportSubject?.startsWith(PREVIEW_TEST_SUPPORT_SUBJECT_PREFIX) === true;
  }
  return false;
}
