/**
 * Task Management feature types
 */

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

// Employee Task types
export interface EmployeeTask {
  id: number;
  assignedToUserId: number;
  assignedToUserName: string;
  assignedByUserId: number;
  assignedByName: string;
  taskTitle: string;
  taskDescription?: string;
  taskDate: string; // ISO date string
  completed: boolean;
  completedAt?: string;
  notes?: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeTaskCreate {
  employeeId: number;
  taskTitle: string;
  taskDescription?: string;
  taskDate: string; // ISO date string
  notes?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface EmployeeTaskUpdate {
  taskTitle?: string;
  taskDescription?: string;
  taskDate?: string;
  notes?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

// Admin Todo types
export interface AdminTodo {
  id: number;
  userId: number;
  userName: string;
  todoTitle: string;
  todoDescription?: string;
  todoDate: string; // ISO date string
  completed: boolean;
  completedAt?: string;
  notes?: string;
  priority: TaskPriority;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTodoCreate {
  todoTitle: string;
  todoDescription?: string;
  todoDate: string; // ISO date string
  notes?: string;
  priority?: TaskPriority;
  category?: string;
}

export interface AdminTodoUpdate {
  todoTitle?: string;
  todoDescription?: string;
  todoDate?: string;
  notes?: string;
  priority?: TaskPriority;
  category?: string;
}

// Task Completion Statistics
export interface TaskCompletionStats {
  fromDate: string;
  toDate: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  tasksByEmployee: Record<string, number>;
  tasksByDate: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByStatus: Record<string, number>;
  employeeStats: EmployeeTaskStats[];
}

export interface EmployeeTaskStats {
  employeeId: number;
  employeeName: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
}




