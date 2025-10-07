import { useEffect, useMemo, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, CheckCircle2, Clock4, ChevronDown, ChevronUp,
  CornerDownRight, ExternalLink, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem, type TaskDetail } from "@/hooks/useTasksApi";
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
  const [completedAt, setCompletedAt] = useState<string | null>(t.completedAt ?? null);

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [celebrate, setCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pref === "drawer" && expanded) setExpanded(false);
  }, [pref, expanded]);

  useEffect(() => {
    if (!expanded || pref !== "card") return;
    let cancelled = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const d = await getDetail(t.id);
        if (!cancelled) setDetail(d);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load task");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [expanded, pref, t.id, getDetail]);

  const steps = detail?.content?.steps ?? [];
  const due = useMemo(
    () => (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : undefined),
    [t.dueDate]
  );

  const isCompleted = status === "COMPLETED";
  const cardDim = isCompleted ? "opacity-80" : "";

  function onHeaderClick() {
    if (pref === "drawer") onOpenDrawer?.(t.id);
    else setExpanded((v) => !v);
  }
  function stop(e: ReactMouseEvent) { e.stopPropagation(); }

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
      setTimeout(() => setCelebrate(false), 900);
      setExpanded(false);
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
      await skip(t.id); // server should mark this occurrence as skipped / move forward
      setStatus("SKIPPED");
      setExpanded(false);
    } finally {
      setBusy(false);
    }
  }

  const showThumb = Boolean(detail?.task?.imageUrl || detail?.template?.imageUrl || t.trackableId);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={`relative self-start rounded-xl border border-token bg-card text-body ${density === "compact" ? "p-3" : "p-4"} shadow transition-all hover:shadow-lg hover:-translate-y-0.5 ${cardDim}`}
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

      <button type="button" className="w-full text-left" onClick={onHeaderClick} aria-label={`Open ${t.title}`}>
        <div className="flex items-start">
          <h3 className={`${density === "compact" ? "text-base" : "text-lg"} font-semibold leading-tight truncate pr-3`}>
            <span className="text-xl leading-none">{t.icon || "🧰"}</span>
            <span className={`truncate ${isCompleted ? "line-through decoration-1 decoration-muted-foreground/60" : ""}`}>
              {t.title}
            </span>
          </h3>
          <div className="ml-auto flex items-center gap-2">
            {due && status !== "COMPLETED" && (
              <span className="text-xs px-2 py-0.5 rounded border border-token text-body bg-surface-alt/60 inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {due}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusPill(status)}`}>
              {statusLabel(status, completedAt)}
            </span>
          </div>
        </div>

        <div className="mt-2 text-sm text-muted">
          <span>
            {t.roomName ? `Room: ${t.roomName}` : ""}
            {t.roomName && t.itemName ? " • " : ""}
            {t.itemName ? t.itemName : ""}
          </span>
          {t.estimatedTimeMinutes ? (
            <span>{(t.roomName || t.itemName) ? " • " : ""}{t.estimatedTimeMinutes}m</span>
          ) : null}
        </div>
      </button>

      <div className={`h-[2px] bg-surface-alt rounded ${density === "compact" ? "mt-2" : "mt-3"}`} />

      <div className="mt-3 flex items-center gap-3">
        {showThumb && (
          <div className={`shrink-0 ${density === "compact" ? "w-12 h-12" : "w-14 h-14"} rounded-xl bg-surface-alt flex items-center justify-center overflow-hidden border border-token`}>
            {detail?.task?.imageUrl || detail?.template?.imageUrl ? (
              <img src={(detail?.task?.imageUrl || detail?.template?.imageUrl) as string} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">{t.icon || "🧰"}</span>
            )}
          </div>
        )}

        <div className="flex-1">
          {!isCompleted ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={handleComplete} className={`h-8 ${density === "compact" ? "px-2" : "px-3"}`} title="Mark Complete" disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-1 -ml-0.5" />
                Complete
              </Button>

              <SnoozeMenu onSnooze={(d) => snooze(t.id, d)} triggerClassName="h-8 px-3" />

              <Button size="sm" variant="outline" onClick={handleSkip} className={`h-8 ${density === "compact" ? "px-2" : "px-3"}`} title="Skip this occurrence">
                <CornerDownRight className="h-4 w-4 mr-1 -ml-0.5" />
                Skip
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className={`h-8 ${density === "compact" ? "px-2" : "px-3"}`}
                onClick={(e) => { e.stopPropagation(); window.open(`/app/tasks/${encodeURIComponent(t.id)}`, "_blank", "noopener,noreferrer"); }}
                title="Open full page"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleUndo} className={`h-8 ${density === "compact" ? "px-2" : "px-3"}`} title="Mark as not complete" disabled={busy}>
                <RotateCcw className="h-4 w-4 mr-1 -ml-0.5" />
                Undo
              </Button>

              <Button
                size="sm"
                variant="ghost"
                className={`h-8 ${density === "compact" ? "px-2" : "px-3"}`}
                onClick={(e) => { e.stopPropagation(); window.open(`/app/tasks/${encodeURIComponent(t.id)}`, "_blank", "noopener,noreferrer"); }}
                title="Open full page"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}

          {density === "cozy" && t.category && <p className="mt-1 text-xs text-muted truncate">{t.category}</p>}
        </div>
      </div>

      {pref === "card" && !isCompleted && density === "cozy" && (
        <div className="mt-3">
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-[rgb(var(--primary))] rounded-full flex items-center gap-2 text-sm font-medium transition-colors"
            title={expanded ? "Hide Details" : "Show Details"}
          >
            {expanded ? "Hide Details" : "Show Details"}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {pref === "card" && expanded && !isCompleted && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-xl border border-token bg-surface-alt p-3 space-y-3">
              {loading && (
                <div className="grid gap-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-card border border-token" />
                  <div className="h-10 w-full animate-pulse rounded bg-card border border-token" />
                </div>
              )}

              {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}

              {!loading && !err && detail && (
                <>
                  {(detail.task.description || detail.template?.summary) && (
                    <p className="text-sm">{detail.task.description ?? detail.template?.summary}</p>
                  )}

                  {steps.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Steps</div>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        {steps.map((s: any, i: number) => (
                          <li key={i}>
                            {typeof s === "string" ? s : (s?.title || s?.body || "Step")}
                            {s?.mediaUrl && (
                              <a className="ml-2 text-primary underline" href={s.mediaUrl} target="_blank" rel="noopener noreferrer">
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

/* helpers */

function statusLabel(s: TaskListItem["status"], completedAt?: string | null) {
  if (s === "COMPLETED") {
    const d = completedAt ? new Date(completedAt).toLocaleDateString() : "";
    return d ? `Completed • ${d}` : "Completed";
  }
  if (s === "SKIPPED") return "Skipped";
  return "Pending";
}
function statusPill(s: TaskListItem["status"]) {
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-700";
  if (s === "SKIPPED") return "bg-slate-200 text-slate-700";
  return "bg-surface-alt text-gray-700";
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
    // Use DOM MouseEvent, not React's
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
    <div className="relative inline-block">
      <Button
        size="sm"
        variant="secondary"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={triggerClassName}
        ref={btnRef as any}
        title="Snooze"
      >
        <Clock4 className="h-4 w-4 mr-1 -ml-0.5" />
        Snooze
        <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
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
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-surface-alt" onClick={() => { onSnooze(3); setOpen(false); }}>
              3 days
            </button>
            <button className="w-full text-left px-3 py-2 text-sm hover:bg-surface-alt" onClick={() => { onSnooze(7); setOpen(false); }}>
              7 days
            </button>
            <div className="h-px bg-border mx-2" />
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-surface-alt"
              onClick={() => {
                const v = prompt("Snooze how many days?", "14");
                const d = Math.max(1, parseInt(String(v || "14"), 10) || 14);
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
