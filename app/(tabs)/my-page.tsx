import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { startKakaoLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

const orderStatus: Record<string, string> = {
  pending: "결제 대기", processing: "결제 확인 중", paid: "결제 완료", failed: "결제 실패",
  cancelled: "취소", expired: "만료", refunded: "환불",
};
const entitlementStatus: Record<string, string> = {
  active: "사용 가능", reserved: "사용 예약", consumed: "사용 완료", revoked: "사용 중지", expired: "만료",
};
const analysisStatus: Record<string, string> = { started: "분석 진행 중", completed: "분석 완료", expired: "만료", deleted: "삭제됨" };
const bookingStatus: Record<string, string> = {
  pending_schedule: "일정 확인 중", change_requested: "일정 변경 요청", scheduled: "예약 확정",
  completed: "진행 완료", cancelled: "취소", no_show: "노쇼",
};

function dateText(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

export default function MyPageScreen() {
  const router = useRouter();
  const colors = useColors();
  const auth = useAuth();
  const kakao = trpc.auth.kakaoStatus.useQuery();
  const dashboard = trpc.commerce.account.memberDashboard.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
  });

  const beginKakaoLogin = () => {
    if (!kakao.data?.enabled) {
      Alert.alert("카카오 로그인 준비 중", "안전한 연결 검증이 끝나면 카카오 로그인을 이용하실 수 있습니다.");
      return;
    }
    startKakaoLogin("/my-page");
  };

  if (auth.loading) {
    return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#557a59" /></View></ScreenContainer>;
  }

  if (!auth.isAuthenticated) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={[styles.title, { color: colors.foreground }]}>내 분석 · 마이페이지</Text>
          <Text style={[styles.body, { color: colors.muted }]}>카카오로 로그인하면 연결된 주문, 이용권, 분석 진행 상태와 코칭 예약을 한곳에서 확인할 수 있습니다.</Text>
          <TouchableOpacity style={[styles.kakaoButton, !kakao.data?.enabled && styles.disabledButton]} onPress={beginKakaoLogin} activeOpacity={0.85}>
            <Text style={styles.kakaoButtonText}>{kakao.data?.enabled ? "카카오로 시작하기" : "카카오 로그인 준비 중"}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>돌아가기</Text></TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const data = dashboard.data;
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: colors.primary }]}>HUSIMCOLOR MEMBER</Text><Text style={[styles.title, { color: colors.foreground }]}>{auth.user?.name || "회원"}님의 마이페이지</Text><Text style={[styles.body, { color: colors.muted }]}>주문과 이용 이력을 안전하게 확인하세요.</Text></View>
          <TouchableOpacity onPress={() => auth.logout()} style={styles.logout}><Text style={styles.logoutText}>로그아웃</Text></TouchableOpacity>
        </View>

        {dashboard.isLoading ? <View style={styles.loading}><ActivityIndicator color="#557a59" /></View> : dashboard.error ? <View style={styles.card}><Text style={styles.errorText}>이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</Text></View> : <>
          <View style={styles.metrics}>
            <View style={styles.metric}><Text style={styles.metricValue}>{data?.summary.paidOrderCount ?? 0}</Text><Text style={styles.metricLabel}>결제 완료</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{data?.summary.activeEntitlementCount ?? 0}</Text><Text style={styles.metricLabel}>사용 가능 이용권</Text></View>
            <View style={styles.metric}><Text style={styles.metricValue}>{data?.summary.completedAnalysisCount ?? 0}</Text><Text style={styles.metricLabel}>완료 분석</Text></View>
          </View>
          {!data?.account.emailLinked && <View style={styles.notice}><Text style={styles.noticeTitle}>이전 구매 이력 연결</Text><Text style={styles.noticeBody}>카카오 이메일이 기존 구매 이메일과 다르면, 마이페이지에서 이메일 소유권 확인 후 이력을 연결할 수 있습니다.</Text></View>}

          <Section title="주문 내역">
            {data?.orders.length ? data.orders.map((order) => <View key={order.id} style={styles.card}><Text style={styles.cardTitle}>{order.productName}</Text><Text style={styles.meta}>{orderStatus[order.status] ?? order.status} · {order.finalAmountKrw.toLocaleString()}원 · {dateText(order.paidAt ?? order.createdAt)}</Text><Text style={styles.meta}>{order.channel === "web" ? "홈페이지 유입" : "앱 유입"}{order.isTest ? " · 테스트 주문(매출 제외)" : ""}</Text></View>) : <Text style={styles.empty}>연결된 주문이 아직 없습니다.</Text>}
          </Section>
          <Section title="이용권과 분석">
            {data?.entitlements.length ? data.entitlements.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{entitlementStatus[item.status] ?? item.status} · {item.usedCount}/{item.usageLimit}회 사용</Text></View>) : <Text style={styles.empty}>표시할 이용권이 없습니다.</Text>}
            {data?.analyses.map((item) => <View key={`analysis-${item.id}`} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{analysisStatus[item.status] ?? item.status} · {dateText(item.completedAt ?? item.startedAt)}</Text></View>)}
          </Section>
          <Section title="코칭 예약">
            {data?.coachingBookings.length ? data.coachingBookings.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{bookingStatus[item.status] ?? item.status} · {item.sessionMode === "online" ? "온라인" : item.sessionMode === "in_person" ? "대면" : "방식 확인 중"}</Text><Text style={styles.meta}>일정 {dateText(item.scheduledAt)}</Text></View>) : <Text style={styles.empty}>연결된 코칭 예약이 없습니다.</Text>}
          </Section>
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28, gap: 14 },
  container: { padding: 20, paddingBottom: 64, gap: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  eyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontSize: 23, fontWeight: "800", marginTop: 5 },
  body: { fontSize: 13, lineHeight: 20, textAlign: "center", maxWidth: 310 },
  logout: { borderWidth: 1, borderColor: "#d99a93", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  logoutText: { color: "#b5584f", fontSize: 12, fontWeight: "800" },
  kakaoButton: { backgroundColor: "#FEE500", borderRadius: 13, paddingHorizontal: 24, paddingVertical: 14, marginTop: 6 },
  disabledButton: { backgroundColor: "#dedbd2" },
  kakaoButtonText: { color: "#3b3422", fontSize: 15, fontWeight: "800" },
  backButton: { padding: 10 }, backText: { color: "#557a59", fontWeight: "800", fontSize: 13 },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, minHeight: 86, borderRadius: 14, borderWidth: 1, borderColor: "#ded9ce", backgroundColor: "#fbfaf6", alignItems: "center", justifyContent: "center", padding: 8 },
  metricValue: { color: "#3f7b52", fontSize: 24, fontWeight: "800" }, metricLabel: { color: "#77736a", fontSize: 10, textAlign: "center", marginTop: 5 },
  notice: { borderRadius: 14, backgroundColor: "#edf5eb", padding: 14, gap: 4 }, noticeTitle: { color: "#3f7b52", fontWeight: "800", fontSize: 14 }, noticeBody: { color: "#55705a", fontSize: 12, lineHeight: 18 },
  section: { gap: 8 }, sectionTitle: { color: "#3d3530", fontSize: 17, fontWeight: "800", marginTop: 8 },
  card: { borderWidth: 1, borderColor: "#ded9ce", backgroundColor: "#fbfaf6", borderRadius: 14, padding: 14, gap: 5 },
  cardTitle: { color: "#3d3530", fontSize: 14, fontWeight: "800" }, meta: { color: "#6c6860", fontSize: 12, lineHeight: 18 },
  empty: { color: "#8a857c", fontSize: 13, paddingVertical: 8 }, loading: { paddingVertical: 44 }, errorText: { color: "#b5584f", fontSize: 13 },
});
