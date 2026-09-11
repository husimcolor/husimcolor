import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, 'utf8');
const relationshipStartScreen = readFileSync(`${root}/app/(tabs)/couple-start.tsx`, 'utf8');

describe('첫 진입 화면의 서비스 선택 UX', () => {
  it('컬러 역할 미리보기 없이 세 가지 서비스 목적만 표시한다', () => {
    expect(homeScreen).not.toContain("{ label: '1번 컬러'");
    expect(homeScreen).not.toContain("{ label: '2번 컬러'");
    expect(homeScreen).not.toContain("{ label: '3번 컬러'");
    expect(homeScreen).toContain('🌿 무료 컬러 체험');
    expect(homeScreen).toContain('🎨 컬러 + 심리카드 개인 심화분석');
    expect(homeScreen).toContain('💞 관계 분석');
  });

  it('각 서비스가 기존 무료·개인 심화·관계 분석 경로로 연결된다', () => {
    expect(homeScreen).toContain("router.push({ pathname: '/(tabs)/select', params: { step: '0' } })");
    expect(homeScreen).toContain("router.push('/(tabs)/premium-info' as any)");
    expect(homeScreen).toContain("router.push('/(tabs)/couple-start' as any)");
  });

  it('관계 분석의 기존 세 상품 선택과 숨김 관계 경로를 유지한다', () => {
    expect(relationshipStartScreen).toContain('VISIBLE_RELATION_PRODUCTS.map((product) => (');
    expect(relationshipStartScreen).toContain('const ROMANTIC_RELATION_TYPES');
  });
});
