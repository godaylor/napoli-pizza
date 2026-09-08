import type { Locale } from '../../../shared/i18n/locale';

export const CATALOG_VERSION = 1 as const;

export const CATALOG_CATEGORY_IDS = [
  'pizza',
  'combo',
  'snacks',
  'drinks',
  'desserts',
  'sauces',
] as const;

export type CatalogCategoryId = (typeof CATALOG_CATEGORY_IDS)[number];

export type CatalogSortKey =
  | 'popular'
  | 'price-asc'
  | 'price-desc'
  | 'name';

export interface CatalogQuery {
  q: string;
  category: CatalogCategoryId | null;
  sort: CatalogSortKey;
  vegetarian: boolean;
  spicy: boolean;
  availability: boolean;
}

export type ProductKind = CatalogCategoryId;
export type ProductBadge = 'popular' | 'new' | 'vegetarian' | 'spicy';
export type AvailabilityStatus = 'available' | 'sold-out';

export interface CatalogCategory {
  id: CatalogCategoryId;
  label: string;
  eyebrow: string;
  description: string;
}

export interface ProductImage {
  key: string;
  alt: string;
  width: 960;
  height: 960;
}

export interface ProductAvailability {
  status: AvailabilityStatus;
  note: string;
}

export interface ProductNutrition {
  servingGrams: number;
  caloriesKcal: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
}

export interface CatalogProduct {
  id: string;
  slug: string;
  kind: ProductKind;
  categoryId: CatalogCategoryId;
  name: string;
  description: string;
  searchAliases: string[];
  priceFromMinor: number;
  popularity: number;
  badges: ProductBadge[];
  allergens: string[];
  availability: ProductAvailability;
  image: ProductImage;
  variantIds: string[];
  modifierGroupIds: string[];
  nutrition?: ProductNutrition;
}

export interface CatalogSnapshot {
  version: typeof CATALOG_VERSION;
  updatedAt: string;
  categories: CatalogCategory[];
  products: CatalogProduct[];
}

export type CatalogScenario =
  | 'default'
  | 'slow'
  | 'empty'
  | 'error'
  | 'offline'
  | 'stale';

export interface MenuQueryArgs extends CatalogQuery {
  scenario: CatalogScenario;
  locale?: Locale;
}

export interface ProductQueryArgs {
  slug: string;
  scenario?: CatalogScenario;
  locale?: Locale;
}

export interface AvailabilityQueryArgs {
  scenario?: CatalogScenario;
  locale?: Locale;
}

export interface ProductAvailabilityEntry extends ProductAvailability {
  productId: string;
}
