import { describe, expect, it } from "vitest";

import { loadPrivatePdfDeliveryService } from "../server/routers";

describe("private PDF delivery module loader", () => {
  it("loads the existing private PDF delivery service only when the delivery flow requests it", async () => {
    const service = await loadPrivatePdfDeliveryService();

    expect(service.queuePrivateAnalysisPdfDelivery).toBeTypeOf("function");
  });
});
