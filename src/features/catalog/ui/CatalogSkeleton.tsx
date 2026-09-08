const ProductSkeleton = () => (
  <article className="product-card product-card--skeleton" aria-hidden="true">
    <div className="product-card__media skeleton-pulse" />
    <div className="product-card__body">
      <span className="skeleton-line skeleton-line--badge skeleton-pulse" />
      <span className="skeleton-line skeleton-pulse" />
      <span className="skeleton-line skeleton-line--long skeleton-pulse" />
      <span className="skeleton-line skeleton-line--price skeleton-pulse" />
    </div>
  </article>
);

export function CatalogSkeleton() {
  const { t } = useLocale();
  return (
    <section className="catalog-section" aria-labelledby="catalog-loading-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">{t('Печи разогреваются', 'The ovens are heating')}</span>
          <h2 id="catalog-loading-heading">{t('Загружаем меню', 'Loading the menu')}</h2>
        </div>
        <span>{t('несколько секунд', 'a few seconds')}</span>
      </div>
      <div className="catalog-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    </section>
  );
}
import { useLocale } from '../../../shared/i18n/useLocale';
