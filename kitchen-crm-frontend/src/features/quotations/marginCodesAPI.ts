/**
 * Margin codes: the administrator names margin percentages (R = 45%). The list with percentages
 * is the administrator's; staff allowed to see margins get the codes alone (options).
 */
import { baseApi } from '@/app/baseApi';
import type { ApiResponse } from '@/types/api.types';

export interface MarginCode {
  id: number;
  code: string;
  percentage: number;
  active: boolean;
  note?: string | null;
}

export type MarginCategory = 'accessories' | 'cabinets' | 'doors' | 'lighting' | 'miscellaneous';

/** What a screen showing codes is given: the codes that can be chosen, and each category's default. */
export interface MarginCodeOptions {
  codes: Array<{ code: string }>;
  defaults: Partial<Record<MarginCategory, string | null>>;
}

const unwrap = <T,>(fallback: string) => (r: ApiResponse<T>): T => {
  if (r.success) {return r.data as T;}
  throw new Error(r.message || fallback);
};

export const marginCodesAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMarginCodes: builder.query<MarginCode[], void>({
      query: () => '/margin-codes',
      transformResponse: (r: ApiResponse<MarginCode[]>) => r.data ?? [],
      providesTags: ['MarginCodes'],
    }),
    getMarginCodeOptions: builder.query<MarginCodeOptions, void>({
      query: () => '/margin-codes/options',
      transformResponse: (r: ApiResponse<MarginCodeOptions>) => r.data ?? { codes: [], defaults: {} },
      providesTags: ['MarginCodes'],
    }),
    saveMarginCode: builder.mutation<
      MarginCode,
      { id?: number; code: string; percentage: number; active?: boolean; note?: string | null }
    >({
      query: ({ id, ...body }) => ({ url: id ? `/margin-codes/${id}` : '/margin-codes', method: id ? 'PUT' : 'POST', body }),
      transformResponse: unwrap<MarginCode>('Failed to save the margin code'),
      // Codes appear on every quotation, so quotations are read again too.
      invalidatesTags: ['MarginCodes', 'Quotations'],
    }),
    deleteMarginCode: builder.mutation<string, number>({
      query: (id) => ({ url: `/margin-codes/${id}`, method: 'DELETE' }),
      transformResponse: unwrap<string>('Failed to delete the margin code'),
      invalidatesTags: ['MarginCodes', 'Quotations'],
    }),
  }),
});

export const {
  useGetMarginCodesQuery,
  useGetMarginCodeOptionsQuery,
  useSaveMarginCodeMutation,
  useDeleteMarginCodeMutation,
} = marginCodesAPI;
