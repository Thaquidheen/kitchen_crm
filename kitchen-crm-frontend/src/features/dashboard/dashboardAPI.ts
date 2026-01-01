/**
 * Dashboard API - RTK Query
 * Handles all dashboard-related API calls
 */

import { baseApi } from '../../app/baseApi';
import type {
  DashboardSummary,
  RevenueAnalytics,
  ProjectAnalytics,
  CustomerAnalytics,
  PerformanceMetrics,
  DashboardApiResponse,
  DateRangeParams,
  CustomReportParams,
  ExportParams,
} from './types';

export const dashboardAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Dashboard Summary
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      transformResponse: (response: DashboardApiResponse<DashboardSummary>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Get Revenue Analytics
    getRevenueAnalytics: builder.query<RevenueAnalytics, DateRangeParams | void>({
      query: (params = {}) => ({
        url: '/dashboard/revenue-analytics',
        params: {
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      }),
      transformResponse: (response: DashboardApiResponse<RevenueAnalytics>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Get Project Analytics
    getProjectAnalytics: builder.query<ProjectAnalytics, DateRangeParams | void>({
      query: (params = {}) => ({
        url: '/dashboard/project-analytics',
        params: {
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      }),
      transformResponse: (response: DashboardApiResponse<ProjectAnalytics>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Get Customer Analytics
    getCustomerAnalytics: builder.query<CustomerAnalytics, DateRangeParams | void>({
      query: (params = {}) => ({
        url: '/dashboard/customer-analytics',
        params: {
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      }),
      transformResponse: (response: DashboardApiResponse<CustomerAnalytics>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Get Performance Metrics
    getPerformanceMetrics: builder.query<PerformanceMetrics, DateRangeParams | void>({
      query: (params = {}) => ({
        url: '/dashboard/performance-metrics',
        params: {
          fromDate: params?.fromDate,
          toDate: params?.toDate,
        },
      }),
      transformResponse: (response: DashboardApiResponse<PerformanceMetrics>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Get Real-time Metrics
    getRealTimeMetrics: builder.query<Record<string, any>, void>({
      query: () => '/dashboard/real-time-metrics',
      transformResponse: (response: DashboardApiResponse<Record<string, any>>) =>
        response.data,
      providesTags: ['Dashboard'],
      // Keep fresh data by polling every 30 seconds
      keepUnusedDataFor: 30,
    }),

    // Get Business Alerts
    getBusinessAlerts: builder.query<Record<string, any>, void>({
      query: () => '/dashboard/business-alerts',
      transformResponse: (response: DashboardApiResponse<Record<string, any>>) =>
        response.data,
      providesTags: ['Dashboard'],
      // Keep fresh data by polling every minute
      keepUnusedDataFor: 60,
    }),

    // Generate Custom Report (SUPER_ADMIN only)
    generateCustomReport: builder.query<Record<string, any>, CustomReportParams>({
      query: ({ reportType, fromDate, toDate, parameters }) => ({
        url: `/dashboard/custom-report/${reportType}`,
        params: {
          fromDate,
          toDate,
          ...parameters,
        },
      }),
      transformResponse: (response: DashboardApiResponse<Record<string, any>>) =>
        response.data,
      providesTags: ['Dashboard'],
    }),

    // Export Dashboard Data (SUPER_ADMIN only)
    exportDashboardData: builder.query<Blob, ExportParams>({
      query: ({ format = 'csv', fromDate, toDate }) => ({
        url: '/dashboard/export',
        params: {
          format,
          fromDate,
          toDate,
        },
        responseHandler: async (response) => {
          // Handle binary response for file download
          return await response.blob();
        },
      }),
      // Don't cache export results
      keepUnusedDataFor: 0,
    }),
  }),
  overrideExisting: false,
});

// Export hooks for usage in components
export const {
  useGetDashboardSummaryQuery,
  useGetRevenueAnalyticsQuery,
  useGetProjectAnalyticsQuery,
  useGetCustomerAnalyticsQuery,
  useGetPerformanceMetricsQuery,
  useGetRealTimeMetricsQuery,
  useGetBusinessAlertsQuery,
  useLazyGenerateCustomReportQuery,
  useLazyExportDashboardDataQuery,
} = dashboardAPI;

export default dashboardAPI;
