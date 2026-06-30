import { useState } from 'react';
import { LIMITS } from '@/constants/storage';

/**
 * 编辑态任务行：标题/描述输入 + 保存/取消按钮 + 校验。
 * @param {{
 *   task: import('@/types/task').Task,
 *   onSave: (input: { id: string, title: string, description: string }) => void,
 *   onCancel: () => void,
 * }} props
 */
export function TaskItemEdit({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [error, setError] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError('请输入任务标题');
      return;
    }
    onSave({ id: task.id, title: trimmedTitle, description });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (error) setError('');
  };

  return (
    <form
      onSubmit={handleSave}
      className="p-3 border-b border-border last:border-b-0 bg-background/50"
      data-testid="task-edit-form"
    >
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            maxLength={LIMITS.TITLE_MAX}
            aria-label="编辑任务标题"
            className="w-full px-2 py-1 border border-primary rounded-md focus:outline-none focus:border-primaryHover bg-surface pr-14"
            autoFocus
          />
          {title.length > 0 && (
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
              title.length > LIMITS.TITLE_MAX * 0.9 ? 'text-danger' : 'text-muted'
            }`}>
              {title.length}/{LIMITS.TITLE_MAX}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={LIMITS.DESCRIPTION_MAX}
            placeholder="描述（可选）"
            aria-label="编辑任务描述"
            className="w-full px-2 py-1 border border-primary rounded-md focus:outline-none focus:border-primaryHover bg-surface pr-14"
          />
          {description.length > 0 && (
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs ${
              description.length > LIMITS.DESCRIPTION_MAX * 0.9 ? 'text-danger' : 'text-muted'
            }`}>
              {description.length}/{LIMITS.DESCRIPTION_MAX}
            </span>
          )}
        </div>
        {error && (
          <p role="alert" className="text-danger text-sm">
            {error}
          </p>
        )}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-muted border border-border rounded-md hover:bg-surface transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primaryHover transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </form>
  );
}
