import { describe, expect, it } from "vitest";

import { formatKstDateTime } from "../lib/kst-date";

describe("formatKstDateTime", () => {
  it("formats a UTC-stored telephone coaching slot in Asia/Seoul", () => {
    expect(formatKstDateTime("2026-10-26T11:00:00.000Z")).toBe("2026.10.26 20:00");
  });

  it("returns a placeholder for a missing or invalid value", () => {
    expect(formatKstDateTime(null)).toBe("—");
    expect(formatKstDateTime("not-a-date")).toBe("—");
  });
});
