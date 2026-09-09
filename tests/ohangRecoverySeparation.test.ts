import { describe, expect, it } from 'vitest';
import {
  buildLifeEnergyResult,
  buildComplementaryContextualRoutines,
  deriveComplementaryFiveElements,
  deriveCurrentFiveElements,
} from '../constants/lifeArchetype';
import { CARD_DATA } from '../constants/cardData';
import { COLOR_DATA } from '../constants/colorData';

describe('현재 주요 오행과 보완오행 분리', () => {
  it('주기질·보조기질·무의식·현재 흐름의 반복 출현을 현재 주요 오행으로 산출한다', () => {
    const result = deriveCurrentFiveElements('yellow', 'gold', 'red', 'blue');

    expect(result.elements).toEqual(['토']);
    expect(result.score.토).toBe(2);
    expect(result.sources.map((source) => source.label)).toEqual(['현재 흐름', '무의식', '주기질', '보조기질']);
  });

  it('현재 흐름 → 무의식 → 주기질 → 보조기질 순으로 동점을 처리한다', () => {
    const result = deriveCurrentFiveElements('red', 'yellow', 'blue', 'green');

    expect(result.elements[0]).toBe('목');
    expect(result.score).toMatchObject({ 화: 1, 토: 1, 수: 1, 목: 1 });
  });

  it('3번 심리카드 A와 1단계 3번 회복방향 B의 보완 컬러만 보완오행으로 산출한다', () => {
    const result = deriveComplementaryFiveElements(
      [{ name: '레드' }, { name: '블루' }],
      'red',
    );

    expect(result.complementColors).toEqual(['레드', '블루']);
    expect(result.elements[0]).toBe('화');
    expect(result.sources[0].label).toBe('3번 심리카드 보완 컬러');
  });

  it('몸과 마음 흐름은 현재 주요 오행을, 맞춤 루틴은 보완오행을 별도 보관한다', () => {
    const result = buildLifeEnergyResult(
      ['yellow', 'gold', 'red'],
      [
        { color: 'red', shape: 'circle' },
        { color: 'blue', shape: 'square' },
        { color: 'white', shape: 'triangle' },
      ],
      [{ name: '그린' }, { name: '블루' }],
    );

    expect(result.currentFiveElements.elements).toEqual(['토']);
    expect(result.complementaryFiveElements.elements).toEqual(['목']);
    expect(result.complementaryFiveElements.score.목).toBeGreaterThan(result.complementaryFiveElements.score.수);
    expect(result.energyFlow).toBeDefined();
    expect(result.routines.items.length).toBeGreaterThanOrEqual(3);
  });

  it('보완오행은 과다 해석이 아니라 필요한 회복 에너지에 맞는 기존 루틴 풀을 사용한다', () => {
    const routine = buildComplementaryContextualRoutines([], ['화']);

    expect(routine.label).toBe('활력 회복 루틴');
    expect(routine.items.join(' ')).toContain('햇빛');
  });

  it('25컬러와 기존 심리카드 색상 전체에서 현재·보완 오행을 혼합하지 않고 1~2개로 산출한다', () => {
    const cardColors = Array.from(new Set(CARD_DATA.map((card) => card.color)));
    let currentChecks = 0;
    let complementaryChecks = 0;

    for (const primary of COLOR_DATA) {
      for (const secondary of COLOR_DATA) {
        for (const unconscious of cardColors) {
          for (const current of cardColors) {
            const result = deriveCurrentFiveElements(primary.id, secondary.id, unconscious, current);
            expect(result.elements.length).toBeGreaterThanOrEqual(1);
            expect(result.elements.length).toBeLessThanOrEqual(2);
            expect(result.sources).toHaveLength(4);
            expect(result.sources.map((source) => source.label)).toEqual(['현재 흐름', '무의식', '주기질', '보조기질']);
            currentChecks += 1;
          }
        }
      }
    }

    for (const recoveryColor of COLOR_DATA) {
      for (const recoveryCard of CARD_DATA) {
        const result = deriveComplementaryFiveElements(recoveryCard.complementColors, recoveryColor.id);
        expect(result.elements.length).toBeGreaterThanOrEqual(1);
        expect(result.elements.length).toBeLessThanOrEqual(2);
        expect(result.complementColors?.length).toBeGreaterThan(0);
        expect(result.sources[0]?.label).toBe('3번 심리카드 보완 컬러');
        complementaryChecks += 1;
      }
    }

    expect(currentChecks).toBe(COLOR_DATA.length * COLOR_DATA.length * cardColors.length * cardColors.length);
    expect(complementaryChecks).toBe(COLOR_DATA.length * CARD_DATA.length);
  });
});
