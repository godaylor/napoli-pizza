import type { CartConfiguration } from '../../cart/model/cart.types';
import type { FulfillmentTime } from './fulfillment.types';

export type CheckoutScenario =
  | 'default'
  | 'unserviceable'
  | 'error'
  | 'offline'
  | 'closed-store'
  | 'slot-unavailable'
  | 'quote-expired';

export interface DeliveryCheckoutFields {
  name: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  note: string;
  scenario: CheckoutScenario;
}

export interface QuoteCartLineInput {
  configuration: CartConfiguration;
  quantity: number;
}

interface QuoteRequestBase {
  lines: QuoteCartLineInput[];
  subtotalMinor: number;
  time: FulfillmentTime;
  scenario: CheckoutScenario;
}

export interface DeliveryQuoteRequest extends QuoteRequestBase {
  mode: 'delivery';
  address: {
    city: string;
    street: string;
    house: string;
    apartment: string;
    entrance: string;
    floor: string;
  };
}

export interface PickupQuoteRequest extends QuoteRequestBase {
  mode: 'pickup';
  storeId: string;
}

export type FulfillmentQuoteRequest =
  | DeliveryQuoteRequest
  | PickupQuoteRequest;

interface QuoteBase {
  id: string;
  requestKey: string;
  feeMinor: number;
  subtotalMinor: number;
  totalMinor: number;
  etaLabel: string;
  minimumMinor: number;
  expiresAt: string;
  locationLabel: string;
}

export interface DeliveryFulfillmentQuote extends QuoteBase {
  mode: 'delivery';
  addressLabel: string;
}

export interface PickupFulfillmentQuote extends QuoteBase {
  mode: 'pickup';
  store: {
    id: string;
    name: string;
    address: string;
  };
}

export type FulfillmentQuote =
  | DeliveryFulfillmentQuote
  | PickupFulfillmentQuote;

export interface CheckoutApiError {
  status: number | 'OFFLINE';
  data: {
    code:
      | 'unserviceable'
      | 'minimum'
      | 'offline'
      | 'http'
      | 'closed-store'
      | 'slot-unavailable'
      | 'quote-expired';
    message: string;
    recoverable: boolean;
    fieldErrors?: Partial<Record<keyof DeliveryCheckoutFields, string>>;
    alternativeStoreId?: string;
  };
}

export interface CheckoutSessionDraft {
  name: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  entrance: string;
  floor: string;
  note: string;
  scenario: CheckoutScenario;
}