import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TaskList } from '@/components/TaskList';
import { EmptyState } from '@/components/EmptyState';

describe('TaskList', () => {
  it('renders empty state message when no tasks', () => {
    render(<TaskList tasks={[]} filter="all" />);
    expect(screen.getByText('还没有任务，添加第一条吧')).toBeInTheDocument();
  });

  it('renders empty state for active filter when no incomplete tasks', () => {
    const completedTask = {
      id: '1',
      title: '已完成',
      description: '',
      completed: true,
      createdAt: Date.now(),
    };
    render(<TaskList tasks={[completedTask]} filter="active" />);
    expect(screen.getByText('暂无未完成任务')).toBeInTheDocument();
  });

  it('renders empty state for completed filter when no completed tasks', () => {
    const activeTask = {
      id: '1',
      title: '未完成',
      description: '',
      completed: false,
      createdAt: Date.now(),
    };
    render(<TaskList tasks={[activeTask]} filter="completed" />);
    expect(screen.getByText('暂无已完成任务')).toBeInTheDocument();
  });

  it('renders all tasks when filter is "all"', () => {
    const tasks = [
      { id: '1', title: '任务A', description: '描述A', completed: false, createdAt: 2000 },
      { id: '2', title: '任务B', description: '', completed: true, createdAt: 1000 },
    ];
    render(<TaskList tasks={tasks} filter="all" />);
    expect(screen.getByText('任务A')).toBeInTheDocument();
    expect(screen.getByText('任务B')).toBeInTheDocument();
  });

  it('renders only active tasks when filter is "active"', () => {
    const tasks = [
      { id: '1', title: '未完成', description: '', completed: false, createdAt: 2000 },
      { id: '2', title: '已完成', description: '', completed: true, createdAt: 1000 },
    ];
    render(<TaskList tasks={tasks} filter="active" />);
    expect(screen.getByText('未完成')).toBeInTheDocument();
    expect(screen.queryByText('已完成')).not.toBeInTheDocument();
  });

  it('renders only completed tasks when filter is "completed"', () => {
    const tasks = [
      { id: '1', title: '未完成', description: '', completed: false, createdAt: 2000 },
      { id: '2', title: '已完成', description: '', completed: true, createdAt: 1000 },
    ];
    render(<TaskList tasks={tasks} filter="completed" />);
    expect(screen.queryByText('未完成')).not.toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('renders multiple tasks in list order', () => {
    const tasks = [
      { id: '1', title: '第一个', description: '', completed: false, createdAt: 3000 },
      { id: '2', title: '第二个', description: '', completed: false, createdAt: 2000 },
      { id: '3', title: '第三个', description: '', completed: false, createdAt: 1000 },
    ];
    render(<TaskList tasks={tasks} filter="all" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
});
