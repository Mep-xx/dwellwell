// dwellwell-client/src/components/features/TaskCard.tsx
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

type DueState = "none" | "overdue" | "soon" | "ok";

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

  // Close inline expansion if user prefers the drawer
  useEffect(() => {
    if (pref === "drawer" && expanded) setExpanded(false);
  }, [pref, expanded]);

  // Lazy-load details when expanded in card mode
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

  const tone = useMemo(() => {
    switch (dueInfo.state) {
      case "overdue":
        return {
          cardBorder: "border-rose-200",
          headerBand: "bg-rose-50",
          dueText: "text-rose-700",
        };
      case "soon":
        return {
          cardBorder: "border-amber-200",
          headerBand: "bg-amber-50",
          dueText: "text-amber-800",
        };
      case "ok":
        return {
          cardBorder: "border-emerald-200",
          headerBand: "bg-emerald-50",
          dueText: "text-emerald-800",
        };
      default:
        return {
          cardBorder: "border-token",
          headerBand: "",
          dueText: "text-muted",
        };
    }
  }, [dueInfo.state]);

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

  async function handleSkip(e: ReactMouseEvent) {
    stop(e);
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={[
        "relative self-start rounded-xl bg-card text-body shadow-sm hover:shadow-md transition-shadow",
        "border", // base border
        tone.cardBorder, // tone-specific border color
        density === "compact" ? "p-3" : "p-4",
      ].join(" ")}
    >
      {/* subtle top band for due status */}
      {tone.headerBand && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-2 rounded-t-xl ${tone.headerBand}`}
        />
      )}

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
                    <span className="font-medium text-[11px] uppercase tracking-wide">
                      Where:&nbsp;
                    </span>
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

            {/* Meta row: due (subtle) + category chip(s) */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
              {dueInfo.state === "none" ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>No date</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span className={tone.dueText}>{dueInfo.label}</span>
                  <span className="opacity-80">• {dueInfo.date}</span>
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
      <div className="mt-2 flex flex-wrap items-center gap-2 opacity-90 group-hover:opacity-100">
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

            <SnoozeMenu
              onSnooze={handleSnooze}
              triggerClassName="h-8 px-3 text-xs text-muted border-dashed bg-transparent"
            />

            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              className="h-8 px-3 text-xs text-muted"
              title="Skip this occurrence"
              disabled={busy}
            >
              <CornerDownRight className="mr-1 h-4 w-4 -ml-0.5" />
              Skip
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-muted"
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  `/app/tasks/${encodeURIComponent(t.id)}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              title="Open full page"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
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

function computeDueInfo(iso?: string | null): {
  state: DueState;
  label: string;
  date: string;
} {
  if (!iso)
    return {
      state: "none",
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
      state: "overdue",
      label: "Overdue",
      date,
    };
  }
  if (days <= 7) {
    return {
      state: "soon",
      label: "Due soon",
      date,
    };
  }
  return {
    state: "ok",
    label: "On track",
    date,
  };
}

/* Snooze dropdown */
function SnoozeMenu({
  onSnooze,
  triggerClassName = "",
}: {
  onSnooze: (days: number) => void;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: globalThis.MouseEvent) => {
      if (!open) return;
      const target = e.target as Node;
      if (btnRef.current && !btnRef.current.contains(target)) {
        const menu = document.getElementById("task-snooze-pop");
        if (menu && !menu.contains(target)) setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative inline-block z-10">
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={triggerClassName}
        ref={btnRef as any}
        title="Snooze"
      >
        <Clock4 className="mr-1 h-4 w-4 -ml-0.5" />
        Snooze
        <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="task-snooze-pop"
            initial={{ opacity: 0, scale: 0.98, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 4 }}
            exit={{ opacity: 0, scale: 0.98, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1 min-w-[160px] rounded-md border bg-popover shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onSnooze(3);
                setOpen(false);
              }}
            >
              3 days
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                onSnooze(7);
                setOpen(false);
              }}
            >
              7 days
            </button>
            <div className="mx-2 h-px bg-border" />
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-surface-alt"
              onClick={() => {
                const v = prompt("Snooze how many days?", "14");
                const d =
                  Math.max(1, parseInt(String(v || "14"), 10) || 14) || 14;
                onSnooze(d);
                setOpen(false);
              }}
            >
              Custom…
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
