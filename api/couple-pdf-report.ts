import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createCouplePdfBuffer, validateCouplePdfPayload } from "../server/couple-pdf-report";

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
    if (!rawPayload) throw new Error("커플 PDF 리포트 데이터가 없습니다.");
    const requestId = getRequestId(req.body);
    const payload = validateCouplePdfPayload(JSON.parse(rawPayload));
    const pdf = await createCouplePdfBuffer(payload);
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const filename = `휴심컬러_${payload.relationType}_관계리포트_${date}.pdf`;
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", `attachment; filename="husimcolor-couple-report-${date}.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    if (requestId) res.setHeader("Set-Cookie", `husim_couple_pdf_download=${requestId}; Max-Age=90; Path=/; SameSite=Lax`);
    res.end(pdf);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "커플 PDF 리포트 생성에 실패했습니다." });
  }
}
