import { catalogApi } from '../../catalog/api/catalogApi';
import type {
  CheckoutApiError,
  FulfillmentQuote,
  FulfillmentQuoteRequest,
} from '../model/checkout.types';
import type {
  FinalQuoteApiError,
  FinalQuoteRequest,
  FinalQuoteSnapshot,
} from '../model/finalQuote.types';
import { requestFulfillmentQuote } from './checkoutDemoApi';
import { requestFinalQuote } from './finalQuoteDemoApi';

const hasNormalizedError = (
  error: unknown,
): error is CheckoutApiError | FinalQuoteApiError =>
  typeof error === 'object' &&
  error !== null &&
  'status' in error &&
  'data' in error;

const checkoutApi = catalogApi.injectEndpoints({
  endpoints: (builder) => ({
    createFulfillmentQuote: builder.mutation<FulfillmentQuote, FulfillmentQuoteRequest>({
      queryFn: async (request, api) => {
        try {
          return { data: await requestFulfillmentQuote(request, api.signal) };
        } catch (error) {
          if (hasNormalizedError(error)) {
            return { error: error as CheckoutApiError };
          }
          return {
            error: {
              status: 500,
              data: {
                code: 'http',
                message: 'Не удалось рассчитать получение заказа.',
                recoverable: true,
              },
            },
          };
        }
      },
    }),
    createFinalQuote: builder.mutation<FinalQuoteSnapshot, FinalQuoteRequest>({
      queryFn: async (request, api) => {
        try {
          return { data: await requestFinalQuote(request, api.signal) };
        } catch (error) {
          if (hasNormalizedError(error)) {
            return { error: error as FinalQuoteApiError };
          }
          return {
            error: {
              status: 500,
              data: {
                code: 'http',
                message: 'Не удалось подтвердить финальный итог.',
                recoverable: true,
              },
            },
          };
        }
      },
    }),
  }),
});

export const {
  useCreateFinalQuoteMutation,
  useCreateFulfillmentQuoteMutation,
} = checkoutApi;