/**
 * Design Phase slice for Redux state management
 * Handles design phase-related state and actions
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  DesignStatus,
} from './types';
import type {
  DesignPhase,
  DesignPhaseFilters,
  DesignPhaseFormData,
  DesignPhaseFormErrors,
  DesignPhaseStatistics,
  DesignWorkflow,
  UpcomingMeeting,
  DesignFile,
} from './types';

export interface DesignPhaseState {
  // Current design phase being viewed/edited
  currentDesignPhase: DesignPhase | null;
  
  // Design phase list state
  designPhases: DesignPhase[];
  totalDesignPhases: number;
  currentPage: number;
  pageSize: number;
  
  // Filters and search
  filters: DesignPhaseFilters;
  searchQuery: string;
  
  // Customer-specific design phases
  customerDesignPhases: Record<number, DesignPhase>;
  
  // Form state
  designPhaseForm: DesignPhaseFormData;
  formErrors: DesignPhaseFormErrors;
  isFormValid: boolean;
  
  // UI state
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Selection state
  selectedDesignPhases: number[];
  
  // Statistics
  statistics: DesignPhaseStatistics | null;
  
  // Workflow state
  workflows: Record<number, DesignWorkflow>;
  
  // Upcoming meetings
  upcomingMeetings: UpcomingMeeting[];
  
  // File management
  designFiles: Record<number, DesignFile[]>;
  
  // Meeting state
  meetingForm: {
    meetingDateTime: string;
    meetingPurpose: string;
    meetingLocation: string;
    attendees: string;
  };
  
  // Feedback state
  feedbackForm: {
    clientFeedback: string;
    requiresRevision: boolean;
    revisionNotes: string;
  };
  
  // Submission state
  submissionForm: {
    design: string;
    designFilesPath: string;
    submissionNotes: string;
  };
}

const initialFormData: DesignPhaseFormData = {
  customerId: 0,
  quotationId: undefined,
  designRequirements: '',
  designerAssigned: '',
  plan: '',
  design: '',
  meetingDateTime: '',
  meetingPurpose: '',
  meetingLocation: '',
  attendees: '',
  whatsappGroupLink: '',
  frozenAmount: '',
};

const initialFilters: DesignPhaseFilters = {
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDir: 'desc',
};

const initialState: DesignPhaseState = {
  currentDesignPhase: null,
  designPhases: [],
  totalDesignPhases: 0,
  currentPage: 0,
  pageSize: 10,
  filters: initialFilters,
  searchQuery: '',
  customerDesignPhases: {},
  designPhaseForm: initialFormData,
  formErrors: {},
  isFormValid: false,
  isLoading: false,
  isSubmitting: false,
  error: null,
  selectedDesignPhases: [],
  statistics: null,
  workflows: {},
  upcomingMeetings: [],
  designFiles: {},
  meetingForm: {
    meetingDateTime: '',
    meetingPurpose: '',
    meetingLocation: '',
    attendees: '',
  },
  feedbackForm: {
    clientFeedback: '',
    requiresRevision: false,
    revisionNotes: '',
  },
  submissionForm: {
    design: '',
    designFilesPath: '',
    submissionNotes: '',
  },
};

const designPhaseSlice = createSlice({
  name: 'designPhase',
  initialState,
  reducers: {
    // Design phase list actions
    setDesignPhases: (state, action: PayloadAction<DesignPhase[]>) => {
      state.designPhases = action.payload;
    },
    
    setTotalDesignPhases: (state, action: PayloadAction<number>) => {
      state.totalDesignPhases = action.payload;
    },
    
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
      state.filters.page = action.payload;
    },
    
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.filters.size = action.payload;
    },
    
    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<DesignPhaseFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    
    clearFilters: (state) => {
      state.filters = initialFilters;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Customer design phase actions
    setCustomerDesignPhase: (state, action: PayloadAction<{ customerId: number; designPhase: DesignPhase }>) => {
      const { customerId, designPhase } = action.payload;
      state.customerDesignPhases[customerId] = designPhase;
    },
    
    // Form actions
    setDesignPhaseForm: (state, action: PayloadAction<Partial<DesignPhaseFormData>>) => {
      state.designPhaseForm = { ...state.designPhaseForm, ...action.payload };
    },
    
    resetDesignPhaseForm: (state) => {
      state.designPhaseForm = initialFormData;
      state.formErrors = {};
      state.isFormValid = false;
    },
    
    setFormErrors: (state, action: PayloadAction<DesignPhaseFormErrors>) => {
      state.formErrors = action.payload;
    },
    
    clearFormErrors: (state) => {
      state.formErrors = {};
    },
    
    setFormValid: (state, action: PayloadAction<boolean>) => {
      state.isFormValid = action.payload;
    },
    
    // Current design phase actions
    setCurrentDesignPhase: (state, action: PayloadAction<DesignPhase | null>) => {
      state.currentDesignPhase = action.payload;
    },
    
    // Selection actions
    setSelectedDesignPhases: (state, action: PayloadAction<number[]>) => {
      state.selectedDesignPhases = action.payload;
    },
    
    toggleDesignPhaseSelection: (state, action: PayloadAction<number>) => {
      const designPhaseId = action.payload;
      const index = state.selectedDesignPhases.indexOf(designPhaseId);
      if (index > -1) {
        state.selectedDesignPhases.splice(index, 1);
      } else {
        state.selectedDesignPhases.push(designPhaseId);
      }
    },
    
    clearSelection: (state) => {
      state.selectedDesignPhases = [];
    },
    
    // Loading and error actions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Statistics actions
    setStatistics: (state, action: PayloadAction<DesignPhaseStatistics | null>) => {
      state.statistics = action.payload;
    },
    
    // Workflow actions
    setWorkflow: (state, action: PayloadAction<{ customerId: number; workflow: DesignWorkflow }>) => {
      const { customerId, workflow } = action.payload;
      state.workflows[customerId] = workflow;
    },
    
    updateWorkflowStep: (state, action: PayloadAction<{ customerId: number; stepId: string; status: string }>) => {
      const { customerId, stepId, status } = action.payload;
      const workflow = state.workflows[customerId];
      if (workflow) {
        const step = workflow.steps.find(s => s.id === stepId);
        if (step) {
          step.status = status as any;
          if (status === 'completed') {
            step.completedAt = new Date().toISOString();
          }
        }
      }
    },
    
    // Meeting actions
    setUpcomingMeetings: (state, action: PayloadAction<UpcomingMeeting[]>) => {
      state.upcomingMeetings = action.payload;
    },
    
    setMeetingForm: (state, action: PayloadAction<Partial<DesignPhaseState['meetingForm']>>) => {
      state.meetingForm = { ...state.meetingForm, ...action.payload };
    },
    
    resetMeetingForm: (state) => {
      state.meetingForm = {
        meetingDateTime: '',
        meetingPurpose: '',
        meetingLocation: '',
        attendees: '',
      };
    },
    
    // Feedback actions
    setFeedbackForm: (state, action: PayloadAction<Partial<DesignPhaseState['feedbackForm']>>) => {
      state.feedbackForm = { ...state.feedbackForm, ...action.payload };
    },
    
    resetFeedbackForm: (state) => {
      state.feedbackForm = {
        clientFeedback: '',
        requiresRevision: false,
        revisionNotes: '',
      };
    },
    
    // Submission actions
    setSubmissionForm: (state, action: PayloadAction<Partial<DesignPhaseState['submissionForm']>>) => {
      state.submissionForm = { ...state.submissionForm, ...action.payload };
    },
    
    resetSubmissionForm: (state) => {
      state.submissionForm = {
        design: '',
        designFilesPath: '',
        submissionNotes: '',
      };
    },
    
    // File management actions
    setDesignFiles: (state, action: PayloadAction<{ customerId: number; files: DesignFile[] }>) => {
      const { customerId, files } = action.payload;
      state.designFiles[customerId] = files;
    },
    
    addDesignFile: (state, action: PayloadAction<{ customerId: number; file: DesignFile }>) => {
      const { customerId, file } = action.payload;
      if (!state.designFiles[customerId]) {
        state.designFiles[customerId] = [];
      }
      state.designFiles[customerId].push(file);
    },
    
    removeDesignFile: (state, action: PayloadAction<{ customerId: number; fileId: string }>) => {
      const { customerId, fileId } = action.payload;
      if (state.designFiles[customerId]) {
        state.designFiles[customerId] = state.designFiles[customerId].filter(f => f.id !== fileId);
      }
    },
    
    // Utility actions
    addDesignPhaseToList: (state, action: PayloadAction<DesignPhase>) => {
      state.designPhases.unshift(action.payload);
      state.totalDesignPhases += 1;
    },
    
    updateDesignPhaseInList: (state, action: PayloadAction<DesignPhase>) => {
      const updatedDesignPhase = action.payload;
      const index = state.designPhases.findIndex(d => d.id === updatedDesignPhase.id);
      if (index !== -1) {
        state.designPhases[index] = updatedDesignPhase;
      }
    },
    
    removeDesignPhaseFromList: (state, action: PayloadAction<number>) => {
      const designPhaseId = action.payload;
      state.designPhases = state.designPhases.filter(d => d.id !== designPhaseId);
      state.totalDesignPhases = Math.max(0, state.totalDesignPhases - 1);
    },
    
    // Status update actions
    updateDesignPhaseStatus: (state, action: PayloadAction<{ id: number; status: DesignStatus }>) => {
      const { id, status } = action.payload;
      const designPhase = state.designPhases.find(d => d.id === id);
      if (designPhase) {
        designPhase.designStatus = status;
      }
      
      if (state.currentDesignPhase && state.currentDesignPhase.id === id) {
        state.currentDesignPhase.designStatus = status;
      }
    },
    
    // Progress update actions
    updateDesignProgress: (state, action: PayloadAction<{ id: number; progress: number }>) => {
      const { id, progress } = action.payload;
      const designPhase = state.designPhases.find(d => d.id === id);
      if (designPhase) {
        designPhase.designCompletionPercentage = progress;
        designPhase.overallProgress = progress;
      }
      
      if (state.currentDesignPhase && state.currentDesignPhase.id === id) {
        state.currentDesignPhase.designCompletionPercentage = progress;
        state.currentDesignPhase.overallProgress = progress;
      }
    },
  },
});

export const {
  setDesignPhases,
  setTotalDesignPhases,
  setCurrentPage,
  setPageSize,
  setFilters,
  clearFilters,
  setSearchQuery,
  setCustomerDesignPhase,
  setDesignPhaseForm,
  resetDesignPhaseForm,
  setFormErrors,
  clearFormErrors,
  setFormValid,
  setCurrentDesignPhase,
  setSelectedDesignPhases,
  toggleDesignPhaseSelection,
  clearSelection,
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setStatistics,
  setWorkflow,
  updateWorkflowStep,
  setUpcomingMeetings,
  setMeetingForm,
  resetMeetingForm,
  setFeedbackForm,
  resetFeedbackForm,
  setSubmissionForm,
  resetSubmissionForm,
  setDesignFiles,
  addDesignFile,
  removeDesignFile,
  addDesignPhaseToList,
  updateDesignPhaseInList,
  removeDesignPhaseFromList,
  updateDesignPhaseStatus,
  updateDesignProgress,
} = designPhaseSlice.actions;

export default designPhaseSlice.reducer;
