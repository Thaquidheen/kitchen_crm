import React, { useState } from 'react';
import { Package, Users, Calendar, CheckSquare, TrendingUp, ListTodo, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useGetProductionInstallationByCustomerQuery, useCreateProductionInstallationMutation, useUpdateTaskStatusMutation, useUpdateInstallationStatusMutation } from '../../production/productionAPI';
import { ProductionCreateModal } from '../../production/components/ProductionCreateModal';
import { ProductionTaskChecklist } from '../../production/components/ProductionTaskChecklist';
import { ReportIssueModal } from '../../production/components/ReportIssueModal';
import type { ProductionInstallationCreateRequest, InstallationStatus } from '../../production/types';
import { InstallationStatus as InstallationStatusEnum } from '../../production/types';

export interface CustomerProductionTabProps {
  customerId: number;
}

export const CustomerProductionTab: React.FC<CustomerProductionTabProps> = ({ customerId }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [showChecklist, setShowChecklist] = useState(true);

  const {
    data: productionResponse,
    isLoading,
    error,
    refetch
  } = useGetProductionInstallationByCustomerQuery(customerId);

  const [createProductionInstallation] = useCreateProductionInstallationMutation();
  const [updateTaskStatus] = useUpdateTaskStatusMutation();
  const [updateInstallationStatus, { isLoading: isUpdatingStatus }] = useUpdateInstallationStatusMutation();

  // Status options for dropdown
  const statusOptions: { value: InstallationStatus; label: string }[] = [
    { value: InstallationStatusEnum.NOT_STARTED, label: 'Not Started' },
    { value: InstallationStatusEnum.PRODUCTION, label: 'Production' },
    { value: InstallationStatusEnum.SITE_PREPARATION, label: 'Site Preparation' },
    { value: InstallationStatusEnum.DELIVERY, label: 'Delivery' },
    { value: InstallationStatusEnum.INSTALLATION, label: 'Installation' },
    { value: InstallationStatusEnum.QUALITY_CHECK, label: 'Quality Check' },
    { value: InstallationStatusEnum.COMPLETED, label: 'Completed' },
    { value: InstallationStatusEnum.ON_HOLD, label: 'On Hold' },
    { value: InstallationStatusEnum.CANCELLED, label: 'Cancelled' },
  ];

  const production = productionResponse?.success ? productionResponse?.data : null;

  // Check if response indicates no production exists (success: false with specific message)
  // or if there's a 404 error from the API
  const isNotFoundResponse = productionResponse && !productionResponse.success;
  const isNotFoundError = error && 'status' in error && (error as any).status === 404;
  const noProductionExists = isNotFoundResponse || isNotFoundError;
  const isRealError = error && !isNotFoundError;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NOT_STARTED: 'bg-background-500/20 text-text-500 border-background-500',
      PRODUCTION: 'bg-warning/20 text-warning border-warning',
      SITE_PREPARATION: 'bg-info/20 text-info border-info',
      DELIVERY: 'bg-primary-500/20 text-primary-400 border-primary-500',
      INSTALLATION: 'bg-warning/20 text-warning border-warning',
      QUALITY_CHECK: 'bg-info/20 text-info border-info',
      COMPLETED: 'bg-success/20 text-success border-success',
      ON_HOLD: 'bg-orange-500/20 text-orange-400 border-orange-500',
      CANCELLED: 'bg-red-500/20 text-red-400 border-red-500',
    };
    return colors[status] || colors.NOT_STARTED;
  };


  // Handle create production installation
  const handleCreateProductionInstallation = async (data: ProductionInstallationCreateRequest) => {
    try {
      const result = await createProductionInstallation({
        customerId: data.customerId,
        projectManagerAssigned: data.projectManagerAssigned,
        installationTeamLead: data.installationTeamLead,
        estimatedCompletionDate: data.estimatedCompletionDate,
        installationNotes: data.installationNotes,
      }).unwrap();

      if (result.success) {
        toast.success('Production installation created successfully!');
        setIsCreateModalOpen(false);
        refetch(); // Refresh the data
      } else {
        toast.error(result.message || 'Failed to create production installation');
      }
    } catch (error: any) {
      console.error('Error creating production installation:', error);
      toast.error(error?.data?.message || 'Failed to create production installation');
    }
  };

  // Handle installation status change
  const handleStatusChange = async (newStatus: InstallationStatus) => {
    try {
      const result = await updateInstallationStatus({
        customerId,
        status: newStatus,
      }).unwrap();

      if (result.success) {
        toast.success('Status updated successfully!');
        refetch();
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error?.data?.message || 'Failed to update status');
    }
  };

  // Handle task status update
  const handleTaskUpdate = async (data: { taskName: string; completed: boolean; completionDate?: string }) => {
    try {
      const result = await updateTaskStatus({
        customerId,
        taskName: data.taskName,
        completed: data.completed,
        completionDate: data.completionDate,
      }).unwrap();

      if (result.success) {
        refetch(); // Refresh the data
      } else {
        throw new Error(result.message || 'Failed to update task');
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-background-900 border border-background-700 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-background-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-background-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Show error only for real errors (not 404)
  if (isRealError) {
    return (
      <div className="bg-background-900 border border-background-700 rounded-lg p-12 text-center">
        <Package className="w-12 h-12 text-primary-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-900 mb-2">Error Loading Production Phase</h3>
        <p className="text-text-600 mb-6">
          Failed to load production installation information
        </p>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-text-900 rounded-md transition-colors"
          onClick={() => refetch()}
        >
          <Package className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Show "no production" message if no production exists
  if (!production || noProductionExists) {
    return (
      <>
        <div className="bg-background-900 border border-background-700 rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-text-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-900 mb-2">No Production Phase Yet</h3>
          <p className="text-text-600 mb-6">
            Production and installation has not been initiated for this customer
          </p>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-text-900 rounded-md transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Package className="w-4 h-4" />
            Initiate Production Phase
          </button>
        </div>

        {/* Production Create Modal */}
        <ProductionCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProductionInstallation}
          customerId={customerId}
          title="Create Production Installation"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-background-900 border border-background-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary-500" />
            <div>
              <h3 className="text-lg font-semibold text-text-900">Production & Installation</h3>
              <p className="text-sm text-text-600">Customer #{customerId}</p>
            </div>
          </div>
          <div className="relative">
            <select
              value={production.overallStatus}
              onChange={(e) => handleStatusChange(e.target.value as InstallationStatus)}
              disabled={isUpdatingStatus}
              className={`appearance-none cursor-pointer px-4 py-1.5 pr-8 rounded-lg border font-medium bg-background-800 text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 ${getStatusColor(
                production.overallStatus
              )} ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-background-800 text-text-900">
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isUpdatingStatus ? 'animate-spin' : ''}`} />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-background-900 border border-background-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-text-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Progress
          </h3>
          <span className="text-2xl font-bold text-text-900">{production.overallProgressPercentage || 0}%</span>
        </div>
        <div className="h-3 bg-background-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-cyan-500 transition-all"
            style={{ width: `${production.overallProgressPercentage || 0}%` }}
          ></div>
        </div>
      </div>

      {/* Team Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {production.projectManagerAssigned && (
          <div className="bg-background-900 border border-background-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-sm text-text-600">Project Manager</p>
                <p className="text-text-900 font-semibold">{production.projectManagerAssigned}</p>
              </div>
            </div>
          </div>
        )}

        {production.installationTeamLead && (
          <div className="bg-background-900 border border-background-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-sm text-text-600">Team Lead</p>
                <p className="text-text-900 font-semibold">{production.installationTeamLead}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {production.productionStartDate && (
          <div className="bg-background-900 border border-background-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-info" />
              <p className="text-sm text-text-600">Production Start</p>
            </div>
            <p className="text-text-900 font-semibold">{formatDate(production.productionStartDate)}</p>
          </div>
        )}

        {production.estimatedCompletionDate && (
          <div className="bg-background-900 border border-background-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-warning" />
              <p className="text-sm text-text-600">Estimated Completion</p>
            </div>
            <p className="text-text-900 font-semibold">
              {formatDate(production.estimatedCompletionDate)}
            </p>
          </div>
        )}

        {production.actualCompletionDate && (
          <div className="bg-background-900 border border-background-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-success" />
              <p className="text-sm text-text-600">Actual Completion</p>
            </div>
            <p className="text-text-900 font-semibold">
              {formatDate(production.actualCompletionDate)}
            </p>
          </div>
        )}
      </div>

      {/* Quality Check Status */}
      {production.qualityCheckPassed !== undefined && (
        <div className="bg-background-900 border border-background-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-success" />
            <div>
              <p className="text-sm text-text-600">Quality Check Status</p>
              <p className="text-text-900 font-semibold">
                {production.qualityCheckPassed ? 'Passed' : 'Pending'}
              </p>
              {production.qualityCheckDate && (
                <p className="text-xs text-text-500 mt-1">
                  Date: {formatDate(production.qualityCheckDate)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Installation Notes */}
      {production.installationNotes && (
        <div className="bg-background-900 border border-background-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-text-900 mb-2">Installation Notes</h3>
          <p className="text-text-700 whitespace-pre-wrap">{production.installationNotes}</p>
        </div>
      )}

      {/* Payments context for the "Advance received" checkpoint — read-only, never auto-ticks */}
      {(production as any).paymentsReceivedTotal != null && Number((production as any).paymentsReceivedTotal) > 0 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-background-700 bg-background-900 text-[13px]">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--st-confirmed-fg)' }} />
          <span className="text-text-700">
            Payments recorded for this customer:{' '}
            <b className="text-text-900 tabular-nums">
              ₹{Number((production as any).paymentsReceivedTotal).toLocaleString('en-IN')}
            </b>
            {(production as any).firstPaymentDate && (
              <>
                {' '}· first on{' '}
                <b className="text-text-900 tabular-nums">
                  {new Date((production as any).firstPaymentDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </b>
              </>
            )}
            {' '}— reference for the "Advance received" checkpoint.
          </span>
        </div>
      )}

      {/* Task Checklist Section */}
      <div className="bg-background-900 border border-background-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Production Tasks</h3>
          </div>
          <button
            onClick={() => setShowChecklist(!showChecklist)}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            {showChecklist ? 'Hide Checklist' : 'Show Checklist'}
          </button>
        </div>

        {showChecklist && (
          <ProductionTaskChecklist
            production={production}
            customerId={customerId}
            onTaskUpdate={handleTaskUpdate}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setIsReportIssueModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-warning/50 text-warning hover:bg-warning/10 rounded-md transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportIssueModalOpen}
        onClose={() => setIsReportIssueModalOpen(false)}
        customerId={customerId}
      />
    </div>
  );
};

export default CustomerProductionTab;
