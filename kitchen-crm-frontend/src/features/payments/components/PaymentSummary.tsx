/**
 * PaymentSummary Component
 * Displays payment summary for a project
 */

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DollarSign, TrendingUp, CheckCircle, Clock, Plus, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import { useGetPaymentsByProjectQuery } from '../paymentApi';
import { PaymentMethod } from '../types';
import type { Project } from '@/features/projects/types';
import PaymentForm from './PaymentForm';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

export interface PaymentSummaryProps {
  projectId: number;
  project?: Project;
}

export function PaymentSummary({ projectId, project }: PaymentSummaryProps) {
  const { data: payments, isLoading } = useGetPaymentsByProjectQuery(projectId);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        info: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        primary: '#8B5CF6',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      info: currentTheme.colors.semantic.info,
      success: currentTheme.colors.semantic.success,
      warning: currentTheme.colors.semantic.warning,
      primary: currentTheme.colors.primary[500],
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  if (isLoading) {
    return (
      <Card 
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
          borderColor: currentTheme?.colors?.background?.[600] || '#252530'
        }}
      >
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div 
            className="h-5 sm:h-6 w-40 sm:w-48 rounded"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
          />
          <div 
            className="h-3 sm:h-4 w-56 sm:w-64 rounded"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
          />
        </div>
      </Card>
    );
  }

  const paymentsList = payments?.data || [];

  // Calculate summary statistics
  const totalPayments = paymentsList.length;
  const totalAmount = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const cashPayments = paymentsList.filter(p => p.paymentMethod === PaymentMethod.CASH);
  const accountPayments = paymentsList.filter(p => p.paymentMethod !== PaymentMethod.CASH);
  const cashAmount = cashPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const accountAmount = accountPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Group payments by method
  const paymentsByMethod = paymentsList.reduce((acc, payment) => {
    const method = payment.paymentMethod;
    if (!acc[method]) {
      acc[method] = { count: 0, amount: 0 };
    }
    acc[method].count++;
    acc[method].amount += payment.amount || 0;
    return acc;
  }, {} as Record<PaymentMethod, { count: number; amount: number }>);

  // Get financial data from project if available
  const committedInHand = project?.committedInHand || 0;
  const committedInAccount = project?.committedInAccount || 0;
  const receivedInHand = project?.receivedInHand || 0;
  const receivedInAccount = project?.receivedInAccount || 0;
  const balanceInHand = project?.balanceInHand || 0;
  const balanceInAccount = project?.balanceInAccount || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payment Commitment Breakdown */}
      {project && (
        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <h3 
              className="text-base sm:text-lg font-bold flex items-center gap-2"
              style={{ color: themeColors.text }}
            >
              <Wallet 
                className="h-4 w-4 sm:h-5 sm:w-5" 
                style={{ color: themeColors.info }} 
              />
              Payment Commitment
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPaymentModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Record Payment
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div 
              className="p-3 sm:p-4 rounded-lg"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Total Amount
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.text }}
              >
                ₹{project.totalAmount?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.warning}33`,
                borderColor: `${themeColors.warning}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.warning}CC` }}
              >
                Committed in Hand (Cash)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.warning }}
              >
                ₹{committedInHand.toLocaleString('en-IN')}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.primary}33`,
                borderColor: `${themeColors.primary}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.primary}CC` }}
              >
                Committed in Account (Bank)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.primary }}
              >
                ₹{committedInAccount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Received Amounts Breakdown */}
      {project && (
        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <h3 
            className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <CheckCircle 
              className="h-4 w-4 sm:h-5 sm:w-5" 
              style={{ color: themeColors.success }} 
            />
            Payments Received
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div 
              className="p-3 sm:p-4 rounded-lg"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Total Received
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.success }}
              >
                ₹{project.receivedAmountTotal?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.warning}33`,
                borderColor: `${themeColors.warning}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.warning}CC` }}
              >
                Received in Hand (Cash)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.warning }}
              >
                ₹{receivedInHand.toLocaleString('en-IN')}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.primary}33`,
                borderColor: `${themeColors.primary}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.primary}CC` }}
              >
                Received in Account (Bank)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.primary }}
              >
                ₹{receivedInAccount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Balance Breakdown */}
      {project && (
        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <h3 
            className="text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2"
            style={{ color: themeColors.text }}
          >
            <CreditCardIcon 
              className="h-4 w-4 sm:h-5 sm:w-5" 
              style={{ color: '#F97316' }} 
            />
            Balance Due
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div 
              className="p-3 sm:p-4 rounded-lg"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Total Balance
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: '#F97316' }}
              >
                ₹{project.balanceAmount?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.warning}33`,
                borderColor: `${themeColors.warning}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.warning}CC` }}
              >
                Balance in Hand (Cash)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.warning }}
              >
                ₹{balanceInHand.toLocaleString('en-IN')}
              </p>
            </div>
            <div 
              className="p-3 sm:p-4 rounded-lg border"
              style={{
                backgroundColor: `${themeColors.primary}33`,
                borderColor: `${themeColors.primary}80`
              }}
            >
              <p 
                className="text-xs sm:text-sm mb-1"
                style={{ color: `${themeColors.primary}CC` }}
              >
                Balance in Account (Bank)
              </p>
              <p 
                className="text-lg sm:text-xl font-bold"
                style={{ color: themeColors.primary }}
              >
                ₹{balanceInAccount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-xs sm:text-sm"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Total Payments
              </p>
              <p 
                className="text-xl sm:text-2xl font-bold mt-1"
                style={{ color: themeColors.text }}
              >
                {totalPayments}
              </p>
            </div>
            <CheckCircle 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
              style={{ color: themeColors.info }} 
            />
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-xs sm:text-sm"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Total Amount
              </p>
              <p 
                className="text-xl sm:text-2xl font-bold mt-1"
                style={{ color: themeColors.success }}
              >
                ₹{totalAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <DollarSign 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
              style={{ color: themeColors.success }} 
            />
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-xs sm:text-sm"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Cash Payments
              </p>
              <p 
                className="text-xl sm:text-2xl font-bold mt-1"
                style={{ color: themeColors.warning }}
              >
                ₹{cashAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <TrendingUp 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
              style={{ color: themeColors.warning }} 
            />
          </div>
        </Card>

        <Card 
          className="p-4 sm:p-6"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p 
                className="text-xs sm:text-sm"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Account Payments
              </p>
              <p 
                className="text-xl sm:text-2xl font-bold mt-1"
                style={{ color: themeColors.primary }}
              >
                ₹{accountAmount.toLocaleString('en-IN')}
              </p>
            </div>
            <Clock 
              className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0" 
              style={{ color: themeColors.primary }} 
            />
          </div>
        </Card>
      </div>

      {/* Payment Breakdown by Method */}
      <Card 
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
          borderColor: currentTheme?.colors?.background?.[600] || '#252530'
        }}
      >
        <h3 
          className="text-base sm:text-lg font-bold mb-3 sm:mb-4"
          style={{ color: themeColors.text }}
        >
          Payment Breakdown by Method
        </h3>

        {Object.keys(paymentsByMethod).length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {Object.entries(paymentsByMethod).map(([method, data]) => {
              const methodData = data as { count: number; amount: number };
              const getMethodColor = () => {
                switch (method) {
                  case PaymentMethod.CASH:
                    return themeColors.success;
                  case PaymentMethod.UPI:
                    return themeColors.primary;
                  case PaymentMethod.CHEQUE:
                    return themeColors.warning;
                  default:
                    return themeColors.info;
                }
              };
              return (
                <div
                  key={method}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg"
                  style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getMethodColor() }}
                    />
                    <div>
                      <p 
                        className="font-medium text-xs sm:text-sm"
                        style={{ color: themeColors.text }}
                      >
                        {method.replace('_', ' ')}
                      </p>
                      <p 
                        className="text-xs"
                        style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                      >
                        {methodData.count} payment(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p 
                      className="font-bold text-xs sm:text-sm"
                      style={{ color: themeColors.text }}
                    >
                      ₹{methodData.amount.toLocaleString('en-IN')}
                    </p>
                    <p 
                      className="text-xs"
                      style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                    >
                      {totalAmount > 0
                        ? ((methodData.amount / totalAmount) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div 
            className="text-center py-6 sm:py-8 text-xs sm:text-sm"
            style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
          >
            No payments recorded yet
          </div>
        )}
      </Card>

      {/* Recent Payments */}
      <Card 
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
          borderColor: currentTheme?.colors?.background?.[600] || '#252530'
        }}
      >
        <h3 
          className="text-base sm:text-lg font-bold mb-3 sm:mb-4"
          style={{ color: themeColors.text }}
        >
          Recent Payments
        </h3>

        {paymentsList.length > 0 ? (
          <div className="space-y-2">
            {paymentsList.slice(0, 5).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg text-xs sm:text-sm"
                style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
              >
                <div>
                  <p 
                    className="font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                  >
                    {payment.paymentMethod.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p 
                    className="font-bold"
                    style={{ color: themeColors.success }}
                  >
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="text-center py-6 sm:py-8 text-xs sm:text-sm"
            style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
          >
            No payments recorded yet
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: `${currentTheme?.colors?.background?.[900] || '#0A0A0F'}80` }}
        >
          <div 
            className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A' }}
          >
            <PaymentForm
              projectId={projectId}
              onSuccess={() => {
                setIsPaymentModalOpen(false);
                // Refresh payments data
                window.location.reload();
              }}
              onEditProject={() => {
                // Navigate to edit project page
                window.location.href = `/projects/${projectId}/edit`;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentSummary;
