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

  it("keeps the reviewed personal report wording natural in both exact and reusable card-flow paths", () => {
    expect(localizeStaticCopy(
      "서로의 생각을 분명히 나누며 방향을 맞추고 싶어 합니다. 상대의 이야기를 듣고 신중하게 답합니다. 약속과 역할이 분명할 때 신뢰가 생깁니다.",
      "zh-CN",
    )).toBe("希望把彼此的想法说清楚，一起找到双方都能接受的方向。听完对方的讲述后再谨慎作答。约定和角色越清晰，越容易产生信任。");
    expect(localizeStaticCopy("깊이 생각할 시간이 보장되는 환경", "zh-CN")).toBe("能留出充分时间深入思考的环境");
    expect(localizeStaticCopy(
      "2번 블루 마름모는 지금 할 일을 순서대로 풀어 가며 흐름을 더합니다. 그래서 다른 선택지도 비교해 보는 선택이 자연스러울 수 있습니다.",
      "zh-CN",
    )).toBe("第2张蓝色菱形心理卡呈现出当前状态下的一种倾向：你可能会按顺序解决待办事项。此时，也会比较其他选项，再决定怎样做更合适。");
    expect(localizeStaticCopy(
      "3번 화이트 네모는 회복할 때 불필요한 부담을 덜고 하루의 틀을 정돈하는 방향을 제안합니다. 손에 잡히는 일부터 해내며 하루의 구조를 다시 세우는 작은 실천부터 시작해 보세요.",
      "zh-CN",
    )).toBe("第3张白色方形心理卡提示，恢复时不妨减轻不必要的负担，整理好一天的结构。从手边做得到的小事开始，一点点重新安排一天的节奏。");
    expect(localizeStaticCopy(
      "1번 레드 삼각형은 평소 스스로 정한 목표를 향해 직접 움직이고 싶은 마음을 바탕에 둡니다. 스스로 정한 목표가 보일 때 그 바탕이 더 또렷해질 수 있습니다.\n\n2번 블루 마름모는 지금 할 일을 순서대로 풀어 가며 흐름을 더합니다. 그래서 다른 선택지도 비교해 보는 선택이 자연스러울 수 있습니다.\n\n3번 화이트 네모는 회복할 때 불필요한 부담을 덜고 하루의 틀을 정돈하는 방향을 제안합니다. 손에 잡히는 일부터 해내며 하루의 구조를 다시 세우는 작은 실천부터 시작해 보세요.",
      "zh-CN",
    )).toContain("第2张蓝色菱形心理卡呈现出当前状态下的一种倾向");
    expect(localizeStaticCopy(
      "현재 대화에서는 남자친구는 명료한 사고와 현실 연결을 바탕으로 현재 상황을 살피는 편이고, 여자친구는 깊은 안정과 강인함을 바탕으로 현재 상황을 살피는 편입니다.",
      "zh-CN",
    )).toBe("在当前的对话中，男朋友可能更倾向于以清晰的思考与现实的连接为基础来观察当前状况；女朋友也可能更倾向于以深沉的安定与坚韧为基础来观察当前状况。");
    expect(localizeStaticCopy(
      "갈등이나 피로 뒤에는 남자친구는 순수한 새 시작을 작은 실천으로 이어가려는 쪽으로, 여자친구는 함께 성장하고 나누는 성향을 작은 실천으로 이어가려는 쪽으로 회복을 선택해볼 수 있습니다.",
      "zh-CN",
    )).toBe("在冲突或疲惫之后，男朋友可以尝试把纯粹的新开始落实到小小的行动中；女朋友则可以尝试把共同成长与分享落实到小小的行动中，作为恢复的方向。");
    expect(localizeStaticCopy(
      "지금은 3번 회복방향 카드의 함께 성장하고 나누는 성향을 바탕으로, 균형 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. 연결을 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.",
      "zh-CN",
    )).toBe("此刻可以参考第3张心理卡所呈现的共同成长与分享，在日常中慢慢找回平衡感。从一句小小的话、一个小小的行动开始，为连接留出空间，或许能缓和关系中的紧张，并成为更舒适地照顾自己内心的开始。");
    expect(localizeStaticCopy("활기를 더하느라 내 피로를 늦게 알아차리는 편", "zh-CN")).toBe("为了让气氛更有活力，往往会较晚察觉自己的疲惫");
    expect(localizeStaticCopy("부담 없는 한 가지 실천으로 이어가 보세요.", "zh-CN")).toBe("不妨从一件不造成负担的小事开始试一试。");
    expect(localizeStaticCopy(
      "생각으로 정리하기 어려운 감정은 말이나 글로 가볍게 꺼내보세요. 논리와 마음을 함께 살피는 시간이 도움이 될 수 있습니다.",
      "zh-CN",
    )).toBe("有些情绪光靠想很难理清，不妨用说出来或写下来的方式慢慢表达。给自己一点时间，兼顾理性的思考和内心的感受，也许会有所帮助。");
    expect(localizeStaticCopy(
      "관계 안에서 진심과 활기를 나누고 싶어 하는 성향이 있습니다. 함께 활동하고 표현을 나눌 때 연결감을 느끼기 쉽고, 관계에서 활기와 공유를 중요하게 여깁니다. 관계의 리듬이 자연히 흘러가도록 두는 것을 소중히 여깁니다. 내면에서는 여러 새 시작과 가능성을 자신이 납득할 한 방향으로 묶고 싶어 할 수 있습니다. 지금은 감정을 바로 앞세우기보다 상황을 정리하고 균형을 살핀 뒤, 필요한 마음을 표현하려는 흐름이 더해집니다. 회복 방향에서는 중요했던 마음을 성찰해 작은 대화나 실천으로 이어갈 때 관계의 의미를 다시 살필 수 있습니다.",
      "zh-CN",
    )).toContain("当你回顾那些曾经重视的心意");
  });

  it("rebuilds previously fragmented representative-combination output as complete Chinese", () => {
    expect(localizeStaticCopy(
      "일상의 조화와 안정이 중요한 경향이 있습니다. 일상에서는 주변의 입장을 고르게 살피는 편입니다.",
      "zh-CN",
    )).toBe("你可能很重视日常中的和谐与稳定，在生活中也会较为周全地顾及身边人的立场。");
    expect(localizeStaticCopy(
      "그린의 회복 · 오렌지의 활력 · 블랙의 보호가 가상 인물의 성향 흐름을 이루고 있습니다.",
      "zh-CN",
    )).toBe("绿色所呈现的恢复与平衡、橙色所呈现的活力与黑色所呈现的保护感，共同构成了这位虚拟人物的心理倾向。");
    expect(localizeStaticCopy("내가 감당할 범위를 분명히 하고 힘을 아껴 쓰는 쪽으로 향합니다.", "zh-CN"))
      .toBe("尽量把精力用在自己能够承担的事情上。");
    expect(localizeStaticCopy(
      "마음속 말을 믿을 사람에게 한마디라도 꺼내보세요. 감정을 나누는 경험이 관계를 조금 더 편안하게 할 수 있습니다.",
      "zh-CN",
    )).toBe("试着向信任的人说一句心里话吧。分享感受的经历，或许能让关系更轻松一些。");
    expect(localizeStaticCopy("따뜻한 연결 감각", "zh-CN")).toBe("温暖的连接感");
    expect(localizeStaticCopy("감정 표현 감각", "zh-CN")).toBe("表达情感的感觉");
    expect(localizeStaticCopy(
      "작은 공동 작업에서 역할표와 진행 기록을 만들어 보는 경험이 도움이 됩니다.",
      "zh-CN",
    )).toBe("可以尝试在小型协作中制作分工表和进度记录，积累这方面的实践经验。");
    expect(localizeStaticCopy(
      "아빠에게는 서로의 말이 바로 이어지지 않거나 분위기가 어색해지는 순간, 대화를 다시 잇고 싶은 마음이 앞설 수 있습니다.",
      "zh-CN",
    )).toBe("当彼此的话没有顺畅接上，或气氛变得尴尬时，爸爸可能会更想把对话重新接起来。");
    expect(localizeStaticCopy(
      "아빠가 자기 리듬과 여백을 지키려는 마음과 아들이 작은 움직임을 시작하고 실천하려는 마음이 만나 서로의 강점을 조율해 갈 수 있습니다.",
      "zh-CN",
    )).toBe("爸爸重视自己的节奏与留白；儿子更想开始并落实小小的行动。两种心意相遇后，双方可以在关系中慢慢发挥各自的长处。");
    expect(localizeStaticCopy(
      "엄마가 안정과 지속성을 중요하게 여기는 마음과 딸이 이유를 충분히 살피며 이해하려는 마음이 만나 서로의 강점을 조율해 갈 수 있습니다.",
      "zh-CN",
    )).toBe("妈妈重视稳定与持续性；女儿则倾向于充分探究原因并寻求理解。两种心意相遇后，双方可以在关系中慢慢发挥各自的长处。");
    expect(localizeStaticCopy(
      "주변이 어수선하면 기운이 쉽게 빠지는 편입니다. 주변 분위기가 밝을 때 마음이 한결 가벼워집니다. 내 선이 지켜질 때 긴장이 풀립니다.",
      "zh-CN",
    )).toBe("周围比较混乱时，你往往容易感到精力被消耗。周围气氛明朗时，心情会轻松一些。当自己的界限得到尊重时，紧张感也会慢慢缓解。");
    expect(localizeStaticCopy(
      "작은 약속을 지키며 신뢰를 쌓습니다. 밝은 반응으로 어색함을 풀어냅니다. 서로의 선을 존중하는 사람에게 천천히 다가갑니다.",
      "zh-CN",
    )).toBe("在关系中，你倾向于通过守住小小的约定来建立信任，也会用轻快的回应化解尴尬。面对愿意尊重彼此界限的人时，你会慢慢靠近。");
    expect(localizeStaticCopy(
      "아빠와 아들이 어떤 선택을 앞두고 각자 중요하게 보는 기준을 하나씩 말해 보면, 생각을 충분히 살피는 강점이 관계의 신뢰로 이어질 수 있습니다. 답을 빨리 맞추기보다 이유를 비교하는 과정이 두 사람의 공통 자원이 됩니다.",
      "zh-CN",
    )).toBe("面对一个选择时，爸爸和儿子如果能分别说出自己最看重的一项标准，仔细思考的优势就可能转化为关系中的信任。与其急着得出答案，不如把比较理由的过程当作两人共有的资源。");
    expect(localizeStaticCopy(
      "먼저 아빠가 해결보다 아들이 무엇을 이해받고 싶어 하는지 충분히 듣고, 다음으로 아들이 자기 생각을 정리할 여지를 남기는 순서가 좋습니다. 그다음 지금 가능한 한 가지 약속을 함께 정하면, 기대 압박형 흐름의 긴장이 서로를 배우는 시간으로 바뀔 수 있습니다.",
      "zh-CN",
    )).toBe("首先，爸爸可以先不急着给出解决办法，而是认真听听儿子最希望被理解的是什么；接着，给儿子留一点整理想法的空间。之后一起约定一件当下能做到的事，在期待与压力型的互动中出现的紧张感，也许能成为彼此学习的机会。");
    const coupleTrait = localizeStaticCopy(
      "남자친구는 인디고에서 드러난 관계의 이유와 의미를 깊게 살피는 통찰으로 마음을 표현하려 하고, 여자친구는 레드에서 드러난 마음을 행동으로 옮기고 관계의 흐름을 여는 추진력으로 연결을 확인하려 할 수 있습니다. 연락과 만남 사이에 감정이 엇갈릴 때도 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다.",
      "zh-CN",
    );
    expect(coupleTrait).toBe("男朋友可能会参考靛蓝所呈现的对关系的原因与意义做深刻审视的洞察力来表达心意；女朋友则可能会参考红色所呈现的将心意付诸行动并开启关系流动的推动力来确认彼此的连接。当联系与见面之间的情绪出现错位时，如果能用一句话告诉对方自己需要怎样的回应，彼此猜测的空间可能会减少。");
    expect(coupleTrait).not.toMatch(/[가-힣]|显露的方式说话|内心的纹理|即便即便|。。/);
    const marriedTrait = localizeStaticCopy(
      "무의식 카드에서 남편은 여러 새 시작을 하나의 방향으로 묶고 싶은 흐름을 보이고, 아내는 깊은 공감과 직관을 신뢰하며 의미를 살피는 흐름을 보입니다. 마젠타는 진심이 통하는 깊은 관계를 소중히 여기는 몰입으로 마음을 드러내고, 그린은 신뢰를 천천히 쌓고 관계의 평온을 돌보는 힘으로 연결을 확인하려 할 수 있습니다. 공동생활의 감정이 엇갈릴 때도 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다.",
      "zh-CN",
    );
    expect(marriedTrait).toContain("从潜意识心理卡所呈现的内容来看，丈夫可能想把多个新的开始汇聚为一个方向");
    expect(marriedTrait).toContain("丈夫可能会参考品红所呈现的");
    expect(marriedTrait).not.toMatch(/[가-힣]|卡牌中，显示出|品红一侧/);
    const parentSummary = localizeStaticCopy(
      "아빠의 1·2순위 인디고·그린는 인디고의 자기 리듬과 거리를 지키는 여백, 그린의 안정과 지속성을 관계의 중심에 둡니다. 아들의 1·2순위 레드·옐로우는 레드의 움직임을 시작하는 추진, 옐로우의 이유를 살피는 이해를 더합니다. 그래서 두 사람은 약속을 확정하는 순간의 속도 차이처럼 서로 다른 지점이 생길 수 있지만, 그 차이를 확인하는 방식 자체가 관계의 신뢰를 키우는 자원이 될 수 있습니다.",
      "zh-CN",
    );
    expect(parentSummary).toContain("爸爸的第1、2顺位选择为靛蓝·绿色");
    expect(parentSummary).toContain("爸爸可能更看重留出能守住自己节奏与距离的空间、稳定与持续性");
    expect(parentSummary).toContain("儿子可能更看重开始行动的动力、先理解原因的倾向");
    expect(parentSummary).not.toMatch(/[가-힣]|爸爸 的|颜色 心理卡流向/);
    const parentRole = localizeStaticCopy(
      "아빠가 대화를 이어 주는 역할로 마음을 전할 때, 아들은 그 마음을 방향과 관심으로 받아들일 수 있습니다. 다만 아들의 스스로 생각을 정리해 가는 역할 에너지가 충분히 표현되지 못하면, 같은 마음도 압박이나 통제로 느껴질 수 있습니다. 아들의 조용함이나 빠른 반응을 단정하기보다 무엇이 부담스러운지 먼저 묻고, 한 번에 하나의 약속을 함께 정해 보세요. 기대 압박형 흐름에서는 이런 작은 대화의 순서가 서로를 더 편안하게 만듭니다.",
      "zh-CN",
    );
    expect(parentRole).toContain("当爸爸以连接对话的角色传达心意时");
    expect(parentRole).toContain("儿子想要自主整理思路的需要没有得到充分表达");
    expect(parentRole).not.toMatch(/[가-힣]|爸爸 连接|儿子 的/);
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
