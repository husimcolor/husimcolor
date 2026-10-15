import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { LocalizedText as Text } from "@/components/localized-text";
import { getApiBaseUrl } from "@/constants/oauth";
import { trpc } from "@/lib/trpc";
import { useLocalization } from "@/lib/localization-context";
import {
  getSampleReport,
  getSampleReportDownloadUrl,
  getSampleReportTitle,
  getSampleReportViewerUrl,
  type SampleReportProduct,
} from "@/shared/sample-reports";

function getSingleParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function localizedCopy(locale: "ko" | "zh-CN") {
  return locale === "zh-CN"
    ? {
        back: "← 返回",
        eyebrow: "HUSIM COLOR 公开示例",
        pages: (count: number) => `共 ${count} 页 · 虚拟数据示例`,
        notice: "这是用虚拟数据制作的公开示例。个人报告将在付费分析完成后提供。",
        loading: "正在打开示例报告…",
        download: "下载 PDF",
        openNew: "在新窗口打开",
        retry: "重新加载",
        failedTitle: "暂时无法打开示例报告",
        failedBody: "请重试，或在新窗口打开并下载 PDF 后查看。不会自动切换为韩文文件。",
        explore: "了解这项分析 →",
        missing: "未找到示例报告。",
        returnProduct: "返回商品选择",
      }
    : {
        back: "← 상품 선택으로",
        eyebrow: "HUSIM COLOR 공개 샘플",
        pages: (count: number) => `전체 ${count}쪽 · 가상 데이터`,
        notice: "샘플은 가상 데이터로 만든 공개 리포트입니다. 개인 결과는 유료 분석 완료 후 제공됩니다.",
        loading: "샘플 리포트를 여는 중…",
        download: "PDF 다운로드",
        openNew: "새 창에서 열기",
        retry: "다시 불러오기",
        failedTitle: "샘플 리포트를 열지 못했습니다",
        failedBody: "다시 시도하거나 새 창에서 연 뒤 PDF를 내려받아 확인해 주세요. 다른 언어 파일로 자동 대체하지 않습니다.",
        explore: "이 분석 알아보기 →",
        missing: "샘플 리포트를 찾을 수 없습니다.",
        returnProduct: "상품 선택으로 돌아가기",
      };
}

function buildSampleMetric(stage: "view" | "load_failed" | "product_explore", product: SampleReportProduct, locale: "ko" | "zh-CN") {
  // 분석 내용·이메일·고객 식별자는 기록하지 않는다. 동일 무명 기기 내 단계만 구분한다.
  return `sample_${stage}:${product}:${locale}`;
}

async function getAnonymousDeviceId() {
  const key = "husim_device_id";
  let deviceId: string | null = null;
  try {
    deviceId = await (await import("@react-native-async-storage/async-storage")).default.getItem(key);
  } catch {}
  if (!deviceId && typeof window !== "undefined") {
    try { deviceId = window.localStorage.getItem(key); } catch {}
  }
  if (!deviceId) {
    deviceId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `anonymous-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      await AsyncStorage.setItem(key, deviceId);
    } catch {}
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(key, deviceId); } catch {}
    }
  }
  return deviceId;
}

export default function SampleReportScreen() {
  const router = useRouter();
  const { locale } = useLocalization();
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
  const metric = trpc.visitors.log.useMutation();
  const [viewerState, setViewerState] = useState<"loading" | "ready" | "failed">("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const recordedMetricEvents = useRef(new Set<string>());
  const nativeOpenedUrl = useRef<string | null>(null);

  // Vercel에서는 현재 앱 origin을 쓰고, Metro 개발 환경에서는 3000 API origin을 쓴다.
  // 그래야 iframe과 native browser 모두 public sample API의 inline 응답을 같은 방식으로 연다.
  const origin = getApiBaseUrl() || (typeof window !== "undefined" ? window.location.origin : "https://husimcolor.vercel.app");
  const viewerUrl = getSampleReportViewerUrl(product, origin, locale);
  const downloadUrl = getSampleReportDownloadUrl(product, origin, locale);
  const copy = localizedCopy(locale);

  const logMetric = (stage: "view" | "load_failed" | "product_explore") => {
    if (!sampleReport) return;
    const event = buildSampleMetric(stage, sampleReport.product, locale);
    if (recordedMetricEvents.current.has(event)) return;
    recordedMetricEvents.current.add(event);
    void getAnonymousDeviceId().then((deviceId) => {
      metric.mutate({ deviceId, visitType: "premium", testType: event });
    }).catch(() => undefined);
  };

  useEffect(() => {
    setViewerState("loading");
  }, [viewerUrl, reloadKey]);

  // 먼저 PDF 응답을 확인한다. 일부 웹 PDF viewer는 iframe onLoad를 알리지 않으므로
  // 검증된 HEAD 응답으로도 loading 상태를 종료한다.
  // Android WebView는 PDF를 안정적으로 렌더링하지 않는다. 모바일은 시스템 PDF 엔진을
  // 사용하는 앱 내 브라우저(Custom Tab/SFSafariViewController)를 우선 열어 확대·스크롤과
  // 닫기/뒤로가기를 보장한다. 외부 브라우저 앱으로 강제 이동하지 않는다.
  useEffect(() => {
    if (!viewerUrl) return;
    let active = true;
    const verifyThenOpen = async () => {
      try {
        const response = await fetch(viewerUrl, { method: "HEAD" });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/pdf")) throw new Error("PUBLIC_SAMPLE_NOT_AVAILABLE");
        if (!active) return;
        setViewerState("ready");
        logMetric("view");
        if (Platform.OS === "web" || nativeOpenedUrl.current === `${viewerUrl}-${reloadKey}`) return;
        nativeOpenedUrl.current = `${viewerUrl}-${reloadKey}`;
        await WebBrowser.openBrowserAsync(viewerUrl, {
          toolbarColor: "#F8F3EA",
          controlsColor: "#5B7556",
          enableBarCollapsing: true,
          showTitle: true,
        });
      } catch {
        if (active) {
          setViewerState("failed");
          logMetric("load_failed");
        }
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
      try { await Linking.openURL(viewerUrl); } catch { setViewerState("failed"); }
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
    logMetric("product_explore");
    if (sampleReport.product === "personal_deep") {
      router.push("/(tabs)/commerce-checkout?product=personal_deep" as any);
      return;
    }
    router.push({
      pathname: "/(tabs)/couple-start",
      params: { restoreProduct: sampleReport.product === "couple_love_deep" ? "romantic" : "parent-child" },
    } as any);
  };

  const handleLoaded = () => {
    setViewerState("ready");
    logMetric("view");
  };

  const handleFailed = () => {
    setViewerState("failed");
    logMetric("load_failed");
  };

  if (!sampleReport || !viewerUrl) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.invalidState}>
          <Text style={styles.invalidText}>{copy.missing}</Text>
          <Pressable onPress={handleBack} style={styles.backButton} accessibilityRole="button" accessibilityLabel={copy.returnProduct}>
            <Text style={styles.backButtonText}>{copy.returnProduct}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBack, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={copy.back}>
          <Text style={styles.headerBackText}>{copy.back}</Text>
        </Pressable>
        <View style={styles.meta}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{getSampleReportTitle(sampleReport.product, locale)}</Text>
          <Text style={styles.pageCount}>{copy.pages(sampleReport.pageCount)}</Text>
          <Text style={styles.notice}>{copy.notice}</Text>
        </View>

        <View style={styles.viewer}>
          {Platform.OS === "web" ? (
            <iframe
              key={`${viewerUrl}-${reloadKey}`}
              src={viewerUrl}
              title={getSampleReportTitle(sampleReport.product, locale)}
              style={webViewerStyle}
              onLoad={handleLoaded}
              onError={handleFailed}
            />
          ) : (
            <View style={styles.nativeViewer}>
              <Text style={styles.nativeViewerTitle}>{locale === "zh-CN" ? "已在应用内浏览器中打开示例报告" : "앱 내 브라우저에서 샘플 리포트를 열었습니다"}</Text>
              <Text style={styles.nativeViewerBody}>{locale === "zh-CN" ? "可以放大、滚动阅读；关闭后会回到这个页面。" : "확대·스크롤로 읽을 수 있으며, 닫으면 이 화면으로 돌아옵니다."}</Text>
              <Pressable onPress={handleOpenNew} style={styles.nativeOpenButton} accessibilityRole="button">
                <Text style={styles.nativeOpenButtonText}>{locale === "zh-CN" ? "再次打开" : "다시 열기"}</Text>
              </Pressable>
            </View>
          )}
          {viewerState === "loading" ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator color="#5B7556" />
              <Text style={styles.loadingText}>{copy.loading}</Text>
            </View>
          ) : null}
          {viewerState === "failed" ? (
            <View style={styles.failureOverlay}>
              <Text style={styles.failureTitle}>{copy.failedTitle}</Text>
              <Text style={styles.failureBody}>{copy.failedBody}</Text>
              <View style={styles.failureActions}>
                <Pressable onPress={() => setReloadKey((current) => current + 1)} style={styles.secondaryButton} accessibilityRole="button">
                  <Text style={styles.secondaryButtonText}>{copy.retry}</Text>
                </Pressable>
                <Pressable onPress={handleOpenNew} style={styles.secondaryButton} accessibilityRole="link">
                  <Text style={styles.secondaryButtonText}>{copy.openNew}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={handleDownload} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="link">
            <Text style={styles.secondaryButtonText}>{copy.download}</Text>
          </Pressable>
          <Pressable onPress={handleOpenNew} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]} accessibilityRole="link">
            <Text style={styles.secondaryButtonText}>{copy.openNew}</Text>
          </Pressable>
          <Pressable onPress={handleExplore} style={({ pressed }) => [styles.exploreButton, pressed && styles.pressed]} accessibilityRole="button">
            <Text style={styles.exploreButtonText}>{copy.explore}</Text>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
