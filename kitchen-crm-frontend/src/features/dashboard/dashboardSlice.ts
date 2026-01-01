/**
 * Dashboard Slice - Redux State Management
 * Manages local dashboard state (filters, preferences, etc.)
 */

import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

// Helper to get default date range (last 12 months)
const getDefaultDateRange = () => {
  const today = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(today.getMonth() - 12);

  return {
    fromDate: twelveMonthsAgo.toISOString().split('T')[0],
    toDate: today.toISOString().split('T')[0],
  };
};

export interface DateRange {
  fromDate: string;
  toDate: string;
}

export interface DashboardState {
  // Date range filters for analytics
  revenueAnalyticsDateRange: DateRange;
  projectAnalyticsDateRange: DateRange;
  customerAnalyticsDateRange: DateRange;
  performanceMetricsDateRange: DateRange;

  // UI preferences
  selectedKPIs: string[];
  chartType: 'line' | 'bar' | 'area';
  refreshInterval: number; // in seconds

  // Real-time updates
  autoRefresh: boolean;
  lastRefreshed: string | null;

  // View preferences
  compactView: boolean;
  showAlerts: boolean;
}

const initialState: DashboardState = {
  // Initialize date ranges
  revenueAnalyticsDateRange: getDefaultDateRange(),
  projectAnalyticsDateRange: {
    fromDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 6 months
    toDate: new Date().toISOString().split('T')[0],
  },
  customerAnalyticsDateRange: getDefaultDateRange(),
  performanceMetricsDateRange: {
    fromDate: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0], // 3 months
    toDate: new Date().toISOString().split('T')[0],
  },

  // UI preferences
  selectedKPIs: [
    'totalRevenue',
    'activeProjects',
    'totalCustomers',
    'conversionRate',
  ],
  chartType: 'line',
  refreshInterval: 300, // 5 minutes

  // Real-time updates
  autoRefresh: true,
  lastRefreshed: null,

  // View preferences
  compactView: false,
  showAlerts: true,
};

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Update date range for revenue analytics
    setRevenueAnalyticsDateRange: (state, action: PayloadAction<DateRange>) => {
      state.revenueAnalyticsDateRange = action.payload;
    },

    // Update date range for project analytics
    setProjectAnalyticsDateRange: (state, action: PayloadAction<DateRange>) => {
      state.projectAnalyticsDateRange = action.payload;
    },

    // Update date range for customer analytics
    setCustomerAnalyticsDateRange: (state, action: PayloadAction<DateRange>) => {
      state.customerAnalyticsDateRange = action.payload;
    },

    // Update date range for performance metrics
    setPerformanceMetricsDateRange: (state, action: PayloadAction<DateRange>) => {
      state.performanceMetricsDateRange = action.payload;
    },

    // Update all date ranges at once
    setAllDateRanges: (state, action: PayloadAction<DateRange>) => {
      state.revenueAnalyticsDateRange = action.payload;
      state.projectAnalyticsDateRange = action.payload;
      state.customerAnalyticsDateRange = action.payload;
      state.performanceMetricsDateRange = action.payload;
    },

    // Update selected KPIs
    setSelectedKPIs: (state, action: PayloadAction<string[]>) => {
      state.selectedKPIs = action.payload;
    },

    // Toggle a KPI
    toggleKPI: (state, action: PayloadAction<string>) => {
      const index = state.selectedKPIs.indexOf(action.payload);
      if (index > -1) {
        state.selectedKPIs.splice(index, 1);
      } else {
        state.selectedKPIs.push(action.payload);
      }
    },

    // Update chart type
    setChartType: (state, action: PayloadAction<'line' | 'bar' | 'area'>) => {
      state.chartType = action.payload;
    },

    // Update refresh interval
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
    },

    // Toggle auto-refresh
    toggleAutoRefresh: (state) => {
      state.autoRefresh = !state.autoRefresh;
    },

    // Set last refreshed timestamp
    setLastRefreshed: (state, action: PayloadAction<string>) => {
      state.lastRefreshed = action.payload;
    },

    // Update last refreshed to now
    refreshNow: (state) => {
      state.lastRefreshed = new Date().toISOString();
    },

    // Toggle compact view
    toggleCompactView: (state) => {
      state.compactView = !state.compactView;
    },

    // Toggle alerts visibility
    toggleShowAlerts: (state) => {
      state.showAlerts = !state.showAlerts;
    },

    // Reset dashboard state to defaults
    resetDashboardState: () => initialState,
  },
});

// Export actions
export const {
  setRevenueAnalyticsDateRange,
  setProjectAnalyticsDateRange,
  setCustomerAnalyticsDateRange,
  setPerformanceMetricsDateRange,
  setAllDateRanges,
  setSelectedKPIs,
  toggleKPI,
  setChartType,
  setRefreshInterval,
  toggleAutoRefresh,
  setLastRefreshed,
  refreshNow,
  toggleCompactView,
  toggleShowAlerts,
  resetDashboardState,
} = dashboardSlice.actions;

// Selectors
export const selectDashboardState = (state: RootState) => state.dashboard;
export const selectRevenueAnalyticsDateRange = (state: RootState) =>
  state.dashboard.revenueAnalyticsDateRange;
export const selectProjectAnalyticsDateRange = (state: RootState) =>
  state.dashboard.projectAnalyticsDateRange;
export const selectCustomerAnalyticsDateRange = (state: RootState) =>
  state.dashboard.customerAnalyticsDateRange;
export const selectPerformanceMetricsDateRange = (state: RootState) =>
  state.dashboard.performanceMetricsDateRange;
export const selectSelectedKPIs = (state: RootState) => state.dashboard.selectedKPIs;
export const selectChartType = (state: RootState) => state.dashboard.chartType;
export const selectRefreshInterval = (state: RootState) => state.dashboard.refreshInterval;
export const selectAutoRefresh = (state: RootState) => state.dashboard.autoRefresh;
export const selectLastRefreshed = (state: RootState) => state.dashboard.lastRefreshed;
export const selectCompactView = (state: RootState) => state.dashboard.compactView;
export const selectShowAlerts = (state: RootState) => state.dashboard.showAlerts;

export default dashboardSlice.reducer;
