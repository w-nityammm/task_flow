'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Task } from '@/lib/types';
import { Input, Textarea, Select } from '@/components/ui/inputs';
import { Button } from '@/components/ui/button';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(5000, 'Description too long'),
  status: z.enum(['todo', 'in_progress', 'done']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface TaskFormProps {
  task?: Task;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS = [
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: (task?.status as 'todo' | 'in_progress' | 'done') ?? 'todo',
      priority: (task?.priority as 'low' | 'medium' | 'high') ?? 'medium',
      due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Title"
        placeholder="What needs to be done?"
        error={errors.title?.message}
        id="task-title"
        {...register('title')}
      />

      <Textarea
        label="Description"
        placeholder="Add more details..."
        error={errors.description?.message}
        id="task-description"
        {...register('description')}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          error={errors.status?.message}
          id="task-status"
          {...register('status')}
        />
        <Select
          label="Priority"
          options={PRIORITY_OPTIONS}
          error={errors.priority?.message}
          id="task-priority"
          {...register('priority')}
        />
      </div>

      <Input
        label="Due Date"
        type="date"
        id="task-due-date"
        error={errors.due_date?.message}
        {...register('due_date')}
      />

      <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
        <Button type="submit" loading={isSubmitting} style={{ flex: 1 }} id="task-submit">
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} id="task-cancel">
          Cancel
        </Button>
      </div>
    </form>
  );
}
