import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import {
  getComplementaryRelationshipRole,
  isRelationshipRolePairValid,
  type RelationType,
  type RelationshipRole,
} from "@/constants/coupleData";
import { getCommerceStartGrant, saveRelationshipSetupConfig } from "@/lib/commerce-access";
import { trpc } from "@/lib/trpc";

type RomanticRelationType = Extract<RelationType, "연인" | "부부">;
type RomanticRole = Extract<RelationshipRole, "남편" | "아내" | "남자친구" | "여자친구">;
const RELATION_OPTIONS: Array<{ value: RomanticRelationType; label: string; roles: readonly [RomanticRole, RomanticRole] }> = [
  { value: "부부", label: "부부", roles: ["남편", "아내"] },
  { value: "연인", label: "연인", roles: ["남자친구", "여자친구"] },
];

function one(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }

export default function RelationshipSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string | string[] }>();
  const productCode = one(params.product);
  const validProduct = productCode === "couple_love_deep";
  const [relationType, setRelationType] = useState<RomanticRelationType | null>(null);
  const [roleA, setRoleA] = useState<RomanticRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const setupQuery = trpc.commerce.entitlement.relationshipSetup.useQuery(
    { accessToken: accessToken ?? "" },
    { enabled: Boolean(accessToken), retry: false },
  );
  const confirmSetup = trpc.commerce.entitlement.configureRelationshipSetup.useMutation();

  useEffect(() => {
    if (!validProduct) return;
    void getCommerceStartGrant("couple_love_deep")
      .then((grant) => {
        if (!grant) setMessage("결제 권한을 찾을 수 없습니다. 결제를 다시 진행하지 말고 구매한 기기에서 다시 열어 주세요.");
        else setAccessToken(grant.accessToken);
      })
      .catch(() => setMessage("결제 권한을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."))
      .finally(() => setLoading(false));
  }, [validProduct]);
  useEffect(() => {
    if (!setupQuery.data) return;
    setRelationType(setupQuery.data.relationType);
    setRoleA(setupQuery.data.roleA as RomanticRole);
    setMessage(null);
  }, [setupQuery.data?.entitlementId]);

  const selectRelation = (next: RomanticRelationType) => {
    const pair = RELATION_OPTIONS.find((item) => item.value === next)?.roles;
    setRelationType(next);
    // 임의 역할이 아니라 사용자가 첫 참여자의 실제 역할을 명시하도록 초기화한다.
    setRoleA((current) => current && pair?.includes(current) ? current : null);
  };
  const roleB = roleA ? getComplementaryRelationshipRole(roleA) as RomanticRole : null;
  const canContinue = Boolean(relationType && roleA && roleB && isRelationshipRolePairValid(relationType, roleA, roleB));

  const continueToMode = async () => {
    if (!relationType || !roleA || !roleB || !canContinue || !accessToken) return;
    try {
      const saved = await confirmSetup.mutateAsync({ accessToken, relationType, roleA, roleB });
      // 기기 저장은 재진입 UI cache일 뿐이며 권위 있는 값은 방금 서버가 저장·반환한 setup이다.
      await saveRelationshipSetupConfig({ productCode: "couple_love_deep", relationType: saved.relationType, roleA: saved.roleA, roleB: saved.roleB });
      router.replace({ pathname: "/(tabs)/relationship-mode", params: { product: "couple_love_deep", relationType: saved.relationType, roleA: saved.roleA, roleB: saved.roleB } } as any);
    } catch (error) {
      setMessage(error instanceof Error && error.message.includes("ALREADY_CONFIRMED")
        ? "이미 확정된 관계·역할 설정과 다릅니다. 처음 설정한 기준으로 다시 진행해 주세요."
        : "관계 설정을 저장하지 못했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.");
    }
  };

  if (!validProduct) return <ScreenContainer><View style={styles.center}><Text style={styles.message}>부부·연인 관계 상품 정보를 찾을 수 없습니다.</Text></View></ScreenContainer>;
  if (loading) return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#527B52" /><Text style={styles.message}>결제 권한과 관계 설정을 확인하고 있습니다.</Text></View></ScreenContainer>;
  if (message && !relationType) return <ScreenContainer><View style={styles.center}><Text style={styles.message}>{message}</Text><Pressable style={styles.outline} onPress={() => router.replace("/(tabs)/couple-start" as any)}><Text style={styles.outlineText}>관계 상품 선택으로 돌아가기</Text></Pressable></View></ScreenContainer>;

  const availableRoles = relationType ? RELATION_OPTIONS.find((item) => item.value === relationType)?.roles ?? [] : [];
  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>결제 후 설정 · 1회</Text>
        <Text style={styles.title}>두 분의 관계와 역할을 확인해 주세요</Text>
        <Text style={styles.subtitle}>이 설정은 초대 링크, 양쪽 결과, 통합 해석, PDF 리포트에 같은 기준으로 반영됩니다. 컬러 선택 전에는 반드시 완료해야 합니다.</Text>
        <View style={styles.section}>
          <Text style={styles.label}>관계</Text>
          <View style={styles.row}>{RELATION_OPTIONS.map((item) => <Pressable key={item.value} disabled={Boolean(setupQuery.data)} style={[styles.chip, relationType === item.value && styles.chipOn, setupQuery.data && styles.locked]} onPress={() => selectRelation(item.value)}><Text style={[styles.chipText, relationType === item.value && styles.chipTextOn]}>{item.label}</Text></Pressable>)}</View>
          <Text style={[styles.label, styles.spaced]}>첫 번째 참여자의 실제 역할</Text>
          <Text style={styles.help}>누가 먼저 컬러를 선택할지에 맞춰 실제 역할을 골라 주세요. 상대 역할은 짝으로 자동 확정됩니다.</Text>
          <View style={styles.row}>{availableRoles.map((role) => <Pressable key={role} disabled={Boolean(setupQuery.data)} style={[styles.chip, roleA === role && styles.chipOn, setupQuery.data && styles.locked]} onPress={() => setRoleA(role)}><Text style={[styles.chipText, roleA === role && styles.chipTextOn]}>{role}</Text></Pressable>)}</View>
          {roleA && roleB ? <View style={styles.confirmation}><Text style={styles.confirmationTitle}>확정될 두 역할</Text><Text style={styles.confirmationText}>첫 번째 참여자: {roleA} · 두 번째 참여자: {roleB}</Text></View> : null}
        </View>
        <View style={styles.note}><Text style={styles.noteText}>관계와 역할은 이후 검사 화면에서 임의로 바꾸지 않습니다. 각 참여자는 자신의 종교와 참여 동의를 별도로 확인합니다.</Text></View>
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable disabled={!canContinue || confirmSetup.isPending} style={[styles.button, (!canContinue || confirmSetup.isPending) && styles.disabled]} onPress={() => void continueToMode()}><Text style={styles.buttonText}>{confirmSetup.isPending ? "설정 저장 중…" : "검사 방식 선택하기 →"}</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, backgroundColor: "#F8F3EA" }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }, message: { color: "#5F4B3B", fontSize: 15, lineHeight: 23, textAlign: "center" }, eyebrow: { color: "#6E8A67", fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginTop: 16 }, title: { color: "#2D2420", fontSize: 24, lineHeight: 33, fontWeight: "800", marginTop: 9 }, subtitle: { color: "#68594C", fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 22 }, section: { backgroundColor: "#FFFDF9", borderRadius: 16, borderWidth: 1, borderColor: "#DCCDBB", padding: 18 }, label: { color: "#44382F", fontSize: 15, fontWeight: "800", marginBottom: 10 }, help: { color: "#75675B", fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 10 }, spaced: { marginTop: 22 }, row: { flexDirection: "row", gap: 8, flexWrap: "wrap" }, chip: { borderWidth: 1, borderColor: "#CDBEAE", backgroundColor: "#F7F0E6", borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9 }, chipOn: { backgroundColor: "#527B52", borderColor: "#527B52" }, chipText: { color: "#4E4035", fontSize: 14, fontWeight: "700" }, chipTextOn: { color: "#FFFFFF" }, locked: { opacity: 0.72 }, confirmation: { marginTop: 18, backgroundColor: "#EEF7EB", borderColor: "#A5C3A0", borderWidth: 1, borderRadius: 12, padding: 13 }, confirmationTitle: { color: "#345C35", fontSize: 13, fontWeight: "800" }, confirmationText: { color: "#456843", fontSize: 14, fontWeight: "700", marginTop: 5 }, note: { backgroundColor: "#EFE8DD", borderRadius: 12, padding: 14, marginTop: 14 }, noteText: { color: "#6C5B4D", fontSize: 13, lineHeight: 21 }, button: { marginTop: 22, alignItems: "center", borderRadius: 16, paddingVertical: 17, backgroundColor: "#527B52" }, disabled: { backgroundColor: "#C9C1B8" }, buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }, error: { color: "#A4453C", textAlign: "center", fontSize: 13, lineHeight: 20, marginTop: 14 }, outline: { borderWidth: 1, borderColor: "#527B52", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 }, outlineText: { color: "#3F6F40", fontWeight: "800" },
});
