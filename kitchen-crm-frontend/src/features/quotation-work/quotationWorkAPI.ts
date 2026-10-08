import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';
import type {
  QuotationAssignee,
  QuotationJob,
  QuotationWorkFeed,
  QuotationWorkMe,
  QuotationWorkPriority,
  UnassignedQuotationCustomer,
} from './types';

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const quotationWorkAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuotationWorkMe: builder.query<QuotationWorkMe, void>({
      query: () => '/quotation-jobs/me',
      transformResponse: unwrap<QuotationWorkMe>('Failed to load profile'),
      providesTags: ['QuotationWork'],
    }),
    getQuotationJobs: builder.query<QuotationJob[], void>({
      query: () => '/quotation-jobs',
      transformResponse: (r: ApiResponse<QuotationJob[]>) => r.data ?? [],
      providesTags: ['QuotationWork'],
    }),
    getUnassignedQuotationCustomers: builder.query<UnassignedQuotationCustomer[], void>({
      query: () => '/quotation-jobs/unassigned',
      transformResponse: (r: ApiResponse<UnassignedQuotationCustomer[]>) => r.data ?? [],
      // Everyone in Quotation Stage that nobody is preparing: a new quotation or a stage change moves them.
      providesTags: ['QuotationWork', 'Quotations', 'Customers'],
    }),
    getQuotationAssignees: builder.query<QuotationAssignee[], void>({
      query: () => '/quotation-jobs/assignees',
      transformResponse: (r: ApiResponse<QuotationAssignee[]>) => r.data ?? [],
      providesTags: ['QuotationWork', 'Staff'],
    }),
    getQuotationWorkFeed: builder.query<QuotationWorkFeed, void>({
      query: () => '/quotation-jobs/feed',
      transformResponse: (r: ApiResponse<QuotationWorkFeed>) => r.data ?? { count: 0, jobs: [] },
      providesTags: ['QuotationWork'],
    }),
    assignQuotationWork: builder.mutation<
      QuotationJob,
      { customerId: number; assigneeId: number; dueDate?: string; priority?: QuotationWorkPriority; note?: string }
    >({
      query: (body) => ({ url: '/quotation-jobs/assign', method: 'POST', body }),
      transformResponse: unwrap<QuotationJob>('Failed to assign the quotation'),
      invalidatesTags: ['QuotationWork'],
    }),
    updateQuotationJob: builder.mutation<
      QuotationJob,
      {
        id: number;
        assigneeId?: number;
        dueDate?: string;
        clearDueDate?: boolean;
        priority?: QuotationWorkPriority;
        note?: string;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/quotation-jobs/${id}`, method: 'PUT', body }),
      transformResponse: unwrap<QuotationJob>('Failed to save'),
      invalidatesTags: ['QuotationWork'],
    }),
    reorderQuotationJobs: builder.mutation<QuotationJob[], { assigneeId: number; jobIds: number[] }>({
      query: (body) => ({ url: '/quotation-jobs/reorder', method: 'PUT', body }),
      transformResponse: unwrap<QuotationJob[]>('Failed to save the order'),
      invalidatesTags: ['QuotationWork'],
    }),
    cancelQuotationJob: builder.mutation<QuotationJob, number>({
      query: (id) => ({ url: `/quotation-jobs/${id}/cancel`, method: 'PUT' }),
      transformResponse: unwrap<QuotationJob>('Failed to remove'),
      invalidatesTags: ['QuotationWork'],
    }),
    startQuotationJob: builder.mutation<QuotationJob, number>({
      query: (id) => ({ url: `/quotation-jobs/${id}/start`, method: 'PUT' }),
      transformResponse: unwrap<QuotationJob>('Failed to start'),
      invalidatesTags: ['QuotationWork'],
    }),
    completeQuotationJob: builder.mutation<QuotationJob, { id: number; quotationId?: number }>({
      query: ({ id, quotationId }) => ({ url: `/quotation-jobs/${id}/complete`, method: 'PUT', body: { quotationId } }),
      transformResponse: unwrap<QuotationJob>('Failed to complete'),
      // The quotation handed in now reads Completed in the list.
      invalidatesTags: ['QuotationWork', 'Quotations'],
    }),
    markQuotationWorkSeen: builder.mutation<number, void>({
      query: () => ({ url: '/quotation-jobs/seen', method: 'PUT' }),
      transformResponse: (r: ApiResponse<number>) => r.data ?? 0,
      invalidatesTags: ['QuotationWork'],
    }),
  }),
});

export const {
  useGetQuotationWorkMeQuery,
  useGetQuotationJobsQuery,
  useGetUnassignedQuotationCustomersQuery,
  useGetQuotationAssigneesQuery,
  useGetQuotationWorkFeedQuery,
  useAssignQuotationWorkMutation,
  useUpdateQuotationJobMutation,
  useReorderQuotationJobsMutation,
  useCancelQuotationJobMutation,
  useStartQuotationJobMutation,
  useCompleteQuotationJobMutation,
  useMarkQuotationWorkSeenMutation,
} = quotationWorkAPI;
