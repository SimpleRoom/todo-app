import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterTabs } from '@/components/FilterTabs';

describe('FilterTabs', () => {
  it('renders three filter tabs: 全部, 未完成, 已完成', () => {
    render(<FilterTabs current="all" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '未完成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已完成' })).toBeInTheDocument();
  });

  it('highlights "全部" tab when current is "all"', () => {
    render(<FilterTabs current="all" onChange={() => {}} />);
    const allTab = screen.getByRole('button', { name: '全部' });
    expect(allTab.className).toContain('bg-primary');
    expect(allTab.className).toContain('text-white');
  });

  it('highlights "未完成" tab when current is "active"', () => {
    render(<FilterTabs current="active" onChange={() => {}} />);
    const activeTab = screen.getByRole('button', { name: '未完成' });
    expect(activeTab.className).toContain('bg-primary');
    expect(activeTab.className).toContain('text-white');
  });

  it('highlights "已完成" tab when current is "completed"', () => {
    render(<FilterTabs current="completed" onChange={() => {}} />);
    const completedTab = screen.getByRole('button', { name: '已完成' });
    expect(completedTab.className).toContain('bg-primary');
    expect(completedTab.className).toContain('text-white');
  });

  it('non-active tabs have default style (no primary background)', () => {
    render(<FilterTabs current="all" onChange={() => {}} />);
    const activeTab = screen.getByRole('button', { name: '未完成' });
    expect(activeTab.className).not.toContain('bg-primary');
  });

  it('calls onChange with "all" when 全部 clicked', async () => {
    const onChange = vi.fn();
    render(<FilterTabs current="active" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('calls onChange with "active" when 未完成 clicked', async () => {
    const onChange = vi.fn();
    render(<FilterTabs current="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '未完成' }));
    expect(onChange).toHaveBeenCalledWith('active');
  });

  it('calls onChange with "completed" when 已完成 clicked', async () => {
    const onChange = vi.fn();
    render(<FilterTabs current="all" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '已完成' }));
    expect(onChange).toHaveBeenCalledWith('completed');
  });

  it('displays task count for each tab', () => {
    render(
      <FilterTabs
        current="all"
        onChange={() => {}}
        counts={{ all: 5, active: 3, completed: 2 }}
      />,
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
