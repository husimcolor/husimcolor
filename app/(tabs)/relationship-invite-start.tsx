import React, { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getRelationshipRoleOptions, type FaithType, type GenderType, type RelationType, type RelationshipRole } from "@/constants/coupleData";
import { getCommerceStartGrant, markCommerceAnalysisStarted, removeCommerceStartGrant } from "@/lib/commerce-access";
import { trpc } from "@/lib/trpc";
import type { CommerceProductCode } from "@/shared/commerce";

const genders: GenderType[] = ["남성", "여성"];
const faiths: FaithType[] = ["기독교", "무교", "기타"];
function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default function RelationshipInviteStartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string | string[]; relationType?: string | string[] }>();
  const productCode = one(params.product) as CommerceProductCode | undefined;
  const relationType = one(params.relationType) as RelationType | undefined;
  const relationshipProductCode = productCode === "couple_love_deep" || productCode === "parent_child_deep"
    ? productCode
    : undefined;
  const [gender, setGender] = useState<GenderType | null>(null);
  const [relationshipRole, setRelationshipRole] = useState<RelationshipRole | null>(null);
  const [faith, setFaith] = useState<FaithType | null>(null);
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const consume = trpc.commerce.entitlement.consumeForAnalysisStart.useMutation();
  const validProduct = Boolean(relationshipProductCode);
  const roleOptions = relationType ? getRelationshipRoleOptions(relationType, gender ?? undefined) : [];
  const canContinue = Boolean(validProduct && relationType && gender && relationshipRole && faith && consent && !consume.isPending);

  const start = async () => {
    if (!canContinue || !relationshipProductCode || !relationType || !gender || !faith) return;
    setMessage(null);
    try {
      const grant = await getCommerceStartGrant(relationshipProductCode);
      if (!grant) {
        router.replace({ pathname: "/(tabs)/commerce-checkout", params: { product: relationshipProductCode, relationType } } as any);
        return;
      }
      const consumed = await consume.mutateAsync({
        accessToken: grant.accessToken,
        productCode: relationshipProductCode,
        relationshipMode: "invite_link",
        relationType,
      });
      if (!consumed.relationshipInvite) throw new Error("RELATIONSHIP_INVITE_NOT_ISSUED");
      await removeCommerceStartGrant(relationshipProductCode);
      await markCommerceAnalysisStarted(relationshipProductCode);
      router.replace({
        pathname: "/(tabs)/relationship-invite",
        params: {
          token: consumed.relationshipInvite.ownerAccessToken,
          inviteToken: consumed.relationshipInvite.inviteToken,
          resultToken: consumed.relationshipInvite.resultToken,
          initialGender: gender,
          initialRole: relationshipRole,
          initialFaith: faith,
          consent: "1",
        },
      } as any);
    } catch {
      setMessage("구매권한 또는 관계 세션을 준비하지 못했습니다. 결제를 다시 진행하지 말고 잠시 후 다시 시도해 주세요.");
    }
  };

  if (!validProduct || !relationType) {
    return <ScreenContainer><View style={styles.center}><Text style={styles.message}>관계 검사 정보를 찾을 수 없습니다.</Text></View></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>각자 휴대폰에서 검사하기</Text>
        <Text style={styles.title}>먼저 본인 검사를 시작해 주세요</Text>
        <Text style={styles.subtitle}>기본 정보와 참여 동의를 확인한 뒤, 상대방에게 보낼 고유 초대 링크를 준비합니다.</Text>

        <View style={styles.section}>
          <Text style={styles.label}>성별</Text>
          <View style={styles.row}>{genders.map((value) => <Pressable key={value} style={[styles.chip, gender === value && styles.chipSelected]} onPress={() => { setGender(value); if (relationshipRole && !getRelationshipRoleOptions(relationType, value).includes(relationshipRole)) setRelationshipRole(null); }}><Text style={[styles.chipText, gender === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, styles.spaced]}>관계 역할</Text>
          <Text style={styles.help}>결제 순서와 관계없이 실제 역할을 선택해 주세요.</Text>
          <View style={styles.row}>{roleOptions.map((value) => <Pressable key={value} style={[styles.chip, relationshipRole === value && styles.chipSelected]} onPress={() => setRelationshipRole(value)}><Text style={[styles.chipText, relationshipRole === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View>
          <Text style={[styles.label, styles.spaced]}>종교</Text>
          <View style={styles.row}>{faiths.map((value) => <Pressable key={value} style={[styles.chip, faith === value && styles.chipSelected]} onPress={() => setFaith(value)}><Text style={[styles.chipText, faith === value && styles.chipTextSelected]}>{value}</Text></Pressable>)}</View>
        </View>

        <Pressable style={[styles.consent, consent && styles.consentSelected]} onPress={() => setConsent((value) => !value)}>
          <Text style={styles.check}>{consent ? "✓" : ""}</Text>
          <Text style={styles.consentText}>관계 검사 결과 생성을 위해 선택한 정보와 검사 답변을 안전하게 처리하는 데 동의합니다. 상대방의 답변은 별도 링크에서 본인이 직접 입력합니다.</Text>
        </Pressable>

        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable disabled={!canContinue} style={[styles.button, !canContinue && styles.buttonDisabled]} onPress={start}>
          {consume.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>내 검사 시작하기 →</Text>}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, backgroundColor: "#F8F3EA" }, center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  message: { color: "#5F4B3B", fontSize: 16, textAlign: "center" }, eyebrow: { color: "#6E8A67", fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginTop: 16 },
  title: { color: "#2D2420", fontSize: 24, lineHeight: 33, fontWeight: "800", marginTop: 9 }, subtitle: { color: "#68594C", fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 22 },
  section: { backgroundColor: "#FFFDF9", borderRadius: 16, borderWidth: 1, borderColor: "#DCCDBB", padding: 18 }, label: { color: "#44382F", fontSize: 15, fontWeight: "800", marginBottom: 10 }, help: { color: "#75675B", fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 10 }, spaced: { marginTop: 22 }, row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderWidth: 1, borderColor: "#CDBEAE", backgroundColor: "#F7F0E6", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9 }, chipSelected: { backgroundColor: "#527B52", borderColor: "#527B52" }, chipText: { color: "#4E4035", fontSize: 14, fontWeight: "700" }, chipTextSelected: { color: "#FFFFFF" },
  consent: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 18, borderWidth: 1, borderColor: "#D7CABB", borderRadius: 14, padding: 14, backgroundColor: "#FFFDF9" }, consentSelected: { borderColor: "#7CA377", backgroundColor: "#F1F8EF" }, check: { width: 20, height: 20, textAlign: "center", lineHeight: 18, borderWidth: 1, borderColor: "#7CA377", borderRadius: 10, color: "#356B53", fontWeight: "900" }, consentText: { flex: 1, color: "#5F4B3B", fontSize: 13, lineHeight: 21 },
  button: { marginTop: 22, alignItems: "center", borderRadius: 16, paddingVertical: 17, backgroundColor: "#527B52" }, buttonDisabled: { backgroundColor: "#C9C1B8" }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, error: { color: "#A4453C", textAlign: "center", fontSize: 13, lineHeight: 20, marginTop: 14 },
});
