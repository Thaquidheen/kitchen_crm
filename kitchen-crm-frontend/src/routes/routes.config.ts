/**
 * Route configuration constants
 * Centralized route paths for easy maintenance
 */

export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  APPROVAL: '/sign/:token',

  // Private routes
  DASHBOARD: '/dashboard',
  COMPONENTS: '/components',
  COMPONENTS_ADVANCED: '/components/advanced',

  // Customer routes
  CUSTOMERS: '/customers',
  CUSTOMERS_DETAIL: '/customers/:id',

  // Design Phase routes
  DESIGN_PHASE: '/design-phase',
  DESIGN_PHASE_DETAIL: '/design-phase/customer/:customerId',

  // Production routes
  PRODUCTION: '/production',
  PRODUCTION_DETAIL: '/production/customer/:customerId',

  // Product routes
  PRODUCTS: '/products',
  PRODUCTS_CATEGORIES: '/products/categories',
  PRODUCTS_BRANDS: '/products/brands',
  PRODUCTS_MATERIALS: '/products/materials',
  PRODUCTS_CABINETS: '/products/cabinets',
  PRODUCTS_DOORS: '/products/doors',
  PRODUCTS_ACCESSORIES: '/products/accessories',
  PRODUCTS_LIGHTING: '/products/lighting',

  // Quotation routes
  QUOTATIONS: '/quotations',
  QUOTATIONS_NEW: '/quotations/new',
  QUOTATIONS_DETAIL: '/quotations/:id',
  QUOTATIONS_EDIT: '/quotations/:id/edit',

  // Appliance & Quartz routes
  APPLIANCE_QUARTZ: '/appliance-quartz',

  // Reminder routes
  REMINDERS: '/reminders',

  // Project routes
  PROJECTS: '/projects',
  PROJECTS_NEW: '/projects/new',
  PROJECTS_CONVERT: '/projects/convert-quotation',
  PROJECTS_DETAIL: '/projects/:id',
  PROJECTS_EDIT: '/projects/:id/edit',

  // Payment routes
  PAYMENTS: '/payments',
  PAYMENTS_BY_PROJECT: '/payments/project/:projectId',

  // Settings routes
  SETTINGS: '/settings',
  SETTINGS_MARGINS: '/settings/margins',
  SETTINGS_COMPANY: '/settings/company',

  // Vendor routes
  VENDORS: '/vendors',

  // Architect routes
  ARCHITECTS: '/architects',

  // Staff routes
  STAFF: '/staff',
} as const;

// Helper functions to generate dynamic routes
export const getCustomerDetailRoute = (id: number) => `/customers/${id}`;
export const getDesignPhaseDetailRoute = (customerId: number) =>
  `/design-phase/customer/${customerId}`;
export const getProductionDetailRoute = (customerId: number) =>
  `/production/customer/${customerId}`;
export const getQuotationDetailRoute = (id: number) => `/quotations/${id}`;
export const getQuotationEditRoute = (id: number) => `/quotations/${id}/edit`;
export const getProjectDetailRoute = (id: number) => `/projects/${id}`;
export const getProjectEditRoute = (id: number) => `/projects/${id}/edit`;
export const getPaymentsByProjectRoute = (projectId: number) =>
  `/payments/project/${projectId}`;
export const getApprovalRoute = (token: string) => `/sign/${token}`;

export default ROUTES;
