import type { CatalogProduct } from '../../catalog/model/catalog.types';

export type PizzaSizeCm = 25 | 30 | 35;
export type DoughType = 'thin' | 'traditional';

export interface ProductVariant {
  id: string;
  productId: string;
  sizeCm: PizzaSizeCm | null;
  dough: DoughType | null;
  weightGrams: number;
  basePriceMinor: number;
  available: boolean;
  unavailableReason?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  removalLabel: string;
  searchAliases: string[];
  allergens: string[];
}

export interface ProductIngredient {
  productId: string;
  ingredientId: string;
  removable: boolean;
}

export interface Modifier {
  id: string;
  name: string;
  priceDeltaMinor: number;
  available: boolean;
  unavailableReason?: string;
}

export interface ModifierGroup {
  id: string;
  name: string;
  min: number;
  max: number;
  required: boolean;
  modifierIds: string[];
}

export interface ProductDetails {
  product: CatalogProduct;
  variants: ProductVariant[];
  ingredients: Ingredient[];
  productIngredients: ProductIngredient[];
  modifierGroups: ModifierGroup[];
  modifiers: Modifier[];
}