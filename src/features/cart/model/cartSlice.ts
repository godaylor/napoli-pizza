import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import {
  canonicalizeCartConfiguration,
  cartConfigurationFingerprint,
} from './cartConfiguration';
import type { CartConfiguration, CartLine, CartState } from './cart.types';

export const CART_QUANTITY_MAX = 20;

export const createCartInitialState = (
  lines: CartLine[] = [],
  persistenceWarning: string | null = null,
): CartState => ({
  lines,
  pendingUndo: null,
  persistenceWarning,
});

const initialState: CartState = {
  lines: [],
  pendingUndo: null,
  persistenceWarning: null,
};

export const createBaseConfiguration = (
  productId: string,
  variantId: string,
): CartConfiguration => ({
  productId,
  variantId,
  removedIngredientIds: [],
  modifierSelections: [],
});

const addConfigurationToState = (
  state: CartState,
  rawConfiguration: CartConfiguration,
  quantity = 1,
) => {
  const configuration = canonicalizeCartConfiguration(rawConfiguration);
  const fingerprint = cartConfigurationFingerprint(configuration);
  const existingLine = state.lines.find(
    (line) => line.fingerprint === fingerprint,
  );

  if (existingLine) {
    existingLine.quantity = Math.min(
      CART_QUANTITY_MAX,
      existingLine.quantity + quantity,
    );
    return;
  }

  state.lines.push({
    configuration,
    fingerprint,
    quantity: Math.min(CART_QUANTITY_MAX, Math.max(1, quantity)),
  });
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addConfiguration: (state, action: PayloadAction<CartConfiguration>) => {
      addConfigurationToState(state, action.payload);
    },
    addBaseVariant: (state, action: PayloadAction<CartConfiguration>) => {
      addConfigurationToState(state, action.payload);
    },
    incrementQuantity: (state, action: PayloadAction<string>) => {
      const line = state.lines.find(
        (candidate) => candidate.fingerprint === action.payload,
      );
      if (line) {
        line.quantity = Math.min(CART_QUANTITY_MAX, line.quantity + 1);
      }
    },
    decrementQuantity: (state, action: PayloadAction<string>) => {
      const line = state.lines.find(
        (candidate) => candidate.fingerprint === action.payload,
      );
      if (line) {
        line.quantity = Math.max(1, line.quantity - 1);
      }
    },
    editConfiguration: (
      state,
      action: PayloadAction<{
        sourceFingerprint: string;
        configuration: CartConfiguration;
      }>,
    ) => {
      const sourceIndex = state.lines.findIndex(
        (line) => line.fingerprint === action.payload.sourceFingerprint,
      );
      if (sourceIndex === -1) return;

      const source = state.lines[sourceIndex];
      const configuration = canonicalizeCartConfiguration(
        action.payload.configuration,
      );
      const fingerprint = cartConfigurationFingerprint(configuration);
      if (fingerprint === source.fingerprint) {
        source.configuration = configuration;
        return;
      }

      state.lines.splice(sourceIndex, 1);
      addConfigurationToState(state, configuration, source.quantity);
    },
    removeLine: (state, action: PayloadAction<string>) => {
      const line = state.lines.find(
        (candidate) => candidate.fingerprint === action.payload,
      );
      if (!line) return;

      state.pendingUndo = {
        kind: 'remove',
        lines: [{
          ...line,
          configuration: canonicalizeCartConfiguration(line.configuration),
        }],
        message: 'Позиция удалена из корзины.',
      };
      state.lines = state.lines.filter(
        (candidate) => candidate.fingerprint !== action.payload,
      );
    },
    clearCart: (state) => {
      if (state.lines.length === 0) return;
      state.pendingUndo = {
        kind: 'clear',
        lines: state.lines.map((line) => ({
          ...line,
          configuration: canonicalizeCartConfiguration(line.configuration),
        })),
        message: 'Корзина очищена.',
      };
      state.lines = [];
    },
    undoCartMutation: (state) => {
      if (!state.pendingUndo) return;
      for (const line of state.pendingUndo.lines) {
        addConfigurationToState(state, line.configuration, line.quantity);
      }
      state.pendingUndo = null;
    },
    dismissCartUndo: (state) => {
      state.pendingUndo = null;
    },
    setPersistenceWarning: (state, action: PayloadAction<string | null>) => {
      state.persistenceWarning = action.payload;
    },
  },
});

export const {
  addBaseVariant,
  addConfiguration,
  clearCart,
  decrementQuantity,
  dismissCartUndo,
  editConfiguration,
  incrementQuantity,
  removeLine,
  setPersistenceWarning,
  undoCartMutation,
} = cartSlice.actions;
export const cartReducer = cartSlice.reducer;