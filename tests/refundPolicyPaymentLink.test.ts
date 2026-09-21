import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(__dirname, "..");
const read = (relativePath: string) => readFileSync(join(projectRoot, relativePath), "utf8");

describe("결제 화면 환불정책 안내", () => {
  it("기존 카드 선택 전 환불 문구를 제거한다", () => {
    const source = read("app/(tabs)/payment.tsx");

    expect(source).not.toContain("결제 후 환불은 카드 선택 전에만 가능합니다");
  });

  it("공개 환불정책 문구와 링크를 제공한다", () => {
    const source = read("app/(tabs)/payment.tsx");

    expect(source).toContain('const REFUND_POLICY_URL = "https://husimcolor.com/refund-policy"');
    expect(source).toContain("환불 기준은 환불정책을 확인해 주세요.");
    expect(source).toContain("Linking.openURL(REFUND_POLICY_URL)");
    expect(source).toContain('accessibilityLabel="환불정책 확인하기"');
  });
});
