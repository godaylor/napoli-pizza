import { describe, expect, it } from 'vitest';

import { createBaseConfiguration } from '../../cart/model/cartSlice';
import type { DemoOrderInput } from '../model/order.types';
import {
  initialPaymentState,
  paymentReducer,
} from '../model/paymentState';
import {
  DemoOrderRepository,
  type OrderStorageLike,
} from '../persistence/DemoOrderRepository';
import {
  isPaymentOrderError,
  recoverAmbiguousOrder,
  submitMockPaymentAndCreateOrder,
} from './orderDemoApi';

class MemoryStorage implements OrderStorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const input: DemoOrderInput = {
  quote: {
    id: 'quote-payment',
    requestKey: 'quote-request',
    lines: [{
      configuration: createBaseConfiguration('201', '201-base'),
      quantity: 1,
      name: 'Вечер на двоих',
      unitPriceMinor: 199000,
      totalMinor: 199000,
    }],
    subtotalMinor: 199000,
    discountMinor: 0,
    feeMinor: 19900,
    totalMinor: 218900,
    promo: null,
    fulfillmentMode: 'delivery',
    fulfillmentLabel: 'Тверская, 22',
    etaLabel: '35–45 мин',
    issues: [],
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  },
  contact: { name: 'Гость', phone: '+7 900 000-22-22', email: '' },
  note: '',
  fulfillment: {
    mode: 'delivery',
    label: 'Тверская, 22',
    address: {
      city: 'Москва',
      street: 'Тверская',
      house: '22',
      apartment: '',
      entrance: '',
      floor: '',
    },
    time: { kind: 'asap' },
  },
};

describe('M8 mock payment and order adapter', () => {
  it('models pending, decline, recovery and success transitions', () => {
    const pending = paymentReducer(initialPaymentState, { type: 'submit' });
    expect(pending.status).toBe('pending');
    expect(paymentReducer(pending, { type: 'submit' })).toBe(pending);
    expect(paymentReducer(pending, {
      type: 'decline',
      message: 'declined',
    }).status).toBe('declined');
    expect(paymentReducer(pending, { type: 'ambiguous' }).status).toBe('recovering');
    expect(paymentReducer(pending, {
      type: 'success',
      orderId: 'nap_order',
    })).toMatchObject({ status: 'succeeded', orderId: 'nap_order' });
  });

  it('decline creates no order and success retry creates exactly one', async () => {
    const repository = new DemoOrderRepository(
      new MemoryStorage(),
      new MemoryStorage(),
      Date.now,
      () => 'nap_decline0000000',
    );
    try {
      await submitMockPaymentAndCreateOrder(
        input,
        'idem-decline',
        'decline',
        repository,
        new AbortController().signal,
      );
      throw new Error('Expected decline');
    } catch (error) {
      expect(isPaymentOrderError(error)).toBe(true);
      if (isPaymentOrderError(error)) expect(error.code).toBe('declined');
    }
    expect(repository.listHistory()).toHaveLength(0);

    const order = await submitMockPaymentAndCreateOrder(
      input,
      'idem-decline',
      'success',
      repository,
      new AbortController().signal,
    );
    const duplicate = await submitMockPaymentAndCreateOrder(
      input,
      'idem-decline',
      'success',
      repository,
      new AbortController().signal,
    );
    expect(duplicate.id).toBe(order.id);
    expect(repository.listHistory()).toHaveLength(1);
  });

  it('recovers timeout-after-create by idempotency status lookup', async () => {
    const repository = new DemoOrderRepository(
      new MemoryStorage(),
      new MemoryStorage(),
      Date.now,
      () => 'nap_timeout0000000',
    );
    try {
      await submitMockPaymentAndCreateOrder(
        input,
        'idem-timeout',
        'timeout-after-create',
        repository,
        new AbortController().signal,
      );
      throw new Error('Expected ambiguous response');
    } catch (error) {
      expect(isPaymentOrderError(error)).toBe(true);
      if (isPaymentOrderError(error)) expect(error.code).toBe('ambiguous');
    }

    const recovered = await recoverAmbiguousOrder(
      'idem-timeout',
      repository,
      new AbortController().signal,
    );
    expect(recovered?.id).toBe('nap_timeout0000000');
    expect(repository.listHistory()).toHaveLength(1);
  });
});