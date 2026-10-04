import { describe, expect, it } from "vitest";

import {
  OPENING_CAMPAIGN_COUPON_CODE,
  isOpeningCampaignActive,
  isOpeningCampaignAvailable,
} from "../shared/opening-campaign";

describe("opening campaign", () => {
  it("remains visible through 2026-10-30 23:59:59 KST and hides immediately after", () => {
    expect(isOpeningCampaignActive(new Date("2026-10-30T23:59:59+09:00"))).toBe(true);
    expect(isOpeningCampaignActive(new Date("2026-10-31T00:00:00+09:00"))).toBe(false);
  });

  it("applies only to the three paid analysis products", () => {
    expect(isOpeningCampaignAvailable("personal_deep", new Date("2026-10-03T12:00:00+09:00"))).toBe(true);
    expect(isOpeningCampaignAvailable("couple_love_deep", new Date("2026-10-03T12:00:00+09:00"))).toBe(true);
    expect(isOpeningCampaignAvailable("parent_child_deep", new Date("2026-10-03T12:00:00+09:00"))).toBe(true);
    expect(isOpeningCampaignAvailable("personal_coaching", new Date("2026-10-03T12:00:00+09:00"))).toBe(false);
    expect(isOpeningCampaignAvailable("couple_coaching", new Date("2026-10-03T12:00:00+09:00"))).toBe(false);
  });

  it("uses one public event code only through the campaign control", () => {
    expect(OPENING_CAMPAIGN_COUPON_CODE).toBe("OCT20OPEN2026");
  });
});
