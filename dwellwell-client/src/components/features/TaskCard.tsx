//dwellwell-client/src/components/features/TaskCard.tsx
import { useState } from 'react';
import { api } from '@/utils/api';
import { Task } from '@shared/types/task';
import { categoryGradients } from '../../data/mockTasks';

type Props = {
  task: Task;
  onStatusChange: (id: string, newStatus: Task['status'] | 'remind', days?: number) => void;
};

const categoryIcons: Record<string, string> = {
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

export default function TaskCard({ task, onStatusChange }: Props) {
  const icon = task.category ? categoryIcons[task.category] ?? '📌' : '📌';
  const [showDetails, setShowDetails] = useState(false);

  const statusStyles = {
    PENDING: 'border-blue-400',
    COMPLETED: 'border-green-500 text-green-700',
    SKIPPED: 'border-yellow-500 text-yellow-700 italic',
  } as const;

  const handleAndCollapse = (newStatus: Task['status'] | 'remind', days?: number) => {
    setShowDetails(false);
    onStatusChange(task.id, newStatus, days);
  };

  const gradient = categoryGradients[task.category || 'general'];

  // Lifecycle helpers
  const pauseTask = async () => {
    try {
      await api.post(`/tasks/${task.id}/pause`);
      onStatusChange(task.id, task.status);
    } catch (e) {
      console.error('Failed to pause task', e);
    }
  };

  const resumeTask = async () => {
    try {
      await api.post(`/tasks/${task.id}/resume`, { mode: 'forward' });
      onStatusChange(task.id, task.status);
    } catch (e) {
      console.error('Failed to resume task', e);
    }
  };

  const archiveTask = async () => {
    try {
      await api.post(`/tasks/${task.id}/archive`);
      onStatusChange(task.id, task.status);
    } catch (e) {
      console.error('Failed to archive task', e);
    }
  };

  const unarchiveTask = async () => {
    try {
      await api.post(`/tasks/${task.id}/unarchive`, { mode: 'forward' });
      onStatusChange(task.id, task.status);
    } catch (e) {
      console.error('Failed to unarchive task', e);
    }
  };

  const pausedAt = (task as any).pausedAt as string | undefined;
  const archivedAt = (task as any).archivedAt as string | undefined;

  return (
    <div
      onClick={() => setShowDetails(prev => !prev)}
      className={`cursor-pointer bg-gradient-to-br ${gradient} border-l-4 border border-token shadow p-4 rounded-2xl flex flex-col justify-between transition-shadow duration-300 hover:shadow-md ${statusStyles[task.status]}`}
    >
      <div className="mb-2">
        <div className="flex items-center gap-2 text-2xl text-body">
          {icon}
          <h3 className={`text-lg font-semibold ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
            {task.title}
          </h3>

          {/* Lifecycle chips */}
          {pausedAt && (
            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              Paused
            </span>
          )}
          {archivedAt && (
            <span className="ml-2 text-xs bg-surface-alt text-gray-700 px-2 py-0.5 rounded-full">
              Archived
            </span>
          )}
        </div>

        {task.itemName && (
          <p className="text-sm text-muted mt-1">🛠 {task.itemName}</p>
        )}

        <div className="mt-2 text-sm text-muted space-y-1">
          <div>
            📅 Finish by <span className="font-medium text-body">{task.dueDate}</span>
          </div>
          {task.estimatedTimeMinutes ? (
            <div>⏱ {task.estimatedTimeMinutes} min task</div>
          ) : null}
        </div>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          showDetails ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-surface-alt border border-token p-3 rounded text-sm space-y-2 text-body">
          {task.description && <p>{task.description}</p>}

          {task.recurrenceInterval && (
            <p>
              🔁 <strong>Recommended Frequency:</strong> {task.recurrenceInterval}
            </p>
          )}

          {task.criticality && (
            <p>
              🚨 <strong>Importance:</strong>{' '}
              {task.criticality.charAt(0).toUpperCase() + task.criticality.slice(1)}
            </p>
          )}

          {typeof task.deferLimitDays === 'number' && (
            <p>
              🕓 Can be safely delayed up to <strong>{task.deferLimitDays} days</strong>
            </p>
          )}

          {typeof task.estimatedCost === 'number' && (
            <p>
              💵 Estimated Cost: <strong>${task.estimatedCost}</strong>
            </p>
          )}

          {task.canBeOutsourced && (
            <p>
              🧰 This task <strong>can be outsourced</strong> to a professional
            </p>
          )}

          {task.location && (
            <p>
              📍 Location: <strong>{task.location}</strong>
            </p>
          )}

          {task.steps && task.steps.length > 0 && (
            <div>
              <p className="font-medium mb-1">Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                {task.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {task.equipmentNeeded && task.equipmentNeeded.length > 0 && (
            <div>
              <p className="font-medium mb-1">You'll Need:</p>
              <ul className="list-disc list-inside space-y-1">
                {task.equipmentNeeded.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {task.resources && task.resources.length > 0 && (
            <div>
              <p className="font-medium mb-1">Helpful Links:</p>
              <ul className="list-disc list-inside space-y-1">
                {task.resources.map((res, idx) => (
                  <li key={idx}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[rgb(var(--primary))] underline"
                    >
                      {res.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {task.imageUrl && (
            <img
              src={task.imageUrl}
              alt="Task item"
              className="mt-2 w-full max-h-48 object-cover rounded"
            />
          )}
        </div>
      </div>

      <div
        className="flex flex-wrap gap-2 mt-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Primary status actions */}
        {task.status === 'PENDING' && !pausedAt && !archivedAt && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLButtonElement).classList.add('scale-105');
                setTimeout(() => {
                  (e.currentTarget as HTMLButtonElement).classList.remove('scale-105');
                }, 150);
                handleAndCollapse('COMPLETED');
              }}
              className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm transition-transform duration-150 ease-in-out"
            >
              ✅ Mark Complete
            </button>
            <button
              onClick={() => handleAndCollapse('SKIPPED')}
              className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
            >
              ⏭ Skip
            </button>
            <button
              onClick={() => handleAndCollapse('remind', 3)}
              className="px-3 py-1 bg-surface-alt text-body rounded hover:bg-card border border-token text-sm"
            >
              🕓 Remind Me Later
            </button>
          </>
        )}

        {(task.status === 'COMPLETED' || task.status === 'SKIPPED') && !archivedAt && (
          <button
            onClick={() => onStatusChange(task.id, 'PENDING')}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            🔄 Reopen Task
          </button>
        )}

        {/* Lifecycle controls */}
        {!archivedAt && !pausedAt && (
          <button
            onClick={pauseTask}
            className="px-3 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 text-sm"
          >
            ⏸ Pause
          </button>
        )}

        {pausedAt && !archivedAt && (
          <button
            onClick={resumeTask}
            className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 text-sm"
          >
            ▶️ Resume
          </button>
        )}

        {!archivedAt ? (
          <button
            onClick={archiveTask}
            className="px-3 py-1 bg-surface-alt text-body rounded hover:bg-card border border-token text-sm"
          >
            🗄 Archive
          </button>
        ) : (
          <button
            onClick={unarchiveTask}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            ♻️ Unarchive
          </button>
        )}
      </div>
    </div>
  );
}
