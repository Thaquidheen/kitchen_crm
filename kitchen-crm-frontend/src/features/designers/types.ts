/**
 * Designer related types and interfaces
 * Based on backend Designer entity and DTOs
 */

export interface Designer {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  department: string;
  specialization?: string;
  experienceYears: number;
  hourlyRate?: number;
  active: boolean;
  bio?: string;
  skills?: string;
  portfolioUrl?: string;
  maxConcurrentProjects: number;
  averageCompletionDays: number;
  createdAt: string;
  updatedAt: string;
  
  // Computed fields
  currentProjects?: number;
  completedProjects?: number;
  averageRating?: number;
  available?: boolean;
}

export interface DesignerCreateRequest {
  name: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
  experienceYears?: number;
  hourlyRate?: number;
  bio?: string;
  skills?: string;
  portfolioUrl?: string;
  maxConcurrentProjects?: number;
  averageCompletionDays?: number;
}

export interface DesignerUpdateRequest {
  name?: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
  experienceYears?: number;
  hourlyRate?: number;
  active?: boolean;
  bio?: string;
  skills?: string;
  portfolioUrl?: string;
  maxConcurrentProjects?: number;
  averageCompletionDays?: number;
}

export interface DesignerFilters {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface DesignerStatistics {
  totalDesigners: number;
  activeDesigners: number;
  availableDesigners: number;
}

export interface DesignerFormData {
  name: string;
  email: string;
  phoneNumber: string;
  department: string;
  specialization: string;
  experienceYears: string;
  hourlyRate: string;
  bio: string;
  skills: string;
  portfolioUrl: string;
  maxConcurrentProjects: string;
  averageCompletionDays: string;
}

export interface DesignerFormErrors {
  name?: string;
  email?: string;
  phoneNumber?: string;
  department?: string;
  specialization?: string;
  experienceYears?: string;
  hourlyRate?: string;
  bio?: string;
  skills?: string;
  portfolioUrl?: string;
  maxConcurrentProjects?: string;
  averageCompletionDays?: string;
}

// Helper types for designer display
export interface DesignerOption {
  value: number;
  label: string;
  email: string;
  department: string;
  specialization?: string;
  available: boolean;
}

export interface DesignerDepartment {
  value: string;
  label: string;
  count: number;
}

export interface DesignerSpecialization {
  value: string;
  label: string;
  count: number;
}

// API response types
export interface DesignerApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface DesignerListResponse {
  content: Designer[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Validation types
export interface DesignerValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Progress tracking types
export interface DesignerWorkload {
  currentProjects: number;
  maxProjects: number;
  completedThisMonth: number;
  averageCompletionTime: number;
  utilizationPercentage: number;
}

// Skills and expertise types
export interface DesignerSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'software' | 'design' | 'technical' | 'soft';
}

export interface DesignerPortfolio {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  projectType: string;
  completedDate: string;
  clientFeedback?: string;
}

// Designer summary for lists
export interface DesignerSummary {
  id: number;
  name: string;
  email: string;
  department: string;
  specialization?: string;
  experienceYears: number;
  active: boolean;
  currentProjects: number;
  maxConcurrentProjects: number;
  averageCompletionDays: number;
  createdAt: string;
  updatedAt: string;
}
