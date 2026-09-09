import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const resultScreen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/premium-result.tsx"),
  "utf8",
);

describe("삶의 역할 에너지 모바일 가독성", () => {
  it("keeps practical direction text and a compact preparation line inside the existing direction card", () => {
    expect(resultScreen).toContain("{direction.description}");
    expect(resultScreen).toContain("준비 방향 · {direction.preparation}");
    expect(resultScreen).toContain("lifeRolePreparationText");
  });

  it("allows natural mobile wrapping without fixing a direction-row height", () => {
    const rowStart = resultScreen.indexOf("lifeRoleDirectionRow: {");
    const rowEnd = resultScreen.indexOf("lifeRoleDirectionTitle:", rowStart);
    const rowStyle = resultScreen.slice(rowStart, rowEnd);

    expect(rowStyle).toContain("paddingVertical: 8");
    expect(rowStyle).not.toMatch(/height\s*:/);
  });

  it("uses readable line heights for direction and preparation copy", () => {
    expect(resultScreen).toMatch(/lifeRoleDirectionDesc:\s*\{\s*fontSize:\s*13,\s*lineHeight:\s*19,/s);
    expect(resultScreen).toMatch(/lifeRolePreparationText:\s*\{\s*marginTop:\s*5,\s*fontSize:\s*12,\s*lineHeight:\s*18,/s);
  });
});
