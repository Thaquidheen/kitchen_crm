/**
 * PricingPanel Component
 * Input fields for pricing parameters and real-time calculation display
 */

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Calculator, TrendingUp, Percent, DollarSign } from 'lucide-react';

export interface PricingPanelProps {
  subtotal: number;
  transportationPrice: number;
  installationPrice: number;
  marginPercentage: number;
  taxPercentage: number;
  onTransportationChange: (value: number) => void;
  onInstallationChange: (value: number) => void;
  onMarginChange: (value: number) => void;
  onTaxChange: (value: number) => void;
}

export function PricingPanel({
  subtotal,
  transportationPrice,
  installationPrice,
  marginPercentage,
  taxPercentage,
  onTransportationChange,
  onInstallationChange,
  onMarginChange,
  onTaxChange,
}: PricingPanelProps) {
  // Real-time calculations
  const calculations = useMemo(() => {
    // Base total = product subtotal + transportation + installation
    const baseTotal = subtotal + transportationPrice + installationPrice;

    // Margin amount
    const marginAmount = (baseTotal * marginPercentage) / 100;

    // Total before tax
    const totalBeforeTax = baseTotal + marginAmount;

    // Tax amount
    const taxAmount = (totalBeforeTax * taxPercentage) / 100;

    // Grand total
    const grandTotal = totalBeforeTax + taxAmount;

    return {
      baseTotal,
      marginAmount,
      totalBeforeTax,
      taxAmount,
      grandTotal,
    };
  }, [subtotal, transportationPrice, installationPrice, marginPercentage, taxPercentage]);

  const handleNumberInput = (value: string, onChange: (val: number) => void) => {
    const numValue = parseFloat(value) || 0;
    onChange(Math.max(0, numValue));
  };

  return (
    <Card className="p-4 sm:p-6 bg-background-800 border-background-600">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
        <h3 className="text-base sm:text-lg font-bold text-text-900">Pricing & Calculations</h3>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Input Section */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-xs sm:text-sm font-semibold text-text-800">Additional Costs</h4>

          {/* Transportation Cost */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
              Transportation Cost (₹)
            </label>
            <Input
              type="number"
              min="0"
              step="100"
              value={transportationPrice}
              onChange={(e) => handleNumberInput(e.target.value, onTransportationChange)}
              placeholder="0"
            />
          </div>

          {/* Installation Cost */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
              Installation Cost (₹)
            </label>
            <Input
              type="number"
              min="0"
              step="100"
              value={installationPrice}
              onChange={(e) => handleNumberInput(e.target.value, onInstallationChange)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="border-t border-background-600 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          <h4 className="text-xs sm:text-sm font-semibold text-text-800">Margin & Tax</h4>

          {/* Margin Percentage */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
              Margin Percentage (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={marginPercentage}
                onChange={(e) => handleNumberInput(e.target.value, onMarginChange)}
                placeholder="0"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-text-600" />
            </div>
          </div>

          {/* Tax Percentage */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-text-700 mb-2">
              Tax Percentage (%)
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxPercentage}
                onChange={(e) => handleNumberInput(e.target.value, onTaxChange)}
                placeholder="0"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-text-600" />
            </div>
          </div>
        </div>

        {/* Calculations Display */}
        <div className="border-t border-background-600 pt-3 sm:pt-4 space-y-2 sm:space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold text-text-800 mb-2 sm:mb-3">Breakdown</h4>

          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Products Subtotal</span>
              <span className="font-medium text-text-900">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Transportation</span>
              <span className="font-medium text-text-900">
                ₹{transportationPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">Installation</span>
              <span className="font-medium text-text-900">
                ₹{installationPrice.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm border-t border-background-700 pt-2">
              <span className="text-text-800 font-medium">Base Total</span>
              <span className="font-semibold text-text-900">
                ₹{calculations.baseTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">
                Margin ({marginPercentage}%)
              </span>
              <span className="font-medium text-success">
                +₹{calculations.marginAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm border-t border-background-700 pt-2">
              <span className="text-text-800 font-medium">Total Before Tax</span>
              <span className="font-semibold text-text-900">
                ₹{calculations.totalBeforeTax.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-text-700">
                Tax ({taxPercentage}%)
              </span>
              <span className="font-medium text-warning">
                +₹{calculations.taxAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="border-t-2 border-primary-700 pt-2 sm:pt-3 mt-2 sm:mt-3">
            <div className="flex justify-between items-center">
              <span className="text-base sm:text-lg font-bold text-text-900">Grand Total</span>
              <span className="text-xl sm:text-2xl font-bold text-primary-600">
                ₹{calculations.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PricingPanel;
