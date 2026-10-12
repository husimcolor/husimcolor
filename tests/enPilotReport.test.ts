import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { EN_PERSONAL_PILOT_REPORT, EN_PILOT_DISCLAIMER } from "../shared/en-personal-pilot";
import { createEnPilotPersonalPdfBuffer } from "../server/en-pilot-pdf-report";

describe("English personal pilot report", () => {
  it("uses the proposed role terms and keeps every personal-report section", () => {
    const serialized = JSON.stringify(EN_PERSONAL_PILOT_REPORT);
    expect(serialized).toContain("Primary Disposition");
    expect(serialized).toContain("Supporting Disposition");
    expect(serialized).toContain("Complementary Colour");
    expect(serialized).toContain("Card 1 · Unconscious");
    expect(serialized).toContain("Card 2 · Current State");
    expect(serialized).toContain("Card 3 · Recovery Direction");
    expect(EN_PERSONAL_PILOT_REPORT.stage1.colors).toHaveLength(3);
    expect(EN_PERSONAL_PILOT_REPORT.cards).toHaveLength(3);
    expect(EN_PERSONAL_PILOT_REPORT.combinedCoaching).toHaveLength(3);
    expect(EN_PERSONAL_PILOT_REPORT.lifeRole.directions).toHaveLength(3);
    expect(serialized).toContain("listen carefully to what the other person has to say");
    expect(EN_PILOT_DISCLAIMER).toContain("not a medical diagnosis or treatment recommendation");
    const rendererSource = readFileSync(path.join(process.cwd(), "server", "en-pilot-pdf-report.ts"), "utf8");
    expect(rendererSource).toContain("Suggested complementary colours for this moment");
  });

  it("renders a non-empty English PDF from fixed fictional data", async () => {
    const pdf = await createEnPilotPersonalPdfBuffer();
    expect(pdf.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20_000);
  }, 30_000);

  it("keeps the three English review screens static and separate from customer flows", () => {
    const pages = ["en-pilot.html", "en-pilot-colours.html", "en-pilot-cards.html", "en-pilot-recovery.html"];
    for (const page of pages) {
      const source = readFileSync(path.join(process.cwd(), "public", page), "utf8");
      expect(source).toContain("Fixed fictional data");
      expect(source).toContain("/api/en-pilot-personal-pdf");
      expect(source).toContain("Report sample");
      expect(source).not.toMatch(/trpc|localStorage|AsyncStorage|fetch\s*\(|XMLHttpRequest/i);
    }
  });
});
