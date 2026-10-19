import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { assertExperienceRequestDate, getEarliestExperienceRequestDate, YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT } from "../server/commerce/year-end-three-color-experience-request-service";
import { appRouter } from "../server/routers";

describe("year-end three-color experience request safety contract", () => {
  it("accepts only the next KST calendar day through the event end date", () => {
    const now = new Date("2026-10-19T02:00:00.000Z");
    expect(getEarliestExperienceRequestDate(now)).toBe("2026-10-20");
    expect(() => assertExperienceRequestDate("2026-10-19", now)).toThrow("EXPERIENCE_REQUEST_DATE_OUT_OF_RANGE");
    expect(() => assertExperienceRequestDate("2026-12-01", now)).toThrow("EXPERIENCE_REQUEST_DATE_OUT_OF_RANGE");
    expect(() => assertExperienceRequestDate("2026-10-20", now)).not.toThrow();
    expect(() => assertExperienceRequestDate("2026-11-30", now)).not.toThrow();
  });

  it("closes after the Korean-time event boundary", () => {
    expect(() => assertExperienceRequestDate("2026-11-30", new Date(YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT + 1))).toThrow("EXPERIENCE_EVENT_ENDED");
  });

  it("stores only encrypted PII with a dedicated idempotency ledger", () => {
    const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
    expect(schema).toContain('"year_end_three_color_experience_requests"');
    expect(schema).toContain("nameEncrypted");
    expect(schema).toContain("contactPhoneEncrypted");
    expect(schema).toContain("idempotencyKeyHash");
    expect(schema).toContain("requestFingerprintHash");
    expect(schema).toContain("cancellationReasonEncrypted");
  });

  it("does not call payment, order, entitlement, PDF, or email delivery paths", () => {
    const service = readFileSync(resolve(process.cwd(), "server/commerce/year-end-three-color-experience-request-service.ts"), "utf8");
    for (const forbidden of ["paymentTransactions", "orders", "entitlements", "emailOutbox", "privateDocuments", "createToss", "deliver"]) expect(service).not.toContain(forbidden);
    expect(service).toContain("timingSafeEqual");
    expect(service).toContain("CREATE TABLE IF NOT EXISTS");
    expect(service).toContain("EXPERIENCE_REQUEST_IDEMPOTENCY_CONFLICT");
    expect(service).toContain("EXPERIENCE_REQUEST_STATUS_CONFLICT");
    expect(service).toContain("cancellationReasonEncrypted");
    expect(service).toContain("cancelledAt");
  });

  it("keeps the migration additive and isolated from commerce ledgers", () => {
    const migration = readFileSync(resolve(process.cwd(), "drizzle/0020_year_end_three_color_experience_requests.sql"), "utf8");
    const cancellationMigration = readFileSync(resolve(process.cwd(), "drizzle/0021_year_end_three_color_experience_request_cancellation.sql"), "utf8");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests`");
    expect(cancellationMigration).toContain("cancellationReasonEncrypted");
    expect(cancellationMigration).not.toContain("confirmed_slots");
    for (const forbidden of ["ALTER TABLE `orders`", "payment_transactions", "email_outbox", "entitlements"]) expect(migration).not.toContain(forbidden);
  });

  it("allows multiple applications and confirmations for the same product and date without a system capacity limit", () => {
    const service = readFileSync(resolve(process.cwd(), "server/commerce/year-end-three-color-experience-request-service.ts"), "utf8");
    expect(service).not.toContain("yearEndThreeColorExperienceConfirmedSlots");
    expect(service).not.toContain("EXPERIENCE_REQUEST_CONFIRMATION_FULL");
    expect(service).not.toContain("count(");
  });

  it("keeps an admin-only cancellation reason and timestamp without a refund path", () => {
    const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
    const admin = readFileSync(resolve(process.cwd(), "app/(tabs)/admin.tsx"), "utf8");
    expect(router).toContain("cancellationReason: z.string().trim().max(500).optional()");
    expect(admin).toContain("예약 확정 확인");
    expect(admin).toContain("예약 확정 저장");
    expect(admin).toContain("setConfirmingExperienceRequest({ id: item.id, productLabel: item.productLabel })");
    expect(admin).toContain("예약 취소 확인");
    expect(admin).toContain("취소 사유 (선택 입력, 관리자용)");
    expect(admin).toContain("취소 {dateText(item.cancelledAt)}");
    expect(admin).toContain("같은 날짜의 다른 체험 신청은 제한하지 않으며");
    expect(admin).not.toContain("환불 처리");
  });

  it("rejects missing homepage-server authorization before the mutation can reach the database", async () => {
    const caller = appRouter.createCaller({
      req: { header: () => undefined } as any,
      res: {} as any,
      user: null,
      legacyAdmin: false,
    });
    await expect(caller.experienceRequests.submit({
      productCode: "personal_three_color_experience",
      preferredDate: "2026-10-20",
      preferredTime: "10:00",
      name: "테스트",
      contactPhone: "010-0000-0000",
      privacyConsentAccepted: true,
      idempotencyKey: "a".repeat(32),
    })).rejects.toMatchObject({ code: "UNAUTHORIZED", message: "LANDING_REQUEST_UNAUTHORIZED" });
  });
});
