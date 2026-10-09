import { describe, expect, it } from "vitest";

import { SAMPLE_REPORTS, getSampleReport, isSampleReportProduct } from "../shared/sample-reports";

describe("homepage sample report references", () => {
  it("keeps the existing homepage sample pages for all three paid analysis products", () => {
    expect(Object.keys(SAMPLE_REPORTS).sort()).toEqual([
      "couple_love_deep",
      "parent_child_deep",
      "personal_deep",
    ]);

    for (const report of Object.values(SAMPLE_REPORTS)) {
      expect(report.pages).toHaveLength(2);
      expect(report.pages.every((page) => page.startsWith("https://husimcolor.com/manus-storage/"))).toBe(true);
      expect(report.pages.every((page) => page.endsWith(".png"))).toBe(true);
    }
  });

  it("accepts only paid analysis sample product codes", () => {
    expect(isSampleReportProduct("personal_deep")).toBe(true);
    expect(isSampleReportProduct("couple_love_deep")).toBe(true);
    expect(isSampleReportProduct("parent_child_deep")).toBe(true);
    expect(isSampleReportProduct("friend")).toBe(false);
    expect(getSampleReport("friend")).toBeNull();
  });
});
