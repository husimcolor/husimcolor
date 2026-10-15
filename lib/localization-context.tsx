import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  UI_MESSAGES,
  copyVersionForLocale,
  isAppLocale,
  type AppLocale,
  type UiMessageKey,
} from "@/shared/localization";

type LocalizationContextValue = {
  locale: AppLocale;
  ready: boolean;
  copyVersion: string;
  setLocale: (next: AppLocale) => Promise<void>;
  t: (key: UiMessageKey) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then((saved) => {
        if (active && isAppLocale(saved)) setLocaleState(saved);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, next);
  }, []);

  const value = useMemo<LocalizationContextValue>(() => ({
    locale,
    ready,
    copyVersion: copyVersionForLocale(locale),
    setLocale,
    t: (key) => UI_MESSAGES[locale][key],
  }), [locale, ready, setLocale]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const value = useContext(LocalizationContext);
  if (!value) throw new Error("LocalizationProvider is required");
  return value;
}

/**
 * 저장된 결과의 언어를 화면·공유 카드까지 일관되게 고정한다.
 * 상위 앱 선택 언어와 달라도, 과거 결과의 언어를 다시 변환하지 않는다.
 */
export function ResultLocaleProvider({ locale, copyVersion, children }: {
  locale: AppLocale;
  copyVersion?: string;
  children: ReactNode;
}) {
  const parent = useLocalization();
  const value = useMemo<LocalizationContextValue>(() => ({
    ...parent,
    locale,
    copyVersion: copyVersion ?? copyVersionForLocale(locale),
    t: (key) => UI_MESSAGES[locale][key],
  }), [parent, locale, copyVersion]);
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}
