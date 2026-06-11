import { clsx } from 'clsx';
import type { TaskStatus, TaskPriority } from '@/lib/types';

const statusConfig: Record<TaskStatus, { label: string; class: string }> = {
  todo: { label: 'Todo', class: 'bg-[hsl(var(--text-dim)/0.15)] text-[hsl(var(--text-muted))] border-[hsl(var(--border))]' },
  in_progress: { label: 'In Progress', class: 'bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.3)]' },
  done: { label: 'Done', class: 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]' },
};

const priorityConfig: Record<TaskPriority, { label: string; class: string; dot: string }> = {
  low: { label: 'Low', class: 'text-[hsl(var(--text-muted))]', dot: 'bg-[hsl(var(--text-dim))]' },
  medium: { label: 'Medium', class: 'text-[hsl(var(--warning))]', dot: 'bg-[hsl(var(--warning))]' },
  high: { label: 'High', class: 'text-[hsl(var(--danger))]', dot: 'bg-[hsl(var(--danger))]' },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      cfg.class
    )}>
      {cfg.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = priorityConfig[priority];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', cfg.class)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx(
      'rounded-lg bg-[hsl(var(--surface-elevated))] animate-pulse-subtle',
      className
    )} />
  );
}
