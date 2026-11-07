/**
 * Income & Expenses API — RTK Query endpoints over /customer-finance.
 * Child mutations return the refreshed summary, so components never need a follow-up fetch.
 */

import { baseApi } from '../../app/baseApi';
import type {
  EligibleCustomer,
  ExpenseRequest,
  FinanceImportResult,
  FinanceListRow,
  FinanceSummary,
  PaymentRequest,
  ReleaseRequest,
} from './types';

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

const summaryTags = (summary?: FinanceSummary) =>
  summary
    ? [{ type: 'Finance' as const, id: summary.financeId }, 'Finance' as const, 'Dashboard' as const]
    : ['Finance' as const, 'Dashboard' as const];

export const financeAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceList: builder.query<
      PageData<FinanceListRow>,
      { search?: string; page?: number; size?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }
    >({
      query: (params) => ({
        url: '/customer-finance',
        params: {
          ...(params.search ? { search: params.search } : {}),
          page: params.page ?? 0,
          size: params.size ?? 20,
          sortBy: params.sortBy ?? 'createdAt',
          sortDir: params.sortDir ?? 'desc',
        },
      }),
      transformResponse: (r: ApiEnvelope<PageData<FinanceListRow>>) =>
        r?.data ?? { content: [], totalElements: 0, totalPages: 0 },
      providesTags: ['Finance'],
    }),

    getEligibleFinanceCustomers: builder.query<EligibleCustomer[], { search?: string }>({
      query: (params) => ({
        url: '/customer-finance/eligible-customers',
        params: params.search ? { search: params.search } : {},
      }),
      transformResponse: (r: ApiEnvelope<EligibleCustomer[]>) => r?.data ?? [],
      providesTags: ['Finance'],
    }),

    getFinanceSummary: builder.query<FinanceSummary, number>({
      query: (financeId) => `/customer-finance/${financeId}`,
      transformResponse: (r: ApiEnvelope<FinanceSummary>) => r?.data as FinanceSummary,
      providesTags: (_r, _e, financeId) => [{ type: 'Finance', id: financeId }, 'Finance'],
    }),

    createFinance: builder.mutation<
      ApiEnvelope<FinanceSummary>,
      { customerId: number; totalAmount: number; committedCashInHand: number; committedCashInAccount: number; notes?: string }
    >({
      query: (body) => ({ url: '/customer-finance', method: 'POST', body }),
      invalidatesTags: ['Finance', 'Dashboard'],
    }),

    updateFinanceHeader: builder.mutation<
      ApiEnvelope<FinanceSummary>,
      { financeId: number; totalAmount: number; committedCashInHand: number; committedCashInAccount: number; notes?: string }
    >({
      query: ({ financeId, ...body }) => ({ url: `/customer-finance/${financeId}`, method: 'PUT', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    deleteFinance: builder.mutation<ApiEnvelope<string>, number>({
      query: (financeId) => ({ url: `/customer-finance/${financeId}`, method: 'DELETE' }),
      invalidatesTags: ['Finance', 'Dashboard'],
    }),

    addFinancePayment: builder.mutation<ApiEnvelope<FinanceSummary>, { financeId: number } & PaymentRequest>({
      query: ({ financeId, ...body }) => ({ url: `/customer-finance/${financeId}/payments`, method: 'POST', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    updateFinancePayment: builder.mutation<ApiEnvelope<FinanceSummary>, { paymentId: number } & PaymentRequest>({
      query: ({ paymentId, ...body }) => ({ url: `/customer-finance/payments/${paymentId}`, method: 'PUT', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    deleteFinancePayment: builder.mutation<ApiEnvelope<FinanceSummary>, number>({
      query: (paymentId) => ({ url: `/customer-finance/payments/${paymentId}`, method: 'DELETE' }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    addFinanceExpense: builder.mutation<ApiEnvelope<FinanceSummary>, { financeId: number } & ExpenseRequest>({
      query: ({ financeId, ...body }) => ({ url: `/customer-finance/${financeId}/expenses`, method: 'POST', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    updateFinanceExpense: builder.mutation<ApiEnvelope<FinanceSummary>, { expenseId: number } & ExpenseRequest>({
      query: ({ expenseId, ...body }) => ({ url: `/customer-finance/expenses/${expenseId}`, method: 'PUT', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    deleteFinanceExpense: builder.mutation<ApiEnvelope<FinanceSummary>, number>({
      query: (expenseId) => ({ url: `/customer-finance/expenses/${expenseId}`, method: 'DELETE' }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    addFinanceRelease: builder.mutation<ApiEnvelope<FinanceSummary>, { financeId: number } & ReleaseRequest>({
      query: ({ financeId, ...body }) => ({ url: `/customer-finance/${financeId}/releases`, method: 'POST', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    updateFinanceRelease: builder.mutation<ApiEnvelope<FinanceSummary>, { releaseId: number } & ReleaseRequest>({
      query: ({ releaseId, ...body }) => ({ url: `/customer-finance/releases/${releaseId}`, method: 'PUT', body }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    deleteFinanceRelease: builder.mutation<ApiEnvelope<FinanceSummary>, number>({
      query: (releaseId) => ({ url: `/customer-finance/releases/${releaseId}`, method: 'DELETE' }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    uploadFinanceReceipts: builder.mutation<
      ApiEnvelope<FinanceSummary>,
      { owner: 'payments' | 'expenses' | 'releases'; ownerId: number; files: File[]; kind?: 'RECEIPT' | 'QUOTE' }
    >({
      query: ({ owner, ownerId, files, kind }) => {
        const form = new FormData();
        files.forEach((f) => form.append('files', f));
        const kindParam = owner === 'expenses' && kind ? `?kind=${kind}` : '';
        return {
          url: `/customer-finance/${owner}/${ownerId}/receipts${kindParam}`,
          method: 'POST',
          body: form,
          headers: { 'X-Skip-Json-Content-Type': 'true' },
        };
      },
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    /** Checks (save: false) or imports (save: true) an Excel / CSV sheet into one customer's finance. */
    importFinanceSheet: builder.mutation<
      ApiEnvelope<FinanceImportResult>,
      { financeId: number; file: File; save: boolean }
    >({
      query: ({ financeId, file, save }) => {
        const form = new FormData();
        form.append('file', file);
        return {
          url: `/customer-finance/${financeId}/import?save=${save}`,
          method: 'POST',
          body: form,
          // Let the browser send multipart with its boundary; baseApi forces JSON otherwise.
          headers: { 'X-Skip-Json-Content-Type': 'true' },
        };
      },
      // Only a real import changes anything; a check rolls itself back on the server.
      invalidatesTags: (r, _e, arg) =>
        r?.data?.imported ? [{ type: 'Finance' as const, id: arg.financeId }, 'Finance' as const, 'Dashboard' as const] : [],
    }),

    /** Downloads the Excel template (it carries the active vendors, so it is built by the server). */
    downloadFinanceImportTemplate: builder.mutation<null, void>({
      query: () => ({
        url: '/customer-finance/import-template',
        responseHandler: async (response) => {
          if (!response.ok) return response.json();
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'income-expenses-import.xlsx';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return null;
        },
      }),
    }),

    deleteFinanceReceipt: builder.mutation<ApiEnvelope<FinanceSummary>, number>({
      query: (fileId) => ({ url: `/customer-finance/receipts/${fileId}`, method: 'DELETE' }),
      invalidatesTags: (r) => summaryTags(r?.data),
    }),

    /**
     * Fetches one receipt's file and answers a blob: URL for it (the caller revokes it). Receipts
     * are no longer reachable as plain /uploads links: they come only through the API, which needs
     * the sign-in token and the reporting key that baseApi attaches, so an <a href> cannot open
     * them. The URL, not the Blob, is returned so the store only ever holds a string.
     */
    getFinanceReceiptFileUrl: builder.mutation<string | null, number>({
      query: (fileId) => ({
        url: `/customer-finance/receipts/${fileId}/file`,
        responseHandler: async (response) => {
          if (!response.ok) {
            return response.json().catch(() => null);
          }
          return URL.createObjectURL(await response.blob());
        },
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFinanceListQuery,
  useGetEligibleFinanceCustomersQuery,
  useGetFinanceSummaryQuery,
  useCreateFinanceMutation,
  useUpdateFinanceHeaderMutation,
  useDeleteFinanceMutation,
  useAddFinancePaymentMutation,
  useUpdateFinancePaymentMutation,
  useDeleteFinancePaymentMutation,
  useAddFinanceExpenseMutation,
  useUpdateFinanceExpenseMutation,
  useDeleteFinanceExpenseMutation,
  useAddFinanceReleaseMutation,
  useUpdateFinanceReleaseMutation,
  useDeleteFinanceReleaseMutation,
  useUploadFinanceReceiptsMutation,
  useImportFinanceSheetMutation,
  useDownloadFinanceImportTemplateMutation,
  useDeleteFinanceReceiptMutation,
  useGetFinanceReceiptFileUrlMutation,
} = financeAPI;
