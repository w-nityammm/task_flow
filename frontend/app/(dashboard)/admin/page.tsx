'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import type { TaskFilters } from '@/lib/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { TaskCard } from '@/components/tasks/task-card';
import { TaskCardSkeleton } from '@/components/tasks/task-card';
import { FilterBar } from '@/components/tasks/filter-bar';
import { Pagination } from '@/components/tasks/pagination';
import type { PaginatedTasks, Task } from '@/lib/types';

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, limit: 15, order: 'desc' });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setLoading(true);
    api.adminListTasks(filters)
      .then(setData)
      .finally(() => setLoading(false));
  }, [filters, user]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <Shield size={48} className="text-[hsl(var(--text-dim))] mx-auto mb-4" />
          <p className="text-[hsl(var(--text-muted))]">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent)/0.2)] flex items-center justify-center">
          <Shield size={16} className="text-[hsl(var(--accent))]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--text))]">Admin Panel</h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">View all users&apos; tasks</p>
        </div>
      </div>

      {data && (
        <div className="glass rounded-xl px-4 py-3 flex gap-6 text-sm">
          <span className="text-[hsl(var(--text-muted))]">
            Total: <strong className="text-[hsl(var(--text))]">{data.total}</strong>
          </span>
        </div>
      )}

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <TaskCardSkeleton key={i} />)
        ) : data?.tasks.length === 0 ? (
          <p className="text-center text-[hsl(var(--text-muted))] py-10">No tasks found</p>
        ) : (
          data?.tasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleDone={() => {}}
            />
          ))
        )}
      </div>

      {data && data.total_pages > 1 && (
        <Pagination
          page={data.page}
          totalPages={data.total_pages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
}
