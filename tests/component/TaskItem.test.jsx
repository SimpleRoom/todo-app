import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '@/components/TaskItem';

const makeTask = (overrides = {}) => ({
  id: 'task-1',
  title: '写周报',
  description: '本周工作总结',
  completed: false,
  createdAt: 1719650000000,
  ...overrides,
});

describe('TaskItem - 完成状态切换 (US2)', () => {
  it('renders checkbox for toggling completion', () => {
    render(<TaskItem task={makeTask()} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox', { name: /写周报/ })).toBeInTheDocument();
  });

  it('checkbox is unchecked when task is not completed', () => {
    render(<TaskItem task={makeTask({ completed: false })} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('checkbox is checked when task is completed', () => {
    render(<TaskItem task={makeTask({ completed: true })} onToggle={() => {}} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('applies strikethrough style to title when completed', () => {
    render(<TaskItem task={makeTask({ completed: true })} onToggle={() => {}} />);
    const title = screen.getByTestId('task-title');
    expect(title.className).toContain('line-through');
  });

  it('does not apply strikethrough style when not completed', () => {
    render(<TaskItem task={makeTask({ completed: false })} onToggle={() => {}} />);
    const title = screen.getByTestId('task-title');
    expect(title.className).not.toContain('line-through');
  });

  it('calls onToggle with task id when checkbox clicked', async () => {
    const onToggle = vi.fn();
    render(<TaskItem task={makeTask({ id: 'task-42' })} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('task-42');
  });

  it('clicking checkbox on completed task also calls onToggle', async () => {
    const onToggle = vi.fn();
    render(<TaskItem task={makeTask({ id: 'task-42', completed: true })} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('task-42');
  });

  it('applies muted opacity when completed', () => {
    render(<TaskItem task={makeTask({ completed: true })} onToggle={() => {}} />);
    const container = screen.getByTestId('task-item-container');
    expect(container.className).toContain('opacity-60');
  });
});
