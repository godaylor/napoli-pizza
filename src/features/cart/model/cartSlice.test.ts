import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import {
  calculateCartCount,
  calculateCartSubtotalMinor,
  PRODUCT_DETAILS_BY_ID,
} from './cartSelectors';
import {
  CART_QUANTITY_MAX,
  addBaseVariant,
  addConfiguration,
  cartReducer,
  clearCart,
  createBaseConfiguration,
  decrementQuantity,
  editConfiguration,
  incrementQuantity,
  removeLine,
  undoCartMutation,
} from './cartSlice';

describe('M4A basic cart', () => {
  it('merges identical base configurations and counts quantity', () => {
    const store = configureStore({ reducer: cartReducer });
    const configuration = createBaseConfiguration('101', '101-30-thin');

    store.dispatch(addBaseVariant(configuration));
    store.dispatch(addBaseVariant(configuration));

    const lines = store.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
    expect(calculateCartCount(lines)).toBe(2);
  });

  it('merges reordered canonical selections and separates a removal difference', () => {
    const store = configureStore({ reducer: cartReducer });
    const first = {
      productId: '102',
      variantId: '102-30-thin',
      removedIngredientIds: ['red-onion'],
      modifierSelections: [
        { groupId: 'extras', modifierIds: ['extra-jalapeno', 'extra-mushrooms'] },
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
      ],
    };
    const reordered = {
      ...first,
      modifierSelections: [
        { groupId: 'cheese-style', modifierIds: ['extra-cheese'] },
        { groupId: 'extras', modifierIds: ['extra-mushrooms', 'extra-jalapeno'] },
      ],
    };

    store.dispatch(addConfiguration(first));
    store.dispatch(addConfiguration(reordered));
    store.dispatch(
      addConfiguration({ ...first, removedIngredientIds: ['oregano'] }),
    );

    expect(store.getState().lines).toHaveLength(2);
    expect(store.getState().lines.map((line) => line.quantity).sort()).toEqual([1, 2]);
  });
  it('keeps different variants separate and derives subtotal from catalog', () => {
    const store = configureStore({ reducer: cartReducer });
    store.dispatch(
      addBaseVariant(createBaseConfiguration('101', '101-25-thin')),
    );
    store.dispatch(
      addBaseVariant(createBaseConfiguration('101', '101-30-thin')),
    );

    const lines = store.getState().lines;
    expect(lines).toHaveLength(2);
    expect(calculateCartSubtotalMinor(lines, PRODUCT_DETAILS_BY_ID)).toBe(
      138000,
    );
  });

  it('enforces quantity boundaries without turning decrement into remove', () => {
    const store = configureStore({ reducer: cartReducer });
    const configuration = createBaseConfiguration('101', '101-25-thin');
    store.dispatch(addConfiguration(configuration));
    const fingerprint = store.getState().lines[0].fingerprint;

    store.dispatch(decrementQuantity(fingerprint));
    expect(store.getState().lines[0].quantity).toBe(1);
    for (let index = 0; index < CART_QUANTITY_MAX + 3; index += 1) {
      store.dispatch(incrementQuantity(fingerprint));
    }
    expect(store.getState().lines[0].quantity).toBe(CART_QUANTITY_MAX);
  });

  it('edits an exact line and merges its full quantity into an existing identity', () => {
    const store = configureStore({ reducer: cartReducer });
    const source = createBaseConfiguration('101', '101-25-thin');
    const target = createBaseConfiguration('101', '101-30-thin');
    store.dispatch(addConfiguration(source));
    store.dispatch(addConfiguration(source));
    store.dispatch(addConfiguration(target));
    const sourceFingerprint = store.getState().lines.find(
      (line) => line.configuration.variantId === source.variantId,
    )?.fingerprint;
    if (!sourceFingerprint) throw new Error('Source line missing');

    store.dispatch(editConfiguration({ sourceFingerprint, configuration: target }));
    expect(store.getState().lines).toHaveLength(1);
    expect(store.getState().lines[0].quantity).toBe(3);
    expect(store.getState().lines[0].configuration.variantId).toBe('101-30-thin');
  });

  it('undoes remove and clear with canonical quantities intact', () => {
    const store = configureStore({ reducer: cartReducer });
    store.dispatch(addConfiguration(createBaseConfiguration('101', '101-25-thin')));
    store.dispatch(addConfiguration(createBaseConfiguration('102', '102-30-thin')));
    const firstFingerprint = store.getState().lines[0].fingerprint;

    store.dispatch(removeLine(firstFingerprint));
    expect(store.getState().lines).toHaveLength(1);
    expect(store.getState().pendingUndo?.kind).toBe('remove');
    store.dispatch(undoCartMutation());
    expect(store.getState().lines).toHaveLength(2);

    store.dispatch(clearCart());
    expect(store.getState().lines).toEqual([]);
    expect(store.getState().pendingUndo?.kind).toBe('clear');
    store.dispatch(undoCartMutation());
    expect(store.getState().lines).toHaveLength(2);
  });
});
