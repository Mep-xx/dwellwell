//dwellwell-client/src/components/TrackableTaskModal.tsx
import { Task } from '@shared/types/task';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  trackableName: string;
};

export default function TrackableTaskModal({ isOpen, onClose, tasks, trackableName }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card text-body rounded-xl w-full max-w-2xl p-6 shadow-lg relative max-h-[80vh] overflow-y-auto border border-token">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted hover:text-body"
        >
          ✖️
        </button>

        <h2 className="text-2xl font-semibold mb-4 text-[rgb(var(--primary))]">
          Tasks for: {trackableName}
        </h2>

        {tasks.length === 0 ? (
          <p className="text-muted">No tasks found for this item.</p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li key={task.id} className="border border-token rounded-lg p-4 bg-surface-alt shadow-sm">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-lg">{task.title}</h3>
                  <span className={
                    task.status === 'COMPLETED'
                      ? 'text-green-600 font-semibold'
                      : task.status === 'SKIPPED'
                        ? 'text-yellow-600 font-semibold'
                        : 'text-[rgb(var(--primary))] font-semibold'
                  }>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">Due: <strong className="text-body">{task.dueDate}</strong></p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
