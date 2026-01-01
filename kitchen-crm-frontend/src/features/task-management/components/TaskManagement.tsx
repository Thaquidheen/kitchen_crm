/**
 * Task Management Main Component
 * Integrates task assignment, my tasks, and admin todos
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/app/store';
import { useGetMyTasksQuery, useGetTasksByDateQuery } from '../taskAPI';
import { useGetStaffQuery } from '@/features/staff/staffAPI';
import { TaskAssignmentForm } from './TaskAssignmentForm';
import { EmployeeTaskCard } from './EmployeeTaskCard';
import { AdminTodoList } from './AdminTodoList';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Calendar, CheckSquare, Users, ClipboardList } from 'lucide-react';
import clsx from 'clsx';

export function TaskManagement() {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.role === 'ROLE_SUPER_ADMIN';

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activeTab, setActiveTab] = useState<'assign' | 'mytasks' | 'todos'>(
    isSuperAdmin ? 'assign' : 'mytasks'
  );

  const { data: myTasks = [], isLoading: isLoadingMyTasks } = useGetMyTasksQuery({
    date: selectedDate,
  });

  const { data: allTasks = [], isLoading: isLoadingAllTasks } = useGetTasksByDateQuery(
    selectedDate,
    { skip: !isSuperAdmin }
  );

  // Fetch staff users from API
  const { data: staffList = [], isLoading: isLoadingStaff } = useGetStaffQuery(undefined, {
    skip: !isSuperAdmin, // Only fetch if super admin
  });

  // Transform staff data to match TaskAssignmentForm expected format
  const staffUsers = staffList
    .filter((staff) => staff.active) // Only show active staff
    .map((staff) => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
    }));

  const tabs = [
    ...(isSuperAdmin
      ? [
          {
            id: 'assign' as const,
            label: 'Assign Tasks',
            icon: <Users className="h-4 w-4" />,
          },
          {
            id: 'todos' as const,
            label: 'My Todos',
            icon: <CheckSquare className="h-4 w-4" />,
          },
        ]
      : []),
    {
      id: 'mytasks' as const,
      label: 'My Tasks',
      icon: <ClipboardList className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-900">Task Management</h2>
          <p className="text-sm text-text-600 mt-1">
            {isSuperAdmin
              ? 'Assign tasks to employees and manage your daily todos'
              : 'View and complete your assigned tasks'}
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-600" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-background-700 border border-background-600 rounded-lg text-text-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-background-600">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-500'
                  : 'border-transparent text-text-600 hover:text-text-900 hover:border-background-500'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'assign' && isSuperAdmin && (
          <div className="space-y-6">
            <Card className="p-6">
              {isLoadingStaff ? (
                <div className="text-text-600">Loading staff members...</div>
              ) : staffUsers.length === 0 ? (
                <div className="text-center py-8 text-text-600">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No active staff members found. Please add staff members first.</p>
                </div>
              ) : (
                <TaskAssignmentForm
                  staffUsers={staffUsers}
                  onSuccess={() => {
                    // Refresh tasks
                  }}
                />
              )}
            </Card>

            <div>
              <h3 className="text-lg font-semibold text-text-900 mb-4">
                Tasks for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              {isLoadingAllTasks ? (
                <div className="text-text-600">Loading tasks...</div>
              ) : allTasks.length === 0 ? (
                <div className="text-center py-8 text-text-600">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks assigned for this date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTasks.map((task) => (
                    <EmployeeTaskCard key={task.id} task={task} showActions={false} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'mytasks' && (
          <div>
            <h3 className="text-lg font-semibold text-text-900 mb-4">
              My Tasks for {new Date(selectedDate).toLocaleDateString()}
            </h3>
            {isLoadingMyTasks ? (
              <div className="text-text-600">Loading tasks...</div>
            ) : myTasks.length === 0 ? (
              <div className="text-center py-8 text-text-600">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No tasks assigned for this date</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task) => (
                  <EmployeeTaskCard key={task.id} task={task} showActions={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'todos' && isSuperAdmin && (
          <Card className="p-6">
            <AdminTodoList selectedDate={selectedDate} />
          </Card>
        )}
      </div>
    </div>
  );
}

