//dwellwell-client/src/pages/Tasks.tsx
import { useEffect, useState } from "react";
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

export default function TasksPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [sp] = useSearchParams();
  const homeId = sp.get("homeId") || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get<Task[]>("/tasks", { params: { homeId, status: "active" } });
        if (!cancelled) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        if (!cancelled) setErr("Could not load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [homeId]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Tasks</h1>
      </div>

      {loading && <div className="p-6 rounded-2xl border bg-white">Loading…</div>}
      {err && !loading && <div className="p-6 rounded-2xl border bg-red-50 text-red-700">{err}</div>}

      {!loading && !err && items.length === 0 && (
        <div className="p-6 rounded-2xl border bg-white text-slate-600">No tasks yet.</div>
      )}

      <div className="space-y-3">
        {items.map((t) => (
          <Link
            key={t.id}
            to={`/app/tasks/${t.id}`}
            className="block rounded-2xl border bg-white p-4 hover:shadow-sm transition shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="h-2.5 w-2.5 rounded-full mt-1.5" style={{ background: statusDot(t.status) }} />
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{t.title}</div>
                <div className="text-sm text-slate-600">
                  {t.estimatedTimeMinutes ? `${t.estimatedTimeMinutes}m` : "—"}
                  {t.dueDate && ` • due ${new Date(t.dueDate).toLocaleDateString()}`}
                  {t.category && ` • ${t.category}`}
                </div>
              </div>
              <div className="text-blue-700 text-sm">View details →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function statusDot(s: Task["status"]) {
  if (s === "COMPLETED") return "#10b981";
  if (s === "SKIPPED") return "#f59e0b";
  return "#94a3b8";
}