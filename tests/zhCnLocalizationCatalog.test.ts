import { describe, expect, it } from "vitest";

import { ZH_CN_INTERPRETATION_COPY, ZH_CN_INTERPRETATION_COPY_STATS } from "../shared/locales/zh-cn-interpretation-catalog";
import { ZH_CN_STATIC_COPY, ZH_CN_STATIC_COPY_STATS } from "../shared/locales/zh-cn-static-catalog";
import { localizePayload, localizeStaticCopy } from "../lib/zh-cn-copy";

describe("zh-CN static localization catalog", () => {
  it("keeps the approved role labels distinct", () => {
    expect(localizeStaticCopy("주기질", "zh-CN")).toBe("主要心理特征");
    expect(localizeStaticCopy("보조기질", "zh-CN")).toBe("辅助心理特征");
    expect(localizeStaticCopy("회복방향", "zh-CN")).toBe("恢复方向");
    expect(localizeStaticCopy("무의식", "zh-CN")).toBe("潜意识");
    expect(localizeStaticCopy("현재흐름", "zh-CN")).toBe("当前状态");
    expect(localizeStaticCopy("추천 보완컬러", "zh-CN")).toBe("推荐调和色");
  });

  it("contains the full extracted static-copy set", () => {
    expect(ZH_CN_STATIC_COPY_STATS.inputItems).toBe(11237);
    expect(ZH_CN_STATIC_COPY_STATS.translatedItems).toBe(11237);
    expect(Object.keys(ZH_CN_STATIC_COPY)).toHaveLength(ZH_CN_STATIC_COPY_STATS.uniqueSourceItems);
  });

  it("contains a complete zh-CN interpretation locale pack without Korean residual text", () => {
    expect(ZH_CN_INTERPRETATION_COPY_STATS.entries).toBe(6676);
    expect(Object.values(ZH_CN_INTERPRETATION_COPY).some((copy) => /[가-힣]/.test(copy))).toBe(false);
  });

  it("keeps reviewed natural-language overrides ahead of generated wording", () => {
    expect(localizeStaticCopy("솔직한 추진", "zh-CN")).toBe("坦率表达，积极行动");
    expect(localizeStaticCopy("따뜻한 사교성", "zh-CN")).toBe("待人热情，容易亲近");
    expect(localizeStaticCopy("분위기 주도", "zh-CN")).toBe("让气氛活跃起来");
    expect(localizeStaticCopy("자신의 내면을 조용히 살피고 감정을 차분하게 정리하는 편입니다. 겉으로 드러내기보다 조용한 공감으로 마음을 전합니다.", "zh-CN"))
      .toBe("你注重内心感受，会平静地整理情绪。比起外露，更会通过默默的理解与体贴表达心意。");
  });

  it("keeps every three-colour card-flow role distinct in Chinese", () => {
    expect(localizeStaticCopy(
      "레드 · 블루 · 화이트에서 드러난 기본 성향을 바탕으로, 세 장의 카드는 무의식 · 현재흐름 · 회복방향을 차례로 비춥니다.",
      "zh-CN",
    )).toBe("红色、蓝色与白色所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。");
  });

  it("translates nested payload copy without changing Korean fallback behavior", () => {
    const value = { title: "주기질", nested: ["추천 보완컬러", { copy: "회복방향" }] };
    expect(localizePayload(value, "zh-CN")).toEqual({
      title: "主要心理特征",
      nested: ["推荐调和色", { copy: "恢复方向" }],
    });
    expect(localizePayload(value, "ko")).toEqual(value);
  });
});
