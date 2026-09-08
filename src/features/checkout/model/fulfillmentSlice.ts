import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '../../../redux/store';
import {
  DEFAULT_PICKUP_STORE_ID,
  getFulfillmentSlot,
  getPickupStore,
  type FulfillmentMode,
  type FulfillmentPreference,
  type FulfillmentTime,
} from './fulfillment.types';

export type FulfillmentState = FulfillmentPreference;

export const createFulfillmentInitialState = (
  preference?: Partial<FulfillmentPreference> | null,
): FulfillmentState => {
  const mode: FulfillmentMode = preference?.mode === 'pickup' ? 'pickup' : 'delivery';
  const pickupStoreId = preference?.pickupStoreId &&
    getPickupStore(preference.pickupStoreId)
    ? preference.pickupStoreId
    : DEFAULT_PICKUP_STORE_ID;
  const time: FulfillmentTime = preference?.time?.kind === 'scheduled' &&
    getFulfillmentSlot(preference.time.slotId)
    ? { kind: 'scheduled', slotId: preference.time.slotId }
    : { kind: 'asap' };

  return { mode, pickupStoreId, time };
};

const fulfillmentSlice = createSlice({
  name: 'fulfillment',
  initialState: createFulfillmentInitialState(),
  reducers: {
    setFulfillmentMode(state, action: PayloadAction<FulfillmentMode>) {
      state.mode = action.payload;
    },
    setPickupStore(state, action: PayloadAction<string>) {
      if (!getPickupStore(action.payload)) return;
      state.pickupStoreId = action.payload;
      state.time = { kind: 'asap' };
    },
    setFulfillmentTime(state, action: PayloadAction<FulfillmentTime>) {
      if (
        action.payload.kind === 'scheduled' &&
        !getFulfillmentSlot(action.payload.slotId)
      ) {
        return;
      }
      state.time = action.payload;
    },
  },
});

export const {
  setFulfillmentMode,
  setFulfillmentTime,
  setPickupStore,
} = fulfillmentSlice.actions;
export const fulfillmentReducer = fulfillmentSlice.reducer;

export const selectFulfillment = (state: RootState) => state.fulfillment;