import { useState, useCallback, useEffect } from 'react';
import { getFilter, setFilter } from '@/services/filterRepository';

/**
 * 筛选状态 hook。读写均通过 filterRepository，自动持久化。
 * @returns {{
 *   filter: import('@/types/task').FilterState,
 *   setFilter: (filter: import('@/types/task').FilterState) => void,
 *   refresh: () => void,
 * }}
 */
export function useFilter() {
  const [filter, setFilterState] = useState(() => getFilter());

  const refresh = useCallback(() => {
    setFilterState(getFilter());
  }, []);

  const changeFilter = useCallback((next) => {
    setFilter(next);
    setFilterState(next);
  }, []);

  // 挂载时同步一次
  useEffect(() => {
    setFilterState(getFilter());
  }, []);

  return { filter, setFilter: changeFilter, refresh };
}
