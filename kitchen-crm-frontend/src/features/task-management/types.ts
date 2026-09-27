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
  /** Set once the assignee has opened their list since assignment; absent = "New" to them. */
  acknowledgedAt?: string;
  /** Set once the assigner has seen the completion; absent on a done task = awaiting review. */
  completionSeenAt?: string;
  /** Server-derived (business timezone): open and past its date. */
  overdue?: boolean;
  /** Server-derived: open and not yet acknowledged by the assignee. */
  newForAssignee?: boolean;
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

/** One task, several staff - the server creates one row per id. */
export interface EmployeeTaskBulkCreate {
  employeeIds: number[];
  taskTitle: string;
  taskDescription?: string;
  taskDate: string; // ISO date string (the due date)
  notes?: string;
  priority?: TaskPriority;
}

// Admin Todo types
export interface AdminTodo {
  id: number;
  userId: number;
  userName: string;
  todoTitle: string;
  todoDescription?: string;
  todoDate?: string; // ISO date string; absent = undated checklist item
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
  todoDate?: string; // ISO date string; omit for an undated checklist item
  notes?: string;
  priority?: TaskPriority;
  category?: string;
}

export interface AdminTodoUpdate {
  todoTitle?: string;
  todoDescription?: string;
  todoDate?: string;
  clearDate?: boolean; // null fields mean "unchanged", so clearing a date is explicit
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




