import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { getPrivateAnalysisPdfDownload } from "../server/commerce/private-pdf-download-service";
import { getRelationshipPrivatePdfDownload } from "../server/commerce/relationship-invite-service";

export const config = { maxDuration: 30 };

function queryValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function setDownloadHeaders(res: VercelResponse, filename: string, length: number) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Length", String(length));
  res.setHeader("Content-Disposition", `attachment; filename="husimcolor-report.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`);
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const relationshipToken = queryValue(req.query.relationshipToken);
    const resultToken = queryValue(req.query.resultToken);
    const download = relationshipToken || resultToken
      ? await getRelationshipPrivatePdfDownload({ accessToken: relationshipToken, resultToken })
      : await getPrivateAnalysisPdfDownload({
          analysisRunId: Number(queryValue(req.query.analysisRunId)),
          productCode: queryValue(req.query.productCode) as "personal_deep" | "couple_love_deep" | "parent_child_deep",
          deliveryToken: queryValue(req.query.deliveryToken) ?? "",
        });

    setDownloadHeaders(res, download.filename, download.content.length);
    res.status(200);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(download.content);
  } catch {
    // Tokens and storage details must not leak to an unauthorised caller.
    res.status(404).json({ error: "PDF_NOT_AVAILABLE" });
  }
}
