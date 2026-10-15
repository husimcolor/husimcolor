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

  it("uses complete Chinese sentences for the home entry and campaign cards", () => {
    expect(localizeStaticCopy("색으로 읽는 나의 마음", "zh-CN")).toBe("用色彩读懂当下的内心");
    expect(localizeStaticCopy("지금의 나와 두 사람의 관계를 원하는 방식으로 천천히 살펴보세요.", "zh-CN"))
      .toBe("按照你希望的方式，慢慢了解当下的自己与两个人的关系。");
    expect(localizeStaticCopy("3가지 컬러로 지금의 마음과 회복 방향을 살펴보세요.", "zh-CN"))
      .toBe("通过三种颜色，了解当下的内心状态与恢复方向。");
    expect(localizeStaticCopy("컬러 3개와 심리카드 3장으로 나를 깊이 살펴봅니다.", "zh-CN"))
      .toBe("通过三种颜色和三张心理卡，更深入地了解自己。");
    expect(localizeStaticCopy("부부·연인 · 부모·자녀 · 친구 관계를 선택할 수 있습니다.", "zh-CN"))
      .toBe("可选择夫妻/恋人、父母/子女或朋友关系。");
    expect(localizeStaticCopy("개인 심화 PDF 샘플 보기", "zh-CN")).toBe("查看个人深度分析 PDF 示例");
    expect(localizeStaticCopy("회원 상태를 확인하고 있습니다.", "zh-CN")).toBe("正在确认会员状态。");
    expect(localizeStaticCopy("전체 12쪽 · 가상 데이터", "zh-CN")).toBe("共 12 页 · 虚拟数据");
    expect(localizeStaticCopy("PDF 리포트 샘플 보기", "zh-CN")).toBe("查看 PDF 报告示例");
    expect(localizeStaticCopy("정가 59,000원", "zh-CN")).toBe("原价 59,000韩元");
    expect(localizeStaticCopy("→ 47,200원", "zh-CN")).toBe("→ 47,200韩元");
    expect(localizeStaticCopy("1번 카드", "zh-CN")).toBe("第1张心理卡");
    expect(localizeStaticCopy("2번 카드 선택 →", "zh-CN")).toBe("选择第2张心理卡 →");
  });

  it("keeps every three-colour card-flow role distinct in Chinese", () => {
    expect(localizeStaticCopy(
      "레드 · 블루 · 화이트에서 드러난 기본 성향을 바탕으로, 세 장의 카드는 무의식 · 현재흐름 · 회복방향을 차례로 비춥니다.",
      "zh-CN",
    )).toBe("红色、蓝色与白色所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。");
  });

  it("uses complete Chinese sentences for reviewed personal and relationship output", () => {
    expect(localizeStaticCopy("감정 비움", "zh-CN")).toBe("情绪释放");
    expect(localizeStaticCopy(
      "그린은 틸의 감정 표현에 균형 회복을 더해, 회복을 일상에서 이어가도록 돕는 컬러입니다.",
      "zh-CN",
    )).toBe("绿色可为蓝绿色的情感表达带来平衡感，帮助你把恢复的节奏延续到日常。");
    expect(localizeStaticCopy(
      "라벤더는 오렌지의 따뜻한 연결에 자기 돌봄을 더해, 회복을 일상에서 이어가도록 돕는 컬러입니다.",
      "zh-CN",
    )).toBe("薰衣草色可在橙色带来的温暖连接中，增添照顾自己的空间，帮助你把恢复的节奏延续到日常。");
    expect(localizeStaticCopy(
      "크림은 라벤더의 자기 돌봄에 자기 리듬 회복을 더해, 회복을 일상에서 이어가도록 돕는 컬러입니다.",
      "zh-CN",
    )).toBe("奶油色可为薰衣草色所代表的自我照顾增添找回自身节奏的力量，帮助你把恢复的节奏延续到日常。");
    expect(localizeStaticCopy(
      "틸은 코랄의 자기 돌봄에 감정 표현을 더해, 회복을 일상에서 이어가도록 돕는 컬러입니다.",
      "zh-CN",
    )).toBe("蓝绿色可在珊瑚色所强调的自我照顾中，支持更自然地表达情感，帮助你把恢复的节奏延续到日常。");
    expect(localizeStaticCopy("정보를 판단으로 바꾸는 전략 해석가형", "zh-CN"))
      .toBe("善于从信息中整理方向的人");
    expect(localizeStaticCopy("관심 주제의 자료를 출처별로 비교해 보는 습관부터 가볍게 만들어 보세요.", "zh-CN"))
      .toBe("可以先选一个感兴趣的主题，比较不同来源的资料，逐渐养成整理和分析信息的习惯。");
    expect(localizeStaticCopy(
      "복잡한 정보에서 핵심을 찾고, 다음에 무엇을 할지 정하는 데 강점이 드러납니다. 결단을 행동으로 옮기는 방식이 바탕이 되고, 차분히 몰입하는 방식이 그 힘을 사회에서 드러내는 데 보탬이 됩니다. 지금까지 해 온 일을 다음 가능성과 연결하는 과정에서 특히 잘 쓸 수 있는 자원입니다.",
      "zh-CN",
    )).toBe("从这次选择来看，在复杂信息中梳理要点、决定下一步方向时，你可能更容易发挥优势。把决定落实为行动，是你较为熟悉的方式；沉静投入也有助于让这股力量在社会角色中得到发挥。在把至今所做与下一步可能性连接起来的过程中，这些特质可以成为可用的资源。");
    expect(localizeStaticCopy("회복형 관계", "zh-CN")).toBe("重视修复与重新连接的关系");
    expect(localizeStaticCopy(
      "주변 사람에게 다정한 관심을 표현하고 세심하게 챙기는 편입니다. 해결책보다 서로의 마음을 이해하는 대화를 좋아합니다.",
      "zh-CN",
    )).toBe("倾向于表达温柔的关心，并细心照顾身边的人。比起提供解决办法，更喜欢相互理解心意的对话。");
    expect(localizeStaticCopy(
      "감정을 밝고 가볍게 표현하는 편이지만, 내면에는 생각이 많습니다. 걱정을 혼자 담아두다가 한꺼번에 꺼내는 경우가 있습니다.",
      "zh-CN",
    )).toBe("倾向明快轻松地表达情感，但内心也有许多思考。常把担忧独自积累，偶尔会一次性全说出来。");
    expect(localizeStaticCopy(
      "먼저 엄마가 해결보다 딸이 무엇을 이해받고 싶어 하는지 충분히 듣고, 다음으로 딸이 자기 생각을 정리할 여지를 남기는 순서가 좋습니다. 그다음 지금 가능한 한 가지 약속을 함께 정하면, 성장 지원형 흐름의 긴장이 서로를 배우는 시간으로 바뀔 수 있습니다.",
      "zh-CN",
    )).toBe("首先，妈妈与其急于给出解决办法或说明，不如先认真听女儿想被理解的内容；接着，给女儿留下整理想法的空间。然后一起确定一件当下可行的约定，在彼此支持成长的互动中出现的紧张感，也可能转化为互相学习的时间。");
    expect(localizeStaticCopy("“네가 스스로 해 보고 싶은 방법이 있다면, 내가 옆에서 도울게.”", "zh-CN"))
      .toBe("“如果你有想亲自尝试的方法，我会在你身边帮你。”");
  });

  it("uses clear native-reader wording for audited roles, prompts, and recovery copy", () => {
    expect(localizeStaticCopy("자녀 기질 맞춤 소통", "zh-CN")).toBe("适合孩子心理特点的沟通方式");
    expect(localizeStaticCopy("쉼 없는 질주", "zh-CN")).toBe("疲惫时仍不停地向前赶");
    expect(localizeStaticCopy("1번 카드 · 무의식", "zh-CN")).toBe("第1张心理卡 · 潜意识");
    expect(localizeStaticCopy("공개 예시 리포트 · 가상 데이터로 생성됨 · 실제 고객 개인정보 미사용", "zh-CN"))
      .toBe("公开示例报告 · 使用虚拟数据制作 · 不含真实客户个人信息");
    expect(localizeStaticCopy("변화를 편안하게 돕는 관계 동행가형", "zh-CN")).toBe("温和陪伴关系变化的人");
    expect(localizeStaticCopy("함께 움직일 길을 만드는 현장 조정가형", "zh-CN")).toBe("帮助大家一起行动的协调者");
    expect(localizeStaticCopy("성장 지원형 관계", "zh-CN")).toBe("彼此支持成长的关系");
    expect(localizeStaticCopy("틸의 회복 방식", "zh-CN")).toBe("蓝绿色的恢复方式");
    expect(localizeStaticCopy(
      "마젠타의 진심이 통하는 깊은 관계를 소중히 여기는 몰입이 두드러집니다. 겉으로 드러난 말보다 마음의 결을 살피며, 관계가 놓치기 쉬운 의미를 붙잡습니다. 다만 감정을 모두 안에 담아두지 않도록 안전한 방식으로 조금씩 나누는 편이 좋습니다.",
      "zh-CN",
    )).toContain("细心体会内心的感受");
    expect(localizeStaticCopy("蒂尔色", "zh-CN")).toBe("蓝绿色");
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
