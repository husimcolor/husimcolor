import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  headers: Record<string, string | string[] | undefined>;
};

const contextStorage = new AsyncLocalStorage<RequestContext>();
const requestContextSymbol = Symbol.for("@vercel/request-context");
const globalContext = globalThis as typeof globalThis & {
  [requestContextSymbol]?: { get?: () => unknown };
};
const nativeRequestContext = globalContext[requestContextSymbol];

/**
 * The Vercel Blob SDK reads the short-lived OIDC token through this global
 * request-context contract. The Express adapter used by the tRPC function does
 * not create that context itself, so bridge only the current request headers
 * through AsyncLocalStorage. No token is persisted or exposed to a client.
 */
globalContext[requestContextSymbol] = {
  get() {
    return contextStorage.getStore() ?? nativeRequestContext?.get?.() ?? {};
  },
};

export function runWithVercelRequestContext<T>(
  headers: Record<string, string | string[] | undefined>,
  callback: () => T,
): T {
  return contextStorage.run({ headers }, callback);
}
