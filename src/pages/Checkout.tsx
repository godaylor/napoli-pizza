import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';

import {
  createFulfillmentRequestKey,
  isCheckoutApiError,
} from '../features/checkout/api/checkoutDemoApi';
import {
  useCreateFinalQuoteMutation,
  useCreateFulfillmentQuoteMutation,
} from '../features/checkout/api/checkoutApi';
import {
  createFinalQuoteRequestKey,
  isFinalQuoteApiError,
  normalizePromoCode,
} from '../features/checkout/api/finalQuoteDemoApi';
import type {
  DeliveryCheckoutFields,
  FulfillmentQuoteRequest,
} from '../features/checkout/model/checkout.types';
import type {
  FinalQuoteRequest,
  FinalQuoteScenario,
  FinalQuoteSnapshot,
} from '../features/checkout/model/finalQuote.types';
import {
  selectFulfillment,
  setFulfillmentMode,
  setFulfillmentTime,
  setPickupStore,
} from '../features/checkout/model/fulfillmentSlice';
import {
  FULFILLMENT_SLOTS,
  getFulfillmentSlot,
  getPickupStore,
  PICKUP_STORES,
  type FulfillmentPreference,
} from '../features/checkout/model/fulfillment.types';
import {
  clearCheckoutSession,
  getSessionStorage,
  loadCheckoutSession,
  saveCheckoutSession,
} from '../features/checkout/persistence/checkoutSession';
import {
  selectCartBlockingIssues,
  resolveCartLinesForLocale,
  selectCartLines,
  selectCartSubtotalMinor,
} from '../features/cart/model/cartSelectors';
import { clearCart } from '../features/cart/model/cartSlice';
import {
  createOrderIdempotencyKey,
  isPaymentOrderError,
  recoverAmbiguousOrder,
  submitMockPaymentAndCreateOrder,
} from '../features/order/api/orderDemoApi';
import {
  initialPaymentState,
  paymentReducer,
  type MockPaymentScenario,
} from '../features/order/model/paymentState';
import type { DemoOrder, DemoOrderInput } from '../features/order/model/order.types';
import { getDemoOrderRepository } from '../features/order/persistence/DemoOrderRepository';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { formatMinorMoney } from '../shared/lib/money';
import styles from './Checkout.module.scss';
import { useLocale } from '../shared/i18n/useLocale';
import { localizeOrderLabel as localizeOperationalLabel } from '../features/order/model/orderLocalization';

const getDefaultFields = (locale: 'ru' | 'en'): DeliveryCheckoutFields => ({
  name: locale === 'ru' ? 'Гость Napoli' : 'Napoli Guest',
  phone: '+7 900 000-22-22',
  email: 'demo@napoli.test',
  city: locale === 'ru' ? 'Москва' : 'Moscow',
  street: locale === 'ru' ? 'Тверская' : 'Tverskaya',
  house: '22',
  apartment: '',
  entrance: '',
  floor: '',
  note: '',
  scenario: 'default',
});

const buildRequest = (
  fields: DeliveryCheckoutFields,
  lines: ReturnType<typeof resolveCartLinesForLocale>,
  subtotalMinor: number,
  fulfillment: FulfillmentPreference,
): FulfillmentQuoteRequest => {
  const common = {
    lines: lines.map((entry) => ({
      configuration: entry.line.configuration,
      quantity: entry.line.quantity,
    })),
    subtotalMinor,
    time: fulfillment.time,
    scenario: fields.scenario,
  };

  if (fulfillment.mode === 'pickup') {
    return {
      ...common,
      mode: 'pickup',
      storeId: fulfillment.pickupStoreId,
    };
  }

  return {
    ...common,
    mode: 'delivery',
    address: {
      city: fields.city,
      street: fields.street,
      house: fields.house,
      apartment: fields.apartment,
      entrance: fields.entrance,
      floor: fields.floor,
    },
  };
};

const checkoutErrorEnglish: Record<string, string> = {
  offline: 'No internet connection. Reconnect and retry the quote.',
  unserviceable: 'This address is outside the demo delivery zone. Try Tverskaya Street, house 22.',
  'closed-store': 'This pizzeria is closed. Choose the available Napoli location.',
  'slot-unavailable': 'This time slot is unavailable. Choose ASAP or another time.',
  'quote-expired': 'The fulfillment quote expired. Refresh it to continue.',
  minimum: 'The minimum order amount has not been reached. Add another item.',
  http: 'Could not calculate fulfillment. Retry.',
};

const finalQuoteErrorEnglish: Record<string, string> = {
  'promo-expired': 'This promo code has expired. The total has not changed.',
  'promo-minimum': 'The promo code minimum has not been reached. The total has not changed.',
  'promo-ineligible': 'This promo code does not apply to the current order. The total has not changed.',
  'promo-invalid': 'Promo code not found. Check the spelling; the total has not changed.',
  offline: 'No internet connection. The final total was not changed.',
  http: 'Could not confirm the final total. Retry.',
};

export default function Checkout() {
  const dispatch = useAppDispatch();
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const rawLines = useAppSelector(selectCartLines);
  const lines = useMemo(() => resolveCartLinesForLocale(rawLines, locale), [locale, rawLines]);
  const subtotalMinor = useAppSelector(selectCartSubtotalMinor);
  const blockingIssues = useAppSelector(selectCartBlockingIssues);
  const fulfillment = useAppSelector(selectFulfillment);
  const storage = useMemo(() => getSessionStorage(), []);
  const defaultFields = useMemo(() => getDefaultFields(locale), [locale]);
  const restored = useMemo(
    () => storage ? loadCheckoutSession(storage) : null,
    [storage],
  );
  const [sessionWarning, setSessionWarning] = useState('');
  const [paymentScenario, setPaymentScenario] =
    useState<MockPaymentScenario>('success');
  const [paymentState, paymentDispatch] = useReducer(
    paymentReducer,
    initialPaymentState,
  );
  const paymentInFlightRef = useRef(false);
  const idempotencyRef = useRef<{
    quoteId: string;
    key: string;
  } | null>(null);
  const orderRepository = useMemo(() => getDemoOrderRepository(), []);
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  );
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const {
    clearErrors,
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<DeliveryCheckoutFields>({
    defaultValues: restored ?? defaultFields,
    shouldFocusError: true,
    mode: 'onSubmit',
  });
  const fields = useWatch({ control });
  const normalizedFields = useMemo(
    () => ({ ...defaultFields, ...fields }) as DeliveryCheckoutFields,
    [defaultFields, fields],
  );
  const request = useMemo(
    () => buildRequest(normalizedFields, lines, subtotalMinor, fulfillment),
    [fulfillment, lines, normalizedFields, subtotalMinor],
  );
  const requestKey = createFulfillmentRequestKey(request);
  const [createQuote, quoteState] = useCreateFulfillmentQuoteMutation();
  const quoteIsStale = Boolean(
    quoteState.data && (
      !isOnline ||
      quoteState.data.requestKey !== requestKey
    ),
  );
  const currentQuote = quoteState.data && !quoteIsStale
    ? quoteState.data
    : null;
  const apiError = isCheckoutApiError(quoteState.error) ? quoteState.error : null;
  const pickupStore = getPickupStore(fulfillment.pickupStoreId);
  const selectedSlot = fulfillment.time.kind === 'scheduled'
    ? getFulfillmentSlot(fulfillment.time.slotId)
    : null;
  const [promoCode, setPromoCode] = useState('');
  const [finalQuoteScenario, setFinalQuoteScenario] =
    useState<FinalQuoteScenario>('default');
  const [acceptedFinalQuote, setAcceptedFinalQuote] =
    useState<FinalQuoteSnapshot | null>(null);
  const [quoteNeedsAcknowledgement, setQuoteNeedsAcknowledgement] =
    useState(false);
  const [quoteAcknowledged, setQuoteAcknowledged] = useState(false);
  const promoInputRef = useRef<HTMLInputElement>(null);
  const [createFinalQuote, finalQuoteState] = useCreateFinalQuoteMutation();
  const finalQuoteRequest = useMemo<FinalQuoteRequest | null>(
    () => currentQuote ? {
      lines: lines.map((entry) => ({
        configuration: entry.line.configuration,
        quantity: entry.line.quantity,
      })),
      fulfillmentQuote: currentQuote,
      promoCode,
      scenario: finalQuoteScenario,
    } : null,
    [currentQuote, finalQuoteScenario, lines, promoCode],
  );
  const finalQuoteRequestKey = finalQuoteRequest
    ? createFinalQuoteRequestKey(finalQuoteRequest)
    : null;
  const finalQuoteIsStale = Boolean(
    acceptedFinalQuote && (
      !finalQuoteRequestKey ||
      acceptedFinalQuote.requestKey !== finalQuoteRequestKey
    ),
  );
  const finalQuoteError = isFinalQuoteApiError(finalQuoteState.error)
    ? finalQuoteState.error
    : null;
  const finalQuoteReady = Boolean(
    acceptedFinalQuote &&
    !finalQuoteIsStale &&
    (!quoteNeedsAcknowledgement || quoteAcknowledged),
  );

  useEffect(() => {
    if (!storage) return;
    const timeout = window.setTimeout(() => {
      try {
        saveCheckoutSession(storage, normalizedFields);
        setSessionWarning('');
      } catch {
        setSessionWarning(t('Не удалось сохранить checkout draft. Поля останутся только до reload.', 'Could not save the checkout draft. Fields will remain only until reload.'));
      }
    }, 120);
    return () => window.clearTimeout(timeout);
  }, [normalizedFields, storage, t]);

  useEffect(() => {
    if (fulfillment.mode === 'pickup') {
      clearErrors(['street', 'house']);
    }
  }, [clearErrors, fulfillment.mode]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setRecoveryMessage(t('Нет соединения. Подтверждённый ранее расчёт помечен устаревшим.', 'No connection. The previous quote is now marked stale.'));
    };
    const handleOnline = () => {
      setIsOnline(true);
      setRecoveryMessage(t('Соединение восстановлено. Безопасно обновляем только расчёт получения.', 'Connection restored. Refreshing the fulfillment quote safely.'));
      if (quoteState.data || apiError?.data.code === 'offline') {
        void createQuote(request);
      }
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [apiError?.data.code, createQuote, quoteState.data, request, t]);

  const submit = handleSubmit(async (values) => {
    try {
      await createQuote(
        buildRequest(values, lines, subtotalMinor, fulfillment),
      ).unwrap();
      clearErrors();
      setRecoveryMessage('');
    } catch (error) {
      if (isCheckoutApiError(error) && error.data.fieldErrors) {
        for (const [field, message] of Object.entries(error.data.fieldErrors)) {
          if (message) {
            setError(
              field as keyof DeliveryCheckoutFields,
              { message: locale === 'ru' ? message : 'Check this field and try again.' },
              { shouldFocus: field === 'street' },
            );
          }
        }
      }
    }
  });

  const chooseAlternativeStore = () => {
    if (!apiError?.data.alternativeStoreId) return;
    dispatch(setPickupStore(apiError.data.alternativeStoreId));
    setValue('scenario', 'default');
  };

  const chooseAsap = () => {
    dispatch(setFulfillmentTime({ kind: 'asap' }));
    setValue('scenario', 'default');
  };

  const confirmFinalQuote = async (code = promoCode) => {
    if (!currentQuote) return;
    const requestToConfirm: FinalQuoteRequest = {
      lines: lines.map((entry) => ({
        configuration: entry.line.configuration,
        quantity: entry.line.quantity,
      })),
      fulfillmentQuote: currentQuote,
      promoCode: code,
      scenario: finalQuoteScenario,
    };
    try {
      const nextQuote = await createFinalQuote(requestToConfirm).unwrap();
      const requiresAcknowledgement = Boolean(
        acceptedFinalQuote && (
          nextQuote.totalMinor > acceptedFinalQuote.totalMinor ||
          nextQuote.etaLabel !== acceptedFinalQuote.etaLabel
        ),
      );
      setAcceptedFinalQuote(nextQuote);
      setPromoCode(normalizePromoCode(code) ?? '');
      setQuoteNeedsAcknowledgement(requiresAcknowledgement);
      setQuoteAcknowledged(!requiresAcknowledgement);
    } catch {
      promoInputRef.current?.focus();
    }
  };

  const removePromo = () => {
    void confirmFinalQuote('');
  };

  const completeOrder = (order: DemoOrder) => {
    paymentDispatch({ type: 'success', orderId: order.id });
    if (storage) clearCheckoutSession(storage);
    dispatch(clearCart());
    navigate('/order/' + order.id + '/confirmed');
  };

  const submitPayment = async () => {
    if (
      paymentInFlightRef.current ||
      !acceptedFinalQuote ||
      finalQuoteIsStale ||
      (quoteNeedsAcknowledgement && !quoteAcknowledged)
    ) {
      return;
    }

    const pickup = getPickupStore(fulfillment.pickupStoreId);
    if (fulfillment.mode === 'pickup' && !pickup) {
      paymentDispatch({
        type: 'fail',
        message: t('Точка самовывоза больше недоступна. Обновите расчёт.', 'The pickup location is no longer available. Refresh the quote.'),
      });
      return;
    }

    const input: DemoOrderInput = {
      quote: acceptedFinalQuote,
      contact: {
        name: normalizedFields.name,
        phone: normalizedFields.phone,
        email: normalizedFields.email,
      },
      note: normalizedFields.note,
      fulfillment: fulfillment.mode === 'delivery'
        ? {
            mode: 'delivery',
            label: acceptedFinalQuote.fulfillmentLabel,
            address: {
              city: normalizedFields.city,
              street: normalizedFields.street,
              house: normalizedFields.house,
              apartment: normalizedFields.apartment,
              entrance: normalizedFields.entrance,
              floor: normalizedFields.floor,
            },
            time: fulfillment.time,
          }
        : {
            mode: 'pickup',
            label: acceptedFinalQuote.fulfillmentLabel,
            store: {
              id: pickup?.id ?? '',
              name: pickup?.name ?? '',
              address: pickup?.address ?? '',
            },
            time: fulfillment.time,
          },
    };

    let identity = idempotencyRef.current;
    if (!identity || identity.quoteId !== acceptedFinalQuote.id) {
      identity = {
        quoteId: acceptedFinalQuote.id,
        key: createOrderIdempotencyKey(acceptedFinalQuote.id),
      };
      idempotencyRef.current = identity;
    }

    paymentInFlightRef.current = true;
    paymentDispatch({ type: 'submit' });
    const controller = new AbortController();
    try {
      const order = await submitMockPaymentAndCreateOrder(
        input,
        identity.key,
        paymentScenario,
        orderRepository,
        controller.signal,
      );
      completeOrder(order);
    } catch (error) {
      if (!isPaymentOrderError(error)) {
        paymentDispatch({
          type: 'fail',
          message: t('Не удалось завершить demo payment. Повторите вручную.', 'Could not complete the demo payment. Retry manually.'),
        });
      } else if (error.code === 'ambiguous') {
        paymentDispatch({ type: 'ambiguous' });
        const recovered = await recoverAmbiguousOrder(
          identity.key,
          orderRepository,
          controller.signal,
        );
        if (recovered) {
          completeOrder(recovered);
        } else {
          paymentDispatch({
            type: 'fail',
            message: t('Статус заказа не найден. Повторите только после нового финального расчёта.', 'Order status was not found. Retry only after obtaining a new final quote.'),
          });
        }
      } else if (error.code === 'declined') {
        paymentDispatch({ type: 'decline', message: error.message });
      } else {
        paymentDispatch({ type: 'fail', message: error.message });
      }
    } finally {
      paymentInFlightRef.current = false;
    }
  };

  if (lines.length === 0 || blockingIssues.length > 0) {
    return (
      <section className="container route-status">
        <span className="status-code">CHECK / NAP</span>
        <h1>{t('Корзина не готова к оформлению', 'Cart is not ready for checkout')}</h1>
        <p>{lines.length === 0 ? t('Добавьте позиции перед checkout.', 'Add items before checkout.') : t('Исправьте недоступные позиции в корзине.', 'Fix unavailable items in the cart.')}</p>
        <Link className="primary-link" to="/cart">{t('Вернуться в корзину', 'Back to cart')}</Link>
      </section>
    );
  }

  const actionLabel = quoteState.isLoading
    ? t('Проверяем получение…', 'Checking fulfillment…')
    : quoteIsStale || apiError
      ? t('Повторить расчёт', 'Refresh quote')
      : fulfillment.mode === 'delivery'
        ? t('Проверить адрес', 'Check address')
        : t('Проверить самовывоз', 'Check pickup');

  return (
    <div className={['container', styles.page].join(' ')}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow">Guest checkout / Napoli</span>
          <h1>{fulfillment.mode === 'delivery' ? t('Доставка', 'Delivery') : t('Самовывоз', 'Pickup')}</h1>
          <p>
            {t('Регистрация не нужна. Доступность и время проверяет локальный демо-адаптер Napoli.', 'No registration required. Napoli’s local demo adapter checks availability and timing.')}
          </p>
        </div>
        <Link className="secondary-link" to="/cart">{t('Изменить корзину', 'Edit cart')}</Link>
      </header>

      {sessionWarning ? <p className={styles.warning} role="status">{sessionWarning}</p> : null}
      {recoveryMessage ? <p className={styles.warning} role="status">{recoveryMessage}</p> : null}

      <div className={styles.layout}>
        <form className={styles.form} onSubmit={submit} noValidate aria-busy={quoteState.isLoading}>
          <section aria-labelledby="fulfillment-heading">
            <span className="status-code">00 / FULFILLMENT</span>
            <h2 id="fulfillment-heading">{t('Способ получения', 'Fulfillment')}</h2>
            <fieldset className={styles.segmented}>
              <legend className="visually-hidden">{t('Доставка или самовывоз', 'Delivery or pickup')}</legend>
              <label>
                <input
                  type="radio"
                  name="fulfillment-mode"
                  value="delivery"
                  checked={fulfillment.mode === 'delivery'}
                  onChange={() => dispatch(setFulfillmentMode('delivery'))}
                />
                <span>{t('Доставка', 'Delivery')}</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="fulfillment-mode"
                  value="pickup"
                  checked={fulfillment.mode === 'pickup'}
                  onChange={() => dispatch(setFulfillmentMode('pickup'))}
                />
                <span>{t('Самовывоз', 'Pickup')}</span>
              </label>
            </fieldset>
          </section>

          <section aria-labelledby="contact-heading">
            <span className="status-code">01 / CONTACT</span>
            <h2 id="contact-heading">{t('Контакт', 'Contact')}</h2>
            <div className={styles.fields}>
              <label>
                <span>{t('Имя', 'Name')}</span>
                <input
                  autoComplete="name"
                  {...register('name', {
                    required: t('Введите имя.', 'Enter your name.'),
                    minLength: { value: 2, message: t('Имя должно содержать минимум 2 символа.', 'Name must contain at least 2 characters.') },
                  })}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name ? <small id="name-error" role="alert">{errors.name.message}</small> : null}
              </label>
              <label>
                <span>{t('Телефон', 'Phone')}</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register('phone', {
                    required: t('Введите телефон.', 'Enter your phone number.'),
                    validate: (value) => value.replace(/\D/g, '').length === 11 || t('Введите 11 цифр телефона.', 'Enter an 11-digit phone number.'),
                  })}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'phone-error' : undefined}
                />
                {errors.phone ? <small id="phone-error" role="alert">{errors.phone.message}</small> : null}
              </label>
              <label>
                <span>Email · {t('необязательно', 'optional')}</span>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email', {
                    pattern: { value: /^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('Проверьте формат email.', 'Check the email format.') },
                  })}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email ? <small id="email-error" role="alert">{errors.email.message}</small> : null}
              </label>
            </div>
          </section>

          {fulfillment.mode === 'delivery' ? (
            <section aria-labelledby="address-heading">
              <span className="status-code">02 / ADDRESS</span>
              <h2 id="address-heading">{t('Адрес доставки', 'Delivery address')}</h2>
              <div className={styles.fields}>
                <label><span>{t('Город', 'City')}</span><input readOnly autoComplete="address-level2" {...register('city')} /></label>
                <label className={styles.wide}>
                  <span>{t('Улица', 'Street')}</span>
                  <input
                    autoComplete="address-line1"
                    {...register('street', {
                      validate: (value) => value.trim().length > 0 || t('Введите улицу.', 'Enter a street.'),
                    })}
                    aria-invalid={Boolean(errors.street)}
                    aria-describedby={errors.street ? 'street-error' : undefined}
                  />
                  {errors.street ? <small id="street-error" role="alert">{errors.street.message}</small> : null}
                </label>
                <label>
                  <span>{t('Дом', 'House')}</span>
                  <input
                    autoComplete="address-line2"
                    {...register('house', {
                      validate: (value) => value.trim().length > 0 || t('Введите номер дома.', 'Enter a house number.'),
                    })}
                    aria-invalid={Boolean(errors.house)}
                    aria-describedby={errors.house ? 'house-error' : undefined}
                  />
                  {errors.house ? <small id="house-error" role="alert">{errors.house.message}</small> : null}
                </label>
                <label><span>{t('Квартира', 'Apartment')}</span><input inputMode="numeric" {...register('apartment')} /></label>
                <label><span>{t('Подъезд', 'Entrance')}</span><input inputMode="numeric" {...register('entrance')} /></label>
                <label><span>{t('Этаж', 'Floor')}</span><input inputMode="numeric" {...register('floor')} /></label>
                <label className={styles.wide}><span>{t('Комментарий курьеру', 'Courier note')}</span><textarea rows={3} {...register('note')} /></label>
              </div>
            </section>
          ) : (
            <section aria-labelledby="pickup-heading">
              <span className="status-code">02 / PICKUP</span>
              <h2 id="pickup-heading">{t('Пиццерия для самовывоза', 'Pickup pizzeria')}</h2>
              <label className={styles.storeSelect}>
                <span>{t('Точка Napoli', 'Napoli location')}</span>
                <select
                  aria-label={t('Пиццерия', 'Pizzeria')}
                  value={fulfillment.pickupStoreId}
                  onChange={(event) => dispatch(setPickupStore(event.target.value))}
                >
                  {PICKUP_STORES.map((store) => (
                    <option key={store.id} value={store.id}>{locale === 'ru' ? store.name : store.name.replace('Тверская', 'Tverskaya').replace('Курская', 'Kurskaya')}</option>
                  ))}
                </select>
              </label>
              {pickupStore ? (
                <div className={styles.pickupCard}>
                  <strong>{locale === 'ru' ? pickupStore.name : pickupStore.name.replace('Тверская', 'Tverskaya').replace('Курская', 'Kurskaya')}</strong>
                  <span>{locale === 'ru' ? pickupStore.address : pickupStore.address.replace('Тверская', 'Tverskaya Street').replace('Земляной Вал', 'Zemlyanoy Val')}</span>
                  <span>{localizeOperationalLabel(pickupStore.hours, locale)}</span>
                </div>
              ) : null}
            </section>
          )}

          <section aria-labelledby="time-heading">
            <span className="status-code">03 / TIME</span>
            <h2 id="time-heading">{t('Время', 'Time')}</h2>
            <fieldset className={styles.timeOptions}>
              <legend className="visually-hidden">{t('Как можно скорее или ко времени', 'ASAP or scheduled')}</legend>
              <label>
                <input
                  type="radio"
                  name="fulfillment-time"
                  checked={fulfillment.time.kind === 'asap'}
                  onChange={() => dispatch(setFulfillmentTime({ kind: 'asap' }))}
                />
                <span>
                  <strong>{t('Как можно скорее', 'As soon as possible')}</strong>
                  <small>
                    {fulfillment.mode === 'delivery'
                      ? t('Обычно 35–45 минут', 'Usually 35–45 minutes')
                      : t('Обычно готово через 20–25 минут', 'Usually ready in 20–25 minutes')}
                  </small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="fulfillment-time"
                  checked={fulfillment.time.kind === 'scheduled'}
                  onChange={() => dispatch(setFulfillmentTime({
                    kind: 'scheduled',
                    slotId: selectedSlot?.id ?? FULFILLMENT_SLOTS[0].id,
                  }))}
                />
                <span>
                  <strong>{t('Ко времени', 'Schedule')}</strong>
                  <small>{t('Выберите удобный интервал', 'Choose a convenient time slot')}</small>
                </span>
              </label>
            </fieldset>
            {fulfillment.time.kind === 'scheduled' ? (
              <label className={styles.slotSelect}>
                <span>{t('Доступное время', 'Available time')}</span>
                <select
                  aria-label={t('Доступное время', 'Available time')}
                  value={fulfillment.time.slotId}
                  onChange={(event) => dispatch(setFulfillmentTime({
                    kind: 'scheduled',
                    slotId: event.target.value,
                  }))}
                >
                  {FULFILLMENT_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>{locale === 'ru' ? slot.label : slot.label.replace('Сегодня', 'Today').replace('Завтра', 'Tomorrow')}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </section>

          <details className="demo-controls">
            <summary>{t('Проверить delivery recovery', 'Test delivery recovery')}</summary>
            <div>
              <label htmlFor="checkout-scenario">{t('Демо-сценарий', 'Demo scenario')}</label>
              <select id="checkout-scenario" {...register('scenario')}>
                <option value="default">{t('Всё доступно', 'Everything available')}</option>
                <option value="unserviceable">{t('Адрес вне зоны', 'Address outside zone')}</option>
                <option value="closed-store">{t('Пиццерия закрыта', 'Pizzeria closed')}</option>
                <option value="slot-unavailable">{t('Слот занят', 'Slot unavailable')}</option>
                <option value="quote-expired">{t('Расчёт истёк', 'Quote expired')}</option>
                <option value="error">{t('Ошибка расчёта', 'Quote error')}</option>
                <option value="offline">{t('Нет соединения', 'Offline')}</option>
              </select>
              <p>{t('Сценарий проверяет демо-расчёт. Реальный заказ не отправляется.', 'This scenario tests the demo quote. No real order is sent.')}</p>
            </div>
          </details>

          {apiError ? (
            <div className={styles.error} role="alert">
              <strong>{t('Расчёт не подтверждён', 'Quote not confirmed')}</strong>
              <p>{locale === 'ru' ? apiError.data.message : checkoutErrorEnglish[apiError.data.code] ?? 'Could not confirm fulfillment.'}</p>
              <div className={styles.recoveryActions}>
                {apiError.data.code === 'closed-store' && apiError.data.alternativeStoreId ? (
                  <button type="button" onClick={chooseAlternativeStore}>
                    {t('Выбрать Napoli · Курская', 'Choose Napoli · Kurskaya')}
                  </button>
                ) : null}
                {apiError.data.code === 'slot-unavailable' ? (
                  <button type="button" onClick={chooseAsap}>{t('Выбрать ASAP', 'Choose ASAP')}</button>
                ) : null}
                {apiError.data.code === 'minimum' ? (
                  <Link to="/menu">{t('Добавить из меню', 'Add from menu')}</Link>
                ) : null}
              </div>
            </div>
          ) : null}

          {quoteState.data ? (
            <div className={quoteIsStale ? styles.stale : styles.quote} role="status" aria-live="polite">
              <strong>
                {quoteIsStale
                  ? t('Расчёт устарел', 'Quote is stale')
                  : quoteState.data.mode === 'delivery'
                    ? t('Адрес подтверждён', 'Address confirmed')
                    : t('Самовывоз подтверждён', 'Pickup confirmed')}
              </strong>
              <p>{localizeOperationalLabel(quoteState.data.locationLabel, locale)} · {localizeOperationalLabel(quoteState.data.etaLabel, locale)}</p>
              {quoteIsStale ? (
                <p>{t('Способ, точка, время, корзина или соединение изменились. Обновите расчёт.', 'Fulfillment mode, location, time, cart, or connection changed. Refresh the quote.')}</p>
              ) : null}
            </div>
          ) : null}

          <section aria-labelledby="promo-heading">
            <span className="status-code">04 / FINAL QUOTE</span>
            <h2 id="promo-heading">{t('Промокод и финальный итог', 'Promo code and final total')}</h2>
            <p className={styles.sectionCopy}>
              {t('Проверьте промокод, чтобы увидеть скидку в итоговой сумме.', 'Check your promo code to see the discount in your total.')}
            </p>
            <div className={styles.promoRow}>
              <label>
                <span>{t('Промокод', 'Promo code')} · {t('необязательно', 'optional')}</span>
                <input
                  ref={promoInputRef}
                  name="promo"
                  autoComplete="off"
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  aria-invalid={Boolean(finalQuoteError)}
                  aria-describedby={finalQuoteError ? 'promo-error' : 'promo-help'}
                />
              </label>
              <button
                type="button"
                onClick={() => void confirmFinalQuote()}
                disabled={!currentQuote || finalQuoteState.isLoading}
              >
                {finalQuoteState.isLoading
                  ? t('Подтверждаем итог…', 'Confirming total…')
                  : promoCode.trim()
                    ? t('Применить промокод', 'Apply promo code')
                    : t('Подтвердить итог', 'Confirm total')}
              </button>
              <small id="promo-help">{t('Регистр и пробелы не важны.', 'Capitalization and spaces do not matter.')}</small>
              {acceptedFinalQuote?.promo ? (
                <button
                  type="button"
                  className={styles.removePromo}
                  onClick={removePromo}
                  disabled={!currentQuote || finalQuoteState.isLoading}
                >
                  {t('Удалить промокод', 'Remove promo code')}
                </button>
              ) : null}
            </div>

            <details className={styles.promoHelp}>
              <summary>{t('Демо-коды и promo recovery', 'Demo codes and promo recovery')}</summary>
              <p>
                {t('NAPOLI10 — 10% от 1 000 ₽; COMBO200 — 200 ₽ при комбо от 1 500 ₽; EXPIRED22 — истёкший пример.', 'NAPOLI10 — 10% off from 1,000 ₽; COMBO200 — 200 ₽ off a combo order from 1,500 ₽; EXPIRED22 — an expired example.')}
              </p>
              <label htmlFor="final-quote-scenario">{t('Сценарий финального расчёта', 'Final quote scenario')}</label>
              <select
                id="final-quote-scenario"
                aria-label={t('Сценарий финального расчёта', 'Final quote scenario')}
                value={finalQuoteScenario}
                onChange={(event) => setFinalQuoteScenario(
                  event.target.value as FinalQuoteScenario,
                )}
              >
                <option value="default">{t('Обычный ответ', 'Normal response')}</option>
                <option value="slow">{t('Медленный ответ', 'Slow response')}</option>
                <option value="error">{t('Ошибка расчёта', 'Quote error')}</option>
                <option value="offline">{t('Нет соединения', 'Offline')}</option>
              </select>
            </details>

            {finalQuoteError ? (
              <div className={styles.error} id="promo-error" role="alert">
                <strong>{t('Итог не изменён', 'Total unchanged')}</strong>
                <p>{locale === 'ru' ? finalQuoteError.data.message : finalQuoteErrorEnglish[finalQuoteError.data.code] ?? 'Could not confirm the final total.'}</p>
              </div>
            ) : null}

            {acceptedFinalQuote ? (
              <div
                className={finalQuoteIsStale ? styles.stale : styles.quote}
                role="status"
                aria-live="polite"
              >
                <strong>
                  {finalQuoteIsStale
                    ? t('Финальный расчёт устарел', 'Final quote is stale')
                    : t('Финальный итог подтверждён', 'Final total confirmed')}
                </strong>
                <p>
                  Quote {acceptedFinalQuote.id} · {t('действует 10 минут', 'valid for 10 minutes')} ·
                  {acceptedFinalQuote.promo
                    ? ' ' + (locale === 'ru' ? acceptedFinalQuote.promo.label : 'Promo discount applied')
                    : ` ${t('без промокода', 'without a promo code')}`}
                </p>
              </div>
            ) : null}

            {quoteNeedsAcknowledgement && !finalQuoteIsStale ? (
              <label className={styles.acknowledgement}>
                <input
                  type="checkbox"
                  checked={quoteAcknowledged}
                  onChange={(event) => setQuoteAcknowledged(event.target.checked)}
                />
                <span>{t('Я проверил обновлённые итог и время', 'I checked the updated total and time')}</span>
              </label>
            ) : null}

            {finalQuoteReady ? (
              <p className={styles.ready} role="status">
                {t('Итог принят. Заказ готов к demo payment.', 'Total accepted. The order is ready for demo payment.')}
              </p>
            ) : null}
          </section>

          <section
            className={styles.demoPayment}
            aria-labelledby="payment-heading"
            aria-busy={paymentState.status === 'pending' || paymentState.status === 'recovering'}
          >
            <span className="status-code">05 / DEMO PAYMENT</span>
            <h2 id="payment-heading">{t('Безопасная симуляция оплаты', 'Safe payment simulation')}</h2>
            <p>
              {t('Это demo payment. Мы не запрашиваем номер карты, срок действия, PAN или CVC и не подключаем платёжного провайдера.', 'This is a demo payment. We do not request a card number, expiry date, PAN, or CVC, and no payment provider is connected.')}
            </p>
            <label className={styles.paymentScenario}>
              <span>{t('Исход demo payment', 'Demo payment outcome')}</span>
              <select
                aria-label={t('Исход demo payment', 'Demo payment outcome')}
                value={paymentScenario}
                onChange={(event) => setPaymentScenario(
                  event.target.value as MockPaymentScenario,
                )}
              >
                <option value="success">{t('Успешная симуляция', 'Successful simulation')}</option>
                <option value="decline">{t('Отклонить', 'Decline')}</option>
                <option value="timeout-after-create">{t('Таймаут после создания', 'Timeout after creation')}</option>
                <option value="error">{t('Сервис недоступен', 'Service unavailable')}</option>
              </select>
            </label>
            <button
              type="button"
              className={styles.payButton}
              onClick={() => void submitPayment()}
              disabled={
                !finalQuoteReady ||
                paymentState.status === 'pending' ||
                paymentState.status === 'recovering'
              }
            >
              {paymentState.status === 'pending'
                ? t('Проверяем demo payment…', 'Checking demo payment…')
                : paymentState.status === 'recovering'
                  ? t('Ищем созданный заказ…', 'Looking for the created order…')
                  : acceptedFinalQuote
                    ? `${t('Оплатить', 'Pay')} ${formatMinorMoney(acceptedFinalQuote.totalMinor)} ₽ ${t('и оформить', 'and place order')}`
                    : t('Сначала подтвердите итог', 'Confirm the total first')}
            </button>
            {!finalQuoteReady ? (
              <p className={styles.paymentHint}>
                {t('Обновите итог и подтвердите изменения перед оплатой.', 'Refresh the total and confirm any changes before payment.')}
              </p>
            ) : null}
            {paymentState.status === 'pending' || paymentState.status === 'recovering' ? (
              <p className={styles.paymentStatus} role="status" aria-live="polite">
                {paymentState.status === 'pending'
                  ? t('Проверяем demo payment…', 'Checking demo payment…')
                  : t('Проверяем, был ли заказ уже создан…', 'Checking whether the order was already created…')}
              </p>
            ) : null}
            {paymentState.status === 'declined' || paymentState.status === 'failed' ? (
              <div className={styles.error} role="alert">
                <strong>
                  {paymentState.status === 'declined'
                    ? t('Demo payment отклонён', 'Demo payment declined')
                    : t('Заказ не подтверждён', 'Order not confirmed')}
                </strong>
                <p>{paymentState.status === 'declined'
                  ? t('Симуляция отклонена. Измените сценарий и повторите попытку.', 'The simulation was declined. Change the scenario and try again.')
                  : t('Сервис временно недоступен. Итог сохранён — повторите попытку.', 'The service is temporarily unavailable. Your quote is preserved; try again.')}</p>
              </div>
            ) : null}
          </section>

          <div className={styles.stickyAction}>
            <button type="submit" disabled={quoteState.isLoading}>
              {actionLabel}
            </button>
          </div>
        </form>

        <aside className={styles.summary} aria-label={t('Предварительный итог', 'Order preview')}>
          <span className="status-code">ORDER / NAP</span>
          <h2>{t('Ваш заказ', 'Your order')}</h2>
          <ul>
            {lines.map((entry) => (
              <li key={entry.line.fingerprint}>
                <div>
                  <span>{entry.displayName} × {entry.line.quantity}</span>
                  <small className={styles.configuration}>{entry.configurationSummary.join(' · ')}</small>
                </div>
                <strong>
                  {entry.lineSubtotalMinor === null
                    ? '—'
                    : formatMinorMoney(entry.lineSubtotalMinor) + ' ₽'}
                </strong>
              </li>
            ))}
          </ul>
          <dl>
            <div>
              <dt>{t('Товары', 'Items')}</dt>
              <dd>
                {formatMinorMoney(
                  acceptedFinalQuote?.subtotalMinor ?? subtotalMinor,
                )} ₽
              </dd>
            </div>
            {acceptedFinalQuote?.promo ? (
              <div>
                <dt>{t('Скидка', 'Discount')} · {acceptedFinalQuote.promo.code}</dt>
                <dd>−{formatMinorMoney(acceptedFinalQuote.discountMinor)} ₽</dd>
              </div>
            ) : null}
            {acceptedFinalQuote || currentQuote ? (
              <div>
                <dt>
                  {(acceptedFinalQuote?.fulfillmentMode ?? currentQuote?.mode) === 'delivery'
                    ? t('Доставка', 'Delivery')
                    : t('Самовывоз', 'Pickup')}
                </dt>
                <dd>
                  {(acceptedFinalQuote?.feeMinor ?? currentQuote?.feeMinor ?? 0) === 0
                    ? t('Бесплатно', 'Free')
                    : formatMinorMoney(
                        acceptedFinalQuote?.feeMinor ?? currentQuote?.feeMinor ?? 0,
                      ) + ' ₽'}
                </dd>
              </div>
            ) : null}
          </dl>
          <strong>
            {formatMinorMoney(
              acceptedFinalQuote?.totalMinor ??
              currentQuote?.totalMinor ??
              subtotalMinor,
            )} ₽
          </strong>
          <p>
            {acceptedFinalQuote
              ? (finalQuoteIsStale ? t('Требуется свежий итог · ', 'Fresh total required · ') : t('Подтверждённый итог · ', 'Confirmed total · ')) +
                localizeOperationalLabel(acceptedFinalQuote.etaLabel, locale)
              : currentQuote
                ? t('Получение подтверждено. Подтвердите финальный итог.', 'Fulfillment confirmed. Confirm the final total.')
                : fulfillment.mode === 'delivery'
                  ? t('Укажите адрес для расчёта времени и стоимости доставки.', 'Enter an address to calculate delivery time and cost.')
                  : t('Выберите пиццерию и время получения.', 'Choose a pizzeria and pickup time.')}
          </p>
        </aside>
      </div>
    </div>
  );
}
