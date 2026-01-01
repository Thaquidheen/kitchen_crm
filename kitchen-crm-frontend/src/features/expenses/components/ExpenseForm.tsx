/**
 * ExpenseForm
 * Form for recording project expenses
 */

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateExpenseMutation, useUpdateExpenseMutation } from '@/features/expenses/expensesAPI';
import { useGetActiveVendorsQuery } from '@/features/vendors/vendorsAPI';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import type { Expense, ExpenseCreate } from '@/features/expenses/expensesAPI';
import { useAppSelector } from '@/app/hooks';
import { selectCurrentTheme } from '@/features/theme/themeSlice';

const expenseSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  expenseCategory: z.string().min(1, 'Expense category is required'),
  description: z.string().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  paidBy: z.string().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  expense?: Expense | null;
}

export default function ExpenseForm({ isOpen, onClose, projectId, expense }: ExpenseFormProps) {
  const [createExpense, { isLoading: isCreating }] = useCreateExpenseMutation();
  const [updateExpense, { isLoading: isUpdating }] = useUpdateExpenseMutation();
  const { data: vendors = [], isLoading: vendorsLoading } = useGetActiveVendorsQuery();
  const currentTheme = useAppSelector(selectCurrentTheme);

  // Dynamic colors based on theme
  const themeColors = useMemo(() => {
    if (!currentTheme?.colors) {
      return {
        info: '#3B82F6',
        text: '#FFFFFF',
        background: '#12121A',
      };
    }
    return {
      info: currentTheme.colors.semantic.info,
      text: currentTheme.colors.text[900],
      background: currentTheme.colors.background[800],
    };
  }, [currentTheme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense ? {
      vendorId: expense.vendorId.toString(),
      expenseCategory: expense.expenseCategory,
      description: expense.description || '',
      amount: expense.amount,
      paymentMethod: expense.paymentMethod,
      paymentDate: expense.paymentDate,
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || '',
      paidBy: expense.paidBy || '',
    } : {
      paymentDate: new Date().toISOString().split('T')[0],
      expenseCategory: 'MATERIAL',
      paymentMethod: 'CASH',
    },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const expenseData: ExpenseCreate = {
        projectId,
        vendorId: Number(data.vendorId),
        expenseCategory: data.expenseCategory,
        description: data.description || undefined,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate,
        referenceNumber: data.referenceNumber || undefined,
        notes: data.notes || undefined,
        paidBy: data.paidBy || undefined,
        status: 'PAID',
      };

      if (expense) {
        await updateExpense({ id: expense.id, expense: expenseData }).unwrap();
        toast.success('Expense updated successfully');
      } else {
        await createExpense(expenseData).unwrap();
        toast.success('Expense recorded successfully');
      }

      onClose();
      reset();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error?.data?.message || 'Failed to save expense');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={expense ? 'Edit Expense' : 'Record Expense'}>
      <div 
        className="mb-3 sm:mb-4 p-3 sm:p-4 border rounded-lg"
        style={{
          backgroundColor: `${themeColors.info}33`,
          borderColor: `${themeColors.info}80`
        }}
      >
        <h4 
          className="font-semibold text-xs sm:text-sm mb-2"
          style={{ color: themeColors.info }}
        >
          Recording Project Expense
        </h4>
        <p 
          className="text-xs"
          style={{ color: `${themeColors.info}CC` }}
        >
          This expense will be added to Total Project Expenses.
        </p>
        <p 
          className="text-xs mt-1"
          style={{ color: `${themeColors.info}CC` }}
        >
          <strong>Note:</strong> Vendor payments are tracked separately and do NOT affect customer payment balances.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
        <Select
          label="Vendor *"
          {...register('vendorId')}
          error={errors.vendorId?.message}
          disabled={vendorsLoading}
        >
          <option value="">Select Vendor...</option>
          {vendors.map((vendor) => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.vendorName}
            </option>
          ))}
        </Select>

        <Select
          label="Expense Category *"
          {...register('expenseCategory')}
          error={errors.expenseCategory?.message}
        >
          <option value="MATERIAL">Material</option>
          <option value="LABOR">Labor</option>
          <option value="TRANSPORT">Transport</option>
          <option value="APPLIANCE">Appliance</option>
          <option value="MISCELLANEOUS">Miscellaneous</option>
        </Select>

        <Input
          label="Amount *"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />

        <TextArea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          rows={2}
          placeholder="e.g., Cabinet materials from supplier"
        />

        <Select
          label="Payment Method *"
          {...register('paymentMethod')}
          error={errors.paymentMethod?.message}
        >
          <option value="CASH">Cash</option>
          <option value="ACCOUNT_TRANSFER">Account Transfer</option>
          <option value="UPI">UPI</option>
          <option value="CHEQUE">Cheque</option>
          <option value="NEFT">NEFT</option>
          <option value="RTGS">RTGS</option>
          <option value="CARD">Card</option>
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input
            label="Payment Date *"
            type="date"
            {...register('paymentDate')}
            error={errors.paymentDate?.message}
          />

          <Input
            label="Paid By"
            {...register('paidBy')}
            error={errors.paidBy?.message}
            placeholder="Who made the payment"
          />
        </div>

        <Input
          label="Reference Number"
          {...register('referenceNumber')}
          error={errors.referenceNumber?.message}
        />

        <TextArea
          label="Notes"
          {...register('notes')}
          error={errors.notes?.message}
          rows={2}
        />

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 mt-4 sm:mt-6">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={isCreating || isUpdating}
            className="w-full sm:w-auto"
          >
            {expense ? (isUpdating ? 'Updating...' : 'Update Expense') : (isCreating ? 'Recording...' : 'Record Expense')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}






