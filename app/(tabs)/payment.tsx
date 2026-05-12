import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  Dimensions,
  Platform,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── 결제 상품 목록 ───────────────────────────────────────────────
// 추후 커플 코칭(6만원) 등 상품 추가 시 이 배열에 항목만 추가하면 됩니다.
const PAYMENT_PLANS = [
  {
    id: "single",
    label: "개인 심층 해석",
    price: "30,000원",
    badge: "가장 인기",
    badgeColor: "#8BAF8B",
    description: "나의 컬러 에너지 흐름 심층 분석",
    features: [
      { icon: "🎴", title: "63장 컬러+도형 심리카드", desc: "9가지 컬러 × 7가지 도형 조합" },
      { icon: "🔮", title: "3장 카드 심층 해석", desc: "무의식 · 현재 · 회복 방향 분석" },
      { icon: "💚", title: "개인 맞춤 코칭 메시지", desc: "나이·직업·신앙 여부 반영 해석" },
      { icon: "🌿", title: "보완 컬러 에너지 안내", desc: "지금 필요한 컬러 에너지 제안" },
    ],
    qrImage: require("@/assets/images/qr_30000.jpg") as number,
    qrNote: "카카오페이 · 토스 · 계좌이체 가능",
    available: true,
  },
  {
    id: "couple",
    label: "커플 심리코칭",
    price: "60,000원",
    badge: "커플 추천",
    badgeColor: "#C4956A",
    description: "두 사람의 컬러 에너지 흐름 비교 분석",
    features: [
      { icon: "💑", title: "커플 카드 각자 선택", desc: "두 사람이 각각 3장씩 선택" },
      { icon: "🔗", title: "관계 에너지 흐름 분석", desc: "두 사람의 에너지 조화·충돌 해석" },
      { icon: "💬", title: "관계 맞춤 코칭 메시지", desc: "두 사람의 회복 방향 제안" },
      { icon: "🌿", title: "함께하는 보완 컬러 안내", desc: "관계 회복에 도움이 되는 컬러 제안" },
    ],
    qrImage: require("@/assets/images/qr_60000.jpg") as number,
    qrNote: "카카오페이 · 토스 · 계좌이체 가능",
    available: true,
  },
];

type Plan = typeof PAYMENT_PLANS[0];

export default function PaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [qrVisible, setQrVisible] = useState(false);

  const handlePayPress = (plan: Plan) => {
    if (!plan.available) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedPlan(plan);
    setQrVisible(true);
  };

  const handlePaymentDone = async () => {
    await AsyncStorage.setItem("premiumUnlocked", "true");
    setQrVisible(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.push("/profile" as any);
  };

  const handleDevSkip = async () => {
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
          <Text style={[styles.title, { color: colors.foreground }]}>
            컬러 에너지 흐름{"\n"}심층 해석
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            63장의 카드 중 마음이 이끄는 3장을 선택하고{"\n"}
            깊은 내면의 흐름을 확인해 보세요
          </Text>
        </View>

        {/* 상품 카드 목록 */}
        {PAYMENT_PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              {
                backgroundColor: colors.surface,
                borderColor: plan.id === "couple" ? "#C4956A55" : "#8BAF8B55",
              },
            ]}
          >
            <View style={styles.planHeader}>
              <Text style={[styles.planLabel, { color: colors.foreground }]}>
                {plan.label}
              </Text>
              <View style={[styles.planBadge, { backgroundColor: plan.badgeColor + "22" }]}>
                <Text style={[styles.planBadgeText, { color: plan.badgeColor }]}>
                  {plan.badge}
                </Text>
              </View>
            </View>

            <Text style={[styles.planPrice, { color: plan.id === "couple" ? "#C4956A" : "#8BAF8B" }]}>
              {plan.price}
            </Text>
            <Text style={[styles.planDesc, { color: colors.muted }]}>
              {plan.description}
            </Text>

            <View style={styles.featureList}>
              {plan.features.map((f) => (
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

            <TouchableOpacity
              style={[
                styles.payButton,
                { backgroundColor: plan.id === "couple" ? "#C4956A" : "#8BAF8B" },
              ]}
              onPress={() => handlePayPress(plan)}
              activeOpacity={0.8}
            >
              <Text style={styles.payButtonText}>
                {`${plan.price} 결제하기`}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* 테스트 모드 버튼 */}
        <TouchableOpacity
          style={[styles.testButton, { borderColor: "#C4956A" }]}
          onPress={handleDevSkip}
          activeOpacity={0.7}
        >
          <Text style={[styles.testButtonLabel, { color: "#C4956A" }]}>
            개발자 테스트 모드
          </Text>
          <Text style={[styles.testButtonText, { color: "#A08060" }]}>
            결제 없이 바로 카드 선택 시작 (테스트용)
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
          · 결제 관련 문의:
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL("https://open.kakao.com/o/sp6nBerh")}
          activeOpacity={0.7}
        >
          <Text style={[styles.kakaoLink, { color: "#3A9F3A" }]}>
            카카오톡 오픈채팅 @휴심컬러 연결하기 →
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* QR 결제 모달 */}
      <Modal
        visible={qrVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQrVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                QR 코드로 결제하기
              </Text>
              <TouchableOpacity
                onPress={() => setQrVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={[styles.closeBtnText, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.amountBox, { backgroundColor: "#8BAF8B15", borderColor: "#8BAF8B44" }]}>
              <Text style={[styles.amountLabel, { color: colors.muted }]}>결제 금액</Text>
              <Text style={[styles.amountValue, { color: "#8BAF8B" }]}>
                {selectedPlan?.price}
              </Text>
              <Text style={[styles.amountNote, { color: colors.muted }]}>
                {selectedPlan?.qrNote}
              </Text>
            </View>

            {selectedPlan?.qrImage != null && (
              <View style={styles.qrWrapper}>
                <Image
                  source={selectedPlan.qrImage}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={[styles.qrGuide, { color: colors.muted }]}>
              카카오페이 · 토스 · 계좌이체 앱에서{"\n"}
              QR 코드를 스캔하여 결제해 주세요
            </Text>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: "#8BAF8B" }]}
              onPress={handlePaymentDone}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>결제 완료했어요 →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setQrVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.muted }]}>
                나중에 결제하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const QR_SIZE = Math.min(SCREEN_WIDTH * 0.62, 240);

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
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
  planCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  planBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  planDesc: {
    fontSize: 13,
    marginTop: -4,
  },
  featureList: {
    gap: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  featureTexts: {
    flex: 1,
    gap: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  featureDesc: {
    fontSize: 12,
  },
  payButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  testButton: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF8F0",
  },
  testButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  testButtonText: {
    fontSize: 13,
  },
  freeButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  freeButtonText: {
    fontSize: 14,
  },
  notice: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: "center",
  },
  kakaoLink: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
    paddingVertical: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
  },
  amountBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 2,
  },
  amountLabel: {
    fontSize: 12,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  amountNote: {
    fontSize: 12,
    marginTop: 2,
  },
  qrWrapper: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignSelf: "center",
  },
  qrImage: {
    width: QR_SIZE,
    height: QR_SIZE,
  },
  qrGuide: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 14,
  },
});
