import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getCommerceProduct, isPaidAnalysisProduct, type CommerceProductCode } from "@/shared/commerce";
import { saveCommerceStartGrant } from "@/lib/commerce-access";
import { trpc } from "@/lib/trpc";
import { OPENING_CAMPAIGN_COUPON_CODE, isOpeningCampaignAvailable } from "@/shared/opening-campaign";

type TossPaymentsInstance = {
  payment(input: { customerKey: "ANONYMOUS" }): {
    requestPayment(input: {
      method: "CARD";
      amount: { currency: "KRW"; value: number };
      orderId: string;
      orderName: string;
      customerEmail: string;
      successUrl: string;
      failUrl: string;
      card?: {
        flowMode: "DEFAULT";
      };
      windowTarget?: "self" | "iframe";
    }): Promise<void>;
  };
};

const ANALYSIS_SERVICE_PERIOD = "검사 완료 즉시 제공 · 기술적 오류 발생 시 최대 24시간 이내 제공 상태를 확인·안내";
const COACHING_SERVICE_PERIOD = "희망 일정 접수 후 3영업일 이내 일정 안내 · 결제일로부터 최대 60일 이내 서비스 제공";
const REFUND_POLICY_URL = "https://husimcolor.com/refund-policy";

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance;
  }
}

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isPaidAnalysisCode(value: string | undefined): value is Extract<CommerceProductCode, "personal_deep" | "couple_love_deep" | "parent_child_deep"> {
  return Boolean(value && isPaidAnalysisProduct(value));
}

function isCardReviewProductCode(value: string | undefined): value is Extract<CommerceProductCode, "personal_deep" | "couple_love_deep" | "parent_child_deep" | "personal_coaching" | "couple_coaching"> {
  return isPaidAnalysisCode(value) || value === "personal_coaching" || value === "couple_coaching";
}

function getCardReviewServicePeriod(productCode: string | undefined) {
  return productCode === "personal_coaching" || productCode === "couple_coaching"
    ? COACHING_SERVICE_PERIOD
    : ANALYSIS_SERVICE_PERIOD;
}

function getIdempotencyKey(): string {
  return `checkout-${crypto.randomUUID()}`;
}

async function loadTossPaymentsScript(): Promise<(clientKey: string) => TossPaymentsInstance> {
  if (window.TossPayments) return window.TossPayments;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector("script[data-husim-toss-sdk]") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("TOSS_SDK_LOAD_FAILED")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    script.dataset.husimTossSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TOSS_SDK_LOAD_FAILED"));
    document.head.appendChild(script);
  });
  if (!window.TossPayments) throw new Error("TOSS_SDK_NOT_AVAILABLE");
  return window.TossPayments;
}

export default function CommerceCheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    product?: string | string[];
    relationType?: string | string[];
    paymentKey?: string | string[];
    orderId?: string | string[];
    amount?: string | string[];
    code?: string | string[];
    message?: string | string[];
    channel?: string | string[];
    review?: string | string[];
    reviewResult?: string | string[];
    testLifecycle?: string | string[];
  }>();
  const productCode = getSingleParam(params.product);
  const relationType = getSingleParam(params.relationType);
  const channel = getSingleParam(params.channel) === "web" ? "web" : "app";
  const paymentKey = getSingleParam(params.paymentKey);
  const orderNumber = getSingleParam(params.orderId);
  const amount = Number(getSingleParam(params.amount));
  const failureCode = getSingleParam(params.code);
  const failureMessage = getSingleParam(params.message);
  const requestedCardReview = getSingleParam(params.review) === "toss-card-review";
  // Preview QA can opt into the persistent Toss test lifecycle without
  // changing the normal card-review path. The runtime/server guards still
  // reject this outside the explicitly configured Preview test environment.
  const requestedPreviewLifecycle = getSingleParam(params.testLifecycle) === "toss-test-lifecycle";
  const reviewResult = getSingleParam(params.reviewResult);
  const product = productCode ? getCommerceProduct(productCode) : undefined;
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const processedReturn = useRef(false);
  const createCheckout = trpc.commerce.checkout.createTossTest.useMutation();
  const completeCheckout = trpc.commerce.checkout.completeTossTest.useMutation();
  const completeFailedCheckout = trpc.commerce.checkout.completeTossTestFailure.useMutation();
  const testMode = trpc.commerce.checkout.testMode.useQuery();
  const paidAnalysisPublicEnabled = testMode.data?.paidAnalysisPublicEnabled ?? false;
  // When card review is enabled, every paid-analysis entry uses the non-persistent
  // review handoff first, even though Preview also has test-payment mode enabled.
  const automaticCardReview = Boolean(
    testMode.data?.tossCardReviewEnabled &&
    isPaidAnalysisCode(productCode) &&
    !requestedPreviewLifecycle,
  );
  const cardReviewMode = requestedCardReview || automaticCardReview;
  const cardReview = trpc.commerce.checkout.cardReview.useQuery(
    { productCode: productCode as "personal_deep" | "couple_love_deep" | "parent_child_deep" | "personal_coaching" | "couple_coaching" },
    { enabled: cardReviewMode && isCardReviewProductCode(productCode), retry: false },
  );
  const cardReviewServicePeriod = getCardReviewServicePeriod(productCode);
  const openingCampaignAvailable = isOpeningCampaignAvailable(productCode);
  const couponQuote = trpc.commerce.coupons.preview.useQuery(
    {
      couponCode: couponCode.trim(),
      productCode: productCode as "personal_deep" | "couple_love_deep" | "parent_child_deep",
      listAmountKrw: product?.amountKrw ?? 0,
    },
    { enabled: Boolean(isPaidAnalysisCode(productCode) && couponCode.trim() && product?.amountKrw) },
  );

  const moveToAnalysis = async (grant: { productCode: CommerceProductCode; accessToken: string; expiresAt: string }) => {
    await saveCommerceStartGrant(grant);
    if (productCode === "personal_deep") {
      router.replace("/(tabs)/premium-info" as any);
      return;
    }
    if (!relationType) throw new Error("RELATION_TYPE_REQUIRED_FOR_RELATIONSHIP_ANALYSIS");
    router.replace({ pathname: "/(tabs)/relationship-mode", params: { product: productCode, relationType } } as any);
  };

  useEffect(() => {
    if (cardReviewMode || !paymentKey || !orderNumber || !Number.isInteger(amount) || amount < 0 || processedReturn.current || !isPaidAnalysisCode(productCode)) return;
    processedReturn.current = true;
    setProcessing(true);
    completeCheckout
      .mutateAsync({ paymentKey, orderNumber, amountKrw: amount })
      .then(async (result) => {
        if (!result.startGrant) throw new Error("PAYMENT_GRANT_NOT_ISSUED");
        await moveToAnalysis(result.startGrant);
      })
      .catch(() => setMessage("테스트 결제 승인 확인에 실패했습니다. 동일 결제를 다시 요청하지 말고 관리자에게 주문번호를 알려 주세요."))
      .finally(() => setProcessing(false));
  }, [cardReviewMode, paymentKey, orderNumber, amount, productCode]);

  useEffect(() => {
    if (cardReviewMode || paymentKey || !failureCode || !orderNumber || processedReturn.current || !isPaidAnalysisCode(productCode)) return;
    processedReturn.current = true;
    setProcessing(true);
    completeFailedCheckout
      .mutateAsync({ orderNumber, errorCode: failureCode, errorMessage: failureMessage })
      .then((result) => {
        setMessage(result.status === "cancelled"
          ? "결제가 취소되었습니다. 사용 예약된 쿠폰이 있었다면 다시 사용할 수 있습니다."
          : "결제에 실패했습니다. 사용 예약된 쿠폰이 있었다면 다시 사용할 수 있습니다.");
      })
      .catch(() => setMessage("결제 결과를 확인하지 못했습니다. 동일 결제를 다시 요청하지 말고 관리자에게 주문번호를 알려 주세요."))
      .finally(() => setProcessing(false));
  }, [cardReviewMode, paymentKey, failureCode, failureMessage, orderNumber, productCode]);

  const requestPayment = async () => {
    if (!isPaidAnalysisCode(productCode) || !product) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("결과와 주문 확인에 사용할 이메일을 입력해 주세요.");
      return;
    }
    if (Platform.OS !== "web") {
      setMessage("토스 테스트 결제창은 현재 웹 환경에서만 연결되어 있습니다.");
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      const checkout = await createCheckout.mutateAsync({
        productCode,
        email: email.trim(),
        idempotencyKey: getIdempotencyKey(),
        couponCode: couponCode.trim() || undefined,
        channel,
      });
      if (checkout.status === "paid") {
        if (!checkout.startGrant) throw new Error("COUPON_GRANT_NOT_ISSUED");
        await moveToAnalysis(checkout.startGrant);
        return;
      }
      const TossPayments = await loadTossPaymentsScript();
      const tossPayments = TossPayments(checkout.tossClientKey);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });
      const origin = window.location.origin;
      const baseParams = new URLSearchParams({
        product: productCode,
        ...(relationType ? { relationType } : {}),
        ...(channel === "web" ? { channel } : {}),
        ...(requestedPreviewLifecycle ? { testLifecycle: "toss-test-lifecycle" } : {}),
      }).toString();
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: checkout.finalAmountKrw },
        orderId: checkout.orderNumber,
        orderName: checkout.productName,
        customerEmail: email.trim(),
        successUrl: `${origin}/commerce-checkout?${baseParams}`,
        failUrl: `${origin}/commerce-checkout?${baseParams}`,
        card: { flowMode: "DEFAULT" },
        windowTarget: "self",
      });
    } catch (error) {
      setMessage(error instanceof Error && error.message.includes("COUPON") ? "쿠폰을 적용할 수 없습니다. 코드와 조건을 확인해 주세요." : "테스트 결제 준비에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setProcessing(false);
    }
  };

  const requestCardReviewPayment = async () => {
    if (!cardReview.data || Platform.OS !== "web") {
      setMessage("심사용 Toss 테스트 결제창은 현재 웹 환경에서만 연결되어 있습니다.");
      return;
    }
    setProcessing(true);
    setMessage(null);
    try {
      const TossPayments = await loadTossPaymentsScript();
      const tossPayments = TossPayments(cardReview.data.tossClientKey);
      const payment = tossPayments.payment({ customerKey: "ANONYMOUS" });
      const origin = window.location.origin;
      const baseParams = new URLSearchParams({
        product: cardReview.data.productCode,
        ...(relationType ? { relationType } : {}),
        ...(channel === "web" ? { channel } : {}),
        review: "toss-card-review",
        reviewResult: "returned",
      }).toString();
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: cardReview.data.amountKrw },
        orderId: cardReview.data.orderNumber,
        orderName: cardReview.data.productName,
        customerEmail: cardReview.data.customerEmail,
        successUrl: `${origin}/commerce-checkout?${baseParams}`,
        failUrl: `${origin}/commerce-checkout?${baseParams}`,
        card: { flowMode: "DEFAULT" },
        windowTarget: "self",
      });
    } catch {
      setMessage("심사용 Toss 테스트 결제창을 열지 못했습니다. 결제 승인이나 주문 생성은 수행되지 않았습니다.");
    } finally {
      setProcessing(false);
    }
  };

  // Coaching remains unavailable to the ordinary app checkout. It can render
  // only after the explicit review-only switch has selected its read-only
  // configuration above.
  const canRenderCardReview = cardReviewMode && isCardReviewProductCode(productCode);
  if ((!isPaidAnalysisCode(productCode) && !canRenderCardReview) || !product) {
    return <ScreenContainer><View style={styles.center}><Text style={styles.message}>결제할 분석 상품을 먼저 선택해 주세요.</Text></View></ScreenContainer>;
  }

  if (cardReviewMode && reviewResult) {
    return (
      <ScreenContainer><View style={styles.center}>
        <Text style={styles.title}>심사용 Toss 테스트 확인 완료</Text>
        <Text style={styles.reviewNotice}>이 화면은 카드사 심사용 결제창 확인 전용입니다. 결제 승인, 주문 생성, 이용권 발급, 분석 시작은 수행하지 않았습니다.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/index' as any)} style={styles.back}><Text style={styles.backText}>홈으로 돌아가기</Text></Pressable>
      </View></ScreenContainer>
    );
  }

  if (cardReviewMode) {
    if (cardReview.isLoading) {
      return <ScreenContainer><View style={styles.center}><ActivityIndicator color="#3f7b52" /></View></ScreenContainer>;
    }
    if (!cardReview.data) {
      return <ScreenContainer><View style={styles.center}><Text style={styles.message}>심사용 Toss 테스트 결제창은 현재 열 수 없습니다.</Text><Pressable onPress={() => router.replace('/(tabs)/index' as any)} style={styles.back}><Text style={styles.backText}>홈으로 돌아가기</Text></Pressable></View></ScreenContainer>;
    }
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.eyebrow}>TOSS PAYMENTS CARD REVIEW</Text>
          <Text style={styles.title}>{cardReview.data.productName}</Text>
            <Text style={styles.price}>{cardReview.data.amountKrw.toLocaleString()}원</Text>
            <View style={styles.servicePeriodCard}>
              <Text style={styles.servicePeriodTitle}>서비스 제공기간</Text>
            <Text style={styles.servicePeriodText}>{cardReviewServicePeriod}</Text>
            <Pressable onPress={() => Linking.openURL(REFUND_POLICY_URL)} accessibilityRole="link" accessibilityLabel="환불정책 확인하기">
              <Text style={styles.policyLink}>환불정책 확인</Text>
            </Pressable>
          </View>
          <Text style={styles.reviewNotice}>카드사 심사용 Toss 테스트 결제창입니다. 실제 청구, 고객·주문·결제 데이터 생성, 이용권 발급, 분석 시작은 수행하지 않습니다.</Text>
          {message ? <Text style={styles.error}>{message}</Text> : null}
          <Pressable disabled={processing} onPress={requestCardReviewPayment} style={({ pressed }) => [styles.button, processing && styles.buttonDisabled, pressed && !processing && { opacity: 0.86 }]}>
            {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Toss 테스트 결제창 열기</Text>}
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>이전으로 돌아가기</Text></Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (!paidAnalysisPublicEnabled) {
    return <ScreenContainer><View style={styles.center}><Text style={styles.message}>이 상품은 정식 오픈 준비중입니다.</Text><Pressable onPress={() => router.replace('/(tabs)/index' as any)} style={styles.back}><Text style={styles.backText}>홈으로 돌아가기</Text></Pressable></View></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>휴심컬러 테스트 결제</Text>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>{product.amountKrw?.toLocaleString()}원</Text>
        <Text style={styles.notice}>토스 심사 완료 전에는 테스트 키로만 동작하며 실제 청구는 발생하지 않습니다.</Text>
        <View style={styles.servicePeriodCard}>
          <Text style={styles.servicePeriodTitle}>서비스 제공기간</Text>
          <Text style={styles.servicePeriodText}>{ANALYSIS_SERVICE_PERIOD}</Text>
          <Pressable onPress={() => Linking.openURL(REFUND_POLICY_URL)} accessibilityRole="link" accessibilityLabel="환불정책 확인하기">
            <Text style={styles.policyLink}>환불정책 확인</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>주문 확인 이메일</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="name@example.com" placeholderTextColor="#94887C" />
        <Text style={styles.label}>쿠폰 코드 <Text style={styles.optional}>(선택)</Text></Text>
        {openingCampaignAvailable && <View style={styles.openingCampaignCard}>
          <Text style={styles.openingCampaignTitle}>휴심컬러 유료 심화분석 오픈 기념 20% 할인</Text>
          <Text style={styles.openingCampaignText}>10월 30일까지 · 회원가입 없이 이용 가능 · 오프라인 코칭 제외</Text>
          <Text style={styles.openingCampaignPrompt}>오픈 기념 20% 할인 쿠폰을 적용해 주세요.</Text>
          <Pressable onPress={() => { setCouponCode(OPENING_CAMPAIGN_COUPON_CODE); setMessage(null); }} style={styles.campaignButton}>
            <Text style={styles.campaignButtonText}>20% 할인 쿠폰 적용</Text>
          </Pressable>
        </View>}
        <TextInput style={styles.input} value={couponCode} onChangeText={(value) => { setCouponCode(value); setMessage(null); }} autoCapitalize="characters" placeholder="쿠폰 코드를 입력하세요" placeholderTextColor="#94887C" />
        {couponQuote.isSuccess && couponQuote.data && <View style={styles.couponQuote}>
          <Text style={styles.couponQuoteTitle}>쿠폰이 적용되었습니다</Text>
          <Text style={styles.couponQuoteText}>정가 {product.amountKrw?.toLocaleString()}원 → 할인 {couponQuote.data.discountAmountKrw.toLocaleString()}원 → 결제 예정 {couponQuote.data.finalAmountKrw.toLocaleString()}원</Text>
        </View>}
        {couponQuote.isError && couponCode.trim() ? <Text style={styles.couponError}>쿠폰을 적용할 수 없습니다. 코드와 조건을 확인해 주세요.</Text> : null}
        {message ? <Text style={styles.error}>{message}</Text> : null}
        <Pressable disabled={processing || testMode.isLoading || !testMode.data?.tossTestEnabled} onPress={requestPayment} style={({ pressed }) => [styles.button, (processing || !testMode.data?.tossTestEnabled) && styles.buttonDisabled, pressed && !processing && { opacity: 0.86 }]}>
          {processing ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{testMode.data?.tossTestEnabled ? "토스 테스트 결제 진행" : "테스트 결제 준비 중"}</Text>}
        </Pressable>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>이전으로 돌아가기</Text></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, backgroundColor: "#F8F3EA" },
  center: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#8B6B4A", fontSize: 13, fontWeight: "800", letterSpacing: 0.8, marginTop: 16 },
  title: { color: "#2D2420", fontSize: 25, fontWeight: "800", marginTop: 10, textAlign: "center" },
  price: { color: "#7D5E38", fontSize: 20, fontWeight: "800", marginTop: 8, textAlign: "center" },
  notice: { color: "#6D6258", fontSize: 14, lineHeight: 22, marginTop: 18, marginBottom: 28 },
  reviewNotice: { color: "#5C4B3E", fontSize: 14, lineHeight: 22, marginTop: 18, marginBottom: 28, textAlign: "center" },
  servicePeriodCard: { backgroundColor: "#EFF6EE", borderColor: "#B4CCB3", borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14, marginBottom: 22 },
  servicePeriodTitle: { color: "#3D6645", fontSize: 14, fontWeight: "800" },
  servicePeriodText: { color: "#4D594D", fontSize: 13, lineHeight: 20, marginTop: 5 },
  policyLink: { color: "#3F7B52", fontSize: 13, fontWeight: "800", textDecorationLine: "underline", marginTop: 8 },
  label: { color: "#3C312A", fontSize: 15, fontWeight: "700", marginBottom: 9 },
  optional: { color: "#897D72", fontSize: 13, fontWeight: "400" },
  input: { backgroundColor: "#FFFDF9", borderColor: "#D9CDBF", borderWidth: 1, borderRadius: 12, color: "#2D2420", fontSize: 16, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20 },
  openingCampaignCard: { backgroundColor: "#FFF7DA", borderColor: "#E4C978", borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 13, gap: 6 },
  openingCampaignTitle: { color: "#75561B", fontSize: 14, fontWeight: "800" },
  openingCampaignText: { color: "#8D6B25", fontSize: 12, lineHeight: 18 },
  openingCampaignPrompt: { color: "#765B27", fontSize: 12, fontWeight: "700", marginTop: 2 },
  campaignButton: { alignSelf: "flex-start", backgroundColor: "#7E6428", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginTop: 2 },
  campaignButtonText: { color: "#FFF", fontSize: 12, fontWeight: "800" },
  couponQuote: { backgroundColor: "#EFF6EE", borderColor: "#B4CCB3", borderWidth: 1, borderRadius: 12, padding: 12, marginTop: -8, marginBottom: 16, gap: 4 },
  couponQuoteTitle: { color: "#3D6645", fontSize: 13, fontWeight: "800" },
  couponQuoteText: { color: "#4D594D", fontSize: 12, lineHeight: 18 },
  couponError: { color: "#9D3A34", fontSize: 13, lineHeight: 19, marginTop: -8, marginBottom: 16 },
  error: { color: "#9D3A34", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  button: { backgroundColor: "#8BAF8B", alignItems: "center", borderRadius: 14, paddingVertical: 17, marginTop: 10 },
  buttonDisabled: { backgroundColor: "#B9B0A6" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  back: { alignItems: "center", paddingVertical: 18 },
  backText: { color: "#796B5D", fontSize: 14, fontWeight: "600" },
  message: { color: "#5C4B3E", fontSize: 16, textAlign: "center" },
});
