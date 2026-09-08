import { describe, expect, it } from 'vitest';

import type { DemoOrderTracking } from './order.types';
import {
  advanceTrackingClock,
  deriveTracking,
  getTrackingSequence,
  replayTrackingClock,
  setTrackingScenario,
  TRACKING_STEP_MS,
} from './trackingEngine';

const createdAt = '2026-08-28T12:00:00.000Z';
const baseNow = Date.parse(createdAt);
const tracking = (): DemoOrderTracking => ({
  clockOffsetMs: 0,
  elapsedFloorMs: 0,
  scenario: 'default',
});
const source = (mode: 'delivery' | 'pickup' = 'delivery') => ({
  createdAt,
  fulfillment: { mode },
  tracking: tracking(),
});

describe('M9 deterministic tracking engine', () => {
  it('derives every delivery boundary and remains terminal', () => {
    const expected = [
      'confirmed',
      'preparing',
      'baking',
      'ready_for_handoff',
      'out_for_delivery',
      'delivered',
    ];
    const boundaries = [0, 1, 2, 3, 4, 6].map((step) => step * TRACKING_STEP_MS);
    expect(boundaries.map((elapsed) =>
      deriveTracking(source(), baseNow + elapsed).status,
    )).toEqual(expected);
    expect(deriveTracking(source(), baseNow + 20 * TRACKING_STEP_MS).status)
      .toBe('delivered');
  });

  it('uses a pickup-specific handoff and terminal sequence', () => {
    expect(getTrackingSequence('pickup').map((step) => step.status)).toEqual([
      'confirmed',
      'preparing',
      'baking',
      'ready_for_handoff',
      'ready_for_pickup',
      'picked_up',
    ]);
    const view = deriveTracking(source('pickup'), baseNow + 5 * TRACKING_STEP_MS);
    expect(view.status).toBe('picked_up');
    expect(view.currentLabel).toBe('Получен');
  });

  it('clamps clock skew and respects the persisted elapsed floor', () => {
    expect(deriveTracking(source(), baseNow - TRACKING_STEP_MS).status)
      .toBe('confirmed');
    const progressed = source();
    progressed.tracking.elapsedFloorMs = TRACKING_STEP_MS * 3;
    expect(deriveTracking(progressed, baseNow - TRACKING_STEP_MS).status)
      .toBe('ready_for_handoff');
  });

  it('exposes delayed and terminal cancelled states without fake events', () => {
    const delayed = source();
    delayed.tracking = setTrackingScenario(delayed, 'delayed');
    const delayedView = deriveTracking(delayed, baseNow + TRACKING_STEP_MS * 2);
    expect(delayedView.status).toBe('baking');
    expect(delayedView.isDelayed).toBe(true);
    expect(delayedView.etaLabel).toMatch(/задержка/i);

    const cancelled = source();
    cancelled.tracking = setTrackingScenario(cancelled, 'cancelled');
    const cancelledView = deriveTracking(cancelled, baseNow + TRACKING_STEP_MS * 2);
    expect(cancelledView.status).toBe('cancelled');
    expect(cancelledView.events.at(-1)).toMatchObject({
      label: 'Заказ отменён',
      state: 'current',
    });
    expect(cancelledView.events.some((event) => event.state === 'upcoming'))
      .toBe(false);
  });

  it('advances exactly one boundary and replay restarts from confirmed', () => {
    const order = source();
    order.tracking = advanceTrackingClock(order, baseNow);
    expect(deriveTracking(order, baseNow).status).toBe('preparing');
    order.tracking = advanceTrackingClock(order, baseNow);
    expect(deriveTracking(order, baseNow).status).toBe('baking');

    order.tracking = replayTrackingClock(order, baseNow + 123_000);
    expect(deriveTracking(order, baseNow + 123_000).status).toBe('confirmed');
  });
});