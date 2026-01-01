/**
 * Admin Todo List Component
 * Displays and manages admin todos
 */

import { useState } from 'react';
import { useGetTodosByDateQuery, useMarkTodoCompleteMutation, useMarkTodoIncompleteMutation, useDeleteAdminTodoMutation } from '../taskAPI';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AdminTodoForm } from './AdminTodoForm';
import { toast } from 'react-hot-toast';
import { CheckSquare, Plus, Calendar, X } from 'lucide-react';
import clsx from 'clsx';
import type { AdminTodo } from '../types';

export interface AdminTodoListProps {
  selectedDate?: string;
}

export function AdminTodoList({ selectedDate }: AdminTodoListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState<number | undefined>();

  const dateToUse = selectedDate || new Date().toISOString().split('T')[0];
  const { data: todos = [], isLoading, refetch } = useGetTodosByDateQuery(dateToUse);

  const [markComplete, { isLoading: isCompleting }] = useMarkTodoCompleteMutation();
  const [markIncomplete, { isLoading: isIncompleting }] = useMarkTodoIncompleteMutation();
  const [deleteTodo, { isLoading: isDeleting }] = useDeleteAdminTodoMutation();

  const priorityColors = {
    LOW: 'bg-background-500',
    MEDIUM: 'bg-warning',
    HIGH: 'bg-warning',
    URGENT: 'bg-error',
  };

  const handleToggleComplete = async (todoId: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await markIncomplete(todoId).unwrap();
        toast.success('Todo marked as incomplete');
      } else {
        await markComplete(todoId).unwrap();
        toast.success('Todo marked as complete');
      }
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to update todo');
    }
  };

  const handleDelete = async (todoId: number) => {
    if (!confirm('Are you sure you want to delete this todo?')) return;
    try {
      await deleteTodo(todoId).unwrap();
      toast.success('Todo deleted successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to delete todo');
    }
  };

  if (isLoading) {
    return <div className="text-text-600">Loading todos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-primary-500" />
          <h3 className="text-lg font-semibold text-text-900">My Todos</h3>
          <span className="text-sm text-text-600">
            ({new Date(dateToUse).toLocaleDateString()})
          </span>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'New Todo'}
        </Button>
      </div>

      {showForm && (
        <AdminTodoForm
          todoId={editingTodo}
          onSuccess={() => {
            setShowForm(false);
            setEditingTodo(undefined);
            refetch();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingTodo(undefined);
          }}
        />
      )}

      {todos.length === 0 ? (
        <div className="text-center py-8 text-text-600">
          <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No todos for this date. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map((todo: AdminTodo) => (
            <div
              key={todo.id}
              className={clsx(
                'bg-background-800 rounded-lg border p-4 transition-all',
                todo.completed
                  ? 'border-success/50 bg-success/10'
                  : 'border-background-600 hover:border-primary-500/50'
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleComplete(todo.id, todo.completed)}
                  disabled={isCompleting || isIncompleting}
                  className={clsx(
                    'mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                    todo.completed
                      ? 'bg-success border-success text-white'
                      : 'border-background-500 hover:border-success'
                  )}
                >
                  {todo.completed && <CheckSquare className="h-3 w-3" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4
                      className={clsx(
                        'font-semibold text-text-900',
                        todo.completed && 'line-through text-text-600'
                      )}
                    >
                      {todo.todoTitle}
                    </h4>
                    <Badge
                      className={clsx(priorityColors[todo.priority], 'text-xs')}
                      variant="solid"
                    >
                      {todo.priority}
                    </Badge>
                  </div>

                  {todo.todoDescription && (
                    <p className="text-sm text-text-600 mb-2">{todo.todoDescription}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-text-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(todo.todoDate).toLocaleDateString()}
                    </span>
                    {todo.category && (
                      <span className="px-2 py-0.5 bg-background-700 rounded text-xs">
                        {todo.category}
                      </span>
                    )}
                  </div>

                  {todo.notes && (
                    <div className="mt-2 p-2 bg-background-700 rounded text-xs text-text-600">
                      <strong>Notes:</strong> {todo.notes}
                    </div>
                  )}

                  {todo.completed && todo.completedAt && (
                    <div className="mt-2 text-xs text-success">
                      Completed on {new Date(todo.completedAt).toLocaleString()}
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTodo(todo.id);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(todo.id)}
                      disabled={isDeleting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




