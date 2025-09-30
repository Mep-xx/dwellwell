// dwellwell-client/src/pages/TaskDetailPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type DetailResponse = {
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: 'PENDING'|'COMPLETED'|'SKIPPED';
    dueDate?: string | null;
    completedDate?: string | null;
    estimatedTimeMinutes?: number | null;
    estimatedCost?: number | null;
    criticality?: 'low'|'medium'|'high';
    recurrenceInterval?: string | null;
    canDefer?: boolean | null;
    deferLimitDays?: number | null;
    canBeOutsourced?: boolean | null;
    category?: string | null;
    imageUrl?: string | null;
    icon?: string | null;
  };
  context: {
    room?: { id: string; name: string; homeId: string } | null;
    trackable?: {
      id: string;
      userDefinedName?: string | null;
      brand?: string | null;
      model?: string | null;
      roomId?: string | null;
      homeId?: string | null;
    } | null;
  };
  template: {
    id: string;
    title: string;
    summary?: string | null;
    version: number;
    state: 'DRAFT'|'VERIFIED';
    estimatedTimeMinutes?: number | null;
    estimatedCost?: number | null;
    imageUrl?: string | null;
    icon?: string | null;
    category?: string | null;
  } | null;
  content: {
    steps: any[];              // strings or { title/body/mediaUrl }
    equipmentNeeded: any[];    // strings
    resources: { label?: string; url?: string; type?: string }[];
    parts: { label?: string; url?: string; type?: string }[];
  };
};

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] ?? null;
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    // handle /shorts/{id}, /embed/{id}, /live/{id}
    const m = u.pathname.match(/\/(shorts|embed|live)\/([^/?#]+)/i);
    if (m?.[2]) return m[2];
    return null;
  } catch {
    return null;
  }
}

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await fetch(`/api/tasks/${taskId}`);
      if (r.status === 404) {
        setLoading(false);
        return;
      }
      const d = (await r.json()) as DetailResponse;
      setData(d);
      setLoading(false);
    })();
  }, [taskId]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (!data) return <div className="p-8">Task not found.</div>;

  const { task, content, context, template } = data;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={() => nav(-1)} className="text-sm text-slate-600 hover:underline">
            ← Back
          </button>
          <h1 className="text-2xl font-semibold mt-1">{task.title}</h1>
          <p className="text-slate-600 text-sm">
            {task.estimatedTimeMinutes ?? template?.estimatedTimeMinutes ?? '—'}m
            {task.dueDate && <> • due {new Date(task.dueDate).toLocaleDateString()}</>}
            {task.category && <> • {task.category}</>}
            {context.room && <> • {context.room.name}</>}
            {context.trackable?.userDefinedName && <> • {context.trackable.userDefinedName}</>}
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <RunnerButton path="complete" label="Complete" variant="primary" taskId={task.id}/>
          <RunnerButton path="snooze" label="Snooze 7d" body={{ days: 7 }} taskId={task.id}/>
        </div>
      </div>

      {/* Body */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steps */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium mb-3">Steps</h2>
          <ol className="space-y-3">
            {content.steps.length === 0 && (
              <li className="rounded-2xl border p-4 text-sm text-slate-600">
                No steps available yet.
              </li>
            )}
            {content.steps.map((s, idx) => (
              <li key={idx} className="rounded-2xl border p-4">
                {typeof s === 'string' ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 h-4 w-4 rounded border border-slate-300" />
                    <div>{s}</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-4 w-4 rounded border border-slate-300" />
                      <div className="font-medium">{s.title ?? `Step ${idx + 1}`}</div>
                    </div>
                    {s.body && <p className="text-sm text-slate-600 ml-7">{s.body}</p>}
                    {s.mediaUrl && (
                      <img src={s.mediaUrl} alt="" className="ml-7 rounded-lg max-h-56 object-cover" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Parts */}
          {content.parts.length > 0 && (
            <section className="rounded-2xl border p-4">
              <h3 className="font-medium mb-3">Parts & Items</h3>
              <ul className="space-y-2">
                {content.parts.map((p, i) => (
                  <li key={i} className="flex items-center justify-between gap-3">
                    <div className="min-w-0 truncate">{p.label ?? p.url}</div>
                    <a
                      className="px-3 py-1 rounded-lg bg-orange-600 text-white"
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Buy
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Equipment */}
          {content.equipmentNeeded.length > 0 && (
            <section className="rounded-2xl border p-4">
              <h3 className="font-medium mb-3">You’ll Need</h3>
              <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                {content.equipmentNeeded.map((e, i) => (
                  <li key={i}>{typeof e === 'string' ? e : JSON.stringify(e)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Resources */}
          {content.resources.length > 0 && (
            <section className="rounded-2xl border p-4 space-y-3">
              <h3 className="font-medium">Resources</h3>
              {content.resources.map((r, i) => {
                const isYoutube = r.type?.toLowerCase() === 'youtube' || (r.url && /youtube\.com|youtu\.be/.test(r.url));
                const isPdf = r.type?.toLowerCase() === 'pdf' || (r.url && /\.pdf($|\?)/i.test(r.url ?? ''));

                if (isYoutube && r.url) {
                  const id = extractYouTubeId(r.url);
                  return (
                    <div key={i} className="space-y-1">
                      <div className="text-sm font-medium">{r.label ?? 'Video'}</div>
                      {id ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${id}`}
                            title={r.label ?? 'YouTube video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a className="text-blue-700 underline" href={r.url} target="_blank" rel="noreferrer">
                          Open video
                        </a>
                      )}
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <a key={i} href={r.url} target="_blank" rel="noreferrer"
                       className="text-blue-700 underline">
                      {r.label ?? 'Owner’s Manual (PDF)'}
                    </a>
                  );
                }

                return (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer"
                     className="text-blue-700 underline">
                    {r.label ?? r.url}
                  </a>
                );
              })}
            </section>
          )}
        </aside>
      </div>

      {/* Mobile footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 bg-card/85 backdrop-blur border-t p-3 flex md:hidden gap-2">
        <RunnerButton path="complete" label="Complete" variant="primary" taskId={task.id}/>
        <RunnerButton path="snooze" label="Snooze 7d" body={{ days: 7 }} taskId={task.id}/>
      </div>
    </div>
  );
}

function RunnerButton({
  taskId, path, label, body, variant
}: {
  taskId: string;
  path: 'complete' | 'snooze';
  label: string;
  body?: any;
  variant?: 'primary' | 'ghost';
}) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    await fetch(`/api/tasks/${taskId}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    setBusy(false);
    // lightweight feedback – page will be revisited via back navigation
  }
  return (
    <button
      onClick={go}
      disabled={busy}
      className={
        variant === 'primary'
          ? 'px-4 py-2 rounded-xl bg-emerald-600 text-white'
          : 'px-4 py-2 rounded-xl bg-slate-100'
      }
    >
      {busy ? '…' : label}
    </button>
  );
}
