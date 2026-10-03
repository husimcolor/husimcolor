import { describe, expect, it } from "vitest";

import { resolveStorageBackend } from "../server/storage";

describe("private report storage backend", () => {
  it("uses a Vercel private Blob store from its Preview project connection", () => {
    expect(resolveStorageBackend({ BLOB_STORE_ID: "store_preview", VERCEL_OIDC_TOKEN: "rotating-token" })).toBe("vercel_blob");
    expect(resolveStorageBackend({ BLOB_STORE_ID: "store_preview" })).toBe("vercel_blob");
  });

  it("keeps the existing Forge storage backend for local WebDev runtime", () => {
    expect(resolveStorageBackend({ BUILT_IN_FORGE_API_URL: "https://forge.example", BUILT_IN_FORGE_API_KEY: "key" })).toBe("manus_forge");
  });

  it("does not silently choose a storage backend without credentials", () => {
    expect(resolveStorageBackend({})).toBe("unconfigured");
  });
});
