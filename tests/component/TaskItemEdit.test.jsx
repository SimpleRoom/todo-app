import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItemEdit } from '@/components/TaskItemEdit';

const makeTask = (overrides = {}) => ({
  id: 'task-1',
  title: '买牛奶',
  description: '下班顺路',
  completed: false,
  createdAt: 1719650000000,
  ...overrides,
});

describe('TaskItemEdit', () => {
  it('prefills title and description inputs with current task values', () => {
    render(<TaskItemEdit task={makeTask()} onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByDisplayValue('买牛奶')).toBeInTheDocument();
    expect(screen.getByDisplayValue('下班顺路')).toBeInTheDocument();
  });

  it('renders save and cancel buttons', () => {
    render(<TaskItemEdit task={makeTask()} onSave={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('button', { name: '保存' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument();
  });

  it('calls onSave with new title and description when save clicked', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    const titleInput = screen.getByDisplayValue('买牛奶');
    const descInput = screen.getByDisplayValue('下班顺路');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '买酸奶');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, '早上路过超市');

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'task-1',
      title: '买酸奶',
      description: '早上路过超市',
    });
  });

  it('trims title whitespace on save', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    const titleInput = screen.getByDisplayValue('买牛奶');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '  买酸奶  ');

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'task-1',
      title: '买酸奶',
      description: '下班顺路',
    });
  });

  it('blocks save and shows error when title is empty', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    const titleInput = screen.getByDisplayValue('买牛奶');
    await userEvent.clear(titleInput);

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks save when title is whitespace only', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    const titleInput = screen.getByDisplayValue('买牛奶');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, '   ');

    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel clicked without saving', async () => {
    const onCancel = vi.fn();
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={onCancel} />);

    // 修改内容
    await userEvent.clear(screen.getByDisplayValue('买牛奶'));
    await userEvent.type(screen.getByDisplayValue(''), '改过的标题');

    await userEvent.click(screen.getByRole('button', { name: '取消' }));

    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('clears validation error after user types in title', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    await userEvent.clear(screen.getByDisplayValue('买牛奶'));
    await userEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(screen.getByText('请输入任务标题')).toBeInTheDocument();

    await userEvent.type(screen.getByDisplayValue(''), '新标题');
    expect(screen.queryByText('请输入任务标题')).not.toBeInTheDocument();
  });

  it('allows empty description on save', async () => {
    const onSave = vi.fn();
    render(<TaskItemEdit task={makeTask()} onSave={onSave} onCancel={() => {}} />);

    await userEvent.clear(screen.getByDisplayValue('下班顺路'));
    await userEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(onSave).toHaveBeenCalledWith({
      id: 'task-1',
      title: '买牛奶',
      description: '',
    });
  });
});
