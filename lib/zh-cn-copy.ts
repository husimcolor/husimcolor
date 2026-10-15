import { ZH_CN_STATIC_COPY } from "../shared/locales/zh-cn-static-catalog";
import { ZH_CN_INTERPRETATION_COPY } from "../shared/locales/zh-cn-interpretation-catalog";
import { ZH_CN_STATIC_GAP_COPY } from "../shared/locales/zh-cn-static-gap-catalog";
import { ZH_CN_STATIC_REVISED_COPY } from "../shared/locales/zh-cn-static-revision-catalog";
import { ZH_CN_TEMPLATE_COPY, type ZhCnTemplateCopy } from "../shared/locales/zh-cn-template-catalog";
import { ZH_CN_REVIEWED_OUTPUT_OVERRIDES } from "../shared/locales/zh-cn-reviewed-output-overrides";
import type { AppLocale } from "../shared/localization";

/**
 * 앱 고정 UI는 static catalog, 컬러·카드·관계 생성기는 interpretation catalog을 사용한다.
 * 같은 key가 있을 때 먼저 검수된 static/pilot 문안을 유지한다.
 */
const exact = new Map([
  // 생성 catalog에 혼합 언어 값이 남아 있으면 완결 template과 검수된 정적 문안을 우선한다.
  ...Object.entries(ZH_CN_INTERPRETATION_COPY).filter(([, copy]) => !/[가-힣]/.test(copy)),
  // 이전 정적 추출물에 남은 한국어 값은 번역 실패가 아니라 fallback으로 취급한다.
  ...Object.entries(ZH_CN_STATIC_COPY).filter(([, copy]) => !/[가-힣]/.test(copy)),
  ...Object.entries(ZH_CN_STATIC_GAP_COPY),
  ...Object.entries(ZH_CN_STATIC_REVISED_COPY),
]);
const fragmentEntries = [...exact.entries()]
  .filter(([source, target]) => source.length >= 2 && /[가-힣]/.test(source) && !/[가-힣]/.test(target))
  .sort(([left], [right]) => right.length - left.length);

/** 이미 검수한 파일럿 문체는 대량 locale catalog보다 우선한다. */
const reviewedOverridesBase: Readonly<Record<string, string>> = {
  "레드 · 블루 · 화이트 드러난 기본 성향을 바탕으로, 세 장의 심리카드는 무의식 · 현재흐름 · 회복방향 차례로 비춥니다.":
    "红色、蓝色与白色所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。",
  "레드 · 블루 · 화이트에서 드러난 기본 성향을 바탕으로, 세 장의 카드는 무의식 · 현재흐름 · 회복방향을 차례로 비춥니다.":
    "红色、蓝色与白色所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。",
  "솔직한 추진": "坦率表达，积极行动",
  "분위기 주도": "让气氛活跃起来",
  "따뜻한 사교성": "待人热情，容易亲近",
  "자신의 내면을 조용히 살피고 감정을 차분하게 정리하는 편입니다. 겉으로 드러내기보다 조용한 공감으로 마음을 전합니다.":
    "你注重内心感受，会平静地整理情绪。比起外露，更会通过默默的理解与体贴表达心意。",
  "주변을 차분하게 정리하고 자신만의 편안한 속도로 생활하는 것을 좋아합니다. 사람을 사귈 때도 서두르기보다 천천히 마음을 여는 편입니다.":
    "你喜欢把周围的环境整理得舒适、清爽，并以自己觉得自在的节奏生活。与人交往时，也更愿意慢慢敞开心扉，而不是急于靠近。",
  "분석하기 전에 먼저 느껴보세요.\n감정을 느끼는 것은 약함이 아니라 또 다른 지혜입니다.\n이성과 감정이 함께할 때 더 온전한 판단이 가능합니다.":
    "在分析之前，不妨先感受一下。\n感受情绪并不是软弱，而是另一种智慧。\n给自己一点时间，兼顾理性的思考和内心的感受，也许会有所帮助。",
  "틸": "蓝绿色",
  "목표가 분명할 때 마음이 놓이는 경향이 있습니다. 일상에서는 결정이 서면 바로 움직이는 편입니다.":
    "在目标清晰时，你可能更容易感到安心。日常中一旦作出决定，往往会较快行动。",
  "성실하게 임하고 깊은 신뢰를 바라는 흐름이 있으며, 일상에서는 말보다 행동으로 약속을 지키는 쪽으로 힘이 실립니다.":
    "你可能会认真对待事情，也看重深厚的信任。日常中，比起言语，更倾向于用行动履行约定。",
  "복잡한 생각을 정리하고 개운해지고 싶은 성향이 두드러집니다. 필요할 때 할 일을 정리해 깔끔하게 마무리하는 방식으로 균형을 잡습니다.":
    "你可能倾向于整理复杂的思绪，也希望让自己感觉更轻松。需要时，可以把要做的事情列下来，一件件完成，以此找回平衡。",
  "할 일이 생기면 먼저 방향을 정하고 말을 충분히 듣고 판단하는 편입니다. 정돈된 순서가 보일 때 안심합니다.":
    "面对需要处理的事情，你往往会先明确方向，充分听取对方的想法后，再作判断。有清晰的步骤时，心里会更踏实。",
  "강렬한 감정이 마음속에 쌓여 있는 시기입니다. 감정을 정화하고 균형을 되찾는 작은 실천을 한 번 만들어 보세요.":
    "当强烈的情绪在心里累积时，不妨安排一项小小的练习，帮助自己整理情绪、找回平衡。",
  "당신은 회복을 소중히 여기고, 책임감을 쉽게 놓치지 않는 편입니다. 마음 깊은 곳에서는 깊은 공감과 직관이 중요하게 느껴질 수 있습니다. 그래서 관계 안에서 안정과 균형을 만들어가는 방식을 중요하게 여길 수 있습니다.\n\n겉으로는 감정 방출과 내면 재정렬 쪽으로 상황을 풀어가려는 모습이 먼저 보일 수 있습니다. 책임감 있고 진실한 방식에 익숙한 편이라, 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.\n\n지금은 3번 회복방향 카드의 관계를 새롭게 정리하고 싶은 마음을 바탕으로, 따뜻한 연결 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. 활력을 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.":
    "从这次选择来看，你重视恢复，也不容易放下责任感。在内心深处，深度共情与直觉可能对你很重要，因此你也可能看重在关系中建立稳定与平衡的方式。\n\n在外在表现上，你可能更倾向于通过释放情绪、重新整理内心来处理事情。因为习惯认真负责、真诚地对待事情，内心真正的期待也许会在充分说出来之前安静地留在心里。\n\n此刻可以参考第3张恢复方向卡所呈现的、想重新整理关系的心意，在日常中慢慢找回温暖的连接感。守护活力的小小言行，或许能帮助缓和关系中的紧张，并成为更舒适地照顾自己内心的开始。",
  "당신은 회복을 소중히 여기고, 책임감을 쉽게 놓치지 않는 편입니다. 마음 깊은 곳에서는 안정과 조화가 중요하게 느껴질 수 있습니다. 그래서 관계 안에서 안정과 균형을 만들어가는 방식을 중요하게 여길 수 있습니다.\n\n겉으로는 신뢰와 체계 에너지 쪽으로 상황을 풀어가려는 모습이 먼저 보일 수 있습니다. 책임감 있고 진실한 방식에 익숙한 편이라, 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.\n\n지금은 3번 회복방향 카드의 깊이 있는 관계와 내면 성찰을 바탕으로, 자기 돌봄 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. 섬세한 감수성을 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.":
    "从这次选择来看，你重视恢复，也不容易放下责任感。在内心深处，稳定与和谐可能对你很重要，因此你也可能看重在关系中建立稳定与平衡的方式。\n\n在外在表现上，你可能更倾向于通过信任与秩序感来处理事情。因为习惯认真负责、真诚地对待事情，内心真正的期待也许会在充分说出来之前安静地留在心里。\n\n此刻可以参考第3张恢复方向卡所呈现的深度关系与内在反思，在日常中慢慢找回照顾自己的感觉。守护细腻感受的小小言行，或许能帮助缓和关系中的紧张，并成为更舒适地照顾自己内心的开始。",
  "당신은 현실감각을 소중히 여기고, 공감을 쉽게 놓치지 않는 편입니다. 마음 깊은 곳에서는 현실 감각과 균형 잡힌 판단이 중요하게 느껴질 수 있습니다. 그래서 현실적이고 균형 있게 소통하는 관계를 중요하게 여길 수 있습니다.\n\n겉으로는 유연한 내면 감수성 쪽으로 상황을 풀어가려는 모습이 먼저 보일 수 있습니다. 감정을 먼저 이해받고 싶어하는 방식에 익숙한 편이라, 정작 내면의 바람은 충분히 말하기 전까지 조용히 남아 있을 수 있습니다.\n\n지금은 3번 회복방향 카드의 다양한 관계를 이어주는 성향을 바탕으로, 자기 돌봄 감각을 일상에서 조금씩 되찾아 보는 시간이 필요할 수 있습니다. 정서적 공감을 지키는 작은 말과 행동이 관계의 긴장을 낮추고, 자기 마음을 더 편안히 돌보는 시작이 될 수 있습니다.":
    "从这次选择来看，你重视现实感，也不容易忽略共情。在内心深处，务实的判断与平衡感可能对你很重要，因此你也可能看重以现实且平衡的方式沟通的关系。\n\n在外在表现上，你可能更倾向于带着灵活而细腻的感受来处理事情。因为你往往希望自己的感受先被理解，内心真正的期待也许会在充分说出来之前安静地留在心里。\n\n此刻可以参考第3张恢复方向卡所呈现的、连接多种关系的倾向，在日常中慢慢找回照顾自己的感觉。守护情感共鸣的小小言行，或许能帮助缓和关系中的紧张，并成为更舒适地照顾自己内心的开始。",
  "엄마의 컬러와 심리카드 흐름에서는 변화를 편안하게 돕는 관계 동행가형의 에너지가 보입니다. 세심한 변화 관찰과 부담을 낮추는 안내 같은 강점이 자연스럽게 드러날 수 있습니다. 사회와 일, 가족 안에서 필요한 방향을 살피고 사람을 돕는 모습으로도 이어질 수 있습니다.":
    "从妈妈的颜色与心理卡所呈现的变化中，可以看出她倾向于以温和的方式陪伴关系中的变化。细致观察变化、用不造成负担的方式给予引导等优势，可能会自然展现，也可能延伸为在社会、工作和家庭中关注所需方向、帮助他人的方式。",
  "딸의 컬러와 심리카드 흐름에서는 함께 움직일 길을 만드는 현장 조정가형의 에너지가 보입니다. 상황에 맞는 연결과 서로 다른 의견 조율 같은 강점이 자연스럽게 드러날 수 있습니다. 관계와 사회 안에서 자신만의 가능성을 차분히 넓혀 가는 바탕이 될 수 있습니다.":
    "从女儿的颜色与心理卡所呈现的变化中，可以看出她倾向于为共同前行寻找合适的路径。根据情境建立连接、协调不同想法等优势可能会自然展现，并可能成为她在关系与社会中稳步拓展自身可能性的基础。",
  "회복 방향 카드에서 남편은 삶의 의미를 작은 성찰과 실천에 연결하려는 흐름을 보이고, 아내는 불필요한 긴장을 덜고 진실한 연결의 기준을 가볍게 정돈하려는 흐름을 보입니다. 틸 쪽에서는 이성적으로 괜찮다고 넘기기 전에 마음의 피로를 가볍게 꺼내보세요. 오렌지 쪽에서는 분위기를 살피느라 자신의 피로를 뒤로 미루지 않는 균형이 필요합니다. 공동 공간과 일상의 리듬을 다시 맞출 때 다시 이야기할 시점을 함께 정해두면 각자의 회복 방식이 관계를 지키는 힘이 됩니다.":
    "在恢复方向卡中，丈夫呈现出把对生活意义的思考连接到小小反思与实践中的倾向；妻子则呈现出减少不必要紧张、轻松整理真诚连接所需标准的倾向。就蓝绿色而言，在理性地说“没关系”之前，不妨先轻声说出内心的疲惫。就橙色而言，在顾及氛围的同时，也需要不把自己的疲惫放在最后。重新协调共同空间与日常节奏时，可以一起约定再次交谈的时间，让各自的恢复方式成为支持这段关系的力量。",
  "무의식의 바탕에서 남편은 여러 새 시작을 하나의 방향으로 묶고 싶은 마음을, 아내는 깊은 공감과 직관을 신뢰하며 의미를 살피는 마음을 가질 수 있습니다.\n\n현재 대화에서는 남편은 상황을 정리해 균형을 찾으려는 편이고, 아내는 쌓인 감정을 안전하게 꺼내며 내면을 정리하려는 편입니다.\n\n갈등이나 피로 뒤에는 남편은 삶의 의미를 작은 성찰과 실천에 연결하려는 쪽으로, 아내는 불필요한 긴장을 덜고 진실한 연결의 기준을 가볍게 정돈하려는 쪽으로 회복을 선택해볼 수 있습니다.":
    "在潜意识的底色中，丈夫可能想把多个新的开始汇成一个方向；妻子可能重视深度共情与直觉，也愿意探索其中的意义。\n\n在当前对话中，丈夫可能更倾向于整理情境来找回平衡；妻子可能更倾向于在安全的前提下说出积累的情绪、整理内心。\n\n在冲突或疲惫之后，丈夫可以尝试把对生活意义的思考连接到小小的反思与实践中；妻子则可以尝试减少不必要的紧张，轻松整理真诚连接所需的标准。",
};

/**
 * 상품별 실제 output을 한국어 원문과 대조해 완결 문장으로 교정한 사전이다.
 * 조합형 catalog 또는 짧은 fragment 변환보다 앞서 적용해, 역할·호칭·주체가
 * 한국어식 조립 문장으로 남지 않도록 한다.
 */
const reviewedOverrides: Readonly<Record<string, string>> = {
  ...reviewedOverridesBase,
  ...ZH_CN_REVIEWED_OUTPUT_OVERRIDES,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CompiledTemplate = Readonly<{
  expression: RegExp;
  target: string;
  chunks: readonly string[];
}>;

const shortTemplateCopy: readonly ZhCnTemplateCopy[] = [
  { chunks: ["", "% 할인"], target: "优惠 {{v0}}%" },
  { chunks: ["정가 ", "원 → 할인 ", "원 → 결제 예정 ", "원"], target: "原价 {{v0}}韩元 → 优惠 {{v1}}韩元 → 应付 {{v2}}韩元" },
  { chunks: ["정가 ", "원"], target: "原价 {{v0}}韩元" },
  { chunks: ["", "원 할인"], target: "立减 {{v0}}韩元" },
  { chunks: ["", "원"], target: "{{v0}}韩元" },
  { chunks: ["", " 결제하기"], target: "支付 {{v0}}" },
  { chunks: ["", " 컬러"], target: "{{v0}} 色" },
  { chunks: ["여기에 ", " "], target: "在这里 {{v0}}" },
  { chunks: ["", ". ", " 뒤, ", "."], target: "{{v0}}。{{v1}}之后，{{v2}}。" },
  { chunks: ["", " 방식에"], target: "在{{v0}}的方式中" },
  { chunks: ["", " 방식을"], target: "{{v0}}的方式" },
  { chunks: ["", " 관계를"], target: "{{v0}}的关系" },
  { chunks: ["", " ", "의 ", ""], target: "{{v0}} {{v1}}的{{v2}}" },
  { chunks: ["", "년 ", "월 ", "일"], target: "{{v0}}年{{v1}}月{{v2}}日" },
  { chunks: ["", "에게는 ", ""], target: "对{{v0}}而言，{{v1}}" },
  { chunks: ["", "의 ", ""], target: "{{v0}}的{{v1}}" },
  { chunks: ["", " ", " 카드"], target: "{{v0}} {{v1}}心理卡" },
  { chunks: ["“", "아, ", "”"], target: "“{{v0}}，{{v1}}”" },
  { chunks: ["", " 조율자"], target: "{{v0}}协调者" },
  { chunks: ["", " 탐색자"], target: "{{v0}}探索者" },
  { chunks: ["", "세"], target: "{{v0}}岁" },
  { chunks: ["", "번 카드"], target: "第{{v0}}张心理卡" },
  { chunks: ["", "번 카드 선택 →"], target: "选择第{{v0}}张心理卡 →" },
  { chunks: ["", "시간 ", "분"], target: "{{v0}}小时{{v1}}分钟" },
  { chunks: ["", "분"], target: "{{v0}}分钟" },
  { chunks: ["", " · 계속"], target: "{{v0}} · 续" },
  { chunks: ["", "의 의도"], target: "{{v0}}的意图" },
  { chunks: ["닉네임 ", ""], target: "昵称 {{v0}}" },
  { chunks: ["전체 ", "쪽 · 가상 데이터"], target: "共 {{v0}} 页 · 虚拟数据" },
];

/**
 * 원문 template literal을 그대로 보존한 locale pack이다. 결과 생성 후에는
 * 변수 값이 이미 결합되므로, 문장 전체를 캡처해 중국어 어순으로 재조립한다.
 */
const compileTemplates = (templates: readonly ZhCnTemplateCopy[]): readonly CompiledTemplate[] => templates.map((template: ZhCnTemplateCopy) => ({
  // 한 template이 다음 문장까지 포획하면 앞뒤 해석이 섞인다. 변수는 문장·줄 경계를 넘지 않게 제한한다.
  expression: new RegExp(`^${template.chunks.map((chunk, index) => `${index === 0 ? "" : "([^\\n.!?]*?)"}${escapeRegExp(chunk)}`).join("")}$`),
  target: template.target,
  chunks: template.chunks,
}));
// 더 긴 완결 문장이 짧은 조각 template보다 먼저 매칭되어야 한국어식 조립을 막을 수 있다.
const compiledTemplates = compileTemplates([...ZH_CN_TEMPLATE_COPY].sort((left, right) => {
  const leftLength = left.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const rightLength = right.chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  return rightLength - leftLength;
}));
const compiledShortTemplates = compileTemplates(shortTemplateCopy);

function localizeTemplateCopy(value: string): string | null {
  // 조사·단위처럼 빈 chunk를 포함한 짧은 template은 긴 문단까지 매칭할 수 있다.
  // 완결 문장 template을 먼저 사용하고, 짧은 값에만 단위 template을 제한한다.
  const templates = value.includes("\n") || value.length > 96
    ? compiledTemplates
    : [...compiledTemplates, ...compiledShortTemplates];
  for (const template of templates) {
    const match = template.expression.exec(value);
    if (!match) continue;
    // "{{v0}} {{v1}} 편입니다" 류의 일반 template은 첫 한 글자만 v0로 떼어
    // 뒤의 긴 한국어 문장을 v1로 포획할 수 있다. 이 경우 조각 catalog fallback을 사용한다.
    if (template.chunks[0] === "" && template.chunks[1] === " "
      && (match[1] ?? "").trim().length < 3
      && match.slice(2).some((captured) => (captured ?? "").length > 20)) continue;
    return template.target.replace(/\{\{v(\d+)\}\}/g, (_placeholder, index: string) => {
      const source = match[Number(index) + 1] ?? "";
      return localizeTemplateVariable(source);
    });
  }
  return null;
}

const inlineTerms: ReadonlyArray<readonly [RegExp, string]> = [
  [/현재흐름에서 과해지기 쉬운 결을 누그러뜨리고, 회복방향을 돕는 컬러입니다\./g, "用于缓和当前状态中容易过度用力的部分，并支持恢复方向的颜色。"],
  [/현재 흐름에서 과해지기 쉬운 결을 누그러뜨리고, 회복 방향을 돕는 컬러입니다\./g, "用于缓和当前状态中容易过度用力的部分，并支持恢复方向的颜色。"],
  [/当前状态에서 과해지기 쉬운 결을 누그러뜨리고, 恢复方向을 돕는 颜色입니다\./g, "用于缓和当前状态中容易过度用力的部分，并支持恢复方向的颜色。"],
  [/지금의 마음 흐름과 나에게 맞는 회복의 방향을 더 깊이 나누고 싶다면, 1:1 컬러코칭으로 이어갈 수 있습니다\./g, "如果想更深入地聊聊当下的内心变化和适合自己的恢复方向，可以继续进行 1:1 色彩心理辅导。"],
  [/딸, 힘들었겠구나\. 지금은 네 마음을 먼저 듣고 싶어\./g, "女儿，听起来你很累。我想先听听你心里的感受。"],
  [/딸, 네가 느낀 분위기나 다른 사람의 마음도 들려줄래\?/g, "女儿，你愿意说说你感受到的氛围或他人的心情吗？"],
  [/결과와 별개로 네가 해 본 과정과 노력은 내가 보고 있어\./g, "无论结果如何，我都看见了你尝试的过程和付出的努力。"],
  [/네가 스스로 해 보고 싶은 방법이 있다면, 내가 옆에서 도울게\./g, "如果你有想亲自尝试的方法，我会在你身边支持你。"],
  [/딸, 내가 더 힘든데 왜 그것도 못 참니\?/g, "女儿，我都更辛苦了，你怎么连这点事也忍不了呢？"],
  [/딸, 모두가 편하려면 네 마음은 좀 참아야지\./g, "女儿，为了让大家都舒服一点，你得先忍一忍自己的感受。"],
  [/내가 너를 위해 이렇게 하는데 왜 몰라\?/g, "我都是为了你才这样做，你怎么不明白呢？"],
  [/다른 아이들은 다 하는데 너는 왜 못 하니\?/g, "别的孩子都能做到，你为什么不行呢？"],
  [/공개 예시 리포트 · 가상 데이터로 생성됨 · 실제 고객 개인정보 미사용/g, "公开报告示例 · 使用虚拟数据生成 · 不含真实客户个人信息"],
  [/개인 심화분석/g, "个人深化分析"],
  [/가상 인물/g, "虚拟人物"],
  [/리포트 생성일/g, "报告生成日期"],
  [/선택한 세 컬러의 상세 해석/g, "所选三种颜色的详细解读"],
  [/세 컬러 통합 해석/g, "三种颜色的综合解读"],
  [/나를 이루는 세 가지 흐름/g, "构成我的三种心理流向"],
  [/세 컬러가 함께 나타날 때/g, "当三种颜色同时出现时"],
  [/심리 성향/g, "心理倾向"],
  [/성격 경향/g, "性格倾向"],
  [/관계 성향/g, "关系倾向"],
  [/주요 장점/g, "主要优势"],
  [/성장 가능성/g, "需要留意的倾向"],
  [/강점/g, "优势"],
  [/마음이 지칠 때/g, "感到疲惫时"],
  [/카드 흐름/g, "心理卡所呈现的变化"],
  [/ · 계속/g, " · 续"],
  [/추천 컬러/g, "推荐颜色"],
  [/이 역할이 더하는 가치/g, "这一角色带来的价值"],
  [/사회적 쓰임새 · 진로 방향/g, "社会角色 · 职业方向"],
  [/준비 방향/g, "准备方向"],
  [/잘 맞는 일의 환경/g, "适合的工作环境"],
  [/역할 에너지의 그림자/g, "需要留意的一面"],
  [/지금의 작은 방향/g, "当下可以尝试的小方向"],
  [/에너지 관점 · 현재 주요 흐름/g, "能量视角 · 当前主要流向"],
  [/지금 필요한 것/g, "此刻需要的事"],
  [/보완 에너지/g, "调和能量"],
  [/추천 차/g, "推荐茶饮"],
  [/추천 음식/g, "推荐食物"],
  [/추천 호흡/g, "推荐呼吸练习"],
  [/추천 움직임/g, "推荐活动"],
  [/오늘의 작은 실천/g, "今天的小练习"],
  [/오늘의 회복 메시지/g, "今天给自己的话"],
  [/드러난 기본 성향을 바탕으로, 세 장의 카드는 潜意识 · 当前状态 · 恢复方向 차례로 비춥니다\./g, "所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。"],
  [/([\u3400-\u9fff]+)의 ([\u3400-\u9fff]+) · ([\u3400-\u9fff]+)의 ([\u3400-\u9fff]+) · ([\u3400-\u9fff]+)의 ([\u3400-\u9fff]+)가 虚拟人物 성향 흐름을 이루고 있습니다\./g, "$1的$2 · $3的$4 · $5的$6，共同构成虚拟人物的心理特点。"],
  [/이성적으로 괜찮다고 넘기기 전에 마음의 피로를 가볍게 꺼내보세요\./g, "在理性地说“没关系”之前，不妨先轻声说出内心的疲惫。"],
  [/분위기를 살피느라 자신의 피로를 뒤로 미루지 않는 균형이 필요합니다\./g, "留意氛围时，也别把自己的疲惫放在最后，给自己留一点平衡的空间。"],
  [/공동 공간과 일상의 리듬을 다시 맞출 때 다시 이야기할 시점을 함께 정해두면 각자의 회복 방식이 관계를 지키는 힘이 됩니다\./g, "重新协调共同空间与日常节奏时，可以一起约定再次交谈的时间，让各自的调整方式成为支持关系的力量。"],
  [/감정을 정화하고 균형을 되찾는/g, "整理情绪，重新找回平衡"],
  [/관계 속에서 생기를 되찾는/g, "在关系中重新找回活力"],
  [/자신을 위한 조용하고 따뜻한 시간을 갖는/g, "给自己留出安静而温暖的时间"],
  [/자신을 먼저 돌봐주는/g, "先照顾好自己"],
  [/강점이 자연스럽게 드러날 수 있습니다\./g, "这些优势可能会自然地展现出来。"],
  [/에너지가 보입니다\./g, "的能量较为明显。"],
  [/성장 지원형/g, "成长支持型"],
  [/심리卡片/g, "心理卡"],
  [/심리/g, "心理"],
  [/기본/g, "基本"],
  [/바탕/g, "基础"],
  [/세 장의/g, "三张"],
  [/차례로 비춥니다\./g, "依次呈现。"],
  [/다시 이야기할 시점을\s*一起 정해두면/g, "一起约定再次交谈的时间，"],
  [/关系 지키는 힘이 됩니다\./g, "会成为支持关系的力量。"],
  [/情感 净化 平衡 되찾는/g, "整理情绪，重新找回平衡"],
  [/성향 흐름/g, "心理倾向变化"],
  [/심리카드/g, "心理卡"],
  [/쪽에서는/g, "方面，"],
  [/다시 이야기할 시점을 함께 정해두면/g, "一起约定再次交谈的时间，"],
  [/각자의/g, "各自的"],
  [/관계를 지키는 힘이 됩니다\./g, "会成为支持关系的力量。"],
  [/보입니다\./g, "较为明显。"],
  [/자연스럽게 드러날 수 있습니다\./g, "可能会自然地展现出来。"],
  [/같은/g, "这样的"],
  [/다만 /g, "不过，"],
  [/두드러집니다\./g, "较为突出。"],
  [/지금의 마음 흐름과 나에게 맞는 회복의 방향을 더 깊이 나누고 싶다면, 1:1 /g, "如果想更深入地聊聊当下的内心变化和适合自己的恢复方向，可以继续进行 1:1 "],
  [/본 리포트는 현재 선택 결과를 바탕으로 한 자기이해·생활 웰니스 참고 자료이며, 의료적 진단이나 치료를 대신하지 않습니다\./g, "本报告基于当前选择结果，供自我理解与日常身心调节参考，不构成医疗诊断或治疗。"],
  [/컬러코칭/g, "色彩心理辅导"],
  [/더 깊은 나눔이 필요할 때/g, "需要更深入地聊一聊时"],
  [/추천 보완컬러/g, "推荐调和色"],
  [/주기질/g, "主要心理特征"],
  [/보조기질/g, "辅助心理特征"],
  [/회복방향/g, "恢复方向"],
  [/회복 방향/g, "恢复方向"],
  [/현재흐름/g, "当前状态"],
  [/현재 흐름/g, "当前状态"],
  [/무의식/g, "潜意识"],
  [/휴심컬러/g, "HUSIM COLOR"],
  [/남편/g, "丈夫"],
  [/아내/g, "妻子"],
  [/엄마/g, "妈妈"],
  [/아빠/g, "爸爸"],
  [/딸/g, "女儿"],
  [/아들/g, "儿子"],
  [/퍼플/g, "紫色"],
  [/마젠타/g, "品红"],
  [/그린/g, "绿色"],
  [/블루/g, "蓝色"],
  [/화이트/g, "白色"],
  [/틸/g, "蓝绿色"],
  [/오렌지/g, "橙色"],
  [/라벤더/g, "薰衣草色"],
  [/핑크/g, "粉色"],
  [/레드/g, "红色"],
  [/옐로우/g, "黄色"],
  [/코랄/g, "珊瑚色"],
  [/피치/g, "蜜桃色"],
  [/올리브/g, "橄榄绿"],
  [/블랙/g, "黑色"],
  [/네모/g, "方形"],
  [/마름모/g, "菱形"],
  [/동그라미/g, "圆形"],
  [/역삼각형/g, "倒三角形"],
  [/삼각형/g, "三角形"],
  [/오각형/g, "五边形"],
  [/육각형/g, "六边形"],
  [/컬러/g, "颜色"],
];

/** 한국어 조사가 붙은 역할·색상 값도 template 안에서는 중국어 명사로만 삽입한다. */
function localizeTemplateVariable(source: string): string {
  // 긴 template의 변수에는 구두점 뒤 공백이 함께 포획될 수 있다. 그대로 두면
  // 검수된 완결 문안의 exact key를 놓치고 fragment 치환으로 되돌아간다.
  const normalizedSource = source.trim();
  const baseSource = stripKoreanVariableParticle(normalizedSource);
  const relationBase = baseSource.replace(/ 관계$/u, "");
  const methodBase = baseSource.replace(/ 방식$/u, "");
  // `회복을 지키는`처럼 명사구에 홀로 삽입되는 경우에는 중국어에서 소유 대상을
  // 밝혀야 자연스럽다. 문장 전체의 회복 역할명과 혼동하지 않는다.
  if (baseSource === "회복") return "自己的恢复";
  const exactValue = reviewedOverrides[normalizedSource]
    ?? exact.get(normalizedSource)
    ?? reviewedOverrides[baseSource]
    ?? exact.get(baseSource)
    ?? (relationBase !== baseSource ? (reviewedOverrides[relationBase] ?? exact.get(relationBase)) : undefined)
    ?? (methodBase !== baseSource ? (reviewedOverrides[methodBase] ?? exact.get(methodBase)) : undefined);
  let localized = exactValue ?? normalizedSource;
  // 한국어 변수의 ‘관계/방식’은 완결 중국어 변수로 다시 조립한다.
  // 원문 catalog 값이 이미 ‘的’로 끝나면 그대로 접미사를 더할 경우 ‘的的’가 된다.
  if (exactValue && relationBase !== baseSource && !/关系$/u.test(localized)) localized = `${localized.replace(/的$/u, "")}的关系`;
  if (exactValue && methodBase !== baseSource && !/方式$/u.test(localized)) localized = `${localized.replace(/的$/u, "")}的方式`;
  for (const [from, to] of inlineTerms) localized = localized.replace(from, to);
  return stripKoreanParticlesAfterChinese(localized);
}

function stripKoreanVariableParticle(value: string): string {
  return value.replace(/(에게는|에게도|으로|부터|까지|처럼|보다|에게|에서|은|는|이|가|을|를|의|와|과|로|도|만|하고|이며|이고)$/u, "");
}

function stripKoreanParticlesAfterChinese(value: string): string {
  return value.replace(/([\u3400-\u9fff]+)(에게는|에게도|으로|부터|까지|처럼|보다|에게|에서|은|는|이|가|을|를|의|와|과|로|도|만|한테|하고|이며|이고)/g, "$1");
}

function localizeDelimitedTerms(value: string): string | null {
  if (!value.includes("·")) return null;
  let changed = false;
  const localized = value.split(/(\s*·\s*)/).map((part) => {
    if (/^\s*·\s*$/.test(part)) return part;
    const replacement = reviewedOverrides[part] ?? exact.get(part);
    if (replacement) changed = true;
    return replacement ?? part;
  }).join("");
  return changed ? localized : null;
}

/** 카드 제목에 붙는 한국어 조사를 제외하고, 이미 검수한 용어 catalog의 값만 사용한다. */
function localizeRelationshipTerm(source: string): string {
  const trimmed = source.trim();
  // `대화에서`, `관계에`처럼 조사가 포함된 완결 key를 먼저 찾아야
  // 관계 장면이 한국어 조각으로 되돌아가지 않는다.
  const direct = reviewedOverrides[trimmed] ?? exact.get(trimmed);
  if (direct) return direct;
  const base = stripKoreanVariableParticle(trimmed);
  return reviewedOverrides[base] ?? exact.get(base) ?? base;
}

/**
 * 관계 문장 안의 설명형 구는 끝 글자가 조사처럼 보일 수 있다(예: `지키려는`).
 * 이때 조사 제거를 먼저 적용하면 검수된 완결 번역 키를 잃으므로, 원문 전체를 우선 찾는다.
 */
function localizeRelationshipPhrase(source: string): string {
  const trimmed = source.trim();
  return reviewedOverrides[trimmed] ?? exact.get(trimmed) ?? localizeRelationshipTerm(trimmed);
}

/** 관계 요약의 `A, B`형 색상 근거는 완결 키가 없을 때도 항목별로 번역한다. */
function localizeRelationshipComposite(source: string): string {
  const full = localizeRelationshipPhrase(source);
  if (full !== source.trim()) return full;
  return source.split(/,\s*/u).map((part) => localizeRelationshipPhrase(part)).join("、");
}

/** `인디고 A, 그린 B`처럼 색과 특성이 함께 조립된 관계 요약에서 특성만 완결화한다. */
function localizeColorEvidence(source: string): string {
  return source.split(/,\s*/u).map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(레드|오렌지|옐로우|그린|블루|인디고|퍼플|핑크|마젠타|라벤더|화이트|블랙|틸|코랄|피치|올리브)(?:의)?\s*(.+)$/u);
    if (!match) return localizeRelationshipPhrase(trimmed);
    const trait = localizeRelationshipPhrase(match[2]!).replace(/[。.!]+$/u, "");
    return trait;
  }).join("、");
}

/**
 * 부모·자녀 관계 요약의 `~하려는 마음`은 한국어에서 주체 뒤에 바로 붙지만,
 * 중국어에서는 번역된 구의 동사 성격에 맞춰 문장을 완결해야 한다.
 * 이 과정을 생략하면 `希望保持重视…`처럼 동사가 겹치거나 조각 번역이 남는다.
 */
function renderRelationshipIntent(label: string, koreanFocus: string): string {
  const focus = localizeRelationshipPhrase(koreanFocus);
  if (/^(重视|珍视|看重)/u.test(focus)) return `${label}${focus}`;
  if (/^(充分|细致|深入)/u.test(focus)) return `${label}更倾向于${focus}`;
  if (/^(自己的|自我|个人)/u.test(focus)) return `${label}希望守住${focus}`;
  if (/^(开始|尝试|付诸)/u.test(focus)) return `${label}更想${focus}`;
  if (/^(连接|表达|照顾|建立)/u.test(focus)) return `${label}更想${focus}`;
  return `${label}更倾向于${focus}`;
}

/**
 * 관계 분석기는 카드 제목과 조사를 먼저 결합한 뒤 문장을 만든다.
 * 그 상태에서 조각 catalog를 적용하면 한국어 어순이 남기 쉬우므로, 역할·카드 단계별
 * 전체 문장을 먼저 중국어 어순으로 다시 만든다.
 */
function localizeRelationshipSentence(value: string): string | null {
  let match = value.match(/^(.+?)의 컬러와 심리카드 흐름에서는 (.+?)의 에너지가 보입니다\. (.+?) 같은 강점이 자연스럽게 드러날 수 있습니다\. 사회와 일, 가족 안에서 필요한 방향을 살피고 사람을 돕는 모습으로도 이어질 수 있습니다\.$/u);
  if (match) {
    const label = localizeRelationshipTerm(match[1]!);
    const role = localizeRelationshipTerm(match[2]!);
    const strengths = localizeRelationshipTerm(match[3]!);
    return `从${label}的色彩与心理卡所呈现的特点来看，${label}可能倾向于发挥${role}这一类作用。${strengths}等优势可能会自然展现，也可能在社会、工作或家庭中，体现为留意所需方向、支持他人的方式。`;
  }
  match = value.match(/^(.+?)의 컬러와 심리카드 흐름에서는 (.+?)의 에너지가 보입니다\. (.+?) 같은 강점이 자연스럽게 드러날 수 있습니다\. 관계와 사회 안에서 자신만의 가능성을 차분히 넓혀 가는 바탕이 될 수 있습니다\.$/u);
  if (match) {
    const label = localizeRelationshipTerm(match[1]!);
    const role = localizeRelationshipTerm(match[2]!);
    const strengths = localizeRelationshipTerm(match[3]!);
    return `从${label}的色彩与心理卡所呈现的特点来看，${label}可能倾向于以${role}的方式理解和处理事情。${strengths}等优势可能会自然展现，也可能成为在关系与社会中稳步拓展自身可能性的基础。`;
  }
  match = /^(.+?)가 (.+?) 마음과 (.+?)이 (.+?) 마음이 만나 서로의 강점을 조율해 갈 수 있습니다\.$/u.exec(value);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const child = localizeRelationshipTerm(match[3]!);
    const parentIntent = renderRelationshipIntent(parent, match[2]!);
    const childIntent = renderRelationshipIntent(child, match[4]!);
    return `${parentIntent}；${childIntent}。两种心意相遇后，双方可以在关系中慢慢发挥各自的长处。`;
  }
  // 순위 색상은 `인디고·그린은`처럼 색상 목록 직후의 조사로 끊어야 한다.
  // 느슨한 `(.+?)는` 패턴은 `지키는`의 `는`에서 멈춰 조립 문장을 깨뜨린다.
  match = /^(.+?)의 1·2순위 ([가-힣·]+)(?:은|는) (.+?) 관계의 중심에 둡니다\. (.+?)의 1·2순위 ([가-힣·]+)(?:은|는) (.+?) 더합니다\. 그래서 두 사람은 (.+?)처럼 서로 다른 지점이 생길 수 있지만, 그 차이를 확인하는 방식 자체가 관계의 신뢰를 키우는 자원이 될 수 있습니다\.$/u.exec(value);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const parentColors = localizeRelationshipComposite(match[2]!);
    const parentStrength = localizeColorEvidence(match[3]!);
    const child = localizeRelationshipTerm(match[4]!);
    const childColors = localizeRelationshipComposite(match[5]!);
    const childStrength = localizeColorEvidence(match[6]!);
    const tension = localizeRelationshipTerm(match[7]!);
    return `${parent}的第1、2顺位选择为${parentColors}。从这些颜色所呈现的特点来看，${parent}可能更看重${parentStrength}。${child}的第1、2顺位选择为${childColors}；${child}可能更看重${childStrength}。两人对${tension}可能有不同偏好；不过，把这些差异说清楚并一起确认，本身就可能成为累积信任的资源。`;
  }
  match = /^(.+?)와 (.+?)이 어떤 선택을 앞두고 각자 중요하게 보는 기준을 하나씩 말해 보면, 생각을 충분히 살피는 강점이 관계의 신뢰로 이어질 수 있습니다\. 답을 빨리 맞추기보다 이유를 비교하는 과정이 두 사람의 공통 자원이 됩니다\.$/u.exec(value);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const child = localizeRelationshipTerm(match[2]!);
    return `面对一个选择时，${parent}和${child}如果能分别说出自己最看重的一项标准，仔细思考的优势就可能转化为关系中的信任。与其急着得出答案，不如把比较理由的过程当作两人共有的资源。`;
  }
  match = value.match(/^(.+?)에게는 서로의 말이 바로 이어지지 않거나 분위기가 어색해지는 순간, 대화를 다시 잇고 싶은 마음이 앞설 수 있습니다\.$/u);
  if (match) {
    const label = localizeRelationshipTerm(match[1]!);
    return `当彼此的话没有顺畅接上，或气氛变得尴尬时，${label}可能会更想把对话重新接起来。`;
  }
  match = value.match(/^(.+?)의 말과 행동은 관계가 멀어지지 않도록 대화를 다시 연결하고 싶은 마음에서 출발할 수 있습니다\.$/u);
  if (match) {
    const label = localizeRelationshipTerm(match[1]!);
    return `${label}的言行，可能出于不希望关系疏远、想重新接上对话的心意。`;
  }
  match = value.match(/^(.+?)(?:은|는) (.+?)에서 드러난 (.+?)으로 마음을 표현하려 하고, (.+?)(?:은|는) (.+?)에서 드러난 (.+?)으로 연결을 확인하려 할 수 있습니다(?:\. (.+?) 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다)?\.$/u);
  if (match) {
    const personA = localizeRelationshipTerm(match[1]!);
    const colorA = localizeRelationshipTerm(match[2]!);
    const strengthA = localizeRelationshipPhrase(match[3]!).replace(/[。.!]+$/u, "");
    const personB = localizeRelationshipTerm(match[4]!);
    const colorB = localizeRelationshipTerm(match[5]!);
    const strengthB = localizeRelationshipPhrase(match[6]!).replace(/[。.!]+$/u, "");
    const scene = match[7] ? localizeRelationshipTerm(match[7]!) : undefined;
    const response = scene ? `${scene}，如果能用一句话告诉对方自己需要怎样的回应，彼此猜测的空间可能会减少。` : "";
    return `${personA}可能会参考${colorA}所呈现的${strengthA}来表达心意；${personB}则可能会参考${colorB}所呈现的${strengthB}来确认彼此的连接。${response}`;
  }
  match = value.match(/^(.+?)(?:은|는) (.+?)에서 드러난 (.+?)(?:을|를) 바탕으로, (.+?)(?:은|는) (.+?)에서 드러난 (.+?)(?:을|를) 바탕으로 말할 수 있습니다(?:\. (.+?) 바로 답하고 싶은지, 생각을 정리한 뒤 말하고 싶은지를 구분해두면 서로의 속도가 존중됩니다)?\.$/u);
  if (match) {
    const personA = localizeRelationshipTerm(match[1]!);
    const colorA = localizeRelationshipTerm(match[2]!);
    const strengthA = localizeRelationshipPhrase(match[3]!).replace(/[。.!]+$/u, "");
    const personB = localizeRelationshipTerm(match[4]!);
    const colorB = localizeRelationshipTerm(match[5]!);
    const strengthB = localizeRelationshipPhrase(match[6]!).replace(/[。.!]+$/u, "");
    const scene = match[7] ? localizeRelationshipTerm(match[7]!) : undefined;
    const pace = scene ? `${scene}，先区分是想立刻回应，还是想整理好想法后再说，有助于尊重彼此不同的表达节奏。` : "";
    return `${personA}可能会以${colorA}所呈现的${strengthA}为参考来表达；${personB}则可能会以${colorB}所呈现的${strengthB}为参考来表达。${pace}`;
  }
  match = value.match(/^(.+?) 다시 이야기할 시점을 함께 정해두면 각자의 회복 방식이 관계를 지키는 힘이 됩니다\.$/u);
  if (match) {
    const scene = localizeRelationshipTerm(match[1]!);
    return `${scene}，可以一起约定再次交谈的时间，让各自的恢复方式成为支持这段关系的力量。`;
  }
  match = value.match(/^(.+?) 쪽에서는 (.+)$/u);
  if (match) {
    const color = localizeRelationshipTerm(match[1]!);
    const guidance = localizeRelationshipPhrase(match[2]!).replace(/[。.!]+$/u, "");
    return `从${color}所呈现的方向来看，${guidance}。`;
  }
  match = value.match(/^(.+?) 필요한 반응을 한 문장으로 알려주면 짐작이 줄어듭니다\.$/u);
  if (match) {
    const scene = localizeRelationshipTerm(match[1]!);
    return `${scene}，如果能用一句话告诉对方自己需要怎样的回应，彼此猜测的空间可能会减少。`;
  }
  match = value.match(/^(.+?) 바로 답하고 싶은지, 생각을 정리한 뒤 말하고 싶은지를 구분해두면 서로의 속도가 존중됩니다\.$/u);
  if (match) {
    const scene = localizeRelationshipTerm(match[1]!);
    return `${scene}，先区分是想立刻回应，还是想整理好想法后再说，有助于尊重彼此不同的表达节奏。`;
  }
  match = value.match(/^(.+?)가 (.+?) 역할로 마음을 전할 때, (.+?)은 그 마음을 방향과 관심으로 받아들일 수 있습니다\. 다만 (.+?)의 (.+?) 역할 에너지가 충분히 표현되지 못하면, 같은 마음도 압박이나 통제로 느껴질 수 있습니다\. (.+?)의 조용함이나 빠른 반응을 단정하기보다 무엇이 부담스러운지 먼저 묻고, 한 번에 하나의 약속을 함께 정해 보세요\. (.+?) 흐름에서는 이런 작은 대화의 순서가 서로를 더 편안하게 만듭니다\.$/u);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const parentRole = localizeRelationshipPhrase(`${match[2]!} 역할`);
    const child = localizeRelationshipTerm(match[3]!);
    const pattern = localizeRelationshipTerm(match[7]!);
    return `当${parent}以${parentRole}传达心意时，${child}可能会把这份心意理解为方向与关怀。不过，如果${child}想要自主整理思路的需要没有得到充分表达，同样的关心也可能被感受为压力或控制。与其急着判断${child}的沉默或反应，不如先问一问什么让${child}感到负担，并一起约定一次只做一件事。在${pattern}的互动中，这样的对话顺序或许能让双方更自在一些。`;
  }
  match = value.match(/^(.+?)의 관심이 빠른 해결이나 설명으로 전달되면, (.+?)에게는 자신의 속도와 생각이 충분히 존중되지 않는 느낌으로 닿을 수 있습니다\. 이때 두 사람 모두 ‘내 마음을 알아주지 않는다’고 느끼며 대화가 어긋나기 쉽습니다\.$/u);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const child = localizeRelationshipTerm(match[2]!);
    return `当${parent}的关心以快速解决或解释的方式传达时，${child}可能会觉得自己的节奏和想法没有被充分尊重。这时双方都容易觉得“没有人理解我的心意”，对话也更容易出现偏差。`;
  }
  match = value.match(/^먼저 (.+?)가 해결보다 (.+?)이 무엇을 이해받고 싶어 하는지 충분히 듣고, 다음으로 (.+?)이 자기 생각을 정리할 여지를 남기는 순서가 좋습니다\. 그다음 지금 가능한 한 가지 약속을 함께 정하면, (.+?) 흐름의 긴장이 서로를 배우는 시간으로 바뀔 수 있습니다\.$/u);
  if (match) {
    const parent = localizeRelationshipTerm(match[1]!);
    const child = localizeRelationshipTerm(match[2]!);
    const tension = localizeRelationshipTerm(match[4]!);
    return `首先，${parent}可以先不急着给出解决办法，而是认真听听${child}最希望被理解的是什么；接着，给${child}留一点整理想法的空间。之后一起约定一件当下能做到的事，在${tension}的互动中出现的紧张感，也许能成为彼此学习的机会。`;
  }
  match = value.match(/^무의식의 바탕에서 (.+?)는 (.+?)(?:을|를) 내면에서 중요하게 여기는 마음을, (.+?)는 (.+?)(?:을|를) 내면에서 중요하게 여기는 마음을 가질 수 있습니다\.$/u);
  if (match) {
    return `在潜意识层面，${localizeRelationshipTerm(match[1]!)}可能会重视${localizeRelationshipTerm(match[2]!)}；${localizeRelationshipTerm(match[3]!)}可能会重视${localizeRelationshipTerm(match[4]!)}。`;
  }
  match = value.match(/^현재 대화에서는 (.+?)는 (.+?)(?:을|를) 바탕으로 현재 상황을 살피는 편이고, (.+?)는 (.+?)(?:을|를) 바탕으로 현재 상황을 살피는 편입니다\.$/u);
  if (match) {
    return `在当前的对话中，${localizeRelationshipTerm(match[1]!)}可能更倾向于以${localizeRelationshipTerm(match[2]!)}为基础来观察当前状况；${localizeRelationshipTerm(match[3]!)}也可能更倾向于以${localizeRelationshipTerm(match[4]!)}为基础来观察当前状况。`;
  }
  match = value.match(/^갈등이나 피로 뒤에는 (.+?)는 (.+?)(?:을|를) 작은 실천으로 이어가려는 쪽으로, (.+?)는 (.+?)(?:을|를) 작은 실천으로 이어가려는 쪽으로 회복을 선택해볼 수 있습니다\.$/u);
  if (match) {
    return `在冲突或疲惫之后，${localizeRelationshipTerm(match[1]!)}可以尝试把${localizeRelationshipTerm(match[2]!)}落实到小小的行动中；${localizeRelationshipTerm(match[3]!)}则可以尝试把${localizeRelationshipTerm(match[4]!)}落实到小小的行动中，作为恢复的方向。`;
  }

  const stagePatterns: ReadonlyArray<readonly [RegExp, string]> = [
    [/^무의식 카드에서 (.+?)는 (.+?)(?:을|를) 내면에서 중요하게 여기는 흐름을 보이고, (.+?)는 (.+?)(?:을|를) 내면에서 중요하게 여기는 흐름을 보입니다\.$/u, "在潜意识卡所呈现的内容中，{{a}}可能重视{{b}}；{{c}}可能重视{{d}}。"],
    [/^현재 흐름 카드에서 (.+?)는 (.+?)(?:을|를) 바탕으로 현재 상황을 살피는 흐름을 보이고, (.+?)는 (.+?)(?:을|를) 바탕으로 현재 상황을 살피는 흐름을 보입니다\.$/u, "在当前状态卡所呈现的内容中，{{a}}可能倾向于以{{b}}为基础来观察当前状况；{{c}}也可能倾向于以{{d}}为基础来观察当前状况。"],
    [/^회복 방향 카드에서 (.+?)는 (.+?)(?:을|를) 작은 실천으로 이어가려는 흐름을 보이고, (.+?)는 (.+?)(?:을|를) 작은 실천으로 이어가려는 흐름을 보입니다\.$/u, "在恢复方向卡所呈现的内容中，{{a}}可能想把{{b}}落实到小小的行动中；{{c}}也可能想把{{d}}落实到小小的行动中。"],
  ];
  for (const [expression, target] of stagePatterns) {
    match = value.match(expression);
    if (!match) continue;
    return target
      .replace("{{a}}", localizeRelationshipTerm(match[1]!))
      .replace("{{b}}", localizeRelationshipTerm(match[2]!))
      .replace("{{c}}", localizeRelationshipTerm(match[3]!))
      .replace("{{d}}", localizeRelationshipTerm(match[4]!));
  }

  match = value.match(/^현재에는 (.+?)(?:이|가) 더해질 수 있습니다\. 지출은 필요한 기준과 마음의 바람을 나누어 살펴보세요\.$/u);
  if (match) {
    return `在当前状态下，${localizeRelationshipCue(match[1]!)}可能也会发挥作用。支出时，可以分别想一想必要的标准和内心真正想要的是什么。`;
  }
  match = value.match(/^회복에는 (.+?)(?:이|가) 도움이 될 수 있습니다\.$/u);
  if (match) return `在恢复时，${localizeRelationshipCue(match[1]!)}或许能提供参考。`;
  return null;
}

/** 관계·생활 문장에 삽입되는 카드 제목 조합을 자연스러운 중국어 구로 바꾼다. */
function localizeRelationshipCue(source: string): string {
  let match = source.match(/^(.+?)(?:을|를) 바탕으로 현재 상황을 살피려는 흐름$/u);
  if (match) return `以${localizeRelationshipTerm(match[1]!)}为基础来观察当前状况的倾向`;
  match = source.match(/^(.+?)(?:을|를) 바탕으로 현재 상황을 살피는 흐름$/u);
  if (match) return `以${localizeRelationshipTerm(match[1]!)}为基础来观察当前状况的倾向`;
  match = source.match(/^(.+?)(?:을|를) 작은 실천으로 이어가는 방향$/u);
  if (match) return `把${localizeRelationshipTerm(match[1]!)}落实到小小行动中的恢复方向`;
  match = source.match(/^(.+?)(?:을|를) 작은 실천으로 이어가려는$/u);
  if (match) return `把${localizeRelationshipTerm(match[1]!)}落实到小小行动中`;
  return localizeRelationshipTerm(source);
}

function localizeSingleCopy(value: string): string | null {
  const relationshipSentence = localizeRelationshipSentence(value);
  if (relationshipSentence) return relationshipSentence;
  const reviewedValue = reviewedOverrides[value];
  if (reviewedValue) return reviewedValue;
  const exactValue = exact.get(value);
  if (exactValue) return exactValue;
  const delimitedValue = localizeDelimitedTerms(value);
  if (delimitedValue) return delimitedValue;
  const templateValue = localizeTemplateCopy(value);
  if (templateValue) {
    let localizedTemplate = templateValue;
    for (const [source, target] of inlineTerms) localizedTemplate = localizedTemplate.replace(source, target);
    return stripKoreanParticlesAfterChinese(localizedTemplate);
  }
  return null;
}

function localizeSentenceSequence(value: string): string {
  const sentences = value.split(/(?<=[.!?])\s+/).filter(Boolean);
  const localized: string[] = [];
  for (let index = 0; index < sentences.length;) {
    let matched: string | null = null;
    let used = 0;
    for (let width = Math.min(3, sentences.length - index); width >= 1; width -= 1) {
      const candidate = sentences.slice(index, index + width).join(" ");
      const candidateLocalized = localizeSingleCopy(candidate);
      if (candidateLocalized) {
        matched = candidateLocalized;
        used = width;
        break;
      }
    }
    localized.push(matched ?? sentences[index]!);
    index += used || 1;
  }
  return localized.join(" ");
}

function localizeKnownFragments(value: string): string {
  let localized = value;
  for (const [source, target] of fragmentEntries) {
    if (localized.includes(source)) localized = localized.split(source).join(target);
  }
  return localized;
}

function finalizeLocalizedCopy(value: string): string {
  let localized = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const before = localized;
    localized = localized.replace(
      /^(.+?) 드러난 기본 성향을 바탕으로, 세 장의 심리카드는 무의식 · 현재흐름 · 회복방향 차례로 비춥니다\.$/u,
      "$1所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。",
    );
    localized = localized.replace(
      /^(.+?) 드러난 基本 倾向 基础以, 三张 心理卡 潜意识 · 当前状态 · 恢复方向 依次呈现。$/u,
      "$1所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。",
    );
    localized = localizeKnownFragments(localized);
    for (const [source, target] of inlineTerms) localized = localized.replace(source, target);
    if (localized === before) break;
  }
  localized = localized.replace(
    /^(.+?) 드러난 基本 倾向 基础以, 三张 心理卡 潜意识 · 当前状态 · 恢复方向 依次呈现。$/u,
    "$1所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。",
  );
  return stripKoreanParticlesAfterChinese(localized)
    .replace(/的的/g, "的")
    .replace(/蒂尔色|蒂尔/g, "蓝绿色")
    // 한국어의 `블루 마름모`처럼 색상과 도형 사이에 있던 공백은 중국어 카드명에서는 쓰지 않는다.
    .replace(/([\u3400-\u9fff])\s+(圆形|三角形|倒三角形|方形|菱形|五边形|六边形)/g, "$1$2")
    // 변수 자체가 문장 종결부호나 조건어를 포함하는 경우에도 완결 문장으로 정리한다.
    .replace(/([。！？])\1+/g, "$1")
    .replace(/即便即便/g, "即便")
    .replace(/也，?如果/g, "，如果")
    // 조각 카탈로그를 이어 붙인 뒤 남는 중국어 단어 사이의 공백과 역할 소유격 공백을 제거한다.
    .replace(/([\u3400-\u9fff])(?:[ \t]+)(?=[\u3400-\u9fff])/g, "$1")
    .replace(/(?<=[\u3400-\u9fff])\.(?!\d)/g, "。")
    .replace(/\\\\n/g, "\n");
}

/**
 * 문안 값은 Korean canonical key로 저장하고, zh-CN 요청에서만 고정 locale pack을 적용한다.
 * 복수 문단·복문은 먼저 완결 문단 template을 확인하고, 실패하면 줄/문장 단위 template으로만 분해한다.
 */
export function localizeStaticCopy(value: string, locale: AppLocale): string {
  if (locale !== "zh-CN" || !value) return value;
  const colourFlow = value.match(/^(.+?)의 (.+?) · (.+?)의 (.+?) · (.+?)의 (.+?)(?:이|가) (당신의 성향|가상 인물의 성향 흐름)을 이루고 있습니다\.$/u);
  if (colourFlow) {
    const colorName = (source: string) => localizeTemplateVariable(source).replace(/색$/u, "色");
    const keyword = (source: string) => {
      const normalized = stripKoreanVariableParticle(source.trim());
      // 색의 일반 키워드 `회복`은 선택 순서의 역할명 `회복방향`이 아니다.
      if (normalized === "회복") return "恢复与平衡";
      if (normalized === "보호") return "保护感";
      return localizeTemplateVariable(normalized);
    };
    const [firstColor, firstKeyword, secondColor, secondKeyword, thirdColor, thirdKeyword, subject] = colourFlow.slice(1);
    const owner = subject === "당신의 성향" ? "你此次选择所呈现的心理倾向" : "这位虚拟人物的心理倾向";
    return `${colorName(firstColor!)}所呈现的${keyword(firstKeyword!)}、${colorName(secondColor!)}所呈现的${keyword(secondKeyword!)}与${colorName(thirdColor!)}所呈现的${keyword(thirdKeyword!)}，共同构成了${owner}。`;
  }
  const colorCardFlow = value.match(/^(.+?)에서 드러난 기본 성향을 바탕으로, 세 장의 카드는 무의식 · 현재흐름 · 회복방향을 차례로 비춥니다\.$/u);
  if (colorCardFlow) {
    const colorNames = colorCardFlow[1]!.split(" · ").map((color) => localizeTemplateVariable(color.trim()));
    const colors = colorNames.length === 3
      ? `${colorNames[0]}、${colorNames[1]}与${colorNames[2]}`
      : colorNames.join("、");
    return `${colors}所呈现的基本心理特征，会通过三张心理卡依次展现为潜意识、当前状态与恢复方向。`;
  }
  // 실제 결과에서 문단 단위로 검수한 override는 관계 카드의 자동 분할보다 우선한다.
  // 그래야 검수된 완결 문장이 다시 조각 template 경로로 돌아가지 않는다.
  const reviewedWhole = reviewedOverrides[value];
  if (reviewedWhole) return finalizeLocalizedCopy(reviewedWhole);
  // 관계 특성은 `카드 근거. 색상 근거. 생활 장면.`의 세 문장으로 생성된다.
  // 넓은 catalog template이 세 문장을 한꺼번에 가로채면 한국어 조각이 남으므로,
  // 카드 근거로 시작하는 경우에는 반드시 문장 단위로 완결 변환한다.
  if (/^(무의식 카드에서|현재 흐름 카드에서|회복 방향 카드에서)/u.test(value)) {
    const sentences = value.split(/(?<=[.!?])\s+/u).filter(Boolean);
    return finalizeLocalizedCopy(sentences.map((sentence) => localizeSingleCopy(sentence) ?? sentence).join(" "));
  }
  const direct = localizeSingleCopy(value);
  if (direct) return finalizeLocalizedCopy(direct);
  const segments = value.split(/(\n+)/);
  const localizedSegments = segments.map((segment) => {
    if (/^\n+$/.test(segment) || !segment) return segment;
    const lineDirect = localizeSingleCopy(segment);
    if (lineDirect) return lineDirect;
    return localizeSentenceSequence(segment);
  });
  return finalizeLocalizedCopy(localizedSegments.join(""));
}

/** JSON payload의 문안 string만 안전하게 변환하며, 색상·shape·IDs·숫자·URL은 그대로 둔다. */
export function localizePayload<T>(value: T, locale: AppLocale): T {
  if (locale !== "zh-CN") return value;
  if (typeof value === "string") return localizeStaticCopy(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => localizePayload(item, locale)) as T;
  if (!value || typeof value !== "object") return value;
  const clone: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    clone[key] = localizePayload(entry, locale);
  }
  return clone as T;
}
