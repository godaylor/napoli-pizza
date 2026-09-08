import type { CatalogSortKey } from '../features/catalog/model/catalog.types';
import { useCatalogQuery } from '../features/catalog/model/useCatalogQuery';
import { sortOptions } from './sortOptions';
import { useLocale } from '../shared/i18n/useLocale';

function Sort() {
  const { query, updateQuery } = useCatalogQuery();
  const { locale, t } = useLocale();

  return (
    <label className="sort" htmlFor="catalog-sort">
      <span>{t('Сначала', 'Sort')}</span>
      <select
        id="catalog-sort"
        value={query.sort}
        onChange={(event) =>
          updateQuery({ sort: event.target.value as CatalogSortKey })
        }>
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {locale === 'ru' ? option.label : option.labelEn}
          </option>
        ))}
      </select>
    </label>
  );
}

export default Sort;
