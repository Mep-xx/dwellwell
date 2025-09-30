//dwellwell-client/src/components/TrackableTaskRow.tsx
import { useState } from "react";
import { api } from "@/utils/api";
import type { Task } from "@shared/types/task";

const categoryEmoji: Record<string, string> = {
  appliance: "🔧",
  bathroom: "🛁",
  cooling: "❄️",
  electrical: "💡",
  flooring: "🧹",
  garage: "🚗",
  general: "📌",
  heating: "🔥",
  kitchen: "🍽️",
  outdoor: "🌿",
  plumbing: "🚿",
  safety: "🛑",
  windows: "🪟",
};

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : undefined;

const fmtMoney = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : undefined;

type Props = {
  task: Task;
  onChanged: () => void; // parent refresh
};

export default function TrackableTaskRow({ task, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const doPost = async (url: string, body?: any) => {
    setBusy(true);
    try { await api.post(url, body); onChanged(); }
    finally { setBusy(false); }
  };

  const complete = () => doPost(`/tasks/${task.id}/complete`);
  const skip = () => doPost(`/tasks/${task.id}/skip`);
  const remind = (days = 3) => doPost(`/tasks/${task.id}/remind`, { days });

  const paused = (task as any).pausedAt;
  const archived = (task as any).archivedAt;
  const icon = task.category ? (categoryEmoji[task.category] ?? "📌") : "📌";

  const overdueFlag =
    task.status === "PENDING" &&
    task.dueDate &&
    new Date(task.dueDate).getTime() < Date.now();

  return (
    <div className="py-2">
      <div className="flex items-center gap-3">
        <div className="text-xl shrink-0" aria-hidden>{icon}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className={`truncate ${task.status === "COMPLETED" ? "line-through text-muted" : ""}`}>
              {task.title}
            </div>
            {/* chips remain semantic with color hints */}
          </div>
          <div className="text-xs text-muted">
            {task.dueDate ? `Due: ${fmtDate(task.dueDate)}` : "No due date"}
            {task.estimatedTimeMinutes ? ` • ⏱ ${task.estimatedTimeMinutes}m` : ""}
          </div>
        </div>

        {!paused && !archived && task.status === "PENDING" && (
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={complete}
              className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs hover:bg-green-200 disabled:opacity-50"
              title="Mark complete"
            >
              ✅
            </button>
            <button
              disabled={busy}
              onClick={skip}
              className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs hover:bg-yellow-200 disabled:opacity-50"
              title="Skip"
            >
              ⏭
            </button>
            <button
              disabled={busy}
              onClick={() => remind(3)}
              className="px-2 py-1 rounded bg-surface-alt text-gray-700 text-xs hover:bg-surface-alt disabled:opacity-50"
              title="Remind later"
            >
              🕓
            </button>
          </div>
        )}

        <button
          className="text-xs text-blue-600 underline"
          onClick={() => setShowDetails(s => !s)}
        >
          {showDetails ? "Hide" : "Details"}
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 ml-9 rounded border border-token bg-card p-3 text-sm space-y-2">
          {task.description && <p>{task.description}</p>}
          {task.recurrenceInterval && <p>🔁 <b>Frequency:</b> {task.recurrenceInterval}</p>}
          {task.criticality && <p>🚨 <b>Importance:</b> {task.criticality}</p>}
          {typeof task.deferLimitDays === "number" && <p>🕓 Safe to defer up to <b>{task.deferLimitDays}d</b></p>}
          {typeof task.estimatedCost === "number" && <p>💵 Est. cost: <b>{fmtMoney(task.estimatedCost)}</b></p>}
          {task.canBeOutsourced && <p>🧰 Can be outsourced</p>}
          {task.location && <p>📍 {task.location}</p>}

          {task.steps?.length ? (
            <div>
              <p className="font-medium mb-1">Steps:</p>
              <ol className="list-decimal list-inside space-y-1">{task.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            </div>
          ) : null}

          {task.equipmentNeeded?.length ? (
            <div>
              <p className="font-medium mb-1">You’ll need:</p>
              <ul className="list-disc list-inside space-y-1">{task.equipmentNeeded.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}

          {task.resources?.length ? (
            <div>
              <p className="font-medium mb-1">Links:</p>
              <ul className="list-disc list-inside space-y-1">
                {task.resources.map((r, i) => (
                  <li key={i}>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-[rgb(var(--primary))] underline">{r.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {task.imageUrl && (
            <img src={task.imageUrl} alt="Task" className="mt-2 w-full max-h-48 object-cover rounded" />
          )}
        </div>
      )}
    </div>
  );
}
