/**
 * 커플 개인 결과의 긴 문장을 모바일에서 읽기 편한 단위로 나눈다.
 * 원문 의미는 바꾸지 않고, 기존 `·` 실행 항목만 안정적인 `•` 표기로 통일한다.
 */
export function splitCoupleReadableParagraphs(text?: string): string[] {
  const normalizedText = (text ?? "")
    .replace(/(^|\n)\s*[·•✓]\s*/g, "$1• ")
    .trim();

  return normalizedText
    .split(/\n{2,}|\n(?=•\s)/)
    .flatMap((block) => {
      const sentences = block
        .trim()
        .split(/(?<=[.!?])\s+(?=[^\s])/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
      return Array.from({ length: Math.ceil(sentences.length / 2) }, (_, index) =>
        sentences.slice(index * 2, index * 2 + 2).join(" "),
      );
    });
}
