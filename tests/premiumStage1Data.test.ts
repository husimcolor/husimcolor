import { describe, expect, it } from 'vitest';
import { COLOR_DATA } from '../constants/colorData';
import {
  buildPremiumStage1Interpretation,
  PREMIUM_STAGE1_PROFILES,
} from '../constants/premiumStage1Data';

function wordTrigrams(sentence: string): Set<string> {
  const words = sentence
    .replace(/[.,]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1);
  return new Set(words.slice(0, -2).map((_, index) => words.slice(index, index + 3).join(' ')));
}

function hasSharedLongPhrase(left: string, right: string): boolean {
  const leftPhrases = wordTrigrams(left);
  return [...wordTrigrams(right)].some((phrase) => leftPhrases.has(phrase));
}

const ABSTRACT_OUTPUT_PATTERNS = /마음이 남는|마음의 여유|내면의 여백|마음의 속도를 따라|한쪽에 부담이 쏠리지|마음과 현실이 함께 갈|마음의 온도|정서적 거리|흐름이 함께 보이|힘을 이어주|답답했던 답답함/;
const RELATION_FOCUS_PATTERNS = /상대|사람|관계|서로|대화|신뢰|약속|안부|친밀|가까워|애정|거리|반응을 주고받/;

function lastWord(tag: string): string {
  return tag.trim().split(/\s+/).at(-1) ?? tag;
}

const REPETITION_ROOTS = [/먼저/g, /살피/g, /챙기/g, /편안/g, /균형/g];

function hasRepeatedRootInSentence(text: string): boolean {
  return text
    .split(/[.!?]/)
    .some((sentence) => REPETITION_ROOTS.some((root) => (sentence.match(root) ?? []).length > 1));
}

function countRoot(text: string, root: string): number {
  return text.split(root).length - 1;
}

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

  it('25컬러의 모든 15,625개 순서 조합에서 역할별 통합 해석을 생성한다', () => {
    for (const c1 of COLOR_DATA) {
      for (const c2 of COLOR_DATA) {
        for (const c3 of COLOR_DATA) {
          const result = buildPremiumStage1Interpretation([c1, c2, c3]);
          expect(result.psychologyTendency).toBeTruthy();
          expect(result.personalityTendency).toBeTruthy();
          expect(result.relationshipTendency).toBeTruthy();
          expect(result.psychologyTendency.length).toBeLessThanOrEqual(125);
          expect(result.personalityTendency.length).toBeLessThanOrEqual(125);
          expect(result.relationshipTendency.length).toBeLessThanOrEqual(135);
          expect(result.miniInterpretations).toHaveLength(3);
          expect(result.miniInterpretations.every((mini) => mini.keywords.length === 3)).toBe(true);
          expect(result.miniInterpretations.every((mini) => mini.strengths.length === 2)).toBe(true);
          expect(result.miniInterpretations.every((mini) => mini.tiredStates.length === 2)).toBe(true);
          expect(result.integrationBridge).toBeTruthy();
          expect(result.strengths).toHaveLength(4);
          expect(new Set(result.strengths).size).toBe(4);
          expect(result.growthPossibility).toHaveLength(3);
          expect(result.growthPossibility.every((pattern) => pattern.endsWith('편'))).toBe(true);
          expect(new Set(result.growthPossibility).size).toBe(3);
          expect(new Set(result.strengths.map(lastWord)).size).toBe(4);
          expect(result.strengths.join(' ')).not.toMatch(/태도|성향/);
          expect(result.psychologyTendency).not.toBe(result.personalityTendency);
          expect(result.personalityTendency).not.toBe(result.relationshipTendency);
          expect(hasSharedLongPhrase(result.integrationBridge, result.psychologyTendency)).toBe(false);
          expect(hasSharedLongPhrase(result.integrationBridge, result.personalityTendency)).toBe(false);
          expect(hasSharedLongPhrase(result.integrationBridge, result.relationshipTendency)).toBe(false);
          expect(hasSharedLongPhrase(result.psychologyTendency, result.personalityTendency)).toBe(false);
          expect(hasSharedLongPhrase(result.psychologyTendency, result.relationshipTendency)).toBe(false);
          expect(hasSharedLongPhrase(result.personalityTendency, result.relationshipTendency)).toBe(false);
          expect(result.psychologyTendency).not.toMatch(/무의식|내면에서는|회복 방향|지금은/);
          expect(result.psychologyTendency).not.toMatch(RELATION_FOCUS_PATTERNS);
          expect(result.personalityTendency).not.toMatch(RELATION_FOCUS_PATTERNS);
          expect(hasRepeatedRootInSentence(result.integrationBridge)).toBe(false);
          expect(hasRepeatedRootInSentence(result.psychologyTendency)).toBe(false);
          expect(hasRepeatedRootInSentence(result.personalityTendency)).toBe(false);
          expect(hasRepeatedRootInSentence(result.relationshipTendency)).toBe(false);
          expect(countRoot([
            result.integrationBridge,
            result.psychologyTendency,
            result.personalityTendency,
            result.relationshipTendency,
          ].join(' '), '마음')).toBeLessThanOrEqual(4);
          expect(result.growthPossibility.join(' ')).not.toMatch(/해보세요|해야 합니다|연습이 필요/);
          expect([
            result.integrationBridge,
            result.psychologyTendency,
            result.personalityTendency,
            result.relationshipTendency,
            result.strengths.join(' '),
            result.growthPossibility.join(' '),
            ...result.miniInterpretations.flatMap((mini) => [mini.description, ...mini.strengths, ...mini.tiredStates]),
          ].join(' ')).not.toMatch(ABSTRACT_OUTPUT_PATTERNS);
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
    expect(result.integrationBridge).toContain('상대가 편한지 세심하게 살피고');
    expect(result.growthPossibility).toHaveLength(3);
    expect(result.growthPossibility).not.toContain('혼자만의 시간');
    expect(result.relationshipTendency).toContain('말하지 않은 마음까지 이해하고 싶어 합니다');
  });

  it('대표 조합에서 융합 강점과 3개의 생활 패턴을 역할별로 생성한다', () => {
    const colors = ['red', 'lavender', 'cream'].map((id) =>
      COLOR_DATA.find((color) => color.id === id)!,
    );
    const result = buildPremiumStage1Interpretation(colors);

    expect(result.strengths).toEqual([
      '분명한 추진력',
      '깊은 성찰',
      '자기 리듬 유지',
      '급한 일도 순서를 잡는 힘',
    ]);
    expect(result.growthPossibility).toContain('일이 급하면 속도를 먼저 내는 편');
    expect(result.growthPossibility).toContain('혼자 생각하느라 대화를 미루는 편');
    expect(result.growthPossibility).toContain('바쁠수록 내 리듬을 지키려다 연락을 늦게 하는 편');
    expect(result.relationshipTendency).toContain('서로의 생각을 분명히 나누며 방향을 맞추고 싶어 합니다');
  });

  it('관계성이 강한 컬러 조합도 내면·행동·관계 영역을 분리한다', () => {
    const colors = ['pink', 'peach', 'green'].map((id) =>
      COLOR_DATA.find((color) => color.id === id)!,
    );
    const result = buildPremiumStage1Interpretation(colors);

    expect(result.psychologyTendency).not.toMatch(RELATION_FOCUS_PATTERNS);
    expect(result.personalityTendency).not.toMatch(RELATION_FOCUS_PATTERNS);
    expect(result.relationshipTendency).toMatch(/상대|관계|마음|안부|가까워/);
  });

  it('3번 보완방향 컬러마다 통합문의 마무리 방향이 고유하게 달라진다', () => {
    const primary = COLOR_DATA.find((color) => color.id === 'red')!;
    const support = COLOR_DATA.find((color) => color.id === 'teal')!;
    const thirdDirections = COLOR_DATA.map((third) =>
      buildPremiumStage1Interpretation([primary, support, third]).integrationBridge.split('.').at(-2)?.trim(),
    );

    expect(thirdDirections.every(Boolean)).toBe(true);
    expect(new Set(thirdDirections).size).toBe(COLOR_DATA.length);
  });
});
