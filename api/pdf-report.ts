import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPremiumPdfBuffer, validatePremiumPdfPayload } from "../server/pdf-report";

export const config = {
  maxDuration: 30,
  api: { bodyParser: { sizeLimit: "1mb" } },
};

function getPayloadValue(body: unknown): string | undefined {
  if (typeof body === "string") return new URLSearchParams(body).get("payload") ?? undefined;
  if (Buffer.isBuffer(body)) return new URLSearchParams(body.toString("utf8")).get("payload") ?? undefined;
  if (body && typeof body === "object" && "payload" in body) {
    const value = (body as { payload?: unknown }).payload;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

function getRequestId(body: unknown): string | undefined {
  const value = typeof body === "string"
    ? new URLSearchParams(body).get("requestId")
    : Buffer.isBuffer(body)
      ? new URLSearchParams(body.toString("utf8")).get("requestId")
      : body && typeof body === "object" && "requestId" in body
        ? (body as { requestId?: unknown }).requestId
        : undefined;
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,80}$/.test(value) ? value : undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const rawPayload = getPayloadValue(req.body);
    if (!rawPayload) throw new Error("PDF 리포트 데이터가 없습니다.");
    const requestId = getRequestId(req.body);
    const payload = validatePremiumPdfPayload(JSON.parse(rawPayload));
    const pdf = await createPremiumPdfBuffer(payload);
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const filename = `휴심컬러_나의컬러심리해석_${date}.pdf`;
    const encodedName = encodeURIComponent(filename);
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", `attachment; filename="husimcolor-color-report-${date}.pdf"; filename*=UTF-8''${encodedName}`);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    if (requestId) res.setHeader("Set-Cookie", `husim_pdf_download=${requestId}; Max-Age=90; Path=/; SameSite=Lax`);
    res.end(pdf);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "PDF 리포트 생성에 실패했습니다." });
  }
}
