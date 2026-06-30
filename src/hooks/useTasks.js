import { useState, useCallback, useEffect } from 'react';
import {
  getAllTasks,
  addTask,
  toggleTask,
  updateTask,
  removeTask,
  batchRemoveTasks,
} from '@/services/taskRepository';

/**
 * @typedef {import('@/types/task').Task} Task
 */

/**
 * 任务列表状态 + actions hook。
 * 在挂载时从 taskRepository 读取初始状态，actions 同步写入并更新本地 state。
 * @returns {{
 *   tasks: Task[],
 *   addTask: (input: {title: string, description: string}) => Task,
 *   toggleTask: (id: string) => void,
 *   updateTask: (id: string, patch: {title: string, description: string}) => Task,
 *   removeTask: (id: string) => void,
 *   batchRemoveTasks: (ids: string[]) => string[],
 *   refresh: () => void,
 * }}
 */
export function useTasks() {
  const [tasks, setTasks] = useState(() => getAllTasks());

  const refresh = useCallback(() => {
    setTasks(getAllTasks());
  }, []);

  const handleAddTask = useCallback((input) => {
    const newTask = addTask(input);
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  }, []);

  const handleToggleTask = useCallback((id) => {
    const updated = toggleTask(id);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  }, []);

  const handleUpdateTask = useCallback((id, patch) => {
    const updated = updateTask(id, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const handleRemoveTask = useCallback((id) => {
    removeTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleBatchRemoveTasks = useCallback((ids) => {
    const removed = batchRemoveTasks(ids);
    if (removed.length > 0) {
      const removedSet = new Set(removed);
      setTasks((prev) => prev.filter((t) => !removedSet.has(t.id)));
    }
    return removed;
  }, []);

  // 挂载时同步一次（防止 SSR/CSR 差异，本应用无 SSR 但保持一致性）
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    tasks,
    addTask: handleAddTask,
    toggleTask: handleToggleTask,
    updateTask: handleUpdateTask,
    removeTask: handleRemoveTask,
    batchRemoveTasks: handleBatchRemoveTasks,
    refresh,
  };
}
