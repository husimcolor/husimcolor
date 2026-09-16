import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { registerLegacyAdminRoutes } from "../server/_core/legacy-admin";

const LEGACY_ADMIN_ACTIONS = new Set([
  "legacy-admin-login",
  "legacy-admin-session",
  "legacy-admin-logout",
]);

export function resolveLegacyAdminPath(action: unknown) {
  if (typeof action !== "string" || !LEGACY_ADMIN_ACTIONS.has(action)) return null;
  return `/api/auth/${action}`;
}

const app = express();
app.use(express.json({ limit: "8kb" }));
app.use(express.urlencoded({ limit: "8kb", extended: true }));
registerLegacyAdminRoutes(app);

/**
 * Preview Vercel root function that exposes only the pre-existing legacy
 * administrator routes. It does not create a new authentication mechanism.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const path = resolveLegacyAdminPath(req.query.action);
  if (!path) {
    res.status(404).json({ error: "LEGACY_ADMIN_ROUTE_NOT_FOUND" });
    return;
  }

  const requestUrl = new URL(req.url ?? "/", "https://internal.invalid");
  requestUrl.searchParams.delete("action");
  req.url = `${path}${requestUrl.search}`;
  return app(req as any, res as any);
}
