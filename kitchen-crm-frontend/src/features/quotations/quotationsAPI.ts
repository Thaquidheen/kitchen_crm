// Quotation API using RTK Query

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  CreateQuotationRequest,
  UpdateQuotationRequest,
  QuotationFilters,
} from './types';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/quotations`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token || localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const quotationsApi = createApi({
  reducerPath: 'quotationsApi',
  baseQuery,
  tagTypes: ['Quotation', 'QuotationSummary', 'QuotationStatistics'],
  endpoints: (builder) => ({
    // Get all quotations with filters
    getQuotations: builder.query<any, QuotationFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.customerId) params.append('customerId', filters.customerId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: '',
          params: Object.fromEntries(params),
        };
      },
      transformResponse: (response: any) => response?.data ?? { content: [], totalElements: 0, totalPages: 0 },
      providesTags: ['QuotationSummary'],
    }),

    // Get quotation statistics
    getQuotationStatistics: builder.query<any, void>({
      query: () => '/statistics',
      providesTags: ['QuotationStatistics'],
    }),

    // Get quotation by ID
    getQuotationById: builder.query<any, number>({
      query: (id) => `/${id}`,
      transformResponse: (response: any) => {
        console.log('Raw API response for getQuotationById:', response);
        // Backend returns ApiResponse<QuotationDto>, so extract the data
        return response?.data || response;
      },
      providesTags: (_result, _error, id) => [{ type: 'Quotation', id }],
    }),

    // Get quotations by customer
    getQuotationsByCustomer: builder.query<any, number>({
      query: (customerId) => `/customer/${customerId}`,
      providesTags: (_result, _error, customerId) => [
        { type: 'QuotationSummary', id: `customer-${customerId}` }
      ],
    }),

    // Search quotations
    searchQuotations: builder.query<any, string>({
      query: (searchTerm) => `/search?q=${encodeURIComponent(searchTerm)}`,
      providesTags: ['QuotationSummary'],
    }),

    // Create quotation
    createQuotation: builder.mutation<any, CreateQuotationRequest>({
      query: (quotation) => ({
        url: '',
        method: 'POST',
        body: quotation,
      }),
      invalidatesTags: ['QuotationSummary', 'QuotationStatistics'],
    }),

    // Update quotation
    updateQuotation: builder.mutation<any, UpdateQuotationRequest>({
      query: ({ id, ...quotation }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: quotation,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quotation', id },
        'QuotationSummary',
        'QuotationStatistics'
      ],
    }),

    // Delete quotation (SUPER_ADMIN only)
    deleteQuotation: builder.mutation<any, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['QuotationSummary', 'QuotationStatistics'],
    }),

    // Update quotation status (SUPER_ADMIN only)
    updateQuotationStatus: builder.mutation<any, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quotation', id },
        'QuotationSummary',
        'QuotationStatistics'
      ],
    }),

    // Duplicate quotation
    duplicateQuotation: builder.mutation<any, number>({
      query: (id) => ({
        url: `/${id}/duplicate`,
        method: 'POST',
      }),
      invalidatesTags: ['QuotationSummary', 'QuotationStatistics'],
    }),

    // Download quotation PDF
    downloadQuotationPDF: builder.mutation<Blob, number>({
      query: (id) => ({
        url: `/${id}/pdf`,
        method: 'GET',
        headers: { accept: 'application/pdf' },
        // Force blob parsing to avoid JSON parser errors
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Download quotation bill PDF (SUPER_ADMIN only)
    downloadQuotationBillPDF: builder.mutation<Blob, number>({
      query: (id) => ({
        url: `/${id}/bill/pdf`,
        method: 'GET',
        headers: { accept: 'application/pdf' },
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get available plan images for a customer
    getCustomerAvailablePlanImages: builder.query<any, number>({
      query: (customerId) => `/customers/${customerId}/available-plan-images`,
      transformResponse: (response: any) => response?.data || { planImages: [], designFiles: [] },
      providesTags: (result, error, customerId) => [
        { type: 'Quotation', id: `plan-images-${customerId}` },
      ],
    }),

    // Upload plan image for a customer
    uploadPlanImage: builder.mutation<any, { customerId: number; file: File; imageType: string; description?: string }>({
      query: ({ customerId, file, imageType, description }) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('customerId', customerId.toString());
        formData.append('imageType', imageType);
        if (description) {
          formData.append('description', description);
        }
        return {
          url: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/customers/plan-images/upload`,
          method: 'POST',
          body: formData,
        };
      },
      // Invalidate the available plan images query to refresh the list
      async onQueryStarted({ customerId }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Refetch the available plan images after successful upload
          dispatch(
            quotationsApi.util.invalidateTags([
              { type: 'Quotation', id: `plan-images-${customerId}` },
            ])
          );
        } catch {
          // Error handling is done in the component
        }
      },
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetQuotationsQuery,
  useGetQuotationStatisticsQuery,
  useGetQuotationByIdQuery,
  useGetQuotationsByCustomerQuery,
  useSearchQuotationsQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
  useUpdateQuotationStatusMutation,
  useDuplicateQuotationMutation,
  useDownloadQuotationPDFMutation,
  useDownloadQuotationBillPDFMutation,
  useGetCustomerAvailablePlanImagesQuery,
  useUploadPlanImageMutation,
} = quotationsApi;

// Export the API reducer
export default quotationsApi;
