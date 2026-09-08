import { describe, expect, it } from 'vitest';

import { setupStore } from '../../../redux/store';
import type { StorageLike } from '../../cart/persistence/cartPersistence';
import {
  createFavoritesInitialState,
  favoritesReducer,
  toggleFavorite,
} from './favoritesSlice';

describe('favorites slice', () => {
  it('deduplicates hydration and toggles stable product ids', () => {
    const initial = createFavoritesInitialState(['202', '101', '101']);
    const added = favoritesReducer(initial, toggleFavorite('303'));
    const removed = favoritesReducer(added, toggleFavorite('202'));

    expect(initial.productIds).toEqual(['101', '202']);
    expect(added.productIds).toEqual(['101', '202', '303']);
    expect(removed.productIds).toEqual(['101', '303']);
  });

  it('rolls an optimistic toggle back when storage fails', () => {
    const storage: StorageLike = {
      getItem: () => null,
      removeItem: () => undefined,
      setItem: () => { throw new Error('quota'); },
    };
    const store = setupStore({ storage });

    store.dispatch(toggleFavorite('101'));

    expect(store.getState().favorites.productIds).toEqual([]);
    expect(store.getState().favorites.persistenceWarning).toMatch(/возвращено/);
  });
});
