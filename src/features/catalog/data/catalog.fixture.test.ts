import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CATALOG_CATEGORIES, CATALOG_PRODUCTS, OWNED_CATALOG } from './catalog.fixture';

describe('owned catalog fixture', () => {
  it('is versioned and covers the planned category budget', () => {
    const counts = Object.fromEntries(
      CATALOG_CATEGORIES.map((category) => [
        category.id,
        CATALOG_PRODUCTS.filter((product) => product.categoryId === category.id).length,
      ]),
    );

    expect(OWNED_CATALOG.version).toBe(1);
    expect(counts).toEqual({ pizza: 14, combo: 4, snacks: 5, drinks: 5, desserts: 4, sauces: 4 });
  });

  it('has unique stable identities and complete customer-facing fields', () => {
    expect(new Set(CATALOG_PRODUCTS.map((product) => product.id)).size).toBe(CATALOG_PRODUCTS.length);
    expect(new Set(CATALOG_PRODUCTS.map((product) => product.slug)).size).toBe(CATALOG_PRODUCTS.length);

    for (const product of CATALOG_PRODUCTS) {
      expect(product.name.length).toBeGreaterThan(2);
      expect(product.description.length).toBeGreaterThan(20);
      expect(Number.isSafeInteger(product.priceFromMinor)).toBe(true);
      expect(product.priceFromMinor).toBeGreaterThan(0);
      expect(Array.isArray(product.badges)).toBe(true);
      expect(Array.isArray(product.allergens)).toBe(true);
      expect(Array.isArray(product.searchAliases)).toBe(true);
      expect(product.variantIds.length).toBeGreaterThan(0);
      expect(Array.isArray(product.modifierGroupIds)).toBe(true);
      expect(product.availability.note.length).toBeGreaterThan(3);
      expect(product.image.key).not.toMatch(/^https?:/);
    }
  });

  it('ships every referenced responsive image derivative locally', () => {
    const imageKeys = new Set(CATALOG_PRODUCTS.map((product) => product.image.key));

    for (const key of imageKeys) {
      for (const width of [480, 960]) {
        for (const extension of ['avif', 'webp', 'jpg']) {
          expect(existsSync(resolve(`public/menu/${key}-${width}.${extension}`))).toBe(true);
        }
      }
    }
  });
});
