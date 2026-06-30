import { useState } from 'react';
import { LIMITS } from '@/constants/storage';

/**
 * @param {{ onAdd: (input: {title: string, description: string}) => void }} props
 */
export function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      setError('请输入任务标题');
      return;
    }
    onAdd({ title: trimmedTitle, description });
    setTitle('');
    setDescription('');
    setError('');
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (error) setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-lg shadow-card p-4 mb-4">
      <div className="flex flex-col gap-2">
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="请输入任务标题"
            maxLength={LIMITS.TITLE_MAX}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
            aria-label="任务标题"
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
            placeholder="描述（可选）"
            maxLength={LIMITS.DESCRIPTION_MAX}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:border-primary"
            aria-label="任务描述"
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
        <button
          type="submit"
          className="self-end px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryHover transition-colors"
        >
          添加
        </button>
      </div>
    </form>
  );
}
