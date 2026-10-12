export type MemberIdentityInput = {
  name: string | null | undefined;
  email: string | null | undefined;
  loginMethod: string | null | undefined;
};

/** Keep account identification useful in the UI without rendering a full email address. */
export function maskAccountEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim();
  if (!normalized) return null;

  const at = normalized.lastIndexOf("@");
  if (at <= 0 || at === normalized.length - 1) return null;

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  const [domainLabel, ...suffix] = domain.split(".");
  if (!domainLabel) return null;

  const maskedLocal = `${local.slice(0, 1)}***`;
  const maskedDomain = `${domainLabel.slice(0, 1)}***`;
  return `${maskedLocal}@${maskedDomain}${suffix.length ? `.${suffix.join(".")}` : ""}`;
}

export function getMemberIdentityDisplay(input: MemberIdentityInput) {
  const isKakao = input.loginMethod === "kakao";
  const suppliedName = input.name?.trim() || null;
  const hasDistinctNickname = Boolean(suppliedName && suppliedName !== "카카오 사용자");
  const maskedEmail = maskAccountEmail(input.email);

  return {
    displayName: hasDistinctNickname ? suppliedName! : isKakao ? "카카오 회원" : "회원",
    providerLabel: isKakao ? "카카오 계정 인증됨" : "인증된 회원 계정",
    identifier: maskedEmail ?? (hasDistinctNickname ? `닉네임 ${suppliedName}` : "이메일 정보 미제공"),
  };
}
