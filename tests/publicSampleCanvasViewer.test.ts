import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const viewerPath = `${root}/public/pdfjs/sample-report-canvas-viewer.html`;
const viewer = readFileSync(viewerPath, "utf8");

describe("공개 샘플 PDF.js canvas viewer", () => {
  it("기본 브라우저 PDF 플러그인 대신 표준 모듈 PDF.js로 첫 페이지부터 canvas를 그린다", () => {
    expect(viewer).toContain('import * as pdfjsLib from "/pdfjs/pdf.mjs"');
    expect(viewer).toContain('pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"');
    expect(viewer).toContain("await addCanvasPage(pdf, 1)");
    expect(viewer).toContain("for (let page = 2");
    expect(viewer).not.toContain("<embed");
    expect(viewer).not.toContain("<object");
    expect(viewer).toContain('includes("application/pdf")');
  });

  it("worker와 PDF.js 모듈, 동일 공개 샘플 페이지 이미지 대안을 함께 제공한다", () => {
    expect(existsSync(`${root}/public/pdfjs/pdf.mjs`)).toBe(true);
    expect(existsSync(`${root}/public/pdfjs/pdf.worker.min.mjs`)).toBe(true);
    expect(viewer).toContain("function imageFallback(reason)");
    expect(viewer).toContain("pageImageUrl(page)");
    expect(viewer).toContain('image.loading = eager ? "eager" : "lazy"');
    expect(viewer).toContain('샘플 본문을 표시하지 못했습니다');
  });

  it("처음부터 빈 영역으로 남지 않도록 로딩·오류·재시도 상태를 표시한다", () => {
    expect(viewer).toContain("첫 페이지를 불러오는 중…");
    expect(viewer).toContain("다시 시도");
    expect(viewer).toContain("#status[hidden] { display: none; }");
  });
});
