import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CATALOG_PRODUCTS } from '../../catalog/data/catalog.fixture';

import {
  getFixedCombo,
  getFixedComboIssues,
} from '../../catalog/data/fixedCombos.fixture';
import {
  addConfiguration,
  createBaseConfiguration,
} from '../../cart/model/cartSlice';
import { useAppDispatch } from '../../../redux/hooks';
import { formatMinorMoney } from '../../../shared/lib/money';
import { useLocale } from '../../../shared/i18n/useLocale';
import { localizeCatalogProduct } from '../../catalog/data/catalogLocalization';
import type { ProductDetails } from '../model/product.types';

interface FixedProductPurchaseProps {
  details: ProductDetails;
  returnTo: string;
}

export function FixedProductPurchase({
  details,
  returnTo,
}: FixedProductPurchaseProps) {
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const [announcement, setAnnouncement] = useState('');
  const [componentScenario, setComponentScenario] = useState<'default' | 'cola-unavailable'>('default');
  const { product, variants } = details;
  const variant = variants[0];
  const comboBase = getFixedCombo(product.id);
  const localizedProducts = CATALOG_PRODUCTS.map((candidate) => localizeCatalogProduct(candidate, locale));
  const comboProducts = componentScenario === 'cola-unavailable'
    ? localizedProducts.map((candidate) =>
        candidate.id === '403'
          ? {
              ...candidate,
              availability: {
                status: 'sold-out' as const,
                note: t('Крафтовая кола закончилась. Скрытых замен нет.', 'Craft cola is sold out. There are no hidden substitutions.'),
              },
            }
          : candidate,
      )
    : localizedProducts;
  const combo = comboBase ? {
    ...comboBase,
    components: comboBase.components.map((component) => {
      const componentProduct = comboProducts.find((candidate) => candidate.id === component.productId);
      const measure = component.productId === '403'
        ? (locale === 'ru' ? '1 л' : '1 L')
        : (locale === 'ru' ? '30 см' : '30 cm');
      return { ...component, label: `${componentProduct?.name ?? component.label} · ${measure}` };
    }),
  } : null;
  const comboIssues = combo ? getFixedComboIssues(combo, comboProducts) : [];
  const productIssue = product.availability.status === 'available'
    ? null
    : product.availability.note;
  const firstIssue = productIssue ?? variant?.unavailableReason ?? comboIssues[0] ?? null;
  const canAdd = Boolean(variant?.available) && !firstIssue;

  const add = () => {
    if (!variant || !canAdd) return;
    dispatch(addConfiguration(createBaseConfiguration(product.id, variant.id)));
    setAnnouncement(locale === 'ru' ? `${product.name} добавлен в корзину за ${formatMinorMoney(variant.basePriceMinor)} ₽.` : `${product.name} added to cart for ${formatMinorMoney(variant.basePriceMinor)} ₽.`);
  };

  return (
    <div className="product-configurator fixed-product-purchase">
      {combo ? (
        <section className="fixed-combo" aria-labelledby="combo-composition-heading">
          <span className="status-code">FIXED / NAP</span>
          <h2 id="combo-composition-heading">{t('Фиксированный состав', 'Fixed contents')}</h2>
          <p>{t('Без замен и скрытых слотов: набор приезжает именно в этом составе.', 'No substitutions or hidden slots: the combo arrives exactly as listed.')}</p>
          <ul>
            {combo.components.map((component) => (
              <li key={component.label}>
                <span>{component.label}</span>
                <strong>× {component.quantity}</strong>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>{t('По отдельности', 'Separately')}</dt>
              <dd>{formatMinorMoney(combo.referencePriceMinor)} ₽</dd>
            </div>
            <div>
              <dt>{t('Цена набора', 'Combo price')}</dt>
              <dd>{formatMinorMoney(combo.bundlePriceMinor)} ₽</dd>
            </div>
            <div>
              <dt>{t('Выгода', 'You save')}</dt>
              <dd>{formatMinorMoney(combo.savingMinor)} ₽</dd>
            </div>
          </dl>
        </section>
      ) : null}

      {combo ? (
        <details className="demo-controls product-demo-controls">
          <summary>{t('Проверить доступность состава', 'Test component availability')}</summary>
          <div>
            <label htmlFor="combo-component-scenario">{t('Демо-сценарий', 'Demo scenario')}</label>
            <select
              id="combo-component-scenario"
              value={componentScenario}
              onChange={(event) => setComponentScenario(event.target.value as typeof componentScenario)}>
              <option value="default">{t('Весь состав доступен', 'All components are available')}</option>
              <option value="cola-unavailable">{t('Крафтовая кола закончилась', 'Craft cola is sold out')}</option>
            </select>
            <p>{t('Набор не заменяет компоненты автоматически.', 'The combo never substitutes components automatically.')}</p>
          </div>
        </details>
      ) : null}

      {firstIssue ? (
        <div className="configuration-issue" role="alert">
          <strong>{t('Позиция временно недоступна', 'Item temporarily unavailable')}</strong>
          <p>{firstIssue}</p>
        </div>
      ) : null}

      <div className="product-sticky-cta" data-sticky-cta>
        <button type="button" disabled={!canAdd} onClick={add}>
          {variant
            ? `${t('Добавить за', 'Add for')} ${formatMinorMoney(variant.basePriceMinor)} ₽`
            : t('Позиция недоступна', 'Item unavailable')}
        </button>
        {announcement ? (
          <Link className="secondary-link" to="/cart" state={{ returnTo }}>
            {t('Открыть корзину', 'Open cart')}
          </Link>
        ) : null}
      </div>
      <p className="visually-hidden" role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}
