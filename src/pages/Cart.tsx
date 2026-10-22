import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
  selectCartBlockingIssues,
  selectCartCount,
  selectCartLines,
  selectCartPersistenceWarning,
  selectCartSubtotalMinor,
  selectPendingCartUndo,
  resolveCartLinesForLocale,
} from '../features/cart/model/cartSelectors';
import { getCartRecommendation } from '../features/cart/model/cartRecommendations';
import {
  CART_QUANTITY_MAX,
  addConfiguration,
  clearCart,
  createBaseConfiguration,
  decrementQuantity,
  dismissCartUndo,
  incrementQuantity,
  removeLine,
  undoCartMutation,
} from '../features/cart/model/cartSlice';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { formatMinorMoney } from '../shared/lib/money';
import { preloadCheckoutPage } from '../routes/lazyRoutes';
import styles from './Cart.module.scss';
import { useLocale } from '../shared/i18n/useLocale';
import { CATALOG_PRODUCTS } from '../features/catalog/data/catalog.fixture';
import { localizeCatalogProduct } from '../features/catalog/data/catalogLocalization';

interface CartLocationState {
  returnTo?: unknown;
}

const readReturnTo = (state: unknown): string => {
  const returnTo = (state as CartLocationState | null)?.returnTo;
  return typeof returnTo === 'string' && /^\/menu(?:\?|$)/.test(returnTo)
    ? returnTo
    : '/menu';
};

const Cart = () => {
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const location = useLocation();
  const rawLines = useAppSelector(selectCartLines);
  const lines = useMemo(() => resolveCartLinesForLocale(rawLines, locale), [locale, rawLines]);
  const count = useAppSelector(selectCartCount);
  const subtotalMinor = useAppSelector(selectCartSubtotalMinor);
  const blockingIssues = useAppSelector(selectCartBlockingIssues);
  const pendingUndo = useAppSelector(selectPendingCartUndo);
  const persistenceWarning = useAppSelector(selectCartPersistenceWarning);
  const undoButtonRef = useRef<HTMLButtonElement>(null);
  const returnTo = readReturnTo(location.state);
  const [dismissedRecommendation, setDismissedRecommendation] = useState<string | null>(null);
  const [recommendationAnnouncement, setRecommendationAnnouncement] = useState('');
  const recommendation = useMemo(
    () => getCartRecommendation(
      lines.map((entry) => entry.line),
      CATALOG_PRODUCTS.map((product) => localizeCatalogProduct(product, locale)),
      locale,
    ),
    [lines, locale],
  );
  const visibleRecommendation = recommendation?.product.id === dismissedRecommendation
    ? null
    : recommendation;

  useEffect(() => {
    if (!pendingUndo) return undefined;
    undoButtonRef.current?.focus();
    const timer = window.setTimeout(() => {
      dispatch(dismissCartUndo());
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [dispatch, pendingUndo]);

  useEffect(() => {
    if (!location.hash.startsWith('#cart-line-')) return;
    const element = document.querySelector<HTMLElement>(location.hash);
    element?.focus();
  }, [location.hash, lines.length]);

  const undo = () => {
    const restoredFingerprint = pendingUndo?.lines[0]?.fingerprint;
    dispatch(undoCartMutation());
    if (restoredFingerprint) {
      window.requestAnimationFrame(() => {
        document.getElementById(`cart-line-${restoredFingerprint}`)?.focus();
      });
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      {persistenceWarning ? (
        <div className={styles.warning} role="status">
          <strong>{t('Корзина не сохраняется в браузере', 'Your cart cannot be saved in this browser')}</strong>
          <span>{t(persistenceWarning, 'Storage is unavailable. The cart will work until this tab is closed.')}</span>
        </div>
      ) : null}

      {pendingUndo ? (
        <div className={styles.undo} role="status" aria-live="polite">
          <span>{pendingUndo.kind === 'remove' ? t('Позиция удалена из корзины.', 'Item removed from cart.') : t('Корзина очищена.', 'Cart cleared.')} {t('Отменить можно в течение 7 секунд.', 'You can undo this for 7 seconds.')}</span>
          <button ref={undoButtonRef} type="button" onClick={undo}>{t('Отменить', 'Undo')}</button>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <section className={styles.empty} aria-labelledby="cart-heading">
          <span className={styles.emptyRing} aria-hidden="true">0</span>
          <span className="eyebrow">{t('Корзина', 'Cart')} / Napoli</span>
          <h1 id="cart-heading">{t('Корзина пока пуста', 'Your cart is empty')}</h1>
          <p>{t('Выберите пиццу или готовый набор — всё добавленное появится здесь.', 'Choose a pizza or a combo — everything you add will appear here.')}</p>
          <Link className="primary-link" to={returnTo}>{t('Открыть меню', 'Open menu')}</Link>
        </section>
      ) : (
        <>
          <header className={styles.heading}>
            <div>
              <span className="eyebrow">{t('Заказ', 'Order')} / Napoli</span>
              <h1>{t('Корзина', 'Cart')}</h1>
              <p>{t('Проверьте состав и количество перед оформлением.', 'Check your selection and quantities before checkout.')}</p>
            </div>
            <div className={styles.headingActions}>
              <Link className="secondary-link" to={returnTo}>{t('Продолжить выбор', 'Keep browsing')}</Link>
              <button type="button" className={styles.clearButton} onClick={() => dispatch(clearCart())}>
                {t('Очистить корзину', 'Clear cart')}
              </button>
            </div>
          </header>

          <div className={styles.layout}>
            <ol className={styles.lines} aria-label={t('Позиции корзины', 'Cart items')}>
              {lines.map((entry) => (
                <li key={entry.line.fingerprint}>
                  <article
                    id={`cart-line-${entry.line.fingerprint}`}
                    className={styles.line}
                    aria-labelledby={`cart-line-title-${entry.line.fingerprint}`}
                    tabIndex={-1}>
                    <div className={styles.lineCopy}>
                      <span className="status-code">{t('Ваш выбор', 'Your selection')}</span>
                      <h2 id={`cart-line-title-${entry.line.fingerprint}`}>{entry.displayName}</h2>
                      <ul className={styles.configuration} aria-label={t('Состав и размер', 'Ingredients and size')}>
                        {entry.configurationSummary.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                      {entry.issues.length > 0 ? (
                        <div className={styles.lineIssues} role="alert">
                          <strong>{t('Нужно проверить позицию', 'Item needs attention')}</strong>
                          {entry.issues.map((issue) => <p key={`${issue.code}-${issue.message}`}>{issue.message}</p>)}
                        </div>
                      ) : null}
                      <div className={styles.lineLinks}>
                        {entry.product ? (
                          <Link
                            to={`/menu/${entry.product.slug}`}
                            state={{ returnTo: '/cart', editFingerprint: entry.line.fingerprint, discoveryReturnTo: returnTo }}>
                            {t('Изменить состав', 'Edit selection')}
                          </Link>
                        ) : null}
                        <button type="button" onClick={() => dispatch(removeLine(entry.line.fingerprint))}>
                          {t('Удалить', 'Remove')}
                        </button>
                      </div>
                    </div>

                    <div className={styles.lineControls}>
                      <div className={styles.stepper} aria-label={`${t('Количество', 'Quantity')} ${entry.displayName}`}>
                        <button
                          type="button"
                          aria-label={`${t('Уменьшить количество', 'Decrease quantity of')} ${entry.displayName}`}
                          disabled={entry.line.quantity <= 1}
                          onClick={() => dispatch(decrementQuantity(entry.line.fingerprint))}>
                          −
                        </button>
                        <output aria-live="polite">{entry.line.quantity}</output>
                        <button
                          type="button"
                          aria-label={`${t('Увеличить количество', 'Increase quantity of')} ${entry.displayName}`}
                          disabled={entry.line.quantity >= CART_QUANTITY_MAX}
                          onClick={() => dispatch(incrementQuantity(entry.line.fingerprint))}>
                          +
                        </button>
                      </div>
                      <dl className={styles.price}>
                        <div><dt>{t('Количество', 'Quantity')}</dt><dd>{entry.line.quantity}</dd></div>
                        <div><dt>{t('За одну', 'Each')}</dt><dd>{entry.lineUnitPriceMinor === null ? '—' : `${formatMinorMoney(entry.lineUnitPriceMinor)} ₽`}</dd></div>
                        <div><dt>{t('Позиция', 'Line total')}</dt><dd>{entry.lineSubtotalMinor === null ? '—' : `${formatMinorMoney(entry.lineSubtotalMinor)} ₽`}</dd></div>
                      </dl>
                    </div>
                  </article>
                </li>
              ))}
            </ol>

            <div className={styles.rail}>
              {visibleRecommendation ? (
                <section className={styles.recommendation} aria-labelledby="cart-recommendation-heading">
                  <span className="status-code">{t('Хорошее дополнение', 'A good pairing')}</span>
                  <h2 id="cart-recommendation-heading">{t('К этому заказу', 'Pairs with this order')}</h2>
                  <strong>{visibleRecommendation.product.name}</strong>
                  <p>{visibleRecommendation.reason}</p>
                  <span>{formatMinorMoney(visibleRecommendation.product.priceFromMinor)} ₽</span>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        dispatch(addConfiguration(createBaseConfiguration(
                          visibleRecommendation.product.id,
                          `${visibleRecommendation.product.id}-base`,
                        )));
                        setRecommendationAnnouncement(
                          locale === 'ru' ? `${visibleRecommendation.product.name} добавлен в корзину. Рекомендация обновлена.` : `${visibleRecommendation.product.name} added to cart. Recommendation updated.`,
                        );
                      }}>
                      {t('Добавить за', 'Add for')} {formatMinorMoney(visibleRecommendation.product.priceFromMinor)} ₽
                    </button>
                    <Link to={`/menu/${visibleRecommendation.product.slug}`} state={{ returnTo: '/cart' }}>
                      {t('Подробнее', 'Details')}
                    </Link>
                    <button
                      type="button"
                      className={styles.dismissRecommendation}
                      onClick={() => setDismissedRecommendation(visibleRecommendation.product.id)}>
                      {t('Скрыть рекомендацию', 'Hide recommendation')}
                    </button>
                  </div>
                </section>
              ) : null}

              <aside className={styles.summary} aria-label={t('Сумма корзины', 'Cart total')}>
                <span className="status-code">{t('Перед оформлением', 'Before checkout')}</span>
                <h2>{t('Итого сейчас', 'Current total')}</h2>
                <dl>
                  <div><dt>{t('Товары', 'Items')} · {count}</dt><dd>{formatMinorMoney(subtotalMinor)} ₽</dd></div>
                </dl>
                <strong>{t('Стоимость товаров', 'Item subtotal')} · {formatMinorMoney(subtotalMinor)} ₽</strong>
                {blockingIssues.length > 0 ? (
                  <p role="alert">{t('Исправьте недоступные позиции перед оформлением.', 'Fix unavailable items before checkout.')}</p>
                ) : (
                  <>
                  <p>{t('На следующем шаге выберите доставку или самовывоз. Там же уточним время и стоимость получения.', 'Choose delivery or pickup at checkout, where we’ll confirm the timing and any delivery cost.')}</p>
                  <Link
                    className="primary-link"
                    to="/checkout"
                    onFocus={() => void preloadCheckoutPage()}
                    onMouseEnter={() => void preloadCheckoutPage()}>
                    {t('Оформить заказ', 'Checkout')}
                  </Link>
                </>
                )}
              </aside>
              <p className="visually-hidden" role="status" aria-live="polite">
                {recommendationAnnouncement}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
