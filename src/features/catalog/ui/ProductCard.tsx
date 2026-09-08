import { Link, useLocation } from 'react-router-dom';

import { useAppDispatch } from '../../../redux/hooks';
import { preloadProductPage } from '../../../routes/lazyRoutes';
import { FavoriteToggle } from '../../favorites/ui/FavoriteToggle';
import { formatMinorMoney } from '../../../shared/lib/money';
import { catalogApi } from '../api/catalogApi';
import { BADGE_LABELS_BY_LOCALE } from '../data/catalogLocalization';
import { useLocale } from '../../../shared/i18n/useLocale';
import type { CatalogProduct } from '../model/catalog.types';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: CatalogProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const location = useLocation();
  const headingId = `product-${product.id}`;
  const soldOut = product.availability.status === 'sold-out';
  const returnTo = `${location.pathname}${location.search}`;
  const preload = () => {
    void preloadProductPage();
    dispatch(
      catalogApi.util.prefetch(
        'getProduct',
        { slug: product.slug, locale },
        { force: false },
      ),
    );
  };

  return (
    <article
      className={`product-card${soldOut ? ' product-card--unavailable' : ''}`}
      aria-labelledby={headingId}
      data-product-card={product.slug}>
      <FavoriteToggle
        className="favorite-toggle--card"
        productId={product.id}
        productName={product.name}
      />
      <Link
        className="product-card__link"
        to={`/menu/${product.slug}`}
        state={{ returnTo }}
        onFocus={preload}
        onMouseEnter={preload}
        onPointerDown={preload}>
        <div className="product-card__media">
          <ProductImage image={product.image} name={product.name} priority={priority} />
          <span className="product-card__stamp" aria-hidden="true">
            napoli
          </span>
        </div>
        <div className="product-card__body">
          {product.badges.length > 0 ? (
            <ul className="product-card__badges" aria-label={t('Особенности продукта', 'Product features')}>
              {product.badges.map((badge) => (
                <li key={badge} data-badge={badge}>
                  {BADGE_LABELS_BY_LOCALE[locale][badge]}
                </li>
              ))}
            </ul>
          ) : (
            <span className="product-card__badge-spacer" aria-hidden="true" />
          )}
          <h3 id={headingId}>{product.name}</h3>
          <p className="product-card__description">{product.description}</p>
          <p className="product-card__allergens">
            <span>{t('Аллергены', 'Allergens')}</span>
            {product.allergens.length > 0 ? product.allergens.join(', ') : t('не заявлены', 'none listed')}
          </p>
          <div className="product-card__footer">
            <strong>{t('от', 'from')} {formatMinorMoney(product.priceFromMinor)} ₽</strong>
            <span
              className={`availability availability--${product.availability.status}`}>
              {soldOut ? t('Временно закончилась', 'Sold out') : t('Открыть', 'Open')}
            </span>
          </div>
          {soldOut ? (
            <p className="product-card__availability-note">{product.availability.note}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
