import { describe, it, expect } from 'vitest';
import { COLOR_DATA, COLOR_PERSONALITY_TRAITS, COLOR_ROLE_CONTENT, getColorById, generateInterpretation } from '../constants/colorData';

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
      expect(color.keywords.length).toBeGreaterThanOrEqual(3);
      expect(color.recovery).toBeTruthy();
      expect(color.complementColors.length).toBeGreaterThanOrEqual(1);
      expect(color.strengths.length).toBeGreaterThanOrEqual(2);
      expect(color.shadows.length).toBeGreaterThanOrEqual(2);
      expect(color.recoveryMessages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('마음 습관은 컬러별 의미를 담은 짧은 단일 표현이어야 한다', () => {
    for (const color of COLOR_DATA) {
      for (const habit of color.shadows) {
        expect(habit.length).toBeLessThanOrEqual(24);
        expect(habit).not.toMatch(/[.!?\n]/);
      }
    }
  });

  it('컬러 ID는 고유해야 한다', () => {
    const ids = COLOR_DATA.map((c) => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(COLOR_DATA.length);
  });

  it('승인된 25컬러 성격특징은 4개의 짧은 태그를 제공한다', () => {
    expect(Object.keys(COLOR_PERSONALITY_TRAITS)).toHaveLength(25);
    for (const traits of Object.values(COLOR_PERSONALITY_TRAITS)) {
      expect(traits).toHaveLength(4);
      for (const trait of traits) {
        expect(trait.length).toBeLessThanOrEqual(14);
        expect(trait).not.toMatch(/[.!?\n]/);
      }
    }
    expect(COLOR_PERSONALITY_TRAITS.yellow).toEqual(['호기심이 많음', '질문하며 탐색', '배움을 즐김', '생각을 확장함']);
    expect(COLOR_PERSONALITY_TRAITS.white).toEqual(['명료함 추구', '높은 기준', '정돈을 중시함', '완성도를 중요시함']);
    expect(COLOR_PERSONALITY_TRAITS.mint).toEqual(['새로움에 개방적', '전환이 빠름', '산뜻함을 선호', '유연한 적응']);
    expect(COLOR_PERSONALITY_TRAITS.lavender).toEqual(['섬세한 감수성', '내면 지향적', '이상적 관계 추구', '정서적 섬세함']);
    expect(COLOR_PERSONALITY_TRAITS.sage).toEqual(['분위기를 살핌', '조용한 배려', '자연스러운 조율', '평온한 균형']);
    expect(COLOR_PERSONALITY_TRAITS.teal).toEqual(['이성·감정 조율', '명료함 추구', '깊이 있는 탐구', '차분한 판단']);
    expect(COLOR_PERSONALITY_TRAITS.cream).toEqual(['편안함을 중시', '내면 정돈', '신중한 관계 형성', '자기 리듬 중시']);
  });

  it('25컬러는 주기질·보조기질·회복방향 전용 문장을 각각 제공한다', () => {
    expect(Object.keys(COLOR_ROLE_CONTENT)).toHaveLength(25);

    for (const color of COLOR_DATA) {
      const roleContent = COLOR_ROLE_CONTENT[color.id];
      expect(roleContent).toBeDefined();
      expect(roleContent.primaryTrait).toMatch(/[.!?]$/);
      expect(roleContent.secondaryTrait).toMatch(/[.!?]$/);
      expect(roleContent.recoveryDirection).toMatch(/[.!?]$/);
      expect(roleContent.primaryTrait).not.toMatch(/지금은|시기입니다|휴식이 필요|회복이 필요|지쳐/);
      expect(roleContent.secondaryTrait).not.toMatch(/지금은|시기입니다|휴식이 필요|회복이 필요|지쳐/);
    }

    expect(COLOR_ROLE_CONTENT.coral.primaryTrait).toBe(
      '말보다 리액션과 정서적 공감을 먼저 원하는 편입니다. 사람과 따뜻하게 연결되고 감정을 주고받을 때 자신의 에너지가 자연스럽게 살아나는 편입니다.',
    );
    expect(COLOR_ROLE_CONTENT.mint.secondaryTrait).toBe(
      '새로운 분위기나 변화에 열린 편입니다. 익숙한 방식에만 머무르기보다 새로운 방법을 시도하는 것을 좋아합니다.',
    );
    expect(COLOR_ROLE_CONTENT.cream.recoveryDirection).toBe(
      '서두르지 않아도 됩니다. 복잡한 것들을 내려놓고 자신만의 고요한 리듬을 되찾아 보세요. 조용히 자신의 페이스로 돌아가는 것이 지금 가장 필요한 회복입니다.',
    );
  });

  it('보완 컬러는 현재 등록된 25컬러 안에서만 추천한다', () => {
    const knownNames = new Set(COLOR_DATA.map((color) => color.korName));
    for (const color of COLOR_DATA) {
      for (const complementColor of color.complementColors) {
        expect(knownNames.has(complementColor)).toBe(true);
      }
    }
    expect(getColorById('blue')?.complementColors).toEqual(['코랄', '틸']);
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

  it('모든 3컬러 순서 조합에서 필수 결과를 생성해야 한다', () => {
    for (const card1 of COLOR_DATA) {
      for (const card2 of COLOR_DATA) {
        for (const card3 of COLOR_DATA) {
          const result = generateInterpretation(card1, card2, card3);
          expect(result.psychologyFlow.trim()).not.toBe('');
          expect(result.personalityFlow.trim()).not.toBe('');
          expect(result.recoveryFlow.trim()).not.toBe('');
          expect(result.coachingMessage.trim()).not.toBe('');
          expect(result.coachingMessage).not.toContain('\n');
          expect(result.coachingMessage.length).toBeLessThanOrEqual(80);
          expect(result.coachingMessage).not.toContain('회복');
          expect(result.recoveryFlow).not.toContain(result.coachingMessage);
          expect(result.coachingMessage).not.toContain(result.recoveryFlow);
          expect(result.psychologyFlow).not.toContain('반드시');
          expect(result.personalityFlow).not.toContain('반드시');
          expect(result.recoveryFlow).not.toContain('반드시');
          expect(result.coachingMessage).not.toContain('반드시');
          expect(result.psychologyFlow).toBe(COLOR_ROLE_CONTENT[card1.id].primaryTrait);
          expect(result.personalityFlow).toBe(COLOR_ROLE_CONTENT[card2.id].secondaryTrait);
          expect(result.psychologyFlow).not.toContain(card2.reading2.split('\n')[0]);
          expect(result.personalityFlow).not.toContain(card2.reading1.split('\n')[0]);
          const primaryLines = new Set(
            result.psychologyFlow.split('\n').map((line) => line.trim()).filter(Boolean),
          );
          const repeatedLines = result.personalityFlow
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line && primaryLines.has(line));
          expect(repeatedLines).toHaveLength(0);
        }
      }
    }
  });

  it('각 회복방향 컬러는 1·2번 컬러 조합에 따라 여러 실천 메시지를 제공한다', () => {
    for (const recoveryCard of COLOR_DATA) {
      const messages = new Set<string>();
      for (const card1 of COLOR_DATA) {
        for (const card2 of COLOR_DATA) {
          messages.add(generateInterpretation(card1, card2, recoveryCard).coachingMessage);
        }
      }
      expect(messages.size).toBeGreaterThanOrEqual(2);
    }
  });
});
