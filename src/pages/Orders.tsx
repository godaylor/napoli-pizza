import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { useGetMenuQuery } from '../features/catalog/api/catalogApi';
import { addConfiguration } from '../features/cart/model/cartSlice';
import { selectCartCount } from '../features/cart/model/cartSelectors';
import type { SanitizedOrderHistoryEntry } from '../features/order/model/order.types';
import {
  reconcileOrderForRepeat,
  type ReorderReconciliation,
} from '../features/order/model/reorderReconciliation';
import { getDemoOrderRepository } from '../features/order/persistence/DemoOrderRepository';
import { buildProductDetails } from '../features/product/data/productConfiguration.fixture';
import { DEFAULT_CATALOG_QUERY } from '../lib/catalogQuery';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { formatMinorMoney } from '../shared/lib/money';
import { useLocale } from '../shared/i18n/useLocale';
import { localizeOrderLabel } from '../features/order/model/orderLocalization';
import { CATALOG_PRODUCTS } from '../features/catalog/data/catalog.fixture';
import { localizeCatalogProduct } from '../features/catalog/data/catalogLocalization';

type RepeatScenario = 'default' | 'unavailable' | 'price-change';

const statusLabelsRu: Record<SanitizedOrderHistoryEntry['status'], string> = {
  confirmed: 'Заказ принят',
  preparing: 'Готовится',
  baking: 'В печи',
  ready_for_handoff: 'Упаковывается',
  out_for_delivery: 'Курьер в пути',
  ready_for_pickup: 'Готов к выдаче',
  delivered: 'Доставлен',
  picked_up: 'Получен',
  cancelled: 'Отменён',
};
const statusLabelsEn: Record<SanitizedOrderHistoryEntry['status'], string> = {
  confirmed: 'Order accepted', preparing: 'Preparing', baking: 'In the oven',
  ready_for_handoff: 'Packing', out_for_delivery: 'Courier en route',
  ready_for_pickup: 'Ready for pickup', delivered: 'Delivered',
  picked_up: 'Picked up', cancelled: 'Cancelled',
};

const formatDate = (value: string, locale: 'ru' | 'en') => new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

export default function Orders() {
  const { locale, t } = useLocale();
  const repository = getDemoOrderRepository();
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const [history, setHistory] = useState(() => repository.listHistory());
  const [selectedOrder, setSelectedOrder] = useState<SanitizedOrderHistoryEntry | null>(null);
  const [selectedLineKeys, setSelectedLineKeys] = useState(() => new Set<string>());
  const [scenario, setScenario] = useState<RepeatScenario>('default');
  const [acknowledged, setAcknowledged] = useState(false);
  const [repeatStatus, setRepeatStatus] = useState<string | null>(null);
  const { data, error, isLoading, refetch } = useGetMenuQuery({
    ...DEFAULT_CATALOG_QUERY,
    scenario: 'default',
    locale,
  });
  const localizeHistoryName = (productId: string, fallback: string) => {
    const product = CATALOG_PRODUCTS.find((item) => item.id === productId);
    return product ? localizeCatalogProduct(product, locale).name : localizeOrderLabel(fallback, locale);
  };

  const currentDetails = useMemo(() => {
    if (!data) return [];
    const targetProductId = selectedOrder?.lines[0]?.configuration.productId;
    return data.products.map((product) => {
      const details = buildProductDetails(product, locale);
      if (!targetProductId || product.id !== targetProductId) return details;
      if (scenario === 'unavailable') {
        return {
          ...details,
          product: {
            ...details.product,
            availability: {
              status: 'sold-out' as const,
              note: t('Позиция временно закончилась в demo-сценарии.', 'The item is temporarily sold out in this demo scenario.'),
            },
          },
        };
      }
      if (scenario === 'price-change') {
        return {
          ...details,
          variants: details.variants.map((variant) => ({
            ...variant,
            basePriceMinor: variant.basePriceMinor + 10000,
          })),
        };
      }
      return details;
    });
  }, [data, locale, scenario, selectedOrder, t]);

  const reconciliation = useMemo(
    () => selectedOrder
      ? reconcileOrderForRepeat(selectedOrder, currentDetails, locale)
      : null,
    [currentDetails, locale, selectedOrder],
  );

  const openRepeat = (order: SanitizedOrderHistoryEntry) => {
    const next = reconcileOrderForRepeat(order, currentDetails, locale);
    setSelectedOrder(order);
    setSelectedLineKeys(new Set(next.lines.filter((line) => line.canAdd).map((line) => line.key)));
    setScenario('default');
    setAcknowledged(false);
    setRepeatStatus(null);
  };

  const clearHistory = () => {
    repository.clearHistory();
    setHistory([]);
    setSelectedOrder(null);
    setRepeatStatus(t('История на этом устройстве очищена. Активный заказ сохранён.', 'History on this device was cleared. The active order is preserved.'));
  };

  const seedDemoHistory = () => {
    repository.seedDemoHistory();
    setHistory(repository.listHistory());
    setRepeatStatus(t('Добавлен неперсональный demo-заказ для проверки истории.', 'A non-personal demo order was added to preview history.'));
  };

  const confirmRepeat = (active: ReorderReconciliation) => {
    const lines = active.lines.filter(
      (line) => line.canAdd && selectedLineKeys.has(line.key),
    );
    let quantity = 0;
    for (const line of lines) {
      for (let index = 0; index < line.quantity; index += 1) {
        dispatch(addConfiguration(line.configuration));
        quantity += 1;
      }
    }
    setRepeatStatus(
      quantity > 0
        ? t(`В корзину добавлено позиций: ${quantity}. Итог будет рассчитан заново.`, `${quantity} item(s) added to the cart. The total will be recalculated.`)
        : t('Нет доступных позиций для добавления.', 'There are no available items to add.'),
    );
  };

  if (isLoading && history.length > 0) {
    return (
      <section className="container route-status" aria-busy="true">
        <span className="status-code">NAP / LOAD</span>
        <h1>{t('Сверяем историю', 'Checking order history')}</h1>
        <p>{t('Загружаем текущие цены и доступность для безопасного повтора.', 'Loading current prices and availability for a safe reorder.')}</p>
      </section>
    );
  }

  return (
    <div className="container orders-page">
      <header className="orders-intro">
        <span className="eyebrow">{t('Последние 20 / до 90 дней / это устройство', 'Last 20 / up to 90 days / this device')}</span>
        <h1>{t('История заказов', 'Order history')}</h1>
        <p>
          {t('Здесь нет телефона, email, комментария и адреса доставки. Перед повтором мы сверяем каждую конфигурацию и используем только текущие цены.', 'Phone, email, notes and delivery address are not stored here. Before reordering, we check every configuration and use current prices only.')}
        </p>
      </header>

      {repeatStatus ? <p className="orders-live" role="status" aria-live="polite">{repeatStatus}</p> : null}

      {history.length === 0 ? (
        <section className="orders-empty">
          <span className="status-code">HISTORY / EMPTY</span>
          <h2>{t('Недавних заказов нет', 'No recent orders')}</h2>
          <p>{t('После оформления здесь появится безопасная локальная копия заказа.', 'A safe local copy of your order will appear here after checkout.')}</p>
          <div className="orders-actions">
            <Link className="primary-link" to="/menu">{t('Открыть меню', 'Open menu')}</Link>
            <button type="button" onClick={seedDemoHistory}>{t('Показать demo-заказ', 'Show demo order')}</button>
          </div>
        </section>
      ) : (
        <>
          <div className="orders-toolbar">
            <p>{t(`Сохранено заказов: ${history.length}`, `Saved orders: ${history.length}`)}</p>
            <button type="button" onClick={clearHistory}>{t('Очистить историю', 'Clear history')}</button>
          </div>
          <ol className="orders-list">
            {history.map((order) => (
              <li key={order.id} className="order-history-card">
                <div className="order-history-card__heading">
                  <div>
                    <span className="status-code">
                      {order.source === 'seeded-demo' ? t('DEMO / НЕПЕРСОНАЛЬНЫЙ', 'DEMO / NON-PERSONAL') : (locale === 'ru' ? statusLabelsRu : statusLabelsEn)[order.status]}
                    </span>
                    <h2>{order.id}</h2>
                    <p>{formatDate(order.createdAt, locale)} · {localizeOrderLabel(order.fulfillmentLabel, locale)}</p>
                  </div>
                  <strong>{formatMinorMoney(order.totalMinor)} ₽</strong>
                </div>
                <ul className="order-history-lines" aria-label={`${t('Состав заказа', 'Order contents')} ${order.id}`}>
                  {order.lines.map((line, index) => (
                    <li key={`${order.id}:${index}`}>
                      <span>{localizeHistoryName(line.configuration.productId, line.name)} × {line.quantity}</span>
                      <strong>{formatMinorMoney(line.totalMinor)} ₽ {t('тогда', 'then')}</strong>
                    </li>
                  ))}
                </ul>
                <button type="button" onClick={() => openRepeat(order)}>{t('Повторить заказ', 'Reorder')}</button>
              </li>
            ))}
          </ol>
        </>
      )}

      {selectedOrder && reconciliation ? (
        <section className="repeat-review" aria-labelledby="repeat-review-title">
          <div>
            <span className="eyebrow">{t('Проверка перед корзиной', 'Review before adding')}</span>
            <h2 id="repeat-review-title">{t('Повторить', 'Reorder')} {selectedOrder.id}</h2>
            <p>
              {cartCount > 0
                ? t(`В корзине уже ${cartCount} позиций. Выбранные строки будут объединены по той же конфигурации или добавлены отдельно.`, `The cart already has ${cartCount} item(s). Selected lines will merge with matching configurations or be added separately.`)
                : t('Выбранные строки будут добавлены в корзину с текущими ценами.', 'Selected lines will be added to the cart at current prices.')}
            </p>
          </div>

          {error || !data ? (
            <div className="repeat-error" role="alert">
              <strong>{t('Не удалось получить текущее меню', 'Could not load the current menu')}</strong>
              <p>{t('Исторические цены не будут использованы. Повторите сверку.', 'Historical prices will not be used. Try the check again.')}</p>
              <button type="button" onClick={() => void refetch()}>{t('Повторить сверку', 'Try again')}</button>
            </div>
          ) : (
            <>
              <label className="repeat-scenario">
                {t('Demo-сценарий актуального меню', 'Current-menu demo scenario')}
                <select
                  value={scenario}
                  onChange={(event) => {
                    setScenario(event.target.value as RepeatScenario);
                    setAcknowledged(false);
                  }}>
                  <option value="default">{t('Без изменений', 'No changes')}</option>
                  <option value="price-change">{t('Цена изменилась', 'Price changed')}</option>
                  <option value="unavailable">{t('Позиция закончилась', 'Item sold out')}</option>
                </select>
              </label>
              <ul className="repeat-lines">
                {reconciliation.lines.map((line) => (
                  <li key={line.key} data-repeat-status={line.status}>
                    <label>
                      <input
                        type="checkbox"
                        checked={line.canAdd && selectedLineKeys.has(line.key)}
                        disabled={!line.canAdd}
                        onChange={(event) => setSelectedLineKeys((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(line.key);
                          else next.delete(line.key);
                          return next;
                        })}
                      />
                      <span><strong>{line.currentName ?? line.historicalName}</strong> × {line.quantity}</span>
                    </label>
                    <p>{line.reason}</p>
                    <dl>
                      <dt>{t('Тогда', 'Then')}</dt><dd>{formatMinorMoney(line.historicalUnitPriceMinor)} ₽</dd>
                      <dt>{t('Сейчас', 'Now')}</dt><dd>{line.currentUnitPriceMinor === null ? t('Недоступно', 'Unavailable') : `${formatMinorMoney(line.currentUnitPriceMinor)} ₽`}</dd>
                    </dl>
                  </li>
                ))}
              </ul>
              {reconciliation.skippedCount > 0 ? (
                <p className="repeat-warning" role="status">
                  {t(`Пропущено строк: ${reconciliation.skippedCount}. Причина указана у каждой строки.`, `Skipped lines: ${reconciliation.skippedCount}. Each line shows its reason.`)}
                </p>
              ) : null}
              <label className="repeat-acknowledgement">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                {t('Я проверил текущие цены, доступность и объединение с корзиной', 'I reviewed current prices, availability and cart merging')}
              </label>
              <div className="orders-actions">
                <button
                  className="primary-action"
                  type="button"
                  disabled={!acknowledged || !reconciliation.lines.some((line) => line.canAdd && selectedLineKeys.has(line.key))}
                  onClick={() => confirmRepeat(reconciliation)}>
                  {t('Добавить выбранное в корзину', 'Add selected to cart')}
                </button>
                <Link className="secondary-link" to="/cart">{t('Открыть корзину', 'Open cart')}</Link>
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
