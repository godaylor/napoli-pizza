import { describe, expect, it } from 'vitest';

import { createBaseConfiguration } from '../../cart/model/cartSlice';
import type {
  DeliveryQuoteRequest,
  PickupQuoteRequest,
} from '../model/checkout.types';
import {
  createFulfillmentRequestKey,
  isCheckoutApiError,
  requestFulfillmentQuote,
} from './checkoutDemoApi';

const lines = [{
  configuration: createBaseConfiguration('201', '201-base'),
  quantity: 1,
}];

const pickup = (
  overrides: Partial<PickupQuoteRequest> = {},
): PickupQuoteRequest => ({
  mode: 'pickup',
  lines,
  subtotalMinor: 199000,
  storeId: 'store-tverskaya',
  time: { kind: 'asap' },
  scenario: 'default',
  ...overrides,
});

const delivery = (
  overrides: Partial<DeliveryQuoteRequest> = {},
): DeliveryQuoteRequest => ({
  mode: 'delivery',
  lines,
  subtotalMinor: 199000,
  address: {
    city: 'Москва',
    street: 'Тверская',
    house: '22',
    apartment: '',
    entrance: '',
    floor: '',
  },
  time: { kind: 'asap' },
  scenario: 'default',
  ...overrides,
});

describe('M6B fulfillment quote adapter', () => {
  it('creates a pickup quote without delivery address or fee leakage', async () => {
    const input = pickup();
    expect('address' in input).toBe(false);
    const quote = await requestFulfillmentQuote(
      input,
      new AbortController().signal,
    );
    expect(quote.mode).toBe('pickup');
    expect(quote.feeMinor).toBe(0);
    expect(quote.totalMinor).toBe(199000);
    expect(quote.locationLabel).toContain('Napoli · Тверская');
    if (quote.mode === 'pickup') {
      expect(quote.store.address).toBe('Тверская, 22');
      expect('addressLabel' in quote).toBe(false);
    }
  });

  it('includes mode, store and scheduled slot in quote identity', () => {
    const scheduled = pickup({
      time: { kind: 'scheduled', slotId: 'today-1930' },
    });
    expect(createFulfillmentRequestKey(pickup())).not.toBe(
      createFulfillmentRequestKey(scheduled),
    );
    expect(createFulfillmentRequestKey(scheduled)).not.toBe(
      createFulfillmentRequestKey({
        ...scheduled,
        storeId: 'store-kurskaya',
      }),
    );
    expect(createFulfillmentRequestKey(delivery())).not.toBe(
      createFulfillmentRequestKey(pickup()),
    );
  });

  it('normalizes closed store, unavailable slot, expired, minimum and offline states', async () => {
    const cases = [
      pickup({ scenario: 'closed-store' }),
      pickup({
        scenario: 'slot-unavailable',
        time: { kind: 'scheduled', slotId: 'today-1930' },
      }),
      pickup({ scenario: 'quote-expired' }),
      pickup({ subtotalMinor: 10000 }),
      pickup({ scenario: 'offline' }),
    ];
    const expected = [
      'closed-store',
      'slot-unavailable',
      'quote-expired',
      'minimum',
      'offline',
    ];

    for (let index = 0; index < cases.length; index += 1) {
      try {
        await requestFulfillmentQuote(
          cases[index],
          new AbortController().signal,
        );
        throw new Error('Expected quote to fail');
      } catch (error) {
        expect(isCheckoutApiError(error)).toBe(true);
        if (isCheckoutApiError(error)) {
          expect(error.data.code).toBe(expected[index]);
          expect(error.data.recoverable).toBe(true);
        }
      }
    }
  });
});