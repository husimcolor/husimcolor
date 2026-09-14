import { describe, expect, it } from "vitest";

import {
  getPrivateDocumentRetentionExpiresAt,
  getPrivatePdfFilename,
} from "../server/commerce/pdf-delivery-service";

describe("private PDF delivery policy", () => {
  it("keeps member documents for one year and guest documents for seven days", () => {
    const now = new Date("2026-09-12T00:00:00.000Z");
    expect(getPrivateDocumentRetentionExpiresAt("member", now).toISOString()).toBe("2027-09-12T00:00:00.000Z");
    expect(getPrivateDocumentRetentionExpiresAt("guest", now).toISOString()).toBe("2026-09-19T00:00:00.000Z");
  });

  it("uses attachment filenames without public result URLs", () => {
    expect(getPrivatePdfFilename("personal_deep")).toBe("휴심컬러_나의컬러심리해석.pdf");
    expect(getPrivatePdfFilename("couple_love_deep")).toBe("휴심컬러_부부연인_관계리포트.pdf");
    expect(getPrivatePdfFilename("parent_child_deep")).toBe("휴심컬러_부모자녀_관계리포트.pdf");
  });
});
