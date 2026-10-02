import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import type { RelationType } from "@/constants/coupleData";
import type { CommerceProductCode } from "@/shared/commerce";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function RelationshipModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ product?: string | string[]; relationType?: string | string[] }>();
  const productCode = one(params.product) as CommerceProductCode | undefined;
  const relationType = one(params.relationType) as RelationType | undefined;
  const validProduct = productCode === "couple_love_deep" || productCode === "parent_child_deep";

  if (!validProduct || !relationType) {
    return (
      <ScreenContainer><View style={styles.center}><Text style={styles.notice}>관계 검사 정보를 찾을 수 없습니다.</Text></View></ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>관계 심화분석</Text>
        <Text style={styles.title}>검사 방식을 선택해 주세요</Text>
        <Text style={styles.subtitle}>두 방식 모두 같은 관계 분석과 리포트로 이어집니다.</Text>

        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => router.replace({ pathname: "/(tabs)/couple-info", params: { relationType } } as any)}
        >
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.cardTitle}>한 휴대폰에서 함께 검사하기</Text>
          <Text style={styles.cardBody}>현재 방식 그대로 진행합니다. 첫 번째 사람이 완료한 뒤 같은 휴대폰에서 두 번째 사람이 이어서 검사합니다.</Text>
          <Text style={styles.cardAction}>기존 방식으로 시작하기 →</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, styles.inviteCard, pressed && styles.cardPressed]}
          onPress={() => router.replace({ pathname: "/(tabs)/relationship-invite-start", params: { product: productCode, relationType } } as any)}
        >
          <Text style={styles.icon}>🔗</Text>
          <Text style={styles.cardTitle}>각자 휴대폰에서 검사하기</Text>
          <Text style={styles.cardBody}>결제자가 먼저 검사를 진행한 뒤, 상대방에게 고유 링크를 보냅니다. 상대방은 결제 없이 자신의 휴대폰에서 이어서 검사할 수 있습니다.</Text>
          <Text style={styles.cardAction}>초대 링크 방식으로 시작하기 →</Text>
        </Pressable>

        <View style={styles.note}>
          <Text style={styles.noteText}>상대방이 검사 중 브라우저를 닫아도 완료 전까지 같은 초대 링크로 다시 들어와 이어서 진행할 수 있습니다.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, backgroundColor: "#F8F3EA" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  notice: { color: "#5F4B3B", fontSize: 16, textAlign: "center" },
  eyebrow: { color: "#8B6B4A", fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginTop: 20 },
  title: { color: "#2D2420", fontSize: 25, lineHeight: 34, fontWeight: "800", marginTop: 10 },
  subtitle: { color: "#68594C", fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: "#FFFDF9", borderColor: "#DCCDBB", borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 14 },
  inviteCard: { borderColor: "#9DBB9C", backgroundColor: "#F7FBF5" },
  cardPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  icon: { fontSize: 26, marginBottom: 12 },
  cardTitle: { color: "#2D2420", fontSize: 18, fontWeight: "800", lineHeight: 26 },
  cardBody: { color: "#5F4B3B", fontSize: 14, lineHeight: 23, marginTop: 8 },
  cardAction: { color: "#557A55", fontSize: 14, fontWeight: "800", marginTop: 16 },
  note: { backgroundColor: "#EFE8DD", borderRadius: 12, padding: 14, marginTop: 4 },
  noteText: { color: "#6C5B4D", fontSize: 13, lineHeight: 21, textAlign: "center" },
});
