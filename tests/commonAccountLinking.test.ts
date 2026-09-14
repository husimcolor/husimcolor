import { describe, expect, it } from "vitest";

import { canAutoLinkAuthenticatedCheckout } from "../server/commerce/account-service";
import { hashCommerceValue, normalizeCommerceEmail } from "../server/commerce/crypto";

describe("공통 회원·비회원 상거래 연결", () => {
  it("로그인 이메일과 주문 이메일이 정규화 후 같을 때만 자동 귀속한다", () => {
    expect(canAutoLinkAuthenticatedCheckout({
      checkoutEmail: " Member@Husimcolor.com ",
      authenticatedEmail: "member@husimcolor.com",
    })).toBe(true);
    expect(canAutoLinkAuthenticatedCheckout({
      checkoutEmail: "guest@example.com",
      authenticatedEmail: "member@husimcolor.com",
    })).toBe(false);
  });

  it("소셜 연결 식별자와 인증 코드는 서버 HMAC으로만 비교 가능한 값이 된다", () => {
    const normalized = normalizeCommerceEmail(" Member@Husimcolor.com ");
    expect(normalized).toBe("member@husimcolor.com");
    expect(hashCommerceValue(`email:${normalized}`)).toHaveLength(64);
    expect(hashCommerceValue("claim:1:emailHash:123456")).not.toBe("123456");
  });
});
