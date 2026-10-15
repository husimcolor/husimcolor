export type SampleReportProduct = "personal_deep" | "couple_love_deep" | "parent_child_deep";

/** 모든 상품 진입 화면에서 동일하게 쓰는 공개 PDF 링크 문구. */
export const SAMPLE_REPORT_LINK_LABEL = "PDF 리포트 샘플 보기";

/** 상품 카드와 무료 결과 안내에서 사용하는 명확한 공개 PDF 버튼 문구다. */
export const SAMPLE_REPORT_BUTTON_LABELS: Record<SampleReportProduct, string> = {
  personal_deep: "개인 심화 PDF 샘플 보기",
  couple_love_deep: "부부·연인 PDF 샘플 보기",
  parent_child_deep: "부모·자녀 PDF 샘플 보기",
};

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
    pageCount: 12,
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

export function getSampleReportButtonLabel(value: SampleReportProduct): string {
  return SAMPLE_REPORT_BUTTON_LABELS[value];
}

export function getSampleReportTitle(value: SampleReportProduct): string {
  return SAMPLE_REPORTS[value].title;
}

/** 서버가 읽을 public PDF allow-list 파일명을 반환한다. */
export function getSampleReportFileName(value: SampleReportProduct): string {
  return SAMPLE_REPORTS[value].fileName;
}

/** 기존 공개 정적 PDF 링크. 이미 공유된 주소의 호환성을 유지한다. */
export function getSampleReportUrl(value: string | undefined, origin?: string): string | null {
  const report = getSampleReport(value);
  if (!report) return null;
  const pathname = `/sample-reports/${report.fileName}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}

/**
 * 앱 내 열람용 읽기 전용 endpoint. 고객 PDF endpoint와 분리되어 있으며,
 * product allow-list 외의 파일에는 접근할 수 없다.
 */
export function getSampleReportViewerUrl(value: string | undefined, origin?: string): string | null {
  if (!isSampleReportProduct(value)) return null;
  const pathname = `/api/public-sample-report?product=${encodeURIComponent(value)}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}

/** 열람 화면의 명시적 다운로드 버튼 전용 URL. */
export function getSampleReportDownloadUrl(value: string | undefined, origin?: string): string | null {
  const viewerUrl = getSampleReportViewerUrl(value, origin);
  return viewerUrl ? `${viewerUrl}&download=1` : null;
}

/**
 * PDF.js가 동작하지 않는 인앱 브라우저를 위한 공개 페이지 이미지 대안이다.
 * 이미지도 공개 샘플 allow-list를 벗어나지 않는 product·page 값만 조립한다.
 */
export function getSampleReportPageImageUrl(
  value: string | undefined,
  page: number,
  origin?: string,
): string | null {
  const report = getSampleReport(value);
  if (!report || !Number.isInteger(page) || page < 1 || page > report.pageCount) return null;
  const pathname = `/sample-report-pages/${report.product}/page-${String(page).padStart(3, "0")}.jpg`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}

/** 새 창에서도 PDF 파일이 아니라 같은 HTML canvas 열람 화면을 연다. */
export function getSampleReportWebViewerUrl(value: string | undefined, origin?: string): string | null {
  if (!isSampleReportProduct(value)) return null;
  const pathname = `/sample-report?product=${encodeURIComponent(value)}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}
