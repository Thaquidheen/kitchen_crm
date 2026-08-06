/**
 * Production & Installation API integration
 * Handles all production installation-related API calls
 */

import { baseApi } from '../../app/baseApi';
import { API_ENDPOINTS } from '../../services/endpoints';
import type {
  ProductionInstallation,
  ProductionFilters,
  ProductionStatistics,
  ProductionListResponse,
  ProductionApiResponse,
  ProductionInstallationCreateRequest,
  ProductionCustomTask,
  ProductionCustomTaskCreateRequest,
  ProductionCustomTaskUpdateRequest,
  ProductionTaskGroup,
  ProductionTaskGroupCreateRequest,
  ProductionTaskGroupUpdateRequest,
  InstallationStatus,
  ProductionIssue,
  ProductionIssueCreateRequest,
  ProductionIssueUpdateRequest,
  IssueStatus,
} from './types';

export const productionAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all production installations with filters and pagination
    getProductionInstallations: builder.query<ProductionApiResponse<ProductionListResponse>, ProductionFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        
        if (filters.status) params.append('status', filters.status);
        if (filters.projectManager) params.append('projectManager', filters.projectManager);
        if (filters.teamLead) params.append('teamLead', filters.teamLead);
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.page !== undefined) params.append('page', filters.page.toString());
        if (filters.size !== undefined) params.append('size', filters.size.toString());
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortDir) params.append('sortDir', filters.sortDir);

        return {
          url: `${API_ENDPOINTS.PRODUCTION.BASE}?${params.toString()}`,
          method: 'GET',
        };
      },
      providesTags: ['Production'],
    }),

    // Get production installation by customer ID
    getProductionInstallationByCustomer: builder.query<ProductionApiResponse<ProductionInstallation>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.PRODUCTION.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      transformResponse: (response: ProductionApiResponse<ProductionInstallation>, meta) => {
        // If response is successful, return it as is
        if (response && response.success) {
          return response;
        }
        // If 404, return success response with null data (no production exists)
        if (meta?.response?.status === 404) {
          return {
            success: true,
            data: null as any,
            message: 'No production installation found',
          };
        }
        return response;
      },
      transformErrorResponse: (response: any, meta) => {
        // Transform 404 errors into successful responses with null data
        if (meta?.response?.status === 404) {
          return {
            success: true,
            data: null,
            message: 'No production installation found',
          } as any;
        }
        return response;
      },
      providesTags: (_result, _error, customerId) => [{ type: 'Production', id: customerId }],
    }),

    // Get production installations by status
    getProductionInstallationsByStatus: builder.query<ProductionApiResponse<ProductionInstallation[]>, string>({
      query: (status) => ({
        url: API_ENDPOINTS.PRODUCTION.BY_STATUS(status),
        method: 'GET',
      }),
      providesTags: (_result, _error, status) => [
        { type: 'Production', id: 'LIST' },
        { type: 'Production', id: status },
      ],
    }),

    // Get production installations by project manager
    getProductionInstallationsByProjectManager: builder.query<ProductionApiResponse<ProductionInstallation[]>, string>({
      query: (projectManager) => ({
        url: API_ENDPOINTS.PRODUCTION.BY_PROJECT_MANAGER(projectManager),
        method: 'GET',
      }),
      providesTags: (_result, _error, projectManager) => [
        { type: 'Production', id: 'LIST' },
        { type: 'Production', id: projectManager },
      ],
    }),

    // Get production installations by team lead
    getProductionInstallationsByTeamLead: builder.query<ProductionApiResponse<ProductionInstallation[]>, string>({
      query: (teamLead) => ({
        url: API_ENDPOINTS.PRODUCTION.BY_TEAM_LEAD(teamLead),
        method: 'GET',
      }),
      providesTags: (_result, _error, teamLead) => [
        { type: 'Production', id: 'LIST' },
        { type: 'Production', id: teamLead },
      ],
    }),

    // Get production installation statistics
    getProductionStatistics: builder.query<ProductionApiResponse<ProductionStatistics>, void>({
      query: () => ({
        url: API_ENDPOINTS.PRODUCTION.STATISTICS,
        method: 'GET',
      }),
      providesTags: ['Production'],
    }),

    // Get overdue projects
    getOverdueProjects: builder.query<ProductionApiResponse<ProductionInstallation[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.PRODUCTION.OVERDUE,
        method: 'GET',
      }),
      providesTags: ['Production'],
    }),

    // Get ready for installation
    getReadyForInstallation: builder.query<ProductionApiResponse<ProductionInstallation[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.PRODUCTION.READY_FOR_INSTALLATION,
        method: 'GET',
      }),
      providesTags: ['Production'],
    }),

    // Get ready for handover
    getReadyForHandover: builder.query<ProductionApiResponse<ProductionInstallation[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.PRODUCTION.READY_FOR_HANDOVER,
        method: 'GET',
      }),
      providesTags: ['Production'],
    }),

    // Get scheduled completions
    getScheduledCompletions: builder.query<ProductionApiResponse<ProductionInstallation[]>, void>({
      query: () => ({
        url: API_ENDPOINTS.PRODUCTION.SCHEDULED_COMPLETIONS,
        method: 'GET',
      }),
      providesTags: ['Production'],
    }),

    // Create production installation
    createProductionInstallation: builder.mutation<ProductionApiResponse<ProductionInstallation>, ProductionInstallationCreateRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.PRODUCTION.BASE,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Production'],
    }),

    // Update installation status
    updateInstallationStatus: builder.mutation<ProductionApiResponse<string>, { customerId: number; status: InstallationStatus }>({
      query: ({ customerId, status }) => ({
        url: `${API_ENDPOINTS.PRODUCTION.UPDATE_STATUS(customerId)}?status=${status}`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Production', id: customerId },
        'Production',
      ],
    }),

    // Update task status
    updateTaskStatus: builder.mutation<ProductionApiResponse<string>, { customerId: number; taskName: string; completed: boolean; completionDate?: string; notes?: string }>({
      query: ({ customerId, ...data }) => ({
        url: API_ENDPOINTS.PRODUCTION.UPDATE_TASK(customerId),
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'Production', id: customerId },
        'Production',
      ],
    }),

    // ===== Custom Tasks API =====

    // Get custom tasks by customer ID
    getCustomTasksByCustomer: builder.query<ProductionApiResponse<ProductionCustomTask[]>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // Create custom task
    createCustomTask: builder.mutation<ProductionApiResponse<ProductionCustomTask>, ProductionCustomTaskCreateRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.BASE,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // Update custom task
    updateCustomTask: builder.mutation<ProductionApiResponse<ProductionCustomTask>, { taskId: number; data: ProductionCustomTaskUpdateRequest; customerId: number }>({
      query: ({ taskId, data }) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.BY_ID(taskId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // Toggle custom task completion
    toggleCustomTask: builder.mutation<ProductionApiResponse<ProductionCustomTask>, { taskId: number; customerId: number }>({
      query: ({ taskId }) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.TOGGLE(taskId),
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // Delete custom task
    deleteCustomTask: builder.mutation<ProductionApiResponse<void>, { taskId: number; customerId: number }>({
      query: ({ taskId }) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.BY_ID(taskId),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // Reorder custom tasks
    reorderCustomTasks: builder.mutation<ProductionApiResponse<ProductionCustomTask[]>, { customerId: number; taskIds: number[] }>({
      query: ({ customerId, taskIds }) => ({
        url: API_ENDPOINTS.PRODUCTION_CUSTOM_TASKS.REORDER(customerId),
        method: 'POST',
        body: taskIds,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'CustomTask', id: customerId },
        'CustomTask',
      ],
    }),

    // ===== Task Groups API =====

    // Get task groups by customer ID (with tasks)
    getTaskGroupsByCustomer: builder.query<ProductionApiResponse<ProductionTaskGroup[]>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.PRODUCTION_TASK_GROUPS.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
        'CustomTask',
      ],
    }),

    // Seed the standard 3-stage checklist on a job that has none yet
    applyStandardStages: builder.mutation<ProductionApiResponse<string>, number>({
      query: (customerId) => ({
        url: `${API_ENDPOINTS.PRODUCTION.BY_CUSTOMER(customerId)}/apply-standard-stages`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, customerId) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
        'CustomTask',
        { type: 'Production', id: customerId },
        'Production',
      ],
    }),

    // Create task group
    createTaskGroup: builder.mutation<ProductionApiResponse<ProductionTaskGroup>, ProductionTaskGroupCreateRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.PRODUCTION_TASK_GROUPS.BASE,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
      ],
    }),

    // Update task group
    updateTaskGroup: builder.mutation<ProductionApiResponse<ProductionTaskGroup>, { groupId: number; data: ProductionTaskGroupUpdateRequest; customerId: number }>({
      query: ({ groupId, data }) => ({
        url: API_ENDPOINTS.PRODUCTION_TASK_GROUPS.BY_ID(groupId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
      ],
    }),

    // Delete task group
    deleteTaskGroup: builder.mutation<ProductionApiResponse<void>, { groupId: number; customerId: number }>({
      query: ({ groupId }) => ({
        url: API_ENDPOINTS.PRODUCTION_TASK_GROUPS.BY_ID(groupId),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
        'CustomTask',
      ],
    }),

    // Reorder task groups
    reorderTaskGroups: builder.mutation<ProductionApiResponse<ProductionTaskGroup[]>, { customerId: number; groupIds: number[] }>({
      query: ({ customerId, groupIds }) => ({
        url: API_ENDPOINTS.PRODUCTION_TASK_GROUPS.REORDER(customerId),
        method: 'POST',
        body: groupIds,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'TaskGroup', id: customerId },
        'TaskGroup',
      ],
    }),

    // ===== Production Issues API =====

    // Get issues by customer ID
    getIssuesByCustomer: builder.query<ProductionApiResponse<ProductionIssue[]>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.BY_CUSTOMER(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [
        { type: 'ProductionIssue', id: customerId },
        'ProductionIssue',
      ],
    }),

    // Get issue by ID
    getIssueById: builder.query<ProductionApiResponse<ProductionIssue>, number>({
      query: (issueId) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.BY_ID(issueId),
        method: 'GET',
      }),
      providesTags: (_result, _error, issueId) => [
        { type: 'ProductionIssue', id: issueId },
      ],
    }),

    // Create issue
    createIssue: builder.mutation<ProductionApiResponse<ProductionIssue>, ProductionIssueCreateRequest>({
      query: (data) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.BASE,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'ProductionIssue', id: customerId },
        'ProductionIssue',
      ],
    }),

    // Update issue
    updateIssue: builder.mutation<ProductionApiResponse<ProductionIssue>, { issueId: number; data: ProductionIssueUpdateRequest; customerId: number }>({
      query: ({ issueId, data }) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.BY_ID(issueId),
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'ProductionIssue', id: customerId },
        'ProductionIssue',
      ],
    }),

    // Resolve issue
    resolveIssue: builder.mutation<ProductionApiResponse<ProductionIssue>, { issueId: number; resolution: string; customerId: number }>({
      query: ({ issueId, resolution }) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.RESOLVE(issueId),
        method: 'PATCH',
        body: { resolution },
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'ProductionIssue', id: customerId },
        'ProductionIssue',
      ],
    }),

    // Delete issue
    deleteIssue: builder.mutation<ProductionApiResponse<void>, { issueId: number; customerId: number }>({
      query: ({ issueId }) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.BY_ID(issueId),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { customerId }) => [
        { type: 'ProductionIssue', id: customerId },
        'ProductionIssue',
      ],
    }),

    // Count open issues
    countOpenIssues: builder.query<ProductionApiResponse<number>, number>({
      query: (customerId) => ({
        url: API_ENDPOINTS.PRODUCTION_ISSUES.COUNT_OPEN(customerId),
        method: 'GET',
      }),
      providesTags: (_result, _error, customerId) => [
        { type: 'ProductionIssue', id: customerId },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetProductionInstallationsQuery,
  useGetProductionInstallationByCustomerQuery,
  useGetProductionInstallationsByStatusQuery,
  useGetProductionInstallationsByProjectManagerQuery,
  useGetProductionInstallationsByTeamLeadQuery,
  useGetProductionStatisticsQuery,
  useGetOverdueProjectsQuery,
  useGetReadyForInstallationQuery,
  useGetReadyForHandoverQuery,
  useGetScheduledCompletionsQuery,
  useCreateProductionInstallationMutation,
  useUpdateInstallationStatusMutation,
  useUpdateTaskStatusMutation,
  // Custom Tasks hooks
  useGetCustomTasksByCustomerQuery,
  useCreateCustomTaskMutation,
  useUpdateCustomTaskMutation,
  useToggleCustomTaskMutation,
  useDeleteCustomTaskMutation,
  useReorderCustomTasksMutation,
  // Task Groups hooks
  useGetTaskGroupsByCustomerQuery,
  useApplyStandardStagesMutation,
  useCreateTaskGroupMutation,
  useUpdateTaskGroupMutation,
  useDeleteTaskGroupMutation,
  useReorderTaskGroupsMutation,
  // Production Issues hooks
  useGetIssuesByCustomerQuery,
  useGetIssueByIdQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useResolveIssueMutation,
  useDeleteIssueMutation,
  useCountOpenIssuesQuery,
} = productionAPI;

