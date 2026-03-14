/**
 * OtherExpensesTab Component
 * Tab content for managing other expenses (Transportation, Installation, custom items)
 */

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Truck, Wrench, Receipt, Percent } from 'lucide-react';
import type { QuotationOtherExpense } from '../types';

export interface OtherExpensesTabProps {
  expenses: QuotationOtherExpense[];
  onChange: (expenses: QuotationOtherExpense[]) => void;
  marginPercentage: number;
  taxPercentage: number;
  onMarginChange: (value: number) => void;
  onTaxChange: (value: number) => void;
}

export function OtherExpensesTab({
  expenses,
  onChange,
  marginPercentage,
  taxPercentage,
  onMarginChange,
  onTaxChange,
}: OtherExpensesTabProps) {
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [marginStr, setMarginStr] = useState(String(marginPercentage || ''));
  const [taxStr, setTaxStr] = useState(String(taxPercentage || ''));

  const handleAmountChange = (index: number, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (isNaN(num)) return;
    const updated = [...expenses];
    updated[index] = { ...updated[index], amount: Math.max(0, num) };
    onChange(updated);
  };

  const handleAddCustom = () => {
    const name = newName.trim();
    if (!name) return;
    const amount = newAmount === '' ? 0 : parseFloat(newAmount);
    if (isNaN(amount)) return;
    onChange([...expenses, { name, amount: Math.max(0, amount), isDefault: false }]);
    setNewName('');
    setNewAmount('');
  };

  const handleRemove = (index: number) => {
    onChange(expenses.filter((_, i) => i !== index));
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('transport')) return <Truck className="h-4 w-4 text-orange-500" />;
    if (lower.includes('install')) return <Wrench className="h-4 w-4 text-teal-500" />;
    return <Receipt className="h-4 w-4 text-text-600" />;
  };

  const handleMarginInput = (value: string) => {
    setMarginStr(value);
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) onMarginChange(Math.max(0, Math.min(num, 100)));
  };

  const handleTaxInput = (value: string) => {
    setTaxStr(value);
    const num = value === '' ? 0 : parseFloat(value);
    if (!isNaN(num)) onTaxChange(Math.max(0, Math.min(num, 100)));
  };

  const totals = useMemo(() => {
    const baseTotal = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const marginAmount = (baseTotal * marginPercentage) / 100;
    const withMargin = baseTotal + marginAmount;
    const taxAmount = (withMargin * taxPercentage) / 100;
    const finalTotal = withMargin + taxAmount;
    return { baseTotal, marginAmount, taxAmount, finalTotal };
  }, [expenses, marginPercentage, taxPercentage]);

  return (
    <div className="p-4 space-y-4">
      <p className="text-xs text-text-600">
        Add transportation, installation, and other custom expense items.
      </p>

      {/* Existing items */}
      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <div
            key={`${expense.name}-${index}`}
            className="flex items-center gap-3 p-3 bg-background-700/50 border border-background-600 rounded-lg"
          >
            <div className="p-1.5 rounded-lg bg-background-600/50">
              {getIcon(expense.name)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-text-800">{expense.name}</span>
            </div>
            <div className="w-32 sm:w-40">
              <Input
                type="text"
                inputMode="decimal"
                value={expense.amount || ''}
                onChange={(e) => handleAmountChange(index, e.target.value)}
                placeholder="0"
                className="text-sm"
              />
            </div>
            {!expense.isDefault && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(index)}
                className="text-error hover:text-error flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add custom item */}
      <div className="border-t border-background-600 pt-4">
        <h4 className="text-xs font-semibold text-text-700 mb-2">Add Custom Item</h4>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Item name"
              className="text-sm"
            />
          </div>
          <div className="w-28 sm:w-36">
            <Input
              type="text"
              inputMode="decimal"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount"
              className="text-sm"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleAddCustom}
            disabled={!newName.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Margin & Tax */}
      {expenses.length > 0 && (
        <div className="border-t border-background-600 pt-4 space-y-3">
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-text-700">Subtotal</span>
            <span className="font-medium text-text-900">₹{totals.baseTotal.toLocaleString('en-IN')}</span>
          </div>

          {/* Margin Input */}
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Margin (%)</label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={marginStr}
                onChange={(e) => handleMarginInput(e.target.value)}
                placeholder="0"
                className="text-xs sm:text-sm"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-600" />
            </div>
            {totals.marginAmount > 0 && (
              <p className="text-xs text-info mt-1 font-medium">
                ₹{totals.marginAmount.toLocaleString('en-IN')} margin added
              </p>
            )}
          </div>

          {/* Tax Input */}
          <div>
            <label className="block text-xs font-medium text-text-700 mb-1">Tax (%)</label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={taxStr}
                onChange={(e) => handleTaxInput(e.target.value)}
                placeholder="0"
                className="text-xs sm:text-sm"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-text-600" />
            </div>
          </div>

          {/* Final Total */}
          <div className="border-t border-background-600 pt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-text-700">Total Other Expenses</span>
            <span className="text-sm font-bold text-primary-400">
              ₹{totals.finalTotal.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtherExpensesTab;
