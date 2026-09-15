import { describe, expect, it } from "vitest";

import {
  isApprovedPreviewOutboxCandidate,
  isPreviewOutboxManualVerificationEnabled,
} from "../server/commerce/preview-outbox-verification";

describe("approved Preview Outbox verification filter", () => {
  it("requires both existing Preview-only safety gates", () => {
    expect(isPreviewOutboxManualVerificationEnabled({ COMMERCE_TEST_MODE: "true", KAKAO_LOGIN_ENABLED: "true" })).toBe(true);
    expect(isPreviewOutboxManualVerificationEnabled({ COMMERCE_TEST_MODE: "true", KAKAO_LOGIN_ENABLED: "false" })).toBe(false);
    expect(isPreviewOutboxManualVerificationEnabled({ COMMERCE_TEST_MODE: "false", KAKAO_LOGIN_ENABLED: "true" })).toBe(false);
  });

  it("allows only the approved support recipient test candidates", () => {
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "account_link",
      recipientMatchesSupport: true,
      accountLinkStatus: "pending",
      accountLinkUnexpired: true,
      supportSubject: null,
    })).toBe(true);
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "support_notification",
      recipientMatchesSupport: true,
      accountLinkStatus: null,
      accountLinkUnexpired: null,
      supportSubject: "[Preview Test] Outbox verification",
    })).toBe(true);
  });

  it("rejects PDFs, non-test inquiries, wrong recipients, and unusable challenges", () => {
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "analysis_result_pdf",
      recipientMatchesSupport: true,
      accountLinkStatus: null,
      accountLinkUnexpired: null,
      supportSubject: null,
    })).toBe(false);
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "support_notification",
      recipientMatchesSupport: true,
      accountLinkStatus: null,
      accountLinkUnexpired: null,
      supportSubject: "일반 문의",
    })).toBe(false);
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "account_link",
      recipientMatchesSupport: false,
      accountLinkStatus: "pending",
      accountLinkUnexpired: true,
      supportSubject: null,
    })).toBe(false);
    expect(isApprovedPreviewOutboxCandidate({
      purpose: "account_link",
      recipientMatchesSupport: true,
      accountLinkStatus: "expired",
      accountLinkUnexpired: false,
      supportSubject: null,
    })).toBe(false);
  });
});
