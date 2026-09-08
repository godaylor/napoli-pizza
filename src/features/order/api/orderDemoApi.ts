import type { DemoOrder, DemoOrderInput } from '../model/order.types';
import type { MockPaymentScenario } from '../model/paymentState';
import type { DemoOrderRepository } from '../persistence/DemoOrderRepository';

export interface PaymentOrderError {
  code: 'declined' | 'ambiguous' | 'offline' | 'http';
  message: string;
  recoverable: boolean;
  idempotencyKey?: string;
}

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new DOMException('Payment request aborted', 'AbortError'));
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
  });

const paymentError = (
  error: PaymentOrderError,
): PaymentOrderError => error;

export const createOrderIdempotencyKey = (quoteId: string) => {
  const random = globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);
  return 'idem_' + quoteId + '_' + random.replaceAll('-', '');
};

export const submitMockPaymentAndCreateOrder = async (
  input: DemoOrderInput,
  idempotencyKey: string,
  scenario: MockPaymentScenario,
  repository: DemoOrderRepository,
  signal: AbortSignal,
): Promise<DemoOrder> => {
  await wait(320, signal);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  if (offline) {
    throw paymentError({
      code: 'offline',
      message: 'Нет соединения. Оплата не подтверждена, заказ не отправлен.',
      recoverable: true,
    });
  }
  if (scenario === 'decline') {
    throw paymentError({
      code: 'declined',
      message: 'Demo payment отклонён. Измените исход симуляции и повторите — данные заказа сохранены.',
      recoverable: true,
    });
  }
  if (scenario === 'error') {
    throw paymentError({
      code: 'http',
      message: 'Сервис demo payment не ответил. Заказ не создан; повторите вручную.',
      recoverable: true,
    });
  }

  const order = repository.create(input, idempotencyKey);
  if (scenario === 'timeout-after-create') {
    throw paymentError({
      code: 'ambiguous',
      message: 'Ответ потерян после создания заказа.',
      recoverable: true,
      idempotencyKey,
    });
  }
  return order;
};

export const recoverAmbiguousOrder = async (
  idempotencyKey: string,
  repository: DemoOrderRepository,
  signal: AbortSignal,
): Promise<DemoOrder | null> => {
  await wait(180, signal);
  return repository.findByIdempotencyKey(idempotencyKey);
};

export const isPaymentOrderError = (
  error: unknown,
): error is PaymentOrderError =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  'message' in error;