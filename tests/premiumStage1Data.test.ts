import { describe, expect, it } from 'vitest';
import { COLOR_DATA } from '../constants/colorData';
import {
  buildPremiumStage1Interpretation,
  PREMIUM_STAGE1_PROFILES,
} from '../constants/premiumStage1Data';

describe('유료 심화 1단계 컬러 에너지 흐름', () => {
  it('25컬러 모두 역할별 조합 프로필을 제공한다', () => {
    expect(Object.keys(PREMIUM_STAGE1_PROFILES)).toHaveLength(25);

    for (const color of COLOR_DATA) {
      const profile = PREMIUM_STAGE1_PROFILES[color.id];
      expect(profile).toBeTruthy();
      expect(profile.psychology.length).toBeGreaterThan(4);
      expect(profile.focus.length).toBeGreaterThan(3);
      expect(profile.behavior.length).toBeGreaterThan(4);
      expect(profile.relationship.length).toBeGreaterThan(4);
      expect(profile.strengths).toHaveLength(3);
      expect(profile.tiredStates).toHaveLength(2);
    }
  });

  it('서로 다른 3컬러의 모든 조합에서 다섯 해석 영역을 역할별로 생성한다', () => {
    for (const c1 of COLOR_DATA) {
      for (const c2 of COLOR_DATA) {
        if (c2.id === c1.id) continue;
        for (const c3 of COLOR_DATA) {
          if (c3.id === c1.id || c3.id === c2.id) continue;

          const result = buildPremiumStage1Interpretation([c1, c2, c3]);
          expect(result.psychologyTendency).toBeTruthy();
          expect(result.personalityTendency).toBeTruthy();
          expect(result.relationshipTendency).toBeTruthy();
          expect(result.psychologyTendency.length).toBeLessThanOrEqual(90);
          expect(result.personalityTendency.length).toBeLessThanOrEqual(92);
          expect(result.relationshipTendency.length).toBeLessThanOrEqual(100);
          expect(result.miniInterpretations).toHaveLength(3);
          expect(result.miniInterpretations.every((mini) => mini.keywords.length === 3)).toBe(true);
          expect(result.miniInterpretations.every((mini) => mini.strengths.length === 2)).toBe(true);
          expect(result.miniInterpretations.every((mini) => mini.tiredStates.length === 2)).toBe(true);
          expect(result.integrationBridge).toBeTruthy();
          expect(result.strengths).toHaveLength(4);
          expect(result.growthPossibility).toBeTruthy();
          expect(result.psychologyTendency).not.toBe(result.personalityTendency);
          expect(result.personalityTendency).not.toBe(result.relationshipTendency);
          expect(result.psychologyTendency).not.toMatch(/무의식|회복 방향|지금은/);
          expect(result.growthPossibility).not.toMatch(/해보세요|해야 합니다|연습이 필요/);
        }
      }
    }
  });

  it('라벤더·화이트·실버 조합은 다섯 영역이 서로 다른 역할을 설명한다', () => {
    const colors = ['lavender', 'white', 'silver'].map((id) =>
      COLOR_DATA.find((color) => color.id === id)!,
    );
    const result = buildPremiumStage1Interpretation(colors);

    expect(result.miniInterpretations[0].keywords).toHaveLength(3);
    expect(result.miniInterpretations[0].description).toContain('마음의 작은 변화를 세심하게 느끼는');
    expect(result.miniInterpretations[0].tiredStates).toEqual(['생각이 많아짐', '감정 소모']);
    expect(result.integrationBridge).toContain('마음을 깊이 이해하려는 힘');
    expect(result.growthPossibility).not.toMatch(/해보세요|해야 합니다/);
    expect(result.relationshipTendency).toContain('말하지 않은 마음까지 이해받고 싶어 하는');
  });

  it('대표 조합에서 융합 문장에 맞는 조사를 사용한다', () => {
    const colors = ['red', 'lavender', 'cream'].map((id) =>
      COLOR_DATA.find((color) => color.id === id)!,
    );
    const result = buildPremiumStage1Interpretation(colors);

    expect(result.strengths).toContain('분명한 의사를 살린 실행');
    expect(result.strengths).toContain('차분한 태도를 지키는 태도');
    expect(result.growthPossibility).toContain('차분한 태도를 지키는 흐름');
    expect(result.relationshipTendency).toContain('차분한 태도를 함께 중요하게 여깁니다');
  });
});
