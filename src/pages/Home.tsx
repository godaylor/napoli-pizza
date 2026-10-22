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
import styles from './Home.module.scss';
import { RevealSection } from '../shared/motion/RevealSection';


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
      <div className={styles.intro}>
        <div className={styles.introCopy}>
          <span className="eyebrow">Napoli · {t('городская пиццерия', 'urban pizzeria')}</span>
          <h1>{t('Меню', 'Menu')}</h1>
          <p>{t('Пицца из печи. Для себя и всей компании.', 'Oven-baked pizza. For you and your favourite people.')}</p>
          <span className={styles.serviceNote}>{t('Доставка и самовывоз', 'Delivery & pickup')}</span>
        </div>
        <div className={styles.oven} aria-hidden="true">
          <div className={styles.ovenRing} />
          <picture>
            <source type="image/avif" srcSet="/menu/pizza-margherita-480.avif 480w, /menu/pizza-margherita-960.avif 960w" sizes="(max-width: 639px) 150px, 320px" />
            <source type="image/webp" srcSet="/menu/pizza-margherita-480.webp 480w, /menu/pizza-margherita-960.webp 960w" sizes="(max-width: 639px) 150px, 320px" />
            <img src="/menu/pizza-margherita-480.jpg" alt="" width="480" height="480" loading="eager" decoding="async" {...{ fetchpriority: 'high' }} />
          </picture>
        </div>
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
          ? sections.map((section) => (
              <RevealSection
                className="catalog-section"
                aria-labelledby={`category-${section.id}`}
                key={section.id}>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">{section.eyebrow}</span>
                    <h2 id={`category-${section.id}`}>{section.label}</h2>
                    <p>{section.description}</p>
                  </div>
                  <span>{t('В меню:', 'Items:')} {section.products.length}</span>
                </div>
                <div className="catalog-grid">
                  {section.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>
              </RevealSection>
            ))
          : null}
      </div>
      <div className={styles.demoArea}>
        <DemoCatalogControls scenario={scenario} onChange={changeScenario} />
      </div>
    </div>
  );
};

export default Home;
