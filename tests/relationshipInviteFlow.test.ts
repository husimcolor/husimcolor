import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("각자 휴대폰 관계 검사 초대 링크", () => {
  it("기존 한 휴대폰 관계 검사 경로를 유지하면서 결제 후에만 방식 선택 화면을 추가한다", () => {
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    const mode = read("app/(tabs)/relationship-mode.tsx");
    const coupleInfo = read("app/(tabs)/couple-info.tsx");
    const coupleSelect = read("app/(tabs)/couple-select.tsx");
    const cardSelect = read("app/(tabs)/couple-card-select.tsx");
    expect(checkout).toContain('pathname: "/(tabs)/relationship-mode"');
    expect(mode).toContain('pathname: "/(tabs)/couple-info"');
    expect(mode).toContain('pathname: "/(tabs)/relationship-invite-start"');
    expect(coupleInfo).toContain("AsyncStorage.setItem('@couple_session'");
    expect(coupleSelect).toContain("pathname: '/(tabs)/couple-color-result'");
    expect(cardSelect).toContain("pathname: '/(tabs)/couple-card-result'");
  });

  it("관계 세션은 analysis run 하나와 A/B 슬롯을 고정하고 원문 초대 토큰을 보관하지 않는다", () => {
    const schema = read("drizzle/schema.ts");
    const service = read("server/commerce/relationship-invite-service.ts");
    expect(schema).toContain('mysqlTable(\n  "relationship_sessions"');
    expect(schema).toContain('uniqueIndex("relationship_sessions_analysis_run_unique").on(table.analysisRunId)');
    expect(schema).toContain('uniqueIndex("relationship_participants_session_slot_unique")');
    expect(schema).toContain('table.relationshipSessionId,\n      table.participant');
    expect(schema).toContain('ownerTokenHash: varchar("ownerTokenHash"');
    expect(schema).toContain('inviteTokenHash: varchar("inviteTokenHash"');
    expect(schema).not.toContain('inviteToken: varchar(');
    expect(service).toContain('randomBytes(32).toString("base64url")');
    expect(service).toContain('inviteTokenHash: hashCommerceValue(inviteToken)');
    expect(service).toContain('resultTokenHash: hashCommerceValue(resultToken)');
  });

  it("단계별 초안은 revision 기반으로 저장하고 기존 컬러·카드 해석 화면 순서로 연결한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const colorSelect = read("app/(tabs)/couple-select.tsx");
    const colorResult = read("app/(tabs)/couple-color-result.tsx");
    const cardSelect = read("app/(tabs)/couple-card-select.tsx");
    const cardResult = read("app/(tabs)/couple-card-result.tsx");
    expect(service).toContain('draftRevision: current.draftRevision + 1');
    expect(service).toContain('consentAccepted: current.consentAccepted');
    expect(service).toContain('eq(relationshipParticipants.draftRevision, input.expectedRevision)');
    expect(service).toContain('RELATIONSHIP_DRAFT_REVISION_CONFLICT');
    expect(service).toContain('current.status === "submitted"');
    expect(screen).toContain("이 단계의 답변이 저장되었습니다.");
    expect(screen).toContain('setConsent(value.consentAccepted)');
    expect(screen).toContain('pathname: "/(tabs)/couple-select"');
    expect(screen).toContain('컬러 선택 시작하기 →');
    expect(screen).not.toContain('CARD_DATA.map');
    expect(colorSelect).toContain('pathname: \'/(tabs)/couple-color-result\'');
    expect(colorSelect).toContain('saveRelationshipDraft.mutateAsync');
    expect(colorResult).toContain('pathname: \'/(tabs)/couple-card-select\'');
    expect(colorResult).toContain('generatePersonAnalysis(invitePerson');
    expect(cardSelect).toContain('relationshipToken');
    expect(cardSelect).toContain('saveRelationshipDraft.mutateAsync');
    expect(cardSelect).toContain('카드 해석 보기 →');
    expect(cardResult).toContain('submitRelationshipParticipant.mutateAsync');
    expect(cardResult).toContain('내 검사 최종 제출');
  });

  it("양측 최종 제출을 모두 확인한 한 요청만 리포트 생성을 선점한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    expect(service).toContain('allParticipants.length === 2 && allParticipants.every');
    expect(service).toContain('set({ status: "report_generating", reportErrorCode: null })');
    expect(service).toContain('inArray(relationshipSessions.status, ["collecting", "awaiting_partner"])');
    expect(service).toContain('shouldGenerateReport = Number(claimed[0]?.affectedRows ?? 0) === 1');
    expect(service).toContain('queuePrivateAnalysisPdfDelivery');
    expect(service).toContain('import { buildCouplePdfDownloadPayload } from "../../lib/couple-pdf-download"');
    expect(service).toContain('import { buildParentChildPdfDownloadPayload } from "../../lib/parent-child-pdf-download"');
    expect(service).not.toContain('await import("../../lib/couple-pdf-download")');
    expect(service).toContain('RELATIONSHIP_REPORT_${stage.toUpperCase()}');
    expect(service).toContain('console.error("[relationship-report] generation failed"');
    expect(service).toContain('retryFailedRelationshipReport');
    expect(service).toContain('eq(relationshipSessions.status, "failed")');
  });

  it("기존 토큰을 복원하지 않고 Preview 테스트 실패 세션에만 새 복구 토큰을 발급한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const router = read("server/routers.ts");
    expect(service).toContain('createPreviewFailedRelationshipRecovery');
    expect(service).toContain('process.env.VERCEL_ENV !== "preview"');
    expect(service).toContain('process.env.COMMERCE_TEST_MODE !== "true"');
    expect(service).toContain('timingSafeEqual');
    expect(service).toContain('eq(relationshipSessions.status, "failed")');
    expect(service).toContain('eq(orders.isTest, true)');
    expect(service).toContain('participant.status !== "submitted"');
    expect(service).toContain('ownerTokenHash: hashCommerceValue(ownerAccessToken)');
    expect(service).not.toContain('inviteToken: varchar(');
    expect(router).toContain('previewRecoveryLink: publicProcedure');
  });

  it("리포트 이메일 발송 성공 후에만 세션을 completed로 전이하고 초대 링크 권한은 결과 권한과 분리한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const completion = read("server/commerce/relationship-session-completion.ts");
    const outbox = read("server/commerce/email-outbox-service.ts");
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const result = read("app/(tabs)/couple-result.tsx");
    expect(completion).toContain('status: "completed"');
    expect(completion).toContain('eq(relationshipSessions.status, "email_pending")');
    expect(outbox).toContain('markRelationshipSessionEmailDelivered(outboxId)');
    expect(service).toContain('eq(relationshipSessions.resultTokenHash, hash)');
    expect(service).toContain('status !== "completed" || !session.resultSnapshotEncrypted');
    expect(screen).toContain('이미 완료된 검사입니다. 검사 결과가 정상적으로 생성되었습니다.');
    expect(result).toContain('trpc.relationshipInvites.result.useQuery');
  });

  it("초대받은 상대와 대기 중인 결제자에게 고객용 안내 문구를 표시한다", () => {
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const cardResult = read("app/(tabs)/couple-card-result.tsx");
    expect(screen).toContain("roleParticipationParticle(current.partnerRole)");
    expect(screen).toContain('finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로"');
    expect(screen).toContain("본인의 정보를 선택한 후 검사를 시작해 주세요.");
    expect(screen).toContain("상대방이 검사를 완료하면 두 분의 관계 리포트가 자동으로 생성됩니다.");
    expect(screen).toContain('_vercel_share');
    expect(screen).toContain('검사를 다시 시작할 필요가 없습니다.');
    expect(screen).toContain('저장된 답변으로 리포트 다시 생성');
    expect(cardResult).toContain('const submittedContext = await submitRelationshipParticipant.mutateAsync');
    expect(cardResult).toContain('trpcUtils.relationshipInvites.context.setData');
    expect(screen).not.toContain("가능한 역할만 표시합니다.");
  });

  it("유료 공개 gate와 무료 친구 관계 경로를 변경하지 않는다", () => {
    const start = read("app/(tabs)/couple-start.tsx");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(start).toContain("setRelationType('친구')");
    expect(start).toContain("paidProductPreparing ? '정식 오픈 준비중'");
    expect(checkout).toContain("if (!paidAnalysisPublicEnabled)");
  });
});
