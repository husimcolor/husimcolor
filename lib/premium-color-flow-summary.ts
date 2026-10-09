type PremiumColorFlowColor = {
  korName: string;
  keywords: readonly string[];
};

function subjectParticle(value: string) {
  const code = value.charCodeAt(value.length - 1);
  if (code >= 0xAC00 && code <= 0xD7A3) return (code - 0xAC00) % 28 > 0 ? "이" : "가";
  return "이";
}

/** 세 컬러의 첫 키워드를 화면·서버 PDF·공개 샘플에서 같은 조사로 연결한다. */
export function buildPremiumColorFlowDescription(colors: readonly PremiumColorFlowColor[], subject = "당신의 성향") {
  const selected = colors.slice(0, 3);
  if (selected.length < 3) return "";
  const keywords = selected.map((color) => `${color.korName}의 ${color.keywords[0] ?? "고유한 결"}`);
  const joined = keywords.join(" · ");
  return `${joined}${subjectParticle(joined)} ${subject}을 이루고 있습니다.`;
}
