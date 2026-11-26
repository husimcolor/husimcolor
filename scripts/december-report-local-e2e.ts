/**
 * Real MySQL, original generators, synthetic accounts, and no email/provider calls.
 * Never bootstraps, migrates, cleans, or connects on import. Execute ONLY after
 * authorization and a CREATE-only schema bootstrap of an EMPTY isolated database:
 *
 * DATABASE_URL='mysql://<local-user>:<local-password>@127.0.0.1:3306/husim_december_e2e' \
 * NODE_ENV=test HUSIM_E2E_LOCAL_DB=1 HUSIM_RUN_DECEMBER_LOCAL_E2E=1 \
 * HUSIM_DISABLE_EMAIL_DELIVERY=1 HUSIM_E2E_LOCAL_STORAGE_DIR=/tmp/husim-december-e2e \
 * pnpm exec vitest run tests/decemberReportLocalE2E.test.ts --maxWorkers=1 --minWorkers=1
 *
 * Date is controlled by the TEST RUNNER, not by a production clock env override.
 * Run once per empty DB: fixtures/PDFs intentionally remain for local inspection.
 * This module is a reusable runner, not a standalone tsx entry point.
 */
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { User } from "../drizzle/schema";
import type { TrpcContext } from "../server/_core/context";
import type { DecemberReportProductCode } from "../shared/december-report-event";
import type { PremiumPdfDownloadPayload } from "../shared/premium-pdf-download";

export type LocalDatabaseTarget = {
  hostname: "127.0.0.1" | "localhost";
  port: number;
  database: string;
  storageRoot: string;
};
export type LocalE2eClock = { setSystemTime(value: Date): void };
export type LocalE2eCheck = { name: string; status: "passed" };
export type LocalE2eResult = {
  suite: string;
  status: "passed";
  database: string;
  storageRoot: string;
  prices: Record<DecemberReportProductCode, number>;
  checks: LocalE2eCheck[];
  pdfs: Array<{
    productCode: DecemberReportProductCode;
    bytes: number;
    pages: number;
  }>;
};

/** Validate before importing any server module or opening a DB connection. Never include a URL in errors. */
export function assertDecemberLocalE2eEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): LocalDatabaseTarget {
  assert.equal(env.NODE_ENV, "test", "LOCAL_E2E_REQUIRES_NODE_ENV_TEST");
  assert.equal(env.HUSIM_E2E_LOCAL_DB, "1", "LOCAL_E2E_LOCAL_DB_FLAG_REQUIRED");
  assert.equal(
    env.HUSIM_RUN_DECEMBER_LOCAL_E2E,
    "1",
    "LOCAL_E2E_EXPLICIT_RUN_OPT_IN_REQUIRED",
  );
  assert.equal(
    env.HUSIM_DISABLE_EMAIL_DELIVERY,
    "1",
    "LOCAL_E2E_EMAIL_DELIVERY_MUST_BE_DISABLED",
  );
  assert(
    !env.VERCEL_ENV && !env.VERCEL && !env.VERCEL_URL,
    "LOCAL_E2E_DEPLOYMENT_RUNTIME_FORBIDDEN",
  );
  let url: URL;
  try {
    url = new URL(env.DATABASE_URL ?? "");
  } catch {
    throw new Error("LOCAL_E2E_DATABASE_URL_INVALID");
  }
  assert.equal(url.protocol, "mysql:", "LOCAL_E2E_REQUIRES_MYSQL");
  assert(
    url.hostname === "127.0.0.1" || url.hostname === "localhost",
    "LOCAL_E2E_DATABASE_MUST_BE_LOOPBACK",
  );
  assert(!url.search && !url.hash, "LOCAL_E2E_DATABASE_URL_OPTIONS_FORBIDDEN");
  assert(
    /^\/husim_december_[a-zA-Z0-9_]+$/.test(url.pathname),
    "LOCAL_E2E_DATABASE_NAME_NOT_ISOLATED",
  );
  assert(url.username, "LOCAL_E2E_DATABASE_USER_REQUIRED");
  const port = url.port ? Number(url.port) : 3306;
  assert(
    Number.isInteger(port) && port > 0 && port <= 65535,
    "LOCAL_E2E_DATABASE_PORT_INVALID",
  );
  const root = env.HUSIM_E2E_LOCAL_STORAGE_DIR;
  assert(
    root && path.isAbsolute(root),
    "LOCAL_E2E_ABSOLUTE_STORAGE_DIRECTORY_REQUIRED",
  );
  const storageRoot = path.resolve(root);
  assert(
    path.basename(storageRoot).startsWith("husim-december-"),
    "LOCAL_E2E_STORAGE_DIRECTORY_NOT_ISOLATED",
  );
  assert(
    !storageRoot.split(path.sep).includes("public"),
    "LOCAL_E2E_PRIVATE_STORAGE_CANNOT_BE_PUBLIC",
  );
  return {
    hostname: url.hostname as LocalDatabaseTarget["hostname"],
    port,
    database: url.pathname.slice(1),
    storageRoot,
  };
}

/** Fail closed for every outgoing socket except this exact local MySQL endpoint. */
export function assertDecemberLocalMysqlSocket(
  target: LocalDatabaseTarget,
  args: unknown[],
): void {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const first = normalized[0];
  const options =
    first && typeof first === "object"
      ? (first as { host?: string; port?: number | string; path?: string })
      : null;
  const host = options ? options.host : normalized[1];
  const port = options ? Number(options.port) : Number(first);
  assert(
    !options?.path &&
      (host === "127.0.0.1" || host === "localhost") &&
      port === target.port,
    "LOCAL_E2E_EXTERNAL_NETWORK_FORBIDDEN",
  );
}

/** Always replace inherited encryption/signing secrets; never print any secret. */
export function installDecemberSyntheticEnvironment(
  target: LocalDatabaseTarget,
  runId: string,
): () => void {
  const changes: Record<string, string | undefined> = {
    TZ: "UTC",
    COMMERCE_TEST_MODE: "true",
    COMMERCE_PRODUCTION_TEST_MODE: "false",
    COMMERCE_LIVE_PAYMENT_ENABLED: "false",
    COMMERCE_PUBLIC_PAID_ANALYSIS_ENABLED: "false",
    COMMERCE_EMAIL_HASH_SECRET: randomBytes(48).toString("hex"),
    COMMERCE_EMAIL_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    JWT_SECRET: randomBytes(48).toString("hex"),
    HUSIM_APP_LANDING_REQUEST_SECRET: randomBytes(48).toString("hex"),
    HUSIM_E2E_LOCAL_STORAGE_DIR: path.join(target.storageRoot, runId),
    // The safety boundary is the network guard too, not only missing credentials.
    TOSS_LIVE_SECRET_KEY: undefined,
    TOSS_LIVE_CLIENT_KEY: undefined,
    TOSS_TEST_SECRET_KEY: undefined,
    TOSS_TEST_CLIENT_KEY: undefined,
    TOSS_SECRET_KEY: undefined,
    TOSS_CLIENT_KEY: undefined,
    BLOB_READ_WRITE_TOKEN: undefined,
    BLOB_STORE_ID: undefined,
    BUILT_IN_FORGE_API_KEY: undefined,
    BUILT_IN_FORGE_API_URL: undefined,
    VITE_FRONTEND_FORGE_API_KEY: undefined,
    VITE_FRONTEND_FORGE_API_URL: undefined,
    RESEND_API_KEY: undefined,
    SENDGRID_API_KEY: undefined,
    SMTP_PASSWORD: undefined,
    OWNER_OPEN_ID: undefined,
    OAUTH_SERVER_URL: undefined,
    PREVIEW_RELATIONSHIP_RECOVERY_KEY: undefined,
  };
  const original = Object.fromEntries(
    Object.keys(changes).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

/** Same deterministic personal fixture as generate-public-sample-reports.ts; original builders unchanged. */
export async function buildDecemberPersonalFixture(): Promise<PremiumPdfDownloadPayload> {
  const { CARD_DATA } = await import("../constants/cardData");
  const { COLOR_DATA } = await import("../constants/colorData");
  const { buildLifeEnergyResult, buildCustomRecoveryRoutine } =
    await import("../constants/lifeArchetype");
  const { buildLifeRoleEnergyReport } =
    await import("../constants/lifeRoleEnergy");
  const { buildPremiumStage1Interpretation } =
    await import("../constants/premiumStage1Data");
  const { buildStage2CardInterpretations, buildStage2ColorBridge } =
    await import("../constants/premiumStage2CardInterpretation");
  const { buildPremiumCardFlowSummary } =
    await import("../lib/premium-card-flow-summary");
  const { buildPremiumColorFlowDescription } =
    await import("../lib/premium-color-flow-summary");
  const { buildPremiumPdfDownloadPayload } =
    await import("../lib/premium-pdf-download");
  const { COACHING_BOOKING_URL } = await import("../shared/coaching-booking");
  const colors = ["red", "blue", "white"].map((id) => {
    const color = COLOR_DATA.find((row) => row.id === id);
    assert(color, "LOCAL_PERSONAL_COLOR_MISSING");
    return color;
  });
  const cards = ["red_triangle", "blue_diamond", "white_square"].map((id) => {
    const card = CARD_DATA.find((row) => row.id === id);
    assert(card, "LOCAL_PERSONAL_CARD_MISSING");
    return card;
  }) as [
    (typeof CARD_DATA)[number],
    (typeof CARD_DATA)[number],
    (typeof CARD_DATA)[number],
  ];
  const energy = buildLifeEnergyResult(
    colors.map((color) => color.id),
    cards.map((card) => ({ color: card.color, shape: card.shape })),
    cards[2].complementColors,
  );
  const routine = buildCustomRecoveryRoutine(
    energy.complementaryFiveElements.elements,
    cards[2].wellness,
    energy.routines,
    energy.currentRoutines,
  );
  const candidates = [
    ...cards[2].complementColors,
    ...cards[0].complementColors,
    ...colors[2].complementColors.map((name) => ({
      name,
      meaning:
        COLOR_DATA.find(
          (color) => color.korName === name || color.name === name,
        )?.recovery ?? "회복에 필요한 흐름",
    })),
  ];
  const complementColors = energy.complementaryFiveElements.complementColors
    ?.length
    ? energy.complementaryFiveElements.complementColors.map(
        (name) =>
          candidates.find((color) => color.name === name) ?? {
            name,
            meaning: "회복에 필요한 흐름",
          },
      )
    : cards[2].complementColors;
  const payload = buildPremiumPdfDownloadPayload({
    profile: null,
    selectedColors: colors,
    stage1Interpretation: buildPremiumStage1Interpretation(colors),
    cards,
    stage2Bridge: buildStage2ColorBridge(colors),
    stage2Cards: buildStage2CardInterpretations(cards),
    complementColors,
    colorFlowDescription: buildPremiumColorFlowDescription(
      colors,
      "가상 인물의 성향 흐름",
    ),
    combinedCoaching: buildPremiumCardFlowSummary(cards),
    scripture: null,
    lifeRoleReport: buildLifeRoleEnergyReport(
      colors.map((color) => color.id),
      cards,
      "가상 성인",
    ),
    lifeEnergyResult: energy,
    customRecoveryRoutine: {
      tea: cards[2].wellness.tea,
      food: routine.food,
      breath: routine.breath,
      movement: routine.movement,
      smallPractice: routine.smallPractice,
      message: routine.message,
    },
    coachingUrl: COACHING_BOOKING_URL,
  });
  payload.profileLine = "개인 심화분석 · 가상 인물";
  return payload;
}

function readPdf(content: Buffer): { bytes: number; pages: number } {
  assert(
    content.length >= 512 && content.subarray(0, 5).toString() === "%PDF-",
    "LOCAL_PDF_BYTES_INVALID",
  );
  assert(
    content.subarray(-1024).toString().includes("%%EOF"),
    "LOCAL_PDF_TRAILER_MISSING",
  );
  const info = spawnSync("pdfinfo", ["-"], {
    input: content,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert(
    !info.error && info.status === 0,
    "LOCAL_PDFINFO_UNREADABLE_OR_MISSING",
  );
  const pages = Number(info.stdout.match(/^Pages:\s+(\d+)/m)?.[1]);
  assert(pages > 0, "LOCAL_PDF_HAS_NO_PAGES");
  const text = spawnSync("pdftotext", ["-", "-"], {
    input: content,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  assert(
    !text.error && text.status === 0 && /[가-힣]/u.test(text.stdout),
    "LOCAL_PDF_KOREAN_TEXT_NOT_READABLE",
  );
  return { bytes: content.length, pages };
}

/** Real services; caller must install Date-only fake time and the network guard first. */
export async function runDecemberReportLocalE2e(
  clock: LocalE2eClock,
): Promise<LocalE2eResult> {
  const target = assertDecemberLocalE2eEnvironment();
  const runId = `december-${randomUUID()}`;
  const restoreEnvironment = installDecemberSyntheticEnvironment(target, runId);
  const storageRoot = process.env.HUSIM_E2E_LOCAL_STORAGE_DIR!;
  let db: Awaited<ReturnType<(typeof import("../server/db"))["getDb"]>>;
  const checks: LocalE2eCheck[] = [];
  const pdfs: LocalE2eResult["pdfs"] = [];
  const check = (name: string) => {
    checks.push({ name, status: "passed" });
    console.log(`[december-local-e2e] ${name}`);
  };
  try {
    await mkdir(storageRoot, { recursive: true });
    for (const executable of ["pdfinfo", "pdftotext"]) {
      assert.equal(
        spawnSync(executable, ["-v"], { encoding: "utf8" }).status,
        0,
        "LOCAL_E2E_REQUIRES_POPPLER_UTILS",
      );
    }
    const { and, eq, sql } = await import("drizzle-orm");
    const schema = await import("../drizzle/schema");
    const {
      users,
      products,
      productPrices,
      coupons,
      couponProductRules,
      couponRedemptions,
      decemberReportCouponGrants,
      customers,
      orders,
      orderItems,
      paymentTransactions,
      entitlements,
      analysisRuns,
      relationshipSetups,
      relationshipSessions,
      relationshipParticipants,
      privateDocuments,
      emailOutbox,
      coupleSharedResults,
    } = schema;
    const { getDb } = await import("../server/db");
    const { appRouter } = await import("../server/routers");
    const orderService = await import("../server/commerce/order-service");
    const entitlementService =
      await import("../server/commerce/entitlement-service");
    const relationship =
      await import("../server/commerce/relationship-invite-service");
    const { queuePrivateAnalysisPdfDelivery } =
      await import("../server/commerce/pdf-delivery-service");
    const { getPrivateAnalysisPdfDownload } =
      await import("../server/commerce/private-pdf-download-service");
    const { resolveStorageBackend } = await import("../server/storage");
    const {
      DECEMBER_REPORT_OFFERS: offers,
      DECEMBER_REPORT_STARTS_AT: startsAt,
      DECEMBER_REPORT_ENDS_AT: endsAt,
    } = await import("../shared/december-report-event");
    assert.equal(
      resolveStorageBackend(),
      "local_e2e",
      "LOCAL_E2E_STORAGE_BACKEND_NOT_LOCAL",
    );
    assert.deepEqual(
      offers.map((offer) => offer.finalAmountKrw),
      [9900, 23600, 15600],
    );
    const activeAt = new Date("2026-12-10T03:00:00.000Z");
    clock.setSystemTime(activeAt);
    assert.equal(
      Date.now(),
      activeAt.getTime(),
      "LOCAL_E2E_REQUIRES_TEST_RUNNER_FAKE_DATE",
    );
    db = await getDb();
    assert(db, "LOCAL_E2E_DATABASE_NOT_AVAILABLE");
    // Read-only preflight. No DDL, no dropping/truncation, no production seed.
    for (const table of [
      users,
      customers,
      products,
      productPrices,
      coupons,
      couponProductRules,
      couponRedemptions,
      decemberReportCouponGrants,
      orders,
      orderItems,
      paymentTransactions,
      entitlements,
      analysisRuns,
      relationshipSetups,
      relationshipSessions,
      relationshipParticipants,
      privateDocuments,
      emailOutbox,
      coupleSharedResults,
    ]) {
      const rows: Array<{ count: number }> = await db
        .select({ count: sql<number>`count(*)` })
        .from(table);
      assert.equal(
        Number(rows[0]?.count),
        0,
        "LOCAL_E2E_REQUIRES_EMPTY_BUSINESS_TABLES_CREATE_ONLY_BOOTSTRAP",
      );
    }
    check("strict localhost target, local storage and empty-schema preflight");

    // Fixture writes are CREATE-only row inserts after all preflight checks.
    const stackingCode = "LOCAL-E2E-STACK";
    for (const offer of offers) {
      const inserted = await db
        .insert(products)
        .values({
          code: offer.productCode,
          name: `LOCAL E2E ${offer.name}`,
          fulfillmentType: "analysis",
          requiresPayment: true,
          active: true,
        });
      const productId = Number(inserted[0].insertId);
      await db
        .insert(productPrices)
        .values({
          productId,
          regularAmountKrw: offer.listAmountKrw,
          amountKrw: offer.listAmountKrw,
          version: 1,
          currency: "KRW",
          validFrom: new Date("2026-01-01T00:00:00.000Z"),
          active: true,
        });
      const couponInserted = await db
        .insert(coupons)
        .values({
          code: offer.couponCode,
          discountType: offer.discountType,
          discountValue: offer.discountValue,
          startsAt,
          endsAt,
          maxPerCustomer: 1,
          status: "active",
        });
      await db
        .insert(couponProductRules)
        .values({ couponId: Number(couponInserted[0].insertId), productId });
    }
    await db
      .insert(coupons)
      .values({
        code: stackingCode,
        discountType: "fixed",
        discountValue: 1000,
        startsAt: new Date("2026-01-01T00:00:00.000Z"),
        endsAt: new Date("2027-01-01T00:00:00.000Z"),
        status: "active",
      });
    async function createUser(label: string): Promise<User> {
      assert(db);
      const inserted = await db
        .insert(users)
        .values({
          openId: `local-dec-${runId.slice(-12)}-${label}`,
          name: `가상 사용자 ${label}`,
          email: `${label}-${runId}@invalid.test`,
          loginMethod: "local-e2e",
          role: "user",
        });
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, Number(inserted[0].insertId)));
      assert(user, "LOCAL_E2E_SYNTHETIC_USER_NOT_FOUND");
      return user;
    }
    function caller(user: User | null) {
      return appRouter.createCaller({
        user,
        legacyAdmin: false,
        req: {
          protocol: "http",
          headers: {},
          hostname: "localhost",
        } as TrpcContext["req"],
        res: { clearCookie() {} } as unknown as TrpcContext["res"],
      });
    }
    const primary = await createUser("primary");
    const second = await createUser("second");
    const unclaimed = await createUser("unclaimed");
    const boundary = await createUser("boundary");
    const member = caller(primary);
    const guest = caller(null);
    let sequence = 0;
    const key = () => `local-dec-${runId}-${++sequence}`;
    async function rejects(action: () => Promise<unknown>, code: string) {
      await assert.rejects(
        action,
        (error: unknown) =>
          error instanceof Error && error.message.includes(code),
        `LOCAL_E2E_EXPECTED_${code}`,
      );
    }
    const checkout = (
      user: User,
      productCode: DecemberReportProductCode,
      couponCode?: string,
      email = user.email!,
    ) =>
      orderService.createTestCheckout({
        productCode,
        couponCode,
        email,
        userId: user.id,
        authenticatedEmail: user.email,
        idempotencyKey: key(),
        channel: "web",
      });
    const complete = (
      order: Awaited<ReturnType<typeof checkout>>,
      outcome: "success" | "failed" | "cancelled",
    ) =>
      orderService.completeTestPayment({
        orderNumber: order.orderNumber,
        providerPaymentId: key(),
        outcome,
        amountKrw: order.finalAmountKrw,
      });
    async function redemption(orderNumber: string) {
      assert(db);
      const [row] = await db
        .select({
          state: couponRedemptions.state,
          userId: couponRedemptions.userId,
          orderStatus: orders.status,
          orderId: orders.id,
        })
        .from(couponRedemptions)
        .innerJoin(orders, eq(orders.id, couponRedemptions.orderId))
        .where(eq(orders.orderNumber, orderNumber));
      assert(row, "LOCAL_E2E_REDEMPTION_MISSING");
      return row;
    }
    async function assertOfferState(
      user: User,
      productCode: DecemberReportProductCode,
      state: string,
    ) {
      const status = await caller(user).commerce.coupons.decemberStatus();
      assert.equal(
        status.offers.find((offer) => offer.productCode === productCode)?.state,
        state,
      );
    }
    const personal = offers[0];
    clock.setSystemTime(new Date(startsAt.getTime() - 1));
    assert.equal(
      (await member.commerce.coupons.decemberStatus()).active,
      false,
    );
    await rejects(
      () => member.commerce.coupons.claimDecember(),
      "COUPON_NOT_IN_VALID_PERIOD",
    );
    await rejects(
      () => checkout(primary, personal.productCode, personal.couponCode),
      "COUPON_NOT_IN_VALID_PERIOD",
    );
    check("before KST December start: issuance and code checkout rejected");
    clock.setSystemTime(startsAt);
    await rejects(() => guest.commerce.coupons.claimDecember(), "Please login");
    await rejects(
      () =>
        caller(unclaimed).commerce.coupons.preview({
          couponCode: personal.couponCode,
          productCode: personal.productCode,
          listAmountKrw: 1,
        }),
      "COUPON_DECEMBER_NOT_ISSUED",
    );
    await Promise.all([
      member.commerce.coupons.claimDecember(),
      member.commerce.coupons.claimDecember(),
    ]);
    await member.commerce.coupons.claimDecember();
    const grants = await db
      .select()
      .from(decemberReportCouponGrants)
      .where(eq(decemberReportCouponGrants.userId, primary.id));
    assert.equal(grants.length, 3);
    assert.equal(new Set(grants.map((grant) => grant.productCode)).size, 3);
    assert(
      (await member.commerce.coupons.decemberStatus()).offers.every(
        (offer) => offer.state === "issued",
      ),
    );
    check(
      "start inclusive, authenticated user.id claim and concurrent/idempotent three-product grants",
    );
    clock.setSystemTime(activeAt);
    for (const offer of offers) {
      const quote = await member.commerce.coupons.preview({
        couponCode: offer.couponCode,
        productCode: offer.productCode,
        listAmountKrw: 1,
        email: "irrelevant@invalid.test",
      });
      assert.equal(quote.finalAmountKrw, offer.finalAmountKrw);
    }
    await rejects(
      () =>
        checkout(
          primary,
          personal.productCode,
          personal.couponCode,
          "wrong-checkout@invalid.test",
        ),
      "COUPON_AUTH_EMAIL_REQUIRED",
    );
    await rejects(
      () => checkout(primary, offers[1].productCode, personal.couponCode),
      "COUPON_PRODUCT_NOT_ELIGIBLE",
    );
    await rejects(
      () =>
        guest.commerce.checkout.createTest({
          productCode: personal.productCode,
          couponCode: personal.couponCode,
          email: primary.email!,
          idempotencyKey: key(),
        }),
      "COUPON_USER_REQUIRED",
    );
    await rejects(
      () =>
        guest.commerce.coupons.preview({
          productCode: personal.productCode,
          couponCode: personal.couponCode,
          email: primary.email!,
          listAmountKrw: 29000,
        }),
      "COUPON_USER_REQUIRED",
    );
    await rejects(
      () => checkout(unclaimed, personal.productCode, personal.couponCode),
      "COUPON_DECEMBER_NOT_ISSUED",
    );
    await rejects(
      () => checkout(primary, personal.productCode, stackingCode),
      "COUPON_STACKING_NOT_ALLOWED",
    );
    await rejects(
      () => checkout(primary, personal.productCode, "DEC2026-GUESSED"),
      "COUPON_DECEMBER_NOT_FOUND",
    );
    check(
      "server prices ignore client quote; wrong email/product, guest code, unissued grant and stacking blocked",
    );

    const purchased: Array<{
      productCode: DecemberReportProductCode;
      grant: NonNullable<Awaited<ReturnType<typeof complete>>["startGrant"]>;
    }> = [];
    for (const offer of offers) {
      // Automatic account coupon application; no UI or client price mocks.
      for (const outcome of ["cancelled", "failed"] as const) {
        const pending = await checkout(primary, offer.productCode);
        assert.equal(pending.finalAmountKrw, offer.finalAmountKrw);
        await assertOfferState(primary, offer.productCode, "reserved");
        const terminal = await complete(pending, outcome);
        assert.equal(terminal.status, outcome);
        assert.equal(terminal.entitlementId, null);
        assert.equal((await redemption(pending.orderNumber)).state, "released");
        await assertOfferState(primary, offer.productCode, "issued");
      }
      const races = await Promise.allSettled([
        checkout(primary, offer.productCode),
        checkout(primary, offer.productCode),
      ]);
      const winners = races.filter(
        (
          result,
        ): result is PromiseFulfilledResult<
          Awaited<ReturnType<typeof checkout>>
        > => result.status === "fulfilled",
      );
      const losers = races.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      assert.equal(
        winners.length,
        1,
        "LOCAL_E2E_CONCURRENT_RESERVATION_MUST_HAVE_ONE_WINNER",
      );
      assert.equal(losers.length, 1);
      assert(
        losers[0].reason instanceof Error &&
          losers[0].reason.message.includes("COUPON_CUSTOMER_LIMIT_REACHED"),
      );
      const pending = winners[0].value;
      assert.equal(pending.listAmountKrw, offer.listAmountKrw);
      assert.equal(pending.finalAmountKrw, offer.finalAmountKrw);
      const paymentId = key();
      const paymentInput = {
        orderNumber: pending.orderNumber,
        providerPaymentId: paymentId,
        outcome: "success" as const,
        amountKrw: pending.finalAmountKrw,
      };
      await rejects(
        () =>
          orderService.completeTestPayment({
            ...paymentInput,
            amountKrw: pending.finalAmountKrw + 1,
          }),
        "ORDER_AMOUNT_MISMATCH",
      );
      const paid = await orderService.completeTestPayment(paymentInput);
      assert.equal(paid.status, "paid");
      assert(paid.startGrant && paid.entitlementId);
      const duplicate = await orderService.completeTestPayment(paymentInput);
      assert.equal(duplicate.alreadyProcessed, true);
      assert.equal(duplicate.entitlementId, paid.entitlementId);
      const consumed = await redemption(pending.orderNumber);
      assert.equal(consumed.state, "consumed");
      assert.equal(consumed.userId, primary.id);
      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, consumed.orderId));
      assert.equal(items.length, 1);
      assert.equal(items[0].finalAmountKrw, offer.finalAmountKrw);
      await assertOfferState(primary, offer.productCode, "used");
      await rejects(
        () => checkout(primary, offer.productCode, offer.couponCode),
        "COUPON_CUSTOMER_LIMIT_REACHED",
      );
      // Same account, different verified login/checkout email: account limit still applies.
      const alternate = {
        ...primary,
        email: `alternate-${offer.productCode}-${runId}@invalid.test`,
      };
      await rejects(
        () => checkout(alternate, offer.productCode, offer.couponCode),
        "COUPON_CUSTOMER_LIMIT_REACHED",
      );
      const regular = await checkout(primary, offer.productCode);
      assert.equal(regular.finalAmountKrw, offer.listAmountKrw);
      await complete(regular, "cancelled");
      purchased.push({
        productCode: offer.productCode,
        grant: paid.startGrant,
      });
      check(
        `${offer.productCode}: ${offer.finalAmountKrw} KRW; cancel/fail reuse, one race winner, account limit and payment idempotency`,
      );
    }
    await caller(second).commerce.coupons.claimDecember();
    const independent = await checkout(second, personal.productCode);
    assert.equal(independent.finalAmountKrw, 9900);
    await complete(independent, "cancelled");
    check("another authenticated account has its own three-product quota");

    for (const purchase of purchased) {
      const productCode = purchase.productCode;
      const isPersonal = productCode === "personal_deep";
      const isCouple = productCode === "couple_love_deep";
      const configuration = isCouple
        ? {
            relationType: "부부" as const,
            roleA: "남편" as const,
            roleB: "아내" as const,
          }
        : {
            relationType: "부모-자녀" as const,
            roleA: "딸" as const,
            roleB: "엄마" as const,
          };
      if (!isPersonal) {
        await entitlementService.configureRelationshipSetup({
          accessToken: purchase.grant.accessToken,
          ...configuration,
        });
        const persisted = await entitlementService.getRelationshipSetupForGrant(
          { accessToken: purchase.grant.accessToken },
        );
        assert.equal(persisted?.roleA, configuration.roleA);
        assert.equal(persisted?.roleB, configuration.roleB);
      }
      const startInput = {
        accessToken: purchase.grant.accessToken,
        productCode,
        ...(!isPersonal
          ? { ...configuration, relationshipMode: "invite_link" as const }
          : {}),
      };
      const started =
        await entitlementService.consumeEntitlementForAnalysisStart(startInput);
      await rejects(
        () => entitlementService.consumeEntitlementForAnalysisStart(startInput),
        "ENTITLEMENT_ALREADY_USED_OR_INACTIVE",
      );
      const [run] = await db
        .select()
        .from(analysisRuns)
        .where(eq(analysisRuns.id, started.analysisRunId));
      assert.equal(run.userId, primary.id);
      assert.equal(run.accessMode, "member");
      let outboxId: number | null;
      if (isPersonal) {
        assert.equal(started.relationshipInvite, null);
        const payload = await buildDecemberPersonalFixture();
        assert(/[가-힣]/u.test(payload.stage1?.psychologyTendency ?? ""));
        // Personal flow has no server result-snapshot API: preserve its real generated payload locally.
        const snapshotPath = path.join(
          storageRoot,
          "personal-result-snapshot.ko.json",
        );
        await writeFile(snapshotPath, `${JSON.stringify(payload, null, 2)}\n`);
        assert.deepEqual(
          JSON.parse(await readFile(snapshotPath, "utf8")),
          payload,
        );
        const queued = await queuePrivateAnalysisPdfDelivery({
          analysisRunId: started.analysisRunId,
          kind: "personal_deep",
          payload,
        });
        const repeated = await queuePrivateAnalysisPdfDelivery({
          analysisRunId: started.analysisRunId,
          kind: "personal_deep",
          payload,
        });
        assert.equal(repeated.alreadyQueued, true);
        assert.equal(repeated.privateDocumentId, queued.privateDocumentId);
        assert.equal(repeated.outboxId, queued.outboxId);
        outboxId = queued.outboxId;
      } else {
        const invite = started.relationshipInvite;
        assert(invite, "LOCAL_E2E_INVITE_MISSING");
        const submissions = isCouple
          ? [
              {
                info: {
                  gender: "남성" as const,
                  faith: "무교" as const,
                  relationshipRole: "남편" as const,
                },
                colors: ["magenta", "lavender", "teal"],
                cards: ["white_pentagon", "yellow_circle", "purple_triangle"],
              },
              {
                info: {
                  gender: "여성" as const,
                  faith: "무교" as const,
                  relationshipRole: "아내" as const,
                },
                colors: ["green", "blue", "orange"],
                cards: [
                  "purple_circle",
                  "red_inverted_triangle",
                  "white_hexagon",
                ],
              },
            ]
          : [
              {
                info: {
                  gender: "여성" as const,
                  faith: "무교" as const,
                  relationshipRole: "딸" as const,
                },
                colors: ["yellow", "pink", "coral"],
                cards: ["yellow_circle", "purple_diamond", "orange_pentagon"],
              },
              {
                info: {
                  gender: "여성" as const,
                  faith: "무교" as const,
                  relationshipRole: "엄마" as const,
                },
                colors: ["green", "blue", "lavender"],
                cards: ["green_circle", "blue_square", "purple_hexagon"],
              },
            ];
        for (const [index, accessToken] of [
          invite.ownerAccessToken,
          invite.inviteToken,
        ].entries()) {
          const context =
            await relationship.getRelationshipInviteContext(accessToken);
          assert.equal(context.participant, index === 0 ? "A" : "B");
          const submission = submissions[index];
          assert.equal(context.assignedRole, submission.info.relationshipRole);
          const saved = await relationship.saveRelationshipParticipantDraft({
            accessToken,
            expectedRevision: context.draftRevision,
            consentAccepted: true,
            draft: submission,
          });
          const reconnected =
            await relationship.getRelationshipInviteContext(accessToken);
          assert.equal(reconnected.draftRevision, saved.draftRevision);
          assert.equal(
            reconnected.draft?.info?.relationshipRole,
            submission.info.relationshipRole,
          );
          const submitted = await relationship.submitRelationshipParticipant({
            accessToken,
            expectedRevision: saved.draftRevision,
            submission,
          });
          assert.equal(submitted.shouldGenerateReport, index === 1);
          if (index === 0) {
            assert.equal(submitted.context.status, "awaiting_partner");
            assert.equal(
              (
                await relationship.getRelationshipSessionDeliverySnapshot(
                  invite.relationshipSessionId,
                )
              )?.outboxStatus,
              null,
            );
          }
        }
        const queued = await relationship.generateAndQueueRelationshipReport(
          invite.relationshipSessionId,
        );
        outboxId = queued.outboxId;
        const result = await relationship.getRelationshipResult({
          resultToken: invite.resultToken,
        });
        assert.equal(result.status, "email_pending");
        assert(result.snapshot, "LOCAL_E2E_RELATIONSHIP_SNAPSHOT_MISSING");
        assert.equal(
          result.snapshot.sessionData.personA.info.relationshipRole,
          configuration.roleA,
        );
        assert.equal(
          result.snapshot.sessionData.personB.info.relationshipRole,
          configuration.roleB,
        );
        assert.equal(
          result.snapshot.sessionData.relationType,
          isCouple ? "부부" : "엄마-딸",
        );
        assert(/[가-힣]/u.test(result.snapshot.personAIntegratedAnalysis));
        assert(/[가-힣]/u.test(result.snapshot.personBIntegratedAnalysis));
        // Existing snapshot format is Korean content, not a locale-tagged schema.
        const shared = await member.coupleShares.create({
          snapshot: JSON.stringify(result.snapshot),
        });
        const queried = await member.coupleShares.get({
          shareId: shared.shareId,
        });
        assert.deepEqual(queried?.snapshot, result.snapshot);
        const partnerResult = await relationship.getRelationshipResult({
          accessToken: invite.inviteToken,
        });
        assert.deepEqual(partnerResult.snapshot, result.snapshot);
        const ownerPdf = await relationship.getRelationshipPrivatePdfDownload({
          accessToken: invite.ownerAccessToken,
        });
        const partnerPdf = await relationship.getRelationshipPrivatePdfDownload(
          { accessToken: invite.inviteToken },
        );
        assert(ownerPdf.content.equals(partnerPdf.content));
        assert.deepEqual(
          await relationship.generateAndQueueRelationshipReport(
            invite.relationshipSessionId,
          ),
          { outboxId: null },
        );
      }
      assert(outboxId, "LOCAL_E2E_OUTBOX_MISSING");
      const [outbox] = await db
        .select()
        .from(emailOutbox)
        .where(eq(emailOutbox.id, outboxId));
      assert.equal(outbox.status, "queued");
      assert.equal(outbox.attemptCount, 0);
      assert.equal(outbox.providerMessageId, null);
      assert.equal(outbox.sentAt, null);
      assert.equal(outbox.userId, primary.id);
      const documents = await db
        .select()
        .from(privateDocuments)
        .where(eq(privateDocuments.analysisRunId, started.analysisRunId));
      assert.equal(documents.length, 1);
      const document = documents[0];
      assert.equal(document.status, "generated");
      assert.equal(document.userId, primary.id);
      assert(document.storageKey?.startsWith("private/analysis-results/"));
      const download = await getPrivateAnalysisPdfDownload({
        analysisRunId: started.analysisRunId,
        productCode,
        deliveryToken: started.deliveryGrant.accessToken,
      });
      const physical = await readFile(
        path.join(storageRoot, document.storageKey!),
      );
      assert(
        download.content.equals(physical),
        "LOCAL_E2E_PRIVATE_SERVICE_BYTES_DIFFER_FROM_DISK",
      );
      assert(download.filename.endsWith(".pdf"));
      pdfs.push({ productCode, ...readPdf(download.content) });
      const [completedRun] = await db
        .select()
        .from(analysisRuns)
        .where(eq(analysisRuns.id, started.analysisRunId));
      assert.equal(completedRun.status, "completed");
      check(
        `${productCode}: original Korean report, private readable PDF, one unsent outbox with attempts=0/provider=null`,
      );
    }

    // Expired checkout releases its hold, permitting a new discounted attempt.
    const expiring = await checkout(second, personal.productCode);
    clock.setSystemTime(new Date(activeAt.getTime() + 31 * 60 * 1000));
    await rejects(() => complete(expiring, "success"), "TOSS_ORDER_EXPIRED");
    assert.equal((await redemption(expiring.orderNumber)).state, "released");
    const reused = await checkout(second, personal.productCode);
    assert.equal(reused.finalAmountKrw, 9900);
    await complete(reused, "cancelled");
    check(
      "expired synthetic order commits coupon release and permits discounted retry",
    );

    clock.setSystemTime(new Date(endsAt.getTime() - 1000));
    await caller(boundary).commerce.coupons.claimDecember();
    const lastSecond = await checkout(boundary, personal.productCode);
    assert.equal(lastSecond.expiresAt.getTime(), endsAt.getTime());
    clock.setSystemTime(endsAt);
    assert.equal(
      (await caller(boundary).commerce.coupons.decemberStatus()).active,
      false,
    );
    await rejects(() => complete(lastSecond, "success"), "TOSS_ORDER_EXPIRED");
    assert.equal((await redemption(lastSecond.orderNumber)).state, "released");
    for (const date of [endsAt, new Date(endsAt.getTime() + 1000)]) {
      clock.setSystemTime(date);
      await rejects(
        () => caller(boundary).commerce.coupons.claimDecember(),
        "COUPON_NOT_IN_VALID_PERIOD",
      );
      await rejects(
        () => checkout(boundary, personal.productCode, personal.couponCode),
        "COUPON_NOT_IN_VALID_PERIOD",
      );
      await rejects(
        () =>
          caller(boundary).commerce.coupons.preview({
            productCode: personal.productCode,
            couponCode: personal.couponCode,
            listAmountKrw: 29000,
          }),
        "COUPON_NOT_IN_VALID_PERIOD",
      );
    }
    assert(
      (await caller(boundary).commerce.coupons.decemberStatus()).offers.every(
        (offer) => offer.state === "expired",
      ),
    );
    const postEvent = await checkout(boundary, personal.productCode);
    assert.equal(postEvent.finalAmountKrw, 29000);
    await complete(postEvent, "cancelled");
    check(
      "KST end exclusive and after-end rejection, clipped pending expiry, regular-price fallback",
    );

    const allOutbox = await db.select().from(emailOutbox);
    assert.equal(allOutbox.length, 3);
    assert(
      allOutbox.every(
        (row) =>
          row.status === "queued" &&
          row.attemptCount === 0 &&
          row.providerMessageId === null &&
          row.sentAt === null,
      ),
    );
    const allOrders = await db.select().from(orders);
    assert(allOrders.every((row) => row.isTest));
    const allPayments = await db.select().from(paymentTransactions);
    assert(allPayments.every((row) => row.provider === "test"));
    const allEntitlements = await db.select().from(entitlements);
    assert.equal(allEntitlements.length, 3);
    assert(
      allEntitlements.every(
        (row) =>
          row.userId === primary.id &&
          row.status === "consumed" &&
          row.usedCount === 1,
      ),
    );
    const totals = await db
      .select({ productCode: products.code, userId: couponRedemptions.userId })
      .from(couponRedemptions)
      .innerJoin(coupons, eq(coupons.id, couponRedemptions.couponId))
      .innerJoin(
        couponProductRules,
        eq(couponProductRules.couponId, coupons.id),
      )
      .innerJoin(products, eq(products.id, couponProductRules.productId))
      .where(
        and(
          eq(couponRedemptions.userId, primary.id),
          eq(couponRedemptions.state, "consumed"),
        ),
      );
    assert.equal(totals.length, 3);
    assert.equal(new Set(totals.map((row) => row.productCode)).size, 3);
    check(
      "final ledger: three member entitlements, three one-use products, only test-provider orders and no sends",
    );
    const result: LocalE2eResult = {
      suite: "december-report-local-mysql-no-send-e2e",
      status: "passed",
      database: target.database,
      storageRoot,
      prices: {
        personal_deep: 9900,
        couple_love_deep: 23600,
        parent_child_deep: 15600,
      },
      checks,
      pdfs,
    };
    await writeFile(
      path.join(storageRoot, "summary.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    return result;
  } finally {
    // Drizzle's real local mysql2 pool, not a mock. No DELETE/cleanup of fixtures.
    const client = (
      db! as unknown as { $client?: { end(): Promise<void> } } | null
    )?.$client;
    try {
      if (client?.end) await client.end();
    } finally {
      restoreEnvironment();
    }
  }
}
