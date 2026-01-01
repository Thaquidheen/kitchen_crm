/**
 * API Endpoint constants
 * Centralized location for all API endpoints
 */

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNIN: '/auth/signin',
    SIGNUP: '/auth/signup',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },

  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id: number) => `/customers/${id}`,
    STATISTICS: '/customers/statistics',
    PIPELINE: (customerId: number) => `/customers/${customerId}/pipeline`,
    STATUS: (id: number) => `/customers/${id}/status`,
    REQUIREMENTS: (customerId: number) => `/customers/${customerId}/requirements`,
  },

  // Workflow
  WORKFLOW: {
    BY_CUSTOMER: (customerId: number) => `/workflow/customer/${customerId}`,
    HISTORY: '/workflow/history',
  },

  // Design Phase
  DESIGN_PHASE: {
    BASE: '/design-phase',
    BY_CUSTOMER: (customerId: number) => `/design-phase/customer/${customerId}`,
    EXISTS: (customerId: number) => `/design-phase/customer/${customerId}/exists`,
    STATISTICS: '/design-phase/statistics',
    BY_STATUS: (status: string) => `/design-phase/status/${status}`,
    BY_DESIGNER: (designer: string) => `/design-phase/designer/${designer}`,
    MEETINGS_UPCOMING: '/design-phase/meetings/upcoming',
    SUBMIT_TO_CLIENT: (customerId: number) => `/design-phase/customer/${customerId}/submit-to-client`,
    CLIENT_FEEDBACK: (customerId: number) => `/design-phase/customer/${customerId}/client-feedback`,
    SCHEDULE_MEETING: (customerId: number) => `/design-phase/customer/${customerId}/schedule-meeting`,
    COMPLETE_MEETING: (customerId: number) => `/design-phase/customer/${customerId}/complete-meeting`,
    FREEZE_AMOUNT: (customerId: number) => `/design-phase/customer/${customerId}/freeze-amount`,
    CREATE_GROUP: (customerId: number) => `/design-phase/customer/${customerId}/create-group`,
    UPDATE_STATUS: (customerId: number) => `/design-phase/customer/${customerId}/status`,
    APPROVE: (customerId: number) => `/design-phase/customer/${customerId}/approve`,
    SUBMIT_FOR_APPROVAL: (customerId: number) => `/design-phase/customer/${customerId}/submit-for-approval`,
    APPROVE_STAFF_SUBMISSION: (customerId: number) => `/design-phase/customer/${customerId}/approve-staff-submission`,
    BY_STAFF: (staffId: number) => `/design-phase/staff/${staffId}`,
  },

  // Design Phase Files
  DESIGN_PHASE_FILES: {
    BASE: '/design-phase-files',
    UPLOAD: '/design-phase-files/upload',
    BY_DESIGN_PHASE: (designPhaseId: number) => `/design-phase-files/design-phase/${designPhaseId}`,
    BY_CUSTOMER: (customerId: number) => `/design-phase-files/customer/${customerId}`,
    BY_CATEGORY: (designPhaseId: number, category: string) => `/design-phase-files/design-phase/${designPhaseId}/category/${category}`,
    BY_ID: (id: number) => `/design-phase-files/${id}`,
    DELETE: (id: number) => `/design-phase-files/${id}`,
    UPDATE: (id: number) => `/design-phase-files/${id}`,
    FILE_CATEGORIES: '/design-phase-files/file-categories',
  },

  // Designers
  DESIGNERS: {
    BASE: '/designers',
    BY_ID: (id: number) => `/designers/${id}`,
    BY_EMAIL: (email: string) => `/designers/email/${email}`,
    ACTIVE: '/designers/active',
    AVAILABLE: '/designers/available',
    STATISTICS: '/designers/statistics',
    SEARCH: '/designers/search',
    BY_DEPARTMENT: (department: string) => `/designers/department/${department}`,
    BY_SPECIALIZATION: (specialization: string) => `/designers/specialization/${specialization}`,
    TOGGLE_STATUS: (id: number) => `/designers/${id}/toggle-status`,
  },

  // Production & Installation
  PRODUCTION: {
    BASE: '/production-installation',
    BY_CUSTOMER: (customerId: number) => `/production-installation/customer/${customerId}`,
    STATISTICS: '/production-installation/statistics',
    PROGRESS: (customerId: number) => `/production-installation/customer/${customerId}/progress`,
    BY_STATUS: (status: string) => `/production-installation/status/${status}`,
    BY_PROJECT_MANAGER: (pm: string) => `/production-installation/project-manager/${pm}`,
    BY_TEAM_LEAD: (lead: string) => `/production-installation/team-lead/${lead}`,
    SCHEDULED_COMPLETIONS: '/production-installation/scheduled-completions',
    OVERDUE: '/production-installation/overdue',
    READY_FOR_INSTALLATION: '/production-installation/ready-for-installation',
    READY_FOR_HANDOVER: '/production-installation/ready-for-handover',
    UPDATE_TASK: (customerId: number) => `/production-installation/customer/${customerId}/task`,
    SITE_VISIT: (customerId: number) => `/production-installation/customer/${customerId}/site-visit`,
    QUALITY_CHECK: (customerId: number) => `/production-installation/customer/${customerId}/quality-check`,
    HANDOVER: (customerId: number) => `/production-installation/customer/${customerId}/handover`,
    UPDATE_STATUS: (customerId: number) => `/production-installation/customer/${customerId}/status`,
  },

  // Production Custom Tasks
  PRODUCTION_CUSTOM_TASKS: {
    BASE: '/production-custom-tasks',
    BY_ID: (id: number) => `/production-custom-tasks/${id}`,
    BY_CUSTOMER: (customerId: number) => `/production-custom-tasks/customer/${customerId}`,
    BY_CUSTOMER_AND_PHASE: (customerId: number, phase: string) => `/production-custom-tasks/customer/${customerId}/phase/${phase}`,
    TOGGLE: (taskId: number) => `/production-custom-tasks/${taskId}/toggle`,
    REORDER: (customerId: number) => `/production-custom-tasks/customer/${customerId}/reorder`,
  },

  // Production Task Groups
  PRODUCTION_TASK_GROUPS: {
    BASE: '/production/task-groups',
    BY_ID: (id: number) => `/production/task-groups/${id}`,
    BY_CUSTOMER: (customerId: number) => `/production/task-groups/customer/${customerId}`,
    REORDER: (customerId: number) => `/production/task-groups/customer/${customerId}/reorder`,
  },

  // Production Issues
  PRODUCTION_ISSUES: {
    BASE: '/production/issues',
    BY_ID: (id: number) => `/production/issues/${id}`,
    BY_CUSTOMER: (customerId: number) => `/production/issues/customer/${customerId}`,
    BY_STATUS: (status: string) => `/production/issues/status/${status}`,
    RESOLVE: (id: number) => `/production/issues/${id}/resolve`,
    COUNT_OPEN: (customerId: number) => `/production/issues/customer/${customerId}/count`,
  },

  // Products
  CATEGORIES: {
    BASE: '/categories',
    BY_ID: (id: number) => `/categories/${id}`,
    ACTIVE: '/categories/active',
  },

  BRANDS: {
    BASE: '/brands',
    BY_ID: (id: number) => `/brands/${id}`,
    ACTIVE: '/brands/active',
  },

  MATERIALS: {
    BASE: '/materials',
    BY_ID: (id: number) => `/materials/${id}`,
    ACTIVE: '/materials/active',
  },

  CABINETS: {
    BASE: '/cabinets',
    BY_ID: (id: number) => `/cabinets/${id}`,
    ACTIVE: '/cabinets/active',
    BY_CATEGORY: (categoryId: number) => `/cabinets/category/${categoryId}`,
    BY_BRAND: (brandId: number) => `/cabinets/brand/${brandId}`,
  },

  DOORS: {
    BASE: '/doors',
    BY_ID: (id: number) => `/doors/${id}`,
    ACTIVE: '/doors/active',
    BY_CATEGORY: (categoryId: number) => `/doors/category/${categoryId}`,
    BY_BRAND: (brandId: number) => `/doors/brand/${brandId}`,
  },

  ACCESSORIES: {
    BASE: '/accessories',
    BY_ID: (id: number) => `/accessories/${id}`,
    ACTIVE: '/accessories/active',
  },

  LIGHTING: {
    PROFILES: '/lighting/profiles',
    DRIVERS: '/lighting/drivers',
    CONNECTORS: '/lighting/connectors',
    SENSORS: '/lighting/sensors',
  },

  // Quotations
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id: number) => `/quotations/${id}`,
    STATISTICS: '/quotations/statistics',
    BY_CUSTOMER: (customerId: number) => `/quotations/customer/${customerId}`,
    SEARCH: '/quotations/search',
    UPDATE_STATUS: (id: number) => `/quotations/${id}/status`,
    DUPLICATE: (id: number) => `/quotations/${id}/duplicate`,
    PDF: (id: number) => `/quotations/${id}/pdf`,
    BILL_PDF: (id: number) => `/quotations/${id}/bill/pdf`,
  },

  // Projects
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id: number) => `/projects/${id}`,
    STATISTICS: '/projects/statistics',
    BY_CUSTOMER: (customerId: number) => `/projects/customer/${customerId}`,
    FINANCIAL_SUMMARY: (id: number) => `/projects/${id}/financial-summary`,
    CONVERT_QUOTATION: (quotationId: number) => `/projects/quotation/${quotationId}/convert`,
    UPDATE_STATUS: (id: number) => `/projects/${id}/status`,
  },

  // Payments
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: number) => `/payments/${id}`,
    STATISTICS: '/payments/statistics',
    STATISTICS_DATE_RANGE: '/payments/statistics/date-range',
    BY_PROJECT: (projectId: number) => `/payments/project/${projectId}`,
    PROJECT_SUMMARY: (projectId: number) => `/payments/project/${projectId}/summary`,
    ADD_TO_PROJECT: (projectId: number) => `/payments/project/${projectId}`,
  },

  // Dashboard
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',
    REVENUE_ANALYTICS: '/dashboard/revenue-analytics',
    PROJECT_ANALYTICS: '/dashboard/project-analytics',
    CUSTOMER_ANALYTICS: '/dashboard/customer-analytics',
    PERFORMANCE_METRICS: '/dashboard/performance-metrics',
    REAL_TIME_METRICS: '/dashboard/real-time-metrics',
    BUSINESS_ALERTS: '/dashboard/business-alerts',
    CUSTOM_REPORT: (reportType: string) => `/dashboard/custom-report/${reportType}`,
    EXPORT: '/dashboard/export',
  },

  // Architects
  ARCHITECTS: {
    BASE: '/architects',
    BY_ID: (id: number) => `/architects/${id}`,
    ALL: '/architects/all',
    SEARCH: '/architects/search',
    VISITS: (id: number) => `/architects/${id}/visits`,
    VISITS_QUICK: (id: number) => `/architects/${id}/visits/quick`,
  },

  // Staff
  STAFF: {
    BASE: '/users/staff',
    BY_ID: (id: number) => `/users/staff/${id}`,
  },
} as const;

export default API_ENDPOINTS;
