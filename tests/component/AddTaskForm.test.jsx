import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTaskForm } from '@/components/AddTaskForm';

describe('AddTaskForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title input, description input, and add button', () => {
    render(<AddTaskForm onAdd={() => {}} />);
    expect(screen.getByPlaceholderText('请输入任务标题')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('描述（可选）')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument();
  });

  it('shows validation error when title is empty on add', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows validation error when title is whitespace only', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '   ');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onAdd with trimmed title and description when valid', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '  买牛奶  ');
    await userEvent.type(screen.getByPlaceholderText('描述（可选）'), '下班顺路');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(onAdd).toHaveBeenCalledWith({ title: '买牛奶', description: '下班顺路' });
  });

  it('allows empty description (description optional)', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '买牛奶');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(onAdd).toHaveBeenCalledWith({ title: '买牛奶', description: '' });
  });

  it('clears inputs after successful add', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    const titleInput = screen.getByPlaceholderText('请输入任务标题');
    const descInput = screen.getByPlaceholderText('描述（可选）');
    await userEvent.type(titleInput, '买牛奶');
    await userEvent.type(descInput, '下班顺路');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(titleInput).toHaveValue('');
    expect(descInput).toHaveValue('');
  });

  it('allows duplicate title (no uniqueness constraint)', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '买牛奶');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
    // 再次添加相同标题也应成功
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '买牛奶');
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(onAdd).toHaveBeenCalledTimes(2);
    expect(onAdd).toHaveBeenLastCalledWith({ title: '买牛奶', description: '' });
  });

  it('clears validation error after user types', async () => {
    const onAdd = vi.fn();
    render(<AddTaskForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: '添加' }));
    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('请输入任务标题'), '买');
    expect(screen.queryByText('请输入任务标题')).not.toBeInTheDocument();
  });
});
