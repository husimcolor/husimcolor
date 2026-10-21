import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("무료·유료 안내 및 최소 전환 퍼널", () => {
  it("홈과 무료 결과는 무료 내용을 바꾸지 않고 개인 심화의 네 가지 추가 가치를 명확히 안내한다", () => {
    const home = read("app/(tabs)/index.tsx");
    const freeResult = read("app/(tabs)/result.tsx");

    for (const source of [home, freeResult]) {
      expect(source).toContain("컬러 3개 + 심리카드 3장");
      expect(source).toContain("선택 순서별 해석과 통합 해석");
      expect(source).toContain("맞춤 회복 루틴");
      expect(source).toContain("PDF 리포트 제공");
      expect(source).toContain("리포트 샘플 보기");
      expect(source).toContain("개인 심화분석 알아보기");
    }
    expect(freeResult).toContain("무료 체험에는 유료 PDF가");
    expect(freeResult).toContain("product: 'personal_deep'");
  });

  it("유료 관계 상품의 카드와 샘플 버튼은 각자 paid guide 이벤트를 한 번만 기록하고 결제 실행은 checkout에만 남긴다", () => {
    const relationshipStart = read("app/(tabs)/couple-start.tsx");

    expect(relationshipStart).toContain(
      "const funnel = trpc.conversionFunnel.track.useMutation()",
    );
    expect(relationshipStart).toContain('eventName: "paid_guide_click"');
    expect(relationshipStart).toContain(
      "relationship-product-${paidProductCode}",
    );
    expect(relationshipStart).toContain("relationship-sample-${product}");
    expect(relationshipStart).toContain("openPaidCheckout(paidProductCode)");
    expect(relationshipStart).not.toContain("requestPayment");
  });

  it("여덟 단계는 상품·언어·채널·서버 판정 test 여부만 기록하며, 공개 통계에는 노출하지 않는다", () => {
    const router = read("server/routers.ts");
    const schema = read("drizzle/schema.ts");
    const tracking = read("lib/conversion-tracking.ts");
    const adminService = read(
      "server/commerce/admin-daily-operations-service.ts",
    );

    for (const event of [
      "free_result",
      "paid_guide_click",
      "sample_view",
      "checkout_view",
      "toss_request",
      "payment_success",
      "payment_cancelled",
      "payment_failed",
    ]) {
      expect(router).toContain(`"${event}"`);
      expect(tracking).toContain(`"${event}"`);
    }

    expect(router).toContain(".strict()");
    expect(router).toContain("isExplicitTestPaymentRuntime()");
    expect(router).toContain('ctx.user?.role === "admin"');
    expect(router).toContain("ctx.legacyAdmin === true");
    expect(router).not.toContain("operatorTest: z.boolean");
    expect(router).not.toContain("selectedColors: z.string");
    expect(router).not.toContain("selectedCards: z.string");
    expect(schema).toContain("commerce_funnel_events_event_key_unique");
    expect(schema).toContain("eventKey");
    expect(schema).toContain("deviceId");
    expect(tracking).toContain("getPaymentConversionScope");
    expect(tracking).toContain("PAYMENT_SCOPE_KEY_PREFIX");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(checkout).toContain("trackPaymentFunnelEvent");
    expect(checkout).not.toContain("payment-${orderNumber}");
    expect(adminService).toContain("getCommerceFunnelEventRows");
    expect(adminService).toContain("kstRangeForDateLabel");
    expect(router).toContain("fromKst: z.string().regex");
    expect(router).toContain("toKst: z.string().regex");
  });

  it("관리자만 KST 최근 14일 행을 보고 운영자 점검은 테스트로 구분된다고 안내한다", () => {
    const router = read("server/routers.ts");
    const admin = read("app/(tabs)/admin.tsx");

    const adminSection = router.slice(router.indexOf("admin: router({"));
    expect(adminSection).toContain("funnelDaily: adminProcedure");
    expect(admin).toContain("fromKst: kstDateOffset(13)");
    expect(admin).toContain("전환 퍼널 · 최근 14일 KST");
    expect(admin).toContain("운영 화면 점검은 관리자 로그인 상태에서");
    expect(admin).toContain('item.isTest ? "테스트" : "운영"');
  });
});
