//dwellwell-client/src/components/features/TaskCard.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock4,
  ChevronDown,
  CornerDownRight,
  ExternalLink,
  RotateCcw,
  Check,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTasksApi,
  type TaskListItem,
  type TaskDetail,
} from "@/hooks/useTasksApi";
import { useTaskDetailPref } from "@/hooks/useTaskDetailPref";

type Props = {
  t: TaskListItem;
  onOpenDrawer?: (taskId: string) => void;
  density?: "cozy" | "compact";
};

export default function TaskCard({ t, onOpenDrawer, density = "cozy" }: Props) {
  const pref = useTaskDetailPref();
  const { getDetail, complete, uncomplete, snooze, skip } = useTasksApi();

  const [status, setStatus] = useState<TaskListItem["status"]>(t.status);
  const [completedAt, setCompletedAt] = useState<string | null>(
    t.completedAt ?? null,
  );
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const isCompleted = status === "COMPLETED";

  // Load details only when needed (card expand)
  useEffect(() => {
    if (pref === "drawer" && expanded) setExpanded(false);
  }, [pref, expanded]);

  useEffect(() => {
    if (!expanded || pref !== "card") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const d = await getDetail(t.id);
        if (!cancelled) setDetail(d);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load task");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [expanded, pref, t.id, getDetail]);

  const dueInfo = useMemo(() => computeDueInfo(t.dueDate), [t.dueDate]);
  const thumbSrc =
    detail?.task?.imageUrl || detail?.template?.imageUrl || undefined;
  const showThumb = Boolean(thumbSrc);

  const minutes = t.estimatedTimeMinutes ?? null;

  const contextParts: string[] = [];
  if (t.roomName) contextParts.push(t.roomName);
  if (t.itemName) contextParts.push(t.itemName);
  const contextLine =
    contextParts.length > 0 ? contextParts.join(" • ") : "Whole home";

  function handleHeaderClick() {
    if (pref === "drawer") onOpenDrawer?.(t.id);
    else setExpanded((v) => !v);
  }

  function stop(e: ReactMouseEvent) {
    e.stopPropagation();
  }

  async function handleComplete(e: ReactMouseEvent) {
    stop(e);
    if (busy || isCompleted) return;
    setBusy(true);
    try {
      await complete(t.id);
      setStatus("COMPLETED");
      const nowIso = new Date().toISOString();
      setCompletedAt(nowIso);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 800);
    } finally {
      setBusy(false);
    }
  }

  async function handleUndo(e: ReactMouseEvent) {
    stop(e);
    if (busy || !isCompleted) return;
    setBusy(true);
    try {
      await uncomplete(t.id);
      setStatus("PENDING");
      setCompletedAt(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleSkip() {
    if (busy) return;
    setBusy(true);
    try {
      await skip(t.id);
      setStatus("SKIPPED");
    } finally {
      setBusy(false);
    }
  }

  async function handleSnooze(days: number) {
    if (busy) return;
    setBusy(true);
    try {
      await snooze(t.id, days);
    } finally {
      setBusy(false);
    }
  }

  function handleOpenFull() {
    window.open(
      `/app/tasks/${encodeURIComponent(t.id)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={[
        "relative self-start rounded-xl border border-token bg-card text-body",
        density === "compact" ? "p-3" : "p-4",
        "shadow-sm hover:shadow-md transition-shadow",
      ].join(" ")}
    >
      <AnimatePresence>
        {celebrate && (
          <motion.div
            key="celebrate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-500/10"
          />
        )}
      </AnimatePresence>

      {/* Header row (thumb + title + time) */}
      <button
        type="button"
        className="w-full text-left"
        onClick={handleHeaderClick}
        aria-label={`Open ${t.title}`}
      >
        <div className="flex items-start gap-3">
          {/* Single visual (thumb if present, else subtle icon chip) */}
          <div
            className={[
              "shrink-0 overflow-hidden rounded-lg border border-token",
              showThumb
                ? density === "compact"
                  ? "h-11 w-11"
                  : "h-12 w-12"
                : "h-10 w-10",
              showThumb
                ? "bg-surface-alt"
                : "flex items-center justify-center bg-surface-alt",
            ].join(" ")}
          >
            {showThumb ? (
              <img
                src={thumbSrc as string}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg">{t.icon || "🧰"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0">
                <h3
                  className={[
                    density === "compact" ? "text-[15px]" : "text-base",
                    "font-semibold leading-snug",
                    isCompleted ? "line-through text-muted" : "text-body",
                    "line-clamp-2",
                  ].join(" ")}
                >
                  {t.title}
                </h3>
                {contextLine && (
                  <div className="mt-0.5 text-xs text-muted truncate">
                    {contextLine}
                  </div>
                )}
              </div>

              {/* Duration pill in top-right */}
              {typeof minutes === "number" && minutes > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-alt px-2 py-[3px] text-xs text-muted">
                  <Clock4 className="h-3.5 w-3.5" />
                  {minutes}m
                </span>
              )}
            </div>

            {/* Meta row: due + category chip(s) */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              {t.dueDate ? (
                <span
                  className={[
                    "inline-flex items-center gap-1 rounded-full border px-2 py-[2px]",
                    dueInfo.className,
                  ].join(" ")}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className="font-medium">{dueInfo.label}</span>
                  <span className="opacity-80">• {dueInfo.date}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-token bg-surface-alt px-2 py-[2px] text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  No due date
                </span>
              )}

              {t.category && (
                <span className="rounded-full border border-token bg-surface-alt px-2 py-[2px] text-[11px] text-muted">
                  {t.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="mt-3 h-px bg-border/70" />

      {/* Actions */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 opacity-90 group-hover:opacity-100">
        {!isCompleted ? (
          <>
            <Button
              size="sm"
              onClick={handleComplete}
              className="h-8 px-3 border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
              title="Mark Complete"
              disabled={busy}
            >
              <Check className="mr-1 h-4 w-4 -ml-0.5" />
              Complete
            </Button>

            <TaskMoreMenu
              disabled={busy}
              onSnooze={handleSnooze}
              onSkip={handleSkip}
              onOpenFull={handleOpenFull}
            />
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              className="h-8 px-3 text-xs"
              title="Mark as not complete"
              disabled={busy}
            >
              <RotateCcw className="mr-1 h-4 w-4 -ml-0.5" />
              Undo
            </Button>
            <span className="text-xs text-muted">
              {completedAt
                ? `Completed • ${new Date(
                    completedAt,
                  ).toLocaleDateString()}`
                : "Completed"}
            </span>
          </>
        )}
      </div>

      {/* Minimal expansion bar: "•••  ▾" */}
      {pref === "card" && !isCompleted && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((prev) => !prev);
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-muted transition-colors hover:bg-surface-alt"
          aria-expanded={expanded}
          aria-label={expanded ? "Hide details" : "Show details"}
        >
          <span className="text-lg leading-none tracking-widest">•••</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      <AnimatePresence initial={false}>
        {pref === "card" && expanded && !isCompleted && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 rounded-xl border border-token bg-surface-alt p-3">
              {loading && (
                <div className="grid gap-2">
                  <div className="h-4 w-1/3 animate-pulse rounded border border-token bg-card" />
                  <div className="h-10 w-full animate-pulse rounded border border-token bg-card" />
                </div>
              )}

              {err && (
                <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                  {err}
                </div>
              )}

              {!loading && !err && detail && (
                <>
                  {(detail.task.description || detail.template?.summary) && (
                    <p className="text-sm">
                      {detail.task.description ?? detail.template?.summary}
                    </p>
                  )}

                  {Array.isArray(detail.content?.steps) &&
                    detail.content.steps.length > 0 && (
                      <div>
                        <div className="mb-1 text-sm font-semibold">
                          Steps
                        </div>
                        <ol className="list-inside list-decimal space-y-1 text-sm">
                          {detail.content.steps.map((s: any, i: number) => (
                            <li key={i}>
                              {typeof s === "string"
                                ? s
                                : s?.title || s?.body || "Step"}
                              {s?.mediaUrl && (
                                <a
                                  className="ml-2 text-primary underline"
                                  href={s.mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  View
                                </a>
                              )}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ---------- helpers ---------- */

function computeDueInfo(iso?: string | null) {
  if (!iso)
    return {
      className: "bg-surface-alt text-muted border-token",
      label: "No date",
      date: "",
    };
  const d = new Date(iso);
  const date = d.toLocaleDateString();

  const due = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const nowD = new Date();
  const now = Date.UTC(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
  const days = Math.round((due - now) / (24 * 60 * 60 * 1000));

  if (days < 0) {
    return {
      className: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Overdue",
      date,
    };
  }
  if (days <= 7) {
    return {
      className: "bg-amber-50 text-amber-800 border-amber-200",
      label: "Due soon",
      date,
    };
  }
  return {
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
    label: "On track",
    date,
  };
}

/* ---------- More menu (Snooze / Skip / Open) ---------- */

function TaskMoreMenu({
  disabled,
  onSnooze,
  onSkip,
  onOpenFull,
}: {
  disabled?: boolean;
  onSnooze: (days: number) => void;
  onSkip: () => void;
  onOpenFull: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: globalThis.MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) {
        const menu = document.getElementById("task-more-pop");
        if (menu && !menu.contains(target)) setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative inline-block">
      <Button
        size="sm"
        variant="ghost"
        ref={btnRef as any}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        className="h-8 px-2 text-muted"
        title="More options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="task-more-pop"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 4 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-20 mt-1 min-w-[190px] rounded-md border bg-popover shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onSnooze(3);
                setOpen(false);
              }}
            >
              <Clock4 className="h-4 w-4" />
              Snooze 3 days
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onSnooze(7);
                setOpen(false);
              }}
            >
              <Clock4 className="h-4 w-4" />
              Snooze 7 days
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                const v = prompt("Snooze how many days?", "14");
                const d =
                  Math.max(1, parseInt(String(v || "14"), 10) || 14) || 14;
                onSnooze(d);
                setOpen(false);
              }}
            >
              <Clock4 className="h-4 w-4" />
              Custom snooze…
            </button>

            <div className="mx-2 my-1 h-px bg-border" />

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onSkip();
                setOpen(false);
              }}
            >
              <CornerDownRight className="h-4 w-4" />
              Skip this occurrence
            </button>

            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onOpenFull();
                setOpen(false);
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Open full page
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
