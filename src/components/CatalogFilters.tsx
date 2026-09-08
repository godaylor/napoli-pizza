import {
  DEFAULT_CATALOG_QUERY,
  hasActiveCatalogQuery,
} from '../lib/catalogQuery';
import { useCatalogQuery } from '../features/catalog/model/useCatalogQuery';
import { useLocale } from '../shared/i18n/useLocale';

function CatalogFilters() {
  const { query, updateQuery } = useCatalogQuery();
  const { t } = useLocale();
  const hasActiveQuery = hasActiveCatalogQuery(query);

  return (
    <div className="catalog-filters">
      <fieldset>
        <legend>{t('Фильтры', 'Filters')}</legend>
        <label>
          <input
            type="checkbox"
            checked={query.vegetarian}
            onChange={(event) =>
              updateQuery({ vegetarian: event.target.checked })
            }
          />
          <span>{t('Без мяса', 'Vegetarian')}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={query.spicy}
            onChange={(event) => updateQuery({ spicy: event.target.checked })}
          />
          <span>{t('Острое', 'Spicy')}</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={query.availability}
            onChange={(event) =>
              updateQuery({ availability: event.target.checked })
            }
          />
          <span>{t('Только доступное', 'Available only')}</span>
        </label>
      </fieldset>
      <button
        type="button"
        className="catalog-filters__reset"
        disabled={!hasActiveQuery}
        onClick={() => updateQuery(DEFAULT_CATALOG_QUERY)}>
        {t('Сбросить всё', 'Reset all')}
      </button>
    </div>
  );
}

export default CatalogFilters;
