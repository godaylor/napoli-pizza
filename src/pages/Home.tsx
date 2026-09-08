import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import CatalogFilters from '../components/CatalogFilters';
import Categories from '../components/Categories';
import Sort from '../components/Sort';
import {
  catalogApi,
  isCatalogApiError,
  useGetMenuQuery,
} from '../features/catalog/api/catalogApi';
import { CatalogSkeleton } from '../features/catalog/ui/CatalogSkeleton';
import { DemoCatalogControls } from '../features/catalog/ui/DemoCatalogControls';
import { ProductCard } from '../features/catalog/ui/ProductCard';
import type { CatalogScenario } from '../features/catalog/model/catalog.types';
import { useCatalogQuery } from '../features/catalog/model/useCatalogQuery';
import {
  DEFAULT_CATALOG_QUERY,
  hasActiveCatalogQuery,
  serializeCatalogQuery,
} from '../lib/catalogQuery';
import { useOnlineStatus } from '../lib/useOnlineStatus';
import { useAppDispatch } from '../redux/hooks';
import { useLocale } from '../shared/i18n/useLocale';


const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const { query, updateQuery } = useCatalogQuery();
  const isOnline = useOnlineStatus();
  const [scenario, setScenario] = useState<CatalogScenario>('default');

  const normalizedSearch = useMemo(() => serializeCatalogQuery(query), [query]);

  useEffect(() => {
    const currentSearch = location.search.replace(/^\?/, '');

    if (currentSearch !== normalizedSearch) {
      navigate(
        {
          pathname: '/menu',
          search: normalizedSearch ? `?${normalizedSearch}` : '',
        },
        { replace: true },
      );
    }
  }, [location.search, navigate, normalizedSearch]);

  const queryArgs = useMemo(
    () => ({ ...query, scenario, locale }),
    [locale, query, scenario],
  );

  const {
    data: catalog,
    currentData,
    error,
    isFetching,
    isLoading,
    refetch,
  } = useGetMenuQuery(queryArgs);

  useEffect(() => {
    if (
      isOnline &&
      scenario !== 'offline' &&
      isCatalogApiError(error) &&
      error.data.code === 'offline'
    ) {
      void refetch();
    }
  }, [error, isOnline, refetch, scenario]);

  const changeScenario = useCallback(
    (nextScenario: CatalogScenario) => {
      if (nextScenario !== 'stale') {
        dispatch(catalogApi.util.resetApiState());
      }
      setScenario(nextScenario);
    },
    [dispatch],
  );

  const normalizedError = isCatalogApiError(error) ? error : undefined;
  const visibleCatalog = scenario === 'stale' ? catalog : currentData;
  const firstLoadFailed = Boolean(normalizedError && !visibleCatalog);
  const isOfflineError = normalizedError?.data.code === 'offline';
  const isStale = Boolean(visibleCatalog && (isFetching || normalizedError));
  const hasProducts = Boolean(visibleCatalog?.products.length);
  const hasDiscoveryQuery = hasActiveCatalogQuery(query);
  const firstRecovery = query.q
    ? { label: t('Очистить поиск', 'Clear search'), patch: { q: '' } }
    : query.vegetarian
      ? { label: t('Снять фильтр «Без мяса»', 'Remove “Vegetarian” filter'), patch: { vegetarian: false } }
      : query.spicy
        ? { label: t('Снять фильтр «Острое»', 'Remove “Spicy” filter'), patch: { spicy: false } }
        : query.availability
          ? {
              label: t('Показать временно недоступные позиции', 'Show sold-out items'),
              patch: { availability: false },
            }
          : query.category
            ? { label: t('Показать все категории', 'Show all categories'), patch: { category: null } }
            : null;
  const isDiscoveryEmpty = Boolean(
    visibleCatalog &&
      !hasProducts &&
      !firstLoadFailed &&
      scenario !== 'empty' &&
      hasDiscoveryQuery,
  );

  const sections = useMemo(
    () =>
      visibleCatalog?.categories
        .map((category) => ({
          ...category,
          products: visibleCatalog.products.filter(
            (product) => product.categoryId === category.id,
          ),
        }))
        .filter((section) => section.products.length > 0) ?? [],
    [visibleCatalog],
  );

  return (
    <div className="container menu-page">
      <div className="menu-intro">
        <span className="eyebrow">Napoli · {t('открытая кухня', 'open kitchen')}</span>
        <h1>{t('Меню', 'Menu')}</h1>
        <p>
          {t(
            'Пицца из печи, готовые комбо и небольшие блюда к столу. Готовим после заказа и честно показываем, если позиция временно недоступна.',
            'Oven-baked pizza, set combos, and small plates for the table. We cook after you order and clearly mark anything that is temporarily unavailable.',
          )}
        </p>
      </div>

      <div className="catalog-toolbar">
        <Categories />
        <Sort />
      </div>

      <CatalogFilters />

      <p
        className="catalog-result-count"
        role="status"
        aria-live="polite"
        aria-atomic="true">
        {visibleCatalog
          ? `${t('Найдено позиций', 'Items found')}: ${visibleCatalog.products.length}`
          : t('Загружаем результаты', 'Loading results')}
      </p>

      <DemoCatalogControls scenario={scenario} onChange={changeScenario} />

      {isStale ? (
        <div className="catalog-notice" role="status" aria-live="polite">
          <span className="status-code">
            {normalizedError ? 'STALE / NAP' : 'SYNC / NAP'}
          </span>
          <div>
            <strong>
              {normalizedError
                ? t('Не удалось обновить меню — показываем предыдущие данные', 'Could not refresh the menu — showing the previous data')
                : t('Обновляем меню, предыдущие позиции доступны', 'Refreshing the menu; previous items remain available')}
            </strong>
            <p>
              {(locale === 'ru' ? normalizedError?.data.message : normalizedError
                ? normalizedError.data.code === 'offline'
                  ? 'No internet connection.'
                  : 'The kitchen did not respond to the menu request.'
                : undefined) ??
                t('Цены и доступность уточняются в фоне.', 'Prices and availability are updating in the background.')}
            </p>
          </div>
          {normalizedError ? (
            <button type="button" onClick={() => void refetch()} disabled={!isOnline}>
              {t('Повторить обновление', 'Retry refresh')}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="catalog-content" aria-busy={isFetching}>
        {(isLoading || (isFetching && !visibleCatalog)) && !firstLoadFailed ? (
          <CatalogSkeleton />
        ) : null}

        {firstLoadFailed ? (
          <section className="catalog-status" role="alert">
            <span className="status-code">
              {isOfflineError ? 'OFFLINE / NAP' : 'ERROR / NAP'}
            </span>
            <h2>
              {isOfflineError
                ? t('Нет соединения с интернетом', 'No internet connection')
                : t('Не удалось загрузить каталог', 'Could not load the menu')}
            </h2>
            <p>
              {isOfflineError
                ? t('Навигация Napoli доступна. Верните соединение или выберите обычный демо-сценарий.', 'Napoli navigation is available. Reconnect or choose the normal demo scenario.')
                : locale === 'ru'
                  ? normalizedError?.data.message
                  : 'The kitchen did not respond to the menu request.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              disabled={!isOnline && isOfflineError}>
              {t('Повторить', 'Retry')}
            </button>
          </section>
        ) : null}

        {visibleCatalog && !hasProducts && !firstLoadFailed ? (
          <section className="catalog-status">
            <span className="status-code">EMPTY / NAP</span>
            <h2>{isDiscoveryEmpty ? t('Ничего не нашли', 'No results') : t('В меню ничего не найдено', 'The menu is empty')}</h2>
            <p>
              {isDiscoveryEmpty
                ? t('Сочетание поиска и фильтров не дало результатов. Снимите одно условие или верните полное меню.', 'This search and filter combination returned no results. Remove one condition or restore the full menu.')
                : t('Для проверки полного меню верните демо-сценарий «Обычная загрузка».', 'Choose the “Normal load” demo scenario to restore the full menu.')}
            </p>
            {isDiscoveryEmpty ? (
              <div className="catalog-status__actions">
                {firstRecovery ? (
                  <button
                    type="button"
                    onClick={() => updateQuery(firstRecovery.patch)}>
                    {firstRecovery.label}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="secondary-action"
                  onClick={() => updateQuery(DEFAULT_CATALOG_QUERY)}>
                  {t('Сбросить все условия', 'Reset all conditions')}
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {hasProducts
          ? sections.map((section, sectionIndex) => (
              <section
                className="catalog-section"
                aria-labelledby={`category-${section.id}`}
                key={section.id}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">{section.eyebrow}</span>
                    <h2 id={`category-${section.id}`}>{section.label}</h2>
                    <p>{section.description}</p>
                  </div>
                  <span>{section.products.length} {t('позиций', 'items')}</span>
                </div>
                <div className="catalog-grid">
                  {section.products.map((product, productIndex) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={sectionIndex === 0 && productIndex < 4}
                    />
                  ))}
                </div>
              </section>
            ))
          : null}
      </div>
    </div>
  );
};

export default Home;
