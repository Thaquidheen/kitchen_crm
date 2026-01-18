// Quotation feature exports

// Types
export * from './types';

// API
export { default as quotationsApi } from '@/app/baseApi';
export * from '@/app/baseApi';

// Redux slice
export { default as quotationsReducer } from './quotationsSlice';
export * from './quotationsSlice';

// Utilities
export * from './utils/pricingCalculations';
export * from './utils/quotationHelpers';
export { 
  useQuotationConversion,
  canConvertToProject,
  getConversionStatusMessage,
  getConversionButtonText,
  getConversionButtonVariant
} from './utils/quotationConversion';

// Re-export commonly used types for convenience
export type {
  Quotation,
  QuotationSummary,
  QuotationStatus,
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationFilters,
  QuotationStatistics,
  QuotationFormData,
  QuotationTotals,
  CategoryTotals,
} from './types';
