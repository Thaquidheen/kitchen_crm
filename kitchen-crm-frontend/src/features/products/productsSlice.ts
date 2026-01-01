/**
 * Products Slice - Local UI state for Product Catalog
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { ListParams } from './types';

export interface ProductsState {
  listParams: ListParams;
  tab: 'categories' | 'brands' | 'materials' | 'cabinets' | 'doors' | 'accessories' | 'lighting';
}

const initialState: ProductsState = {
  listParams: {
    page: 0,
    size: 12,
    sortBy: 'createdAt',
    sortDir: 'desc',
    active: undefined,
    categoryId: undefined,
    brandId: undefined,
    materialId: undefined,
  },
  tab: 'cabinets',
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProductListParams: (state, action: PayloadAction<Partial<ListParams>>) => {
      state.listParams = { ...state.listParams, ...action.payload };
    },
    resetProductListParams: (state) => {
      state.listParams = initialState.listParams;
    },
    setProductsTab: (
      state,
      action: PayloadAction<ProductsState['tab']>
    ) => {
      state.tab = action.payload;
    },
  },
});

export const {
  setProductListParams,
  resetProductListParams,
  setProductsTab,
} = productsSlice.actions;

export const selectProductsState = (state: RootState) => state.products;
export const selectProductListParams = (state: RootState) => state.products.listParams;
export const selectProductsTab = (state: RootState) => state.products.tab;

export default productsSlice.reducer;


