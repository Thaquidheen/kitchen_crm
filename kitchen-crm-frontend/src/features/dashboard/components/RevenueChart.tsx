/**
 * RevenueChart Component
 * Displays revenue analytics over time using area/line charts
 */

import { useGetRevenueAnalyticsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectRevenueAnalyticsDateRange } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';

export function RevenueChart() {
  const dateRange = useAppSelector(selectRevenueAnalyticsDateRange);
  const { data, isLoading, error } = useGetRevenueAnalyticsQuery(dateRange);

  // Custom tooltip
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
              <span className="text-text-700">{entry.name}:</span>
              <span className="text-text-900 font-semibold">
                ₹{Number(entry.value).toLocaleString('en-IN')}
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
          Revenue Analytics
        </h3>
        <div className="bg-primary-900/20 border border-primary-800 rounded p-4 text-text-900">
          Error loading revenue data
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Revenue Analytics
        </h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = data?.monthlyRevenue.map((item) => ({
    month: item.month,
    revenue: parseFloat(item.revenue),
    target: parseFloat(item.target),
    projects: item.projectsCompleted,
  }));

  return (
    <Card className="p-6 bg-background-800 border-background-600">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-text-900 mb-2">
          Revenue Analytics
        </h3>
        <p className="text-sm text-text-600">
          Monthly revenue vs targets with project completion
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC143C" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#DC143C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFA726" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FFA726" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis
              dataKey="month"
              stroke="#C5C5C5"
              tick={{ fill: '#C5C5C5', fontSize: 12 }}
            />
            <YAxis
              stroke="#C5C5C5"
              tick={{ fill: '#C5C5C5', fontSize: 12 }}
              tickFormatter={(value) =>
                `₹${(value / 100000).toFixed(0)}L`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: '#FFFFFF' }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#DC143C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              name="Actual Revenue"
            />
            <Area
              type="monotone"
              dataKey="target"
              stroke="#FFA726"
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorTarget)"
              name="Target"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-700 rounded-lg p-4">
          <p className="text-sm text-text-600 mb-1">Total Outstanding</p>
          <p className="text-xl font-bold text-text-900">
            ₹{parseFloat(data?.totalOutstanding || '0').toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-background-700 rounded-lg p-4">
          <p className="text-sm text-text-600 mb-1">Collection Efficiency</p>
          <p className="text-xl font-bold text-success">
            {data?.collectionEfficiency?.toFixed(1) || '0'}%
          </p>
        </div>
        <div className="bg-background-700 rounded-lg p-4">
          <p className="text-sm text-text-600 mb-1">Avg Payment Time</p>
          <p className="text-xl font-bold text-text-900">
            {data?.averagePaymentTime || '0'} days
          </p>
        </div>
      </div>

      {/* Top Customers */}
      {data?.topCustomersByRevenue && data.topCustomersByRevenue.length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-semibold text-text-900 mb-3">
            Top Customers by Revenue
          </h4>
          <div className="space-y-2">
            {data.topCustomersByRevenue.slice(0, 5).map((customer, index) => (
              <div
                key={customer.customerId}
                className="flex items-center justify-between bg-background-700 rounded p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary-900/20 text-primary-500 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-text-900 font-medium">
                      {customer.customerName}
                    </p>
                    <p className="text-xs text-text-600">
                      {customer.projectsCount} projects
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-text-900 font-semibold">
                    ₹{parseFloat(customer.totalRevenue).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default RevenueChart;
