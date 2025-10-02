// dwellwell-client/src/components/features/TaskCardExpandable.tsx
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasksApi, type TaskListItem, type TaskDetail } from "@/hooks/useTasksApi";

type Props = {
  t: TaskListItem;
  /** Start open on mount (used by expand-in-place) */
  initiallyOpen?: boolean;
  /** Show the header row that duplicates the task title */
  showHeader?: boolean;
};

export default function TaskCardExpandable({ t, initiallyOpen = false, showHeader = true }: Props) {
  const { getDetail, complete, snooze } = useTasksApi();
  const [open, setOpen] = useState<boolean>(initiallyOpen);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // If parent flips us to initiallyOpen after mount (rare), honor it.
  useEffect(() => {
    if (initiallyOpen) setOpen(true);
  }, [initiallyOpen]);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const d = await getDetail(t.id);
        if (!cancel) setDetail(d);
      } catch (e:any) {
        if (!cancel) setErr(e?.message || "Failed to load task");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [open, t.id, getDetail]);

  const steps = detail?.content?.steps ?? [];

  return (
    <div className="surface-card-sm p-3 shadow-sm">
      {showHeader && (
        <button className="w-full text-left" onClick={() => setOpen(v => !v)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{t.icon || "🧰"}</span>
                <div className="font-medium truncate text-body">{t.title}</div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-xs">
                {t.roomName && <span className="chip-neutral">{t.roomName}</span>}
                {t.itemName && <span className="chip-neutral">{t.itemName}</span>}
                {t.category && <span className="chip-neutral">{t.category}</span>}
              </div>
            </div>
            <div className="text-xs text-muted shrink-0 mt-0.5">
              {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ""}
            </div>
          </div>
        </button>
      )}

      {open && (
        <div className={`${showHeader ? "mt-3 border-t pt-3" : ""} space-y-3`}>
          {loading && <div className="text-sm text-muted">Loading…</div>}
          {err && <div className="text-sm text-red-700 bg-red-50 border p-2 rd-sm">{err}</div>}
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
                          <a className="ml-2 text-primary underline inline-flex items-center gap-1"
                             href={s.mediaUrl} target="_blank" rel="noopener noreferrer">
                            View <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => complete(t.id)}>Mark Complete</Button>
                <Button size="sm" variant="secondary" onClick={() => snooze(t.id, 3)}>Snooze 3d</Button>
                <Button size="sm" variant="secondary" onClick={() => snooze(t.id, 7)}>Snooze 7d</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
