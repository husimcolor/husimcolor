import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { getTossTestTerminalOutcome } from "../server/commerce/order-service";

describe("Toss test failure redirect lifecycle", () => {
  it("classifies buyer exits as cancellations and other Toss failures as failures", () => {
    expect(getTossTestTerminalOutcome("PAY_PROCESS_CANCELED")).toBe("cancelled");
    expect(getTossTestTerminalOutcome("PAY_PROCESS_ABORTED")).toBe("cancelled");
    expect(getTossTestTerminalOutcome("REJECT_CARD_PAYMENT")).toBe("failed");
  });

  it("keeps the failure path separate from Toss approval and releases the reserved coupon in the shared terminal transition", () => {
    const source = readFileSync("server/commerce/order-service.ts", "utf8");
    const failureHandler = source.slice(source.indexOf("export async function completeTossTestPaymentFailure"));

    expect(failureHandler).toContain('provider: "toss_pg"');
    expect(failureHandler).toContain("outcome,");
    expect(failureHandler).not.toContain("confirmTossTestPayment(");
    expect(source).toContain("await releaseCouponReservation(tx, record.orderId);");
  });

  it("exposes a bounded public Preview callback contract without accepting a client amount", () => {
    const routerSource = readFileSync("server/routers.ts", "utf8");
    const endpoint = routerSource.slice(routerSource.indexOf("completeTossTestFailure:"), routerSource.indexOf("completeTossLive:"));

    expect(endpoint).toContain("orderNumber: z.string().min(8).max(64)");
    expect(endpoint).toContain("errorCode: z.string().min(1).max(120)");
    expect(endpoint).not.toContain("amountKrw");
  });
});
