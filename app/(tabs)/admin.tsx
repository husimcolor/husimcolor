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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useRouter } from "expo-router";

const ADMIN_PASSWORD_KEY = "admin_password_v1";
const DEFAULT_PASSWORD = "hyusim2024";

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

  const handleLogin = async () => {
    const stored = await AsyncStorage.getItem(ADMIN_PASSWORD_KEY);
    const correct = stored ?? DEFAULT_PASSWORD;
    if (pwInput === correct) {
      setAuthenticated(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  // ── 데이터 조회 ────────────────────────────────────────────────
  const { data: stats, refetch: refetchStats } = trpc.visitors.stats.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const { data: payments, refetch: refetchPayments, isLoading } = trpc.payments.list.useQuery(undefined, {
    enabled: authenticated,
    retry: false,
  });

  const updateStatus = trpc.payments.updateStatus.useMutation({
    onSuccess: () => { refetchPayments(); refetchStats(); },
    onError: (e) => Alert.alert("오류", e.message),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchPayments()]);
    setRefreshing(false);
  }, [refetchStats, refetchPayments]);

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

  // ── 비밀번호 변경 ──────────────────────────────────────────────
  const [changePwMode, setChangePwMode] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const handleChangePassword = async () => {
    if (newPw.length < 4) { Alert.alert("오류", "비밀번호는 4자 이상이어야 합니다."); return; }
    if (newPw !== confirmPw) { Alert.alert("오류", "비밀번호가 일치하지 않습니다."); return; }
    await AsyncStorage.setItem(ADMIN_PASSWORD_KEY, newPw);
    setChangePwMode(false);
    setNewPw(""); setConfirmPw("");
    Alert.alert("완료", "비밀번호가 변경되었습니다.");
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.loginContainer}>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>🌿 관리자 로그인</Text>
            <Text style={[styles.loginSub, { color: colors.muted }]}>휴심컬러 운영자 전용 화면입니다</Text>
            <TextInput
              style={[styles.loginInput, {
                borderColor: pwError ? "#EF4444" : colors.border,
                color: colors.foreground,
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

  // ── 비밀번호 변경 화면 ─────────────────────────────────────────
  if (changePwMode) {
    return (
      <ScreenContainer className="p-6">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.loginContainer}>
            <Text style={[styles.loginTitle, { color: colors.foreground }]}>비밀번호 변경</Text>
            <TextInput
              style={[styles.loginInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
              placeholder="새 비밀번호 (4자 이상)"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              style={[styles.loginInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.surface }]}
              placeholder="비밀번호 확인"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
              onSubmitEditing={handleChangePassword}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: "#5A8A5A" }]}
              onPress={handleChangePassword}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>변경하기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setChangePwMode(false)} activeOpacity={0.7} style={{ marginTop: 12 }}>
              <Text style={[styles.backText, { color: colors.muted }]}>← 취소</Text>
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
          <View style={styles.headerBtns}>
            <TouchableOpacity
              style={[styles.smallBtn, { borderColor: colors.border }]}
              onPress={() => setChangePwMode(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.smallBtnText, { color: colors.muted }]}>비번변경</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallBtn, { borderColor: "#EF4444" }]}
              onPress={() => { setAuthenticated(false); setPwInput(""); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.refreshHint, { color: colors.muted }]}>↓ 아래로 당겨 새로고침</Text>

        {/* 통계 대시보드 */}
        <View style={styles.statsGrid}>
          {/* 방문자 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#5A8A5A" }]}>{stats?.totalVisitors ?? "-"}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>전체 방문자</Text>
          </View>
          {/* 무료체험 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#8B6A3E" }]}>{freeCount}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>무료체험 신청</Text>
          </View>
          {/* 유료결제 */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: "#0a7ea4" }]}>{paidCount}</Text>
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

        {/* 결제 신청 목록 */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>결제 신청 목록</Text>

        {isLoading && <ActivityIndicator color={colors.primary} style={{ marginVertical: 24 }} />}

        {!isLoading && (!payments || payments.length === 0) && (
          <Text style={[styles.emptyText, { color: colors.muted }]}>아직 신청 내역이 없습니다.</Text>
        )}

        {payments?.map((p: PaymentRecord) => {
          const si = STATUS_INFO[p.status];
          const isExpanded = expandedId === p.id;
          return (
            <View
              key={p.id}
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {/* 카드 헤더 - 탭하면 펼치기/접기 */}
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : p.id)}
                activeOpacity={0.85}
                style={styles.cardHeader}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>{p.senderName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: si.color + "22", borderColor: si.color }]}>
                      <Text style={[styles.statusText, { color: si.color }]}>{si.label}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardSubtitle, { color: colors.muted }]}>
                    {formatDate(p.createdAt)} · {p.amount === 0 ? "무료체험" : `${p.amount.toLocaleString()}원`}
                  </Text>
                </View>
                <Text style={[styles.expandIcon, { color: colors.muted }]}>{isExpanded ? "▲" : "▼"}</Text>
              </TouchableOpacity>

              {/* 펼쳐진 상세 정보 */}
              {isExpanded && (
                <View style={styles.cardBody}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.infoGrid}>
                    <InfoRow label="이름" value={p.senderName} colors={colors} />
                    <InfoRow label="연락처" value={p.contact} colors={colors} />
                    <InfoRow label="입금자명" value={p.depositorName} colors={colors} />
                    <InfoRow
                      label="결제금액"
                      value={p.amount === 0 ? "무료체험" : `${p.amount.toLocaleString()}원`}
                      colors={colors}
                    />
                    <InfoRow label="신청일시" value={formatDate(p.createdAt)} colors={colors} />
                    <InfoRow label="결제상태" value={si.label} valueColor={si.color} colors={colors} />
                    {p.memo ? <InfoRow label="메모" value={p.memo} colors={colors} /> : null}
                  </View>

                  {/* 메모 입력 */}
                  <TextInput
                    style={[styles.memoInput, {
                      borderColor: colors.border,
                      color: colors.foreground,
                      backgroundColor: colors.background,
                    }]}
                    placeholder="메모 입력 (선택)"
                    placeholderTextColor={colors.muted}
                    value={memoInputs[p.id] ?? p.memo ?? ""}
                    onChangeText={(t) => setMemoInputs(prev => ({ ...prev, [p.id]: t }))}
                    maxLength={200}
                    returnKeyType="done"
                  />

                  {/* 상태 변경 버튼 */}
                  <View style={styles.actionRow}>
                    {p.status !== "confirmed" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#22C55E22", borderColor: "#22C55E" }]}
                        onPress={() => handleUpdateStatus(p.id, "confirmed")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: "#22C55E" }]}>✓ 입금확인</Text>
                      </TouchableOpacity>
                    )}
                    {p.status !== "pending" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#F59E0B22", borderColor: "#F59E0B" }]}
                        onPress={() => handleUpdateStatus(p.id, "pending")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: "#F59E0B" }]}>↩ 입금대기</Text>
                      </TouchableOpacity>
                    )}
                    {p.status !== "rejected" && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: "#EF444422", borderColor: "#EF4444" }]}
                        onPress={() => handleUpdateStatus(p.id, "rejected")}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>✕ 취소</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

// ── 정보 행 컴포넌트 ──────────────────────────────────────────────
function InfoRow({
  label, value, valueColor, colors,
}: {
  label: string;
  value: string;
  valueColor?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoKey, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoVal, { color: valueColor ?? colors.foreground }]}>{value}</Text>
    </View>
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
