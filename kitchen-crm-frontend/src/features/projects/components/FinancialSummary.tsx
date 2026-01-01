/**
 * FinancialSummary Component
 * Displays financial breakdown for a project
 */

import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';
import { Card } from '@/components/ui/Card';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import type { Project } from '../types';

export interface FinancialSummaryProps {
  project: Project;
}

export function FinancialSummary({ project }: FinancialSummaryProps) {
  const currentTheme = useAppSelector(selectCurrentTheme);
  const paymentCompletionPercentage =
    project.totalAmount > 0
      ? ((project.receivedAmountTotal / project.totalAmount) * 100).toFixed(2)
      : 0;

  const profit = project.receivedAmountTotal - project.totalExpense;
  const profitPercentage =
    project.receivedAmountTotal > 0
      ? ((profit / project.receivedAmountTotal) * 100).toFixed(2)
      : 0;

  // For old projects that don't have the new fields, use fallback values
  const committedInHand = project.committedInHand ?? 0;
  const committedInAccount = project.committedInAccount ?? 0;
  const receivedInHand = project.receivedInHand ?? 0;
  const receivedInAccount = project.receivedInAccount ?? 0;
  const balanceInHand = project.balanceInHand ?? (committedInHand - receivedInHand);
  const balanceInAccount = project.balanceInAccount ?? (committedInAccount - receivedInAccount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card
          className="p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Total Amount
              </p>
              <p
                className="text-lg sm:text-2xl font-bold mt-1 break-words"
                style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
              >
                ₹{project.totalAmount?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <DollarSign
              className="h-8 w-8 sm:h-10 sm:w-10 ml-3 flex-shrink-0"
              style={{ color: currentTheme?.colors?.primary?.[600] || '#3b82f6' }}
            />
          </div>
        </Card>

        <Card
          className="p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Received
              </p>
              <p
                className="text-lg sm:text-2xl font-bold mt-1 break-words"
                style={{ color: currentTheme?.colors?.accent?.[500] || '#10b981' }}
              >
                ₹{project.receivedAmountTotal?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <TrendingUp
              className="h-8 w-8 sm:h-10 sm:w-10 ml-3 flex-shrink-0"
              style={{ color: currentTheme?.colors?.accent?.[500] || '#10b981' }}
            />
          </div>
        </Card>

        <Card
          className="p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Balance
              </p>
              <p
                className="text-lg sm:text-2xl font-bold mt-1 break-words"
                style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
              >
                ₹{project.balanceAmount?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <TrendingDown
              className="h-8 w-8 sm:h-10 sm:w-10 ml-3 flex-shrink-0"
              style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
            />
          </div>
        </Card>

        <Card
          className="p-4 sm:p-6 transition-all hover:scale-[1.02] hover:shadow-lg"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
            borderColor: currentTheme?.colors?.background?.[600] || '#374151'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p
                className="text-xs sm:text-sm font-medium"
                style={{ color: currentTheme?.colors?.text?.[600] || '#9ca3af' }}
              >
                Expenses
              </p>
              <p
                className="text-lg sm:text-2xl font-bold mt-1 break-words"
                style={{ color: currentTheme?.colors?.error || '#dc2626' }}
              >
                ₹{project.totalExpense?.toLocaleString('en-IN') || '0'}
              </p>
            </div>
            <CreditCard
              className="h-8 w-8 sm:h-10 sm:w-10 ml-3 flex-shrink-0"
              style={{ color: currentTheme?.colors?.error || '#dc2626' }}
            />
          </div>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#1f2937',
          borderColor: currentTheme?.colors?.background?.[600] || '#374151'
        }}
      >
        <h3
          className="text-base sm:text-lg font-bold mb-4"
          style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
        >
          Financial Breakdown
        </h3>

        <div className="space-y-4 sm:space-y-6">
          {/* Revenue Section */}
          <div>
            <h4
              className="text-sm font-semibold mb-3"
              style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
            >
              Revenue
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                  Project Value (incl. Tax)
                </span>
                <span
                  className="font-medium break-words"
                  style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                >
                  ₹{project.totalAmount?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                  Total Tax Amount
                </span>
                <span
                  className="font-medium break-words"
                  style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                >
                  ₹{project.totalTaxAmount?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Commitment Section */}
          {(committedInHand > 0 || committedInAccount > 0) && (
            <div
              className="pt-4"
              style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
            >
              <h4
                className="text-sm font-semibold mb-3"
                style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
              >
                Payment Commitment
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Committed in Hand (Cash)
                  </span>
                  <span
                    className="font-medium break-words"
                    style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                  >
                    ₹{committedInHand.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Committed in Account (Bank)
                  </span>
                  <span
                    className="font-medium break-words"
                    style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                  >
                    ₹{committedInAccount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payments Received Section */}
          <div
            className="pt-4"
            style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
          >
            <h4
              className="text-sm font-semibold mb-3"
              style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
            >
              Payments Received
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wallet
                    className="h-4 w-4"
                    style={{ color: currentTheme?.colors?.accent?.[500] || '#10b981' }}
                  />
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Received in Hand (Cash)
                  </span>
                </div>
                <span
                  className="font-medium break-words"
                  style={{ color: currentTheme?.colors?.accent?.[500] || '#10b981' }}
                >
                  ₹{receivedInHand.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CreditCard
                    className="h-4 w-4"
                    style={{ color: currentTheme?.colors?.primary?.[600] || '#3b82f6' }}
                  />
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Received in Account (Bank)
                  </span>
                </div>
                <span
                  className="font-medium break-words"
                  style={{ color: currentTheme?.colors?.primary?.[600] || '#3b82f6' }}
                >
                  ₹{receivedInAccount.toLocaleString('en-IN')}
                </span>
              </div>
              <div
                className="flex justify-between text-sm pt-2"
                style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[700] || '#4b5563'}` }}
              >
                <span
                  className="font-medium"
                  style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
                >
                  Total Received
                </span>
                <span
                  className="font-bold break-words"
                  style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
                >
                  ₹{project.receivedAmountTotal?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Due Section */}
          {(balanceInHand > 0 || balanceInAccount > 0) && (
            <div
              className="pt-4"
              style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
            >
              <h4
                className="text-sm font-semibold mb-3"
                style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
              >
                Balance Due
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Balance in Hand (Cash)
                  </span>
                  <span
                    className="font-medium break-words"
                    style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
                  >
                    ₹{balanceInHand.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                    Balance in Account (Bank)
                  </span>
                  <span
                    className="font-medium break-words"
                    style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
                  >
                    ₹{balanceInAccount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Progress */}
          <div
            className="pt-4"
            style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
          >
            <div className="flex justify-between text-sm mb-2">
              <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                Payment Completion
              </span>
              <span
                className="font-semibold"
                style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
              >
                {paymentCompletionPercentage}%
              </span>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#374151' }}
            >
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(Number(paymentCompletionPercentage), 100)}%`,
                  background: `linear-gradient(to right, ${currentTheme?.colors?.accent?.[500] || '#10b981'}, ${currentTheme?.colors?.accent?.[600] || '#059669'})`
                }}
              />
            </div>
          </div>

          {/* Expenses & Profit */}
          <div
            className="pt-4"
            style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[600] || '#374151'}` }}
          >
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: currentTheme?.colors?.text?.[700] || '#d1d5db' }}>
                  Total Expenses
                </span>
                <span
                  className="font-medium break-words"
                  style={{ color: currentTheme?.colors?.error || '#dc2626' }}
                >
                  -₹{project.totalExpense?.toLocaleString('en-IN') || '0'}
                </span>
              </div>
              <div
                className="flex justify-between text-sm pt-2"
                style={{ borderTop: `1px solid ${currentTheme?.colors?.background?.[700] || '#4b5563'}` }}
              >
                <span
                  className="font-semibold"
                  style={{ color: currentTheme?.colors?.text?.[800] || '#e5e7eb' }}
                >
                  Current Profit
                </span>
                <span
                  className={`font-bold break-words ${profit >= 0 ? 'text-green-500' : 'text-red-600'}`}
                  style={{ color: profit >= 0 ? (currentTheme?.colors?.accent?.[500] || '#10b981') : (currentTheme?.colors?.error || '#dc2626') }}
                >
                  {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN')}
                  <span className="text-xs ml-2">({profitPercentage}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Outstanding Balance */}
          <div
            className="pt-4"
            style={{
              borderTop: `2px solid ${currentTheme?.colors?.error || '#dc2626'}`
            }}
          >
            <div className="flex justify-between items-center">
              <span
                className="text-base sm:text-lg font-bold"
                style={{ color: currentTheme?.colors?.text?.[900] || '#ffffff' }}
              >
                Outstanding Balance
              </span>
              <span
                className="text-xl sm:text-2xl font-bold break-words"
                style={{ color: currentTheme?.colors?.warning || '#f59e0b' }}
              >
                ₹{project.balanceAmount?.toLocaleString('en-IN') || '0'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FinancialSummary;
