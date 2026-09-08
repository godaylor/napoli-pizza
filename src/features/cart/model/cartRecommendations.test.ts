import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import { cartConfigurationFingerprint } from './cartConfiguration';
import { getCartRecommendation } from './cartRecommendations';
import { createBaseConfiguration } from './cartSlice';

const line = (productId: string) => {
  const configuration = createBaseConfiguration(productId, `${productId}-base`);
  return {
    configuration,
    fingerprint: cartConfigurationFingerprint(configuration),
    quantity: 1,
  };
};

describe('M5B contextual recommendations', () => {
  it('changes from drink to sauce to dessert and never duplicates a satisfied need', () => {
    const pizza = line('101');
    expect(getCartRecommendation([pizza])?.product.id).toBe('403');

    const drink = line('403');
    expect(getCartRecommendation([pizza, drink])?.product.id).toBe('602');

    const sauce = line('602');
    expect(getCartRecommendation([pizza, drink, sauce])?.product.id).toBe('501');

    const dessert = line('501');
    expect(getCartRecommendation([pizza, drink, sauce, dessert])).toBeNull();
  });

  it('treats a combo as a meal and skips unavailable recommendations', () => {
    const products = CATALOG_PRODUCTS.map((product) =>
      product.id === '403'
        ? {
            ...product,
            availability: {
              status: 'sold-out' as const,
              note: 'Временно нет',
            },
          }
        : product,
    );
    const recommendation = getCartRecommendation([line('201')], products);
    expect(recommendation?.product.id).toBe('602');
    expect(recommendation?.reason).toMatch(/бортикам/);
  });

  it('does not recommend anything for a cart without a meal', () => {
    expect(getCartRecommendation([line('403')])).toBeNull();
  });
});
