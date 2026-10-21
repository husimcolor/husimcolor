/**
 * 커플 세션 시작 화면
 * 관계 상품 선택. 실제 관계·역할은 결제 후 한 번만 확정한다.
 */
import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { createConversionEventInput } from "@/lib/conversion-tracking";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  VISIBLE_RELATION_PRODUCTS,
  type VisibleRelationProduct,
} from "@/constants/relationProducts";
import { BusinessInfoFooter } from "@/components/business-info-footer";
import { IntroductionVideoCard } from "@/components/introduction-video-card";
import {
  isOpeningCampaignActive,
  OPENING_CAMPAIGN_DISPLAY_PRICES,
} from "@/shared/opening-campaign";
import {
  getSampleReportButtonLabel,
  type SampleReportProduct,
} from "@/shared/sample-reports";

export default function CoupleStartScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams<{
    restoreProduct?: string | string[];
  }>();
  const colors = useColors();

  const [selectedProductId, setSelectedProductId] = useState<
    VisibleRelationProduct["id"] | null
  >(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 20) : 0;
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // 커플 테스트 시작 추적
  const logVisitor = trpc.visitors.log.useMutation();
  const funnel = trpc.conversionFunnel.track.useMutation();
  const commerceTestMode = trpc.commerce.checkout.testMode.useQuery();
  // 설정 조회 중에도 상품 선택과 정보 입력 안내를 막지 않는다. 결제 실행 여부는
  // 서버가 최종 판정하며, 운영에서 공개가 꺼져도 안내 화면은 볼 수 있다.
  const paidAnalysisPublicEnabled =
    commerceTestMode.data?.paidAnalysisPublicEnabled ?? true;
  const tossCardReviewEnabled =
    commerceTestMode.data?.tossCardReviewEnabled ?? false;
  const tossLiveEnabled = commerceTestMode.data?.tossLiveEnabled === true;
  const openingCampaignActive = isOpeningCampaignActive();

  const getRouteParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const restoreProductId = getRouteParam(routeParams.restoreProduct);
  // 선택 상태와 다음 버튼은 무료 친구 흐름에만 남긴다. 유료 상품은 탭 즉시 checkout으로 이동한다.
  useEffect(() => {
    if (restoreProductId === "friend") setSelectedProductId("friend");
  }, [restoreProductId]);

  useEffect(() => {
    const track = async () => {
      try {
        const deviceId =
          (await AsyncStorage.getItem("husim_device_id")) ?? "unknown";
        logVisitor.mutate({
          deviceId,
          visitType: "couple_start",
          testType: "couple",
        });
      } catch (_) {}
    };
    track();
  }, []);

  const getPaidProductCode = (productId: VisibleRelationProduct["id"]) =>
    productId === "romantic"
      ? "couple_love_deep"
      : productId === "parent-child"
        ? "parent_child_deep"
        : null;

  const openPaidCheckout = (
    paidProductCode: "couple_love_deep" | "parent_child_deep",
  ) => {
    // 이 단계는 checkout 화면으로만 이동한다. 실제 Toss 결제는 checkout의 결제 버튼을 눌렀을 때만 요청한다.
    void createConversionEventInput({
      eventName: "paid_guide_click",
      productCode: paidProductCode,
      scope: `relationship-product-${paidProductCode}`,
    })
      .then((event) => funnel.mutate(event))
      .catch(() => undefined);
    const reviewParam =
      !paidAnalysisPublicEnabled && tossCardReviewEnabled
        ? "&review=toss-card-review"
        : "";
    const lifecycleParam = tossLiveEnabled
      ? ""
      : "&testLifecycle=toss-test-lifecycle";
    router.push(
      `/(tabs)/commerce-checkout?product=${paidProductCode}${lifecycleParam}${reviewParam}` as any,
    );
  };

  const handleProductPress = (product: VisibleRelationProduct) => {
    const paidProductCode = getPaidProductCode(product.id);
    if (paidProductCode) {
      openPaidCheckout(paidProductCode);
      return;
    }
    // 무료 친구 관계만 기존의 두 사람 정보 입력 단계로 이어진다.
    setSelectedProductId("friend");
  };

  const handleFreeFriendStart = () => {
    if (selectedProductId !== "friend") return;
    router.push({
      pathname: "/(tabs)/couple-info",
      params: { relationType: "친구" },
    } as any);
  };

  // 공개 샘플은 고객 PDF 접근과 분리된 앱 내 열람 화면으로 연다.
  // 돌아올 때 현재 상품 선택만 복원한다.
  const handleOpenSamplePdf = (product: SampleReportProduct) => {
    void createConversionEventInput({
      eventName: "paid_guide_click",
      productCode: product,
      scope: `relationship-sample-${product}`,
    })
      .then((event) => funnel.mutate(event))
      .catch(() => undefined);
    router.push({
      pathname: "/(tabs)/sample-report",
      params: {
        product,
        returnTo: "couple-start",
        restoreProduct: selectedProductId === "friend" ? "friend" : "",
      },
    } as any);
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          topPad > 0 && { paddingTop: topPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.backBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backBtnText, { color: colors.muted }]}>
                ←
              </Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: "#2D2420" }]}>
                관계 분석
              </Text>
              <Text style={[styles.subtitle, { color: "#5F4B3B" }]}>
                서로를 이해하는 감성 심리코칭
              </Text>
            </View>
          </View>

          {/* 안내 문구 */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: "#2A2420", borderColor: "#4A3A30" },
            ]}
          >
            <Text style={[styles.infoText, { color: "#F0E8DC" }]}>
              두 사람이 각자 컬러를 선택하고,{"\n"}
              서로의 마음 흐름과 관계 패턴을 함께 살펴봅니다.{"\n"}
              누가 맞고 틀린 것이 아닌,{"\n"}
              서로를 이해하는 시간입니다.
            </Text>
          </View>

          {/* 관계 분석 상품 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: "#2D2420" }]}>
              관계 분석 상품 선택
            </Text>
            {openingCampaignActive && (
              <View style={styles.openingCampaign}>
                <Text style={styles.openingCampaignTitle}>
                  오픈 기념 20% 할인
                </Text>
                <Text style={styles.openingCampaignDeadline}>
                  10월 30일까지
                </Text>
                <Text style={styles.openingCampaignText}>
                  회원·비회원 동일 · 결제 시 자동 적용
                </Text>
                <Text style={styles.openingCampaignNote}>
                  오프라인 코칭 제외
                </Text>
                {paidAnalysisPublicEnabled &&
                commerceTestMode.data?.tossTestEnabled &&
                !tossLiveEnabled ? (
                  <Text style={styles.openingCampaignText}>
                    현재 테스트 운영 중 · Toss 테스트키 사용 · 실제 청구 없음
                  </Text>
                ) : null}
              </View>
            )}
            <View style={styles.productList}>
              {VISIBLE_RELATION_PRODUCTS.map((product) => {
                const sampleProduct =
                  product.id === "romantic"
                    ? "couple_love_deep"
                    : product.id === "parent-child"
                      ? "parent_child_deep"
                      : null;
                const campaignPrice = sampleProduct
                  ? OPENING_CAMPAIGN_DISPLAY_PRICES[sampleProduct]
                  : null;
                return (
                  <View key={product.id} style={styles.productCardGroup}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.productCard,
                        {
                          backgroundColor:
                            selectedProductId === product.id
                              ? "#2A2420"
                              : "#F8F3EA",
                          borderColor:
                            selectedProductId === product.id
                              ? "#2A2420"
                              : "#D8C8B4",
                        },
                        pressed && {
                          opacity: 0.86,
                          transform: [{ scale: 0.985 }],
                        },
                      ]}
                      onPress={() => handleProductPress(product)}
                    >
                      <Text
                        style={[
                          styles.productTitle,
                          {
                            color:
                              selectedProductId === product.id
                                ? "#FFF9F0"
                                : "#2D2420",
                          },
                        ]}
                      >
                        {product.title}
                      </Text>
                      <View style={styles.productPriceGroup}>
                        {openingCampaignActive && campaignPrice ? (
                          <>
                            <Text
                              style={[
                                styles.productRegularPrice,
                                {
                                  color:
                                    selectedProductId === product.id
                                      ? "#E8D4AA"
                                      : "#8B5D2E",
                                },
                              ]}
                            >
                              정가{" "}
                              {campaignPrice.listAmountKrw.toLocaleString()}원
                            </Text>
                            <Text
                              style={[
                                styles.productDiscountPrice,
                                {
                                  color:
                                    selectedProductId === product.id
                                      ? "#FFF3CE"
                                      : "#725019",
                                },
                              ]}
                            >
                              → {campaignPrice.finalAmountKrw.toLocaleString()}
                              원
                            </Text>
                          </>
                        ) : (
                          <Text
                            style={[
                              styles.productPrice,
                              {
                                color:
                                  selectedProductId === product.id
                                    ? "#F4D9A8"
                                    : "#8B5D2E",
                              },
                            ]}
                          >
                            {product.price}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                    {product.id === "romantic" ? (
                      <IntroductionVideoCard
                        title="두 사람이 이용하는 방법"
                        description="각자 참여하고 초대 링크로 결과를 함께 확인하는 흐름을 살펴보세요."
                        videoSource={require('../../assets/videos/relationship-how-to-use-ko.mp4')}
                        posterSource={require('../../assets/images/video-posters/relationship-how-to-use-ko.jpg')}
                        accessibilityLabel="두 사람이 이용하는 방법 영상 재생하기"
                      />
                    ) : null}
                    {sampleProduct ? (
                      <Pressable
                        onPress={() => handleOpenSamplePdf(sampleProduct)}
                        style={({ pressed }) => [
                          styles.productSampleButton,
                          pressed && styles.productSampleButtonPressed,
                        ]}
                        accessibilityRole="link"
                        accessibilityLabel={getSampleReportButtonLabel(
                          sampleProduct,
                        )}
                      >
                        <Text style={styles.productSampleButtonText}>
                          {getSampleReportButtonLabel(sampleProduct)}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {selectedProductId === "friend" ? (
            <Pressable
              style={({ pressed }) => [
                styles.startBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleFreeFriendStart}
            >
              <Text style={[styles.startBtnText, { color: "#fff" }]}>
                다음 · 두 사람 정보 입력하기
              </Text>
            </Pressable>
          ) : null}

          <BusinessInfoFooter />
          <View style={{ height: 28 }} />
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, fontWeight: "600" },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: 0.3 },
  subtitle: { fontSize: 13, marginTop: 2, fontWeight: "500" },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  infoText: { fontSize: 15, lineHeight: 26, textAlign: "center" },
  section: { marginBottom: 24 },
  openingCampaign: {
    marginBottom: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E4C978",
    backgroundColor: "#FFF7DA",
    padding: 11,
    gap: 3,
  },
  openingCampaignTitle: { color: "#75561B", fontSize: 13, fontWeight: "800" },
  openingCampaignDeadline: {
    color: "#5E4512",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },
  openingCampaignText: {
    color: "#8D6B25",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "800",
  },
  openingCampaignNote: { color: "#806F50", fontSize: 11, lineHeight: 16 },
  productList: { gap: 10 },
  productCardGroup: { gap: 3 },
  productCard: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  productTitle: { flex: 1, fontSize: 16, lineHeight: 23, fontWeight: "700" },
  productPrice: { fontSize: 16, fontWeight: "800", letterSpacing: 0.2 },
  productPriceGroup: { alignItems: "flex-end", gap: 1 },
  productRegularPrice: {
    fontSize: 11,
    fontWeight: "700",
    textDecorationLine: "line-through",
  },
  productDiscountPrice: { fontSize: 17, lineHeight: 22, fontWeight: "900" },
  productSampleButton: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#9CB797",
    backgroundColor: "#EDF4E9",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  productSampleButtonText: {
    color: "#3E6A3A",
    fontSize: 16,
    fontWeight: "800",
  },
  productSampleButtonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 14, fontWeight: "500" },
  startBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  startBtnText: { fontSize: 16, fontWeight: "600", letterSpacing: 0.3 },
});
