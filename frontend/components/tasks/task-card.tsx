'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Trash2, Edit2, CheckCircle, Circle } from 'lucide-react';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleDone: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggleDone }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isDone = task.status === 'done';
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone;

  const statusColors: Record<string, string> = {
    todo: 'hsl(var(--text-dim))',
    in_progress: 'hsl(var(--warning))',
    done: 'hsl(var(--success))',
  };
  const statusBg: Record<string, string> = {
    todo: 'hsl(var(--surface-elevated))',
    in_progress: 'hsl(var(--warning) / 0.12)',
    done: 'hsl(var(--success) / 0.12)',
  };
  const priorityColors: Record<string, string> = {
    low: 'hsl(var(--text-dim))',
    medium: 'hsl(var(--warning))',
    high: 'hsl(var(--danger))',
  };
  const statusLabel: Record<string, string> = { todo: 'Todo', in_progress: 'In Progress', done: 'Done' };
  const priorityLabel: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };

  return (
    <div className="group" style={{
      background: 'hsl(var(--surface))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 12,
      padding: '14px 16px',
      transition: 'border-color .2s, box-shadow .2s',
      opacity: isDone ? 0.7 : 1,
      animation: 'fade-in .18s ease both',
    }}
      onMouseEnter={e => {
        setIsHovered(true);
        (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(var(--accent) / 0.4)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 18px hsl(var(--accent) / 0.06)';
      }}
      onMouseLeave={e => {
        setIsHovered(false);
        (e.currentTarget as HTMLDivElement).style.borderColor = 'hsl(var(--border))';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Toggle done */}
        <button onClick={() => onToggleDone(task)}
          aria-label={isDone ? 'Mark as todo' : 'Mark as done'}
          style={{ marginTop: 1, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: isDone ? 'hsl(var(--success))' : 'hsl(var(--text-dim))', padding: 0, transition: 'color .15s' }}
        >
          {isDone ? <CheckCircle size={20} /> : <Circle size={20} />}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 500, lineHeight: 1.4,
            color: isDone ? 'hsl(var(--text-muted))' : 'hsl(var(--text))',
            textDecoration: isDone ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {task.title}
          </p>
          {task.description && (
            <p style={{ fontSize: 12, color: 'hsl(var(--text-dim))', marginTop: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
              {task.description}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 }}>
            {/* Status */}
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '2px 9px', borderRadius: 999,
              background: statusBg[task.status],
              color: statusColors[task.status],
              border: `1px solid ${statusColors[task.status]}40`,
            }}>
              {statusLabel[task.status]}
            </span>
            {/* Priority */}
            <span style={{ fontSize: 11, fontWeight: 500, color: priorityColors[task.priority], display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColors[task.priority], display: 'inline-block' }} />
              {priorityLabel[task.priority]}
            </span>
            {/* Due date */}
            {task.due_date && (
              <span style={{ fontSize: 11, color: isOverdue ? 'hsl(var(--danger))' : 'hsl(var(--text-dim))', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={11} />
                {format(new Date(task.due_date), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, opacity: isHovered ? 1 : 0.4, flexShrink: 0, transition: 'opacity .15s' }}>
          <button onClick={() => onEdit(task)}
            style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--surface-elevated))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--accent))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-muted))'; }}
          >
            <Edit2 size={13} />
          </button>
          <button onClick={() => onDelete(task.id)}
            style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--danger) / 0.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--danger))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-muted))'; }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div style={{ background: 'hsl(var(--surface))', border: '1px solid hsl(var(--border))', borderRadius: 12, padding: '14px 16px', animation: 'pulse-sub 1.6s ease-in-out infinite' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'hsl(var(--border))', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: 'hsl(var(--border))', borderRadius: 6, width: '65%' }} />
          <div style={{ height: 11, background: 'hsl(var(--border))', borderRadius: 6, width: '40%', marginTop: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div style={{ height: 18, background: 'hsl(var(--border))', borderRadius: 9, width: 56 }} />
            <div style={{ height: 18, background: 'hsl(var(--border))', borderRadius: 9, width: 48 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
