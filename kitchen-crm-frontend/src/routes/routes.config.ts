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


  // Finance routes (Income & Expenses, super-admin only)
  FINANCE: '/finance',
  FINANCE_DETAIL: '/finance/:financeId',

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
export const getProductionDetailRoute = (customerId: number) =>
  `/production/customer/${customerId}`;
export const getQuotationDetailRoute = (id: number) => `/quotations/${id}`;
export const getQuotationEditRoute = (id: number) => `/quotations/${id}/edit`;
export const getFinanceDetailRoute = (financeId: number) => `/finance/${financeId}`;
export const getApprovalRoute = (token: string) => `/sign/${token}`;

export default ROUTES;
