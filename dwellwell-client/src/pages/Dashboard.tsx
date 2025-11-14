//dwellwell-client/src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  useTasksApi,
  type TaskListItem,
  type TaskPlanResponse,
} from "@/hooks/useTasksApi";
import TaskCard from "@/components/features/TaskCard";
import { useAuth } from "@/context/AuthContext";
import { useTaskDetailPref } from "@/hooks/useTaskDetailPref";
import RotatingGreeting from "@/components/ui/RotatingGreeting";

/* ============================== Types =============================== */
// flat-only view now
type Timeframe = "week" | "month" | "3mo" | "12mo";

/* ====================== LocalStorage keys + readers ====================== */
const TF_KEY = "dwellwell-timeframe";
const SHOW_COMPLETED_KEY = "dwellwell-show-completed";

function readSavedTimeframe(): Timeframe {
  const v = (localStorage.getItem(TF_KEY) || "").toLowerCase();
  return v === "week" || v === "month" || v === "3mo" || v === "12mo"
    ? (v as Timeframe)
    : "week";
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
function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function getMondayStart(anchor: Date) {
  const d = new Date(anchor);
  const dow = d.getDay() === 0 ? 7 : d.getDay();
  const s = new Date(d);
  s.setDate(d.getDate() - (dow - 1));
  return startOfLocalDay(s);
}
function getSundayEnd(anchor: Date) {
  const mon = getMondayStart(anchor);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return endOfLocalDay(sun);
}

/* ========================= Reusable pill toggle ========================= */
function PillToggle<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ label: string; val: T }>;
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      className="inline-flex rounded-full border bg-card p-1"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = value === opt.val;
        return (
          <button
            key={opt.val}
            className={`px-3 py-1.5 rounded-full text-sm ${
              active
                ? "bg-primary/10 text-[rgb(var(--primary))]"
                : "text-muted hover:text-body"
            }`}
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
  const { listTasks, skip, getTaskPlan } = useTasksApi();
  const [plan, setPlan] = useState<TaskPlanResponse | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planVisible, setPlanVisible] = useState(true);

  useTaskDetailPref(); // keep alive
  const navigate = useNavigate();
  const loc = useLocation();

  const params = new URLSearchParams(loc.search);
  const selectedTaskId = params.get("taskId");

  const [timeframe, setTimeframe] = useState<Timeframe>(() =>
    readSavedTimeframe(),
  );
  const [showCompleted, setShowCompleted] = useState<boolean>(() =>
    readShowCompleted(),
  );

  const [pending, setPending] = useState<TaskListItem[]>([]);
  const [completed, setCompleted] = useState<TaskListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(TF_KEY, timeframe);
  }, [timeframe]);
  useEffect(() => {
    localStorage.setItem(SHOW_COMPLETED_KEY, showCompleted ? "1" : "0");
  }, [showCompleted]);

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
          showCompleted
            ? listTasks({
                status: "completed",
                limit: 500,
                sort: "-completedAt",
              })
            : Promise.resolve([]),
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

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, showCompleted]);

  const now = new Date();
  const todayStart = startOfLocalDay(now);

  // Rolling window filter for upcoming tasks; ALL overdue tasks are always included
  function isInTimeframe(dateStr: string | null | undefined): boolean {
    if (!dateStr) return false;
    const dt = new Date(dateStr);

    // Always show overdue items regardless of timeframe
    if (dt < todayStart) return true;

    if (timeframe === "week") {
      const start = getMondayStart(now);
      const end = getSundayEnd(now);
      return dt >= start && dt <= end;
    }

    if (timeframe === "month") {
      const start = startOfLocalDay(
        new Date(now.getFullYear(), now.getMonth(), 1),
      );
      const end = endOfLocalDay(
        new Date(now.getFullYear(), now.getMonth() + 1, 0),
      );
      return dt >= start && dt <= end;
    }

    if (timeframe === "3mo") {
      const end = endOfLocalDay(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 90),
      );
      return dt <= end;
    }

    if (timeframe === "12mo") {
      const end = endOfLocalDay(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 365),
      );
      return dt <= end;
    }

    return true;
  }

  // Visible tasks = pending (filtered by dueDate) + optionally completed (filtered by completedAt)
  const visiblePending = useMemo(
    () =>
      pending
        .filter((t) => {
          if (t.status !== "PENDING") return false;
          if (!t.dueDate) return true; // flat view: include undated
          return isInTimeframe(t.dueDate);
        })
        .sort((a, b) => {
          const ad = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.POSITIVE_INFINITY;
          const bd = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.POSITIVE_INFINITY;
          return ad - bd;
        }),
    [pending, timeframe],
  );

  const visibleCompleted = useMemo(
    () =>
      showCompleted
        ? completed
            .filter(
              (t) =>
                t.status === "COMPLETED" &&
                t.completedAt &&
                isInTimeframe(t.completedAt),
            )
            .sort((a, b) => {
              const ad = a.completedAt
                ? new Date(a.completedAt).getTime()
                : 0;
              const bd = b.completedAt
                ? new Date(b.completedAt).getTime()
                : 0;
              return bd - ad; // newest completed first
            })
        : [],
    [completed, showCompleted, timeframe],
  );

  const visibleTasks = useMemo(
    () => [...visiblePending, ...visibleCompleted],
    [visiblePending, visibleCompleted],
  );

  function openDrawerViaUrl(taskId: string) {
    const p = new URLSearchParams(loc.search);
    p.set("taskId", taskId);
    navigate({ pathname: loc.pathname, search: p.toString() });
  }

  async function handleSkipSelected() {
    if (!selectedTaskId) return;
    await skip(selectedTaskId);
    const [pRows, cRows] = await Promise.all([
      listTasks({ status: "active", limit: 500, sort: "dueDate" }),
      showCompleted
        ? listTasks({
            status: "completed",
            limit: 500,
            sort: "-completedAt",
          })
        : Promise.resolve([]),
    ]);
    setPending(pRows || []);
    setCompleted(cRows || []);
  }

  async function handleGeneratePlan() {
    if (visiblePending.length === 0) return;
    setPlanLoading(true);
    setPlanErr(null);
    try {
      const payload = visiblePending.map((t) => ({
        id: t.id,
        title: t.title,
        roomName: t.roomName,
        itemName: t.itemName,
        estimatedTimeMinutes: t.estimatedTimeMinutes,
        status: t.status,
        dueDate: t.dueDate,
      }));
      const res = await getTaskPlan(payload);
      setPlan(res);
    } catch (e: any) {
      setPlanErr(e?.message || "Could not generate plan");
    } finally {
      setPlanLoading(false);
    }
  }

  return (
    <div className="space-y-5 rounded bg-surface p-4 sm:p-6">
      {/* Header + controls in one bar */}
      <header className="mb-1 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-body">Dashboard</h1>
          <RotatingGreeting />
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
            />
            <span className="text-body">Show completed</span>
          </label>
        </div>
      </header>

      {(authLoading || loading) && (
        <div className="text-sm text-muted">Loading tasks…</div>
      )}
      {!authLoading && !loading && err && (
        <div className="surface-card bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20">
          {err}
        </div>
      )}
      {!authLoading && !loading && !err && visibleTasks.length === 0 && (
        <div className="surface-card p-6 text-sm text-muted">
          No tasks in this timeframe.
        </div>
      )}

      {/* Today’s Plan banner */}
      {!authLoading &&
        !loading &&
        !err &&
        visiblePending.length > 0 &&
        planVisible && (
          <section className="mt-1">
            <div className="surface-card flex flex-col gap-3 rounded-xl border border-dashed border-token bg-surface-alt/60 p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Today&apos;s Plan
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    A short, plain-language chore list based on the tasks in
                    your current view.
                  </p>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-body"
                  onClick={() => setPlanVisible(false)}
                >
                  Hide
                </button>
              </div>

              {planErr && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30">
                  {planErr}
                </div>
              )}

              {planLoading && (
                <div className="space-y-2">
                  <div className="h-3 w-1/2 rounded bg-surface animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-surface animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-surface animate-pulse" />
                </div>
              )}

              {!planLoading && plan && (
                <div className="space-y-2">
                  <div className="text-sm whitespace-pre-line">
                    {plan.planText}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                    {typeof plan.estTotalMinutes === "number" &&
                      plan.estTotalMinutes > 0 && (
                        <span>
                          Roughly {plan.estTotalMinutes} minutes of work.
                        </span>
                      )}
                    {plan.tagline && (
                      <span className="italic">“{plan.tagline}”</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-token bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  onClick={handleGeneratePlan}
                  disabled={planLoading || visiblePending.length === 0}
                >
                  {plan ? "Regenerate Plan" : "Generate Plan"}
                </button>
                <span className="text-[11px] text-muted">
                  Uses only the tasks currently visible in your timeframe.
                </span>
              </div>
            </div>
          </section>
        )}

      {!authLoading && !loading && !err && visibleTasks.length > 0 && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 items-start content-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTasks.map((t) => (
              <TaskCard
                key={t.id}
                t={t}
                onOpenDrawer={(id) => openDrawerViaUrl(id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
