/**
 * RealTimeMetrics Component
 * Displays real-time dashboard metrics with auto-refresh
 */

import { useGetRealTimeMetricsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectAutoRefresh, selectRefreshInterval } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import { KPICard } from './KPICard';
import { Activity, Clock, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

export function RealTimeMetrics() {
  const autoRefresh = useAppSelector(selectAutoRefresh);
  const refreshInterval = useAppSelector(selectRefreshInterval);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data, isLoading, error, refetch } = useGetRealTimeMetricsQuery(
    undefined,
    {
      pollingInterval: autoRefresh ? refreshInterval * 1000 : 0,
    }
  );

  useEffect(() => {
    if (!isLoading && data) {
      setLastUpdate(new Date());
    }
  }, [data, isLoading]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (error) {
    return (
      <Card className="p-6 bg-black-800 border-black-600">
        <h3 className="text-lg font-semibold text-white-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          Real-Time Metrics
        </h3>
        <div className="bg-purple-900/20 border border-purple-800 rounded p-4 text-white-900">
          Error loading real-time metrics
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-black-800 border-purple-600">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500 animate-pulse" />
          <h3 className="text-lg font-semibold text-white-900">
            Real-Time Metrics
          </h3>
          {autoRefresh && (
            <span className="px-2 py-1 bg-green-900/20 text-green-500 text-xs font-semibold rounded">
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-white-600">
            <Clock className="h-4 w-4" />
            <span>Last updated: {formatTime(lastUpdate)}</span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white-900 rounded text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {data && (
        <div className="space-y-6">
          {/* Real-time KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data)
              .slice(0, 8)
              .map(([key, value]) => {
                // Determine icon and variant based on key
                let icon = Activity;
                let variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' =
                  'default';

                if (key.includes('active') || key.includes('online')) {
                  icon = Users;
                  variant = 'success';
                } else if (key.includes('pending') || key.includes('waiting')) {
                  icon = Clock;
                  variant = 'warning';
                } else if (key.includes('growth') || key.includes('increase')) {
                  icon = TrendingUp;
                  variant = 'primary';
                }

                // Format the value
                const formattedValue =
                  typeof value === 'number'
                    ? value.toLocaleString('en-IN')
                    : String(value);

                return (
                  <KPICard
                    key={key}
                    title={key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()}
                    value={formattedValue}
                    icon={icon}
                    variant={variant}
                    loading={isLoading}
                  />
                );
              })}
          </div>

          {/* Additional real-time data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(data)
              .slice(8)
              .map(([key, value]) => (
                <div key={key} className="bg-black-700 rounded-lg p-4">
                  <p className="text-sm text-white-600 mb-1">
                    {key
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase())
                      .trim()}
                  </p>
                  <p className="text-xl font-bold text-white-900">
                    {typeof value === 'object'
                      ? JSON.stringify(value, null, 2)
                      : typeof value === 'number'
                        ? value.toLocaleString('en-IN')
                        : String(value)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="mt-4 flex items-center gap-2 text-xs text-white-600 bg-black-700 rounded p-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span>Auto-refreshing every {refreshInterval} seconds</span>
        </div>
      )}
    </Card>
  );
}

export default RealTimeMetrics;
