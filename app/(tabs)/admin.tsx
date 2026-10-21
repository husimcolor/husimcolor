import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { ScreenContainer } from "@/components/screen-container";
import { getApiBaseUrl } from "@/constants/oauth";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type Tab = "운영 홈" | "고객·회원" | "주문·결제" | "검사·결과" | "PDF·이메일" | "상품·쿠폰" | "코칭예약" | "체험 신청" | "문의" | "레거시" | "통계·리뷰" | "Preview 검증";
type LegacyStatus = "pending" | "confirmed" | "rejected";
type RevealedOrderEmails = {
  orderNumber: string;
  buyerEmail: string | null;
  reportRecipients: Array<{ outboxId: number; email: string; status: string; sentAt: Date | string | null }>;
};

function kstDateOffset(daysAgo: number) { const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000); kstNow.setUTCDate(kstNow.getUTCDate() - daysAgo); return kstNow.toISOString().slice(0, 10); }

const tabs: Tab[] = ["운영 홈", "고객·회원", "주문·결제", "검사·결과", "PDF·이메일", "상품·쿠폰", "코칭예약", "체험 신청", "문의", "레거시", "통계·리뷰", "Preview 검증"];
const bookingLabels: Record<string, string> = {
  pending_schedule: "일정 대기", change_requested: "변경 요청", scheduled: "예약 확정",
  completed: "완료", cancelled: "취소", no_show: "노쇼",
};
const legacyLabels: Record<LegacyStatus, string> = { pending: "입금 대기", confirmed: "입금 확인", rejected: "취소" };
const inquiryTypeLabels: Record<string, string> = { payment_refund: "결제·환불", analysis_result: "검사·결과", pdf_email: "PDF·이메일", coaching_booking: "코칭예약", other: "기타" };
const inquiryStatusLabels: Record<string, string> = { received: "접수", reviewing: "확인", answered: "답변완료" };
const experienceRequestStatusLabels: Record<string, string> = { received: "접수", reviewing: "일정 확인 중", confirmed: "예약 확정", cancelled: "취소" };

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
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutNote, setBlackoutNote] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [legacyAdmin, setLegacyAdmin] = useState(false);
  const [legacyLoading, setLegacyLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [trialEmail, setTrialEmail] = useState("");
  const [trialProduct, setTrialProduct] = useState<"personal_deep" | "couple_love_deep" | "parent_child_deep">("personal_deep");
  const [trialRelationType, setTrialRelationType] = useState<"연인" | "부부" | "부모-자녀">("연인");
  const [trialUrl, setTrialUrl] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<string | null>(null);
  const [targetCouponEmail, setTargetCouponEmail] = useState("");
  const [targetCouponProduct, setTargetCouponProduct] = useState<"personal_deep" | "couple_love_deep" | "parent_child_deep" | "personal_coaching" | "couple_coaching">("personal_coaching");
  const [targetCouponDiscountType, setTargetCouponDiscountType] = useState<"fixed" | "percent">("fixed");
  const [targetCouponDiscountValue, setTargetCouponDiscountValue] = useState("10000");
  const [targetCouponValidDays, setTargetCouponValidDays] = useState("30");
  const [targetCouponCode, setTargetCouponCode] = useState<string | null>(null);
  const [targetCouponStatus, setTargetCouponStatus] = useState<string | null>(null);
  const [relationshipRecoverySessionId, setRelationshipRecoverySessionId] = useState("");
  const [relationshipRecoveryUrls, setRelationshipRecoveryUrls] = useState<{ owner: string; partner: string } | null>(null);
  const [relationshipRecoveryStatus, setRelationshipRecoveryStatus] = useState<string | null>(null);
  const [deliverySearch, setDeliverySearch] = useState("");
  const [revealedOrderEmails, setRevealedOrderEmails] = useState<Record<number, RevealedOrderEmails>>({});
  const [revealedExperienceContacts, setRevealedExperienceContacts] = useState<Record<number, { name: string; contactPhone: string }>>({});
  const [confirmingExperienceRequest, setConfirmingExperienceRequest] = useState<{ id: number; productLabel: string } | null>(null);
  const [cancellingExperienceRequest, setCancellingExperienceRequest] = useState<{ id: number; productLabel: string } | null>(null);
  const [experienceCancellationReason, setExperienceCancellationReason] = useState("");
  const apiBaseUrl = getApiBaseUrl();

  const refreshLegacySession = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/legacy-admin-session`, { credentials: "include" });
      const payload = await response.json() as { authenticated?: boolean };
      setLegacyAdmin(payload.authenticated === true);
    } catch { setLegacyAdmin(false); } finally { setLegacyLoading(false); }
  };

  useEffect(() => { void refreshLegacySession(); }, []);
  useEffect(() => {
    if (tab !== "체험 신청") setRevealedExperienceContacts({});
  }, [tab]);

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
  const dailyOperations = trpc.admin.dailyOperationsSignals.useQuery(undefined, secured);
  const funnelDaily = trpc.admin.funnelDaily.useQuery({ fromKst: kstDateOffset(13), toKst: kstDateOffset(0) }, secured);
  const orders = trpc.admin.orders.useQuery({ limit: 50 }, secured);
  const previewVerification = trpc.admin.previewVerification.useQuery(undefined, secured);
  const customers = trpc.admin.customers.useQuery({ limit: 50 }, secured);
  const customer = trpc.admin.customerDetail.useQuery({ customerId: customerId ?? 1 }, { ...secured, enabled: hasAdminAccess && customerId !== null });
  const delivery = trpc.commerce.adminDelivery.list.useQuery({ limit: 50, search: deliverySearch.trim() || undefined }, secured);
  const bookings = trpc.admin.coachingBookings.useQuery({ limit: 50 }, secured);
  const experienceRequests = trpc.admin.yearEndExperienceRequests.useQuery({ limit: 100 }, secured);
  const blackoutDates = trpc.admin.coachingBlackoutDates.useQuery(undefined, secured);
  const supportTickets = trpc.admin.supportTickets.useQuery({ limit: 100 }, secured);
  const coupons = trpc.admin.coupons.useQuery({ limit: 100 }, secured);
  const targetedCoupons = trpc.admin.targetedCoupons.useQuery({ limit: 20 }, secured);
  const legacy = trpc.admin.legacyPayments.useQuery({ limit: 100 }, secured);
  const reviews = trpc.admin.reviews.useQuery({ limit: 100 }, secured);
  const visits = trpc.visitors.stats.useQuery(undefined, secured);
  const tests = trpc.visitors.testStats.useQuery(undefined, secured);
  const logout = trpc.auth.logout.useMutation({ onSuccess: () => router.replace("/(tabs)") });
  const updateLegacy = trpc.admin.updateLegacyPayment.useMutation({ onSuccess: () => { legacy.refetch(); dailyOperations.refetch(); } });
  const retryMail = trpc.commerce.adminDelivery.retry.useMutation({ onSuccess: () => delivery.refetch() });
  const revealOrderEmailDetails = trpc.admin.revealOrderEmailDetails.useMutation({
    onSuccess: (result) => {
      setRevealedOrderEmails((previous) => ({ ...previous, [result.orderId]: result }));
    },
    onError: () => Alert.alert("이메일 열람 불가", "주문 이메일을 불러오지 못했습니다. 관리자 로그인을 확인해 주세요."),
  });
  const updateBooking = trpc.admin.updateCoachingBooking.useMutation({ onSuccess: () => { bookings.refetch(); dailyOperations.refetch(); } });
  const revealExperienceContact = trpc.admin.revealYearEndExperienceRequestContact.useMutation({
    onSuccess: (result) => setRevealedExperienceContacts((previous) => ({ ...previous, [result.requestId]: { name: result.name, contactPhone: result.contactPhone } })),
    onError: () => Alert.alert("연락처 열람 불가", "신청자 연락처를 불러오지 못했습니다. 관리자 로그인을 확인해 주세요."),
  });
  const updateExperienceRequest = trpc.admin.updateYearEndExperienceRequest.useMutation({
    onSuccess: () => experienceRequests.refetch(),
    onError: () => Alert.alert("상태 변경 실패", "체험 신청 상태를 변경하지 못했습니다. 다시 시도해 주세요."),
  });
  const createBlackoutDate = trpc.admin.createCoachingBlackoutDate.useMutation({
    onSuccess: (result) => {
      if (!result.created) {
        const detail = result.reason === "CONFIRMED_BOOKINGS_EXIST"
          ? `해당 날짜에 확정된 대면 예약이 ${result.confirmedBookingCount}건 있어 임시 휴무일로 지정하지 않았습니다.`
          : "이미 임시 휴무일로 지정된 날짜입니다.";
        Alert.alert("예약 불가일 미지정", detail);
        return;
      }
      setBlackoutDate("");
      setBlackoutNote("");
      void blackoutDates.refetch();
      Alert.alert("예약 불가일 지정", "선택한 날짜는 신규 대면 코칭 예약에서 제외됩니다. 기존 예약은 변경하지 않았습니다.");
    },
  });
  const removeBlackoutDate = trpc.admin.removeCoachingBlackoutDate.useMutation({
    onSuccess: () => { void blackoutDates.refetch(); },
  });
  const updateSupportTicket = trpc.admin.updateSupportTicket.useMutation({ onSuccess: () => supportTickets.refetch() });
  const deleteReview = trpc.admin.deleteReview.useMutation({ onSuccess: () => reviews.refetch() });
  const issueTestEntitlement = trpc.admin.issueTestEntitlement.useMutation({
    onSuccess: (result) => {
      if (!result.startGrant) {
        setTrialUrl(null);
        setTrialStatus(result.outcome === "already_used"
          ? "이 이메일의 해당 체험권은 이미 사용되었습니다. 새 권한이나 링크를 만들지 않았습니다."
          : result.outcome === "expired"
            ? "기존 체험권이 만료되었습니다. 새 권한은 자동으로 만들지 않았습니다."
            : "기존 체험권은 사용할 수 없는 상태입니다. 새 권한은 자동으로 만들지 않았습니다.");
        return;
      }
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const params = new URLSearchParams({
        product: result.productCode,
        grant: result.startGrant.accessToken,
        expiresAt: result.startGrant.expiresAt,
      });
      if (result.productCode === "couple_love_deep" || result.productCode === "parent_child_deep") {
        params.set("relationType", trialRelationType);
      }
      setTrialUrl(`${base}/admin-test-access?${params.toString()}`);
      setTrialStatus(result.outcome === "issued"
        ? "테스트 이용권을 발급했습니다. 결제·쿠폰·주문은 만들지 않았습니다. 아래 URL을 복사해 전달하세요."
        : "기존 미사용 체험권의 링크를 재발급했습니다. 중복 권한은 만들지 않았습니다.");
    },
    onError: (error) => {
      const message = error.message.includes("RECIPIENT_LIMIT")
        ? "현재 유효한 체험 담당자가 2명입니다. 만료 또는 회수 후 새로 발급할 수 있습니다."
        : error.message.includes("ALREADY_USED")
          ? "이 이메일의 해당 체험권은 이미 사용되었습니다. 새 체험권은 발급하지 않았습니다."
          : "체험 이용권을 발급하지 못했습니다. 이메일과 상품을 확인해 주세요.";
      setTrialUrl(null);
      setTrialStatus(message);
    },
  });
  const revokeTestEntitlement = trpc.admin.revokeTestEntitlement.useMutation({
    onSuccess: (result) => {
      setTrialUrl(null);
      Alert.alert(result.revoked ? "체험 이용권 회수" : "회수 불가", result.revoked ? "검사 시작 전 체험 이용권을 회수했습니다." : "활성 상태의 미사용 체험 이용권이 없습니다.");
    },
  });
  const issueTargetedCoupon = trpc.admin.issueTargetedCoupon.useMutation({
    onSuccess: (result) => {
      setTargetCouponCode(result.code);
      setTargetCouponStatus(`${result.customerEmailMasked} 고객에게 1회용 개별 쿠폰을 발급했습니다. 코드는 아래에서만 확인됩니다.`);
      void targetedCoupons.refetch();
      void coupons.refetch();
    },
    onError: (error) => {
      setTargetCouponCode(null);
      const message = error.message.includes("CODE_DUPLICATE")
        ? "같은 코드가 이미 있습니다. 다른 코드를 입력하거나 비워 두고 자동 생성해 주세요."
        : error.message.includes("EMAIL_INVALID")
          ? "지정 고객 이메일 주소를 확인해 주세요."
          : "개별 쿠폰을 발급하지 못했습니다. 대상 상품과 할인 조건을 확인해 주세요.";
      setTargetCouponStatus(message);
    },
  });
  const revokeTargetedCoupon = trpc.admin.revokeTargetedCoupon.useMutation({
    onSuccess: (result) => {
      Alert.alert(result.revoked ? "개별 쿠폰 회수" : "회수 불가", result.revoked ? "아직 사용되지 않은 개별 쿠폰을 중지했습니다." : "이미 비활성화되었거나 찾을 수 없습니다.");
      void targetedCoupons.refetch();
      void coupons.refetch();
    },
  });
  const reissuePreviewRelationshipResults = trpc.admin.reissuePreviewRelationshipResults.useMutation({
    onSuccess: (result) => {
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const inherited = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const withPreviewAccess = (token: string) => {
        const params = new URLSearchParams({ token, inviteToken: result.inviteToken, resultToken: result.resultToken });
        for (const key of ["_vercel_share", "x-vercel-protection-bypass"]) {
          const value = inherited.get(key);
          if (value) params.set(key, value);
        }
        return `${base}/relationship-invite?${params.toString()}`;
      };
      setRelationshipRecoveryUrls({ owner: withPreviewAccess(result.ownerAccessToken), partner: withPreviewAccess(result.inviteToken) });
      setRelationshipRecoveryStatus("제출 답변·통합 결과·PDF·이메일 outbox는 보존한 채, 새 A/B 결과 접근 링크만 발급했습니다. 이전 A/B 링크는 보안을 위해 더 이상 사용할 수 없습니다.");
    },
    onError: (error) => {
      setRelationshipRecoveryUrls(null);
      setRelationshipRecoveryStatus(error.message.includes("NOT_READY")
        ? "두 사람의 제출과 결과 PDF가 모두 준비된 Preview 테스트 세션만 재발급할 수 있습니다."
        : "Preview 결과 링크를 재발급하지 못했습니다. 세션 번호와 Preview 관리자 로그인을 확인해 주세요.");
    },
  });

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([auth.refetch(), dailyOperations.refetch(), orders.refetch(), previewVerification.refetch(), customers.refetch(), delivery.refetch(), bookings.refetch(), experienceRequests.refetch(), blackoutDates.refetch(), supportTickets.refetch(), coupons.refetch(), targetedCoupons.refetch(), legacy.refetch(), reviews.refetch(), visits.refetch(), tests.refetch(), funnelDaily.refetch(), customerId ? customer.refetch() : Promise.resolve()]);
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
  const copyAdminEmail = async (email: string) => {
    await Clipboard.setStringAsync(email);
    Alert.alert("이메일 복사", "관리자 기기의 클립보드에 복사했습니다.");
  };
  const createBlackout = () => {
    const date = blackoutDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      Alert.alert("날짜 형식", "예: 2026-10-01 형식으로 날짜를 입력해 주세요.");
      return;
    }
    createBlackoutDate.mutate({ date, note: blackoutNote.trim() || undefined });
  };
  const removeBlackout = (date: string) => {
    Alert.alert("예약 불가일 해제", `${date}의 임시 휴무 설정을 해제하시겠습니까? 기존 예약에는 영향을 주지 않습니다.`, [
      { text: "취소", style: "cancel" },
      { text: "해제", style: "destructive", onPress: () => removeBlackoutDate.mutate({ date }) },
    ]);
  };
  const isRelationshipTrial = trialProduct !== "personal_deep";
  const availableRelationTypes = useMemo(() => trialProduct === "couple_love_deep" ? ["연인", "부부"] as const : ["부모-자녀"] as const, [trialProduct]);
  const issueTrial = () => {
    const email = trialEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setTrialStatus("체험 담당자 이메일 주소를 입력해 주세요.");
      return;
    }
    const relationType = isRelationshipTrial ? trialRelationType : null;
    if (relationType && !availableRelationTypes.includes(relationType as never)) {
      setTrialStatus("선택한 상품에 맞는 관계 유형을 선택해 주세요.");
      return;
    }
    setTrialUrl(null);
    setTrialStatus("체험 이용권을 확인·발급하고 있습니다…");
    issueTestEntitlement.mutate({ email, productCode: trialProduct });
  };
  const revokeTrial = () => {
    const email = trialEmail.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      Alert.alert("이메일 확인", "회수할 체험 담당자 이메일 주소를 입력해 주세요.");
      return;
    }
    Alert.alert("체험 이용권 회수", "아직 검사를 시작하지 않은 권한만 회수합니다. 이미 시작한 검사는 중단하거나 삭제하지 않습니다.", [
      { text: "취소", style: "cancel" },
      { text: "회수", style: "destructive", onPress: () => revokeTestEntitlement.mutate({ email, productCode: trialProduct }) },
    ]);
  };
  const openExperienceCancellation = (item: { id: number; productLabel: string }) => {
    setExperienceCancellationReason("");
    setCancellingExperienceRequest(item);
  };
  const confirmExperienceConfirmation = () => {
    if (!confirmingExperienceRequest) return;
    updateExperienceRequest.mutate({
      requestId: confirmingExperienceRequest.id,
      status: "confirmed",
    }, {
      onSuccess: () => {
        setConfirmingExperienceRequest(null);
        void experienceRequests.refetch();
      },
    });
  };
  const confirmExperienceCancellation = () => {
    if (!cancellingExperienceRequest) return;
    updateExperienceRequest.mutate({
      requestId: cancellingExperienceRequest.id,
      status: "cancelled",
      cancellationReason: experienceCancellationReason.trim() || undefined,
    }, {
      onSuccess: () => {
        setCancellingExperienceRequest(null);
        setExperienceCancellationReason("");
        void experienceRequests.refetch();
      },
    });
  };
  const issueCustomerCoupon = () => {
    const email = targetCouponEmail.trim();
    const discountValue = Number(targetCouponDiscountValue);
    const validDays = Number(targetCouponValidDays);
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setTargetCouponStatus("지정 고객 이메일 주소를 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(discountValue) || discountValue <= 0 || (targetCouponDiscountType === "percent" && discountValue > 100)) {
      setTargetCouponStatus(targetCouponDiscountType === "percent" ? "할인율은 1~100 사이의 정수로 입력해 주세요." : "할인 금액을 원 단위 정수로 입력해 주세요.");
      return;
    }
    if (!Number.isInteger(validDays) || validDays < 1 || validDays > 365) {
      setTargetCouponStatus("유효기간은 1~365일 사이의 정수로 입력해 주세요.");
      return;
    }
    setTargetCouponCode(null);
    setTargetCouponStatus("개별 쿠폰을 발급하고 있습니다…");
    issueTargetedCoupon.mutate({
      email,
      productCodes: [targetCouponProduct],
      discountType: targetCouponDiscountType,
      discountValue,
      validDays,
    });
  };
  const revokeCustomerCoupon = (couponId: number) => {
    Alert.alert("개별 쿠폰 회수", "아직 사용되지 않은 지정 고객 쿠폰을 중지하시겠습니까? 이미 사용된 주문은 변경하지 않습니다.", [
      { text: "취소", style: "cancel" },
      { text: "회수", style: "destructive", onPress: () => revokeTargetedCoupon.mutate({ couponId }) },
    ]);
  };
  const reissueRelationshipResults = () => {
    const relationshipSessionId = Number(relationshipRecoverySessionId);
    if (!Number.isInteger(relationshipSessionId) || relationshipSessionId <= 0) {
      setRelationshipRecoveryStatus("Preview 관계 세션 번호를 숫자로 입력해 주세요.");
      return;
    }
    setRelationshipRecoveryUrls(null);
    setRelationshipRecoveryStatus("제출 답변을 변경하지 않고 새 A/B 결과 링크를 발급하고 있습니다…");
    reissuePreviewRelationshipResults.mutate({ relationshipSessionId });
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
      <Modal transparent visible={confirmingExperienceRequest !== null} animationType="fade" onRequestClose={() => setConfirmingExperienceRequest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>예약 확정 확인</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{confirmingExperienceRequest?.productLabel} 신청을 예약 확정으로 저장합니다. 같은 날짜의 다른 체험 신청은 제한하지 않으며, 현장 결제·환불은 처리하지 않습니다.</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.smallAction} disabled={updateExperienceRequest.isPending} onPress={() => setConfirmingExperienceRequest(null)}><Text style={styles.smallActionText}>돌아가기</Text></TouchableOpacity>
              <TouchableOpacity style={styles.action} disabled={updateExperienceRequest.isPending} onPress={confirmExperienceConfirmation}><Text style={styles.actionText}>{updateExperienceRequest.isPending ? "저장 중…" : "예약 확정 저장"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal transparent visible={cancellingExperienceRequest !== null} animationType="fade" onRequestClose={() => setCancellingExperienceRequest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>예약 취소 확인</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{cancellingExperienceRequest?.productLabel} 신청을 취소 상태로 저장합니다. 취소된 신청은 삭제하지 않으며, 결제·환불은 처리하지 않습니다.</Text>
            <TextInput value={experienceCancellationReason} onChangeText={setExperienceCancellationReason} placeholder="취소 사유 (선택 입력, 관리자용)" placeholderTextColor={colors.muted} maxLength={500} multiline style={[styles.input, styles.reasonInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.smallAction} disabled={updateExperienceRequest.isPending} onPress={() => setCancellingExperienceRequest(null)}><Text style={styles.smallActionText}>돌아가기</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dangerAction} disabled={updateExperienceRequest.isPending} onPress={confirmExperienceCancellation}><Text style={styles.dangerActionText}>{updateExperienceRequest.isPending ? "저장 중…" : "예약 취소 저장"}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#3f7b52" />}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: colors.muted }]}>HUSIMCOLOR OPERATIONS</Text><Text style={[styles.title, { color: colors.foreground }]}>통합 관리자</Text><Text style={[styles.subtitle, { color: colors.muted }]}>고객 · 주문 · 결과 · PDF · 이메일 · 예약</Text></View>
          <TouchableOpacity style={styles.logout} onPress={() => legacyAdmin ? void logoutLegacyAdmin() : logout.mutate()}><Text style={styles.logoutText}>로그아웃</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>{tabs.map((item) => <TouchableOpacity key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView>

        {tab === "코칭예약" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>예약 불가일 (임시 휴무)</Text>
          <Panel>
            <Text style={styles.noticeTitle}>대면 코칭 신규 예약만 제한</Text>
            <Text style={styles.noticeText}>일요일·설날 당일·추석 당일·당일 예약 불가 규칙은 자동 적용됩니다. 여기서 지정하는 날짜는 개인 일정 등 추가 임시 휴무일입니다. 기존 확정 예약을 취소하거나 변경하지 않습니다.</Text>
            <TextInput value={blackoutDate} onChangeText={setBlackoutDate} placeholder="날짜 (예: 2026-10-01)" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <TextInput value={blackoutNote} onChangeText={setBlackoutNote} placeholder="관리자 메모 (예: 외부 일정, 고객에게 미노출)" placeholderTextColor={colors.muted} maxLength={500} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <TouchableOpacity style={styles.action} disabled={createBlackoutDate.isPending} onPress={createBlackout}><Text style={styles.actionText}>{createBlackoutDate.isPending ? "확인 중…" : "예약 불가일 지정"}</Text></TouchableOpacity>
          </Panel>
          {blackoutDates.data?.map((item) => <Panel key={item.date}>
            <View style={styles.row}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.date}</Text><Text style={[styles.meta, { color: colors.muted }]}>{item.note ?? "메모 없음"}</Text></View><Badge text="임시 휴무" tone="warn" /></View>
            <TouchableOpacity style={styles.dangerAction} disabled={removeBlackoutDate.isPending} onPress={() => removeBlackout(item.date)}><Text style={styles.dangerActionText}>예약 불가일 해제</Text></TouchableOpacity>
          </Panel>)}
          {blackoutDates.data?.length === 0 && <Panel><Text style={styles.noticeText}>등록된 임시 휴무일이 없습니다.</Text></Panel>}
        </>}

        {tab === "운영 홈" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>오늘의 운영 신호 · KST {dailyOperations.data?.kstDate ?? "—"}</Text>
          <View style={styles.grid}>
            <Metric value={dailyOperations.data?.homepageVisitors ?? 0} label="오늘 홈페이지 방문자" />
            <Metric value={dailyOperations.data?.appVisitors ?? 0} label="오늘 앱 방문자" color="#4d6f9f" />
            <Metric value={dailyOperations.data?.freeColorCompletions ?? 0} label="오늘 무료 3컬러 완료" color="#4d6f9f" />
            <Metric value={dailyOperations.data?.friendFreeCompletions ?? 0} label="오늘 지인 무료테스트 완료" color="#4d6f9f" />
            <Metric value={dailyOperations.data?.livePaidOrderCount ?? 0} label="오늘 실결제 완료" />
            <Metric value={dailyOperations.data?.personalDeepPaidCount ?? 0} label="개인 심화 실결제" color="#4d6f9f" />
            <Metric value={dailyOperations.data?.coupleLoveDeepPaidCount ?? 0} label="부부·연인 실결제" color="#4d6f9f" />
            <Metric value={dailyOperations.data?.parentChildDeepPaidCount ?? 0} label="부모·자녀 실결제" color="#4d6f9f" />
          </View>
          <Panel><Text style={styles.noticeTitle}>오늘 매출금액</Text><Text style={[styles.revenueValue, { color: "#3f7b52" }]}>{(dailyOperations.data?.revenueKrw ?? 0).toLocaleString()}원</Text><Text style={styles.noticeText}>할인 적용 후 Toss 라이브 승인 주문만 합산합니다. 테스트키·개발 테스트·무료 이용권·실패·미완료 주문은 제외하며, 취소·환불로 상태가 바뀐 주문은 매출에 포함하지 않습니다.</Text></Panel>
          <Text style={[styles.section, { color: colors.foreground }]}>기존 누적 지표</Text>
          <View style={styles.grid}>
            <Metric value={visits.data?.totalVisitors ?? 0} label="고유 방문 기기" />
          </View>
          <Panel><Text style={styles.noticeTitle}>집계 기준</Text><Text style={styles.noticeText}>오늘은 한국시간 00:00~24:00입니다. 방문자는 서비스별 같은 기기의 당일 재방문을 한 번으로 계산합니다. 무료 완료는 결과 화면 도달 이벤트만, 지인 무료테스트는 관계 결과 중 ‘친구’ 유형 완료만 계산합니다. 운영 신호는 2026.10.09 KST부터 남은 앱·결제 원장으로 재집계합니다. 홈페이지 방문은 기존 원장이 없어 {dailyOperations.data?.homepageVisitorCollectionStartLabel ?? "2026.10.12 KST"}부터 기록합니다.</Text></Panel>
          <Panel><Text style={styles.noticeTitle}>공개 운영 상태</Text><Text style={styles.noticeText}>유료 심화분석은 Toss 라이브 결제로 운영 중입니다. 승인된 실제 결제에만 이용권이 연결되며, 테스트 주문과 무료 이용권은 실결제·매출 집계에서 분리됩니다.</Text></Panel>
        </>}

        {tab === "주문·결제" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>주문·결제</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>고객 → 주문 → 결제 → 이용권 흐름의 공통 원장을 표시합니다. 목록 이메일은 마스킹되며, 주문별 ‘이메일 보기’에서만 전체 주소를 열람·복사할 수 있습니다. 열람은 감사 로그에 남습니다.</Text>
          {orders.data?.map((item) => {
            const revealed = revealedOrderEmails[item.id];
            return <Panel key={item.id}>
              <View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={item.status} tone={item.status === "paid" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View>
              <Text style={[styles.meta, { color: colors.muted }]}>{item.orderNumber} · {dateText(item.createdAt)}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · 결제 {item.finalAmountKrw.toLocaleString()}원 · 할인 {item.discountAmountKrw.toLocaleString()}원 · {item.provider ?? "결제 대기"} · {item.channel === "web" ? "홈페이지 유입" : "앱 유입"}{item.isTest ? " · 테스트 주문(매출 제외)" : ""}</Text>
              <Text style={[styles.meta, { color: colors.muted }]}>결제 상태 {item.paymentStatus ?? "—"} · 이용권 {item.entitlementStatus ?? "—"}</Text>
              <TouchableOpacity style={styles.smallAction} disabled={revealOrderEmailDetails.isPending} onPress={() => revealOrderEmailDetails.mutate({ orderId: item.id })}><Text style={styles.smallActionText}>{revealOrderEmailDetails.isPending ? "불러오는 중…" : "이메일 보기·복사"}</Text></TouchableOpacity>
              {revealed && <View style={styles.expanded}>
                <Text style={[styles.meta, { color: colors.muted }]}>결제자 이메일</Text>
                {revealed.buyerEmail ? <><Text style={[styles.emailValue, { color: colors.foreground }]}>{revealed.buyerEmail}</Text><TouchableOpacity style={styles.smallAction} onPress={() => void copyAdminEmail(revealed.buyerEmail!)}><Text style={styles.smallActionText}>결제자 이메일 복사</Text></TouchableOpacity></> : <Text style={[styles.noticeText, { color: colors.muted }]}>결제자 이메일을 복호화할 수 없습니다.</Text>}
                <Text style={[styles.meta, { color: colors.muted }]}>실제 리포트 수신 이메일</Text>
                {revealed.reportRecipients.length ? revealed.reportRecipients.map((recipient) => <View key={recipient.outboxId} style={styles.emailDetail}><Text style={[styles.emailValue, { color: colors.foreground }]}>{recipient.email}</Text><Text style={[styles.meta, { color: colors.muted }]}>발송 상태 {recipient.status} · 실제 발송 {dateText(recipient.sentAt)}</Text><TouchableOpacity style={styles.smallAction} onPress={() => void copyAdminEmail(recipient.email)}><Text style={styles.smallActionText}>수신 이메일 복사</Text></TouchableOpacity></View>) : <Text style={[styles.noticeText, { color: colors.muted }]}>연결된 리포트 이메일 Outbox가 없습니다.</Text>}
              </View>}
            </Panel>;
          })}
        </>}

        {tab === "Preview 검증" && <><Text style={[styles.section, { color: colors.foreground }]}>Preview 원장 검증</Text><Text style={[styles.helper, { color: colors.muted }]}>Preview·관리자 역할에서만 테스트 주문과 인증·문의 Outbox 상태를 마스킹하여 조회합니다. 이 화면에는 수정·재발송·다운로드 기능이 없습니다.</Text>{previewVerification.data?.available === false && <Panel><Text style={styles.noticeTitle}>Preview 환경에서만 사용할 수 있습니다</Text><Text style={styles.noticeText}>Production에서는 검증 데이터가 반환되지 않습니다.</Text></Panel>}{previewVerification.data?.available && <><Panel><Text style={styles.noticeTitle}>제출 완료 관계검사 결과 링크 복구</Text><Text style={styles.noticeText}>Preview 테스트에서 A·B 모두 제출·PDF 생성까지 끝난 세션만 대상으로 합니다. 답변·통합 결과·PDF·이메일 outbox는 변경하지 않고, 새 A/B 접근 링크만 발급합니다. 기존 A/B 링크는 무효화됩니다.</Text><TextInput value={relationshipRecoverySessionId} onChangeText={(value) => { setRelationshipRecoverySessionId(value); setRelationshipRecoveryUrls(null); setRelationshipRecoveryStatus(null); }} keyboardType="number-pad" placeholder="관계 세션 번호" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><TouchableOpacity style={styles.action} disabled={reissuePreviewRelationshipResults.isPending} onPress={reissueRelationshipResults}><Text style={styles.actionText}>{reissuePreviewRelationshipResults.isPending ? "재발급 중…" : "A/B 결과 링크 재발급"}</Text></TouchableOpacity>{relationshipRecoveryStatus && <Text style={[styles.noticeText, { color: relationshipRecoveryUrls ? "#3f7b52" : "#b5584f" }]}>{relationshipRecoveryStatus}</Text>}{relationshipRecoveryUrls && <><Text style={[styles.meta, { color: "#9a6a12" }]}>A 결과 링크</Text><TextInput value={relationshipRecoveryUrls.owner} editable={false} multiline selectTextOnFocus style={[styles.input, styles.trialUrl, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.meta, { color: "#9a6a12" }]}>B 결과 링크</Text><TextInput value={relationshipRecoveryUrls.partner} editable={false} multiline selectTextOnFocus style={[styles.input, styles.trialUrl, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></>}</Panel><Text style={[styles.section, { color: colors.foreground }]}>테스트 주문</Text>{previewVerification.data.testOrders.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={item.status} tone={item.status === "paid" ? "good" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.orderNumber} · {item.customerEmailMasked} · {item.channel === "web" ? "홈페이지 유입" : "앱 유입"}</Text><Text style={[styles.meta, { color: colors.muted }]}>결제 {item.paymentStatus ?? "—"} · 이용권 {item.entitlementStatus ?? "—"} · {dateText(item.createdAt)}</Text></Panel>)}{previewVerification.data.testOrders.length === 0 && <Panel><Text style={styles.noticeText}>표시할 테스트 주문이 없습니다.</Text></Panel>}<Text style={[styles.section, { color: colors.foreground }]}>인증·문의 Outbox</Text>{previewVerification.data.outbox.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.purpose === "account_link" ? "이력 연결 인증" : "고객 문의 알림"}</Text><Badge text={item.status} tone={item.status === "sent" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.recipientEmailMasked} · 시도 {item.attemptCount}회 · {dateText(item.sentAt ?? item.createdAt)}</Text>{item.lastErrorCode && <Text style={[styles.meta, { color: "#b5584f" }]}>오류 코드 {item.lastErrorCode}</Text>}</Panel>)}{previewVerification.data.outbox.length === 0 && <Panel><Text style={styles.noticeText}>표시할 인증·문의 Outbox가 없습니다.</Text></Panel>}</>}</>}

        {tab === "고객·회원" && <><Text style={[styles.section, { color: colors.foreground }]}>고객·회원</Text><Text style={[styles.helper, { color: colors.muted }]}>이메일은 마스킹해 표시합니다. 행을 누르면 공통 원장의 고객 흐름 수를 확인할 수 있습니다.</Text>{customers.data?.map((item) => <TouchableOpacity key={item.id} onPress={() => setCustomerId(item.id)}><Panel><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.emailMasked}</Text><Badge text={item.userId ? "회원 연결" : "비회원"} tone={item.userId ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>주문 {item.orderCount}건 · 최근 주문 {dateText(item.latestOrderAt)}</Text></Panel></TouchableOpacity>)}{customer.data && <Panel><Text style={styles.noticeTitle}>{customer.data.customer.emailMasked} 고객 흐름</Text><Text style={styles.noticeText}>주문 {customer.data.orders.length} · 이용권 {customer.data.entitlements.length} · 검사 {customer.data.analysisRuns.length} · PDF {customer.data.privateDocuments.length} · 이메일 {customer.data.emailOutbox.length} · 예약 {customer.data.coachingBookings.length}</Text></Panel>}</>}

        {tab === "검사·결과" && <><Text style={[styles.section, { color: colors.foreground }]}>검사·결과</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 검사 결과 원문과 공유 스냅샷은 수정하지 않습니다. 고객 행을 선택하면 검사·PDF 보관 건수를 확인할 수 있습니다.</Text>{customers.data?.map((item) => <TouchableOpacity key={`analysis-${item.id}`} onPress={() => setCustomerId(item.id)}><Panel><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.emailMasked}</Text><Text style={[styles.meta, { color: colors.muted }]}>주문 {item.orderCount}건 · 검사·결과·PDF 이력은 고객 흐름에서 확인</Text></Panel></TouchableOpacity>)}{customer.data && <Panel><Text style={styles.noticeTitle}>선택 고객의 검사·결과 보관 현황</Text><Text style={styles.noticeText}>검사 {customer.data.analysisRuns.length} · PDF {customer.data.privateDocuments.length} · 발송 기록 {customer.data.emailOutbox.length}</Text></Panel>}</>}

        {tab === "PDF·이메일" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>PDF·이메일 발송 원장</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>최근 내역부터 표시합니다. ‘발송 성공’은 발송 서비스의 성공 응답이며, 고객의 실제 수신·열람 여부는 확인할 수 없습니다. 재시도는 실패 건에만 수행합니다.</Text>
          <TextInput value={deliverySearch} onChangeText={setDeliverySearch} autoCapitalize="none" placeholder="주문번호 또는 수신 이메일로 검색" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
          {delivery.isLoading && <ActivityIndicator color="#3f7b52" />}
          {delivery.data?.map((item) => <Panel key={item.id}>
            <View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName ?? "상품 정보 없음"}</Text><Badge text={item.status === "sent" ? "발송 성공" : item.status === "failed" ? "발송 실패" : item.status} tone={item.status === "sent" ? "good" : item.status === "failed" ? "bad" : "warn"} /></View>
            <Text style={[styles.meta, { color: colors.muted }]}>주문번호 {item.orderNumber ?? "—"} · 수신 이메일 {item.recipientEmailMasked}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>실제 발송 시각 {item.sentAt ? dateText(item.sentAt) : "아직 발송되지 않음"} · 시도 {item.attemptCount}회</Text>
            {item.status !== "sent" && <Text style={[styles.meta, { color: colors.muted }]}>다음 자동 시도 {dateText(item.nextAttemptAt)}</Text>}
            {item.lastErrorCode && <Text style={[styles.meta, { color: "#b5584f" }]}>실패 사유 코드 {item.lastErrorCode}</Text>}
            {item.status === "failed" && <TouchableOpacity style={styles.action} disabled={retryMail.isPending} onPress={() => retryMail.mutate({ outboxId: item.id })}><Text style={styles.actionText}>{retryMail.isPending ? "재시도 요청 중…" : "발송 재시도"}</Text></TouchableOpacity>}
          </Panel>)}
          {delivery.data?.length === 0 && !delivery.isLoading && <Panel><Text style={styles.noticeText}>검색 조건에 맞는 PDF·이메일 발송 기록이 없습니다.</Text></Panel>}
        </>}

        {tab === "상품·쿠폰" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>홍보 담당자 테스트 이용권</Text>
          <Panel>
            <Text style={styles.noticeTitle}>관리자 한정 · 최대 2명 · 7일 · 상품당 1회</Text>
            <Text style={styles.noticeText}>유료 심화분석 3종만 대상입니다. 이 발급은 공통 customer·entitlement 원장만 사용하며 주문·결제·쿠폰을 만들지 않습니다. 링크는 체험 대상자에게만 전달하고, 검사 시작 전에는 회수할 수 있습니다.</Text>
            <TextInput value={trialEmail} onChangeText={(value) => { setTrialEmail(value); setTrialUrl(null); setTrialStatus(null); }} autoCapitalize="none" keyboardType="email-address" placeholder="체험 담당자 이메일" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <View style={styles.actions}>{([
              ["personal_deep", "개인 심화분석"],
              ["couple_love_deep", "부부·연인 관계분석"],
              ["parent_child_deep", "부모·자녀 관계분석"],
            ] as const).map(([code, label]) => <TouchableOpacity key={code} style={trialProduct === code ? styles.action : styles.smallAction} onPress={() => { setTrialProduct(code); setTrialRelationType(code === "parent_child_deep" ? "부모-자녀" : "연인"); setTrialUrl(null); setTrialStatus(null); }}><Text style={trialProduct === code ? styles.actionText : styles.smallActionText}>{label}</Text></TouchableOpacity>)}</View>
            {isRelationshipTrial && <><Text style={[styles.meta, { color: colors.muted }]}>관계 유형</Text><View style={styles.actions}>{availableRelationTypes.map((value) => <TouchableOpacity key={value} style={trialRelationType === value ? styles.action : styles.smallAction} onPress={() => { setTrialRelationType(value); setTrialUrl(null); setTrialStatus(null); }}><Text style={trialRelationType === value ? styles.actionText : styles.smallActionText}>{value}</Text></TouchableOpacity>)}</View></>}
            <View style={styles.actions}><TouchableOpacity style={styles.action} disabled={issueTestEntitlement.isPending} onPress={issueTrial}><Text style={styles.actionText}>{issueTestEntitlement.isPending ? "발급 중…" : "테스트 링크 발급"}</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} disabled={revokeTestEntitlement.isPending} onPress={revokeTrial}><Text style={styles.dangerActionText}>미사용 권한 회수</Text></TouchableOpacity></View>
            {trialStatus && <Text style={[styles.noticeText, { color: trialStatus.includes("발급") || trialStatus.includes("재발급") ? "#3f7b52" : "#b5584f" }]}>{trialStatus}</Text>}
            {trialUrl && <><Text style={[styles.meta, { color: "#9a6a12" }]}>아래 링크는 현재 화면에서만 표시됩니다. 길게 눌러 전체 URL을 복사해 체험 담당자에게 전달해 주세요.</Text><TextInput value={trialUrl} editable={false} multiline selectTextOnFocus style={[styles.input, styles.trialUrl, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></>}
          </Panel>
          <Text style={[styles.section, { color: colors.foreground }]}>지정 고객 개별 쿠폰</Text>
          <Panel>
            <Text style={styles.noticeTitle}>관리자 한정 · 이메일 1명 · 1회 사용</Text>
            <Text style={styles.noticeText}>공통 customer·coupon 원장에만 발급합니다. 지정한 이메일과 실제 결제 이메일이 같을 때만 적용되며, 공개 오픈기념 행사와 중복 적용할 수 없습니다.</Text>
            <TextInput value={targetCouponEmail} onChangeText={(value) => { setTargetCouponEmail(value); setTargetCouponCode(null); setTargetCouponStatus(null); }} autoCapitalize="none" keyboardType="email-address" placeholder="지정 고객 이메일" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
            <Text style={[styles.meta, { color: colors.muted }]}>적용 상품</Text>
            <View style={styles.actions}>{([
              ["personal_coaching", "1:1 코칭"], ["couple_coaching", "부부·커플 코칭"], ["personal_deep", "개인 심화"], ["couple_love_deep", "부부·연인"], ["parent_child_deep", "부모·자녀"],
            ] as const).map(([code, label]) => <TouchableOpacity key={code} style={targetCouponProduct === code ? styles.action : styles.smallAction} onPress={() => { setTargetCouponProduct(code); setTargetCouponCode(null); setTargetCouponStatus(null); }}><Text style={targetCouponProduct === code ? styles.actionText : styles.smallActionText}>{label}</Text></TouchableOpacity>)}</View>
            <Text style={[styles.meta, { color: colors.muted }]}>할인 방식</Text>
            <View style={styles.actions}><TouchableOpacity style={targetCouponDiscountType === "fixed" ? styles.action : styles.smallAction} onPress={() => setTargetCouponDiscountType("fixed")}><Text style={targetCouponDiscountType === "fixed" ? styles.actionText : styles.smallActionText}>금액 할인</Text></TouchableOpacity><TouchableOpacity style={targetCouponDiscountType === "percent" ? styles.action : styles.smallAction} onPress={() => setTargetCouponDiscountType("percent")}><Text style={targetCouponDiscountType === "percent" ? styles.actionText : styles.smallActionText}>비율 할인</Text></TouchableOpacity></View>
            <View style={styles.actions}><TextInput value={targetCouponDiscountValue} onChangeText={setTargetCouponDiscountValue} keyboardType="number-pad" placeholder={targetCouponDiscountType === "fixed" ? "예: 10000" : "예: 20"} placeholderTextColor={colors.muted} style={[styles.input, styles.compactInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.meta, { color: colors.muted }]}>{targetCouponDiscountType === "fixed" ? "원 할인" : "% 할인"}</Text><TextInput value={targetCouponValidDays} onChangeText={setTargetCouponValidDays} keyboardType="number-pad" placeholder="30" placeholderTextColor={colors.muted} style={[styles.input, styles.compactInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.meta, { color: colors.muted }]}>일 유효</Text></View>
            <TouchableOpacity style={styles.action} disabled={issueTargetedCoupon.isPending} onPress={issueCustomerCoupon}><Text style={styles.actionText}>{issueTargetedCoupon.isPending ? "발급 중…" : "지정 고객 쿠폰 발급"}</Text></TouchableOpacity>
            {targetCouponStatus && <Text style={[styles.noticeText, { color: targetCouponStatus.includes("발급했습니다") ? "#3f7b52" : "#b5584f" }]}>{targetCouponStatus}</Text>}
            {targetCouponCode && <><Text style={[styles.meta, { color: "#9a6a12" }]}>발급 코드는 지금 이 화면에서만 표시됩니다. 지정 고객에게 별도로 전달해 주세요.</Text><TextInput value={targetCouponCode} editable={false} selectTextOnFocus style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></>}
          </Panel>
          <Text style={[styles.section, { color: colors.foreground }]}>최근 지정 고객 쿠폰</Text>
          {targetedCoupons.data?.map((item) => <Panel key={`targeted-${item.id}`}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.assignedCustomerEmailMasked}</Text><Badge text={item.status} tone={item.status === "active" ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.discountType === "percent" ? `${item.discountValue}% 할인` : `${item.discountValue.toLocaleString()}원 할인`} · 종료 {dateText(item.endsAt)}</Text>{item.status === "active" && <TouchableOpacity style={styles.dangerAction} disabled={revokeTargetedCoupon.isPending} onPress={() => revokeCustomerCoupon(item.id)}><Text style={styles.dangerActionText}>미사용 쿠폰 회수</Text></TouchableOpacity>}</Panel>)}
          {!targetedCoupons.data?.length && <Panel><Text style={styles.noticeText}>최근 발급한 지정 고객 쿠폰이 없습니다.</Text></Panel>}
          <Text style={[styles.section, { color: colors.foreground }]}>상품·쿠폰</Text><Text style={[styles.helper, { color: colors.muted }]}>공개 행사와 지정 고객 쿠폰의 사용·예약 상태를 표시합니다. 한 주문에는 쿠폰 하나만 적용됩니다.</Text>{coupons.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.code}</Text><Badge text={item.status} tone={item.status === "active" ? "good" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.discountType === "percent" ? `${item.discountValue}% 할인` : `${item.discountValue.toLocaleString()}원 할인`} · 사용 {item.redemptionCount}건 · 예약 {item.reservedCount}건</Text><Text style={[styles.meta, { color: colors.muted }]}>종료 {dateText(item.endsAt)}</Text></Panel>)}{!coupons.data?.length && <Panel><Text style={styles.noticeText}>등록된 쿠폰이 없습니다.</Text></Panel>}</>}

        {tab === "코칭예약" && <><Text style={[styles.section, { color: colors.foreground }]}>코칭 예약 운영</Text><Text style={[styles.helper, { color: colors.muted }]}>결제 완료 코칭 주문은 일정 대기로 생성되어 운영자가 확정합니다.</Text>{bookings.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productName}</Text><Badge text={bookingLabels[item.status] ?? item.status} tone={item.status === "completed" ? "good" : item.status === "cancelled" || item.status === "no_show" ? "bad" : "warn"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.customerEmailMasked} · {item.orderNumber}</Text><Text style={[styles.meta, { color: colors.muted }]}>확정 일시 {dateText(item.scheduledAt)} · {item.sessionMode === "online" ? "온라인" : item.sessionMode === "in_person" ? "대면" : "방식 미정"}</Text>{(item.status === "pending_schedule" || item.status === "change_requested") && <><TextInput value={schedule[item.id] ?? ""} onChangeText={(value) => setSchedule((old) => ({ ...old, [item.id]: value }))} placeholder="예: 2026-10-01 14:00" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}><TouchableOpacity style={styles.action} onPress={() => confirmSchedule(item.id)}><Text style={styles.actionText}>일정 확정</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View></>}{item.status === "scheduled" && <View style={styles.actions}><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "completed")}><Text style={styles.smallActionText}>완료</Text></TouchableOpacity><TouchableOpacity style={styles.smallAction} onPress={() => changeBookingStatus(item.id, "change_requested")}><Text style={styles.smallActionText}>변경 요청</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "no_show")}><Text style={styles.dangerActionText}>노쇼</Text></TouchableOpacity><TouchableOpacity style={styles.dangerAction} onPress={() => changeBookingStatus(item.id, "cancelled")}><Text style={styles.dangerActionText}>취소</Text></TouchableOpacity></View>}</Panel>)}</>}

        {tab === "체험 신청" && <>
          <Text style={[styles.section, { color: colors.foreground }]}>연말 3컬러 체험 신청</Text>
          <Text style={[styles.helper, { color: colors.muted }]}>희망 일정 신청과 예약 확정은 같은 날짜에도 여러 건 진행할 수 있습니다. ‘하루 한 분·한 팀’은 안내 문구이며 자동 제한하지 않습니다. 이름·연락처는 기본 마스킹되고, ‘연락처 보기’는 관리자 감사 기록에 남습니다.</Text>
          {experienceRequests.isLoading && <ActivityIndicator color="#3f7b52" />}
          {experienceRequests.data?.map((item) => {
            const revealed = revealedExperienceContacts[item.id];
            const tone = item.status === "confirmed" ? "good" : item.status === "cancelled" ? "bad" : "warn";
            return <Panel key={item.id}>
              <View style={styles.row}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.productLabel}</Text>
                <Badge text={experienceRequestStatusLabels[item.status] ?? item.status} tone={tone} />
              </View>
              <Text style={[styles.meta, { color: colors.muted }]}>희망 {item.preferredDate} {item.preferredTime} · {item.nameMasked} · {item.contactPhoneMasked}</Text>
              {item.relationshipLabel && <Text style={[styles.meta, { color: colors.muted }]}>관계 {item.relationshipLabel}{item.relationshipType === "parent_child" && item.childAge !== null ? ` · 자녀 나이 ${item.childAge}세` : ""}</Text>}
              <Text style={[styles.meta, { color: colors.muted }]}>접수 {dateText(item.createdAt)} · 개인정보 동의 {dateText(item.privacyConsentAcceptedAt)}</Text>
              {item.status === "cancelled" && <>
                <Text style={[styles.meta, { color: "#b5584f" }]}>취소 {dateText(item.cancelledAt)}</Text>
                {item.cancellationReason && <Text style={[styles.meta, { color: colors.muted }]}>취소 사유: {item.cancellationReason}</Text>}
              </>}
              {revealed && <Text style={[styles.emailValue, { color: colors.foreground }]}>연락처 확인: {revealed.name} · {revealed.contactPhone}</Text>}
              <View style={styles.actions}>
                {!revealed && <TouchableOpacity style={styles.smallAction} disabled={revealExperienceContact.isPending} onPress={() => revealExperienceContact.mutate({ requestId: item.id })}><Text style={styles.smallActionText}>연락처 보기</Text></TouchableOpacity>}
                {item.status === "received" && <TouchableOpacity style={styles.smallAction} disabled={updateExperienceRequest.isPending} onPress={() => updateExperienceRequest.mutate({ requestId: item.id, status: "reviewing" })}><Text style={styles.smallActionText}>일정 확인 중</Text></TouchableOpacity>}
                {(item.status === "received" || item.status === "reviewing") && <TouchableOpacity style={styles.action} disabled={updateExperienceRequest.isPending} onPress={() => setConfirmingExperienceRequest({ id: item.id, productLabel: item.productLabel })}><Text style={styles.actionText}>예약 확정</Text></TouchableOpacity>}
                {item.status !== "cancelled" && <TouchableOpacity style={styles.dangerAction} disabled={updateExperienceRequest.isPending} onPress={() => openExperienceCancellation(item)}><Text style={styles.dangerActionText}>예약 취소</Text></TouchableOpacity>}
              </View>
            </Panel>;
          })}
          {experienceRequests.data?.length === 0 && !experienceRequests.isLoading && <Panel><Text style={styles.noticeText}>현재 접수된 체험 신청이 없습니다.</Text></Panel>}
        </>}

        {tab === "문의" && <><Text style={[styles.section, { color: colors.foreground }]}>1:1 문의</Text><Text style={[styles.helper, { color: colors.muted }]}>이름·이메일은 기본 마스킹됩니다. 내용은 서버 관리자 권한에서만 확인하며 이메일 답변은 기존 support 메일함에서 처리합니다.</Text>{supportTickets.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{inquiryTypeLabels[item.inquiryType] ?? item.inquiryType} · {item.subject}</Text><Badge text={inquiryStatusLabels[item.status] ?? item.status} tone={item.status === "answered" ? "good" : item.status === "reviewing" ? "warn" : "neutral"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.nameMasked} · {item.emailMasked} · {dateText(item.createdAt)}</Text><Text style={[styles.review, { color: colors.muted }]}>{item.message}</Text><View style={styles.actions}>{(["received", "reviewing", "answered"] as const).map((status) => <TouchableOpacity key={status} style={styles.smallAction} disabled={updateSupportTicket.isPending || item.status === status} onPress={() => updateSupportTicket.mutate({ id: item.id, status })}><Text style={styles.smallActionText}>{inquiryStatusLabels[status]}</Text></TouchableOpacity>)}</View></Panel>)}{!supportTickets.data?.length && <Panel><Text style={styles.noticeText}>접수된 문의가 없습니다.</Text></Panel>}</>}

        {tab === "레거시" && <><Text style={[styles.section, { color: colors.foreground }]}>과거 신청·수동입금 기록</Text><Text style={[styles.helper, { color: colors.muted }]}>기존 기록은 삭제하거나 새 주문으로 자동 이관하지 않습니다. 상태 변경만 감사 로그로 보존합니다.</Text>{legacy.data?.map((item) => { const open = expandedPaymentId === item.id; return <Panel key={item.id}><TouchableOpacity style={styles.row} onPress={() => setExpandedPaymentId(open ? null : item.id)}><View><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.senderName}</Text><Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)} · {item.amount ? `${item.amount.toLocaleString()}원` : "무료체험"}</Text></View><Badge text={legacyLabels[item.status]} tone={item.status === "confirmed" ? "good" : item.status === "rejected" ? "bad" : "warn"} /></TouchableOpacity>{open && <View style={styles.expanded}><Text style={[styles.meta, { color: colors.muted }]}>연락처 {item.contact} · 입금자명 {item.depositorName}</Text><TextInput value={memo[item.id] ?? item.memo ?? ""} onChangeText={(value) => setMemo((old) => ({ ...old, [item.id]: value }))} placeholder="운영 메모" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.actions}>{(["confirmed", "pending", "rejected"] as LegacyStatus[]).map((status) => <TouchableOpacity key={status} style={status === "rejected" ? styles.dangerAction : styles.smallAction} onPress={() => updatePayment(item.id, status)}><Text style={status === "rejected" ? styles.dangerActionText : styles.smallActionText}>{legacyLabels[status]}</Text></TouchableOpacity>)}</View></View>}</Panel>; })}</>}

        {tab === "통계·리뷰" && <><Text style={[styles.section, { color: colors.foreground }]}>전환 퍼널 · 최근 14일 KST</Text><Panel><Text style={styles.noticeTitle}>신규 측정 원장</Text><Text style={styles.noticeText}>무료 완료부터 결제 결과까지의 신규 이벤트만 표시합니다. 과거 방문 로그로 수치를 추정하지 않으며, 이벤트에는 이메일·색상·심리카드·리포트 내용이 포함되지 않습니다. 테스트는 운영 수치와 분리됩니다. 운영 화면 점검은 관리자 로그인 상태에서 진행하면 자동으로 테스트로 분류됩니다.</Text></Panel>{funnelDaily.isLoading ? <Panel><Text style={styles.noticeText}>전환 이벤트를 불러오는 중입니다.</Text></Panel> : funnelDaily.data?.rows?.length ? funnelDaily.data.rows.map((item, index) => <Panel key={`${item.kstDate}-${item.productCode}-${item.locale}-${item.channel}-${item.isTest}-${item.eventType}-${index}`}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.eventType}</Text><Badge text={item.isTest ? "테스트" : "운영"} tone={item.isTest ? "warn" : "good"} /></View><Text style={[styles.meta, { color: colors.muted }]}>{item.kstDate} · {item.productCode} · {item.locale} · {item.channel}</Text><Text style={[styles.meta, { color: colors.muted }]}>이벤트 {item.eventCount} · 고유 기기 {item.deviceCount}</Text></Panel>) : <Panel><Text style={styles.noticeText}>이 기간에 수집된 신규 전환 이벤트가 없습니다.</Text></Panel>}<Text style={[styles.section, { color: colors.foreground }]}>기존 통계</Text><View style={styles.grid}><Metric value={visits.data?.totalVisitors ?? 0} label="고유 방문 기기" /><Metric value={tests.data?.freeStart ?? 0} label="무료 시작" color="#b58c2c" /><Metric value={tests.data?.deepResult ?? 0} label="개인 심화 결과" color="#4d6f9f" /><Metric value={tests.data?.coupleResult ?? 0} label="관계 결과" /></View><Text style={[styles.section, { color: colors.foreground }]}>후기 관리</Text>{reviews.data?.map((item) => <Panel key={item.id}><View style={styles.row}><Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.nickname} · {"★".repeat(item.rating)}</Text><TouchableOpacity onPress={() => Alert.alert("후기 삭제", "이 후기를 삭제하시겠습니까?", [{ text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: () => deleteReview.mutate({ id: item.id }) }])}><Text style={styles.delete}>삭제</Text></TouchableOpacity></View>{item.content && <Text style={[styles.review, { color: colors.muted }]}>{item.content}</Text>}<Text style={[styles.meta, { color: colors.muted }]}>{dateText(item.createdAt)}</Text></Panel>)}</>}
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
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }, badgeText: { fontSize: 10, fontWeight: "800" }, noticeTitle: { color: "#3f7b52", fontSize: 14, fontWeight: "800" }, revenueValue: { fontSize: 27, fontWeight: "800" }, noticeText: { color: "#55705a", fontSize: 12, lineHeight: 19 },
  action: { alignSelf: "flex-start", backgroundColor: "#3f7b52", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, actionText: { color: "#fff", fontSize: 12, fontWeight: "800" }, input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, fontSize: 12 }, passwordInput: { width: "100%", maxWidth: 320 }, passwordError: { color: "#b5584f", fontSize: 12, textAlign: "center" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, smallAction: { borderWidth: 1, borderColor: "#a9c8ae", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, smallActionText: { color: "#3f7b52", fontSize: 11, fontWeight: "800" }, dangerAction: { borderWidth: 1, borderColor: "#e3aaa3", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, dangerActionText: { color: "#b5584f", fontSize: 11, fontWeight: "800" },
  expanded: { borderTopWidth: 1, borderTopColor: "#ded9ce", paddingTop: 10, gap: 8 }, emailValue: { fontSize: 12, fontWeight: "700", lineHeight: 18 }, emailDetail: { gap: 5, paddingTop: 6 }, delete: { color: "#b5584f", fontSize: 11, fontWeight: "800" }, review: { fontSize: 12, lineHeight: 18 }, trialUrl: { minHeight: 84, textAlignVertical: "top", fontSize: 10, lineHeight: 15 }, compactInput: { width: 96 }, modalBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(37, 31, 27, 0.42)" }, modalCard: { borderRadius: 16, padding: 18, gap: 12, borderWidth: 1, borderColor: "#ded9ce" }, reasonInput: { minHeight: 84, textAlignVertical: "top" },
});
