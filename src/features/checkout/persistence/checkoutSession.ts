import type {
  CheckoutScenario,
  CheckoutSessionDraft,
  DeliveryCheckoutFields,
} from '../model/checkout.types';

export const CHECKOUT_SESSION_KEY = 'napoli:checkout:v1';
export const LEGACY_CHECKOUT_SESSION_KEY = 'forno22:checkout:v1';
const CHECKOUT_SESSION_VERSION = 1 as const;

export interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface CheckoutSessionEnvelope {
  schemaVersion: typeof CHECKOUT_SESSION_VERSION;
  savedAt: string;
  draft: CheckoutSessionDraft;
}

const scenarios = new Set<CheckoutScenario>([
  'default',
  'unserviceable',
  'error',
  'offline',
  'closed-store',
  'slot-unavailable',
  'quote-expired',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringField = (value: Record<string, unknown>, key: string) =>
  typeof value[key] === 'string' ? value[key] as string : null;

export const sanitizeCheckoutDraft = (
  fields: DeliveryCheckoutFields,
): CheckoutSessionDraft => ({
  name: fields.name,
  phone: fields.phone,
  email: fields.email,
  city: fields.city,
  street: fields.street,
  house: fields.house,
  apartment: fields.apartment,
  entrance: fields.entrance,
  floor: fields.floor,
  note: fields.note,
  scenario: fields.scenario,
});

export const saveCheckoutSession = (
  storage: SessionStorageLike,
  fields: DeliveryCheckoutFields,
) => {
  const envelope: CheckoutSessionEnvelope = {
    schemaVersion: CHECKOUT_SESSION_VERSION,
    savedAt: new Date().toISOString(),
    draft: sanitizeCheckoutDraft(fields),
  };
  storage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(envelope));
};

export const clearCheckoutSession = (storage: SessionStorageLike) => {
  try {
    storage.removeItem(CHECKOUT_SESSION_KEY);
    storage.removeItem(LEGACY_CHECKOUT_SESSION_KEY);
    return true;
  } catch {
    return false;
  }
};

export const loadCheckoutSession = (
  storage: SessionStorageLike,
): CheckoutSessionDraft | null => {
  try {
    const currentRaw = storage.getItem(CHECKOUT_SESSION_KEY);
    const legacyRaw = currentRaw ? null : storage.getItem(LEGACY_CHECKOUT_SESSION_KEY);
    const raw = currentRaw ?? legacyRaw;
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schemaVersion !== CHECKOUT_SESSION_VERSION || !isRecord(parsed.draft)) {
      storage.removeItem(currentRaw ? CHECKOUT_SESSION_KEY : LEGACY_CHECKOUT_SESSION_KEY);
      return null;
    }
    const draft = parsed.draft;
    const scenario = stringField(draft, 'scenario');
    const fields = ['name', 'phone', 'email', 'city', 'street', 'house', 'apartment', 'entrance', 'floor', 'note'] as const;
    const values = Object.fromEntries(fields.map((field) => [field, stringField(draft, field)]));
    if (Object.values(values).some((value) => value === null) || !scenario || !scenarios.has(scenario as CheckoutScenario)) {
      storage.removeItem(currentRaw ? CHECKOUT_SESSION_KEY : LEGACY_CHECKOUT_SESSION_KEY);
      return null;
    }
    const result = {
      ...(values as Omit<CheckoutSessionDraft, 'scenario'>),
      scenario: scenario as CheckoutScenario,
    };
    if (legacyRaw) {
      storage.setItem(CHECKOUT_SESSION_KEY, legacyRaw);
      storage.removeItem(LEGACY_CHECKOUT_SESSION_KEY);
    }
    return result;
  } catch {
    return null;
  }
};

export const getSessionStorage = (): SessionStorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
};
