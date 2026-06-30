import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchToolbar } from '@/components/BatchToolbar';

describe('BatchToolbar', () => {
  const baseProps = {
    selectedCount: 0,
    visibleCount: 4,
    onSelectAll: () => {},
    onClearSelection: () => {},
    onDeleteSelected: () => {},
    onExit: () => {},
    allVisibleSelected: false,
  };

  describe('enter/exit batch mode', () => {
    it('renders 全选, 删除所选, 退出多选 buttons in batch mode', () => {
      render(<BatchToolbar {...baseProps} />);
      expect(screen.getByRole('button', { name: /全选/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '删除所选' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '退出多选' })).toBeInTheDocument();
    });

    it('calls onExit when 退出多选 clicked', async () => {
      const onExit = vi.fn();
      render(<BatchToolbar {...baseProps} onExit={onExit} />);
      await userEvent.click(screen.getByRole('button', { name: '退出多选' }));
      expect(onExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('select all / clear', () => {
    it('shows "全选" when not all selected', () => {
      render(<BatchToolbar {...baseProps} allVisibleSelected={false} />);
      expect(screen.getByRole('button', { name: '全选' })).toBeInTheDocument();
    });

    it('shows "取消全选" when all visible selected', () => {
      render(<BatchToolbar {...baseProps} allVisibleSelected={true} />);
      expect(screen.getByRole('button', { name: '取消全选' })).toBeInTheDocument();
    });

    it('calls onSelectAll when 全选 clicked', async () => {
      const onSelectAll = vi.fn();
      render(<BatchToolbar {...baseProps} onSelectAll={onSelectAll} allVisibleSelected={false} />);
      await userEvent.click(screen.getByRole('button', { name: '全选' }));
      expect(onSelectAll).toHaveBeenCalledTimes(1);
    });

    it('calls onClearSelection when 取消全选 clicked', async () => {
      const onClearSelection = vi.fn();
      render(
        <BatchToolbar
          {...baseProps}
          onClearSelection={onClearSelection}
          allVisibleSelected={true}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: '取消全选' }));
      expect(onClearSelection).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete selected with count', () => {
    it('shows selected count in 删除所选 button', () => {
      render(<BatchToolbar {...baseProps} selectedCount={3} />);
      expect(screen.getByRole('button', { name: /删除所选.*3/ })).toBeInTheDocument();
    });

    it('calls onDeleteSelected when 删除所选 clicked with selection', async () => {
      const onDeleteSelected = vi.fn();
      render(
        <BatchToolbar {...baseProps} selectedCount={2} onDeleteSelected={onDeleteSelected} />,
      );
      await userEvent.click(screen.getByRole('button', { name: /删除所选/ }));
      expect(onDeleteSelected).toHaveBeenCalledTimes(1);
    });

    it('shows no-selection guard message when clicked with 0 selected', async () => {
      const onDeleteSelected = vi.fn();
      render(
        <BatchToolbar {...baseProps} selectedCount={0} onDeleteSelected={onDeleteSelected} />,
      );
      await userEvent.click(screen.getByRole('button', { name: /删除所选/ }));
      expect(screen.getByText('请先选择要删除的任务')).toBeInTheDocument();
      expect(onDeleteSelected).not.toHaveBeenCalled();
    });
  });

  describe('concurrent-deletion adjusts confirm count when another tab removes selected tasks', () => {
    it('reflects the actual current selectedCount (not stale count)', () => {
      // 模拟：另一标签页已删除部分选中任务后，本组件收到的 selectedCount 已被父组件刷新
      const { rerender } = render(
        <BatchToolbar {...baseProps} selectedCount={5} />,
      );
      expect(screen.getByRole('button', { name: /删除所选.*5/ })).toBeInTheDocument();

      // 另一标签页删除 2 条选中任务，父组件刷新为 3
      rerender(<BatchToolbar {...baseProps} selectedCount={3} />);
      expect(screen.getByRole('button', { name: /删除所选.*3/ })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /删除所选.*5/ })).not.toBeInTheDocument();
    });
  });
});
