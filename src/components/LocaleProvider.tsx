'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { defaultLocale, localeStorageKey, t } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  tr: (key: string, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(localeStorageKey);
      if (saved === 'zh-CN' || saved === 'en-US') {
        setLocaleState(saved);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(localeStorageKey, locale);
    } catch {
      // noop
    }
  }, [locale]);

  const value = useMemo<LocaleContextValue>(() => {
    return {
      locale,
      setLocale: setLocaleState,
      tr: (key, vars) => t(locale, key, vars)
    };
  }, [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
