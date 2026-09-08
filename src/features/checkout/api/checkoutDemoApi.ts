import { serializeCartConfiguration } from '../../cart/model/cartConfiguration';
import {
  getFulfillmentSlot,
  getPickupStore,
} from '../model/fulfillment.types';
import type {
  CheckoutApiError,
  DeliveryQuoteRequest,
  FulfillmentQuote,
  FulfillmentQuoteRequest,
} from '../model/checkout.types';

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Quote request aborted', 'AbortError'));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
  });

const hash = (value: string) => {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return (result >>> 0).toString(16).padStart(8, '0');
};

export const createFulfillmentRequestKey = (
  request: FulfillmentQuoteRequest,
) => 'fulfillment-' + hash(JSON.stringify({
  lines: request.lines.map((line) => ({
    configuration: serializeCartConfiguration(line.configuration),
    quantity: line.quantity,
  })),
  subtotalMinor: request.subtotalMinor,
  mode: request.mode,
  location: request.mode === 'delivery'
    ? Object.fromEntries(
        Object.entries(request.address).map(([key, value]) => [key, value.trim()]),
      )
    : { storeId: request.storeId },
  time: request.time,
  scenario: request.scenario,
}));

export const createDeliveryRequestKey = (request: DeliveryQuoteRequest) =>
  createFulfillmentRequestKey(request);

const checkoutError = (
  status: CheckoutApiError['status'],
  data: CheckoutApiError['data'],
): CheckoutApiError => ({ status, data });

const timeLabel = (request: FulfillmentQuoteRequest) => {
  if (request.time.kind === 'asap') {
    return request.mode === 'delivery' ? '35–45 мин' : 'Готово через 20–25 мин';
  }
  return getFulfillmentSlot(request.time.slotId)?.label ?? 'Выбранное время';
};

export const requestFulfillmentQuote = async (
  request: FulfillmentQuoteRequest,
  signal: AbortSignal,
): Promise<FulfillmentQuote> => {
  await wait(220, signal);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (request.scenario === 'offline' || offline) {
    throw checkoutError('OFFLINE', {
      code: 'offline',
      message: 'Нет соединения. Данные сохранены — расчёт обновится после возвращения онлайн.',
      recoverable: true,
    });
  }
  if (request.scenario === 'error') {
    throw checkoutError(500, {
      code: 'http',
      message: 'Кухня не ответила на расчёт. Поля сохранены — повторите запрос.',
      recoverable: true,
    });
  }
  if (request.scenario === 'quote-expired') {
    throw checkoutError(409, {
      code: 'quote-expired',
      message: 'Время расчёта истекло. Получите свежий ETA и итог.',
      recoverable: true,
    });
  }
  if (
    request.time.kind === 'scheduled' &&
    (
      request.scenario === 'slot-unavailable' ||
      !getFulfillmentSlot(request.time.slotId)
    )
  ) {
    throw checkoutError(409, {
      code: 'slot-unavailable',
      message: 'Выбранное время уже недоступно. Выберите другой слот или ASAP.',
      recoverable: true,
    });
  }

  if (request.mode === 'delivery') {
    if (
      request.scenario === 'unserviceable' ||
      /за мкад|дальн/i.test(request.address.street)
    ) {
      throw checkoutError(422, {
        code: 'unserviceable',
        message: 'Этот адрес вне демо-зоны доставки. Укажите адрес внутри Москвы.',
        recoverable: true,
        fieldErrors: { street: 'Выберите улицу внутри демо-зоны Москвы.' },
      });
    }
  } else {
    const store = getPickupStore(request.storeId);
    if (!store || request.scenario === 'closed-store') {
      throw checkoutError(409, {
        code: 'closed-store',
        message: 'Эта пиццерия сейчас закрыта. Выберите открытую точку на Курской.',
        recoverable: true,
        alternativeStoreId: 'store-kurskaya',
      });
    }
  }

  const minimumMinor = request.mode === 'delivery' ? 50000 : 30000;
  if (request.subtotalMinor < minimumMinor) {
    throw checkoutError(422, {
      code: 'minimum',
      message: 'Минимальная сумма для ' +
        (request.mode === 'delivery' ? 'доставки' : 'самовывоза') +
        ' — ' + minimumMinor / 100 + ' ₽. Добавьте позицию в корзину.',
      recoverable: true,
    });
  }

  const requestKey = createFulfillmentRequestKey(request);
  const feeMinor = request.mode === 'delivery' && request.subtotalMinor < 200000
    ? 19900
    : 0;
  const base = {
    id: 'fq-' + requestKey.slice(-8),
    requestKey,
    feeMinor,
    subtotalMinor: request.subtotalMinor,
    totalMinor: request.subtotalMinor + feeMinor,
    etaLabel: timeLabel(request),
    minimumMinor,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };

  if (request.mode === 'delivery') {
    const addressLabel = request.address.street.trim() + ', ' + request.address.house.trim();
    return {
      ...base,
      mode: 'delivery',
      addressLabel,
      locationLabel: addressLabel,
    };
  }

  const store = getPickupStore(request.storeId);
  if (!store) {
    throw checkoutError(409, {
      code: 'closed-store',
      message: 'Пиццерия недоступна. Выберите другую точку.',
      recoverable: true,
    });
  }
  return {
    ...base,
    mode: 'pickup',
    locationLabel: store.name + ' · ' + store.address,
    store: {
      id: store.id,
      name: store.name,
      address: store.address,
    },
  };
};

export const requestDeliveryQuote = (
  request: DeliveryQuoteRequest,
  signal: AbortSignal,
) => requestFulfillmentQuote(request, signal).then((quote) => {
  if (quote.mode !== 'delivery') throw new Error('Expected delivery quote');
  return quote;
});

export const isCheckoutApiError = (error: unknown): error is CheckoutApiError =>
  typeof error === 'object' && error !== null && 'data' in error &&
  typeof (error as CheckoutApiError).data?.message === 'string';