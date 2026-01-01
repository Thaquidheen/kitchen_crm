/**
 * Common TypeScript types used across the application
 */

// User roles
export const UserRole = {
  ROLE_SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ROLE_STAFF: 'ROLE_STAFF',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// User type
export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

// Customer statuses
export const CustomerStatus = {
  LEAD: 'LEAD',
  PROSPECT: 'PROSPECT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  INACTIVE: 'INACTIVE',
} as const;

export type CustomerStatus = typeof CustomerStatus[keyof typeof CustomerStatus];

// Quotation statuses
export const QuotationStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISED: 'REVISED',
} as const;

export type QuotationStatus = typeof QuotationStatus[keyof typeof QuotationStatus];

// Project statuses
export const ProjectStatus = {
  ACTIVE: 'ACTIVE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ON_HOLD: 'ON_HOLD',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

// Payment methods
export const PaymentMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  UPI: 'UPI',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

// Payment statuses
export const PaymentStatus = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

// Design phase statuses
export const DesignStatus = {
  INITIAL: 'INITIAL',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVISED: 'REVISED',
} as const;

export type DesignStatus = typeof DesignStatus[keyof typeof DesignStatus];

// Installation statuses
export const InstallationStatus = {
  PLANNING: 'PLANNING',
  PRODUCTION: 'PRODUCTION',
  INSTALLATION: 'INSTALLATION',
  QUALITY_CHECK: 'QUALITY_CHECK',
  COMPLETED: 'COMPLETED',
} as const;

export type InstallationStatus = typeof InstallationStatus[keyof typeof InstallationStatus];

// Pagination params
export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

// Paginated response metadata
export interface PageInfo {
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// Generic paginated response
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// Date range filter
export interface DateRangeFilter {
  fromDate?: string;
  toDate?: string;
}

// Sort configuration
export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Filter state (generic)
export interface FilterState {
  search?: string;
  status?: string;
  dateRange?: DateRangeFilter;
  [key: string]: unknown;
}

// Loading states
export type LoadingState = 'idle' | 'pending' | 'succeeded' | 'failed';

// Error response
export interface ErrorResponse {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Select option (for dropdowns)
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

// File upload
export interface FileUpload {
  file: File;
  preview?: string;
  progress?: number;
}

// Statistics/KPI
export interface KPIData {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

// Chart data point
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

// Audit fields (common to many entities)
export interface Auditable {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// Action button config
export interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}

// Table column definition
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

// Modal props
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Toast notification
export interface ToastNotification {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
