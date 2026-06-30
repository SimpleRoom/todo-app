import { STORAGE_KEYS } from '@/constants/storage';
import { safeGet, safeSet } from './storage';

const VALID_FILTERS = ['all', 'active', 'completed'];

/**
 * 读取当前筛选状态。读取失败或值非法 → 返回 "all"。
 * @returns {import('@/types/task').FilterState}
 */
export function getFilter() {
  const value = safeGet(STORAGE_KEYS.FILTER, null);
  if (value && VALID_FILTERS.includes(value)) {
    return value;
  }
  return 'all';
}

/**
 * 持久化筛选状态。
 * @param {import('@/types/task').FilterState} filter
 */
export function setFilter(filter) {
  safeSet(STORAGE_KEYS.FILTER, filter);
}
