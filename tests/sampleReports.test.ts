import { describe, expect, it } from "vitest";

import {
  SAMPLE_REPORTS,
  SAMPLE_REPORT_LINK_LABEL,
  SAMPLE_REPORT_BUTTON_LABELS,
  getSampleReportButtonLabel,
  getSampleReport,
  getSampleReportDownloadUrl,
  getSampleReportFileName,
  getSampleReportTitle,
  getSampleReportUrl,
  getSampleReportViewerUrl,
  isSampleReportProduct,
} from "../shared/sample-reports";
import { getPublicSampleReportDownload } from "../server/public-sample-report-service";

describe("homepage sample report references", () => {
  it("uses one clear Korean label for every public sample PDF link", () => {
    expect(SAMPLE_REPORT_LINK_LABEL).toBe("PDF 리포트 샘플 보기");
  });

  it("uses a product-specific, mobile-friendly PDF sample button label", () => {
    expect(SAMPLE_REPORT_BUTTON_LABELS).toEqual({
      personal_deep: "개인 심화 PDF 샘플 보기",
      couple_love_deep: "부부·연인 PDF 샘플 보기",
      parent_child_deep: "부모·자녀 PDF 샘플 보기",
    });
    expect(getSampleReportButtonLabel("personal_deep")).toBe("개인 심화 PDF 샘플 보기");
  });

  it("keeps one complete public Korean PDF for each paid analysis product", () => {
    expect(Object.keys(SAMPLE_REPORTS).sort()).toEqual([
      "couple_love_deep",
      "parent_child_deep",
      "personal_deep",
    ]);

    expect(SAMPLE_REPORTS.personal_deep.pageCount).toBe(12);
    expect(SAMPLE_REPORTS.couple_love_deep.pageCount).toBe(18);
    expect(SAMPLE_REPORTS.parent_child_deep.pageCount).toBe(17);

    for (const report of Object.values(SAMPLE_REPORTS)) {
      expect(report.fileName).toMatch(/^husimcolor-[a-z-]+-sample\.pdf$/);
      expect(getSampleReportFileName(report.product)).toBe(report.fileName);
      expect(getSampleReportTitle(report.product)).toBe(report.title);
      expect(getSampleReportUrl(report.product)).toBe(`/sample-reports/${report.fileName}`);
      expect(getSampleReportUrl(report.product, "https://husimcolor.vercel.app/")).toBe(
        `https://husimcolor.vercel.app/sample-reports/${report.fileName}`,
      );
      expect(getSampleReportViewerUrl(report.product)).toBe(`/api/public-sample-report?product=${report.product}`);
      expect(getSampleReportDownloadUrl(report.product)).toBe(`/api/public-sample-report?product=${report.product}&download=1`);
    }
  });

  it("returns only allow-listed Korean public sample files and never consults customer storage", async () => {
    for (const product of Object.keys(SAMPLE_REPORTS) as Array<keyof typeof SAMPLE_REPORTS>) {
      const result = await getPublicSampleReportDownload({ product });
      expect(result.product).toBe(product);
      expect(result.filename).toBe(SAMPLE_REPORTS[product].fileName);
      expect(result.content.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    }
    await expect(getPublicSampleReportDownload({ product: "../../private" })).rejects.toThrow("PUBLIC_SAMPLE_PRODUCT_NOT_FOUND");
  });

  it("accepts only paid analysis sample product codes", () => {
    expect(isSampleReportProduct("personal_deep")).toBe(true);
    expect(isSampleReportProduct("couple_love_deep")).toBe(true);
    expect(isSampleReportProduct("parent_child_deep")).toBe(true);
    expect(isSampleReportProduct("friend")).toBe(false);
    expect(getSampleReport("friend")).toBeNull();
    expect(getSampleReportUrl("friend")).toBeNull();
    expect(getSampleReportViewerUrl("friend")).toBeNull();
    expect(getSampleReportDownloadUrl("friend")).toBeNull();
  });
});
