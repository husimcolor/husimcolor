import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("administrator daily operations home", () => {
  it("shows only the requested daily signals and preserves the unique-device total", () => {
    const screen = read("app/(tabs)/admin.tsx");
    expect(screen).toContain("dailyOperationsSignals.useQuery");
    expect(screen).toContain("오늘 홈페이지 방문자");
    expect(screen).toContain("오늘 앱 방문자");
    expect(screen).toContain("오늘 무료 3컬러 완료");
    expect(screen).toContain("오늘 지인 무료테스트 완료");
    expect(screen).toContain("오늘 실결제 완료");
    expect(screen).toContain("개인 심화 실결제");
    expect(screen).toContain("부부·연인 실결제");
    expect(screen).toContain("부모·자녀 실결제");
    expect(screen).toContain("오늘 매출금액");
    expect(screen).toContain("고유 방문 기기");
    expect(screen).not.toContain('label="PDF 실패"');
    expect(screen).not.toContain('label="메일 실패"');
    expect(screen).not.toContain('label="검사 진행 중"');
  });

  it("limits revenue to unique real Toss live approved orders and excludes test orders", () => {
    const service = read("server/commerce/admin-daily-operations-service.ts");
    expect(service).toContain('eq(orders.isTest, false)');
    expect(service).toContain('eq(paymentTransactions.provider, "toss_live")');
    expect(service).toContain('eq(paymentTransactions.status, "approved")');
    expect(service).toContain('COUNT(DISTINCT ${orders.id})');
    expect(service).toContain('OPERATIONS_REPORTING_START_AT');
  });
});
