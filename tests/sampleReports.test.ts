import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  SAMPLE_REPORTS,
  SAMPLE_REPORT_LINK_LABEL,
  SAMPLE_REPORT_BUTTON_LABELS,
  ZH_CN_SAMPLE_REPORT_FILENAMES,
  getSampleReportButtonLabel,
  getSampleReport,
  getSampleReportDownloadUrl,
  getSampleReportFileName,
  getSampleReportTitle,
  getSampleReportUrl,
  getSampleReportViewerUrl,
  isSampleReportProduct,
} from "../shared/sample-reports";

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

  it("keeps one complete public PDF for each paid analysis product", () => {
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
      expect(getSampleReportUrl(report.product)).toBe(`/sample-reports/${report.fileName}`);
      expect(getSampleReportUrl(report.product, "https://husimcolor.vercel.app/")).toBe(
        `https://husimcolor.vercel.app/sample-reports/${report.fileName}`,
      );
      expect(getSampleReportUrl(report.product, undefined, "zh-CN")).toBe(
        `/sample-reports/${ZH_CN_SAMPLE_REPORT_FILENAMES[report.product]}`,
      );
      expect(getSampleReportUrl(report.product, "https://husimcolor.vercel.app/", "zh-CN")).toBe(
        `https://husimcolor.vercel.app/sample-reports/${ZH_CN_SAMPLE_REPORT_FILENAMES[report.product]}`,
      );
    }
  });

  it("maps all six product and locale combinations to their own inline viewer and download URL", () => {
    for (const report of Object.values(SAMPLE_REPORTS)) {
      for (const locale of ["ko", "zh-CN"] as const) {
        const encoded = `product=${report.product}&locale=${encodeURIComponent(locale)}`;
        const viewer = getSampleReportViewerUrl(report.product, "https://husimcolor.vercel.app/", locale);
        expect(viewer).toBe(`https://husimcolor.vercel.app/api/public-sample-report?${encoded}`);
        expect(getSampleReportDownloadUrl(report.product, "https://husimcolor.vercel.app/", locale)).toBe(`${viewer}&download=1`);
        expect(getSampleReportFileName(report.product, locale)).toBe(locale === "ko"
          ? report.fileName
          : ZH_CN_SAMPLE_REPORT_FILENAMES[report.product]);
      }
    }
    expect(getSampleReportTitle("personal_deep", "zh-CN")).toBe("个人深度分析");
    expect(getSampleReportTitle("couple_love_deep", "zh-CN")).toBe("夫妻／恋人关系深度分析");
    expect(getSampleReportTitle("parent_child_deep", "zh-CN")).toBe("亲子关系深度分析");
  });

  it("uses a read-only public endpoint with inline and optional attachment headers", () => {
    const api = readFileSync("api/public-sample-report.ts", "utf8");
    const service = readFileSync("server/public-sample-report-service.ts", "utf8");
    const viewer = readFileSync("app/(tabs)/sample-report.tsx", "utf8");
    const checkout = readFileSync("app/(tabs)/commerce-checkout.tsx", "utf8");
    expect(api).toContain('download ? "attachment" : "inline"');
    expect(api).toContain('res.setHeader("Accept-Ranges", "bytes")');
    expect(api).toContain('res.setHeader("X-Frame-Options", "SAMEORIGIN")');
    expect(api).toContain('res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate")');
    expect(api).toContain('res.status(206)');
    expect(service).toContain('path.resolve(process.cwd(), "public", "sample-reports")');
    expect(service).toContain('getSampleReportFileName(product, locale)');
    expect(service).not.toContain("private_documents");
    expect(service).not.toContain("email_outbox");
    expect(viewer).toContain("recordedMetricEvents");
    expect(viewer).toContain('sample_${stage}:${product}:${locale}');
    expect(checkout).toContain("recordedCommerceEvents");
    expect(checkout).toContain("commerce_${stage}:${productCode}:${locale}");
    expect(checkout).toContain("상품·언어·단계만 기록한다");
  });

  it("accepts only paid analysis sample product codes", () => {
    expect(isSampleReportProduct("personal_deep")).toBe(true);
    expect(isSampleReportProduct("couple_love_deep")).toBe(true);
    expect(isSampleReportProduct("parent_child_deep")).toBe(true);
    expect(isSampleReportProduct("friend")).toBe(false);
    expect(getSampleReport("friend")).toBeNull();
    expect(getSampleReportUrl("friend")).toBeNull();
    expect(getSampleReportViewerUrl("friend")).toBeNull();
  });
});
