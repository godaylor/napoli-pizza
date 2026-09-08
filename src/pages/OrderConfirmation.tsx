import { Link, useParams } from 'react-router-dom';

import { getDemoOrderRepository } from '../features/order/persistence/DemoOrderRepository';
import { formatMinorMoney } from '../shared/lib/money';
import styles from './OrderConfirmation.module.scss';
import { useLocale } from '../shared/i18n/useLocale';
import { CATALOG_PRODUCTS } from '../features/catalog/data/catalog.fixture';
import { localizeCatalogProduct } from '../features/catalog/data/catalogLocalization';
import { localizeOrderLabel } from '../features/order/model/orderLocalization';
import { serializeCartConfiguration, summarizeCartConfiguration } from '../features/cart/model/cartConfiguration';
import { buildProductDetails } from '../features/product/data/productConfiguration.fixture';

export default function OrderConfirmation() {
  const { locale, t } = useLocale();
  const { orderId = '' } = useParams();
  const order = getDemoOrderRepository().getActive(orderId);

  if (!order) {
    return (
      <section className="container route-status">
        <span className="status-code">{t('ЗАКАЗ / НЕ НАЙДЕН', 'ORDER / NOT FOUND')}</span>
        <h1>{t('Заказ не найден или истёк', 'Order not found or expired')}</h1>
        <p>
          {t('Демо-заказ хранится в этой вкладке до 24 часов. Проверьте ссылку или начните новый заказ.', 'The demo order is saved in this tab for up to 24 hours. Check the link or start a new order.')}
        </p>
        <Link className="primary-link" to="/menu">{t('Вернуться в меню', 'Back to menu')}</Link>
      </section>
    );
  }

  return (
    <div className={['container', styles.page].join(' ')}>
      <header className={styles.hero}>
        <div className={styles.ring} aria-hidden="true">N</div>
        <div>
          <span className="eyebrow">{t('ДЕМО-ЗАКАЗ / ПОДТВЕРЖДЁН', 'DEMO ORDER / CONFIRMED')}</span>
          <h1>{t('Заказ подтверждён', 'Order confirmed')}</h1>
          <p>
            {t('Оплата была симуляцией: реальные данные карты не запрашивались и не сохранялись.', 'Payment was simulated: no real card data was requested or stored.')}
          </p>
        </div>
      </header>

      <section className={styles.status} id="order-status" aria-labelledby="status-heading">
        <span className="status-code">{t('ПОДТВЕРЖДЕНИЕ', 'CONFIRMATION')}</span>
        <h2 id="status-heading">{t('Принят кухней', 'Accepted by the kitchen')}</h2>
        <p>
          {t('Заказ принят. Откройте отслеживание, чтобы увидеть текущий этап приготовления.', 'Your order was accepted. Open tracking to see its current preparation stage.')}
        </p>
      </section>

      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="order-heading">
          <span className="status-code">{t('НОМЕР ЗАКАЗА', 'ORDER ID')}</span>
          <h2 id="order-heading">{order.id}</h2>
          <ul className={styles.lines}>
            {order.quote.lines.map((line) => (
              <li key={serializeCartConfiguration(line.configuration)}>
                <div>
                <span>{(() => {
                  const product = CATALOG_PRODUCTS.find((item) => item.id === line.configuration.productId);
                  return product ? localizeCatalogProduct(product, locale).name : localizeOrderLabel(line.name, locale);
                })()} × {line.quantity}</span>
                <small className={styles.configuration}>{(() => {
                  const product = CATALOG_PRODUCTS.find((item) => item.id === line.configuration.productId);
                  return product ? summarizeCartConfiguration(
                    line.configuration,
                    buildProductDetails(localizeCatalogProduct(product, locale), locale),
                    locale,
                  ).join(' · ') : t('Состав сохранён в заказе', 'Configuration saved in the order');
                })()}</small>
                </div>
                <strong>{formatMinorMoney(line.totalMinor)} ₽</strong>
              </li>
            ))}
          </ul>
          <dl className={styles.totals}>
            <div>
              <dt>{t('Товары', 'Items')}</dt>
              <dd>{formatMinorMoney(order.quote.subtotalMinor)} ₽</dd>
            </div>
            {order.quote.promo ? (
              <div>
                <dt>{t('Скидка', 'Discount')} · {order.quote.promo.code}</dt>
                <dd>−{formatMinorMoney(order.quote.discountMinor)} ₽</dd>
              </div>
            ) : null}
            <div>
              <dt>{order.fulfillment.mode === 'delivery' ? t('Доставка', 'Delivery') : t('Самовывоз', 'Pickup')}</dt>
              <dd>
                {order.quote.feeMinor === 0
                  ? t('Бесплатно', 'Free')
                  : formatMinorMoney(order.quote.feeMinor) + ' ₽'}
              </dd>
            </div>
          </dl>
          <p className={styles.total}>
            {t('Итого', 'Total')} <strong>{formatMinorMoney(order.quote.totalMinor)} ₽</strong>
          </p>
        </section>

        <aside className={styles.card} aria-label={t('Получение заказа', 'Order fulfillment')}>
          <span className="status-code">{t('ПОЛУЧЕНИЕ', 'FULFILLMENT')}</span>
          <h2>{order.fulfillment.mode === 'delivery' ? t('Доставка', 'Delivery') : t('Самовывоз', 'Pickup')}</h2>
          <p>{localizeOrderLabel(order.fulfillment.label, locale)}</p>
          <p><strong>{localizeOrderLabel(order.quote.etaLabel, locale)}</strong></p>
          <p className={styles.muted}>
            {t('Контакт и полный адрес сохраняются только в этой вкладке до 24 часов и не попадают в историю заказов.', 'Contact details and the full address are saved only in this tab for up to 24 hours and are excluded from order history.')}
          </p>
        </aside>
      </div>

      <nav className={styles.actions} aria-label={t('Действия после подтверждения', 'Actions after confirmation')}>
        <Link className="primary-link" to={`/order/${order.id}/track`}>
          {t('Отследить заказ', 'Track order')}
        </Link>
        <Link className="secondary-link" to="/orders">{t('История заказов', 'Order history')}</Link>
        <Link className="secondary-link" to="/menu">{t('Вернуться в меню', 'Back to menu')}</Link>
      </nav>
    </div>
  );
}


