import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import type { CatalogProduct, ProductKind } from '../../catalog/model/catalog.types';
import type { CartLine } from './cart.types';
import type { Locale } from '../../../shared/i18n/locale';

export interface CartRecommendation {
  product: CatalogProduct;
  reason: string;
}

interface RecommendationRule {
  productId: string;
  satisfiedByKind: ProductKind;
  reason: string;
  reasonEn: string;
}

const RULES: RecommendationRule[] = [
  {
    productId: '403',
    satisfiedByKind: 'drinks',
    reason: 'К горячей пицце — холодный напиток без лишнего выбора.',
    reasonEn: 'A cold drink for hot pizza, without extra decisions.',
  },
  {
    productId: '602',
    satisfiedByKind: 'sauces',
    reason: 'Пармезановый соус подходит к бортикам и запечённым закускам.',
    reasonEn: 'Parmesan sauce pairs with crusts and baked sides.',
  },
  {
    productId: '501',
    satisfiedByKind: 'desserts',
    reason: 'Небольшой тирамису завершает заказ на двоих.',
    reasonEn: 'A small tiramisu completes an order for two.',
  },
];

export const getCartRecommendation = (
  lines: readonly CartLine[],
  products: readonly CatalogProduct[] = CATALOG_PRODUCTS,
  locale: Locale = 'ru',
): CartRecommendation | null => {
  const productById = new Map(products.map((product) => [product.id, product]));
  const cartProductIds = new Set(
    lines.map((line) => line.configuration.productId),
  );
  const cartKinds = new Set(
    lines.flatMap((line) => {
      const kind = productById.get(line.configuration.productId)?.kind;
      return kind ? [kind] : [];
    }),
  );
  const hasMeal = cartKinds.has('pizza') || cartKinds.has('combo');
  if (!hasMeal) return null;

  for (const rule of RULES) {
    if (cartKinds.has(rule.satisfiedByKind) || cartProductIds.has(rule.productId)) {
      continue;
    }
    const product = productById.get(rule.productId);
    if (product?.availability.status === 'available') {
      return { product, reason: locale === 'ru' ? rule.reason : rule.reasonEn };
    }
  }

  return null;
};
