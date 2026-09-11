import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const resultScreen = readFileSync(resolve(process.cwd(), 'app/(tabs)/couple-result.tsx'), 'utf8');

describe('친구 관계 결과 문구', () => {
  it('친구 관계에만 새로운 친구 관계 분석 시작 문구를 사용한다', () => {
    expect(resultScreen).toContain("isFriendRel\n                ? '새로운 친구 관계 분석 시작'");
    expect(resultScreen).toContain("isParentChildRel\n              ? '새로운 부모·자녀 분석 시작'");
    expect(resultScreen).toContain(": '새로운 커플 세션 시작'");
  });

  it('친구 관계 카카오 공유는 현재 shareId URL을 쓰면서 친구 관계 제목·문구를 사용한다', () => {
    expect(resultScreen).toContain("const shareUrl = await getCoupleShareUrl();");
    expect(resultScreen).toContain("isFriendRel ? '휴심컬러 친구 관계 분석 결과' : '휴심컬러 커플 세션 결과'");
    expect(resultScreen).toContain("우리 우정의 관계 유형은 ${typeName}입니다 🤝");
  });

  it('친구 관계의 하단 공유 문구도 커플 세션으로 남지 않는다', () => {
    expect(resultScreen).toContain("? '휴심컬러 친구 관계 분석 결과를 확인해보세요!'");
  });
});
