/**
 * DashboardSummary Component
 * Displays all KPIs from the dashboard summary endpoint
 */

import { useGetDashboardSummaryQuery } from '../dashboardAPI';
import { KPICard } from './KPICard';
import {
  Users,
  FileText,
  Briefcase,
  DollarSign,
  TrendingUp,
  Package,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

export function DashboardSummary() {
  const { data: summary, isLoading, error } = useGetDashboardSummaryQuery();

  if (error) {
    return (
      <div className="bg-primary-900/20 border border-primary-800 rounded-lg p-4 text-text-900">
        <p className="font-medium">Error loading dashboard summary</p>
        <p className="text-sm text-text-600 mt-1">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  // Helper to format currency
  const formatCurrency = (value: string | undefined) => {
    if (!value) return '₹0';
    const num = parseFloat(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Helper to format number
  const formatNumber = (value: number | undefined) => {
    if (!value) return '0';
    return value.toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6">
      {/* Customer Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          Customer Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Total Customers"
            value={formatNumber(summary?.totalCustomers)}
            icon={Users}
            variant="primary"
            loading={isLoading}
          />
          <KPICard
            title="Active Customers"
            value={formatNumber(summary?.activeCustomers)}
            icon={Users}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="New This Month"
            value={formatNumber(summary?.newCustomersThisMonth)}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Quotation Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-500" />
          Quotation Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Quotations"
            value={formatNumber(summary?.totalQuotations)}
            icon={FileText}
            loading={isLoading}
          />
          <KPICard
            title="Pending Quotations"
            value={formatNumber(summary?.pendingQuotations)}
            icon={FileText}
            variant="warning"
            loading={isLoading}
          />
          <KPICard
            title="Approved"
            value={formatNumber(summary?.approvedQuotations)}
            icon={FileText}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="Average Value"
            value={formatCurrency(summary?.averageQuotationValue)}
            icon={DollarSign}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Project & Revenue Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary-500" />
          Projects & Revenue
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(summary?.totalProjectValue)}
            icon={DollarSign}
            variant="primary"
            loading={isLoading}
          />
          <KPICard
            title="Active Projects"
            value={formatNumber(summary?.activeProjects)}
            icon={Briefcase}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="Completed Projects"
            value={formatNumber(summary?.completedProjects)}
            icon={Briefcase}
            loading={isLoading}
          />
          <KPICard
            title="Conversion Rate"
            value={`${summary?.conversionRate?.toFixed(1) || '0'}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Payment Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary-500" />
          Payment Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Received"
            value={formatCurrency(summary?.totalPaymentsReceived)}
            icon={DollarSign}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="This Month"
            value={formatCurrency(summary?.paymentsThisMonth)}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title="Cash in Hand"
            value={formatCurrency(summary?.cashInHand)}
            icon={DollarSign}
            loading={isLoading}
          />
          <KPICard
            title="Cash in Account"
            value={formatCurrency(summary?.cashInAccount)}
            icon={DollarSign}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Design & Production Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary-500" />
          Design & Production
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Designs in Progress"
            value={formatNumber(summary?.designsInProgress)}
            icon={Package}
            loading={isLoading}
          />
          <KPICard
            title="Awaiting Approval"
            value={formatNumber(summary?.designsAwaitingApproval)}
            icon={Package}
            variant="warning"
            loading={isLoading}
          />
          <KPICard
            title="Installations Active"
            value={formatNumber(summary?.installationsInProgress)}
            icon={Wrench}
            loading={isLoading}
          />
          <KPICard
            title="Overdue Projects"
            value={formatNumber(summary?.overdueProjects)}
            icon={AlertTriangle}
            variant={summary?.overdueProjects ? 'danger' : 'default'}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-background-800 border border-primary-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-text-600 mb-1">Conversion Rate</p>
            <p className="text-2xl font-bold text-text-900">
              {summary?.conversionRate?.toFixed(1) || '0'}%
            </p>
            <p className="text-xs text-text-500 mt-1">
              Quotations to Projects
            </p>
          </div>
          <div>
            <p className="text-sm text-text-600 mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-text-900">
              {summary?.completionRate?.toFixed(1) || '0'}%
            </p>
            <p className="text-xs text-text-500 mt-1">
              Completed vs Total Projects
            </p>
          </div>
          <div>
            <p className="text-sm text-text-600 mb-1">Avg Project Duration</p>
            <p className="text-2xl font-bold text-text-900">
              {summary?.averageProjectDuration || '0'} days
            </p>
            <p className="text-xs text-text-500 mt-1">Average completion time</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSummary;
