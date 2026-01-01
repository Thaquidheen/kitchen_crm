/**
 * ApprovalWorkflow Component
 * SUPER_ADMIN approval workflow for design phases
 */

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { useApproveDesignMutation, useApproveStaffSubmissionMutation, useFreezeDesignAmountMutation, useUpdateDesignStatusMutation } from '@/features/design-phase/designPhaseApi';
import { type DesignPhase, DesignStatus } from '@/features/design-phase/types';
import { CheckCircle, DollarSign, AlertTriangle, Lock, Unlock, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { type RootState } from '@/app/store';

interface ApprovalWorkflowProps {
  designPhase: DesignPhase;
  onUpdate: () => void;
}

export function ApprovalWorkflow({ designPhase, onUpdate }: ApprovalWorkflowProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [approveDesign, { isLoading: approving }] = useApproveDesignMutation();
  const [approveStaffSubmission, { isLoading: approvingStaff }] = useApproveStaffSubmissionMutation();
  const [freezeAmount, { isLoading: freezing }] = useFreezeDesignAmountMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateDesignStatusMutation();
  
  const [freezeForm, setFreezeForm] = useState({
    amount: '',
  });

  const [statusForm, setStatusForm] = useState({
    newStatus: designPhase.designStatus,
    notes: '',
  });

  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';

  const handleApproveDesign = async () => {
    try {
      await approveDesign({
        customerId: designPhase.customerId
      }).unwrap();

      toast.success('Design approved successfully');
      onUpdate();
    } catch (error) {
      toast.error('Failed to approve design');
      console.error('Error approving design:', error);
    }
  };

  const handleFreezeAmount = async () => {
    try {
      await freezeAmount({
        customerId: designPhase.customerId,
        amount: parseFloat(freezeForm.amount)
      }).unwrap();

      toast.success('Design amount frozen successfully');
      setFreezeForm({ amount: '' });
      onUpdate();
    } catch (error) {
      toast.error('Failed to freeze design amount');
      console.error('Error freezing amount:', error);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      await updateStatus({
        customerId: designPhase.customerId,
        status: statusForm.newStatus
      }).unwrap();

      toast.success('Design status updated successfully');
      setStatusForm(prev => ({ ...prev, notes: '' }));
      onUpdate();
    } catch (error) {
      toast.error('Failed to update design status');
      console.error('Error updating status:', error);
    }
  };

  const canApproveStaffSubmission = isSuperAdmin && 
                                    designPhase.designStatus === DesignStatus.PENDING_SUPERADMIN_APPROVAL;
  
  const canApprove = designPhase.designStatus === DesignStatus.FEEDBACK_RECEIVED || 
                    designPhase.designStatus === DesignStatus.SUBMITTED;

  const canFreeze = designPhase.designStatus === DesignStatus.APPROVED && 
                   !designPhase.designAmountFrozen;

  const handleApproveStaffSubmission = async () => {
    try {
      await approveStaffSubmission({
        customerId: designPhase.customerId
      }).unwrap();

      toast.success('Staff submission approved successfully. Design is ready to submit to client.');
      onUpdate();
    } catch (error) {
      toast.error('Failed to approve staff submission');
      console.error('Error approving staff submission:', error);
    }
  };

  const getStatusColor = (status: DesignStatus) => {
    const colors = {
      [DesignStatus.PLANNING]: 'text-primary-500',
      [DesignStatus.IN_PROGRESS]: 'text-warning',
      [DesignStatus.PENDING_SUPERADMIN_APPROVAL]: 'text-warning',
      [DesignStatus.APPROVED_BY_ADMIN]: 'text-success',
      [DesignStatus.SUBMITTED]: 'text-primary-500',
      [DesignStatus.FEEDBACK_RECEIVED]: 'text-warning',
      [DesignStatus.REVISION_REQUIRED]: 'text-error',
      [DesignStatus.APPROVED]: 'text-success',
      [DesignStatus.FROZEN]: 'text-text-500',
      [DesignStatus.CANCELLED]: 'text-error',
    };
    return colors[status] || 'text-text-500';
  };

  if (!isSuperAdmin) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Shield className="h-12 w-12 text-text-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-900 mb-2">Admin Access Required</h3>
          <p className="text-text-600">
            Only SUPER_ADMIN users can access the approval workflow
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">Approval Workflow</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-text-900 mb-2">Current Status</h4>
            <div className="flex items-center gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(designPhase.designStatus).replace('text-', 'bg-')}`} />
              <span className={`font-medium ${getStatusColor(designPhase.designStatus)}`}>
                {designPhase.designStatus.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-text-900 mb-2">Progress</h4>
            <div className="flex items-center gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-600">Completion</span>
                  <span className="text-text-900 font-medium">{designPhase.designCompletionPercentage}%</span>
                </div>
                <div className="w-full bg-background-700 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${designPhase.designCompletionPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Approval Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Approval Actions</h3>
        
        <div className="space-y-4">
          {/* Approve Staff Submission */}
          {canApproveStaffSubmission && (
            <div className="flex items-center justify-between p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary-500" />
                <div>
                  <p className="text-text-900 font-medium">Approve Staff Submission</p>
                  <p className="text-sm text-text-600">
                    Approve the design submitted by staff. Once approved, it will be ready to submit to the client.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleApproveStaffSubmission}
                disabled={approvingStaff}
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {approvingStaff ? 'Approving...' : 'Approve Staff Submission'}
              </Button>
            </div>
          )}

          {/* Design Approval */}
          <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-text-900 font-medium">Approve Design</p>
                <p className="text-sm text-text-600">
                  Approve the design for production
                </p>
              </div>
            </div>
            <Button
              onClick={handleApproveDesign}
              disabled={!canApprove || approving}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {approving ? 'Approving...' : 'Approve'}
            </Button>
          </div>

          {/* Status Update */}
          <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-primary-500" />
              <div>
                <p className="text-text-900 font-medium">Update Status</p>
                <p className="text-sm text-text-600">
                  Manually update the design status
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-text-700 mb-2">
                  New Status
                </label>
                <Select
                  value={statusForm.newStatus}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, newStatus: e.target.value as DesignStatus }))}
                >
                  {Object.values(DesignStatus).map((status) => (
                    <option key={status} value={status}>
                      {status.replace('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-700 mb-2">
                  Notes
                </label>
                <Input
                  placeholder="Reason for status change..."
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <Button
              onClick={handleUpdateStatus}
              disabled={statusForm.newStatus === designPhase.designStatus || updating}
              className="flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              {updating ? 'Updating...' : 'Update Status'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Financial Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Financial Controls</h3>
        
        <div className="space-y-4">
          {/* Current Financial Status */}
          <div className="p-4 bg-background-800 border border-background-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-text-600" />
                <div>
                  <p className="text-text-900 font-medium">Design Amount Status</p>
                  <p className="text-sm text-text-600">
                    {designPhase.designAmountFrozen ? 'Amount Frozen' : 'Amount Not Frozen'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {designPhase.designAmountFrozen ? (
                  <>
                    <Lock className="h-4 w-4 text-success" />
                    <span className="text-success font-medium">
                      ₹{designPhase.frozenAmount?.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 text-warning" />
                    <span className="text-warning font-medium">Not Frozen</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Freeze Amount */}
          {canFreeze && (
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-text-900 font-medium">Freeze Design Amount</p>
                  <p className="text-sm text-text-600">
                    Freeze the design amount for production
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  placeholder="Enter amount to freeze"
                  value={freezeForm.amount}
                  onChange={(e) => setFreezeForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  onClick={handleFreezeAmount}
                  disabled={!freezeForm.amount || freezing}
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {freezing ? 'Freezing...' : 'Freeze Amount'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Workflow History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Workflow History</h3>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-background-800 border border-background-600 rounded-lg">
            <Shield className="h-4 w-4 text-text-600 mt-1" />
            <div className="flex-1">
              <p className="text-text-900 font-medium mb-1">Design Created</p>
              <p className="text-text-700 text-sm mb-2">Design phase initiated</p>
              <div className="flex items-center gap-4 text-xs text-text-600">
                <span>Created: {new Date(designPhase.createdAt).toLocaleDateString()}</span>
                <span>Status: {designPhase.designStatus}</span>
              </div>
            </div>
          </div>

          {designPhase.clientApprovalDate && (
            <div className="flex items-start gap-3 p-3 bg-success/10 border border-success/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-success mt-1" />
              <div className="flex-1">
                <p className="text-text-900 font-medium mb-1">Design Approved</p>
                <p className="text-text-700 text-sm mb-2">Design approved by client</p>
                <div className="flex items-center gap-4 text-xs text-text-600">
                  <span>Approved: {new Date(designPhase.clientApprovalDate).toLocaleDateString()}</span>
                  <span>Status: APPROVED</span>
                </div>
              </div>
            </div>
          )}

          {designPhase.designAmountFrozen && (
            <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <Lock className="h-4 w-4 text-warning mt-1" />
              <div className="flex-1">
                <p className="text-text-900 font-medium mb-1">Amount Frozen</p>
                <p className="text-text-700 text-sm mb-2">
                  Design amount frozen: ₹{designPhase.frozenAmount?.toLocaleString()}
                </p>
                <div className="flex items-center gap-4 text-xs text-text-600">
                  <span>Frozen: {new Date(designPhase.updatedAt).toLocaleDateString()}</span>
                  <span>Status: FROZEN</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-text-900 mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Generate approval report
              toast.success('Approval report generated');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <Shield className="h-4 w-4" />
            Generate Report
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              // Send approval notification
              toast.success('Approval notification sent');
            }}
            className="flex items-center gap-2 justify-start"
          >
            <CheckCircle className="h-4 w-4" />
            Send Notification
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ApprovalWorkflow;
