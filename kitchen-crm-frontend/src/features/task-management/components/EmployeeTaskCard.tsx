/**
 * Employee Task Card Component
 * Displays a single task with completion checkbox
 */

import { Check, X, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useMarkTaskCompleteMutation, useMarkTaskIncompleteMutation } from '../taskAPI';
import { toast } from 'react-hot-toast';
import type { EmployeeTask } from '../types';
import clsx from 'clsx';

export interface EmployeeTaskCardProps {
  task: EmployeeTask;
  showActions?: boolean;
  onUpdate?: () => void;
}

export function EmployeeTaskCard({ task, showActions = true, onUpdate }: EmployeeTaskCardProps) {
  const [markComplete, { isLoading: isCompleting }] = useMarkTaskCompleteMutation();
  const [markIncomplete, { isLoading: isIncompleting }] = useMarkTaskIncompleteMutation();

  const priorityColors = {
    LOW: 'bg-background-500',
    MEDIUM: 'bg-warning',
    HIGH: 'bg-warning',
    URGENT: 'bg-error',
  };

  const handleToggleComplete = async () => {
    try {
      if (task.completed) {
        await markIncomplete(task.id).unwrap();
        toast.success('Task marked as incomplete');
      } else {
        await markComplete(task.id).unwrap();
        toast.success('Task marked as complete');
      }
      onUpdate?.();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update task');
    }
  };

  return (
    <div
      className={clsx(
        'bg-background-800 rounded-lg border p-4 transition-all',
        task.completed
          ? 'border-success/50 bg-success/10'
          : 'border-background-600 hover:border-primary-500/50'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        {showActions && (
          <button
            onClick={handleToggleComplete}
            disabled={isCompleting || isIncompleting}
            className={clsx(
              'mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
              task.completed
                ? 'bg-success border-success text-white'
                : 'border-background-500 hover:border-success'
            )}
          >
            {task.completed && <Check className="h-3 w-3" />}
          </button>
        )}

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4
              className={clsx(
                'font-semibold text-text-900',
                task.completed && 'line-through text-text-600'
              )}
            >
              {task.taskTitle}
            </h4>
            <Badge
              className={clsx(priorityColors[task.priority], 'text-xs')}
              variant="solid"
            >
              {task.priority}
            </Badge>
          </div>

          {task.taskDescription && (
            <p className="text-sm text-text-600 mb-2">{task.taskDescription}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-text-600 mb-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(task.taskDate).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {task.assignedToUserName}
            </span>
          </div>

          {task.notes && (
            <div className="mt-2 p-2 bg-background-700 rounded text-xs text-text-600">
              <strong>Notes:</strong> {task.notes}
            </div>
          )}

          {task.completed && task.completedAt && (
            <div className="mt-2 text-xs text-success">
              Completed on {new Date(task.completedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




