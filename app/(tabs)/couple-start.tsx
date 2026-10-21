/**
 * 커플 세션 시작 화면
 * 관계 상품 선택. 실제 관계·역할은 결제 후 한 번만 확정한다.
 */
import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LocalizedText as Text } from "@/components/localized-text";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  VISIBLE_RELATION_PRODUCTS,
  type VisibleRelationProduct,
} from "@/constants/relationProducts";
import { BusinessInfoFooter } from "@/components/business-info-footer";
import {
  isOpeningCampaignActive,
  OPENING_CAMPAIGN_DISPLAY_PRICES,
} from "@/shared/opening-campaign";
import {
  getSampleReportButtonLabel,
  type SampleReportProduct,
} from "@/shared/sample-reports";
import { useLocalization } from "@/lib/localization-context";

export default function CoupleStartScreen() {
  const router = useRouter();
  const { locale } = useLocalization();
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
  // 공개 샘플에서 돌아와도 상품만 복원한다. 관계·역할은 결제 후 setup에서 묻는다.
  useEffect(() => {
    const restoredProduct = VISIBLE_RELATION_PRODUCTS.find(
      (product) => product.id === restoreProductId,
    );
    if (restoredProduct) setSelectedProductId(restoredProduct.id);
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

  const paidProductCode =
    selectedProductId === "romantic"
      ? "couple_love_deep"
      : selectedProductId === "parent-child"
        ? "parent_child_deep"
        : null;
  const canProceed = Boolean(selectedProductId);

  const handleStart = () => {
    if (!selectedProductId) return;
    // 유료 두 상품은 결제 전에 세부 관계를 묻지 않는다. 결제 후 immutable setup에서 한 번만 확정한다.
    if (paidProductCode) {
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
      return;
    }
    router.push({
      pathname: "/(tabs)/couple-info",
      params: { relationType: "친구" },
    } as any);
  };

  const handleProductSelect = (product: VisibleRelationProduct) => {
    setSelectedProductId(product.id);
  };

  // 공개 샘플은 앱 안에서 읽고, 뒤로 가면 현재 고른 상품·관계 조합을 복원한다.
  const handleOpenSampleReport = (product: SampleReportProduct) => {
    router.push({
      pathname: "/(tabs)/sample-report",
      params: {
        product,
        returnTo: "couple-start",
        restoreProduct: selectedProductId ?? "",
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
                      onPress={() => handleProductSelect(product)}
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
                        {openingCampaignActive && campaignPrice ? <>
                          <Text style={[styles.productRegularPrice, { color: selectedProductId === product.id ? '#E8D4AA' : '#8B5D2E' }]}>{`정가 ${campaignPrice.listAmountKrw.toLocaleString()}원`}</Text>
                          <Text style={[styles.productDiscountPrice, { color: selectedProductId === product.id ? '#FFF3CE' : '#725019' }]}>{`→ ${campaignPrice.finalAmountKrw.toLocaleString()}원`}</Text>
                        </> : <Text style={[styles.productPrice, { color: selectedProductId === product.id ? '#F4D9A8' : '#8B5D2E' }]}>{product.price}</Text>}
                      </View>
                    </Pressable>
                    {sampleProduct ? (
                      <Pressable
                        onPress={() => handleOpenSampleReport(sampleProduct)}
                        style={({ pressed }) => [styles.productSampleButton, pressed && styles.productSampleButtonPressed]}
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

          {paidProductCode ? (
            <View
              style={[
                styles.subSection,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.subSectionTitle, { color: colors.muted }]}>
                결제 후 첫 참여자의 컬러 선택 전에 관계와 두 사람의 실제 역할을
                한 번만 확인합니다.
              </Text>
            </View>
          ) : null}

          {/* 상품 선택 후 정보 입력 단계로 이동 */}
          <Pressable
            style={({ pressed }) => [
              styles.startBtn,
              { backgroundColor: canProceed ? colors.primary : colors.border },
              pressed &&
                canProceed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
            ]}
            onPress={handleStart}
            disabled={!canProceed}
          >
            <Text
              style={[
                styles.startBtnText,
                { color: canProceed ? "#fff" : colors.muted },
              ]}
            >
              {paidProductCode
                ? "다음 · 결제 정보 입력하기"
                : "다음 · 두 사람 정보 입력하기"}
            </Text>
          </Pressable>

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
  subSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    marginTop: -12,
  },
  subSectionTitle: { fontSize: 13, fontWeight: "500", marginBottom: 10 },
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
