import { describe, it, expect } from 'vitest';
import { COLOR_DATA, getColorById, generateInterpretation } from '../constants/colorData';

describe('COLOR_DATA', () => {
  it('25가지 콜러가 모두 존재해야 한다', () => {
    // cream은 아이보리로 표시되어 25가지 유지
    expect(COLOR_DATA).toHaveLength(25);
  });

  it('각 컬러는 필수 필드를 가져야 한다', () => {
    for (const color of COLOR_DATA) {
      expect(color.id).toBeTruthy();
      expect(color.name).toBeTruthy();
      expect(color.korName).toBeTruthy();
      expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(color.keywords).toHaveLength(3);
      expect(color.recovery).toBeTruthy();
      expect(color.complementColors.length).toBeGreaterThanOrEqual(1);
      expect(color.strengths.length).toBeGreaterThanOrEqual(2);
      expect(color.shadows.length).toBeGreaterThanOrEqual(2);
      expect(color.coachingMessages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('컬러 ID는 고유해야 한다', () => {
    const ids = COLOR_DATA.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(COLOR_DATA.length);
  });
});

describe('getColorById', () => {
  it('존재하는 ID로 컬러를 찾을 수 있어야 한다', () => {
    const red = getColorById('red');
    expect(red).toBeDefined();
    expect(red?.korName).toBe('레드');
  });

  it('존재하지 않는 ID는 undefined를 반환해야 한다', () => {
    const unknown = getColorById('unknown-color');
    expect(unknown).toBeUndefined();
  });
});

describe('generateInterpretation', () => {
  it('RED + BLUE + WHITE 조합의 해석을 생성해야 한다', () => {
    const red = getColorById('red')!;
    const blue = getColorById('blue')!;
    const white = getColorById('white')!;

    const result = generateInterpretation(red, blue, white);

    expect(result.psychologyFlow).toBeTruthy();
    expect(result.personalityFlow).toBeTruthy();
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.shadows.length).toBeGreaterThan(0);
    expect(result.complementColors.length).toBeGreaterThan(0);
    expect(result.coachingMessage).toBeTruthy();
  });

  it('임의의 3가지 컬러 조합에서 해석을 생성해야 한다', () => {
    const green = getColorById('green')!;
    const pink = getColorById('pink')!;
    const sage = getColorById('sage')!;

    const result = generateInterpretation(green, pink, sage);

    expect(result.psychologyFlow).toBeTruthy();
    expect(result.coachingMessage).toBeTruthy();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.shadows).toBeInstanceOf(Array);
  });

  it('장점은 중복 없이 최대 4개여야 한다', () => {
    const red = getColorById('red')!;
    const blue = getColorById('blue')!;
    const green = getColorById('green')!;

    const result = generateInterpretation(red, blue, green);
    const uniqueStrengths = new Set(result.strengths);

    expect(result.strengths.length).toBeLessThanOrEqual(4);
    expect(uniqueStrengths.size).toBe(result.strengths.length);
  });
});
