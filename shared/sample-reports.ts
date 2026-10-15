import type { AppLocale } from "./localization";

export type SampleReportProduct = "personal_deep" | "couple_love_deep" | "parent_child_deep";

/** 모든 상품 진입 화면에서 동일하게 쓰는 공개 PDF 링크 문구. */
export const SAMPLE_REPORT_LINK_LABEL = "PDF 리포트 샘플 보기";

/** 상품 카드와 무료 결과 안내에서 사용하는 명확한 공개 PDF 버튼 문구다. */
export const SAMPLE_REPORT_BUTTON_LABELS: Record<SampleReportProduct, string> = {
  personal_deep: "개인 심화 PDF 샘플 보기",
  couple_love_deep: "부부·연인 PDF 샘플 보기",
  parent_child_deep: "부모·자녀 PDF 샘플 보기",
};

/** 중국어 선택 시 한국어 공개 샘플을 열지 않도록 분리된 동일 상품 샘플을 사용한다. */
export const ZH_CN_SAMPLE_REPORT_FILENAMES: Record<SampleReportProduct, string> = {
  personal_deep: "husimcolor-personal-deep-zh-CN-sample.pdf",
  couple_love_deep: "husimcolor-couple-love-zh-CN-sample.pdf",
  parent_child_deep: "husimcolor-parent-child-zh-CN-sample.pdf",
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

const SAMPLE_REPORT_LOCALIZED_TITLES: Record<AppLocale, Record<SampleReportProduct, string>> = {
  ko: {
    personal_deep: "개인 심화분석",
    couple_love_deep: "부부·연인 관계 심화분석",
    parent_child_deep: "부모·자녀 관계 심화분석",
  },
  "zh-CN": {
    personal_deep: "个人深度分析",
    couple_love_deep: "夫妻／恋人关系深度分析",
    parent_child_deep: "亲子关系深度分析",
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

export function getSampleReportTitle(value: SampleReportProduct, locale: AppLocale = "ko"): string {
  return SAMPLE_REPORT_LOCALIZED_TITLES[locale][value];
}

/** 언어 선택에 대응하는 파일 이름만 반환한다. API route에서도 허용 목록으로 사용한다. */
export function getSampleReportFileName(value: string | undefined, locale: AppLocale = "ko"): string | null {
  const report = getSampleReport(value);
  if (!report) return null;
  return locale === "zh-CN" ? ZH_CN_SAMPLE_REPORT_FILENAMES[report.product] : report.fileName;
}

/** 기존 공개 URL. 외부 공유·직접 다운로드 경로의 호환성을 유지한다. */
export function getSampleReportUrl(value: string | undefined, origin?: string, locale: AppLocale = "ko"): string | null {
  const fileName = getSampleReportFileName(value, locale);
  if (!fileName) return null;
  const pathname = `/sample-reports/${fileName}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}

/** 공개 샘플 열람 전용 endpoint. inline PDF와 byte range 응답을 사용해 첫 페이지부터 읽는다. */
export function getSampleReportViewerUrl(value: string | undefined, origin?: string, locale: AppLocale = "ko"): string | null {
  if (!isSampleReportProduct(value)) return null;
  const query = new URLSearchParams({ product: value, locale }).toString();
  const pathname = `/api/public-sample-report?${query}`;
  if (!origin) return pathname;
  return `${origin.replace(/\/$/, "")}${pathname}`;
}

/** 열람 화면의 선택적 다운로드 버튼 전용 endpoint. */
export function getSampleReportDownloadUrl(value: string | undefined, origin?: string, locale: AppLocale = "ko"): string | null {
  const viewerUrl = getSampleReportViewerUrl(value, origin, locale);
  if (!viewerUrl) return null;
  return `${viewerUrl}&download=1`;
}
