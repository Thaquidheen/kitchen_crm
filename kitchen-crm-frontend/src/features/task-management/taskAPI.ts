/**
 * Task Management API - RTK Query endpoints
 * Handles all task assignment and admin todo operations
 */

import { baseApi } from '../../app/baseApi';
import type {
  EmployeeTask,
  EmployeeTaskCreate,
  EmployeeTaskUpdate,
  AdminTodo,
  AdminTodoCreate,
  AdminTodoUpdate,
  TaskCompletionStats,
} from './types';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const taskAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============ Employee Tasks ============

    // Assign task to employee (SUPER_ADMIN only)
    assignTask: builder.mutation<EmployeeTask, EmployeeTaskCreate>({
      query: (body) => ({
        url: '/tasks/employee/assign',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Tasks', { type: 'Tasks', id: 'LIST' }],
      transformResponse: (response: ApiResponse<EmployeeTask>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to assign task');
      },
    }),

    // Get tasks by employee
    getTasksByEmployee: builder.query<EmployeeTask[], { employeeId: number; date?: string }>({
      query: ({ employeeId, date }) => {
        const params = date ? `?date=${date}` : '';
        return `/tasks/employee/employee/${employeeId}${params}`;
      },
      providesTags: (result, error, { employeeId }) => [
        { type: 'Tasks', id: `employee-${employeeId}` },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask[]>) => response.data ?? [],
    }),

    // Get tasks by date (admin view)
    getTasksByDate: builder.query<EmployeeTask[], string>({
      query: (date) => `/tasks/employee/date/${date}`,
      providesTags: (result, error, date) => [
        { type: 'Tasks', id: `date-${date}` },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask[]>) => response.data ?? [],
    }),

    // Get tasks by employee and date
    getTasksByEmployeeAndDate: builder.query<EmployeeTask[], { employeeId: number; date: string }>({
      query: ({ employeeId, date }) => `/tasks/employee/employee/${employeeId}/date/${date}`,
      providesTags: (result, error, { employeeId, date }) => [
        { type: 'Tasks', id: `employee-${employeeId}-date-${date}` },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask[]>) => response.data ?? [],
    }),

    // Get tasks by employee and date range
    getTasksByEmployeeAndDateRange: builder.query<
      EmployeeTask[],
      { employeeId: number; fromDate: string; toDate: string }
    >({
      query: ({ employeeId, fromDate, toDate }) =>
        `/tasks/employee/employee/${employeeId}/date-range?fromDate=${fromDate}&toDate=${toDate}`,
      providesTags: (result, error, { employeeId }) => [
        { type: 'Tasks', id: `employee-${employeeId}` },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask[]>) => response.data ?? [],
    }),

    // Get current user's tasks (STAFF)
    getMyTasks: builder.query<EmployeeTask[], { date?: string }>({
      query: ({ date }) => {
        const params = date ? `?date=${date}` : '';
        return `/tasks/employee/my-tasks${params}`;
      },
      providesTags: [{ type: 'Tasks', id: 'MY_TASKS' }, 'Tasks'],
      transformResponse: (response: ApiResponse<EmployeeTask[]>) => response.data ?? [],
    }),

    // Mark task as complete
    markTaskComplete: builder.mutation<EmployeeTask, number>({
      query: (taskId) => ({
        url: `/tasks/employee/${taskId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: 'Tasks', id: taskId },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Tasks', id: 'MY_TASKS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark task as complete');
      },
    }),

    // Mark task as incomplete
    markTaskIncomplete: builder.mutation<EmployeeTask, number>({
      query: (taskId) => ({
        url: `/tasks/employee/${taskId}/incomplete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: 'Tasks', id: taskId },
        { type: 'Tasks', id: 'LIST' },
        { type: 'Tasks', id: 'MY_TASKS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark task as incomplete');
      },
    }),

    // Update task (SUPER_ADMIN only)
    updateTask: builder.mutation<EmployeeTask, { taskId: number; task: EmployeeTaskUpdate }>({
      query: ({ taskId, task }) => ({
        url: `/tasks/employee/${taskId}`,
        method: 'PUT',
        body: task,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: 'Tasks', id: taskId },
        { type: 'Tasks', id: 'LIST' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<EmployeeTask>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update task');
      },
    }),

    // Delete task (SUPER_ADMIN only)
    deleteTask: builder.mutation<void, number>({
      query: (taskId) => ({
        url: `/tasks/employee/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'LIST' }, 'Tasks'],
      transformResponse: (response: ApiResponse<string>) => {
        if (response.success) {
          return;
        }
        throw new Error(response.message || 'Failed to delete task');
      },
    }),

    // Get task by ID
    getTaskById: builder.query<EmployeeTask, number>({
      query: (taskId) => `/tasks/employee/${taskId}`,
      providesTags: (result, error, taskId) => [{ type: 'Tasks', id: taskId }, 'Tasks'],
      transformResponse: (response: ApiResponse<EmployeeTask>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Task not found');
      },
    }),

    // Get completion statistics (SUPER_ADMIN only)
    getTaskCompletionStats: builder.query<
      TaskCompletionStats,
      { fromDate: string; toDate: string }
    >({
      query: ({ fromDate, toDate }) =>
        `/tasks/employee/stats?fromDate=${fromDate}&toDate=${toDate}`,
      providesTags: ['Tasks'],
      transformResponse: (response: ApiResponse<TaskCompletionStats>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Failed to fetch statistics');
      },
    }),

    // ============ Admin Todos ============

    // Create admin todo (SUPER_ADMIN only)
    createAdminTodo: builder.mutation<AdminTodo, AdminTodoCreate>({
      query: (body) => ({
        url: '/tasks/admin-todo/create',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'ADMIN_TODOS' }, 'Tasks'],
      transformResponse: (response: ApiResponse<AdminTodo>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to create todo');
      },
    }),

    // Get todos by date (SUPER_ADMIN only)
    getTodosByDate: builder.query<AdminTodo[], string>({
      query: (date) => `/tasks/admin-todo/date/${date}`,
      providesTags: (result, error, date) => [
        { type: 'Tasks', id: `todos-date-${date}` },
        { type: 'Tasks', id: 'ADMIN_TODOS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<AdminTodo[]>) => response.data ?? [],
    }),

    // Get todos by date range (SUPER_ADMIN only)
    getTodosByDateRange: builder.query<
      AdminTodo[],
      { fromDate: string; toDate: string }
    >({
      query: ({ fromDate, toDate }) =>
        `/tasks/admin-todo/date-range?fromDate=${fromDate}&toDate=${toDate}`,
      providesTags: [{ type: 'Tasks', id: 'ADMIN_TODOS' }, 'Tasks'],
      transformResponse: (response: ApiResponse<AdminTodo[]>) => response.data ?? [],
    }),

    // Get all todos for current user (SUPER_ADMIN only)
    getMyTodos: builder.query<AdminTodo[], void>({
      query: () => '/tasks/admin-todo',
      providesTags: [{ type: 'Tasks', id: 'ADMIN_TODOS' }, 'Tasks'],
      transformResponse: (response: ApiResponse<AdminTodo[]>) => response.data ?? [],
    }),

    // Mark todo as complete
    markTodoComplete: builder.mutation<AdminTodo, number>({
      query: (todoId) => ({
        url: `/tasks/admin-todo/${todoId}/complete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, todoId) => [
        { type: 'Tasks', id: `todo-${todoId}` },
        { type: 'Tasks', id: 'ADMIN_TODOS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<AdminTodo>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark todo as complete');
      },
    }),

    // Mark todo as incomplete
    markTodoIncomplete: builder.mutation<AdminTodo, number>({
      query: (todoId) => ({
        url: `/tasks/admin-todo/${todoId}/incomplete`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, todoId) => [
        { type: 'Tasks', id: `todo-${todoId}` },
        { type: 'Tasks', id: 'ADMIN_TODOS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<AdminTodo>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to mark todo as incomplete');
      },
    }),

    // Update todo (SUPER_ADMIN only)
    updateAdminTodo: builder.mutation<AdminTodo, { todoId: number; todo: AdminTodoUpdate }>({
      query: ({ todoId, todo }) => ({
        url: `/tasks/admin-todo/${todoId}`,
        method: 'PUT',
        body: todo,
      }),
      invalidatesTags: (result, error, { todoId }) => [
        { type: 'Tasks', id: `todo-${todoId}` },
        { type: 'Tasks', id: 'ADMIN_TODOS' },
        'Tasks',
      ],
      transformResponse: (response: ApiResponse<AdminTodo>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.message || 'Failed to update todo');
      },
    }),

    // Delete todo (SUPER_ADMIN only)
    deleteAdminTodo: builder.mutation<void, number>({
      query: (todoId) => ({
        url: `/tasks/admin-todo/${todoId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Tasks', id: 'ADMIN_TODOS' }, 'Tasks'],
      transformResponse: (response: ApiResponse<string>) => {
        if (response.success) {
          return;
        }
        throw new Error(response.message || 'Failed to delete todo');
      },
    }),

    // Get todo by ID
    getTodoById: builder.query<AdminTodo, number>({
      query: (todoId) => `/tasks/admin-todo/${todoId}`,
      providesTags: (result, error, todoId) => [{ type: 'Tasks', id: `todo-${todoId}` }, 'Tasks'],
      transformResponse: (response: ApiResponse<AdminTodo>) => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error('Todo not found');
      },
    }),
  }),
  overrideExisting: false,
});

// Export hooks for usage in components
export const {
  useAssignTaskMutation,
  useGetTasksByEmployeeQuery,
  useGetTasksByDateQuery,
  useGetTasksByEmployeeAndDateQuery,
  useGetTasksByEmployeeAndDateRangeQuery,
  useGetMyTasksQuery,
  useMarkTaskCompleteMutation,
  useMarkTaskIncompleteMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetTaskByIdQuery,
  useGetTaskCompletionStatsQuery,
  useCreateAdminTodoMutation,
  useGetTodosByDateQuery,
  useGetTodosByDateRangeQuery,
  useGetMyTodosQuery,
  useMarkTodoCompleteMutation,
  useMarkTodoIncompleteMutation,
  useUpdateAdminTodoMutation,
  useDeleteAdminTodoMutation,
  useGetTodoByIdQuery,
} = taskAPI;

export default taskAPI;




