export type ZhCnPilotCardShape = "circle" | "triangle" | "inverted_triangle" | "square" | "diamond" | "pentagon" | "hexagon";

export type ZhCnPilotReport = {
  profileLine: string;
  generatedAt: string;
  sampleNotice: string;
  complementColorTerm: "调和色";
  selectedColors: Array<{ name: string; koreanName: string; keywords: string; hex: string }>;
  stage1: {
    colors: Array<{
      role: string;
      koreanRole: string;
      name: string;
      koreanName: string;
      hex: string;
      keywords: string[];
      description: string;
      strengths: string[];
      tiredStates: string[];
    }>;
    integrationBridge: string;
    psychologyTendency: string;
    personalityTendency: string;
    strengths: string[];
    growthPossibility: string[];
    relationshipTendency: string;
  };
  stage2Bridge: string;
  cards: Array<{
    position: string;
    label: string;
    colorName: string;
    shapeName: string;
    colorHex: string;
    shape: ZhCnPilotCardShape;
    colorKeywords: string;
    shapeKeywords: string;
    roleLabel: string;
    narrative: string;
  }>;
  complementColors: Array<{ name: string; koreanName: string; meaning: string }>;
  colorFlowDescription: string;
  combinedCoaching: string[];
  lifeRole: {
    title: string;
    description: string;
    humanStrengths: string[];
    directions: Array<{ title: string; description: string; preparation: string }>;
    environments: string[];
    shadows: string[];
    smallDirection: string;
  };
  energyFlow: {
    currentElements: string[];
    title: string;
    description: string;
    recovery: string;
    balanceKeywords: string[];
    complementaryElements: string[];
    complementColors: string[];
  };
  recoveryRoutine: {
    tea: string;
    food: string;
    breath: string;
    movement: string;
    smallPractice: string;
    message: string;
  };
  coachingUrl: string;
};

/**
 * 중국어 간체 검토 전용 고정 샘플. 운영 결과·DB·결제·이메일을 읽거나 쓰지 않는다.
 * 한국어 공개 샘플과 같은 고정 입력: 레드·블루·화이트 / 레드 삼각형·블루 마름모·화이트 네모.
 */
export const ZH_CN_PERSONAL_PILOT_REPORT: ZhCnPilotReport = {
  profileLine: "个人深度分析 · 虚拟人物",
  generatedAt: "2026年10月12日",
  sampleNotice: "公开示例报告 · 由虚拟数据生成 · 未使用真实客户个人信息",
  complementColorTerm: "调和色",
  selectedColors: [
    { name: "红色", koreanName: "레드", keywords: "热情 · 紧张感 · 行动力", hex: "#CC1A1A" },
    { name: "蓝色", koreanName: "블루", keywords: "责任感 · 信任 · 沉静", hex: "#5A7EC4" },
    { name: "白色", koreanName: "화이트", keywords: "整理 · 留白 · 轻盈", hex: "#F0EDE8" },
  ],
  stage1: {
    colors: [
      {
        role: "主要心理特征",
        koreanRole: "주기질",
        name: "红色",
        koreanName: "레드",
        hex: "#CC1A1A",
        keywords: ["热情", "紧张感", "行动力"],
        description: "当目标清晰时，你可能会更安心。在日常里，一旦做出决定，往往会较快地付诸行动。",
        strengths: ["快速行动", "明确表达意愿"],
        tiredStates: ["容易心急", "持续向前而难以休息"],
      },
      {
        role: "辅助心理特征",
        koreanRole: "나의 또 다른 성향",
        name: "蓝色",
        koreanName: "블루",
        hex: "#5A7EC4",
        keywords: ["责任感", "信任", "沉静"],
        description: "你可能重视认真投入与深度信任；在日常中，比起言语，更容易通过行动来守住承诺。",
        strengths: ["责任感", "深入倾听"],
        tiredStates: ["独自承担", "把真实感受压在心里"],
      },
      {
        role: "恢复方向",
        koreanRole: "회복 방향",
        name: "白色",
        koreanName: "화이트",
        hex: "#F0EDE8",
        keywords: ["整理", "留白", "轻盈"],
        description: "当思绪变得复杂时，你可能更希望把它们梳理清楚、让自己轻松一些。需要时，通过列出待办并有条理地完成，也许能帮助你重新找回平衡。",
        strengths: ["清晰的标准", "较高的完成度"],
        tiredStates: ["倾向独自整理", "先与人拉开距离"],
      },
    ],
    integrationBridge: "面对需要处理的事，你可能会先确定方向；同时，也会充分听取信息后再作判断。当清晰的步骤浮现时，内心往往更容易安定下来。",
    psychologyTendency: "当事情像是停在原地时，你可能会比较在意；对于没有说出口的部分，也容易多想一步。当待办事项得到整理时，思绪可能会更清明。",
    personalityTendency: "你可能较快地厘清工作的优先顺序，在听取信息并思考后给出回应，也会在结束前确认是否有遗漏。",
    strengths: ["明确的推进力", "审慎的复核", "有条理的整理能力", "即使事情紧急也能建立步骤"],
    growthPossibility: ["事情紧急时，可能会先加快速度", "为了整理想法，回应可能稍晚", "觉得准备还不够时，可能会推迟回答"],
    relationshipTendency: "在关系中，你可能希望清楚分享彼此的想法并协调方向。你会先听对方怎么说，再谨慎回应；当约定和角色较明确时，信任感可能更容易建立。",
  },
  stage2Bridge: "以红色、蓝色与白色所呈现的基础倾向为线索，三张心理卡会依次映照内在的愿望、当下的反应与下一步方向。",
  cards: [
    {
      position: "第1张卡 · 潜在心理流向",
      label: "红色 · 三角形",
      colorName: "红色",
      shapeName: "三角形",
      colorHex: "#E53935",
      shape: "triangle",
      colorKeywords: "推进 · 表达 · 活力",
      shapeKeywords: "目标 · 成长 · 推进",
      roleLabel: "内在的愿望",
      narrative: "当你有了想做的事，心里可能会更想亲自行动看看。对你而言，当自己设定的目标渐渐清晰时，这份愿望也许会更容易被感受到。",
    },
    {
      position: "第2张卡 · 当前状态",
      label: "蓝色 · 菱形",
      colorName: "蓝色",
      shapeName: "菱形",
      colorHex: "#1E88E5",
      shape: "diamond",
      colorKeywords: "信任 · 沉静 · 专注",
      shapeKeywords: "变化 · 转换视角 · 灵活性",
      roleLabel: "当下的反应",
      narrative: "现在的你可能会按步骤处理眼前的事，并以自己能够理解和认同的方式向前推进。同时，也可能会比较不同的情况，为与当前不同的选择保留空间。",
    },
    {
      position: "第3张卡 · 恢复方向",
      label: "白色 · 方形",
      colorName: "白色",
      shapeName: "方形",
      colorHex: "#F5F5F0",
      shape: "square",
      colorKeywords: "整理 · 留白 · 清晰",
      shapeKeywords: "结构 · 稳定 · 现实感",
      roleLabel: "下一步方向",
      narrative: "在需要恢复时，你可能会希望卸下不必要的负担，以更轻松的方式安排一天。重新建立日常的框架，并从手边能完成的小事开始，也许会是适合尝试的方向。",
    },
  ],
  complementColors: [
    { name: "薰衣草紫", koreanName: "라벤더", meaning: "温柔地照顾自己" },
    { name: "鼠尾草绿", koreanName: "세이지그린", meaning: "回到自然、舒缓地恢复" },
  ],
  colorFlowDescription: "红色的热情、蓝色的责任感与白色的整理感，共同构成了这位虚拟人物当下的心理倾向。它们不是对人格的定论，而是帮助理解自己如何行动、信任与恢复的一组线索。",
  combinedCoaching: [
    "第1张红色三角形，呈现出一种希望朝自己设定目标直接迈步的内在动力。当目标逐渐清晰时，这股动力可能会更容易浮现。",
    "第2张蓝色菱形，为当下按顺序处理事情的方式增添了新的角度。因此，比较不同选项、为其他可能性留出空间，也许会成为自然的选择。",
    "第3张白色方形，提示恢复时可以先卸下不必要的负担，并重新整理一天的框架。或许可以从一件看得见、做得到的小事开始，让生活的结构慢慢回到手中。",
  ],
  lifeRole: {
    title: "把信息转化为判断的策略解读者型",
    description: "你可能擅长从复杂的信息中找到重点，并判断下一步可以做什么。把决定落实为行动的方式构成基础，而沉静专注的工作方法，可能帮助这份力量在社会与工作中被看见。将至今累积的经验连接到下一种可能时，这些特质或许会成为可用的资源。",
    humanStrengths: ["抓住重点的判断力", "把复杂内容梳理成结构", "有依据地做选择"],
    directions: [
      {
        title: "企划与策略",
        description: "建立判断标准的能力，可能有助于需要确认下一步方向的工作。",
        preparation: "可以从把一个小任务分成目标、条件与选项开始练习，为判断积累依据。",
      },
      {
        title: "运营改善与流程设计",
        description: "把零散流程转成易懂步骤的能力，可能为改善工作顺序提供支持。",
        preparation: "不妨观察一个重复发生的流程，并尝试把更轻松的顺序整理在一页纸上。",
      },
      {
        title: "研究与分析",
        description: "寻找必要线索的能力，可能成为支持现场判断的良好基础。",
        preparation: "可以从轻松养成按来源比较感兴趣主题资料的习惯开始。",
      },
    ],
    environments: ["可以保证深入思考时间的环境", "标准与角色较明确的环境", "能够逐步检查结果的环境"],
    shadows: ["可能想等充分了解后才行动，因此开始得较晚", "为了寻找更好的答案，可能反复检视已做出的结论"],
    smallDirection: "不妨从最近负责的一件事中，写下最复杂的部分，以及你如何把它整理清楚；三行就足够。",
  },
  energyFlow: {
    currentElements: ["水", "火"],
    title: "能量节奏可能较快的时期",
    description: "此刻，你的情绪可能反应得较快，也可能对刺激较敏感。热情和推进力或许很鲜活，但身体也可能因此更容易疲惫，心里有时会感到过热。如果忙碌的思绪或难以入睡的日子持续出现，或许可以把它当作身体需要休息的一个信号。",
    recovery: "适度放慢速度、重新找回呼吸节奏，也许会有帮助。一杯凉水、短暂散步或一首安静的音乐，都可能温和地缓解身体的紧张。",
    balanceKeywords: ["调节速度", "恢复呼吸", "安静休息"],
    complementaryElements: ["金", "木"],
    complementColors: ["薰衣草紫", "鼠尾草绿"],
  },
  recoveryRoutine: {
    tea: "白茶或菊花茶",
    food: "梨、萝卜等清淡的白色食物",
    breath: "让心慢慢安定下来的缓慢腹式呼吸",
    movement: "在早晨晒一会儿太阳",
    smallPractice: "晚上暂停使用手机一小时",
    message: "敏感并不需要被否定；它也可能意味着你正在感受更多细微的变化。",
  },
  coachingUrl: "https://naver.me/ID3fxw2W",
};

export const ZH_CN_PILOT_DISCLAIMER = "本报告以当前选择为线索，提供自我理解与日常身心照顾的参考；它不构成医疗诊断或治疗建议。";
