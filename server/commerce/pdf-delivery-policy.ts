export type AnalysisPdfKind = "personal_deep" | "couple_love_deep" | "parent_child_deep";

const MEMBER_RETENTION_DAYS = 365;
const GUEST_RETENTION_DAYS = 7;

export function getPrivateDocumentRetentionExpiresAt(accessMode: "member" | "guest" | "free", now = new Date()): Date {
  const days = accessMode === "member" ? MEMBER_RETENTION_DAYS : GUEST_RETENTION_DAYS;
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

export function getPrivatePdfFilename(kind: AnalysisPdfKind, locale: "ko" | "zh-CN" = "ko"): string {
  if (locale === "zh-CN") {
    if (kind === "personal_deep") return "HUSIM_COLOR_个人深度分析报告.pdf";
    if (kind === "couple_love_deep") return "HUSIM_COLOR_夫妻_恋人关系报告.pdf";
    return "HUSIM_COLOR_亲子关系报告.pdf";
  }
  if (kind === "personal_deep") return "휴심컬러_나의컬러심리해석.pdf";
  if (kind === "couple_love_deep") return "휴심컬러_부부연인_관계리포트.pdf";
  return "휴심컬러_부모자녀_관계리포트.pdf";
}
