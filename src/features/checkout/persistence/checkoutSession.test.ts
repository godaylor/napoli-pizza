import { describe, expect, it } from 'vitest';

import type { DeliveryCheckoutFields } from '../model/checkout.types';
import {
  CHECKOUT_SESSION_KEY,
  LEGACY_CHECKOUT_SESSION_KEY,
  clearCheckoutSession,
  loadCheckoutSession,
  saveCheckoutSession,
  type SessionStorageLike,
} from './checkoutSession';

class MemorySession implements SessionStorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const fields: DeliveryCheckoutFields = {
  name: 'Гость Napoli',
  phone: '+7 900 000-22-22',
  email: 'demo@napoli.test',
  city: 'Москва',
  street: 'Тверская',
  house: '22',
  apartment: '7',
  entrance: '2',
  floor: '3',
  note: 'Домофон 22',
  scenario: 'default',
};

describe('M6A checkout session boundary', () => {
  it('restores the explicit contact/address allow-list and excludes payment-like values', () => {
    const storage = new MemorySession();
    saveCheckoutSession(storage, {
      ...fields,
      pan: '4111111111111111',
      cvc: '123',
    } as DeliveryCheckoutFields & { pan: string; cvc: string });
    const raw = storage.getItem(CHECKOUT_SESSION_KEY) ?? '';
    expect(raw).not.toContain('4111111111111111');
    expect(raw).not.toContain('cvc');
    expect(loadCheckoutSession(storage)).toEqual(fields);
  });

  it('drops corrupt and unsupported payloads without throwing', () => {
    const storage = new MemorySession();
    storage.values.set(CHECKOUT_SESSION_KEY, '{broken');
    expect(loadCheckoutSession(storage)).toBeNull();

    storage.values.set(CHECKOUT_SESSION_KEY, JSON.stringify({ schemaVersion: 99, draft: fields }));
    expect(loadCheckoutSession(storage)).toBeNull();
    expect(storage.values.has(CHECKOUT_SESSION_KEY)).toBe(false);
  });

  it('moves a valid legacy branded draft to the Napoli key', () => {
    const storage = new MemorySession();
    saveCheckoutSession(storage, fields);
    const raw = storage.getItem(CHECKOUT_SESSION_KEY)!;
    storage.removeItem(CHECKOUT_SESSION_KEY);
    storage.setItem(LEGACY_CHECKOUT_SESSION_KEY, raw);

    expect(loadCheckoutSession(storage)).toEqual(fields);
    expect(storage.getItem(CHECKOUT_SESSION_KEY)).toBe(raw);
    expect(storage.getItem(LEGACY_CHECKOUT_SESSION_KEY)).toBeNull();
  });

  it('clears the private checkout draft after successful order creation', () => {
    const storage = new MemorySession();
    saveCheckoutSession(storage, fields);

    expect(clearCheckoutSession(storage)).toBe(true);
    expect(storage.values.has(CHECKOUT_SESSION_KEY)).toBe(false);
  });

  it('does not turn an unavailable storage cleanup into an order failure', () => {
    const storage = new MemorySession();
    storage.removeItem = () => {
      throw new Error('storage unavailable');
    };

    expect(clearCheckoutSession(storage)).toBe(false);
  });
});
