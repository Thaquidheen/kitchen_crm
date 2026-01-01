// Expense API using RTK Query

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/expenses`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export interface Expense {
  id: number;
  projectId: number;
  projectName?: string;
  vendorId: number;
  vendorName?: string;
  expenseCategory: string;
  description?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  paidBy?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreate {
  projectId: number;
  vendorId: number;
  expenseCategory: string;
  description?: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  paidBy?: string;
  status?: string;
}

export interface ExpenseUpdate {
  vendorId?: number;
  expenseCategory?: string;
  description?: string;
  amount?: number;
  paymentMethod?: string;
  paymentDate?: string;
  referenceNumber?: string;
  notes?: string;
  paidBy?: string;
  status?: string;
}

export const expensesApi = createApi({
  reducerPath: 'expensesApi',
  baseQuery,
  tagTypes: ['Expense', 'ExpenseList'],
  endpoints: (builder) => ({
    // Get expenses by project
    getExpensesByProject: builder.query<Expense[], number>({
      query: (projectId) => `/project/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'ExpenseList', id: projectId }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return [];
      },
    }),

    // Get expenses by project with pagination
    getExpensesByProjectPaginated: builder.query<any, { projectId: number; page?: number; size?: number; sortBy?: string; sortDir?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        return { url: `/project/${params.projectId}/page?${queryParams.toString()}` };
      },
      providesTags: (result, error, { projectId }) => [{ type: 'ExpenseList', id: projectId }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get expense by ID
    getExpenseById: builder.query<Expense, number>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Expense', id }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Expense not found');
      },
    }),

    // Create expense
    createExpense: builder.mutation<any, ExpenseCreate>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ExpenseList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create expense');
      },
    }),

    // Update expense
    updateExpense: builder.mutation<any, { id: number; expense: ExpenseUpdate }>({
      query: ({ id, expense }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: expense,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Expense', id }, 'ExpenseList'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update expense');
      },
    }),

    // Delete expense
    deleteExpense: builder.mutation<any, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ExpenseList'],
      transformResponse: (response: any) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to delete expense');
      },
    }),
  }),
});

export const {
  useGetExpensesByProjectQuery,
  useGetExpensesByProjectPaginatedQuery,
  useGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expensesApi;






