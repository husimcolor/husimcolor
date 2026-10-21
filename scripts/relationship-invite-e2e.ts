import { and, eq } from "drizzle-orm";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { generateCoupleAnalysis, generatePersonAnalysis, getRelationArchetype, isRelationshipRolePairValid, type CoupleSessionData } from "../constants/coupleData";
import {
  analysisRuns,
  emailOutbox,
  privateDocuments,
  productPrices,
  products,
  relationshipParticipants,
  relationshipSessions,
  relationshipSetups,
  products,
  productPrices,
} from "../drizzle/schema";
import { getDb } from "../server/db";
import { configureRelationshipSetup, consumeEntitlementForAnalysisStart } from "../server/commerce/entitlement-service";
import { completeTestPayment, createTestCheckout } from "../server/commerce/order-service";
import {
  generateAndQueueRelationshipReport,
  getRelationshipInviteContext,
  getRelationshipPrivatePdfDownload,
  getRelationshipResult,
  getRelationshipSessionDeliverySnapshot,
  saveRelationshipParticipantDraft,
  submitRelationshipParticipant,
} from "../server/commerce/relationship-invite-service";
import { copyVersionForLocale } from "../shared/localization";

const E2E_EMAIL = "relationship-invite-e2e@invalid.example";
const A_SUBMISSION = {
  info: { gender: "남성" as const, faith: "무교" as const, relationshipRole: "남편" as const },
  colors: ["red", "blue", "green"],
  cards: ["red_circle", "blue_triangle", "green_square"],
};
const B_SUBMISSION = {
  info: { gender: "여성" as const, faith: "기독교" as const, relationshipRole: "아내" as const },
  colors: ["pink", "mint", "cream"],
  cards: ["orange_circle", "purple_triangle", "white_square"],
};

type Check = { name: string; status: "passed" | "failed"; detail: string };
const checks: Check[] = [];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertIsolatedNoSendRuntime() {
  if (process.env.HUSIM_DISABLE_EMAIL_DELIVERY !== "true") {
    throw new Error("RELATIONSHIP_E2E_EMAIL_DELIVERY_MUST_BE_DISABLED");
  }
  if (process.env.COMMERCE_TEST_MODE !== "true") {
    throw new Error("RELATIONSHIP_E2E_TEST_MODE_REQUIRED");
  }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("RELATIONSHIP_E2E_DATABASE_URL_REQUIRED");
  const parsed = new URL(databaseUrl);
  const isLoopback = parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost";
  if (!isLoopback || parsed.port !== "3308") {
    throw new Error("RELATIONSHIP_E2E_LOCAL_DATABASE_REQUIRED");
  }
}

/** 로컬 빈 DB에서만 test checkout에 필요한 상품·가격 기준값을 만든다. */
async function ensureIsolatedE2eCatalog() {
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const entries = [
    { code: "couple_love_deep" as const, name: "격리 E2E 부부·연인 분석", amountKrw: 47200 },
    { code: "parent_child_deep" as const, name: "격리 E2E 부모·자녀 분석", amountKrw: 31200 },
  ];
  for (const entry of entries) {
    let [product] = await db.select().from(products).where(eq(products.code, entry.code)).limit(1);
    if (!product) {
      const inserted = await db.insert(products).values({
        code: entry.code,
        name: entry.name,
        fulfillmentType: "analysis",
        requiresPayment: true,
        active: true,
      });
      const id = Number(inserted[0].insertId);
      [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    }
    assert(product, `E2E_PRODUCT_SEED_FAILED_${entry.code}`);
    const [price] = await db.select().from(productPrices)
      .where(and(eq(productPrices.productId, product.id), eq(productPrices.active, true)))
      .limit(1);
    if (!price) {
      await db.insert(productPrices).values({
        productId: product.id,
        regularAmountKrw: entry.amountKrw,
        amountKrw: entry.amountKrw,
        currency: "KRW",
        version: 1,
        active: true,
      });
    }
  }
}

async function expectFailure(name: string, action: () => Promise<unknown>, includes: string) {
  try {
    await action();
    checks.push({ name, status: "failed", detail: "차단되어야 할 요청이 성공했습니다." });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert(message.includes(includes), `${name}: 예상 오류 ${includes}, 실제 ${message}`);
    checks.push({ name, status: "passed", detail: includes });
  }
}


async function ensureE2eProducts() {
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const fixture = [
    { code: "couple_love_deep", name: "E2E 부부·연인 관계 심화분석", amountKrw: 59000 },
    { code: "parent_child_deep", name: "E2E 부모·자녀 관계 심화분석", amountKrw: 39000 },
  ] as const;
  for (const item of fixture) {
    await db.insert(products).values({ code: item.code, name: item.name, fulfillmentType: "analysis", requiresPayment: true, active: true })
      .onDuplicateKeyUpdate({ set: { active: true, name: item.name } });
    const row = await db.select({ id: products.id }).from(products).where(eq(products.code, item.code)).limit(1);
    assert(row[0], `E2E product seed missing: ${item.code}`);
    await db.insert(productPrices).values({ productId: row[0].id, regularAmountKrw: item.amountKrw, amountKrw: item.amountKrw, currency: "KRW", version: 1, active: true })
      .onDuplicateKeyUpdate({ set: { active: true, amountKrw: item.amountKrw, regularAmountKrw: item.amountKrw } });
  }
}

async function purchaseAndConsume(input: {
  productCode?: "couple_love_deep" | "parent_child_deep";
  mode?: "invite_link";
  relationType?: "부부" | "부모-자녀";
}) {
  const productCode = input.productCode ?? "couple_love_deep";
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const checkout = await createTestCheckout({
    productCode,
    email: E2E_EMAIL,
    idempotencyKey: `relationship-e2e-checkout-${nonce}`,
  });
  assert(checkout.status === "pending", "테스트 주문이 pending으로 생성되지 않았습니다.");
  const payment = await completeTestPayment({
    orderNumber: checkout.orderNumber,
    providerPaymentId: `relationship-e2e-payment-${nonce}`,
    outcome: "success",
    amountKrw: checkout.finalAmountKrw,
  });
  assert(payment.status === "paid" && payment.startGrant, "테스트 승인 후 시작 권한이 생성되지 않았습니다.");
  const romantic = productCode === "couple_love_deep";
  if (romantic) {
    await configureRelationshipSetup({
      accessToken: payment.startGrant.accessToken,
      relationType: "부부",
      roleA: "남편",
      roleB: "아내",
    });
  }
  return consumeEntitlementForAnalysisStart({
    accessToken: payment.startGrant.accessToken,
    productCode,
    relationshipMode: input.mode,
    relationType: romantic ? "부부" : input.relationType,
    ...(romantic ? { roleA: "남편" as const, roleB: "아내" as const } : {}),
    locale: "zh-CN",
  });
}

async function verifyExistingOnePhonePath() {
  const existing = await purchaseAndConsume({});
  assert(existing.relationshipInvite === null, "기존 한 휴대폰 검사에 초대 세션이 생성되었습니다.");
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const rows = await db.select({ id: relationshipSessions.id })
    .from(relationshipSessions)
    .where(eq(relationshipSessions.analysisRunId, existing.analysisRunId));
  assert(rows.length === 0, "기존 한 휴대폰 analysis run이 초대 관계 세션과 연결되었습니다.");

  const personA = { info: { gender: "남성" as const, faith: "무교" as const }, colors: A_SUBMISSION.colors, cards: A_SUBMISSION.cards };
  const personB = { info: { gender: "여성" as const, faith: "기독교" as const }, colors: B_SUBMISSION.colors, cards: B_SUBMISSION.cards };
  const localSession: CoupleSessionData = { relationType: "부부", personA, personB };
  const analysisA = generatePersonAnalysis(localSession.personA, "A");
  const analysisB = generatePersonAnalysis(localSession.personB, "B");
  const relationship = generateCoupleAnalysis(localSession, analysisA, analysisB);
  const archetype = getRelationArchetype(
    ["warm_active", "cool_clear", "nature"],
    ["warm_soft", "cool_clear", "warm_soft"],
    CARD_DATA.find((card) => card.id === A_SUBMISSION.cards[2])?.shape,
    CARD_DATA.find((card) => card.id === B_SUBMISSION.cards[2])?.shape,
    personA.colors,
    personB.colors,
    personA.cards,
    personB.cards,
  );
  assert(Boolean(relationship && archetype), "기존 한 휴대폰 관계 분석 모듈이 결과를 반환하지 않았습니다.");
  checks.push({ name: "기존 한 휴대폰 검사 경로", status: "passed", detail: "별도 초대 세션 없이 기존 분석 모듈 결과를 생성했습니다." });
}

async function verifyParentChildRoleOrder() {
  const consumed = await purchaseAndConsume({ productCode: "parent_child_deep", mode: "invite_link", relationType: "부모-자녀" });
  assert(consumed.relationshipInvite, "부모·자녀 초대 세션이 생성되지 않았습니다.");
  const invite = consumed.relationshipInvite;
  const childSubmission = {
    info: { gender: "여성" as const, faith: "무교" as const, relationshipRole: "딸" as const },
    colors: ["pink", "mint", "cream"], cards: ["orange_circle", "purple_triangle", "white_square"],
  };
  const parentSubmission = {
    info: { gender: "여성" as const, faith: "기독교" as const, relationshipRole: "엄마" as const },
    colors: ["red", "blue", "green"], cards: ["red_circle", "blue_triangle", "green_square"],
  };
  const childContext = await getRelationshipInviteContext(invite.ownerAccessToken);
  const childSaved = await saveRelationshipParticipantDraft({
    accessToken: invite.ownerAccessToken,
    expectedRevision: childContext.draftRevision,
    consentAccepted: true,
    draft: childSubmission,
  });
  await submitRelationshipParticipant({ accessToken: invite.ownerAccessToken, expectedRevision: childSaved.draftRevision, submission: childSubmission });
  const parentContext = await getRelationshipInviteContext(invite.inviteToken);
  assert(parentContext.partnerRole === "딸", "부모·자녀 초대 상대에게 자녀 역할이 전달되지 않았습니다.");
  const parentSaved = await saveRelationshipParticipantDraft({
    accessToken: invite.inviteToken,
    expectedRevision: parentContext.draftRevision,
    consentAccepted: true,
    draft: parentSubmission,
  });
  const parentSubmitted = await submitRelationshipParticipant({ accessToken: invite.inviteToken, expectedRevision: parentSaved.draftRevision, submission: parentSubmission });
  assert(parentSubmitted.shouldGenerateReport, "부모가 두 번째로 제출한 역할 조합이 리포트 생성을 선점하지 않았습니다.");
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const [session] = await db.select({ relationType: relationshipSessions.relationType, status: relationshipSessions.status })
    .from(relationshipSessions).where(eq(relationshipSessions.id, invite.relationshipSessionId));
  assert(session?.relationType === "엄마-딸" && session.status === "report_generating", "검사 순서와 무관하게 엄마-딸 관계로 확정되지 않았습니다.");
  const queued = await generateAndQueueRelationshipReport(invite.relationshipSessionId);
  assert(queued.outboxId, "부모·자녀 양측 완료 후 PDF 이메일 outbox가 생성되지 않았습니다.");
  const result = await getRelationshipResult({ resultToken: invite.resultToken });
  assert(result.status === "email_pending" && result.snapshot, "부모·자녀 결과 스냅샷을 재조회하지 못했습니다.");
  assert(result.snapshot.locale === "zh-CN" && result.snapshot.copyVersion === copyVersionForLocale("zh-CN"), "부모·자녀 결과의 저장 locale/copyVersion이 일치하지 않습니다.");
  assert(result.snapshot.sessionData.personA.info.relationshipRole === "딸" && result.snapshot.sessionData.personB.info.relationshipRole === "엄마", "부모·자녀 역순 제출의 실제 역할이 저장 결과에 보존되지 않았습니다.");
  const pdf = await getRelationshipPrivatePdfDownload({ resultToken: invite.resultToken });
  assert(pdf.filename === "HUSIM_COLOR_亲子关系报告.pdf" && pdf.content.subarray(0, 4).toString("utf8") === "%PDF", "부모·자녀 저장 PDF의 zh-CN 파일명 또는 바이트가 올바르지 않습니다.");
  const [outbox] = await db.select({ status: emailOutbox.status, attempts: emailOutbox.attemptCount, locale: emailOutbox.locale, copyVersion: emailOutbox.copyVersion })
    .from(emailOutbox).where(eq(emailOutbox.id, queued.outboxId));
  assert(outbox?.status === "queued" && outbox.attempts === 0 && outbox.locale === "zh-CN" && outbox.copyVersion === copyVersionForLocale("zh-CN"), "부모·자녀 무발송 outbox의 locale/copyVersion 또는 queued 상태가 일치하지 않습니다.");
  const noSend = await deliverPrivatePdfOutboxItem(queued.outboxId);
  assert(noSend.status === "not_claimed", "부모·자녀 무발송 안전 게이트가 outbox를 차단하지 못했습니다.");
  checks.push({ name: "부모·자녀 실제 역할·역순·PDF 재조회", status: "passed", detail: "딸이 먼저 제출해도 엄마-딸로 확정하고, zh-CN 스냅샷·저장 PDF·queued outbox를 무발송으로 재조회했습니다." });
}

async function verifyInvalidRolePairRejected() {
  const consumed = await purchaseAndConsume({ mode: "invite_link", relationType: "부부" });
  assert(consumed.relationshipInvite, "역할 조합 검증용 초대 세션이 생성되지 않았습니다.");
  const invite = consumed.relationshipInvite;
  const owner = await getRelationshipInviteContext(invite.ownerAccessToken);
  const ownerSaved = await saveRelationshipParticipantDraft({ accessToken: invite.ownerAccessToken, expectedRevision: owner.draftRevision, consentAccepted: true, draft: A_SUBMISSION });
  await submitRelationshipParticipant({ accessToken: invite.ownerAccessToken, expectedRevision: ownerSaved.draftRevision, submission: A_SUBMISSION });
  const partner = await getRelationshipInviteContext(invite.inviteToken);
  const invalidPartner = { ...B_SUBMISSION, info: { ...B_SUBMISSION.info, relationshipRole: "여자친구" as const } };
  await expectFailure("서버 역할 불일치 제출 차단", () => submitRelationshipParticipant({
    accessToken: invite.inviteToken,
    expectedRevision: partner.draftRevision,
    submission: invalidPartner,
  }), "RELATIONSHIP_ASSIGNED_ROLE_MISMATCH");
  const afterRejected = await getRelationshipInviteContext(invite.inviteToken);
  assert(afterRejected.status === "awaiting_partner" && afterRejected.participantStatus === "not_started", "역할 불일치 제출이 참가자 상태를 변경했습니다.");
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  await db.update(relationshipSessions).set({ status: "failed", reportErrorCode: "E2E_INVALID_ROLE_PAIR_VERIFIED" })
    .where(and(eq(relationshipSessions.id, invite.relationshipSessionId), eq(relationshipSessions.status, "awaiting_partner")));
  checks.push({ name: "서버 역할 불일치 차단", status: "passed", detail: "UI를 우회해 남편·여자친구 조합을 제출해도 트랜잭션을 되돌리고 리포트를 생성하지 않았습니다." });
}

async function main() {
  assertIsolatedNoSendRuntime();
  await ensureIsolatedE2eCatalog();
  assert(process.env.HUSIM_DISABLE_EMAIL_DELIVERY === "1", "HUSIM_DISABLE_EMAIL_DELIVERY=1 없이는 이 E2E를 실행하지 않습니다.");
  assert(COLOR_DATA.length > 0 && CARD_DATA.length > 0, "분석 선택 데이터가 준비되지 않았습니다.");
  await ensureE2eProducts();
  if (process.env.RELATIONSHIP_E2E_PARENT_ONLY === "true") {
    await verifyParentChildRoleOrder();
    await verifyInvalidRolePairRejected();
    console.log(JSON.stringify({ suite: "relationship-invite-parent-role-e2e", status: "passed", checks }, null, 2));
    return;
  }
  assert(isRelationshipRolePairValid("부부", "남편", "아내"), "정상 부부 역할 조합이 거부되었습니다.");
  assert(!isRelationshipRolePairValid("부부", "남편", "여자친구"), "서로 맞지 않는 역할 조합이 허용되었습니다.");
  checks.push({ name: "관계 역할 짝 검증", status: "passed", detail: "남편·아내만 허용하고 불일치 조합은 서버에서 차단합니다." });

  const consumed = await purchaseAndConsume({ mode: "invite_link", relationType: "부부" });
  assert(consumed.relationshipInvite, "초대 방식의 관계 세션이 생성되지 않았습니다.");
  const invite = consumed.relationshipInvite;
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const setupRows = await db.select({ entitlementId: relationshipSetups.entitlementId }).from(relationshipSetups).where(eq(relationshipSetups.entitlementId, consumed.entitlementId));
  assert(setupRows.length === 1, "결제 권한별 관계 설정이 서버에 한 번 저장되지 않았습니다.");
  checks.push({ name: "테스트 결제 권한·서버 관계 설정·초대 세션 생성", status: "passed", detail: "실제 결제 없이 테스트 승인 후 entitlement별 역할 설정과 한 analysis run의 A/B 세션을 생성했습니다." });

  const ownerBefore = await getRelationshipInviteContext(invite.ownerAccessToken);
  const partnerBefore = await getRelationshipInviteContext(invite.inviteToken);
  assert(ownerBefore.relationshipSessionId === partnerBefore.relationshipSessionId, "A/B가 동일한 관계 세션에 연결되지 않았습니다.");
  assert(ownerBefore.participant === "A" && partnerBefore.participant === "B", "초대 링크 참가자 슬롯이 올바르지 않습니다.");
  checks.push({ name: "고유 초대 링크와 A/B 세션 연결", status: "passed", detail: "서로 다른 토큰이 하나의 관계 세션의 A/B 슬롯에만 연결됩니다." });

  const savedA = await saveRelationshipParticipantDraft({
    accessToken: invite.ownerAccessToken,
    expectedRevision: ownerBefore.draftRevision,
    consentAccepted: true,
    draft: { info: A_SUBMISSION.info, colors: A_SUBMISSION.colors },
  });
  const reconnectedA = await getRelationshipInviteContext(invite.ownerAccessToken);
  assert(reconnectedA.draftRevision === savedA.draftRevision && reconnectedA.draft?.info?.relationshipRole === "남편", "동일 링크 재접속에서 A의 역할·초안이 복원되지 않았습니다.");
  checks.push({ name: "이탈 후 동일 링크 재접속", status: "passed", detail: "A의 저장된 성별·역할·컬러 초안을 revision과 함께 복원했습니다." });

  const submittedA = await submitRelationshipParticipant({
    accessToken: invite.ownerAccessToken,
    expectedRevision: reconnectedA.draftRevision,
    submission: A_SUBMISSION,
  });
  assert(!submittedA.shouldGenerateReport && submittedA.context.status === "awaiting_partner", "A만 완료한 상태에서 리포트 생성이 선점되었습니다.");
  const beforePartnerDelivery = await getRelationshipSessionDeliverySnapshot(invite.relationshipSessionId);
  assert(beforePartnerDelivery?.outboxStatus === null, "상대방 제출 전 outbox가 생성되었습니다.");
  checks.push({ name: "상대방 검사 대기", status: "passed", detail: "A만 제출한 상태에서는 PDF/outbox를 생성하지 않고 awaiting_partner로 유지했습니다." });

  const partnerAfterOwner = await getRelationshipInviteContext(invite.inviteToken);
  assert(partnerAfterOwner.partnerRole === "남편", "초대받은 상대에게 기존 검사자의 역할이 전달되지 않았습니다.");
  const savedB = await saveRelationshipParticipantDraft({
    accessToken: invite.inviteToken,
    expectedRevision: partnerAfterOwner.draftRevision,
    consentAccepted: true,
    draft: { info: B_SUBMISSION.info, colors: B_SUBMISSION.colors, cards: B_SUBMISSION.cards },
  });
  const submittedB = await submitRelationshipParticipant({
    accessToken: invite.inviteToken,
    expectedRevision: savedB.draftRevision,
    submission: B_SUBMISSION,
  });
  assert(submittedB.shouldGenerateReport, "두 번째 제출이 리포트 생성 권한을 선점하지 않았습니다.");
  checks.push({ name: "상대 역할 제한 및 양측 최종 제출", status: "passed", detail: "A=남편 이후 B=아내 조합을 저장하고 단일 리포트 생성 권한을 선점했습니다." });

  await expectFailure("동시·중복 제출 차단", () => submitRelationshipParticipant({
    accessToken: invite.inviteToken,
    expectedRevision: savedB.draftRevision + 1,
    submission: B_SUBMISSION,
  }), "RELATIONSHIP_INVITE_LOCKED");

  const queued = await generateAndQueueRelationshipReport(invite.relationshipSessionId);
  assert(queued.outboxId, "양측 완료 후 PDF 이메일 outbox가 생성되지 않았습니다.");
  const [document] = await db.select({ id: privateDocuments.id, status: privateDocuments.status, storageKey: privateDocuments.storageKey })
    .from(privateDocuments)
    .where(eq(privateDocuments.analysisRunId, consumed.analysisRunId));
  assert(document?.status === "generated" && document.storageKey, "PDF가 private storage에 generated 상태로 보관되지 않았습니다.");
  const resultBeforeEmail = await getRelationshipResult({ resultToken: invite.resultToken });
  assert(resultBeforeEmail.status === "email_pending" && resultBeforeEmail.snapshot, "email_pending 상태의 관계 결과를 재조회하지 못했습니다.");
  assert(resultBeforeEmail.snapshot.locale === "zh-CN" && resultBeforeEmail.snapshot.copyVersion === copyVersionForLocale("zh-CN"), "부부 저장 결과의 locale/copyVersion이 일치하지 않습니다.");
  const pdf = await getRelationshipPrivatePdfDownload({ resultToken: invite.resultToken });
  assert(pdf.filename === "HUSIM_COLOR_夫妻_恋人关系报告.pdf" && pdf.content.subarray(0, 4).toString("utf8") === "%PDF", "부부 저장 PDF의 zh-CN 파일명 또는 바이트가 올바르지 않습니다.");
  checks.push({ name: "양측 완료 후 zh-CN private PDF 생성·재조회", status: "passed", detail: "한 번의 outbox와 private PDF를 생성하고, email_pending 상태에서도 고정 zh-CN 결과와 PDF를 재조회했습니다." });

  const noSend = await deliverPrivatePdfOutboxItem(queued.outboxId);
  assert(noSend.status === "not_claimed", "무발송 안전 게이트가 관계 outbox를 차단하지 못했습니다.");
  const [outbox] = await db.select({ id: emailOutbox.id, status: emailOutbox.status, attempts: emailOutbox.attemptCount, providerMessageId: emailOutbox.providerMessageId, locale: emailOutbox.locale, copyVersion: emailOutbox.copyVersion })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, queued.outboxId));
  assert(outbox?.status === "queued" && !outbox.providerMessageId && outbox.attempts === 0 && outbox.locale === "zh-CN" && outbox.copyVersion === copyVersionForLocale("zh-CN"), "무발송 관계 outbox가 queued/locale/copyVersion 상태를 유지하지 못했습니다.");
  checks.push({ name: "관계 PDF 이메일 무발송 안전 게이트", status: "passed", detail: "가상 invalid.example 수신자 outbox가 queued·attemptCount 0으로 유지되어 provider 호출과 실제 이메일 발송을 막았습니다." });

  const completedInvite = await getRelationshipInviteContext(invite.inviteToken);
  assert(completedInvite.status === "email_pending" && !completedInvite.canEdit, "PDF 생성 뒤 email_pending 초대 링크가 잠기지 않았습니다.");
  await expectFailure("완료 초대 링크 답변 수정 차단", () => saveRelationshipParticipantDraft({
    accessToken: invite.inviteToken,
    expectedRevision: completedInvite.draftRevision,
    draft: { info: B_SUBMISSION.info },
  }), "RELATIONSHIP_INVITE_LOCKED");
  await expectFailure("완료 초대 링크 재제출 차단", () => submitRelationshipParticipant({
    accessToken: invite.inviteToken,
    expectedRevision: completedInvite.draftRevision,
    submission: B_SUBMISSION,
  }), "RELATIONSHIP_INVITE_LOCKED");

  const result = await getRelationshipResult({ resultToken: invite.resultToken });
  assert(result.status === "email_pending" && result.snapshot, "별도 결과 토큰으로 email_pending 결과를 조회하지 못했습니다.");
  assert(result.snapshot.sessionData.personA.info.relationshipRole === "남편" && result.snapshot.sessionData.personB.info.relationshipRole === "아내", "결과 스냅샷에 실제 관계 역할이 보존되지 않았습니다.");
  checks.push({ name: "PDF 준비 후 초대 링크 잠금 및 결과 토큰 분리", status: "passed", detail: "초대 링크의 수정·재제출을 차단하고, 이메일 무발송 상태에서도 별도 결과 토큰으로 고정 스냅샷을 조회했습니다." });

  await verifyExistingOnePhonePath();
  await verifyParentChildRoleOrder();

  const failed = checks.filter((check) => check.status === "failed");
  console.log(JSON.stringify({ suite: "relationship-invite-no-send-e2e", status: failed.length ? "failed" : "passed", checks }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(JSON.stringify({ suite: "relationship-invite-no-send-e2e", status: "failed", error: error instanceof Error ? error.message : String(error), checks }, null, 2));
    process.exit(1);
  });
