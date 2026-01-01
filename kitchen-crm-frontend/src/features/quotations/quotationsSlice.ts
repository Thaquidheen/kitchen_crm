// Quotation Redux slice

import { createSlice } from '@reduxjs/toolkit';
import type { QuotationState } from './types';

const initialState: QuotationState = {
  quotations: [],
  currentQuotation: null,
  statistics: null,
  filters: {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    statistics: false,
  },
  error: null,
};

const quotationsSlice = createSlice({
  name: 'quotations',
  initialState,
  reducers: {
    // Set quotations list
    setQuotations: (state, action) => {
      state.quotations = action.payload;
    },

    // Set current quotation
    setCurrentQuotation: (state, action) => {
      state.currentQuotation = action.payload;
    },

    // Set quotation statistics
    setStatistics: (state, action) => {
      state.statistics = action.payload;
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
    },

    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Set loading state
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (key in state.loading) {
        (state.loading as any)[key] = value;
      }
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Add quotation to list (optimistic update)
    addQuotation: (state, action) => {
      state.quotations.unshift(action.payload);
    },

    // Update quotation in list (optimistic update)
    updateQuotationInList: (state, action) => {
      const index = state.quotations.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.quotations[index] = action.payload;
      }
    },

    // Remove quotation from list (optimistic update)
    removeQuotationFromList: (state, action) => {
      state.quotations = state.quotations.filter(q => q.id !== action.payload);
    },

    // Update quotation status in list (optimistic update)
    updateQuotationStatusInList: (state, action) => {
      const quotation = state.quotations.find(q => q.id === action.payload.id);
      if (quotation) {
        quotation.status = action.payload.status;
      }
    },

    // Reset state
    resetQuotationsState: () => initialState,
  },
});

export const {
  setQuotations,
  setCurrentQuotation,
  setStatistics,
  updateFilters,
  resetFilters,
  updatePagination,
  setLoading,
  setError,
  clearError,
  addQuotation,
  updateQuotationInList,
  removeQuotationFromList,
  updateQuotationStatusInList,
  resetQuotationsState,
} = quotationsSlice.actions;

export default quotationsSlice.reducer;

// Selectors
export const selectQuotations = (state: { quotations: QuotationState }) => state.quotations.quotations;
export const selectCurrentQuotation = (state: { quotations: QuotationState }) => state.quotations.currentQuotation;
export const selectQuotationStatistics = (state: { quotations: QuotationState }) => state.quotations.statistics;
export const selectQuotationFilters = (state: { quotations: QuotationState }) => state.quotations.filters;
export const selectQuotationPagination = (state: { quotations: QuotationState }) => state.quotations.pagination;
export const selectQuotationLoading = (state: { quotations: QuotationState }) => state.quotations.loading;
export const selectQuotationError = (state: { quotations: QuotationState }) => state.quotations.error;

// Complex selectors
export const selectQuotationsByStatus = (state: { quotations: QuotationState }, status: string) =>
  state.quotations.quotations.filter(q => q.status === status);

export const selectQuotationsByCustomer = (state: { quotations: QuotationState }, customerId: number) =>
  state.quotations.quotations.filter(q => (q as any).customerId === customerId);

export const selectQuotationById = (state: { quotations: QuotationState }, id: number) =>
  state.quotations.quotations.find(q => q.id === id);

export const selectQuotationLoadingState = (state: { quotations: QuotationState }) => ({
  isLoading: Object.values(state.quotations.loading).some(loading => loading),
  loadingStates: state.quotations.loading,
});

export const selectQuotationErrorState = (state: { quotations: QuotationState }) => ({
  hasError: !!state.quotations.error,
  error: state.quotations.error,
});
