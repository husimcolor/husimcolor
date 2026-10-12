import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  UI_MESSAGES,
  ZH_CN_COPY_VERSION,
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
    copyVersion: locale === "zh-CN" ? ZH_CN_COPY_VERSION : "ko-canonical",
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
