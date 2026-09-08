import {
  calculateConfigurationPriceMinor,
  serializeCartConfiguration,
} from '../../cart/model/cartConfiguration';
import {
  PRODUCT_BY_ID,
  PRODUCT_DETAILS_BY_ID,
} from '../../cart/model/cartSelectors';
import type {
  AppliedPromo,
  FinalQuoteApiError,
  FinalQuoteLine,
  FinalQuoteRequest,
  FinalQuoteSnapshot,
} from '../model/finalQuote.types';

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Final quote request aborted', 'AbortError'));
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

export const normalizePromoCode = (value: string | null) => {
  const normalized = value?.trim().toUpperCase() ?? '';
  return normalized.length > 0 ? normalized : null;
};

export const createFinalQuoteRequestKey = (request: FinalQuoteRequest) =>
  'quote-' + hash(JSON.stringify({
    lines: request.lines.map((line) => ({
      configuration: serializeCartConfiguration(line.configuration),
      quantity: line.quantity,
    })),
    fulfillmentRequestKey: request.fulfillmentQuote.requestKey,
    fulfillmentMode: request.fulfillmentQuote.mode,
    promoCode: normalizePromoCode(request.promoCode),
    scenario: request.scenario,
  }));

const quoteError = (
  status: FinalQuoteApiError['status'],
  data: FinalQuoteApiError['data'],
): FinalQuoteApiError => ({ status, data });

export const calculatePercentageDiscountMinor = (
  subtotalMinor: number,
  percentage: number,
) => Math.round(subtotalMinor * percentage / 100);

export const evaluatePromo = (
  promoCode: string | null,
  subtotalMinor: number,
  productIds: readonly string[],
): AppliedPromo | null => {
  const code = normalizePromoCode(promoCode);
  if (!code) return null;

  if (code === 'EXPIRED22') {
    throw quoteError(410, {
      code: 'promo-expired',
      message: 'Промокод EXPIRED22 истёк. Итог не изменён.',
      recoverable: true,
    });
  }

  if (code === 'NAPOLI10' || code === 'FORNO10') {
    if (subtotalMinor < 100000) {
      throw quoteError(422, {
        code: 'promo-minimum',
        message: 'NAPOLI10 действует от 1 000 ₽. Итог не изменён.',
        recoverable: true,
      });
    }
    return {
      code: 'NAPOLI10',
      label: '10% на заказ',
      discountMinor: calculatePercentageDiscountMinor(subtotalMinor, 10),
    };
  }

  if (code === 'COMBO200') {
    if (subtotalMinor < 150000) {
      throw quoteError(422, {
        code: 'promo-minimum',
        message: 'COMBO200 действует от 1 500 ₽. Итог не изменён.',
        recoverable: true,
      });
    }
    if (!productIds.includes('201')) {
      throw quoteError(422, {
        code: 'promo-ineligible',
        message: 'COMBO200 действует только на заказ с комбо «Вечер на двоих». Итог не изменён.',
        recoverable: true,
      });
    }
    return {
      code,
      label: '200 ₽ на комбо',
      discountMinor: 20000,
    };
  }

  throw quoteError(422, {
    code: 'promo-invalid',
    message: 'Такого промокода нет. Проверьте написание — итог не изменён.',
    recoverable: true,
  });
};

const priceLines = (request: FinalQuoteRequest): FinalQuoteLine[] =>
  request.lines.map((line) => {
    const details = PRODUCT_DETAILS_BY_ID.get(line.configuration.productId);
    const product = PRODUCT_BY_ID.get(line.configuration.productId);
    if (!details || !product) {
      throw quoteError(409, {
        code: 'http',
        message: 'Состав заказа изменился. Вернитесь в корзину и проверьте позиции.',
        recoverable: true,
      });
    }
    const unitPriceMinor = calculateConfigurationPriceMinor(
      line.configuration,
      details,
    );
    return {
      configuration: line.configuration,
      quantity: line.quantity,
      name: product.name,
      unitPriceMinor,
      totalMinor: unitPriceMinor * line.quantity,
    };
  });

export const requestFinalQuote = async (
  request: FinalQuoteRequest,
  signal: AbortSignal,
): Promise<FinalQuoteSnapshot> => {
  await wait(request.scenario === 'slow' ? 800 : 240, signal);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (request.scenario === 'offline' || offline) {
    throw quoteError('OFFLINE', {
      code: 'offline',
      message: 'Нет соединения. Промокод и поля сохранены — повторите расчёт позже.',
      recoverable: true,
    });
  }
  if (request.scenario === 'error') {
    throw quoteError(500, {
      code: 'http',
      message: 'Не удалось подтвердить финальный итог. Повторите безопасный запрос.',
      recoverable: true,
    });
  }
  if (Date.parse(request.fulfillmentQuote.expiresAt) <= Date.now()) {
    throw quoteError(409, {
      code: 'quote-expired',
      message: 'Расчёт получения истёк. Сначала обновите адрес, точку или время.',
      recoverable: true,
    });
  }

  const lines = priceLines(request);
  const subtotalMinor = lines.reduce(
    (total, line) => total + line.totalMinor,
    0,
  );
  const promo = evaluatePromo(
    request.promoCode,
    subtotalMinor,
    lines.map((line) => line.configuration.productId),
  );
  const discountMinor = Math.min(promo?.discountMinor ?? 0, subtotalMinor);
  const feeMinor = request.fulfillmentQuote.mode === 'delivery' &&
    subtotalMinor < 200000
    ? 19900
    : 0;
  const totalMinor = subtotalMinor - discountMinor + feeMinor;
  const requestKey = createFinalQuoteRequestKey(request);

  return {
    id: 'quote-' + requestKey.slice(-8),
    requestKey,
    lines,
    subtotalMinor,
    discountMinor,
    feeMinor,
    totalMinor,
    promo,
    fulfillmentMode: request.fulfillmentQuote.mode,
    fulfillmentLabel: request.fulfillmentQuote.locationLabel,
    etaLabel: request.fulfillmentQuote.etaLabel,
    issues: [],
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
};

export const isFinalQuoteApiError = (
  error: unknown,
): error is FinalQuoteApiError =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  typeof (error as FinalQuoteApiError).data?.message === 'string';
