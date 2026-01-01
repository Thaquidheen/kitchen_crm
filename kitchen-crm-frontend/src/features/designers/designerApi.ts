/**
 * Designer API integration
 * Handles all designer-related API calls
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  Designer,
  DesignerCreateRequest,
  DesignerUpdateRequest,
  DesignerFilters,
  DesignerStatistics,
  DesignerListResponse,
  DesignerApiResponse,
} from './types';

export const designerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all designers with pagination
    getDesigners: builder.query<DesignerApiResponse<DesignerListResponse>, DesignerFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: `${API_ENDPOINTS.DESIGNERS.BASE}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Designer'],
    }),

    // Get active designers
    getActiveDesigners: builder.query<DesignerApiResponse<Designer[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.DESIGNERS.ACTIVE,
        method: 'GET',
      }),
      providesTags: ['Designer'],
    }),

    // Get available designers
    getAvailableDesigners: builder.query<DesignerApiResponse<Designer[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.DESIGNERS.AVAILABLE,
        method: 'GET',
      }),
      providesTags: ['Designer'],
    }),

    // Get designer by ID
    getDesignerById: builder.query<DesignerApiResponse<Designer>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Designer', id }],
    }),

    // Get designer by email
    getDesignerByEmail: builder.query<DesignerApiResponse<Designer>, string>({
      query: (email) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_EMAIL(email),
        method: 'GET',
      }),
      providesTags: (_result, _error, email) => [{ type: 'Designer', id: email }],
    }),

    // Search designers
    searchDesigners: builder.query<DesignerApiResponse<Designer[]>, string>({
      query: (query) => ({
        url: `${API_ENDPOINTS.DESIGNERS.SEARCH}?query=${encodeURIComponent(query)}`,
        method: 'GET',
      }),
      providesTags: ['Designer'],
    }),

    // Get designers by department
    getDesignersByDepartment: builder.query<DesignerApiResponse<Designer[]>, string>({
      query: (department) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_DEPARTMENT(department),
        method: 'GET',
      }),
      providesTags: (_result, _error, department) => [
        { type: 'Designer', id: 'LIST' },
        { type: 'Designer', id: department },
      ],
    }),

    // Get designers by specialization
    getDesignersBySpecialization: builder.query<DesignerApiResponse<Designer[]>, string>({
      query: (specialization) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_SPECIALIZATION(specialization),
        method: 'GET',
      }),
      providesTags: (_result, _error, specialization) => [
        { type: 'Designer', id: 'LIST' },
        { type: 'Designer', id: specialization },
      ],
    }),

    // Get designer statistics
    getDesignerStatistics: builder.query<DesignerApiResponse<DesignerStatistics>, void>({
      query: () => ({
        url: API_ENDPOINTS.DESIGNERS.STATISTICS,
        method: 'GET',
      }),
      providesTags: ['Designer'],
    }),

    // Create designer
    createDesigner: builder.mutation<DesignerApiResponse<Designer>, DesignerCreateRequest>({
      query: (designerData) => ({
        url: API_ENDPOINTS.DESIGNERS.BASE,
        method: 'POST',
        body: designerData,
      }),
      invalidatesTags: ['Designer'],
    }),

    // Update designer
    updateDesigner: builder.mutation<
      DesignerApiResponse<Designer>,
      { id: number; designerData: DesignerUpdateRequest }
    >({
      query: ({ id, designerData }) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_ID(id),
        method: 'PUT',
        body: designerData,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Designer', id },
        'Designer',
      ],
    }),

    // Delete designer
    deleteDesigner: builder.mutation<DesignerApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.DESIGNERS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Designer'],
    }),

    // Toggle designer status
    toggleDesignerStatus: builder.mutation<DesignerApiResponse<string>, number>({
      query: (id) => ({
        url: API_ENDPOINTS.DESIGNERS.TOGGLE_STATUS(id),
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Designer', id },
        'Designer',
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetDesignersQuery,
  useGetActiveDesignersQuery,
  useGetAvailableDesignersQuery,
  useGetDesignerByIdQuery,
  useGetDesignerByEmailQuery,
  useSearchDesignersQuery,
  useGetDesignersByDepartmentQuery,
  useGetDesignersBySpecializationQuery,
  useGetDesignerStatisticsQuery,
  useCreateDesignerMutation,
  useUpdateDesignerMutation,
  useDeleteDesignerMutation,
  useToggleDesignerStatusMutation,
} = designerApi;
