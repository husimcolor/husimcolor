import type { RelationType } from './coupleData';

export type VisibleRelationProduct = {
  id: 'romantic' | 'parent-child' | 'friend';
  title: string;
  price: string;
  relationTypes: readonly RelationType[];
};

/**
 * 관계 분석 시작 화면에서만 노출하는 판매 상품입니다.
 * RelationType 전체 집합과 분리해 기존 결과·공유·직접 세션 경로를 보존합니다.
 */
export const VISIBLE_RELATION_PRODUCTS: readonly VisibleRelationProduct[] = [
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
];

/** 기존 세션·결과·공유 호환성을 위해 보존하되, 시작 화면에는 노출하지 않는 관계 유형입니다. */
export const HIDDEN_RELATION_TYPES = ['형제자매', '동료'] as const satisfies readonly RelationType[];
