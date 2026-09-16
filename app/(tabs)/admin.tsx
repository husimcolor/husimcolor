import { useEffect, useState } from "react";
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
import { getApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Tab = "운영 홈" | "고객·회원" | "주문·결제" | "검사·결과" | "PDF·이메일" | "상품·쿠폰" | "코칭예약" | "문의" | "레거시" | "통계·리뷰" | "Preview 검증";
type LegacyStatus = "pending" | "confirmed" | "rejected";

const tabs: Tab[] = ["운영 홈", "고객·회원", "주문·결제", "검사·결과", "PDF·이메일", "상품·쿠폰", "코칭예약", "문의", "레거시", "통계·리뷰", "Preview 검증"];
const bookingLabels: Record<string, string> = {
  pending_schedule: "일정 대기", change_requested: "변경 요청", scheduled: "예약 확정",
  completed: "완료", cancelled: "취소", no_show: "노쇼",
};
const legacyLabels: Record<LegacyStatus, string> = { pending: "입금 대기", confirmed: "입금 확인", rejected: "취소" };
const inquiryTypeLabels: Record<string, string> = { payment_refund: "결제·환불", analysis_result: "검사·결과", pdf_email: "PDF·이메일", coaching_booking: "코칭예약", other: "기타" };
const inquiryStatusLabels: Record<string, string> = { received: "접수", reviewing: "확인", answered: "답변완료" };

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
  const [tab, setTab] = useState<Tab>("운영 홈");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);
  const [memo, setMemo] = useState<Record<number, string>>({});
  const [schedule, setSchedule] = useState<Record<number, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [legacyAdmin, setLegacyAdmin] = useState(false);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const apiBaseUrl = getApiBaseUrl();

  const refreshLegacySession = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/legacy-admin-session`, { credentials: "include" });
      const payload = await response.json() as { authenticated?: boolean };
      setLegacyAdmin(payload.authenticated === true);
    } catch { setLegacyAdmin(false); } finally { setLegacyLoading(false); }
  };

  useEffect(() => { void refreshLegacySession(); }, []);

  const loginWithLegacyPassword = async () => {
    setPasswordError(false);
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/legacy-admin-login`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const payload = await response.json() as { authenticated?: boolean };
      if (response.ok && payload.authenticated) { setLegacyAdmin(true); setPassword(""); } else { setPasswordError(true); setPassword(""); }
    } catch { setPasswordError(true); }
  };

  const logoutLegacyAdmin = async () => {
    await fetch(`${apiBaseUrl}/api/auth/legacy-admin-logout`, { method: "POST", credentials: "include" });
    setLegacyAdmin(false);
    setPassword("");
  };

  const auth = trpc.auth.me.useQuery();
  const isAdmin = auth.data?.role === "admin";
  const hasAdminAccess = isAdmin || legacyAdmin;
  const secured = { enabled: hasAdminAccess, retry: false };
  const dashboard = trpc.admin.dashboard.useQuery(undefined, secured);
  const orders = trpc.admin.orders.useQuery({ limit: 50 }, secured);
  const previewVerification = trpc.admin.previewVerification.useQuery(undefined, secured);
  const customers = trpc.admin.customers.useQuery({ limit: 50 }, secured);
  const customer = trpc.admin.customerDetail.useQuery({ customerId: customerId ?? 1 }, { ...secured, enabled: isAdmin && customerId !== null });
  const delivery = trpc.commerce.adminDelivery.list.useQuery({ limit: 50 }, secured);
  const bookings = trpc.admin.coachingBookings.useQuery({ limit: 50 }, secured);
  const supportTickets = trpc.admin.supportTickets.useQuery({ limit: 100 }, secured);
  const coupons = trpc.admin.coupons.useQuery({ limit: 100 }, secured);
  const legacy = trpc.admin.legacyPayments.useQuery({ limit: 100 }, secured);
  const reviews = trpc.admin.reviews.useQuery({ limit: 100 }, secured);
  const visits = trpc.visitors.stats.useQuery(undefined, secured);
  const tests = trpc.visitors.testStats.useQuery(undefined, secured);
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => router.replace("/(tabs)") });
  const updateLegacy = trpc.admin.updateLegacyPayment.useMutation({ onSuccess: () => { legacy.refetch(); dashboard.refetch(); } });
  const retryMail = trpc.commerce.adminDelivery.retry.useMutation({ onSuccess: () => delivery.refetch() });
  const updateBooking = trpc.admin.updateCoachingBooking.useMutation({ onSuccess: () => { bookings.refetch(); dashboard.refetch(); } });
  const updateSupportTicket = trpc.admin.updateSupportTicket.useMutation({ onSuccess: () => supportTickets.refetch() });
  const deleteReview = trpc.admin.deleteReview.useMutation({ onSuccess: () => reviews.refetch() });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([auth.refetch(), dashboard.refetch(), orders.refetch(), previewVerification.refetch(), customers.refetch(), delivery.refetch(), bookings.refetch(), supportTickets.refetch(), coupons.refetch(), legacy.refetch(), reviews.refetch(), visits.refetch(), tests.refetch(), customerId ? customer.refetch() : Promise.resolve()]);
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

  if (auth.isLoading || legacyLoading) return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#3f7b52" /></View></ScreenContainer>;
  if (!hasAdminAccess) return (
    <ScreenContainer><View style={styles.center}>
      <Text style={[styles.deniedTitle, { color: colors.foreground }]}>통합 관리자 로그인</Text>
      <Text style={[styles.deniedBody, { color: colors.muted }]}>로고 5회 터치로 열리는 기존 관리자 비밀번호를 입력해 주세요. 로그인 후에는 서버 서명된 통합 관리자 세션으로 안전하게 운영 화면에 접근합니다.</Text>
      <TextInput value={password} onChangeText={(value) => { setPassword(value); setPasswordError(false); }} onSubmitEditing={() => { void loginWithLegacyPassword(); }} placeholder="관리자 비밀번호" placeholderTextColor={colors.muted} secureTextEntry autoFocus style={[styles.input, styles.passwordInput, { color: colors.foreground, borderColor: passwordError ? "#b5584f" : colors.border, backgroundColor: colors.background }]} />
      {passwordError && <Text style={styles.passwordError}>비밀번호가 올바르지 않거나 관리자 세션을 만들 수 없습니다.</Text>}
      <TouchableOpacity style={styles.login} onPress={() => { void loginWithLegacyPassword(); }}><Text style={styles.loginText}>비밀번호로 로그인</Text></TouchableOpacity>
      <TouchableOpacity style={styles.outline} onPress={() => router.back()}><Text style={styles.outlineText}>돌아가기</Text></TouchableOpacity>
    </View></ScreenContainer>
  );

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#3f7b52" />}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: colors.muted }]}>HUSIMCOLOR OPERATIONS</Text><Text style={[styles.title, { color: colors.foreground }]}>통합 관리자</Text><Text style={[styles.subtitle, { color: colors.muted }]}>고객 · 주문 · 결과 · PDF · 이메일 · 예약</Text></View>
          <TouchableOpacity style={styles.logout} onPress={() => legacyAdmin ? void logoutLegacyAdmin() : logout.mutate()}><Text style={styles.logoutText}>로그아웃</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>

        {tab === "운영 홈" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>오늘의 운영 신호</Text>
          <View style={styles.grid}>
            <Metric value={dashboard.data?.paidOrders ?? 0} label="결제 완료 주문" />
            <Metric value={dashboard.data?.paidWebOrders ?? 0} label="홈페이지 결제 완료" color="#4d6f9f" />
            <Metric value={dashboard.data?.paidAppOrders ?? 0} label="앱 결제 완료" color="#4d6f9f" />
            <Metric value={dashboard.data?.testOrders ?? 0} label="테스트 주문 (매출 제외)" color="#8a7a68" />
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

        {tab === "주문·결제" && <><Text style={[styles.section, { color: colors.foreground }]}>주문·결제</Text><Text style={[styles.helper, { color: colors.muted }]}>고객 → 주문 → 결제 → 이용권 흐름의 공통 원장을 표시합니다. 이메일은 마스킹됩니다.</Text>{orders.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={item.status} tone={item.status === "paid" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.orderNumber} · {dateText(item.createdAt)}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · 결제 {item.finalAmountKrw.toLocaleString()}원 · 할인 {item.discountAmountKrw.toLocaleString()}원 · {item.provider ?? "결제 대기"} · {item.channel === "web" ? "홈페이지 유입" : "앱 유입"}{item.isTest ? " · 테스트 주문(매출 제외)" : ""}</Text><Text style={[styles.meta, { color: colors.muted }]}>결제 상태 {item.paymentStatus ?? "—"} · 이용권 {item.entitlementStatus ?? "—"}</Text></Panel>)}</>}

        {tab === "Preview 검증" && <><Text style={[styles.section, { color: colors.foreground }]}>Preview 원장 검증</Text><Text style={[styles.helper, { color: colors.muted }]}>Preview·관리자 역할에서만 테스트 주문과 인증·문의 Outbox 상태를 마스킹하여 조회합니다. 이 화면에는 수정·재발송·다운로드 기능이 없습니다.</Text>{previewVerification.data?.available === false && <Panel><Text style={styles.noticeTitle}>Preview 환경에서만 사용할 수 있습니다</Text><Text style={styles.noticeText}>Production에서는 검증 데이터가 반환되지 않습니다.</Text></Panel>}{previewVerification.data?.available && <><Text style={[styles.section, { color: colors.foreground }]}>테스트 주문</Text>{previewVerification.data.testOrders.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={item.status} tone={item.status === "paid" ? "good" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.orderNumber} · {item.customerEmailMasked} · {item.channel === "web" ? "홈페이지 유입" : "앱 유입"}</Text><Text style={[styles.meta, { color: colors.muted }]}>결제 {item.paymentStatus ?? "—"} · 이용권 {item.entitlementStatus ?? "—"} · {dateText(item.createdAt)}</Text></Panel>)}{previewVerification.data.testOrders.length === 0 && <Panel><Text style={styles.noticeText}>표시할 테스트 주문이 없습니다.</Text></Panel>}<Text style={[styles.section, { color: colors.foreground }]}>인증·문의 Outbox</Text>{previewVerification.data.outbox.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.purpose === "account_link" ? "이력 연결 인증" : "고객 문의 알림"}</Text><Badge text={item.status} tone={item.status === "sent" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.recipientEmailMasked} · 시도 {item.attemptCount}회 · {dateText(item.sentAt ?? item.createdAt)}</Text>{item.lastErrorCode && <Text style={[styles.meta, { color: "#b5584f" }]}>오류 코드 {item.lastErrorCode}</Text>}</Panel>)}{previewVerification.data.outbox.length === 0 && <Panel><Text style={styles.noticeText}>표시할 인증·문의 Outbox가 없습니다.</Text></Panel>}</>}</>}

        {tab === "고객·회원" && <><Text style={[styles.section, { color: colors.foreground }]}>고객·회원</Text><Text style={[styles.helper, { color: colors.muted }]}>이메일은 마스킹해 표시합니다. 행을 누르면 공통 원장의 고객 흐름 수를 확인할 수 있습니다.</Text>{customers.data?.map((item) => <TouchableOpacity key={item.id} onPress={() => setCustomerId(item.id)}><Panel><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.emailMasked}</Text><Badge text={item.userId ? "회원 연결" : "비회원"} tone={item.userId ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>주문 {item.orderCount}건 · 최근 주문 {dateText(item.latestOrderAt)}</Text></Panel></TouchableOpacity>)}{customer.data && <Panel><Text style={styles.noticeTitle}>{customer.data.customer.emailMasked} 고객 흐름</Text><Text style={styles.noticeText}>주문 {customer.data.orders.length} · 이용권 {customer.data.entitlements.length} · 검사 {customer.data.analysisRuns.length} · PDF {customer.data.privateDocuments.length} · 이메일 {customer.data.emailOutbox.length} · 예약 {customer.data.coachingBookings.length}</Text></Panel>}</>}

        {tab === "검사·결과" && <><Text style={[styles.section, { color: colors.foreground }]}>검사·결과</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 검사 결과 원문과 공유 스냅샷은 수정하지 않습니다. 고객 행을 선택하면 검사·PDF 보관 건수를 확인할 수 있습니다.</Text>{customers.data?.map((item) => <TouchableOpacity key={`analysis-${item.id}`} onPress={() => setCustomerId(item.id)}><Panel><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.emailMasked}</Text><Text style={[styles.meta, { color: colors.muted }]}>주문 {item.orderCount}건 · 검사·결과·PDF 이력은 고객 흐름에서 확인</Text></Panel></TouchableOpacity>)}{customer.data && <Panel><Text style={styles.noticeTitle}>선택 고객의 검사·결과 보관 현황</Text><Text style={styles.noticeText}>검사 {customer.data.analysisRuns.length} · PDF {customer.data.privateDocuments.length} · 발송 기록 {customer.data.emailOutbox.length}</Text></Panel>}</>}

        {tab === "PDF·이메일" && <><Text style={[styles.section, { color: colors.foreground }]}>Private PDF·이메일 Outbox</Text><Text style={[styles.helper, { color: colors.muted }]}>실패 건만 재시도하며, PDF 본문·분석 결과·공유 스냅샷은 수정하지 않습니다.</Text>{delivery.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>주문 #{item.orderId ?? "—"} · 문서 #{item.privateDocumentId ?? "—"}</Text><Badge text={item.status} tone={item.status === "sent" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>시도 {item.attemptCount}회 · 다음 시도 {dateText(item.nextAttemptAt)}</Text>{item.status === "failed" && <TouchableOpacity style={styles.action} onPress={() => retryMail.mutate({ outboxId: item.id })}><Text style={styles.actionText}>발송 재시도</Text></TouchableOpacity>}</Panel>)}</>}

        {tab === "상품·쿠폰" && <><Text style={[styles.section, { color: colors.foreground }]}>상품·쿠폰</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 상품 가격·쿠폰 할인 규칙은 변경하지 않고 사용·예약 상태만 조회합니다.</Text>{coupons.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.code}</Text><Badge text={item.status} tone={item.status === "active" ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.discountType === "percent" ? `${item.discountValue}% 할인` : `${item.discountValue.toLocaleString()}원 할인`} · 사용 {item.redemptionCount}건 · 예약 {item.reservedCount}건</Text><Text style={[styles.meta, { color: colors.muted }]}>종료 {dateText(item.endsAt)}</Text></Panel>)}{!coupons.data?.length && <Panel><Text style={styles.noticeText}>등록된 쿠폰이 없습니다.</Text></Panel>}</>}

        {tab === "코칭예약" && <><Text style={[styles.section, { color: colors.foreground }]}>코칭 예약 운영</Text><Text style={[styles.helper, { color: colors.muted }]}>결제 완료 코칭 주문은 일정 대기로 생성되어 운영자가 확정합니다.</Text>{bookings.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={bookingLabels[item.status] ?? item.status} tone={item.status === "completed" ? "good" : item.status === "cancelled" || item.status === "no_show" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · {item.orderNumber}</Text><Text style={[styles.meta, { color: colors.muted }]}>확정 일시 {dateText(item.scheduledAt)} · {item.sessionMode === "online" ? "온라인" : item.sessionMode === "in_person" ? "대면" : "방식 미정"}</Text>{(item.status === "pending_schedule" || item.status === "change_requested") && <><TextInput value={schedule[item.id] ?? ""} onChangeText={(value) => setSchedule((old) => ({ ...old, [item.id]: value }))} placeholder="예: 2026-10-01 14:00" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}><TouchableOpacity style={styles.action} onPress={() => confirmSchedule(item.id)}><Text style={styles.actionText}>일정 확정</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View></>}{item.status === "scheduled" && <View style={styles.actions}><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "completed")}><Text style={styles.smallActionText}>완료</Text></TouchableOpacity><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "change_requested")}><Text style={styles.smallActionText}>변경 요청</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "no_show")}><Text style={styles.dangerActionText}>노쇼</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View>}</Panel>)}</>}

        {tab === "문의" && <><Text style={[styles.section, { color: colors.foreground }]}>1:1 문의</Text><Text style={[styles.helper, { color: colors.muted }]}>이름·이메일은 기본 마스킹됩니다. 내용은 서버 관리자 권한에서만 확인하며 이메일 답변은 기존 support 메일함에서 처리합니다.</Text>{supportTickets.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{inquiryTypeLabels[item.inquiryType] ?? item.inquiryType} · {item.subject}</Text><Badge text={inquiryStatusLabels[item.status] ?? item.status} tone={item.status === "answered" ? "good" : item.status === "reviewing" ? "warn" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.nameMasked} · {item.emailMasked} · {dateText(item.createdAt)}</Text><Text style={[styles.review, { color: colors.muted }]}>{item.message}</Text><View style={styles.actions}>{(["received", "reviewing", "answered"] as const).map((status) => <TouchableOpacity key={status} style={styles.smallAction} disabled={updateSupportTicket.isPending || item.status === status} onPress={() => updateSupportTicket.mutate({ id: item.id, status })}><Text style={styles.smallActionText}>{inquiryStatusLabels[status]}</Text></TouchableOpacity>)}</View></Panel>)}{!supportTickets.data?.length && <Panel><Text style={styles.noticeText}>접수된 문의가 없습니다.</Text></Panel>}</>}

        {tab === "레거시" && <><Text style={[styles.section, { color: colors.foreground }]}>과거 신청·수동입금 기록</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 기록은 삭제하거나 새 주문으로 자동 이관하지 않습니다. 상태 변경만 감사 로그로 보존합니다.</Text>{legacy.data?.map((item) => { const open = expandedPaymentId === item.id; return <Panel key={item.id}><TouchableOpacity style={styles.row} onPress={() => setExpandedPaymentId(open ? null : item.id)}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.senderName}</Text><Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)} · {item.amount ? `${item.amount.toLocaleString()}원` : "무료체험"}</Text></View><Badge text={legacyLabels[item.status]} tone={item.status === "confirmed" ? "good" : item.status === "rejected" ? "bad" : "warn"} /></TouchableOpacity>{open && <View style={styles.expanded}><Text style={[styles.meta, { color: colors.muted }]}>연락처 {item.contact} · 입금자명 {item.depositorName}</Text><TextInput value={memo[item.id] ?? item.memo ?? ""} onChangeText={(value) => setMemo((old) => ({ ...old, [item.id]: value }))} placeholder="운영 메모" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}>{(["confirmed", "pending", "rejected"] as LegacyStatus[]).map((status) => <TouchableOpacity key={status} style={status === "rejected" ? styles.dangerAction : styles.smallAction} onPress={() => updatePayment(item.id, status)}><Text style={status === "rejected" ? styles.dangerActionText : styles.smallActionText}>{legacyLabels[status]}</Text></TouchableOpacity>)}</View></View>}</Panel>; })}</>}

        {tab === "통계·리뷰" && <><Text style={[styles.section, { color: colors.foreground }]}>기존 통계</Text><View style={styles.grid}><Metric value={visits.data?.totalVisitors ?? 0} label="고유 방문 기기" /><Metric value={tests.data?.freeStart ?? 0} label="무료 시작" color="#b58c2c" /><Metric value={tests.data?.deepResult ?? 0} label="개인 심화 결과" color="#4d6f9f" /><Metric value={tests.data?.coupleResult ?? 0} label="관계 결과" /></View><Text style={[styles.section, { color: colors.foreground }]}>후기 관리</Text>{reviews.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.nickname} · {"★".repeat(item.rating)}</Text><TouchableOpacity onPress={() => Alert.alert("후기 삭제", "이 후기를 삭제하시겠습니까?", [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: () => deleteReview.mutate({ id: item.id }) }])}><Text style={styles.delete}>삭제</Text></TouchableOpacity></View>{item.content && <Text style={[styles.review, { color: colors.muted }]}>{item.content}</Text>}<Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)}</Text></Panel>)}</>}
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
  action: { alignSelf: "flex-start", backgroundColor: "#3f7b52", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, actionText: { color: "#fff", fontSize: 12, fontWeight: "800" }, input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontSize: 12 }, passwordInput: { width: "100%", maxWidth: 320 }, passwordError: { color: "#b5584f", fontSize: 12, textAlign: "center" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, smallAction: { borderWidth: 1, borderColor: "#a9c8ae", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, smallActionText: { color: "#3f7b52", fontSize: 11, fontWeight: "800" }, dangerAction: { borderWidth: 1, borderColor: "#e3aaa3", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, dangerActionText: { color: "#b5584f", fontSize: 11, fontWeight: "800" },
  expanded: { borderTopWidth: 1, borderTopColor: "#ded9ce", paddingTop: 10, gap: 8 }, delete: { color: "#b5584f", fontSize: 11, fontWeight: "800" }, review: { fontSize: 12, lineHeight: 18 },
});
