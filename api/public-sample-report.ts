import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getPublicSampleReportDownload } from "../server/public-sample-report-service";

export const config = { maxDuration: 30 };

function queryValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function setPdfHeaders(res: VercelResponse, filename: string, length: number, download: boolean) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(length));
  res.setHeader(
    "Content-Disposition",
    `${download ? "attachment" : "inline"}; filename="husimcolor-sample-report.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  // locale가 URL에 포함돼도 브라우저 PDF 뷰어는 문서 메타데이터를 별도 캐시할 수 있다.
  // 언어 전환·문안 보정 뒤 이전 파일이 남지 않도록 재검증만 허용한다.
  res.setHeader("Cache-Control", "no-cache, max-age=0, must-revalidate");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // 글로벌 DENY 정책을 완화하는 범위는 동일 origin의 공개 샘플 viewer 한 곳뿐이다.
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Accept-Ranges", "bytes");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const sample = await getPublicSampleReportDownload({
      product: queryValue(req.query.product),
      locale: queryValue(req.query.locale),
    });
    const download = queryValue(req.query.download) === "1";
    const range = typeof req.headers.range === "string" ? req.headers.range : undefined;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/u.exec(range);
      const start = match?.[1] ? Number(match[1]) : 0;
      const end = match?.[2] ? Number(match[2]) : sample.content.length - 1;
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || start >= sample.content.length) {
        res.setHeader("Content-Range", `bytes */${sample.content.length}`);
        res.status(416).end();
        return;
      }
      const boundedEnd = Math.min(end, sample.content.length - 1);
      const chunk = sample.content.subarray(start, boundedEnd + 1);
      setPdfHeaders(res, sample.filename, chunk.length, download);
      res.setHeader("Content-Range", `bytes ${start}-${boundedEnd}/${sample.content.length}`);
      res.status(206);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      res.end(chunk);
      return;
    }

    setPdfHeaders(res, sample.filename, sample.content.length, download);
    res.status(200);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(sample.content);
  } catch {
    // 공개 allow-list 외의 product/locale 및 missing asset은 세부 경로를 노출하지 않는다.
    res.status(404).json({ error: "PUBLIC_SAMPLE_NOT_AVAILABLE" });
  }
}
