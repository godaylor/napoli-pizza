import type { StorageLike } from '../../cart/persistence/cartPersistence';

export const FAVORITES_STORAGE_KEY = 'napoli:favorites:v1';
export const LEGACY_FAVORITES_STORAGE_KEY = 'forno22:favorites:v1';
export const FAVORITES_SCHEMA_VERSION = 1 as const;

interface FavoritesEnvelopeV1 {
  schemaVersion: typeof FAVORITES_SCHEMA_VERSION;
  savedAt: string;
  productIds: string[];
}

export interface FavoritesHydrationResult {
  productIds: string[];
  warning: string | null;
}

const normalizeProductIds = (value: unknown): string[] | null => {
  if (
    !Array.isArray(value) ||
    value.length > 200 ||
    !value.every((item) => typeof item === 'string' && item.length > 0)
  ) {
    return null;
  }
  return [...new Set(value)].sort();
};

export const parseFavoritesEnvelope = (raw: string): string[] | null => {
  try {
    const value: unknown = JSON.parse(raw);
    if (Array.isArray(value)) return normalizeProductIds(value);
    if (typeof value !== 'object' || value === null) return null;
    const envelope = value as Partial<FavoritesEnvelopeV1>;
    return envelope.schemaVersion === FAVORITES_SCHEMA_VERSION
      ? normalizeProductIds(envelope.productIds)
      : null;
  } catch {
    return null;
  }
};

export const loadFavorites = (storage: StorageLike): FavoritesHydrationResult => {
  try {
    const currentRaw = storage.getItem(FAVORITES_STORAGE_KEY);
    const legacyRaw = currentRaw ? null : storage.getItem(LEGACY_FAVORITES_STORAGE_KEY);
    const raw = currentRaw ?? legacyRaw;
    if (!raw) return { productIds: [], warning: null };
    const productIds = parseFavoritesEnvelope(raw);
    if (productIds) {
      if (legacyRaw) {
        storage.setItem(FAVORITES_STORAGE_KEY, legacyRaw);
        storage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
      }
      return { productIds, warning: null };
    }
    storage.removeItem(FAVORITES_STORAGE_KEY);
    storage.removeItem(LEGACY_FAVORITES_STORAGE_KEY);
    return {
      productIds: [],
      warning: 'Сохранённое избранное было повреждено и безопасно сброшено.',
    };
  } catch {
    return {
      productIds: [],
      warning: 'Хранилище недоступно. Избранное работает до закрытия этой вкладки.',
    };
  }
};

export const saveFavorites = (
  storage: StorageLike,
  productIds: readonly string[],
) => {
  const envelope: FavoritesEnvelopeV1 = {
    schemaVersion: FAVORITES_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    productIds: [...new Set(productIds)].sort(),
  };
  storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(envelope));
};
