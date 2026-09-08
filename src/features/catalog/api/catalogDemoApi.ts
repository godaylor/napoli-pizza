import { BADGE_LABELS, OWNED_CATALOG } from '../data/catalog.fixture';
import {
  BADGE_LABELS_BY_LOCALE,
  localizeCatalogProduct,
  localizeCatalogSnapshot,
} from '../data/catalogLocalization';
import { buildProductDetails } from '../../product/data/productConfiguration.fixture';
import type { ProductDetails } from '../../product/model/product.types';
import type {
  AvailabilityQueryArgs,
  CatalogProduct,
  CatalogScenario,
  CatalogSnapshot,
  CatalogSortKey,
  MenuQueryArgs,
  ProductAvailabilityEntry,
  ProductQueryArgs,
} from '../model/catalog.types';

export type CatalogDemoErrorCode = 'abort' | 'http' | 'not-found' | 'offline';

export class CatalogDemoError extends Error {
  readonly code: CatalogDemoErrorCode;
  readonly recoverable: boolean;
  readonly status?: number;

  constructor(
    code: CatalogDemoErrorCode,
    message: string,
    options: { recoverable?: boolean; status?: number } = {},
  ) {
    super(message);
    this.name = 'CatalogDemoError';
    this.code = code;
    this.recoverable = options.recoverable ?? true;
    this.status = options.status;
  }
}

const delays: Record<CatalogScenario, number> = {
  default: 90,
  slow: 1_200,
  empty: 180,
  error: 180,
  offline: 90,
  stale: 900,
};

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, milliseconds);
    const abort = () => {
      window.clearTimeout(timeout);
      reject(new CatalogDemoError('abort', 'Запрос каталога отменён.'));
    };

    if (signal.aborted) {
      abort();
      return;
    }

    signal.addEventListener('abort', abort, { once: true });
  });

const assertScenario = async (
  scenario: CatalogScenario,
  signal: AbortSignal,
) => {
  await wait(delays[scenario], signal);

  const browserOffline =
    typeof navigator !== 'undefined' && navigator.onLine === false;

  if (scenario === 'offline' || browserOffline) {
    throw new CatalogDemoError('offline', 'Нет соединения с интернетом.');
  }

  if (scenario === 'error') {
    throw new CatalogDemoError('http', 'Кухня не ответила на запрос каталога.', {
      status: 500,
    });
  }
};

const compareProducts = (sort: CatalogSortKey, locale: MenuQueryArgs['locale']) => {
  return (left: CatalogProduct, right: CatalogProduct) => {
    if (sort === 'price-asc') {
      return left.priceFromMinor - right.priceFromMinor;
    }

    if (sort === 'price-desc') {
      return right.priceFromMinor - left.priceFromMinor;
    }

    if (sort === 'name') {
      return left.name.localeCompare(right.name, locale);
    }

    return right.popularity - left.popularity;
  };
};

const matchesSearch = (product: CatalogProduct, value: string, locale: MenuQueryArgs['locale']) => {
  const query = value.trim().toLocaleLowerCase(locale);

  if (!query) {
    return true;
  }

  return [
    product.name,
    product.description,
    ...product.searchAliases,
    ...product.badges.map((badge) => locale === 'ru' ? BADGE_LABELS[badge] : BADGE_LABELS_BY_LOCALE.en[badge]),
    ...product.allergens,
  ]
    .join(' ')
    .toLocaleLowerCase(locale)
    .includes(query);
};

export const readMenu = async (
  args: MenuQueryArgs,
  signal: AbortSignal,
): Promise<CatalogSnapshot> => {
  await assertScenario(args.scenario, signal);
  const locale = args.locale ?? 'ru';
  const localizedCatalog = localizeCatalogSnapshot(OWNED_CATALOG, locale);

  const products =
    args.scenario === 'empty'
      ? []
      : localizedCatalog.products
          .filter(
            (product) =>
              (!args.category || product.categoryId === args.category) &&
              matchesSearch(product, args.q, locale) &&
              (!args.vegetarian || product.badges.includes('vegetarian')) &&
              (!args.spicy || product.badges.includes('spicy')) &&
              (!args.availability || product.availability.status === 'available'),
          )
          .sort(compareProducts(args.sort, locale));

  return {
    ...localizedCatalog,
    categories: [...localizedCatalog.categories],
    products,
  };
};

export const readProduct = async (
  args: ProductQueryArgs,
  signal: AbortSignal,
): Promise<ProductDetails> => {
  await assertScenario(args.scenario ?? 'default', signal);
  const legacySlugAliases: Record<string, string> = {
    'margherita-22': 'margherita-napoli',
    'pepperoni-forno': 'pepperoni-napoli',
    'lunch-22': 'napoli-lunch',
  };
  const slug = legacySlugAliases[args.slug] ?? args.slug;
  const product = OWNED_CATALOG.products.find((item) => item.slug === slug);

  if (!product) {
    throw new CatalogDemoError('not-found', 'Такого продукта нет в каталоге.', {
      recoverable: false,
      status: 404,
    });
  }

  const locale = args.locale ?? 'ru';
  return buildProductDetails(localizeCatalogProduct(product, locale), locale);
};

export const readAvailability = async (
  args: AvailabilityQueryArgs,
  signal: AbortSignal,
): Promise<ProductAvailabilityEntry[]> => {
  await assertScenario(args.scenario ?? 'default', signal);

  return OWNED_CATALOG.products.map((product) => ({
    productId: product.id,
    ...product.availability,
  }));
};
