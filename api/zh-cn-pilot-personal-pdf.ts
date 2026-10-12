import type { VercelRequest, VercelResponse } from "@vercel/node";

import { createZhCnPilotPersonalPdfBuffer } from "../server/zh-cn-pilot-pdf-report";

export const config = {
  maxDuration: 30,
};

/** 공개 검토용 고정 가상 데이터 PDF만 반환한다. DB·주문·이메일을 읽거나 쓰지 않는다. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const pdf = await createZhCnPilotPersonalPdfBuffer();
    res.status(200);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Content-Disposition", "inline; filename=husimcolor-zh-cn-personal-pilot.pdf");
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.end(pdf);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to generate pilot PDF." });
  }
}
