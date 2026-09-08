import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CATALOG_QUERY,
  parseCatalogQuery,
  serializeCatalogQuery,
} from './catalogQuery';

describe('catalog query boundary', () => {
  it('normalizes unknown, duplicate, false and legacy values to defaults', () => {
    expect(
      parseCatalogQuery(
        '?category=pizza&category=combo&sort=broken&spicy=0&availability=yes&activeCategory=2&currentPage=9&unexpected=x',
      ),
    ).toEqual(DEFAULT_CATALOG_QUERY);
  });

  it('parses every canonical discovery parameter', () => {
    expect(
      parseCatalogQuery(
        '?q=трюфель&category=pizza&sort=price-asc&diet=vegetarian&spicy=1&availability=1',
      ),
    ).toEqual({
      q: 'трюфель',
      category: 'pizza',
      sort: 'price-asc',
      vegetarian: true,
      spicy: true,
      availability: true,
    });
  });

  it('serializes in canonical order, omits defaults and round-trips', () => {
    const query = parseCatalogQuery(
      '?availability=1&spicy=1&diet=vegetarian&sort=price-asc&category=pizza&q=трюфель',
    );
    const serialized = serializeCatalogQuery(query);

    expect(serialized).toBe(
      'q=%D1%82%D1%80%D1%8E%D1%84%D0%B5%D0%BB%D1%8C&category=pizza&sort=price-asc&diet=vegetarian&spicy=1&availability=1',
    );
    expect(parseCatalogQuery(`?${serialized}`)).toEqual(query);
    expect(serializeCatalogQuery(DEFAULT_CATALOG_QUERY)).toBe('');
  });

  it('normalizes Unicode and whitespace without losing Russian search', () => {
    const query = parseCatalogQuery('?q=%20%20Трюфель%20%20сыр%20');

    expect(query.q).toBe('Трюфель сыр');
    expect(parseCatalogQuery(`?${serializeCatalogQuery(query)}`)).toEqual(query);
  });
});