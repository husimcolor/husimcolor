import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createParentChildPdfBuffer, validateParentChildPdfPayload } from "../server/parent-child-pdf-report";

export const config = {
  maxDuration: 30,
  api: { bodyParser: { sizeLimit: "1mb" } },
};

function getBodyField(body: unknown, key: "payload" | "requestId"): string | undefined {
  if (typeof body === "string") return new URLSearchParams(body).get(key) ?? undefined;
  if (Buffer.isBuffer(body)) return new URLSearchParams(body.toString("utf8")).get(key) ?? undefined;
  if (body && typeof body === "object" && key in body) {
    const value = (body as Record<string, unknown>)[key];
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const rawPayload = getBodyField(req.body, "payload");
    if (!rawPayload) throw new Error("부모·자녀 PDF 리포트 데이터가 없습니다.");
    const requestId = getBodyField(req.body, "requestId");
    if (requestId && !/^[A-Za-z0-9_-]{8,80}$/.test(requestId)) throw new Error("PDF 다운로드 요청이 올바르지 않습니다.");
    const payload = validateParentChildPdfPayload(JSON.parse(rawPayload));
    const pdf = await createParentChildPdfBuffer(payload);
    const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
    const filename = `휴심컬러_${payload.relationship.labels.parent}-${payload.relationship.labels.child}_감성심리코칭리포트_${date}.pdf`;
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", `attachment; filename="husimcolor-parent-child-report-${date}.pdf"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader("Cache-Control", "no-store, max-age=0");
    if (requestId) res.setHeader("Set-Cookie", `husim_parent_child_pdf_download=${requestId}; Max-Age=90; Path=/; SameSite=Lax`);
    res.end(pdf);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "부모·자녀 PDF 리포트 생성에 실패했습니다." });
  }
}
