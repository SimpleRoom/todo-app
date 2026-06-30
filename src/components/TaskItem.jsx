import { useState } from 'react';
import { formatChineseDateTime } from '@/utils/datetime';
import { TaskItemEdit } from './TaskItemEdit';
import { ConfirmDialog } from './ConfirmDialog';
import { NotFoundError } from '@/types/errors';

/**
 * @param {{
 *   task: import('@/types/task').Task,
 *   onToggle?: (id: string) => void,
 *   onUpdate?: (id: string, patch: {title: string, description: string}) => void,
 *   onDelete?: (id: string) => void,
 *   onDeletedInAnotherTab?: () => void,
 *   batchMode?: boolean,
 *   isSelected?: boolean,
 *   onToggleSelect?: (id: string) => void,
 * }} props
 */
export function TaskItem({
  task,
  onToggle,
  onUpdate,
  onDelete,
  onDeletedInAnotherTab,
  batchMode = false,
  isSelected = false,
  onToggleSelect,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleSave = (input) => {
    try {
      onUpdate?.(input.id, { title: input.title, description: input.description });
      setIsEditing(false);
    } catch (error) {
      if (error instanceof NotFoundError) {
        alert('该任务已被删除');
        onDeletedInAnotherTab?.();
        return;
      }
      throw error;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    try {
      onDelete?.(task.id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        onDeletedInAnotherTab?.();
      } else {
        throw error;
      }
    }
    setIsDeleteDialogOpen(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  if (isEditing) {
    return <TaskItemEdit task={task} onSave={handleSave} onCancel={handleCancel} />;
  }

  return (
    <>
      <div
        data-testid="task-item-container"
        className={`p-3 border-b border-border last:border-b-0 ${
          task.completed ? 'opacity-60' : ''
        } ${batchMode && isSelected ? 'bg-primary/5' : ''}`}
      >
        <div className="flex items-start gap-2">
          {batchMode && (
            <input
              type="checkbox"
              data-testid="select-checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(task.id)}
              aria-label={`选择任务 ${task.title}`}
              className="mt-1 w-4 h-4 accent-primary cursor-pointer flex-shrink-0"
            />
          )}
          {!batchMode && (
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggle?.(task.id)}
              aria-label={task.title}
              className="mt-1 w-4 h-4 accent-success cursor-pointer flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3
              data-testid="task-title"
              className={`text-text font-medium break-words ${
                task.completed ? 'line-through' : ''
              }`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-muted text-sm mt-1 break-words whitespace-pre-wrap">
                {task.description}
              </p>
            )}
            <p className="text-muted text-xs mt-1">
              {formatChineseDateTime(task.createdAt)}
            </p>
          </div>
          {!batchMode && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-sm text-muted hover:text-primary transition-colors"
                aria-label="编辑"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-2 py-1 text-sm text-muted hover:text-danger transition-colors"
                aria-label="删除"
              >
                删除
              </button>
            </div>
          )}
        </div>
      </div>
      {isDeleteDialogOpen && (
        <ConfirmDialog
          message="确定要删除该任务吗？"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
}
