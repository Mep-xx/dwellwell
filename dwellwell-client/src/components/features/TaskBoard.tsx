// dwellwell-client/src/components/features/TaskBoard.tsx
import { useMemo, useState } from "react";
import TaskCard from "./TaskCard";
import type { TaskListItem } from "@/hooks/useTasksApi";
import { CalendarDays, AlertTriangle, CheckCircle2 } from "lucide-react";

type Props = {
  tasks: TaskListItem[];
  // optional passthroughs for drawer open, etc.
  onOpenDrawer?: (taskId: string) => void;
};

type Density = "cozy" | "compact";

export default function TaskBoard({ tasks, onOpenDrawer }: Props) {
  const [density, setDensity] = useState<Density>("cozy");

  const buckets = useMemo(() => bucketByTimeframe(tasks), [tasks]);

  return (
    <div className="space-y-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        <div className="flex items-center gap-2">
          <ViewDensityToggle value={density} onChange={setDensity} />
        </div>
      </div>

      {/* Sections */}
      {buckets.map((b) => (
        <section key={b.key} className="space-y-3">
          <StickyHeader
            title={b.title}
            icon={b.icon}
            total={b.items.length}
            completed={b.items.filter((t) => t.status === "COMPLETED").length}
          />

          {b.items.length === 0 ? (
            <div className="text-sm text-muted italic">Nothing here 🎉</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start content-start">
              {b.items.map((t) => (
                <TaskCard key={t.id} t={t} onOpenDrawer={onOpenDrawer} density={density} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/* --------- helpers ---------- */

function StickyHeader({
  title,
  icon,
  total,
  completed,
}: {
  title: string;
  icon: React.ReactNode;
  total: number;
  completed: number;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="sticky top-0 z-10 -mx-1 md:-mx-2 xl:-mx-4 px-1 md:px-2 xl:px-4 py-2 backdrop-blur bg-background/70 border-b">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h3 className="text-base font-semibold">{title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-alt text-muted">
            {completed} / {total} done
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 w-40">
          <div className="flex-1 h-1.5 rounded bg-surface-alt overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${pct}%` }}
              aria-label={`${pct}% complete`}
            />
          </div>
          <span className="text-xs text-muted w-8 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function ViewDensityToggle({
  value,
  onChange,
}: {
  value: "cozy" | "compact";
  onChange: (v: "cozy" | "compact") => void;
}) {
  return (
    <div className="inline-flex rounded-full border bg-card p-1">
      <button
        className={`px-3 py-1.5 rounded-full text-sm ${value === "cozy" ? "bg-primary/10 text-[rgb(var(--primary))]" : "text-muted hover:text-body"}`}
        onClick={() => onChange("cozy")}
      >
        Cozy
      </button>
      <button
        className={`px-3 py-1.5 rounded-full text-sm ${value === "compact" ? "bg-primary/10 text-[rgb(var(--primary))]" : "text-muted hover:text-body"}`}
        onClick={() => onChange("compact")}
      >
        Compact
      </button>
    </div>
  );
}

function bucketByTimeframe(tasks: TaskListItem[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = endOfThisWeek(now);

  const overdue: TaskListItem[] = [];
  const today: TaskListItem[] = [];
  const week: TaskListItem[] = [];
  const later: TaskListItem[] = [];

  for (const t of tasks) {
    const d = t.dueDate ? new Date(t.dueDate) : null;
    if (!d) { later.push(t); continue; }
    if (t.status === "COMPLETED") { week.push(t); continue; } // keep done visible but not noisy
    if (d < startOfToday) overdue.push(t);
    else if (sameDay(d, startOfToday)) today.push(t);
    else if (d <= endOfWeek) week.push(t);
    else later.push(t);
  }

  const toSection = (key: string, title: string, items: TaskListItem[], icon: React.ReactNode) => ({
    key, title, items, icon
  });

  return [
    toSection("overdue", "Overdue", sortByDue(overdue), <AlertTriangle className="w-4 h-4 text-amber-600" />),
    toSection("today", "Today", sortByDue(today), <CalendarDays className="w-4 h-4" />),
    toSection("week", "This Week", sortByDue(week), <CalendarDays className="w-4 h-4" />),
    toSection("later", "Later", sortByDue(later), <CalendarDays className="w-4 h-4" />),
  ];
}

function sortByDue<T extends TaskListItem>(arr: T[]) {
  return [...arr].sort((a, b) => {
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    return ad - bd;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function endOfThisWeek(d: Date) {
  const e = new Date(d);
  const day = e.getDay(); // 0 Sun
  const diff = 6 - day;   // end on Sat; tweak if you prefer Sun
  e.setHours(23, 59, 59, 999);
  e.setDate(e.getDate() + diff);
  return e;
}
