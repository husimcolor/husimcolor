import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const checkoutSource = readFileSync(
  resolve(process.cwd(), "app/(tabs)/commerce-checkout.tsx"),
  "utf8",
);

describe("Toss 테스트 checkout 결제수단 선택", () => {
  it("카드사 앱 자체창 대신 사용자가 결제수단을 고르는 DEFAULT 통합창을 명시한다", () => {
    expect(checkoutSource).toContain('method: "CARD"');
    expect(checkoutSource).toContain('card: { flowMode: "DEFAULT" }');
    expect(checkoutSource).not.toContain('flowMode: "DIRECT"');
  });

  it("특정 카드사나 간편결제를 요청 파라미터로 고정하지 않는다", () => {
    expect(checkoutSource).not.toContain("cardCompany:");
    expect(checkoutSource).not.toContain("easyPay:");
    expect(checkoutSource).not.toContain("useAppCardOnly: true");
  });
});
