import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { normalizeCoachingBlackoutDates } from "../server/commerce/coaching-blackout-service";

const routerSource = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const serviceSource = readFileSync(resolve(process.cwd(), "server/commerce/coaching-blackout-service.ts"), "utf8");
const adminSource = readFileSync(resolve(process.cwd(), "app/(tabs)/admin.tsx"), "utf8");

describe("coaching temporary blackout dates", () => {
  it("uses the existing admin_settings value shape and safely normalizes operator input", () => {
    expect(normalizeCoachingBlackoutDates([
      { date: "2026-10-01", note: "외부 일정", createdAt: "2026-09-28T00:00:00.000Z", createdBy: "legacy_password_admin" },
      { date: "bad-date", note: "discard" },
      { date: "2026-10-01", note: "수정 메모", createdBy: "authenticated_admin" },
    ])).toEqual([
      { date: "2026-10-01", note: "수정 메모", createdAt: "", createdBy: "authenticated_admin" },
    ]);
    expect(serviceSource).toContain('COACHING_BLACKOUT_SETTINGS_KEY = "coaching_blackout_dates_v1"');
    expect(serviceSource).toContain("adminSettings");
    expect(serviceSource).not.toMatch(/delete\s+from\s+coaching_bookings/i);
  });

  it("checks confirmed in-person bookings before saving and preserves them without cancellation", () => {
    expect(serviceSource).toContain('eq(coachingBookings.status, "scheduled")');
    expect(serviceSource).toContain('eq(coachingBookings.sessionMode, "in_person")');
    expect(serviceSource).toContain('reason: "CONFIRMED_BOOKINGS_EXIST"');
    expect(serviceSource).not.toContain("coachingBookings).delete");
    expect(serviceSource).toContain('action: "coaching_blackout_created"');
    expect(serviceSource).toContain('action: "coaching_blackout_removed"');
  });

  it("exposes only date values to the public availability query and keeps management admin-only", () => {
    expect(routerSource).toContain("offlineCoachingAvailability: publicProcedure");
    expect(routerSource).toContain("blackoutDates: await getPublicCoachingBlackoutDates");
    expect(routerSource).toContain("coachingBlackoutDates: adminProcedure");
    expect(routerSource).toContain("createCoachingBlackoutDate: adminProcedure");
    expect(routerSource).toContain("removeCoachingBlackoutDate: adminProcedure");
  });

  it("renders the existing legacy password admin controls without exposing notes to customers", () => {
    expect(adminSource).toContain("예약 불가일 (임시 휴무)");
    expect(adminSource).toContain("기존 예약은 변경하지 않았습니다");
    expect(adminSource).toContain("createCoachingBlackoutDate");
    expect(adminSource).toContain("removeCoachingBlackoutDate");
  });
});
