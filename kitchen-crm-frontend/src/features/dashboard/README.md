# Dashboard Feature - Sprint 4.1 Complete

## Overview
This module implements the Dashboard API & State management for the Kitchen CRM frontend, corresponding to Sprint 4.1 of the Frontend Planning Report.

## Files Created
1. **types.ts** - TypeScript interfaces matching backend DTOs
2. **dashboardAPI.ts** - RTK Query API endpoints
3. **dashboardSlice.ts** - Redux state management
4. **index.ts** - Barrel exports

## Usage Examples

### 1. Using Dashboard Summary in a Component

```tsx
import { useGetDashboardSummaryQuery } from '@/features/dashboard';

function DashboardSummary() {
  const { data, isLoading, error } = useGetDashboardSummaryQuery();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading dashboard</div>;

  return (
    <div>
      <h2>Total Customers: {data?.totalCustomers}</h2>
      <h2>Active Projects: {data?.activeProjects}</h2>
      <h2>Total Revenue: ₹{data?.totalProjectValue}</h2>
    </div>
  );
}
```

### 2. Using Revenue Analytics with Date Range

```tsx
import { useGetRevenueAnalyticsQuery } from '@/features/dashboard';
import { useAppSelector } from '@/app/hooks';
import { selectRevenueAnalyticsDateRange } from '@/features/dashboard';

function RevenueChart() {
  const dateRange = useAppSelector(selectRevenueAnalyticsDateRange);

  const { data, isLoading } = useGetRevenueAnalyticsQuery(dateRange);

  return (
    <div>
      {data?.monthlyRevenue.map((item) => (
        <div key={item.month}>
          {item.month}: ₹{item.revenue}
        </div>
      ))}
    </div>
  );
}
```

### 3. Updating Date Range with Redux

```tsx
import { useAppDispatch } from '@/app/hooks';
import { setRevenueAnalyticsDateRange } from '@/features/dashboard';

function DateRangeSelector() {
  const dispatch = useAppDispatch();

  const handleDateChange = (fromDate: string, toDate: string) => {
    dispatch(setRevenueAnalyticsDateRange({ fromDate, toDate }));
  };

  return (
    <DateRangePicker onChange={handleDateChange} />
  );
}
```

### 4. Real-time Metrics with Auto-refresh

```tsx
import { useGetRealTimeMetricsQuery } from '@/features/dashboard';
import { useAppSelector } from '@/app/hooks';
import { selectAutoRefresh, selectRefreshInterval } from '@/features/dashboard';

function RealTimeMetrics() {
  const autoRefresh = useAppSelector(selectAutoRefresh);
  const refreshInterval = useAppSelector(selectRefreshInterval);

  const { data } = useGetRealTimeMetricsQuery(undefined, {
    pollingInterval: autoRefresh ? refreshInterval * 1000 : 0,
  });

  return <div>{/* Display real-time metrics */}</div>;
}
```

### 5. Export Dashboard Data (Admin Only)

```tsx
import { useLazyExportDashboardDataQuery } from '@/features/dashboard';

function ExportButton() {
  const [exportData, { isLoading }] = useLazyExportDashboardDataQuery();

  const handleExport = async () => {
    try {
      const blob = await exportData({
        format: 'csv',
        fromDate: '2024-01-01',
        toDate: '2024-12-31',
      }).unwrap();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dashboard-data.csv';
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <button onClick={handleExport} disabled={isLoading}>
      {isLoading ? 'Exporting...' : 'Export Data'}
    </button>
  );
}
```

## API Endpoints Implemented

| Endpoint | Method | Hook | Description |
|----------|--------|------|-------------|
| `/dashboard/summary` | GET | `useGetDashboardSummaryQuery` | Overall KPI summary |
| `/dashboard/revenue-analytics` | GET | `useGetRevenueAnalyticsQuery` | Revenue over time |
| `/dashboard/project-analytics` | GET | `useGetProjectAnalyticsQuery` | Project distribution |
| `/dashboard/customer-analytics` | GET | `useGetCustomerAnalyticsQuery` | Customer trends |
| `/dashboard/performance-metrics` | GET | `useGetPerformanceMetricsQuery` | Performance metrics |
| `/dashboard/real-time-metrics` | GET | `useGetRealTimeMetricsQuery` | Real-time data |
| `/dashboard/business-alerts` | GET | `useGetBusinessAlertsQuery` | Business alerts |
| `/dashboard/custom-report/{type}` | GET | `useLazyGenerateCustomReportQuery` | Custom reports (Admin) |
| `/dashboard/export` | GET | `useLazyExportDashboardDataQuery` | Export data (Admin) |

## State Management

### Dashboard State Structure
```typescript
{
  revenueAnalyticsDateRange: { fromDate, toDate },
  projectAnalyticsDateRange: { fromDate, toDate },
  customerAnalyticsDateRange: { fromDate, toDate },
  performanceMetricsDateRange: { fromDate, toDate },
  selectedKPIs: string[],
  chartType: 'line' | 'bar' | 'area',
  refreshInterval: number,
  autoRefresh: boolean,
  lastRefreshed: string | null,
  compactView: boolean,
  showAlerts: boolean,
}
```

### Available Actions
- `setRevenueAnalyticsDateRange(dateRange)`
- `setProjectAnalyticsDateRange(dateRange)`
- `setCustomerAnalyticsDateRange(dateRange)`
- `setPerformanceMetricsDateRange(dateRange)`
- `setAllDateRanges(dateRange)`
- `setSelectedKPIs(kpis[])`
- `toggleKPI(kpi)`
- `setChartType(type)`
- `toggleAutoRefresh()`
- `refreshNow()`
- `toggleCompactView()`
- `toggleShowAlerts()`
- `resetDashboardState()`

### Available Selectors
- `selectDashboardState`
- `selectRevenueAnalyticsDateRange`
- `selectProjectAnalyticsDateRange`
- `selectCustomerAnalyticsDateRange`
- `selectPerformanceMetricsDateRange`
- `selectSelectedKPIs`
- `selectChartType`
- `selectAutoRefresh`
- `selectLastRefreshed`
- `selectCompactView`
- `selectShowAlerts`

## Caching Strategy

- **Dashboard Summary**: Cache invalidated with 'Dashboard' tag
- **Analytics Queries**: Cache invalidated with 'Dashboard' tag, support date range params
- **Real-time Metrics**: 30-second cache, suitable for polling
- **Business Alerts**: 60-second cache, suitable for polling
- **Export Data**: No caching (keepUnusedDataFor: 0)

## Next Steps (Sprint 4.2)

The next sprint will focus on building the UI components:
1. DashboardPage layout
2. KPICard component
3. DashboardSummary component
4. RevenueChart component
5. ProjectAnalytics component
6. CustomerAnalytics component
7. PerformanceMetrics component
8. RealTimeMetrics component
9. BusinessAlerts component
10. Date range filters
11. Export functionality

## Notes

- All BigDecimal values from backend are typed as `string` in TypeScript
- Date ranges are in ISO format (YYYY-MM-DD)
- Custom reports and exports are admin-only (SUPER_ADMIN role required)
- RTK Query handles caching, invalidation, and refetching automatically
- Use `pollingInterval` option for real-time updates
