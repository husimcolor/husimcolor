export type SampleReportProduct = "personal_deep" | "couple_love_deep" | "parent_child_deep";

/** 모든 상품 진입 화면에서 동일하게 쓰는 공개 PDF 링크 문구. */
export const SAMPLE_REPORT_LINK_LABEL = "PDF 리포트 샘플 보기";

export type SampleReport = {
  product: SampleReportProduct;
  title: string;
  fileName: string;
  pageCount: number;
};

/**
 * 현재 운영 리포트 생성기로 만든 공개용 전체 샘플입니다.
 * 가상 데이터만 사용하며, 고객 결과·주문·이메일과 연결되지 않습니다.
 */
export const SAMPLE_REPORTS: Record<SampleReportProduct, SampleReport> = {
  personal_deep: {
    product: "personal_deep",
    title: "개인 심화분석",
    fileName: "husimcolor-personal-deep-sample.pdf",
    pageCount: 8,
  },
  couple_love_deep: {
    product: "couple_love_deep",
    title: "부부·연인 관계 심화분석",
    fileName: "husimcolor-couple-love-sample.pdf",
    pageCount: 18,
  },
  parent_child_deep: {
    product: "parent_child_deep",
    title: "부모·자녀 관계 심화분석",
    fileName: "husimcolor-parent-child-sample.pdf",
    pageCount: 17,
  },
};

export function isSampleReportProduct(value: string | undefined): value is SampleReportProduct {
  return value === "personal_deep" || value === "couple_love_deep" || value === "parent_child_deep";
}

export function getSampleReport(value: string | undefined): SampleReport | null {
  return isSampleReportProduct(value) ? SAMPLE_REPORTS[value] : null;
}

/** 운영·개발 모두에서 동일한 정적 PDF 자산으로 연결한다. */
export function getSampleReportUrl(value: string | undefined, origin?: string): string | null {
  const report = getSampleReport(value);
  if (!report) return null;
  const pathname = `/sample-reports/${report.fileName}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}
