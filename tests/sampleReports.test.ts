import { describe, expect, it } from "vitest";

import {
  SAMPLE_REPORTS,
  getSampleReport,
  getSampleReportUrl,
  isSampleReportProduct,
} from "../shared/sample-reports";

describe("homepage sample report references", () => {
  it("keeps one complete public PDF for each paid analysis product", () => {
    expect(Object.keys(SAMPLE_REPORTS).sort()).toEqual([
      "couple_love_deep",
      "parent_child_deep",
      "personal_deep",
    ]);

    expect(SAMPLE_REPORTS.personal_deep.pageCount).toBe(8);
    expect(SAMPLE_REPORTS.couple_love_deep.pageCount).toBe(18);
    expect(SAMPLE_REPORTS.parent_child_deep.pageCount).toBe(17);

    for (const report of Object.values(SAMPLE_REPORTS)) {
      expect(report.fileName).toMatch(/^husimcolor-[a-z-]+-sample\.pdf$/);
      expect(getSampleReportUrl(report.product)).toBe(`/sample-reports/${report.fileName}`);
      expect(getSampleReportUrl(report.product, "https://husimcolor.vercel.app/")).toBe(
        `https://husimcolor.vercel.app/sample-reports/${report.fileName}`,
      );
    }
  });

  it("accepts only paid analysis sample product codes", () => {
    expect(isSampleReportProduct("personal_deep")).toBe(true);
    expect(isSampleReportProduct("couple_love_deep")).toBe(true);
    expect(isSampleReportProduct("parent_child_deep")).toBe(true);
    expect(isSampleReportProduct("friend")).toBe(false);
    expect(getSampleReport("friend")).toBeNull();
    expect(getSampleReportUrl("friend")).toBeNull();
  });
});
