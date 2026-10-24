import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { landingEbookAdminProxyTestUtils } from "../server/commerce/landing-ebook-admin-proxy";
import { createEbookAdminBridgeSignature } from "/home/ubuntu/husimcolor-landing/server/ebookAdminBridge";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("통합 관리자 전자책 주문 브리지", () => {
  it("앱과 홈페이지가 동일한 고정 경로·본문·시각 HMAC 규격으로 서명한다", () => {
    const secret = "bridge-secret-for-test-only-32-bytes-minimum";
    const timestamp = "1800000000000";
    const body = { orderId: 42 };
    expect(landingEbookAdminProxyTestUtils.createSignature(secret, landingEbookAdminProxyTestUtils.resendPath, timestamp, body))
      .toBe(createEbookAdminBridgeSignature({ secret, path: "/api/internal/ebook-admin/orders/resend", timestamp, body }));
  });

  it("앱 브리지는 전용 새 비밀·공식 landing base URL만 사용하고 기존 체험 신청 비밀이나 브라우저 origin을 사용하지 않는다", () => {
    const proxy = read("server/commerce/landing-ebook-admin-proxy.ts");
    expect(proxy).toContain("HUSIM_EBOOK_ADMIN_BRIDGE_SECRET");
    expect(proxy).toContain("https://husimcolor.com");
    expect(proxy).not.toContain("HUSIM_APP_LANDING_REQUEST_SECRET");
    expect(proxy).not.toContain("window.location");
    expect(proxy).not.toContain("privateFileKey");
    expect(proxy).not.toContain("downloadToken");
  });

  it("기존 legacy 비밀번호 관리자만 전자책 주문 목록과 재발송을 실행하고, 앱 화면에는 마스킹된 값만 표시한다", () => {
    const router = read("server/routers.ts");
    const screen = read("app/(tabs)/admin.tsx");
    expect(router).toContain("ebookOrders: ebookAdminProcedure");
    expect(router).toContain("resendEbookReceipt: ebookAdminProcedure");
    expect(router).toContain("https://husimcolor.vercel.app");
    expect(router).toContain("EBOOK_ADMIN_ORIGIN_FORBIDDEN");
    expect(screen).toContain("홈페이지 전자책 주문");
    expect(screen).toContain("이름·이메일은 마스킹해 표시");
    expect(screen).toContain("구매 안내 재발송");
    expect(screen).toContain("기존 다운로드 권한은 취소하지 않습니다.");
  });
});
