import type {
  DemoOrder,
  DemoOrderInput,
  DemoOrderStatus,
  DemoOrderTracking,
  DemoTrackingScenario,
  SanitizedOrderHistoryEntry,
} from '../model/order.types';

export const ACTIVE_ORDER_SESSION_KEY = 'napoli:active-order:v1';
export const ORDER_HISTORY_STORAGE_KEY = 'napoli:order-history:v1';
export const LEGACY_ACTIVE_ORDER_SESSION_KEY = 'forno22:active-order:v1';
export const LEGACY_ORDER_HISTORY_STORAGE_KEY = 'forno22:order-history:v1';
export const ACTIVE_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
export const ORDER_HISTORY_TTL_MS = 90 * 24 * 60 * 60 * 1000;
export const ORDER_HISTORY_LIMIT = 20;
export const SEEDED_DEMO_ORDER_ID = 'nap_demo0000000001';

export interface OrderStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface DemoOrderEnvelope {
  schemaVersion: 1;
  order: DemoOrder;
}

interface HistoryEnvelope {
  schemaVersion: 1;
  savedAt: string;
  orders: SanitizedOrderHistoryEntry[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const orderStatuses: DemoOrderStatus[] = [
  'confirmed',
  'preparing',
  'baking',
  'ready_for_handoff',
  'out_for_delivery',
  'ready_for_pickup',
  'delivered',
  'picked_up',
  'cancelled',
];

const trackingScenarios: DemoTrackingScenario[] = [
  'default',
  'delayed',
  'cancelled',
];

const isOrderStatus = (value: unknown): value is DemoOrderStatus =>
  typeof value === 'string' && orderStatuses.includes(value as DemoOrderStatus);

const isTracking = (value: unknown): value is DemoOrderTracking =>
  isRecord(value) &&
  Number.isFinite(value.clockOffsetMs) &&
  Number.isFinite(value.elapsedFloorMs) &&
  typeof value.scenario === 'string' &&
  trackingScenarios.includes(value.scenario as DemoTrackingScenario);

const isDemoOrder = (value: unknown): value is DemoOrder => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.id.startsWith('nap_') || value.id.startsWith('f22_')) &&
    typeof value.idempotencyKey === 'string' &&
    isOrderStatus(value.status) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string' &&
    isRecord(value.quote) &&
    Array.isArray(value.quote.lines) &&
    typeof value.quote.totalMinor === 'number' &&
    isRecord(value.contact) &&
    typeof value.contact.name === 'string' &&
    typeof value.contact.phone === 'string' &&
    typeof value.contact.email === 'string' &&
    typeof value.note === 'string' &&
    isRecord(value.fulfillment) &&
    (value.fulfillment.mode === 'delivery' || value.fulfillment.mode === 'pickup') &&
    (!('tracking' in value) || isTracking(value.tracking))
  );
};

const normalizeDemoOrder = (order: DemoOrder): DemoOrder => ({
  ...order,
  tracking: isTracking(order.tracking)
    ? order.tracking
    : {
        clockOffsetMs: 0,
        elapsedFloorMs: 0,
        scenario: 'default',
      },
});

const isHistoryEntry = (
  value: unknown,
): value is SanitizedOrderHistoryEntry => {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (value.id.startsWith('nap_') || value.id.startsWith('f22_')) &&
    isOrderStatus(value.status) &&
    typeof value.createdAt === 'string' &&
    Array.isArray(value.lines) &&
    typeof value.subtotalMinor === 'number' &&
    typeof value.discountMinor === 'number' &&
    typeof value.feeMinor === 'number' &&
    typeof value.totalMinor === 'number' &&
    (value.promoCode === null || typeof value.promoCode === 'string') &&
    (value.fulfillmentMode === 'delivery' || value.fulfillmentMode === 'pickup') &&
    typeof value.fulfillmentLabel === 'string' &&
    (value.source === undefined || value.source === 'order' || value.source === 'seeded-demo')
  );
};

const sanitizeOrder = (order: DemoOrder): SanitizedOrderHistoryEntry => ({
  source: 'order',
  id: order.id,
  status: order.status,
  createdAt: order.createdAt,
  lines: order.quote.lines,
  subtotalMinor: order.quote.subtotalMinor,
  discountMinor: order.quote.discountMinor,
  feeMinor: order.quote.feeMinor,
  totalMinor: order.quote.totalMinor,
  promoCode: order.quote.promo?.code ?? null,
  fulfillmentMode: order.fulfillment.mode,
  fulfillmentLabel: order.fulfillment.mode === 'pickup'
    ? order.fulfillment.label
    : 'Доставка',
});

const createOpaqueOrderId = () => {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return 'nap_' + uuid.replaceAll('-', '').slice(0, 16);
  const fallback = Math.random().toString(36).slice(2) +
    Date.now().toString(36);
  return 'nap_' + fallback.slice(0, 16);
};

export class DemoOrderRepository {
  private activeMemory: DemoOrder | null = null;
  private historyMemory: SanitizedOrderHistoryEntry[] = [];

  constructor(
    private readonly sessionStorage: OrderStorageLike | null,
    private readonly localStorage: OrderStorageLike | null,
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = createOpaqueOrderId,
  ) {}

  create(
    input: DemoOrderInput,
    idempotencyKey: string,
  ): DemoOrder {
    const existing = this.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    const timestamp = new Date(this.now()).toISOString();
    const order: DemoOrder = {
      ...input,
      id: this.createId(),
      idempotencyKey,
      status: 'confirmed',
      createdAt: timestamp,
      updatedAt: timestamp,
      tracking: {
        clockOffsetMs: 0,
        elapsedFloorMs: 0,
        scenario: 'default',
      },
    };
    this.save(order);
    return order;
  }

  save(order: DemoOrder) {
    this.activeMemory = order;
    if (this.sessionStorage) {
      try {
        const envelope: DemoOrderEnvelope = {
          schemaVersion: 1,
          order,
        };
        this.sessionStorage.setItem(
          ACTIVE_ORDER_SESSION_KEY,
          JSON.stringify(envelope),
        );
      } catch {
        // In-memory order stays authoritative for the active tab.
      }
    }
    this.appendHistory(sanitizeOrder(order));
  }

  updateTracking(
    orderId: string,
    tracking: DemoOrderTracking,
    status: DemoOrderStatus,
  ): DemoOrder | null {
    const current = this.getActive(orderId);
    if (!current) return null;
    const updated: DemoOrder = {
      ...current,
      status,
      tracking,
      updatedAt: new Date(this.now()).toISOString(),
    };
    this.save(updated);
    return updated;
  }

  getActive(orderId: string): DemoOrder | null {
    const memory = this.activeMemory;
    if (memory?.id === orderId) {
      return this.isActive(memory) ? memory : null;
    }
    if (!this.sessionStorage) return null;
    try {
      const currentRaw = this.sessionStorage.getItem(ACTIVE_ORDER_SESSION_KEY);
      const legacyRaw = currentRaw ? null : this.sessionStorage.getItem(LEGACY_ACTIVE_ORDER_SESSION_KEY);
      const raw = currentRaw ?? legacyRaw;
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (
        !isRecord(parsed) ||
        parsed.schemaVersion !== 1 ||
        !isDemoOrder(parsed.order)
      ) {
        this.sessionStorage.removeItem(ACTIVE_ORDER_SESSION_KEY);
        return null;
      }
      const order = normalizeDemoOrder(parsed.order);
      if (!this.isActive(order)) {
        this.sessionStorage.removeItem(ACTIVE_ORDER_SESSION_KEY);
        return null;
      }
      this.activeMemory = order;
      if (legacyRaw) {
        this.sessionStorage.setItem(ACTIVE_ORDER_SESSION_KEY, legacyRaw);
        this.sessionStorage.removeItem(LEGACY_ACTIVE_ORDER_SESSION_KEY);
      }
      return order.id === orderId ? order : null;
    } catch {
      return null;
    }
  }

  findByIdempotencyKey(idempotencyKey: string): DemoOrder | null {
    const memory = this.activeMemory;
    if (memory?.idempotencyKey === idempotencyKey && this.isActive(memory)) {
      return memory;
    }
    if (!this.sessionStorage) return null;
    try {
      const currentRaw = this.sessionStorage.getItem(ACTIVE_ORDER_SESSION_KEY);
      const legacyRaw = currentRaw ? null : this.sessionStorage.getItem(LEGACY_ACTIVE_ORDER_SESSION_KEY);
      const raw = currentRaw ?? legacyRaw;
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (
        isRecord(parsed) &&
        parsed.schemaVersion === 1 &&
        isDemoOrder(parsed.order) &&
        this.isActive(parsed.order)
      ) {
        const order = normalizeDemoOrder(parsed.order);
        this.activeMemory = order;
        if (legacyRaw) {
          this.sessionStorage.setItem(ACTIVE_ORDER_SESSION_KEY, legacyRaw);
          this.sessionStorage.removeItem(LEGACY_ACTIVE_ORDER_SESSION_KEY);
        }
        return order.idempotencyKey === idempotencyKey
          ? order
          : null;
      }
      return null;
    } catch {
      return null;
    }
  }

  clearHistory() {
    this.historyMemory = [];
    if (!this.localStorage) return;
    try {
      this.localStorage.removeItem(ORDER_HISTORY_STORAGE_KEY);
      this.localStorage.removeItem(LEGACY_ORDER_HISTORY_STORAGE_KEY);
    } catch {
      // The active session order remains independent and available.
    }
  }

  seedDemoHistory(): SanitizedOrderHistoryEntry {
    const entry: SanitizedOrderHistoryEntry = {
      source: 'seeded-demo',
      id: SEEDED_DEMO_ORDER_ID,
      status: 'picked_up',
      createdAt: new Date(this.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lines: [{
        configuration: {
          productId: '201',
          variantId: '201-base',
          removedIngredientIds: [],
          modifierSelections: [],
        },
        quantity: 1,
        name: 'Вечер на двоих',
        unitPriceMinor: 199000,
        totalMinor: 199000,
      }],
      subtotalMinor: 199000,
      discountMinor: 0,
      feeMinor: 0,
      totalMinor: 199000,
      promoCode: null,
      fulfillmentMode: 'pickup',
      fulfillmentLabel: 'Demo · самовывоз из Napoli',
    };
    this.appendHistory(entry);
    return entry;
  }

  listHistory(): SanitizedOrderHistoryEntry[] {
    const cutoff = this.now() - ORDER_HISTORY_TTL_MS;
    let persisted: SanitizedOrderHistoryEntry[] = [];
    if (this.localStorage) {
      try {
        const currentRaw = this.localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
        const legacyRaw = currentRaw ? null : this.localStorage.getItem(LEGACY_ORDER_HISTORY_STORAGE_KEY);
        const raw = currentRaw ?? legacyRaw;
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (
            isRecord(parsed) &&
            (parsed.schemaVersion === 1 || parsed.schemaVersion === 0) &&
            Array.isArray(parsed.orders)
          ) {
            persisted = parsed.orders.filter(isHistoryEntry);
            if (legacyRaw) {
              this.localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, legacyRaw);
              this.localStorage.removeItem(LEGACY_ORDER_HISTORY_STORAGE_KEY);
            }
          } else {
            this.localStorage.removeItem(ORDER_HISTORY_STORAGE_KEY);
          }
        }
      } catch {
        persisted = [];
      }
    }

    const byId = new Map(
      [...persisted, ...this.historyMemory].map((entry) => [entry.id, entry]),
    );
    return [...byId.values()]
      .filter((entry) => Date.parse(entry.createdAt) >= cutoff)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, ORDER_HISTORY_LIMIT);
  }

  private isActive(order: DemoOrder) {
    return Date.parse(order.createdAt) >= this.now() - ACTIVE_ORDER_TTL_MS;
  }

  private appendHistory(entry: SanitizedOrderHistoryEntry) {
    this.historyMemory = [
      entry,
      ...this.historyMemory.filter((item) => item.id !== entry.id),
    ].slice(0, ORDER_HISTORY_LIMIT);
    if (!this.localStorage) return;
    try {
      const orders = [
        entry,
        ...this.listHistory().filter((item) => item.id !== entry.id),
      ].slice(0, ORDER_HISTORY_LIMIT);
      const envelope: HistoryEnvelope = {
        schemaVersion: 1,
        savedAt: new Date(this.now()).toISOString(),
        orders,
      };
      this.localStorage.setItem(
        ORDER_HISTORY_STORAGE_KEY,
        JSON.stringify(envelope),
      );
    } catch {
      // Active order remains available from session/in-memory storage.
    }
  }
}

const getStorage = (
  kind: 'localStorage' | 'sessionStorage',
): OrderStorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window[kind];
  } catch {
    return null;
  }
};

let browserRepository: DemoOrderRepository | null = null;

export const getDemoOrderRepository = () => {
  browserRepository ??= new DemoOrderRepository(
    getStorage('sessionStorage'),
    getStorage('localStorage'),
  );
  return browserRepository;
};
