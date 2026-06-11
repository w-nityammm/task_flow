import type { TaskFilters, Task, PaginatedTasks, User, AuthResponse, ActivityLog } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(path: string, init?: RequestInit, opts?: { silent401?: boolean }): Promise<T> {
    const headers = new Headers(init?.headers);
    headers.set('Content-Type', 'application/json');

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const res = await fetch(`${this.baseURL}${path}`, {
      ...init,
      credentials: 'include',
      headers,
    });

    if (res.status === 401) {
      // Only redirect to /login for authenticated routes, not for the auth-check itself
      if (!opts?.silent401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup') {
          // Clear any invalid token
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  // Auth
  async signup(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res && res.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.token);
    }
    return res;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res && res.token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', res.token);
    }
    return res;
  }

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    return this.request('/auth/logout', { method: 'POST' });
  }

  me(): Promise<User> {
    return this.request('/auth/me');
  }

  // Silent version that returns null instead of redirecting on 401
  meQuiet(): Promise<User | null> {
    return this.request<User>('/auth/me', undefined, { silent401: true }).catch(() => null);
  }

  // Tasks
  listTasks(filters: TaskFilters = {}): Promise<PaginatedTasks> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return this.request(`/tasks${qs ? `?${qs}` : ''}`);
  }

  getTask(id: string): Promise<Task> {
    return this.request(`/tasks/${id}`);
  }

  createTask(data: {
    title: string;
    description?: string;
    status: string;
    priority: string;
    due_date?: string | null;
  }): Promise<Task> {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTask(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      status: string;
      priority: string;
      due_date: string | null;
    }>
  ): Promise<Task> {
    return this.request(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteTask(id: string): Promise<void> {
    return this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  getActivity(taskId: string): Promise<ActivityLog[]> {
    return this.request(`/tasks/${taskId}/activity`);
  }

  // Admin
  adminListTasks(filters: TaskFilters = {}): Promise<PaginatedTasks> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return this.request(`/admin/tasks${qs ? `?${qs}` : ''}`);
  }
}

export const api = new ApiClient(API_URL);
