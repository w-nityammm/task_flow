export type Role = 'user' | 'admin';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type SortBy = 'created_at' | 'due_date' | 'priority';

export interface User {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted';
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: string;
}

export interface TaskFilters {
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  search?: string;
  sort_by?: SortBy;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
