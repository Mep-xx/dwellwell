// dwellwell-client/src/components/features/TrackableTaskRow.tsx
import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import type { Task } from "@shared/types/task";
import { ChevronDown, ChevronUp, ExternalLink, Clock4 } from "lucide-react";
import { Link } from "react-router-dom";

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : undefined;

const fmtMoney = (n?: number) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : undefined;

const daysUntil = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  const due = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const nowD = new Date();
  const now = Date.UTC(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
  return Math.round((due - now) / (24 * 60 * 60 * 1000));
};

type Props = {
  task: Task;
  onChanged: () => void; // parent refresh
};

/**
 * Compact list-row design with actions on their own row:
 *
 * Title              [time chip]
 * On track • date • location • criticality
 * [Complete]  [Skip]  [Remind]  (icon) open full page
 * Details ▼
 */
export default function TrackableTaskRow({ task, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(true); // show details by default

  const doPost = async (url: string, body?: any) => {
    setBusy(true);
    try {
      await api.post(url, body);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const complete = () => doPost(`/tasks/${task.id}/complete`);
  const skip = () => doPost(`/tasks/${task.id}/snooze`, { days: 0 }); // skip immediately
  const remind = (days = 3) => doPost(`/tasks/${task.id}/snooze`, { days }); // remind in N days

  const paused = (task as any).pausedAt;
  const archived = (task as any).archivedAt;
  const isPending = task.status === "PENDING";

  const dueDays = useMemo(() => daysUntil(task.dueDate as any), [task.dueDate as any]);
  const isOverdue = isPending && typeof dueDays === "number" && dueDays < 0;
  const isSoon = isPending && typeof dueDays === "number" && dueDays >= 0 && dueDays <= 7;

  // Due color + label
  const dueColor =
    !task.dueDate
      ? "text-muted"
      : isOverdue
      ? "text-red-700"
      : isSoon
      ? "text-amber-700"
      : "text-emerald-700";

  const dueLabel =
    !task.dueDate ? "No due date" : isOverdue ? "Overdue" : isSoon ? "Due soon" : "On track";

  // Small round status dot
  const dotClass =
    !task.dueDate
      ? "bg-slate-300"
      : isOverdue
      ? "bg-red-500"
      : isSoon
      ? "bg-amber-500"
      : "bg-emerald-500";

  const timeChip =
    typeof task.estimatedTimeMinutes === "number" && task.estimatedTimeMinutes > 0 ? (
      <span className="ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-surface-alt text-body">
        <Clock4 className="h-3.5 w-3.5" />
        {task.estimatedTimeMinutes}m
      </span>
    ) : null;

  return (
    <div className="group py-2.5 sm:py-3 px-1 rounded-md hover:bg-surface-alt/60 transition-colors">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div
              className={[
                "text-[13.5px] sm:text-[14px] leading-snug font-medium break-words",
                task.status === "COMPLETED" ? "line-through text-muted" : "text-body",
              ].join(" ")}
            >
              {task.title}
            </div>
            {timeChip}
          </div>

          {/* Meta line with colored dot + due text */}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] sm:text-[12px]">
            <span className="inline-flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
              <span className={`${dueColor} font-medium`}>{dueLabel}</span>
              <span className="text-muted">
                {task.dueDate ? ` • ${fmtDate(task.dueDate)}` : ""}
              </span>
            </span>

            {(task as any).location && (
              <span className="text-muted">• 📍 {(task as any).location}</span>
            )}

            {(task as any).criticality && (
              <span
                className={[
                  "px-1.5 py-[1px] rounded-full text-[10.5px] font-medium",
                  (task as any).criticality === "high"
                    ? "bg-rose-100 text-rose-700"
                    : (task as any).criticality === "medium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {(task as any).criticality}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="mt-2">
        {!paused && !archived && isPending ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={busy}
              onClick={complete}
              className="px-2.5 py-1.5 rounded-md bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 text-xs font-medium disabled:opacity-50"
              title="Mark complete"
              aria-label="Mark complete"
            >
              Complete
            </button>
            <button
              disabled={busy}
              onClick={skip}
              className="px-2.5 py-1.5 rounded-md bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-xs font-medium disabled:opacity-50"
              title="Skip"
              aria-label="Skip"
            >
              Skip
            </button>
            <button
              disabled={busy}
              onClick={() => remind(3)}
              className="px-2.5 py-1.5 rounded-md bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 text-xs font-medium disabled:opacity-50"
              title="Remind later"
              aria-label="Remind later"
            >
              Remind
            </button>

            {/* Icon-only link to full, rich task page */}
            <Link
              to={`/app/tasks/${task.id}`}
              className="ml-2 inline-flex items-center justify-center h-7 w-7 rounded-md border border-token bg-card hover:bg-surface-alt"
              title="Open full guide"
              aria-label="Open full guide"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="sr-only">Open full guide</span>
            </Link>
          </div>
        ) : (
          <div className="text-[11.5px] text-muted italic">No actions available</div>
        )}
      </div>

      {/* Details header (default open) */}
      <div className="mt-1">
        <button
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center gap-1 text-xs text-[rgb(var(--primary))] hover:underline"
          aria-expanded={open}
          aria-controls={`task-panel-${task.id}`}
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {open ? "Hide details" : "Details"}
        </button>
      </div>

      {/* Details drawer */}
      {open && (
        <div
          id={`task-panel-${task.id}`}
          className="mt-2 rounded border border-token bg-card p-3 text-[13px] space-y-2"
        >
          {task.description && <p className="text-body">{task.description}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
            {(task as any).recurrenceInterval && (
              <span>
                🔁 <b>Frequency:</b> {(task as any).recurrenceInterval}
              </span>
            )}
            {typeof (task as any).deferLimitDays === "number" && (
              <span>
                🕓 Safe to defer up to <b>{(task as any).deferLimitDays}d</b>
              </span>
            )}
            {typeof (task as any).estimatedCost === "number" && (
              <span>
                💵 Est. cost: <b>{fmtMoney((task as any).estimatedCost)}</b>
              </span>
            )}
            {(task as any).canBeOutsourced && <span>🧰 Can be outsourced</span>}
          </div>

          {(task as any).steps?.length ? (
            <div>
              <p className="font-medium mb-1">Steps</p>
              <ol className="list-decimal list-inside space-y-1">
                {(task as any).steps.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {(task as any).equipmentNeeded?.length ? (
            <div>
              <p className="font-medium mb-1">You’ll need</p>
              <ul className="list-disc list-inside space-y-1">
                {(task as any).equipmentNeeded.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {(task as any).resources?.length ? (
            <div>
              <p className="font-medium mb-1">Links</p>
              <ul className="list-disc list-inside space-y-1">
                {(task as any).resources.map(
                  (r: { label: string; url: string }, i: number) => (
                    <li key={i}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[rgb(var(--primary))] underline"
                      >
                        {r.label}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          ) : null}

          {task.imageUrl && (
            <img
              src={task.imageUrl}
              alt="Task"
              className="mt-2 w-full max-h-48 object-cover rounded"
            />
          )}
        </div>
      )}
    </div>
  );
}
