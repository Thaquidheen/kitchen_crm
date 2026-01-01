/**
 * Architects API - RTK Query endpoints for Architect module
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type { ApiResponse, PaginatedApiResponse } from '../../types/api.types';
import type { Architect, ArchitectCreate, ArchitectUpdate, ArchitectVisit, ArchitectVisitCreate } from './types';

export const architectsAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List architects (paginated)
    getArchitects: builder.query<any, { page?: number; size?: number; sortBy?: string; sortDir?: string; visitStatus?: string }>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.page !== undefined) queryParams.append('page', params.page.toString());
        if (params.size !== undefined) queryParams.append('size', params.size.toString());
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortDir) queryParams.append('sortDir', params.sortDir);
        if (params.visitStatus) queryParams.append('visitStatus', params.visitStatus);
        const queryString = queryParams.toString();
        return {
          url: API_ENDPOINTS.ARCHITECTS.BASE + (queryString ? `?${queryString}` : ''),
        };
      },
      providesTags: ['Architects'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get all architects (without pagination)
    getAllArchitects: builder.query<Architect[], void>({
      query: () => API_ENDPOINTS.ARCHITECTS.ALL,
      transformResponse: (response: ApiResponse<Architect[]>) => response.data ?? [],
      providesTags: [{ type: 'Architects', id: 'ALL' }],
    }),

    // Get architect by ID
    getArchitectById: builder.query<Architect, number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.BY_ID(id),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      providesTags: (result, error, id) => [{ type: 'Architects', id }],
    }),

    // Create architect
    createArchitect: builder.mutation<Architect, ArchitectCreate>({
      query: (body) => ({
        url: API_ENDPOINTS.ARCHITECTS.BASE,
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      invalidatesTags: [{ type: 'Architects', id: 'LIST' }, { type: 'Architects', id: 'ALL' }],
    }),

    // Update architect
    updateArchitect: builder.mutation<Architect, { id: number; data: ArchitectUpdate }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.ARCHITECTS.BY_ID(id),
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: ApiResponse<Architect>) => response.data as Architect,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
      ],
    }),

    // Delete architect
    deleteArchitect: builder.mutation<any, number>({
      query: (id) => ({
        url: API_ENDPOINTS.ARCHITECTS.BY_ID(id),
        method: 'DELETE',
      }),
      transformResponse: (response: any) => {
        if (response.success) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to delete architect');
      },
      invalidatesTags: (result, error, id) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
      ],
    }),

    // Search architects
    searchArchitects: builder.query<Architect[], { searchTerm: string; page?: number; size?: number }>({
      query: ({ searchTerm, ...params }) => ({
        url: API_ENDPOINTS.ARCHITECTS.SEARCH,
        params: { searchTerm, ...params },
      }),
      transformResponse: (response: PaginatedApiResponse<Architect>) =>
        response.data?.content ?? [],
      providesTags: [{ type: 'Architects', id: 'SEARCH' }],
    }),

    // Record visit
    recordVisit: builder.mutation<ArchitectVisit, { id: number; data: ArchitectVisitCreate }>({
      query: ({ id, data }) => ({
        url: API_ENDPOINTS.ARCHITECTS.VISITS(id),
        method: 'POST',
        body: data,
      }),
      transformResponse: (response: ApiResponse<ArchitectVisit>) => response.data as ArchitectVisit,
      invalidatesTags: (result, error, { id }) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
        { type: 'ArchitectVisits', id },
      ],
    }),

    // Mark as visited (quick)
    markAsVisited: builder.mutation<ArchitectVisit, number>({
      query: (id) => ({
        url: API_ENDPOINTS.ARCHITECTS.VISITS_QUICK(id),
        method: 'POST',
      }),
      transformResponse: (response: ApiResponse<ArchitectVisit>) => response.data as ArchitectVisit,
      invalidatesTags: (result, error, id) => [
        { type: 'Architects', id },
        { type: 'Architects', id: 'LIST' },
        { type: 'Architects', id: 'ALL' },
        { type: 'ArchitectVisits', id },
      ],
    }),

    // Get visit history
    getVisitHistory: builder.query<ArchitectVisit[], number>({
      query: (id) => API_ENDPOINTS.ARCHITECTS.VISITS(id),
      transformResponse: (response: ApiResponse<ArchitectVisit[]>) => response.data ?? [],
      providesTags: (result, error, id) => [{ type: 'ArchitectVisits', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetArchitectsQuery,
  useGetAllArchitectsQuery,
  useGetArchitectByIdQuery,
  useCreateArchitectMutation,
  useUpdateArchitectMutation,
  useDeleteArchitectMutation,
  useSearchArchitectsQuery,
  useRecordVisitMutation,
  useMarkAsVisitedMutation,
  useGetVisitHistoryQuery,
} = architectsAPI;

export default architectsAPI;

