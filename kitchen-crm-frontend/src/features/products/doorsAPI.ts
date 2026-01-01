/**
 * Doors API
 * RTK Query API for managing door types
 */

import { baseApi } from '../../app/baseApi';
import type { DoorType, ApiResponse, PagedResponse } from './types';

export const doorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all doors with pagination and filters
    getDoors: builder.query<PagedResponse<DoorType>, {
      name?: string;
      brandId?: number;
      material?: string;
      active?: boolean;
      page?: number;
      size?: number;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
    }>({
      query: (params) => ({
        url: '/doors',
        params,
      }),
      providesTags: ['Doors'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true };
      },
    }),

    // Get active doors
    getActiveDoors: builder.query<DoorType[], void>({
      query: () => '/doors/active',
      providesTags: ['Doors'],
      transformResponse: (response: any) => response.success && response.data ? response.data : [],
    }),

    // Get door by ID
    getDoorById: builder.query<DoorType, number>({
      query: (id) => `/doors/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Doors', id }],
      transformResponse: (response: any) => response.data,
    }),

    // Create door
    createDoor: builder.mutation<DoorType, Omit<DoorType, 'id'>>({
      query: (body) => ({
        url: '/doors',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Doors'],
      transformResponse: (response: any) => response.data,
    }),

    // Update door
    updateDoor: builder.mutation<DoorType, DoorType>({
      query: ({ id, ...body }) => ({
        url: `/doors/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Doors',
        { type: 'Doors', id },
      ],
      transformResponse: (response: any) => response.data,
    }),

    // Delete door
    deleteDoor: builder.mutation<string, number>({
      query: (id) => ({
        url: `/doors/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Doors'],
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const {
  useGetDoorsQuery,
  useGetActiveDoorsQuery,
  useGetDoorByIdQuery,
  useCreateDoorMutation,
  useUpdateDoorMutation,
  useDeleteDoorMutation,
} = doorsApi;
