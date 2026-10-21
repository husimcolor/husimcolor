import { createElement, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { createConversionEventInput } from "@/lib/conversion-tracking";
import { trpc } from "@/lib/trpc";
import { API_BASE_URL, getApiBaseUrl } from "@/constants/oauth";
import {
  getSampleReport,
  getSampleReportDownloadUrl,
  getSampleReportPageImageUrl,
  getSampleReportTitle,
  getSampleReportWebViewerUrl,
} from "@/shared/sample-reports";

const MIN_ZOOM = 0.85;
const MAX_ZOOM = 1.25;
const ZOOM_STEP = 0.1;
type ViewerMode = "loading" | "canvas" | "images" | "failed";

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
function clampZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(value * 100) / 100));
}

/**
 * 공개 가상 샘플 전용 열람 화면.
 * 인앱 브라우저의 기본 PDF 플러그인/iframe PDF 렌더러를 쓰지 않고,
 * 같은 origin의 정적 HTML에서 PDF.js canvas를 직접 렌더링한다.
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
  const funnel = trpc.conversionFunnel.track.useMutation();
  const [viewerMode, setViewerMode] = useState<ViewerMode>("loading");
  const [zoom, setZoom] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const pageOrigin = typeof window !== "undefined" ? window.location.origin : "https://husimcolor.vercel.app";
  // Production 웹에서는 viewer와 API를 같은 origin으로 고정한다.
  // Metro 개발 모드에서만 별도 Express API 원본을 사용한다.
  const apiOrigin = Platform.OS === "web" && !__DEV__ ? pageOrigin : getApiBaseUrl() || API_BASE_URL || pageOrigin;
  const webViewerUrl = getSampleReportWebViewerUrl(product, pageOrigin);
  const downloadUrl = getSampleReportDownloadUrl(product, apiOrigin);
  const canvasViewerUrl = useMemo(() => {
    if (!sampleReport) return null;
    const query = new URLSearchParams({ product: sampleReport.product, apiBase: apiOrigin, zoom: String(zoom) });
    return `${pageOrigin.replace(/\/$/, "")}/pdfjs/sample-report-canvas-viewer.html?${query.toString()}`;
  }, [apiOrigin, pageOrigin, sampleReport, zoom]);
  const pageImageUrls = useMemo(() => {
    if (!sampleReport) return [];
    return Array.from({ length: sampleReport.pageCount }, (_, index) => getSampleReportPageImageUrl(sampleReport.product, index + 1, pageOrigin))
      .filter((url): url is string => Boolean(url));
  }, [pageOrigin, sampleReport]);

  useEffect(() => {
    if (!sampleReport) return;
    void createConversionEventInput({ eventName: "sample_view", productCode: sampleReport.product, scope: `sample-${sampleReport.product}` })
      .then((event) => funnel.mutate(event)).catch(() => undefined);
  }, [sampleReport?.product]);

  // 네이티브 앱은 HTML canvas reader를 인앱 브라우저로 열고,
  // 웹(네이버·카카오 인앱 브라우저 포함)은 현재 화면의 iframe reader를 쓴다.
  useEffect(() => {
    if (Platform.OS === "web" || !canvasViewerUrl) return;
    let active = true;
    void WebBrowser.openBrowserAsync(canvasViewerUrl, {
      toolbarColor: "#F8F3EA",
      controlsColor: "#5B7556",
      enableBarCollapsing: true,
      showTitle: true,
    }).catch(() => {
      if (active) setViewerMode("failed");
    });
    return () => { active = false; };
  }, [canvasViewerUrl]);

  const handleBack = () => {
    if (returnTo === "couple-start") {
      router.replace({ pathname: "/(tabs)/couple-start", params: {
        restoreProduct: getSingleParam(params.restoreProduct) ?? "",
        restoreRelationType: getSingleParam(params.restoreRelationType) ?? "",
        restoreParentChildCombo: getSingleParam(params.restoreParentChildCombo) ?? "",
      } } as any);
      return;
    }
    if (returnTo === "home") {
      router.replace("/(tabs)" as any);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace(product === "personal_deep" ? "/(tabs)" : "/(tabs)/couple-start" as any);
  };

  const handleOpenNew = async () => {
    if (!webViewerUrl) return;
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") window.open(webViewerUrl, "_blank", "noopener,noreferrer");
      else await WebBrowser.openBrowserAsync(webViewerUrl, { toolbarColor: "#F8F3EA", controlsColor: "#5B7556", enableBarCollapsing: true, showTitle: true });
    } catch {
      setViewerMode("images");
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
      } else await Linking.openURL(downloadUrl);
    } catch {
      setViewerMode("failed");
    }
  };

  const handleExplore = () => {
    if (!sampleReport) return;
    void createConversionEventInput({ eventName: "paid_guide_click", productCode: sampleReport.product, scope: `sample-explore-${sampleReport.product}` })
      .then((event) => funnel.mutate(event)).catch(() => undefined);
    if (sampleReport.product === "personal_deep") {
      router.push("/(tabs)/commerce-checkout?product=personal_deep" as any);
      return;
    }
    router.push({ pathname: "/(tabs)/couple-start", params: { restoreProduct: sampleReport.product === "couple_love_deep" ? "romantic" : "parent-child" } } as any);
  };

  if (!sampleReport || !canvasViewerUrl || !webViewerUrl || !downloadUrl) {
    return <ScreenContainer edges={["top", "left", "right"]}><View style={styles.invalidState}><Text style={styles.invalidText}>샘플 리포트를 찾을 수 없습니다.</Text><Pressable onPress={handleBack} style={styles.backButton}><Text style={styles.backButtonText}>상품 선택으로 돌아가기</Text></Pressable></View></ScreenContainer>;
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator bounces>
        <View style={styles.compactHeader}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.headerBackText}>← 상품 선택</Text></Pressable>
          <View style={styles.headerTitleBlock}><Text style={styles.title} numberOfLines={1}>{getSampleReportTitle(sampleReport.product)}</Text><Text style={styles.pageCount}>{sampleReport.pageCount}쪽 · 가상 데이터 샘플</Text></View>
          <Pressable onPress={handleDownload} style={({ pressed }) => [styles.downloadTopButton, pressed && styles.pressed]} accessibilityRole="link"><Text style={styles.downloadTopText}>다운로드</Text></Pressable>
        </View>
        <View style={styles.readerHint}>
          <Text style={styles.readerHintText}>첫 페이지부터 바로 표시됩니다. 아래로 스크롤해 전체를 읽고, ± 버튼이나 손가락 동작으로 확대할 수 있습니다.</Text>
          <View style={styles.zoomControls}>
            <Pressable onPress={() => { setZoom((current) => clampZoom(current - ZOOM_STEP)); setViewerMode("loading"); }} disabled={zoom <= MIN_ZOOM} style={({ pressed }) => [styles.zoomButton, (pressed || zoom <= MIN_ZOOM) && styles.pressed]} accessibilityRole="button" accessibilityLabel="축소"><Text style={styles.zoomButtonText}>−</Text></Pressable>
            <Text style={styles.zoomLabel}>{Math.round(zoom * 100)}%</Text>
            <Pressable onPress={() => { setZoom((current) => clampZoom(current + ZOOM_STEP)); setViewerMode("loading"); }} disabled={zoom >= MAX_ZOOM} style={({ pressed }) => [styles.zoomButton, (pressed || zoom >= MAX_ZOOM) && styles.pressed]} accessibilityRole="button" accessibilityLabel="확대"><Text style={styles.zoomButtonText}>＋</Text></Pressable>
          </View>
        </View>
        <View style={styles.documentSurface}>
          {Platform.OS === "web" && viewerMode !== "images" && viewerMode !== "failed" ? createElement("iframe", {
            key: `${canvasViewerUrl}-${reloadKey}`,
            src: canvasViewerUrl,
            title: `${getSampleReportTitle(sampleReport.product)} 본문`,
            onLoad: () => setViewerMode("canvas"),
            onError: () => setViewerMode("images"),
            style: webIframeStyle,
          }) : null}
          {Platform.OS !== "web" && viewerMode === "loading" ? <View style={styles.loadingState}><ActivityIndicator color="#5B7556" /><Text style={styles.loadingTitle}>샘플 열람 화면을 여는 중…</Text><Text style={styles.loadingBody}>PDF 파일이 아니라 화면 안에서 읽을 수 있는 열람 페이지를 사용합니다.</Text></View> : null}
          {viewerMode === "images" ? <View style={styles.pageList}><View style={styles.fallbackNotice}><Text style={styles.fallbackNoticeTitle}>이미지 열람 모드</Text><Text style={styles.fallbackNoticeBody}>PDF.js를 사용할 수 없어 같은 공개 샘플의 페이지 이미지로 표시합니다.</Text></View>{pageImageUrls.map((imageUrl, index) => createElement("img", { key: imageUrl, src: imageUrl, alt: `${getSampleReportTitle(sampleReport.product)} ${index + 1}쪽`, loading: index === 0 ? "eager" : "lazy", onError: () => { if (index === 0) setViewerMode("failed"); }, style: { ...webImageStyle, width: `${zoom * 100}%` } }))}</View> : null}
          {viewerMode === "failed" ? <View style={styles.failedState}><Text style={styles.failedTitle}>샘플 본문을 표시하지 못했습니다</Text><Text style={styles.failedBody}>빈 화면으로 남기지 않습니다. 다시 시도하거나 이미지 열람 모드로 전환해 주세요.</Text><View style={styles.failedActions}><Pressable onPress={() => { setViewerMode("loading"); setReloadKey((current) => current + 1); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>다시 시도</Text></Pressable><Pressable onPress={() => setViewerMode("images")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>이미지로 열기</Text></Pressable></View></View> : null}
        </View>
        <View style={styles.afterDocument}>
          <Text style={styles.notice}>샘플은 가상 데이터로 만든 공개 리포트입니다. 개인 결과는 유료 분석 완료 후 제공됩니다.</Text>
          <Pressable onPress={handleExplore} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]} accessibilityRole="button"><Text style={styles.exploreButtonText}>이 분석 알아보기 →</Text></Pressable>
          <Pressable onPress={handleOpenNew} style={({ pressed }) => [styles.newViewerButton, pressed && styles.pressed]} accessibilityRole="link"><Text style={styles.newViewerButtonText}>새 창에서 열기</Text></Pressable>
          <Pressable onPress={handleDownload} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="link"><Text style={styles.secondaryButtonText}>PDF 다운로드</Text></Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const webIframeStyle = { display: "block", width: "100%", height: "min(82vh, 860px)", minHeight: 460, border: 0, backgroundColor: "#EAE5DD" } as any;
const webImageStyle = { display: "block", height: "auto", maxWidth: "none", backgroundColor: "#FFFFFF", borderRadius: 4, boxShadow: "0 1px 4px rgba(54, 42, 31, 0.12)" } as any;
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F8F3EA" }, scrollContent: { paddingBottom: 28 },
  compactHeader: { minHeight: 48, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderBottomColor: "#E0D6C9", backgroundColor: "#FFFDF9" },
  headerBack: { minHeight: 34, justifyContent: "center", paddingHorizontal: 3 }, headerBackText: { color: "#6C5A49", fontSize: 13, fontWeight: "800" }, headerTitleBlock: { flex: 1, minWidth: 0 }, title: { color: "#2D2420", fontSize: 16, lineHeight: 21, fontWeight: "900" }, pageCount: { color: "#74675C", fontSize: 11, lineHeight: 15, fontWeight: "700" },
  downloadTopButton: { minHeight: 34, borderRadius: 9, backgroundColor: "#EAF1E6", borderColor: "#AABFA4", borderWidth: 1, paddingHorizontal: 9, justifyContent: "center" }, downloadTopText: { color: "#3E6A3A", fontSize: 12, fontWeight: "900" },
  readerHint: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }, readerHintText: { flex: 1, color: "#6B6158", fontSize: 11, lineHeight: 16 }, zoomControls: { flexDirection: "row", alignItems: "center", gap: 5 }, zoomButton: { width: 31, height: 31, alignItems: "center", justifyContent: "center", borderRadius: 9, borderWidth: 1, borderColor: "#B7CBB0", backgroundColor: "#FFFFFF" }, zoomButtonText: { color: "#3E6A3A", fontSize: 19, lineHeight: 21, fontWeight: "800" }, zoomLabel: { minWidth: 38, color: "#4C5E47", fontSize: 12, fontWeight: "900", textAlign: "center" },
  documentSurface: { minHeight: 460, backgroundColor: "#EAE5DD", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#D8CEC1" }, pageList: { alignItems: "center", gap: 14, paddingVertical: 8, paddingHorizontal: 14 },
  loadingState: { minHeight: 460, alignItems: "center", justifyContent: "center", gap: 9, padding: 24, backgroundColor: "#F4F0E8" }, loadingTitle: { color: "#513D2E", fontSize: 16, lineHeight: 23, textAlign: "center", fontWeight: "900" }, loadingBody: { color: "#74675C", fontSize: 13, lineHeight: 20, textAlign: "center" },
  fallbackNotice: { maxWidth: 680, borderRadius: 10, borderWidth: 1, borderColor: "#D9CDA9", backgroundColor: "#FFF8E7", padding: 12, gap: 3 }, fallbackNoticeTitle: { color: "#70562B", fontSize: 13, fontWeight: "900" }, fallbackNoticeBody: { color: "#75664B", fontSize: 12, lineHeight: 18 },
  failedState: { minHeight: 460, alignItems: "center", justifyContent: "center", padding: 24, gap: 8, backgroundColor: "#FFFDF8" }, failedTitle: { color: "#513D2E", fontSize: 17, lineHeight: 24, textAlign: "center", fontWeight: "900" }, failedBody: { color: "#74675C", fontSize: 13, lineHeight: 20, textAlign: "center" }, failedActions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 7 },
  afterDocument: { padding: 14, gap: 8 }, notice: { color: "#665C54", fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 2 }, secondaryButton: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: "#9CB797", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, secondaryButtonText: { color: "#3E6A3A", fontSize: 15, fontWeight: "800" }, newViewerButton: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: "#BFC8D3", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }, newViewerButtonText: { color: "#52657A", fontSize: 14, fontWeight: "800" }, exploreButton: { minHeight: 50, borderRadius: 13, backgroundColor: "#5B7556", alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, exploreButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  invalidState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }, invalidText: { color: "#5F4B3B", fontSize: 16, textAlign: "center" }, backButton: { marginTop: 20, backgroundColor: "#5B7556", borderRadius: 12, paddingHorizontal: 18, paddingVertical: 13 }, backButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, pressed: { opacity: 0.68 },
});
