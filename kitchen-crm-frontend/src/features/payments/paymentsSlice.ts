/**
 * Payment slice for Redux state management
 * Handles payment-related state and actions
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  PaymentMethod,
  PaymentStatus,
} from './types';
import type {
  Payment,
  PaymentSummary,
  PaymentFilters,
  PaymentFormData,
  PaymentFormErrors,
  ProjectPaymentSummary,
} from './types';

export interface PaymentState {
  // Current payment being viewed/edited
  currentPayment: Payment | null;
  
  // Payment list state
  payments: PaymentSummary[];
  totalPayments: number;
  currentPage: number;
  pageSize: number;
  
  // Filters and search
  filters: PaymentFilters;
  searchQuery: string;
  
  // Project-specific payments
  projectPayments: Record<number, PaymentSummary[]>;
  projectPaymentSummaries: Record<number, ProjectPaymentSummary>;
  
  // Form state
  paymentForm: PaymentFormData;
  formErrors: PaymentFormErrors;
  isFormValid: boolean;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Selection state
  selectedPayments: number[];
  
  // Statistics
  statistics: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    paymentsByMethod: Record<PaymentMethod, number>;
    paymentsByStatus: Record<PaymentStatus, number>;
  } | null;
}

const initialFormData: PaymentFormData = {
  projectId: 0,
  amount: '',
  paymentMethod: PaymentMethod.CASH,
  paymentDate: new Date().toISOString().split('T')[0],
  referenceNumber: '',
  notes: '',
};

const initialFilters: PaymentFilters = {
  page: 0,
  size: 10,
  sortBy: 'paymentDate',
  sortDir: 'desc',
};

const initialState: PaymentState = {
  currentPayment: null,
  payments: [],
  totalPayments: 0,
  currentPage: 0,
  pageSize: 10,
  filters: initialFilters,
  searchQuery: '',
  projectPayments: {},
  projectPaymentSummaries: {},
  paymentForm: initialFormData,
  formErrors: {},
  isFormValid: false,
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedPayments: [],
  statistics: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    // Payment list actions
    setPayments: (state, action: PayloadAction<PaymentSummary[]>) => {
      state.payments = action.payload;
    },
    
    setTotalPayments: (state, action: PayloadAction<number>) => {
      state.totalPayments = action.payload;
    },
    
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
      state.filters.page = action.payload;
    },
    
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.filters.size = action.payload;
    },
    
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<PaymentFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialFilters;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Project payment actions
    setProjectPayments: (state, action: PayloadAction<{ projectId: number; payments: PaymentSummary[] }>) => {
      const { projectId, payments } = action.payload;
      state.projectPayments[projectId] = payments;
    },
    
    setProjectPaymentSummary: (state, action: PayloadAction<{ projectId: number; summary: ProjectPaymentSummary }>) => {
      const { projectId, summary } = action.payload;
      state.projectPaymentSummaries[projectId] = summary;
    },
    
    // Form actions
    setPaymentForm: (state, action: PayloadAction<Partial<PaymentFormData>>) => {
      state.paymentForm = { ...state.paymentForm, ...action.payload };
    },
    
    resetPaymentForm: (state) => {
      state.paymentForm = initialFormData;
      state.formErrors = {};
      state.isFormValid = false;
    },
    
    setFormErrors: (state, action: PayloadAction<PaymentFormErrors>) => {
      state.formErrors = action.payload;
    },
    
    clearFormErrors: (state) => {
      state.formErrors = {};
    },
    
    setFormValid: (state, action: PayloadAction<boolean>) => {
      state.isFormValid = action.payload;
    },
    
    // Current payment actions
    setCurrentPayment: (state, action: PayloadAction<Payment | null>) => {
      state.currentPayment = action.payload;
    },
    
    // Selection actions
    setSelectedPayments: (state, action: PayloadAction<number[]>) => {
      state.selectedPayments = action.payload;
    },
    
    togglePaymentSelection: (state, action: PayloadAction<number>) => {
      const paymentId = action.payload;
      const index = state.selectedPayments.indexOf(paymentId);
      if (index > -1) {
        state.selectedPayments.splice(index, 1);
      } else {
        state.selectedPayments.push(paymentId);
      }
    },
    
    clearSelection: (state) => {
      state.selectedPayments = [];
    },
    
    // Loading and error actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Statistics actions
    setStatistics: (state, action: PayloadAction<PaymentState['statistics']>) => {
      state.statistics = action.payload;
    },
    
    // Utility actions
    addPaymentToList: (state, action: PayloadAction<PaymentSummary>) => {
      state.payments.unshift(action.payload);
      state.totalPayments += 1;
    },
    
    updatePaymentInList: (state, action: PayloadAction<PaymentSummary>) => {
      const updatedPayment = action.payload;
      const index = state.payments.findIndex(p => p.id === updatedPayment.id);
      if (index !== -1) {
        state.payments[index] = updatedPayment;
      }
    },
    
    removePaymentFromList: (state, action: PayloadAction<number>) => {
      const paymentId = action.payload;
      state.payments = state.payments.filter(p => p.id !== paymentId);
      state.totalPayments = Math.max(0, state.totalPayments - 1);
    },
  },
});

export const {
  setPayments,
  setTotalPayments,
  setCurrentPage,
  setPageSize,
  setFilters,
  clearFilters,
  setSearchQuery,
  setProjectPayments,
  setProjectPaymentSummary,
  setPaymentForm,
  resetPaymentForm,
  setFormErrors,
  clearFormErrors,
  setFormValid,
  setCurrentPayment,
  setSelectedPayments,
  togglePaymentSelection,
  clearSelection,
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setStatistics,
  addPaymentToList,
  updatePaymentInList,
  removePaymentFromList,
} = paymentSlice.actions;

export default paymentSlice.reducer;
