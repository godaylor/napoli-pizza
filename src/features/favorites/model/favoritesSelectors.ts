import type { RootState } from '../../../redux/store';

export const selectFavoriteProductIds = (state: RootState) =>
  state.favorites.productIds;

export const selectFavoriteCount = (state: RootState) =>
  state.favorites.productIds.length;

export const selectFavoritesPersistenceWarning = (state: RootState) =>
  state.favorites.persistenceWarning;

export const selectIsFavorite = (productId: string) => (state: RootState) =>
  state.favorites.productIds.includes(productId);
