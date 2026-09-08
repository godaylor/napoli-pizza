export type FulfillmentMode = 'delivery' | 'pickup';

export type FulfillmentTime =
  | { kind: 'asap' }
  | { kind: 'scheduled'; slotId: string };

export interface FulfillmentPreference {
  mode: FulfillmentMode;
  pickupStoreId: string;
  time: FulfillmentTime;
}

export interface PickupStore {
  id: string;
  name: string;
  address: string;
  hours: string;
}

export interface FulfillmentSlot {
  id: string;
  label: string;
}

export const DEFAULT_PICKUP_STORE_ID = 'store-tverskaya';

export const PICKUP_STORES: readonly PickupStore[] = [
  {
    id: DEFAULT_PICKUP_STORE_ID,
    name: 'Napoli · Тверская',
    address: 'Тверская, 22',
    hours: 'Ежедневно 10:00–23:00',
  },
  {
    id: 'store-kurskaya',
    name: 'Napoli · Курская',
    address: 'Земляной Вал, 33',
    hours: 'Ежедневно 09:00–22:00',
  },
];

export const FULFILLMENT_SLOTS: readonly FulfillmentSlot[] = [
  { id: 'today-1930', label: 'Сегодня, 19:30–20:00' },
  { id: 'today-2030', label: 'Сегодня, 20:30–21:00' },
  { id: 'tomorrow-1300', label: 'Завтра, 13:00–13:30' },
];

export const getPickupStore = (storeId: string) =>
  PICKUP_STORES.find((store) => store.id === storeId) ?? null;

export const getFulfillmentSlot = (slotId: string) =>
  FULFILLMENT_SLOTS.find((slot) => slot.id === slotId) ?? null;
