/**
 * CustomerAnalytics Component
 * Displays customer analytics with trend charts and segmentation
 */

import { useGetCustomerAnalyticsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectCustomerAnalyticsDateRange } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Users, MapPin } from 'lucide-react';
import type { TooltipProps } from 'recharts';

const SEGMENT_COLORS = ['#DC143C', '#FFA726', '#29B6F6', '#00C853', '#9C27B0'];

export function CustomerAnalytics() {
  const dateRange = useAppSelector(selectCustomerAnalyticsDateRange);
  const { data, isLoading, error } = useGetCustomerAnalyticsQuery(dateRange);

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-800 border border-primary-600 rounded-lg p-3 shadow-lg">
          <p className="text-text-900 font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-text-600">{entry.name}:</span>
              <span className="text-text-900 font-semibold">
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Customer Analytics
        </h3>
        <div className="bg-error/20 border border-error/50 rounded p-4 text-text-900">
          Error loading customer analytics
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Customer Analytics
        </h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Card>
    );
  }

  // Transform segmentation data for pie chart
  const segmentationData = Object.entries(data?.customerSegmentation || {}).map(
    ([name, value], index) => ({
      name,
      value,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    })
  );

  // Transform geographic data
  const geographicData = Object.entries(data?.geographicDistribution || {}).map(
    ([name, value], index) => ({
      name,
      value,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    })
  );

  return (
    <div className="space-y-6">
      {/* Customer Acquisition Trend */}
      <Card className="p-6 bg-background-800 border-background-600">
        <div className="mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">
            Customer Acquisition Trend
          </h3>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.monthlyAcquisition}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-background-600)" />
              <XAxis
                dataKey="month"
                stroke="var(--color-text-500)"
                tick={{ fill: 'var(--color-text-500)', fontSize: 12 }}
              />
              <YAxis
                stroke="var(--color-text-500)"
                tick={{ fill: 'var(--color-text-500)', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="newCustomers"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-primary-500)' }}
                name="New Customers"
              />
              <Line
                type="monotone"
                dataKey="totalCustomers"
                stroke="var(--color-accent-500)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-accent-500)' }}
                name="Total Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Segmentation & Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segmentation */}
        <Card className="p-6 bg-background-800 border-background-600">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">
              Customer Segmentation
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  dataKey="value"
                >
                  {segmentationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Geographic Distribution */}
        <Card className="p-6 bg-background-800 border-background-600">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">
              Geographic Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {geographicData
              .sort((a, b) => Number(b.value) - Number(a.value))
              .slice(0, 8)
              .map((location, index) => {
                const total = geographicData.reduce(
                  (sum, item) => sum + Number(item.value),
                  0
                );
                const percentage = ((Number(location.value) / total) * 100).toFixed(
                  1
                );
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-600">{location.name}</span>
                      <span className="text-text-900 font-semibold">
                        {location.value} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-background-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      </div>

      {/* Retention Metrics */}
      {data?.retentionMetrics && (
        <Card className="p-6 bg-background-800 border-background-600">
          <h3 className="text-lg font-semibold text-text-900 mb-4">
            Retention Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(data.retentionMetrics).map(([key, value]) => (
              <div key={key} className="bg-background-700 rounded-lg p-4">
                <p className="text-sm text-text-600 mb-1 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="text-2xl font-bold text-text-900">
                  {typeof value === 'number' && value < 1
                    ? `${(value * 100).toFixed(1)}%`
                    : value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Customer Satisfaction */}
      {data?.customerSatisfaction && data.customerSatisfaction.length > 0 && (
        <Card className="p-6 bg-background-800 border-background-600">
          <h3 className="text-lg font-semibold text-text-900 mb-4">
            Recent Customer Feedback
          </h3>
          <div className="space-y-3">
            {data.customerSatisfaction.slice(0, 5).map((feedback) => (
              <div
                key={feedback.customerId}
                className="bg-background-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-text-900 font-medium">
                      {feedback.customerName}
                    </h4>
                    <p className="text-xs text-text-600 mt-1">
                      {feedback.projectPhase}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < feedback.satisfactionScore
                            ? 'text-warning'
                            : 'text-background-500'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
                {feedback.feedback && (
                  <p className="text-sm text-text-600 italic">
                    "{feedback.feedback}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default CustomerAnalytics;
