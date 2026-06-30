/**
 * @param {{
 *   current: import('@/types/task').FilterState,
 *   onChange: (filter: import('@/types/task').FilterState) => void,
 *   counts?: { all: number, active: number, completed: number },
 * }} props
 */
export function FilterTabs({ current, onChange, counts }) {
  const tabs = [
    { key: 'all', label: '全部', count: counts?.all },
    { key: 'active', label: '未完成', count: counts?.active },
    { key: 'completed', label: '已完成', count: counts?.completed },
  ];

  return (
    <div className="flex gap-1 mb-4 bg-surface p-1 rounded-lg shadow-subtle">
      {tabs.map((tab) => {
        const isActive = current === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              isActive
                ? 'bg-primary text-white'
                : 'text-muted hover:text-text hover:bg-background'
            }`}
            aria-pressed={isActive}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20' : 'bg-background'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
