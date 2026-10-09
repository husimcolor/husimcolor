import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getSampleReport } from "@/shared/sample-reports";

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function SampleReportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    product?: string | string[];
    returnTo?: string | string[];
    restoreProduct?: string | string[];
    restoreRelationType?: string | string[];
    restoreParentChildCombo?: string | string[];
  }>();
  const product = getSingleParam(params.product);
  const returnTo = getSingleParam(params.returnTo);
  const sampleReport = getSampleReport(product);

  const handleBack = () => {
    if (returnTo === "couple-start") {
      router.replace({
        pathname: "/(tabs)/couple-start",
        params: {
          restoreProduct: getSingleParam(params.restoreProduct) ?? "",
          restoreRelationType: getSingleParam(params.restoreRelationType) ?? "",
          restoreParentChildCombo: getSingleParam(params.restoreParentChildCombo) ?? "",
        },
      } as any);
      return;
    }
    if (returnTo === "home") {
      router.replace("/(tabs)" as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(product === "personal_deep" ? "/(tabs)" : "/(tabs)/couple-start" as any);
  };

  if (!sampleReport) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.invalidState}>
          <Text style={styles.invalidText}>샘플 리포트를 찾을 수 없습니다.</Text>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel="상품 선택 화면으로 돌아가기">
            <Text style={styles.backButtonText}>상품 선택으로 돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="이전 상품 선택 화면으로 돌아가기"
        >
          <Text style={styles.headerBackText}>← 상품 선택으로</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>휴심컬러 샘플 리포트</Text>
          <Text style={styles.title}>{sampleReport.title}</Text>
          <Text style={styles.pageCount}>대표 페이지 {sampleReport.pages.length}장</Text>
        </View>

        <View style={styles.pageList}>
          {sampleReport.pages.map((uri, index) => (
            <View key={uri} style={styles.pageBlock}>
              <Text style={styles.pageLabel}>{index + 1}쪽</Text>
              <Image
                source={{ uri }}
                style={styles.pageImage}
                resizeMode="contain"
                accessibilityLabel={`${sampleReport.title} 샘플 리포트 ${index + 1}쪽`}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 40, backgroundColor: "#F8F3EA" },
  headerBack: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", paddingHorizontal: 2, marginBottom: 14 },
  headerBackText: { color: "#6C5A49", fontSize: 14, fontWeight: "700" },
  titleBlock: { paddingBottom: 18, borderBottomColor: "#E3D8CA", borderBottomWidth: 1 },
  eyebrow: { color: "#8B6B4A", fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  title: { color: "#2D2420", fontSize: 22, lineHeight: 31, fontWeight: "800", marginTop: 7 },
  pageCount: { color: "#74675C", fontSize: 13, fontWeight: "600", marginTop: 6 },
  pageList: { gap: 22, marginTop: 20 },
  pageBlock: { gap: 8 },
  pageLabel: { color: "#6C5A49", fontSize: 13, fontWeight: "800" },
  pageImage: { width: "100%", aspectRatio: 1191 / 1684, backgroundColor: "#FFFFFF", borderColor: "#DDD2C4", borderWidth: 1, borderRadius: 4 },
  invalidState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  invalidText: { color: "#5F4B3B", fontSize: 16, textAlign: "center" },
  backButton: { marginTop: 20, backgroundColor: "#5B7556", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13 },
  backButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.68 },
});
