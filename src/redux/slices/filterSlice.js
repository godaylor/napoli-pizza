import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeCategory: 0,
  currentPage: 1,
  sort: {
    sortName: 'популярности',
    sortProperty: '-rating',
  },
};

export const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setActiveCategory(state, action) {
      state.activeCategory = action.payload;
    },
    setSort(state, action) {
      state.sort = action.payload;
    },
    setCurrentPage(state, action) {
      state.currentPage = action.payload;
    },
    setFilters(state, action) {
      state.activeCategory = Number(action.payload.activeCategory);
      state.sort = action.payload.sort;
      state.currentPage = Number(action.payload.currentPage);
    },
  },
});

export const { setActiveCategory, setSort, setCurrentPage, setFilters } = filterSlice.actions;

export default filterSlice.reducer;
