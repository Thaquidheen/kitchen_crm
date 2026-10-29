/**
 * Requests to move a Follow Up customer back to Design Stage or Quotation Stage. Staff ask; the
 * admin approves (the customer moves, continuing with their design or quotation) or refuses.
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';

export { NEEDS_APPROVAL, needsApproval, asksAdmin } from './stageRequestRules';

export type StageRequestStatus = 'PENDING' | 'APPROVED' | 'REFUSED' | 'CANCELLED';

export interface CustomerStageRequest {
  id: number;
  customerId: number;
  customerName?: string | null;
  customerStatus?: string | null;
  fromStage: string;
  toStage: string;
  reason?: string | null;
  status: StageRequestStatus;
  requestedByName?: string | null;
  /** Asked by the person looking at it. */
  mine: boolean;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  createdAt?: string | null;
  /** Back to Quotation Stage: the completed quotation that approving reopens. */
  reopens?: string | null;
}

export interface StageRequestFeed {
  count: number;
  items: CustomerStageRequest[];
}

const unwrapWithMessage = (fallback: string) => (r: ApiResponse<CustomerStageRequest>) => {
  if (r.success) {return { request: r.data as CustomerStageRequest, message: r.message ?? '' };}
  throw new Error(r.message || fallback);
};

// Approving moves a customer: their stage, designs, quotations and the work board change with it.
const MOVES = ['CustomerStageRequests', 'Customers', 'Designs', 'Quotations', 'QuotationWork', 'QuotationEditRequests', 'Dashboard'] as const;

export const stageRequestsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStageRequests: builder.query<CustomerStageRequest[], void>({
      query: () => '/customer-stage-requests',
      transformResponse: (r: ApiResponse<CustomerStageRequest[]>) => r.data ?? [],
      providesTags: ['CustomerStageRequests'],
    }),
    getStageRequestFeed: builder.query<StageRequestFeed, void>({
      query: () => '/customer-stage-requests/feed',
      transformResponse: (r: ApiResponse<StageRequestFeed>) => r.data ?? { count: 0, items: [] },
      providesTags: ['CustomerStageRequests'],
    }),
    requestStageMove: builder.mutation<
      { request: CustomerStageRequest; message: string },
      { customerId: number; toStage: string; reason: string }
    >({
      query: (body) => ({ url: '/customer-stage-requests', method: 'POST', body }),
      transformResponse: unwrapWithMessage('Failed to send the request'),
      invalidatesTags: ['CustomerStageRequests'],
    }),
    decideStageRequest: builder.mutation<
      { request: CustomerStageRequest; message: string },
      { id: number; approve: boolean; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/customer-stage-requests/${id}/decide`, method: 'PUT', body }),
      transformResponse: unwrapWithMessage('Failed to save the answer'),
      invalidatesTags: [...MOVES],
    }),
    cancelStageRequest: builder.mutation<{ request: CustomerStageRequest; message: string }, number>({
      query: (id) => ({ url: `/customer-stage-requests/${id}/cancel`, method: 'PUT' }),
      transformResponse: unwrapWithMessage('Failed to withdraw the request'),
      invalidatesTags: ['CustomerStageRequests'],
    }),
    markStageAnswersSeen: builder.mutation<number, void>({
      query: () => ({ url: '/customer-stage-requests/seen', method: 'PUT' }),
      transformResponse: (r: ApiResponse<number>) => r.data ?? 0,
      invalidatesTags: ['CustomerStageRequests'],
    }),
  }),
});

export const {
  useGetStageRequestsQuery,
  useGetStageRequestFeedQuery,
  useRequestStageMoveMutation,
  useDecideStageRequestMutation,
  useCancelStageRequestMutation,
  useMarkStageAnswersSeenMutation,
} = stageRequestsAPI;
