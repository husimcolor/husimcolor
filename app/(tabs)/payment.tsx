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
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import {
  getTrialStatus,
  getTrialRemainingLabel,
  startTrial,
  type TrialStatus,
} from "@/lib/trialUtils";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── 결제 상품 목록 ───────────────────────────────────────────────
// ─── 프로필 입력 옵션 ─────────────────────────────────────────────
const JOB_OPTIONS = [
  "생산직", "서비스직", "사역자", "주부",
  "학생", "프리랜서", "자영업", "무직", "기타",
];
const FAITH_OPTIONS = ["기독교", "타종교", "무교"];
const CONCERN_OPTIONS = [
  "관계", "감정 회복", "진로/일", "영성/내면",
  "가족", "자기이해", "번아웃/스트레스", "미래 방향성",
];

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
    available: false,
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
  // 입금 정보 입력 단계
  const [depositorStep, setDepositorStep] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [contact, setContact] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  // 무료체험 이름/연락처 입력 단계
  const [trialInfoStep, setTrialInfoStep] = useState(false);
  const [trialName, setTrialName] = useState("");
  const [trialContact, setTrialContact] = useState("");
  const [trialInfoSubmitting, setTrialInfoSubmitting] = useState(false);
  // 프로필 입력 단계
  const [profileStep, setProfileStep] = useState(false);
  const [profileAge, setProfileAge] = useState("");
  const [profileJob, setProfileJob] = useState("");
  const [profileFaith, setProfileFaith] = useState("");
  const [profileConcerns, setProfileConcerns] = useState<string[]>([]);

  const createPayment = trpc.payments.create.useMutation();

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
    // QR 모달 닫고 입금 정보 입력 단계로 이동
    setQrVisible(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDepositorStep(true);
  };

  const handleDepositSubmit = async () => {
    if (!senderName.trim() || !contact.trim() || !depositorName.trim()) return;
    setDepositSubmitting(true);
    try {
      await createPayment.mutateAsync({
        senderName: senderName.trim(),
        contact: contact.trim(),
        depositorName: depositorName.trim(),
        amount: selectedPlan?.id === "couple" ? 60000 : 30000,
      });
    } catch (e) {
      // DB 저장 실패해도 진행 (로컬에만 기록)
      console.warn("[Payment] DB 저장 실패:", e);
    }
    await AsyncStorage.setItem("premiumUnlocked", "true");
    setDepositSubmitting(false);
    setDepositorStep(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // 기존 프로필 불러오기
    const saved = await AsyncStorage.getItem("userProfile");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.age) setProfileAge(p.age);
      if (p.job) setProfileJob(p.job);
      if (p.faith) setProfileFaith(p.faith);
      if (p.concerns) setProfileConcerns(p.concerns);
    }
    setProfileStep(true);
  };

  const handleStartTrial = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // 이름/연락처 입력 단계 먼저 표시
    setTrialInfoStep(true);
  };
  const handleTrialInfoNext = async () => {
    if (!trialName || !trialContact) return;
    setTrialInfoSubmitting(true);
    try {
      // 무료체험 정보 DB 저장 (amount=0으로 구분)
      await createPayment.mutateAsync({
        senderName: trialName,
        contact: trialContact,
        depositorName: "무료체험",
        amount: 0,
      });
    } catch {
      // 저장 실패해도 계속 진행
    } finally {
      setTrialInfoSubmitting(false);
    }
    setTrialInfoStep(false);
    // 기존 프로필 불러오기
    const saved = await AsyncStorage.getItem("userProfile");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.age) setProfileAge(p.age);
      if (p.job) setProfileJob(p.job);
      if (p.faith) setProfileFaith(p.faith);
      if (p.concerns) setProfileConcerns(p.concerns);
    }
    // 프로필 입력 단계 표시
    setProfileStep(true);
  };
  const handleContinueTrial = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // 기존 프로필 불러오기
    const saved = await AsyncStorage.getItem("userProfile");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.age) setProfileAge(p.age);
      if (p.job) setProfileJob(p.job);
      if (p.faith) setProfileFaith(p.faith);
      if (p.concerns) setProfileConcerns(p.concerns);
    }
    setProfileStep(true);
  };
  const handleProfileNext = async () => {
    if (!profileAge || !profileJob || !profileFaith) {
      return; // 버튼 비활성화로 처리
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // 프로필 저장
    const profile = {
      age: profileAge,
      job: profileJob,
      faith: profileFaith,
      concerns: profileConcerns,
    };
    await AsyncStorage.setItem("userProfile", JSON.stringify(profile));
    setProfileStep(false);
    // 무료체험 활성화 (아직 안 된 경우)
    const currentStatus = await getTrialStatus();
    if (currentStatus === "none") {
      await startTrial();
      setTrialStatus("active");
      const label = await getTrialRemainingLabel();
      setRemainingLabel(label);
    }
    router.push("/premium-select" as any);
  };
  const toggleConcern = (item: string) => {
    setProfileConcerns(prev => {
      if (prev.includes(item)) return prev.filter(c => c !== item);
      if (prev.length >= 2) return prev; // 최대 2개
      return [...prev, item];
    });
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
      {/* 프로필 입력 모달 */}
      <Modal
        visible={profileStep}
        animationType="slide"
        transparent
        onRequestClose={() => setProfileStep(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.profileOverlay}>
            <View style={[styles.profileSheet, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* 헤더 */}
                <View style={styles.profileHeader}>
                  <Text style={[styles.profileTitle, { color: colors.foreground }]}>
                    심화 코칭 정보 입력
                  </Text>
                  <Text style={[styles.profileSubtitle, { color: colors.muted }]}>
                    더 정확한 맞춤 해석을 위해{"\n"}간단한 정보를 입력해 주세요
                  </Text>
                </View>
                {/* 나이 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>나이</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: profileAge ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                    }]}
                    placeholder="나이를 입력하세요 (예: 35)"
                    placeholderTextColor={colors.muted}
                    keyboardType="numeric"
                    value={profileAge}
                    onChangeText={(t) => setProfileAge(t.replace(/[^0-9]/g, ""))}
                    maxLength={3}
                    returnKeyType="done"
                  />
                </View>
                {/* 직업 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>직업</Text>
                  <View style={styles.chipGrid}>
                    {JOB_OPTIONS.map((job) => (
                      <TouchableOpacity
                        key={job}
                        style={[styles.chip, {
                          backgroundColor: profileJob === job ? "#8BAF8B" : colors.surface,
                          borderColor: profileJob === job ? "#8BAF8B" : colors.border,
                        }]}
                        onPress={() => setProfileJob(job)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, {
                          color: profileJob === job ? "#FFFFFF" : colors.foreground,
                          fontWeight: profileJob === job ? "700" : "400",
                        }]}>{job}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* 신앙 여부 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>신앙 여부</Text>
                  <View style={styles.faithRow}>
                    {FAITH_OPTIONS.map((faith) => (
                      <TouchableOpacity
                        key={faith}
                        style={[styles.faithChip, {
                          backgroundColor: profileFaith === faith ? "#8BAF8B" : colors.surface,
                          borderColor: profileFaith === faith ? "#8BAF8B" : colors.border,
                        }]}
                        onPress={() => setProfileFaith(faith)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.faithChipText, {
                          color: profileFaith === faith ? "#FFFFFF" : colors.foreground,
                          fontWeight: profileFaith === faith ? "700" : "400",
                        }]}>{faith}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                {/* 고민 분야 (최대 2개) */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>
                    현재 가장 고민되는 분야
                    <Text style={[styles.profileLabelSub, { color: colors.muted }]}> (최대 2개)</Text>
                  </Text>
                  <View style={styles.chipGrid}>
                    {CONCERN_OPTIONS.map((item) => {
                      const selected = profileConcerns.includes(item);
                      const disabled = !selected && profileConcerns.length >= 2;
                      return (
                        <TouchableOpacity
                          key={item}
                          style={[styles.chip, {
                            backgroundColor: selected ? "#7B9FBF" : colors.surface,
                            borderColor: selected ? "#7B9FBF" : disabled ? colors.border + "60" : colors.border,
                            opacity: disabled ? 0.45 : 1,
                          }]}
                          onPress={() => !disabled && toggleConcern(item)}
                          activeOpacity={disabled ? 1 : 0.7}
                        >
                          <Text style={[styles.chipText, {
                            color: selected ? "#FFFFFF" : colors.foreground,
                            fontWeight: selected ? "700" : "400",
                          }]}>{item}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                {/* 다음 버튼 */}
                <TouchableOpacity
                  style={[styles.profileNextBtn, {
                    backgroundColor: profileAge && profileJob && profileFaith ? "#8BAF8B" : colors.border,
                  }]}
                  onPress={handleProfileNext}
                  activeOpacity={0.85}
                  disabled={!profileAge || !profileJob || !profileFaith}
                >
                  <Text style={styles.profileNextBtnText}>카드 선택하기 →</Text>
                </TouchableOpacity>
                <Text style={[styles.profilePrivacy, { color: colors.muted }]}>
                  입력하신 정보는 결과 해석에만 활용되며{"\n"}외부로 전송되지 않습니다.
                </Text>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
            {plan.available ? (
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
            ) : (
              <View
                style={[
                  styles.payButton,
                  { backgroundColor: "#C4956A44" },
                ]}
              >
                <Text style={[styles.payButtonText, { color: "#C4956A" }]}>
                  🔜 커플코칭 곧 오픈 예정
                </Text>
              </View>
            )}
          </View>
        ))}

        {/* 무료체험 / 이전으로 버튼 */}
        {trialStatus === "active" ? (
          <TouchableOpacity
            style={[styles.freeButton, { borderColor: "#8BAF8B", backgroundColor: "#8BAF8B12" }]}
            onPress={handleContinueTrial}
            activeOpacity={0.8}
          >
            <Text style={[styles.freeButtonText, { color: "#5A8A5A", fontWeight: "600" }]}>
              🌿 1인 1회 · 48시간 무료체험 시작하기
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.freeButton, { borderColor: "#8BAF8B", backgroundColor: "#8BAF8B12" }]}
            onPress={handleStartTrial}
            activeOpacity={0.8}
          >
            <Text style={[styles.freeButtonText, { color: "#5A8A5A", fontWeight: "600" }]}>
              🌿 1인 1회 · 48시간 무료체험 시작하기
            </Text>
          </TouchableOpacity>
        )}

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

      {/* 무료체험 이름/연락처 입력 모달 */}
      <Modal
        visible={trialInfoStep}
        animationType="slide"
        transparent
        onRequestClose={() => setTrialInfoStep(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.profileOverlay}>
            <View style={[styles.profileSheet, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={styles.profileHeader}>
                  <Text style={[styles.profileTitle, { color: colors.foreground }]}>
                    무료체험 시작하기
                  </Text>
                  <Text style={[styles.profileSubtitle, { color: colors.muted }]}>
                    간단한 정보를 입력해 주세요{"\n"}운영자 확인용으로만 사용됩니다
                  </Text>
                </View>

                {/* 이름/닉네임 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>이름 또는 닉네임</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: trialName ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                    }]}
                    placeholder="이름 또는 닉네임을 입력해 주세요"
                    placeholderTextColor={colors.muted}
                    value={trialName}
                    onChangeText={setTrialName}
                    maxLength={50}
                    returnKeyType="next"
                    autoFocus
                  />
                </View>

                {/* 연락처 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>연락처</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: trialContact ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                    }]}
                    placeholder="연락처를 입력해 주세요 (예: 010-1234-5678)"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                    value={trialContact}
                    onChangeText={setTrialContact}
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={handleTrialInfoNext}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.profileNextBtn, {
                    backgroundColor: (trialName && trialContact) ? "#8BAF8B" : colors.border,
                  }]}
                  onPress={handleTrialInfoNext}
                  disabled={!trialName || !trialContact || trialInfoSubmitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.profileNextBtnText}>
                    {trialInfoSubmitting ? "저장 중..." : "다음 단계 · 코칭 정보 입력하기 →"}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.profilePrivacy, { color: colors.muted }]}>
                  입력하신 정보는 운영자 확인용으로만 사용됩니다
                </Text>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 입금 정보 입력 모달 */}
      <Modal
        visible={depositorStep}
        animationType="slide"
        transparent
        onRequestClose={() => setDepositorStep(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.profileOverlay}>
            <View style={[styles.profileSheet, { backgroundColor: colors.background }]}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <View style={styles.profileHeader}>
                  <Text style={[styles.profileTitle, { color: colors.foreground }]}>
                    입금 확인 정보 입력
                  </Text>
                  <Text style={[styles.profileSubtitle, { color: colors.muted }]}>
                    운영자 확인용으로만 사용되며{"\n"}외부로 전송되지 않습니다
                  </Text>
                </View>

                {/* 이름/닉네임 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>이름 또는 닉네임</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: senderName ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                    }]}
                    placeholder="이름 또는 닉네임을 입력해 주세요"
                    placeholderTextColor={colors.muted}
                    value={senderName}
                    onChangeText={setSenderName}
                    maxLength={50}
                    returnKeyType="next"
                  />
                </View>

                {/* 연락처 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>연락처</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: contact ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                    }]}
                    placeholder="연락처를 입력해 주세요 (예: 010-1234-5678)"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                    value={contact}
                    onChangeText={setContact}
                    maxLength={20}
                    returnKeyType="next"
                  />
                </View>

                {/* 입금자명 */}
                <View style={styles.profileSection}>
                  <Text style={[styles.profileLabel, { color: colors.foreground }]}>입금자명</Text>
                  <Text style={[styles.profileLabelSub, { color: colors.muted }]}>  · 실제 입금 시 사용하신 이름을 입력해 주세요</Text>
                  <TextInput
                    style={[styles.profileAgeInput, {
                      borderColor: depositorName ? "#8BAF8B" : colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                      marginTop: 8,
                    }]}
                    placeholder="입금자명을 입력해 주세요"
                    placeholderTextColor={colors.muted}
                    value={depositorName}
                    onChangeText={setDepositorName}
                    maxLength={50}
                    returnKeyType="done"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.profileNextBtn, {
                    backgroundColor: (senderName && contact && depositorName) ? "#8BAF8B" : colors.border,
                  }]}
                  onPress={handleDepositSubmit}
                  disabled={!senderName || !contact || !depositorName || depositSubmitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.profileNextBtnText}>
                    {depositSubmitting ? "처리 중..." : "다음 단계 · 정보 입력하기 →"}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.profilePrivacy, { color: colors.muted }]}>
                  입력하신 정보는 운영자 확인 후 심화 해석에 활용됩니다
                </Text>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  // ─── 프로필 입력 모달 스타일 ─────────────────────────────────────
  profileOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  profileSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  profileSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  profileSection: {
    marginBottom: 24,
  },
  profileLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  profileLabelSub: {
    fontSize: 13,
    fontWeight: '400',
  },
  profileAgeInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 14,
  },
  faithRow: {
    flexDirection: 'row',
    gap: 12,
  },
  faithChip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  faithChipText: {
    fontSize: 15,
  },
  profileNextBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  profileNextBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  profilePrivacy: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 20,
  },
});
