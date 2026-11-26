import { afterEach, describe, expect, it, vi } from "vitest";
import { Socket } from "node:net";
import {
  assertDecemberLocalE2eEnvironment,
  assertDecemberLocalMysqlSocket,
  runDecemberReportLocalE2e,
} from "../scripts/december-report-local-e2e";

const safeEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  HUSIM_E2E_LOCAL_DB: "1",
  HUSIM_RUN_DECEMBER_LOCAL_E2E: "1",
  HUSIM_DISABLE_EMAIL_DELIVERY: "1",
  HUSIM_E2E_LOCAL_STORAGE_DIR: "/tmp/husim-december-unit-test",
  DATABASE_URL: "mysql://synthetic:synthetic@127.0.0.1:3306/husim_december_e2e",
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("December local E2E safety guards (no database connection)", () => {
  it("accepts only explicit test opt-in and an isolated localhost MySQL URL", () => {
    expect(assertDecemberLocalE2eEnvironment(safeEnvironment)).toEqual({
      hostname: "127.0.0.1",
      port: 3306,
      database: "husim_december_e2e",
      storageRoot: "/tmp/husim-december-unit-test",
    });
    expect(
      assertDecemberLocalE2eEnvironment({
        ...safeEnvironment,
        DATABASE_URL:
          "mysql://synthetic:synthetic@localhost:3307/husim_december_repeat_01",
      }).port,
    ).toBe(3307);
  });

  it.each([
    ["NODE_ENV", "production"],
    ["NODE_ENV", "development"],
    ["HUSIM_E2E_LOCAL_DB", undefined],
    ["HUSIM_RUN_DECEMBER_LOCAL_E2E", undefined],
    ["HUSIM_DISABLE_EMAIL_DELIVERY", "0"],
    ["VERCEL_ENV", "preview"],
    ["VERCEL_ENV", "production"],
    ["VERCEL", "1"],
    ["VERCEL_URL", "example.vercel.app"],
    ["HUSIM_E2E_LOCAL_STORAGE_DIR", "relative/husim-december-test"],
    ["HUSIM_E2E_LOCAL_STORAGE_DIR", "/tmp"],
    ["HUSIM_E2E_LOCAL_STORAGE_DIR", "/tmp/public/husim-december-test"],
  ])("refuses unsafe %s=%s without opening a connection", (key, value) => {
    expect(() =>
      assertDecemberLocalE2eEnvironment({ ...safeEnvironment, [key]: value }),
    ).toThrow();
  });

  it.each([
    "",
    "mysql://synthetic:synthetic@database.example.com/husim_december_e2e",
    "mysql://synthetic:synthetic@127.0.0.1.example.com/husim_december_e2e",
    "mysql://synthetic:synthetic@localhost.example.com/husim_december_e2e",
    "mysql://synthetic:synthetic@[::1]/husim_december_e2e",
    "mysql://synthetic:synthetic@127.0.0.1/production",
    "mysql://synthetic:synthetic@127.0.0.1/husim_december_",
    "mysql://synthetic:synthetic@127.0.0.1/husim_december_e2e/extra",
    "mysql://synthetic:synthetic@127.0.0.1/husim_december_e2e?host=production",
    "mysql://synthetic:synthetic@127.0.0.1/husim_december_e2e?socketPath=/tmp/mysql.sock",
    "mysql://synthetic:synthetic@127.0.0.1/husim_december_e2e#options",
    "postgresql://synthetic:synthetic@127.0.0.1/husim_december_e2e",
  ])(
    "rejects remote, ambiguous, non-isolated or transport-overridden DB URL %s",
    (url) => {
      expect(() =>
        assertDecemberLocalE2eEnvironment({
          ...safeEnvironment,
          DATABASE_URL: url,
        }),
      ).toThrow();
    },
  );

  it("never includes URL credentials in guard failures", () => {
    try {
      assertDecemberLocalE2eEnvironment({
        ...safeEnvironment,
        DATABASE_URL:
          "mysql://do-not-log-me:secret-password@remote.invalid/production",
      });
      throw new Error("guard failed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain("do-not-log-me");
      expect(message).not.toContain("secret-password");
    }
  });

  it("allows only this local DB socket, not HTTP, remote DB or unix sockets", () => {
    const target = assertDecemberLocalE2eEnvironment(safeEnvironment);
    expect(() =>
      assertDecemberLocalMysqlSocket(target, [3306, "127.0.0.1"]),
    ).not.toThrow();
    expect(() =>
      assertDecemberLocalMysqlSocket(target, [
        { host: "localhost", port: 3306 },
      ]),
    ).not.toThrow();
    expect(() =>
      assertDecemberLocalMysqlSocket(target, [
        [{ host: "127.0.0.1", port: 3306 }],
      ]),
    ).not.toThrow();
    for (const args of [
      [443, "example.com"],
      [80, "localhost"],
      [3306, "remote.invalid"],
      [{ host: "localhost", port: 3307 }],
      ["/tmp/mysql.sock"],
      [{ path: "/tmp/mysql.sock", host: "localhost", port: 3306 }],
    ]) {
      expect(() => assertDecemberLocalMysqlSocket(target, args)).toThrow(
        "LOCAL_E2E_EXTERNAL_NETWORK_FORBIDDEN",
      );
    }
  });
});

// Normal `pnpm test` NEVER seeds a DB. Explicit opt-in only AFTER parent/user
// authorization and CREATE-only empty local schema preparation; no automatic DDL.
const authorizedRunRequested = process.env.HUSIM_RUN_DECEMBER_LOCAL_E2E === "1";
describe.skipIf(!authorizedRunRequested)(
  "December real localhost MySQL E2E (opt-in, no-send)",
  () => {
    it("runs personal + couple + parent-child purchases, original Korean PDFs and immutable results", async () => {
      // Validate before installing spies, importing a server module, or touching DB.
      const target = assertDecemberLocalE2eEnvironment();
      let forbiddenAttempts = 0;
      const originalConnect = Socket.prototype.connect;
      vi.spyOn(Socket.prototype, "connect").mockImplementation(function (
        this: Socket,
        ...args: unknown[]
      ) {
        try {
          assertDecemberLocalMysqlSocket(target, args);
        } catch (error) {
          forbiddenAttempts += 1;
          throw error;
        }
        return Reflect.apply(originalConnect, this, args) as Socket;
      });
      vi.stubGlobal("fetch", () => {
        forbiddenAttempts += 1;
        throw new Error("LOCAL_E2E_EXTERNAL_FETCH_FORBIDDEN");
      });
      // Do NOT fake timeouts/intervals: real mysql2 I/O and PDF streams must progress.
      vi.useFakeTimers({ toFake: ["Date"] });
      const result = await runDecemberReportLocalE2e({
        setSystemTime: (date) => {
          vi.setSystemTime(date);
        },
      });
      expect(forbiddenAttempts).toBe(0);
      expect(result.status).toBe("passed");
      expect(result.prices).toEqual({
        personal_deep: 9900,
        couple_love_deep: 23600,
        parent_child_deep: 15600,
      });
      expect(result.pdfs).toHaveLength(3);
      expect(
        result.pdfs.every((pdf) => pdf.bytes >= 512 && pdf.pages > 0),
      ).toBe(true);
      console.log(JSON.stringify(result, null, 2));
    }, 180_000);
  },
);
