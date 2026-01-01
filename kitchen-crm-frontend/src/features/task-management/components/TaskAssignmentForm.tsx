/**
 * Task Assignment Form Component
 * Allows SUPER_ADMIN to assign tasks to staff members
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { useAssignTaskMutation } from '../taskAPI';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import type { EmployeeTaskCreate, TaskPriority } from '../types';
import { UserPlus, X } from 'lucide-react';

const taskSchema = z.object({
  employeeId: z.number().min(1, 'Please select an employee'),
  taskTitle: z.string().min(1, 'Task title is required'),
  taskDescription: z.string().optional(),
  taskDate: z.string().min(1, 'Task date is required'),
  notes: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export interface TaskAssignmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  // Staff users - TODO: Replace with API call to fetch staff users
  staffUsers?: Array<{ id: number; name: string; email: string }>;
}

export function TaskAssignmentForm({
  onSuccess,
  onCancel,
  staffUsers = [], // Placeholder - will need to fetch from API
}: TaskAssignmentFormProps) {
  const [assignTask, { isLoading }] = useAssignTaskMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'PENDING',
      taskDate: new Date().toISOString().split('T')[0],
    },
  });

  const priority = watch('priority');
  const selectedDate = watch('taskDate');

  const onSubmit = async (data: TaskFormValues) => {
    try {
      const taskData: EmployeeTaskCreate = {
        employeeId: data.employeeId,
        taskTitle: data.taskTitle,
        taskDescription: data.taskDescription,
        taskDate: data.taskDate,
        notes: data.notes,
        priority: data.priority as TaskPriority,
        status: data.status,
      };

      await assignTask(taskData).unwrap();
      toast.success('Task assigned successfully');
      reset();
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to assign task');
    }
  };

  return (
    <div className="bg-background-800 rounded-lg border border-background-600 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-text-900 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Assign Task to Employee
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
        {/* Employee Selection */}
        <div>
          <Select
            label="Select Employee *"
            {...register('employeeId', { valueAsNumber: true })}
            error={errors.employeeId?.message}
            options={staffUsers.map((user) => ({
              value: user.id,
              label: `${user.name} (${user.email})`,
            }))}
            placeholder="Select an employee"
          />
        </div>

        {/* Task Title */}
        <Input
          label="Task Title *"
          {...register('taskTitle')}
          error={errors.taskTitle?.message}
          placeholder="Enter task title"
        />

        {/* Task Description */}
        <TextArea
          label="Task Description"
          {...register('taskDescription')}
          error={errors.taskDescription?.message}
          placeholder="Enter task description"
          rows={3}
        />

        {/* Task Date */}
        <div>
          <label className="block text-text-700 text-sm font-medium mb-2">
            Task Date *
          </label>
          <input
            type="date"
            {...register('taskDate')}
            className="px-4 py-3 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
          />
          {errors.taskDate && (
            <p className="mt-1 text-sm text-error">{errors.taskDate.message}</p>
          )}
        </div>

        {/* Priority */}
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

        {/* Notes */}
        <TextArea
          label="Notes"
          {...register('notes')}
          error={errors.notes?.message}
          placeholder="Additional notes for this task"
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isLoading} fullWidth>
            Assign Task
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




