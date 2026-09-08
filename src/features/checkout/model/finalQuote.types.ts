import type { CartConfiguration } from '../../cart/model/cart.types';
import type {
  FulfillmentQuote,
  QuoteCartLineInput,
} from './checkout.types';

export type FinalQuoteScenario = 'default' | 'slow' | 'error' | 'offline';

export interface FinalQuoteRequest {
  lines: QuoteCartLineInput[];
  fulfillmentQuote: FulfillmentQuote;
  promoCode: string | null;
  scenario: FinalQuoteScenario;
}

export interface FinalQuoteLine {
  configuration: CartConfiguration;
  quantity: number;
  name: string;
  unitPriceMinor: number;
  totalMinor: number;
}

export interface AppliedPromo {
  code: string;
  label: string;
  discountMinor: number;
}

export interface FinalQuoteSnapshot {
  id: string;
  requestKey: string;
  lines: FinalQuoteLine[];
  subtotalMinor: number;
  discountMinor: number;
  feeMinor: number;
  totalMinor: number;
  promo: AppliedPromo | null;
  fulfillmentMode: 'delivery' | 'pickup';
  fulfillmentLabel: string;
  etaLabel: string;
  issues: string[];
  expiresAt: string;
}

export interface FinalQuoteApiError {
  status: number | 'OFFLINE';
  data: {
    code:
      | 'promo-invalid'
      | 'promo-expired'
      | 'promo-minimum'
      | 'promo-ineligible'
      | 'quote-expired'
      | 'offline'
      | 'http';
    message: string;
    recoverable: boolean;
  };
}