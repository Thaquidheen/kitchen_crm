// Project API using RTK Query

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  ConvertQuotationToProjectRequest,
  ProjectCashCalculation,
  UpdateProjectCashCalculationRequest,
} from './types';

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}/projects`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery,
  tagTypes: ['Project', 'ProjectSummary', 'ProjectStatistics', 'ProjectFinancialSummary'],
  endpoints: (builder) => ({
    // Get all projects with filters
    getProjects: builder.query<any, ProjectFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.customerId) params.append('customerId', filters.customerId.toString());
        if (filters.status) params.append('status', filters.status);
        if (filters.projectName) params.append('projectName', filters.projectName);
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: '',
          params: Object.fromEntries(params),
        };
      },
      providesTags: ['ProjectSummary'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { content: [], totalElements: 0, totalPages: 0, size: 10, number: 0, first: true, last: true };
      },
    }),

    // Get project statistics
    getProjectStatistics: builder.query<any, void>({
      query: () => '/statistics',
      providesTags: ['ProjectStatistics'],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        return { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalRevenue: 0 };
      },
    }),

    // Get project by ID
    getProjectById: builder.query<any, number>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Project', id }],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Project not found');
      },
    }),

    // Get projects by customer
    getProjectsByCustomer: builder.query<any, number>({
      query: (customerId) => `/customer/${customerId}`,
      providesTags: (_result, _error, customerId) => [
        { type: 'ProjectSummary', id: `customer-${customerId}` }
      ],
    }),

    // Get project financial summary
    getProjectFinancialSummary: builder.query<any, number>({
      query: (id) => `/${id}/financial-summary`,
      providesTags: (_result, _error, id) => [
        { type: 'ProjectFinancialSummary', id }
      ],
    }),

    // Create project
    createProject: builder.mutation<any, CreateProjectRequest>({
      query: (project) => ({
        url: '',
        method: 'POST',
        body: project,
      }),
      invalidatesTags: ['ProjectSummary', 'ProjectStatistics'],
    }),

    // Update project
    updateProject: builder.mutation<any, UpdateProjectRequest>({
      query: ({ id, ...project }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: project,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Project', id },
        'ProjectSummary',
        'ProjectStatistics',
        'ProjectFinancialSummary'
      ],
    }),

    // Delete project (SUPER_ADMIN only)
    deleteProject: builder.mutation<any, number>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ProjectSummary', 'ProjectStatistics'],
    }),

    // Update project status
    updateProjectStatus: builder.mutation<any, { id: number; status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Project', id },
        'ProjectSummary',
        'ProjectStatistics'
      ],
    }),

    // Convert quotation to project
    convertQuotationToProject: builder.mutation<any, ConvertQuotationToProjectRequest>({
      query: ({ quotationId }) => ({
        url: `/quotation/${quotationId}/convert`,
        method: 'POST',
      }),
      invalidatesTags: ['ProjectSummary', 'ProjectStatistics'],
    }),

    // Get project cash calculation
    getProjectCashCalculation: builder.query<ProjectCashCalculation, number>({
      query: (id) => `/${id}/cash-calculation`,
      providesTags: (_result, _error, id) => [
        { type: 'Project', id },
        'ProjectFinancialSummary'
      ],
      transformResponse: (response: any) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch cash calculation');
      },
    }),

    // Update project cash calculation
    updateProjectCashCalculation: builder.mutation<any, { id: number; request: UpdateProjectCashCalculationRequest }>({
      query: ({ id, request }) => ({
        url: `/${id}/cash-calculation`,
        method: 'PUT',
        body: request,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Project', id },
        'ProjectFinancialSummary',
        'ProjectSummary'
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetProjectsQuery,
  useGetProjectStatisticsQuery,
  useGetProjectByIdQuery,
  useGetProjectsByCustomerQuery,
  useGetProjectFinancialSummaryQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useUpdateProjectStatusMutation,
  useConvertQuotationToProjectMutation,
  useGetProjectCashCalculationQuery,
  useUpdateProjectCashCalculationMutation,
} = projectsApi;

// Export the API reducer
export default projectsApi;
