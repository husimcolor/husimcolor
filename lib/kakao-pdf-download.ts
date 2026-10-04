export type PrivatePdfDownloadRequest =
  | {
      kind: "relationship";
      accessToken?: string;
      resultToken?: string;
    }
  | {
      kind: "analysis";
      analysisRunId: number;
      productCode: "personal_deep" | "couple_love_deep" | "parent_child_deep";
      deliveryToken: string;
    };

function getBrowserUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent ?? "";
}

/** 카카오 공식 UA 식별자(KAKAOTALK)를 사용해 인앱 브라우저만 구분한다. */
export function isKakaoTalkInAppBrowser(userAgent = getBrowserUserAgent()): boolean {
  return /\bKAKAOTALK\b/i.test(userAgent);
}

/**
 * private PDF는 결과 접근 토큰을 가진 사용자만 GET으로 받을 수 있다.
 * 카카오 인앱 브라우저는 GET 응답의 Content-Disposition을 OS 다운로드로 연결한다.
 */
export function buildPrivatePdfDownloadUrl(origin: string, input: PrivatePdfDownloadRequest): string {
  const url = new URL("/api/private-pdf-download", origin);
  if (input.kind === "relationship") {
    if (input.accessToken) url.searchParams.set("relationshipToken", input.accessToken);
    if (input.resultToken) url.searchParams.set("resultToken", input.resultToken);
    return url.toString();
  }
  url.searchParams.set("analysisRunId", String(input.analysisRunId));
  url.searchParams.set("productCode", input.productCode);
  url.searchParams.set("deliveryToken", input.deliveryToken);
  return url.toString();
}

/**
 * Android 카카오 인앱 브라우저에서 Chrome으로 현재 권한 링크를 전달한다.
 * Chrome 미설치 시 OS가 안전한 https 원본 URL로 되돌린다.
 */
export function buildAndroidChromeIntent(targetUrl: string): string | null {
  let target: URL;
  try {
    target = new URL(targetUrl);
  } catch {
    return null;
  }
  if (target.protocol !== "https:") return null;
  const pathAndQuery = `${target.host}${target.pathname}${target.search}${target.hash}`;
  return `intent://${pathAndQuery}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(target.toString())};end`;
}

/** Returns false when the environment cannot request an Android external-browser handoff. */
export function openInExternalBrowser(targetUrl: string): boolean {
  if (typeof window === "undefined" || !isKakaoTalkInAppBrowser()) return false;
  const intentUrl = buildAndroidChromeIntent(targetUrl);
  if (!intentUrl) return false;
  window.location.assign(intentUrl);
  return true;
}

/** Starts a normal GET download so Kakao can use the response download headers. */
export function requestWebPdfDownload(url: string): boolean {
  if (typeof document === "undefined") return false;
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => anchor.remove(), 1_000);
  return true;
}
