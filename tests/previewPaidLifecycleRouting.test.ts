import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("공개 유료 심화분석 진입", () => {
  it("테스트·라이브 runtime 모두 review-only보다 persistent lifecycle을 우선한다", () => {
    const home = read("app/(tabs)/index.tsx");
    const relationshipStart = read("app/(tabs)/couple-start.tsx");

    expect(home).toContain("const tossLiveEnabled = commerceTestMode.data?.tossLiveEnabled === true");
    expect(home).toContain("paidAnalysisPublicEnabled && tossPaymentEnabled");
    expect(home).toContain("product=personal_deep${tossLiveEnabled ? '' : '&testLifecycle=toss-test-lifecycle'}");
    expect(relationshipStart).toContain("paidProductCode && paidAnalysisPublicEnabled && tossPaymentEnabled");
    expect(relationshipStart).toContain("&testLifecycle=toss-test-lifecycle");

    expect(home.indexOf("testLifecycle=toss-test-lifecycle")).toBeLessThan(home.indexOf("review=toss-card-review"));
    expect(relationshipStart.indexOf("testLifecycle=toss-test-lifecycle")).toBeLessThan(relationshipStart.indexOf("review=toss-card-review"));
  });

  it("중간 화면은 테스트 lifecycle을 보존하고 라이브 runtime에서는 일반 결제 URL로 복귀한다", () => {
    const files = [
      "app/(tabs)/premium-info.tsx",
      "app/(tabs)/premium-select.tsx",
      "app/(tabs)/premium-color-select.tsx",
      "app/(tabs)/couple-info.tsx",
    ];

    for (const file of files) {
      expect(read(file)).toContain("testLifecycle=toss-test-lifecycle");
      expect(read(file)).toContain("tossLiveEnabled");
    }
  });
});
