import { createSelector } from '@reduxjs/toolkit';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import type { CatalogProduct } from '../../catalog/model/catalog.types';
import { buildProductDetails } from '../../product/data/productConfiguration.fixture';
import type {
  ProductDetails,
  ProductVariant,
} from '../../product/model/product.types';
import type { RootState } from '../../../redux/store';
import {
  calculateConfigurationPriceMinor,
  canonicalizeCartConfiguration,
  summarizeCartConfiguration,
  validateCartConfiguration,
} from './cartConfiguration';
import type { CartLine } from './cart.types';
import type { Locale } from '../../../shared/i18n/locale';
import { localizeCatalogProduct } from '../../catalog/data/catalogLocalization';

export const PRODUCT_BY_ID = new Map(
  CATALOG_PRODUCTS.map((product) => [product.id, product]),
);

export const PRODUCT_DETAILS_BY_ID = new Map(
  CATALOG_PRODUCTS.map((product) => [product.id, buildProductDetails(product)]),
);

export interface CartLineIssue {
  code: 'product' | 'availability' | 'variant' | 'configuration';
  message: string;
  blocking: true;
}

export interface CartDisplayLine {
  line: CartLine;
  product: CatalogProduct | null;
  variant: ProductVariant | null;
  displayName: string;
  configurationSummary: string[];
  lineUnitPriceMinor: number | null;
  lineSubtotalMinor: number | null;
  issues: CartLineIssue[];
}

export const resolveCartLines = (
  lines: readonly CartLine[],
  productById: ReadonlyMap<string, CatalogProduct>,
  detailsByProductId: ReadonlyMap<string, ProductDetails>,
  locale: Locale = 'ru',
): CartDisplayLine[] => lines.map((line) => {
  const product = productById.get(line.configuration.productId) ?? null;
  const details = detailsByProductId.get(line.configuration.productId) ?? null;
  const variant = details?.variants.find(
    (item) => item.id === line.configuration.variantId,
  ) ?? null;
  const issues: CartLineIssue[] = [];

  if (!product || !details) {
    issues.push({
      code: 'product',
      message: locale === 'ru' ? 'Этой позиции больше нет в текущем меню. Удалите её, чтобы продолжить.' : 'This item is no longer on the menu. Remove it to continue.',
      blocking: true,
    });
  } else {
    if (product.availability.status !== 'available') {
      issues.push({
        code: 'availability',
        message: locale === 'ru' ? `${product.name} временно недоступна: ${product.availability.note}` : `${product.name} is temporarily unavailable: ${product.availability.note}`,
        blocking: true,
      });
    }
    if (!variant || !variant.available) {
      issues.push({
        code: 'variant',
        message: variant?.unavailableReason ?? (locale === 'ru' ? 'Выбранный вариант больше недоступен.' : 'The selected variant is no longer available.'),
        blocking: true,
      });
    }
    for (const issue of validateCartConfiguration(line.configuration, details, locale)) {
      if (issue.code === 'variant') continue;
      issues.push({
        code: 'configuration',
        message: issue.message,
        blocking: true,
      });
    }
  }

  let lineUnitPriceMinor: number | null = null;
  if (details && variant) {
    try {
      lineUnitPriceMinor = calculateConfigurationPriceMinor(
        line.configuration,
        details,
      );
    } catch {
      lineUnitPriceMinor = null;
    }
  }

  const safeConfiguration = details
    ? canonicalizeCartConfiguration({
        ...line.configuration,
        removedIngredientIds: line.configuration.removedIngredientIds.filter(
          (id) => details.ingredients.some((ingredient) => ingredient.id === id),
        ),
        modifierSelections: line.configuration.modifierSelections.flatMap(
          (selection) => {
            const modifierIds = selection.modifierIds.filter((id) =>
              details.modifiers.some((modifier) => modifier.id === id),
            );
            return modifierIds.length > 0
              ? [{ groupId: selection.groupId, modifierIds }]
              : [];
          },
        ),
      })
    : null;

  return {
    line,
    product,
    variant,
    displayName: product?.name ?? (locale === 'ru' ? 'Позиция больше недоступна' : 'Item no longer available'),
    configurationSummary: details && safeConfiguration
      ? summarizeCartConfiguration(safeConfiguration, details, locale)
      : [locale === 'ru' ? 'Сохранённая конфигурация не распознана' : 'Saved configuration was not recognized'],
    lineUnitPriceMinor,
    lineSubtotalMinor: lineUnitPriceMinor === null
      ? null
      : lineUnitPriceMinor * line.quantity,
    issues,
  };
});

export const resolveCartLinesForLocale = (
  lines: readonly CartLine[],
  locale: Locale,
): CartDisplayLine[] => {
  const products = CATALOG_PRODUCTS.map((product) => localizeCatalogProduct(product, locale));
  const productById = new Map(products.map((product) => [product.id, product]));
  const detailsById = new Map(products.map((product) => [product.id, buildProductDetails(product, locale)]));
  return resolveCartLines(lines, productById, detailsById, locale);
};

export const selectCartLines = (state: RootState) => state.cart.lines;
export const selectPendingCartUndo = (state: RootState) => state.cart.pendingUndo;
export const selectCartPersistenceWarning = (state: RootState) =>
  state.cart.persistenceWarning;

export const calculateCartCount = (lines: readonly CartLine[]): number =>
  lines.reduce((count, line) => count + line.quantity, 0);

export const calculateCartSubtotalMinor = (
  lines: readonly CartLine[],
  detailsByProductId: ReadonlyMap<string, ProductDetails>,
): number =>
  lines.reduce((subtotal, line) => {
    const details = detailsByProductId.get(line.configuration.productId);
    return (
      subtotal +
      (details
        ? calculateConfigurationPriceMinor(line.configuration, details) *
          line.quantity
        : 0)
    );
  }, 0);

export const selectCartCount = createSelector(
  [selectCartLines],
  calculateCartCount,
);

export const selectCartDisplayLines = createSelector(
  [selectCartLines],
  (lines) => resolveCartLines(lines, PRODUCT_BY_ID, PRODUCT_DETAILS_BY_ID),
);

export const selectCartSubtotalMinor = createSelector(
  [selectCartDisplayLines],
  (lines) => lines.reduce(
    (subtotal, line) => subtotal + (line.lineSubtotalMinor ?? 0),
    0,
  ),
);

export const selectCartBlockingIssues = createSelector(
  [selectCartDisplayLines],
  (lines) => lines.flatMap((line) => line.issues),
);

export const selectResolvedCartLines = createSelector(
  [selectCartDisplayLines],
  (lines) => lines.flatMap((entry) =>
    entry.product && entry.variant && entry.lineUnitPriceMinor !== null &&
    entry.lineSubtotalMinor !== null
      ? [{
          line: entry.line,
          product: entry.product,
          variant: entry.variant,
          configurationSummary: entry.configurationSummary,
          lineUnitPriceMinor: entry.lineUnitPriceMinor,
          lineSubtotalMinor: entry.lineSubtotalMinor,
        }]
      : [],
  ),
);
