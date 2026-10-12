import { describe, expect, it } from "vitest";

import { ZH_CN_PERSONAL_PILOT_REPORT } from "../shared/zh-cn-personal-pilot";
import { createZhCnPilotPersonalPdfBuffer } from "../server/zh-cn-pilot-pdf-report";

describe("zh-CN personal pilot report", () => {
  it("uses the approved terms and keeps all personal-report sections", () => {
    const serialized = JSON.stringify(ZH_CN_PERSONAL_PILOT_REPORT);
    expect(serialized).toContain("主要心理特征");
    expect(serialized).toContain("辅助心理特征");
    expect(serialized).toContain("调和色");
    expect(ZH_CN_PERSONAL_PILOT_REPORT.stage1.colors).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.cards).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.combinedCoaching).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.lifeRole.directions).toHaveLength(3);
    expect(ZH_CN_PERSONAL_PILOT_REPORT.recoveryRoutine.message).toContain("可能");
  });

  it("renders a non-empty simplified Chinese PDF from fixed virtual data", async () => {
    const pdf = await createZhCnPilotPersonalPdfBuffer();
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 30_000);
});
