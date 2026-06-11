'use client';

import { format } from 'date-fns';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { ActivityLog } from '@/lib/types';

const ACTION_CONFIG = {
  created: { label: 'created this task', icon: <Plus size={12} />, color: 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.15)]' },
  updated: { label: 'updated this task', icon: <Edit size={12} />, color: 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.15)]' },
  deleted: { label: 'deleted this task', icon: <Trash2 size={12} />, color: 'text-[hsl(var(--danger))] bg-[hsl(var(--danger)/0.15)]' },
};

export function ActivityLogTimeline({ logs }: { logs: ActivityLog[] }) {
  if (!logs.length) {
    return (
      <p className="text-sm text-[hsl(var(--text-dim))] text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-[hsl(var(--border))]" />

      {logs.map((log) => {
        const cfg = ACTION_CONFIG[log.action];
        return (
          <div key={log.id} className="flex items-start gap-3 animate-slide-in">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
              {cfg.icon}
            </div>
            <div className="flex-1 pb-1">
              <p className="text-sm text-[hsl(var(--text))]">
                <span className="font-medium">User</span>{' '}
                <span className="text-[hsl(var(--text-muted))]">{cfg.label}</span>
              </p>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <p className="text-xs text-[hsl(var(--text-dim))] mt-0.5">
                  {(log.metadata as { title?: string }).title && `"${(log.metadata as { title: string }).title}"`}
                </p>
              )}
              <p className="text-xs text-[hsl(var(--text-dim))] mt-1">
                {format(new Date(log.created_at), 'MMM d, yyyy · h:mm a')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
