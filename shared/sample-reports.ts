export type SampleReportProduct = "personal_deep" | "couple_love_deep" | "parent_child_deep";

export type SampleReport = {
  product: SampleReportProduct;
  title: string;
  pages: readonly string[];
};

/**
 * 휴심컬러 홈페이지에서 현재 제공하는 대표 리포트 미리보기 원본입니다.
 * 새 문구나 축약본을 만들지 않고, 각 상품의 기존 2쪽 샘플 이미지를 그대로 사용합니다.
 */
export const SAMPLE_REPORTS: Record<SampleReportProduct, SampleReport> = {
  personal_deep: {
    product: "personal_deep",
    title: "개인 심화분석",
    pages: [
      "https://husimcolor.com/manus-storage/personal-sample-2_2d0456e7.png",
      "https://husimcolor.com/manus-storage/personal-sample-3_18ffebe0.png",
    ],
  },
  couple_love_deep: {
    product: "couple_love_deep",
    title: "부부·연인 관계 심화분석",
    pages: [
      "https://husimcolor.com/manus-storage/couple-sample-11_e4550b97.png",
      "https://husimcolor.com/manus-storage/couple-sample-12_ff4bc36e.png",
    ],
  },
  parent_child_deep: {
    product: "parent_child_deep",
    title: "부모·자녀 관계 심화분석",
    pages: [
      "https://husimcolor.com/manus-storage/parent-child-sample-09_7ba661de.png",
      "https://husimcolor.com/manus-storage/parent-child-sample-10_5de7904b.png",
    ],
  },
};

export function isSampleReportProduct(value: string | undefined): value is SampleReportProduct {
  return value === "personal_deep" || value === "couple_love_deep" || value === "parent_child_deep";
}

export function getSampleReport(value: string | undefined): SampleReport | null {
  return isSampleReportProduct(value) ? SAMPLE_REPORTS[value] : null;
}
