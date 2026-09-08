import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import { buildProductDetails } from '../../product/data/productConfiguration.fixture';
import { cartConfigurationFingerprint } from './cartConfiguration';
import {
  PRODUCT_BY_ID,
  PRODUCT_DETAILS_BY_ID,
  resolveCartLines,
} from './cartSelectors';
import { createBaseConfiguration } from './cartSlice';

const line = (productId: string, variantId: string) => {
  const configuration = {
    ...createBaseConfiguration(productId, variantId),
    modifierSelections: productId === '101'
      ? [{ groupId: 'cheese-style', modifierIds: ['standard-cheese'] }]
      : [],
  };
  return {
    configuration,
    fingerprint: cartConfigurationFingerprint(configuration),
    quantity: 2,
  };
};

describe('M5A cart reconciliation', () => {
  it('recalculates current prices instead of trusting persisted totals', () => {
    const [resolved] = resolveCartLines(
      [line('101', '101-30-thin')],
      PRODUCT_BY_ID,
      PRODUCT_DETAILS_BY_ID,
    );
    expect(resolved.lineUnitPriceMinor).toBe(79000);
    expect(resolved.lineSubtotalMinor).toBe(158000);
    expect(resolved.issues).toEqual([]);
  });

  it('keeps removed products visible with a blocking recovery message', () => {
    const [resolved] = resolveCartLines(
      [line('removed', 'removed-base')],
      new Map(),
      new Map(),
    );
    expect(resolved.displayName).toBe('Позиция больше недоступна');
    expect(resolved.configurationSummary).not.toContain('removed-base');
    expect(resolved.issues[0]).toMatchObject({ code: 'product', blocking: true });
  });

  it('blocks sold-out products and variants while preserving current context', () => {
    const product = CATALOG_PRODUCTS.find((item) => item.id === '114');
    if (!product) throw new Error('Fixture product missing');
    const details = buildProductDetails(product);
    const unavailableVariant = { ...details.variants[0], available: false };
    const [resolved] = resolveCartLines(
      [line(product.id, unavailableVariant.id)],
      new Map([[product.id, product]]),
      new Map([[product.id, { ...details, variants: [unavailableVariant] }]]),
    );
    expect(resolved.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(['availability', 'variant']),
    );
  });
});
