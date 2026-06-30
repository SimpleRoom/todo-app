import { STORAGE_KEYS } from '@/constants/storage';
import { readTasksEnvelope, writeTasksEnvelope } from './storage';
import { generateId } from '@/utils/id';
import { validateTitle, validateDescription } from '@/utils/validation';
import { ValidationError, NotFoundError, StorageError } from '@/types/errors';

/**
 * 读取全部任务，按 createdAt 倒序返回。
 * @returns {import('@/types/task').Task[]}
 */
export function getAllTasks() {
  const tasks = readTasksEnvelope();
  return [...tasks].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * 新增任务并立即持久化。
 * @param {{title: string, description: string}} input
 * @returns {import('@/types/task').Task}
 */
export function addTask(input) {
  const title = validateTitle(input.title);
  const description = validateDescription(input.description);
  const task = {
    id: generateId(),
    title,
    description,
    completed: false,
    createdAt: Date.now(),
  };
  const tasks = readTasksEnvelope();
  tasks.unshift(task);
  if (!writeTasksEnvelope(tasks)) {
    throw new StorageError('存储空间已满，请删除部分任务后重试');
  }
  return task;
}

/**
 * 更新任务标题与描述，保留 id/createdAt/completed。
 * @param {string} id
 * @param {{title: string, description: string}} patch
 * @returns {import('@/types/task').Task}
 */
export function updateTask(id, patch) {
  const title = validateTitle(patch.title);
  const description = validateDescription(patch.description);
  const tasks = readTasksEnvelope();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new NotFoundError(id);
  }
  const updated = { ...tasks[index], title, description };
  tasks[index] = updated;
  if (!writeTasksEnvelope(tasks)) {
    throw new StorageError('存储空间已满，请删除部分任务后重试');
  }
  return updated;
}

/**
 * 切换任务完成状态。
 * @param {string} id
 * @returns {import('@/types/task').Task}
 */
export function toggleTask(id) {
  const tasks = readTasksEnvelope();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new NotFoundError(id);
  }
  const updated = { ...tasks[index], completed: !tasks[index].completed };
  tasks[index] = updated;
  if (!writeTasksEnvelope(tasks)) {
    throw new StorageError('存储空间已满，请删除部分任务后重试');
  }
  return updated;
}

/**
 * 删除单条任务。
 * @param {string} id
 */
export function removeTask(id) {
  const tasks = readTasksEnvelope();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new NotFoundError(id);
  }
  tasks.splice(index, 1);
  if (!writeTasksEnvelope(tasks)) {
    throw new StorageError('存储空间已满，请删除部分任务后重试');
  }
}

/**
 * 批量删除任务。返回实际删除的 id 数组。
 * @param {string[]} ids
 * @returns {string[]}
 */
export function batchRemoveTasks(ids) {
  if (ids.length === 0) return [];
  const tasks = readTasksEnvelope();
  const idSet = new Set(ids);
  const removed = [];
  const remaining = tasks.filter((t) => {
    if (idSet.has(t.id)) {
      removed.push(t.id);
      return false;
    }
    return true;
  });
  if (removed.length === 0) return [];
  if (!writeTasksEnvelope(remaining)) {
    throw new StorageError('存储空间已满，请删除部分任务后重试');
  }
  return removed;
}

/**
 * 合并导入任务到本地列表。
 * - id 重复 → 跳过（保留本地版本）
 * - 新 id → 添加
 * @param {import('@/types/task').Task[]} tasks
 * @returns {{imported: number, skipped: number}}
 */
export function importTasks(tasks) {
  if (tasks.length === 0) {
    return { imported: 0, skipped: 0 };
  }
  const existing = readTasksEnvelope();
  const existingIds = new Set(existing.map((t) => t.id));
  let imported = 0;
  let skipped = 0;
  for (const task of tasks) {
    if (existingIds.has(task.id)) {
      skipped++;
      continue;
    }
    existing.push(task);
    existingIds.add(task.id);
    imported++;
  }
  if (imported > 0) {
    if (!writeTasksEnvelope(existing)) {
      throw new StorageError('存储空间已满，请删除部分任务后重试');
    }
  }
  return { imported, skipped };
}

/**
 * 订阅跨标签页变更通知（基于 window 'storage' 事件）。
 * 仅当相关键变更时触发 listener。
 * 返回取消订阅函数。
 * @param {() => void} listener
 * @returns {() => void}
 */
export function subscribe(listener) {
  const handler = (event) => {
    if (event.key === STORAGE_KEYS.TASKS || event.key === STORAGE_KEYS.FILTER) {
      listener();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// 仅用于测试：直接清空存储（不导出给业务层）
export function _clearAllForTests() {
  try {
    window.localStorage.removeItem(STORAGE_KEYS.TASKS);
    window.localStorage.removeItem(STORAGE_KEYS.FILTER);
  } catch {
    // ignore
  }
}

export { ValidationError, NotFoundError, StorageError };
