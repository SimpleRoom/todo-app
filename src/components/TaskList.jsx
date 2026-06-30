import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';

const EMPTY_MESSAGES = {
  all: '还没有任务，添加第一条吧',
  active: '暂无未完成任务',
  completed: '暂无已完成任务',
};

/**
 * @param {{
 *   tasks: import('@/types/task').Task[],
 *   filter: import('@/types/task').FilterState,
 *   onToggle?: (id: string) => void,
 *   onUpdate?: (id: string, patch: {title: string, description: string}) => void,
 *   onDelete?: (id: string) => void,
 *   onTaskDeletedInAnotherTab?: () => void,
 *   batchMode?: boolean,
 *   isSelected?: (id: string) => boolean,
 *   onToggleSelect?: (id: string) => void,
 * }} props
 */
export function TaskList({
  tasks,
  filter,
  onToggle,
  onUpdate,
  onDelete,
  onTaskDeletedInAnotherTab,
  batchMode = false,
  isSelected = () => false,
  onToggleSelect,
}) {
  const filtered = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  if (filtered.length === 0) {
    return <EmptyState message={EMPTY_MESSAGES[filter]} />;
  }

  return (
    <ul className="bg-surface rounded-lg shadow-card divide-y divide-border" role="list">
      {filtered.map((task) => (
        <li key={task.id} role="listitem">
          <TaskItem
            task={task}
            onToggle={onToggle}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDeletedInAnotherTab={onTaskDeletedInAnotherTab}
            batchMode={batchMode}
            isSelected={isSelected(task.id)}
            onToggleSelect={onToggleSelect}
          />
        </li>
      ))}
    </ul>
  );
}
