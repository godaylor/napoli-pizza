import type { CatalogSortKey } from '../features/catalog/model/catalog.types';

export interface SortOption {
  readonly label: string;
  readonly labelEn: string;
  readonly value: CatalogSortKey;
}

export const sortOptions = [
  { label: 'по популярности', labelEn: 'most popular', value: 'popular' },
  { label: 'сначала дешевле', labelEn: 'price: low to high', value: 'price-asc' },
  { label: 'сначала дороже', labelEn: 'price: high to low', value: 'price-desc' },
  { label: 'по названию', labelEn: 'name', value: 'name' },
] as const satisfies readonly SortOption[];

export const DEFAULT_SORT: SortOption = sortOptions[0];

export const isCatalogSortKey = (value: string): value is CatalogSortKey =>
  sortOptions.some((option) => option.value === value);
