import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { processDuePrivatePdfOutbox } from "../server/commerce/email-outbox-service";
import { isAuthorizedOutboxCronRequest } from "../server/commerce/outbox-cron-auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  if (!isAuthorizedOutboxCronRequest(req.headers.authorization)) {
    return res.status(401).json({ error: "UNAUTHORIZED" });
  }
  try {
    const result = await processDuePrivatePdfOutbox(10);
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "OUTBOX_CRON_FAILED",
    });
  }
}
