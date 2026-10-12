import { describe, expect, it } from "vitest";

import { getMemberIdentityDisplay, maskAccountEmail } from "../shared/account-display";

describe("member account display", () => {
  it("masks email addresses before they are rendered in the member portal", () => {
    expect(maskAccountEmail("member@example.com")).toBe("m***@e***.com");
    expect(maskAccountEmail("name@domain.co.kr")).toBe("n***@d***.co.kr");
    expect(maskAccountEmail(null)).toBeNull();
  });

  it("labels a Kakao-authenticated account without treating the fallback name as a nickname", () => {
    expect(getMemberIdentityDisplay({
      name: "카카오 사용자",
      email: null,
      loginMethod: "kakao",
    })).toEqual({
      displayName: "카카오 회원",
      providerLabel: "카카오 계정 인증됨",
      identifier: "이메일 정보 미제공",
    });
  });
});
