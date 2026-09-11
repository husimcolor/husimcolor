import type { ParentChildPdfDownloadPayload } from "@/shared/parent-child-pdf-download";

export type ParentChildPdfReportInput = Omit<ParentChildPdfDownloadPayload, "generatedAt">;

/** 현재 부모·자녀 결과 화면에서 확정된 문장만 PDF 계약으로 전달한다. */
export function buildParentChildPdfDownloadPayload(input: ParentChildPdfReportInput): ParentChildPdfDownloadPayload {
  const now = new Date();
  return {
    ...input,
    generatedAt: `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`,
  };
}
