import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CARD_DATA } from '../constants/cardData';
import { buildCustomRecoveryRoutine, buildLifeEnergyResult, type OhangElement } from '../constants/lifeArchetype';

describe('맞춤 회복 루틴 단일 카드 데이터', () => {
  const card1 = CARD_DATA.find((card) => card.id === 'red_circle')!;
  const card2 = CARD_DATA.find((card) => card.id === 'blue_square')!;
  const card3 = CARD_DATA.find((card) => card.id === 'green_triangle')!;
  const result = buildLifeEnergyResult(
    ['red', 'blue', 'green'],
    [card1, card2, card3].map((card) => ({ color: card.color, shape: card.shape })),
    card3.complementColors,
  );

  it('보완오행 기준 음식군과 기존 차·호흡·루틴을 짧은 카드 데이터로 결합한다', () => {
    const guide = buildCustomRecoveryRoutine(
      result.complementaryFiveElements.elements,
      card3.wellness,
      result.routines,
      result.currentRoutines,
    );

    expect(guide.food.length).toBeGreaterThan(5);
    expect(guide.tea).toBe(card3.wellness.tea);
    expect(guide.breath).toBe(card3.wellness.breath);
    expect(guide.movement.length).toBeGreaterThan(2);
    expect(guide.smallPractice.length).toBeGreaterThan(2);
    expect(guide.message).toBe(result.routines.coaching);
  });

  it.each([
    ['목', '브로콜리'],
    ['화', '토마토'],
    ['토', '단호박'],
    ['금', '배·무'],
    ['수', '검은콩'],
  ] as Array<[OhangElement, string]>)('보완오행 %s은 일관된 짧은 음식군으로 연결한다', (element, expectedFood) => {
    const guide = buildCustomRecoveryRoutine(
      [element],
      card3.wellness,
      result.routines,
      result.currentRoutines,
    );
    expect(guide.food).toContain(expectedFood);
  });

  it('기존 63장 카드의 wellness 데이터는 모두 짧은 맞춤 회복 안내로 연결된다', () => {
    CARD_DATA.forEach((recoveryCard) => {
      const cardResult = buildLifeEnergyResult(
        ['red', 'blue', 'green'],
        [card1, card2, recoveryCard].map((card) => ({ color: card.color, shape: card.shape })),
        recoveryCard.complementColors,
      );
      const guide = buildCustomRecoveryRoutine(
        cardResult.complementaryFiveElements.elements,
        recoveryCard.wellness,
        cardResult.routines,
        cardResult.currentRoutines,
      );

      expect(guide.tea).toBe(recoveryCard.wellness.tea);
      expect(guide.breath).toBe(recoveryCard.wellness.breath);
      expect(guide.movement.length).toBeGreaterThan(2);
      expect(guide.smallPractice.length).toBeGreaterThan(2);
      expect(guide.message.length).toBeGreaterThan(2);
    });
  });

  it('결과 화면은 기존 두 회복 루틴 카드 대신 맞춤 회복 루틴 한 카드만 표시한다', () => {
    const screen = readFileSync(resolve(process.cwd(), 'app/(tabs)/premium-result.tsx'), 'utf8');
    expect(screen).toContain('🌿 오늘의 맞춤 회복 루틴');
    expect(screen).toContain('🍚');
    expect(screen).toContain('추천 움직임');
    expect(screen).toContain('오늘의 작은 실천');
    expect(screen).toContain('오늘의 회복 메시지');
    expect(screen).not.toContain('🌱 {lifeEnergyResult.routines.label}');
  });
});
