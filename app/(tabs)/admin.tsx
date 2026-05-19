import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";
import { useAdmin } from "@/lib/adminContext";

// ── 관리자 비밀번호 설정 ──────────────────────────────────────────
// 비밀번호를 변경하려면 아래 ADMIN_PASSWORD 값을 수정하고 재배포하세요.
// 이 방식은 Vercel 정적 배포 환경에서 브라우저 무관하게 동작합니다.
const ADMIN_PASSWORD = "hyusim2024";
// ────────────────────────────────────────────────────────────────

type PaymentRecord = {
  id: number;
  senderName: string;
  contact: string;
  depositorName: string;
  amount: number;
  status: "pending" | "confirmed" | "rejected";
  memo: string | null;
  createdAt: Date | string;
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  pending:   { label: "입금대기", color: "#F59E0B" },
  confirmed: { label: "입금확인", color: "#22C55E" },
  rejected:  { label: "취소",     color: "#EF4444" },
};

export default function AdminScreen() {
  const colors = useColors();
  const router = useRouter();

  // ── 인증 ──────────────────────────────────────────────────────
  const [authenticated, setAuthenticated] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);

  const { login: globalLogin, logout: globalLogout } = useAdmin();

  const handleLogin = () => {
    if (pwInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      globalLogin(pwInput); // 전역 관리자 상태 업데이트
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  // ── 데이터 조회 ────────────────────────────────────────────────
  const { data: testStats, refetch: refetchTestStats } = trpc.visitors.testStats.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const { data: stats, refetch: refetchStats } = trpc.visitors.stats.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const { data: payments, refetch: refetchPayments, isLoading } = trpc.payments.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const { data: reviewStats, refetch: refetchReviewStats } = trpc.reviews.stats.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const { data: reviewList, refetch: refetchReviewList } = trpc.reviews.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const [reviewExpanded, setReviewExpanded] = useState<number | null>(null);

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => { refetchReviewList(); refetchReviewStats(); },
    onError: (e) => Alert.alert("오류", e.message),
  });
  const handleDeleteReview = (id: number) => {
    Alert.alert('후기 삭제', '이 후기를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deleteReview.mutate({ id }) },
    ]);
  };

  const updateStatus = trpc.payments.updateStatus.useMutation({
    onSuccess: () => { refetchPayments(); refetchStats(); },
    onError: (e) => Alert.alert("오류", e.message),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchPayments(), refetchReviewStats(), refetchReviewList()]);
    setRefreshing(false);
  }, [refetchStats, refetchPayments, refetchReviewStats, refetchReviewList]);

  // ── 상태 변경 ─────────────────────────────────────────────────
  const [memoInputs, setMemoInputs] = useState<Record<number, string>>({});
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleUpdateStatus = (id: number, status: "pending" | "confirmed" | "rejected") => {
    const { label } = STATUS_INFO[status];
    Alert.alert(
      "상태 변경",
      `이 기록을 "${label}"으로 변경하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "변경",
          onPress: () => updateStatus.mutate({ id, status, memo: memoInputs[id] || undefined }),
        },
      ]
    );
  };

  // ── 통계 계산 ─────────────────────────────────────────────────
  const paidCount     = payments?.filter((p: PaymentRecord) => p.amount > 0).length ?? 0;
  const freeCount     = payments?.filter((p: PaymentRecord) => p.amount === 0).length ?? 0;
  const pendingCount  = payments?.filter((p: PaymentRecord) => p.status === "pending").length ?? 0;
  const confirmedCount = payments?.filter((p: PaymentRecord) => p.status === "confirmed").length ?? 0;

  const formatDate = (d: Date | string) => {
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dt.getFullYear()}.${pad(dt.getMonth() + 1)}.${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
  };

  // ── 로그인 화면 ────────────────────────────────────────────────
  if (!authenticated) {
    return (
      <ScreenContainer>
        {/* 로그인 전에도 보이는 커플 테스트 버튼 - 오른쪽 상단 고정 */}
        <TouchableOpacity
          style={styles.floatingCoupleBtn}
          onPress={() => router.push('/(tabs)/couple-start' as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingCoupleBtnText}>💑 커플 테스트</Text>
        </TouchableOpacity>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.loginContainer}>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>🌿 관리자 로그인</Text>
            <Text style={[styles.loginSub, { color: colors.muted }]}>휴심컬러 운영자 전용 화면입니다</Text>
            <TextInput
              style={[styles.loginInput, {
                borderColor: pwError ? "#EF4444" : colors.border,
                color: "#333333",
                backgroundColor: colors.surface,
              }]}
              placeholder="비밀번호를 입력하세요"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={pwInput}
              onChangeText={(t) => { setPwInput(t); setPwError(false); }}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
              autoFocus
            />
            {pwError && <Text style={styles.pwError}>비밀번호가 올바르지 않습니다</Text>}
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: "#5A8A5A" }]}
              onPress={handleLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={{ marginTop: 12 }}>
              <Text style={[styles.backText, { color: colors.muted }]}>← 돌아가기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // ── 관리자 메인 화면 ───────────────────────────────────────────
  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 헤더 */}
        <View style={styles.headerRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>🌿 관리자 대시보드</Text>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <TouchableOpacity
              style={[styles.smallBtn, { borderColor: "#4A7A4A", backgroundColor: "rgba(74,122,74,0.12)" }]}
              onPress={() => router.push('/(tabs)/couple-start' as any)}
              activeOpacity={0.7}
            >
              <Text style={[styles.smallBtnText, { color: "#4A7A4A" }]}>💑 커플 테스트</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { borderColor: "#EF4444" }]}
              onPress={() => { setAuthenticated(false); globalLogout(); setPwInput(""); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.refreshHint, { color: colors.muted }]}>↓ 아래로 당겨 새로고침</Text>

        {/* 커플 코칭 테스트 버튼 - 눈에 잘 띄게 상단에 배치 */}
        <TouchableOpacity
          style={styles.coupleTestBtn}
          onPress={() => router.push('/(tabs)/couple-start' as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.coupleTestBtnTitle}>💑 커플 코칭 테스트 시작</Text>
          <Text style={styles.coupleTestBtnSub}>커플 세션 전체 흐름을 처음부터 체험합니다</Text>
        </TouchableOpacity>

        {/* 통계 대시보드 */}
        <View style={styles.statsGrid}>
          {/* 전체 방문 기록 */}
          <View style={[styles.statCard, { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#5A8A5A" }]}>{stats?.totalLogs ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#5A8A5A" }]}>전체 방문 기록{"\n"}재방문 포함</Text>
          </View>
          {/* 고유 방문자 */}
          <View style={[styles.statCard, { backgroundColor: '#E8F4E8', borderColor: '#B0D8B0', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#3A7A3A" }]}>{stats?.totalVisitors ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#3A7A3A" }]}>고유 방문자{"\n"}기기 기준</Text>
          </View>
          {/* 오늘 방문자 */}
          <View style={[styles.statCard, { backgroundColor: '#F0FFF4', borderColor: '#A0D8A0', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#2A6A2A" }]}>{stats?.todayVisitors ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#2A6A2A" }]}>오늘 방문자{"\n"}고유 기기</Text>
          </View>
          {/* 무료체험 신청 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#C4A35A" }]}>{freeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>무료체험 신청</Text>
          </View>
          {/* 유료결제 신청 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#5A7EA8" }]}>{paidCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>유료결제 신청</Text>
          </View>
          {/* 입금대기 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#F59E0B" }]}>{pendingCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>입금대기</Text>
          </View>
          {/* 입금확인 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#22C55E" }]}>{confirmedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>입금확인</Text>
          </View>
          {/* 총 신청 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.foreground }]}>{payments?.length ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>총 신청</Text>
          </View>
        </View>

        {/* 테스트 세션 통계 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>테스트 세션 통계</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#FFF8F0', borderColor: '#E8D5B0', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#C4A35A" }]}>{testStats?.freeStart ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#8B6914" }]}>무료 테스트{"\n"}시작</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF8F0', borderColor: '#E8D5B0', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#C4A35A" }]}>{testStats?.freeResult ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#8B6914" }]}>무료 테스트{"\n"}결과 도달</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0F4FF', borderColor: '#C0CCEE', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#5A7EA8" }]}>{testStats?.deepStart ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#3A5A88" }]}>심화 테스트{"\n"}시작</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0F4FF', borderColor: '#C0CCEE', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#5A7EA8" }]}>{testStats?.deepResult ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#3A5A88" }]}>심화 테스트{"\n"}결과 도달</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FFF4', borderColor: '#B0DDB8', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#5A8A5A" }]}>{testStats?.coupleStart ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#3A6A3A" }]}>커플 테스트{"\n"}시작</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0FFF4', borderColor: '#B0DDB8', borderWidth: 1 }]}>
            <Text style={[styles.statNum, { color: "#5A8A5A" }]}>{testStats?.coupleResult ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: "#3A6A3A" }]}>커플 테스트{"\n"}결과 도달</Text>
          </View>
        </View>

        {/* 결제 신청 목록 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>결제 신청 목록</Text>
        {isLoading ? (
          <ActivityIndicator color="#5A8A5A" style={{ marginVertical: 20 }} />
        ) : !payments || payments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>아직 신청 내역이 없습니다.</Text>
        ) : (
          payments.map((p: PaymentRecord) => {
            const si = STATUS_INFO[p.status] ?? STATUS_INFO.pending;
            const isExpanded = expandedId === p.id;
            return (
              <View key={p.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpandedId(isExpanded ? null : p.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{p.senderName}</Text>
                      <View style={[styles.statusBadge, { borderColor: si.color }]}>
                        <Text style={[styles.statusText, { color: si.color }]}>{si.label}</Text>
                      </View>
                      {p.amount > 0 && (
                        <View style={[styles.statusBadge, { borderColor: "#5A7EA8" }]}>
                          <Text style={[styles.statusText, { color: "#5A7EA8" }]}>유료</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                      {formatDate(p.createdAt)} · {p.amount > 0 ? `${p.amount.toLocaleString()}원` : "무료체험"}
                    </Text>
                  </View>
                  <Text style={[styles.expandIcon, { color: colors.muted }]}>{isExpanded ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.cardBody}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoGrid}>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoKey, { color: colors.muted }]}>연락처</Text>
                        <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.contact}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoKey, { color: colors.muted }]}>입금자명</Text>
                        <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.depositorName}</Text>
                      </View>
                      {p.memo && (
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoKey, { color: colors.muted }]}>메모</Text>
                          <Text style={[styles.infoVal, { color: colors.foreground }]}>{p.memo}</Text>
                        </View>
                      )}
                    </View>
                    <TextInput
                      style={[styles.memoInput, { borderColor: colors.border, color: "#333333", backgroundColor: colors.background }]}
                      placeholder="관리자 메모 (선택)"
                      placeholderTextColor={colors.muted}
                      value={memoInputs[p.id] ?? ""}
                      onChangeText={(t) => setMemoInputs((prev) => ({ ...prev, [p.id]: t }))}
                      returnKeyType="done"
                    />
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#22C55E" }]}
                        onPress={() => handleUpdateStatus(p.id, "confirmed")}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>입금확인</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#F59E0B" }]}
                        onPress={() => handleUpdateStatus(p.id, "pending")}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: "#F59E0B" }]}>입금대기</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: "#EF4444" }]}
                        onPress={() => handleUpdateStatus(p.id, "rejected")}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* 후기 통계 */}
        {reviewStats && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>후기 통계</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: "#C4A35A" }]}>{reviewStats.total}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>총 후기</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.statNum, { color: "#5A8A5A" }]}>{reviewStats.avgRating}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>평균 별점</Text>
              </View>
            </View>
          </>
        )}

        {/* 후기 목록 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>후기 목록</Text>
        {!reviewList || reviewList.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.muted }]}>아직 후기가 없습니다.</Text>
        ) : (
          reviewList.map((r: any) => {
            const isExpanded = reviewExpanded === r.id;
            return (
              <View key={r.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setReviewExpanded(isExpanded ? null : r.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{r.nickname}</Text>
                      <Text style={{ color: "#C4A35A", fontSize: 13 }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Text>
                    </View>
                    <Text style={[styles.cardSubtitle, { color: colors.muted }]} numberOfLines={1}>{r.content}</Text>
                  </View>
                  <Text style={[styles.expandIcon, { color: colors.muted }]}>{isExpanded ? "▲" : "▼"}</Text>
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.cardBody}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[{ color: colors.foreground, fontSize: 14, lineHeight: 22, marginBottom: 8 }]}>{r.content}</Text>
                    {r.tags && <Text style={[{ color: colors.muted, fontSize: 12, marginBottom: 8 }]}>태그: {r.tags}</Text>}
                    {r.colorCombo && <Text style={[{ color: colors.muted, fontSize: 12, marginBottom: 8 }]}>컬러: {r.colorCombo}</Text>}
                    <Text style={[{ color: colors.muted, fontSize: 11, marginBottom: 12 }]}>{formatDate(r.createdAt)}</Text>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: "#EF4444", flex: 0, paddingHorizontal: 16 }]}
                      onPress={() => handleDeleteReview(r.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  // 로그인
  loginContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 12 },
  loginTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  loginSub: { fontSize: 14, textAlign: "center", marginBottom: 8 },
  loginInput: { width: "100%", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  pwError: { color: "#EF4444", fontSize: 13 },
  loginBtn: { width: "100%", paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 4 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backText: { fontSize: 14 },
  // 메인
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 60, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 20, fontWeight: "800" },
  headerBtns: { flexDirection: "row", gap: 6 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  smallBtnText: { fontSize: 12, fontWeight: "600" },
  coupleTestBtn: { backgroundColor: "#4A7A4A", borderRadius: 16, paddingVertical: 18, paddingHorizontal: 20, alignItems: "center", gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  coupleTestBtnTitle: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  coupleTestBtnSub: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  floatingCoupleBtn: { position: "absolute", top: 16, right: 16, zIndex: 100, backgroundColor: "rgba(74,122,74,0.85)", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  floatingCoupleBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  refreshHint: { fontSize: 12, textAlign: "center", marginTop: -4 },
  // 통계
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: { width: "30.5%", borderRadius: 12, borderWidth: 1, padding: 12, alignItems: "center", gap: 4 },
  statNum: { fontSize: 26, fontWeight: "800" },
  statLabel: { fontSize: 11, textAlign: "center" },
  // 목록
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  emptyText: { textAlign: "center", fontSize: 14, paddingVertical: 40 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: "700" },
  cardSubtitle: { fontSize: 12 },
  expandIcon: { fontSize: 12, marginLeft: 8 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14 },
  divider: { height: 1, marginBottom: 12 },
  infoGrid: { gap: 6, marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoKey: { fontSize: 13, width: 72 },
  infoVal: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
  memoInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, marginBottom: 10 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnText: { fontSize: 13, fontWeight: "700" },
});
