import type {
  DoughType,
  PizzaSizeCm,
  ProductVariant,
} from './product.types';
import type { Locale } from '../../../shared/i18n/locale';

export const PIZZA_SIZES: readonly PizzaSizeCm[] = [25, 30, 35];
export const PIZZA_DOUGHS: readonly DoughType[] = ['thin', 'traditional'];

export const DOUGH_LABELS: Record<DoughType, string> = {
  thin: 'Тонкое',
  traditional: 'Традиционное',
};

export const getDoughLabel = (dough: DoughType, locale: Locale = 'ru') =>
  locale === 'ru' ? DOUGH_LABELS[dough] : dough === 'thin' ? 'Thin' : 'Traditional';

export const findProductVariant = (
  variants: readonly ProductVariant[],
  sizeCm: PizzaSizeCm,
  dough: DoughType,
): ProductVariant | undefined =>
  variants.find(
    (variant) => variant.sizeCm === sizeCm && variant.dough === dough,
  );

export const getVariantIssue = (
  variants: readonly ProductVariant[],
  sizeCm: PizzaSizeCm,
  dough: DoughType,
  locale: Locale = 'ru',
): string | null => {
  const variant = findProductVariant(variants, sizeCm, dough);

  if (!variant) {
    return locale === 'ru'
      ? `Для размера ${sizeCm} см тесто «${DOUGH_LABELS[dough]}» не готовим.`
      : `${getDoughLabel(dough, locale)} dough is not available for the ${sizeCm} cm size.`;
  }

  if (!variant.available) {
    return variant.unavailableReason ?? (locale === 'ru' ? 'Этот вариант временно недоступен.' : 'This variant is temporarily unavailable.');
  }

  return null;
};

export const formatVariantSummary = (variant: ProductVariant, locale: Locale = 'ru'): string => {
  if (variant.sizeCm === null || variant.dough === null) {
    return variant.weightGrams > 0 ? `${variant.weightGrams} ${locale === 'ru' ? 'г' : 'g'}` : locale === 'ru' ? 'Фиксированный вариант' : 'Fixed variant';
  }

  return locale === 'ru'
    ? `${variant.sizeCm} см · ${DOUGH_LABELS[variant.dough]} тесто · ${variant.weightGrams} г`
    : `${variant.sizeCm} cm · ${getDoughLabel(variant.dough, locale)} dough · ${variant.weightGrams} g`;
};
export const getVariantPriceMinor = (variant: ProductVariant): number => {
  if (!Number.isSafeInteger(variant.basePriceMinor) || variant.basePriceMinor < 0) {
    throw new RangeError('Variant price must be a non-negative integer in minor units.');
  }

  return variant.basePriceMinor;
};
