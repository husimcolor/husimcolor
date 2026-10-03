import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { saveCommerceStartGrant } from "@/lib/commerce-access";
import type { RelationType } from "@/constants/coupleData";
import type { CommerceProductCode } from "@/shared/commerce";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const relationshipTypes = new Set<RelationType>([
  "연인", "부부", "부모-자녀", "아빠-아들", "아빠-딸", "엄마-아들", "엄마-딸",
]);

export default function AdminTestAccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string | string[]; grant?: string | string[]; expiresAt?: string | string[]; relationType?: string | string[] }>();
  const productCode = one(params.product) as CommerceProductCode | undefined;
  const accessToken = one(params.grant);
  const expiresAt = one(params.expiresAt);
  const relationType = one(params.relationType) as RelationType | undefined;
  const [message, setMessage] = useState("체험 이용권을 확인하고 있습니다.");

  useEffect(() => {
    const activate = async () => {
      const validProduct = productCode === "personal_deep" || productCode === "couple_love_deep" || productCode === "parent_child_deep";
      const validRelationship = productCode === "personal_deep" || Boolean(relationType && relationshipTypes.has(relationType));
      const validExpiry = Boolean(expiresAt && Number.isFinite(new Date(expiresAt).getTime()));
      if (!validProduct || !accessToken || accessToken.length < 20 || !validExpiry || !validRelationship) {
        setMessage("체험 이용권 링크가 유효하지 않거나 만료되었습니다. 발급한 관리자에게 새 링크를 요청해 주세요.");
        return;
      }
      if (new Date(expiresAt!).getTime() <= Date.now()) {
        setMessage("이 체험 시작 링크는 만료되었습니다. 이용권이 아직 유효하다면 관리자에게 새 링크를 요청해 주세요.");
        return;
      }
      await saveCommerceStartGrant({ productCode, accessToken, expiresAt: expiresAt! });
      if (productCode === "personal_deep") {
        router.replace("/(tabs)/premium-info" as any);
        return;
      }
      router.replace({
        pathname: "/(tabs)/relationship-mode",
        params: { product: productCode, relationType: relationType! },
      } as any);
    };
    void activate().catch(() => setMessage("체험 이용권을 준비하지 못했습니다. 새 링크로 다시 시도해 주세요."));
  }, [accessToken, expiresAt, productCode, relationType, router]);

  const invalid = message !== "체험 이용권을 확인하고 있습니다.";
  return (
    <ScreenContainer>
      <View style={styles.center}>
        {!invalid ? <ActivityIndicator color="#527B52" /> : null}
        <Text style={styles.title}>{invalid ? "체험 이용권 확인" : "체험 검사 준비 중"}</Text>
        <Text style={styles.body}>{message}</Text>
        {invalid ? <Pressable style={styles.button} onPress={() => router.replace("/(tabs)" as any)}><Text style={styles.buttonText}>홈으로 돌아가기</Text></Pressable> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 14 },
  title: { color: "#2D2420", fontSize: 23, fontWeight: "800" },
  body: { color: "#5F4B3B", fontSize: 14, lineHeight: 22, textAlign: "center", maxWidth: 330 },
  button: { marginTop: 8, backgroundColor: "#527B52", paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
});
