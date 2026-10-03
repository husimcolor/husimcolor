import { describe, expect, it } from "vitest";

import { getCurrentVercelOidcToken, runWithVercelRequestContext } from "../server/vercel-request-context";

describe("Vercel request context bridge", () => {
  it("makes the current function request OIDC header available to server-only Blob SDK calls", () => {
    const token = runWithVercelRequestContext(
      { "x-vercel-oidc-token": "preview-rotating-oidc-token" },
      () => getCurrentVercelOidcToken(),
    );

    expect(token).toBe("preview-rotating-oidc-token");
  });
});
