import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface FavoritesState {
  productIds: string[];
  persistenceWarning: string | null;
}

export const createFavoritesInitialState = (
  productIds: readonly string[] = [],
  persistenceWarning: string | null = null,
): FavoritesState => ({
  productIds: [...new Set(productIds)].sort(),
  persistenceWarning,
});

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: createFavoritesInitialState(),
  reducers: {
    toggleFavorite(state, action: PayloadAction<string>) {
      const index = state.productIds.indexOf(action.payload);
      if (index >= 0) state.productIds.splice(index, 1);
      else state.productIds.push(action.payload);
      state.productIds.sort();
    },
    replaceFavorites(state, action: PayloadAction<string[]>) {
      state.productIds = [...new Set(action.payload)].sort();
    },
    setFavoritesPersistenceWarning(state, action: PayloadAction<string | null>) {
      state.persistenceWarning = action.payload;
    },
  },
});

export const {
  replaceFavorites,
  setFavoritesPersistenceWarning,
  toggleFavorite,
} = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;
