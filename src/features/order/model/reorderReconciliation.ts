import {
  calculateConfigurationPriceMinor,
  canonicalizeCartConfiguration,
  summarizeCartConfiguration,
  validateCartConfiguration,
} from '../../cart/model/cartConfiguration';
import type { CartConfiguration } from '../../cart/model/cart.types';
import type { ProductDetails } from '../../product/model/product.types';
import type { SanitizedOrderHistoryEntry } from './order.types';
import type { Locale } from '../../../shared/i18n/locale';

export type ReorderLineStatus =
  | 'available'
  | 'changed-price'
  | 'unavailable'
  | 'invalid-configuration'
  | 'removed-product';

export interface ReconciledOrderLine {
  key: string;
  configuration: CartConfiguration;
  quantity: number;
  historicalName: string;
  currentName: string | null;
  historicalUnitPriceMinor: number;
  currentUnitPriceMinor: number | null;
  currentTotalMinor: number | null;
  configurationSummary: string[];
  status: ReorderLineStatus;
  reason: string;
  canAdd: boolean;
}

export interface ReorderReconciliation {
  orderId: string;
  lines: ReconciledOrderLine[];
  hasChanges: boolean;
  addableCount: number;
  skippedCount: number;
}

export const reconcileOrderForRepeat = (
  order: SanitizedOrderHistoryEntry,
  details: readonly ProductDetails[],
  locale: Locale = 'ru',
): ReorderReconciliation => {
  const detailsByProductId = new Map(
    details.map((entry) => [entry.product.id, entry]),
  );
  const lines = order.lines.map((line, index): ReconciledOrderLine => {
    const configuration = canonicalizeCartConfiguration(line.configuration);
    const productDetails = detailsByProductId.get(configuration.productId);
    const base = {
      key: `${order.id}:${index}`,
      configuration,
      quantity: line.quantity,
      historicalName: line.name,
      historicalUnitPriceMinor: line.unitPriceMinor,
    };

    if (!productDetails) {
      return {
        ...base,
        currentName: null,
        currentUnitPriceMinor: null,
        currentTotalMinor: null,
        configurationSummary: [],
        status: 'removed-product',
        reason: locale === 'ru' ? 'Позиция больше не найдена в текущем меню.' : 'This item is no longer in the current menu.',
        canAdd: false,
      };
    }

    if (productDetails.product.availability.status === 'sold-out') {
      return {
        ...base,
        currentName: productDetails.product.name,
        currentUnitPriceMinor: null,
        currentTotalMinor: null,
        configurationSummary: summarizeCartConfiguration(configuration, productDetails, locale),
        status: 'unavailable',
        reason: productDetails.product.availability.note,
        canAdd: false,
      };
    }

    const issues = validateCartConfiguration(configuration, productDetails, locale);
    if (issues.length > 0) {
      return {
        ...base,
        currentName: productDetails.product.name,
        currentUnitPriceMinor: null,
        currentTotalMinor: null,
        configurationSummary: summarizeCartConfiguration(configuration, productDetails, locale),
        status: 'invalid-configuration',
        reason: issues.map((issue) => issue.message).join(' '),
        canAdd: false,
      };
    }

    const currentUnitPriceMinor = calculateConfigurationPriceMinor(
      configuration,
      productDetails,
    );
    const changedPrice = currentUnitPriceMinor !== line.unitPriceMinor;
    return {
      ...base,
      currentName: productDetails.product.name,
      currentUnitPriceMinor,
      currentTotalMinor: currentUnitPriceMinor * line.quantity,
      configurationSummary: summarizeCartConfiguration(configuration, productDetails, locale),
      status: changedPrice ? 'changed-price' : 'available',
      reason: changedPrice
        ? (locale === 'ru' ? 'Цена изменилась: в корзину попадёт текущая цена.' : 'The price changed: the current price will be added to the cart.')
        : (locale === 'ru' ? 'Конфигурация доступна по текущей цене.' : 'This configuration is available at the current price.'),
      canAdd: true,
    };
  });

  return {
    orderId: order.id,
    lines,
    hasChanges: lines.some((line) => line.status !== 'available'),
    addableCount: lines.filter((line) => line.canAdd).length,
    skippedCount: lines.filter((line) => !line.canAdd).length,
  };
};
