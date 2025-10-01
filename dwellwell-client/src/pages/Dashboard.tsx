// dwellwell-client/src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem } from "@/hooks/useTasksApi";
import TaskDrawer from "@/components/features/TaskDrawer";
import { useAuth } from "@/context/AuthContext";

type ViewMode = "grouped" | "flat";
type Timeframe = "week" | "month" | "year";

function formatDue(due: string | null) {
  if (!due) return "";
  const d = new Date(due);
  return d.toLocaleDateString();
}

function Chip({ children }: { children: React.ReactNode }) {
  // uses your .chip neutral styling from global.css
  return <span className="chip-neutral inline-flex items-center gap-1">{children}</span>;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { listTasks } = useTasksApi();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("dwellwell-view") as ViewMode) || "flat"
  );
  const [timeframe, setTimeframe] = useState<Timeframe>("week");
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    if (authLoading || !user) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rows = await listTasks({ status: "active", limit: 300, sort: "dueDate" });
        if (!cancelled) setTasks(rows);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authLoading, user, listTasks]);

  const now = new Date();
  const isInCurrentTimeframe = (dateStr: string | null) => {
    if (!dateStr) return false;
    const taskDate = new Date(dateStr);
    if (timeframe === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return taskDate >= startOfWeek && taskDate <= endOfWeek;
    } else if (timeframe === "month") {
      return taskDate.getFullYear() === now.getFullYear() && taskDate.getMonth() === now.getMonth();
    } else if (timeframe === "year") {
      return taskDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const visibleTasks = useMemo(
    () =>
      tasks
        .filter(t => t.status === "PENDING" && isInCurrentTimeframe(t.dueDate))
        .sort((a, b) => {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return ad - bd;
        }),
    [tasks, timeframe]
  );

  // Grouped mode buckets
  const grouped = useMemo(() => {
    if (viewMode !== "grouped") return null;
    const groups: Record<string, TaskListItem[]> = { Today: [], "This Week": [], Later: [] };
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6);

    for (const t of visibleTasks) {
      const d = t.dueDate ? new Date(t.dueDate) : null;
      if (d && d.toDateString() === now.toDateString()) groups["Today"].push(t);
      else if (d && d <= endOfWeek) groups["This Week"].push(t);
      else groups["Later"].push(t);
    }
    return groups;
  }, [visibleTasks, viewMode]);

  // Shared “active pill” class for token-friendly buttons
  const activePill = "bg-primary-soft text-primary border-primary";

  return (
    <div className="space-y-6 p-4 sm:p-2 rounded bg-surface">
      <header className="mb-1">
        <h1 className="text-3xl font-bold text-body">Dashboard</h1>
        <p className="text-muted">Welcome back! Here’s what’s coming up.</p>
      </header>

      {/* Controls (token-friendly) */}
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-body">View:</span>
          <Button
            size="sm"
            variant="secondary"
            className={`rd-md ${viewMode === "grouped" ? activePill : ""}`}
            onClick={() => {
              setViewMode("grouped");
              localStorage.setItem("dwellwell-view", "grouped");
            }}
          >
            Grouped
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={`rd-md ${viewMode === "flat" ? activePill : ""}`}
            onClick={() => {
              setViewMode("flat");
              localStorage.setItem("dwellwell-view", "flat");
            }}
          >
            Flat
          </Button>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium text-body">Timeframe:</span>
          <Button
            size="sm"
            variant="secondary"
            className={`rd-md ${timeframe === "week" ? activePill : ""}`}
            onClick={() => setTimeframe("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={`rd-md ${timeframe === "month" ? activePill : ""}`}
            onClick={() => setTimeframe("month")}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className={`rd-md ${timeframe === "year" ? activePill : ""}`}
            onClick={() => setTimeframe("year")}
          >
            Year
          </Button>
        </div>
      </div>

      {/* States */}
      {(authLoading || loading) && <div className="text-sm text-muted">Loading tasks…</div>}
      {!authLoading && !loading && err && (
        <div className="surface-card p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/20">{err}</div>
      )}
      {!authLoading && !loading && !err && visibleTasks.length === 0 && (
        <div className="surface-card p-6 text-sm text-muted">No tasks in this timeframe.</div>
      )}

      {/* Content */}
      {!authLoading && !loading && !err && visibleTasks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-body">🛠️ Your Tasks</h2>

          {viewMode === "flat" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleTasks.map((t) => (
                <button
                  key={t.id}
                  className="text-left surface-card-sm p-3 shadow-sm hover:bg-surface-alt focus:outline-none panel-hover"
                  onClick={() => { setActiveTaskId(t.id); setDrawerOpen(true); }}
                  aria-label={`Open ${t.title}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{t.icon || "🧰"}</span>
                        <div className="font-medium truncate text-body">{t.title}</div>
                      </div>

                      <div className="mt-1 flex flex-wrap gap-1">
                        {t.roomName && <Chip>{t.roomName}</Chip>}
                        {t.itemName && <Chip>{t.itemName}</Chip>}
                        {t.category && <Chip>{t.category}</Chip>}
                      </div>
                    </div>

                    <div className="text-xs text-muted shrink-0 mt-0.5">
                      {formatDue(t.dueDate)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {viewMode === "grouped" && grouped && (
            <div className="space-y-8">
              {Object.entries(grouped).map(([label, rows]) =>
                rows.length ? (
                  <div key={label} className="space-y-3">
                    <div className="text-sm font-semibold text-muted">{label}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rows.map((t) => (
                        <button
                          key={t.id}
                          className="text-left surface-card-sm p-3 shadow-sm hover:bg-surface-alt focus:outline-none panel-hover"
                          onClick={() => { setActiveTaskId(t.id); setDrawerOpen(true); }}
                          aria-label={`Open ${t.title}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-lg leading-none">{t.icon || "🧰"}</span>
                                <div className="font-medium truncate text-body">{t.title}</div>
                              </div>

                              <div className="mt-1 flex flex-wrap gap-1">
                                {t.roomName && <Chip>{t.roomName}</Chip>}
                                {t.itemName && <Chip>{t.itemName}</Chip>}
                                {t.category && <Chip>{t.category}</Chip>}
                              </div>
                            </div>

                            <div className="text-xs text-muted shrink-0 mt-0.5">
                              {formatDue(t.dueDate)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null
              )}
            </div>
          )}
        </section>
      )}

      {/* Drawer */}
      <TaskDrawer taskId={activeTaskId} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}
