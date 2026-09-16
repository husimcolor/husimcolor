import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
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
const inquiryTypes = ["payment_refund", "analysis_result", "pdf_email", "coaching_booking", "other"] as const;
type InquiryType = (typeof inquiryTypes)[number];
const inquiryTypeLabels: Record<InquiryType, string> = {
  payment_refund: "결제·환불", analysis_result: "검사·결과", pdf_email: "PDF·이메일", coaching_booking: "코칭예약", other: "기타",
};
const inquiryStatusLabels: Record<string, string> = { received: "접수", reviewing: "확인", answered: "답변완료" };

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
  const restorableClaim = trpc.commerce.account.restorableGuestClaim.useQuery(undefined, {
    enabled: auth.isAuthenticated,
    retry: false,
  });
  const [claimEmail, setClaimEmail] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [claimChallengeId, setClaimChallengeId] = useState<number | null>(null);
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryType, setInquiryType] = useState<InquiryType>("other");
  const [inquirySubject, setInquirySubject] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");
  useEffect(() => {
    if (restorableClaim.data?.challengeId) setClaimChallengeId(restorableClaim.data.challengeId);
  }, [restorableClaim.data?.challengeId]);
  useEffect(() => { if (auth.user?.name && !inquiryName) setInquiryName(auth.user.name); }, [auth.user?.name, inquiryName]);
  const requestClaim = trpc.commerce.account.requestGuestClaim.useMutation({
    onSuccess: (result) => {
      setClaimChallengeId(result.challengeId);
      Alert.alert("인증코드 발송", "입력하신 이메일로 6자리 인증코드를 보냈습니다. 메일함을 확인해 주세요.");
    },
    onError: () => Alert.alert("발송 실패", "인증코드를 보낼 수 없습니다. 이메일을 확인한 뒤 잠시 후 다시 시도해 주세요."),
  });
  const confirmClaim = trpc.commerce.account.confirmGuestClaim.useMutation({
    onSuccess: async (result) => {
      setClaimCode("");
      setClaimChallengeId(null);
      await dashboard.refetch();
      await restorableClaim.refetch();
      Alert.alert("이력 연결 완료", `기존 주문 ${result.linkedOrders}건을 현재 계정에 연결했습니다.`);
    },
    onError: () => Alert.alert("인증 실패", "인증코드가 올바르지 않거나 만료되었습니다. 다시 요청해 주세요."),
  });
  const submitInquiry = trpc.commerce.support.submitInquiry.useMutation({
    onSuccess: async () => { setInquirySubject(""); setInquiryMessage(""); await dashboard.refetch(); Alert.alert("문의 접수", "문의가 접수되었습니다. 답변은 입력하신 이메일로 안내드립니다."); },
    onError: () => Alert.alert("문의 접수 실패", "입력 내용을 확인한 뒤 다시 시도해 주세요."),
  });
  const downloadDocument = trpc.commerce.account.downloadPrivateDocument.useMutation({
    onSuccess: async (result) => { await Linking.openURL(result.url); },
    onError: () => Alert.alert("PDF를 열 수 없습니다", "보관기간이 지났거나 아직 생성 중입니다."),
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
          {!data?.account.emailLinked && <View style={styles.notice}><Text style={styles.noticeTitle}>이전 구매 이력 연결</Text><Text style={styles.noticeBody}>카카오 이메일이 기존 구매 이메일과 다르면, 해당 이메일의 인증코드 확인 후 이력을 연결할 수 있습니다.</Text><TextInput value={claimEmail} onChangeText={setClaimEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="기존 구매에 사용한 이메일" placeholderTextColor="#78907b" style={styles.input} /><TouchableOpacity style={styles.verifyButton} disabled={requestClaim.isPending || !claimEmail.trim()} onPress={() => requestClaim.mutate({ email: claimEmail.trim() })}><Text style={styles.verifyButtonText}>{requestClaim.isPending ? "발송 중…" : "인증코드 받기"}</Text></TouchableOpacity>{claimChallengeId && <><Text style={styles.noticeBody}>기존 인증 요청이 확인되었습니다. 받은 6자리 코드를 입력해 주세요.</Text><TextInput value={claimCode} onChangeText={(value) => setClaimCode(value.replace(/\D/g, "").slice(0, 6))} keyboardType="number-pad" placeholder="6자리 인증코드" placeholderTextColor="#78907b" style={styles.input} /><TouchableOpacity style={styles.verifyButton} disabled={confirmClaim.isPending || claimCode.length !== 6} onPress={() => confirmClaim.mutate({ challengeId: claimChallengeId, code: claimCode })}><Text style={styles.verifyButtonText}>{confirmClaim.isPending ? "확인 중…" : "이력 연결 확인"}</Text></TouchableOpacity></>}</View>}
          <View style={styles.notice}><Text style={styles.noticeTitle}>1:1 문의</Text><Text style={styles.noticeBody}>문의는 support@husimcolor.com으로 전달되며, 처리 상태는 아래 문의내역에서 확인할 수 있습니다.</Text><TextInput value={inquiryName} onChangeText={setInquiryName} placeholder="이름" placeholderTextColor="#78907b" style={styles.input} /><TextInput value={inquiryEmail} onChangeText={setInquiryEmail} autoCapitalize="none" keyboardType="email-address" placeholder="답변 받을 이메일" placeholderTextColor="#78907b" style={styles.input} /><View style={styles.typeRow}>{inquiryTypes.map((type) => <TouchableOpacity key={type} onPress={() => setInquiryType(type)} style={[styles.typeButton, inquiryType === type && styles.typeButtonActive]}><Text style={[styles.typeButtonText, inquiryType === type && styles.typeButtonTextActive]}>{inquiryTypeLabels[type]}</Text></TouchableOpacity>)}</View><TextInput value={inquirySubject} onChangeText={setInquirySubject} placeholder="문의 제목" placeholderTextColor="#78907b" style={styles.input} /><TextInput value={inquiryMessage} onChangeText={setInquiryMessage} multiline placeholder="문의 내용을 입력해 주세요." placeholderTextColor="#78907b" style={[styles.input, styles.messageInput]} /><TouchableOpacity style={styles.verifyButton} disabled={submitInquiry.isPending || !inquiryName.trim() || !inquiryEmail.trim() || inquirySubject.trim().length < 2 || inquiryMessage.trim().length < 10} onPress={() => submitInquiry.mutate({ name: inquiryName.trim(), email: inquiryEmail.trim(), inquiryType, subject: inquirySubject.trim(), message: inquiryMessage.trim() })}><Text style={styles.verifyButtonText}>{submitInquiry.isPending ? "접수 중…" : "문의 보내기"}</Text></TouchableOpacity></View>

          <Section title="주문 내역">
            {data?.orders.length ? data.orders.map((order) => <View key={order.id} style={styles.card}><Text style={styles.cardTitle}>{order.productName}</Text><Text style={styles.meta}>{orderStatus[order.status] ?? order.status} · 결제 {order.finalAmountKrw.toLocaleString()}원 · 할인 {order.discountAmountKrw.toLocaleString()}원 · {dateText(order.paidAt ?? order.createdAt)}</Text><Text style={styles.meta}>{order.channel === "web" ? "홈페이지 유입" : "앱 유입"}{order.isTest ? " · 테스트 주문(매출 제외)" : ""}</Text></View>) : <Text style={styles.empty}>연결된 주문이 아직 없습니다.</Text>}
          </Section>
          <Section title="이용권과 분석">
            {data?.entitlements.length ? data.entitlements.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{entitlementStatus[item.status] ?? item.status} · {item.usedCount}/{item.usageLimit}회 사용</Text></View>) : <Text style={styles.empty}>표시할 이용권이 없습니다.</Text>}
            {data?.analyses.map((item) => <View key={`analysis-${item.id}`} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{analysisStatus[item.status] ?? item.status} · {dateText(item.completedAt ?? item.startedAt)}{item.hasSavedResult ? " · 결과 보관" : ""}</Text></View>)}
          </Section>
          <Section title="결과 PDF">
            {data?.privateDocuments.length ? data.privateDocuments.map((item) => <View key={`document-${item.id}`} style={styles.card}><Text style={styles.cardTitle}>심화 분석 PDF</Text><Text style={styles.meta}>{item.available ? `보관 중 · ${dateText(item.retentionExpiresAt)}까지` : "생성 중이거나 보관기간이 지났습니다."}</Text>{item.available && <TouchableOpacity style={styles.verifyButton} disabled={downloadDocument.isPending} onPress={() => downloadDocument.mutate({ documentId: item.id })}><Text style={styles.verifyButtonText}>{downloadDocument.isPending ? "열는 중…" : "PDF 다시 보기·다운로드"}</Text></TouchableOpacity>}</View>) : <Text style={styles.empty}>보관 중인 PDF가 없습니다.</Text>}
          </Section>
          <Section title="쿠폰함">
            {data?.coupons.length ? data.coupons.map((item) => <View key={`coupon-${item.id}`} style={styles.card}><Text style={styles.cardTitle}>{item.code}</Text><Text style={styles.meta}>{item.discountType === "percent" ? `${item.discountValue}% 할인` : `${item.discountValue.toLocaleString()}원 할인`} · {item.state === "consumed" ? "사용 완료" : item.state === "reserved" ? "사용 예약" : "해제"}</Text></View>) : <Text style={styles.empty}>쿠폰 사용 이력이 없습니다.</Text>}
          </Section>
          <Section title="코칭 예약">
            {data?.coachingBookings.length ? data.coachingBookings.map((item) => <View key={item.id} style={styles.card}><Text style={styles.cardTitle}>{item.productName}</Text><Text style={styles.meta}>{bookingStatus[item.status] ?? item.status} · {item.sessionMode === "online" ? "온라인" : item.sessionMode === "in_person" ? "대면" : "방식 확인 중"}</Text><Text style={styles.meta}>일정 {dateText(item.scheduledAt)}</Text></View>) : <Text style={styles.empty}>연결된 코칭 예약이 없습니다.</Text>}
          </Section>
          <Section title="문의내역">
            {data?.inquiries.length ? data.inquiries.map((item) => <View key={`inquiry-${item.id}`} style={styles.card}><Text style={styles.cardTitle}>{inquiryTypeLabels[item.inquiryType] ?? item.inquiryType} · {item.subject}</Text><Text style={styles.meta}>{inquiryStatusLabels[item.status] ?? item.status} · {dateText(item.respondedAt ?? item.createdAt)}</Text></View>) : <Text style={styles.empty}>접수한 문의가 없습니다.</Text>}
          </Section>
          <Section title="내 정보"><View style={styles.card}><Text style={styles.cardTitle}>{auth.user?.name ?? "회원"}</Text><Text style={styles.meta}>{auth.user?.email ?? "이메일 정보 없음"} · {data?.account.emailLinked ? "구매 이메일 연결 완료" : "구매 이력 연결 가능"}</Text></View></Section>
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
  input: { borderWidth: 1, borderColor: "#b8d2bb", backgroundColor: "#fff", color: "#3d3530", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 10, fontSize: 13, marginTop: 5 },
  verifyButton: { alignSelf: "flex-start", backgroundColor: "#3f7b52", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 3 }, verifyButtonText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }, typeButton: { borderWidth: 1, borderColor: "#b8d2bb", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#fff" }, typeButtonActive: { backgroundColor: "#3f7b52", borderColor: "#3f7b52" }, typeButtonText: { color: "#55705a", fontSize: 11, fontWeight: "700" }, typeButtonTextActive: { color: "#fff" },
  messageInput: { minHeight: 88, textAlignVertical: "top" },
  section: { gap: 8 }, sectionTitle: { color: "#3d3530", fontSize: 17, fontWeight: "800", marginTop: 8 },
  card: { borderWidth: 1, borderColor: "#ded9ce", backgroundColor: "#fbfaf6", borderRadius: 14, padding: 14, gap: 5 },
  cardTitle: { color: "#3d3530", fontSize: 14, fontWeight: "800" }, meta: { color: "#6c6860", fontSize: 12, lineHeight: 18 },
  empty: { color: "#8a857c", fontSize: 13, paddingVertical: 8 }, loading: { paddingVertical: 44 }, errorText: { color: "#b5584f", fontSize: 13 },
});
