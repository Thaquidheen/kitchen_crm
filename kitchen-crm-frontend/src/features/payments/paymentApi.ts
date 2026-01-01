/**
 * Payment API integration
 * Handles all payment-related API calls
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  Payment,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  PaymentSummary,
  ProjectPaymentSummary,
  PaymentStatistics,
  PaymentFilters,
  PaymentListResponse,
  PaymentApiResponse,
} from './types';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all payments with filters and pagination
    getPayments: builder.query<PaymentListResponse, PaymentFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.projectId) params.append('projectId', filters.projectId.toString());
        if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
        if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: `${API_ENDPOINTS.PAYMENTS.BASE}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Payments'],
    }),

    // Get payment by ID
    getPaymentById: builder.query<PaymentApiResponse<Payment>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.PAYMENTS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
    }),

    // Get payments by project
    getPaymentsByProject: builder.query<PaymentApiResponse<PaymentSummary[]>, number>({
      query: (projectId) => ({
        url: API_ENDPOINTS.PAYMENTS.BY_PROJECT(projectId),
        method: 'GET',
      }),
      providesTags: (_result, _error, projectId) => [
        { type: 'Payments', id: 'LIST' },
        { type: 'Payments', id: projectId },
      ],
    }),

    // Get project payment summary
    getProjectPaymentSummary: builder.query<PaymentApiResponse<ProjectPaymentSummary>, number>({
      query: (projectId) => ({
        url: API_ENDPOINTS.PAYMENTS.PROJECT_SUMMARY(projectId),
        method: 'GET',
      }),
      providesTags: (_result, _error, projectId) => [
        { type: 'Payments', id: projectId },
      ],
    }),

    // Get payment statistics
    getPaymentStatistics: builder.query<PaymentApiResponse<PaymentStatistics>, void>({
      query: () => ({
        url: API_ENDPOINTS.PAYMENTS.STATISTICS,
        method: 'GET',
      }),
      providesTags: ['Payments'],
    }),

    // Get payment statistics by date range
    getPaymentStatisticsByDateRange: builder.query<
      PaymentApiResponse<PaymentStatistics>,
      { fromDate: string; toDate: string }
    >({
      query: ({ fromDate, toDate }) => ({
        url: `${API_ENDPOINTS.PAYMENTS.STATISTICS_DATE_RANGE}?fromDate=${fromDate}&toDate=${toDate}`,
        method: 'GET',
      }),
      providesTags: ['Payments'],
    }),

    // Create payment
    createPayment: builder.mutation<PaymentApiResponse<Payment>, PaymentCreateRequest>({
      query: (paymentData) => ({
        url: API_ENDPOINTS.PAYMENTS.BASE,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Payments'],
    }),

    // Add payment to project
    addPaymentToProject: builder.mutation<
      PaymentApiResponse<Payment>,
      { projectId: number; paymentData: PaymentCreateRequest }
    >({
      query: ({ projectId, paymentData }) => ({
        url: API_ENDPOINTS.PAYMENTS.ADD_TO_PROJECT(projectId),
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        'Payments',
        { type: 'Payments', id: projectId },
      ],
    }),

    // Update payment
    updatePayment: builder.mutation<
      PaymentApiResponse<Payment>,
      PaymentUpdateRequest
    >({
      query: ({ id, ...paymentData }) => ({
        url: API_ENDPOINTS.PAYMENTS.BY_ID(id),
        method: 'PUT',
        body: paymentData,
      }),
      invalidatesTags: (_result, _error, { id, projectId }) => [
        { type: 'Payments', id },
        'Payments',
        { type: 'Payments', id: projectId },
      ],
    }),

    // Delete payment
    deletePayment: builder.mutation<PaymentApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.PAYMENTS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Payments', id },
        'Payments',
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetPaymentsQuery,
  useGetPaymentByIdQuery,
  useGetPaymentsByProjectQuery,
  useGetProjectPaymentSummaryQuery,
  useGetPaymentStatisticsQuery,
  useGetPaymentStatisticsByDateRangeQuery,
  useCreatePaymentMutation,
  useAddPaymentToProjectMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} = paymentApi;
