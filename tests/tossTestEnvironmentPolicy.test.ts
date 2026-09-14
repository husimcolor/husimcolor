import { describe, expect, it, vi } from "vitest";

describe("Toss test environment policy", () => {
  it("never permits a Production deployment to expose Toss test checkout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_example");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_example");
    const { isTossTestPaymentEnabled } = await import("../server/commerce/toss-test-provider");
    expect(isTossTestPaymentEnabled()).toBe(false);
  });

  it("permits an explicitly configured Vercel Preview deployment", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMMERCE_TEST_MODE", "true");
    vi.stubEnv("TOSS_TEST_CLIENT_KEY", "test_ck_example");
    vi.stubEnv("TOSS_TEST_SECRET_KEY", "test_sk_example");
    const { isTossTestPaymentEnabled } = await import("../server/commerce/toss-test-provider");
    expect(isTossTestPaymentEnabled()).toBe(true);
  });
});
