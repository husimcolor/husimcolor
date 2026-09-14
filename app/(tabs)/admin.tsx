import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { startOAuthLogin } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Tab = "운영" | "주문" | "고객" | "PDF·메일" | "예약" | "과거 신청" | "후기";
type LegacyStatus = "pending" | "confirmed" | "rejected";

const tabs: Tab[] = ["운영", "주문", "고객", "PDF·메일", "예약", "과거 신청", "후기"];
const bookingLabels: Record<string, string> = {
  pending_schedule: "일정 대기", change_requested: "변경 요청", scheduled: "예약 확정",
  completed: "완료", cancelled: "취소", no_show: "노쇼",
};
const legacyLabels: Record<LegacyStatus, string> = { pending: "입금 대기", confirmed: "입금 확인", rejected: "취소" };

function dateText(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function Badge({ text, tone = "neutral" }: { text: string; tone?: "good" | "warn" | "bad" | "neutral" }) {
  const color = { good: "#3f7b52", warn: "#9a6a12", bad: "#b5584f", neutral: "#64625b" }[tone];
  const bg = { good: "#e6f4e7", warn: "#fff3d9", bad: "#fdebe8", neutral: "#f0efea" }[tone];
  return <View style={[styles.badge, { backgroundColor: bg }]}><Text style={[styles.badgeText, { color }]}>{text}</Text></View>;
}

function Metric({ value, label, color = "#3f7b52" }: { value: number; label: string; color?: string }) {
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

export default function AdminScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("운영");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);
  const [memo, setMemo] = useState<Record<number, string>>({});
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const auth = trpc.auth.me.useQuery();
  const isAdmin = auth.data?.role === "admin";
  const secured = { enabled: isAdmin, retry: false };
  const dashboard = trpc.admin.dashboard.useQuery(undefined, secured);
  const orders = trpc.admin.orders.useQuery({ limit: 50 }, secured);
  const customers = trpc.admin.customers.useQuery({ limit: 50 }, secured);
  const customer = trpc.admin.customerDetail.useQuery({ customerId: customerId ?? 1 }, { ...secured, enabled: isAdmin && customerId !== null });
  const delivery = trpc.commerce.adminDelivery.list.useQuery({ limit: 50 }, secured);
  const bookings = trpc.admin.coachingBookings.useQuery({ limit: 50 }, secured);
  const legacy = trpc.admin.legacyPayments.useQuery({ limit: 100 }, secured);
  const reviews = trpc.admin.reviews.useQuery({ limit: 100 }, secured);
  const visits = trpc.visitors.stats.useQuery(undefined, secured);
  const tests = trpc.visitors.testStats.useQuery(undefined, secured);
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => router.replace("/(tabs)") });
  const updateLegacy = trpc.admin.updateLegacyPayment.useMutation({ onSuccess: () => { legacy.refetch(); dashboard.refetch(); } });
  const retryMail = trpc.commerce.adminDelivery.retry.useMutation({ onSuccess: () => delivery.refetch() });
  const updateBooking = trpc.admin.updateCoachingBooking.useMutation({ onSuccess: () => { bookings.refetch(); dashboard.refetch(); } });
  const deleteReview = trpc.admin.deleteReview.useMutation({ onSuccess: () => reviews.refetch() });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([auth.refetch(), dashboard.refetch(), orders.refetch(), customers.refetch(), delivery.refetch(), bookings.refetch(), legacy.refetch(), reviews.refetch(), visits.refetch(), tests.refetch(), customerId ? customer.refetch() : Promise.resolve()]);
    setRefreshing(false);
  };
  const updatePayment = (id: number, status: LegacyStatus) => Alert.alert("과거 신청 상태", `“${legacyLabels[status]}”으로 변경하시겠습니까?`, [
    { text: "취소", style: "cancel" }, { text: "변경", onPress: () => updateLegacy.mutate({ id, status, memo: memo[id] || undefined }) },
  ]);
  const confirmSchedule = (id: number) => {
    const value = schedule[id]?.trim();
    const scheduledAt = value ? new Date(value.replace(" ", "T")) : null;
    if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return Alert.alert("일시 형식", "예: 2026-10-01 14:00 형식으로 입력해 주세요.");
    updateBooking.mutate({ bookingId: id, status: "scheduled", scheduledAt });
  };
  const changeBookingStatus = (bookingId: number, status: "change_requested" | "completed" | "cancelled" | "no_show") => {
    Alert.alert("예약 상태 변경", `“${bookingLabels[status]}” 상태로 변경하시겠습니까?`, [
      { text: "취소", style: "cancel" }, { text: "변경", onPress: () => updateBooking.mutate({ bookingId, status }) },
    ]);
  };

  if (auth.isLoading) return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#3f7b52" /></View></ScreenContainer>;
  if (!auth.data) return (
    <ScreenContainer><View style={styles.center}>
      <Text style={[styles.deniedTitle, { color: colors.foreground }]}>운영자 로그인 필요</Text>
      <Text style={[styles.deniedBody, { color: colors.muted }]}>통합 관리자는 서버에 관리자 역할이 있는 운영자 계정에서만 열립니다.</Text>
      <TouchableOpacity style={styles.login} onPress={() => { void startOAuthLogin(); }}><Text style={styles.loginText}>운영자 로그인</Text></TouchableOpacity>
      <TouchableOpacity style={styles.outline} onPress={() => router.back()}><Text style={styles.outlineText}>돌아가기</Text></TouchableOpacity>
    </View></ScreenContainer>
  );
  if (!isAdmin) return (
    <ScreenContainer><View style={styles.center}>
      <Text style={[styles.deniedTitle, { color: colors.foreground }]}>접근 권한이 없습니다</Text>
      <Text style={[styles.deniedBody, { color: colors.muted }]}>이 계정에는 통합 관리자 역할이 설정되어 있지 않습니다.</Text>
      <TouchableOpacity style={styles.outline} onPress={() => router.back()}><Text style={styles.outlineText}>돌아가기</Text></TouchableOpacity>
    </View></ScreenContainer>
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#3f7b52" />}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: colors.muted }]}>HUSIMCOLOR OPERATIONS</Text><Text style={[styles.title, { color: colors.foreground }]}>통합 관리자</Text><Text style={[styles.subtitle, { color: colors.muted }]}>고객 · 주문 · 결과 · PDF · 이메일 · 예약</Text></View>
          <TouchableOpacity style={styles.logout} onPress={() => logout.mutate()}><Text style={styles.logoutText}>로그아웃</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>

        {tab === "운영" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>오늘의 운영 신호</Text>
          <View style={styles.grid}>
            <Metric value={dashboard.data?.paidOrders ?? 0} label="결제 완료 주문" />
            <Metric value={dashboard.data?.startedAnalyses ?? 0} label="검사 진행 중" color="#4d6f9f" />
            <Metric value={dashboard.data?.failedDocuments ?? 0} label="PDF 실패" color="#b5584f" />
            <Metric value={dashboard.data?.failedEmails ?? 0} label="메일 실패" color="#b5584f" />
            <Metric value={dashboard.data?.pendingBookings ?? 0} label="예약 일정 대기" color="#b58c2c" />
            <Metric value={dashboard.data?.legacyPending ?? 0} label="과거 입금 대기" color="#b58c2c" />
          </View>
          <Text style={[styles.section, { color: colors.foreground }]}>기존 체험 지표</Text>
          <View style={styles.grid}>
            <Metric value={visits.data?.totalVisitors ?? 0} label="고유 방문 기기" />
            <Metric value={tests.data?.freeStart ?? 0} label="무료 시작" color="#b58c2c" />
            <Metric value={tests.data?.deepResult ?? 0} label="개인 심화 결과" color="#4d6f9f" />
            <Metric value={tests.data?.coupleResult ?? 0} label="관계 결과" />
          </View>
          <Panel><Text style={styles.noticeTitle}>공개 운영 상태</Text><Text style={styles.noticeText}>유료 분석은 정식 오픈 준비중을 유지합니다. 이 화면은 분석 문구·결과·PDF·공유 내용을 수정하지 않고 운영 상태만 추적합니다.</Text></Panel>
        </>}

        {tab === "주문" && <><Text style={[styles.section, { color: colors.foreground }]}>최근 주문</Text>{orders.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={item.status} tone={item.status === "paid" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.orderNumber} · {dateText(item.createdAt)}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · {item.finalAmountKrw.toLocaleString()}원 · {item.provider ?? "결제 대기"}</Text></Panel>)}</>}

        {tab === "고객" && <><Text style={[styles.section, { color: colors.foreground }]}>고객·회원 연결</Text><Text style={[styles.helper, { color: colors.muted }]}>이메일은 마스킹해 표시합니다. 행을 누르면 주문·이용권·검사·문서·예약 이력 수를 볼 수 있습니다.</Text>{customers.data?.map((item) => <TouchableOpacity key={item.id} onPress={() => setCustomerId(item.id)}><Panel><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.emailMasked}</Text><Badge text={item.userId ? "회원 연결" : "비회원"} tone={item.userId ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>주문 {item.orderCount}건 · 최근 주문 {dateText(item.latestOrderAt)}</Text></Panel></TouchableOpacity>)}{customer.data && <Panel><Text style={styles.noticeTitle}>{customer.data.customer.emailMasked} 고객 흐름</Text><Text style={styles.noticeText}>주문 {customer.data.orders.length} · 이용권 {customer.data.entitlements.length} · 검사 {customer.data.analysisRuns.length} · PDF {customer.data.privateDocuments.length} · 이메일 {customer.data.emailOutbox.length} · 예약 {customer.data.coachingBookings.length}</Text></Panel>}</>}

        {tab === "PDF·메일" && <><Text style={[styles.section, { color: colors.foreground }]}>Private PDF·이메일 Outbox</Text><Text style={[styles.helper, { color: colors.muted }]}>실패 건만 재시도하며, PDF 본문·분석 결과·공유 스냅샷은 수정하지 않습니다.</Text>{delivery.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>주문 #{item.orderId ?? "—"} · 문서 #{item.privateDocumentId ?? "—"}</Text><Badge text={item.status} tone={item.status === "sent" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>시도 {item.attemptCount}회 · 다음 시도 {dateText(item.nextAttemptAt)}</Text>{item.status === "failed" && <TouchableOpacity style={styles.action} onPress={() => retryMail.mutate({ outboxId: item.id })}><Text style={styles.actionText}>발송 재시도</Text></TouchableOpacity>}</Panel>)}</>}

        {tab === "예약" && <><Text style={[styles.section, { color: colors.foreground }]}>코칭 예약 운영</Text><Text style={[styles.helper, { color: colors.muted }]}>홈페이지 판매 화면은 아직 열지 않습니다. 결제 완료 코칭 주문은 일정 대기로 생성되어 운영자가 확정합니다.</Text>{bookings.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={bookingLabels[item.status] ?? item.status} tone={item.status === "completed" ? "good" : item.status === "cancelled" || item.status === "no_show" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · {item.orderNumber}</Text><Text style={[styles.meta, { color: colors.muted }]}>확정 일시 {dateText(item.scheduledAt)} · {item.sessionMode === "online" ? "온라인" : item.sessionMode === "in_person" ? "대면" : "방식 미정"}</Text>{(item.status === "pending_schedule" || item.status === "change_requested") && <><TextInput value={schedule[item.id] ?? ""} onChangeText={(value) => setSchedule((old) => ({ ...old, [item.id]: value }))} placeholder="예: 2026-10-01 14:00" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}><TouchableOpacity style={styles.action} onPress={() => confirmSchedule(item.id)}><Text style={styles.actionText}>일정 확정</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View></>}{item.status === "scheduled" && <View style={styles.actions}><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "completed")}><Text style={styles.smallActionText}>완료</Text></TouchableOpacity><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "change_requested")}><Text style={styles.smallActionText}>변경 요청</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "no_show")}><Text style={styles.dangerActionText}>노쇼</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View>}</Panel>)}</>}

        {tab === "과거 신청" && <><Text style={[styles.section, { color: colors.foreground }]}>과거 신청·수동입금 기록</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 기록은 삭제하거나 새 주문으로 자동 이관하지 않습니다. 상태 변경만 감사 로그로 보존합니다.</Text>{legacy.data?.map((item) => { const open = expandedPaymentId === item.id; return <Panel key={item.id}><TouchableOpacity style={styles.row} onPress={() => setExpandedPaymentId(open ? null : item.id)}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.senderName}</Text><Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)} · {item.amount ? `${item.amount.toLocaleString()}원` : "무료체험"}</Text></View><Badge text={legacyLabels[item.status]} tone={item.status === "confirmed" ? "good" : item.status === "rejected" ? "bad" : "warn"} /></TouchableOpacity>{open && <View style={styles.expanded}><Text style={[styles.meta, { color: colors.muted }]}>연락처 {item.contact} · 입금자명 {item.depositorName}</Text><TextInput value={memo[item.id] ?? item.memo ?? ""} onChangeText={(value) => setMemo((old) => ({ ...old, [item.id]: value }))} placeholder="운영 메모" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}>{(["confirmed", "pending", "rejected"] as LegacyStatus[]).map((status) => <TouchableOpacity key={status} style={status === "rejected" ? styles.dangerAction : styles.smallAction} onPress={() => updatePayment(item.id, status)}><Text style={status === "rejected" ? styles.dangerActionText : styles.smallActionText}>{legacyLabels[status]}</Text></TouchableOpacity>)}</View></View>}</Panel>; })}</>}

        {tab === "후기" && <><Text style={[styles.section, { color: colors.foreground }]}>후기 관리</Text>{reviews.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.nickname} · {"★".repeat(item.rating)}</Text><TouchableOpacity onPress={() => Alert.alert("후기 삭제", "이 후기를 삭제하시겠습니까?", [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: () => deleteReview.mutate({ id: item.id }) }])}><Text style={styles.delete}>삭제</Text></TouchableOpacity></View>{item.content && <Text style={[styles.review, { color: colors.muted }]}>{item.content}</Text>}<Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)}</Text></Panel>)}</>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 },
  deniedTitle: { fontSize: 22, fontWeight: "800" }, deniedBody: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  login: { backgroundColor: "#3f7b52", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11 }, loginText: { color: "#fff", fontWeight: "800" },
  outline: { borderWidth: 1, borderColor: "#3f7b52", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 }, outlineText: { color: "#3f7b52", fontWeight: "800" },
  container: { padding: 18, paddingBottom: 72, gap: 12 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, title: { fontSize: 25, fontWeight: "800", marginTop: 4 }, subtitle: { fontSize: 12, marginTop: 4 },
  logout: { borderWidth: 1, borderColor: "#d99a93", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }, logoutText: { color: "#b5584f", fontSize: 12, fontWeight: "800" },
  tabs: { gap: 7, paddingVertical: 4 }, tab: { borderWidth: 1, borderColor: "#d9d5cb", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: "#fbfaf6" }, tabActive: { backgroundColor: "#3f7b52", borderColor: "#3f7b52" }, tabText: { color: "#64625b", fontSize: 12, fontWeight: "700" }, tabTextActive: { color: "#fff" },
  section: { fontSize: 17, fontWeight: "800", marginTop: 8 }, helper: { fontSize: 12, lineHeight: 18, marginTop: -5 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metric: { width: "31.8%", minHeight: 92, borderWidth: 1, borderColor: "#ded9ce", backgroundColor: "#fbfaf6", borderRadius: 15, alignItems: "center", justifyContent: "center", padding: 7 }, metricValue: { fontSize: 25, fontWeight: "800" }, metricLabel: { fontSize: 10, textAlign: "center", color: "#77736a", marginTop: 5 },
  panel: { borderWidth: 1, borderColor: "#ded9ce", backgroundColor: "#fbfaf6", borderRadius: 15, padding: 14, gap: 7 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }, cardTitle: { fontSize: 14, fontWeight: "800", flexShrink: 1 }, meta: { fontSize: 11, lineHeight: 17 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 10, fontWeight: "800" }, noticeTitle: { color: "#3f7b52", fontSize: 14, fontWeight: "800" }, noticeText: { color: "#55705a", fontSize: 12, lineHeight: 19 },
  action: { alignSelf: "flex-start", backgroundColor: "#3f7b52", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, actionText: { color: "#fff", fontSize: 12, fontWeight: "800" }, input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontSize: 12 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, smallAction: { borderWidth: 1, borderColor: "#a9c8ae", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, smallActionText: { color: "#3f7b52", fontSize: 11, fontWeight: "800" }, dangerAction: { borderWidth: 1, borderColor: "#e3aaa3", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, dangerActionText: { color: "#b5584f", fontSize: 11, fontWeight: "800" },
  expanded: { borderTopWidth: 1, borderTopColor: "#ded9ce", paddingTop: 10, gap: 8 }, delete: { color: "#b5584f", fontSize: 11, fontWeight: "800" }, review: { fontSize: 12, lineHeight: 18 },
});
