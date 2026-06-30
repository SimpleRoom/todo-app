import { useState, useRef, useEffect } from 'react';
import { exportTasks, parseImportFile, triggerDownload } from '@/services/importExport';
import { importTasks } from '@/services/taskRepository';
import { ImportFormatError } from '@/types/errors';

/**
 * 设置入口：导出/导入数据。
 * @param {{
 *   tasks: import('@/types/task').Task[],
 *   onImported: () => void,
 * }} props
 */
export function SettingsMenu({ tasks, onImported }) {
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // toast 自动消失
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleExport = () => {
    const { filename, content } = exportTasks(tasks);
    triggerDownload(filename, content);
    setIsOpen(false);
    setToast({ type: 'success', message: '已导出全部任务' });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      try {
        const { tasks: parsedTasks, invalid } = parseImportFile(text);
        const result = importTasks(parsedTasks);
        setToast({
          type: 'success',
          message: `成功导入 ${result.imported} 条，跳过 ${invalid + result.skipped} 条无效记录`,
        });
        onImported();
      } catch (error) {
        if (error instanceof ImportFormatError) {
          setToast({ type: 'error', message: '文件格式无效，请选择有效的备份文件' });
        } else {
          setToast({ type: 'error', message: error.message || '导入失败' });
        }
      }
      // 重置 input 以便相同文件可重复选择
      e.target.value = '';
      setIsOpen(false);
    };
    reader.onerror = () => {
      setToast({ type: 'error', message: '文件读取失败' });
      e.target.value = '';
      setIsOpen(false);
    };
    reader.readAsText(file);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted hover:text-text rounded-md hover:bg-background transition-colors"
        aria-label="设置"
        aria-expanded={isOpen}
      >
        {/* 齿轮图标 (内联 SVG，避免额外依赖) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-surface rounded-md shadow-card border border-border z-20 py-1">
          <button
            type="button"
            onClick={handleExport}
            className="block w-full text-left px-3 py-2 text-sm text-text hover:bg-background transition-colors"
          >
            导出数据
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="block w-full text-left px-3 py-2 text-sm text-text hover:bg-background transition-colors"
          >
            导入数据
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md shadow-card z-50 ${
            toast.type === 'success'
              ? 'bg-success text-white'
              : 'bg-danger text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
