// dwellwell-client/src/pages/Tasks.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/utils/api";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  estimatedTimeMinutes: number | null;
  category: string | null;
  imageUrl?: string | null;
  icon?: string | null;
};

export default function Tasks() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sp] = useSearchParams();
  const homeId = sp.get("homeId") || undefined;
  const preselectId = sp.get("taskId") || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await api.get('/tasks', { params: { homeId, status: 'active', limit: 200, sort: 'dueDate' } });
        if (!cancelled) setItems(Array.isArray(r.data) ? r.data : []);
      } catch (e) {
        if (!cancelled) setErr("Failed to load tasks.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [homeId]);

  const grouped = useMemo(() => {
    const buckets: Record<string, Task[]> = { Overdue: [], "Due Soon": [], Upcoming: [] };
    const now = Date.now();
    const soonCutoff = now + 7 * 24 * 60 * 60 * 1000;
    for (const t of items) {
      const due = t.dueDate ? new Date(t.dueDate).getTime() : Infinity;
      if (due < now) buckets.Overdue.push(t);
      else if (due <= soonCutoff) buckets["Due Soon"].push(t);
      else buckets.Upcoming.push(t);
    }
    for (const key of Object.keys(buckets)) {
      buckets[key].sort((a, b) => new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime());
    }
    return buckets;
  }, [items]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>

      {loading && <div className="p-6 rounded-2xl border bg-card">Loading…</div>}
      {err && !loading && <div className="p-6 rounded-2xl border bg-red-50 text-red-700">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="p-6 rounded-2xl border bg-card text-slate-600">No tasks yet.</div>
      )}

      {!loading && !err && items.length > 0 && (
        <div className="space-y-8">
          {Object.entries(grouped).map(([label, list]) => (
            <section key={label}>
              <h2 className="text-sm font-semibold text-slate-700 mb-2">{label} ({list.length})</h2>
              <div className="space-y-3">
                {list.map((t) => (
                  <TaskRow key={t.id} task={t} highlight={preselectId === t.id} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, highlight }: { task: Task; highlight?: boolean }) {
  const rowRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (highlight && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [highlight]);

  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date";
  const chips =
    task.status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
      : task.status === "SKIPPED"
        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40"
        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-800";

  return (
    <Link
      ref={rowRef}
      to={`/app/tasks/${task.id}`}
      className={`block rounded-2xl border bg-card p-4 transition hover:shadow-sm shadow-sm ${highlight ? "ring-2 ring-brand-primary/40" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="h-2.5 w-2.5 rounded-full mt-1.5" style={{ background: statusDot(task.status) }} />
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{task.title}</div>
          <div className="text-sm text-slate-600">
            {task.estimatedTimeMinutes ? `${task.estimatedTimeMinutes}m` : "—"}
            {task.dueDate && ` • due ${due}`}
            {task.category && ` • ${task.category}`}
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border ${chips}`}>{task.status}</span>
      </div>
      <div className="text-blue-700 text-sm mt-1">View details →</div>
    </Link>
  );
}

function statusDot(s: Task["status"]) {
  if (s === "COMPLETED") return "#10b981";
  if (s === "SKIPPED") return "#f59e0b";
  return "#94a3b8";
}
