import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  assertExperienceRequestDate,
  assertExperienceRequestRelationship,
  getEarliestExperienceRequestDate,
  YEAR_END_THREE_COLOR_EXPERIENCE_EVENT_END_AT,
} from "../server/commerce/year-end-three-color-experience-request-service";
import { appRouter } from "../server/routers";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

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

  it("requires a relationship for new two-person requests and a child age only for parent-child", () => {
    expect(assertExperienceRequestRelationship({ productCode: "personal_three_color_experience" })).toEqual({ relationshipType: null, childAge: null });
    expect(assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience", relationshipType: "married_couple" })).toEqual({ relationshipType: "married_couple", childAge: null });
    expect(assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience", relationshipType: "lovers" })).toEqual({ relationshipType: "lovers", childAge: null });
    expect(assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience", relationshipType: "parent_child", childAge: 8 })).toEqual({ relationshipType: "parent_child", childAge: 8 });
    expect(() => assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience" })).toThrow("EXPERIENCE_REQUEST_RELATIONSHIP_REQUIRED");
    expect(() => assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience", relationshipType: "parent_child" })).toThrow("EXPERIENCE_REQUEST_CHILD_AGE_REQUIRED");
    expect(() => assertExperienceRequestRelationship({ productCode: "relationship_coaching_experience", relationshipType: "lovers", childAge: 8 })).toThrow("EXPERIENCE_REQUEST_CHILD_AGE_UNEXPECTED");
    expect(() => assertExperienceRequestRelationship({ productCode: "personal_three_color_experience", relationshipType: "lovers" })).toThrow("EXPERIENCE_REQUEST_RELATIONSHIP_UNEXPECTED");
  });

  it("keeps historical pre-marriage entries while new submissions use a distinct relation product code", () => {
    const schema = source("drizzle/schema.ts");
    const service = source("server/commerce/year-end-three-color-experience-request-service.ts");
    const router = source("server/routers.ts");
    expect(schema).toContain('"engaged_couple_three_color_experience", "relationship_coaching_experience"');
    expect(schema).toContain('relationshipType: mysqlEnum("relationshipType", ["married_couple", "lovers", "parent_child"])');
    expect(schema).toContain('childAgeEncrypted: text("childAgeEncrypted")');
    expect(service).toContain('engaged_couple_three_color_experience: "예비부부 3컬러 관계 체험"');
    expect(service).toContain('relationship_coaching_experience: "두 사람 관계코칭 체험"');
    expect(router).toContain('productCode: z.enum(["personal_three_color_experience", "relationship_coaching_experience"])');
    expect(router).not.toContain('productCode: z.enum(["personal_three_color_experience", "engaged_couple_three_color_experience"])');
  });

  it("stores relationship and child age only as protected values and includes them in the idempotency fingerprint", () => {
    const schema = source("drizzle/schema.ts");
    const service = source("server/commerce/year-end-three-color-experience-request-service.ts");
    expect(schema).toContain('"year_end_three_color_experience_requests"');
    expect(schema).toContain("nameEncrypted");
    expect(schema).toContain("contactPhoneEncrypted");
    expect(schema).toContain("childAgeEncrypted");
    expect(schema).toContain("idempotencyKeyHash");
    expect(schema).toContain("requestFingerprintHash");
    expect(service).toContain("childAgeEncrypted: relationship.childAge === null ? null : encryptCommerceValue(String(relationship.childAge))");
    expect(service).toContain("relationshipType: relationship.relationshipType");
    expect(service).toContain("childAge: relationship.childAge");
  });

  it("keeps migrations additive and isolated from commerce ledgers", () => {
    const createMigration = source("drizzle/0020_year_end_three_color_experience_requests.sql");
    const cancellationMigration = source("drizzle/0021_year_end_three_color_experience_request_cancellation.sql");
    const relationshipMigration = source("drizzle/0022_year_end_three_color_relationship_details.sql");
    expect(createMigration).toContain("CREATE TABLE IF NOT EXISTS `year_end_three_color_experience_requests`");
    expect(cancellationMigration).toContain("cancellationReasonEncrypted");
    expect(relationshipMigration).toContain("relationship_coaching_experience");
    expect(relationshipMigration).toContain("childAgeEncrypted");
    for (const migration of [createMigration, cancellationMigration, relationshipMigration]) {
      for (const forbidden of ["ALTER TABLE `orders`", "payment_transactions", "email_outbox", "entitlements", "confirmed_slots"]) expect(migration).not.toContain(forbidden);
    }
  });

  it("allows multiple applications and confirmations for the same product and date without a system capacity limit", () => {
    const service = source("server/commerce/year-end-three-color-experience-request-service.ts");
    expect(service).not.toContain("yearEndThreeColorExperienceConfirmedSlots");
    expect(service).not.toContain("EXPERIENCE_REQUEST_CONFIRMATION_FULL");
    expect(service).not.toContain("count(");
  });

  it("keeps an admin-only cancellation reason and timestamp without a refund path", () => {
    const router = source("server/routers.ts");
    const admin = source("app/(tabs)/admin.tsx");
    expect(router).toContain("cancellationReason: z.string().trim().max(500).optional()");
    expect(admin).toContain("예약 확정 확인");
    expect(admin).toContain("예약 취소 확인");
    expect(admin).toContain("취소 사유 (선택 입력, 관리자용)");
    expect(admin).toContain('item.relationshipType === "parent_child" && item.childAge !== null');
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
