import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildAndroidChromeIntent,
  buildPrivatePdfDownloadUrl,
  isKakaoTalkInAppBrowser,
} from "../lib/kakao-pdf-download";

describe("카카오톡 PDF 다운로드 호환성", () => {
  it("공식 KAKAOTALK UA 식별자를 사용하고 일반 Chrome에는 안내를 표시하지 않는다", () => {
    expect(isKakaoTalkInAppBrowser("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 KAKAOTALK/10.8.3 (INAPP)")).toBe(true);
    expect(isKakaoTalkInAppBrowser("Mozilla/5.0 (Linux; Android 14) Chrome/126.0 Mobile Safari/537.36")).toBe(false);
  });

  it("현재 결과 접근 토큰을 보존해 private PDF GET URL과 Chrome handoff URL을 만든다", () => {
    const relationship = buildPrivatePdfDownloadUrl("https://husimcolor.vercel.app", {
      kind: "relationship",
      accessToken: "relationship-access-token-0123456789",
    });
    const relationUrl = new URL(relationship);
    expect(relationUrl.pathname).toBe("/api/private-pdf-download");
    expect(relationUrl.searchParams.get("relationshipToken")).toBe("relationship-access-token-0123456789");

    const analysis = buildPrivatePdfDownloadUrl("https://husimcolor.vercel.app", {
      kind: "analysis",
      analysisRunId: 42,
      productCode: "personal_deep",
      deliveryToken: "delivery-token-0123456789",
    });
    const analysisUrl = new URL(analysis);
    expect(analysisUrl.searchParams.get("analysisRunId")).toBe("42");
    expect(analysisUrl.searchParams.get("productCode")).toBe("personal_deep");
    expect(buildAndroidChromeIntent(analysis)).toContain("package=com.android.chrome");
    expect(buildAndroidChromeIntent("http://husimcolor.vercel.app/result")).toBeNull();
  });

  it("개인·관계 결과가 재생성 없이 private GET 다운로드와 외부 브라우저 대안을 제공한다", () => {
    const premium = readFileSync(resolve(process.cwd(), "app/(tabs)/premium-result.tsx"), "utf8");
    const couple = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(premium).toContain("isKakaoTalkInAppBrowser()");
    expect(premium).toContain("requestWebPdfDownload(privatePdfUrl)");
    expect(premium).toContain("외부 Chrome에서 PDF 열기");
    expect(couple).toContain("getStoredRelationshipPdfUrl");
    expect(couple).toContain("requestWebPdfDownload(storedPdfUrl)");
    expect(couple).toContain("외부 Chrome에서 PDF 열기");
    expect(couple).toContain("B의 초대 접근 토큰도 A와 같은 이미 생성된 private PDF의 읽기만 허용한다");
  });

  it("private endpoint와 기존 POST endpoint가 카카오 권장 다운로드 헤더를 유지한다", () => {
    const endpoint = readFileSync(resolve(process.cwd(), "api/private-pdf-download.ts"), "utf8");
    const personalEndpoint = readFileSync(resolve(process.cwd(), "api/pdf-report.ts"), "utf8");
    const coupleEndpoint = readFileSync(resolve(process.cwd(), "api/couple-pdf-report.ts"), "utf8");
    const workflow = readFileSync(resolve(process.cwd(), ".github/workflows/deploy.yml"), "utf8");

    for (const source of [endpoint, personalEndpoint, coupleEndpoint]) {
      expect(source).toContain("Content-Type");
      expect(source).toContain("Content-Length");
      expect(source).toContain("Content-Disposition");
    }
    expect(endpoint).toContain('req.method !== "GET" && req.method !== "HEAD"');
    expect(workflow).toContain("pdf-report.func/index.js");
    expect(workflow).toContain("pdf-report.func/HusimPdfKorean.ttf");
    expect(workflow).toContain('"/api/pdf-report"');
    expect(workflow).toContain("private-pdf-download.func");
    expect(workflow).toContain('"/api/private-pdf-download"');
  });
});
