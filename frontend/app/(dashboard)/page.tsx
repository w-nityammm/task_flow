'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ClipboardList, Wifi, WifiOff } from 'lucide-react';
import type { Task, TaskFilters } from '@/lib/types';
import { useOptimisticTasks } from '@/lib/hooks/use-optimistic-tasks';
import { useSSE } from '@/lib/hooks/use-sse';
import { useAuth } from '@/lib/auth-context';
import { TaskCard, TaskCardSkeleton } from '@/components/tasks/task-card';
import { TaskForm } from '@/components/tasks/task-form';
import { FilterBar } from '@/components/tasks/filter-bar';
import { Pagination } from '@/components/tasks/pagination';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, limit: 10, order: 'desc', sort_by: 'created_at' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { state, loading, error, refresh, optimisticDelete, optimisticUpdate, optimisticCreate, setState } = useOptimisticTasks();

  useEffect(() => { refresh(filters); }, [filters, refresh]);

  useSSE(useCallback((event) => {
    setSseConnected(true);
    if (event.type === 'task.created') {
      const incoming = event.payload as Task;
      setState(prev => {
        if (prev.tasks.some(t => t.id === incoming.id)) return prev;
        return { ...prev, tasks: [incoming, ...prev.tasks], total: prev.total + 1 };
      });
    } else if (event.type === 'task.updated') {
      setState(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === (event.payload as Task).id ? event.payload as Task : t) }));
    } else if (event.type === 'task.deleted') {
      const deleted = event.payload as { id: string };
      setState(prev => {
        if (!prev.tasks.some(t => t.id === deleted.id)) return prev;
        return { ...prev, tasks: prev.tasks.filter(t => t.id !== deleted.id), total: Math.max(0, prev.total - 1) };
      });
    }
  }, [setState]));

  // HTML date inputs return "YYYY-MM-DD"; backend *time.Time needs RFC3339
  const toRFC3339 = (d?: string | null) => (d ? `${d}T00:00:00Z` : null);

  const handleCreate = async (data: { title: string; description: string; status: string; priority: string; due_date?: string | null }) => {
    setFormError(null);
    try {
      await optimisticCreate({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        priority: data.priority,
        due_date: toRFC3339(data.due_date),
      });
      setModalOpen(false);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to create task');
    }
  };

  const handleEdit = async (data: { title: string; description: string; status: string; priority: string; due_date?: string | null }) => {
    if (!editingTask) return;
    setFormError(null);
    try {
      await optimisticUpdate(editingTask.id, {
        title: data.title,
        description: data.description || undefined,
        status: data.status as Task['status'],
        priority: data.priority as Task['priority'],
        due_date: toRFC3339(data.due_date),
      });
      setEditingTask(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to update task');
    }
  };

  const handleToggleDone = (task: Task) => {
    optimisticUpdate(task.id, { status: task.status === 'done' ? 'todo' : 'done' });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const inProgress = state.tasks.filter(t => t.status === 'in_progress').length;
  const done = state.tasks.filter(t => t.status === 'done').length;
  const highPri = state.tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'hsl(var(--text))' }}>
            Good {greeting},{' '}
            <span style={{ color: 'hsl(var(--accent))' }}>{user?.email?.split('@')[0]}</span>
            {' '}👋
          </h1>
          <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', marginTop: 4 }}>
            {state.total} tasks total · {done} completed
            {highPri > 0 && <span style={{ color: 'hsl(var(--danger))', marginLeft: 4 }}>· {highPri} high priority</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'hsl(var(--text-dim))', display: 'flex', alignItems: 'center', gap: 5 }}>
            {sseConnected
              ? <><Wifi size={12} color="hsl(var(--success))" /> <span style={{ color: 'hsl(var(--success))' }}>Live</span></>
              : <><WifiOff size={12} /> Connecting...</>}
          </span>
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)} id="create-task-btn">
            New Task
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Total', value: state.total, color: 'hsl(var(--accent))' },
          { label: 'In Progress', value: inProgress, color: 'hsl(var(--warning))' },
          { label: 'Completed', value: done, color: 'hsl(var(--success))' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 12, padding: '16px 12px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color }}>{value}</p>
            <p style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 9, background: 'hsl(var(--danger) / 0.12)', border: '1px solid hsl(var(--danger) / 0.3)', fontSize: 13, color: 'hsl(var(--danger))' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Task list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <TaskCardSkeleton key={i} />)
          : state.tasks.length === 0
            ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'hsl(var(--surface-elevated))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <ClipboardList size={28} color="hsl(var(--text-dim))" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'hsl(var(--text-muted))' }}>No tasks found</p>
                <p style={{ fontSize: 12, color: 'hsl(var(--text-dim))', marginTop: 4 }}>
                  {filters.search ? 'Try a different search term' : 'Create your first task to get started'}
                </p>
              </div>
            )
            : state.tasks.map(task => (
              <TaskCard key={task.id} task={task} onEdit={setEditingTask} onDelete={optimisticDelete} onToggleDone={handleToggleDone} />
            ))}
      </div>

      {/* Pagination */}
      {!loading && state.total_pages > 1 && (
        <Pagination page={state.page} totalPages={state.total_pages} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setFormError(null); }} title="Create New Task">
        {formError && (
          <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.25)', fontSize: 13, color: 'hsl(var(--danger))' }}>
            ⚠️ {formError}
          </div>
        )}
        <TaskForm onSubmit={handleCreate} onCancel={() => { setModalOpen(false); setFormError(null); }} />
      </Modal>

      <Modal open={!!editingTask} onClose={() => { setEditingTask(null); setFormError(null); }} title="Edit Task">
        {formError && (
          <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.25)', fontSize: 13, color: 'hsl(var(--danger))' }}>
            ⚠️ {formError}
          </div>
        )}
        {editingTask && <TaskForm task={editingTask} onSubmit={handleEdit} onCancel={() => { setEditingTask(null); setFormError(null); }} />}
      </Modal>
    </div>
  );
}
