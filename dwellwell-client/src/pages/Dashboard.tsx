// dwellwell-client/src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem } from "@/hooks/useTasksApi";
import TaskCard from "@/components/features/TaskCard";
import TaskBoard from "@/components/features/TaskBoard";
import { useAuth } from "@/context/AuthContext";
import { useTaskDetailPref } from "@/hooks/useTaskDetailPref";

type ViewMode = "grouped" | "flat";
type Timeframe = "week" | "month" | "year";

// ---- timeframe persistence helpers ----
const TF_KEY = "dwellwell-timeframe";
function readSavedTimeframe(): Timeframe {
  const v = (localStorage.getItem(TF_KEY) || "").toLowerCase();
  return (v === "week" || v === "month" || v === "year") ? (v as Timeframe) : "week";
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { listTasks } = useTasksApi();
  const pref = useTaskDetailPref(); // "drawer" | "card"

  const navigate = useNavigate();
  const loc = useLocation();

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem("dwellwell-view") as ViewMode) || "flat"
  );
  const [timeframe, setTimeframe] = useState<Timeframe>(() => readSavedTimeframe()); // <- persisted
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // persist timeframe whenever it changes
  useEffect(() => {
    localStorage.setItem(TF_KEY, timeframe);
  }, [timeframe]);

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
        .filter((t) => t.status === "PENDING" && isInCurrentTimeframe(t.dueDate))
        .sort((a, b) => {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return ad - bd;
        }),
    [tasks, timeframe]
  );

  const activePill = "bg-primary-soft text-primary border-primary";

  function openDrawerViaUrl(taskId: string) {
    const params = new URLSearchParams(loc.search);
    params.set("taskId", taskId);
    navigate({ pathname: loc.pathname, search: params.toString() });
  }

  return (
    <div className="space-y-6 p-4 sm:p-2 rounded bg-surface">
      <header className="mb-1">
        <h1 className="text-3xl font-bold text-body">Dashboard</h1>
        <p className="text-muted">Welcome back! Here’s what’s coming up.</p>
      </header>

      {/* Controls */}
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
        <>
          {/* FLAT view */}
          {viewMode === "flat" && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-body">🛠️ Your Tasks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start content-start">
                {visibleTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    t={t}
                    onOpenDrawer={(id) => openDrawerViaUrl(id)}
                    // density="compact"
                  />
                ))}
              </div>
            </section>
          )}

          {/* GROUPED view */}
          {viewMode === "grouped" && (
            <TaskBoard
              tasks={visibleTasks}
              onOpenDrawer={(id) => openDrawerViaUrl(id)}
            />
          )}
        </>
      )}
    </div>
  );
}
