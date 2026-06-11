'use client';

import { useState, useCallback, useRef } from 'react';
import type { Task, TaskFilters, PaginatedTasks } from '@/lib/types';
import { api } from '@/lib/api';

interface OptimisticState {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function useOptimisticTasks(initialData?: PaginatedTasks) {
  const [state, setState] = useState<OptimisticState>(
    initialData ?? { tasks: [], total: 0, page: 1, limit: 20, total_pages: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshotRef = useRef<OptimisticState | null>(null);

  const saveSnapshot = () => {
    snapshotRef.current = state;
  };

  const rollback = useCallback((errMsg: string) => {
    if (snapshotRef.current) setState(snapshotRef.current);
    setError(errMsg);
    setTimeout(() => setError(null), 4000);
  }, []);

  const refresh = useCallback(async (filters: TaskFilters = {}) => {
    setLoading(true);
    try {
      const data = await api.listTasks(filters);
      setState(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const optimisticDelete = useCallback(async (id: string) => {
    saveSnapshot();
    // Optimistically remove
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      total: prev.total - 1,
    }));
    try {
      await api.deleteTask(id);
    } catch (e) {
      rollback(e instanceof Error ? e.message : 'Delete failed');
    }
  }, [rollback]); // eslint-disable-line

  const optimisticUpdate = useCallback(
    async (id: string, updates: Partial<Task>) => {
      saveSnapshot();
      setState((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
      try {
        const updated = await api.updateTask(id, updates);
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.map((t) => (t.id === id ? updated : t)),
        }));
      } catch (e) {
        rollback(e instanceof Error ? e.message : 'Update failed');
      }
    },
    [rollback] // eslint-disable-line
  );

  const optimisticCreate = useCallback(
    async (data: Parameters<typeof api.createTask>[0]) => {
      const created = await api.createTask(data);
      setState((prev) => {
        if (prev.tasks.some((t) => t.id === created.id)) return prev;
        return {
          ...prev,
          tasks: [created, ...prev.tasks],
          total: prev.total + 1,
        };
      });
      return created;
    },
    []
  );

  return {
    state,
    setState,
    loading,
    error,
    refresh,
    optimisticDelete,
    optimisticUpdate,
    optimisticCreate,
  };
}
