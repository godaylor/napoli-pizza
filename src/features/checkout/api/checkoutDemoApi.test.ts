import { describe, expect, it } from 'vitest';

import { createBaseConfiguration } from '../../cart/model/cartSlice';
import type { DeliveryQuoteRequest } from '../model/checkout.types';
import {
  createDeliveryRequestKey,
  isCheckoutApiError,
  requestDeliveryQuote,
} from './checkoutDemoApi';

const request = (
  overrides: Partial<DeliveryQuoteRequest> = {},
): DeliveryQuoteRequest => ({
  mode: 'delivery',
  lines: [{ configuration: createBaseConfiguration('201', '201-base'), quantity: 1 }],
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

describe('M6A delivery quote adapter', () => {
  it('returns deterministic request identity, fee and ETA from canonical cart/address', async () => {
    const input = request();
    const quote = await requestDeliveryQuote(input, new AbortController().signal);
    expect(quote.requestKey).toBe(createDeliveryRequestKey(input));
    expect(quote.feeMinor).toBe(19900);
    expect(quote.totalMinor).toBe(218900);
    expect(quote.etaLabel).toBe('35–45 мин');
    expect(quote.addressLabel).toBe('Тверская, 22');
  });

  it('normalizes out-of-zone, minimum, HTTP and offline recovery errors', async () => {
    const cases: Array<[DeliveryQuoteRequest, string]> = [
      [request({ scenario: 'unserviceable' }), 'unserviceable'],
      [request({ subtotalMinor: 10000 }), 'minimum'],
      [request({ scenario: 'error' }), 'http'],
      [request({ scenario: 'offline' }), 'offline'],
    ];

    for (const [input, code] of cases) {
      try {
        await requestDeliveryQuote(input, new AbortController().signal);
        throw new Error('Expected quote to fail');
      } catch (error) {
        expect(isCheckoutApiError(error)).toBe(true);
        if (isCheckoutApiError(error)) expect(error.data.code).toBe(code);
      }
    }
  });

  it('changes identity when cart or address changes', () => {
    const base = request();
    expect(createDeliveryRequestKey(base)).not.toBe(
      createDeliveryRequestKey(request({ address: { ...base.address, house: '23' } })),
    );
    expect(createDeliveryRequestKey(base)).not.toBe(
      createDeliveryRequestKey(request({ subtotalMinor: 200000 })),
    );
  });
});
