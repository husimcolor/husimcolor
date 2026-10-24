import crypto from "node:crypto";
import { z } from "zod";

const bridgeSecretName = "HUSIM_EBOOK_ADMIN_BRIDGE_SECRET";
const listPath = "/api/internal/ebook-admin/orders/list";
const resendPath = "/api/internal/ebook-admin/orders/resend";

const orderSchema = z.object({
  id: z.number().int().positive(),
  orderNumber: z.string().min(1).max(100),
  bookTitle: z.string().min(1).max(300),
  amountKrw: z.number().int().nonnegative(),
  pageCount: z.number().int().positive(),
  status: z.enum(["pending", "paid", "payment_failed"]),
  environment: z.enum(["test", "live"]),
  buyerName: z.string().max(100),
  buyerEmail: z.string().max(320),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
  emailStatus: z.enum(["not_attempted", "sent", "failed", "skipped"]),
  emailAttemptedAt: z.string().nullable(),
});

function getConfiguration() {
  const rawBaseUrl = process.env.HUSIM_EBOOK_ADMIN_BASE_URL?.trim() || "https://husimcolor.com";
  const secret = process.env[bridgeSecretName];
  if (!rawBaseUrl || !secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("EBOOK_ADMIN_BRIDGE_UNAVAILABLE");
  }
  let baseUrl: URL;
  try {
    baseUrl = new URL(rawBaseUrl);
  } catch {
    throw new Error("EBOOK_ADMIN_BRIDGE_UNAVAILABLE");
  }
  if (baseUrl.protocol !== "https:" || baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("EBOOK_ADMIN_BRIDGE_UNAVAILABLE");
  }
  return { baseUrl: baseUrl.origin, secret };
}

function createSignature(secret: string, path: string, timestamp: string, body: unknown) {
  const bodyHash = crypto.createHash("sha256").update(JSON.stringify(body ?? {}), "utf8").digest("hex");
  return crypto.createHmac("sha256", secret).update(`POST\n${path}\n${timestamp}\n${bodyHash}`, "utf8").digest("hex");
}

async function requestBridge<T>(path: string, body: unknown, schema: z.ZodType<T>) {
  const { baseUrl, secret } = getConfiguration();
  const timestamp = String(Date.now());
  const response = await fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-husim-ebook-timestamp": timestamp,
      "x-husim-ebook-signature": createSignature(secret, path, timestamp, body),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("EBOOK_ADMIN_BRIDGE_UNAVAILABLE");
  const parsed = schema.safeParse(await response.json());
  if (!parsed.success) throw new Error("EBOOK_ADMIN_BRIDGE_UNAVAILABLE");
  return parsed.data;
}

export async function getLandingEbookOrders(limit: number) {
  return requestBridge(listPath, { limit }, z.object({ orders: z.array(orderSchema) }));
}

export async function resendLandingEbookReceipt(orderId: number) {
  return requestBridge(resendPath, { orderId }, z.object({
    status: z.enum(["sent", "failed", "skipped"]),
    downloadExpiresAt: z.string().nullable(),
  }));
}

export const landingEbookAdminProxyTestUtils = { createSignature, listPath, resendPath };
