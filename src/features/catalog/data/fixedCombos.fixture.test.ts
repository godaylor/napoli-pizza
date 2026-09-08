import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from './catalog.fixture';
import {
  EVENING_FOR_TWO,
  getFixedComboIssues,
} from './fixedCombos.fixture';

describe('M5B fixed combo', () => {
  it('has one exact composition, bundle price and positive visible saving', () => {
    expect(EVENING_FOR_TWO.components.map((component) => component.label)).toEqual([
      'Маргарита Napoli · 30 см',
      'Пепперони Napoli · 30 см',
      'Крафтовая кола · 1 л',
    ]);
    expect(EVENING_FOR_TWO.referencePriceMinor).toBe(217000);
    expect(EVENING_FOR_TWO.bundlePriceMinor).toBe(199000);
    expect(EVENING_FOR_TWO.savingMinor).toBe(18000);
    expect(CATALOG_PRODUCTS.find((product) => product.id === '201')?.priceFromMinor)
      .toBe(EVENING_FOR_TWO.bundlePriceMinor);
  });

  it('names an unavailable fixed component instead of allowing a hidden substitution', () => {
    const products = CATALOG_PRODUCTS.map((product) =>
      product.id === '403'
        ? {
            ...product,
            availability: {
              status: 'sold-out' as const,
              note: 'Кола вернётся вечером',
            },
          }
        : product,
    );
    expect(getFixedComboIssues(EVENING_FOR_TWO, products)).toEqual([
      'Крафтовая кола · 1 л недоступен: Кола вернётся вечером',
    ]);
  });
});
