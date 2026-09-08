import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import { createBaseConfiguration } from '../../cart/model/cartSlice';
import { buildProductDetails } from '../../product/data/productConfiguration.fixture';
import type { SanitizedOrderHistoryEntry } from './order.types';
import { reconcileOrderForRepeat } from './reorderReconciliation';

const product = CATALOG_PRODUCTS.find((item) => item.id === '201')!;
const details = buildProductDetails(product);
const entry = (configuration = createBaseConfiguration('201', '201-base')): SanitizedOrderHistoryEntry => ({
  id: 'nap_repeat00000001',
  status: 'delivered',
  createdAt: '2026-08-28T12:00:00.000Z',
  source: 'order',
  lines: [{
    configuration,
    quantity: 2,
    name: product.name,
    unitPriceMinor: product.priceFromMinor,
    totalMinor: product.priceFromMinor * 2,
  }],
  subtotalMinor: product.priceFromMinor * 2,
  discountMinor: 0,
  feeMinor: 0,
  totalMinor: product.priceFromMinor * 2,
  promoCode: null,
  fulfillmentMode: 'pickup',
  fulfillmentLabel: 'Napoli · Белорусская',
});

describe('repeat-order reconciliation', () => {
  it('accepts a canonical available line at current price', () => {
    expect(reconcileOrderForRepeat(entry(), [details]).lines[0]).toMatchObject({
      status: 'available',
      canAdd: true,
      currentTotalMinor: product.priceFromMinor * 2,
    });
  });

  it('flags changed prices without trusting the historical amount', () => {
    const changed = {
      ...details,
      variants: details.variants.map((variant) => ({
        ...variant,
        basePriceMinor: variant.basePriceMinor + 10000,
      })),
    };
    expect(reconcileOrderForRepeat(entry(), [changed]).lines[0]).toMatchObject({
      status: 'changed-price',
      currentUnitPriceMinor: product.priceFromMinor + 10000,
      canAdd: true,
    });
  });

  it('explains removed products, unavailable variants and modifiers', () => {
    expect(reconcileOrderForRepeat(entry(), []).lines[0].status).toBe('removed-product');
    const unavailable = {
      ...details,
      product: {
        ...details.product,
        availability: { status: 'sold-out' as const, note: 'Закончилась.' },
      },
    };
    expect(reconcileOrderForRepeat(entry(), [unavailable]).lines[0]).toMatchObject({
      status: 'unavailable',
      canAdd: false,
      reason: 'Закончилась.',
    });
    const invalidModifier = entry({
      ...createBaseConfiguration('201', '201-base'),
      modifierSelections: [{ groupId: 'gone', modifierIds: ['gone'] }],
    });
    expect(reconcileOrderForRepeat(invalidModifier, [details]).lines[0]).toMatchObject({
      status: 'invalid-configuration',
      canAdd: false,
    });
  });
});
