/**
 * Deleting cancelled quotations in bulk, from the Quotations list. The server deletes only
 * cancelled quotations; anything else it is sent, or a cancelled one still used elsewhere (the
 * customer's finance, a signature), comes back as skipped with the reason.
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';

/** The chosen quotations, or every cancelled one. */
export type BulkDeleteRequest = { ids: number[] } | { allCancelled: true };

export interface BulkDeleteSkipped {
  id: number;
  reason: string;
}

export interface BulkDeleteResult {
  deleted: number;
  skipped: BulkDeleteSkipped[];
}

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const bulkDeleteAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    deleteCancelledQuotations: builder.mutation<BulkDeleteResult, BulkDeleteRequest>({
      query: (body) => ({ url: '/quotations/bulk-delete', method: 'POST', body }),
      transformResponse: unwrap<BulkDeleteResult>('Failed to delete the quotations'),
      // The work board shows the quotation a finished job handed in; edit requests of a deleted
      // quotation are deleted with it.
      invalidatesTags: ['Quotations', 'QuotationWork', 'QuotationEditRequests'],
    }),
  }),
});

export const { useDeleteCancelledQuotationsMutation } = bulkDeleteAPI;
