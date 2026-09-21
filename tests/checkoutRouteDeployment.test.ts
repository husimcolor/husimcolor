import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");
const workflow = readFileSync(resolve(root, ".github/workflows/deploy.yml"), "utf8");

const checkoutAlias = '{ "src": "/commerce-checkout", "dest": "/commerce-checkout.html" }';
const spaFallback = '{ "src": "/((?!_expo/|assets/).*)", "dest": "/index.html" }';

describe("public checkout prebuilt route contract", () => {
  it("rewrites the customer-facing checkout URL to Expo's emitted public asset before the SPA fallback", () => {
    const aliasIndex = workflow.indexOf(checkoutAlias);
    const fallbackIndex = workflow.indexOf(spaFallback);

    expect(aliasIndex).toBeGreaterThan(-1);
    expect(fallbackIndex).toBeGreaterThan(aliasIndex);
  });

  it("keeps the route as a static alias rather than adding an API or payment path", () => {
    expect(checkoutAlias).toContain('"dest": "/commerce-checkout.html"');
    expect(checkoutAlias).not.toContain('"dest": "/api/');
    expect(workflow).not.toContain('api/checkout-route');
  });
});
