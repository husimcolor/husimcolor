import { COLOR_DATA, type ColorData, type generateInterpretation } from "@/constants/colorData";
import {
  ZH_CN_FREE_COLOUR_COPY_PILOT,
  ZH_CN_FREE_COLOUR_DAILY_PRACTICES,
} from "@/shared/locales/zh-cn-free-colour-copy";
import type { AppLocale } from "@/shared/localization";

type KoreanFreeResult = ReturnType<typeof generateInterpretation>;

const zhById = new Map(ZH_CN_FREE_COLOUR_COPY_PILOT.map((item) => [item.id, item]));

export function getLocalizedColorName(card: ColorData, locale: AppLocale): string {
  return locale === "zh-CN" ? zhById.get(card.id)?.name ?? card.korName : card.korName;
}

export function getLocalizedColorRecovery(card: ColorData, locale: AppLocale): string {
  return locale === "zh-CN" ? zhById.get(card.id)?.recoveryLabel ?? card.recovery : card.recovery;
}

export function getLocalizedColorTraits(card: ColorData, fallback: readonly string[], locale: AppLocale): readonly string[] {
  return locale === "zh-CN" ? zhById.get(card.id)?.personalityTraits ?? fallback : fallback;
}

/**
 * 추천 색 후보·선택 순서·일일 실천 선택 seed는 한국어 canonical 결과를 그대로 사용한다.
 * 여기서는 이미 검수한 25색 중국어 locale pack으로 표시 문안만 바꾼다.
 */
export function localizeFreeResult(
  locale: AppLocale,
  cards: [ColorData, ColorData, ColorData],
  koreanResult: KoreanFreeResult,
): KoreanFreeResult {
  if (locale !== "zh-CN") return koreanResult;

  const [primary, supporting, recovery] = cards;
  const primaryCopy = zhById.get(primary.id);
  const supportingCopy = zhById.get(supporting.id);
  const recoveryCopy = zhById.get(recovery.id);
  if (!primaryCopy || !supportingCopy || !recoveryCopy) return koreanResult;

  const seed = `${primary.id}:${supporting.id}`
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const practices = ZH_CN_FREE_COLOUR_DAILY_PRACTICES[recovery.id];
  const selectedPractice = practices?.[seed % practices.length] ?? koreanResult.coachingMessage;

  return {
    psychologyFlow: primaryCopy.roleContent.primaryTrait,
    personalityFlow: supportingCopy.roleContent.supportingTrait,
    strengths: [...new Set([...primaryCopy.strengths, ...supportingCopy.strengths])].slice(0, 4),
    shadows: [...new Set([...primaryCopy.cautions, ...supportingCopy.cautions])].slice(0, 3),
    complementColors: koreanResult.complementColors.map((name) => {
      const color = COLOR_DATA.find((item) => item.korName === name);
      return color ? getLocalizedColorName(color, locale) : name;
    }),
    coachingMessage: selectedPractice,
    recoveryFlow: recoveryCopy.roleContent.recoveryDirection,
  };
}
