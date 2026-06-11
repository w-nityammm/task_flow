import { renderHook, act } from '@testing-library/react';
import { useOptimisticTasks } from '@/lib/hooks/use-optimistic-tasks';
import type { Task, PaginatedTasks } from '@/lib/types';

// Mock the api module
jest.mock('@/lib/api', () => ({
  api: {
    listTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

import { api } from '@/lib/api';
const mockApi = api as jest.Mocked<typeof api>;

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    user_id: 'user-1',
    title: 'Test Task',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const initialData: PaginatedTasks = {
  tasks: [makeTask({ id: 'task-1', title: 'Task One' }), makeTask({ id: 'task-2', title: 'Task Two' })],
  total: 2,
  page: 1,
  limit: 20,
  total_pages: 1,
};

describe('useOptimisticTasks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('initializes with provided data', () => {
    const { result } = renderHook(() => useOptimisticTasks(initialData));
    expect(result.current.state.tasks).toHaveLength(2);
    expect(result.current.state.total).toBe(2);
  });

  it('optimisticDelete removes task immediately then confirms on server success', async () => {
    mockApi.deleteTask.mockResolvedValue(undefined);
    const { result } = renderHook(() => useOptimisticTasks(initialData));

    await act(async () => {
      await result.current.optimisticDelete('task-1');
    });

    expect(result.current.state.tasks).toHaveLength(1);
    expect(result.current.state.tasks[0].id).toBe('task-2');
    expect(mockApi.deleteTask).toHaveBeenCalledWith('task-1');
  });

  it('optimisticDelete rolls back on server failure', async () => {
    mockApi.deleteTask.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useOptimisticTasks(initialData));

    await act(async () => {
      await result.current.optimisticDelete('task-1');
    });

    // Should be rolled back to 2 tasks
    expect(result.current.state.tasks).toHaveLength(2);
    expect(result.current.error).toBe('Server error');
  });

  it('optimisticUpdate patches task immediately then refreshes from server', async () => {
    const updatedTask = makeTask({ id: 'task-1', title: 'Updated Task', status: 'done' });
    mockApi.updateTask.mockResolvedValue(updatedTask);
    const { result } = renderHook(() => useOptimisticTasks(initialData));

    await act(async () => {
      await result.current.optimisticUpdate('task-1', { status: 'done' });
    });

    const task = result.current.state.tasks.find((t) => t.id === 'task-1');
    expect(task?.status).toBe('done');
    expect(task?.title).toBe('Updated Task');
  });

  it('optimisticCreate adds task to list', async () => {
    const newTask = makeTask({ id: 'task-3', title: 'New Task' });
    mockApi.createTask.mockResolvedValue(newTask);
    const { result } = renderHook(() => useOptimisticTasks(initialData));

    await act(async () => {
      await result.current.optimisticCreate({
        title: 'New Task',
        status: 'todo',
        priority: 'medium',
      });
    });

    expect(result.current.state.tasks).toHaveLength(3);
    expect(result.current.state.tasks[0].id).toBe('task-3');
  });
});
