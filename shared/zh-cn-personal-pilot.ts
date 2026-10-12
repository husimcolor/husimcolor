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
  sampleNotice: "公开审核样本 · 由虚拟数据生成 · 未使用真实客户个人信息",
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
        description: "目标越清楚，你越容易感到踏实；做出决定后，往往会很快行动。",
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
        description: "你重视认真投入和深入信任，也更倾向用行动而非言语来兑现承诺。",
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
        description: "当思绪变复杂时，你会想把事情理顺，让自己轻松些。需要时，不妨列出待办、逐项完成，重新找回自己的节奏。",
        strengths: ["清晰的标准", "较高的完成度"],
        tiredStates: ["倾向独自整理", "先与人拉开距离"],
      },
    ],
    integrationBridge: "面对要处理的事，你倾向先确认方向，再充分听取信息后作出判断。步骤清楚时，心里也更踏实。",
    psychologyTendency: "事情停滞不前时，你会较在意；没说出口的部分，也容易多想一步。把待办梳理清楚后，思路会更清晰。",
    personalityTendency: "你能较快厘清工作的轻重缓急，听取信息、思考后再回应，并在结束前确认是否有遗漏。",
    strengths: ["明确的推进力", "审慎的复核", "有条理的整理能力", "即使事情紧急也能建立步骤"],
    growthPossibility: ["事情紧急时，容易先加快脚步", "为了理清想法，回复有时会晚一些", "觉得准备不够时，可能会暂缓回答"],
    relationshipTendency: "你希望清楚交换彼此的想法，协调方向。听完对方的说法后，再谨慎回应；约定和角色越明确，信任越容易建立。",
  },
  stage2Bridge: "以红色、蓝色与白色呈现的基础倾向为线索，三张心理卡依次呈现内在愿望、当下状态与下一步调整方向。",
  cards: [
    {
      position: "第1张卡 · 潜在心理倾向",
      label: "红色 · 三角形",
      colorName: "红色",
      shapeName: "三角形",
      colorHex: "#E53935",
      shape: "triangle",
      colorKeywords: "推进 · 表达 · 活力",
      shapeKeywords: "目标 · 成长 · 推进",
      roleLabel: "内在的愿望",
      narrative: "当你有了想做的事，内心会更想亲自行动。自己设定的目标逐渐清楚时，这份愿望也会更清晰。",
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
      narrative: "现在，你会按步骤处理眼前的事，用自己认可的方式往前推进。同时会比较不同的情况，为其他选择留出空间。",
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
      narrative: "需要调整状态时，你更想卸下不必要的负担，用轻松些的方式安排一天。可以先从手边能完成的小事开始，重新建立日常的节奏。",
    },
  ],
  complementColors: [
    { name: "薰衣草紫", koreanName: "라벤더", meaning: "练习关照自己" },
    { name: "鼠尾草绿", koreanName: "세이지그린", meaning: "回到自然，放松身心" },
  ],
  colorFlowDescription: "红色的热情、蓝色的责任感与白色带来的整理感，构成了这个虚拟样本当下的心理线索。它们不定义人格，而是帮助理解自己如何行动、信任，并在需要时调整状态。",
  combinedCoaching: [
    "第1张红色三角形映照出一种朝自己设定目标迈步的内在动力。目标逐渐清楚时，这股动力也会更清晰。",
    "第2张蓝色菱形为按顺序处理事情的方式带来新的角度。比较不同选项、为其他选择留出空间，会成为自然的下一步。",
    "第3张白色方形提示，在需要调整状态时，可以先卸下不必要的负担，重新整理一天的安排。不妨从一件看得见、做得到的小事开始，逐步找回对日常生活的掌控感。",
  ],
  lifeRole: {
    title: "信息梳理与判断型",
    description: "你擅长从复杂信息中找出重点，判断下一步可以做什么。能把决定落实成行动，也愿意沉下心来梳理细节，这些特点有助于在工作和社会角色中发挥自己的优势。在尝试新的方向时，你积累的经验和这些优势，可以为你提供支持。",
    humanStrengths: ["抓住重点的判断力", "把复杂内容梳理成结构", "有依据地做选择"],
    directions: [
      {
        title: "企划与策略",
        description: "善于建立判断标准，这在需要厘清下一步方向的工作中很有帮助。",
        preparation: "可以从把一个小任务分成目标、条件与选项开始练习，为判断积累依据。",
      },
      {
        title: "运营改善与流程设计",
        description: "能把零散流程转成易懂步骤，有助于把工作顺序安排得更顺畅。",
        preparation: "不妨观察一个重复发生的流程，并尝试把更轻松的顺序整理在一页纸上。",
      },
      {
        title: "研究与分析",
        description: "善于寻找必要线索，为现场判断打下扎实基础。",
        preparation: "可以先选一个感兴趣的主题，比较不同来源的资料，逐渐养成整理和分析信息的习惯。",
      },
    ],
    environments: ["能保证深入思考时间的环境", "标准与角色较明确的环境", "能够逐步检查结果的环境"],
    shadows: ["了解充分后才愿意行动，开始的时点容易往后拖", "为了找更好的答案，可能反复检查已经做出的结论"],
    smallDirection: "不妨从最近负责的一件事中，写下最复杂的部分，以及你如何把它梳理清楚；三行就够了。",
  },
  energyFlow: {
    currentElements: ["水", "火"],
    title: "当前能量节奏偏快",
    description: "这段时间，情绪反应可能会比较快，对刺激也更敏感。热情和行动力会被带动起来，但身体也容易疲惫，心里有时像在持续运转。如果忙碌的思绪或难以入睡的日子持续出现，可以把它当作需要休息的提醒。",
    recovery: "不妨放慢一点，给自己留出调整呼吸的时间。一杯凉水、短暂散步或安静听一首歌，都能帮助身体放松下来。",
    balanceKeywords: ["调节速度", "调整呼吸", "安静休息"],
    complementaryElements: ["金", "木"],
    complementColors: ["薰衣草紫", "鼠尾草绿"],
  },
  recoveryRoutine: {
    tea: "白茶或菊花茶",
    food: "梨、萝卜等清淡的白色食物",
    breath: "让心慢慢安定下来的缓慢腹式呼吸",
    movement: "在早晨晒一会儿太阳",
    smallPractice: "晚上暂停使用手机一小时",
    message: "敏感不需要被否定；它也提醒你正在察觉更多细微的变化。",
  },
  coachingUrl: "https://naver.me/ID3fxw2W",
};

export const ZH_CN_PILOT_DISCLAIMER = "本报告以当前选择为线索，提供自我理解与日常身心照顾的参考；它不构成医疗诊断或治疗建议。";
