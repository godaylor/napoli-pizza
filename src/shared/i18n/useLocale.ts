import { createContext, useContext } from 'react';

import type { Locale } from './locale';

export interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (russian: string, english: string) => string;
}

export const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ru',
  setLocale: () => undefined,
  t: (russian) => russian,
});

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);
