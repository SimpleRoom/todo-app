/**
 * @param {{ message?: string }} props
 */
export function EmptyState({ message = '还没有任务，添加第一条吧' }) {
  return (
    <div className="text-center py-12 text-muted" role="status">
      <p>{message}</p>
    </div>
  );
}
