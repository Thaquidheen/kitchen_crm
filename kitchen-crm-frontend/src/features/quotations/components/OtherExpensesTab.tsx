/**
 * OtherExpensesTab Component
 * Tab content for managing other expenses (Transportation, Installation, custom items)
 */

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Truck, Wrench, Receipt } from 'lucide-react';
import type { QuotationOtherExpense } from '../types';

export interface OtherExpensesTabProps {
  expenses: QuotationOtherExpense[];
  onChange: (expenses: QuotationOtherExpense[]) => void;
}

export function OtherExpensesTab({
  expenses,
  onChange,
}: OtherExpensesTabProps) {
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

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
    if (lower.includes('transport')) return <Truck className="h-4 w-4 text-text-600" />;
    if (lower.includes('install')) return <Wrench className="h-4 w-4 text-text-600" />;
    return <Receipt className="h-4 w-4 text-text-600" />;
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-600">
        Add transportation, installation, and other custom expense items.
      </p>

      {/* Existing items */}
      <div className="space-y-2">
        {expenses.map((expense, index) => (
          <div
            key={`${expense.name}-${index}`}
            className="flex items-center gap-3 p-3 bg-background-800 border border-background-600 rounded-xl"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-700 border border-background-600 flex-shrink-0">
              {getIcon(expense.name)}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-medium text-text-900">{expense.name}</span>
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
              <button
                type="button"
                onClick={() => handleRemove(index)}
                title="Remove"
                className="flex h-7 w-7 items-center justify-center rounded-md text-text-600 hover:text-error hover:bg-error/10 transition-colors flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add custom item */}
      <div className="border-t border-background-600 pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-600 mb-2">Add Custom Item</h4>
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

    </div>
  );
}

export default OtherExpensesTab;
