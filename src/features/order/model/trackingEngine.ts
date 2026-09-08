import type {
  DemoOrderStatus,
  DemoOrderTracking,
  DemoTrackingScenario,
  OrderFulfillment,
} from './order.types';
import type { Locale } from '../../../shared/i18n/locale';

export const TRACKING_STEP_MS = 10_000;

interface TrackingSource {
  createdAt: string;
  fulfillment: Pick<OrderFulfillment, 'mode'>;
  tracking: DemoOrderTracking;
}

interface StepDefinition {
  status: DemoOrderStatus;
  label: string;
  detail: string;
  atMs: number;
}

export interface TrackingEvent extends StepDefinition {
  state: 'completed' | 'current' | 'upcoming';
}

export interface TrackingView {
  status: DemoOrderStatus;
  currentLabel: string;
  currentDetail: string;
  events: TrackingEvent[];
  elapsedMs: number;
  progressPercent: number;
  etaLabel: string;
  isTerminal: boolean;
  isDelayed: boolean;
  isCancelled: boolean;
}

const commonSteps = (locale: Locale): StepDefinition[] => [
  {
    status: 'confirmed',
    label: locale === 'ru' ? 'Заказ принят' : 'Order accepted',
    detail: locale === 'ru' ? 'Кухня получила подтверждённый заказ.' : 'The kitchen received the confirmed order.',
    atMs: 0,
  },
  {
    status: 'preparing',
    label: locale === 'ru' ? 'Начали готовить' : 'Preparation started',
    detail: locale === 'ru' ? 'Команда собирает ингредиенты и заказ.' : 'The team is gathering ingredients and assembling the order.',
    atMs: TRACKING_STEP_MS,
  },
  {
    status: 'baking',
    label: locale === 'ru' ? 'В печи' : 'In the oven',
    detail: locale === 'ru' ? 'Пицца проходит главный этап приготовления.' : 'The pizza is going through the main cooking stage.',
    atMs: TRACKING_STEP_MS * 2,
  },
  {
    status: 'ready_for_handoff',
    label: locale === 'ru' ? 'Упаковываем' : 'Packing',
    detail: locale === 'ru' ? 'Проверяем состав и готовим заказ к передаче.' : 'We are checking the items and preparing the order for handoff.',
    atMs: TRACKING_STEP_MS * 3,
  },
];

export const getTrackingSequence = (
  mode: OrderFulfillment['mode'],
  locale: Locale = 'ru',
): StepDefinition[] => [
  ...commonSteps(locale),
  mode === 'delivery'
    ? {
        status: 'out_for_delivery',
        label: locale === 'ru' ? 'Курьер в пути' : 'Courier en route',
        detail: locale === 'ru' ? 'Заказ передан курьеру и движется к адресу.' : 'The order is with the courier and moving toward the address.',
        atMs: TRACKING_STEP_MS * 4,
      }
    : {
        status: 'ready_for_pickup',
        label: locale === 'ru' ? 'Готов к выдаче' : 'Ready for pickup',
        detail: locale === 'ru' ? 'Заказ ждёт гостя в выбранной пиццерии.' : 'The order is waiting at the selected restaurant.',
        atMs: TRACKING_STEP_MS * 4,
      },
  mode === 'delivery'
    ? {
        status: 'delivered',
        label: locale === 'ru' ? 'Доставлен' : 'Delivered',
        detail: locale === 'ru' ? 'Демо-маршрут завершён.' : 'The demo route is complete.',
        atMs: TRACKING_STEP_MS * 6,
      }
    : {
        status: 'picked_up',
        label: locale === 'ru' ? 'Получен' : 'Picked up',
        detail: locale === 'ru' ? 'Заказ выдан гостю.' : 'The order has been handed to the guest.',
        atMs: TRACKING_STEP_MS * 5,
      },
];

const getElapsedMs = (source: TrackingSource, now: number) => {
  const createdAt = Date.parse(source.createdAt);
  const naturalElapsed = Number.isFinite(createdAt)
    ? now - createdAt + source.tracking.clockOffsetMs
    : 0;
  return Math.max(0, source.tracking.elapsedFloorMs, naturalElapsed);
};

const formatRemaining = (remainingMs: number, locale: Locale) => {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  return seconds < 60
    ? `${seconds} ${locale === 'ru' ? 'сек' : 'sec'}`
    : `${Math.ceil(seconds / 60)} ${locale === 'ru' ? 'мин' : 'min'}`;
};

export const deriveTracking = (
  source: TrackingSource,
  now: number,
  locale: Locale = 'ru',
): TrackingView => {
  const sequence = getTrackingSequence(source.fulfillment.mode, locale);
  const elapsedMs = getElapsedMs(source, now);
  const naturalIndex = sequence.reduce(
    (current, step, index) => elapsedMs >= step.atMs ? index : current,
    0,
  );

  if (source.tracking.scenario === 'cancelled') {
    const completed = sequence.slice(0, naturalIndex + 1).map((step) => ({
      ...step,
      state: 'completed' as const,
    }));
    const cancelled: TrackingEvent = {
      status: 'cancelled',
      label: locale === 'ru' ? 'Заказ отменён' : 'Order cancelled',
      detail: locale === 'ru' ? 'Это управляемый demo-сценарий. Новые этапы не добавляются.' : 'This is a controlled demo scenario. No new steps will be added.',
      atMs: elapsedMs,
      state: 'current',
    };
    return {
      status: 'cancelled',
      currentLabel: cancelled.label,
      currentDetail: cancelled.detail,
      events: [...completed, cancelled],
      elapsedMs,
      progressPercent: 100,
      etaLabel: locale === 'ru' ? 'Движение остановлено' : 'Progress stopped',
      isTerminal: true,
      isDelayed: false,
      isCancelled: true,
    };
  }

  const current = sequence[naturalIndex];
  const terminal = naturalIndex === sequence.length - 1;
  const isDelayed = source.tracking.scenario === 'delayed' && !terminal;
  const remainingMs = sequence.at(-1)!.atMs - elapsedMs;
  return {
    status: current.status,
    currentLabel: current.label,
    currentDetail: current.detail,
    events: sequence.map((step, index) => ({
      ...step,
      state: index < naturalIndex
        ? 'completed'
        : index === naturalIndex
          ? 'current'
          : 'upcoming',
    })),
    elapsedMs,
    progressPercent: Math.round(((naturalIndex + 1) / sequence.length) * 100),
    etaLabel: terminal
      ? (locale === 'ru' ? 'Заказ завершён' : 'Order complete')
      : isDelayed
        ? `${locale === 'ru' ? 'Есть задержка · около' : 'Delayed · about'} ${formatRemaining(remainingMs + TRACKING_STEP_MS * 6, locale)}`
        : `${locale === 'ru' ? 'До завершения около' : 'About'} ${formatRemaining(remainingMs, locale)}${locale === 'en' ? ' remaining' : ''}`,
    isTerminal: terminal,
    isDelayed,
    isCancelled: false,
  };
};

export const advanceTrackingClock = (
  source: TrackingSource,
  now: number,
): DemoOrderTracking => {
  if (source.tracking.scenario === 'cancelled') return source.tracking;
  const sequence = getTrackingSequence(source.fulfillment.mode);
  const view = deriveTracking(source, now);
  const currentIndex = sequence.findIndex((step) => step.status === view.status);
  const next = sequence[currentIndex + 1];
  if (!next) return {
    ...source.tracking,
    elapsedFloorMs: Math.max(source.tracking.elapsedFloorMs, view.elapsedMs),
  };
  const delta = Math.max(0, next.atMs - view.elapsedMs);
  return {
    ...source.tracking,
    clockOffsetMs: source.tracking.clockOffsetMs + delta,
    elapsedFloorMs: Math.max(source.tracking.elapsedFloorMs, next.atMs),
  };
};

export const replayTrackingClock = (
  source: TrackingSource,
  now: number,
): DemoOrderTracking => {
  const createdAt = Date.parse(source.createdAt);
  return {
    clockOffsetMs: Number.isFinite(createdAt) ? createdAt - now : 0,
    elapsedFloorMs: 0,
    scenario: 'default',
  };
};

export const setTrackingScenario = (
  source: TrackingSource,
  scenario: DemoTrackingScenario,
): DemoOrderTracking => ({
  ...source.tracking,
  scenario,
});
