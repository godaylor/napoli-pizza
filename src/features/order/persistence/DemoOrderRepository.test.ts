import { describe, expect, it } from 'vitest';

import { createBaseConfiguration } from '../../cart/model/cartSlice';
import type { DemoOrderInput } from '../model/order.types';
import { advanceTrackingClock, deriveTracking } from '../model/trackingEngine';
import {
  ACTIVE_ORDER_SESSION_KEY,
  ACTIVE_ORDER_TTL_MS,
  DemoOrderRepository,
  ORDER_HISTORY_LIMIT,
  ORDER_HISTORY_STORAGE_KEY,
  ORDER_HISTORY_TTL_MS,
  LEGACY_ACTIVE_ORDER_SESSION_KEY,
  LEGACY_ORDER_HISTORY_STORAGE_KEY,
  type OrderStorageLike,
} from './DemoOrderRepository';

class MemoryStorage implements OrderStorageLike {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const nowBase = Date.parse('2026-08-28T12:00:00.000Z');

const input = (): DemoOrderInput => ({
  quote: {
    id: 'quote-demo',
    requestKey: 'quote-request',
    lines: [{
      configuration: createBaseConfiguration('201', '201-base'),
      quantity: 1,
      name: 'Вечер на двоих',
      unitPriceMinor: 199000,
      totalMinor: 199000,
    }],
    subtotalMinor: 199000,
    discountMinor: 19900,
    feeMinor: 19900,
    totalMinor: 199000,
    promo: {
      code: 'NAPOLI10',
      label: '10% на заказ',
      discountMinor: 19900,
    },
    fulfillmentMode: 'delivery',
    fulfillmentLabel: 'Тверская, 22',
    etaLabel: '35–45 мин',
    issues: [],
    expiresAt: '2026-08-28T12:10:00.000Z',
  },
  contact: {
    name: 'Анна',
    phone: '+7 900 111-22-33',
    email: 'anna@example.test',
  },
  note: 'Код домофона 2211',
  fulfillment: {
    mode: 'delivery',
    label: 'Тверская, 22',
    address: {
      city: 'Москва',
      street: 'Тверская',
      house: '22',
      apartment: '7',
      entrance: '2',
      floor: '3',
    },
    time: { kind: 'asap' },
  },
});

describe('M8 DemoOrderRepository', () => {
  it('creates one order per idempotency key and restores the full active snapshot', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    const repository = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_a8f4d2c91be740ab',
    );

    const first = repository.create(input(), 'idem-1');
    const second = repository.create(input(), 'idem-1');
    expect(second.id).toBe(first.id);
    expect(repository.listHistory()).toHaveLength(1);

    const reloaded = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_unused00000000',
    );
    expect(reloaded.getActive(first.id)).toEqual(first);
    expect(session.getItem(ACTIVE_ORDER_SESSION_KEY)).toContain('+7 900 111-22-33');
  });

  it('moves valid legacy branded active and history envelopes to Napoli keys', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    const writer = new DemoOrderRepository(session, local, () => nowBase, () => 'nap_migrate00000001');
    const order = writer.create(input(), 'idem-migrate');
    const activeRaw = session.getItem(ACTIVE_ORDER_SESSION_KEY)!;
    const historyRaw = local.getItem(ORDER_HISTORY_STORAGE_KEY)!;
    session.removeItem(ACTIVE_ORDER_SESSION_KEY);
    local.removeItem(ORDER_HISTORY_STORAGE_KEY);
    session.setItem(LEGACY_ACTIVE_ORDER_SESSION_KEY, activeRaw);
    local.setItem(LEGACY_ORDER_HISTORY_STORAGE_KEY, historyRaw);

    const reader = new DemoOrderRepository(session, local, () => nowBase);
    expect(reader.getActive(order.id)?.id).toBe(order.id);
    expect(reader.listHistory()).toHaveLength(1);
    expect(session.getItem(ACTIVE_ORDER_SESSION_KEY)).toBe(activeRaw);
    expect(local.getItem(ORDER_HISTORY_STORAGE_KEY)).toBe(historyRaw);
    expect(session.getItem(LEGACY_ACTIVE_ORDER_SESSION_KEY)).toBeNull();
    expect(local.getItem(LEGACY_ORDER_HISTORY_STORAGE_KEY)).toBeNull();
  });

  it('sanitizes local history and never stores contact, note or delivery address', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    const repository = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_b8f4d2c91be740ab',
    );
    repository.create(input(), 'idem-privacy');

    const raw = local.getItem(ORDER_HISTORY_STORAGE_KEY) ?? '';
    expect(raw).not.toContain('Анна');
    expect(raw).not.toContain('anna@example.test');
    expect(raw).not.toContain('900 111');
    expect(raw).not.toContain('Код домофона');
    expect(raw).not.toContain('Тверская, 22');
    expect(raw).toContain('"fulfillmentLabel":"Доставка"');
  });

  it('bounds history, expires old entries and reads the known v0 envelope', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    let now = nowBase;
    let sequence = 0;
    const repository = new DemoOrderRepository(
      session,
      local,
      () => now,
      () => 'nap_' + String(sequence++).padStart(16, '0'),
    );
    for (let index = 0; index < ORDER_HISTORY_LIMIT + 5; index += 1) {
      repository.create(input(), 'idem-' + index);
      now += 1000;
    }
    expect(repository.listHistory()).toHaveLength(ORDER_HISTORY_LIMIT);

    const current = repository.listHistory()[0];
    const old = {
      ...current,
      id: 'nap_old000000000000',
      createdAt: new Date(now - ORDER_HISTORY_TTL_MS - 1).toISOString(),
    };
    local.values.set(ORDER_HISTORY_STORAGE_KEY, JSON.stringify({
      schemaVersion: 0,
      orders: [current, old],
    }));
    const migrated = new DemoOrderRepository(session, local, () => now);
    expect(migrated.listHistory()).toEqual([current]);
  });

  it('quarantines corrupt and expired active snapshots', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    session.values.set(ACTIVE_ORDER_SESSION_KEY, '{broken');
    const corrupt = new DemoOrderRepository(session, local, () => nowBase);
    expect(corrupt.getActive('nap_missing')).toBeNull();

    const created = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_expired0000000',
    ).create(input(), 'idem-expired');
    const expired = new DemoOrderRepository(
      session,
      local,
      () => nowBase + ACTIVE_ORDER_TTL_MS + 1,
    );
    expect(expired.getActive(created.id)).toBeNull();
    expect(session.values.has(ACTIVE_ORDER_SESSION_KEY)).toBe(false);
  });
  it('migrates an M8 snapshot and reloads persisted M9 clock progress', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    const repository = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_trackreload0001',
    );
    const created = repository.create(input(), 'idem-track-reload');
    const nextTracking = advanceTrackingClock(created, nowBase);
    const nextView = deriveTracking({ ...created, tracking: nextTracking }, nowBase);
    repository.updateTracking(created.id, nextTracking, nextView.status);

    const reloaded = new DemoOrderRepository(session, local, () => nowBase);
    const restored = reloaded.getActive(created.id);
    expect(restored?.status).toBe('preparing');
    expect(restored && deriveTracking(restored, nowBase).status).toBe('preparing');

    const legacyEnvelope = JSON.parse(
      session.getItem(ACTIVE_ORDER_SESSION_KEY) ?? '{}',
    );
    delete legacyEnvelope.order.tracking;
    legacyEnvelope.order.status = 'confirmed';
    session.setItem(ACTIVE_ORDER_SESSION_KEY, JSON.stringify(legacyEnvelope));
    const migrated = new DemoOrderRepository(session, local, () => nowBase);
    expect(migrated.getActive(created.id)?.tracking).toEqual({
      clockOffsetMs: 0,
      elapsedFloorMs: 0,
      scenario: 'default',
    });
  });
  it('clears history without deleting the active session and seeds only labeled non-personal data', () => {
    const session = new MemoryStorage();
    const local = new MemoryStorage();
    const repository = new DemoOrderRepository(
      session,
      local,
      () => nowBase,
      () => 'nap_clear000000001',
    );
    const order = repository.create(input(), 'idem-clear');
    repository.clearHistory();

    expect(repository.listHistory()).toEqual([]);
    expect(repository.getActive(order.id)?.id).toBe(order.id);
    expect(session.getItem(ACTIVE_ORDER_SESSION_KEY)).toContain(order.id);

    repository.seedDemoHistory();
    const raw = local.getItem(ORDER_HISTORY_STORAGE_KEY) ?? '';
    expect(repository.listHistory()[0]).toMatchObject({
      source: 'seeded-demo',
      fulfillmentLabel: 'Demo · самовывоз из Napoli',
    });
    expect(raw).not.toMatch(/phone|email|address|note|Тверская|Анна/i);
  });
});

