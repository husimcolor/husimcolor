import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const checkoutScreen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/commerce-checkout.tsx"),
  "utf8",
);

function sectionAfter(marker: string): string {
  const start = checkoutScreen.indexOf(marker);
  if (start < 0) throw new Error(`missing marker: ${marker}`);
  return checkoutScreen.slice(start);
}

describe("Toss card-review checkout screen", () => {
  it("loads review presentation data through a read-only procedure", () => {
    expect(checkoutScreen).toContain("trpc.commerce.checkout.cardReview.useQuery");
    expect(checkoutScreen).toContain("review: \"toss-card-review\"");
    expect(checkoutScreen).toContain("TOSS PAYMENTS CARD REVIEW");
  });

  it("uses a standard Toss card-selection window without an email input or normal checkout mutation", () => {
    const reviewRequest = sectionAfter("const requestCardReviewPayment");
    const end = reviewRequest.indexOf("if (!isPaidAnalysisCode(productCode) || !product)");
    const onlyReviewRequest = reviewRequest.slice(0, end);

    expect(onlyReviewRequest).toContain('card: { flowMode: "DEFAULT" }');
    expect(onlyReviewRequest).toContain("customerEmail: cardReview.data.customerEmail");
    expect(onlyReviewRequest).not.toContain("createCheckout.mutateAsync");
    expect(onlyReviewRequest).not.toContain("completeCheckout.mutateAsync");
  });

  it("never calls payment completion or analysis entry after a review-window return", () => {
    const reviewReturn = sectionAfter("if (cardReviewMode && reviewResult)");
    const nextSection = reviewReturn.indexOf("if (cardReviewMode) {");
    const onlyReviewReturn = reviewReturn.slice(0, nextSection);

    expect(onlyReviewReturn).toContain("결제 승인, 주문 생성, 이용권 발급, 분석 시작은 수행하지 않았습니다");
    expect(onlyReviewReturn).not.toContain("completeCheckout.mutateAsync");
    expect(onlyReviewReturn).not.toContain("moveToAnalysis(");
  });
});
