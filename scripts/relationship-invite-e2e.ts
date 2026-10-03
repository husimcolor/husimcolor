import { and, eq } from "drizzle-orm";

import { CARD_DATA } from "../constants/cardData";
import { COLOR_DATA } from "../constants/colorData";
import { generateCoupleAnalysis, generatePersonAnalysis, getRelationArchetype, isRelationshipRolePairValid, type CoupleSessionData } from "../constants/coupleData";
import {
  analysisRuns,
  emailOutbox,
  privateDocuments,
  relationshipParticipants,
  relationshipSessions,
} from "../drizzle/schema";
import { getDb } from "../server/db";
import { deliverPrivatePdfOutboxItem } from "../server/commerce/email-outbox-service";
import { consumeEntitlementForAnalysisStart } from "../server/commerce/entitlement-service";
import { completeTestPayment, createTestCheckout } from "../server/commerce/order-service";
import {
  generateAndQueueRelationshipReport,
  getRelationshipInviteContext,
  getRelationshipResult,
  getRelationshipSessionDeliverySnapshot,
  saveRelationshipParticipantDraft,
  submitRelationshipParticipant,
} from "../server/commerce/relationship-invite-service";

const E2E_EMAIL = "support@husimcolor.com";
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
  return consumeEntitlementForAnalysisStart({
    accessToken: payment.startGrant.accessToken,
    productCode,
    relationshipMode: input.mode,
    relationType: input.relationType,
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
  // 역할 매핑 검증만 수행한 보조 시나리오이므로 PDF/메일을 만들지 않고 명시적으로 종료한다.
  await db.update(relationshipSessions).set({ status: "failed", reportErrorCode: "E2E_ROLE_ORDER_VERIFIED" })
    .where(and(eq(relationshipSessions.id, invite.relationshipSessionId), eq(relationshipSessions.status, "report_generating")));
  checks.push({ name: "부모·자녀 실제 역할 및 역순 검사", status: "passed", detail: "딸이 먼저 제출해도 상대방을 엄마로 제한하고 최종 관계 유형을 엄마-딸로 확정했습니다." });
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
  }), "RELATIONSHIP_ROLE_PAIR_INVALID");
  const afterRejected = await getRelationshipInviteContext(invite.inviteToken);
  assert(afterRejected.status === "awaiting_partner" && afterRejected.participantStatus === "not_started", "역할 불일치 제출이 참가자 상태를 변경했습니다.");
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  await db.update(relationshipSessions).set({ status: "failed", reportErrorCode: "E2E_INVALID_ROLE_PAIR_VERIFIED" })
    .where(and(eq(relationshipSessions.id, invite.relationshipSessionId), eq(relationshipSessions.status, "awaiting_partner")));
  checks.push({ name: "서버 역할 불일치 차단", status: "passed", detail: "UI를 우회해 남편·여자친구 조합을 제출해도 트랜잭션을 되돌리고 리포트를 생성하지 않았습니다." });
}

async function main() {
  assert(COLOR_DATA.length > 0 && CARD_DATA.length > 0, "분석 선택 데이터가 준비되지 않았습니다.");
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
  checks.push({ name: "테스트 결제 권한 및 초대 세션 생성", status: "passed", detail: "테스트 승인 후 한 analysis run에 A/B 관계 세션이 생성되었습니다." });

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
  const db = await getDb();
  assert(db, "DATABASE_NOT_AVAILABLE");
  const [document] = await db.select({ id: privateDocuments.id, status: privateDocuments.status, storageKey: privateDocuments.storageKey })
    .from(privateDocuments)
    .where(eq(privateDocuments.analysisRunId, consumed.analysisRunId));
  assert(document?.status === "generated" && document.storageKey, "PDF가 private storage에 generated 상태로 보관되지 않았습니다.");
  const resultBeforeEmail = await getRelationshipResult({ resultToken: invite.resultToken });
  assert(resultBeforeEmail.status === "email_pending" && resultBeforeEmail.snapshot === null, "이메일 성공 전 결과 토큰이 리포트를 노출했습니다.");
  checks.push({ name: "양측 완료 후 private PDF 생성", status: "passed", detail: "한 번의 outbox와 private PDF 문서를 생성하고 이메일 완료 전에는 결과 토큰을 닫았습니다." });

  const firstDelivery = await deliverPrivatePdfOutboxItem(queued.outboxId);
  assert(firstDelivery.status === "sent", `Resend PDF 자동발송이 성공하지 않았습니다: ${firstDelivery.status}`);
  const repeatDelivery = await deliverPrivatePdfOutboxItem(queued.outboxId);
  assert(repeatDelivery.status === "not_claimed", "동일 outbox의 중복 이메일 발송이 차단되지 않았습니다.");
  const [outbox] = await db.select({ id: emailOutbox.id, status: emailOutbox.status, attempts: emailOutbox.attemptCount, providerMessageId: emailOutbox.providerMessageId })
    .from(emailOutbox)
    .where(eq(emailOutbox.id, queued.outboxId));
  assert(outbox?.status === "sent" && outbox.providerMessageId && outbox.attempts === 1, "이메일 outbox가 정확히 한 번 sent로 완료되지 않았습니다.");
  checks.push({ name: "PDF 이메일 자동발송 및 중복 방지", status: "passed", detail: "result@husimcolor.com 발송 provider 응답을 기록하고 동일 outbox 재발송을 차단했습니다." });

  const completedInvite = await getRelationshipInviteContext(invite.inviteToken);
  assert(completedInvite.status === "completed" && !completedInvite.canEdit && completedInvite.draft === null, "이메일 완료 후 초대 링크가 잠기지 않았습니다.");
  await expectFailure("완료 초대 링크 답변 수정 차단", () => saveRelationshipParticipantDraft({
    accessToken: invite.inviteToken,
    expectedRevision: completedInvite.draftRevision,
    draft: { info: B_SUBMISSION.info },
  }), "RELATIONSHIP_INVITE_COMPLETED");
  await expectFailure("완료 초대 링크 재제출 차단", () => submitRelationshipParticipant({
    accessToken: invite.inviteToken,
    expectedRevision: completedInvite.draftRevision,
    submission: B_SUBMISSION,
  }), "RELATIONSHIP_INVITE_COMPLETED");

  const result = await getRelationshipResult({ resultToken: invite.resultToken });
  assert(result.status === "completed" && result.snapshot, "별도 결과 토큰으로 완료 결과를 조회하지 못했습니다.");
  assert(result.snapshot.sessionData.personA.info.relationshipRole === "남편" && result.snapshot.sessionData.personB.info.relationshipRole === "아내", "결과 스냅샷에 실제 관계 역할이 보존되지 않았습니다.");
  checks.push({ name: "완료 후 초대 링크 만료 및 결과 토큰 분리", status: "passed", detail: "초대 링크의 수정·재제출을 차단하고 별도 결과 토큰에서만 완료 스냅샷을 조회했습니다." });

  await verifyExistingOnePhonePath();
  await verifyParentChildRoleOrder();

  const failed = checks.filter((check) => check.status === "failed");
  console.log(JSON.stringify({ suite: "relationship-invite-e2e", status: failed.length ? "failed" : "passed", checks }, null, 2));
  if (failed.length) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(JSON.stringify({ suite: "relationship-invite-e2e", status: "failed", error: error instanceof Error ? error.message : String(error), checks }, null, 2));
    process.exit(1);
  });
