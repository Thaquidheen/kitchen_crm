/**
 * PaymentForm Component
 * Form for creating/recording payments with validation
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { useGetProjectsQuery } from '@/features/projects/projectsAPI';
import { useGetProjectByIdQuery } from '@/features/projects/projectsAPI';
import { useCreatePaymentMutation } from '../paymentApi';
import { PaymentMethod, type PaymentCreateRequest } from '../types';
import toast from 'react-hot-toast';
import { Save, X, AlertCircle, Edit } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

export interface PaymentFormProps {
  projectId?: number;
  onSuccess?: () => void;
  onEditProject?: () => void;
}

export function PaymentForm({ projectId: initialProjectId, onSuccess, onEditProject }: PaymentFormProps) {
  const navigate = useNavigate();
  const currentTheme = useAppSelector(selectCurrentTheme);
  const [formData, setFormData] = useState<Partial<PaymentCreateRequest>>({
    projectId: initialProjectId || 0,
    amount: 0,
    paymentMethod: PaymentMethod.CASH,
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: '',
  });

  const { data: projectsData } = useGetProjectsQuery({
    page: 0,
    size: 1000,
  });

  const { data: selectedProject } = useGetProjectByIdQuery(formData.projectId || 0, {
    skip: !formData.projectId,
  });

  const [createPayment, { isLoading }] = useCreatePaymentMutation();
  const [validationError, setValidationError] = useState<string>('');

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        warning: '#F59E0B',
        primary: '#8B5CF6',
        success: '#10B981',
        info: '#3B82F6',
        error: '#EF4444',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      warning: currentTheme.colors.semantic.warning,
      primary: currentTheme.colors.primary[500],
      success: currentTheme.colors.semantic.success,
      info: currentTheme.colors.semantic.info,
      error: currentTheme.colors.semantic.error,
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  // Validate amount when it changes or project changes
  useEffect(() => {
    if (selectedProject && formData.amount) {
      // Check if committed amounts are set
      const committedInHand = selectedProject.committedInHand || 0;
      const committedInAccount = selectedProject.committedInAccount || 0;
      const totalCommitted = committedInHand + committedInAccount;
      
      if (formData.amount <= 0) {
        setValidationError('Amount must be greater than 0');
      } else if (totalCommitted === 0) {
        setValidationError('⚠️ Project has no payment commitment set. Please edit the project to set committed amounts first.');
      } else {
        // Check against the specific balance (hand or account) based on payment method
        const balanceToCheck = formData.paymentMethod === PaymentMethod.CASH 
          ? (selectedProject.balanceInHand || 0)
          : (selectedProject.balanceInAccount || 0);
          
        if (formData.amount > balanceToCheck) {
          const balanceType = formData.paymentMethod === PaymentMethod.CASH ? 'hand (cash)' : 'account (bank)';
          setValidationError(`Amount exceeds ${balanceType} balance (₹${balanceToCheck.toLocaleString('en-IN')})`);
        } else {
          setValidationError('');
        }
      }
    }
  }, [formData.amount, formData.paymentMethod, selectedProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      toast.error('Please select a project');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!selectedProject) {
      toast.error('Project not found');
      return;
    }

    // Validate amount against project balance
    // Basic validation
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await createPayment(formData as PaymentCreateRequest).unwrap();
      toast.success('Payment recorded successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/payments');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error?.data?.message || 'Failed to record payment');
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/payments');
    }
  };

  const isCashMethod = formData.paymentMethod === PaymentMethod.CASH;
  const requiresReference = [
    PaymentMethod.ACCOUNT_TRANSFER,
    PaymentMethod.NEFT,
    PaymentMethod.RTGS,
    PaymentMethod.CHEQUE,
    PaymentMethod.UPI,
  ].includes(formData.paymentMethod as any);

  return (
    <form onSubmit={handleSubmit}>
      <Card 
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
          borderColor: currentTheme?.colors?.background?.[600] || '#252530'
        }}
      >
        <h2 
          className="text-lg sm:text-xl font-bold mb-4 sm:mb-6"
          style={{ color: themeColors.text }}
        >
          Record Payment
        </h2>

        {/* Warning if project has no commitment set */}
        {selectedProject && ((selectedProject.committedInHand || 0) + (selectedProject.committedInAccount || 0)) === 0 && (
          <div 
            className="mb-4 sm:mb-6 p-3 sm:p-4 border-2 rounded-lg"
            style={{
              backgroundColor: `${themeColors.warning}33`,
              borderColor: `${themeColors.warning}80`
            }}
          >
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle 
                className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" 
                style={{ color: themeColors.warning }} 
              />
              <div className="flex-1">
                <h3 
                  className="text-xs sm:text-sm font-bold mb-1"
                  style={{ color: themeColors.warning }}
                >
                  No Payment Commitment Set
                </h3>
                <p 
                  className="text-xs sm:text-sm mb-2 sm:mb-3"
                  style={{ color: `${themeColors.warning}CC` }}
                >
                  This project doesn't have payment commitment amounts set. You need to edit the project and set the committed amounts (cash vs bank) before recording payments.
                </p>
                {onEditProject && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={onEditProject}
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Edit Project to Set Commitment
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Project Selection */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Project <span style={{ color: themeColors.error }}>*</span>
            </label>
            <Select
              value={formData.projectId || ''}
              onChange={(e) =>
                setFormData({ ...formData, projectId: parseInt(e.target.value) })
              }
              required
              disabled={!!initialProjectId}
              options={[
                { value: '', label: 'Select a project' },
                ...(projectsData?.content?.map((project) => ({
                  value: project.id,
                  label: `${project.projectName} - ${project.customerName} (Balance: ₹${project.balanceAmount?.toLocaleString('en-IN')})`,
                })) || [])
              ]}
            />
          </div>

          {/* Project Balance Info */}
          {selectedProject && (
            <Card 
              className="p-3 sm:p-4"
              style={{
                backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24',
                borderColor: currentTheme?.colors?.background?.[600] || '#252530'
              }}
            >
              <div className="space-y-3 sm:space-y-4">
                {/* Payment Commitment */}
                <div>
                  <h4 
                    className="text-xs sm:text-sm font-semibold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    Payment Commitment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div>
                      <p style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>Total Amount</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.text }}
                      >
                        ₹{selectedProject.totalAmount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.warning}33`,
                        borderColor: `${themeColors.warning}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.warning}CC` }}>Committed in Hand</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.warning }}
                      >
                        ₹{selectedProject.committedInHand?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.primary}33`,
                        borderColor: `${themeColors.primary}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.primary}CC` }}>Committed in Account</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.primary }}
                      >
                        ₹{selectedProject.committedInAccount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Received Amounts */}
                <div>
                  <h4 
                    className="text-xs sm:text-sm font-semibold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    Received Amounts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div>
                      <p style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>Total Received</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.success }}
                      >
                        ₹{selectedProject.receivedAmountTotal?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.warning}33`,
                        borderColor: `${themeColors.warning}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.warning}CC` }}>Received in Hand</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.warning }}
                      >
                        ₹{selectedProject.receivedInHand?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.primary}33`,
                        borderColor: `${themeColors.primary}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.primary}CC` }}>Received in Account</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.primary }}
                      >
                        ₹{selectedProject.receivedInAccount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balance Breakdown */}
                <div>
                  <h4 
                    className="text-xs sm:text-sm font-semibold mb-2"
                    style={{ color: themeColors.text }}
                  >
                    Balance Due
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-xs">
                    <div>
                      <p style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>Total Balance</p>
                      <p 
                        className="font-medium"
                        style={{ color: '#F97316' }}
                      >
                        ₹{selectedProject.balanceAmount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.warning}33`,
                        borderColor: isCashMethod ? themeColors.warning : `${themeColors.warning}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.warning}CC` }}>Balance in Hand</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.warning }}
                      >
                        ₹{selectedProject.balanceInHand?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                    <div 
                      className="p-2 rounded border"
                      style={{
                        backgroundColor: `${themeColors.primary}33`,
                        borderColor: !isCashMethod ? themeColors.primary : `${themeColors.primary}80`
                      }}
                    >
                      <p style={{ color: `${themeColors.primary}CC` }}>Balance in Account</p>
                      <p 
                        className="font-medium"
                        style={{ color: themeColors.primary }}
                      >
                        ₹{selectedProject.balanceInAccount?.toLocaleString('en-IN') || '0'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Show which balance will be affected */}
                <div 
                  className="mt-2 sm:mt-3 p-2 rounded border"
                  style={{
                    backgroundColor: `${themeColors.info}33`,
                    borderColor: `${themeColors.info}80`
                  }}
                >
                  <p 
                    className="text-xs"
                    style={{ color: `${themeColors.info}CC` }}
                  >
                    {isCashMethod ? (
                      <>💰 <strong>Cash Payment:</strong> Will be added to "Received in Hand". Current balance in hand: ₹{selectedProject.balanceInHand?.toLocaleString('en-IN') || '0'}</>
                    ) : (
                      <>🏦 <strong>Account Payment:</strong> Will be added to "Received in Account". Current balance in account: ₹{selectedProject.balanceInAccount?.toLocaleString('en-IN') || '0'}</>
                    )}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Payment Amount */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Payment Amount (₹) <span style={{ color: themeColors.error }}>*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              required
            />
            {validationError && (
              <div 
                className="mt-2 flex items-center gap-2 text-xs sm:text-sm"
                style={{ color: themeColors.error }}
              >
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{validationError}</span>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Payment Method <span style={{ color: themeColors.error }}>*</span>
            </label>
            <Select
              value={formData.paymentMethod || ''}
              onChange={(e) =>
                setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })
              }
              required
              options={[
                { value: PaymentMethod.CASH, label: 'Cash' },
                { value: PaymentMethod.ACCOUNT_TRANSFER, label: 'Account Transfer' },
                { value: PaymentMethod.UPI, label: 'UPI' },
                { value: PaymentMethod.NEFT, label: 'NEFT' },
                { value: PaymentMethod.RTGS, label: 'RTGS' },
                { value: PaymentMethod.CHEQUE, label: 'Cheque' },
                { value: PaymentMethod.CARD, label: 'Card' },
              ]}
            />
            <p 
              className="mt-1 text-xs"
              style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
            >
              {isCashMethod
                ? 'This will be added to Cash in Hand'
                : 'This will be added to Cash in Account'}
            </p>
          </div>

          {/* Payment Date */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Payment Date <span style={{ color: themeColors.error }}>*</span>
            </label>
            <Input
              type="date"
              value={formData.paymentDate || ''}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Reference Number */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Reference Number {requiresReference && <span style={{ color: themeColors.error }}>*</span>}
            </label>
            <Input
              type="text"
              value={formData.referenceNumber || ''}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder={
                requiresReference
                  ? 'Enter transaction ID / cheque number'
                  : 'Optional reference'
              }
              required={requiresReference}
            />
          </div>

          {/* Notes */}
          <div>
            <label 
              className="block text-xs sm:text-sm font-medium mb-2"
              style={{ color: currentTheme?.colors?.text?.[700] || '#E5E5E5' }}
            >
              Notes (Optional)
            </label>
            <TextArea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleCancel}
            className="w-full sm:w-auto"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !!validationError}
            className="w-full sm:w-auto"
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
            {isLoading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </Card>
    </form>
  );
}

export default PaymentForm;
