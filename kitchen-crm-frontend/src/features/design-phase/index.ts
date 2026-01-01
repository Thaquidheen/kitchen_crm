/**
 * Design Phase feature module
 * Exports all design phase-related functionality
 */

// Types
export * from './types';

// API
export * from './designPhaseApi';

// State management
export { default as designPhaseReducer } from './designPhaseSlice';
export * from './designPhaseSlice';

// Utils
export * from './utils/designPhaseUtils';

// Components
export { default as DesignPhaseList } from './components/DesignPhaseList';
export { default as DesignPhaseDetail } from './components/DesignPhaseDetail';
export { default as DesignerAssignment } from './components/DesignerAssignment';
export { default as StaffAssignment } from './components/StaffAssignment';
export { default as MeetingScheduler } from './components/MeetingScheduler';
export { default as ClientFeedbackForm } from './components/ClientFeedbackForm';
export { default as DesignSubmission } from './components/DesignSubmission';
export { default as ApprovalWorkflow } from './components/ApprovalWorkflow';
