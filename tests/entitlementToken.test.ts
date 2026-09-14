import { afterEach, describe, expect, it, vi } from "vitest";
import { createAnalysisDeliveryGrant, createEntitlementStartGrant, verifyAnalysisDeliveryGrant } from "../server/commerce/entitlement-service";

describe("entitlement start token", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("creates a signed, product-scoped, expiring token without exposing customer email", () => {
    vi.stubEnv("COMMERCE_EMAIL_HASH_SECRET", "1234567890abcdef1234567890abcdef1234567890abcdef");
    const grant = createEntitlementStartGrant({
      entitlementId: 31,
      customerId: 17,
      productCode: "personal_deep",
    });
    expect(grant.entitlementId).toBe(31);
    expect(grant.productCode).toBe("personal_deep");
    expect(grant.accessToken).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(grant.accessToken).not.toContain("@example.com");
    expect(new Date(grant.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("binds a result delivery token to one analysis run and product", () => {
    vi.stubEnv("COMMERCE_EMAIL_HASH_SECRET", "1234567890abcdef1234567890abcdef1234567890abcdef");
    const grant = createAnalysisDeliveryGrant({
      analysisRunId: 91,
      customerId: 42,
      productCode: "personal_deep",
      accessMode: "guest",
    });
    expect(verifyAnalysisDeliveryGrant({
      accessToken: grant.accessToken,
      analysisRunId: 91,
      productCode: "personal_deep",
    }).customerId).toBe(42);
    expect(() => verifyAnalysisDeliveryGrant({
      accessToken: grant.accessToken,
      analysisRunId: 92,
      productCode: "personal_deep",
    })).toThrow("ANALYSIS_DELIVERY_TOKEN_EXPIRED_OR_INVALID");
  });
});
