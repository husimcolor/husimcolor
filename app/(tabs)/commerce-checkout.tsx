import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getCommerceProduct, isPaidAnalysisProduct, type CommerceProductCode } from "@/shared/commerce";
import { saveCommerceStartGrant } from "@/lib/commerce-access";
import { trpc } from "@/lib/trpc";

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
    channel?: string | string[];
    review?: string | string[];
    reviewResult?: string | string[];
  }>();
  const productCode = getSingleParam(params.product);
  const relationType = getSingleParam(params.relationType);
  const channel = getSingleParam(params.channel) === "web" ? "web" : "app";
  const paymentKey = getSingleParam(params.paymentKey);
  const orderNumber = getSingleParam(params.orderId);
  const amount = Number(getSingleParam(params.amount));
  const requestedCardReview = getSingleParam(params.review) === "toss-card-review";
  const reviewResult = getSingleParam(params.reviewResult);
  const product = productCode ? getCommerceProduct(productCode) : undefined;
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const processedReturn = useRef(false);
  const createCheckout = trpc.commerce.checkout.createTossTest.useMutation();
  const completeCheckout = trpc.commerce.checkout.completeTossTest.useMutation();
  const testMode = trpc.commerce.checkout.testMode.useQuery();
  const paidAnalysisPublicEnabled = testMode.data?.paidAnalysisPublicEnabled ?? false;
  const automaticCardReview = Boolean(testMode.data?.tossCardReviewEnabled && !paidAnalysisPublicEnabled);
  const cardReviewMode = requestedCardReview || automaticCardReview;
  const cardReview = trpc.commerce.checkout.cardReview.useQuery(
    { productCode: productCode as "personal_deep" | "couple_love_deep" | "parent_child_deep" },
    { enabled: cardReviewMode && isPaidAnalysisCode(productCode), retry: false },
  );

  const moveToAnalysis = async (grant: { productCode: CommerceProductCode; accessToken: string; expiresAt: string }) => {
    await saveCommerceStartGrant(grant);
    if (productCode === "personal_deep") {
      router.replace("/(tabs)/premium-info" as any);
      return;
    }
    if (!relationType) throw new Error("RELATION_TYPE_REQUIRED_FOR_RELATIONSHIP_ANALYSIS");
    router.replace({ pathname: "/(tabs)/couple-info", params: { relationType } } as any);
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

  if (!isPaidAnalysisCode(productCode) || !product) {
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
        <Text style={styles.label}>주문 확인 이메일</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="name@example.com" placeholderTextColor="#94887C" />
        <Text style={styles.label}>쿠폰 코드 <Text style={styles.optional}>(선택)</Text></Text>
        <TextInput style={styles.input} value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" placeholder="쿠폰 코드를 입력하세요" placeholderTextColor="#94887C" />
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
  label: { color: "#3C312A", fontSize: 15, fontWeight: "700", marginBottom: 9 },
  optional: { color: "#897D72", fontSize: 13, fontWeight: "400" },
  input: { backgroundColor: "#FFFDF9", borderColor: "#D9CDBF", borderWidth: 1, borderRadius: 12, color: "#2D2420", fontSize: 16, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20 },
  error: { color: "#9D3A34", fontSize: 14, lineHeight: 21, marginBottom: 16 },
  button: { backgroundColor: "#8BAF8B", alignItems: "center", borderRadius: 14, paddingVertical: 17, marginTop: 10 },
  buttonDisabled: { backgroundColor: "#B9B0A6" },
  buttonText: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  back: { alignItems: "center", paddingVertical: 18 },
  backText: { color: "#796B5D", fontSize: 14, fontWeight: "600" },
  message: { color: "#5C4B3E", fontSize: 16, textAlign: "center" },
});
