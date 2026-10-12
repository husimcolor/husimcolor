import { describe, expect, it } from "vitest";
import {
  getKstDayRange,
  HOMEPAGE_VISITOR_COLLECTION_START_LABEL,
  OPERATIONS_REPORTING_START_AT,
} from "../server/commerce/admin-daily-operations-service";

describe("daily operations signal time boundaries", () => {
  it("uses a full KST calendar day instead of the server timezone", () => {
    const range = getKstDayRange(new Date("2026-10-11T16:30:00.000Z"));
    expect(range.label).toBe("2026-10-12");
    expect(range.start.toISOString()).toBe("2026-10-11T15:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-12T15:00:00.000Z");
  });

  it("preserves the requested reporting baseline without deleting source records", () => {
    expect(OPERATIONS_REPORTING_START_AT.toISOString()).toBe("2026-10-08T15:00:00.000Z");
    expect(HOMEPAGE_VISITOR_COLLECTION_START_LABEL).toBe("2026.10.12 KST");
  });
});
