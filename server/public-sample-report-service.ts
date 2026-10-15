import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getSampleReportFileName,
  isSampleReportProduct,
  type SampleReportProduct,
} from "../shared/sample-reports";

export type PublicSampleReportDownload = {
  content: Buffer;
  filename: string;
  product: SampleReportProduct;
};

/**
 * 고객 문서·주문·분석 결과와 완전히 분리된 한국어 공개 샘플만 반환한다.
 * 파일명은 product allow-list에서만 생성하여 경로 이탈을 막는다.
 */
export async function getPublicSampleReportDownload(input: {
  product: unknown;
}): Promise<PublicSampleReportDownload> {
  const product = typeof input.product === "string" ? input.product : undefined;
  if (!isSampleReportProduct(product)) {
    throw new Error("PUBLIC_SAMPLE_PRODUCT_NOT_FOUND");
  }

  const filename = getSampleReportFileName(product);
  const root = path.resolve(process.cwd(), "public", "sample-reports");
  const filePath = path.resolve(root, filename);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    throw new Error("PUBLIC_SAMPLE_PATH_INVALID");
  }

  return {
    content: await readFile(filePath),
    filename,
    product,
  };
}
