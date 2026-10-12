export type EnPilotCardShape = "circle" | "triangle" | "inverted_triangle" | "square" | "diamond" | "pentagon" | "hexagon";

export type EnPilotReport = {
  profileLine: string;
  generatedAt: string;
  sampleNotice: string;
  complementaryColorTerm: "Complementary Colour";
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
    shape: EnPilotCardShape;
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
 * English review-only fixed sample. It does not read or write production results,
 * customer data, checkout, login, coupon, database, or email resources.
 * Input matches the Korean and zh-CN pilot: red · blue · white / red triangle · blue diamond · white square.
 */
export const EN_PERSONAL_PILOT_REPORT: EnPilotReport = {
  profileLine: "Personal Deep Analysis · Fictional Profile",
  generatedAt: "12 October 2026",
  sampleNotice: "Report sample · Generated from fictional data · No real customer information is used",
  complementaryColorTerm: "Complementary Colour",
  selectedColors: [
    { name: "Red", koreanName: "레드", keywords: "Passion · Tension · Drive", hex: "#CC1A1A" },
    { name: "Blue", koreanName: "블루", keywords: "Responsibility · Trust · Quiet focus", hex: "#5A7EC4" },
    { name: "White", koreanName: "화이트", keywords: "Clearing · Space · Lightness", hex: "#F0EDE8" },
  ],
  stage1: {
    colors: [
      {
        role: "Primary Disposition",
        koreanRole: "주기질",
        name: "Red",
        koreanName: "레드",
        hex: "#CC1A1A",
        keywords: ["Passion", "Tension", "Drive"],
        description: "When your goal is clear, you may feel more settled. Once you have made a decision, you may be inclined to act quickly.",
        strengths: ["Quick to take action", "Clear expression of intention"],
        tiredStates: ["Impatience", "Pushing on without enough rest"],
      },
      {
        role: "Supporting Disposition",
        koreanRole: "보조기질",
        name: "Blue",
        koreanName: "블루",
        hex: "#5A7EC4",
        keywords: ["Responsibility", "Trust", "Quiet focus"],
        description: "You may be inclined to approach things sincerely and place importance on trust between people. Rather than relying on words alone, you may prefer to keep promises through your actions.",
        strengths: ["Responsibility", "Attentive listening"],
        tiredStates: ["Carrying things alone", "Keeping your true feelings inside"],
      },
      {
        role: "Complementary Colour",
        koreanRole: "보완컬러 · 파일럿 기준",
        name: "White",
        koreanName: "화이트",
        hex: "#F0EDE8",
        keywords: ["Clearing", "Space", "Lightness"],
        description: "When your thoughts feel complicated, you may want to put things in order and give yourself more room to breathe. When needed, try writing down what needs to be done and completing one item at a time, so you can return to your own rhythm.",
        strengths: ["Clear standards", "Strong attention to completion"],
        tiredStates: ["Trying to sort everything out alone", "Stepping back from others first"],
      },
    ],
    integrationBridge: "When there is something to handle, you may first clarify the direction, listen carefully to what the other person has to say, and then make a decision. A clear sequence can help you feel more at ease.",
    psychologyTendency: "When things feel stalled, you may be more sensitive to it; you may also think a step further about what has not been said. Putting tasks in order can help your thoughts feel clearer.",
    personalityTendency: "You may often be able to sort out what needs attention first, take in relevant information, think it through, and check for anything missed before finishing.",
    strengths: ["A clear sense of direction", "Careful review", "Organising tasks with structure", "Finding an order even when things feel urgent"],
    growthPossibility: ["When things feel urgent, you may speed up first", "You may reply later while sorting through your thoughts", "You may hold back a response when you do not yet feel ready"],
    relationshipTendency: "You may prefer to make each other's thoughts clear and find a direction both people can accept. After listening to the other person, you may respond carefully; when promises and roles are clear, trust can be easier to build.",
  },
  stage2Bridge: "Using the underlying tendencies shown by red, blue, and white as a guide, the three psychological cards explore the unconscious, the current state, and the recovery direction in sequence.",
  cards: [
    {
      position: "Card 1 · Unconscious",
      label: "Red · Triangle",
      colorName: "Red",
      shapeName: "Triangle",
      colorHex: "#E53935",
      shape: "triangle",
      colorKeywords: "Drive · Expression · Vitality",
      shapeKeywords: "Goal · Growth · Momentum",
      roleLabel: "An inner wish",
      narrative: "When something matters to you, a wish to act on it yourself may become stronger. As a goal you have set for yourself becomes clearer, that wish may also come into clearer view.",
    },
    {
      position: "Card 2 · Current State",
      label: "Blue · Diamond",
      colorName: "Blue",
      shapeName: "Diamond",
      colorHex: "#1E88E5",
      shape: "diamond",
      colorKeywords: "Trust · Calmness · Focus",
      shapeKeywords: "Change · A shift in perspective · Flexibility",
      roleLabel: "Your response in the present",
      narrative: "At the moment, you may work through what is in front of you step by step and continue in a way that feels right to you. You may also compare different possibilities and leave room for another option.",
    },
    {
      position: "Card 3 · Recovery Direction",
      label: "White · Square",
      colorName: "White",
      shapeName: "Square",
      colorHex: "#F5F5F0",
      shape: "square",
      colorKeywords: "Order · Space · Clarity",
      shapeKeywords: "Structure · Stability · Practicality",
      roleLabel: "Recovery direction",
      narrative: "When you need to reset, you may want to set down unnecessary burdens and arrange your day in a lighter way. You could begin with one manageable task at hand and gradually rebuild a steadier daily rhythm.",
    },
  ],
  complementColors: [
    { name: "Lavender", koreanName: "라벤더", meaning: "Practising care for yourself" },
    { name: "Sage green", koreanName: "세이지그린", meaning: "Returning to nature and easing your body and mind" },
  ],
  colorFlowDescription: "The passion of red, the sense of responsibility in blue, and the clearing quality of white form the present psychological thread in this fictional sample. They do not define a personality; they offer one way to notice how you may respond when acting, trusting, and readjusting your state.",
  combinedCoaching: [
    "The red triangle in Card 1 suggests that you may have an inner drive to move toward goals you set for yourself. When the goal becomes clearer, that drive may become easier to recognise as well.",
    "The blue diamond in Card 2 adds a fresh angle to working through things in sequence. Comparing different options and leaving room for another possibility can also be a natural next step.",
    "The white square in Card 3 suggests that, when you need to reset, it can help to set down unnecessary burdens and reorganise the shape of your day. You might begin with one visible, manageable task and gradually regain a sense of steadiness in daily life.",
  ],
  lifeRole: {
    title: "Information Sense-Making & Judgment Profile",
    description: "You may find it easier to identify what matters within complex information and consider what could come next. Turning a considered idea into practical steps and taking time to attend to details may support how your strengths show up in work and social roles. As you explore a new direction, your accumulated experience and these strengths can offer support.",
    humanStrengths: ["Judgment that identifies the key point", "Giving complex material a clear structure", "Making choices with reasons"],
    directions: [
      {
        title: "Planning and strategy",
        description: "Building a habit of setting criteria may be helpful in work that calls for clarifying a next direction.",
        preparation: "You could begin by separating a small task into its goal, conditions, and options, and use that practice to gather reasons for a decision.",
      },
      {
        title: "Operations improvement and process design",
        description: "A tendency to turn scattered processes into understandable steps may help make the order of work feel smoother.",
        preparation: "Try observing one process that repeats and noting a more comfortable order for it on a single page.",
      },
      {
        title: "Research and analysis",
        description: "Patience in looking for the information that matters may offer a foundation for practical judgment.",
        preparation: "Choose a topic that interests you, compare material from different sources, and gradually build a habit of organising and analysing information.",
      },
    ],
    environments: ["An environment that leaves time for careful thought", "An environment where standards and roles are relatively clear", "An environment where outcomes can be checked step by step"],
    shadows: ["Wanting to understand more before acting may sometimes make it hard to begin", "You may revisit a conclusion already reached while looking for a better answer"],
    smallDirection: "For one recent responsibility, try writing down the most complicated part and how you made it clearer. Three lines are enough.",
  },
  energyFlow: {
    currentElements: ["Water", "Fire"],
    title: "A period when energy may run high",
    description: "At this time, emotional responses may feel quicker and stimulation may register more strongly. Passion and drive can feel more active, while the body may also tire easily and the mind may feel as though it is continually running. If busy thoughts or difficulty falling asleep continue, it may be helpful to treat them as a gentle signal that rest is needed.",
    recovery: "You might slow down a little and leave room to settle your breathing. A glass of cool water, a brief walk, or one quiet song can be small ways to help the body relax gradually.",
    balanceKeywords: ["Pacing yourself", "Settling the breath", "Quiet rest"],
    complementaryElements: ["Metal", "Wood"],
    complementColors: ["Lavender", "Sage green"],
  },
  recoveryRoutine: {
    tea: "White tea or chrysanthemum tea",
    food: "Light-coloured foods such as pear or radish",
    breath: "Slow abdominal breathing to help the mind settle",
    movement: "Spending a little time in the morning sunlight",
    smallPractice: "Pause smartphone use for one hour in the evening",
    message: "Sensitivity does not need to be dismissed; it can also remind you that you are noticing subtle changes.",
  },
  coachingUrl: "https://naver.me/ID3fxw2W",
};

export const EN_PILOT_DISCLAIMER = "This report uses your current selections as a starting point for self-understanding and everyday care. It is not a medical diagnosis or treatment recommendation.";
