// Preconfigured storage helpers for Manus WebDev templates
// Uploads via Forge Server presigned URL to S3 (PUT direct).
// Downloads return /manus-storage/{key} paths served via 307 redirect.

import { ENV } from "./_core/env";

type StorageEnvironment = Record<string, string | undefined>;

export type StorageBackend = "vercel_blob" | "manus_forge" | "unconfigured";

/**
 * Vercel deployments do not receive Manus WebDev's Forge credentials. A private
 * Vercel Blob store is therefore preferred when its project-scoped credentials
 * are present; local WebDev continues to use the existing Forge storage path.
 */
export function resolveStorageBackend(env: StorageEnvironment = process.env): StorageBackend {
  const hasVercelOidc = Boolean(env.BLOB_STORE_ID && env.VERCEL_OIDC_TOKEN);
  const hasVercelStaticToken = Boolean(env.BLOB_READ_WRITE_TOKEN);
  if (hasVercelOidc || hasVercelStaticToken) return "vercel_blob";
  if (env.BUILT_IN_FORGE_API_URL && env.BUILT_IN_FORGE_API_KEY) return "manus_forge";
  return "unconfigured";
}

function isVercelBlobKey(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY",
    );
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (resolveStorageBackend() === "vercel_blob") {
    const { put } = await import("@vercel/blob");
    const uploadData = typeof data === "string" ? data : Buffer.from(data);
    const stored = await put(key, uploadData, {
      access: "private",
      addRandomSuffix: true,
      contentType,
    });
    // The private Blob URL is an opaque server-side storage key; clients never
    // receive it without an authenticated, short-lived signed URL.
    return { key: stored.url, url: stored.url };
  }

  const { forgeUrl, forgeKey } = getForgeConfig();

  // 1. Get presigned PUT URL from Forge
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  // 2. PUT file directly to S3
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  if (isVercelBlobKey(relKey)) {
    if (resolveStorageBackend() !== "vercel_blob") {
      throw new Error("Private Blob storage is not configured for this runtime");
    }
    const { issueSignedToken, presignUrl } = await import("@vercel/blob");
    const pathname = new URL(relKey).pathname.replace(/^\/+/, "");
    const validUntil = Date.now() + 5 * 60 * 1000;
    const signedToken = await issueSignedToken({ pathname, operations: ["get"], validUntil });
    return (await presignUrl(signedToken, {
      operation: "get",
      pathname,
      access: "private",
      validUntil,
    })).presignedUrl;
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = normalizeKey(relKey);

  const getUrl = new URL("v1/storage/presign/get", forgeUrl + "/");
  getUrl.searchParams.set("path", key);

  const resp = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { url } = (await resp.json()) as { url: string };
  return url;
}

/** Reads either private Blob content or the existing Forge-backed object. */
export async function storageGetBuffer(relKey: string): Promise<Buffer> {
  if (isVercelBlobKey(relKey)) {
    if (resolveStorageBackend() !== "vercel_blob") {
      throw new Error("Private Blob storage is not configured for this runtime");
    }
    const { get } = await import("@vercel/blob");
    const result = await get(relKey, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) throw new Error("PRIVATE_PDF_READ_FAILED");
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  const signedUrl = await storageGetSignedUrl(relKey);
  const response = await fetch(signedUrl);
  if (!response.ok) throw new Error(`PRIVATE_PDF_READ_FAILED_${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
