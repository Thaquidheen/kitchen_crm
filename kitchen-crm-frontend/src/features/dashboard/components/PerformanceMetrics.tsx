/**
 * PerformanceMetrics Component
 * Displays comprehensive performance metrics including KPIs, sales, operations, quality, and finance
 */

import { useGetPerformanceMetricsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectPerformanceMetricsDateRange } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import { KPICard } from './KPICard';
import {
  Target,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  DollarSign,
  Award,
  AlertTriangle,
} from 'lucide-react';

export function PerformanceMetrics() {
  const dateRange = useAppSelector(selectPerformanceMetricsDateRange);
  const { data, isLoading, error } = useGetPerformanceMetricsQuery(dateRange);

  if (error) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Performance Metrics
        </h3>
        <div className="bg-primary-900/20 border border-primary-800 rounded p-4 text-text-900">
          Error loading performance metrics
        </div>
      </Card>
    );
  }

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '₹0';
    const num = parseFloat(value);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6">
      {/* Sales Performance */}
      <div>
        <h3 className="text-lg font-semibold text-white-900 mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          Sales Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Monthly Target"
            value={formatCurrency(data?.salesPerformance.monthlyTarget)}
            icon={Target}
            loading={isLoading}
          />
          <KPICard
            title="Monthly Achieved"
            value={formatCurrency(data?.salesPerformance.monthlyAchieved)}
            icon={TrendingUp}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="Achievement %"
            value={`${data?.salesPerformance.achievementPercentage?.toFixed(1) || '0'}%`}
            icon={Award}
            variant={
              data?.salesPerformance.achievementPercentage &&
              data.salesPerformance.achievementPercentage >= 100
                ? 'success'
                : 'warning'
            }
            loading={isLoading}
          />
          <KPICard
            title="Conversion Rate"
            value={`${data?.salesPerformance.conversionRate?.toFixed(1) || '0'}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>

        {/* Sales Details */}
        {!isLoading && data?.salesPerformance && (
          <Card className="mt-4 p-4 bg-background-800 border-background-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-text-600 mb-1">Leads Generated</p>
                <p className="text-xl font-bold text-text-900">
                  {data.salesPerformance.leadsGenerated}
                </p>
              </div>
              <div>
                <p className="text-text-600 mb-1">Quotations Sent</p>
                <p className="text-xl font-bold text-text-900">
                  {data.salesPerformance.quotationsSent}
                </p>
              </div>
              <div>
                <p className="text-text-600 mb-1">Projects Won</p>
                <p className="text-xl font-bold text-success">
                  {data.salesPerformance.projectsWon}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Operational Efficiency */}
      <div>
        <h3 className="text-lg font-semibold text-white-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          Operational Efficiency
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Avg Project Duration"
            value={`${data?.operationalEfficiency.averageProjectDuration?.toFixed(0) || '0'}d`}
            icon={Clock}
            loading={isLoading}
          />
          <KPICard
            title="On-Time Delivery"
            value={`${data?.operationalEfficiency.onTimeDeliveryRate?.toFixed(1) || '0'}%`}
            icon={CheckCircle}
            variant={
              data?.operationalEfficiency.onTimeDeliveryRate &&
              data.operationalEfficiency.onTimeDeliveryRate >= 80
                ? 'success'
                : 'warning'
            }
            loading={isLoading}
          />
          <KPICard
            title="Resource Utilization"
            value={`${data?.operationalEfficiency.resourceUtilization?.toFixed(1) || '0'}%`}
            icon={Users}
            loading={isLoading}
          />
          <KPICard
            title="Active Team Members"
            value={data?.operationalEfficiency.activeTeamMembers || 0}
            icon={Users}
            loading={isLoading}
          />
          <KPICard
            title="Productivity Index"
            value={`${data?.operationalEfficiency.productivityIndex?.toFixed(1) || '0'}%`}
            icon={TrendingUp}
            loading={isLoading}
          />
        </div>
      </div>

      {/* Quality Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-purple-500" />
          Quality Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Quality Pass Rate"
            value={`${data?.qualityMetrics.qualityPassRate?.toFixed(1) || '0'}%`}
            icon={CheckCircle}
            variant={
              data?.qualityMetrics.qualityPassRate &&
              data.qualityMetrics.qualityPassRate >= 90
                ? 'success'
                : 'warning'
            }
            loading={isLoading}
          />
          <KPICard
            title="Revision Count"
            value={data?.qualityMetrics.revisionCount || 0}
            icon={AlertTriangle}
            variant={
              data?.qualityMetrics.revisionCount &&
              data.qualityMetrics.revisionCount > 10
                ? 'warning'
                : 'default'
            }
            loading={isLoading}
          />
          <KPICard
            title="Customer Satisfaction"
            value={`${data?.qualityMetrics.customerSatisfactionAvg?.toFixed(1) || '0'}/5`}
            icon={Award}
            variant="success"
            loading={isLoading}
          />
          <KPICard
            title="Warranty Issues"
            value={data?.qualityMetrics.warrantyIssues || 0}
            icon={AlertTriangle}
            variant={
              data?.qualityMetrics.warrantyIssues &&
              data.qualityMetrics.warrantyIssues > 0
                ? 'danger'
                : 'success'
            }
            loading={isLoading}
          />
          <KPICard
            title="Defect Rate"
            value={`${data?.qualityMetrics.defectRate?.toFixed(2) || '0'}%`}
            icon={AlertTriangle}
            variant={
              data?.qualityMetrics.defectRate && data.qualityMetrics.defectRate > 5
                ? 'danger'
                : 'success'
            }
            loading={isLoading}
          />
        </div>
      </div>

      {/* Financial Health */}
      <div>
        <h3 className="text-lg font-semibold text-white-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-purple-500" />
          Financial Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4 bg-black-800 border-black-600">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-white-600 mb-1">Gross Revenue</p>
                {isLoading ? (
                  <div className="h-8 bg-black-700 rounded w-32" />
                ) : (
                  <p className="text-2xl font-bold text-white-900">
                    {formatCurrency(data?.financialHealth.grossRevenue)}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-black-800 border-black-600">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-white-600 mb-1">Net Profit</p>
                {isLoading ? (
                  <div className="h-8 bg-black-700 rounded w-32" />
                ) : (
                  <p className="text-2xl font-bold text-green-500">
                    {formatCurrency(data?.financialHealth.netProfit)}
                  </p>
                )}
                {!isLoading && (
                  <p className="text-xs text-white-500 mt-1">
                    Margin: {data?.financialHealth.profitMargin?.toFixed(1) || '0'}%
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-black-800 border-black-600">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-sm text-white-600 mb-1">Operating Expenses</p>
                {isLoading ? (
                  <div className="h-8 bg-black-700 rounded w-32" />
                ) : (
                  <p className="text-2xl font-bold text-white-900">
                    {formatCurrency(data?.financialHealth.operatingExpenses)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Financial Metrics */}
        {!isLoading && data?.financialHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Card className="p-4 bg-background-800 border-primary-600">
              <p className="text-sm text-text-600 mb-2">Return on Investment</p>
              <p className="text-3xl font-bold text-text-900">
                {data.financialHealth.returnOnInvestment?.toFixed(1) || '0'}%
              </p>
              <div className="mt-2 h-2 bg-background-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"
                  style={{
                    width: `${Math.min(data.financialHealth.returnOnInvestment || 0, 100)}%`,
                  }}
                />
              </div>
            </Card>

            <Card className="p-4 bg-background-800 border-success">
              <p className="text-sm text-text-600 mb-2">Days of Cash on Hand</p>
              <p className="text-3xl font-bold text-text-900">
                {data.financialHealth.daysOfCashOnHand || '0'} days
              </p>
              <p className="text-xs text-text-500 mt-2">
                {data.financialHealth.daysOfCashOnHand &&
                data.financialHealth.daysOfCashOnHand >= 90
                  ? 'Healthy cash position'
                  : 'Monitor cash flow'}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceMetrics;
