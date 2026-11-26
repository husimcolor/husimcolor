import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/components/screen-container";
import {
  DECEMBER_COUPON_STATE_LABELS,
  DecemberOfferPrice,
  formatDecemberKrw,
  type DecemberCouponOffer,
} from "@/components/december-event-banner";
import { startKakaoLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

export default function DecemberCouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const utils = trpc.useUtils();
  const claimInProgress = useRef(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const decemberStatus = trpc.commerce.coupons.decemberStatus.useQuery(undefined, {
    enabled: !auth.loading,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 10_000,
  });
  const refetchDecemberStatus = decemberStatus.refetch;
  useEffect(() => {
    setFeedback(null);
    setLoginError(null);
    if (!auth.loading) void refetchDecemberStatus();
  }, [auth.user?.id, auth.loading, refetchDecemberStatus]);
  const claim = trpc.commerce.coupons.claimDecember.useMutation();
  const active = decemberStatus.isSuccess && decemberStatus.data?.active === true;
  const offers: DecemberCouponOffer[] = decemberStatus.data?.offers ?? [];
  const hasAvailableCoupons = offers.some((offer) => offer.state === "available");
  const claimDisabled = !active || !hasAvailableCoupons || auth.loading || Boolean(auth.error) || claim.isPending || decemberStatus.isFetching;

  const handleClaimAll = async () => {
    if (claimDisabled || claimInProgress.current) return;
    setFeedback(null);
    setLoginError(null);
    // Only the authenticated account owns coupons; never email or device storage.
    if (!auth.isAuthenticated) {
      if (!startKakaoLogin("/december-coupons")) {
        setLoginError("카카오 로그인은 휴심컬러 웹앱에서 이용해 주세요.");
      }
      return;
    }
    claimInProgress.current = true;
    claim.reset();
    try {
      const status = await claim.mutateAsync();
      utils.commerce.coupons.decemberStatus.setData(undefined, status);
      setFeedback(status.active ? "쿠폰 상태를 확인했습니다. 발급된 쿠폰을 상품별로 이용해 보세요." : "이벤트 기간이 종료되어 쿠폰을 발급할 수 없습니다.");
      void utils.commerce.coupons.decemberStatus.invalidate();
    } catch {
      // A concurrent expiry/reservation or session change must be rechecked on the server.
      void decemberStatus.refetch();
      void auth.refresh();
    } finally {
      claimInProgress.current = false;
    }
  };

  const openCheckout = (offer: DecemberCouponOffer) => {
    const couponParam = active && offer.state === "issued"
      ? `&couponCode=${encodeURIComponent(offer.couponCode)}`
      : "";
    router.push(`/(tabs)/commerce-checkout?product=${offer.productCode}${couponParam}` as any);
  };

  const renderOffer = ({ item: offer }: { item: DecemberCouponOffer }) => (
    <View style={styles.offerCard} testID={`december-coupon-${offer.productCode}`}>
      <View style={styles.offerHeading}>
        <Text style={styles.offerTitle}>{offer.name}</Text>
        <View style={[styles.stateBadge, offer.state === "issued" && styles.issuedBadge]}>
          <Text style={styles.stateText}>{DECEMBER_COUPON_STATE_LABELS[offer.state]}</Text>
        </View>
      </View>
      <View style={styles.offerBody}>
        <View style={styles.offerDescription}>
          {active ? <Text style={styles.discountLabel}>
            {offer.discountType === "percent"
              ? `${offer.discountValue}% 할인`
              : `${formatDecemberKrw(offer.discountValue)} 할인`}
          </Text> : null}
          <Text style={styles.offerNote}>
            {offer.state === "available" ? "로그인 후 전체 쿠폰을 한 번에 받으세요."
              : offer.state === "issued" ? "내 계정에 발급된 쿠폰입니다."
                : offer.state === "reserved" ? "결제 진행 중입니다. 결제 결과 확인 후 상태가 갱신됩니다."
                  : offer.state === "used" ? "이미 사용한 쿠폰입니다. 다시 발급되지 않습니다."
                    : "사용 기간이 끝난 쿠폰입니다."}
          </Text>
        </View>
        {active ? <DecemberOfferPrice offer={offer} /> : <Text style={styles.regularPrice}>{formatDecemberKrw(offer.listAmountKrw)}</Text>}
      </View>
      {active && offer.state === "issued" ? <Text selectable style={styles.couponCode}>쿠폰 코드 · {offer.couponCode}</Text> : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${offer.name} 결제 화면 보기`}
        onPress={() => openCheckout(offer)}
        style={({ pressed }) => [styles.productLink, pressed && styles.pressed]}
      >
        <Text style={styles.productLinkText}>{active && offer.state === "issued" ? "쿠폰으로 결제하기 →" : "상품 결제 화면 보기 →"}</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} style={styles.screen}>
      <FlatList
        data={offers}
        renderItem={renderOffer}
        keyExtractor={(offer) => offer.productCode}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshing={!auth.loading && decemberStatus.isFetching}
        onRefresh={() => { void decemberStatus.refetch(); }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable
              onPress={() => router.replace("/(tabs)/index" as any)}
              style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}
              accessibilityRole="link"
            >
              <Text style={styles.backText}>← 휴심컬러 홈</Text>
            </Pressable>
            <Text style={styles.eyebrow}>12.01 ~ 12.31</Text>
            <Text style={styles.title}>12월 연말 감사 이벤트</Text>
            <Text style={styles.intro}>{"한 해 동안 애써온 나에게,\n소중한 우리 가족에게,\n마음을 이해하는 시간을 선물하세요."}</Text>
            <View style={styles.claimPanel}>
              <Text style={styles.claimTitle}>나와 우리 가족을 위한 쿠폰 3종</Text>
              <Text style={styles.claimNote}>{auth.isAuthenticated ? "쿠폰은 로그인한 내 계정에 발급됩니다." : "카카오 로그인 후 내 계정으로 쿠폰을 받으세요."}</Text>
              <Pressable
                onPress={() => { void handleClaimAll(); }}
                disabled={claimDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: claimDisabled, busy: claim.isPending }}
                testID="december-claim-all"
                style={({ pressed }) => [styles.claimButton, claimDisabled && styles.disabled, pressed && !claimDisabled && styles.pressed]}
              >
                {claim.isPending ? <ActivityIndicator color="#FFFDF6" /> : <Text style={styles.claimButtonText}>
                  {auth.loading || decemberStatus.isLoading ? "쿠폰 확인 중…"
                    : decemberStatus.isError ? "쿠폰 상태 확인 필요"
                      : !active ? "이벤트 기간에 발급할 수 있어요"
                        : !hasAvailableCoupons ? "전체 쿠폰 상태 확인 완료"
                          : "전체 할인 쿠폰 받기"}
                </Text>}
              </Pressable>
              {!auth.isAuthenticated && active ? <Text style={styles.loginNote}>로그인이 필요합니다 · 로그인 후 이 화면으로 돌아옵니다.</Text> : null}
            </View>
            {auth.loading || decemberStatus.isLoading ? <View style={styles.loading}>
              <ActivityIndicator color="#526E59" />
              <Text style={styles.bodyText}>쿠폰 정보를 확인하고 있습니다.</Text>
            </View> : null}
            {auth.error ? <View style={styles.errorPanel} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>로그인 상태를 확인하지 못했습니다.</Text>
              <Pressable onPress={() => { void auth.refresh(); }} style={styles.retryButton} accessibilityRole="button"><Text style={styles.retryText}>로그인 상태 다시 확인</Text></Pressable>
            </View> : null}
            {decemberStatus.isError ? <View style={styles.errorPanel} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>쿠폰 정보를 불러오지 못했습니다. 다시 시도해 주세요.</Text>
              <Pressable onPress={() => { void decemberStatus.refetch(); }} style={styles.retryButton} accessibilityRole="button"><Text style={styles.retryText}>다시 시도</Text></Pressable>
            </View> : null}
            {claim.isError ? <View style={styles.errorPanel} accessibilityLiveRegion="polite">
              <Text style={styles.errorText}>쿠폰을 발급하지 못했습니다. 로그인 상태와 이벤트 기간을 확인한 뒤 다시 시도해 주세요.</Text>
              <Text style={styles.bodyText}>위의 전체 할인 쿠폰 받기 버튼으로 재시도할 수 있습니다.</Text>
            </View> : null}
            {loginError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{loginError}</Text> : null}
            {feedback ? <Text style={styles.feedback} accessibilityLiveRegion="polite">{feedback}</Text> : null}
            {decemberStatus.isSuccess && !active ? <View style={styles.inactivePanel}>
              <Text style={styles.bodyText}>현재는 이벤트 기간이 아닙니다. 쿠폰 발급과 할인 적용은 12월 이벤트 기간에만 가능합니다.</Text>
            </View> : null}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerText}>상품별 쿠폰 상태는 서버에서 확인합니다. 결제 예약 중이거나 사용 완료된 쿠폰은 중복으로 사용할 수 없습니다.</Text>
            <Text style={styles.footerText}>최종 할인 적용 여부와 결제 금액은 결제 화면에서 확인해 주세요. 쿠폰 발급 시 이메일은 발송되지 않습니다.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#FBF7EF" },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 20, paddingTop: 12 },
  header: { gap: 12, marginBottom: 18 },
  backLink: { minHeight: 44, alignSelf: "flex-start", justifyContent: "center", paddingRight: 16 },
  backText: { color: "#536B57", fontSize: 14, lineHeight: 21, fontWeight: "600" },
  eyebrow: { color: "#827054", fontSize: 12, lineHeight: 18, fontWeight: "700", letterSpacing: 1 },
  title: { color: "#514330", fontSize: 24, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  intro: { color: "#686052", fontSize: 15, lineHeight: 25 },
  claimPanel: { backgroundColor: "#F2EBDD", borderColor: "#D8C5A1", borderWidth: 1, borderRadius: 18, padding: 16, gap: 9, marginTop: 4 },
  claimTitle: { color: "#53462F", fontSize: 16, lineHeight: 24, fontWeight: "800" },
  claimNote: { color: "#706654", fontSize: 13, lineHeight: 20 },
  claimButton: { minHeight: 50, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: "#526E59", borderRadius: 12, alignItems: "center", justifyContent: "center" },
  claimButtonText: { color: "#FFFDF6", fontSize: 15, lineHeight: 23, fontWeight: "800", textAlign: "center" },
  disabled: { backgroundColor: "#918B7E" },
  pressed: { opacity: 0.84, transform: [{ scale: 0.98 }] },
  loginNote: { color: "#746951", fontSize: 11, lineHeight: 17 },
  loading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  bodyText: { color: "#6B6356", fontSize: 13, lineHeight: 21 },
  errorPanel: { backgroundColor: "#FFF1EC", borderRadius: 12, padding: 14, gap: 6 },
  errorText: { color: "#984D39", fontSize: 13, lineHeight: 21 },
  retryButton: { minHeight: 44, justifyContent: "center", alignSelf: "flex-start", paddingHorizontal: 10 },
  retryText: { color: "#6B573D", fontSize: 14, lineHeight: 21, fontWeight: "800", textDecorationLine: "underline" },
  feedback: { color: "#426449", fontSize: 13, lineHeight: 21 },
  inactivePanel: { borderRadius: 12, padding: 14, backgroundColor: "#EEE8DE" },
  separator: { height: 12 },
  offerCard: { backgroundColor: "#FFFDF7", borderWidth: 1, borderColor: "#DDD0B8", borderRadius: 18, padding: 16, gap: 14 },
  offerHeading: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 },
  offerTitle: { color: "#514330", fontSize: 17, lineHeight: 25, fontWeight: "800", flexShrink: 1 },
  stateBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#F0EADD" },
  issuedBadge: { backgroundColor: "#E8F0E5" },
  stateText: { color: "#596451", fontSize: 11, lineHeight: 17, fontWeight: "700" },
  offerBody: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  offerDescription: { flex: 1, gap: 5 },
  discountLabel: { color: "#80613D", fontSize: 15, lineHeight: 23, fontWeight: "800" },
  offerNote: { color: "#817666", fontSize: 12, lineHeight: 19 },
  regularPrice: { color: "#705330", fontSize: 18, lineHeight: 25, fontWeight: "800" },
  couponCode: { color: "#6C624F", fontSize: 11, lineHeight: 18 },
  productLink: { minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: "#C7D4C1", backgroundColor: "#F0F4EB", alignItems: "center", justifyContent: "center", paddingHorizontal: 12, paddingVertical: 10 },
  productLinkText: { color: "#4E6A53", fontSize: 13, lineHeight: 20, fontWeight: "800" },
  footer: { gap: 8, paddingVertical: 22 },
  footerText: { color: "#8C806E", fontSize: 11, lineHeight: 18 },
});
