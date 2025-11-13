// dwellwell-client/src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem } from "@/hooks/useTasksApi";
import TaskCard from "@/components/features/TaskCard";
import TaskBuckets, { type Buckets } from "@/components/features/TaskBuckets";
import { useAuth } from "@/context/AuthContext";
import { useTaskDetailPref } from "@/hooks/useTaskDetailPref";
import RotatingGreeting from "@/components/ui/RotatingGreeting";

/* ============================== Types =============================== */
type ViewMode = "grouped" | "flat";
type Timeframe = "week" | "month" | "3mo" | "12mo";

/* ====================== LocalStorage keys + readers ====================== */
const TF_KEY = "dwellwell-timeframe";
const VIEW_KEY = "dwellwell-view";
const SHOW_COMPLETED_KEY = "dwellwell-show-completed";

function readSavedTimeframe(): Timeframe {
  const v = (localStorage.getItem(TF_KEY) || "").toLowerCase();
  return v === "week" || v === "month" || v === "3mo" || v === "12mo" ? (v as Timeframe) : "week";
}
function readSavedView(): ViewMode {
  const v = (localStorage.getItem(VIEW_KEY) || "").toLowerCase();
  return v === "grouped" || v === "flat" ? (v as ViewMode) : "flat";
}
function readShowCompleted(): boolean {
  try {
    const v = localStorage.getItem(SHOW_COMPLETED_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/* ========================= Date helpers (local) ========================= */
function startOfLocalDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfLocalDay(d: Date) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function getMondayStart(anchor: Date) { const d = new Date(anchor); const dow = d.getDay() === 0 ? 7 : d.getDay(); const s = new Date(d); s.setDate(d.getDate() - (dow - 1)); return startOfLocalDay(s); }
function getSundayEnd(anchor: Date) { const mon = getMondayStart(anchor); const sun = new Date(mon); sun.setDate(mon.getDate() + 6); return endOfLocalDay(sun); }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

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

  // NEW: show/hide completed
  const [showCompleted, setShowCompleted] = useState<boolean>(() => readShowCompleted());

  const [pending, setPending] = useState<TaskListItem[]>([]);
  const [completed, setCompleted] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(TF_KEY, timeframe); }, [timeframe]);
  useEffect(() => { localStorage.setItem(VIEW_KEY, viewMode); }, [viewMode]);
  useEffect(() => { localStorage.setItem(SHOW_COMPLETED_KEY, showCompleted ? "1" : "0"); }, [showCompleted]);

  // Fetch PENDING (always) and COMPLETED (only when toggled on)
  useEffect(() => {
    let cancelled = false;
    if (authLoading || !user) return;

    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [pRows, cRows] = await Promise.all([
          listTasks({ status: "active", limit: 500, sort: "dueDate" }),
          showCompleted ? listTasks({ status: "completed", limit: 500, sort: "-completedAt" }) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setPending(pRows || []);
          setCompleted(cRows || []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load tasks");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, showCompleted]);

  const now = new Date();

  // Rolling window filter for flat view (pending) and for completed histogram
  function isInTimeframe(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const dt = new Date(dateStr);

    if (timeframe === "week") {
      const start = getMondayStart(now);
      const end = getSundayEnd(now);
      return dt >= start && dt <= end;
    }

    if (timeframe === "month") {
      const start = startOfLocalDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = endOfLocalDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return dt >= start && dt <= end;
    }

    if (timeframe === "3mo") {
      const start = startOfLocalDay(now);
      const end = endOfLocalDay(addDays(now, 90));
      return dt >= start && dt <= end;
    }

    if (timeframe === "12mo") {
      const start = startOfLocalDay(now);
      const end = endOfLocalDay(addDays(now, 365));
      return dt >= start && dt <= end;
    }

    return true;
  }

  // KPIs (based on pending list + completed 7d)
  const kpis = useMemo(() => {
    const todayStart = startOfLocalDay(now);
    const todayEnd = endOfLocalDay(now);

    let overdue = 0, dueToday = 0, upcoming = 0, completed7d = 0;
    const sevenDaysAgo = startOfLocalDay(addDays(now, -6));

    const sourceCompleted = showCompleted ? completed : [];
    for (const t of sourceCompleted) {
      if (t.status === "COMPLETED" && t.completedAt) {
        const c = new Date(t.completedAt);
        if (c >= sevenDaysAgo && c <= todayEnd) completed7d++;
      }
    }

    for (const t of pending) {
      if (t.status !== "PENDING") continue;
      const due = t.dueDate ? new Date(t.dueDate) : null;
      if (due) {
        if (due < todayStart) overdue++;
        else if (due >= todayStart && due <= todayEnd) dueToday++;
        else upcoming++;
      }
    }
    return { overdue, dueToday, upcoming, completed7d };
  }, [pending, completed, showCompleted, now]);

  const includeUndated = viewMode === "flat";

  /* ============================ FLAT VIEW DATA ============================ */
  const visiblePendingFlat = useMemo(
    () =>
      pending
        .filter((t) => {
          if (t.status !== "PENDING") return false;
          if (!t.dueDate) return includeUndated;
          return isInTimeframe(t.dueDate);
        })
        .sort((a, b) => {
          const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
          const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
          return ad - bd;
        }),
    [pending, timeframe, viewMode, includeUndated]
  );

  const visibleCompleted = useMemo(
    () =>
      showCompleted
        ? completed
            .filter((t) => t.status === "COMPLETED" && t.completedAt && isInTimeframe(t.completedAt))
            .sort((a, b) => {
              const ad = a.completedAt ? new Date(a.completedAt).getTime() : 0;
              const bd = b.completedAt ? new Date(b.completedAt).getTime() : 0;
              return bd - ad;
            })
        : [],
    [completed, showCompleted, timeframe]
  );

  const visibleTasksFlat = useMemo(
    () => [...visiblePendingFlat, ...visibleCompleted],
    [visiblePendingFlat, visibleCompleted]
  );

  /* =========================== GROUPED VIEW DATA ========================== */
  function windowEnd(tf: Timeframe) {
    const base = startOfLocalDay(now);
    if (tf === "3mo") return endOfLocalDay(addDays(base, 90));
    if (tf === "12mo") return endOfLocalDay(addDays(base, 365));
    // For week/month, "Later" stops at the end of the current month.
    return endOfLocalDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  const pendingBuckets: Buckets = useMemo(() => {
    const today = startOfLocalDay(now);
    const wStart = getMondayStart(now);
    const wEnd = getSundayEnd(now);
    const mEnd = endOfLocalDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    const winEnd = windowEnd(timeframe);

    const buckets: Buckets = { overdue: [], week: [], month: [], later: [] };

    for (const t of pending) {
      if (t.status !== "PENDING") continue;

      // undated tasks -> Later
      if (!t.dueDate) { buckets.later.push(t); continue; }

      const d = new Date(t.dueDate);
      const dueDay = startOfLocalDay(d);

      if (dueDay < today) { buckets.overdue.push(t); continue; }
      if (dueDay >= wStart && dueDay <= wEnd) { buckets.week.push(t); continue; }
      if (dueDay > wEnd && dueDay <= mEnd) { buckets.month.push(t); continue; }
      if (dueDay > mEnd && dueDay <= winEnd) { buckets.later.push(t); }
    }

    // sort each bucket by due date
    for (const key of Object.keys(buckets) as (keyof Buckets)[]) {
      buckets[key].sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        return ad - bd;
      });
    }
    return buckets;
  }, [pending, timeframe, now]);

  const totalPendingInBuckets =
    pendingBuckets.overdue.length +
    pendingBuckets.week.length +
    pendingBuckets.month.length +
    pendingBuckets.later.length;

  /* ================================ Actions =============================== */
  function openDrawerViaUrl(taskId: string) {
    const p = new URLSearchParams(loc.search);
    p.set("taskId", taskId);
    navigate({ pathname: loc.pathname, search: p.toString() });
  }

  async function handleSkipSelected() {
    if (!selectedTaskId) return;
    await skip(selectedTaskId);
    // soft refresh
    const [pRows, cRows] = await Promise.all([
      listTasks({ status: "active", limit: 500, sort: "dueDate" }),
      showCompleted ? listTasks({ status: "completed", limit: 500, sort: "-completedAt" }) : Promise.resolve([]),
    ]);
    setPending(pRows || []);
    setCompleted(cRows || []);
  }

  /* ================================= Render =============================== */
  const nothingToShow =
    (!authLoading && !loading && !err) &&
    ((viewMode === "flat" && visibleTasksFlat.length === 0) ||
     (viewMode === "grouped" && totalPendingInBuckets === 0));

  return (
    <div className="space-y-6 p-4 sm:p-2 rounded bg-surface">
      <header className="mb-1">
        <h1 className="text-3xl font-bold text-body">Dashboard</h1>
        <RotatingGreeting />
      </header>

      {/* Controls */}
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
              { label: "3 mo", val: "3mo" },
              { label: "12 mo", val: "12mo" },
            ]}
            ariaLabel="Timeframe"
          />
        </div>

        {/* Show Completed toggle */}
        <label className="ml-auto inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span className="text-body">Show completed</span>
        </label>
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
      {nothingToShow && (
        <div className="surface-card p-6 text-sm text-muted">No tasks in this timeframe.</div>
      )}

      {!authLoading && !loading && !err && !nothingToShow && (
        <>
          {viewMode === "flat" && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-body">Your Tasks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start content-start">
                {visibleTasksFlat.map((t) => (
                  <TaskCard key={t.id} t={t} onOpenDrawer={(id) => openDrawerViaUrl(id)} />
                ))}
              </div>
            </section>
          )}

          {viewMode === "grouped" && (
            <TaskBuckets
              buckets={pendingBuckets}
              onOpenDrawer={(id) => openDrawerViaUrl(id)}
            />
          )}
        </>
      )}
    </div>
  );
}
