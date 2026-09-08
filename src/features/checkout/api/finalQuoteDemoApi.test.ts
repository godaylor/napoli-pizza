import { describe, expect, it } from 'vitest';

import { createBaseConfiguration } from '../../cart/model/cartSlice';
import type { FulfillmentQuote } from '../model/checkout.types';
import type { FinalQuoteRequest } from '../model/finalQuote.types';
import {
  calculatePercentageDiscountMinor,
  createFinalQuoteRequestKey,
  isFinalQuoteApiError,
  requestFinalQuote,
} from './finalQuoteDemoApi';

const fulfillmentQuote: FulfillmentQuote = {
  id: 'fq-demo',
  requestKey: 'fulfillment-demo',
  mode: 'delivery',
  feeMinor: 1,
  subtotalMinor: 1,
  totalMinor: 2,
  etaLabel: '35–45 мин',
  minimumMinor: 50000,
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  locationLabel: 'Тверская, 22',
  addressLabel: 'Тверская, 22',
};

const request = (
  overrides: Partial<FinalQuoteRequest> = {},
): FinalQuoteRequest => ({
  lines: [{
    configuration: createBaseConfiguration('201', '201-base'),
    quantity: 1,
  }],
  fulfillmentQuote,
  promoCode: null,
  scenario: 'default',
  ...overrides,
});

describe('M7 authoritative final quote', () => {
  it('rounds percentage discounts in integer minor units', () => {
    expect(calculatePercentageDiscountMinor(10005, 10)).toBe(1001);
    expect(calculatePercentageDiscountMinor(199000, 10)).toBe(19900);
  });

  it('reprices canonical lines and never trusts fulfillment preview totals', async () => {
    const quote = await requestFinalQuote(
      request({ promoCode: ' napoli10 ' }),
      new AbortController().signal,
    );
    expect(quote.subtotalMinor).toBe(199000);
    expect(quote.discountMinor).toBe(19900);
    expect(quote.feeMinor).toBe(19900);
    expect(quote.totalMinor).toBe(199000);
    expect(quote.promo).toMatchObject({
      code: 'NAPOLI10',
      label: '10% на заказ',
    });
    expect(quote.lines[0]).toMatchObject({
      name: 'Вечер на двоих',
      quantity: 1,
      unitPriceMinor: 199000,
    });
  });

  it('supports a fixed combo promo without duplicated discounts', async () => {
    const input = request({ promoCode: 'COMBO200' });
    const first = await requestFinalQuote(input, new AbortController().signal);
    const second = await requestFinalQuote(input, new AbortController().signal);
    expect(first.discountMinor).toBe(20000);
    expect(first.totalMinor).toBe(198900);
    expect(second.discountMinor).toBe(first.discountMinor);
    expect(second.requestKey).toBe(first.requestKey);
  });

  it('returns specific invalid, expired, minimum and eligibility errors', async () => {
    const pizza = createBaseConfiguration('101', '101-25-thin');
    const cases: Array<[FinalQuoteRequest, string]> = [
      [request({ promoCode: 'UNKNOWN' }), 'promo-invalid'],
      [request({ promoCode: 'EXPIRED22' }), 'promo-expired'],
      [request({
        promoCode: 'NAPOLI10',
        lines: [{ configuration: pizza, quantity: 1 }],
      }), 'promo-minimum'],
      [request({
        promoCode: 'COMBO200',
        lines: [{ configuration: pizza, quantity: 3 }],
      }), 'promo-ineligible'],
    ];

    for (const [input, code] of cases) {
      try {
        await requestFinalQuote(input, new AbortController().signal);
        throw new Error('Expected promo failure');
      } catch (error) {
        expect(isFinalQuoteApiError(error)).toBe(true);
        if (isFinalQuoteApiError(error)) {
          expect(error.data.code).toBe(code);
          expect(error.data.message).toMatch(/Итог не изменён|итог не изменён/);
        }
      }
    }
  });

  it('invalidates identity for cart, fulfillment, promo and retry scenario', () => {
    const base = request();
    const keys = [
      createFinalQuoteRequestKey(base),
      createFinalQuoteRequestKey(request({ promoCode: 'NAPOLI10' })),
      createFinalQuoteRequestKey(request({
        fulfillmentQuote: { ...fulfillmentQuote, requestKey: 'fulfillment-new' },
      })),
      createFinalQuoteRequestKey(request({
        lines: [{ ...base.lines[0], quantity: 2 }],
      })),
      createFinalQuoteRequestKey(request({ scenario: 'error' })),
    ];
    expect(new Set(keys)).toHaveLength(keys.length);
  });
});