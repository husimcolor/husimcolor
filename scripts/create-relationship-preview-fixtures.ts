import { eq } from "drizzle-orm";

import { emailOutbox } from "../drizzle/schema";
import { getDb } from "../server/db";
import { markRelationshipSessionEmailDelivered } from "../server/commerce/relationship-session-completion";
import {
  generateAndQueueRelationshipReport,
  saveRelationshipParticipantDraft,
  submitRelationshipParticipant,
} from "../server/commerce/relationship-invite-service";
import { consumeEntitlementForAnalysisStart } from "../server/commerce/entitlement-service";
import { completeTestPayment, createTestCheckout } from "../server/commerce/order-service";

const A = {
  info: { gender: "남성" as const, faith: "무교" as const, relationshipRole: "남편" as const },
  colors: ["red", "blue", "green"],
  cards: ["red_circle", "blue_triangle", "green_square"],
};
const B = {
  info: { gender: "여성" as const, faith: "기독교" as const, relationshipRole: "아내" as const },
  colors: ["pink", "mint", "cream"],
  cards: ["orange_circle", "purple_triangle", "white_square"],
};

type Invite = NonNullable<Awaited<ReturnType<typeof consumeEntitlementForAnalysisStart>>["relationshipInvite"]>;

async function issueInvite(): Promise<Invite> {
  const nonce = `preview-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const checkout = await createTestCheckout({
    productCode: "couple_love_deep",
    email: "support@husimcolor.com",
    idempotencyKey: nonce,
  });
  const payment = await completeTestPayment({
    orderNumber: checkout.orderNumber,
    providerPaymentId: `preview-payment-${nonce}`,
    outcome: "success",
    amountKrw: checkout.finalAmountKrw,
  });
  if (payment.status !== "paid" || !payment.startGrant) throw new Error("TEST_PAYMENT_START_GRANT_MISSING");
  const consumed = await consumeEntitlementForAnalysisStart({
    accessToken: payment.startGrant.accessToken,
    productCode: "couple_love_deep",
    relationshipMode: "invite_link",
    relationType: "부부",
  });
  if (!consumed.relationshipInvite) throw new Error("PREVIEW_INVITE_NOT_ISSUED");
  return consumed.relationshipInvite;
}

async function submitParticipant(accessToken: string, submission: typeof A | typeof B) {
  const draft = await saveRelationshipParticipantDraft({
    accessToken,
    expectedRevision: 0,
    consentAccepted: true,
    draft: submission,
  });
  return submitRelationshipParticipant({
    accessToken,
    expectedRevision: draft.draftRevision,
    submission,
  });
}

async function main() {
  const active = await issueInvite();
  const waiting = await issueInvite();
  await submitParticipant(waiting.ownerAccessToken, A);

  const generating = await issueInvite();
  await submitParticipant(generating.ownerAccessToken, A);
  await submitParticipant(generating.inviteToken, B);

  const completed = await issueInvite();
  await submitParticipant(completed.ownerAccessToken, A);
  const completedSubmission = await submitParticipant(completed.inviteToken, B);
  if (!completedSubmission.shouldGenerateReport) throw new Error("PREVIEW_REPORT_GENERATION_NOT_CLAIMED");
  const queued = await generateAndQueueRelationshipReport(completed.relationshipSessionId);
  if (!queued.outboxId) throw new Error("PREVIEW_OUTBOX_NOT_QUEUED");

  // 시각 검토를 위한 개발 전용 fixture: 실제 Resend API를 호출하지 않으며, PDF 생성 후 완료 UI만 재현한다.
  const db = await getDb();
  if (!db) throw new Error("DATABASE_NOT_AVAILABLE");
  await db.update(emailOutbox).set({ status: "sent", sentAt: new Date(), providerMessageId: "preview-no-send" }).where(eq(emailOutbox.id, queued.outboxId));
  await markRelationshipSessionEmailDelivered(queued.outboxId);

  console.log(JSON.stringify({
    noExternalEmailWasSent: true,
    active,
    waiting,
    generating,
    completed,
  }, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
