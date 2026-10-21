import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sampleService = readFileSync(`${root}/server/public-sample-report-service.ts`, "utf8");
const sampleApi = readFileSync(`${root}/api/public-sample-report.ts`, "utf8");
const sampleViewer = readFileSync(`${root}/app/(tabs)/sample-report.tsx`, "utf8");
const deployWorkflow = readFileSync(`${root}/.github/workflows/deploy.yml`, "utf8");

describe("한국어 공개 샘플 viewer의 운영 데이터 분리", () => {
  it("공개 샘플 allow-list만 읽고 DB·주문·개인 PDF service를 호출하지 않는다", () => {
    expect(sampleService).toContain('"public", "sample-reports"');
    expect(sampleService).toContain("isSampleReportProduct");
    expect(sampleService).not.toContain("../db");
    expect(sampleService).not.toContain("commerce/");
    expect(sampleService).not.toContain("private-pdf");
    expect(sampleApi).not.toContain("deliveryToken");
    expect(sampleApi).not.toContain("analysisRunId");
    expect(sampleViewer).not.toContain("TextInput");
    expect(sampleViewer).not.toContain("useAuth");
    // 공개 PDF/고객 데이터는 계속 분리한다. 전환 이벤트 한 종류만 개인정보 없이 기록한다.
    expect(sampleViewer).toContain("trpc.conversionFunnel.track.useMutation()");
    expect(sampleViewer).not.toContain("trpc.visitors");
    expect(sampleViewer).not.toContain("deliveryToken");
    expect(sampleViewer).not.toContain("analysisRunId");
  });

  it("prebuilt 배포에 전용 읽기 API와 한국어 샘플 세 파일을 명시적으로 포함한다", () => {
    expect(deployWorkflow).toContain("api/public-sample-report.func");
    expect(deployWorkflow).toContain('npx esbuild "api/public-sample-report.ts"');
    expect(deployWorkflow).toContain("husimcolor-personal-deep-sample.pdf");
    expect(deployWorkflow).toContain("husimcolor-couple-love-sample.pdf");
    expect(deployWorkflow).toContain("husimcolor-parent-child-sample.pdf");
    expect(deployWorkflow).not.toContain("zh-CN-sample.pdf");
  });
});
