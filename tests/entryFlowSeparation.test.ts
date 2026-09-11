import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const homeScreen = readFileSync(`${root}/app/(tabs)/index.tsx`, 'utf8');
const relationshipStartScreen = readFileSync(`${root}/app/(tabs)/couple-start.tsx`, 'utf8');
const premiumInfoScreen = readFileSync(`${root}/app/(tabs)/premium-info.tsx`, 'utf8');
const relationshipInfoScreen = readFileSync(`${root}/app/(tabs)/couple-info.tsx`, 'utf8');

describe('서비스 진입과 정보 입력 단계 분리', () => {
  it('첫 화면의 개인 심화분석은 상품 소개 대신 기존 정보 항목을 가진 입력 단계로 바로 이동한다', () => {
    expect(homeScreen).toContain("router.push('/(tabs)/premium-info' as any)");
    expect(homeScreen).not.toContain("onPress={() => router.push('/payment' as any)}");
    expect(premiumInfoScreen).toContain('개인 심화분석 정보 입력');
    expect(premiumInfoScreen).toContain('나이');
    expect(premiumInfoScreen).toContain('직업');
    expect(premiumInfoScreen).toContain('신앙 여부');
    expect(premiumInfoScreen).toContain("router.push('/premium-color-select' as any)");
  });

  it('관계 상품 선택 화면은 상품·관계 조합만 담당하고 별도 정보 입력 화면으로 연결한다', () => {
    expect(relationshipStartScreen).toContain("pathname: '/(tabs)/couple-info'");
    expect(relationshipStartScreen).not.toContain("const GENDERS:");
    expect(relationshipStartScreen).not.toContain("const FAITHS:");
    expect(relationshipInfoScreen).toContain("AsyncStorage.setItem('@couple_session'");
    expect(relationshipInfoScreen).toContain("pathname: '/(tabs)/couple-select'");
  });

  it('관계 정보 입력은 기존 성별·종교 입력과 관계 세션 구조를 유지한다', () => {
    expect(relationshipInfoScreen).toContain('첫 번째 사람');
    expect(relationshipInfoScreen).toContain('두 번째 사람');
    expect(relationshipInfoScreen).toContain('성별');
    expect(relationshipInfoScreen).toContain('종교');
    expect(relationshipInfoScreen).toContain('relationType,');
    expect(relationshipInfoScreen).toContain("personA: { info: { gender: genderA, faith: faithA }, colors: [], cards: [] }");
  });
});
