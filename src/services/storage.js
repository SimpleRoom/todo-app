import { STORAGE_KEYS, STORAGE_VERSION } from '@/constants/storage';

/**
 * 检测 localStorage 是否可用（隐私模式、禁用场景）。
 * 通过 try/catch 写入测试键判定。
 * @returns {boolean}
 */
export function isStorageAvailable() {
  try {
    const testKey = '__todoapp_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全读取并反序列化 JSON 值。永不抛出。
 * - localStorage 不可用 → 返回 fallback
 * - 键不存在 → 返回 fallback
 * - JSON 解析失败 → 控制台告警 + 返回 fallback
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @returns {T}
 */
export function safeGet(key, fallback) {
  try {
    if (!isStorageAvailable()) {
      return fallback;
    }
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[storage] 读取键 ${key} 失败:`, error);
    return fallback;
  }
}

/**
 * 安全序列化并写入 JSON 值。永不抛出。
 * - 写入失败（配额超限、隐私模式）→ 控制台告警 + 返回 false
 * - 成功 → 返回 true
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function safeSet(key, value) {
  try {
    if (!isStorageAvailable()) {
      console.warn(`[storage] localStorage 不可用，无法写入键 ${key}`);
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`[storage] 写入键 ${key} 失败:`, error);
    return false;
  }
}

/**
 * 读取任务数组（解包 envelope，容错降级）。
 * @param {string} [key]
 * @returns {any[]}
 */
export function readTasksEnvelope(key = STORAGE_KEYS.TASKS) {
  const fallback = [];
  const envelope = safeGet(key, null);
  if (envelope === null) {
    return fallback;
  }
  // 兼容三种历史格式：null、纯数组、{version, tasks} envelope
  if (Array.isArray(envelope)) {
    return envelope;
  }
  if (
    typeof envelope === 'object' &&
    envelope !== null &&
    'tasks' in envelope &&
    Array.isArray(envelope.tasks)
  ) {
    return envelope.tasks;
  }
  console.warn('[storage] 任务数据格式异常，已降级为空数组');
  return fallback;
}

/**
 * 写入任务数组（包装为 envelope）。
 * @param {any[]} tasks
 * @param {string} [key]
 * @returns {boolean}
 */
export function writeTasksEnvelope(tasks, key = STORAGE_KEYS.TASKS) {
  return safeSet(key, { version: STORAGE_VERSION, tasks });
}
