import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTasks } from './hooks/useTasks';
import { useFilter } from './hooks/useFilter';
import { useSelection } from './hooks/useSelection';
import { useCrossTabSync } from './hooks/useCrossTabSync';
import { AddTaskForm } from './components/AddTaskForm';
import { TaskList } from './components/TaskList';
import { FilterTabs } from './components/FilterTabs';
import { BatchToolbar } from './components/BatchToolbar';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SettingsMenu } from './components/SettingsMenu';
import { Toast } from './components/Toast';
import { isStorageAvailable } from '@/services/storage';
import { StorageError } from '@/types/errors';

export default function App() {
  const {
    tasks,
    addTask: rawAddTask,
    toggleTask: rawToggleTask,
    updateTask: rawUpdateTask,
    removeTask: rawRemoveTask,
    batchRemoveTasks: rawBatchRemoveTasks,
    refresh,
  } = useTasks();
  const { filter, setFilter, refresh: refreshFilter } = useFilter();
  const {
    selectedIds,
    isSelected,
    toggle,
    selectAll,
    clear,
    selectedCount,
  } = useSelection();

  const [batchMode, setBatchMode] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  // 隐私模式 / localStorage 不可用检测（启动时一次性）
  useEffect(() => {
    if (!isStorageAvailable()) {
      setStorageUnavailable(true);
      console.warn('[todoapp] localStorage 不可用，数据无法持久化');
      setToast({
        type: 'warning',
        message: '当前环境无法持久化数据，刷新页面后任务将丢失',
      });
    }
  }, []);

  // 跨标签页同步：其他标签页修改 localStorage 时刷新本页状态（任务 + 筛选）
  const handleCrossTabChange = useCallback(() => {
    refresh();
    refreshFilter();
  }, [refresh, refreshFilter]);

  useCrossTabSync(handleCrossTabChange);

  // 包装 actions：捕获 StorageError 显示 toast
  const wrapAction = useCallback(
    (fn) => (...args) => {
      try {
        return fn(...args);
      } catch (error) {
        if (error instanceof StorageError) {
          setToast({ type: 'error', message: error.message });
          refresh();
        } else {
          throw error;
        }
      }
    },
    [refresh],
  );

  const addTask = wrapAction(rawAddTask);
  const toggleTask = wrapAction(rawToggleTask);
  const updateTask = wrapAction(rawUpdateTask);
  const removeTask = wrapAction(rawRemoveTask);
  const batchRemoveTasks = wrapAction(rawBatchRemoveTasks);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks],
  );

  const visibleIds = useMemo(
    () =>
      tasks
        .filter((task) => {
          if (filter === 'active') return !task.completed;
          if (filter === 'completed') return task.completed;
          return true;
        })
        .map((t) => t.id),
    [tasks, filter],
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const handleEnterBatch = () => setBatchMode(true);

  const handleExitBatch = () => {
    setBatchMode(false);
    clear();
  };

  const handleSelectAllVisible = () => selectAll(visibleIds);

  const handleBatchDeleteClick = () => setBatchDeleteOpen(true);

  const handleBatchDeleteConfirm = () => {
    const existingIds = new Set(tasks.map((t) => t.id));
    const validIds = Array.from(selectedIds).filter((id) => existingIds.has(id));
    try {
      batchRemoveTasks(validIds);
      clear();
      setBatchDeleteOpen(false);
    } catch (error) {
      if (error instanceof StorageError) {
        setToast({ type: 'error', message: error.message });
      } else {
        throw error;
      }
    }
  };

  const handleBatchDeleteCancel = () => setBatchDeleteOpen(false);

  const existingSelectedCount = useMemo(() => {
    const existingIds = new Set(tasks.map((t) => t.id));
    let count = 0;
    for (const id of selectedIds) {
      if (existingIds.has(id)) count++;
    }
    return count;
  }, [selectedIds, tasks]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">任务清单</h1>
            <p className="text-muted text-sm mt-1">简洁高效地管理你的任务</p>
            {storageUnavailable && (
              <p className="text-yellow-600 text-xs mt-1" role="alert">
                ⚠ 当前环境无法持久化数据
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!batchMode && tasks.length > 0 && (
              <button
                type="button"
                onClick={handleEnterBatch}
                className="px-3 py-1.5 text-sm border border-border rounded-md hover:bg-surface transition-colors text-muted"
              >
                批量操作
              </button>
            )}
            {!batchMode && <SettingsMenu tasks={tasks} onImported={refresh} />}
          </div>
        </header>

        {!batchMode && <AddTaskForm onAdd={addTask} />}

        <FilterTabs current={filter} onChange={setFilter} counts={counts} />

        {batchMode && (
          <BatchToolbar
            selectedCount={selectedCount}
            visibleCount={visibleIds.length}
            allVisibleSelected={allVisibleSelected}
            onSelectAll={handleSelectAllVisible}
            onClearSelection={() => selectAll(visibleIds)}
            onDeleteSelected={handleBatchDeleteClick}
            onExit={handleExitBatch}
          />
        )}

        <TaskList
          tasks={tasks}
          filter={filter}
          onToggle={toggleTask}
          onUpdate={updateTask}
          onDelete={removeTask}
          onTaskDeletedInAnotherTab={refresh}
          batchMode={batchMode}
          isSelected={isSelected}
          onToggleSelect={toggle}
        />

        {batchDeleteOpen && (
          <ConfirmDialog
            message={`确定要删除选中的 ${existingSelectedCount} 条任务吗？`}
            onConfirm={handleBatchDeleteConfirm}
            onCancel={handleBatchDeleteCancel}
          />
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}
