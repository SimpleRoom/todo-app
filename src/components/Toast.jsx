import { useEffect } from 'react';

/**
 * 全局 Toast 通知。
 * @param {{
 *   toast: { type: 'success' | 'error' | 'warning', message: string } | null,
 *   onClose: () => void,
 *   duration?: number,
 * }} props
 */
export function Toast({ toast, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const bgClass = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-yellow-500 text-white',
  }[toast.type] || 'bg-text text-white';

  return (
    <div
      role="status"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-card z-50 max-w-md ${bgClass}`}
    >
      {toast.message}
    </div>
  );
}
