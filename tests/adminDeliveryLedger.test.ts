import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("administrator delivery ledger", () => {
  it("joins PDF outbox entries to immutable order and product snapshots, newest first", () => {
    const service = read("server/commerce/email-outbox-service.ts");
    expect(service).toContain("orderNumber: orders.orderNumber");
    expect(service).toContain("productName: orderItems.productNameSnapshot");
    expect(service).toContain("recipientEmailMasked");
    expect(service).toContain(".orderBy(desc(emailOutbox.createdAt))");
    expect(service).toContain("hashCommerceEmail(search)");
    expect(service).toContain('eq(emailOutbox.purpose, "analysis_result_pdf")');
  });

  it("keeps full email disclosure behind an explicit audited administrator action", () => {
    const service = read("server/commerce/admin-operations-service.ts");
    const router = read("server/routers.ts");
    const screen = read("app/(tabs)/admin.tsx");

    expect(service).toContain("revealAdminOrderEmailDetails");
    expect(service).toContain('action: "order_email_details_revealed"');
    expect(router).toContain("revealOrderEmailDetails: adminProcedure");
    expect(screen).toContain("이메일 보기·복사");
    expect(screen).toContain("Clipboard.setStringAsync");
    expect(screen).toContain("실제 리포트 수신 이메일");
  });

  it("does not imply that a delivery-provider success proves recipient receipt or reading", () => {
    const screen = read("app/(tabs)/admin.tsx");
    expect(screen).toContain("고객의 실제 수신·열람 여부는 확인할 수 없습니다");
    expect(screen).toContain("실패 사유 코드");
    expect(screen).toContain("실제 발송 시각");
  });
});
