//dwellwell-client/src/components/features/TaskDrawer.tsx
import { useEffect, useMemo, useState } from "react";
import { X, Clock, AlertTriangle, ExternalLink, Check, Pause, Play, ArchiveRestore, Archive, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTasksApi, type TaskDetail } from "@/hooks/useTasksApi";

type Props = {
  taskId?: string;
  open: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function TaskDrawer({ taskId, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { getDetail, complete, snooze, pause, resume, archive, unarchive } = useTasksApi();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!taskId || !open) return;
      setLoading(true); setErr(null);
      try {
        const d = await getDetail(taskId);
        if (!cancelled) setDetail(d);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load task");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
    // intentionally not depending on getDetail to avoid ref churn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, open]);

  const t = detail?.task;
  const ctx = detail?.context;
  const steps = detail?.content?.steps ?? [];
  const equipment = detail?.content?.equipmentNeeded ?? [];
  const resources = detail?.content?.resources ?? [];
  const parts = detail?.content?.parts ?? [];

  const headerIcon = t?.icon || detail?.template?.icon || "🧰";

  const isPaused = Boolean(t?.pausedAt);
  const isArchived = Boolean(t?.archivedAt);
  const isCompleted = t?.status === "COMPLETED";

  const titleSuffix = useMemo(() => {
    const bits: string[] = [];
    if (ctx?.room?.name) bits.push(ctx.room.name);
    if (ctx?.trackable?.userDefinedName) bits.push(ctx.trackable.userDefinedName);
    return bits.length ? ` • ${bits.join(" • ")}` : "";
  }, [ctx?.room?.name, ctx?.trackable?.userDefinedName]);

  const onDone = async () => {
    if (!taskId) return;
    try {
      await complete(taskId);
      toast({ title: "Completed", description: "Nice work!" });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not complete", variant: "destructive" });
    }
  };

  const onSnooze = async (days = 7) => {
    if (!taskId) return;
    try {
      await snooze(taskId, days);
      toast({ title: `Snoozed ${days} days` });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not snooze", variant: "destructive" });
    }
  };

  const onPause = async () => {
    if (!taskId) return;
    try {
      await pause(taskId);
      toast({ title: "Paused", description: "Task reminders paused." });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not pause", variant: "destructive" });
    }
  };

  const onResume = async () => {
    if (!taskId) return;
    try {
      await resume(taskId, "forward");
      toast({ title: "Resumed", description: "Scheduling resumes from today." });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not resume", variant: "destructive" });
    }
  };

  const onArchive = async () => {
    if (!taskId) return;
    try {
      await archive(taskId);
      toast({ title: "Archived" });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not archive", variant: "destructive" });
    }
  };

  const onUnarchive = async () => {
    if (!taskId) return;
    try {
      await unarchive(taskId, "forward");
      toast({ title: "Unarchived", description: "Task reactivated." });
      onOpenChange?.(false);
    } catch {
      toast({ title: "Could not unarchive", variant: "destructive" });
    }
  };

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => onOpenChange?.(false)}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 h-full w-full sm:w-[520px] md:w-[640px] bg-card border-l shadow-xl transition-transform
                    ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-2xl">{headerIcon}</div>
            <div className="min-w-0">
              <div className="font-semibold truncate">{t?.title || "Task"}</div>
              {!!t?.dueDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Due {new Date(t.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Your Button doesn’t support size="icon"; use sm + square paddings */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange?.(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {err && !loading && (
            <div className="rounded-lg border bg-red-50 text-red-700 p-3 text-sm">{err}</div>
          )}

          {!loading && !err && detail && (
            <>
              {/* Context badges */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {ctx?.room?.name && <span className="chip">{ctx.room.name}</span>}
                {ctx?.trackable?.userDefinedName && <span className="chip">{ctx.trackable.userDefinedName}</span>}
                {detail?.template?.title && <span className="chip">Template v{detail.template.version}</span>}
                {t?.criticality === "high" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> High importance
                  </span>
                )}
              </div>

              {/* Summary */}
              {(t?.description || detail?.template?.summary) && (
                <div className="prose prose-sm dark:prose-invert">
                  <p className="text-sm text-body">{t?.description ?? detail?.template?.summary}</p>
                </div>
              )}

              {/* Steps */}
              {steps.length > 0 && (
                <div className="rounded-xl border bg-surface-alt p-3">
                  <div className="text-sm font-semibold mb-1">Steps{titleSuffix}</div>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    {steps.map((s: any, i: number) => (
                      <li key={i}>
                        {typeof s === "string" ? s : (s?.title || s?.body || "Step")}
                        {s?.mediaUrl ? (
                          <a
                            className="ml-2 text-primary underline inline-flex items-center gap-1"
                            href={s.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Equipment */}
              {equipment.length > 0 && (
                <div className="rounded-xl border bg-surface-alt p-3">
                  <div className="text-sm font-semibold mb-1">You’ll Need</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {equipment.map((e: any, i: number) => <li key={i}>{typeof e === "string" ? e : (e?.label || "Item")}</li>)}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {resources.length > 0 && (
                <div className="rounded-xl border bg-surface-alt p-3">
                  <div className="text-sm font-semibold mb-1">Helpful Links</div>
                  <ul className="space-y-1">
                    {resources.map((r: any, i: number) => {
                      const label = r?.label || r?.name || r?.url || "Link";
                      return (
                        <li key={i} className="text-sm">
                          <a className="text-primary underline inline-flex items-center gap-1" href={r?.url} target="_blank" rel="noopener noreferrer">
                            {label} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Parts */}
              {parts.length > 0 && (
                <div className="rounded-xl border bg-surface-alt p-3">
                  <div className="text-sm font-semibold mb-1">Parts</div>
                  <ul className="space-y-1">
                    {parts.map((p: any, i: number) => {
                      const label = p?.label || p?.name || p?.url || "Buy";
                      return (
                        <li key={i} className="text-sm">
                          <a className="text-primary underline inline-flex items-center gap-1" href={p?.url} target="_blank" rel="noopener noreferrer">
                            {label} <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 border-t bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={onDone} disabled={isCompleted}>
                <Check className="h-4 w-4 mr-1.5" /> Mark Complete
              </Button>

              <Button size="sm" variant="secondary" onClick={() => onSnooze(3)}>Snooze 3d</Button>
              <Button size="sm" variant="secondary" onClick={() => onSnooze(7)}>Snooze 7d</Button>

              {!isPaused && !isArchived && (
                <Button size="sm" variant="outline" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-1" /> Pause
                </Button>
              )}
              {isPaused && !isArchived && (
                <Button size="sm" variant="outline" onClick={onResume}>
                  <Play className="h-4 w-4 mr-1" /> Resume
                </Button>
              )}

              {!isArchived ? (
                <Button size="sm" variant="outline" onClick={onArchive}>
                  <Archive className="h-4 w-4 mr-1" /> Archive
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onUnarchive}>
                  <ArchiveRestore className="h-4 w-4 mr-1" /> Unarchive
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (!taskId) return;
                  const path = `/app/tasks/${encodeURIComponent(taskId)}`;
                  window.open(path, "_blank", "noopener,noreferrer");
                }}
                title="Open full page"
              >
                <Share2 className="h-4 w-4 mr-1" /> Open page
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onOpenChange?.(false)}>Close</Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* Small utility “chip” class — if not already defined globally */
declare global {
  interface HTMLElementTagNameMap {}
}
