import { describe, expect, it } from 'vitest';

import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  persistLocale,
  readStoredLocale,
} from './locale';

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => { values.delete(key); },
      setItem: (key: string, value: string) => { values.set(key, value); },
    } satisfies Storage,
  };
};

describe('locale persistence', () => {
  it('defaults to Russian when no preference is stored', () => {
    expect(readStoredLocale(createStorage().storage)).toBe(DEFAULT_LOCALE);
  });

  it('persists English in a versioned Napoli envelope', () => {
    const { storage, values } = createStorage();
    expect(persistLocale('en', storage)).toBe(true);
    expect(JSON.parse(values.get(LOCALE_STORAGE_KEY) ?? '{}')).toEqual({
      schemaVersion: 1,
      locale: 'en',
    });
    expect(readStoredLocale(storage)).toBe('en');
  });

  it('migrates a valid legacy preference only after writing the new key', () => {
    const { storage, values } = createStorage();
    values.set('forno22:locale:v1', JSON.stringify({ schemaVersion: 1, locale: 'en' }));

    expect(readStoredLocale(storage)).toBe('en');
    expect(values.has(LOCALE_STORAGE_KEY)).toBe(true);
    expect(values.has('forno22:locale:v1')).toBe(false);
  });

  it('falls back safely when storage is unavailable', () => {
    const storage = {
      getItem: () => { throw new Error('denied'); },
    } as unknown as Storage;
    expect(readStoredLocale(storage)).toBe('ru');
  });
});
