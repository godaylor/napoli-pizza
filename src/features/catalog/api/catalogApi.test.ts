import { afterEach, describe, expect, it, vi } from 'vitest';

import { setupStore } from '../../../redux/store';
import { catalogApi } from './catalogApi';
import type { MenuQueryArgs } from '../model/catalog.types';

const defaultArgs: MenuQueryArgs = {
  q: '',
  category: null,
  sort: 'popular',
  vegetarian: false,
  spicy: false,
  availability: false,
  scenario: 'default',
};

afterEach(() => {
  vi.useRealTimers();
});

describe('catalog RTK Query integration', () => {
  it('moves from loading to success and caches every argument combination separately', async () => {
    vi.useFakeTimers();
    const store = setupStore();
    const allRequest = store.dispatch(catalogApi.endpoints.getMenu.initiate(defaultArgs));

    expect(catalogApi.endpoints.getMenu.select(defaultArgs)(store.getState()).status).toBe('pending');
    await vi.advanceTimersByTimeAsync(100);
    expect((await allRequest.unwrap()).products).toHaveLength(36);

    const comboArgs = { ...defaultArgs, category: 'combo' as const };
    const comboRequest = store.dispatch(catalogApi.endpoints.getMenu.initiate(comboArgs));
    await vi.advanceTimersByTimeAsync(100);
    expect((await comboRequest.unwrap()).products).toHaveLength(4);
    expect(Object.keys(store.getState().catalogApi.queries)).toHaveLength(2);

    allRequest.unsubscribe();
    comboRequest.unsubscribe();
  });

  it('intersects aliases, category and filters and supports every stable sort key', async () => {
    vi.useFakeTimers();
    const store = setupStore();
    const aliasRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({
        ...defaultArgs,
        q: 'грибная',
        category: 'pizza',
      }),
    );
    const availablePizzaRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({
        ...defaultArgs,
        category: 'pizza',
        availability: true,
      }),
    );
    const intersectedRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({
        ...defaultArgs,
        vegetarian: true,
        spicy: true,
      }),
    );
    const ascendingRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({
        ...defaultArgs,
        sort: 'price-asc',
      }),
    );
    const descendingRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({
        ...defaultArgs,
        sort: 'price-desc',
      }),
    );
    const nameRequest = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({ ...defaultArgs, sort: 'name' }),
    );

    await vi.advanceTimersByTimeAsync(100);

    expect((await aliasRequest.unwrap()).products.map((product) => product.slug)).toEqual([
      'funghi-tartufo',
    ]);
    expect((await availablePizzaRequest.unwrap()).products).toHaveLength(13);
    expect((await intersectedRequest.unwrap()).products.map((product) => product.slug)).toEqual([
      'arrabbiata-sauce',
    ]);

    const ascending = (await ascendingRequest.unwrap()).products;
    const descending = (await descendingRequest.unwrap()).products;
    const byName = (await nameRequest.unwrap()).products;
    expect(ascending[0].priceFromMinor).toBeLessThanOrEqual(ascending.at(-1)!.priceFromMinor);
    expect(descending[0].priceFromMinor).toBeGreaterThanOrEqual(descending.at(-1)!.priceFromMinor);
    expect(byName.map((product) => product.name)).toEqual(
      [...byName.map((product) => product.name)].sort((left, right) =>
        left.localeCompare(right, 'ru'),
      ),
    );

    for (const request of [
      aliasRequest,
      availablePizzaRequest,
      intersectedRequest,
      ascendingRequest,
      descendingRequest,
      nameRequest,
    ]) {
      request.unsubscribe();
    }
  });

  it.each([
    ['empty', 0],
    ['slow', 36],
  ] as const)('handles the %s scenario', async (scenario, expectedProducts) => {
    vi.useFakeTimers();
    const store = setupStore();
    const args = { ...defaultArgs, scenario };
    const request = store.dispatch(catalogApi.endpoints.getMenu.initiate(args));

    await vi.advanceTimersByTimeAsync(scenario === 'slow' ? 1_200 : 200);
    expect((await request.unwrap()).products).toHaveLength(expectedProducts);
    request.unsubscribe();
  });

  it.each([
    ['error', 500, 'http'],
    ['offline', 'OFFLINE', 'offline'],
  ] as const)('normalizes the %s scenario', async (scenario, status, code) => {
    vi.useFakeTimers();
    const store = setupStore();
    const request = store.dispatch(
      catalogApi.endpoints.getMenu.initiate({ ...defaultArgs, scenario }),
    );

    await vi.advanceTimersByTimeAsync(200);
    await expect(request.unwrap()).rejects.toMatchObject({ status, data: { code } });
    request.unsubscribe();
  });

  it('keeps a fulfilled cache entry while a stale-refetch key is pending', async () => {
    vi.useFakeTimers();
    const store = setupStore();
    const first = store.dispatch(catalogApi.endpoints.getMenu.initiate(defaultArgs));
    await vi.advanceTimersByTimeAsync(100);
    await first.unwrap();

    const staleArgs = { ...defaultArgs, scenario: 'stale' as const };
    const stale = store.dispatch(catalogApi.endpoints.getMenu.initiate(staleArgs));
    expect(catalogApi.endpoints.getMenu.select(defaultArgs)(store.getState()).status).toBe('fulfilled');
    expect(catalogApi.endpoints.getMenu.select(staleArgs)(store.getState()).status).toBe('pending');

    await vi.advanceTimersByTimeAsync(900);
    expect((await stale.unwrap()).products).toHaveLength(36);
    first.unsubscribe();
    stale.unsubscribe();
  });

  it('provides product and availability endpoints from the same owned source', async () => {
    vi.useFakeTimers();
    const store = setupStore();
    const product = store.dispatch(catalogApi.endpoints.getProduct.initiate({ slug: 'margherita-napoli' }));
    const availability = store.dispatch(catalogApi.endpoints.getAvailability.initiate({}));

    await vi.advanceTimersByTimeAsync(100);
    const details = await product.unwrap();
    expect(details.product.name).toBe('Маргарита Napoli');
    expect(details.variants).toHaveLength(5);
    expect(details.productIngredients.length).toBeGreaterThan(0);
    expect(details.modifierGroups.map((group) => group.id)).toEqual([
      'cheese-style',
      'extras',
    ]);
    expect(details.variants.map((variant) => variant.id)).toEqual(
      details.product.variantIds,
    );
    expect(await availability.unwrap()).toHaveLength(36);
    product.unsubscribe();
    availability.unsubscribe();
  });
});
