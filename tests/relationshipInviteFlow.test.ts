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
    const router = read("server/routers.ts");
    const relationshipAnalysis = read("constants/coupleData.ts");
    expect(service).toContain('allParticipants.length === 2 && allParticipants.every');
    expect(service).toContain('set({ status: "report_generating", reportErrorCode: null })');
    expect(service).toContain('inArray(relationshipSessions.status, ["collecting", "awaiting_partner"])');
    expect(service).toContain('shouldGenerateReport = Number(claimed[0]?.affectedRows ?? 0) === 1');
    expect(service).toContain('queuePrivateAnalysisPdfDelivery');
    expect(service).toContain('import { buildCouplePdfDownloadPayload } from "../../lib/couple-pdf-download"');
    expect(service).toContain('import { buildParentChildPdfDownloadPayload } from "../../lib/parent-child-pdf-download"');
    expect(service).toContain('import { queuePrivateAnalysisPdfDelivery } from "./pdf-delivery-service"');
    expect(service).not.toContain('await import("../../lib/couple-pdf-download")');
    expect(service).not.toContain('await import("./pdf-delivery-service")');
    expect(service).toContain('RELATIONSHIP_REPORT_${stage.toUpperCase()}');
    expect(service).toContain('console.error("[relationship-report] generation failed"');
    expect(service).toContain('retryFailedRelationshipReport');
    expect(service).toContain('deliverPreviewRelationshipReport');
    expect(service).toContain('TEST_RELATIONSHIP_DELIVERY_DISABLED');
    expect(service).toContain('eq(orders.isTest, true)');
    expect(service).toContain('eq(relationshipSessions.ownerTokenHash, ownerTokenHash)');
    expect(service).toContain('eq(emailOutbox.status, "queued")');
    expect(router).toContain('deliverPreviewReport: publicProcedure');
    expect(service).toContain('eq(relationshipSessions.status, "failed")');
    expect(relationshipAnalysis).toContain('(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ === true');
    expect(relationshipAnalysis).not.toContain('if (__DEV__)');
  });

  it("관리자는 Toss 테스트 주문의 실패한 리포트만 원문 답변 재제출 없이 복구할 수 있다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const router = read("server/routers.ts");
    expect(service).toContain("getAdminTestRelationshipReportRecoverySnapshot");
    expect(service).toContain("retryAdminTestRelationshipReport");
    expect(service).toContain('eq(orders.isTest, true)');
    expect(service).toContain('session.status !== "failed"');
    expect(service).toContain('reusedSubmittedAnswers: true');
    expect(service).toContain('test_relationship_report_recovery_requested');
    expect(service).toContain('await deliverPrivatePdfOutboxItem(report.outboxId)');
    expect(router).toContain("testRelationshipReportRecovery: adminProcedure");
    expect(router).toContain("retryTestRelationshipReport: adminProcedure");
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
    expect(service).toContain('status !== "completed" && status !== "email_pending"');
    expect(screen).toContain('두 분의 관계 통합해석과 PDF 리포트가 준비되었습니다.');
    expect(result).toContain('trpc.relationshipInvites.result.useQuery');
  });

  it("새 초대 완료 결과는 화면과 같은 카드 위치별 대비·3번 카드 회복 루틴을 스냅샷과 PDF payload에 보존한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");

    expect(service).toContain("buildRomanticCardFlowContrast");
    expect(service).toContain("buildRomanticCardRecoveryRoutine");
    expect(service).toContain("romanticCardFlowContrast,");
    expect(service).toContain("romanticCardRecoveryRoutine,");
    expect(service).toContain("attractionAnalysis: snapshot.romanticCardFlowContrast");
    expect(service).toContain("snapshot.romanticCardRecoveryRoutine ?? archetypeResult.togetherRoutine");
  });

  it("이메일 outbox 대기 중에도 생성된 통합해석과 PDF는 A/B가 확인하고, 제출 직후 발송을 시도한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const deliveryService = service.slice(
      service.indexOf("export async function deliverPreviewRelationshipReport"),
      service.indexOf("async function claimRelationshipReportGeneration"),
    );
    const router = read("server/routers.ts");
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const result = read("app/(tabs)/couple-result.tsx");
    expect(service).toContain('status !== "completed" && status !== "email_pending"');
    expect(router).toContain('const report = await generateAndQueueRelationshipReport');
    expect(router).toContain('await deliverPrivatePdfOutboxItem(report.outboxId)');
    expect(screen).toContain('current.status === "completed" || current.status === "email_pending"');
    expect(screen).toContain('이메일은 자동 발송 처리 중입니다. 기다리지 않고 지금 결과와 PDF를 확인할 수 있습니다.');
    expect(screen).toContain('trpc.relationshipInvites.deliverPreviewReport.useMutation');
    expect(screen).toContain('previewDeliveryTriggeredFor');
    expect(result).toContain('const deliverPreviewReport = trpc.relationshipInvites.deliverPreviewReport.useMutation');
    expect(result).toContain("relationshipResultQuery.data?.status !== 'email_pending'");
    expect(result).toContain('previewDeliveryTriggeredFor.current === requestedRelationshipToken');
    expect(deliveryService).not.toContain('process.env.VERCEL_ENV !== "preview"');
  });

  it("Preview 관리자만 제출 완료 세션의 A/B 접근 링크를 재발급하고, 답변·결과·outbox는 보존한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const router = read("server/routers.ts");
    const admin = read("app/(tabs)/admin.tsx");
    expect(service).toContain('reissuePreviewRelationshipResultAccess');
    expect(service).toContain('PREVIEW_RELATIONSHIP_RESULT_REISSUE_NOT_ALLOWED');
    expect(service).toContain('linksReissued: true');
    expect(service).toContain('inArray(relationshipSessions.status, ["email_pending", "completed"])');
    expect(router).toContain('reissuePreviewRelationshipResults: adminProcedure');
    expect(admin).toContain('제출 완료 관계검사 결과 링크 복구');
    expect(admin).toContain('기존 A/B 링크는 무효화됩니다.');
  });

  it("A의 기존 세션 링크와 B의 기존 초대 링크 모두 완료된 통합해석과 PDF 화면으로 연결한다", () => {
    const service = read("server/commerce/relationship-invite-service.ts");
    const router = read("server/routers.ts");
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const result = read("app/(tabs)/couple-result.tsx");
    expect(service).toContain('(await loadSessionByAccessToken(input.accessToken)).session');
    expect(service).toContain('status !== "completed" && status !== "email_pending"');
    expect(router).toContain('accessToken: z.string().min(32).max(256).optional()');
    expect(screen).toContain('두 분의 관계 통합해석과 PDF 리포트가 준비되었습니다.');
    expect(screen).toContain('통합해석·PDF 리포트 보기');
    expect(screen).toContain('params: { relationshipToken: token, resultToken: resultToken ?? "" }');
    expect(result).toContain('requestedRelationshipToken');
    expect(result).toContain('{ accessToken: requestedRelationshipToken }');
    expect(result).toContain('PDF 리포트 다운로드');
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

  it("A·B 모두 기본 정보를 명시적으로 저장한 뒤에만 컬러 검사로 진행하고, 제출 후에는 편집 화면으로 돌아가지 않는다", () => {
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const ownerStart = read("app/(tabs)/relationship-invite-start.tsx");
    expect(screen).toContain("정보를 선택한 뒤 ‘기본 정보 저장’을 눌러 주세요. 저장된 정보가 관계 분석과 리포트에 반영됩니다.");
    expect(screen).toContain("기본 정보가 저장되었습니다. 컬러 검사를 시작해 주세요.");
    expect(screen).toContain("정보를 변경하면 ‘기본 정보 저장’을 다시 눌러 주세요.");
    expect(screen).toContain("컬러 검사를 시작하기 전에 기본 정보를 저장해 주세요.");
    expect(screen).toContain("const saveBasicInfo = async () =>");
    expect(screen).toContain("basicInfoSaveKey(draft.info, consent) !== savedInfoKey");
    expect(screen).toContain('if (current.status === "completed" || current.status === "email_pending")');
    expect(screen).toContain('if (current.participantStatus === "submitted"');
    expect(ownerStart).toContain('pathname: "/(tabs)/relationship-invite"');
    expect(ownerStart).toContain('initialGender: gender');
  });

  it("최종 제출 뒤 실패 화면에는 이전 기본 정보 저장 안내를 다시 표시하지 않는다", () => {
    const screen = read("app/(tabs)/relationship-invite.tsx");
    const submittedBranch = screen.slice(
      screen.indexOf('if (current.participantStatus === "submitted")'),
      screen.indexOf("if (!current.canEdit)"),
    );
    expect(submittedBranch).toContain("저장된 답변으로 리포트 다시 생성");
    expect(submittedBranch).not.toContain("{message ? <Text style={styles.message}>{message}</Text> : null}");
  });

  it("유료 공개 gate와 무료 친구 관계 경로를 변경하지 않는다", () => {
    const start = read("app/(tabs)/couple-start.tsx");
    const checkout = read("app/(tabs)/commerce-checkout.tsx");
    expect(start).toContain("setRelationType('친구')");
    expect(start).toContain("paidProductPreparing ? '정식 오픈 준비중'");
    expect(checkout).toContain("if (!paidAnalysisPublicEnabled)");
  });
});
