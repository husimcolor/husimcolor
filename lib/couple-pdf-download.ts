import type { CouplePdfDownloadPayload } from "@/shared/couple-pdf-download";

export type CouplePdfReportInput = Omit<CouplePdfDownloadPayload, "generatedAt">;

/** 웹 결과에서 이미 산출한 부부·연인 분석만 PDF 계약으로 전달한다. */
export function buildCouplePdfDownloadPayload(input: CouplePdfReportInput): CouplePdfDownloadPayload {
  const now = new Date();
  return {
    ...input,
    generatedAt: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`,
  };
}
