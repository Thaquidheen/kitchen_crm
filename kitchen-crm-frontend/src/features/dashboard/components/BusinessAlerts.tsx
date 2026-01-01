/**
 * BusinessAlerts Component
 * Displays important business alerts and notifications
 */

import { useGetBusinessAlertsQuery } from '../dashboardAPI';
import { useAppSelector } from '@/app/hooks';
import { selectShowAlerts } from '../dashboardSlice';
import { Card } from '@/components/ui/Card';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp?: string;
  actionUrl?: string;
}

export function BusinessAlerts() {
  const showAlerts = useAppSelector(selectShowAlerts);
  const { data, isLoading, error } = useGetBusinessAlertsQuery(undefined, {
    pollingInterval: 60000, // Poll every minute
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  if (!showAlerts) {
    return null;
  }

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-white-600" />;
    }
  };

  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return 'bg-red-900/20 border-red-800';
      case 'warning':
        return 'bg-orange-900/20 border-orange-700';
      case 'info':
        return 'bg-blue-900/20 border-blue-700';
      case 'success':
        return 'bg-green-900/20 border-green-700';
      default:
        return 'bg-black-700 border-black-600';
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  // Transform backend data to alerts array
  const alerts: Alert[] = [];

  if (data) {
    // Process different types of alerts from the backend response
    if (data.overdueProjects && data.overdueProjects > 0) {
      alerts.push({
        id: 'overdue-projects',
        type: 'critical',
        title: 'Overdue Projects',
        message: `${data.overdueProjects} project(s) are overdue and require immediate attention.`,
        actionUrl: '/projects?filter=overdue',
      });
    }

    if (data.pendingApprovals && data.pendingApprovals > 0) {
      alerts.push({
        id: 'pending-approvals',
        type: 'warning',
        title: 'Pending Approvals',
        message: `${data.pendingApprovals} design(s) awaiting approval from SUPER_ADMIN.`,
        actionUrl: '/design-phase?filter=pending-approval',
      });
    }

    if (data.lowInventory && data.lowInventory.length > 0) {
      alerts.push({
        id: 'low-inventory',
        type: 'warning',
        title: 'Low Inventory',
        message: `${data.lowInventory.length} product(s) running low on stock.`,
        actionUrl: '/products?filter=low-stock',
      });
    }

    if (data.upcomingDeadlines && data.upcomingDeadlines > 0) {
      alerts.push({
        id: 'upcoming-deadlines',
        type: 'info',
        title: 'Upcoming Deadlines',
        message: `${data.upcomingDeadlines} project(s) due in the next 7 days.`,
        actionUrl: '/projects?filter=upcoming',
      });
    }

    if (data.paymentReminders && data.paymentReminders > 0) {
      alerts.push({
        id: 'payment-reminders',
        type: 'warning',
        title: 'Payment Reminders',
        message: `${data.paymentReminders} payment(s) pending collection.`,
        actionUrl: '/payments?filter=pending',
      });
    }

    // Add any additional alerts from the backend
    if (data.customAlerts && Array.isArray(data.customAlerts)) {
      data.customAlerts.forEach((alert: any, index: number) => {
        alerts.push({
          id: `custom-${index}`,
          type: alert.type || 'info',
          title: alert.title || 'Notification',
          message: alert.message || '',
          timestamp: alert.timestamp,
          actionUrl: alert.actionUrl,
        });
      });
    }
  }

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(
    (alert) => !dismissedAlerts.includes(alert.id)
  );

  if (error) {
    return (
      <Card className="p-4 bg-black-800 border-black-600">
        <div className="flex items-center gap-2 text-white-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Unable to load business alerts</span>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-4 bg-black-800 border-black-600">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-black-700 rounded w-3/4" />
          <div className="h-4 bg-black-700 rounded w-1/2" />
        </div>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="p-4 bg-black-800 border-green-700">
        <div className="flex items-center gap-2 text-green-500">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">All clear! No active alerts.</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white-900 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          Business Alerts ({visibleAlerts.length})
        </h3>
      </div>

      {visibleAlerts.map((alert) => (
        <Card
          key={alert.id}
          className={`p-4 border ${getAlertStyles(alert.type)}`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-semibold text-white-900">
                  {alert.title}
                </h4>
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="flex-shrink-0 text-white-600 hover:text-white-900 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-white-700 mb-2">{alert.message}</p>
              <div className="flex items-center gap-3">
                {alert.timestamp && (
                  <div className="flex items-center gap-1 text-xs text-white-600">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {alert.actionUrl && (
                  <a
                    href={alert.actionUrl}
                    className="text-xs font-medium text-red-600 hover:text-red-500 transition-colors"
                  >
                    View Details →
                  </a>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default BusinessAlerts;
