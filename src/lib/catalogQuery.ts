import {
  DEFAULT_SORT,
  isCatalogSortKey,
} from '../components/sortOptions';
import {
  CATALOG_CATEGORY_IDS,
  type CatalogCategoryId,
  type CatalogQuery,
} from '../features/catalog/model/catalog.types';

export const DEFAULT_CATALOG_QUERY: CatalogQuery = {
  q: '',
  category: null,
  sort: DEFAULT_SORT.value,
  vegetarian: false,
  spicy: false,
  availability: false,
};

const readSingle = (params: URLSearchParams, key: string): string | null => {
  const values = params.getAll(key);
  return values.length === 1 ? values[0] : null;
};

export const normalizeCatalogSearch = (value: string): string =>
  value.normalize('NFKC').trim().replace(/\s+/g, ' ');

const isCategoryId = (value: string): value is CatalogCategoryId =>
  CATALOG_CATEGORY_IDS.some((categoryId) => categoryId === value);

export const parseCatalogQuery = (search: string): CatalogQuery => {
  const params = new URLSearchParams(search);
  const rawCategory = readSingle(params, 'category');
  const rawSort = readSingle(params, 'sort');

  return {
    q: normalizeCatalogSearch(readSingle(params, 'q') ?? ''),
    category:
      rawCategory && isCategoryId(rawCategory) ? rawCategory : null,
    sort:
      rawSort && isCatalogSortKey(rawSort)
        ? rawSort
        : DEFAULT_CATALOG_QUERY.sort,
    vegetarian: readSingle(params, 'diet') === 'vegetarian',
    spicy: readSingle(params, 'spicy') === '1',
    availability: readSingle(params, 'availability') === '1',
  };
};

export const serializeCatalogQuery = (query: CatalogQuery): string => {
  const params = new URLSearchParams();

  const normalizedQuery = {
    ...query,
    q: normalizeCatalogSearch(query.q),
  };

  if (normalizedQuery.q) {
    params.set('q', normalizedQuery.q);
  }

  if (normalizedQuery.category) {
    params.set('category', normalizedQuery.category);
  }

  if (normalizedQuery.sort !== DEFAULT_CATALOG_QUERY.sort) {
    params.set('sort', normalizedQuery.sort);
  }

  if (normalizedQuery.vegetarian) {
    params.set('diet', 'vegetarian');
  }

  if (normalizedQuery.spicy) {
    params.set('spicy', '1');
  }

  if (normalizedQuery.availability) {
    params.set('availability', '1');
  }

  return params.toString();
};

export const hasActiveCatalogQuery = (query: CatalogQuery): boolean =>
  serializeCatalogQuery(query).length > 0;
