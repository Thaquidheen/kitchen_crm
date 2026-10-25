/**
 * The server's price for a quotation as it is on the screen, without saving it. Staff are not given
 * the margin percentages, so their screen cannot work the figures out itself; the server prices the
 * form exactly as a save would and keeps nothing. Nothing is cached or invalidated: nothing changed.
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';
import type { Quotation } from './types';

export const quotationPreviewAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** A new quotation, priced before it is first saved. */
    previewNewQuotation: builder.mutation<ApiResponse<Quotation>, Record<string, unknown>>({
      query: (body) => ({ url: '/quotations/preview', method: 'POST', body }),
    }),
    /** A quotation being edited, priced with the changes on the screen. */
    previewQuotationChanges: builder.mutation<ApiResponse<Quotation>, { id: number } & Record<string, unknown>>({
      query: ({ id, ...body }) => ({ url: `/quotations/${id}/preview`, method: 'POST', body }),
    }),
  }),
});

export const { usePreviewNewQuotationMutation, usePreviewQuotationChangesMutation } = quotationPreviewAPI;
