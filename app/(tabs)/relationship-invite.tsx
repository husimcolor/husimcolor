import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getRelationshipRoleOptions, type FaithType, type GenderType, type RelationshipRole } from "@/constants/coupleData";
import { trpc } from "@/lib/trpc";

type DraftInfo = { gender?: GenderType; faith?: FaithType; relationshipRole?: RelationshipRole };
type Draft = { info?: DraftInfo; colors?: string[]; cards?: string[] };
function hasCompleteInfo(value: DraftInfo | undefined): value is { gender: GenderType; faith: FaithType; relationshipRole: RelationshipRole } {
  return Boolean(value?.gender && value?.faith && value?.relationshipRole);
}
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function roleParticipationParticle(role: RelationshipRole) {
  const finalCode = role.charCodeAt(role.length - 1);
  const finalConsonant = finalCode >= 0xAC00 && finalCode <= 0xD7A3 ? (finalCode - 0xAC00) % 28 : 0;
  return finalConsonant === 0 || finalConsonant === 8 ? "로" : "으로";
}
export default function RelationshipInviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[]; inviteToken?: string | string[]; resultToken?: string | string[]; initialGender?: string | string[]; initialRole?: string | string[]; initialFaith?: string | string[]; consent?: string | string[] }>();
  const token = one(params.token) ?? "";
  const inviteToken = one(params.inviteToken);
  const resultToken = one(params.resultToken);
  const initialGender = one(params.initialGender) as GenderType | undefined;
  const initialRole = one(params.initialRole) as RelationshipRole | undefined;
  const initialFaith = one(params.initialFaith) as FaithType | undefined;
  const initialConsent = one(params.consent) === "1";
  const [draft, setDraft] = useState<Draft>({});
  const [revision, setRevision] = useState(0);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const initialSaved = useRef(false);
  const context = trpc.relationshipInvites.context.useQuery({ accessToken: token }, {
    enabled: token.length >= 32,
    retry: false,
    // 입력 중인 초안을 주기적 조회로 덮어쓰지 않고, 최종 제출 뒤 대기 화면에서만 상대 완료 상태를 갱신한다.
    refetchInterval: (query) => query.state.data?.participantStatus === "submitted" ? 5_000 : false,
  });
  const saveDraft = trpc.relationshipInvites.saveDraft.useMutation();
  const retryReport = trpc.relationshipInvites.retryReport.useMutation();

  const applyContext = (value: { draft: Draft | null; draftRevision: number; consentAccepted?: boolean } | undefined) => {
    if (!value) return;
    setDraft(value.draft ?? {});
    setRevision(value.draftRevision);
    if (typeof value.consentAccepted === "boolean") setConsent(value.consentAccepted);
  };
  useEffect(() => { applyContext(context.data); }, [context.data?.draftRevision]);
  useEffect(() => {
    if (!context.data || initialSaved.current || !initialGender || !initialRole || !initialFaith) return;
    initialSaved.current = true;
    void persist({ info: { gender: initialGender, relationshipRole: initialRole, faith: initialFaith } }, initialConsent);
  }, [context.data, initialGender, initialRole, initialFaith]);

  const persist = async (next: Draft, consentAccepted = consent) => {
    try {
      const { info, ...partialDraft } = next;
      const draftForSave = hasCompleteInfo(info) ? { ...partialDraft, info } : partialDraft;
      const saved = await saveDraft.mutateAsync({ accessToken: token, expectedRevision: revision, draft: draftForSave, consentAccepted });
      setDraft(saved.draft ?? next);
      setRevision(saved.draftRevision);
      setConsent(consentAccepted);
      setMessage("이 단계의 답변이 저장되었습니다.");
      return saved;
    } catch (error) {
      const conflict = error instanceof Error && error.message.includes("REVISION_CONFLICT");
      setMessage(conflict ? "다른 창에서 변경된 내용이 있어 최신 답변을 다시 불러왔습니다." : "저장하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.");
      await context.refetch();
      return null;
    }
  };

  const selectInfo = async (field: "gender" | "faith" | "relationshipRole", value: GenderType | FaithType | RelationshipRole) => {
    const info: DraftInfo = { ...draft.info, gender: draft.info?.gender ?? initialGender, faith: draft.info?.faith ?? initialFaith, [field]: value };
    if (field === "gender" && info.relationshipRole && !getRelationshipRoleOptions(context.data?.relationType ?? "연인", value as GenderType, context.data?.partnerRole).includes(info.relationshipRole)) {
      delete info.relationshipRole;
    }
    setDraft((current) => ({ ...current, info }));
    if (hasCompleteInfo(info) && consent) await persist({ ...draft, info });
  };

  const startExistingColorFlow = async () => {
    if (!hasCompleteInfo(draft.info) || !consent) {
      setMessage("성별·관계 역할과 참여 동의를 먼저 확인해 주세요.");
      return;
    }
    const saved = await persist(draft, true);
    if (!saved) return;
    router.push({
      pathname: "/(tabs)/couple-select",
      params: {
        person: current.participant,
        relationshipToken: token,
        inviteToken: inviteToken ?? "",
        resultToken: resultToken ?? "",
      },
    } as any);
  };

  const shareInvite = async () => {
    if (!inviteToken) return;
    const link = Platform.OS === "web" && typeof window !== "undefined"
      ? (() => {
          // Shareable Link으로 연 Preview에서도 Vercel Authentication을 다시 요구하지 않도록
          // 현재 URL의 단기 보호 우회 식별자만 초대 링크에 이어 붙인다. 비밀은 저장하지 않는다.
          const currentSearch = new URLSearchParams(window.location.search);
          const nextSearch = new URLSearchParams({ token: inviteToken });
          for (const key of ["_vercel_share", "x-vercel-protection-bypass"]) {
            const value = currentSearch.get(key);
            if (value) nextSearch.set(key, value);
          }
          return `${window.location.origin}/relationship-invite?${nextSearch.toString()}`;
        })()
      : inviteToken;
    try {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "휴심컬러 관계 검사 초대", text: "내 관계 검사에 참여해 주세요.", url: link });
      } else if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
        setMessage("상대방 초대 링크를 복사했습니다.");
      } else {
        const { Share } = await import("react-native");
        await Share.share({ message: link });
      }
    } catch {
      setMessage("초대 링크 공유를 취소했거나 복사하지 못했습니다.");
    }
  };

  const retryFailedReport = async () => {
    try {
      await retryReport.mutateAsync({ accessToken: token });
      setMessage("저장된 답변으로 리포트 생성을 다시 확인하고 있습니다.");
      await context.refetch();
    } catch {
      setMessage("리포트 생성을 다시 시작하지 못했습니다. 답변은 보존되어 있습니다.");
    }
  };

  if (!token || context.isLoading) return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#527B52" /><Text style={styles.loading}>검사 세션을 확인하고 있습니다.</Text></View></ScreenContainer>;
  if (!context.data) return <ScreenContainer><View style={styles.center}><Text style={styles.loading}>유효하지 않거나 만료된 검사 링크입니다.</Text></View></ScreenContainer>;
  const current = context.data;
  const isOwner = current.participant === "A";
  const roleOptions = getRelationshipRoleOptions(current.relationType, draft.info?.gender, current.partnerRole);
  if (current.status === "completed") {
    return <ScreenContainer><View style={styles.center}><Text style={styles.completeTitle}>검사 완료</Text><Text style={styles.completeText}>이미 완료된 검사입니다. 검사 결과가 정상적으로 생성되었습니다.</Text>{isOwner && resultToken ? <Pressable style={styles.button} onPress={() => router.replace({ pathname: "/(tabs)/couple-result", params: { resultToken } } as any)}><Text style={styles.buttonText}>결과 보기</Text></Pressable> : null}</View></ScreenContainer>;
  }
  if (current.participantStatus === "submitted" && (current.status === "collecting" || current.status === "awaiting_partner")) {
    return (
      <ScreenContainer><View style={styles.center}>
        <Text style={styles.completeTitle}>내 검사 제출 완료</Text>
        <Text style={styles.completeText}>상대방 검사 대기 중입니다. 두 사람이 모두 최종 제출한 뒤에만 관계 리포트를 생성합니다.</Text>
        <Text style={styles.waitingGuide}>상대방이 검사를 완료하면 두 분의 관계 리포트가 자동으로 생성됩니다.</Text>
        {isOwner && inviteToken ? <Pressable style={styles.inviteButtonWide} onPress={() => void shareInvite()}><Text style={styles.inviteButtonText}>상대방에게 검사 링크 보내기</Text></Pressable> : null}
        <Pressable style={styles.refreshButton} onPress={() => void context.refetch()}><Text style={styles.refreshText}>상태 새로고침</Text></Pressable>
      </View></ScreenContainer>
    );
  }
  if (current.participantStatus === "submitted") {
    const progressText = current.status === "report_generating"
      ? "두 사람의 답변을 확인했습니다. 관계 리포트를 생성하고 있습니다."
      : current.status === "email_pending"
        ? "리포트를 준비했습니다. 이메일 발송 처리를 기다리고 있습니다."
        : "리포트 생성 중 문제가 발생했습니다. 두 사람의 답변은 안전하게 제출되어 있으며, 검사를 다시 시작할 필요가 없습니다.";
    return (
      <ScreenContainer><View style={styles.center}>
        {current.status !== "failed" ? <ActivityIndicator color="#527B52" /> : null}
        <Text style={styles.completeTitle}>검사 제출 완료</Text>
        <Text style={styles.completeText}>{progressText}</Text>
        {current.status === "failed" ? <Pressable disabled={retryReport.isPending} style={[styles.refreshButton, retryReport.isPending && styles.disabled]} onPress={() => void retryFailedReport()}><Text style={styles.refreshText}>{retryReport.isPending ? "리포트 재시도 중" : "저장된 답변으로 리포트 다시 생성"}</Text></Pressable> : null}
        <Pressable style={styles.refreshButton} onPress={() => void context.refetch()}><Text style={styles.refreshText}>상태 새로고침</Text></Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View></ScreenContainer>
    );
  }
  if (!current.canEdit) {
    const progressText = current.status === "report_generating" ? "두 사람의 답변을 확인했습니다. 관계 리포트를 생성하고 있습니다." : current.status === "email_pending" ? "리포트를 준비했고 이메일 발송을 처리하고 있습니다." : "리포트 생성 처리 중 문제가 발생했습니다. 답변은 안전하게 제출되어 있습니다.";
    return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#527B52" /><Text style={styles.completeTitle}>검사 제출 완료</Text><Text style={styles.completeText}>{progressText}</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>{isOwner ? "내 검사" : "초대받은 검사"}</Text>
        <Text style={styles.title}>{isOwner ? "내 마음 흐름을 선택해 주세요" : "관계 검사에 참여해 주세요"}</Text>
        <Text style={styles.subtitle}>{isOwner ? "검사를 마치면 상대방에게 보낼 고유 링크가 준비됩니다." : "선택 내용은 이 초대 링크의 관계 세션에만 안전하게 연결됩니다."}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 기본 정보 및 참여 동의</Text>
          <Text style={styles.label}>성별</Text><View style={styles.chips}>{(["남성", "여성"] as GenderType[]).map((value) => <Pressable key={value} style={[styles.chip, draft.info?.gender === value && styles.chipOn]} onPress={() => void selectInfo("gender", value)}><Text style={[styles.chipText, draft.info?.gender === value && styles.chipTextOn]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, styles.labelGap]}>관계 역할</Text><Text style={styles.roleHelp}>{current.partnerRole ? `상대방이 ‘${current.partnerRole}’${roleParticipationParticle(current.partnerRole)} 참여하고 있습니다. 본인의 정보를 선택한 후 검사를 시작해 주세요.` : "결제 또는 검사 순서와 관계없이 실제 역할을 선택해 주세요."}</Text><View style={styles.chips}>{roleOptions.map((value) => <Pressable key={value} style={[styles.chip, draft.info?.relationshipRole === value && styles.chipOn]} onPress={() => void selectInfo("relationshipRole", value)}><Text style={[styles.chipText, draft.info?.relationshipRole === value && styles.chipTextOn]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, styles.labelGap]}>종교</Text><View style={styles.chips}>{(["기독교", "무교", "기타"] as FaithType[]).map((value) => <Pressable key={value} style={[styles.chip, draft.info?.faith === value && styles.chipOn]} onPress={() => void selectInfo("faith", value)}><Text style={[styles.chipText, draft.info?.faith === value && styles.chipTextOn]}>{value}</Text></Pressable>)}</View>
          <Pressable style={[styles.consent, consent && styles.consentOn]} onPress={() => { const next = !consent; setConsent(next); if (next && hasCompleteInfo(draft.info)) void persist(draft, true); }}><Text style={styles.check}>{consent ? "✓" : ""}</Text><Text style={styles.consentText}>관계 검사 결과 생성을 위해 선택 정보와 검사 답변을 안전하게 처리하는 데 동의합니다.</Text></Pressable>
          {hasCompleteInfo(draft.info) && consent ? <Pressable style={styles.saveStage} onPress={() => void persist(draft, true)}><Text style={styles.saveStageText}>기본 정보 저장</Text></Pressable> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>다음 단계 · 기존 컬러 검사 시작</Text>
          <Text style={styles.sectionSub}>기존 관계 검사의 순서를 그대로 사용합니다. 컬러 3가지를 선택한 뒤 컬러 해석을 확인하고, 카드 뒷면에서 심리카드 3장을 선택합니다.</Text>
          <Pressable
            disabled={!hasCompleteInfo(draft.info) || !consent || saveDraft.isPending}
            style={[styles.button, (!hasCompleteInfo(draft.info) || !consent || saveDraft.isPending) && styles.disabled]}
            onPress={() => void startExistingColorFlow()}
          >
            {saveDraft.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>컬러 선택 시작하기 →</Text>}
          </Pressable>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 20, backgroundColor: "#F8F3EA" }, center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, padding: 24 }, loading: { color: "#5F4B3B", textAlign: "center", fontSize: 15, lineHeight: 23 }, completeTitle: { color: "#2D2420", fontSize: 22, fontWeight: "800", textAlign: "center" }, completeText: { color: "#5F4B3B", fontSize: 15, lineHeight: 24, textAlign: "center", maxWidth: 330 }, waitingGuide: { color: "#4E6C4A", fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 330, fontWeight: "700", marginTop: -4 },
  eyebrow: { color: "#63815F", fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginTop: 8 }, title: { color: "#2D2420", fontSize: 24, lineHeight: 33, fontWeight: "800", marginTop: 8 }, subtitle: { color: "#68594C", fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  section: { backgroundColor: "#FFFDF9", borderColor: "#DCCDBB", borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 }, sectionTitle: { color: "#3A3029", fontSize: 16, lineHeight: 24, fontWeight: "800" }, sectionSub: { color: "#75675B", fontSize: 12, lineHeight: 19, marginTop: 5, marginBottom: 12 }, label: { color: "#44382F", fontSize: 14, fontWeight: "800", marginTop: 14, marginBottom: 8 }, labelGap: { marginTop: 17 }, roleHelp: { color: "#75675B", fontSize: 12, lineHeight: 18, marginTop: -3, marginBottom: 9 }, chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, chip: { borderWidth: 1, borderColor: "#CDBEAE", backgroundColor: "#F7F0E6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }, chipOn: { borderColor: "#527B52", backgroundColor: "#527B52" }, chipText: { color: "#4E4035", fontSize: 13, fontWeight: "700" }, chipTextOn: { color: "#FFFFFF" },
  consent: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 16, borderWidth: 1, borderColor: "#D7CABB", borderRadius: 12, padding: 12, backgroundColor: "#FFFDF9" }, consentOn: { borderColor: "#7CA377", backgroundColor: "#F1F8EF" }, check: { width: 18, height: 18, borderWidth: 1, borderColor: "#7CA377", borderRadius: 9, textAlign: "center", lineHeight: 16, color: "#356B53", fontWeight: "900" }, consentText: { flex: 1, color: "#5F4B3B", fontSize: 12.5, lineHeight: 20 },
  saveStage: { alignItems: "center", paddingVertical: 12, marginTop: 14, borderRadius: 12, backgroundColor: "#E8F1E6", borderWidth: 1, borderColor: "#92B48F" }, saveStageText: { color: "#3E653E", fontSize: 14, fontWeight: "800" }, disabled: { opacity: 0.48 },
  button: { alignItems: "center", borderRadius: 15, paddingVertical: 16, backgroundColor: "#527B52", marginTop: 16 }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, message: { color: "#4E6C4A", fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 10 }, inviteBox: { backgroundColor: "#EEF7EB", borderWidth: 1, borderColor: "#9FBE99", borderRadius: 16, padding: 16, marginTop: 2, marginBottom: 12 }, inviteTitle: { color: "#345C35", fontSize: 16, fontWeight: "800" }, inviteBody: { color: "#4F694D", fontSize: 13, lineHeight: 20, marginTop: 7 }, inviteButton: { backgroundColor: "#4E784E", alignItems: "center", borderRadius: 12, paddingVertical: 13, marginTop: 14 }, inviteButtonWide: { backgroundColor: "#4E784E", alignSelf: "stretch", alignItems: "center", borderRadius: 12, paddingVertical: 14, marginTop: 4 }, inviteButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, refreshButton: { borderWidth: 1, borderColor: "#B7A790", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 }, refreshText: { color: "#68594C", fontSize: 14, fontWeight: "800" }, wait: { color: "#765D45", backgroundColor: "#F1E7DA", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 21, textAlign: "center", marginBottom: 24 },
});
