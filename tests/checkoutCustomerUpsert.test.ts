import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(__dirname, "../server/commerce/order-service.ts"), "utf8");

describe("checkout customer upsert", () => {
  it("uses an atomic email-hash upsert before resolving the customer row", () => {
    expect(source).toContain("await tx.insert(customers).values({");
    expect(source).toContain("userId: null");
    expect(source).toContain("onDuplicateKeyUpdate({ set: { emailHash } })");
    expect(source).toContain("const resolvedCustomerRows = await tx");
    expect(source).toContain("CHECKOUT_CUSTOMER_RESOLUTION_FAILED");
  });
});
