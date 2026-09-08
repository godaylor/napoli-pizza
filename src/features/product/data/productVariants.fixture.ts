import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';
import type { CatalogProduct } from '../../catalog/model/catalog.types';
import type {
  DoughType,
  PizzaSizeCm,
  ProductVariant,
} from '../model/product.types';

const PIZZA_MATRIX: ReadonlyArray<{
  sizeCm: PizzaSizeCm;
  dough: DoughType;
  priceDeltaMinor: number;
  weightGrams: number;
}> = [
  { sizeCm: 25, dough: 'thin', priceDeltaMinor: 0, weightGrams: 360 },
  { sizeCm: 25, dough: 'traditional', priceDeltaMinor: 0, weightGrams: 400 },
  { sizeCm: 30, dough: 'thin', priceDeltaMinor: 20000, weightGrams: 510 },
  { sizeCm: 30, dough: 'traditional', priceDeltaMinor: 20000, weightGrams: 560 },
  { sizeCm: 35, dough: 'traditional', priceDeltaMinor: 40000, weightGrams: 760 },
];

const createPizzaVariants = (product: CatalogProduct): ProductVariant[] =>
  PIZZA_MATRIX.map((entry) => {
    const id = `${product.id}-${entry.sizeCm}-${entry.dough}`;
    const unavailable = product.id === '101' && entry.sizeCm === 35;

    return {
      id,
      productId: product.id,
      sizeCm: entry.sizeCm,
      dough: entry.dough,
      weightGrams: entry.weightGrams,
      basePriceMinor: product.priceFromMinor + entry.priceDeltaMinor,
      available: !unavailable,
      unavailableReason: unavailable
        ? 'Размер 35 см временно недоступен: большая заготовка закончилась.'
        : undefined,
    };
  });

const createFixedVariant = (product: CatalogProduct): ProductVariant => ({
  id: `${product.id}-base`,
  productId: product.id,
  sizeCm: null,
  dough: null,
  weightGrams: 0,
  basePriceMinor: product.priceFromMinor,
  available: product.availability.status === 'available',
  unavailableReason:
    product.availability.status === 'sold-out'
      ? product.availability.note
      : undefined,
});

export const PRODUCT_VARIANTS: ProductVariant[] = CATALOG_PRODUCTS.flatMap(
  (product) =>
    product.kind === 'pizza'
      ? createPizzaVariants(product)
      : [createFixedVariant(product)],
);

export const PRODUCT_VARIANTS_BY_ID = new Map(
  PRODUCT_VARIANTS.map((variant) => [variant.id, variant]),
);

export const getProductVariants = (productId: string): ProductVariant[] =>
  PRODUCT_VARIANTS.filter((variant) => variant.productId === productId);
