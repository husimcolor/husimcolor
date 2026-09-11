import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("관계 통합분석 인앱 브라우저 호환성", () => {
  it("관계 결과를 시스템 다크 모드에서 분리해 카드의 배경과 글자 대비를 고정한다", () => {
    const screenSource = readFileSync(resolve(process.cwd(), "app/(tabs)/couple-result.tsx"), "utf8");

    expect(screenSource).toContain("const colors = useColors('light');");
    expect(screenSource).toContain("카카오·Instagram WebView가 dark scheme을 반환해도");
    expect(screenSource).toContain('className="relation-result-webview"');
  });

  it("WebKit text fill이 부모 색상을 강제로 상속하지 않고 각 Text의 color를 사용한다", () => {
    const htmlSource = readFileSync(resolve(process.cwd(), "app/+html.tsx"), "utf8");

    expect(htmlSource).toContain("color-scheme: only light !important;");
    expect(htmlSource).toContain("forced-color-adjust: none;");
    expect(htmlSource).toContain(".relation-result-webview * { -webkit-text-fill-color: currentColor !important; }");
    expect(htmlSource).not.toContain("* { -webkit-text-fill-color: inherit; }");
  });
});
