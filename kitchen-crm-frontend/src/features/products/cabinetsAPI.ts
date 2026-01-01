/**
 * Cabinets API
 * RTK Query API for managing cabinet types
 */

import { baseApi } from '../../app/baseApi';
import type { CabinetType, ApiResponse, PagedResponse } from './types';

export const cabinetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all cabinets with pagination and filters
    getCabinets: builder.query<PagedResponse<CabinetType>, {
      name?: string;
      categoryId?: number;
      brandId?: number;
      active?: boolean;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }>({
      query: (params) => ({
        url: '/cabinets',
        params,
      }),
      providesTags: ['Cabinets'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true };
      },
    }),

    // Get active cabinets
    getActiveCabinets: builder.query<CabinetType[], void>({
      query: () => '/cabinets/active',
      providesTags: ['Cabinets'],
      transformResponse: (response: any) => response.success && response.data ? response.data : [],
    }),

    // Get cabinet by ID
    getCabinetById: builder.query<CabinetType, number>({
      query: (id) => `/cabinets/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Cabinets', id }],
      transformResponse: (response: any) => response.data,
    }),

    // Create cabinet
    createCabinet: builder.mutation<CabinetType, Omit<CabinetType, 'id'>>({
      query: (body) => ({
        url: '/cabinets',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cabinets'],
      transformResponse: (response: any) => response.data,
    }),

    // Update cabinet
    updateCabinet: builder.mutation<CabinetType, CabinetType>({
      query: ({ id, ...body }) => ({
        url: `/cabinets/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Cabinets',
        { type: 'Cabinets', id },
      ],
      transformResponse: (response: any) => response.data,
    }),

    // Delete cabinet
    deleteCabinet: builder.mutation<string, number>({
      query: (id) => ({
        url: `/cabinets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cabinets'],
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetCabinetsQuery,
  useGetActiveCabinetsQuery,
  useGetCabinetByIdQuery,
  useCreateCabinetMutation,
  useUpdateCabinetMutation,
  useDeleteCabinetMutation,
} = cabinetsApi;
