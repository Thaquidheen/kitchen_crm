/**
 * Customers API - RTK Query endpoints for Customer module
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import type {
  Customer,
  CustomerCreate,
  CustomerListParams,
  CustomerRequirements,
  CustomerRequirementsCreate,
  CustomerRequirementsUpdate,
  CustomerStatistics,
  CustomerUpdate,
  PipelineDto,
  WorkflowHistoryDto,
} from './types';

export const customersAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List customers (paginated, filtered)
    getCustomers: builder.query<Customer[], CustomerListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.CUSTOMERS.BASE,
        params: params || {},
      }),
      transformResponse: (response: PaginatedApiResponse<Customer>) =>
        response.data?.content ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Customers' as const, id: c.id })),
              { type: 'Customers', id: 'LIST' },
            ]
          : [{ type: 'Customers', id: 'LIST' }],
    }),

    // Get paginated response meta if needed
    getCustomersPage: builder.query<PaginatedApiResponse<Customer>['data'], CustomerListParams | void>({
      query: (params) => ({
        url: API_ENDPOINTS.CUSTOMERS.BASE,
        params: params || {},
      }),
      transformResponse: (response: PaginatedApiResponse<Customer>) => response.data,
      providesTags: [{ type: 'Customers', id: 'PAGE' }],
    }),

    // Get customer by ID
    getCustomerById: builder.query<Customer, number>({
      query: (id) => API_ENDPOINTS.CUSTOMERS.BY_ID(id),
      transformResponse: (response: ApiResponse<Customer>) => response.data as Customer,
      providesTags: (result, error, id) => [{ type: 'Customers', id }],
    }),

    // Create customer
    createCustomer: builder.mutation<Customer, CustomerCreate>({
      query: (body) => ({
        url: API_ENDPOINTS.CUSTOMERS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Customer>) => response.data as Customer,
      invalidatesTags: [
        { type: 'Customers', id: 'LIST' },
        { type: 'Customers', id: 'PAGE' }
      ],
    }),

    // Update customer
    updateCustomer: builder.mutation<Customer, CustomerUpdate>({
      query: ({ id, ...rest }) => ({
        url: API_ENDPOINTS.CUSTOMERS.BY_ID(id),
        method: 'PUT',
        body: { id, ...rest },
      }),
      transformResponse: (response: ApiResponse<Customer>) => response.data as Customer,
      // Optimistic update for getCustomerById
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          customersAPI.util.updateQueryData('getCustomerById', id, (draft) => {
            Object.assign(draft, patch);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (result, error, arg) => [
        { type: 'Customers', id: arg.id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),

    // Delete customer
    deleteCustomer: builder.mutation<ApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.CUSTOMERS.BY_ID(id),
        method: 'DELETE',
      }),
      // Optimistically remove from list
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchList = dispatch(
          customersAPI.util.updateQueryData('getCustomers', undefined, (draft) => {
            return draft.filter((c) => c.id !== id);
          })
        );
        const patchPage = dispatch(
          customersAPI.util.updateQueryData('getCustomersPage', undefined, (draft) => {
            if (!draft) return;
            // Adjust page content and total counts defensively
            draft.content = draft.content?.filter((c) => c.id !== id) ?? [];
            if (typeof draft.totalElements === 'number' && draft.totalElements > 0) {
              draft.totalElements = draft.totalElements - 1;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchList.undo();
          patchPage.undo();
        }
      },
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),

    // Update status
    updateCustomerStatus: builder.mutation<ApiResponse<string>, { id: number; status: string; reason?: string }>(
      {
        query: ({ id, status, reason }) => ({
          url: API_ENDPOINTS.CUSTOMERS.STATUS(id),
          method: 'PATCH',
          params: { status, reason },
        }),
        // Optimistic update
        async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
          const patchResult = dispatch(
            customersAPI.util.updateQueryData('getCustomerById', id, (draft) => {
              if (draft) draft.status = status as Customer['status'];
            })
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo();
          }
        },
        invalidatesTags: (r, e, { id }) => [
          { type: 'Customers', id },
          { type: 'Customers', id: 'LIST' },
        ],
      }
    ),

    // Statistics
    getCustomerStatistics: builder.query<CustomerStatistics, void>({
      query: () => API_ENDPOINTS.CUSTOMERS.STATISTICS,
      transformResponse: (response: ApiResponse<CustomerStatistics>) => response.data as CustomerStatistics,
      providesTags: [{ type: 'Customers', id: 'STATS' }],
    }),

    // Pipeline
    getPipeline: builder.query<PipelineDto, number>({
      query: (customerId) => API_ENDPOINTS.CUSTOMERS.PIPELINE(customerId),
      transformResponse: (response: ApiResponse<PipelineDto>) => response.data as PipelineDto,
      providesTags: (r, e, customerId) => [{ type: 'Customers', id: `PIPELINE-${customerId}` }],
    }),

    updatePipeline: builder.mutation<PipelineDto, { customerId: number; pipeline: PipelineDto }>({
      query: ({ customerId, pipeline }) => ({
        url: API_ENDPOINTS.CUSTOMERS.PIPELINE(customerId),
        method: 'PUT',
        body: pipeline,
      }),
      transformResponse: (response: ApiResponse<PipelineDto>) => response.data as PipelineDto,
      async onQueryStarted({ customerId, pipeline }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          customersAPI.util.updateQueryData('getPipeline', customerId, (draft) => {
            Object.assign(draft, pipeline);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: (r, e, { customerId }) => [
        { type: 'Customers', id: `PIPELINE-${customerId}` },
        { type: 'Customers', id: 'LIST' },
      ],
    }),

    // Workflow history by customer
    getWorkflowHistoryByCustomer: builder.query<WorkflowHistoryDto[], number>({
      query: (customerId) => `/workflow/customer/${customerId}`,
      transformResponse: (response: ApiResponse<WorkflowHistoryDto[]>) =>
        (response.data as WorkflowHistoryDto[]) ?? [],
      providesTags: (r, e, customerId) => [{ type: 'Customers', id: `WORKFLOW-${customerId}` }],
    }),

    // Customer Requirements
    getCustomerRequirements: builder.query<CustomerRequirements, number>({
      query: (customerId) => API_ENDPOINTS.CUSTOMERS.REQUIREMENTS(customerId),
      transformResponse: (response: ApiResponse<CustomerRequirements>) => response.data as CustomerRequirements,
      providesTags: (result, error, customerId) => [{ type: 'Customers', id: `REQUIREMENTS-${customerId}` }],
    }),

    createCustomerRequirements: builder.mutation<CustomerRequirements, { customerId: number; data: CustomerRequirementsCreate }>({
      query: ({ customerId, data }) => ({
        url: API_ENDPOINTS.CUSTOMERS.REQUIREMENTS(customerId),
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<CustomerRequirements>) => response.data as CustomerRequirements,
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customers', id: `REQUIREMENTS-${customerId}` },
      ],
    }),

    updateCustomerRequirements: builder.mutation<CustomerRequirements, { customerId: number; data: CustomerRequirementsUpdate }>({
      query: ({ customerId, data }) => ({
        url: API_ENDPOINTS.CUSTOMERS.REQUIREMENTS(customerId),
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<CustomerRequirements>) => response.data as CustomerRequirements,
      invalidatesTags: (result, error, { customerId }) => [
        { type: 'Customers', id: `REQUIREMENTS-${customerId}` },
      ],
    }),

    deleteCustomerRequirements: builder.mutation<ApiResponse<string>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.CUSTOMERS.REQUIREMENTS(customerId),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, customerId) => [
        { type: 'Customers', id: `REQUIREMENTS-${customerId}` },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useGetCustomersPageQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useUpdateCustomerStatusMutation,
  useGetCustomerStatisticsQuery,
  useGetPipelineQuery,
  useUpdatePipelineMutation,
  useGetWorkflowHistoryByCustomerQuery,
  useGetCustomerRequirementsQuery,
  useCreateCustomerRequirementsMutation,
  useUpdateCustomerRequirementsMutation,
  useDeleteCustomerRequirementsMutation,
} = customersAPI;

export default customersAPI;


