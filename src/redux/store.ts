import {
  configureStore,
  isAnyOf,
  type Middleware,
} from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { catalogApi } from '../features/catalog/api/catalogApi';
import {
  addBaseVariant,
  addConfiguration,
  cartReducer,
  clearCart,
  createCartInitialState,
  decrementQuantity,
  editConfiguration,
  incrementQuantity,
  removeLine,
  setPersistenceWarning,
  undoCartMutation,
} from '../features/cart/model/cartSlice';
import {
  loadCart,
  saveCart,
  type StorageLike,
} from '../features/cart/persistence/cartPersistence';
import {
  createFulfillmentInitialState,
  fulfillmentReducer,
  setFulfillmentMode,
  setFulfillmentTime,
  setPickupStore,
} from '../features/checkout/model/fulfillmentSlice';
import {
  createFavoritesInitialState,
  favoritesReducer,
  replaceFavorites,
  setFavoritesPersistenceWarning,
  toggleFavorite,
} from '../features/favorites/model/favoritesSlice';
import {
  loadFavorites,
  saveFavorites,
} from '../features/favorites/persistence/favoritesPersistence';

const persistsCommerce = isAnyOf(
  addBaseVariant,
  addConfiguration,
  clearCart,
  decrementQuantity,
  editConfiguration,
  incrementQuantity,
  removeLine,
  setFulfillmentMode,
  setFulfillmentTime,
  setPickupStore,
  undoCartMutation,
);

const createCommercePersistenceMiddleware = (
  storage: StorageLike | null,
): Middleware => (api) => (next) => (action) => {
  const result = next(action);
  if (!storage || !persistsCommerce(action)) return result;

  try {
    const state = api.getState() as {
      cart: ReturnType<typeof cartReducer>;
      fulfillment: ReturnType<typeof fulfillmentReducer>;
    };
    saveCart(storage, state.cart.lines, state.fulfillment);
    api.dispatch(setPersistenceWarning(null));
  } catch {
    api.dispatch(setPersistenceWarning(
      'Не удалось сохранить изменения. Корзина работает до закрытия этой вкладки.',
    ));
  }
  return result;
};

const createFavoritesPersistenceMiddleware = (
  storage: StorageLike | null,
): Middleware => (api) => (next) => (action) => {
  if (!toggleFavorite.match(action)) return next(action);

  const previousProductIds = (api.getState() as {
    favorites: ReturnType<typeof favoritesReducer>;
  }).favorites.productIds;
  const result = next(action);
  if (!storage) return result;

  try {
    const state = api.getState() as {
      favorites: ReturnType<typeof favoritesReducer>;
    };
    saveFavorites(storage, state.favorites.productIds);
    api.dispatch(setFavoritesPersistenceWarning(null));
  } catch {
    api.dispatch(replaceFavorites(previousProductIds));
    api.dispatch(setFavoritesPersistenceWarning(
      'Не удалось сохранить изменение. Избранное возвращено к последнему сохранённому состоянию.',
    ));
  }
  return result;
};

interface SetupStoreOptions {
  storage?: StorageLike | null;
}

export const setupStore = ({ storage = null }: SetupStoreOptions = {}) => {
  const hydration = storage
    ? loadCart(storage)
    : {
        lines: [],
        fulfillmentPreference: createFulfillmentInitialState(),
        warning: null,
      };
  const favoritesHydration = storage
    ? loadFavorites(storage)
    : { productIds: [], warning: null };
  const appStore = configureStore({
    reducer: {
      cart: cartReducer,
      fulfillment: fulfillmentReducer,
      favorites: favoritesReducer,
      [catalogApi.reducerPath]: catalogApi.reducer,
    },
    preloadedState: {
      cart: createCartInitialState(hydration.lines, hydration.warning),
      fulfillment: createFulfillmentInitialState(hydration.fulfillmentPreference),
      favorites: createFavoritesInitialState(
        favoritesHydration.productIds,
        favoritesHydration.warning,
      ),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        createCommercePersistenceMiddleware(storage),
        createFavoritesPersistenceMiddleware(storage),
        catalogApi.middleware,
      ),
  });

  setupListeners(appStore.dispatch);

  return appStore;
};

const getBrowserStorage = (): StorageLike | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
};

export const store = setupStore({ storage: getBrowserStorage() });

export type AppStore = ReturnType<typeof setupStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
