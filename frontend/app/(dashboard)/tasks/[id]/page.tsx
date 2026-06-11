'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock } from 'lucide-react';
import type { Task, ActivityLog } from '@/lib/types';
import { api } from '@/lib/api';
import { TaskForm } from '@/components/tasks/task-form';
import { ActivityLogTimeline } from '@/components/tasks/activity-log';
import { StatusBadge, PriorityBadge, Skeleton } from '@/components/ui/badges';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, l] = await Promise.all([api.getTask(id), api.getActivity(id)]);
      setTask(t);
      setLogs(l);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (data: Partial<Task>) => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await api.updateTask(task.id, data);
      setTask(updated);
      setEditing(false);
      const newLogs = await api.getActivity(id);
      setLogs(newLogs);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] transition-colors"
        id="back-btn"
      >
        <ArrowLeft size={16} />
        Back to tasks
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-6">
            {!editing ? (
              <>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-xl font-bold text-[hsl(var(--text))]">{task.title}</h1>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(true)} id="edit-task-btn">
                    Edit
                  </Button>
                </div>

                {task.description && (
                  <p className="text-sm text-[hsl(var(--text-muted))] mb-4 leading-relaxed">{task.description}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.due_date && (
                    <span className="text-xs text-[hsl(var(--text-dim))] flex items-center gap-1">
                      <Clock size={12} />
                      Due {format(new Date(task.due_date), 'MMM d, yyyy')}
                    </span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] grid grid-cols-2 gap-4 text-xs text-[hsl(var(--text-dim))]">
                  <div>
                    <p className="text-[hsl(var(--text-muted))] font-medium mb-1">Created</p>
                    <p>{format(new Date(task.created_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                  <div>
                    <p className="text-[hsl(var(--text-muted))] font-medium mb-1">Updated</p>
                    <p>{format(new Date(task.updated_at), 'MMM d, yyyy · h:mm a')}</p>
                  </div>
                </div>
              </>
            ) : (
              <TaskForm
                task={task}
                onSubmit={handleUpdate}
                onCancel={() => setEditing(false)}
              />
            )}
          </div>
        </div>

        {/* Activity log sidebar */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-[hsl(var(--text))] mb-4">Activity</h2>
          <ActivityLogTimeline logs={logs} />
        </div>
      </div>
    </div>
  );
}
