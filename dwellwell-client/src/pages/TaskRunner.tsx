// dwellwell-client/src/pages/TaskRunner.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTasksApi, type TaskDetail } from "@/hooks/useTasksApi";

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const { toast } = useToast();
  const { getDetail, complete } = useTasksApi();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<TaskDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!taskId) return;
      setLoading(true); setErr(null);
      try {
        const d = await getDetail(taskId);
        if (!cancelled) setDetail(d);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load task");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId, getDetail]);

  if (!taskId) return <div className="p-6">Missing task id.</div>;

  const t = detail?.task;
  const steps = detail?.content?.steps ?? [];
  const resources = detail?.content?.resources ?? [];

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">{t?.title || "Task"}</h1>
        <Button onClick={async () => {
          try { await complete(taskId); toast({ title: "Completed" }); }
          catch { toast({ title: "Could not complete", variant: "destructive" }); }
        }}>Mark Complete</Button>
      </div>

      {loading && <div className="rounded-2xl border bg-card p-4">Loading…</div>}
      {err && !loading && <div className="rounded-2xl border bg-red-50 text-red-700 p-4">{err}</div>}

      {!loading && !err && detail && (
        <div className="space-y-6">
          {(t?.description || detail?.template?.summary) && (
            <div className="prose prose-sm dark:prose-invert">
              <p>{t?.description ?? detail?.template?.summary}</p>
            </div>
          )}

          {steps.length > 0 && (
            <section className="rounded-2xl border bg-card p-4">
              <div className="font-semibold mb-2">Steps</div>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {steps.map((s: any, i: number) => (
                  <li key={i}>
                    {typeof s === "string" ? s : (s?.title || s?.body || "Step")}
                    {s?.mediaUrl ? (
                      <a className="ml-2 text-primary underline inline-flex items-center gap-1" href={s.mediaUrl} target="_blank" rel="noopener noreferrer">
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {resources.length > 0 && (
            <section className="rounded-2xl border bg-card p-4">
              <div className="font-semibold mb-2">Helpful Links</div>
              <ul className="space-y-1 text-sm">
                {resources.map((r: any, i: number) => (
                  <li key={i}>
                    <a className="text-primary underline inline-flex items-center gap-1" href={r?.url} target="_blank" rel="noopener noreferrer">
                      {r?.label || r?.name || r?.url || "Link"} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="pt-2">
            <Link to="/app" className="text-primary underline">Back to Dashboard</Link>
          </div>
        </div>
      )}
    </div>
  );
}
