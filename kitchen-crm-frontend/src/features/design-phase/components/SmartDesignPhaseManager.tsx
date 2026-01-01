/**
 * Smart Design Phase Management Component
 * Handles both creation and updating of design phases
 */

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { 
  useGetDesignPhaseByCustomerQuery,
  useCheckDesignPhaseExistsQuery,
  useCreateDesignPhaseMutation,
  useUpdateDesignPhaseMutation
} from '../designPhaseApi';
import { DesignPhaseCreateModal } from './DesignPhaseCreateModal';
import { DesignPhaseDetail } from './DesignPhaseDetail';
import type { DesignPhase, DesignPhaseCreateRequest, DesignPhaseUpdateRequest } from '../types';

interface SmartDesignPhaseManagerProps {
  customerId: number;
  onClose?: () => void;
}

export function SmartDesignPhaseManager({ customerId, onClose }: SmartDesignPhaseManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if design phase exists
  const { 
    data: existsResponse, 
    isLoading: checkingExists,
    error: existsError 
  } = useCheckDesignPhaseExistsQuery(customerId);

  // Get existing design phase if it exists
  const { 
    data: designPhaseResponse, 
    isLoading: loadingDesignPhase,
    error: designPhaseError,
    refetch: refetchDesignPhase
  } = useGetDesignPhaseByCustomerQuery(customerId, {
    skip: !existsResponse?.data // Only fetch if we know it exists
  });

  const [createDesignPhase, { isLoading: creating }] = useCreateDesignPhaseMutation();
  const [updateDesignPhase, { isLoading: updating }] = useUpdateDesignPhaseMutation();

  const isLoading = checkingExists || loadingDesignPhase;
  const designPhaseExists = existsResponse?.data || false;
  const designPhase = designPhaseResponse?.data;

  // Handle create design phase
  const handleCreateDesignPhase = useCallback(async (data: DesignPhaseCreateRequest | DesignPhaseUpdateRequest) => {
    console.log('handleCreateDesignPhase called with data:', data);
    try {
      const result = await createDesignPhase({
        customerId: data.customerId,
        designRequirements: data.designRequirements,
        staffAssignedId: data.staffAssignedId,
        quotationId: data.quotationId
      }).unwrap();

      if (result.success) {
        toast.success('Design phase created successfully!');
        setShowCreateModal(false);
        refetchDesignPhase(); // Refresh the data
      } else {
        // If design phase already exists, show the existing one
        if (result.message?.includes('already exists')) {
          toast.success('Design phase already exists. Loading existing design phase...');
          refetchDesignPhase();
        } else {
          toast.error(result.message || 'Failed to create design phase');
        }
      }
    } catch (error: any) {
      console.error('Error creating design phase:', error);
      toast.error(error?.data?.message || 'Failed to create design phase');
    }
  }, [createDesignPhase, customerId, refetchDesignPhase]);

  // Handle update design phase
  const handleUpdateDesignPhase = useCallback(async (data: DesignPhaseCreateRequest | DesignPhaseUpdateRequest) => {
    try {
      const result = await updateDesignPhase({
        customerId,
        designPhaseData: {
          id: designPhase?.id || 0,
          customerId: data.customerId,
          designRequirements: data.designRequirements,
          staffAssignedId: data.staffAssignedId,
          designStatus: 'designStatus' in data ? data.designStatus : designPhase?.designStatus
        }
      }).unwrap();

      if (result.success) {
        toast.success('Design phase updated successfully!');
        setIsUpdating(false);
        refetchDesignPhase();
      } else {
        toast.error(result.message || 'Failed to update design phase');
      }
    } catch (error: any) {
      console.error('Error updating design phase:', error);
      toast.error(error?.data?.message || 'Failed to update design phase');
    }
  }, [updateDesignPhase, customerId, designPhase, refetchDesignPhase]);

  // Handle errors
  useEffect(() => {
    if (existsError) {
      console.error('Error checking design phase existence:', existsError);
    }
    if (designPhaseError) {
      console.error('Error loading design phase:', designPhaseError);
    }
  }, [existsError, designPhaseError]);

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <Spinner size="lg" />
        <p className="mt-4 text-gray-600">Loading design phase information...</p>
      </Card>
    );
  }

  // If design phase exists, show the detail view
  if (designPhaseExists && designPhase) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Design Phase</h2>
            <p className="text-gray-600">Customer ID: {customerId}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setIsUpdating(true)}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Edit Design Phase'}
            </Button>
            {onClose && (
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>

        {isUpdating ? (
          <DesignPhaseCreateModal
            isOpen={true}
            onClose={() => setIsUpdating(false)}
            onSubmit={handleUpdateDesignPhase}
            initialData={designPhase}
            mode="update"
            title="Update Design Phase"
          />
        ) : (
          <DesignPhaseDetail
            designPhase={designPhase}
            onUpdate={refetchDesignPhase}
            onRefresh={refetchDesignPhase}
          />
        )}
      </div>
    );
  }

  // If no design phase exists, show create option
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Design Phase</h2>
          <p className="text-gray-600">Customer ID: {customerId}</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <Card className="p-8 text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Design Phase Found</h3>
        <p className="text-gray-600 mb-6">
          This customer doesn't have a design phase yet. Create one to get started.
        </p>
        <Button
          onClick={() => setShowCreateModal(true)}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {creating ? 'Creating...' : 'Create Design Phase'}
        </Button>
      </Card>

      {showCreateModal && (
        <DesignPhaseCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDesignPhase}
          customerId={customerId}
          mode="create"
          title="Create Design Phase"
        />
      )}
    </div>
  );
}
