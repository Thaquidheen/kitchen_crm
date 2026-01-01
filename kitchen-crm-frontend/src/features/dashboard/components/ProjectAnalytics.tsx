/**
 * ProjectAnalytics Component
 * Displays project analytics with pie/donut charts and team performance
 */

import { useGetProjectAnalyticsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectProjectAnalyticsDateRange } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import type { TooltipProps } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#00C853',
  IN_PROGRESS: '#29B6F6',
  COMPLETED: '#9E9E9E',
  CANCELLED: '#F44336',
  ON_HOLD: '#FFA726',
};

const INSTALLATION_COLORS: Record<string, string> = {
  PLANNING: '#29B6F6',
  PRODUCTION: '#FFA726',
  INSTALLATION: '#DC143C',
  QUALITY_CHECK: '#FFC107',
  COMPLETED: '#00C853',
};

export function ProjectAnalytics() {
  const dateRange = useAppSelector(selectProjectAnalyticsDateRange);
  const { data, isLoading, error } = useGetProjectAnalyticsQuery(dateRange);

  const CustomTooltip = ({
    active,
    payload,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-800 border border-primary-600 rounded-lg p-3 shadow-lg">
          <p className="text-text-900 font-medium">{payload[0].name}</p>
          <p className="text-text-600">
            Count: <span className="font-semibold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Project Analytics
        </h3>
        <div className="bg-error/20 border border-error/50 rounded p-4 text-text-900">
          Error loading project analytics
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 bg-background-800 border-background-600">
        <h3 className="text-lg font-semibold text-text-900 mb-4">
          Project Analytics
        </h3>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      </Card>
    );
  }

  // Transform project status distribution for pie chart
  const projectStatusData = Object.entries(
    data?.projectStatusDistribution || {}
  ).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name] || '#9E9E9E',
  }));

  // Transform installation status distribution
  const installationStatusData = Object.entries(
    data?.installationStatusDistribution || {}
  ).map(([name, value]) => ({
    name,
    value,
    color: INSTALLATION_COLORS[name] || '#9E9E9E',
  }));

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card className="p-6 bg-background-800 border-background-600">
          <h3 className="text-lg font-semibold text-text-900 mb-4">
            Project Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: 'var(--color-text-500)' }}
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Installation Status Distribution */}
        <Card className="p-6 bg-background-800 border-background-600">
          <h3 className="text-lg font-semibold text-text-900 mb-4">
            Installation Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={installationStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: 'var(--color-text-500)' }}
                >
                  {installationStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Team Performance */}
      {data?.teamPerformance && data.teamPerformance.length > 0 && (
        <Card className="p-6 bg-background-800 border-background-600">
          <h3 className="text-lg font-semibold text-text-900 mb-4">
            Team Performance
          </h3>
          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.teamPerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-background-600)" />
                <XAxis
                  dataKey="teamMember"
                  stroke="var(--color-text-500)"
                  tick={{ fill: 'var(--color-text-500)', fontSize: 12 }}
                />
                <YAxis
                  stroke="var(--color-text-500)"
                  tick={{ fill: 'var(--color-text-500)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-background-900)',
                    border: '1px solid var(--color-primary-500)',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="activeProjects"
                  fill="var(--color-primary-500)"
                  name="Active Projects"
                />
                <Bar
                  dataKey="completedProjects"
                  fill="var(--color-success)"
                  name="Completed Projects"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-background-900 text-primary-500">
                <tr>
                  <th className="px-4 py-3 text-left">Team Member</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-center">Active</th>
                  <th className="px-4 py-3 text-center">Completed</th>
                  <th className="px-4 py-3 text-center">Avg Time (days)</th>
                  <th className="px-4 py-3 text-center">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-background-600">
                {data.teamPerformance.map((member, index) => (
                  <tr
                    key={index}
                    className="hover:bg-background-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-text-900 font-medium">
                      {member.teamMember}
                    </td>
                    <td className="px-4 py-3 text-text-600">{member.role}</td>
                    <td className="px-4 py-3 text-center text-text-900">
                      {member.activeProjects}
                    </td>
                    <td className="px-4 py-3 text-center text-text-900">
                      {member.completedProjects}
                    </td>
                    <td className="px-4 py-3 text-center text-text-900">
                      {member.averageCompletionTime?.toFixed(1) || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          member.efficiency >= 80
                            ? 'bg-success/20 text-success'
                            : member.efficiency >= 60
                              ? 'bg-warning/20 text-warning'
                              : 'bg-error/20 text-error'
                        }`}
                      >
                        {member.efficiency?.toFixed(0) || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bottlenecks */}
      {data?.bottlenecks && data.bottlenecks.length > 0 && (
        <Card className="p-6 bg-background-800 border-error/50">
          <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-error" />
            Bottleneck Analysis
          </h3>
          <div className="space-y-3">
            {data.bottlenecks.map((bottleneck, index) => (
              <div
                key={index}
                className="bg-error/10 border border-error/50 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-text-900 font-semibold">
                      {bottleneck.stage}
                    </h4>
                    <p className="text-sm text-text-600 mt-1">
                      {bottleneck.projectsStuck} projects stuck for avg{' '}
                      {bottleneck.averageStuckTime?.toFixed(1)} days
                    </p>
                  </div>
                  <span className="bg-error/30 text-error px-3 py-1 rounded-full text-xs font-semibold">
                    HIGH PRIORITY
                  </span>
                </div>
                <div className="mt-3 bg-background-900 rounded p-3">
                  <p className="text-sm text-text-600">
                    <span className="font-semibold text-text-900">
                      Recommendation:
                    </span>{' '}
                    {bottleneck.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default ProjectAnalytics;
