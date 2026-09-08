import { Link } from 'react-router-dom';

import { useGetMenuQuery } from '../features/catalog/api/catalogApi';
import { ProductCard } from '../features/catalog/ui/ProductCard';
import { selectFavoriteProductIds } from '../features/favorites/model/favoritesSelectors';
import { toggleFavorite } from '../features/favorites/model/favoritesSlice';
import { DEFAULT_CATALOG_QUERY } from '../lib/catalogQuery';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { useLocale } from '../shared/i18n/useLocale';

export default function Favorites() {
  const { locale, t } = useLocale();
  const favoriteProductIds = useAppSelector(selectFavoriteProductIds);
  const { data, error, isLoading, refetch } = useGetMenuQuery({
    ...DEFAULT_CATALOG_QUERY,
    scenario: 'default',
    locale,
  });

  if (favoriteProductIds.length === 0) {
    return (
      <section className="container favorites-empty">
        <span className="favorites-ring" aria-hidden="true">♡</span>
        <span className="eyebrow">{t('Личная полка / на этом устройстве', 'Personal shelf / this device')}</span>
        <h1>{t('Избранное пока пусто', 'No favorites yet')}</h1>
        <p>{t('Отмечайте позиции сердцем — они останутся здесь после перезагрузки.', 'Tap the heart on an item and it will stay here after a reload.')}</p>
        <Link className="primary-link" to="/menu">{t('Выбрать из меню', 'Browse the menu')}</Link>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="container route-status" aria-busy="true">
        <span className="status-code">LOAD / NAP</span>
        <h1>{t('Открываем избранное', 'Opening favorites')}</h1>
        <p>{t('Сверяем сохранённые позиции с текущим меню.', 'Checking saved items against the current menu.')}</p>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="container route-status" role="alert">
        <span className="status-code">ERROR / NAP</span>
        <h1>{t('Не удалось сверить избранное', 'Could not check favorites')}</h1>
        <p>{t('Сохранённый выбор не потерян. Повторите загрузку текущего меню.', 'Your saved selection is safe. Retry loading the current menu.')}</p>
        <button type="button" onClick={() => void refetch()}>{t('Повторить', 'Retry')}</button>
      </section>
    );
  }

  const productsById = new Map(data.products.map((product) => [product.id, product]));
  const products = favoriteProductIds.flatMap((productId) => {
    const product = productsById.get(productId);
    return product ? [product] : [];
  });
  const missingProductIds = favoriteProductIds.filter(
    (productId) => !productsById.has(productId),
  );
  const unavailableCount = products.filter(
    (product) => product.availability.status === 'sold-out',
  ).length + missingProductIds.length;

  return (
    <div className="container favorites-page">
      <header className="favorites-intro">
        <span className="eyebrow">{t('Сохранено локально / без аккаунта', 'Saved locally / no account')}</span>
        <h1>{t('Избранное', 'Favorites')}</h1>
        <p>
          {favoriteProductIds.length} {t('позиций на этом устройстве. Цены и готовность сверяем с меню при каждом открытии.', 'items on this device. Prices and availability are checked whenever you open this page.')}
        </p>
      </header>

      {unavailableCount > 0 ? (
        <aside className="favorites-notice" role="status">
          <span className="status-code">AVAIL / NAP</span>
          <div>
            <strong>{t('Не всё доступно прямо сейчас', 'Some items are unavailable right now')}</strong>
            <p>{t('Такие позиции остаются в списке, чтобы вы могли проверить их позже.', 'They stay on the list so you can check again later.')}</p>
          </div>
        </aside>
      ) : null}

      {products.length > 0 ? (
        <div className="catalog-grid" aria-label={t('Избранные позиции', 'Favorite items')}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : null}

      {missingProductIds.length > 0 ? (
        <section className="favorites-missing" aria-labelledby="favorites-missing-title">
          <span className="status-code">REMOVED / NAP</span>
          <h2 id="favorites-missing-title">{t('Позиция ушла из меню', 'Item removed from menu')}</h2>
          <p>
            {t('Сохранённая позиция больше не найдена. Уберите её из избранного через кнопку ниже или вернитесь позже.', 'This saved item is no longer available. Remove it below or check again later.')}
          </p>
          {missingProductIds.map((productId) => (
            <MissingFavorite key={productId} productId={productId} />
          ))}
        </section>
      ) : null}
    </div>
  );
}

function MissingFavorite({ productId }: { productId: string }) {
  const dispatch = useAppDispatch();
  const { t } = useLocale();
  return (
    <button type="button" onClick={() => dispatch(toggleFavorite(productId))}>
      {t('Убрать недоступную позицию', 'Remove unavailable item')}
    </button>
  );
}
