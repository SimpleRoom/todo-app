import { useEffect, useRef } from 'react';

/**
 * 通用二次确认弹窗。通过 props 控制显示。
 * @param {{
 *   message: string,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export function ConfirmDialog({ message, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  // Esc 键取消
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // 自动聚焦确认按钮
    confirmRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleOverlayClick = (e) => {
    // 仅点击遮罩层本身（非内部内容）时取消
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      data-testid="confirm-dialog-overlay"
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-surface rounded-lg shadow-card p-6 max-w-sm w-full"
      >
        <p className="text-text mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-muted border border-border rounded-md hover:bg-background transition-colors"
          >
            取消
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-danger text-white rounded-md hover:bg-dangerHover transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
