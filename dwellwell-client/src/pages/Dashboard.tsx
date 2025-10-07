import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem } from "@/hooks/useTasksApi";
import TaskCard from "@/components/features/TaskCard";
import TaskBoard from "@/components/features/TaskBoard";
import { useAuth } from "@/context/AuthContext";
import { useTaskDetailPref } from "@/hooks/useTaskDetailPref";
import RotatingGreeting from "@/components/ui/RotatingGreeting";


/* ============================== Types =============================== */
type ViewMode = "grouped" | "flat";
type Timeframe = "week" | "month" | "year";

/* ====================== LocalStorage keys + readers ====================== */
const TF_KEY = "dwellwell-timeframe";
const VIEW_KEY = "dwellwell-view";

function readSavedTimeframe(): Timeframe {
  const v = (localStorage.getItem(TF_KEY) || "").toLowerCase();
  return v === "week" || v === "month" || v === "year" ? (v as Timeframe) : "week";
}
function readSavedView(): ViewMode {
  const v = (localStorage.getItem(VIEW_KEY) || "").toLowerCase();
  return v === "grouped" || v === "flat" ? (v as ViewMode) : "flat";
}

/* ========================= Date helpers (local) ========================= */
function startOfLocalDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfLocalDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function getMondayStart(anchor: Date) { const d = new Date(anchor); const dow = d.getDay() === 0 ? 7 : d.getDay(); const s = new Date(d); s.setDate(d.getDate() - (dow - 1)); return startOfLocalDay(s); }
function getSundayEnd(anchor: Date) { const mon = getMondayStart(anchor); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return endOfLocalDay(sun); }

/* ========================= Reusable pill toggles ========================= */
function PillToggle<T extends string>({
  value, options, onChange, ariaLabel,
}: {
  value: T;
  options: Array<{ label: string; val: T }>;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="inline-flex rounded-full border bg-card p-1" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.val;
        return (
          <button
            key={opt.val}
            className={`px-3 py-1.5 rounded-full text-sm ${active ? "bg-primary/10 text-[rgb(var(--primary))]" : "text-muted hover:text-body"}`}
            onClick={() => onChange(opt.val)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ================================== Page ================================== */
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const { listTasks, skip } = useTasksApi();
  useTaskDetailPref(); // keep alive
  const navigate = useNavigate();
  const loc = useLocation();

  const params = new URLSearchParams(loc.search);
  const selectedTaskId = params.get("taskId");

  const [viewMode, setViewMode] = useState<ViewMode>(() => readSavedView());
  const [timeframe, setTimeframe] = useState<Timeframe>(() => readSavedTimeframe());
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(TF_KEY, timeframe); }, [timeframe]);
  useEffect(() => { localStorage.setItem(VIEW_KEY, viewMode); }, [viewMode]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading || !user) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rows = await listTasks({ status: "active", limit: 300, sort: "dueDate" });
        if (!cancelled) setTasks(rows || []);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const now = new Date();
  const isInCurrentTimeframe = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const taskDate = new Date(dateStr);

    if (timeframe === "week") {
      const start = getMondayStart(now);
      const end = getSundayEnd(now);
      return taskDate >= start && taskDate <= end;
    }
    if (timeframe === "month") {
      const start = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = endOfLocalDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return taskDate >= start && taskDate <= end;
    }
    if (timeframe === "year") {
      const start = startOfLocalDay(new Date(now.getFullYear(), 0, 1));
      const end = endOfLocalDay(new Date(now.getFullYear(), 11, 31));
      return taskDate >= start && taskDate <= end;
    }
    return true;
  };

  const kpis = useMemo(() => {
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);

    let overdue = 0, dueToday = 0, upcoming = 0, completed7d = 0;
    const sevenDaysAgo = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

    for (const t of tasks) {
      const due = t.dueDate ? new Date(t.dueDate) : null;

      const completedAt = (t as any).completedAt ? new Date((t as any).completedAt) : null;
      if (t.status === "COMPLETED" && completedAt) {
        if (completedAt >= sevenDaysAgo && completedAt <= todayEnd) completed7d++;
      }

      if (t.status !== "PENDING") continue;

      if (due) {
        if (due < todayStart) overdue++;
        else if (due >= todayStart && due <= todayEnd) dueToday++;
        else upcoming++;
      }
    }
    return { overdue, dueToday, upcoming, completed7d };
  }, [tasks, now]);

  const includeUndated = viewMode === "flat";
  const visibleTasks = useMemo(
    () =>
      tasks
        .filter((t) => {
          if (t.status !== "PENDING") return false;
          if (!t.dueDate) return includeUndated;
          return isInCurrentTimeframe(t.dueDate);
        })
        .sort((a, b) => {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          return ad - bd;
        }),
    [tasks, timeframe, viewMode]
  );

  function openDrawerViaUrl(taskId: string) {
    const p = new URLSearchParams(loc.search);
    p.set("taskId", taskId);
    navigate({ pathname: loc.pathname, search: p.toString() });
  }

  async function handleSkipSelected() {
    if (!selectedTaskId) return;
    await skip(selectedTaskId);
    // soft refresh the list
    const rows = await listTasks({ status: "active", limit: 300, sort: "dueDate" });
    setTasks(rows || []);
  }

  return (
    <div className="space-y-6 p-4 sm:p-2 rounded bg-surface">
      <header className="mb-1">
        <h1 className="text-3xl font-bold text-body">Dashboard</h1>
        <RotatingGreeting />
      </header>


      {/* Controls: pill toggles like Cozy/Compact */}
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-body">View:</span>
          <PillToggle<ViewMode>
            value={viewMode}
            onChange={(v) => { setViewMode(v); localStorage.setItem(VIEW_KEY, v); }}
            options={[
              { label: "Grouped", val: "grouped" },
              { label: "Flat", val: "flat" },
            ]}
            ariaLabel="View mode"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-body">Timeframe:</span>
          <PillToggle<Timeframe>
            value={timeframe}
            onChange={(v) => setTimeframe(v)}
            options={[
              { label: "Week", val: "week" },
              { label: "Month", val: "month" },
              { label: "Year", val: "year" },
            ]}
            ariaLabel="Timeframe"
          />
        </div>

        {/* Quick actions */}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate("/app/rooms?new=1")}>
            + Room
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/app/trackables?new=1")}>
            + Trackable
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate("/app/tasks/new")}>
            + Custom Task
          </Button>

          {/* Skip currently-open task (drawer) */}
          <Button
            size="sm"
            className="ml-2"
            disabled={!selectedTaskId}
            onClick={handleSkipSelected}
            title={selectedTaskId ? "Skip selected task" : "Open a task to enable skip"}
          >
            Skip…
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="surface-card rounded-xl p-4 border">
          <div className="text-xs text-muted">Overdue</div>
          <div className="text-2xl font-bold text-body">{kpis.overdue}</div>
        </div>
        <div className="surface-card rounded-xl p-4 border">
          <div className="text-xs text-muted">Due Today</div>
          <div className="text-2xl font-bold text-body">{kpis.dueToday}</div>
        </div>
        <div className="surface-card rounded-xl p-4 border">
          <div className="text-xs text-muted">Upcoming</div>
          <div className="text-2xl font-bold text-body">{kpis.upcoming}</div>
        </div>
        <div className="surface-card rounded-xl p-4 border">
          <div className="text-xs text-muted">Completed (7d)</div>
          <div className="text-2xl font-bold text-body">{kpis.completed7d}</div>
        </div>
      </div>

      {(authLoading || loading) && <div className="text-sm text-muted">Loading tasks…</div>}
      {!authLoading && !loading && err && (
        <div className="surface-card p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/20">{err}</div>
      )}
      {!authLoading && !loading && !err && visibleTasks.length === 0 && (
        <div className="surface-card p-6 text-sm text-muted">No tasks in this timeframe.</div>
      )}

      {!authLoading && !loading && !err && visibleTasks.length > 0 && (
        <>
          {viewMode === "flat" && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-body">Your Tasks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start content-start">
                {visibleTasks.map((t) => (
                  <TaskCard key={t.id} t={t} onOpenDrawer={(id) => openDrawerViaUrl(id)} />
                ))}
              </div>
            </section>
          )}

          {viewMode === "grouped" && (
            <TaskBoard tasks={visibleTasks} onOpenDrawer={(id) => openDrawerViaUrl(id)} />
          )}
        </>
      )}
    </div>
  );
}
