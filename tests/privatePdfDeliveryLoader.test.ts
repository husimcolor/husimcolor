import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { loadPrivatePdfDeliveryService } from "../server/routers";

describe("private PDF delivery module loader", () => {
  it("loads the existing private PDF delivery service only when the delivery flow requests it", async () => {
    const service = await loadPrivatePdfDeliveryService();

    expect(service.queuePrivateAnalysisPdfDelivery).toBeTypeOf("function");
  });

  it("does not block Production paid-result delivery and keeps the import bundle-visible", () => {
    const source = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    expect(source).toContain('import("./commerce/pdf-delivery-service")');
    expect(source).not.toContain("PRIVATE_PDF_DELIVERY_RUNTIME_NOT_ENABLED");
  });
});
