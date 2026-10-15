import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getSampleReportFileName,
  isSampleReportProduct,
  type SampleReportProduct,
} from "../shared/sample-reports";
import type { AppLocale } from "../shared/localization";

export type PublicSampleReportDownload = {
  content: Buffer;
  filename: string;
  product: SampleReportProduct;
  locale: AppLocale;
};

function normalizeLocale(value: unknown): AppLocale | null {
  return value === "ko" || value === "zh-CN" ? value : null;
}

/**
 * 고객 문서·주문·분석 결과와 완전히 분리된 공개 샘플만 반환한다.
 * 파일명은 product/locale allow-list에서만 생성하여 경로 이탈을 막는다.
 */
export async function getPublicSampleReportDownload(input: {
  product: unknown;
  locale: unknown;
}): Promise<PublicSampleReportDownload> {
  const product = typeof input.product === "string" ? input.product : undefined;
  if (!isSampleReportProduct(product)) {
    throw new Error("PUBLIC_SAMPLE_PRODUCT_NOT_FOUND");
  }
  const locale = normalizeLocale(input.locale);
  if (!locale) throw new Error("PUBLIC_SAMPLE_LOCALE_NOT_FOUND");

  const filename = getSampleReportFileName(product, locale);
  if (!filename) throw new Error("PUBLIC_SAMPLE_FILE_NOT_FOUND");

  const root = path.resolve(process.cwd(), "public", "sample-reports");
  const filePath = path.resolve(root, filename);
  if (!filePath.startsWith(`${root}${path.sep}`)) throw new Error("PUBLIC_SAMPLE_PATH_INVALID");

  return {
    content: await readFile(filePath),
    filename,
    product,
    locale,
  };
}
