/**
 * ExpensesList
 * List of expenses for a project
 */

import { useMemo } from 'react';
import { useGetExpensesByProjectQuery, useDeleteExpenseMutation } from '@/features/expenses/expensesAPI';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Expense } from '@/features/expenses/expensesAPI';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

interface ExpensesListProps {
  projectId: number;
  onEdit?: (expense: Expense) => void;
}

export default function ExpensesList({ projectId, onEdit }: ExpensesListProps) {
  const { data: expenses = [], isLoading } = useGetExpensesByProjectQuery(projectId);
  const [deleteExpense] = useDeleteExpenseMutation();
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        info: '#3B82F6',
        error: '#EF4444',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      info: currentTheme.colors.semantic.info,
      error: currentTheme.colors.semantic.error,
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  const handleDelete = async (id: number, description: string) => {
    if (!confirm(`Are you sure you want to delete this expense?`)) return;
    
    try {
      await deleteExpense(id).unwrap();
      toast.success('Expense deleted successfully');
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete expense');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 sm:h-20 rounded animate-pulse"
            style={{ backgroundColor: currentTheme?.colors?.background?.[700] || '#1A1A24' }}
          />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div 
        className="text-center py-6 sm:py-8 text-xs sm:text-sm"
        style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
      >
        <p>No expenses recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {expenses.map((expense: Expense) => (
        <Card 
          key={expense.id} 
          className="p-3 sm:p-4"
          style={{
            backgroundColor: currentTheme?.colors?.background?.[800] || '#12121A',
            borderColor: currentTheme?.colors?.background?.[600] || '#252530'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h4 
                  className="font-semibold text-xs sm:text-sm"
                  style={{ color: themeColors.text }}
                >
                  {expense.vendorName}
                </h4>
                <span 
                  className="px-2 py-1 text-xs rounded flex-shrink-0"
                  style={{
                    backgroundColor: themeColors.info,
                    color: '#FFFFFF'
                  }}
                >
                  {expense.expenseCategory.replace('_', ' ')}
                </span>
              </div>
              {expense.description && (
                <p 
                  className="text-xs sm:text-sm mb-1"
                  style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}
                >
                  {expense.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                <span style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>
                  ₹{expense.amount.toLocaleString('en-IN')}
                </span>
                <span style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>•</span>
                <span style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>
                  {expense.paymentMethod}
                </span>
                <span style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>•</span>
                <span style={{ color: currentTheme?.colors?.text?.[600] || '#D5D5D5' }}>
                  {new Date(expense.paymentDate).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              {onEdit && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={() => onEdit(expense)}
                  className="text-xs sm:text-sm"
                >
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Edit
                </Button>
              )}
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleDelete(expense.id, expense.description || '')}
              >
                <Trash2 
                  className="h-3 w-3 sm:h-4 sm:w-4" 
                  style={{ color: themeColors.error }}
                />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}






