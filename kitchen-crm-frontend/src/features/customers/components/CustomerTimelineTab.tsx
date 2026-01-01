import React from 'react';
import { Clock, User, ArrowRight, MessageSquare, Calendar } from 'lucide-react';
import { useGetWorkflowHistoryByCustomerQuery } from '../customersAPI';

export interface CustomerTimelineTabProps {
  customerId: number;
}

export const CustomerTimelineTab: React.FC<CustomerTimelineTabProps> = ({ customerId }) => {
  const { data: history, isLoading, error } = useGetWorkflowHistoryByCustomerQuery(customerId);

  const getStateColor = (state: string) => {
    const stateColors: Record<string, string> = {
      LEAD: 'bg-info',
      PROSPECT: 'bg-warning',
      ACTIVE: 'bg-success',
      COMPLETED: 'bg-background-500',
      INACTIVE: 'bg-error',
      // Add more states as needed
    };
    return stateColors[state] || 'bg-background-500';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Relative time
    let relativeTime = '';
    if (diffMins < 1) {
      relativeTime = 'Just now';
    } else if (diffMins < 60) {
      relativeTime = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      relativeTime = date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    // Full date
    const fullDate = date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return { relativeTime, fullDate };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-4 animate-pulse">
            <div className="w-10 h-10 bg-background-600 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-background-600 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-background-600 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/20 border border-error rounded-lg p-4">
        <p className="text-error">Failed to load activity timeline</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-lg p-12 text-center">
        <Clock className="w-12 h-12 text-text-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-900 mb-2">No Activity Yet</h3>
        <p className="text-text-600">
          Activity history will appear here as changes are made to this customer
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-text-900 mb-1">Activity Timeline</h2>
        <p className="text-sm text-text-600">
          {history.length} activity record{history.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-background-600"></div>

        {/* Timeline items */}
        <div className="space-y-6">
          {history.map((item, index) => {
            const { relativeTime, fullDate } = formatTimestamp(item.timestamp);
            const isFirst = index === 0;

            return (
              <div key={item.id} className="relative flex items-start gap-4 pl-2">
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isFirst ? 'bg-primary-500' : 'bg-background-600'
                  }`}
                >
                  <ArrowRight className="w-5 h-5 text-text-900" />
                </div>

                {/* Content */}
                <div className="flex-1 bg-background-800 border border-background-600 rounded-lg p-4 hover:border-primary-500/50 transition-colors">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-text-900 ${getStateColor(
                            item.previousState
                          )}`}
                        >
                          {item.previousState}
                        </span>
                        <ArrowRight className="w-4 h-4 text-text-600" />
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium text-text-900 ${getStateColor(
                            item.newState
                          )}`}
                        >
                          {item.newState}
                        </span>
                      </div>
                      {isFirst && (
                        <span className="px-2 py-0.5 bg-primary-500 text-text-900 text-xs rounded">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-900 font-medium">{relativeTime}</p>
                      <p className="text-xs text-text-500">{fullDate}</p>
                    </div>
                  </div>

                  {/* Status Change Description */}
                  <div className="mb-3">
                    <p className="text-text-900">
                      Status changed from{' '}
                      <span className="font-semibold">{item.previousState}</span> to{' '}
                      <span className="font-semibold">{item.newState}</span>
                    </p>
                  </div>

                  {/* Changed by */}
                  <div className="flex items-center gap-2 text-sm text-text-600 mb-3">
                    <User className="w-4 h-4" />
                    <span>
                      Changed by: <span className="text-text-900">{item.changedBy}</span>
                    </span>
                  </div>

                  {/* Reason (if provided) */}
                  {item.changeReason && (
                    <div className="border-t border-background-600 pt-3 mt-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-text-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-text-600 mb-1">Reason:</p>
                          <p className="text-text-900 text-sm">{item.changeReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-background-600">
        <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
          <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-900 mb-1">{history.length}</p>
          <p className="text-sm text-text-600">Total Changes</p>
        </div>
        <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
          <User className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-900 mb-1">
            {new Set(history.map((h) => h.changedBy)).size}
          </p>
          <p className="text-sm text-text-600">Contributors</p>
        </div>
        <div className="bg-background-800 border border-background-600 rounded-lg p-4 text-center">
          <Calendar className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-text-900 mb-1">
            {history.length > 0
              ? formatTimestamp(history[0].timestamp).relativeTime
              : 'N/A'}
          </p>
          <p className="text-sm text-text-600">Last Activity</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerTimelineTab;
