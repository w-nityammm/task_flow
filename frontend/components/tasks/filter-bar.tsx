'use client';

import { Search, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { TaskFilters, TaskStatus, TaskPriority, SortBy } from '@/lib/types';

interface FilterBarProps {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
}

const STATUS_TABS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'created_at', label: 'Sort: Created' },
  { value: 'due_date', label: 'Sort: Due Date' },
  { value: 'priority', label: 'Sort: Priority' },
];

const PRIORITY_OPTIONS: { value: TaskPriority | ''; label: string }[] = [
  { value: '', label: 'All Priorities' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const selectStyle: React.CSSProperties = {
  padding: '7px 12px', borderRadius: 8, fontSize: 12,
  background: 'hsl(var(--surface-elevated))',
  border: '1px solid hsl(var(--border))',
  color: 'hsl(var(--text))', outline: 'none', cursor: 'pointer',
  fontFamily: 'inherit',
};

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search ?? '');
  const timerRef = useState<ReturnType<typeof setTimeout> | null>(null);

  const update = useCallback((patch: Partial<TaskFilters>) => {
    onChange({ ...filters, ...patch, page: 1 });
  }, [filters, onChange]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    if (timerRef[0]) clearTimeout(timerRef[0]);
    const id = setTimeout(() => update({ search: val }), 300);
    timerRef[1](id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-dim))', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchValue}
          onChange={handleSearch}
          id="filter-search"
          style={{
            ...selectStyle,
            width: '100%', paddingLeft: 34, fontSize: 13,
          }}
        />
      </div>

      {/* Status tabs */}
      <div style={{
        display: 'flex', gap: 3, padding: 4,
        background: 'hsl(var(--surface-elevated))', borderRadius: 10,
      }}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            id={`filter-status-${tab.value || 'all'}`}
            onClick={() => update({ status: tab.value as TaskStatus })}
            style={{
              flex: 1, padding: '6px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 500, transition: 'all .15s', fontFamily: 'inherit',
              background: filters.status === tab.value ? 'hsl(var(--accent))' : 'transparent',
              color: filters.status === tab.value ? '#fff' : 'hsl(var(--text-muted))',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        id="filter-advanced-toggle"
        style={{
          display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 12, color: 'hsl(var(--text-muted))', fontFamily: 'inherit',
          padding: 0, width: 'fit-content',
        }}
      >
        <SlidersHorizontal size={12} />
        Advanced filters
        {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {showAdvanced && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select value={filters.priority ?? ''} onChange={e => update({ priority: e.target.value as TaskPriority })} style={selectStyle} id="filter-priority">
            {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'hsl(var(--surface-elevated))' }}>{o.label}</option>)}
          </select>
          <select value={filters.sort_by ?? 'created_at'} onChange={e => update({ sort_by: e.target.value as SortBy })} style={selectStyle} id="filter-sort-by">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: 'hsl(var(--surface-elevated))' }}>{o.label}</option>)}
          </select>
          <button
            onClick={() => update({ order: filters.order === 'asc' ? 'desc' : 'asc' })}
            style={{ ...selectStyle, display: 'flex', alignItems: 'center', gap: 5 }}
            id="filter-order"
          >
            {filters.order === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {filters.order === 'asc' ? 'Ascending' : 'Descending'}
          </button>
        </div>
      )}
    </div>
  );
}
