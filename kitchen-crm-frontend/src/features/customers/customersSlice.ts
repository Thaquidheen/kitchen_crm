/**
 * Customers Slice - Local UI state for Customers module
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { CustomerListParams, CustomerStatus } from './types';

export interface CustomersState {
  listParams: CustomerListParams;
  selectedCustomerId: number | null;
  lastUpdatedAt: string | null;
}

const initialState: CustomersState = {
  listParams: {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
    name: undefined,
    email: undefined,
    status: undefined,
  },
  selectedCustomerId: null,
  lastUpdatedAt: null,
};

export const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setListParams: (state, action: PayloadAction<Partial<CustomerListParams>>) => {
      state.listParams = { ...state.listParams, ...action.payload };
    },
    resetListParams: (state) => {
      state.listParams = initialState.listParams;
    },
    setSearchName: (state, action: PayloadAction<string | undefined>) => {
      state.listParams.name = action.payload;
      state.listParams.page = 0;
    },
    setSearchEmail: (state, action: PayloadAction<string | undefined>) => {
      state.listParams.email = action.payload;
      state.listParams.page = 0;
    },
    setStatusFilter: (state, action: PayloadAction<CustomerStatus | undefined>) => {
      state.listParams.status = action.payload;
      state.listParams.page = 0;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.listParams.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.listParams.size = action.payload;
      state.listParams.page = 0;
    },
    setSort: (
      state,
      action: PayloadAction<{ sortBy: string; sortDir: 'asc' | 'desc' }>
    ) => {
      state.listParams.sortBy = action.payload.sortBy;
      state.listParams.sortDir = action.payload.sortDir;
      state.listParams.page = 0;
    },
    selectCustomer: (state, action: PayloadAction<number | null>) => {
      state.selectedCustomerId = action.payload;
    },
    touchUpdatedAt: (state) => {
      state.lastUpdatedAt = new Date().toISOString();
    },
    resetCustomersState: () => initialState,
  },
});

export const {
  setListParams,
  resetListParams,
  setSearchName,
  setSearchEmail,
  setStatusFilter,
  setPage,
  setPageSize,
  setSort,
  selectCustomer,
  touchUpdatedAt,
  resetCustomersState,
} = customersSlice.actions;

export const selectCustomersState = (state: RootState) => state.customers;
export const selectCustomerListParams = (state: RootState) => state.customers.listParams;
export const selectSelectedCustomerId = (state: RootState) => state.customers.selectedCustomerId;
export const selectCustomersLastUpdatedAt = (state: RootState) => state.customers.lastUpdatedAt;

export default customersSlice.reducer;


