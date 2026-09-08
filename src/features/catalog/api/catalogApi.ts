import {
  createApi,
  type BaseQueryFn,
} from '@reduxjs/toolkit/query/react';

import type { ProductDetails } from '../../product/model/product.types';

import {
  CatalogDemoError,
  readAvailability,
  readMenu,
  readProduct,
} from './catalogDemoApi';
import type {
  AvailabilityQueryArgs,
  CatalogSnapshot,
  MenuQueryArgs,
  ProductAvailabilityEntry,
  ProductQueryArgs,
} from '../model/catalog.types';
import { translate } from '../../../shared/i18n/locale';

type CatalogRequest =
  | ({ resource: 'menu' } & MenuQueryArgs)
  | ({ resource: 'product' } & ProductQueryArgs)
  | ({ resource: 'availability' } & AvailabilityQueryArgs);

export interface CatalogApiError {
  status: number | 'ABORTED' | 'OFFLINE';
  data: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

const catalogBaseQuery: BaseQueryFn<
  CatalogRequest,
  unknown,
  CatalogApiError
> = async (request, api) => {
  try {
    if (request.resource === 'menu') {
      return { data: await readMenu(request, api.signal) };
    }

    if (request.resource === 'product') {
      return { data: await readProduct(request, api.signal) };
    }

    return { data: await readAvailability(request, api.signal) };
  } catch (error) {
    const normalized =
      error instanceof CatalogDemoError
        ? error
        : new CatalogDemoError(
            'http',
            translate(request.locale ?? 'ru', 'Не удалось прочитать каталог.', 'Could not read the menu.'),
          );

    return {
      error: {
        status:
          normalized.code === 'offline'
            ? 'OFFLINE'
            : normalized.code === 'abort'
              ? 'ABORTED'
              : (normalized.status ?? 500),
        data: {
          code: normalized.code,
          message: normalized.message,
          recoverable: normalized.recoverable,
        },
      },
    };
  }
};

export const catalogApi = createApi({
  reducerPath: 'catalogApi',
  baseQuery: catalogBaseQuery,
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    getMenu: builder.query<CatalogSnapshot, MenuQueryArgs>({
      query: (args) => ({ resource: 'menu', ...args }),
    }),
    getProduct: builder.query<ProductDetails, ProductQueryArgs>({
      query: (args) => ({ resource: 'product', ...args }),
    }),
    getAvailability: builder.query<
      ProductAvailabilityEntry[],
      AvailabilityQueryArgs
    >({
      query: (args) => ({ resource: 'availability', ...args }),
    }),
  }),
});

export const {
  useGetAvailabilityQuery,
  useGetMenuQuery,
  useGetProductQuery,
} = catalogApi;

export const isCatalogApiError = (error: unknown): error is CatalogApiError =>
  typeof error === 'object' &&
  error !== null &&
  'data' in error &&
  typeof (error as CatalogApiError).data?.message === 'string';
