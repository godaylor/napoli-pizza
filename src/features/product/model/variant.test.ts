import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import { getProductVariants } from '../data/productVariants.fixture';
import {
  findProductVariant,
  getVariantIssue,
  getVariantPriceMinor,
} from './variant';

const margherita = CATALOG_PRODUCTS.find(
  (product) => product.slug === 'margherita-napoli',
)!;
const variants = getProductVariants(margherita.id);

describe('pizza variant rules', () => {
  it('uses only explicit size and dough combinations from the catalog matrix', () => {
    expect(variants).toHaveLength(5);
    expect(findProductVariant(variants, 30, 'thin')?.id).toBe('101-30-thin');
    expect(findProductVariant(variants, 35, 'thin')).toBeUndefined();
    expect(getVariantIssue(variants, 35, 'thin')).toContain('не готовим');
  });

  it('explains an explicitly unavailable catalog variant', () => {
    expect(getVariantIssue(variants, 35, 'traditional')).toContain(
      'заготовка закончилась',
    );
  });

  it('derives integer minor-unit prices from the selected variant', () => {
    const selected = findProductVariant(variants, 30, 'thin')!;
    expect(getVariantPriceMinor(selected)).toBe(79000);
    expect(Number.isInteger(getVariantPriceMinor(selected))).toBe(true);
  });

  it('rejects malformed money at the pure domain boundary', () => {
    const selected = findProductVariant(variants, 30, 'thin')!;
    expect(() =>
      getVariantPriceMinor({ ...selected, basePriceMinor: 790.5 }),
    ).toThrow(RangeError);
  });
});