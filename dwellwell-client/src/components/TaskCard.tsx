import { useState } from 'react';
import { Task } from '@shared/types/task';
import { categoryGradients } from '../data/mockTasks';

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
  const icon = task.category ? categoryIcons[task.category] : '📌';
  const [showDetails, setShowDetails] = useState(false);

  const statusStyles = {
    PENDING: 'border-blue-400',
    COMPLETED: 'border-green-500 text-green-700',
    SKIPPED: 'border-yellow-500 text-yellow-700 italic',
  };

  const handleAndCollapse = (newStatus: Task['status'] | 'remind', days?: number) => {
    setShowDetails(false);
    onStatusChange(task.id, newStatus, days);
  };

  const gradient = categoryGradients[task.category || 'general'];

  return (
    <div
      onClick={() => setShowDetails(prev => !prev)}
      className={`cursor-pointer bg-gradient-to-br ${gradient} border-l-4 shadow p-4 rounded-2xl flex flex-col justify-between transition-shadow duration-300 hover:shadow-md ${statusStyles[task.status]}`}
    >
      <div className="mb-2">
        <div className="flex items-center gap-2 text-2xl">
          {icon}
          <h3 className={`text-lg font-semibold ${task.status === 'COMPLETED' ? 'line-through' : ''}`}>
            {task.title}
          </h3>
        </div>
        {task.itemName && (
          <p className="text-sm text-gray-500 mt-1">🛠 {task.itemName}</p>
        )}
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div>📅 Finish by <span className="font-medium">{task.dueDate}</span></div>
          {task.estimatedTimeMinutes && (
            <div>⏱ {task.estimatedTimeMinutes} min task</div>
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${showDetails ? 'max-h-[1000px] opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="bg-gray-50 border border-gray-200 p-3 rounded text-sm space-y-2 text-gray-700">
          {task.description && <p>{task.description}</p>}

          {task.recurrenceInterval && (
            <p>
              🔁 <strong>Recommended Frequency:</strong>{' '}
              {task.recurrenceInterval === 'every_n_days'
                ? `Every ${task.recurrenceInterval} days`
                : `Once per ${task.recurrenceInterval.replace('ly', '')}`}
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

          {task.steps && (
            <div>
              <p className="font-medium mb-1">Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                {task.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {task.equipmentNeeded && (
            <div>
              <p className="font-medium mb-1">You'll Need:</p>
              <ul className="list-disc list-inside space-y-1">
                {task.equipmentNeeded.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {task.resources && (
            <div>
              <p className="font-medium mb-1">Helpful Links:</p>
              <ul className="list-disc list-inside space-y-1">
                {task.resources.map((res, idx) => (
                  <li key={idx}>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
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
        {task.status === 'PENDING' && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.classList.add('scale-105');
                setTimeout(() => {
                  e.currentTarget.classList.remove('scale-105');
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
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
            >
              🕓 Remind Me Later
            </button>
          </>
        )}

        {(task.status === 'COMPLETED' || task.status === 'SKIPPED') && (
          <button
            onClick={() => onStatusChange(task.id, 'PENDING')}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
          >
            🔄 Reopen Task
          </button>
        )}
      </div>
    </div>
  );
}
