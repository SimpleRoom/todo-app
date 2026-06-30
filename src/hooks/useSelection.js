import { useState, useCallback } from 'react';

/**
 * 多选选中态 hook。
 * 选中态以 Set<string> 维护，跨筛选视图持久（隐藏的任务保持选中）。
 * @returns {{
 *   selectedIds: Set<string>,
 *   isSelected: (id: string) => boolean,
 *   toggle: (id: string) => void,
 *   selectAll: (ids: string[]) => void,
 *   clear: () => void,
 *   selectedCount: number,
 * }}
 */
export function useSelection() {
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const isSelected = useCallback(
    (id) => selectedIds.has(id),
    [selectedIds],
  );

  const toggle = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      // 检查是否当前传入的 ids 全部已选中
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        // 取消全选：移除这些 ids
        for (const id of ids) next.delete(id);
      } else {
        // 全选：添加这些 ids
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clear,
    selectedCount: selectedIds.size,
  };
}
