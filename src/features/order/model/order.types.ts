import type { FinalQuoteSnapshot } from '../../checkout/model/finalQuote.types';
import type {
  FulfillmentTime,
  PickupStore,
} from '../../checkout/model/fulfillment.types';

export type DemoOrderStatus =
  | 'confirmed'
  | 'preparing'
  | 'baking'
  | 'ready_for_handoff'
  | 'out_for_delivery'
  | 'ready_for_pickup'
  | 'delivered'
  | 'picked_up'
  | 'cancelled';

export type DemoTrackingScenario = 'default' | 'delayed' | 'cancelled';

export interface DemoOrderTracking {
  clockOffsetMs: number;
  elapsedFloorMs: number;
  scenario: DemoTrackingScenario;
}

export interface OrderContact {
  name: string;
  phone: string;
  email: string;
}

export type OrderFulfillment =
  | {
      mode: 'delivery';
      label: string;
      address: {
        city: string;
        street: string;
        house: string;
        apartment: string;
        entrance: string;
        floor: string;
      };
      time: FulfillmentTime;
    }
  | {
      mode: 'pickup';
      label: string;
      store: Pick<PickupStore, 'id' | 'name' | 'address'>;
      time: FulfillmentTime;
    };

export interface DemoOrderInput {
  quote: FinalQuoteSnapshot;
  contact: OrderContact;
  note: string;
  fulfillment: OrderFulfillment;
}

export interface DemoOrder extends DemoOrderInput {
  id: string;
  idempotencyKey: string;
  status: DemoOrderStatus;
  createdAt: string;
  updatedAt: string;
  tracking: DemoOrderTracking;
}

export interface SanitizedOrderHistoryEntry {
  source?: 'order' | 'seeded-demo';
  id: string;
  status: DemoOrderStatus;
  createdAt: string;
  lines: FinalQuoteSnapshot['lines'];
  subtotalMinor: number;
  discountMinor: number;
  feeMinor: number;
  totalMinor: number;
  promoCode: string | null;
  fulfillmentMode: 'delivery' | 'pickup';
  fulfillmentLabel: string;
}
