import { AsyncLocalStorage } from "node:async_hooks";

type RequestHeaders = Record<string, string | string[] | undefined>;

const oidcStorage = new AsyncLocalStorage<{ oidcToken?: string }>();

function singleHeaderValue(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : Array.isArray(value) ? value[0]?.trim() : undefined;
}

/**
 * Vercel's native request-context global is immutable in the prebuilt Node
 * runtime. Keep the current request's short-lived OIDC header in a separate
 * AsyncLocalStorage scope and pass it explicitly to the Blob SDK. No token is
 * persisted or exposed to a client.
 */

export function runWithVercelRequestContext<T>(
  headers: RequestHeaders,
  callback: () => T,
): T {
  return oidcStorage.run({ oidcToken: singleHeaderValue(headers["x-vercel-oidc-token"]) }, callback);
}

export function getCurrentVercelOidcToken(): string | undefined {
  return oidcStorage.getStore()?.oidcToken;
}
