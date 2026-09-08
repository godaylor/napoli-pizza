import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type {
  DemoOrder,
  DemoOrderTracking,
  DemoTrackingScenario,
} from '../features/order/model/order.types';
import {
  advanceTrackingClock,
  deriveTracking,
  replayTrackingClock,
  setTrackingScenario,
} from '../features/order/model/trackingEngine';
import { getDemoOrderRepository } from '../features/order/persistence/DemoOrderRepository';
import { localizeOrderLabel } from '../features/order/model/orderLocalization';
import { useLocale } from '../shared/i18n/useLocale';
import styles from './OrderTracking.module.scss';

const readNow = () => Date.now();

const formatEventOffset = (milliseconds: number) => {
  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export default function OrderTracking() {
  const { locale, t } = useLocale();
  const { orderId = '' } = useParams();
  const repository = getDemoOrderRepository();
  const [order, setOrder] = useState<DemoOrder | null>(() =>
    repository.getActive(orderId),
  );
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' || navigator.onLine,
  );
  const [observedAt, setObservedAt] = useState(() =>
    typeof navigator !== 'undefined' && !navigator.onLine && order
      ? Date.parse(order.updatedAt)
      : readNow(),
  );
  const lastPersistedStatus = useRef(order?.status);

  useEffect(() => {
    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => {
      setObservedAt(readNow());
      setIsOnline(true);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOnline) return undefined;
    const timer = window.setInterval(() => setObservedAt(readNow()), 1000);
    return () => window.clearInterval(timer);
  }, [isOnline]);

  const tracking = useMemo(
    () => order ? deriveTracking(order, observedAt, locale) : null,
    [locale, observedAt, order],
  );

  useEffect(() => {
    if (
      !isOnline ||
      !order ||
      !tracking ||
      lastPersistedStatus.current === tracking.status
    ) return;
    lastPersistedStatus.current = tracking.status;
    repository.updateTracking(
      order.id,
      {
        ...order.tracking,
        elapsedFloorMs: Math.max(
          order.tracking.elapsedFloorMs,
          tracking.elapsedMs,
        ),
      },
      tracking.status,
    );
  }, [isOnline, order, repository, tracking]);

  if (!order || !tracking) {
    return (
      <section className="container route-status">
        <span className="status-code">NAP / TRACKING / NOT FOUND</span>
        <h1>{t('Отслеживание недоступно', 'Tracking unavailable')}</h1>
        <p>
          {t(
            'Демо-заказ не найден в этой вкладке или срок его хранения истёк. Начните новый заказ из меню.',
            'The demo order is missing from this tab or has expired. Start a new order from the menu.',
          )}
        </p>
        <Link className="primary-link" to="/menu">{t('Вернуться в меню', 'Back to menu')}</Link>
      </section>
    );
  }

  const saveTracking = (nextTracking: DemoOrderTracking) => {
    const preview = deriveTracking({ ...order, tracking: nextTracking }, observedAt, locale);
    const updated = repository.updateTracking(
      order.id,
      {
        ...nextTracking,
        elapsedFloorMs: Math.max(
          nextTracking.elapsedFloorMs,
          preview.elapsedMs,
        ),
      },
      preview.status,
    );
    if (updated) {
      lastPersistedStatus.current = updated.status;
      setOrder(updated);
    }
  };

  const advance = () => {
    if (!isOnline) return;
    const current = repository.getActive(order.id) ?? order;
    saveTracking(advanceTrackingClock(current, observedAt));
  };

  const replay = () => {
    if (!isOnline) return;
    const next = replayTrackingClock(order, observedAt);
    const updated = repository.updateTracking(order.id, next, 'confirmed');
    if (updated) {
      lastPersistedStatus.current = 'confirmed';
      setOrder(updated);
    }
  };

  const changeScenario = (scenario: DemoTrackingScenario) => {
    if (!isOnline) return;
    saveTracking(setTrackingScenario(order, scenario));
  };

  return (
    <div className={['container', styles.page].join(' ')}>
      <header className={styles.hero}>
        <div
          className={styles.ring}
          role="img"
          aria-label={`${t('Прогресс заказа', 'Order progress')}: ${tracking.progressPercent}%`}
          style={{
            background: `conic-gradient(var(--color-cobalt) ${tracking.progressPercent}%, var(--color-carbon-soft) 0)`,
          }}
        >
          <span>{tracking.progressPercent}%</span>
        </div>
        <div className={styles.heroCopy}>
          <span className="eyebrow">{t('ДЕМО / ЭТАПЫ ЗАКАЗА', 'DEMO / ORDER PROGRESS')}</span>
          <h1>{order.fulfillment.mode === 'delivery'
            ? t('Заказ движется к вам', 'Your order is on its way')
            : t('Готовим к самовывозу', 'Preparing for pickup')}</h1>
          <p>
            {t(
              'Демонстрация приготовления и доставки. Заказ не отправляется в ресторан; этапы проходят автоматически и сохраняются при обновлении страницы.',
              'A preparation and delivery demo. No order is sent to a restaurant; stages advance automatically and survive a page reload.',
            )}
          </p>
        </div>
      </header>

      <section
        className={styles.currentSummary}
        aria-labelledby="current-status-heading"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="status-code">CURRENT / {order.id}</span>
        <h2 id="current-status-heading">{tracking.currentLabel}</h2>
        <p>{tracking.currentDetail}</p>
        <strong>{tracking.etaLabel}</strong>
      </section>

      {!isOnline ? (
        <div className={styles.stale} role="status">
          <strong>{t('Offline · показан последний сохранённый статус', 'Offline · showing the last saved status')}</strong>
          <span>{t('Обновления приостановлены и продолжатся после восстановления соединения.', 'Updates are paused and will resume after reconnecting.')}</span>
        </div>
      ) : null}
      {tracking.isDelayed ? (
        <div className={styles.delayed} role="status">
          <strong>{t('Кухне нужно больше времени', 'The kitchen needs more time')}</strong>
          <span>{t('В этом демо-сценарии заказ займёт больше времени. Текущий этап сохранён.', 'This demo scenario takes longer. The current stage is preserved.')}</span>
        </div>
      ) : null}
      {tracking.isCancelled ? (
        <div className={styles.cancelled} role="alert">
          <strong>{t('Demo-заказ отменён', 'Demo order cancelled')}</strong>
          <span>{t('Этапы остановлены. Откройте управление демо-временем, чтобы начать заново.', 'Progress has stopped. Open the demo time controls to restart.')}</span>
        </div>
      ) : null}

      <div className={styles.layout}>
        <section className={styles.timelineCard} aria-labelledby="timeline-heading">
          <span className="status-code">
            {order.fulfillment.mode === 'delivery' ? 'DELIVERY PATH' : 'PICKUP PATH'}
          </span>
          <h2 id="timeline-heading">{t('Этапы заказа', 'Order timeline')}</h2>
          <ol className={styles.timeline}>
            {tracking.events.map((event) => (
              <li
                key={`${event.status}-${event.atMs}`}
                className={styles[event.state]}
                aria-current={event.state === 'current' ? 'step' : undefined}
              >
                <span className={styles.marker} aria-hidden="true" />
                <div>
                  <span className={styles.stateLabel}>
                    {event.state === 'completed'
                      ? t('Завершено', 'Completed')
                      : event.state === 'current'
                        ? t('Сейчас', 'Now')
                        : t('Далее', 'Next')} · {formatEventOffset(event.atMs)}
                  </span>
                  <h3>{event.label}</h3>
                  <p>{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <aside className={styles.side} aria-label={t('Детали отслеживания', 'Tracking details')}>
          <span className="status-code">FULFILLMENT</span>
          <h2>{order.fulfillment.mode === 'delivery' ? t('Доставка', 'Delivery') : t('Самовывоз', 'Pickup')}</h2>
          <p>{localizeOrderLabel(order.fulfillment.label, locale)}</p>
          <p><strong>{localizeOrderLabel(order.quote.etaLabel, locale)}</strong></p>

          <details className="demo-controls">
            <summary>{t('Управлять demo-временем', 'Control demo time')}</summary>
            <div>
              <label>
                <span>{t('Сценарий tracking', 'Tracking scenario')}</span>
                <select
                  aria-label={t('Сценарий tracking', 'Tracking scenario')}
                  value={order.tracking.scenario}
                  disabled={!isOnline}
                  onChange={(event) => changeScenario(
                    event.target.value as DemoTrackingScenario,
                  )}
                >
                  <option value="default">{t('Без отклонений', 'No deviations')}</option>
                  <option value="delayed">{t('Задержка', 'Delay')}</option>
                  <option value="cancelled">{t('Отмена', 'Cancellation')}</option>
                </select>
              </label>
              <button
                type="button"
                disabled={!isOnline || tracking.isTerminal}
                onClick={advance}
              >
                {t('Следующий этап', 'Next stage')}
              </button>
              <button type="button" disabled={!isOnline} onClick={replay}>
                {t('Начать заново', 'Restart')}
              </button>
            </div>
          </details>
        </aside>
      </div>

      <nav className={styles.actions} aria-label={t('Действия с заказом', 'Order actions')}>
        <Link className="secondary-link" to={`/order/${order.id}/confirmed`}>
          {t('К подтверждению', 'View confirmation')}
        </Link>
        <Link className="secondary-link" to="/menu">{t('Вернуться в меню', 'Back to menu')}</Link>
      </nav>
    </div>
  );
}
