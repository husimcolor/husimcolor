import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screenSource = readFileSync(
  resolve(process.cwd(), "app/(tabs)/premium-color-select.tsx"),
  "utf8",
);

function styleBlock(name: string): string {
  const match = screenSource.match(new RegExp(`${name}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!match) throw new Error(`${name} 스타일을 찾을 수 없습니다.`);
  return match[1];
}

describe("유료 심화 1단계 모바일 가독성 스타일", () => {
  it("본문과 영역 제목이 요청된 모바일 읽기 크기를 유지한다", () => {
    expect(styleBlock("sectionText")).toMatch(/fontSize: 16/);
    expect(styleBlock("sectionText")).toMatch(/lineHeight: 25/);
    expect(styleBlock("sectionLabel")).toMatch(/fontSize: 14/);
    expect(styleBlock("sectionLabel")).toMatch(/fontWeight: "700"/);
  });

  it("통합 문장과 미니 해석 본문도 여유 있는 줄간격을 유지한다", () => {
    expect(styleBlock("integrationBridgeText")).toMatch(/fontSize: 15/);
    expect(styleBlock("integrationBridgeText")).toMatch(/lineHeight: 23/);
    expect(styleBlock("miniColorDescription")).toMatch(/fontSize: 15/);
    expect(styleBlock("miniColorDescription")).toMatch(/lineHeight: 23/);
  });

  it("장점과 성장 가능성 태그가 확대된 글자 및 좌우 여백을 유지한다", () => {
    expect(styleBlock("tag")).toMatch(/paddingHorizontal: 12/);
    expect(styleBlock("tag")).toMatch(/paddingVertical: 5/);
    expect(styleBlock("tag")).toMatch(/maxWidth: "100%"/);
    expect(styleBlock("tagText")).toMatch(/fontSize: 13/);
    expect(styleBlock("tagText")).toMatch(/lineHeight: 18/);
    expect(styleBlock("tagText")).toMatch(/flexShrink: 1/);
  });

  it("좁은 모바일 폭에서도 태그가 줄바꿈되고 카드 높이가 내용에 맞게 늘어난다", () => {
    expect(styleBlock("tagRow")).toMatch(/flexWrap: "wrap"/);
    expect(styleBlock("sectionCard")).not.toMatch(/\bheight:/);
    expect(styleBlock("sectionCard")).not.toMatch(/\bmaxHeight:/);
  });
});
