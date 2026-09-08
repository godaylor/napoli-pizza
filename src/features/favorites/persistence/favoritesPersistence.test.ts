import { describe, expect, it } from 'vitest';

import type { StorageLike } from '../../cart/persistence/cartPersistence';
import {
  FAVORITES_STORAGE_KEY,
  LEGACY_FAVORITES_STORAGE_KEY,
  loadFavorites,
  parseFavoritesEnvelope,
  saveFavorites,
} from './favoritesPersistence';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('favorites persistence', () => {
  it('writes a versioned, deduplicated envelope and hydrates it', () => {
    const storage = new MemoryStorage();
    saveFavorites(storage, ['202', '101', '101']);

    expect(loadFavorites(storage)).toEqual({
      productIds: ['101', '202'],
      warning: null,
    });
    expect(JSON.parse(storage.getItem(FAVORITES_STORAGE_KEY)!)).toMatchObject({
      schemaVersion: 1,
      productIds: ['101', '202'],
    });
  });

  it('migrates the legacy array and rejects malformed payloads', () => {
    expect(parseFavoritesEnvelope('["202","101","101"]')).toEqual(['101', '202']);
    expect(parseFavoritesEnvelope('{"schemaVersion":1,"productIds":[7]}')).toBeNull();
  });

  it('moves a valid legacy branded envelope to the Napoli key', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_FAVORITES_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      savedAt: new Date().toISOString(),
      productIds: ['101'],
    }));

    expect(loadFavorites(storage).productIds).toEqual(['101']);
    expect(storage.getItem(FAVORITES_STORAGE_KEY)).not.toBeNull();
    expect(storage.getItem(LEGACY_FAVORITES_STORAGE_KEY)).toBeNull();
  });

  it('removes only corrupt favorites data', () => {
    const storage = new MemoryStorage();
    storage.setItem(FAVORITES_STORAGE_KEY, '{bad');
    storage.setItem('napoli:commerce:v1', 'cart-safe');

    expect(loadFavorites(storage)).toMatchObject({ productIds: [], warning: expect.any(String) });
    expect(storage.getItem(FAVORITES_STORAGE_KEY)).toBeNull();
    expect(storage.getItem('napoli:commerce:v1')).toBe('cart-safe');
  });
});
