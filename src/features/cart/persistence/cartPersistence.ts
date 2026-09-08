import {
  canonicalizeCartConfiguration,
  cartConfigurationFingerprint,
} from '../model/cartConfiguration';
import type { CartConfiguration, CartLine } from '../model/cart.types';
import { createFulfillmentInitialState } from '../../checkout/model/fulfillmentSlice';
import type {
  FulfillmentMode,
  FulfillmentPreference,
  FulfillmentTime,
} from '../../checkout/model/fulfillment.types';

export const CART_STORAGE_KEY = 'napoli:commerce:v1';
export const LEGACY_CART_STORAGE_KEY = 'forno22:commerce:v1';
export const CART_SCHEMA_VERSION = 1 as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface PersistedLine {
  configuration: CartConfiguration;
  quantity: number;
}

interface CartEnvelopeV1 {
  schemaVersion: typeof CART_SCHEMA_VERSION;
  savedAt: string;
  cart: { lines: PersistedLine[] };
  fulfillmentPreference: FulfillmentPreference;
}

interface CartEnvelopeV0 {
  schemaVersion: 0;
  lines: PersistedLine[];
}

interface ParsedCommerceEnvelope {
  lines: CartLine[];
  fulfillmentPreference: FulfillmentPreference;
}

export interface CartHydrationResult extends ParsedCommerceEnvelope {
  warning: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const parseConfiguration = (value: unknown): CartConfiguration | null => {
  if (!isRecord(value)) return null;
  const selections = value.modifierSelections;
  if (
    typeof value.productId !== 'string' ||
    typeof value.variantId !== 'string' ||
    !isStringArray(value.removedIngredientIds) ||
    !Array.isArray(selections)
  ) {
    return null;
  }

  const modifierSelections = selections.flatMap((selection) => {
    if (
      !isRecord(selection) ||
      typeof selection.groupId !== 'string' ||
      !isStringArray(selection.modifierIds)
    ) {
      return [];
    }
    return [{
      groupId: selection.groupId,
      modifierIds: selection.modifierIds,
    }];
  });
  if (modifierSelections.length !== selections.length) return null;

  return canonicalizeCartConfiguration({
    productId: value.productId,
    variantId: value.variantId,
    removedIngredientIds: value.removedIngredientIds,
    modifierSelections,
  });
};

const parseLines = (value: unknown): CartLine[] | null => {
  if (!Array.isArray(value)) return null;
  const parsed = value.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const configuration = parseConfiguration(candidate.configuration);
    const quantity = candidate.quantity;
    if (
      !configuration ||
      !Number.isSafeInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > 20
    ) {
      return [];
    }
    return [{
      configuration,
      fingerprint: cartConfigurationFingerprint(configuration),
      quantity: quantity as number,
    }];
  });
  return parsed.length === value.length ? parsed : null;
};

const parseFulfillmentTime = (value: unknown): FulfillmentTime => {
  if (
    isRecord(value) &&
    value.kind === 'scheduled' &&
    typeof value.slotId === 'string'
  ) {
    return { kind: 'scheduled', slotId: value.slotId };
  }
  return { kind: 'asap' };
};

const parseFulfillmentPreference = (value: unknown): FulfillmentPreference => {
  if (!isRecord(value)) return createFulfillmentInitialState();
  return createFulfillmentInitialState({
    mode: value.mode === 'pickup' ? 'pickup' : 'delivery',
    pickupStoreId: typeof value.pickupStoreId === 'string'
      ? value.pickupStoreId
      : undefined,
    time: parseFulfillmentTime(value.time),
  });
};

const parseCommerceEnvelope = (raw: string): ParsedCommerceEnvelope | null => {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;

    if (value.schemaVersion === CART_SCHEMA_VERSION) {
      if (!isRecord(value.cart)) return null;
      const lines = parseLines(value.cart.lines);
      if (!lines) return null;
      return {
        lines,
        fulfillmentPreference: parseFulfillmentPreference(value.fulfillmentPreference),
      };
    }
    if (value.schemaVersion === 0) {
      const lines = parseLines((value as unknown as CartEnvelopeV0).lines);
      return lines
        ? { lines, fulfillmentPreference: createFulfillmentInitialState() }
        : null;
    }
    return null;
  } catch {
    return null;
  }
};

export const parseCartEnvelope = (raw: string): CartLine[] | null =>
  parseCommerceEnvelope(raw)?.lines ?? null;

export const loadCart = (storage: StorageLike): CartHydrationResult => {
  const empty = {
    lines: [],
    fulfillmentPreference: createFulfillmentInitialState(),
  };
  try {
    const currentRaw = storage.getItem(CART_STORAGE_KEY);
    const legacyRaw = currentRaw ? null : storage.getItem(LEGACY_CART_STORAGE_KEY);
    const raw = currentRaw ?? legacyRaw;
    if (!raw) return { ...empty, warning: null };
    const parsed = parseCommerceEnvelope(raw);
    if (parsed) {
      if (legacyRaw) {
        storage.setItem(CART_STORAGE_KEY, legacyRaw);
        storage.removeItem(LEGACY_CART_STORAGE_KEY);
      }
      return { ...parsed, warning: null };
    }
    storage.removeItem(CART_STORAGE_KEY);
    storage.removeItem(LEGACY_CART_STORAGE_KEY);
    return {
      ...empty,
      warning: 'Сохранённая корзина была повреждена или устарела и безопасно сброшена.',
    };
  } catch {
    return {
      ...empty,
      warning: 'Хранилище недоступно. Корзина работает до закрытия этой вкладки.',
    };
  }
};

export const saveCart = (
  storage: StorageLike,
  lines: readonly CartLine[],
  fulfillment: FulfillmentPreference | FulfillmentMode = 'delivery',
) => {
  const fulfillmentPreference = typeof fulfillment === 'string'
    ? createFulfillmentInitialState({ mode: fulfillment })
    : createFulfillmentInitialState(fulfillment);
  const envelope: CartEnvelopeV1 = {
    schemaVersion: CART_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    cart: {
      lines: lines.map((line) => ({
        configuration: canonicalizeCartConfiguration(line.configuration),
        quantity: line.quantity,
      })),
    },
    fulfillmentPreference,
  };
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(envelope));
};
