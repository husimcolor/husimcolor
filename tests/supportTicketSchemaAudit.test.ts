import { describe, expect, it } from "vitest";
import { summarizeSupportTicketSchema } from "../server/commerce/support-ticket-schema-audit";

describe("지원 문의 스키마 읽기 감사", () => {
  it("최종 3단계 상태와 필수 컬럼이 있으면 migration 재실행 금지를 반환한다", () => {
    const result = summarizeSupportTicketSchema([
      { columnName: "status", columnType: "enum('received','reviewing','answered')", isNullable: "NO", columnDefault: "received" },
      { columnName: "contactNameEncrypted", columnType: "text", isNullable: "YES", columnDefault: null },
      { columnName: "inquiryType", columnType: "enum('payment_refund','analysis_result','pdf_email','coaching_booking','other')", isNullable: "NO", columnDefault: "other" },
      { columnName: "respondedAt", columnType: "timestamp", isNullable: "YES", columnDefault: null },
      { columnName: "updatedAt", columnType: "timestamp", isNullable: "NO", columnDefault: "CURRENT_TIMESTAMP" },
    ]);
    expect(result.safeToSkipMigration).toBe(true);
    expect(result.missingColumns).toEqual([]);
  });

  it("레거시 open/closed 상태 또는 누락 컬럼은 비파괴 단일 계획이 필요하다고 반환한다", () => {
    const result = summarizeSupportTicketSchema([
      { columnName: "status", columnType: "enum('open','closed')", isNullable: "NO", columnDefault: "open" },
    ]);
    expect(result.safeToSkipMigration).toBe(false);
    expect(result.missingColumns).toContain("inquiryType");
  });
});
