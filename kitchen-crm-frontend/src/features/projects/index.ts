// Projects feature exports

export * from './types';
export * from './projectsAPI';
export * from './projectsSlice';

// Re-export commonly used hooks and selectors
export {
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
} from './projectsAPI';

export {
  selectProjects,
  selectCurrentProject,
  selectProjectStatistics,
  selectProjectFinancialSummary,
  selectProjectFilters,
  selectProjectPagination,
  selectProjectLoading,
  selectProjectError,
  selectProjectsByStatus,
  selectProjectsByCustomer,
  selectProjectById,
  selectProjectLoadingState,
  selectProjectErrorState,
} from './projectsSlice';
