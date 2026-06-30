import { useState } from 'react';

/**
 * 多选模式工具栏。
 * @param {{
 *   selectedCount: number,
 *   visibleCount: number,
 *   allVisibleSelected: boolean,
 *   onSelectAll: () => void,
 *   onClearSelection: () => void,
 *   onDeleteSelected: () => void,
 *   onExit: () => void,
 * }} props
 */
export function BatchToolbar({
  selectedCount,
  visibleCount,
  allVisibleSelected,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onExit,
}) {
  const [guard, setGuard] = useState('');

  const handleDeleteClick = () => {
    if (selectedCount === 0) {
      setGuard('请先选择要删除的任务');
      return;
    }
    setGuard('');
    onDeleteSelected();
  };

  const handleSelectAllClick = () => {
    setGuard('');
    if (allVisibleSelected) {
      onClearSelection();
    } else {
      onSelectAll();
    }
  };

  return (
    <div className="bg-surface rounded-lg shadow-card p-3 mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={handleSelectAllClick}
        className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-background transition-colors"
      >
        {allVisibleSelected ? '取消全选' : '全选'}
      </button>
      <button
        type="button"
        onClick={handleDeleteClick}
        className="px-3 py-1.5 text-sm bg-danger text-white rounded-md hover:bg-dangerHover transition-colors"
      >
        删除所选{selectedCount > 0 ? `（${selectedCount}）` : ''}
      </button>
      <div className="flex-1" />
      {guard && (
        <span role="alert" className="text-danger text-sm">
          {guard}
        </span>
      )}
      <button
        type="button"
        onClick={onExit}
        className="px-3 py-1.5 text-sm text-muted hover:text-text transition-colors"
      >
        退出多选
      </button>
    </div>
  );
}
