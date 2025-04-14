import { useState } from 'react';
import TaskCard from '../components/TaskCard';
import { initialTasks } from '../data/mockTasks';
import { TaskCategory, TaskStatus } from '../../../shared/task';

const categoryIcons: Record<TaskCategory, string> = {
  appliance: '🔧',
  bathroom: '🛁',
  cooling: '❄️',
  electrical: '💡',
  flooring: '🧹',
  garage: '🚗',
  general: '📌',
  heating: '🔥',
  kitchen: '🍽️',
  outdoor: '🌿',
  plumbing: '🚿',
  safety: '🛑',
  windows: '🪟',
};

type ViewMode = 'grouped' | 'flat';
type Timeframe = 'week' | 'month' | 'year';

export default function Dashboard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('dwellwell-view') as ViewMode) || 'grouped'
  );
  const [timeframe, setTimeframe] = useState<Timeframe>('week');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const now = new Date();

  const isInCurrentTimeframe = (dateStr: string) => {
    const taskDate = new Date(dateStr);
    if (timeframe === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    } else if (timeframe === 'month') {
      return (
        taskDate.getFullYear() === now.getFullYear() &&
        taskDate.getMonth() === now.getMonth()
      );
    } else if (timeframe === 'year') {
      return taskDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const visibleTasks = tasks.filter(task => isInCurrentTimeframe(task.dueDate));

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('dwellwell-view', mode);
  };

  const handleStatusChange = (
    id: string,
    newStatus: TaskStatus | 'remind',
    days?: number
  ) => {
    setTasks(prev => {
      const updated = prev.map(task =>
        task.id === id
          ? {
            ...task,
            status: newStatus === 'remind' ? task.status : newStatus,
            dueDate:
              newStatus === 'remind' && days
                ? new Date(
                  new Date(task.dueDate).getTime() + days * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .split('T')[0]
                : task.dueDate,
            completedDate:
              newStatus === 'completed'
                ? new Date().toISOString().split('T')[0]
                : task.completedDate,
          }
          : task
      );

      const updatedTask = updated.find(t => t.id === id);
      if (updatedTask?.itemName) {
        // Only check visible tasks in this group for auto-collapse
        const relatedTasks = updated.filter(t =>
          t.itemName === updatedTask.itemName && isInCurrentTimeframe(t.dueDate)
        );

        const allDone = relatedTasks.every(t => t.status !== 'upcoming');
        if (allDone) {
          setTimeout(() => {
            setCollapsedGroups(prev => ({
              ...prev,
              [updatedTask.itemName!]: true,
            }));
          }, 1500);
        }
      }

      return updated;
    });
  };


  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const groupedTasks: Record<string, typeof tasks> = {};
  visibleTasks.forEach(task => {
    const key = task.itemName || 'General';
    if (!groupedTasks[key]) {
      groupedTasks[key] = [];
    }
    groupedTasks[key].push(task);
  });

  return (
    <div className="space-y-8 bg-brand-background p-4 sm:p-2 rounded">
      <div>
        <h1 className="text-3xl font-bold text-brand-primary">Dashboard</h1>
        <p className="text-brand-foreground">
          Welcome back! Here’s what’s coming up.
        </p>
      </div>

      {/* View and Timeframe Controls */}
      <div className="flex flex-wrap gap-6 items-center mt-2">
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-brand-foreground">View:</label>
          <button
            onClick={() => handleViewChange('grouped')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'grouped'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Grouped
          </button>
          <button
            onClick={() => handleViewChange('flat')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'flat'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Flat
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium text-brand-foreground">Timeframe:</label>
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3 py-1 rounded text-sm ${timeframe === 'week'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3 py-1 rounded text-sm ${timeframe === 'month'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeframe('year')}
            className={`px-3 py-1 rounded text-sm ${timeframe === 'year'
                ? 'bg-brand-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* All Tasks Complete Message */}
      {visibleTasks.length > 0 && visibleTasks.every(t => t.status !== 'PENDING') && (
        <section className="bg-green-50 border border-green-200 rounded-xl p-6 shadow text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-2">🎉 All Tasks Complete!</h2>
          <p className="text-gray-700 text-sm">You’ve crushed every task for this {timeframe}. Kick back and relax!</p>
        </section>
      )}

      {/* Tasks */}
      <section>
        <h2 className="text-xl font-semibold text-brand-foreground mb-4">🛠️ Your Tasks</h2>

        {viewMode === 'grouped' ? (
          <>
            {Object.entries(groupedTasks).map(([itemName, tasks]) => {
              const category = tasks[0].category || 'general';
              const icon = categoryIcons[category as TaskCategory];

              const total = tasks.length;
              const completed = tasks.filter(t => t.status === 'COMPLETED').length;
              const skipped = tasks.filter(t => t.status === 'SKIPPED').length;
              const done = completed + skipped;
              const percent = Math.round((done / total) * 100);

              const isCollapsed = collapsedGroups[itemName];

              return (
                <div key={itemName} className="mb-6">
                  <div
                    className="flex items-center justify-between mb-2 cursor-pointer select-none"
                    onClick={() => toggleGroup(itemName)}
                  >
                    <h3 className="text-lg font-semibold text-brand-foreground flex items-center gap-2">
                      <span>{icon}</span> {itemName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{percent}% complete</span>
                      <span
                        className={`transform transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'
                          }`}
                      >
                        ▶️
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded mb-3 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${percent === 100
                          ? 'bg-emerald-500'
                          : percent >= 75
                            ? 'bg-lime-400'
                            : percent >= 50
                              ? 'bg-yellow-400'
                              : percent >= 25
                                ? 'bg-orange-400'
                                : 'bg-red-500'
                        }`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>

                  {!isCollapsed && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tasks.map(task => (
                        <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...visibleTasks]
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .map(task => (
                <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
