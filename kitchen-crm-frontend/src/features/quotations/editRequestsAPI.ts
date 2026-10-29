/**
 * Requests to reopen a completed quotation. Staff who may not change a quotation's status ask the
 * admin; when the admin approves, that one quotation goes back to Draft.
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';

/** DONE = approved, edited and marked completed again. */
export type EditRequestStatus = 'PENDING' | 'APPROVED' | 'REFUSED' | 'DONE';

export interface QuotationEditRequest {
  id: number;
  quotationId: number;
  quotationNumber?: string | null;
  projectName?: string | null;
  versionNumber?: number | null;
  quotationStatus?: string | null;
  customerId?: number | null;
  customerName?: string | null;
  /** The customer's stage: DESIGN_STAGE means they are being redesigned. */
  customerStatus?: string | null;
  requestedByName?: string | null;
  /** Asked by the person looking at it. */
  mine: boolean;
  reason?: string | null;
  status: EditRequestStatus;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  createdAt?: string | null;
}

/**
 * What the lists show next to a quotation: PENDING = a request waits for the admin, REOPENED =
 * the admin approved one and the quotation is still the draft that came of it.
 */
export interface PendingEditRequest {
  id: number;
  quotationId: number;
  state: 'PENDING' | 'REOPENED';
  requestedByName?: string | null;
  mine: boolean;
  /** Why it was asked. */
  reason?: string | null;
  /** The admin's note on approving it: what to change. */
  decisionNote?: string | null;
  decidedByName?: string | null;
}

export interface EditRequestFeed {
  count: number;
  items: QuotationEditRequest[];
}

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const editRequestsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEditRequests: builder.query<QuotationEditRequest[], void>({
      query: () => '/quotation-edit-requests',
      transformResponse: (r: ApiResponse<QuotationEditRequest[]>) => r.data ?? [],
      providesTags: ['QuotationEditRequests'],
    }),
    getPendingEditRequests: builder.query<PendingEditRequest[], void>({
      query: () => '/quotation-edit-requests/pending',
      transformResponse: (r: ApiResponse<PendingEditRequest[]>) => r.data ?? [],
      providesTags: ['QuotationEditRequests'],
    }),
    getEditRequestFeed: builder.query<EditRequestFeed, void>({
      query: () => '/quotation-edit-requests/feed',
      transformResponse: (r: ApiResponse<EditRequestFeed>) => r.data ?? { count: 0, items: [] },
      providesTags: ['QuotationEditRequests'],
    }),
    requestQuotationEdit: builder.mutation<QuotationEditRequest, { quotationId: number; reason?: string }>({
      query: (body) => ({ url: '/quotation-edit-requests', method: 'POST', body }),
      transformResponse: unwrap<QuotationEditRequest>('Failed to send the request'),
      invalidatesTags: ['QuotationEditRequests'],
    }),
    // An approved request turns the quotation back into a draft, puts the work that handed it in
    // back on the board and can move the customer back to Quotation Stage: the answer keeps the
    // server's words, which say so.
    decideEditRequest: builder.mutation<
      { request: QuotationEditRequest; message: string },
      { id: number; approve: boolean; note?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/quotation-edit-requests/${id}/decide`, method: 'PUT', body }),
      transformResponse: (r: ApiResponse<QuotationEditRequest>) => {
        if (r.success) {return { request: r.data as QuotationEditRequest, message: r.message ?? '' };}
        throw new Error(r.message || 'Failed to save the answer');
      },
      invalidatesTags: ['QuotationEditRequests', 'Quotations', 'QuotationWork', 'Customers', 'Designs', 'Dashboard'],
    }),
    // A reopened quotation, edited, is handed back as Completed.
    // The answer keeps the server's words: they say when the customer moved on to Follow Up.
    finishQuotationEdit: builder.mutation<{ request: QuotationEditRequest; message: string }, { quotationId: number }>({
      query: (body) => ({ url: '/quotation-edit-requests/finish', method: 'POST', body }),
      transformResponse: (r: ApiResponse<QuotationEditRequest>) => {
        if (r.success) {return { request: r.data as QuotationEditRequest, message: r.message ?? '' };}
        throw new Error(r.message || 'Failed to mark the quotation completed');
      },
      invalidatesTags: ['QuotationEditRequests', 'Quotations', 'QuotationWork', 'Customers', 'Designs', 'Dashboard'],
    }),
    markEditAnswersSeen: builder.mutation<number, void>({
      query: () => ({ url: '/quotation-edit-requests/seen', method: 'PUT' }),
      transformResponse: (r: ApiResponse<number>) => r.data ?? 0,
      invalidatesTags: ['QuotationEditRequests'],
    }),
  }),
});

export const {
  useGetEditRequestsQuery,
  useGetPendingEditRequestsQuery,
  useGetEditRequestFeedQuery,
  useRequestQuotationEditMutation,
  useDecideEditRequestMutation,
  useFinishQuotationEditMutation,
  useMarkEditAnswersSeenMutation,
} = editRequestsAPI;
