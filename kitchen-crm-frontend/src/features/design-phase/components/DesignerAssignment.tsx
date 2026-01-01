/**
 * DesignerAssignment Component
 * UI for assigning and managing designers for design phases
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { useUpdateDesignPhaseMutation, useUpdateDesignStatusMutation } from '@/features/design-phase/designPhaseApi';
import { useGetAvailableDesignersQuery } from '@/features/designers/designerApi';
import { type DesignPhase, DesignStatus } from '@/features/design-phase/types';
import { type Designer } from '@/features/designers/types';
import { User, Save, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DesignerAssignmentProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
}

export function DesignerAssignment({ designPhase, onUpdate }: DesignerAssignmentProps) {
  const [updateDesignPhase, { isLoading: isUpdatingPhase }] = useUpdateDesignPhaseMutation();
  const [updateDesignStatus, { isLoading: isUpdatingStatus }] = useUpdateDesignStatusMutation();
  const { data: designersResponse, isLoading: designersLoading } = useGetAvailableDesignersQuery();

  const isLoading = isUpdatingPhase || isUpdatingStatus;

  // Safety check for invalid design phase data
  if (!designPhase || !designPhase.customerId) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <User className="h-12 w-12 text-text-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-900 mb-2">Invalid Design Phase</h3>
            <p className="text-text-600">Design phase data is not available or invalid.</p>
          </div>
        </Card>
      </div>
    );
  }

  const availableDesigners = designersResponse?.data || [];
  
  const [formData, setFormData] = useState({
    staffAssignedId: designPhase.staffAssignedId || 0,
    designRequirements: designPhase.designRequirements || '',
    designStatus: designPhase.designStatus,
  });

  const handleSave = async () => {
    if (!designPhase?.customerId) {
      toast.error('Invalid design phase data');
      return;
    }

    try {
      // Check if status changed
      const statusChanged = formData.designStatus !== designPhase.designStatus;

      // Update design phase details (staff and requirements)
      if (formData.staffAssignedId !== (designPhase.staffAssignedId || 0) ||
          formData.designRequirements !== (designPhase.designRequirements || '')) {
        await updateDesignPhase({
          customerId: designPhase.customerId,
          designPhaseData: {
            id: designPhase.id,
            customerId: designPhase.customerId,
            staffAssignedId: formData.staffAssignedId || undefined,
            designRequirements: formData.designRequirements,
          }
        }).unwrap();
      }

      // Update status separately if it changed
      if (statusChanged) {
        await updateDesignStatus({
          customerId: designPhase.customerId,
          status: formData.designStatus,
        }).unwrap();
      }

      toast.success('Designer assignment updated successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update designer assignment');
      console.error('Error updating designer assignment:', error);
    }
  };

  const handleReset = () => {
    setFormData({
      staffAssignedId: designPhase.staffAssignedId || 0,
      designRequirements: designPhase.designRequirements || '',
      designStatus: designPhase.designStatus,
    });
  };

  const handleStatusChange = (newStatus: DesignStatus) => {
    setFormData(prev => ({ ...prev, designStatus: newStatus }));
  };

  const getStatusColor = (status: DesignStatus) => {
    const colors = {
      [DesignStatus.PLANNING]: 'text-primary-500',
      [DesignStatus.IN_PROGRESS]: 'text-warning',
      [DesignStatus.SUBMITTED]: 'text-primary-500',
      [DesignStatus.FEEDBACK_RECEIVED]: 'text-warning',
      [DesignStatus.REVISION_REQUIRED]: 'text-error',
      [DesignStatus.APPROVED]: 'text-success',
      [DesignStatus.FROZEN]: 'text-text-500',
      [DesignStatus.CANCELLED]: 'text-error',
    };
    return colors[status] || 'text-text-500';
  };

  const hasChanges =
    formData.staffAssignedId !== (designPhase.staffAssignedId || 0) ||
    formData.designRequirements !== (designPhase.designRequirements || '') ||
    formData.designStatus !== designPhase.designStatus;

  return (
    <div className="space-y-6">
      {/* Current Assignment */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">Current Assignment</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Assigned Designer
            </label>
            <div className="flex items-center gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <User className="h-4 w-4 text-text-600" />
              <span className="text-text-900 font-medium">
                {designPhase.staffAssignedName || 'Unassigned'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Current Status
            </label>
            <div className="flex items-center gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(designPhase.designStatus)?.replace('text-', 'bg-') || 'bg-background-500'}`} />
              <span className={`font-medium ${getStatusColor(designPhase.designStatus)}`}>
                {designPhase.designStatus?.replace('_', ' ') || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Assignment Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Update Assignment</h3>
        
        <div className="space-y-6">
          {/* Designer Selection */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Assign Designer
            </label>
            <Select
              value={formData.staffAssignedId}
              onChange={(e) => setFormData(prev => ({ ...prev, staffAssignedId: parseInt(e.target.value) || 0 }))}
              disabled={designersLoading}
            >
              <option value="0">Select a designer...</option>
              {availableDesigners.map((designer) => (
                <option key={designer.id} value={designer.id}>
                  {designer.name} - {designer.specialization || designer.department}
                </option>
              ))}
            </Select>
            <p className="text-sm text-text-600 mt-1">
              Choose a designer to assign to this design phase
            </p>
          </div>

          {/* Design Requirements */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Design Requirements
            </label>
            <TextArea
              value={formData.designRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, designRequirements: e.target.value }))}
              placeholder="Enter detailed design requirements..."
              rows={4}
            />
            <p className="text-sm text-text-600 mt-1">
              Provide detailed requirements and specifications for the design
            </p>
          </div>

          {/* Status Update */}
          <div>
            <label className="block text-sm font-medium text-text-700 mb-2">
              Update Status
            </label>
            <Select
              value={formData.designStatus}
              onChange={(e) => handleStatusChange(e.target.value as DesignStatus)}
            >
              {Object.values(DesignStatus).map((status) => (
                <option key={status} value={status}>
                  {status?.replace('_', ' ') || status}
                </option>
              ))}
            </Select>
            <p className="text-sm text-text-600 mt-1">
              Update the current status of this design phase
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-background-600">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleReset}
              disabled={!hasChanges || isLoading}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Designer Information */}
      {formData.staffAssignedId > 0 && (() => {
        const selectedDesigner = availableDesigners.find(d => d.id === formData.staffAssignedId);
        return selectedDesigner ? (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-text-900 mb-4">Designer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-text-900 mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-text-600">Email: {selectedDesigner.email}</p>
                  <p className="text-text-600">Phone: {selectedDesigner.phoneNumber || 'Not provided'}</p>
                  <p className="text-text-600">Department: {selectedDesigner.department}</p>
                  {selectedDesigner.specialization && (
                    <p className="text-text-600">Specialization: {selectedDesigner.specialization}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-text-900 mb-2">Workload & Experience</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-text-600">Experience: {selectedDesigner.experienceYears} years</p>
                  <p className="text-text-600">Max Projects: {selectedDesigner.maxConcurrentProjects}</p>
                  <p className="text-text-600">Avg Completion: {selectedDesigner.averageCompletionDays} days</p>
                  {selectedDesigner.hourlyRate && (
                    <p className="text-text-600">Rate: ₹{selectedDesigner.hourlyRate}/hour</p>
                  )}
                </div>
              </div>
            </div>

            {selectedDesigner.bio && (
              <div className="mt-4">
                <h4 className="font-medium text-text-900 mb-2">Bio</h4>
                <p className="text-sm text-text-600">{selectedDesigner.bio}</p>
              </div>
            )}

            {selectedDesigner.skills && (
              <div className="mt-4">
                <h4 className="font-medium text-text-900 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDesigner.skills.split(',').map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : null;
      })()}

      {/* Assignment History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Assignment History</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background-800 border border-background-600 rounded-lg">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-text-600" />
              <div>
                <p className="text-text-900 font-medium">
                  {designPhase.staffAssignedName || 'Unassigned'}
                </p>
                <p className="text-sm text-text-600">Current assignment</p>
              </div>
            </div>
            <span className="text-sm text-text-600">
              {new Date(designPhase.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {/* Add more history items as needed */}
        </div>
      </Card>
    </div>
  );
}

export default DesignerAssignment;
