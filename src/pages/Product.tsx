import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  isCatalogApiError,
  useGetProductQuery,
} from '../features/catalog/api/catalogApi';
import { ProductImage } from '../features/catalog/ui/ProductImage';
import { FavoriteToggle } from '../features/favorites/ui/FavoriteToggle';
import type { ProductDetails } from '../features/product/model/product.types';
import { FixedProductPurchase } from '../features/product/ui/FixedProductPurchase';
import { PizzaConfigurator } from '../features/product/ui/PizzaConfigurator';
import { useLocale } from '../shared/i18n/useLocale';
import { BRAND_NAME } from '../shared/i18n/locale';

interface DiscoveryLocationState {
  returnTo?: unknown;
  editFingerprint?: unknown;
}

const readReturnTo = (state: unknown): string => {
  const returnTo = (state as DiscoveryLocationState | null)?.returnTo;
  return typeof returnTo === 'string' && /^(?:\/menu(?:\?|$)|\/cart$|\/favorites$)/.test(returnTo)
    ? returnTo
    : '/menu';
};

const readEditFingerprint = (state: unknown): string | undefined => {
  const fingerprint = (state as DiscoveryLocationState | null)?.editFingerprint;
  return typeof fingerprint === 'string' && /^cfg1-[a-f0-9]{8}$/.test(fingerprint)
    ? fingerprint
    : undefined;
};

interface ProductContentProps {
  details: ProductDetails;
  returnTo: string;
  editFingerprint?: string;
}

function ProductContent({ details, returnTo, editFingerprint }: ProductContentProps) {
  const { t } = useLocale();
  const { product, variants } = details;
  const weightRange = useMemo(() => {
    const weights = variants
      .map((variant) => variant.weightGrams)
      .filter((weight) => weight > 0);
    return weights.length > 0
      ? `${Math.min(...weights)}–${Math.max(...weights)} ${t('г', 'g')}`
      : null;
  }, [t, variants]);

  return (
    <div className="container product-page">
      <Link className="product-back-link" to={returnTo}>← {t('Вернуться', 'Back')} {returnTo === '/cart' ? t('в корзину', 'to cart') : t('к меню', 'to menu')}</Link>
      <div className="product-layout">
        <div className="product-hero-media">
          <ProductImage image={product.image} name={product.name} priority />
          <span className="product-oven-ring" aria-hidden="true">N</span>
        </div>
        <article className="product-details">
          <span className="eyebrow">{t('Пицца из печи', 'Oven-baked pizza')} / Napoli</span>
          <h1>{product.name}</h1>
          <FavoriteToggle
            className="favorite-toggle--details"
            productId={product.id}
            productName={product.name}
          />
          <p className="product-composition"><strong>{t('Состав:', 'Ingredients:')}</strong> {product.description}</p>
          <dl className="product-facts">
            {weightRange ? <><dt>{t('Вес', 'Weight')}</dt><dd>{weightRange}</dd></> : null}
            <dt>{t('Аллергены', 'Allergens')}</dt>
            <dd>{product.allergens.length > 0 ? product.allergens.join(', ') : t('не заявлены', 'none listed')}</dd>
            <dt>{t('Готовность', 'Availability')}</dt>
            <dd>{product.availability.note}</dd>
          </dl>
          {product.nutrition ? (
            <section className="nutrition" aria-labelledby="nutrition-heading">
              <h2 id="nutrition-heading">{t('На', 'Per')} {product.nutrition.servingGrams} {t('г', 'g')}</h2>
              <ul>
                <li><strong>{product.nutrition.caloriesKcal}</strong><span>{t('ккал', 'kcal')}</span></li>
                <li><strong>{product.nutrition.proteinGrams}</strong><span>{t('белки', 'protein')}</span></li>
                <li><strong>{product.nutrition.fatGrams}</strong><span>{t('жиры', 'fat')}</span></li>
                <li><strong>{product.nutrition.carbohydrateGrams}</strong><span>{t('углеводы', 'carbs')}</span></li>
              </ul>
            </section>
          ) : null}
          {product.kind === 'pizza' ? (
            <PizzaConfigurator
              key={editFingerprint ?? 'new'}
              details={details}
              returnTo={returnTo}
              editFingerprint={editFingerprint}
            />
          ) : (
            <FixedProductPurchase details={details} returnTo={returnTo} />
          )}
        </article>
      </div>
    </div>
  );
}

export default function Product() {
  const { locale, t } = useLocale();
  const { productSlug = '' } = useParams();
  const location = useLocation();
  const returnTo = readReturnTo(location.state);
  const editFingerprint = readEditFingerprint(location.state);
  const { data, error, isLoading, isFetching, refetch } = useGetProductQuery({
    slug: productSlug,
    locale,
  });
  const normalizedError = isCatalogApiError(error) ? error : undefined;
  const notFound = normalizedError?.status === 404;

  useEffect(() => {
    document.title = `${data?.product.name ?? t('Продукт', 'Product')} — ${BRAND_NAME}`;
  }, [data?.product.name, locale, t]);

  if (isLoading) {
    return (
      <section className="container route-status" aria-busy="true">
        <span className="status-code">LOAD / NAP</span>
        <h1>{t('Открываем продукт', 'Opening product')}</h1>
        <p>{t('Уточняем варианты, вес и доступность.', 'Checking variants, weight, and availability.')}</p>
      </section>
    );
  }

  if (normalizedError && !data) {
    return (
      <section className="container route-status" role={notFound ? undefined : 'alert'}>
        <span className="status-code">{notFound ? '404 / NAP' : 'ERROR / NAP'}</span>
        <h1>{notFound ? t('Такого продукта нет', 'Product not found') : t('Не удалось открыть продукт', 'Could not open product')}</h1>
        <p>{locale === 'ru'
          ? normalizedError.data.message
          : notFound
            ? 'This product is not in the menu.'
            : normalizedError.data.code === 'offline'
              ? 'No internet connection.'
              : 'The kitchen did not respond to the product request.'}</p>
        <div className="route-error__actions">
          {!notFound ? <button type="button" onClick={() => void refetch()}>{t('Повторить', 'Retry')}</button> : null}
          <Link className="secondary-link" to={returnTo}>{t('Вернуться в меню', 'Back to menu')}</Link>
        </div>
      </section>
    );
  }

  return data ? (
    <div aria-busy={isFetching}>
      <ProductContent details={data} returnTo={returnTo} editFingerprint={editFingerprint} />
    </div>
  ) : null;
}
