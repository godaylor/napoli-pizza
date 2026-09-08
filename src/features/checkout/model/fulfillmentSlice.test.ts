import { describe, expect, it } from 'vitest';

import { setupStore } from '../../../redux/store';
import {
  CART_STORAGE_KEY,
  type StorageLike,
} from '../../cart/persistence/cartPersistence';
import {
  createFulfillmentInitialState,
  setFulfillmentMode,
  setFulfillmentTime,
  setPickupStore,
} from './fulfillmentSlice';

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe('M6B fulfillment preference', () => {
  it('owns mode/store/time and rejects unknown persisted selections', () => {
    expect(createFulfillmentInitialState({
      mode: 'pickup',
      pickupStoreId: 'unknown',
      time: { kind: 'scheduled', slotId: 'unknown' },
    })).toEqual({
      mode: 'pickup',
      pickupStoreId: 'store-tverskaya',
      time: { kind: 'asap' },
    });
  });

  it('persists safe preference IDs without address PII and hydrates them', () => {
    const storage = new MemoryStorage();
    const store = setupStore({ storage });
    store.dispatch(setFulfillmentMode('pickup'));
    store.dispatch(setPickupStore('store-kurskaya'));
    store.dispatch(setFulfillmentTime({ kind: 'scheduled', slotId: 'tomorrow-1300' }));

    const raw = storage.getItem(CART_STORAGE_KEY) ?? '';
    expect(raw).toContain('"mode":"pickup"');
    expect(raw).toContain('"pickupStoreId":"store-kurskaya"');
    expect(raw).toContain('"slotId":"tomorrow-1300"');
    expect(raw).not.toContain('street');
    expect(raw).not.toContain('phone');

    const restored = setupStore({ storage }).getState().fulfillment;
    expect(restored).toEqual({
      mode: 'pickup',
      pickupStoreId: 'store-kurskaya',
      time: { kind: 'scheduled', slotId: 'tomorrow-1300' },
    });
  });

  it('keeps safe choices across mode switches and resets time when store changes', () => {
    const store = setupStore();
    store.dispatch(setFulfillmentMode('pickup'));
    store.dispatch(setFulfillmentTime({ kind: 'scheduled', slotId: 'today-1930' }));
    store.dispatch(setFulfillmentMode('delivery'));
    expect(store.getState().fulfillment.time).toEqual({
      kind: 'scheduled',
      slotId: 'today-1930',
    });

    store.dispatch(setPickupStore('store-kurskaya'));
    expect(store.getState().fulfillment.time).toEqual({ kind: 'asap' });
  });
});