import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const FEATURES = [
  { icon: "🎴", title: "63장 컬러+도형 심리카드", desc: "9가지 컬러 × 7가지 도형 조합 카드" },
  { icon: "🔮", title: "3장 카드 심층 해석", desc: "무의식 · 현재 · 회복 방향 분석" },
  { icon: "💚", title: "개인 맞춤 코칭 메시지", desc: "나이·직업·신앙 여부 반영 해석" },
  { icon: "🌿", title: "보완 컬러 에너지 안내", desc: "지금 필요한 컬러 에너지 제안" },
  { icon: "📋", title: "결과 저장 및 공유", desc: "이미지 저장 · SNS 공유 가능" },
];

export default function PaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 결제 방식: 토스페이먼츠 결제 링크 또는 네이버 예약으로 연결
      // 실제 결제 링크로 교체 필요
      const paymentUrl = "https://booking.naver.com/booking/13/bizes/1076765";

      if (Platform.OS === "web") {
        // 웹에서는 새 탭으로 결제 페이지 열기
        window.open(paymentUrl, "_blank");
        // 결제 완료 후 사용자가 돌아왔을 때 처리
        // 실제 결제 연동 시 webhook 또는 return URL로 처리
        setTimeout(() => {
          Alert.alert(
            "결제 안내",
            "결제 페이지에서 결제를 완료하신 후 아래 '결제 완료' 버튼을 눌러주세요.",
            [
              { text: "취소", style: "cancel" },
              {
                text: "결제 완료",
                onPress: async () => {
                  await AsyncStorage.setItem("premiumUnlocked", "true");
                  router.push("/profile" as any);
                },
              },
            ]
          );
        }, 1000);
      } else {
        Linking.openURL(paymentUrl);
      }
    } catch (e) {
      Alert.alert("오류", "결제 페이지 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDevSkip = async () => {
    // 개발/테스트용 결제 건너뛰기
    await AsyncStorage.setItem("premiumUnlocked", "true");
    router.push("/profile" as any);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: "#8BAF8B22" }]}>
              <Text style={[styles.badgeText, { color: "#8BAF8B" }]}>
                컬러+도형 심리카드
              </Text>
            </View>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            나의 컬러 에너지 흐름{"\n"}심층 해석
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            63장의 카드 중 마음이 이끄는 3장을 선택하고{"\n"}
            깊은 내면의 흐름을 확인해 보세요
          </Text>
        </View>

        {/* 가격 */}
        <View
          style={[
            styles.priceBox,
            { backgroundColor: "#8BAF8B18", borderColor: "#8BAF8B55" },
          ]}
        >
          <Text style={[styles.priceLabel, { color: colors.muted }]}>
            1회 해석 비용
          </Text>
          <Text style={[styles.price, { color: "#8BAF8B" }]}>30,000원</Text>
          <Text style={[styles.priceNote, { color: colors.muted }]}>
            결제 후 즉시 카드 선택 및 해석 진행
          </Text>
        </View>

        {/* 포함 기능 */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: colors.foreground }]}>
            포함 내용
          </Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureTexts}>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.muted }]}>
                  {f.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 결제 버튼 */}
        <TouchableOpacity
          style={[
            styles.payButton,
            { backgroundColor: isProcessing ? colors.border : "#8BAF8B" },
          ]}
          onPress={handlePayment}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <Text style={styles.payButtonText}>
            {isProcessing ? "연결 중..." : "30,000원 결제하기"}
          </Text>
        </TouchableOpacity>

        {/* 무료 체험 버튼 */}
        <TouchableOpacity
          style={[styles.freeButton, { borderColor: colors.border }]}
          onPress={() => router.push("/" as any)}
          activeOpacity={0.7}
        >
          <Text style={[styles.freeButtonText, { color: colors.muted }]}>
            무료 버전으로 먼저 체험하기
          </Text>
        </TouchableOpacity>

        {/* 안내 문구 */}
        <Text style={[styles.notice, { color: colors.muted }]}>
          · 결제 후 환불은 카드 선택 전에만 가능합니다{"\n"}
          · 결제 관련 문의: 카카오톡 채널 @휴심컬러
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
    gap: 10,
  },
  badgeRow: {
    flexDirection: "row",
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  priceBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    gap: 4,
  },
  priceLabel: {
    fontSize: 13,
  },
  price: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  priceNote: {
    fontSize: 12,
    marginTop: 4,
  },
  featuresSection: {
    marginBottom: 28,
    gap: 14,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: "center",
  },
  featureTexts: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  featureDesc: {
    fontSize: 13,
  },
  payButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 12,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  freeButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  freeButtonText: {
    fontSize: 14,
  },
  notice: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
});
