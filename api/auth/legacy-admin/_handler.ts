import "dotenv/config";
import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { registerLegacyAdminRoutes } from "../../../server/_core/legacy-admin";

const app = express();
app.use(express.json({ limit: "8kb" }));
registerLegacyAdminRoutes(app);

type LegacyAdminPath =
  | "/api/auth/legacy-admin-login"
  | "/api/auth/legacy-admin-session"
  | "/api/auth/legacy-admin-logout";

/**
 * Restores the original public URI inside each exact Vercel Function.
 * No new URI, alias, query-string dispatcher, or auth catch-all is introduced.
 */
export function createLegacyAdminHandler(pathname: LegacyAdminPath) {
  return function handler(req: VercelRequest, res: VercelResponse) {
    const requestUrl = req.url ?? "/";
    if (requestUrl === "/" || requestUrl.startsWith("?")) {
      req.url = `${pathname}${requestUrl === "/" ? "" : requestUrl}`;
    }
    return app(req as any, res as any);
  };
}
