import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  HIDDEN_RELATION_TYPES,
  VISIBLE_RELATION_PRODUCTS,
} from '../constants/relationProducts';
import type { RelationType } from '../constants/coupleData';

const relationStartScreen = readFileSync(resolve(process.cwd(), 'app/(tabs)/couple-start.tsx'), 'utf8');
const homeScreen = readFileSync(resolve(process.cwd(), 'app/(tabs)/index.tsx'), 'utf8');

describe('관계 분석 상품 선택 노출 구조', () => {
  it('사용자에게 세 상품과 지정된 가격만 노출한다', () => {
    expect(VISIBLE_RELATION_PRODUCTS).toEqual([
      {
        id: 'romantic',
        title: '💖 부부 · 연인 관계 심화분석',
        price: '59,000원',
        relationTypes: ['연인', '부부'],
      },
      {
        id: 'parent-child',
        title: '👨‍👩‍👧 부모 · 자녀 관계 심화분석',
        price: '39,000원',
        relationTypes: ['부모-자녀'],
      },
      {
        id: 'friend',
        title: '🌿 친구 관계 분석',
        price: '무료',
        relationTypes: ['친구'],
      },
    ]);
  });

  it('직장동료·형제자매는 관계 유형 호환성을 유지하되 상품 목록에서 제외한다', () => {
    const preservedRelationTypes: readonly RelationType[] = HIDDEN_RELATION_TYPES;
    const visibleRelationTypes = VISIBLE_RELATION_PRODUCTS.flatMap((product) => product.relationTypes);

    expect(preservedRelationTypes).toEqual(['형제자매', '동료']);
    expect(visibleRelationTypes).not.toContain('형제자매');
    expect(visibleRelationTypes).not.toContain('동료');
  });

  it('관계 시작 화면은 세 상품 목록으로만 렌더링하고 개인 분석은 정보 입력 단계로 진입한다', () => {
    expect(relationStartScreen).toContain('VISIBLE_RELATION_PRODUCTS.map((product) => (');
    expect(relationStartScreen).toContain('const ROMANTIC_RELATION_TYPES');
    expect(relationStartScreen).toContain("const isParentChild = relationType === '부모-자녀';");
    expect(homeScreen).toContain('onPress={handleStart}');
    expect(homeScreen).toContain("router.push('/(tabs)/premium-info' as any)");
  });
});
