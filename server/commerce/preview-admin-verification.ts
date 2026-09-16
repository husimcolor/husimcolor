export type PreviewVerificationEnvironment = {
  VERCEL_ENV?: string;
  COMMERCE_TEST_MODE?: string;
};

/**
 * Preview 검증 화면은 공용 운영 화면과 분리한다. Production에서는 데이터 자체를
 * 반환하지 않으며, 서버의 adminProcedure를 통과한 사용자만 이 게이트에 도달한다.
 */
export function isPreviewReadOnlyVerificationEnabled(
  environment: PreviewVerificationEnvironment = process.env as PreviewVerificationEnvironment,
) {
  return environment.VERCEL_ENV === "preview" && environment.COMMERCE_TEST_MODE === "true";
}

export function previewVerificationUnavailableResult() {
  return {
    available: false as const,
    reason: "preview_only" as const,
    testOrders: [],
    outbox: [],
  };
}
