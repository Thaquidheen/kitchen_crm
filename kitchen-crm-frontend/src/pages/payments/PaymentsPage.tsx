/**
 * PaymentsPage
 * Main page for displaying and managing payments
 */

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PaymentList } from '@/features/payments/components/PaymentList';
import { PaymentForm } from '@/features/payments/components/PaymentForm';
import { PaymentStatistics } from '@/features/payments/components/PaymentStatistics';
import { CreditCard, Plus } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

export function PaymentsPage() {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        primary: '#6366F1',
        text: '#FFFFFF',
        background: '#0A0A0F',
      };
    }
    return {
      primary: currentTheme.colors.primary[600],
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[900],
    };
  }, [currentTheme]);

  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
  };

  return (
    <div 
      className="min-h-screen p-4 sm:p-6"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <CreditCard 
              className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" 
              style={{ color: themeColors.primary }} 
            />
            <div>
              <h1 
                className="text-2xl sm:text-3xl font-bold"
                style={{ color: themeColors.text }}
              >
                Payments
              </h1>
              <p 
                className="text-xs sm:text-sm mt-1"
                style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
              >
                Track and manage all payments
              </p>
            </div>
          </div>

          <Button 
            variant="primary" 
            onClick={() => setShowPaymentForm(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>

        {/* Statistics */}
        <PaymentStatistics />
      </div>

      {/* Payment List */}
      <Card 
        className="p-4 sm:p-6"
        style={{
          backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
          borderColor: currentTheme?.colors?.background?.[600] || '#252530'
        }}
      >
        <h2 
          className="text-lg sm:text-xl font-bold mb-4"
          style={{ color: themeColors.text }}
        >
          All Payments
        </h2>
        <PaymentList />
      </Card>

      {/* Payment Form Modal */}
      <Modal
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title="Record New Payment"
      >
        <PaymentForm onSuccess={handlePaymentSuccess} />
      </Modal>
    </div>
  );
}

export default PaymentsPage;
