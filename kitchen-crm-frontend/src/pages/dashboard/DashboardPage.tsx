/**
 * DashboardPage
 * Main dashboard page integrating all analytics components
 */

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  toggleAutoRefresh,
  toggleCompactView,
  toggleShowAlerts,
  refreshNow,
  selectAutoRefresh,
  selectCompactView,
  selectShowAlerts,
} from '@/features/dashboard/dashboardSlice';
import { DashboardSummary } from '@/features/dashboard/components/DashboardSummary';
import { RevenueChart } from '@/features/dashboard/components/RevenueChart';
import { ProjectAnalytics } from '@/features/dashboard/components/ProjectAnalytics';
import { CustomerAnalytics } from '@/features/dashboard/components/CustomerAnalytics';
import { PerformanceMetrics } from '@/features/dashboard/components/PerformanceMetrics';
import { RealTimeMetrics } from '@/features/dashboard/components/RealTimeMetrics';
import { BusinessAlerts } from '@/features/dashboard/components/BusinessAlerts';
import { DateRangeFilter } from '@/features/dashboard/components/DateRangeFilter';
import { ExportData } from '@/features/dashboard/components/ExportData';
import { TaskManagement } from '@/features/task-management/components/TaskManagement';
import { Button } from '@/components/ui/Button';
import { VerticalButton } from '@/components/ui/VerticalButton';
import { Card } from '@/components/ui/Card';
import {
  LayoutDashboard,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Download,
  Calendar,
  ClipboardList,
} from 'lucide-react';

type ViewTab = 'overview' | 'revenue' | 'projects' | 'customers' | 'performance' | 'tasks';

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const autoRefresh = useAppSelector(selectAutoRefresh);
  const compactView = useAppSelector(selectCompactView);
  const showAlerts = useAppSelector(selectShowAlerts);

  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const handleRefresh = () => {
    dispatch(refreshNow());
    window.location.reload();
  };

  const tabs: Array<{ key: ViewTab; label: string; icon?: React.ReactNode }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'revenue', label: 'Revenue' },
    { key: 'projects', label: 'Projects' },
    { key: 'customers', label: 'Customers' },
    { key: 'performance', label: 'Performance' },
    { key: 'tasks', label: 'Tasks', icon: <ClipboardList className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background-900 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary-500" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-text-900">Dashboard</h1>
              <p className="text-sm text-text-600 mt-1">
                HOCH Analytics & Insights
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <VerticalButton
              variant="secondary"
              size="md"
              icon={<Calendar className="h-6 w-6" />}
              label="Date Range"
              onClick={() => setShowDateFilter(!showDateFilter)}
            />
            <VerticalButton
              variant="secondary"
              size="md"
              icon={<Download className="h-6 w-6" />}
              label="Export"
              onClick={() => setShowExport(!showExport)}
            />
            <VerticalButton
              variant="secondary"
              size="md"
              icon={<RefreshCw className="h-6 w-6" />}
              label="Refresh"
              onClick={handleRefresh}
            />
            <VerticalButton
              variant="secondary"
              size="md"
              icon={<Settings className="h-6 w-6" />}
              label="Settings"
              onClick={() => setShowSettings(!showSettings)}
            />
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-4 bg-background-800 border-background-600 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-text-900">
                Dashboard Settings
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(toggleAutoRefresh())}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${autoRefresh ? 'text-success' : ''}`}
                  />
                  <span className="hidden md:inline">Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
                  <span className="md:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(toggleCompactView())}
                >
                  {compactView ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <EyeOff className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden md:inline">{compactView ? 'Expand' : 'Compact'} View</span>
                  <span className="md:hidden">{compactView ? 'Expand' : 'Compact'}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dispatch(toggleShowAlerts())}
                >
                  {showAlerts ? (
                    <Bell className="h-4 w-4 mr-2" />
                  ) : (
                    <BellOff className="h-4 w-4 mr-2" />
                  )}
                  <span className="hidden md:inline">Alerts: {showAlerts ? 'ON' : 'OFF'}</span>
                  <span className="md:hidden">{showAlerts ? 'ON' : 'OFF'}</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Date Filter Panel */}
        {showDateFilter && (
          <div className="mb-4">
            <DateRangeFilter scope="all" />
          </div>
        )}

        {/* Export Panel */}
        {showExport && (
          <div className="mb-4">
            <ExportData />
          </div>
        )}
      </div>

      {/* Business Alerts */}
      <div className="mb-6">
        <BusinessAlerts />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-background-600 overflow-x-auto">
        <nav className="flex gap-4 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-text-600 hover:text-text-900 hover:border-background-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <RealTimeMetrics />
            <DashboardSummary />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RevenueChart />
              <div className="space-y-6">
                <DateRangeFilter scope="all" compact />
              </div>
            </div>
          </>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <>
            <DateRangeFilter scope="revenue" compact />
            <RevenueChart />
          </>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <>
            <DateRangeFilter scope="project" compact />
            <ProjectAnalytics />
          </>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <>
            <DateRangeFilter scope="customer" compact />
            <CustomerAnalytics />
          </>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <>
            <DateRangeFilter scope="performance" compact />
            <PerformanceMetrics />
          </>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && <TaskManagement />}
      </div>
    </div>
  );
}

export default DashboardPage;
