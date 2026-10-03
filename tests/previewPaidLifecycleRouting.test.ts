import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Preview 유료 심화분석 진입", () => {
  it("명시적 Preview 테스트 결제에서는 review-only보다 persistent lifecycle을 우선한다", () => {
    const home = read("app/(tabs)/index.tsx");
    const relationshipStart = read("app/(tabs)/couple-start.tsx");

    expect(home).toContain("paidAnalysisPublicEnabled && commerceTestMode.data?.tossTestEnabled");
    expect(home).toContain("product=personal_deep&testLifecycle=toss-test-lifecycle");
    expect(relationshipStart).toContain("paidProductCode && paidAnalysisPublicEnabled && commerceTestMode.data?.tossTestEnabled");
    expect(relationshipStart).toContain("&testLifecycle=toss-test-lifecycle");

    expect(home.indexOf("testLifecycle=toss-test-lifecycle")).toBeLessThan(home.indexOf("review=toss-card-review"));
    expect(relationshipStart.indexOf("testLifecycle=toss-test-lifecycle")).toBeLessThan(relationshipStart.indexOf("review=toss-card-review"));
  });

  it("중간 화면에서 결제 화면으로 되돌아가도 Preview lifecycle 파라미터를 유지한다", () => {
    const files = [
      "app/(tabs)/premium-info.tsx",
      "app/(tabs)/premium-select.tsx",
      "app/(tabs)/premium-color-select.tsx",
      "app/(tabs)/couple-info.tsx",
    ];

    for (const file of files) {
      expect(read(file)).toContain("testLifecycle=toss-test-lifecycle");
    }
  });
});
