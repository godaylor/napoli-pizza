import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BRAND_NAME,
  type Locale,
  persistLocale,
  readStoredLocale,
  translate,
} from './locale';
import { LocaleContext, type LocaleContextValue } from './useLocale';

const META_COPY: Record<Locale, { description: string; socialDescription: string }> = {
  ru: {
    description: 'Napoli — городская пиццерия с понятным меню, быстрой доставкой и самовывозом.',
    socialDescription: 'Городская пиццерия: меню, доставка и самовывоз без лишних шагов.',
  },
  en: {
    description: 'Napoli is an urban pizzeria with a clear menu, fast delivery, and pickup.',
    socialDescription: 'Urban pizzeria with a clear menu, delivery, and pickup.',
  },
};

const setMetaContent = (selector: string, content: string) => {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', content);
};

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, updateLocale] = useState<Locale>(() => readStoredLocale());

  const setLocale = useCallback((nextLocale: Locale) => {
    updateLocale(nextLocale);
    persistLocale(nextLocale);
  }, []);

  useEffect(() => {
    const copy = META_COPY[locale];
    document.documentElement.lang = locale;
    setMetaContent('meta[name="description"]', copy.description);
    setMetaContent('meta[property="og:locale"]', locale === 'ru' ? 'ru_RU' : 'en_US');
    setMetaContent('meta[property="og:title"]', BRAND_NAME);
    setMetaContent('meta[property="og:description"]', copy.socialDescription);
    setMetaContent('meta[name="twitter:title"]', BRAND_NAME);
    setMetaContent('meta[name="twitter:description"]', copy.socialDescription);
    setMetaContent('meta[property="og:image:alt"]', locale === 'ru' ? 'Napoli — городская пиццерия' : 'Napoli — urban pizzeria');
    setMetaContent('meta[name="twitter:image:alt"]', locale === 'ru' ? 'Napoli — городская пиццерия' : 'Napoli — urban pizzeria');
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
      ?.setAttribute('href', locale === 'ru' ? '/site.webmanifest' : '/site.en.webmanifest');
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      t: (russian, english) => translate(locale, russian, english),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
