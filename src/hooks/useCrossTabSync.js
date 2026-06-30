import { useEffect } from 'react';
import { subscribe } from '@/services/taskRepository';

/**
 * 跨标签页同步 hook。
 * 订阅 taskRepository 的 storage 事件，当其他标签页修改 localStorage 时触发 refresh。
 * 注意：storage 事件仅在"其他"标签页修改时触发，当前标签页的修改由 React state 自身更新流程覆盖。
 *
 * @param {() => void} refresh - 收到通知时调用的刷新函数（通常是 useTasks/useFilter 的 refresh）
 */
export function useCrossTabSync(refresh) {
  useEffect(() => {
    const unsubscribe = subscribe(() => {
      refresh();
    });
    return unsubscribe;
  }, [refresh]);
}
