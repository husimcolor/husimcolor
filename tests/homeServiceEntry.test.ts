import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, "utf8");
const relationshipStartScreen = readFileSync(
  `${root}/app/(tabs)/couple-start.tsx`,
  "utf8",
);
const freeResultScreen = readFileSync(`${root}/app/(tabs)/result.tsx`, "utf8");
const sampleViewerScreen = readFileSync(
  `${root}/app/(tabs)/sample-report.tsx`,
  "utf8",
);

describe("첫 진입 화면의 서비스 선택 UX", () => {
  it("컬러 역할 미리보기 없이 세 가지 서비스 목적만 표시한다", () => {
    expect(homeScreen).not.toContain("{ label: '1번 컬러'");
    expect(homeScreen).not.toContain("{ label: '2번 컬러'");
    expect(homeScreen).not.toContain("{ label: '3번 컬러'");
    expect(homeScreen).toContain("🌿 무료 컬러 체험");
    expect(homeScreen).toContain("🎨 컬러 + 심리카드 개인 심화분석");
    expect(homeScreen).toContain("💞 관계 분석");
  });

  it("각 서비스가 기존 무료·개인 심화·관계 분석 경로로 연결된다", () => {
    expect(homeScreen).toContain(
      "router.push({ pathname: '/(tabs)/select', params: { step: '0' } })",
    );
    expect(homeScreen).toContain("router.push('/(tabs)/premium-info' as any)");
    expect(homeScreen).toContain("router.push('/(tabs)/couple-start' as any)");
  });

  it("관계 분석의 기존 세 상품 선택과 숨김 관계 경로를 유지한다", () => {
    expect(relationshipStartScreen).toContain(
      "VISIBLE_RELATION_PRODUCTS.map((product) => {",
    );
    expect(relationshipStartScreen).toContain("const paidProductCode");
  });

  it("세 한국어 샘플은 결제·상품 선택과 분리된 앱 내 열람 화면으로 열린다", () => {
    expect(homeScreen).toContain("handleOpenSamplePdf('personal_deep')");
    expect(relationshipStartScreen).toContain(
      "handleOpenSamplePdf(sampleProduct)",
    );
    expect(homeScreen).toContain("pathname: '/(tabs)/sample-report'");
    expect(relationshipStartScreen).toContain(
      'pathname: "/(tabs)/sample-report"',
    );
    expect(freeResultScreen).toContain("pathname: '/(tabs)/sample-report'");
    expect(homeScreen).not.toContain(
      "window.open(url, '_blank', 'noopener,noreferrer')",
    );
    expect(relationshipStartScreen).not.toContain(
      "window.open(url, '_blank', 'noopener,noreferrer')",
    );
    expect(sampleViewerScreen).toContain("getSampleReportWebViewerUrl");
    expect(sampleViewerScreen).toContain(
      "WebBrowser.openBrowserAsync(webViewerUrl",
    );
    expect(sampleViewerScreen).toContain(
      "/pdfjs/sample-report-canvas-viewer.html",
    );
    expect(sampleViewerScreen).toContain("getSampleReportPageImageUrl");
    expect(sampleViewerScreen).toContain('createElement("iframe"');
    expect(sampleViewerScreen).not.toContain('application/pdf"');
    expect(sampleViewerScreen).toContain("PDF 다운로드");
    expect(sampleViewerScreen).toContain("이 분석 알아보기 →");
  });

  it("결제 설정을 불러오는 중에도 유료 상품 진입을 준비중 상태로 숨기지 않는다", () => {
    expect(homeScreen).toContain("const paidAnalysisPublicEnabled =");
    expect(homeScreen).toContain(
      "commerceTestMode.data?.paidAnalysisPublicEnabled ?? true",
    );
    expect(relationshipStartScreen).toContain(
      "const paidAnalysisPublicEnabled =",
    );
    expect(relationshipStartScreen).toContain(
      "commerceTestMode.data?.paidAnalysisPublicEnabled ?? true",
    );
    expect(homeScreen).toContain("나를 깊이 알아보기 →");
    expect(relationshipStartScreen).toContain("다음 · 결제 정보 입력하기");
    expect(homeScreen).not.toContain("정식 오픈 준비중");
    expect(relationshipStartScreen).not.toContain("정식 오픈 준비중");
  });

  it("기존 심볼과 소개 문구를 깨진 문자 없이 표시한다", () => {
    expect(homeScreen).toContain("createElement('img'");
    expect(homeScreen).toContain("src: '/husimcolor-home-symbol.png'");
    expect(homeScreen).toContain("require('../../assets/images/icon.png')");
    expect(homeScreen).toContain("alt: '휴심컬러 심볼'");
    expect(homeScreen).toContain(
      "지금의 나와 두 사람의 관계를 원하는 방식으로 천천히 살펴보세요.",
    );
    expect(homeScreen).not.toContain("{'\x1c'}");
  });
});
