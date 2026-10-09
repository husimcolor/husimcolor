import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { getSampleReport, getSampleReportUrl, SAMPLE_REPORT_LINK_LABEL } from "@/shared/sample-reports";

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

  const handleOpenPdf = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://husimcolor.vercel.app";
    const url = getSampleReportUrl(product, origin);
    if (!url) return;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    void Linking.openURL(url);
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
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]} accessibilityRole="button">
          <Text style={styles.headerBackText}>← 상품 선택으로</Text>
        </Pressable>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>휴심컬러 공개 샘플</Text>
          <Text style={styles.title}>{sampleReport.title}</Text>
          <Text style={styles.pageCount}>전체 {sampleReport.pageCount}쪽 · 가상 데이터</Text>
          <Pressable onPress={handleOpenPdf} style={({ pressed }) => [styles.pdfButton, pressed && styles.pressed]} accessibilityRole="link" accessibilityLabel={`${sampleReport.title} ${SAMPLE_REPORT_LINK_LABEL}`}>
            <Text style={styles.pdfButtonText}>{SAMPLE_REPORT_LINK_LABEL}</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F8F3EA" },
  headerBack: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", paddingHorizontal: 2, marginBottom: 14 },
  headerBackText: { color: "#6C5A49", fontSize: 14, fontWeight: "700" },
  content: { borderRadius: 16, borderColor: "#DDD2C4", borderWidth: 1, backgroundColor: "#FFFFFF", padding: 20, gap: 8 },
  eyebrow: { color: "#8B6B4A", fontSize: 12, fontWeight: "800", letterSpacing: 0.6 },
  title: { color: "#2D2420", fontSize: 22, lineHeight: 31, fontWeight: "800" },
  pageCount: { color: "#74675C", fontSize: 13, fontWeight: "600", marginBottom: 10 },
  pdfButton: { alignSelf: "flex-start", minHeight: 38, justifyContent: "center", paddingHorizontal: 12, borderRadius: 9, backgroundColor: "#5B7556" },
  pdfButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  invalidState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  invalidText: { color: "#5F4B3B", fontSize: 16, textAlign: "center" },
  backButton: { marginTop: 20, backgroundColor: "#5B7556", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13 },
  backButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.68 },
});
