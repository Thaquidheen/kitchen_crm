import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';
import type {
  DesignFeed,
  DesignJob,
  DesignMe,
  DesignPriority,
  DesignStatus,
  DesignerStatus,
  DesignerSummary,
  UnassignedDesignCustomer,
} from './types';

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const designAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDesignMe: builder.query<DesignMe, void>({
      query: () => '/design-jobs/me',
      transformResponse: unwrap<DesignMe>('Failed to load profile'),
      providesTags: ['Designs'],
    }),
    getDesigners: builder.query<DesignerSummary[], void>({
      query: () => '/design-jobs/designers',
      transformResponse: (r: ApiResponse<DesignerSummary[]>) => r.data ?? [],
      providesTags: ['Designs'],
    }),
    setDesignerStatus: builder.mutation<DesignerSummary, { userId: number; status: DesignerStatus | '' }>({
      query: ({ userId, status }) => ({ url: `/design-jobs/designers/${userId}/status`, method: 'PUT', body: { status } }),
      transformResponse: unwrap<DesignerSummary>('Failed to update designer status'),
      invalidatesTags: ['Designs', 'Staff'],
    }),
    getDesignJobs: builder.query<DesignJob[], { designerId?: number; includeClosed?: boolean } | void>({
      query: (args) => ({
        url: '/design-jobs',
        params: {
          ...(args && args.designerId ? { designerId: args.designerId } : {}),
          ...(args && args.includeClosed ? { includeClosed: true } : {}),
        },
      }),
      transformResponse: (r: ApiResponse<DesignJob[]>) => r.data ?? [],
      providesTags: ['Designs'],
    }),
    getDesignJob: builder.query<DesignJob, number>({
      query: (id) => `/design-jobs/${id}`,
      transformResponse: unwrap<DesignJob>('Design not found'),
      providesTags: ['Designs'],
    }),
    getCustomerDesignJob: builder.query<DesignJob | null, number>({
      query: (customerId) => `/design-jobs/customer/${customerId}`,
      transformResponse: (r: ApiResponse<DesignJob>) => (r.success ? r.data ?? null : null),
      providesTags: ['Designs'],
    }),
    getUnassignedDesigns: builder.query<UnassignedDesignCustomer[], void>({
      query: () => '/design-jobs/unassigned',
      transformResponse: (r: ApiResponse<UnassignedDesignCustomer[]>) => r.data ?? [],
      providesTags: ['Designs'],
    }),
    assignDesign: builder.mutation<
      DesignJob,
      { customerId: number; designerId: number; dueDate?: string; priority?: DesignPriority; brief?: string }
    >({
      query: (body) => ({ url: '/design-jobs/assign', method: 'POST', body }),
      transformResponse: unwrap<DesignJob>('Failed to assign designer'),
      invalidatesTags: ['Designs'],
    }),
    updateDesignJob: builder.mutation<
      DesignJob,
      {
        id: number;
        designerId?: number;
        dueDate?: string;
        clearDueDate?: boolean;
        priority?: DesignPriority;
        brief?: string;
        status?: DesignStatus;
      }
    >({
      query: ({ id, ...body }) => ({ url: `/design-jobs/${id}`, method: 'PUT', body }),
      transformResponse: unwrap<DesignJob>('Failed to update design'),
      invalidatesTags: ['Designs'],
    }),
    reorderDesignJobs: builder.mutation<DesignJob[], { designerId: number; jobIds: number[] }>({
      query: (body) => ({ url: '/design-jobs/reorder', method: 'PUT', body }),
      transformResponse: unwrap<DesignJob[]>('Failed to save the order'),
      invalidatesTags: ['Designs'],
    }),
    startDesign: builder.mutation<DesignJob, number>({
      query: (id) => ({ url: `/design-jobs/${id}/start`, method: 'PUT' }),
      transformResponse: unwrap<DesignJob>('Failed to start design'),
      invalidatesTags: ['Designs'],
    }),
    completeDesign: builder.mutation<DesignJob, { id: number; message?: string }>({
      query: ({ id, message }) => ({ url: `/design-jobs/${id}/complete`, method: 'PUT', body: { message } }),
      transformResponse: unwrap<DesignJob>('Failed to complete design'),
      invalidatesTags: ['Designs'],
    }),
    reviewDesign: builder.mutation<DesignJob, { id: number; decision: 'APPROVE' | 'CHANGES'; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/design-jobs/${id}/review`, method: 'PUT', body }),
      transformResponse: unwrap<DesignJob>('Failed to review design'),
      invalidatesTags: ['Designs'],
    }),
    addDesignNote: builder.mutation<DesignJob, { id: number; message: string }>({
      query: ({ id, message }) => ({ url: `/design-jobs/${id}/notes`, method: 'POST', body: { message } }),
      transformResponse: unwrap<DesignJob>('Failed to add note'),
      invalidatesTags: ['Designs'],
    }),
    markDesignSeen: builder.mutation<DesignJob, number>({
      query: (id) => ({ url: `/design-jobs/${id}/seen`, method: 'PUT' }),
      transformResponse: unwrap<DesignJob>('Failed to update design'),
      invalidatesTags: ['Designs'],
    }),
    uploadDesignFile: builder.mutation<DesignJob, { id: number; file: File; description?: string }>({
      query: ({ id, file, description }) => {
        const form = new FormData();
        form.append('file', file);
        if (description) {form.append('description', description);}
        // Without this marker baseApi forces Content-Type: application/json and the upload breaks.
        return { url: `/design-jobs/${id}/files`, method: 'POST', body: form, headers: { 'X-Skip-Json-Content-Type': 'true' } };
      },
      transformResponse: unwrap<DesignJob>('Failed to upload file'),
      invalidatesTags: ['Designs'],
    }),
    getMyDesignFeed: builder.query<DesignFeed, void>({
      query: () => '/design-jobs/my-feed',
      transformResponse: (r: ApiResponse<DesignFeed>) => r.data ?? { count: 0, jobs: [] },
      providesTags: ['Designs'],
    }),
    markMyDesignsSeen: builder.mutation<number, void>({
      query: () => ({ url: '/design-jobs/my/seen-all', method: 'PUT' }),
      transformResponse: (r: ApiResponse<number>) => r.data ?? 0,
      invalidatesTags: ['Designs'],
    }),
    getDesignAttention: builder.query<DesignFeed, void>({
      query: () => '/design-jobs/attention',
      transformResponse: (r: ApiResponse<DesignFeed>) => r.data ?? { count: 0, jobs: [] },
      providesTags: ['Designs'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDesignMeQuery,
  useGetDesignersQuery,
  useSetDesignerStatusMutation,
  useGetDesignJobsQuery,
  useGetDesignJobQuery,
  useGetCustomerDesignJobQuery,
  useGetUnassignedDesignsQuery,
  useAssignDesignMutation,
  useUpdateDesignJobMutation,
  useReorderDesignJobsMutation,
  useStartDesignMutation,
  useCompleteDesignMutation,
  useReviewDesignMutation,
  useAddDesignNoteMutation,
  useMarkDesignSeenMutation,
  useUploadDesignFileMutation,
  useGetMyDesignFeedQuery,
  useMarkMyDesignsSeenMutation,
  useGetDesignAttentionQuery,
} = designAPI;
