import type { CatalogProduct } from '../model/catalog.types';
import { CATALOG_PRODUCTS } from './catalog.fixture';

export interface FixedComboComponent {
  productId: string;
  label: string;
  quantity: number;
  referencePriceMinor: number;
}

export interface FixedComboDefinition {
  productId: string;
  components: FixedComboComponent[];
  bundlePriceMinor: number;
  referencePriceMinor: number;
  savingMinor: number;
}

const components: FixedComboComponent[] = [
  { productId: '101', label: 'Маргарита Napoli · 30 см', quantity: 1, referencePriceMinor: 79000 },
  { productId: '102', label: 'Пепперони Napoli · 30 см', quantity: 1, referencePriceMinor: 99000 },
  { productId: '403', label: 'Крафтовая кола · 1 л', quantity: 1, referencePriceMinor: 39000 },
];

const referencePriceMinor = components.reduce(
  (total, component) => total + component.referencePriceMinor * component.quantity,
  0,
);
const bundlePriceMinor = 199000;

export const EVENING_FOR_TWO: FixedComboDefinition = {
  productId: '201',
  components,
  bundlePriceMinor,
  referencePriceMinor,
  savingMinor: referencePriceMinor - bundlePriceMinor,
};

export const FIXED_COMBOS_BY_PRODUCT_ID = new Map<string, FixedComboDefinition>([
  [EVENING_FOR_TWO.productId, EVENING_FOR_TWO],
]);

export const getFixedComboIssues = (
  combo: FixedComboDefinition,
  products: readonly CatalogProduct[] = CATALOG_PRODUCTS,
): string[] => {
  const productById = new Map(products.map((product) => [product.id, product]));
  return combo.components.flatMap((component) => {
    const product = productById.get(component.productId);
    if (!product) return [`Компонент «${component.label}» больше не представлен в меню.`];
    return product.availability.status === 'available'
      ? []
      : [`${component.label} недоступен: ${product.availability.note}`];
  });
};

export const getFixedCombo = (productId: string) =>
  FIXED_COMBOS_BY_PRODUCT_ID.get(productId) ?? null;
