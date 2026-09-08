import { describe, expect, it } from 'vitest';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import {
  getIngredientsForRelations,
  getModifierGroups,
  getModifiersForGroups,
  getProductIngredients,
} from '../../product/data/productConfiguration.fixture';
import { getProductVariants } from '../../product/data/productVariants.fixture';
import type { ProductDetails } from '../../product/model/product.types';
import type { CartConfiguration } from './cart.types';
import {
  calculateConfigurationPriceMinor,
  canonicalizeCartConfiguration,
  cartConfigurationFingerprint,
  createDefaultModifierSelections,
  serializeCartConfiguration,
  summarizeCartConfiguration,
  validateCartConfiguration,
} from './cartConfiguration';

const product = CATALOG_PRODUCTS.find((item) => item.slug === 'pepperoni-napoli')!;
const productIngredients = getProductIngredients(product.id);
const modifierGroups = getModifierGroups(product.modifierGroupIds);
const details: ProductDetails = {
  product,
  variants: getProductVariants(product.id),
  ingredients: getIngredientsForRelations(productIngredients),
  productIngredients,
  modifierGroups,
  modifiers: getModifiersForGroups(modifierGroups),
};

const base = (): CartConfiguration => ({
  productId: product.id,
  variantId: '102-30-thin',
  removedIngredientIds: [],
  modifierSelections: createDefaultModifierSelections(details),
});

describe('canonical cart configuration', () => {
  it('sorts and deduplicates removals, groups and modifier ids', () => {
    const unordered: CartConfiguration = {
      ...base(),
      removedIngredientIds: ['red-onion', 'oregano', 'red-onion'],
      modifierSelections: [
        { groupId: 'extras', modifierIds: ['extra-prosciutto', 'extra-jalapeno'] },
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
        { groupId: 'extras', modifierIds: ['extra-jalapeno'] },
      ],
    };
    const reordered: CartConfiguration = {
      ...base(),
      removedIngredientIds: ['oregano', 'red-onion'],
      modifierSelections: [
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
        { groupId: 'extras', modifierIds: ['extra-jalapeno', 'extra-prosciutto'] },
      ],
    };

    expect(canonicalizeCartConfiguration(unordered)).toEqual(reordered);
    expect(serializeCartConfiguration(unordered)).toBe(
      serializeCartConfiguration(reordered),
    );
    expect(cartConfigurationFingerprint(unordered)).toBe(
      cartConfigurationFingerprint(reordered),
    );
  });

  it('uses removals and modifiers in identity but never quantity', () => {
    const plain = base();
    const withoutOnion = { ...base(), removedIngredientIds: ['red-onion'] };
    expect(cartConfigurationFingerprint(plain)).not.toBe(
      cartConfigurationFingerprint(withoutOnion),
    );
  });

  it('prices variant plus modifiers while removals have zero price effect', () => {
    const configured: CartConfiguration = {
      ...base(),
      removedIngredientIds: ['red-onion'],
      modifierSelections: [
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
      ],
    };
    expect(calculateConfigurationPriceMinor(base(), details)).toBe(99000);
    expect(calculateConfigurationPriceMinor(configured, details)).toBe(113000);
    expect(
      calculateConfigurationPriceMinor(
        { ...configured, removedIngredientIds: [] },
        details,
      ),
    ).toBe(113000);
  });

  it('reports required, max, non-removable and unavailable selections', () => {
    const invalid: CartConfiguration = {
      ...base(),
      removedIngredientIds: ['mozzarella'],
      modifierSelections: [
        {
          groupId: 'extras',
          modifierIds: [
            'extra-mushrooms',
            'extra-jalapeno',
            'extra-burrata',
          ],
        },
      ],
    };
    const codes = validateCartConfiguration(invalid, details).map(
      (issue) => issue.code,
    );
    expect(codes).toEqual(
      expect.arrayContaining([
        'removal',
        'group-min',
        'group-max',
        'modifier-unavailable',
      ]),
    );
  });

  it('creates a human summary without leaking raw ids', () => {
    const configured: CartConfiguration = {
      ...base(),
      removedIngredientIds: ['red-onion'],
      modifierSelections: [
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
      ],
    };
    const summary = summarizeCartConfiguration(configured, details).join(' · ');
    expect(summary).toContain('Без красного лука');
    expect(summary).toContain('Дополнительный сыр');
    expect(summary).not.toContain('red-onion');
    expect(summary).not.toContain('extra-cheese');
  });
});