import { describe, expect, it } from 'vitest';

import { setupStore } from '../../../redux/store';
import {
  addConfiguration,
  createBaseConfiguration,
} from '../model/cartSlice';
import {
  CART_STORAGE_KEY,
  LEGACY_CART_STORAGE_KEY,
  loadCart,
  parseCartEnvelope,
  saveCart,
  type StorageLike,
} from './cartPersistence';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  failReads = false;
  failWrites = false;

  getItem(key: string) {
    if (this.failReads) throw new DOMException('denied');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('denied');
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const configured = {
  productId: '102',
  variantId: '102-30-thin',
  removedIngredientIds: ['red-onion'],
  modifierSelections: [
    { groupId: 'extras', modifierIds: ['extra-mushrooms'] },
    { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
  ],
};

describe('M5A cart persistence boundary', () => {
  it('stores only canonical configurations and quantity, then hydrates fingerprints', () => {
    const storage = new MemoryStorage();
    saveCart(storage, [{
      configuration: {
        ...configured,
        removedIngredientIds: ['red-onion', 'red-onion'],
        modifierSelections: [...configured.modifierSelections].reverse(),
      },
      fingerprint: 'ignored-persisted-fingerprint',
      quantity: 2,
    }]);

    const raw = storage.getItem(CART_STORAGE_KEY) ?? '';
    expect(raw).not.toContain('ignored-persisted-fingerprint');
    expect(raw).not.toContain('price');
    const hydrated = loadCart(storage);
    expect(hydrated.warning).toBeNull();
    expect(hydrated.lines).toHaveLength(1);
    expect(hydrated.lines[0]).toMatchObject({ quantity: 2 });
    expect(hydrated.lines[0].configuration.removedIngredientIds).toEqual(['red-onion']);
    expect(hydrated.lines[0].fingerprint).toMatch(/^cfg1-/);
  });

  it('migrates the known v0 shape and rejects unknown or corrupt payloads', () => {
    const v0 = JSON.stringify({
      schemaVersion: 0,
      lines: [{ configuration: createBaseConfiguration('101', '101-25-thin'), quantity: 1 }],
    });
    expect(parseCartEnvelope(v0)).toHaveLength(1);
    expect(parseCartEnvelope('{"schemaVersion":99}')).toBeNull();

    const storage = new MemoryStorage();
    storage.values.set(CART_STORAGE_KEY, '{not-json');
    const reset = loadCart(storage);
    expect(reset.lines).toEqual([]);
    expect(reset.warning).toMatch(/безопасно сброшена/);
    expect(storage.values.has(CART_STORAGE_KEY)).toBe(false);
  });

  it('moves a valid legacy branded envelope to the Napoli key', () => {
    const storage = new MemoryStorage();
    saveCart(storage, [{ configuration: configured, fingerprint: 'ignored', quantity: 1 }]);
    const raw = storage.getItem(CART_STORAGE_KEY)!;
    storage.removeItem(CART_STORAGE_KEY);
    storage.setItem(LEGACY_CART_STORAGE_KEY, raw);

    expect(loadCart(storage).lines).toHaveLength(1);
    expect(storage.getItem(CART_STORAGE_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_CART_STORAGE_KEY)).toBeNull();
  });

  it('keeps the Redux cart usable when storage reads or writes are denied', () => {
    const deniedRead = new MemoryStorage();
    deniedRead.failReads = true;
    expect(loadCart(deniedRead).warning).toMatch(/Хранилище недоступно/);

    const deniedWrite = new MemoryStorage();
    const store = setupStore({ storage: deniedWrite });
    deniedWrite.failWrites = true;
    store.dispatch(addConfiguration(configured));
    expect(store.getState().cart.lines).toHaveLength(1);
    expect(store.getState().cart.persistenceWarning).toMatch(/Не удалось сохранить/);
  });
});
