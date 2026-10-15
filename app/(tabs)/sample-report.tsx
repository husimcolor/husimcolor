import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { API_BASE_URL, getApiBaseUrl } from "@/constants/oauth";
import {
  getSampleReport,
  getSampleReportDownloadUrl,
  getSampleReportTitle,
  getSampleReportViewerUrl,
} from "@/shared/sample-reports";

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 공개 가상 샘플 전용 열람 화면이다.
 * 기존 고객 PDF 인증·다운로드 endpoint와 분리되어 있으며, 로그인·이메일을 요구하지 않는다.
 */
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
  // Chromium PDF plugin은 iframe의 onLoad를 늦게(또는 아예) 알릴 수 있다.
  // 웹에서는 첫 페이지가 즉시 보이도록 ready로 시작하고, HEAD/onError 실패 때만 대안을 표시한다.
  const [viewerState, setViewerState] = useState<"loading" | "ready" | "failed">(
    Platform.OS === "web" ? "ready" : "loading",
  );
  const [reloadKey, setReloadKey] = useState(0);
  const nativeOpenedUrl = useRef<string | null>(null);

  // Vercel에서는 current origin, Metro sandbox에서는 분리된 API origin을 쓴다.
  // API_BASE_URL은 8081이 아닌 임의 개발 포트를 검증할 때만 사용되며 운영에는 설정하지 않는다.
  const origin = getApiBaseUrl() || API_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "https://husimcolor.vercel.app");
  const viewerUrl = getSampleReportViewerUrl(product, origin);
  const downloadUrl = getSampleReportDownloadUrl(product, origin);

  useEffect(() => {
    if (Platform.OS !== "web") setViewerState("loading");
  }, [viewerUrl, reloadKey]);

  // 웹은 같은 origin iframe으로 첫 페이지부터 읽고, 모바일은 시스템 PDF 엔진을 쓰는
  // 앱 내 브라우저(Custom Tab/SFSafariViewController)로 열어 확대·스크롤·닫기/뒤로가기를 지원한다.
  useEffect(() => {
    if (!viewerUrl) return;
    let active = true;
    const verifyThenOpen = async () => {
      try {
        const response = await fetch(viewerUrl, { method: "HEAD" });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) {
          throw new Error("PUBLIC_SAMPLE_NOT_AVAILABLE");
        }
        if (!active) return;
        setViewerState("ready");
        if (Platform.OS === "web" || nativeOpenedUrl.current === `${viewerUrl}-${reloadKey}`) return;
        nativeOpenedUrl.current = `${viewerUrl}-${reloadKey}`;
        await WebBrowser.openBrowserAsync(viewerUrl, {
          toolbarColor: "#F8F3EA",
          controlsColor: "#5B7556",
          enableBarCollapsing: true,
          showTitle: true,
        });
      } catch {
        if (active) setViewerState("failed");
      }
    };
    void verifyThenOpen();
    return () => { active = false; };
  }, [viewerUrl, reloadKey]);

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

  const handleOpenNew = async () => {
    if (!viewerUrl) return;
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(viewerUrl, "_blank", "noopener,noreferrer");
        return;
      }
      await WebBrowser.openBrowserAsync(viewerUrl);
    } catch {
      try {
        await Linking.openURL(viewerUrl);
      } catch {
        setViewerState("failed");
      }
    }
  };

  const handleDownload = async () => {
    if (!downloadUrl) return;
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = "";
        anchor.rel = "noopener noreferrer";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        return;
      }
      await Linking.openURL(downloadUrl);
    } catch {
      setViewerState("failed");
    }
  };

  const handleExplore = () => {
    if (!sampleReport) return;
    if (sampleReport.product === "personal_deep") {
      router.push("/(tabs)/commerce-checkout?product=personal_deep" as any);
      return;
    }
    router.push({
      pathname: "/(tabs)/couple-start",
      params: { restoreProduct: sampleReport.product === "couple_love_deep" ? "romantic" : "parent-child" },
    } as any);
  };

  if (!sampleReport || !viewerUrl) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.invalidState}>
          <Text style={styles.invalidText}>샘플 리포트를 찾을 수 없습니다.</Text>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>상품 선택으로 돌아가기</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="상품 선택으로 돌아가기">
          <Text style={styles.headerBackText}>← 상품 선택으로</Text>
        </Pressable>
        <View style={styles.meta}>
          <Text style={styles.eyebrow}>HUSIM COLOR 공개 샘플</Text>
          <Text style={styles.title}>{getSampleReportTitle(sampleReport.product)}</Text>
          <Text style={styles.pageCount}>전체 {sampleReport.pageCount}쪽 · 가상 데이터</Text>
          <Text style={styles.notice}>샘플은 가상 데이터로 만든 공개 리포트입니다. 개인 결과는 유료 분석 완료 후 제공됩니다.</Text>
        </View>

        <View style={styles.viewer}>
          {Platform.OS === "web" ? (
            <iframe
              key={`${viewerUrl}-${reloadKey}`}
              src={viewerUrl}
              title={getSampleReportTitle(sampleReport.product)}
              style={webViewerStyle}
              onLoad={() => setViewerState("ready")}
              onError={() => setViewerState("failed")}
            />
          ) : (
            <View style={styles.nativeViewer}>
              <Text style={styles.nativeViewerTitle}>앱 내 브라우저에서 샘플 리포트를 열었습니다</Text>
              <Text style={styles.nativeViewerBody}>확대·스크롤로 읽을 수 있으며, 닫으면 이 화면으로 돌아옵니다.</Text>
              <Pressable onPress={handleOpenNew} style={styles.nativeOpenButton} accessibilityRole="button">
                <Text style={styles.nativeOpenButtonText}>다시 열기</Text>
              </Pressable>
            </View>
          )}
          {viewerState === "loading" ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color="#5B7556" />
              <Text style={styles.loadingText}>샘플 리포트를 여는 중…</Text>
            </View>
          ) : null}
          {viewerState === "failed" ? (
            <View style={styles.failureOverlay}>
              <Text style={styles.failureTitle}>샘플 리포트를 열지 못했습니다</Text>
              <Text style={styles.failureBody}>다시 시도하거나 새 창에서 연 뒤 PDF를 내려받아 확인해 주세요.</Text>
              <View style={styles.failureActions}>
                <Pressable onPress={() => setReloadKey((current) => current + 1)} style={styles.secondaryButton} accessibilityRole="button">
                  <Text style={styles.secondaryButtonText}>다시 불러오기</Text>
                </Pressable>
                <Pressable onPress={handleOpenNew} style={styles.secondaryButton} accessibilityRole="link">
                  <Text style={styles.secondaryButtonText}>새 창에서 열기</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleDownload} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="link">
            <Text style={styles.secondaryButtonText}>PDF 다운로드</Text>
          </Pressable>
          <Pressable onPress={handleOpenNew} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="link">
            <Text style={styles.secondaryButtonText}>새 창에서 열기</Text>
          </Pressable>
          <Pressable onPress={handleExplore} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.exploreButtonText}>이 분석 알아보기 →</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const webViewerStyle = {
  width: "100%",
  height: "100%",
  border: "0",
  backgroundColor: "#F4F0E8",
} as any;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8F3EA" },
  headerBack: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", paddingHorizontal: 2, marginBottom: 8 },
  headerBackText: { color: "#6C5A49", fontSize: 14, fontWeight: "700" },
  meta: { borderRadius: 14, borderColor: "#DDD2C4", borderWidth: 1, backgroundColor: "#FFFFFF", padding: 15, gap: 5, marginBottom: 10 },
  eyebrow: { color: "#8B6B4A", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: "#2D2420", fontSize: 20, lineHeight: 28, fontWeight: "800" },
  pageCount: { color: "#74675C", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  notice: { color: "#665C54", fontSize: 12, lineHeight: 18, marginTop: 3 },
  viewer: { flex: 1, minHeight: 280, overflow: "hidden", borderRadius: 14, borderWidth: 1, borderColor: "#D9CEC0", backgroundColor: "#F4F0E8" },
  nativeViewer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F4F0E8", gap: 8 },
  nativeViewerTitle: { color: "#513D2E", fontSize: 16, lineHeight: 24, fontWeight: "800", textAlign: "center" },
  nativeViewerBody: { color: "#74675C", fontSize: 13, lineHeight: 20, textAlign: "center" },
  nativeOpenButton: { marginTop: 8, minHeight: 42, borderRadius: 11, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderColor: "#9CB797", borderWidth: 1 },
  nativeOpenButtonText: { color: "#3E6A3A", fontSize: 14, fontWeight: "800" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "rgba(248,243,234,0.84)" },
  loadingText: { color: "#5F4B3B", fontSize: 13, fontWeight: "700" },
  failureOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 22, gap: 8, backgroundColor: "#FFFDF8" },
  failureTitle: { color: "#513D2E", fontSize: 17, lineHeight: 24, textAlign: "center", fontWeight: "800" },
  failureBody: { color: "#74675C", fontSize: 13, lineHeight: 20, textAlign: "center" },
  failureActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 6 },
  actions: { paddingTop: 10, gap: 8 },
  secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: "#9CB797", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
  secondaryButtonText: { color: "#3E6A3A", fontSize: 15, fontWeight: "800" },
  exploreButton: { minHeight: 50, borderRadius: 13, backgroundColor: "#5B7556", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  exploreButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  invalidState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  invalidText: { color: "#5F4B3B", fontSize: 16, textAlign: "center" },
  backButton: { marginTop: 20, backgroundColor: "#5B7556", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13 },
  backButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
