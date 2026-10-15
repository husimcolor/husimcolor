import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Production zh-CN locale metadata migration", () => {
  it("requires an explicit dispatch confirmation and injects the database URL only from an Actions secret", () => {
    const workflow = read(".github/workflows/production-zh-cn-locale-migration.yml");

    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("APPLY_PRODUCTION_ZH_CN_LOCALE_MIGRATION");
    expect(workflow).toContain("secrets.HUSIM_PRODUCTION_DATABASE_URL");
    expect(workflow).not.toContain("vercel@latest env pull");
    expect(workflow).not.toContain("echo ${{ secrets.HUSIM_PRODUCTION_DATABASE_URL }}");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });

  it("backs up only schema definitions and applies additive locale columns without customer-data mutation", () => {
    const migration = read("scripts/apply-production-locale-snapshot-metadata.mjs");
    const backup = read("scripts/backup-production-locale-schema.mjs");

    expect(migration).toContain('{ table: "analysis_runs", column: "locale", definition: "varchar(12) NULL" }');
    expect(migration).toContain('{ table: "email_outbox", column: "copyVersion", definition: "varchar(80) NULL" }');
    expect(migration).toContain("await connection.query(`ALTER TABLE \\`");
    expect(migration).not.toContain("DROP TABLE");
    expect(migration).not.toContain("DELETE FROM");
    expect(backup).toContain("SHOW CREATE TABLE");
    expect(backup).toContain("Existing table preserved");
    expect(backup).not.toContain("DROP TABLE");
    expect(backup).not.toContain("DELETE FROM");
  });

  it("rejects an absent or redacted URL before attempting a production connection", () => {
    const migration = read("scripts/apply-production-locale-snapshot-metadata.mjs");
    const backup = read("scripts/backup-production-locale-schema.mjs");

    for (const source of [migration, backup]) {
      expect(source).toContain('databaseUrl.includes("[SENSITIVE]")');
      expect(source).toContain("PRODUCTION_DATABASE_URL_MISSING");
      expect(source).toContain("PRODUCTION_DATABASE_URL_INVALID");
    }
  });
});
