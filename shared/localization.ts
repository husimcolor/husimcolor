export const APP_LOCALES = ["ko", "zh-CN"] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

/**
 * 신규 결과에 기록할 번역본 식별자입니다.
 * 기존 결과의 문구나 보관 PDF에는 적용하지 않습니다.
 */
export const ZH_CN_COPY_VERSION = "zh-CN-2026-10-15-v11.1";

export const LOCALE_STORAGE_KEY = "husimcolor.locale.v1";

export const DEFAULT_LOCALE: AppLocale = "ko";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (APP_LOCALES as readonly string[]).includes(value);
}

/** 새 결과에 기록하는 문안 버전이며 기존 null/undefined 레코드는 한국어로 읽는다. */
export function copyVersionForLocale(locale: AppLocale): string {
  return locale === "zh-CN" ? ZH_CN_COPY_VERSION : "ko-canonical";
}

/**
 * 결과·공유 스냅샷에 기록된 언어를 우선한다.
 * 과거 레코드에 locale이 없으면 기존 한국어 원문을 그대로 유지한다.
 */
export function resolveStoredResultLocale(value: unknown): AppLocale {
  return value === "zh-CN" ? "zh-CN" : DEFAULT_LOCALE;
}

export function isZhCn(locale: AppLocale | undefined | null): locale is "zh-CN" {
  return locale === "zh-CN";
}

export const ROLE_LABELS = {
  ko: {
    primaryTrait: "주기질",
    supportingTrait: "보조기질",
    recoveryDirection: "회복방향",
    unconscious: "무의식",
    currentState: "현재흐름",
    recommendedBalancingColors: "추천 보완컬러",
  },
  "zh-CN": {
    primaryTrait: "主要心理特征",
    supportingTrait: "辅助心理特征",
    recoveryDirection: "恢复方向",
    unconscious: "潜意识",
    currentState: "当前状态",
    recommendedBalancingColors: "推荐调和色",
  },
} as const;

/** 일반 화면에서 반복되는 짧은 문구만 다루는 고정 catalog입니다. */
export const UI_MESSAGES = {
  ko: {
    language: "언어",
    korean: "한국어",
    simplifiedChinese: "简体中文",
    languageNotice: "언어를 바꾸면 새로 시작하는 검사와 새 리포트에 적용됩니다.",
    result: "결과",
    colourInterpretation: "나의 컬러 해석",
    backToSelection: "← 다시 선택",
    threeColours: "나를 읽어주는 3가지 컬러",
    firstColour: "1번 컬러",
    secondColour: "2번 컬러",
    thirdColour: "3번 컬러",
    strengths: "장점",
    emotionalHabit: "마음 습관",
    personalityTraits: "성격 특징",
    helpfulNow: "지금 나에게 도움이 되는 컬러",
    recoveryNow: "지금 필요한 회복",
    coachingMessage: "오늘의 코칭 메시지",
    storyCard: "스토리용 결과 요약카드",
    saveAndShare: "결과 저장 및 공유",
    saveImage: "이미지 저장",
    saving: "저장 중...",
    shareKakao: "카카오톡 공유",
    shareInstagram: "인스타 스토리",
    shareWithFriend: "휴심컬러 친구에게 공유하기",
    explorePersonal: "개인 심화분석 알아보기 →",
    samplePdf: "PDF 리포트 샘플 보기",
    reportSample: "리포트 샘플",
    downloadPdf: "PDF 다운로드",
    suggestedBalancing: "추천 보완컬러",
    privateReportNotice: "이 리포트에는 개인 심리정보가 포함될 수 있습니다. 본인만 접근할 수 있는 안전한 메일함에 보관해 주세요.",
  },
  "zh-CN": {
    language: "语言",
    korean: "한국어",
    simplifiedChinese: "简体中文",
    languageNotice: "切换语言后，将应用于之后新开始的测试和新生成的报告。",
    result: "结果",
    colourInterpretation: "我的色彩解读",
    backToSelection: "← 重新选择",
    threeColours: "读懂自己的三种颜色",
    firstColour: "第1种颜色",
    secondColour: "第2种颜色",
    thirdColour: "第3种颜色",
    strengths: "优势",
    emotionalHabit: "内心习惯",
    personalityTraits: "性格特点",
    helpfulNow: "此刻可供参考的颜色",
    recoveryNow: "此刻需要的调整方向",
    coachingMessage: "今天给自己的话",
    storyCard: "故事分享结果卡",
    saveAndShare: "保存和分享结果",
    saveImage: "保存图片",
    saving: "正在保存...",
    shareKakao: "分享到 KakaoTalk",
    shareInstagram: "分享到 Instagram 故事",
    shareWithFriend: "把 HUSIM COLOR 分享给朋友",
    explorePersonal: "了解个人深度解读 →",
    samplePdf: "查看 PDF 报告示例",
    reportSample: "报告示例",
    downloadPdf: "下载 PDF",
    suggestedBalancing: "推荐调和色",
    privateReportNotice: "本报告可能包含个人心理信息。请仅保存在只有本人可以访问的安全邮箱中。",
  },
} as const;

export type UiMessageKey = keyof typeof UI_MESSAGES.ko;
