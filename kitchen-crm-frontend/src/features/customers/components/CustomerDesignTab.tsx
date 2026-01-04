import React, { useState } from 'react';
import { Palette, Calendar, Users, FileText, MessageSquare, CheckCircle } from 'lucide-react';
import { useGetDesignPhaseByCustomerQuery, useCreateDesignPhaseMutation } from '../../design-phase/designPhaseApi';
import { DesignPhaseCreateModal } from '../../design-phase/components/DesignPhaseCreateModal';
import type { DesignPhase, DesignPhaseCreateRequest } from '../../design-phase/types';
import { toast } from 'react-hot-toast';

export interface CustomerDesignTabProps {
  customerId: number;
}

export const CustomerDesignTab: React.FC<CustomerDesignTabProps> = ({ customerId }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { 
    data: designPhaseResponse, 
    isLoading, 
    error,
    refetch 
  } = useGetDesignPhaseByCustomerQuery(customerId);

  const [createDesignPhase, { isLoading: creating }] = useCreateDesignPhaseMutation();

  // Handle create design phase
  const handleCreateDesignPhase = async (data: DesignPhaseCreateRequest) => {
    try {
      const result = await createDesignPhase({
        customerId: data.customerId,
        quotationId: data.quotationId,
        designRequirements: data.designRequirements,
        staffAssignedId: data.staffAssignedId
      }).unwrap();

      if (result.success) {
        toast.success('Design phase created successfully!');
        setIsCreateModalOpen(false);
        refetch(); // Refresh the data
      } else {
        toast.error(result.message || 'Failed to create design phase');
      }
    } catch (error: any) {
      console.error('Error creating design phase:', error);
      toast.error(error?.data?.message || 'Failed to create design phase');
    }
  };

  const designPhase = designPhaseResponse?.data || null;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-background-500/20 text-text-500 border-background-500',
      IN_PROGRESS: 'bg-info/20 text-info border-info',
      SUBMITTED: 'bg-warning/20 text-warning border-warning',
      FEEDBACK_RECEIVED: 'bg-warning/20 text-warning border-warning',
      REVISION_REQUIRED: 'bg-warning/20 text-warning border-warning',
      APPROVED: 'bg-success/20 text-success border-success',
      FROZEN: 'bg-primary-500/20 text-primary-400 border-primary-500',
      CANCELLED: 'bg-error/20 text-error border-error',
    };
    return colors[status] || colors.PLANNING;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-background-800 border border-background-600 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-background-600 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-background-600 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background-800 border border-background-600 rounded-lg p-12 text-center">
        <Palette className="w-12 h-12 text-error mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-900 mb-2">Error Loading Design Phase</h3>
        <p className="text-text-600 mb-6">
          Failed to load design phase information
        </p>
        <button 
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
          onClick={() => refetch()}
        >
          <Palette className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (!designPhase) {
    return (
      <>
        <div className="bg-background-800 border border-background-600 rounded-lg p-12 text-center">
          <Palette className="w-12 h-12 text-text-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-900 mb-2">No Design Phase Yet</h3>
          <p className="text-text-600 mb-6">
            Design phase has not been initiated for this customer
          </p>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Palette className="w-4 h-4" />
            Initiate Design Phase
          </button>
        </div>

        {/* Design Phase Create Modal */}
        <DesignPhaseCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateDesignPhase}
          customerId={customerId}
          mode="create"
          title="Create Design Phase"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="bg-background-800 border border-background-600 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-6 h-6 text-primary-500" />
            <div>
              <h3 className="text-lg font-semibold text-text-900">Design Phase Status</h3>
              <p className="text-sm text-text-600">Customer #{customerId}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1.5 rounded-lg border font-medium ${getStatusColor(
              designPhase.designStatus
            )}`}
          >
            {designPhase.designStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Staff Information */}
      {designPhase.staffAssignedName && (
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Assigned Staff</h3>
          </div>
          <p className="text-text-900 ml-8">{designPhase.staffAssignedName}</p>
        </div>
      )}

      {/* Meeting Information */}
      {designPhase.meetingScheduled && (
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Scheduled Meeting</h3>
          </div>
          <p className="text-text-900 ml-8">{formatDate(designPhase.meetingScheduled)}</p>
        </div>
      )}

      {/* Design Requirements */}
      {designPhase.designRequirements && (
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Design Requirements</h3>
          </div>
          <p className="text-text-900 ml-8 whitespace-pre-wrap">{designPhase.designRequirements}</p>
        </div>
      )}

      {/* Client Feedback */}
      {designPhase.clientFeedback && (
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            <h3 className="text-lg font-semibold text-text-900">Client Feedback</h3>
          </div>
          <p className="text-text-900 ml-8 whitespace-pre-wrap">{designPhase.clientFeedback}</p>
        </div>
      )}

      {/* Design Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-warning" />
            <p className="text-sm text-text-600">Revisions</p>
          </div>
          <p className="text-2xl font-bold text-text-900 ml-8">{designPhase.revisionCount || 0}</p>
        </div>

        {designPhase.frozenAmount && (
          <div className="bg-background-800 border border-background-600 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <p className="text-sm text-text-600">Frozen Amount</p>
            </div>
            <p className="text-2xl font-bold text-text-900 ml-8">
              {formatCurrency(designPhase.frozenAmount)}
            </p>
          </div>
        )}

        <div className="bg-background-800 border border-background-600 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-info" />
            <p className="text-sm text-text-600">Progress</p>
          </div>
          <p className="text-2xl font-bold text-text-900 ml-8">{designPhase.designCompletionPercentage || 0}%</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-background-800 border border-background-600 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-text-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Timeline
        </h3>
        <div className="space-y-3 ml-2">
          <div className="flex items-start gap-3 border-l-2 border-background-600 pl-4 pb-4">
            <div className="p-1.5 bg-success rounded-full mt-1"></div>
            <div>
              <p className="text-text-900 font-medium">Design Phase Created</p>
              <p className="text-sm text-text-600">{formatDate(designPhase.createdAt)}</p>
            </div>
          </div>
          {designPhase.updatedAt && (
            <div className="flex items-start gap-3 border-l-2 border-background-600 pl-4">
              <div className="p-1.5 bg-info rounded-full mt-1"></div>
              <div>
                <p className="text-text-900 font-medium">Last Updated</p>
                <p className="text-sm text-text-600">{formatDate(designPhase.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 bg-primary-700 hover:bg-primary-600 text-text-900 rounded-md transition-colors">
          Submit to Client
        </button>
        <button className="px-4 py-2 border border-background-600 text-text-900 hover:bg-background-700 rounded-md transition-colors">
          Schedule Meeting
        </button>
        <button className="px-4 py-2 border border-background-600 text-text-900 hover:bg-background-700 rounded-md transition-colors">
          Update Status
        </button>
      </div>

      {/* Design Phase Create Modal */}
      <DesignPhaseCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDesignPhase}
        customerId={customerId}
        mode="create"
        title="Create Design Phase"
      />
    </div>
  );
};

export default CustomerDesignTab;
