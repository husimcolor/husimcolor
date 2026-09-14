import { describe, expect, it } from "vitest";

import { getResendConfig, listResendDomains } from "../server/commerce/resend-provider";

describe("Resend credential integration", () => {
  it("authenticates the configured API key by listing domains without sending an email", async () => {
    const config = getResendConfig();
    expect(config.fromEmail).toBe("result@husimcolor.com");

    const domains = await listResendDomains();
    const husimcolor = domains.find((domain) => domain.name === "husimcolor.com");
    expect(husimcolor).toBeDefined();
    expect(husimcolor?.status).toMatch(/verified|active/i);
  }, 15_000);
});
