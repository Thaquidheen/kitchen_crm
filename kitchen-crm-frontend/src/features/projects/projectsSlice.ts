// Project Redux slice

import { createSlice } from '@reduxjs/toolkit';
import type { ProjectState } from './types';

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  statistics: null,
  financialSummary: null,
  filters: {
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
  },
  pagination: {
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  },
  loading: {
    list: false,
    detail: false,
    create: false,
    update: false,
    delete: false,
    statistics: false,
    financialSummary: false,
    convert: false,
  },
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // Set projects list
    setProjects: (state, action) => {
      state.projects = action.payload;
    },

    // Set current project
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },

    // Set project statistics
    setStatistics: (state, action) => {
      state.statistics = action.payload;
    },

    // Set project financial summary
    setFinancialSummary: (state, action) => {
      state.financialSummary = action.payload;
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = {
        page: 0,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      };
    },

    // Update pagination
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    // Set loading state
    setLoading: (state, action) => {
      const { key, value } = action.payload;
      if (key in state.loading) {
        (state.loading as any)[key] = value;
      }
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Add project to list (optimistic update)
    addProject: (state, action) => {
      state.projects.unshift(action.payload);
    },

    // Update project in list (optimistic update)
    updateProjectInList: (state, action) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
    },

    // Remove project from list (optimistic update)
    removeProjectFromList: (state, action) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
    },

    // Update project status in list (optimistic update)
    updateProjectStatusInList: (state, action) => {
      const project = state.projects.find(p => p.id === action.payload.id);
      if (project) {
        project.status = action.payload.status;
      }
    },

    // Reset state
    resetProjectsState: () => initialState,
  },
});

export const {
  setProjects,
  setCurrentProject,
  setStatistics,
  setFinancialSummary,
  updateFilters,
  resetFilters,
  updatePagination,
  setLoading,
  setError,
  clearError,
  addProject,
  updateProjectInList,
  removeProjectFromList,
  updateProjectStatusInList,
  resetProjectsState,
} = projectsSlice.actions;

export default projectsSlice.reducer;

// Selectors
export const selectProjects = (state: { projects: ProjectState }) => state.projects.projects;
export const selectCurrentProject = (state: { projects: ProjectState }) => state.projects.currentProject;
export const selectProjectStatistics = (state: { projects: ProjectState }) => state.projects.statistics;
export const selectProjectFinancialSummary = (state: { projects: ProjectState }) => state.projects.financialSummary;
export const selectProjectFilters = (state: { projects: ProjectState }) => state.projects.filters;
export const selectProjectPagination = (state: { projects: ProjectState }) => state.projects.pagination;
export const selectProjectLoading = (state: { projects: ProjectState }) => state.projects.loading;
export const selectProjectError = (state: { projects: ProjectState }) => state.projects.error;

// Complex selectors
export const selectProjectsByStatus = (state: { projects: ProjectState }, status: string) =>
  state.projects.projects.filter(p => p.status === status);

export const selectProjectsByCustomer = (state: { projects: ProjectState }, customerId: number) =>
  state.projects.projects.filter(p => p.customerId === customerId);

export const selectProjectById = (state: { projects: ProjectState }, id: number) =>
  state.projects.projects.find(p => p.id === id);

export const selectProjectLoadingState = (state: { projects: ProjectState }) => ({
  isLoading: Object.values(state.projects.loading).some(loading => loading),
  loadingStates: state.projects.loading,
});

export const selectProjectErrorState = (state: { projects: ProjectState }) => ({
  hasError: !!state.projects.error,
  error: state.projects.error,
});
