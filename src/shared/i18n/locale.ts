export const BRAND_NAME = 'Napoli' as const;

export const SUPPORTED_LOCALES = ['ru', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';
export const LOCALE_STORAGE_KEY = 'napoli:locale:v1';
const LEGACY_LOCALE_STORAGE_KEY = 'forno22:locale:v1';

interface StoredLocale {
  schemaVersion: 1;
  locale: Locale;
}

const isLocale = (value: unknown): value is Locale =>
  value === 'ru' || value === 'en';

const parseStoredLocale = (raw: string | null): Locale | null => {
  if (!raw) return null;
  if (isLocale(raw)) return raw;

  try {
    const value = JSON.parse(raw) as Partial<StoredLocale>;
    return value.schemaVersion === 1 && isLocale(value.locale)
      ? value.locale
      : null;
  } catch {
    return null;
  }
};

export const readStoredLocale = (storage?: Storage): Locale => {
  const target = storage ?? (typeof window === 'undefined' ? undefined : window.localStorage);
  try {
    const current = parseStoredLocale(target?.getItem(LOCALE_STORAGE_KEY) ?? null);
    if (current) return current;
    const legacy = parseStoredLocale(target?.getItem(LEGACY_LOCALE_STORAGE_KEY) ?? null);
    if (legacy) {
      persistLocale(legacy, target);
      return legacy;
    }
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
};

export const persistLocale = (locale: Locale, storage?: Storage): boolean => {
  const target = storage ?? (typeof window === 'undefined' ? undefined : window.localStorage);
  try {
    target?.setItem(
      LOCALE_STORAGE_KEY,
      JSON.stringify({ schemaVersion: 1, locale } satisfies StoredLocale),
    );
    target?.removeItem(LEGACY_LOCALE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

export const localeTag = (locale: Locale) =>
  locale === 'ru' ? 'ru-RU' : 'en-US';

export const translate = (
  locale: Locale,
  russian: string,
  english: string,
): string => (locale === 'ru' ? russian : english);
