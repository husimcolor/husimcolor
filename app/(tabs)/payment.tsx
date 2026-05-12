import React, { useState, useEffect } from "react";
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
import {
  getTrialStatus,
  getTrialRemainingLabel,
  startTrial,
  type TrialStatus,
} from "@/lib/trialUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── 결제 상품 목록 ───────────────────────────────────────────────
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
  const [trialStatus, setTrialStatus] = useState<TrialStatus>("none");
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const status = await getTrialStatus();
      setTrialStatus(status);
      if (status === "active") {
        const label = await getTrialRemainingLabel();
        setRemainingLabel(label);
      }
    };
    load();
  }, []);

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
    router.push("/premium-select" as any);
  };

  const handleStartTrial = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await startTrial();
    setTrialStatus("active");
    const label = await getTrialRemainingLabel();
    setRemainingLabel(label);
    // 체험 활성화 후 이전 화면(심화 결과)으로 복귀
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/premium-select" as any);
    }
  };

  const handleContinueTrial = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/premium-select" as any);
    }
  };

  // 무료체험 버튼 렌더링
  const renderTrialButton = () => {
    if (trialStatus === "paid") return null;

    if (trialStatus === "none") {
      return (
        <TouchableOpacity
          style={[styles.trialButton, { borderColor: "#8BAF8B", backgroundColor: "#8BAF8B18" }]}
          onPress={handleStartTrial}
          activeOpacity={0.8}
        >
          <Text style={[styles.trialButtonTitle, { color: "#5A8A5A" }]}>
            🌿 휴심컬러 심화코칭 베타 체험
          </Text>
          <Text style={[styles.trialButtonDesc, { color: "#5A8A5A" }]}>
            1인 1회, 48시간 동안 무료로 체험 가능합니다
          </Text>
          <View style={[styles.trialButtonBadge, { backgroundColor: "#8BAF8B" }]}>
            <Text style={styles.trialButtonBadgeText}>48시간 무료체험 시작하기</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (trialStatus === "active") {
      return (
        <TouchableOpacity
          style={[styles.trialButton, { borderColor: "#8BAF8B", backgroundColor: "#8BAF8B18" }]}
          onPress={handleContinueTrial}
          activeOpacity={0.8}
        >
          <Text style={[styles.trialButtonTitle, { color: "#5A8A5A" }]}>
            🌿 무료체험 진행 중
          </Text>
          {remainingLabel && (
            <Text style={[styles.trialButtonDesc, { color: "#5A8A5A" }]}>
              남은 체험 시간: {remainingLabel}
            </Text>
          )}
          <View style={[styles.trialButtonBadge, { backgroundColor: "#8BAF8B" }]}>
            <Text style={styles.trialButtonBadgeText}>심층 해석 계속하기 →</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (trialStatus === "expired") {
      return (
        <View style={[styles.trialButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <Text style={[styles.trialButtonTitle, { color: colors.muted }]}>
            무료체험이 종료되었습니다
          </Text>
          <Text style={[styles.trialButtonDesc, { color: colors.muted }]}>
            1인 1회 48시간 무료체험이 완료되었습니다.{"\n"}
            아래에서 결제 후 계속 이용하실 수 있습니다.
          </Text>
        </View>
      );
    }

    return null;
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

        {/* 무료체험 버튼 (최상단 강조) */}
        {renderTrialButton()}

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

        {/* 뒤로 가기 버튼 */}
        <TouchableOpacity
          style={[styles.freeButton, { borderColor: colors.border }]}
          onPress={() => router.canGoBack() ? router.back() : router.push("/" as any)}
          activeOpacity={0.7}
        >
          <Text style={[styles.freeButtonText, { color: colors.muted }]}>
            이전으로 돌아가기
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
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                {selectedPlan?.label} 결제
              </Text>
              <TouchableOpacity onPress={() => setQrVisible(false)}>
                <Text style={[styles.closeBtn, { color: colors.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.muted }]}>
              아래 QR 코드를 스캔하여 {selectedPlan?.price}을 송금해 주세요.{"\n"}
              {selectedPlan?.qrNote}
            </Text>

            {selectedPlan?.qrImage && (
              <View style={styles.qrWrapper}>
                <Image
                  source={selectedPlan.qrImage}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={[styles.modalStep, { color: colors.muted }]}>
              송금 완료 후 아래 버튼을 눌러주세요
            </Text>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: "#8BAF8B" }]}
              onPress={handlePaymentDone}
              activeOpacity={0.85}
            >
              <Text style={styles.doneButtonText}>결제 완료했어요 →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setQrVisible(false)}
            >
              <Text style={[styles.cancelBtnText, { color: colors.muted }]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
    gap: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  // ─── 무료체험 버튼 ───
  trialButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    gap: 8,
    alignItems: "center",
  },
  trialButtonTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  trialButtonDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  trialButtonBadge: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  trialButtonBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  // ─── 상품 카드 ───
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
    borderRadius: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  planDesc: {
    fontSize: 13,
    lineHeight: 20,
  },
  featureList: {
    gap: 10,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureIcon: {
    fontSize: 18,
    width: 24,
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
    fontSize: 12,
    lineHeight: 18,
  },
  payButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // ─── 기타 버튼 ───
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
  // ─── QR 모달 ───
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
    fontSize: 20,
    padding: 4,
  },
  modalDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  qrWrapper: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  qrImage: {
    width: SCREEN_WIDTH - 120,
    height: SCREEN_WIDTH - 120,
  },
  modalStep: {
    fontSize: 13,
    textAlign: "center",
  },
  doneButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 14,
  },
});
