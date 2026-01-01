/**
 * Admin Todo Form Component
 * Allows SUPER_ADMIN to create and manage their personal todos
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import {
  useCreateAdminTodoMutation,
  useUpdateAdminTodoMutation,
  useGetTodoByIdQuery,
} from '../taskAPI';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import type { AdminTodo, AdminTodoCreate, AdminTodoUpdate } from '../types';
import { CheckSquare, X } from 'lucide-react';

const todoSchema = z.object({
  todoTitle: z.string().min(1, 'Todo title is required'),
  todoDescription: z.string().optional(),
  todoDate: z.string().min(1, 'Todo date is required'),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  category: z.string().optional(),
});

type TodoFormValues = z.infer<typeof todoSchema>;

export interface AdminTodoFormProps {
  todoId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdminTodoForm({ todoId, onSuccess, onCancel }: AdminTodoFormProps) {
  const isEdit = typeof todoId === 'number';

  const { data: existingTodo, isLoading: isLoadingTodo } = useGetTodoByIdQuery(todoId!, {
    skip: !isEdit,
  });

  const [createTodo, { isLoading: isCreating }] = useCreateAdminTodoMutation();
  const [updateTodo, { isLoading: isUpdating }] = useUpdateAdminTodoMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TodoFormValues>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      priority: 'MEDIUM',
      todoDate: new Date().toISOString().split('T')[0],
      ...(existingTodo && {
        todoTitle: existingTodo.todoTitle,
        todoDescription: existingTodo.todoDescription,
        todoDate: existingTodo.todoDate,
        notes: existingTodo.notes,
        priority: existingTodo.priority,
        category: existingTodo.category,
      }),
    },
  });

  const onSubmit = async (data: TodoFormValues) => {
    try {
      if (isEdit && todoId) {
        const updateData: AdminTodoUpdate = {
          todoTitle: data.todoTitle,
          todoDescription: data.todoDescription,
          todoDate: data.todoDate,
          notes: data.notes,
          priority: data.priority,
          category: data.category,
        };
        await updateTodo({ todoId, todo: updateData }).unwrap();
        toast.success('Todo updated successfully');
      } else {
        const todoData: AdminTodoCreate = {
          todoTitle: data.todoTitle,
          todoDescription: data.todoDescription,
          todoDate: data.todoDate,
          notes: data.notes,
          priority: data.priority,
          category: data.category,
        };
        await createTodo(todoData).unwrap();
        toast.success('Todo created successfully');
      }
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} todo`);
    }
  };

  if (isEdit && isLoadingTodo) {
    return <div className="text-text-600">Loading...</div>;
  }

  return (
    <div className="bg-background-800 rounded-lg border border-background-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-900 flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          {isEdit ? 'Edit Todo' : 'Create New Todo'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-text-600 hover:text-text-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Todo Title *"
          {...register('todoTitle')}
          error={errors.todoTitle?.message}
          placeholder="Enter todo title"
        />

        <TextArea
          label="Description"
          {...register('todoDescription')}
          error={errors.todoDescription?.message}
          placeholder="Enter description"
          rows={3}
        />

        <div>
          <label className="block text-text-700 text-sm font-medium mb-2">
            Todo Date *
          </label>
          <input
            type="date"
            {...register('todoDate')}
            className="px-4 py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
          {errors.todoDate && (
            <p className="mt-1 text-sm text-error">{errors.todoDate.message}</p>
          )}
        </div>

        <Select
          label="Priority"
          {...register('priority')}
          options={[
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' },
          ]}
        />

        <Input
          label="Category"
          {...register('category')}
          error={errors.category?.message}
          placeholder="e.g., Meetings, Follow-ups, Reviews"
        />

        <TextArea
          label="Notes"
          {...register('notes')}
          error={errors.notes?.message}
          placeholder="Additional notes"
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            isLoading={isCreating || isUpdating}
            fullWidth
          >
            {isEdit ? 'Update Todo' : 'Create Todo'}
          </Button>
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}




